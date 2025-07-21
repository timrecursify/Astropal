import { logger } from '@/lib/logger';
import { createDatabaseClient } from '@/db/client';
import { ephemerisCache, newsCache, subscriptionTokens, users } from '@/db/schema';
import * as schema from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import type { Env } from '../index';

// Ephemeris data interface
export interface EphemerisData {
  date: string;
  bodies: {
    [bodyName: string]: {
      longitude: number;
      latitude: number;
      distance: number;
      speed: number;
      retrograde: boolean;
    };
  };
  aspects: AspectData[];
}

interface AspectData {
  body1: string;
  body2: string;
  aspect: string;
  orb: number;
  exact: boolean;
}

// Helper function to retrieve and decompress ephemeris data from KV
async function getEphemerisFromKV(kvStore: KVNamespace, key: string): Promise<EphemerisData | null> {
  const result = await kvStore.getWithMetadata(key);
  
  if (!result.value) {
    return null;
  }

  try {
    // Check if data is compressed
    const metadata = result.metadata as { compressed?: boolean; originalSize?: number } | null;
    
    if (metadata?.compressed) {
      // Decompress using gzip
      const decompressed = new Response(result.value as unknown as ArrayBuffer)
        .body?.pipeThrough(new DecompressionStream('gzip'));
      
      if (decompressed) {
        const decompressedText = await new Response(decompressed).text();
        return JSON.parse(decompressedText);
      }
    }
    
    // Data is not compressed, parse directly
    const textData = typeof result.value === 'string' 
      ? result.value 
      : new TextDecoder().decode(result.value as ArrayBuffer);
    
    return JSON.parse(textData);
  } catch (error) {
    logger.error('Failed to decompress/parse ephemeris data', {
      key,
      error: (error as Error).message,
      component: 'scheduler-storage'
    });
    return null;
  }
}

// Circuit breaker for external APIs
class CircuitBreaker {
  private failureCount = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private threshold = 3;
  private timeout = 60000; // 1 minute

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailure = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened', {
        failures: this.failureCount,
        component: 'circuit-breaker'
      });
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
}

// NASA JPL Horizons API client
class EphemerisClient {
  private circuitBreaker = new CircuitBreaker();

  async fetchEphemeris(startDate: string, endDate: string): Promise<EphemerisData> {
    return this.circuitBreaker.call(async () => {
      const startTime = Date.now();
      
      logger.info('Fetching ephemeris data', {
        startDate,
        endDate,
        provider: 'nasa-jpl',
        component: 'ephemeris-client'
      });

      try {
        // NASA JPL Horizons API call
        const response = await fetch('https://ssd.jpl.nasa.gov/api/horizons.api', {
          method: 'GET',
          headers: {
            'User-Agent': 'Astropal/1.0 (contact@astropal.com)'
          },
          // NASA JPL API params
          // Note: This is a simplified version - real implementation would use proper API params
        });

        if (!response.ok) {
          throw new Error(`NASA JPL API error: ${response.status}`);
        }

        const rawData = await response.text();
        const ephemerisData = this.parseNASAData(rawData, startDate);

        const duration = Date.now() - startTime;
        logger.info('Ephemeris data fetched successfully', {
          provider: 'nasa-jpl',
          duration,
          dataSize: rawData.length,
          component: 'ephemeris-client'
        });

        return ephemerisData;
      } catch (error) {
        logger.error('NASA JPL fetch failed, trying Swiss Ephemeris', {
          error: (error as Error).message,
          component: 'ephemeris-client'
        });
        
        return this.fetchSwissEphemeris(startDate, endDate);
      }
    });
  }

  private async fetchSwissEphemeris(startDate: string, endDate: string): Promise<EphemerisData> {
    const startTime = Date.now();
    
    logger.info('Falling back to Swiss Ephemeris', {
      startDate,
      endDate,
      provider: 'swiss-ephemeris',
      component: 'ephemeris-client'
    });

    // Swiss Ephemeris fallback implementation
    // This would use a different API or service
    const response = await fetch('https://api.swiss-ephemeris.com/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fallback-key'
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        bodies: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Swiss Ephemeris API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const duration = Date.now() - startTime;
    
    logger.info('Swiss Ephemeris data fetched', {
      provider: 'swiss-ephemeris',
      duration,
      component: 'ephemeris-client'
    });

    return this.parseSwissData(data, startDate);
  }

  private parseNASAData(rawData: string, date: string): EphemerisData {
    // Simplified parser - real implementation would parse NASA JPL format
    const bodies: EphemerisData['bodies'] = {
      sun: { longitude: 300.5, latitude: 0, distance: 1.0, speed: 1.0, retrograde: false },
      moon: { longitude: 45.2, latitude: 2.1, distance: 0.0026, speed: 13.2, retrograde: false },
      mercury: { longitude: 280.3, latitude: 1.2, distance: 0.4, speed: 1.6, retrograde: false }
      // ... other planets
    };

    const aspects: AspectData[] = [
      { body1: 'sun', body2: 'moon', aspect: 'trine', orb: 2.1, exact: false }
    ];

    return { date, bodies, aspects };
  }

  private parseSwissData(data: any, date: string): EphemerisData {
    // Parse Swiss Ephemeris format
    return {
      date,
      bodies: data.bodies || {},
      aspects: data.aspects || []
    };
  }
}

// News API client for Pro tier
class NewsClient {
  private circuitBreaker = new CircuitBreaker();

