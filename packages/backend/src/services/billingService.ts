import { eq, and, lt } from 'drizzle-orm';
import { users, subscriptions, emailLogs, NewSubscription, NewEmailLog } from '../db/schema';
import { logger } from '../lib/logger';
import { generateId, createDatabaseClient } from '../db/client';

// Stripe webhook event types (simplified to avoid external dependency)
interface StripeWebhookEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: {
    object: any;
  };
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  metadata: Record<string, string>;
  items: {
    data: Array<{
      price: {
        id: string;
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  subscription?: string;
  amount_paid: number;
  attempt_count: number;
}

interface StripeCustomer {
  id: string;
  email: string;
  deleted?: boolean;
}

export interface BillingEnv {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: string;
  STRIPE_WEBHOOK_SECRET_PAYMENT: string;
  STRIPE_BASIC_PAYMENT_LINK: string;
  STRIPE_PRO_PAYMENT_LINK: string;
  KV_CONTENT: KVNamespace;
  KV_METRICS: KVNamespace;
  RESEND_API_KEY: string;
}

// Webhook processing result interface
interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  processed: boolean;
  error?: string;
}

export class BillingService {
  private env: BillingEnv;

  constructor(env: BillingEnv) {
    this.env = env;
  }

  /**
   * Get payment link configuration from environment variables
   */
  getPaymentLinks() {
    return {
      basic: {
        name: "Astropal Basic",
        description: "Daily horoscope + evening reflection",
        price: 799, // $7.99 in cents
        interval: "month",
        paymentLink: this.env.STRIPE_BASIC_PAYMENT_LINK,
        features: [
          "2 personalized emails daily",
          "Weekly cosmic weather",
          "Monthly forecast"
        ]
      },
      pro: {
        name: "Astropal Pro", 
        description: "Complete cosmic guidance",
        price: 1499, // $14.99 in cents
        interval: "month", 
        paymentLink: this.env.STRIPE_PRO_PAYMENT_LINK,
        features: [
          "3 personalized emails daily",
          "News analysis with cosmic interpretation",
          "Advanced astrological insights",
          "Priority support"
        ]
      }
    } as const;
  }

  /**
   * Process Stripe webhook events with signature verification and idempotency
   */
  async processWebhook(request: Request, webhookType: 'subscription' | 'payment' = 'subscription'): Promise<Response> {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    if (!signature) {
      logger.error('Missing Stripe signature', { 
        webhookType,
        component: 'billing-webhook' 
      });
      return new Response('Missing signature', { status: 400 });
    }

    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(body, signature, webhookType);
      if (!isValid) {
        logger.error('Invalid webhook signature', {
          webhookType,
          signature: signature.slice(0, 8),
          component: 'billing-webhook'
        });
        return new Response('Invalid signature', { status: 400 });
      }

      const event = JSON.parse(body) as StripeWebhookEvent;

      logger.info('Stripe webhook received', {
        type: event.type,
        eventId: event.id,
        livemode: event.livemode,
        webhookType,
        component: 'billing-webhook'
      });

      // Check for duplicate events (idempotency)
      const alreadyProcessed = await this.checkEventIdempotency(event.id);
      if (alreadyProcessed) {
        logger.info('Webhook event already processed', {
          eventId: event.id,
          type: event.type,
          component: 'billing-webhook'
        });
        return new Response(JSON.stringify({ received: true, processed: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Process event in transaction
      const result = await this.processWebhookEventWithRetry(event);

      if (result.success) {
        // Mark event as processed
        await this.markEventProcessed(event.id, event.type);
        
        logger.info('Stripe webhook processed successfully', {
          type: event.type,
          eventId: event.id,
          webhookType,
          component: 'billing-webhook'
        });

        return new Response(JSON.stringify({ received: true, processed: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(result.error || 'Unknown processing error');
      }

    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        signature: signature?.slice(0, 8),
        webhookType,
        component: 'billing-webhook'
      });

      // Store failed event for retry
      await this.storeFailedWebhookEvent(body, error.message);

      return new Response('Webhook Error', { status: 400 });
    }
  }

  /**
   * Verify Stripe webhook signature using HMAC SHA256
   */
  private async verifyWebhookSignature(
    payload: string, 
    signature: string, 
    webhookType: 'subscription' | 'payment'
  ): Promise<boolean> {
    const secret = webhookType === 'subscription' 
      ? this.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION 
      : this.env.STRIPE_WEBHOOK_SECRET_PAYMENT;

    if (!secret) {
      logger.error('Missing webhook secret for type', { webhookType, component: 'billing-security' });
      return false;
    }

    try {
      const elements = signature.split(',');
      let timestamp = '';
      let signatures: string[] = [];

      for (const element of elements) {
        const [key, value] = element.split('=');
        if (key === 't') {
          timestamp = value;
        } else if (key === 'v1') {
          signatures.push(value);
        }
      }

      if (!timestamp || signatures.length === 0) {
        return false;
      }

      // Verify timestamp (protect against replay attacks)
      const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
      if (timestampAge > 300) { // 5 minutes tolerance
        logger.warn('Webhook timestamp too old', { 
          age: timestampAge,
          webhookType,
          component: 'billing-security' 
        });
        return false;
      }

      // Create expected signature
      const signedPayload = `${timestamp}.${payload}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const expectedSignature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signedPayload)
      );

      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Compare with provided signatures
      return signatures.some(sig => sig === expectedHex);

    } catch (error) {
      logger.error('Webhook signature verification failed', {
        error: error.message,
        webhookType,
        component: 'billing-security'
      });
      return false;
    }
  }

  /**
   * Check if webhook event has already been processed (idempotency)
   */
  private async checkEventIdempotency(eventId: string): Promise<boolean> {
    try {
      const existing = await this.env.DB.prepare(`
        SELECT id FROM webhook_events WHERE stripe_event_id = ?
      `).bind(eventId).first();
      
      return !!existing;
    } catch (error) {
      logger.error('Failed to check event idempotency', {
        eventId,
        error: error.message,
        component: 'billing-idempotency'
      });
      return false;
    }
  }

  /**
   * Mark webhook event as processed
   */
  private async markEventProcessed(eventId: string, eventType: string): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO webhook_events (id, stripe_event_id, event_type, processed_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        generateId(),
        eventId,
        eventType,
        new Date().toISOString()
      ).run();
    } catch (error) {
      logger.error('Failed to mark event as processed', {
        eventId,
        eventType,
        error: error.message,
        component: 'billing-idempotency'
      });
    }
  }

  /**
   * Process webhook event with retry logic
   */
  private async processWebhookEventWithRetry(event: StripeWebhookEvent, maxRetries: number = 3): Promise<WebhookProcessingResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.handleWebhookEvent(event);
        
        // Track successful processing
        await this.trackWebhookMetric('success', event.type, attempt);
        
        return {
          success: true,
          eventId: event.id,
          processed: true
        };
      } catch (error) {
        lastError = error;
        
        logger.warn('Webhook processing attempt failed', {
          eventId: event.id,
          attempt,
          maxRetries,
          error: error.message,
          component: 'billing-retry'
        });

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Track failed processing
    await this.trackWebhookMetric('failure', event.type, maxRetries);

    return {
      success: false,
      eventId: event.id,
      processed: false,
      error: lastError?.message || 'Unknown error after retries'
    };
  }

  /**
   * Track webhook processing metrics
   */
  private async trackWebhookMetric(result: 'success' | 'failure', eventType: string, attempts: number): Promise<void> {
    try {
      const metric = {
        timestamp: new Date().toISOString(),
        result,
        eventType,
        attempts,
        component: 'billing-webhook'
      };

      await this.env.KV_METRICS.put(
        `webhook_metric:${Date.now()}:${generateId()}`,
        JSON.stringify(metric),
        { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
      );
    } catch (error) {
      logger.error('Failed to track webhook metric', {
        error: error.message,
        component: 'billing-metrics'
      });
    }
  }

  /**
   * Store failed webhook event for later analysis
   */
  private async storeFailedWebhookEvent(payload: string, error: string): Promise<void> {
    try {
      const failedEvent = {
        timestamp: new Date().toISOString(),
        payload: payload.slice(0, 1000), // Truncate for storage
        error,
        component: 'billing-webhook'
      };

      await this.env.KV_METRICS.put(
        `failed_webhook:${Date.now()}:${generateId()}`,
        JSON.stringify(failedEvent),
        { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
      );
    } catch (error) {
      logger.error('Failed to store failed webhook event', {
        error: error.message,
        component: 'billing-storage'
      });
    }
  }

  /**
   * Handle individual webhook events
   */
  private async handleWebhookEvent(event: StripeWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event);
        break;

      default:
        logger.info('Unhandled webhook event', { 
          type: event.type,
          component: 'billing-webhook'
        });
    }
  }

  /**
   * Handle new subscription creation
   */
  private async handleSubscriptionCreated(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as StripeSubscription;
    
    try {
      await this.handleSubscriptionCreatedTransaction(subscription);

    } catch (error) {
      logger.error('Failed to handle subscription creation', {
        error: error.message,
        subscriptionId: subscription.id,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Handle subscription creation within transaction
   */
  private async handleSubscriptionCreatedTransaction(subscription: StripeSubscription): Promise<void> {
    // Fetch customer details from Stripe API since webhook doesn't include email
    const customer = await this.fetchStripeCustomer(subscription.customer);
    
    if (!customer || !customer.email) {
      logger.error('Could not fetch customer details from Stripe', {
        customerId: subscription.customer,
        subscriptionId: subscription.id,
        component: 'billing'
      });
      throw new Error('Could not fetch customer details from Stripe');
    }

    // Find user by email
    const user = await this.env.DB.prepare(`
      SELECT id, email, tier FROM users WHERE email = ?
    `).bind(customer.email).first() as { id: string; email: string; tier: string } | null;

    if (!user) {
      logger.error('User not found for subscription', {
        email: customer.email,
        subscriptionId: subscription.id,
        component: 'billing'
      });
      throw new Error(`User not found for email: ${customer.email}`);
    }

    // Determine tier from subscription (Basic or Pro based on price ID)
    const newTier = this.getSubscriptionTier(subscription);

    // Execute all operations atomically
    const statements = [
      this.env.DB.prepare(`
        UPDATE users 
        SET tier = ?, trial_end = NULL, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(newTier, user.id),

      this.env.DB.prepare(`
        INSERT INTO subscriptions (id, user_id, status, stripe_customer, stripe_subscription, current_period_end, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        generateId(),
        user.id,
        subscription.status,
        subscription.customer,
        subscription.id,
        new Date(subscription.current_period_end * 1000).toISOString()
      ),

      this.env.DB.prepare(`
        INSERT INTO email_logs (id, user_id, template, sent_at, status)
        VALUES (?, ?, 'upgrade_confirmation', CURRENT_TIMESTAMP, 'pending')
      `).bind(generateId(), user.id)
    ];

    await this.env.DB.batch(statements);

    logger.info('Subscription created and user upgraded', {
      userId: user.id,
      oldTier: user.tier,
      newTier,
      subscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      component: 'billing'
    });

    // Queue email notification (async, not part of transaction)
    await this.queueUpgradeNotification(user.id, newTier);
  }

  /**
   * Queue upgrade notification email
   */
  private async queueUpgradeNotification(userId: string, tier: string): Promise<void> {
    try {
      const notification = {
        userId,
        tier,
        timestamp: new Date().toISOString(),
        type: 'upgrade_confirmation'
      };

      await this.env.KV_CONTENT.put(
        `email_queue:upgrade:${userId}:${Date.now()}`,
        JSON.stringify(notification),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );

      logger.info('Upgrade notification queued', {
        userId,
        tier,
        component: 'billing-notifications'
      });
    } catch (error) {
      logger.error('Failed to queue upgrade notification', {
        userId,
        tier,
        error: error.message,
        component: 'billing-notifications'
      });
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as StripeSubscription;

    try {
      // Get the previous attributes to determine what changed
      const previousAttributes = (event.data as any).previous_attributes;
      
      // Update subscription record
      await this.env.DB.prepare(`
        UPDATE subscriptions 
        SET 
          status = ?,
          current_period_end = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription = ?
      `).bind(
        subscription.status,
        new Date(subscription.current_period_end * 1000).toISOString(),
        subscription.id
      ).run();

      // Get user for this subscription
      const subscriptionRecord = await this.env.DB.prepare(`
        SELECT user_id, status FROM subscriptions WHERE stripe_subscription = ?
      `).bind(subscription.id).first() as { user_id: string; status: string } | null;

      if (subscriptionRecord) {
        const newTier = this.getSubscriptionTier(subscription);

        // Get current user tier to detect changes
        const currentUser = await this.env.DB.prepare(`
          SELECT tier FROM users WHERE id = ?
        `).bind(subscriptionRecord.user_id).first() as { tier: string } | null;

        const oldTier = currentUser?.tier || 'free';

        // Update user tier
        await this.env.DB.prepare(`
          UPDATE users 
          SET tier = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(newTier, subscriptionRecord.user_id).run();

        // Determine the type of change
        let changeType = 'updated';
        if (oldTier !== newTier) {
          if (this.getTierLevel(newTier) > this.getTierLevel(oldTier)) {
            changeType = 'upgraded';
          } else if (this.getTierLevel(newTier) < this.getTierLevel(oldTier)) {
            changeType = 'downgraded';
          }
        }

        // Queue appropriate notification email
        if (changeType === 'upgraded') {
          await this.queueUpgradeNotification(subscriptionRecord.user_id, newTier);
        } else if (changeType === 'downgraded') {
          await this.queueDowngradeNotification(subscriptionRecord.user_id, newTier, oldTier);
        }

        logger.info('Subscription updated', {
          userId: subscriptionRecord.user_id,
          oldTier,
          newTier,
          changeType,
          subscriptionId: subscription.id,
          status: subscription.status,
          component: 'billing'
        });
      }

    } catch (error) {
      logger.error('Failed to handle subscription update', {
        error: error.message,
        subscriptionId: subscription.id,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Handle subscription deletion/cancellation
   */
  private async handleSubscriptionDeleted(event: StripeWebhookEvent): Promise<void> {
    const subscription = event.data.object as StripeSubscription;

    try {
      // Update subscription status
      await this.env.DB.prepare(`
        UPDATE subscriptions 
        SET 
          status = 'canceled',
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription = ?
      `).bind(subscription.id).run();

      // Get user and downgrade to free
      const subscriptionRecord = await this.env.DB.prepare(`
        SELECT user_id FROM subscriptions WHERE stripe_subscription = ?
      `).bind(subscription.id).first();

      if (subscriptionRecord) {
        await this.env.DB.prepare(`
          UPDATE users 
          SET tier = 'free', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(subscriptionRecord.user_id).run();

        logger.info('Subscription canceled, user downgraded to free', {
          userId: subscriptionRecord.user_id,
          subscriptionId: subscription.id,
          component: 'billing'
        });
      }

    } catch (error) {
      logger.error('Failed to handle subscription deletion', {
        error: error.message,
        subscriptionId: subscription.id,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(event: StripeWebhookEvent): Promise<void> {
    const invoice = event.data.object as StripeInvoice;

    try {
      if (invoice.subscription) {
        // Ensure subscription is active
        await this.env.DB.prepare(`
          UPDATE subscriptions 
          SET 
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription = ?
        `).bind(invoice.subscription).run();

        logger.info('Payment succeeded, subscription renewed', {
          subscriptionId: invoice.subscription,
          amount: invoice.amount_paid,
          component: 'billing'
        });
      }

    } catch (error) {
      logger.error('Failed to handle payment success', {
        error: error.message,
        invoiceId: invoice.id,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(event: StripeWebhookEvent): Promise<void> {
    const invoice = event.data.object as StripeInvoice;

    try {
      if (invoice.subscription) {
        // Update subscription status to past_due
        await this.env.DB.prepare(`
          UPDATE subscriptions 
          SET 
            status = 'past_due',
            updated_at = CURRENT_TIMESTAMP
          WHERE stripe_subscription = ?
        `).bind(invoice.subscription).run();

        // Get user for notification and potential downgrade
        const subscriptionRecord = await this.env.DB.prepare(`
          SELECT user_id, status FROM subscriptions WHERE stripe_subscription = ?
        `).bind(invoice.subscription).first() as { user_id: string; status: string } | null;

        if (subscriptionRecord) {
          // If this is the final attempt (attempt_count >= 4), downgrade to free
          if (invoice.attempt_count >= 4) {
            await this.downgradeUserToFree(subscriptionRecord.user_id, invoice.subscription);
            await this.queueRecoveryEmail(subscriptionRecord.user_id, 'final_attempt');
          } else {
            // Send recovery email based on attempt count
            const recoveryType = invoice.attempt_count === 1 ? 'first_attempt' : 
                               invoice.attempt_count === 2 ? 'second_attempt' : 'third_attempt';
            await this.queueRecoveryEmail(subscriptionRecord.user_id, recoveryType);
          }

          logger.warn('Payment failed, recovery process initiated', {
            userId: subscriptionRecord.user_id,
            invoiceId: invoice.id,
            attemptCount: invoice.attempt_count,
            finalAttempt: invoice.attempt_count >= 4,
            component: 'billing'
          });
        }
      }

    } catch (error) {
      logger.error('Failed to handle payment failure', {
        error: error.message,
        invoiceId: invoice.id,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Downgrade user to free tier due to payment failure
   */
  private async downgradeUserToFree(userId: string, subscriptionId: string): Promise<void> {
    try {
      const statements = [
        this.env.DB.prepare(`
          UPDATE users 
          SET tier = 'free', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(userId),

        this.env.DB.prepare(`
          UPDATE subscriptions 
          SET status = 'canceled', updated_at = CURRENT_TIMESTAMP 
          WHERE stripe_subscription = ?
        `).bind(subscriptionId),

        this.env.DB.prepare(`
          INSERT INTO email_logs (id, user_id, template, sent_at, status)
          VALUES (?, ?, 'downgrade_notification', CURRENT_TIMESTAMP, 'pending')
        `).bind(generateId(), userId)
      ];

      await this.env.DB.batch(statements);

      logger.info('User downgraded to free due to payment failure', {
        userId,
        subscriptionId,
        component: 'billing'
      });
    } catch (error) {
      logger.error('Failed to downgrade user to free', {
        userId,
        subscriptionId,
        error: error.message,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Queue recovery email for failed payment
   */
  private async queueRecoveryEmail(userId: string, recoveryType: string): Promise<void> {
    try {
      const notification = {
        userId,
        type: 'payment_recovery',
        recoveryType,
        timestamp: new Date().toISOString()
      };

      await this.env.KV_CONTENT.put(
        `email_queue:recovery:${userId}:${Date.now()}`,
        JSON.stringify(notification),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );

      logger.info('Recovery email queued', {
        userId,
        recoveryType,
        component: 'billing-recovery'
      });
    } catch (error) {
      logger.error('Failed to queue recovery email', {
        userId,
        recoveryType,
        error: error.message,
        component: 'billing-recovery'
      });
    }
  }

  /**
   * Determine tier from Stripe subscription based on price amount
   * Since we use checkout sessions, we determine tier by the subscription amount
   */
  private getSubscriptionTier(subscription: StripeSubscription): string {
    const priceId = subscription.items.data[0]?.price.id;
    
    // First try to map known price IDs (if you set these in Stripe)
    const tierMap: Record<string, string> = {
      'price_basic_monthly': 'basic',
      'price_pro_monthly': 'pro'
    };

    if (tierMap[priceId]) {
      return tierMap[priceId];
    }

    // Fallback: determine by price amount (this requires fetching price details)
    // For now, we'll use metadata or assume based on checkout session
    // You should set metadata in your Stripe checkout sessions like: { tier: 'basic' }
    const metadata = subscription.metadata;
    if (metadata && metadata.tier) {
      return metadata.tier;
    }

    // Final fallback - assume basic if we can't determine
    logger.warn('Could not determine subscription tier, defaulting to basic', {
      priceId,
      subscriptionId: subscription.id,
      component: 'billing'
    });
    
    return 'basic';
  }

  /**
   * Process expired trials - run via cron
   */
  async processExpiredTrials(): Promise<void> {
    try {
      const expiredTrials = await this.env.DB.prepare(`
        SELECT id, email, tier
        FROM users 
        WHERE tier = 'trial' 
        AND trial_end < datetime('now')
      `).all();

      logger.info('Processing expired trials', {
        count: expiredTrials.results.length,
        component: 'billing'
      });

      for (const user of expiredTrials.results) {
        // Downgrade to free tier
        await this.env.DB.prepare(`
          UPDATE users 
          SET tier = 'free', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(user.id).run();

        logger.info('Trial expired, user downgraded to free', {
          userId: user.id,
          component: 'billing'
        });
      }

    } catch (error) {
      logger.error('Failed to process expired trials', {
        error: error.message,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Send trial ending reminders with checkout links - run via cron
   * Sends reminder on day 6 of 7-day trial with Basic and Pro checkout options
   */
  async sendTrialEndingReminders(): Promise<void> {
    try {
      // Find users with trials ending in 1 day (day 6 of 7-day trial) who haven't been reminded
      const expiringTrials = await this.env.DB.prepare(`
        SELECT id, email, trial_end 
        FROM users 
        WHERE tier = 'trial' 
        AND trial_end BETWEEN datetime('now', '+1 day') AND datetime('now', '+1 day 12 hours')
        AND trial_reminder_sent = 0
      `).all();

      logger.info('Sending trial ending reminders with checkout options', {
        count: expiringTrials.results.length,
        component: 'billing'
      });

      for (const user of expiringTrials.results) {
        const userData = user as { id: string; email: string; trial_end: string };
        
        // Queue trial reminder email with both Basic and Pro options
        await this.queueTrialReminderEmail(userData.id);

        // Mark reminder as sent
        await this.env.DB.prepare(`
          UPDATE users 
          SET trial_reminder_sent = 1 
          WHERE id = ?
        `).bind(userData.id).run();

        logger.info('Trial ending reminder sent with checkout options', {
          userId: userData.id,
          trialEnd: userData.trial_end,
          component: 'billing'
        });
      }

    } catch (error) {
      logger.error('Failed to send trial ending reminders', {
        error: error.message,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Queue trial reminder email with Basic and Pro checkout links
   */
  private async queueTrialReminderEmail(userId: string): Promise<void> {
    try {
      const paymentLinks = this.getPaymentLinks();
      
      const notification = {
        userId,
        type: 'trial_ending',
        timestamp: new Date().toISOString(),
        paymentLinks: {
          basic: paymentLinks.basic.paymentLink,
          pro: paymentLinks.pro.paymentLink
        }
      };

      await this.env.KV_CONTENT.put(
        `email_queue:trial:${userId}:${Date.now()}`,
        JSON.stringify(notification),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );

      logger.info('Trial reminder email queued with checkout options', {
        userId,
        component: 'billing-trial'
      });
    } catch (error) {
      logger.error('Failed to queue trial reminder email', {
        userId,
        error: error.message,
        component: 'billing-trial'
      });
    }
  }

  /**
   * Send weekly upgrade reminders to free users - run via cron
   */
  async sendWeeklyUpgradeReminders(): Promise<void> {
    try {
      // Find free users who haven't received reminder in 7 days
      const freeUsers = await this.env.DB.prepare(`
        SELECT id, email, created_at
        FROM users 
        WHERE tier = 'free' 
        AND (last_upgrade_reminder IS NULL OR last_upgrade_reminder < datetime('now', '-7 days'))
        AND created_at < datetime('now', '-7 days')
      `).all();

      logger.info('Sending weekly upgrade reminders', {
        count: freeUsers.results.length,
        component: 'billing'
      });

      for (const user of freeUsers.results) {
        // Update last reminder timestamp
        await this.env.DB.prepare(`
          UPDATE users 
          SET last_upgrade_reminder = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).bind(user.id).run();

        logger.info('Weekly upgrade reminder sent', {
          userId: user.id,
          component: 'billing'
        });
      }

    } catch (error) {
      logger.error('Failed to send weekly upgrade reminders', {
        error: error.message,
        component: 'billing'
      });
      throw error;
    }
  }

  /**
   * Fetch customer details from Stripe API
   */
  private async fetchStripeCustomer(customerId: string): Promise<StripeCustomer | null> {
    try {
      const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${this.env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        logger.error('Failed to fetch Stripe customer', {
          customerId,
          status: response.status,
          component: 'stripe-api'
        });
        return null;
      }

      const customer = await response.json() as StripeCustomer;
      return customer;
    } catch (error) {
      logger.error('Error fetching Stripe customer', {
        customerId,
        error: error.message,
        component: 'stripe-api'
      });
      return null;
    }
  }

  /**
   * Get numeric tier level for comparison
   */
  private getTierLevel(tier: string): number {
    const levels = {
      'free': 0,
      'trial': 1,
      'basic': 2,
      'pro': 3
    };
    return levels[tier as keyof typeof levels] || 0;
  }

  /**
   * Queue downgrade notification email
   */
  private async queueDowngradeNotification(userId: string, newTier: string, oldTier: string): Promise<void> {
    try {
      const notification = {
        userId,
        type: 'downgrade_notification',
        newTier,
        oldTier,
        timestamp: new Date().toISOString()
      };

      await this.env.KV_CONTENT.put(
        `email_queue:downgrade:${userId}:${Date.now()}`,
        JSON.stringify(notification),
        { expirationTtl: 24 * 60 * 60 } // 24 hours
      );

      logger.info('Downgrade notification queued', {
        userId,
        newTier,
        oldTier,
        component: 'billing-notifications'
      });
    } catch (error) {
      logger.error('Failed to queue downgrade notification', {
        userId,
        newTier,
        oldTier,
        error: error.message,
        component: 'billing-notifications'
      });
    }
  }
}

export const billingService = {
  create: (env: BillingEnv) => new BillingService(env),
  
  // Static method for backward compatibility
  getPaymentLinks: (env: BillingEnv) => {
    const service = new BillingService(env);
    return service.getPaymentLinks();
  }
}; 