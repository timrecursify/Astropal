import { logger } from '../lib/logger';
import { 
  LocaleService, 
  createLocaleService,
  type SupportedLocale,
  type PerspectiveType
} from '../services/localeService';
import { 
  PromptComposer,
  type PromptTemplate,
  type UserContext,
  type EphemerisContext,
  FOCUS_AREA_WEIGHTS
} from './index';

// Environment interface for localized prompts
export interface LocalizedPromptsEnv {
  DB: D1Database;
  KV_I18N: KVNamespace;
}

/**
 * Localized prompt composition engine
 */
export class LocalizedPromptComposer {
  private localeService: LocaleService;
  private baseComposer = PromptComposer;

  constructor(env: LocalizedPromptsEnv, brand: string = 'astropal') {
    this.localeService = createLocaleService({
      KV_I18N: env.KV_I18N,
      DB: env.DB
    }, brand);
  }

  /**
   * Build localized prompt with perspective weighting
   */
  async buildLocalizedPrompt(
    user: UserContext & { locale: SupportedLocale },
    ephemeris: EphemerisContext,
    newsContext?: string
  ): Promise<{ systemPrompt: string; userPrompt: string; template: PromptTemplate } | null> {
    try {
      // Load locale data
      const localeData = await this.localeService.loadLocale(user.locale);

      // Find base template
      const template = this.baseComposer.findTemplate(
        user.tier, 
        user.perspective,
        'daily'
      );

      if (!template) {
        logger.error('No prompt template found', {
          tier: user.tier,
          perspective: user.perspective,
          locale: user.locale,
          component: 'localized-prompt-composer'
        });
        return null;
      }

      // Get localized system prompt
      const localizedSystemPrompt = await this.buildLocalizedSystemPrompt(
        user.perspective,
        user.locale,
        localeData
      );

      // Apply perspective weighting to base prompt
      const perspectiveEnhancedPrompt = this.localeService.applyPerspectiveToPrompt(
        template.basePrompt,
        user.perspective,
        user.locale
      );

      // Build localized user prompt with variables
      const localizedUserPrompt = await this.buildLocalizedUserPrompt(
        perspectiveEnhancedPrompt,
        user,
        ephemeris,
        newsContext,
        localeData
      );

      logger.info('Localized prompt generated', {
        templateId: template.id,
        perspective: user.perspective,
        tier: user.tier,
        locale: user.locale,
        component: 'localized-prompt-composer'
      });

      return {
        systemPrompt: localizedSystemPrompt,
        userPrompt: localizedUserPrompt,
        template
      };

    } catch (error) {
      logger.error('Failed to build localized prompt', {
        error: error.message,
        locale: user.locale,
        perspective: user.perspective,
        component: 'localized-prompt-composer'
      });

      // Fallback to English
      if (user.locale !== 'en-US') {
        logger.warn('Falling back to English prompts', {
          originalLocale: user.locale,
          component: 'localized-prompt-composer'
        });
        return this.buildLocalizedPrompt(
          { ...user, locale: 'en-US' },
          ephemeris,
          newsContext
        );
      }

      // Use base composer as last resort
      return this.baseComposer.buildPrompt(user, ephemeris, newsContext);
    }
  }

  /**
   * Build localized system prompt
   */
  private async buildLocalizedSystemPrompt(
    perspective: PerspectiveType,
    locale: SupportedLocale,
    localeData: any
  ): Promise<string> {
    try {
      const systemPromptData = localeData.prompts.system[perspective];
      
      return `
${systemPromptData.core}

${systemPromptData.principles}

${systemPromptData.guidelines}

${systemPromptData.restrictions}

CULTURAL CONTEXT: ${this.getCulturalGuidelines(locale)}
      `.trim();

    } catch (error) {
      logger.warn('Failed to build localized system prompt, using default', {
        perspective,
        locale,
        error: error.message,
        component: 'localized-prompt-composer'
      });

      // Return default system prompt from base template
      const template = this.baseComposer.findTemplate('free', perspective, 'daily');
      return template?.systemPrompt || 'You are Astropal, an astrological guide.';
    }
  }

