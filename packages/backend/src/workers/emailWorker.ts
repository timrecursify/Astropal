import { logger } from '@/lib/logger';
import { createDatabaseClient } from '@/db/client';
import { emailLogs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createEmailRenderer, type EmailTemplateData, type TemplateType } from '@/services/emailRenderer';
import { createEmailService } from '@/services/emailService';
import type { Env } from '../index';

// Email job types
export type EmailJobType = 
  | 'immediate' 
  | 'scheduled'
  | 'batch'
  | 'webhook-trigger';

// Email job data
export interface EmailJob {
  id: string;
  type: EmailJobType;
  templateType: TemplateType;
  recipientEmail: string;
  templateData: EmailTemplateData;
  scheduledFor?: string; // ISO timestamp
  priority: 'low' | 'normal' | 'high';
  retryCount?: number;
  maxRetries?: number;
}

// Email delivery result
export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
}

// Email scheduling service
export class EmailScheduler {
  private kv: KVNamespace;
  private db: any;
  
  constructor(kv: KVNamespace, db: any) {
    this.kv = kv;
    this.db = db;
  }
  
  async scheduleEmail(job: EmailJob): Promise<void> {
    const jobKey = `email_job:${job.id}`;
    
    logger.info('Email job scheduled', {
      jobId: job.id,
      templateType: job.templateType,
      recipientEmail: job.recipientEmail,
      scheduledFor: job.scheduledFor,
      priority: job.priority,
      component: 'email-scheduler'
    });
    
    // Store job in KV with appropriate TTL
    const ttl = job.scheduledFor 
      ? Math.max(60, Math.floor((new Date(job.scheduledFor).getTime() - Date.now()) / 1000) + 3600) // Schedule time + 1 hour buffer
      : 3600; // 1 hour for immediate jobs
    
    await this.kv.put(jobKey, JSON.stringify(job), {
      expirationTtl: ttl
    });
    
    // For immediate jobs, trigger processing
    if (job.type === 'immediate') {
      // In a real implementation, this would trigger the email worker
      // For now, we'll process it directly
      await this.processEmailJob(job);
    }
  }
  
  async getScheduledJobs(beforeTime: string): Promise<EmailJob[]> {
    try {
      // List all email queue entries from KV
      const emailQueuePrefix = 'email_queue:';
      const kvList = await this.kv.list({ prefix: emailQueuePrefix });
      
      const jobs: EmailJob[] = [];
      
      for (const key of kvList.keys) {
        try {
          // Get the queued email data
          const queuedData = await this.kv.get(key.name, 'json') as any;
          
          if (!queuedData) continue;
          
          // Parse the key to determine email type
          const keyParts = key.name.split(':');
          const emailType = keyParts[1]; // trial, upgrade, recovery, downgrade
          const userId = keyParts[2];
          
          // Map queue data to EmailJob based on type
          const emailJob = await this.mapQueuedEmailToJob(emailType, userId, queuedData);
          
          if (emailJob) {
            jobs.push(emailJob);
            
            // Delete from queue after retrieval
            await this.kv.delete(key.name);
          }
        } catch (error) {
          logger.error('Failed to process queued email', {
            key: key.name,
            error: error.message,
            component: 'email-scheduler'
          });
        }
      }
      
      logger.info('Retrieved scheduled emails from queue', {
        count: jobs.length,
        component: 'email-scheduler'
      });
      
      return jobs;
    } catch (error) {
      logger.error('Failed to get scheduled jobs', {
        error: error.message,
        component: 'email-scheduler'
      });
      return [];
    }
  }
  
