import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleScheduled, SchedulerJobs, SchedulerStorage } from '../workers/scheduler';
import { DataValidator } from '../lib/dataValidation';

// Mock environment for testing
const mockEnv = {
  DB: {} as D1Database,
  KV_ASTRO: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  KV_CONTENT: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  KV_METRICS: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  KV_I18N: {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  } as any,
  R2_TEMPLATES: {} as R2Bucket,
  R2_LOGS: {} as R2Bucket,
  GROK_API_KEY: 'test-grok-key',
  OPENAI_API_KEY: 'test-openai-key',
  RESEND_API_KEY: 'test-resend-key',
  STRIPE_SECRET_KEY: 'test-stripe-key',
      STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: 'test-webhook-secret-sub',
    STRIPE_WEBHOOK_SECRET_PAYMENT: 'test-webhook-secret-pay',
    STRIPE_BASIC_PAYMENT_LINK: 'https://test.stripe.com/basic',
    STRIPE_PRO_PAYMENT_LINK: 'https://test.stripe.com/pro',
  NEWSAPI_KEY: 'test-news-key',
  HMAC_SECRET: 'test-hmac-secret',
  JWT_SECRET: 'test-jwt-secret',
  NODE_ENV: 'test',
  LOG_LEVEL: 'debug',
  FRONTEND_DOMAIN: 'localhost:3000'
};

// Mock database client
const mockDbClient = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue({})
    })
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue({})
  })
};

vi.mock('../db/client', () => ({
  createDatabaseClient: vi.fn(() => mockDbClient)
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Scheduler Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Circuit Breaker', () => {
    it('should allow calls when circuit is closed', async () => {
      const jobs = new SchedulerJobs(mockEnv);
      
      // Mock successful NASA JPL response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock ephemeris data')
      });

      await expect(jobs.handleEphemerisFetch(mockEnv)).resolves.not.toThrow();
    });

    it('should open circuit after multiple failures', async () => {
      const jobs = new SchedulerJobs(mockEnv);
      
      // Mock failed responses
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(jobs.handleEphemerisFetch(mockEnv)).rejects.toThrow();
    });
  });

  describe('Ephemeris Data Handling', () => {
    it('should fetch and store ephemeris data successfully', async () => {
      const jobs = new SchedulerJobs(mockEnv);
      
      // Mock successful NASA JPL response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock ephemeris data')
      });

      await jobs.handleEphemerisFetch(mockEnv);

      expect(mockEnv.KV_ASTRO.put).toHaveBeenCalled();
      expect(mockDbClient.insert).toHaveBeenCalled();
    });

    it('should fallback to Swiss Ephemeris on NASA failure', async () => {
      const jobs = new SchedulerJobs(mockEnv);
      
      // Mock NASA failure, Swiss success
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('NASA JPL error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            bodies: { sun: { longitude: 300, latitude: 0, distance: 1.0, speed: 1.0, retrograde: false } },
            aspects: []
          })
        });

      await jobs.handleEphemerisFetch(mockEnv);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockEnv.KV_ASTRO.put).toHaveBeenCalled();
    });
  });

  describe('News Data Handling', () => {
    it('should fetch and store news data successfully', async () => {
      const jobs = new SchedulerJobs(mockEnv);
      
      const mockNewsResponse = {
        status: 'ok',
        totalResults: 10,
        articles: [
          {
            title: 'Test Article',
            description: 'Test description for article content',
            url: 'https://example.com/article',
            source: { name: 'Test Source' }
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNewsResponse)
      });

      await jobs.handleNewsFetch(mockEnv);

      expect(mockDbClient.insert).toHaveBeenCalled();
    });

    it('should handle news API failures gracefully', async () => {
      const jobs = new SchedulerJobs(mockEnv);
      
      (global.fetch as any).mockRejectedValueOnce(new Error('News API error'));

      await expect(jobs.handleNewsFetch(mockEnv)).rejects.toThrow();
      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringContaining('job_execution:news_fetch'),
        expect.stringContaining('"status":"failure"'),
        expect.any(Object)
      );
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up old data successfully', async () => {
      const jobs = new SchedulerJobs(mockEnv);

      await jobs.handleCleanup(mockEnv);

      // Should call delete operations for ephemeris, news, and tokens
      expect(mockDbClient.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('Scheduled Event Handler', () => {
    it('should handle ephemeris cron job', async () => {
      const mockEvent = {
        cron: '5 0 * * *',
        scheduledTime: Date.now()
      } as ScheduledEvent;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('mock ephemeris data')
      });

      await handleScheduled(mockEvent, mockEnv);

      expect(mockEnv.KV_ASTRO.put).toHaveBeenCalled();
    });

    it('should handle content generation cron job', async () => {
      const mockEvent = {
        cron: '0 6 * * *',
        scheduledTime: Date.now()
      } as ScheduledEvent;

      await handleScheduled(mockEvent, mockEnv);

      // Should complete without error (placeholder implementation)
      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringContaining('job_execution:content_generation'),
        expect.stringContaining('"status":"success"'),
        expect.any(Object)
      );
    });

    it('should handle unknown cron patterns gracefully', async () => {
      const mockEvent = {
        cron: '0 0 * * *', // Unknown pattern
        scheduledTime: Date.now()
      } as ScheduledEvent;

      await expect(handleScheduled(mockEvent, mockEnv)).resolves.not.toThrow();
    });
  });

  describe('Storage Operations', () => {
    it('should store ephemeris data with correct TTL', async () => {
      const storage = new SchedulerStorage(mockEnv);
      const mockData = {
        date: '2024-01-20',
        bodies: {
          sun: { longitude: 300, latitude: 0, distance: 1.0, speed: 1.0, retrograde: false }
        },
        aspects: []
      };

      await storage.storeEphemeris(mockData);

      expect(mockEnv.KV_ASTRO.put).toHaveBeenCalledWith(
        'astro:2024-01-20',
        JSON.stringify(mockData),
        { expirationTtl: 48 * 60 * 60 }
      );
    });

    it('should record job execution metrics', async () => {
      const storage = new SchedulerStorage(mockEnv);

      await storage.recordJobExecution('test_job', 'success', 1500);

      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringContaining('job_execution:test_job'),
        expect.stringContaining('"status":"success"'),
        { expirationTtl: 7 * 24 * 60 * 60 }
      );
    });
  });
});

