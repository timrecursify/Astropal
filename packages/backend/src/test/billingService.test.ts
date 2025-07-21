import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService, type BillingEnv } from '../services/billingService';

// Mock environment for testing
const createMockEnv = (): BillingEnv => {
  const mockStatement = {
    bind: vi.fn(() => ({
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn()
    })),
    first: vi.fn(),
    run: vi.fn(),
    all: vi.fn()
  };
  
  return {
    DB: {
      prepare: vi.fn((sql: string) => mockStatement),
      batch: vi.fn()
    } as any,
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: 'whsec_sub_123',
    STRIPE_WEBHOOK_SECRET_PAYMENT: 'whsec_pay_123',
    STRIPE_BASIC_PAYMENT_LINK: 'https://stripe.com/basic',
    STRIPE_PRO_PAYMENT_LINK: 'https://stripe.com/pro',
    KV_CONTENT: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as any,
    KV_METRICS: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn()
    } as any,
    RESEND_API_KEY: 're_test_123'
  };
};

// Mock crypto for tests
global.crypto = {
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
    digest: vi.fn()
  },
  getRandomValues: vi.fn()
} as any;

describe('BillingService', () => {
  let billingService: BillingService;
  let mockEnv: BillingEnv;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv = createMockEnv();
    billingService = new BillingService(mockEnv);
  });

  describe('getPaymentLinks', () => {
    it('should return payment links from environment variables', () => {
      const links = billingService.getPaymentLinks();
      
      expect(links.basic.paymentLink).toBe('https://stripe.com/basic');
      expect(links.pro.paymentLink).toBe('https://stripe.com/pro');
      expect(links.basic.price).toBe(799);
      expect(links.pro.price).toBe(1499);
    });

    it('should include correct feature lists', () => {
      const links = billingService.getPaymentLinks();
      
      expect(links.basic.features).toContain('2 personalized emails daily');
      expect(links.pro.features).toContain('3 personalized emails daily');
      expect(links.pro.features).toContain('News analysis with cosmic interpretation');
    });
  });

  describe('webhook signature verification', () => {
    beforeEach(() => {
      // Mock crypto.subtle methods
      (global.crypto.subtle.importKey as any).mockResolvedValue('mock-key');
      (global.crypto.subtle.sign as any).mockResolvedValue(
        new ArrayBuffer(32) // Mock signature
      );
    });

    it('should reject webhook without signature', async () => {
      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' })
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing signature');
    });

    it('should validate webhook signature timestamp', async () => {
      const payload = JSON.stringify({ 
        id: 'evt_test', 
        type: 'customer.subscription.created',
        data: { object: {} }
      });
      
      // Create expired timestamp (6 minutes ago)
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 360;
      const signature = `t=${expiredTimestamp},v1=mock_signature`;

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': signature },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid signature');
    });
  });

  describe('webhook idempotency', () => {
    beforeEach(() => {
      // Mock successful signature verification
      vi.spyOn(billingService as any, 'verifyWebhookSignature').mockResolvedValue(true);
    });

    it('should detect duplicate webhook events', async () => {
      const eventId = 'evt_test_123';
      
      // Mock that event already exists in database
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue({ id: 'existing' });

      const payload = JSON.stringify({
        id: eventId,
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.processed).toBe(true);
    });

    it('should mark new events as processed', async () => {
      const eventId = 'evt_new_123';
      
      // Mock that event doesn't exist yet
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null);
      
      // Mock successful webhook processing
      vi.spyOn(billingService as any, 'handleWebhookEvent').mockResolvedValue(undefined);

      const payload = JSON.stringify({
        id: eventId,
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      await billingService.processWebhook(request);
      
      // Verify event was marked as processed
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO webhook_events')
      );
    });
  });

  describe('webhook retry logic', () => {
    beforeEach(() => {
      vi.spyOn(billingService as any, 'verifyWebhookSignature').mockResolvedValue(true);
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null); // New event
    });

    it('should retry failed webhook processing', async () => {
      const handleWebhookSpy = vi.spyOn(billingService as any, 'handleWebhookEvent')
        .mockRejectedValueOnce(new Error('Database timeout'))
        .mockRejectedValueOnce(new Error('Database timeout'))
        .mockResolvedValueOnce(undefined); // Success on third try

      const payload = JSON.stringify({
        id: 'evt_retry_test',
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(200);
      expect(handleWebhookSpy).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retries', async () => {
      vi.spyOn(billingService as any, 'handleWebhookEvent')
        .mockRejectedValue(new Error('Persistent failure'));

      const payload = JSON.stringify({
        id: 'evt_fail_test',
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Webhook Error');
    });
  });

  describe('subscription creation handling', () => {
    beforeEach(() => {
      vi.spyOn(billingService as any, 'verifyWebhookSignature').mockResolvedValue(true);
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null); // New event
    });

    it('should handle subscription creation successfully', async () => {
      // Mock user lookup
      (mockEnv.DB.prepare().bind().first as any)
        .mockResolvedValueOnce(null) // Event idempotency check
        .mockResolvedValueOnce({ // User lookup
          id: 'user_123',
          email: 'test@example.com',
          tier: 'trial'
        });

      // Mock batch operation
      (mockEnv.DB.batch as any).mockResolvedValue([{ success: true }]);

      const payload = JSON.stringify({
        id: 'evt_sub_created',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            customer_email: 'test@example.com',
            items: {
              data: [{ price: { id: 'price_basic_monthly' } }]
            }
          }
        }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(200);
      expect(mockEnv.DB.batch).toHaveBeenCalled();
    });

    it('should handle missing customer email', async () => {
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null);

      const payload = JSON.stringify({
        id: 'evt_no_email',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            // Missing customer_email
            items: {
              data: [{ price: { id: 'price_basic_monthly' } }]
            }
          }
        }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Webhook Error');
    });

    it('should handle user not found', async () => {
      (mockEnv.DB.prepare().bind().first as any)
        .mockResolvedValueOnce(null) // Event idempotency check
        .mockResolvedValueOnce(null); // User not found

      const payload = JSON.stringify({
        id: 'evt_no_user',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            customer_email: 'nonexistent@example.com',
            items: {
              data: [{ price: { id: 'price_basic_monthly' } }]
            }
          }
        }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      const response = await billingService.processWebhook(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('metrics tracking', () => {
    it('should track successful webhook processing', async () => {
      vi.spyOn(billingService as any, 'verifyWebhookSignature').mockResolvedValue(true);
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null);
      vi.spyOn(billingService as any, 'handleWebhookEvent').mockResolvedValue(undefined);

      const payload = JSON.stringify({
        id: 'evt_metrics',
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      await billingService.processWebhook(request);
      
      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringMatching(/^webhook_metric:/),
        expect.stringContaining('"result":"success"'),
        expect.objectContaining({ expirationTtl: 7 * 24 * 60 * 60 })
      );
    });

    it('should track failed webhook processing', async () => {
      vi.spyOn(billingService as any, 'verifyWebhookSignature').mockResolvedValue(true);
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null);
      vi.spyOn(billingService as any, 'handleWebhookEvent').mockRejectedValue(new Error('Test error'));

      const payload = JSON.stringify({
        id: 'evt_fail_metrics',
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      await billingService.processWebhook(request);
      
      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringMatching(/^webhook_metric:/),
        expect.stringContaining('"result":"failure"'),
        expect.any(Object)
      );
    });
  });

  describe('trial management', () => {
    it('should process expired trials correctly', async () => {
      const expiredTrials = [
        { id: 'user_1', email: 'user1@example.com', tier: 'trial' },
        { id: 'user_2', email: 'user2@example.com', tier: 'trial' }
      ];

      (mockEnv.DB.prepare().all as any).mockResolvedValue({
        results: expiredTrials
      });

      await billingService.processExpiredTrials();
      
      // Verify users were downgraded to free
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users')
      );
      expect(mockEnv.DB.prepare().bind().run).toHaveBeenCalledTimes(2);
    });

    it('should send trial ending reminders', async () => {
      const expiringTrials = [
        { id: 'user_1', email: 'user1@example.com', trial_end: '2025-01-22T00:00:00Z' }
      ];

      (mockEnv.DB.prepare().all as any).mockResolvedValue({
        results: expiringTrials
      });

      await billingService.sendTrialEndingReminders();
      
      // Verify reminder flag was set
      expect(mockEnv.DB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('trial_reminder_sent = 1')
      );
    });
  });

  describe('error handling', () => {
    it('should store failed webhook events for analysis', async () => {
      vi.spyOn(billingService as any, 'verifyWebhookSignature').mockResolvedValue(true);
      (mockEnv.DB.prepare().bind().first as any).mockResolvedValue(null);
      vi.spyOn(billingService as any, 'handleWebhookEvent').mockRejectedValue(new Error('Database error'));

      const payload = JSON.stringify({
        id: 'evt_error_store',
        type: 'customer.subscription.created',
        data: { object: {} }
      });

      const request = new Request('https://example.com/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 't=123,v1=sig' },
        body: payload
      });

      await billingService.processWebhook(request);
      
      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringMatching(/^failed_webhook:/),
        expect.stringContaining('"error":"Database error"'),
        expect.objectContaining({ expirationTtl: 30 * 24 * 60 * 60 })
      );
    });
  });
}); 