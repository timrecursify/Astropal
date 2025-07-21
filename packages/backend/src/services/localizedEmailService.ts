import { logger } from '../lib/logger';
import { EmailService, EmailOptions, EmailResult, createEmailService } from './emailService';
import { 
  LocaleService, 
  createLocaleService, 
  type SupportedLocale, 
  type PerspectiveType,
  type LocaleData 
} from './localeService';
import { DatabaseClient } from '../db/client';

// Enhanced email options with localization
export interface LocalizedEmailOptions {
  userId: string;
  locale: SupportedLocale;
  perspective: PerspectiveType;
  templateType: keyof LocaleData['email']['subjects'];
  templateData?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  customSubject?: string;
  customContent?: string;
}

// Enhanced email result with localization metadata
export interface LocalizedEmailResult extends EmailResult {
  locale: SupportedLocale;
  perspective: PerspectiveType;
  templateType: string;
  localizedSubject: string;
}

// Environment interface for localized email service
export interface LocalizedEmailEnv {
  DB: D1Database;
  KV_I18N: KVNamespace;
  RESEND_API_KEY: string;
}

/**
 * Localized email service with perspective-aware content and multi-language support
 */
export class LocalizedEmailService {
  private emailService: EmailService;
  private localeService: LocaleService;
  private env: LocalizedEmailEnv;

  constructor(env: LocalizedEmailEnv, db: DatabaseClient, brand: string = 'astropal') {
    this.env = env;
    this.emailService = createEmailService(
      env.RESEND_API_KEY,
      db,
      'cosmic@astropal.com',
      'Astropal'
    );
    this.localeService = createLocaleService({
      KV_I18N: env.KV_I18N,
      DB: env.DB
    }, brand);
  }

  /**
   * Send localized email with perspective-aware content
   */
  async sendLocalizedEmail(
    userEmail: string,
    options: LocalizedEmailOptions
  ): Promise<LocalizedEmailResult> {
    const startTime = Date.now();
    const emailId = this.generateEmailId();

    logger.info('Localized email sending started', {
      emailId,
      userId: options.userId,
      locale: options.locale,
      perspective: options.perspective,
      templateType: options.templateType,
      component: 'localized-email-service'
    });

    try {
      // Load locale data
      const localeData = await this.localeService.loadLocale(options.locale);

      // Generate localized subject
      const localizedSubject = options.customSubject || 
        await this.generateLocalizedSubject(localeData, options);

      // Generate localized content
      const localizedContent = options.customContent || 
        await this.generateLocalizedContent(localeData, options);

      // Prepare email options for base service
      const emailOptions: EmailOptions = {
        to: userEmail,
        subject: localizedSubject,
        templateType: this.mapToEmailTemplateType(options.templateType),
        templateData: {
          ...options.templateData,
          ...this.getLocaleTemplateTokens(localeData, options)
        },
        userId: options.userId,
        priority: options.priority || 'normal'
      };

      // Send email using base service
      const baseResult = await this.emailService.sendEmail(emailOptions);

      const duration = Date.now() - startTime;

      // Create enhanced result
      const localizedResult: LocalizedEmailResult = {
        ...baseResult,
        locale: options.locale,
        perspective: options.perspective,
        templateType: options.templateType,
        localizedSubject
      };

      logger.info('Localized email sent successfully', {
        emailId,
        userId: options.userId,
        locale: options.locale,
        perspective: options.perspective,
        messageId: baseResult.messageId,
        duration,
        component: 'localized-email-service'
      });

      return localizedResult;

    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Localized email sending failed', {
        emailId,
        userId: options.userId,
        locale: options.locale,
        perspective: options.perspective,
        error: error.message,
        duration,
        component: 'localized-email-service'
      });