describe('Data Validation', () => {
  describe('Ephemeris Data Validation', () => {
    it('should validate correct ephemeris data', () => {
      const validData = {
        date: '2024-01-20',
        bodies: {
          sun: { longitude: 300.5, latitude: 0.1, distance: 1.0, speed: 1.0, retrograde: false },
          moon: { longitude: 45.2, latitude: 2.1, distance: 0.0026, speed: 13.2, retrograde: false }
        },
        aspects: [
          { body1: 'sun', body2: 'moon', aspect: 'trine', orb: 2.1, exact: false }
        ]
      };

      const result = DataValidator.validateEphemerisData(validData);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid ephemeris data', () => {
      const invalidData = {
        date: 'invalid-date',
        bodies: {
          sun: { longitude: 500, latitude: 0.1, distance: 1.0, speed: 1.0, retrograde: false }
        },
        aspects: []
      };

      const result = DataValidator.validateEphemerisData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should detect missing required celestial bodies', () => {
      const incompleteData = {
        date: '2024-01-20',
        bodies: {
          sun: { longitude: 300.5, latitude: 0.1, distance: 1.0, speed: 1.0, retrograde: false }
          // Missing moon and other required bodies
        },
        aspects: []
      };

      const result = DataValidator.validateEphemerisData(incompleteData);

      expect(result.isValid).toBe(false);
      expect(result.errors?.[0]).toContain('Missing required celestial bodies');
    });
  });

  describe('News Data Validation', () => {
    it('should validate correct news data', () => {
      const validNewsData = {
        status: 'ok' as const,
        totalResults: 5,
        articles: [
          {
            title: 'Science breakthrough in astronomy',
            description: 'Researchers have made significant discoveries about planetary motion',
            url: 'https://example.com/article1',
            source: { name: 'Science News' }
          },
          {
            title: 'Technology advances in space observation',
            description: 'New telescopes provide better celestial data for researchers worldwide',
            url: 'https://example.com/article2',
            source: { name: 'Tech Today' }
          },
          {
            title: 'Business impact of astronomical research',
            description: 'Space industry sees growth with new astronomical discoveries and innovations',
            url: 'https://example.com/article3',
            source: { name: 'Business Weekly' }
          },
          {
            title: 'Health benefits of understanding cosmic cycles',
            description: 'Studies show correlation between cosmic awareness and mental wellness practices',
            url: 'https://example.com/article4',
            source: { name: 'Health Today' }
          },
          {
            title: 'Research reveals new planetary discovery',
            description: 'Scientists discover exoplanet with potential for supporting life forms',
            url: 'https://example.com/article5',
            source: { name: 'Research Journal' }
          }
        ]
      };

      const result = DataValidator.validateNewsData(validNewsData);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validNewsData);
    });

    it('should reject news data with insufficient articles', () => {
      const insufficientData = {
        status: 'ok' as const,
        totalResults: 2,
        articles: [
          {
            title: 'Short article',
            description: 'Short description',
            url: 'https://example.com/article1',
            source: { name: 'Source' }
          }
        ]
      };

      const result = DataValidator.validateNewsData(insufficientData);

      expect(result.isValid).toBe(false);
      expect(result.errors?.[0]).toContain('Insufficient number of articles');
    });

    it('should detect low quality articles', () => {
      const lowQualityData = {
        status: 'ok' as const,
        totalResults: 5,
        articles: Array(5).fill({
          title: 'Bad article',
          description: 'Short', // Too short
          url: 'https://localhost/bad', // Suspicious URL
          source: undefined // Missing source
        })
      };

      const result = DataValidator.validateNewsData(lowQualityData);

      expect(result.isValid).toBe(false);
      expect(result.errors?.some(error => error.includes('quality issues'))).toBe(true);
    });
  });

  describe('Data Freshness', () => {
    it('should identify fresh data', () => {
      const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago
      const isFresh = DataValidator.calculateDataFreshness(recentTime, 1); // 1 hour max age

      expect(isFresh).toBe(true);
    });

    it('should identify stale data', () => {
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const isFresh = DataValidator.calculateDataFreshness(oldTime, 1); // 1 hour max age

      expect(isFresh).toBe(false);
    });
  });

  describe('Astronomical Accuracy', () => {
    it('should pass accuracy checks for valid astronomical data', () => {
      const validEphemeris = {
        date: '2024-01-20',
        bodies: {
          sun: { longitude: 300.5, latitude: 0.1, distance: 1.0, speed: 1.0, retrograde: false },
          moon: { longitude: 45.2, latitude: 2.1, distance: 0.0025, speed: 13.2, retrograde: false },
          mercury: { longitude: 310.0, latitude: 1.0, distance: 0.4, speed: 1.6, retrograde: false },
          venus: { longitude: 280.0, latitude: 2.0, distance: 0.7, speed: 1.2, retrograde: false }
        }
      };

      const result = DataValidator.validateAstronomicalAccuracy(validEphemeris);

      expect(result.isAccurate).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should detect astronomical inaccuracies', () => {
      const inaccurateEphemeris = {
        date: '2024-01-20',
        bodies: {
          sun: { longitude: 300.5, latitude: 5.0, distance: 1.0, speed: 1.0, retrograde: false }, // Bad latitude
          moon: { longitude: 45.2, latitude: 2.1, distance: 0.01, speed: 13.2, retrograde: false }, // Bad distance
          mercury: { longitude: 100.0, latitude: 1.0, distance: 0.4, speed: 1.6, retrograde: false } // Too far from sun
        }
      };

      const result = DataValidator.validateAstronomicalAccuracy(inaccurateEphemeris);

      expect(result.isAccurate).toBe(false);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });

  describe('Content Filtering', () => {
    it('should filter profane content', () => {
      const profaneText = 'This contains badword1 and other content';
      const filtered = DataValidator.filterProfaneContent(profaneText);

      expect(filtered).not.toContain('badword1');
      expect(filtered).toContain('*******'); // Replaced with asterisks
    });

    it('should detect duplicate content', () => {
      const newContent = 'This is some sample content about astronomical discoveries';
      const existingContent = [
        'Different content about other topics',
        'This has sample content about astronomical research' // Similar content
      ];

      const isDuplicate = DataValidator.detectDuplicateContent(newContent, existingContent);

      expect(isDuplicate).toBe(true);
    });

    it('should not flag unique content as duplicate', () => {
      const newContent = 'Completely unique content about space exploration';
      const existingContent = [
        'Different article about business news',
        'Another article about technology trends'
      ];

      const isDuplicate = DataValidator.detectDuplicateContent(newContent, existingContent);

      expect(isDuplicate).toBe(false);
    });
  });
}); 