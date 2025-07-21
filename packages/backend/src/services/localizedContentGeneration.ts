import { logger } from '../lib/logger';
import { 
  ContentGenerationService, 
  NewsletterContent, 
  NewsletterContentSchema 
} from './contentGeneration';
import { 
  LocaleService, 
  createLocaleService,
  getUserLocale,
  getUserPerspective,
  type SupportedLocale,
  type PerspectiveType,
  type LocaleData
} from './localeService';
import { type UserContext, type EphemerisContext } from '../prompts';

// Enhanced user context with locale information
export interface LocalizedUserContext extends UserContext {
  id: string;
  email: string;
  locale: SupportedLocale;
  perspective: PerspectiveType;
  trialEnd?: string;
}

// Enhanced newsletter content with localization metadata
export interface LocalizedNewsletterContent extends NewsletterContent {
  locale: SupportedLocale;
  localizedSubject: string;
  localizedPreheader: string;
  perspectiveWeight: number;
  culturalContext: string;
}

// Environment interface for localized content generation
export interface LocalizedContentEnv {
  DB: D1Database;
  KV_I18N: KVNamespace;
  KV_CONTENT: KVNamespace;
  KV_METRICS: KVNamespace;
  GROK_API_KEY: string;
  OPENAI_API_KEY: string;
}

/**
 * Enhanced content generation service with localization and perspective weighting
 */
export class LocalizedContentGenerationService {
  private contentService: ContentGenerationService;
  private localeService: LocaleService;
  private env: LocalizedContentEnv;

  constructor(env: LocalizedContentEnv, brand: string = 'astropal') {
    this.env = env;
    this.contentService = new ContentGenerationService(env);
    this.localeService = createLocaleService({
      KV_I18N: env.KV_I18N,
      DB: env.DB
    }, brand);
  }

  /**
   * Generate localized and perspective-weighted content
   */
  async generateLocalizedContent(
    user: LocalizedUserContext,
    ephemeris: EphemerisContext,
    newsContext?: string
  ): Promise<LocalizedNewsletterContent> {
    const generationId = this.generateId();
    const startTime = Date.now();

    logger.info('Localized content generation started', {
      generationId,
      userId: user.id,
      locale: user.locale,
      perspective: user.perspective,
      tier: user.tier,
      component: 'localized-content-generation'
    });

    try {
      // Load locale data
      const localeData = await this.localeService.loadLocale(user.locale);

      // Apply perspective weighting to base prompts
      const enhancedUser = await this.enhanceUserContextWithPerspective(user, localeData);

      // Generate core content with enhanced prompts
      const baseContent = await this.contentService.generateContent(
        enhancedUser,
        ephemeris,
        newsContext
      );

      // Localize the generated content
      const localizedContent = await this.localizeContent(
        baseContent,
        user,
        localeData,
        ephemeris
      );

      const duration = Date.now() - startTime;

      logger.info('Localized content generation completed', {
        generationId,
        userId: user.id,
        locale: user.locale,
        perspective: user.perspective,
        duration,
        component: 'localized-content-generation'
      });

      return localizedContent;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Localized content generation failed', {
        generationId,
        userId: user.id,
        locale: user.locale,
        perspective: user.perspective,
        error: error.message,
        duration,
        component: 'localized-content-generation'
      });

      // Fallback to standard content generation
      logger.warn('Falling back to standard content generation', {
        generationId,
        userId: user.id,
        component: 'localized-content-generation'
      });

      const fallbackContent = await this.contentService.generateContent(
        user,
        ephemeris,
        newsContext
      );

