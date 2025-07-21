import { logger } from '@/lib/logger';
import { generateId, generateAuthToken, hashAuthToken, DatabaseClient } from '@/db/client';
import { users, signupAttempts, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  RegisterRequest, 
  RegisterResponse,
  validateRequest,
  RegisterRequestSchema,
  ValidationError,
  sanitizeInput
} from '@/lib/validation';
import { RateLimiter, checkSignupRateLimit, RateLimitError } from '@/services/rateLimiter';
import { EmailService } from '@/services/emailService';

export interface CreateUserRequest {
  email: string;
  birthDate: string;
  birthLocation: string;
  birthTime: string;
  timezone: string;
  locale: string;
  perspective: string;
  focusAreas: string[];
  referralCode?: string;
  ipAddress: string;
  userAgent: string;
}

export interface UserProfile {
  id: string;
  email: string;
  tier: string;
  trialEnd: string | null;
  locale: string;
  perspective: string;
  focusAreas: string[];
  createdAt: string;
  lastActivity: string | null;
}

export class UserError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'UserError';
  }
}

export class UserService {
  constructor(
    private db: DatabaseClient,
    private rateLimiter: RateLimiter,
    private emailService: EmailService
  ) {}

  /**
   * Register new user with complete validation and rate limiting
   */
  async registerUser(
    requestData: unknown,
    ipAddress: string,
    userAgent: string
  ): Promise<RegisterResponse> {
    const startTime = Date.now();
    const traceId = generateId();
    
    try {
      logger.info('User registration started', {
        ipAddress,
        userAgent: userAgent.substring(0, 100),
        traceId,
        component: 'user-service'
      });

      // Validate request data
      const validatedData = validateRequest(
        RegisterRequestSchema,
        requestData,
        'user_registration'
      );

      // Sanitize inputs
      const cleanEmail = validatedData.email.toLowerCase().trim();
      const cleanBirthLocation = sanitizeInput(validatedData.birthLocation);

      // Check rate limits first
      await checkSignupRateLimit(this.rateLimiter, cleanEmail, ipAddress);

      // Check if user already exists
      const existingUser = await this.db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);

      if (existingUser.length > 0) {
        await this.logSignupAttempt({
          email: cleanEmail,
          ipAddress,
          userAgent,
          status: 'duplicate'
        });

        throw new UserError(
          'An account with this email already exists',
          'EMAIL_EXISTS',
          409
        );
      }

      // Generate user data
      const userId = generateId();
      const authToken = generateAuthToken();
      const hashedToken = await hashAuthToken(authToken);
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

      // Create user in database
      const newUser = {
        id: userId,
        email: cleanEmail,
        authToken: hashedToken,
        birthDate: validatedData.birthDate,
        birthLocation: cleanBirthLocation,
        birthTime: validatedData.birthTime,
        timezone: validatedData.timezone,
        locale: validatedData.locale,
        perspective: validatedData.perspective,
        focusPreferences: JSON.stringify(validatedData.focusAreas),
        tier: 'trial' as const,
        trialEnd: trialEndDate.toISOString(),
        referralCode: validatedData.referralCode || null,
        lastActivity: new Date().toISOString()
      };

      await this.db.insert(users).values(newUser);

      // Log successful signup
      await this.logSignupAttempt({
        email: cleanEmail,
        ipAddress,
        userAgent,
        status: 'success'
      });

      // Send welcome email
      const userName = cleanEmail.split('@')[0]; // Use email prefix as name
      const emailResult = await this.emailService.sendWelcomeEmail(
        cleanEmail,
        userName,
        authToken, // Pass plaintext token for email
        userId
      );

      if (!emailResult.success) {
        logger.warn('Welcome email failed to send', {
          userId,
          email: cleanEmail,
          error: emailResult.error,
          traceId,
          component: 'user-service'
        });
      }

      const duration = Date.now() - startTime;
      
      logger.info('User registration completed', {
        userId,
        email: cleanEmail,
        tier: 'trial',
        trialEnd: trialEndDate.toISOString(),
        emailSent: emailResult.success,
        duration,
        traceId,
        component: 'user-service'
      });

      // Return response with auth token for immediate account access
      return {
        success: true,
        user: {
          id: userId,
          email: cleanEmail,
          tier: 'trial',
          trialEnd: trialEndDate.toISOString(),
          authToken // Return plaintext token for immediate use
        },
        traceId
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof ValidationError) {
        await this.logSignupAttempt({
          email: (requestData as any)?.email || 'invalid',
          ipAddress,
          userAgent,
          status: 'invalid'
        });

        logger.warn('User registration validation failed', {
          error: error.message,
          field: error.field,
          duration,
          traceId,
          component: 'user-service'
        });

        return {
          success: false,
          error: error.message,
          traceId
        };
      }

      if (error instanceof RateLimitError) {
        await this.logSignupAttempt({
          email: (requestData as any)?.email || 'rate-limited',
          ipAddress,
          userAgent,
          status: 'rate_limited'
        });

        logger.warn('User registration rate limited', {
          error: error.message,
          remainingTime: error.remainingTime,
          duration,
          traceId,
          component: 'user-service'
        });

        return {
          success: false,
          error: error.message,
          traceId
        };
      }

      if (error instanceof UserError) {
        logger.warn('User registration failed', {
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
          duration,
          traceId,
          component: 'user-service'
        });

        return {
          success: false,
          error: error.message,
          traceId
        };
      }

      // Unknown error
      await this.logSignupAttempt({
        email: (requestData as any)?.email || 'error',
        ipAddress,
        userAgent,
        status: 'failed'
      });

      logger.error('User registration error', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        duration,
        traceId,
        component: 'user-service'
      });