      // Return error result with localization metadata
      return {
        success: false,
        error: error.message,
        logId: emailId,
        locale: options.locale,
        perspective: options.perspective,
        templateType: options.templateType,
        localizedSubject: options.customSubject || 'Email Error'
      };
    }
  }

  /**
   * Send trial ending reminder in user's locale
   */
  async sendLocalizedTrialEndingReminder(
    userEmail: string,
    userId: string,
    locale: SupportedLocale,
    perspective: PerspectiveType,
    daysRemaining: number
  ): Promise<LocalizedEmailResult> {
    return this.sendLocalizedEmail(userEmail, {
      userId,
      locale,
      perspective,
      templateType: 'trial_ending',
      templateData: {
        daysRemaining: daysRemaining.toString(),
        userName: this.extractFirstName(userEmail)
      },
      priority: 'high'
    });
  }

  /**
   * Send trial expired email in user's locale
   */
  async sendLocalizedTrialExpired(
    userEmail: string,
    userId: string,
    locale: SupportedLocale,
    perspective: PerspectiveType
  ): Promise<LocalizedEmailResult> {
    return this.sendLocalizedEmail(userEmail, {
      userId,
      locale,
      perspective,
      templateType: 'trial_expired',
      templateData: {
        userName: this.extractFirstName(userEmail)
      },
      priority: 'normal'
    });
  }

  /**
   * Send upgrade confirmation in user's locale
   */
  async sendLocalizedUpgradeConfirmation(
    userEmail: string,
    userId: string,
    locale: SupportedLocale,
    perspective: PerspectiveType,
    newTier: string
  ): Promise<LocalizedEmailResult> {
    return this.sendLocalizedEmail(userEmail, {
      userId,
      locale,
      perspective,
      templateType: 'upgrade_confirmation',
      templateData: {
        tier: newTier,
        userName: this.extractFirstName(userEmail)
      },
      priority: 'high'
    });
  }

  /**
   * Send upgrade reminder in user's locale
   */
  async sendLocalizedUpgradeReminder(
    userEmail: string,
    userId: string,
    locale: SupportedLocale,
    perspective: PerspectiveType
  ): Promise<LocalizedEmailResult> {
    return this.sendLocalizedEmail(userEmail, {
      userId,
      locale,
      perspective,
      templateType: 'upgrade_reminder',
      templateData: {
        userName: this.extractFirstName(userEmail)
      },
      priority: 'low'
    });
  }

  /**
   * Send daily newsletter in user's locale with perspective weighting
   */
  async sendLocalizedDailyNewsletter(
    userEmail: string,
    userId: string,
    locale: SupportedLocale,
    perspective: PerspectiveType,
    newsletterContent: any,
    timeOfDay: 'morning' | 'evening' = 'morning'
  ): Promise<LocalizedEmailResult> {
    const templateType = timeOfDay === 'morning' ? 'daily_morning' : 'daily_evening';
    
    return this.sendLocalizedEmail(userEmail, {
      userId,
      locale,
      perspective,
      templateType,
      templateData: {
        userName: this.extractFirstName(userEmail),
        date: this.localeService.formatDate(new Date(), locale),
        content: newsletterContent
      },
      priority: 'normal'
    });
  }

  /**
   * Generate localized email subject
   */
  private async generateLocalizedSubject(
    localeData: LocaleData,
    options: LocalizedEmailOptions
  ): Promise<string> {
    const variables = {
      date: this.localeService.formatDate(new Date(), options.locale),
      days: options.templateData?.daysRemaining || '2',
      tier: options.templateData?.tier || 'Pro',
      month: new Intl.DateTimeFormat(options.locale, { month: 'long' }).format(new Date()),
      name: options.templateData?.userName || 'Friend'
    };

    return this.localeService.getToken(
      localeData,
      `email.subjects.${options.templateType}`,
      variables
    );
  }

  /**
   * Generate localized email content
   */
  private async generateLocalizedContent(
    localeData: LocaleData,
    options: LocalizedEmailOptions
  ): Promise<string> {
    // Get content template from locale data
    const contentPath = `email.content.${options.templateType}`;
    
    try {
      const headline = this.localeService.getToken(
        localeData,
        `${contentPath}.headline`,
        options.templateData
      );

      const message = this.localeService.getToken(
        localeData,
        `${contentPath}.message`,
        options.templateData
      );

      // Simple HTML structure - in production would use MJML templates
      return `
        <h2>${headline}</h2>
        <p>${message}</p>
      `;
    } catch (error) {
      logger.warn('Failed to generate localized content, using fallback', {
        locale: options.locale,
        templateType: options.templateType,
        error: error.message,
        component: 'localized-email-service'
      });

      return `<p>Your cosmic update is ready!</p>`;
    }
  }

  /**
   * Get locale-specific template tokens
   */
  private getLocaleTemplateTokens(
    localeData: LocaleData,
    options: LocalizedEmailOptions
  ): Record<string, string> {
    return {
      greeting: this.localeService.getToken(
        localeData,
        new Date().getHours() < 12 ? 'email.templates.greeting_morning' : 'email.templates.greeting_evening',
        { name: options.templateData?.userName || 'Friend' }
      ),
      closing: this.localeService.getToken(localeData, 'email.templates.closing'),
      signature: this.localeService.getToken(localeData, 'email.templates.signature'),
      unsubscribeText: this.localeService.getToken(localeData, 'email.templates.unsubscribe_text'),
      upgradeBasicButton: this.localeService.getToken(localeData, 'email.buttons.upgrade_basic'),
      upgradeProButton: this.localeService.getToken(localeData, 'email.buttons.upgrade_pro'),
      perspectiveName: this.localeService.getToken(
        localeData,
        `perspectives.${options.perspective}.name`
      ),
      perspectiveDescription: this.localeService.getToken(
        localeData,
        `perspectives.${options.perspective}.description`
      )
    };
  }

  /**
   * Map localized template type to email service template type
   */
  private mapToEmailTemplateType(
    templateType: keyof LocaleData['email']['subjects']
  ): EmailOptions['templateType'] {
    const mapping = {
      welcome: 'welcome',
      daily_morning: 'daily',
      daily_evening: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
      trial_ending: 'trial_ending',
      trial_expired: 'trial_ending',
      upgrade_confirmation: 'welcome',
      upgrade_reminder: 'trial_ending',
      payment_failed: 'trial_ending',
      cancellation: 'welcome'
    } as const;

    return mapping[templateType] || 'daily';
  }

  /**
   * Extract first name from email
   */
  private extractFirstName(email: string): string {
    const localPart = email.split('@')[0];
    return localPart.split('.')[0] || 'Friend';
  }

  /**
   * Generate unique email ID for tracking
   */
  private generateEmailId(): string {
    return `loc-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return this.localeService.getSupportedLocales();
  }

  /**
   * Get supported perspectives
   */
  getSupportedPerspectives(): readonly PerspectiveType[] {
    return this.localeService.getSupportedPerspectives();
  }

  /**
   * Clear locale cache
   */
  clearLocaleCache(): void {
    this.localeService.clearCache();
  }
}

/**
 * Factory function for creating localized email service
 */
export function createLocalizedEmailService(
  env: LocalizedEmailEnv,
  db: DatabaseClient,
  brand?: string
): LocalizedEmailService {
  return new LocalizedEmailService(env, db, brand);
}

/**
 * Utility function to determine user's preferred email time based on timezone
 */
export function getOptimalEmailTime(
  timezone: string,
  preferredHour: number = 8
): 'morning' | 'evening' {
  // Simple logic - in production would use proper timezone calculations
  const now = new Date();
  const hour = now.getHours();
  
  return hour < 12 ? 'morning' : 'evening';
} 