      return this.createFallbackLocalizedContent(fallbackContent, user);
    }
  }

  /**
   * Generate localized email subject with perspective influence
   */
  async generateLocalizedSubject(
    user: LocalizedUserContext,
    templateType: keyof LocaleData['email']['subjects'],
    ephemeris: EphemerisContext
  ): Promise<string> {
    try {
      const variables = {
        date: this.localeService.formatDate(new Date(ephemeris.date), user.locale),
        name: this.extractFirstName(user.email),
        days: this.calculateDaysUntilTrialEnd(user),
        tier: this.capitalizeFirst(user.tier),
        month: new Intl.DateTimeFormat(user.locale, { month: 'long' }).format(new Date())
      };

      const subject = await this.localeService.getLocalizedSubject(
        user.locale,
        templateType,
        user.perspective,
        variables
      );

      logger.debug('Localized subject generated', {
        userId: user.id,
        locale: user.locale,
        perspective: user.perspective,
        templateType,
        subject: subject.substring(0, 50),
        component: 'localized-content-generation'
      });

      return subject;

    } catch (error) {
      logger.error('Failed to generate localized subject', {
        userId: user.id,
        locale: user.locale,
        templateType,
        error: error.message,
        component: 'localized-content-generation'
      });

      // Fallback to English
      return this.localeService.getLocalizedSubject(
        'en-US',
        templateType,
        user.perspective
      );
    }
  }

  /**
   * Validate and normalize user locale/perspective from database
   */
  static normalizeUserContext(user: any): LocalizedUserContext {
    return {
      ...user,
      locale: getUserLocale(user.locale),
      perspective: getUserPerspective(user.perspective)
    };
  }

  /**
   * Get supported locales for validation
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return this.localeService.getSupportedLocales();
  }

  /**
   * Get supported perspectives for validation
   */
  getSupportedPerspectives(): readonly PerspectiveType[] {
    return this.localeService.getSupportedPerspectives();
  }

  /**
   * Enhance user context with perspective-weighted prompts
   */
  private async enhanceUserContextWithPerspective(
    user: LocalizedUserContext,
    localeData: LocaleData
  ): Promise<UserContext> {
    // The perspective weighting will be applied at the prompt level
    // by the PromptComposer when it calls the locale service
    
    // For now, return the user context as-is
    // The perspective influence will be applied in the prompt generation
    return user;
  }

  /**
   * Localize generated content with appropriate subjects and formatting
   */
  private async localizeContent(
    baseContent: NewsletterContent,
    user: LocalizedUserContext,
    localeData: LocaleData,
    ephemeris: EphemerisContext
  ): Promise<LocalizedNewsletterContent> {
    try {
      // Generate localized subject based on content type
      const templateType = this.determineTemplateType(user.tier, ephemeris);
      const localizedSubject = await this.generateLocalizedSubject(
        user,
        templateType,
        ephemeris
      );

      // Get localized preheader
      const localizedPreheader = this.localeService.getToken(
        localeData,
        `email.content.${templateType}.message`,
        {
          name: this.extractFirstName(user.email),
          date: this.localeService.formatDate(new Date(ephemeris.date), user.locale)
        }
      );

      // Apply cultural formatting to content sections
      const culturallyAdaptedSections = this.adaptContentForCulture(
        baseContent.sections,
        user.locale
      );

      const localizedContent: LocalizedNewsletterContent = {
        ...baseContent,
        sections: culturallyAdaptedSections,
        locale: user.locale,
        localizedSubject,
        localizedPreheader: localizedPreheader || baseContent.preheader,
        perspectiveWeight: 0.7, // From PERSPECTIVE_PROFILES
        culturalContext: this.getCulturalContext(user.locale)
      };

      logger.debug('Content localized successfully', {
        userId: user.id,
        locale: user.locale,
        perspective: user.perspective,
        sectionsCount: localizedContent.sections.length,
        component: 'localized-content-generation'
      });

      return localizedContent;

    } catch (error) {
      logger.error('Content localization failed', {
        userId: user.id,
        locale: user.locale,
        error: error.message,
        component: 'localized-content-generation'
      });

      // Return base content with minimal localization
      return {
        ...baseContent,
        locale: user.locale,
        localizedSubject: baseContent.subject,
        localizedPreheader: baseContent.preheader,
        perspectiveWeight: 0.7,
        culturalContext: this.getCulturalContext(user.locale)
      };
    }
  }

  /**
   * Create fallback localized content when main generation fails
   */
  private createFallbackLocalizedContent(
    baseContent: NewsletterContent,
    user: LocalizedUserContext
  ): LocalizedNewsletterContent {
    return {
      ...baseContent,
      locale: user.locale,
      localizedSubject: baseContent.subject,
      localizedPreheader: baseContent.preheader,
      perspectiveWeight: 0.7,
      culturalContext: this.getCulturalContext(user.locale)
    };
  }

  /**
   * Determine email template type based on user tier and context
   */
  private determineTemplateType(
    tier: string,
    ephemeris: EphemerisContext
  ): keyof LocaleData['email']['subjects'] {
    // Simple logic - can be enhanced based on time of day, special events, etc.
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'daily_morning';
    } else if (hour < 18) {
      return 'daily_morning'; // Afternoon still uses morning template
    } else {
      return 'daily_evening';
    }
  }

  /**
   * Adapt content sections for cultural context
   */
  private adaptContentForCulture(
    sections: NewsletterContent['sections'],
    locale: SupportedLocale
  ): NewsletterContent['sections'] {
    // For now, return sections as-is
    // In the future, could adapt:
    // - Date/time formats
    // - Cultural references
    // - Greeting styles
    // - Formality levels

    return sections.map(section => ({
      ...section,
      // Apply any cultural adaptations here
    }));
  }

  /**
   * Get cultural context for locale
   */
  private getCulturalContext(locale: SupportedLocale): string {
    const contexts = {
      'en-US': 'American cultural context with direct communication',
      'es-ES': 'Spanish cultural context with warm, personal communication'
    };

    return contexts[locale] || contexts['en-US'];
  }

  /**
   * Extract first name from email for personalization
   */
  private extractFirstName(email: string): string {
    const localPart = email.split('@')[0];
    // Simple extraction - can be enhanced
    return localPart.split('.')[0] || 'Friend';
  }

  /**
   * Calculate days until trial end (placeholder)
   */
  private calculateDaysUntilTrialEnd(user: LocalizedUserContext): string {
    // Placeholder - would calculate from user.trialEnd
    return '2';
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate unique ID for tracking
   */
  private generateId(): string {
    return `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function for creating localized content generation service
 */
export function createLocalizedContentGenerationService(
  env: LocalizedContentEnv,
  brand?: string
): LocalizedContentGenerationService {
  return new LocalizedContentGenerationService(env, brand);
} 