  /**
   * Build localized user prompt with variables
   */
  private async buildLocalizedUserPrompt(
    basePrompt: string,
    user: UserContext & { locale: SupportedLocale },
    ephemeris: EphemerisContext,
    newsContext: string | undefined,
    localeData: any
  ): Promise<string> {
    try {
      // Get localized base prompt for tier
      const tierPrompt = this.getTierSpecificPrompt(user.tier, localeData);

      // Generate localized focus keywords
      const localizedFocusKeywords = this.generateLocalizedFocusKeywords(
        user.focusAreas,
        localeData
      );

      // Build localized variables
      const variables: Record<string, string> = {
        date: this.localeService.formatDate(new Date(ephemeris.date), user.locale),
        sunSign: this.translateZodiacSign(ephemeris.sunPosition.sign, localeData),
        sunDegree: ephemeris.sunPosition.degree.toFixed(1),
        moonSign: this.translateZodiacSign(ephemeris.moonPosition.sign, localeData),
        moonPhase: this.translateMoonPhase(ephemeris.moonPosition.phase, localeData),
        primaryFocus: this.translateFocusArea(user.focusAreas[0], localeData) || 
          localeData.prompts.variables.focusAreas,
        secondaryFocus: this.translateFocusArea(user.focusAreas[1], localeData) || '',
        majorAspects: this.formatLocalizedAspects(ephemeris.majorAspects, localeData),
        birthLocation: user.birthLocation,
        timezone: user.timezone,
        focusKeywords: localizedFocusKeywords,
        retrogradePlanets: this.formatRetrogrades(ephemeris.retrogradeActivePlanets, localeData),
        newsContext: newsContext || this.getLocalizedNewsContext(localeData),
        risingSign: user.risingSign ? 
          this.translateZodiacSign(user.risingSign, localeData) : 
          localeData.prompts.variables.risingSign
      };

      // Combine tier prompt with enhanced base prompt
      const combinedPrompt = `${tierPrompt}\n\n${basePrompt}`;

      // Inject variables
      return this.injectVariables(combinedPrompt, variables);

    } catch (error) {
      logger.error('Failed to build localized user prompt', {
        error: error.message,
        locale: user.locale,
        component: 'localized-prompt-composer'
      });

      // Fallback to base prompt
      return basePrompt;
    }
  }

  /**
   * Get tier-specific prompt from locale data
   */
  private getTierSpecificPrompt(tier: string, localeData: any): string {
    try {
      return localeData.prompts.base.daily[tier] || localeData.prompts.base.daily.free;
    } catch (error) {
      return 'Generate a personalized astrological message.';
    }
  }

  /**
   * Generate localized focus keywords
   */
  private generateLocalizedFocusKeywords(focusAreas: string[], localeData: any): string {
    try {
      const localizedAreas = focusAreas.map(area => 
        localeData.focus_areas[area] || area
      );

      // Get keywords for each area
      const keywords = focusAreas.flatMap(area => {
        const weights = FOCUS_AREA_WEIGHTS[area];
        if (weights?.keywords && localeData.locale === 'es-ES') {
          // Spanish keyword translations
          return this.translateKeywordsToSpanish(weights.keywords);
        }
        return weights?.keywords || [];
      });

      return keywords.slice(0, 6).join(', ');
    } catch (error) {
      return focusAreas.join(', ');
    }
  }

  /**
   * Translate focus area name
   */
  private translateFocusArea(area: string | undefined, localeData: any): string | undefined {
    if (!area) return undefined;
    return localeData.focus_areas[area] || area;
  }

  /**
   * Translate zodiac sign names
   */
  private translateZodiacSign(sign: string, localeData: any): string {
    // For Spanish, translate zodiac signs
    if (localeData.locale === 'es-ES') {
      const zodiacTranslations: Record<string, string> = {
        'Aries': 'Aries',
        'Taurus': 'Tauro',
        'Gemini': 'Géminis',
        'Cancer': 'Cáncer',
        'Leo': 'Leo',
        'Virgo': 'Virgo',
        'Libra': 'Libra',
        'Scorpio': 'Escorpio',
        'Sagittarius': 'Sagitario',
        'Capricorn': 'Capricornio',
        'Aquarius': 'Acuario',
        'Pisces': 'Piscis'
      };
      return zodiacTranslations[sign] || sign;
    }
    return sign;
  }

  /**
   * Translate moon phase names
   */
  private translateMoonPhase(phase: string, localeData: any): string {
    if (localeData.locale === 'es-ES') {
      const phaseTranslations: Record<string, string> = {
        'New Moon': 'Luna Nueva',
        'Waxing Crescent': 'Luna Creciente',
        'First Quarter': 'Cuarto Creciente',
        'Waxing Gibbous': 'Luna Gibosa Creciente',
        'Full Moon': 'Luna Llena',
        'Waning Gibbous': 'Luna Gibosa Menguante',
        'Last Quarter': 'Cuarto Menguante',
        'Waning Crescent': 'Luna Menguante'
      };
      return phaseTranslations[phase] || phase;
    }
    return phase;
  }

