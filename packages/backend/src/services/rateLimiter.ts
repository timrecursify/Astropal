import { logger } from '@/lib/logger';
import { generateId, DatabaseClient } from '@/db/client';
import { rateLimits } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxAttempts: number;  // Maximum attempts per window
  keyPrefix: string;    // Prefix for rate limit keys
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
  totalHits: number;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public remainingTime: number,
    public totalHits: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Pre-configured rate limit rules
export const RATE_LIMITS = {
  // Signup rate limits
  SIGNUP_EMAIL: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxAttempts: 1,
    keyPrefix: 'signup:email'
  },
  SIGNUP_IP: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 5,
    keyPrefix: 'signup:ip'
  },
  
  // API rate limits
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    keyPrefix: 'api:general'
  },
  API_AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 20,
    keyPrefix: 'api:auth'
  },
  
  // Email action rate limits
  EMAIL_ACTIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 10,
    keyPrefix: 'email:actions'
  }
} as const;

export class RateLimiter {
  constructor(
    private db: DatabaseClient,
    private kvStore: KVNamespace
  ) {}

  /**
   * Check and record rate limit attempt
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
    context: string = 'api'
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix}:${identifier}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    try {
      logger.debug('Checking rate limit', {
        key: key.substring(0, 20) + '...',
        windowMs: config.windowMs,
        maxAttempts: config.maxAttempts,
        context,
        component: 'rate-limiter'
      });

      // Clean up expired entries first
      await this.cleanupExpiredLimits();

      // Get current rate limit record
      const existing = await this.db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.key, key))
        .limit(1);

      let currentCount = 0;
      let resetTime = new Date(now.getTime() + config.windowMs);

      if (existing.length > 0) {
        const record = existing[0];
        const recordWindowStart = new Date(record.windowStart);
        
        // Check if we're still in the same window
        if (recordWindowStart > windowStart) {
          currentCount = record.count;
          resetTime = new Date(record.expiresAt);
        } else {
          // Window has expired, reset counter
          currentCount = 0;
          await this.db
            .delete(rateLimits)
            .where(eq(rateLimits.key, key));
        }
      }

      // Check if limit exceeded
      if (currentCount >= config.maxAttempts) {
        logger.warn('Rate limit exceeded', {
          key: key.substring(0, 20) + '...',
          currentCount,
          maxAttempts: config.maxAttempts,
          resetTime: resetTime.toISOString(),
          context,
          component: 'rate-limiter'
        });

        throw new RateLimitError(
          `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
          resetTime.getTime() - now.getTime(),
          currentCount
        );
      }

      // Increment counter
      const newCount = currentCount + 1;
      
      if (currentCount === 0) {
        // Create new record
        await this.db
          .insert(rateLimits)
          .values({
            id: generateId(),
            key,
            count: newCount,
            windowStart: now.toISOString(),
            expiresAt: resetTime.toISOString()
          });
      } else {
        // Update existing record
        await this.db
          .update(rateLimits)
          .set({ 
            count: newCount,
            expiresAt: resetTime.toISOString()
          })
          .where(eq(rateLimits.key, key));
      }

      // Also store in KV for faster access (with TTL)
      const kvData = {
        count: newCount,
        windowStart: now.toISOString(),
        expiresAt: resetTime.toISOString()
      };
      
      await this.kvStore.put(
        `rate_limit:${key}`,
        JSON.stringify(kvData),
        { expirationTtl: Math.ceil(config.windowMs / 1000) }
      );

      const result: RateLimitResult = {
        allowed: true,
        remainingAttempts: config.maxAttempts - newCount,
        resetTime,
        totalHits: newCount
      };

      logger.debug('Rate limit check passed', {
        key: key.substring(0, 20) + '...',
        remainingAttempts: result.remainingAttempts,
        totalHits: newCount,
        context,
        component: 'rate-limiter'
      });

      return result;

    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      logger.error('Rate limit check failed', {
        key: key.substring(0, 20) + '...',
        error: (error as Error).message,
        context,
        component: 'rate-limiter'
      });

      // Fail open - allow request if rate limiter is down
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetTime: new Date(now.getTime() + config.windowMs),
        totalHits: 0
      };
    }
  }

  /**
   * Check rate limit using KV store (faster, less reliable)
   */
  async checkRateLimitKV(
    identifier: string,
    config: RateLimitConfig,
    context: string = 'api'
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${config.keyPrefix}:${identifier}`;
    const now = new Date();
    
    try {
      const existingData = await this.kvStore.get(key);
      
      if (existingData) {
        const data = JSON.parse(existingData);
        const resetTime = new Date(data.expiresAt);
        
        if (data.count >= config.maxAttempts) {
          throw new RateLimitError(
            `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
            resetTime.getTime() - now.getTime(),
            data.count
          );
        }
        
        // Increment counter
        const newCount = data.count + 1;
        data.count = newCount;
        
        await this.kvStore.put(
          key,
          JSON.stringify(data),
          { expirationTtl: Math.ceil(config.windowMs / 1000) }
        );
        
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts - newCount,
          resetTime,
          totalHits: newCount
        };
      } else {
        // First request in window
        const resetTime = new Date(now.getTime() + config.windowMs);
        const data = {
          count: 1,
          windowStart: now.toISOString(),
          expiresAt: resetTime.toISOString()
        };
        
        await this.kvStore.put(
          key,
          JSON.stringify(data),
          { expirationTtl: Math.ceil(config.windowMs / 1000) }
        );
        
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts - 1,
          resetTime,
          totalHits: 1
        };
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      logger.error('KV rate limit check failed', {
        key: key.substring(0, 20) + '...',
        error: (error as Error).message,
        context,
        component: 'rate-limiter'
      });

      // Fail open
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetTime: new Date(now.getTime() + config.windowMs),
        totalHits: 0
      };
    }
  }

  /**
   * Reset rate limit for specific key
   */
  async resetRateLimit(identifier: string, keyPrefix: string): Promise<void> {
    const key = `${keyPrefix}:${identifier}`;
    
    try {
      await this.db
        .delete(rateLimits)
        .where(eq(rateLimits.key, key));
        
      await this.kvStore.delete(`rate_limit:${key}`);
      
      logger.info('Rate limit reset', {
        key: key.substring(0, 20) + '...',
        component: 'rate-limiter'
      });
    } catch (error) {
      logger.error('Failed to reset rate limit', {
        key: key.substring(0, 20) + '...',
        error: (error as Error).message,
        component: 'rate-limiter'
      });
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  private async cleanupExpiredLimits(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const deleted = await this.db
        .delete(rateLimits)
        .where(lt(rateLimits.expiresAt, now));

      // D1 delete operations don't return change count reliably
      logger.debug('Cleaned up expired rate limits', {
        component: 'rate-limiter'
      });
    } catch (error) {
      logger.warn('Failed to cleanup expired rate limits', {
        error: (error as Error).message,
        component: 'rate-limiter'
      });
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix}:${identifier}`;
    const now = new Date();
    
    try {
      const existing = await this.db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.key, key))
        .limit(1);

      if (existing.length === 0) {
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts,
          resetTime: new Date(now.getTime() + config.windowMs),
          totalHits: 0
        };
      }

      const record = existing[0];
      const resetTime = new Date(record.expiresAt);
      
      return {
        allowed: record.count < config.maxAttempts,
        remainingAttempts: Math.max(0, config.maxAttempts - record.count),
        resetTime,
        totalHits: record.count
      };
    } catch (error) {
      logger.error('Failed to get rate limit status', {
        key: key.substring(0, 20) + '...',
        error: (error as Error).message,
        component: 'rate-limiter'
      });

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetTime: new Date(now.getTime() + config.windowMs),
        totalHits: 0
      };
    }
  }
}

// Utility functions for common rate limiting scenarios
export async function checkSignupRateLimit(
  rateLimiter: RateLimiter,
  email: string,
  ipAddress: string
): Promise<void> {
  // Check email-based rate limit (1 per 24 hours)
  await rateLimiter.checkRateLimit(
    email.toLowerCase(),
    RATE_LIMITS.SIGNUP_EMAIL,
    'signup_email'
  );

  // Check IP-based rate limit (5 per hour)
  await rateLimiter.checkRateLimit(
    ipAddress,
    RATE_LIMITS.SIGNUP_IP,
    'signup_ip'
  );
}

export function getRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxAttempts.toString(),
    'X-RateLimit-Remaining': result.remainingAttempts.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
    'X-RateLimit-Window': Math.ceil(config.windowMs / 1000).toString()
  };
} 