  async fetchNews(apiKey: string): Promise<any[]> {
    return this.circuitBreaker.call(async () => {
      const startTime = Date.now();
      
      logger.info('Fetching news data', {
        provider: 'newsapi',
        component: 'news-client'
      });

      const response = await fetch('https://newsapi.org/v2/top-headlines', {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json() as { articles?: any[] };
      const duration = Date.now() - startTime;
      
      logger.info('News data fetched', {
        articleCount: data.articles?.length || 0,
        duration,
        component: 'news-client'
      });

      return data.articles || [];
    });
  }
}

// Storage utilities
export class SchedulerStorage {
  private db: any;
  private kv: {
    astro: KVNamespace;
    content: KVNamespace;
    metrics: KVNamespace;
  };

  constructor(env: Env) {
    this.db = createDatabaseClient(env.DB);
    this.kv = {
      astro: env.KV_ASTRO,
      content: env.KV_CONTENT,
      metrics: env.KV_METRICS
    };
  }

  async storeEphemeris(data: EphemerisData): Promise<void> {
    const key = `astro:${data.date}`;
    const jsonData = JSON.stringify(data);
    
    // Compress data using gzip for KV storage efficiency
    const compressed = new Response(jsonData).body?.pipeThrough(new CompressionStream('gzip'));
    const compressedData = compressed ? await new Response(compressed).arrayBuffer() : null;
    
    const originalSize = jsonData.length;
    const compressedSize = compressedData?.byteLength || originalSize;
    const compressionRatio = compressedSize / originalSize;
    
    logger.info('Storing ephemeris data', {
      key,
      originalSize,
      compressedSize,
      compressionRatio: Math.round(compressionRatio * 100),
      component: 'scheduler-storage'
    });

    // Store compressed data in KV with 48h TTL
    if (compressedData && compressionRatio < 0.8) {
      // Use compression if we save at least 20%
      await this.kv.astro.put(key, compressedData, {
        expirationTtl: 48 * 60 * 60, // 48 hours
        metadata: { compressed: true, originalSize }
      });
    } else {
      // Store uncompressed if compression isn't beneficial
      await this.kv.astro.put(key, jsonData, {
        expirationTtl: 48 * 60 * 60 // 48 hours
      });
    }

    // Store in D1 for historical access
    await this.db.insert(ephemerisCache).values({
      date: data.date,
      jsonData: JSON.stringify(data),
      source: 'nasa_jpl',
      fetchedAt: new Date().toISOString()
    }).onConflictDoUpdate({
      target: ephemerisCache.date,
      set: {
        jsonData: JSON.stringify(data),
        source: 'nasa_jpl',
        fetchedAt: new Date().toISOString()
      }
    });

    logger.info('Ephemeris data stored successfully', {
      key,
      component: 'scheduler-storage'
    });
  }



  async storeNews(articles: any[], category: string): Promise<void> {
    logger.info('Storing news articles', {
      count: articles.length,
      category,
      component: 'scheduler-storage'
    });

    for (const article of articles) {
      await this.db.insert(newsCache).values({
        id: article.id || `${Date.now()}-${Math.random()}`,
        date: new Date().toISOString().split('T')[0],
        headline: article.title,
        summary: article.description,
        url: article.url,
        source: article.source?.name || 'newsapi',
        category,
        fetchedAt: new Date().toISOString()
      }).onConflictDoUpdate({
        target: newsCache.id,
        set: {
          headline: article.title,
          summary: article.description,
          url: article.url,
          source: article.source?.name || 'newsapi',
          category,
          fetchedAt: new Date().toISOString()
        }
      });
    }

    logger.info('News articles stored successfully', {
      count: articles.length,
      category,
      component: 'scheduler-storage'
    });
  }

  async recordJobExecution(jobType: string, status: 'success' | 'failure', duration: number, error?: string): Promise<void> {
    const key = `job_execution:${jobType}:${Date.now()}`;
    const data = {
      jobType,
      status,
      duration,
      error,
      timestamp: new Date().toISOString()
    };

    await this.kv.metrics.put(key, JSON.stringify(data), {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days
    });

    logger.info('Job execution recorded', {
      jobType,
      status,
      duration,
      component: 'scheduler-storage'
    });
  }
}

// Main cron job handlers
export class SchedulerJobs {
  private ephemerisClient = new EphemerisClient();
  private newsClient = new NewsClient();
  private storage: SchedulerStorage;

  constructor(env: Env) {
    this.storage = new SchedulerStorage(env);
  }

  async handleEphemerisFetch(env: Env): Promise<void> {
    const jobId = `ephemeris-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('Ephemeris fetch job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startDate = today.toISOString().split('T')[0];
      const endDate = tomorrow.toISOString().split('T')[0];

      const ephemerisData = await this.ephemerisClient.fetchEphemeris(startDate, endDate);
      await this.storage.storeEphemeris(ephemerisData);

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('ephemeris_fetch', 'success', duration);

      logger.info('Ephemeris fetch job completed successfully', {
        jobId,
        duration,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('ephemeris_fetch', 'failure', duration, (error as Error).message);

      logger.error('Ephemeris fetch job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }

  async handleNewsFetch(env: Env): Promise<void> {
    const jobId = `news-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('News fetch job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      const categories = ['science', 'technology', 'business', 'health'];
      
      for (const category of categories) {
        const articles = await this.newsClient.fetchNews(env.NEWSAPI_KEY);
        await this.storage.storeNews(articles, category);
      }

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('news_fetch', 'success', duration);

      logger.info('News fetch job completed successfully', {
        jobId,
        duration,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('news_fetch', 'failure', duration, (error as Error).message);

      logger.error('News fetch job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }

  async handleContentGeneration(env: Env): Promise<void> {
    const jobId = `content-gen-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('Content generation job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      // Get ephemeris data for today
      const today = new Date().toISOString().split('T')[0];
      const ephemerisKey = `astro:${today}`;
      
      const ephemerisData = await getEphemerisFromKV(env.KV_ASTRO, ephemerisKey);
      
      if (!ephemerisData) {
        throw new Error('No ephemeris data available for content generation');
      }
      
      // Get news context for Pro tier users
      const db = createDatabaseClient(env.DB);
      const newsArticles = await db.select()
        .from(newsCache)
        .where(eq(newsCache.date, today))
        .limit(5);
      
      const newsContext = newsArticles.length > 0 
        ? `Current events: ${newsArticles.map(a => a.headline).join(', ')}`
        : undefined;

      // Get users who need content generated (simplified batch processing)
      const users = await db.select()
        .from(schema.users)
        .where(eq(schema.users.emailStatus, 'active'))
        .limit(100); // Process in batches to avoid timeout

      let generatedCount = 0;
      let failedCount = 0;

      for (const user of users) {
        try {
          const userContext = {
            perspective: user.perspective as 'calm' | 'knowledge' | 'success' | 'evidence',
            focusAreas: JSON.parse(user.focusPreferences || '["wellness"]'),
            tier: user.tier as 'free' | 'basic' | 'pro',
            birthLocation: user.birthLocation,
            timezone: user.timezone,
            sunSign: this.calculateSunSign(user.birthDate),
            risingSign: undefined // Would need full birth chart calculation
          };

          const ephemerisContext = {
            date: today,
            sunPosition: { sign: 'Aquarius', degree: 1.5 }, // Simplified - would calculate from ephemeris
            moonPosition: { sign: 'Cancer', degree: 15.2, phase: 'Waxing Gibbous' },
            majorAspects: (ephemerisData.aspects || []).map(aspect => ({
              planet1: aspect.body1,
              planet2: aspect.body2,
              aspect: aspect.aspect,
              orb: aspect.orb
            })),
            retrogradeActivePlanets: this.getRetrogradePlanets(ephemerisData)
          };

          // Generate content using the service
          const { generateNewsletterContent } = await import('../services/contentGeneration');
          const newsletterContent = await generateNewsletterContent(userContext, ephemerisContext, env, newsContext);
          
          // Schedule email delivery
          if (newsletterContent) {
            await this.scheduleNewsletterEmail(user, newsletterContent, env);
          }
          
          generatedCount++;
          
        } catch (error) {
          failedCount++;
          logger.warn('Content generation failed for user', {
            userId: user.id,
            error: (error as Error).message,
            component: 'scheduler-jobs'
          });
        }
      }

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('content_generation', 'success', duration);

      logger.info('Content generation job completed successfully', {
        jobId,
        duration,
        usersProcessed: users.length,
        generatedCount,
        failedCount,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('content_generation', 'failure', duration, (error as Error).message);

      logger.error('Content generation job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }

  private calculateSunSign(birthDate: string): string {
    // Simplified sun sign calculation - in production would use proper ephemeris calculation
    const month = parseInt(birthDate.split('-')[1]);
    const day = parseInt(birthDate.split('-')[2]);
    
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  private getRetrogradePlanets(ephemerisData: any): string[] {
    // Extract retrograde planets from ephemeris data
    const retrogrades: string[] = [];
    
    if (ephemerisData.bodies) {
      Object.entries(ephemerisData.bodies).forEach(([planet, data]: [string, any]) => {
        if (data.retrograde) {
          retrogrades.push(planet);
        }
      });
    }
    
    return retrogrades;
  }
  
  async scheduleNewsletterEmail(user: any, content: any, env: Env): Promise<void> {
    try {
      // Import email worker to schedule email delivery
      const { createEmailWorker } = await import('./emailWorker');
      const emailWorker = createEmailWorker(env);
      
      // Prepare email template data
      const templateData = {
        userName: user.email.split('@')[0], // Use email prefix as name
        userEmail: user.email,
        perspective: user.perspective,
        tier: user.tier,
        focusAreas: JSON.parse(user.focusPreferences || '[]'),
        subject: content.subject,
        preheader: content.preheader,
        sections: content.sections,
        shareableSnippet: content.shareableSnippet,
        accountUrl: `https://astropal.com/account?token=${user.authToken}`,
        changePerspectiveUrl: `https://astropal.com/perspective?token=${user.authToken}`,
        updatePreferencesUrl: `https://astropal.com/preferences?token=${user.authToken}`,
        unsubscribeUrl: `https://astropal.com/unsubscribe?token=${user.authToken}`,
        upgradeUrl: user.tier === 'free' ? `https://astropal.com/upgrade?token=${user.authToken}` : undefined,
        cancelUrl: ['basic', 'pro'].includes(user.tier) ? `https://astropal.com/cancel?token=${user.authToken}` : undefined
      };
      
      // Create email job
      const emailJob = {
        id: `newsletter-${user.id}-${Date.now()}`,
        type: 'immediate' as const,
        templateType: 'daily-cosmic-pulse' as const,
        recipientEmail: user.email,
        templateData,
        priority: 'normal' as const
      };
      
      // Process email immediately
      await emailWorker.processEmail(emailJob);
      
      logger.info('Newsletter email scheduled', {
        userId: user.id,
        jobId: emailJob.id,
        component: 'scheduler-email'
      });
      
    } catch (error) {
      logger.error('Failed to schedule newsletter email', {
        userId: user.id,
        error: (error as Error).message,
        component: 'scheduler-email'
      });
    }
  }

  async handleCleanup(env: Env): Promise<void> {
    const jobId = `cleanup-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('Cleanup job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      const db = createDatabaseClient(env.DB);
      
      // Clean up old ephemeris cache (> 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await db.delete(ephemerisCache)
        .where(lt(ephemerisCache.fetchedAt, sevenDaysAgo.toISOString()));

      // Clean up old news cache (> 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      await db.delete(newsCache)
        .where(lt(newsCache.fetchedAt, threeDaysAgo.toISOString()));

      // Clean up expired subscription tokens
      await db.delete(subscriptionTokens)
        .where(lt(subscriptionTokens.expiresAt, new Date().toISOString()));

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('cleanup', 'success', duration);

      logger.info('Cleanup job completed successfully', {
        jobId,
        duration,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('cleanup', 'failure', duration, (error as Error).message);

      logger.error('Cleanup job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }

  /**
   * Handle trial management - process expired trials and send reminders
   */
  async handleTrialManagement(env: Env): Promise<void> {
    const jobId = `trial-management-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('Trial management job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      const { billingService } = await import('../services/billingService');
      const billing = billingService.create({
        DB: env.DB,
        STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION,
        STRIPE_WEBHOOK_SECRET_PAYMENT: env.STRIPE_WEBHOOK_SECRET_PAYMENT,
        STRIPE_BASIC_PAYMENT_LINK: env.STRIPE_BASIC_PAYMENT_LINK,
        STRIPE_PRO_PAYMENT_LINK: env.STRIPE_PRO_PAYMENT_LINK,
        KV_CONTENT: env.KV_CONTENT,
        KV_METRICS: env.KV_METRICS,
        RESEND_API_KEY: env.RESEND_API_KEY
      });

      // Process expired trials (downgrade to free)
      await billing.processExpiredTrials();
      
      // Send trial ending reminders 
      await billing.sendTrialEndingReminders();

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('trial_management', 'success', duration);

      logger.info('Trial management job completed successfully', {
        jobId,
        duration,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('trial_management', 'failure', duration, (error as Error).message);

      logger.error('Trial management job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }

  /**
   * Handle weekly upgrade reminders for free tier users
   */
  async handleUpgradeReminders(env: Env): Promise<void> {
    const jobId = `upgrade-reminders-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('Upgrade reminders job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      const { billingService } = await import('../services/billingService');
      const billing = billingService.create({
        DB: env.DB,
        STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION,
        STRIPE_WEBHOOK_SECRET_PAYMENT: env.STRIPE_WEBHOOK_SECRET_PAYMENT,
        STRIPE_BASIC_PAYMENT_LINK: env.STRIPE_BASIC_PAYMENT_LINK,
        STRIPE_PRO_PAYMENT_LINK: env.STRIPE_PRO_PAYMENT_LINK,
        KV_CONTENT: env.KV_CONTENT,
        KV_METRICS: env.KV_METRICS,
        RESEND_API_KEY: env.RESEND_API_KEY
      });

      // Send weekly upgrade reminders to free users
      await billing.sendWeeklyUpgradeReminders();

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('upgrade_reminders', 'success', duration);

      logger.info('Upgrade reminders job completed successfully', {
        jobId,
        duration,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('upgrade_reminders', 'failure', duration, (error as Error).message);

      logger.error('Upgrade reminders job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }

  /**
   * Handle email queue processing - sends all queued billing emails
   */
  async handleEmailQueueProcessing(env: Env): Promise<void> {
    const jobId = `email-queue-${Date.now()}`;
    const startTime = Date.now();
    
    logger.info('Email queue processing job started', {
      jobId,
      component: 'scheduler-jobs'
    });

    try {
      const { createEmailWorker } = await import('./emailWorker');
      const emailWorker = createEmailWorker(env);
      
      // Process all scheduled emails in queue
      await emailWorker.handleScheduledEmails();

      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('email_queue_processing', 'success', duration);

      logger.info('Email queue processing job completed successfully', {
        jobId,
        duration,
        component: 'scheduler-jobs'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.storage.recordJobExecution('email_queue_processing', 'failure', duration, (error as Error).message);

      logger.error('Email queue processing job failed', {
        jobId,
        error: (error as Error).message,
        duration,
        component: 'scheduler-jobs'
      });

      throw error;
    }
  }
}

// Main scheduled event handler
export async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const jobs = new SchedulerJobs(env);
  const cron = event.cron;
  
  logger.info('Scheduled event triggered', {
    cron,
    scheduledTime: new Date(event.scheduledTime).toISOString(),
    component: 'scheduler'
  });

  try {
    switch (cron) {
      case '5 0 * * *': // Daily ephemeris fetch at 00:05 UTC
        await jobs.handleEphemerisFetch(env);
        break;
        
      case '0 6 * * *': // Morning emails at 06:00 UTC
        await jobs.handleContentGeneration(env);
        break;
        
      case '0 18 * * *': // Evening emails at 18:00 UTC
        await jobs.handleContentGeneration(env);
        break;
        
      case '0 9 * * 1': // Weekly emails on Monday at 09:00 UTC
        await jobs.handleContentGeneration(env);
        break;
        
      case '0 0 1 * *': // Monthly cleanup on 1st at 00:00 UTC
        await jobs.handleCleanup(env);
        break;
        
      case '30 1 * * *': // Daily trial management at 01:30 UTC
        await jobs.handleTrialManagement(env);
        break;
        
      case '0 10 * * 1': // Weekly upgrade reminders on Monday at 10:00 UTC
        await jobs.handleUpgradeReminders(env);
        break;
        
      case '*/5 * * * *': // Process email queue every 5 minutes
        await jobs.handleEmailQueueProcessing(env);
        break;
        
      default:
        logger.warn('Unknown cron pattern', {
          cron,
          component: 'scheduler'
        });
    }
  } catch (error) {
    logger.error('Scheduled job failed', {
      cron,
      error: (error as Error).message,
      component: 'scheduler'
    });
    
    throw error;
  }
} 