  private async mapQueuedEmailToJob(emailType: string, userId: string, queuedData: any): Promise<EmailJob | null> {
    try {
      // Get user details
      const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) {
        logger.warn('User not found for queued email', { userId, emailType });
        return null;
      }
      
      const userData = user[0];
      
      // Map based on email type
      switch (emailType) {
        case 'trial':
          return {
            id: `trial-reminder-${userId}-${Date.now()}`,
            type: 'immediate',
            templateType: 'trial-ending',
            recipientEmail: userData.email,
            templateData: {
              userName: userData.email.split('@')[0],
              userEmail: userData.email,
              tier: userData.tier,
              perspective: userData.perspective,
              focusAreas: JSON.parse(userData.focusPreferences || '[]'),
              daysRemaining: 1,
              trialEndDate: userData.trialEnd,
              basicPaymentLink: queuedData.paymentLinks?.basic,
              proPaymentLink: queuedData.paymentLinks?.pro,
              basicPrice: '$7.99',
              proPrice: '$14.99',
              accountUrl: `https://astropal.com/account?token=${userData.authToken}`,
              changePerspectiveUrl: `https://astropal.com/perspective?token=${userData.authToken}`,
              updatePreferencesUrl: `https://astropal.com/preferences?token=${userData.authToken}`,
              unsubscribeUrl: `https://astropal.com/unsubscribe?token=${userData.authToken}`
            },
            priority: 'high'
          };
          
        case 'upgrade':
          return {
            id: `upgrade-confirmation-${userId}-${Date.now()}`,
            type: 'immediate',
            templateType: 'welcome', // Reuse welcome template
            recipientEmail: userData.email,
            templateData: {
              userName: userData.email.split('@')[0],
              userEmail: userData.email,
              tier: queuedData.tier,
              perspective: userData.perspective,
              focusAreas: JSON.parse(userData.focusPreferences || '[]'),
              tierName: queuedData.tier === 'basic' ? 'Basic' : 'Pro',
              upgradedFeatures: queuedData.tier === 'basic' 
                ? ['2 personalized emails daily', 'Weekly cosmic weather', 'Monthly forecast']
                : ['3 personalized emails daily', 'News analysis', 'Advanced insights', 'Priority support'],
              accountUrl: `https://astropal.com/account?token=${userData.authToken}`,
              changePerspectiveUrl: `https://astropal.com/perspective?token=${userData.authToken}`,
              updatePreferencesUrl: `https://astropal.com/preferences?token=${userData.authToken}`,
              unsubscribeUrl: `https://astropal.com/unsubscribe?token=${userData.authToken}`
            },
            priority: 'high'
          };
          
        case 'recovery':
          return {
            id: `payment-recovery-${userId}-${Date.now()}`,
            type: 'immediate',
            templateType: 'welcome', // Simple template reuse
            recipientEmail: userData.email,
            templateData: {
              userName: userData.email.split('@')[0],
              userEmail: userData.email,
              tier: userData.tier,
              perspective: userData.perspective,
              recoveryType: queuedData.recoveryType,
              urgency: queuedData.recoveryType === 'final_attempt' 
                ? 'Your subscription will be cancelled today' 
                : 'Please update your payment method',
              billingPortalLink: `https://astropal.com/portal?token=${userData.authToken}`
            },
            priority: 'high'
          };
          
        case 'downgrade':
          return {
            id: `downgrade-notification-${userId}-${Date.now()}`,
            type: 'immediate',
            templateType: 'welcome', // Simple template reuse
            recipientEmail: userData.email,
            templateData: {
              userName: userData.email.split('@')[0],
              userEmail: userData.email,
              tier: queuedData.newTier,
              oldTier: queuedData.oldTier,
              perspective: userData.perspective,
              message: `You've been moved from ${queuedData.oldTier} to ${queuedData.newTier} tier`
            },
            priority: 'normal'
          };
          
        default:
          logger.warn('Unknown email type in queue', { emailType, userId });
          return null;
      }
    } catch (error) {
      logger.error('Failed to map queued email to job', {
        emailType,
        userId,
        error: error.message,
        component: 'email-scheduler'
      });
      return null;
    }
  }
  
  private async processEmailJob(job: EmailJob): Promise<void> {
    logger.info('Processing email job', {
      jobId: job.id,
      component: 'email-scheduler'
    });
    
    // This would trigger the actual email worker
    // For now, it's a placeholder
  }
}

// Email worker class
export class EmailWorker {
  private env: Env;
  private db: any;
  private emailService: any;
  private emailRenderer: any;
  private scheduler: EmailScheduler;
  
  constructor(env: Env) {
    this.env = env;
    this.db = createDatabaseClient(env.DB);
    this.emailService = createEmailService(
      env.RESEND_API_KEY || '', 
      this.db,
      'cosmic@astropal.com',
      'Astropal'
    );
    this.emailRenderer = createEmailRenderer(env);
    this.scheduler = new EmailScheduler(env.KV_CONTENT, this.db); // Use existing KV namespace
  }
  