  /**
   * Format aspects with localized names
   */
  private formatLocalizedAspects(aspects: EphemerisContext['majorAspects'], localeData: any): string {
    if (aspects.length === 0) {
      return localeData.locale === 'es-ES' ? 
        'Armonía cósmica suave' : 
        'Gentle cosmic harmony';
    }

    return aspects
      .slice(0, 3)
      .map(aspect => {
        if (localeData.locale === 'es-ES') {
          const aspectTranslations: Record<string, string> = {
            'conjunction': 'conjunción',
            'opposition': 'oposición',
            'trine': 'trígono',
            'square': 'cuadratura',
            'sextile': 'sextil'
          };
          const aspectName = aspectTranslations[aspect.aspect] || aspect.aspect;
          return `${aspect.planet1}-${aspect.planet2} ${aspectName}`;
        }
        return `${aspect.planet1}-${aspect.planet2} ${aspect.aspect}`;
      })
      .join(', ');
  }

  /**
   * Format retrograde planets
   */
  private formatRetrogrades(planets: string[], localeData: any): string {
    if (planets.length === 0) {
      return localeData.locale === 'es-ES' ? 
        'Ningún planeta retrógrado' : 
        'No retrograde planets';
    }
    return planets.join(', ');
  }

  /**
   * Get localized news context
   */
  private getLocalizedNewsContext(localeData: any): string {
    return localeData.locale === 'es-ES' ?
      'La energía cósmica actual se refleja en los eventos globales' :
      'Current cosmic energy reflects in global events';
  }

  /**
   * Translate keywords to Spanish
   */
  private translateKeywordsToSpanish(keywords: string[]): string[] {
    const translations: Record<string, string> = {
      // Relationships
      'connection': 'conexión',
      'communication': 'comunicación',
      'partnership': 'asociación',
      'love': 'amor',
      'harmony': 'armonía',
      'understanding': 'comprensión',
      // Career
      'achievement': 'logro',
      'leadership': 'liderazgo',
      'growth': 'crecimiento',
      'opportunity': 'oportunidad',
      'success': 'éxito',
      'progress': 'progreso',
      // Wellness
      'balance': 'equilibrio',
      'health': 'salud',
      'energy': 'energía',
      'vitality': 'vitalidad',
      'peace': 'paz',
      'healing': 'sanación',
      // Social
      'community': 'comunidad',
      'friendship': 'amistad',
      'networking': 'conexiones',
      'collaboration': 'colaboración',
      'influence': 'influencia',
      // Spiritual
      'wisdom': 'sabiduría',
      'intuition': 'intuición',
      'purpose': 'propósito',
      'meaning': 'significado',
      'awakening': 'despertar',
      'transformation': 'transformación',
      // Evidence-based
      'research': 'investigación',
      'facts': 'hechos',
      'analysis': 'análisis',
      'patterns': 'patrones',
      'logic': 'lógica'
    };

    return keywords.map(keyword => translations[keyword] || keyword);
  }

  /**
   * Get cultural guidelines for prompts
   */
  private getCulturalGuidelines(locale: SupportedLocale): string {
    const guidelines = {
      'en-US': 'Use direct, clear communication style typical of American culture. Be encouraging and positive.',
      'es-ES': 'Use warm, personal communication style with appropriate formality. Include cultural references to Spanish and Latin American traditions when relevant.'
    };

    return guidelines[locale] || guidelines['en-US'];
  }

  /**
   * Inject variables into prompt template
   */
  private injectVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    // Check for unresolved placeholders
    const unresolvedPlaceholders = result.match(/\{\{[^}]+\}\}/g);
    if (unresolvedPlaceholders) {
      logger.warn('Unresolved placeholders in localized prompt', {
        placeholders: unresolvedPlaceholders,
        component: 'localized-prompt-composer'
      });
    }

    return result;
  }
}

/**
 * Factory function for creating localized prompt composer
 */
export function createLocalizedPromptComposer(
  env: LocalizedPromptsEnv,
  brand?: string
): LocalizedPromptComposer {
  return new LocalizedPromptComposer(env, brand);
} 