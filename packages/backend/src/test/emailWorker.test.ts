import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailWorker, EmailScheduler, type EmailJob } from '../workers/emailWorker';
import { createEmailRenderer, type EmailTemplateData, type TemplateType } from '../services/emailRenderer';

// Mock environment
const mockEnv = {
  DB: {} as any,
  KV_CONTENT: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
    getWithMetadata: vi.fn()
  },
  R2_TEMPLATES: {
    get: vi.fn(),
    put: vi.fn()
  },
  RESEND_API_KEY: 'test-api-key'
};

// Mock database
const mockDB = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'test-id' }])
    })
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'user-1' }])
      })
    })
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(true)
    })
  })
};

// Mock email service
const mockEmailService = {
  sendEmail: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id'
  })
};

// Mock email renderer
const mockEmailRenderer = {
  renderTemplate: vi.fn().mockResolvedValue({
    html: '<html><body>Test email</body></html>',
    text: 'Test email',
    subject: 'Test Subject',
    preheader: 'Test preheader'
  })
};

// Mock imports
vi.mock('@/db/client', () => ({
  createDatabaseClient: vi.fn(() => mockDB)
}));

vi.mock('@/services/emailService', () => ({
  createEmailService: vi.fn(() => mockEmailService)
}));

vi.mock('@/services/emailRenderer', () => ({
  createEmailRenderer: vi.fn(() => mockEmailRenderer)
}));