  async handleEmailDelivery(request: Request): Promise<Response> {
    const startTime = Date.now();
    const jobId = crypto.randomUUID();
    
    logger.info('Email delivery job started', {
      jobId,
      component: 'email-worker'
    });
    
    try {
      const body = await request.json() as EmailJob;
      
      // Validate email job
      if (!this.validateEmailJob(body)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email job data' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Process the email
      const result = await this.processEmail(body);
      
      const duration = Date.now() - startTime;
      
      logger.info('Email delivery job completed', {
        jobId,
        success: result.success,
        messageId: result.messageId,
        duration,
        component: 'email-worker'
      });
      
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Email delivery job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'email-worker'
      });
      
      return new Response(
        JSON.stringify({ error: 'Email delivery failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  async processEmail(job: EmailJob): Promise<EmailDeliveryResult> {
    const startTime = Date.now();
    
    logger.info('Processing email', {
      jobId: job.id,
      templateType: job.templateType,
      recipientEmail: job.recipientEmail,
      component: 'email-worker'
    });
    
    try {
      // Render email template
      const renderedEmail = await this.emailRenderer.renderTemplate(
        job.templateType,
        job.templateData
      );
      
      // Send email via Resend
      const emailResult = await this.emailService.sendEmail({
        to: job.recipientEmail,
        subject: renderedEmail.subject,
        html: renderedEmail.html,
        text: renderedEmail.text,
        headers: {
          'X-Email-Type': job.templateType,
          'X-User-Tier': job.templateData.tier,
          'X-Email-Job-ID': job.id
        }
      });
      
      // Log email delivery
      await this.logEmailDelivery(job, emailResult, renderedEmail);
      
      const duration = Date.now() - startTime;
      
      if (emailResult.success) {
        logger.info('Email sent successfully', {
          jobId: job.id,
          messageId: emailResult.messageId,
          duration,
          component: 'email-worker'
        });
        
        return {
          success: true,
          messageId: emailResult.messageId
        };
      } else {
        logger.warn('Email delivery failed', {
          jobId: job.id,
          error: emailResult.error,
          duration,
          component: 'email-worker'
        });
        
        return {
          success: false,
          error: emailResult.error,
          retryable: this.isRetryableError(emailResult.error || '')
        };
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Email processing failed', {
        jobId: job.id,
        error: (error as Error).message,
        duration,
        component: 'email-worker'
      });
      
      return {
        success: false,
        error: (error as Error).message,
        retryable: true
      };
    }
  }
  
  async handleBatchEmailDelivery(jobs: EmailJob[]): Promise<EmailDeliveryResult[]> {
    logger.info('Processing email batch', {
      jobCount: jobs.length,
      component: 'email-worker'
    });
    
    const results: EmailDeliveryResult[] = [];
    
    // Process in batches of 10 to avoid overwhelming Resend
    for (let i = 0; i < jobs.length; i += 10) {
      const batch = jobs.slice(i, i + 10);
      
      const batchPromises = batch.map(job => this.processEmail(job));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Batch processing failed',
            retryable: true
          });
        }
      });
      
      // Rate limiting between batches
      if (i + 10 < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info('Email batch completed', {
      totalJobs: jobs.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      component: 'email-worker'
    });
    
    return results;
  }
  
  async handleScheduledEmails(): Promise<void> {
    logger.info('Processing scheduled emails', {
      component: 'email-worker'
    });
    
    try {
      const now = new Date().toISOString();
      const scheduledJobs = await this.scheduler.getScheduledJobs(now);
      
      if (scheduledJobs.length === 0) {
        logger.debug('No scheduled emails to process', {
          component: 'email-worker'
        });
        return;
      }
      
      // Process scheduled emails in batches
      await this.handleBatchEmailDelivery(scheduledJobs);
      
    } catch (error) {
      logger.error('Scheduled email processing failed', {
        error: (error as Error).message,
        component: 'email-worker'
      });
    }
  }
  
  async handleEngagementWebhook(request: Request): Promise<Response> {
    logger.info('Processing engagement webhook', {
      component: 'email-worker'
    });
    
    try {
      const body = await request.json();
      
      // Verify webhook signature (in production)
      // const signature = request.headers.get('resend-signature');
      // if (!this.verifyWebhookSignature(body, signature)) {
      //   return new Response('Invalid signature', { status: 401 });
      // }
      
      await this.processEngagementEvent(body);
      
      return new Response('OK', { status: 200 });
      
    } catch (error) {
      logger.error('Engagement webhook processing failed', {
        error: (error as Error).message,
        component: 'email-worker'
      });
      
      return new Response('Error processing webhook', { status: 500 });
    }
  }
  
  private async logEmailDelivery(
    job: EmailJob, 
    result: any, 
    renderedEmail: any
  ): Promise<void> {
    try {
      await this.db.insert(emailLogs).values({
        id: job.id,
        userId: await this.getUserIdByEmail(job.recipientEmail),
        templateType: job.templateType,
        subject: renderedEmail.subject,
        sentAt: new Date().toISOString(),
        status: result.success ? 'sent' : 'failed',
        resendId: result.messageId,
        errorMessage: result.error
      });
    } catch (error) {
      logger.error('Failed to log email delivery', {
        jobId: job.id,
        error: (error as Error).message,
        component: 'email-worker'
      });
    }
  }
  
  private async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const user = await this.db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      return user[0]?.id || null;
    } catch (error) {
      logger.warn('Failed to get user ID by email', {
        email,
        error: (error as Error).message,
        component: 'email-worker'
      });
      return null;
    }
  }
  
  private async processEngagementEvent(event: any): Promise<void> {
    // Process email engagement events (opens, clicks, bounces, etc.)
    const { type, data } = event;
    
    logger.info('Processing engagement event', {
      type,
      messageId: data.email_id,
      component: 'email-worker'
    });
    
    // Update email logs based on event type
    switch (type) {
      case 'email.delivered':
        await this.updateEmailStatus(data.email_id, 'delivered');
        break;
      case 'email.bounced':
        await this.updateEmailStatus(data.email_id, 'bounced');
        break;
      case 'email.opened':
        await this.updateEmailEngagement(data.email_id, 'open');
        break;
      case 'email.clicked':
        await this.updateEmailEngagement(data.email_id, 'click');
        break;
      default:
        logger.debug('Unknown engagement event type', {
          type,
          component: 'email-worker'
        });
    }
  }
  
  private async updateEmailStatus(resendId: string, status: string): Promise<void> {
    try {
      await this.db.update(emailLogs)
        .set({ status })
        .where(eq(emailLogs.resendId, resendId));
    } catch (error) {
      logger.error('Failed to update email status', {
        resendId,
        status,
        error: (error as Error).message,
        component: 'email-worker'
      });
    }
  }
  
  private async updateEmailEngagement(resendId: string, type: 'open' | 'click'): Promise<void> {
    try {
      const updateField = type === 'open' ? 'openAt' : 'clickAt';
      const updateData = { [updateField]: new Date().toISOString() };
      
      await this.db.update(emailLogs)
        .set(updateData)
        .where(eq(emailLogs.resendId, resendId));
    } catch (error) {
      logger.error('Failed to update email engagement', {
        resendId,
        type,
        error: (error as Error).message,
        component: 'email-worker'
      });
    }
  }
  
  private validateEmailJob(job: any): job is EmailJob {
    return (
      job &&
      typeof job.id === 'string' &&
      typeof job.templateType === 'string' &&
      typeof job.recipientEmail === 'string' &&
      job.templateData &&
      typeof job.templateData.userName === 'string' &&
      typeof job.templateData.userEmail === 'string'
    );
  }
  
  private isRetryableError(error: string): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'rate limit',
      'server error',
      '5xx'
    ];
    
    return retryableErrors.some(retryable => 
      error.toLowerCase().includes(retryable)
    );
  }
}

// Scheduled event handler for email processing
export async function handleEmailScheduledEvent(event: ScheduledEvent, env: Env): Promise<void> {
  const worker = new EmailWorker(env);
  await worker.handleScheduledEmails();
}

// Create email worker instance
export function createEmailWorker(env: Env): EmailWorker {
  return new EmailWorker(env);
}

// HTTP handler for email worker endpoints
export async function handleEmailWorkerRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const worker = new EmailWorker(env);
  
  // Route requests based on path
  if (url.pathname === '/email/deliver' && request.method === 'POST') {
    return worker.handleEmailDelivery(request);
  } else if (url.pathname === '/email/webhook' && request.method === 'POST') {
    return worker.handleEngagementWebhook(request);
  } else {
    return new Response('Not Found', { status: 404 });
  }
}

 