      return {
        success: false,
        error: 'Registration failed. Please try again.',
        traceId
      };
    }
  }

  /**
   * Validate auth token and return user profile
   */
  async validateAuthToken(token: string): Promise<UserProfile | null> {
    try {
      logger.debug('Validating auth token', {
        tokenPrefix: token.substring(0, 8),
        component: 'user-service'
      });

      const hashedToken = await hashAuthToken(token);
      
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.authToken, hashedToken))
        .limit(1);

      if (user.length === 0) {
        logger.warn('Invalid auth token provided', {
          tokenPrefix: token.substring(0, 8),
          component: 'user-service'
        });
        return null;
      }

      const userData = user[0];

      // Update last activity
      await this.db
        .update(users)
        .set({ lastActivity: new Date().toISOString() })
        .where(eq(users.id, userData.id));

      logger.debug('Auth token validated successfully', {
        userId: userData.id,
        email: userData.email,
        component: 'user-service'
      });

             return {
         id: userData.id,
         email: userData.email,
         tier: userData.tier || 'trial',
         trialEnd: userData.trialEnd,
         locale: userData.locale || 'en-US',
         perspective: userData.perspective || 'calm',
         focusAreas: userData.focusPreferences ? JSON.parse(userData.focusPreferences) : [],
         createdAt: userData.createdAt || new Date().toISOString(),
         lastActivity: userData.lastActivity
       };

    } catch (error) {
      logger.error('Auth token validation error', {
        error: (error as Error).message,
        tokenPrefix: token.substring(0, 8),
        component: 'user-service'
      });
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: {
      locale?: string;
      perspective?: string;
      focusAreas?: string[];
      timezone?: string;
    }
  ): Promise<boolean> {
    try {
      logger.info('Updating user preferences', {
        userId,
        updates: Object.keys(updates),
        component: 'user-service'
      });

      const updateData: any = {
        lastActivity: new Date().toISOString()
      };

      if (updates.locale) updateData.locale = updates.locale;
      if (updates.perspective) updateData.perspective = updates.perspective;
      if (updates.timezone) updateData.timezone = updates.timezone;
      if (updates.focusAreas) {
        updateData.focusPreferences = JSON.stringify(updates.focusAreas);
      }

      await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      logger.info('User preferences updated successfully', {
        userId,
        component: 'user-service'
      });

      return true;
    } catch (error) {
      logger.error('Failed to update user preferences', {
        userId,
        error: (error as Error).message,
        component: 'user-service'
      });
      return false;
    }
  }

  /**
   * Check if user trial has expired
   */
  async checkTrialStatus(userId: string): Promise<{
    isExpired: boolean;
    daysRemaining: number;
    trialEnd: Date | null;
  }> {
    try {
      const user = await this.db
        .select({ tier: users.tier, trialEnd: users.trialEnd })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0 || user[0].tier !== 'trial' || !user[0].trialEnd) {
        return { isExpired: false, daysRemaining: 0, trialEnd: null };
      }

      const trialEnd = new Date(user[0].trialEnd);
      const now = new Date();
      const msRemaining = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

      return {
        isExpired: msRemaining <= 0,
        daysRemaining: Math.max(0, daysRemaining),
        trialEnd
      };
    } catch (error) {
      logger.error('Failed to check trial status', {
        userId,
        error: (error as Error).message,
        component: 'user-service'
      });
      return { isExpired: false, daysRemaining: 0, trialEnd: null };
    }
  }

  /**
   * Unsubscribe user from emails
   */
  async unsubscribeUser(userId: string): Promise<boolean> {
    try {
      logger.info('Unsubscribing user', {
        userId,
        component: 'user-service'
      });

      await this.db
        .update(users)
        .set({ 
          emailStatus: 'unsubscribed',
          unsubscribedAt: new Date().toISOString()
        })
        .where(eq(users.id, userId));

      logger.info('User unsubscribed successfully', {
        userId,
        component: 'user-service'
      });

      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe user', {
        userId,
        error: (error as Error).message,
        component: 'user-service'
      });
      return false;
    }
  }

  /**
   * Get user statistics for monitoring
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    trialUsers: number;
    freeUsers: number;
    basicUsers: number;
    proUsers: number;
  }> {
    try {
      const allUsers = await this.db.select({ tier: users.tier }).from(users);
      
      return {
        totalUsers: allUsers.length,
        trialUsers: allUsers.filter(u => u.tier === 'trial').length,
        freeUsers: allUsers.filter(u => u.tier === 'free').length,
        basicUsers: allUsers.filter(u => u.tier === 'basic').length,
        proUsers: allUsers.filter(u => u.tier === 'pro').length
      };
    } catch (error) {
      logger.error('Failed to get user stats', {
        error: (error as Error).message,
        component: 'user-service'
      });
      return {
        totalUsers: 0,
        trialUsers: 0,
        freeUsers: 0,
        basicUsers: 0,
        proUsers: 0
      };
    }
  }

  /**
   * Log signup attempt for analytics and abuse prevention
   */
  private async logSignupAttempt(attemptData: {
    email: string;
    ipAddress: string;
    userAgent: string;
    status: 'success' | 'duplicate' | 'rate_limited' | 'invalid' | 'failed';
  }): Promise<void> {
    try {
      await this.db.insert(signupAttempts).values({
        id: generateId(),
        email: attemptData.email,
        ipAddress: attemptData.ipAddress,
        status: attemptData.status,
        userAgent: attemptData.userAgent.substring(0, 500) // Limit length
      });
    } catch (error) {
      logger.error('Failed to log signup attempt', {
        error: (error as Error).message,
        email: attemptData.email,
        status: attemptData.status,
        component: 'user-service'
      });
    }
  }
}

// Factory function for creating user service
export function createUserService(
  db: DatabaseClient,
  rateLimiter: RateLimiter,
  emailService: EmailService
): UserService {
  return new UserService(db, rateLimiter, emailService);
} 