describe('EmailWorker', () => {
  let emailWorker: EmailWorker;
  
  beforeEach(() => {
    vi.clearAllMocks();
    emailWorker = new EmailWorker(mockEnv as any);
  });
  
  describe('processEmail', () => {
    const testEmailJob: EmailJob = {
      id: 'test-job-1',
      type: 'immediate',
      templateType: 'daily-cosmic-pulse',
      recipientEmail: 'test@example.com',
      templateData: {
        userName: 'Test User',
        userEmail: 'test@example.com',
        perspective: 'calm',
        tier: 'basic',
        focusAreas: ['wellness', 'relationships'],
        accountUrl: 'https://astropal.com/account',
        changePerspectiveUrl: 'https://astropal.com/perspective',
        updatePreferencesUrl: 'https://astropal.com/preferences',
        unsubscribeUrl: 'https://astropal.com/unsubscribe'
      },
      priority: 'normal'
    };
    
    it('should process email successfully', async () => {
      const result = await emailWorker.processEmail(testEmailJob);
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(mockEmailRenderer.renderTemplate).toHaveBeenCalledWith(
        'daily-cosmic-pulse',
        testEmailJob.templateData
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<html><body>Test email</body></html>',
        text: 'Test email',
        headers: {
          'X-Email-Type': 'daily-cosmic-pulse',
          'X-User-Tier': 'basic',
          'X-Email-Job-ID': 'test-job-1'
        }
      });
    });
    
    it('should handle email rendering failure', async () => {
      mockEmailRenderer.renderTemplate.mockRejectedValueOnce(new Error('Rendering failed'));
      
      const result = await emailWorker.processEmail(testEmailJob);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rendering failed');
      expect(result.retryable).toBe(true);
    });
    
    it('should handle email sending failure', async () => {
      mockEmailService.sendEmail.mockResolvedValueOnce({
        success: false,
        error: 'Rate limit exceeded'
      });
      
      const result = await emailWorker.processEmail(testEmailJob);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.retryable).toBe(true);
    });
  });
  
  describe('handleBatchEmailDelivery', () => {
    it('should process multiple emails in batches', async () => {
      const jobs: EmailJob[] = Array.from({ length: 25 }, (_, i) => ({
        id: `job-${i}`,
        type: 'batch',
        templateType: 'daily-cosmic-pulse',
        recipientEmail: `user${i}@example.com`,
        templateData: {
          userName: `User ${i}`,
          userEmail: `user${i}@example.com`,
          perspective: 'calm',
          tier: 'free',
          focusAreas: ['wellness'],
          accountUrl: 'https://astropal.com/account',
          changePerspectiveUrl: 'https://astropal.com/perspective',
          updatePreferencesUrl: 'https://astropal.com/preferences',
          unsubscribeUrl: 'https://astropal.com/unsubscribe'
        },
        priority: 'normal'
      }));
      
      const results = await emailWorker.handleBatchEmailDelivery(jobs);
      
      expect(results).toHaveLength(25);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(25);
    });
    
    it('should handle partial failures in batch', async () => {
      const jobs: EmailJob[] = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i}`,
        type: 'batch',
        templateType: 'daily-cosmic-pulse',
        recipientEmail: `user${i}@example.com`,
        templateData: {
          userName: `User ${i}`,
          userEmail: `user${i}@example.com`,
          perspective: 'calm',
          tier: 'free',
          focusAreas: ['wellness'],
          accountUrl: 'https://astropal.com/account',
          changePerspectiveUrl: 'https://astropal.com/perspective',
          updatePreferencesUrl: 'https://astropal.com/preferences',
          unsubscribeUrl: 'https://astropal.com/unsubscribe'
        },
        priority: 'normal'
      }));
      
      // Make every other email fail
      mockEmailService.sendEmail
        .mockResolvedValueOnce({ success: true, messageId: 'msg-1' })
        .mockResolvedValueOnce({ success: false, error: 'Failed' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-3' })
        .mockResolvedValueOnce({ success: false, error: 'Failed' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-5' });
      
      const results = await emailWorker.handleBatchEmailDelivery(jobs);
      
      expect(results).toHaveLength(5);
      expect(results.filter(r => r.success)).toHaveLength(3);
      expect(results.filter(r => !r.success)).toHaveLength(2);
    });
  });
  
  describe('handleEngagementWebhook', () => {
    it('should process email delivered event', async () => {
      const webhookBody = {
        type: 'email.delivered',
        data: {
          email_id: 'test-message-id',
          to: 'test@example.com'
        }
      };
      
      const request = new Request('http://localhost/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookBody),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await emailWorker.handleEngagementWebhook(request);
      
      expect(response.status).toBe(200);
      expect(mockDB.update).toHaveBeenCalled();
    });
    
    it('should process email opened event', async () => {
      const webhookBody = {
        type: 'email.opened',
        data: {
          email_id: 'test-message-id',
          to: 'test@example.com'
        }
      };
      
      const request = new Request('http://localhost/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookBody),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await emailWorker.handleEngagementWebhook(request);
      
      expect(response.status).toBe(200);
      expect(mockDB.update).toHaveBeenCalled();
    });
    
    it('should handle webhook processing errors gracefully', async () => {
      const request = new Request('http://localhost/webhook', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await emailWorker.handleEngagementWebhook(request);
      
      expect(response.status).toBe(500);
    });
  });
});

describe('EmailScheduler', () => {
  let scheduler: EmailScheduler;
  
  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = new EmailScheduler(mockEnv.KV_CONTENT as any, mockDB);
  });
  
  describe('scheduleEmail', () => {
    it('should schedule immediate email', async () => {
      const job: EmailJob = {
        id: 'immediate-job',
        type: 'immediate',
        templateType: 'welcome',
        recipientEmail: 'test@example.com',
        templateData: {
          userName: 'Test User',
          userEmail: 'test@example.com',
          perspective: 'calm',
          tier: 'trial',
          focusAreas: ['wellness'],
          accountUrl: 'https://astropal.com/account',
          changePerspectiveUrl: 'https://astropal.com/perspective',
          updatePreferencesUrl: 'https://astropal.com/preferences',
          unsubscribeUrl: 'https://astropal.com/unsubscribe'
        },
        priority: 'high'
      };
      
      await scheduler.scheduleEmail(job);
      
      expect(mockEnv.KV_CONTENT.put).toHaveBeenCalledWith(
        'email_job:immediate-job',
        JSON.stringify(job),
        { expirationTtl: 3600 }
      );
    });
    
    it('should schedule future email', async () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString();
      const job: EmailJob = {
        id: 'scheduled-job',
        type: 'scheduled',
        templateType: 'trial-ending',
        recipientEmail: 'test@example.com',
        templateData: {
          userName: 'Test User',
          userEmail: 'test@example.com',
          perspective: 'calm',
          tier: 'trial',
          focusAreas: ['wellness'],
          accountUrl: 'https://astropal.com/account',
          changePerspectiveUrl: 'https://astropal.com/perspective',
          updatePreferencesUrl: 'https://astropal.com/preferences',
          unsubscribeUrl: 'https://astropal.com/unsubscribe'
        },
        scheduledFor: futureTime,
        priority: 'normal'
      };
      
      await scheduler.scheduleEmail(job);
      
      expect(mockEnv.KV_CONTENT.put).toHaveBeenCalledWith(
        'email_job:scheduled-job',
        JSON.stringify(job),
        expect.objectContaining({ expirationTtl: expect.any(Number) })
      );
    });
  });
});

describe('Email Integration', () => {
  it('should integrate with content generation pipeline', async () => {
    const emailWorker = new EmailWorker(mockEnv as any);
    
    // Mock newsletter content
    const newsletterContent = {
      subject: 'Your Daily Cosmic Pulse',
      preheader: 'Today\'s insights await',
      sections: [
        {
          id: 'cosmic-update',
          heading: 'Cosmic Update',
          html: '<p>The stars align for new beginnings today.</p>',
          text: 'The stars align for new beginnings today.',
          cta: {
            label: 'Read More',
            url: 'https://astropal.com/insights'
          }
        }
      ],
      shareableSnippet: 'The cosmos invites reflection and growth today.',
      generatedAt: new Date().toISOString(),
      modelUsed: 'grok-3-mini',
      tokenCount: 450,
      perspective: 'calm',
      tier: 'basic'
    };
    
    // Mock user data
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      perspective: 'calm',
      tier: 'basic',
      focusPreferences: '["wellness", "relationships"]',
      authToken: 'auth-token-123'
    };
    
    // Test email scheduling
    const templateData = {
      userName: 'test',
      userEmail: 'test@example.com',
      perspective: 'calm',
      tier: 'basic',
      focusAreas: ['wellness', 'relationships'],
      subject: newsletterContent.subject,
      preheader: newsletterContent.preheader,
      sections: newsletterContent.sections,
      shareableSnippet: newsletterContent.shareableSnippet,
      accountUrl: 'https://astropal.com/account?token=auth-token-123',
      changePerspectiveUrl: 'https://astropal.com/perspective?token=auth-token-123',
      updatePreferencesUrl: 'https://astropal.com/preferences?token=auth-token-123',
      unsubscribeUrl: 'https://astropal.com/unsubscribe?token=auth-token-123'
    };
    
    const emailJob = {
      id: 'newsletter-user-1-123456789',
      type: 'immediate' as const,
      templateType: 'daily-cosmic-pulse' as const,
      recipientEmail: 'test@example.com',
      templateData,
      priority: 'normal' as const
    };
    
    const result = await emailWorker.processEmail(emailJob);
    
    expect(result.success).toBe(true);
    expect(mockEmailRenderer.renderTemplate).toHaveBeenCalledWith(
      'daily-cosmic-pulse',
      templateData
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: expect.stringContaining('Test email')
      })
    );
  });
}); 