import { logger } from '@/lib/logger';
import { generateId, DatabaseClient } from '@/db/client';
import { emailLogs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface EmailTemplateData {
  [key: string]: string | number | boolean | object;
}

export interface EmailOptions {
  to: string;
  subject: string;
  templateType: 'welcome' | 'daily' | 'weekly' | 'monthly' | 'trial_ending';
  templateData: EmailTemplateData;
  userId?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId: string;
}

export class EmailError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

export class EmailService {
  private baseUrl = 'https://api.resend.com';
  
  constructor(
    private apiKey: string,
    private db: DatabaseClient,
    private fromEmail: string = 'cosmic@astropal.com',
    private fromName: string = 'Astropal'
  ) {}

  /**
   * Send email using Resend API
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const startTime = Date.now();
    const logId = generateId();
    
    try {
      logger.info('Sending email', {
        to: options.to,
        subject: options.subject,
        templateType: options.templateType,
        userId: options.userId,
        logId,
        component: 'email-service'
      });

      // Validate email address
      if (!this.isValidEmail(options.to)) {
        throw new EmailError('Invalid email address', 'INVALID_EMAIL');
      }

      // Check if user is unsubscribed
      if (options.userId) {
        const user = await this.db
          .select({ emailStatus: users.emailStatus })
          .from(users)
          .where(eq(users.id, options.userId))
          .limit(1);

        if (user.length > 0 && user[0].emailStatus !== 'active') {
          throw new EmailError(
            `User email status: ${user[0].emailStatus}`,
            'USER_UNSUBSCRIBED'
          );
        }
      }

      // Generate email content
      const { html, text } = await this.renderTemplate(
        options.templateType,
        options.templateData
      );

      // Prepare email payload
      const emailPayload = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html,
        text,
        headers: {
          'X-Entity-Ref-ID': logId,
          'X-Template-Type': options.templateType,
          'X-User-ID': options.userId || 'anonymous'
        },
        tags: [
          { name: 'template', value: options.templateType },
          { name: 'environment', value: 'production' }
        ]
      };

      // Send via Resend API
      const response = await this.callResendAPI('/emails', emailPayload);
      const duration = Date.now() - startTime;

      // Log successful send
      await this.logEmail({
        id: logId,
        userId: options.userId,
        templateType: options.templateType,
        subject: options.subject,
        status: 'sent',
        resendId: response.id
      });

      logger.info('Email sent successfully', {
        to: options.to,
        messageId: response.id,
        duration,
        logId,
        component: 'email-service'
      });

      return {
        success: true,
        messageId: response.id,
        logId
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof EmailError) {
        // Log known email error
        await this.logEmail({
          id: logId,
          userId: options.userId,
          templateType: options.templateType,
          subject: options.subject,
          status: 'failed',
          errorMessage: error.message
        });

        logger.warn('Email send failed', {
          to: options.to,
          error: error.message,
          code: error.code,
          retryable: error.retryable,
          duration,
          logId,
          component: 'email-service'
        });

        return {
          success: false,
          error: error.message,
          logId
        };
      }

      // Unknown error
      await this.logEmail({
        id: logId,
        userId: options.userId,
        templateType: options.templateType,
        subject: options.subject,
        status: 'failed',
        errorMessage: (error as Error).message
      });

      logger.error('Email send error', {
        to: options.to,
        error: (error as Error).message,
        stack: (error as Error).stack,
        duration,
        logId,
        component: 'email-service'
      });

      return {
        success: false,
        error: 'Failed to send email',
        logId
      };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    authToken: string,
    userId: string
  ): Promise<EmailResult> {
    const manageUrl = `https://astropal.com/manage?token=${authToken}`;
    
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to Astropal - Your Cosmic Journey Begins',
      templateType: 'welcome',
      userId,
      templateData: {
        userName,
        authToken,
        manageUrl,
        trialLength: '7 days',
        supportEmail: 'support@astropal.com'
      }
    });
  }

  /**
   * Send trial ending notification
   */
  async sendTrialEndingEmail(
    userEmail: string,
    userName: string,
    authToken: string,
    userId: string,
    daysRemaining: number
  ): Promise<EmailResult> {
    const upgradeUrl = `https://astropal.com/upgrade?token=${authToken}`;
    
    return this.sendEmail({
      to: userEmail,
      subject: `Your Astropal trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
      templateType: 'trial_ending',
      userId,
      templateData: {
        userName,
        daysRemaining,
        upgradeUrl,
        authToken,
        basicPrice: '$7.99',
        proPrice: '$14.99'
      }
    });
  }

  /**
   * Render email template
   */
  private async renderTemplate(
    templateType: string,
    data: EmailTemplateData
  ): Promise<{ html: string; text: string }> {
    // For now, return basic templates
    // In Phase 4, this will integrate with MJML templates from R2
    
    const templates = {
      welcome: {
        html: `
          <h1>Welcome to Astropal, ${data.userName}!</h1>
          <p>Your cosmic journey begins today. You have ${data.trialLength} to explore all features.</p>
          <p><a href="${data.manageUrl}" style="background: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Your Account</a></p>
          <p>Questions? Reply to this email or contact ${data.supportEmail}</p>
        `,
        text: `Welcome to Astropal, ${data.userName}!\n\nYour cosmic journey begins today. You have ${data.trialLength} to explore all features.\n\nManage your account: ${data.manageUrl}\n\nQuestions? Reply to this email or contact ${data.supportEmail}`
      },
      trial_ending: {
        html: `
          <h1>Your Astropal trial ends soon</h1>
          <p>Hi ${data.userName}, your trial ends in ${data.daysRemaining} day${data.daysRemaining === 1 ? '' : 's'}.</p>
          <p>Continue your cosmic journey:</p>
          <ul>
            <li>Basic Plan: ${data.basicPrice}/month</li>
            <li>Pro Plan: ${data.proPrice}/month</li>
          </ul>
          <p><a href="${data.upgradeUrl}" style="background: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Upgrade Now</a></p>
        `,
        text: `Your Astropal trial ends soon\n\nHi ${data.userName}, your trial ends in ${data.daysRemaining} day${data.daysRemaining === 1 ? '' : 's'}.\n\nContinue your cosmic journey:\n- Basic Plan: ${data.basicPrice}/month\n- Pro Plan: ${data.proPrice}/month\n\nUpgrade: ${data.upgradeUrl}`
      },
      daily: {
        html: `<h1>Your Daily Cosmic Pulse</h1><div>${data.content}</div>`,
        text: `Your Daily Cosmic Pulse\n\n${data.content}`
      },
      weekly: {
        html: `<h1>Your Weekly Cosmic Insight</h1><div>${data.content}</div>`,
        text: `Your Weekly Cosmic Insight\n\n${data.content}`
      },
      monthly: {
        html: `<h1>Your Monthly Cosmic Overview</h1><div>${data.content}</div>`,
        text: `Your Monthly Cosmic Overview\n\n${data.content}`
      }
    };

    const template = templates[templateType as keyof typeof templates];
    if (!template) {
      throw new EmailError(`Unknown template type: ${templateType}`, 'UNKNOWN_TEMPLATE');
    }

    return template;
  }

  /**
   * Call Resend API
   */
  private async callResendAPI(endpoint: string, payload: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

             if (!response.ok) {
         const isRetryable = response.status >= 500 || response.status === 429;
         const errorData = data as { message?: string; name?: string };
         throw new EmailError(
           errorData.message || `Resend API error: ${response.status}`,
           errorData.name || 'RESEND_API_ERROR',
           isRetryable
         );
       }

      return data;
    } catch (error) {
      if (error instanceof EmailError) {
        throw error;
      }

      throw new EmailError(
        `Network error: ${(error as Error).message}`,
        'NETWORK_ERROR',
        true
      );
    }
  }

  /**
   * Log email to database
   */
  private async logEmail(emailData: {
    id: string;
    userId?: string;
    templateType: string;
    subject: string;
    status: 'sent' | 'failed' | 'bounced' | 'delivered';
    resendId?: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.db.insert(emailLogs).values({
        id: emailData.id,
        userId: emailData.userId || null,
        templateType: emailData.templateType,
        subject: emailData.subject,
        status: emailData.status,
        resendId: emailData.resendId || null,
        errorMessage: emailData.errorMessage || null
      });
    } catch (error) {
      logger.error('Failed to log email', {
        logId: emailData.id,
        error: (error as Error).message,
        component: 'email-service'
      });
    }
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320; // RFC 5321 limit
  }

  /**
   * Handle email bounces and complaints
   */
  async handleEmailWebhook(
    eventType: string,
    emailId: string,
    eventData: any
  ): Promise<void> {
    try {
      logger.info('Processing email webhook', {
        eventType,
        emailId,
        component: 'email-service'
      });

      // Find email log by Resend ID
      const emailLog = await this.db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.resendId, emailId))
        .limit(1);

      if (emailLog.length === 0) {
        logger.warn('Email log not found for webhook', {
          emailId,
          eventType,
          component: 'email-service'
        });
        return;
      }

      const log = emailLog[0];

      switch (eventType) {
        case 'email.delivered':
          await this.db
            .update(emailLogs)
            .set({ status: 'delivered' })
            .where(eq(emailLogs.id, log.id));
          break;

        case 'email.bounced':
          await this.db
            .update(emailLogs)
            .set({ status: 'bounced' })
            .where(eq(emailLogs.id, log.id));

          // Update user status if hard bounce
          if (log.userId && eventData.bounce?.type === 'hard') {
            await this.db
              .update(users)
              .set({ 
                emailStatus: 'bounced',
                lastBounce: new Date().toISOString()
              })
              .where(eq(users.id, log.userId));
          }
          break;

        case 'email.complained':
          // Handle spam complaints
          if (log.userId) {
            await this.db
              .update(users)
              .set({ emailStatus: 'unsubscribed' })
              .where(eq(users.id, log.userId));
          }
          break;
      }

      logger.info('Email webhook processed', {
        eventType,
        emailId,
        userId: log.userId,
        component: 'email-service'
      });

    } catch (error) {
      logger.error('Failed to process email webhook', {
        eventType,
        emailId,
        error: (error as Error).message,
        component: 'email-service'
      });
    }
  }

  /**
   * Get email statistics for monitoring
   */
  async getEmailStats(timeframeHours: number = 24): Promise<{
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
  }> {
    try {
      const since = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();
      
      // This would need proper aggregation query in production
      const stats = await this.db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.sentAt, since)); // This is a simplified query

      return {
        sent: stats.filter(s => s.status === 'sent').length,
        delivered: stats.filter(s => s.status === 'delivered').length,
        bounced: stats.filter(s => s.status === 'bounced').length,
        failed: stats.filter(s => s.status === 'failed').length
      };
    } catch (error) {
      logger.error('Failed to get email stats', {
        error: (error as Error).message,
        component: 'email-service'
      });

      return { sent: 0, delivered: 0, bounced: 0, failed: 0 };
    }
  }

  /**
   * Send trial ending reminder email with upgrade options
   */
  async sendTrialEndingReminder(userId: string): Promise<EmailResult> {
    try {
      const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new EmailError('User not found', 'USER_NOT_FOUND');
      }

             const { BillingService } = await import('./billingService');
       const paymentLinks = BillingService.getPaymentLinks();

       const templateData = {
         firstName: user[0].email.split('@')[0], // Simple first name extraction
        trialEndDate: user[0].trialEnd || '',
        basicPaymentLink: paymentLinks.basic.paymentLink,
        proPaymentLink: paymentLinks.pro.paymentLink,
        basicPrice: '$7.99',
        proPrice: '$14.99'
      };

      return await this.sendEmail({
        to: user[0].email,
        subject: 'Your Astropal trial ends soon - Choose your plan',
        templateType: 'trial_ending',
        templateData,
        userId,
        priority: 'high'
      });
    } catch (error) {
      logger.error('Failed to send trial ending reminder', {
        userId,
        error: (error as Error).message,
        component: 'email-service'
      });
      throw error;
    }
  }

  /**
   * Send trial expired email with payment links
   */
     async sendTrialExpiredWithPaymentLinks(userId: string): Promise<EmailResult> {
     try {
       const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
       if (!user.length) {
         throw new EmailError('User not found', 'USER_NOT_FOUND');
       }

       const { BillingService } = await import('./billingService');
       const paymentLinks = BillingService.getPaymentLinks();

      const templateData = {
        firstName: user[0].email.split('@')[0],
        basicPaymentLink: paymentLinks.basic.paymentLink,
        proPaymentLink: paymentLinks.pro.paymentLink,
        basicPrice: '$7.99',
        proPrice: '$14.99',
        basicFeatures: paymentLinks.basic.features,
        proFeatures: paymentLinks.pro.features
      };

      return await this.sendEmail({
        to: user[0].email,
        subject: 'Continue your cosmic journey with Astropal',
        templateType: 'trial_ending', // Reuse template with different subject
        templateData,
        userId,
        priority: 'normal'
      });
    } catch (error) {
      logger.error('Failed to send trial expired email', {
        userId,
        error: (error as Error).message,
        component: 'email-service'
      });
      throw error;
    }
  }

  /**
   * Send upgrade confirmation email
   */
  async sendUpgradeConfirmation(userId: string, newTier: string): Promise<EmailResult> {
    try {
      const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new EmailError('User not found', 'USER_NOT_FOUND');
      }

      const tierNames = {
        basic: 'Basic',
        pro: 'Pro'
      };

      const templateData = {
        firstName: user[0].email.split('@')[0],
        tierName: tierNames[newTier as keyof typeof tierNames] || newTier,
        upgradedFeatures: newTier === 'basic' 
          ? ['2 personalized emails daily', 'Weekly cosmic weather', 'Monthly forecast']
          : ['3 personalized emails daily', 'News analysis', 'Advanced insights', 'Priority support']
      };

      return await this.sendEmail({
        to: user[0].email,
        subject: `Welcome to Astropal ${tierNames[newTier as keyof typeof tierNames]}!`,
        templateType: 'welcome', // Reuse welcome template
        templateData,
        userId,
        priority: 'high'
      });
    } catch (error) {
      logger.error('Failed to send upgrade confirmation', {
        userId,
        newTier,
        error: (error as Error).message,
        component: 'email-service'
      });
      throw error;
    }
  }

  /**
   * Send weekly upgrade reminder to free users
   */
     async sendUpgradeReminder(userId: string): Promise<EmailResult> {
     try {
       const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
       if (!user.length) {
         throw new EmailError('User not found', 'USER_NOT_FOUND');
       }

       const { BillingService } = await import('./billingService');
       const paymentLinks = BillingService.getPaymentLinks();

      const templateData = {
        firstName: user[0].email.split('@')[0],
        basicPaymentLink: paymentLinks.basic.paymentLink,
        proPaymentLink: paymentLinks.pro.paymentLink,
        basicPrice: '$7.99',
        proPrice: '$14.99'
      };

      return await this.sendEmail({
        to: user[0].email,
        subject: 'Enhance your cosmic insights with Astropal',
        templateType: 'trial_ending', // Reuse template
        templateData,
        userId,
        priority: 'low'
      });
    } catch (error) {
      logger.error('Failed to send upgrade reminder', {
        userId,
        error: (error as Error).message,
        component: 'email-service'
      });
      throw error;
    }
  }

  /**
   * Send cancellation confirmation
   */
  async sendCancellationConfirmation(userId: string): Promise<EmailResult> {
    try {
      const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new EmailError('User not found', 'USER_NOT_FOUND');
      }

      const templateData = {
        firstName: user[0].email.split('@')[0],
        supportEmail: 'support@astropal.com'
      };

      return await this.sendEmail({
        to: user[0].email,
        subject: 'Your Astropal subscription has been cancelled',
        templateType: 'welcome', // Simple template reuse
        templateData,
        userId,
        priority: 'normal'
      });
    } catch (error) {
      logger.error('Failed to send cancellation confirmation', {
        userId,
        error: (error as Error).message,
        component: 'email-service'
      });
      throw error;
    }
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(userId: string): Promise<EmailResult> {
    try {
      const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        throw new EmailError('User not found', 'USER_NOT_FOUND');
      }

      const templateData = {
        firstName: user[0].email.split('@')[0],
        supportEmail: 'support@astropal.com',
        billingPortalLink: `https://astropal.com/portal?token=${user[0].authToken}`
      };

      return await this.sendEmail({
        to: user[0].email,
        subject: 'Payment failed - Update your payment method',
        templateType: 'welcome', // Simple template reuse
        templateData,
        userId,
        priority: 'high'
      });
    } catch (error) {
      logger.error('Failed to send payment failed notification', {
        userId,
        error: (error as Error).message,
        component: 'email-service'
      });
      throw error;
    }
  }
}

// Factory function for creating email service
export function createEmailService(
  apiKey: string,
  db: DatabaseClient,
  fromEmail?: string,
  fromName?: string
): EmailService {
  return new EmailService(apiKey, db, fromEmail, fromName);
} 