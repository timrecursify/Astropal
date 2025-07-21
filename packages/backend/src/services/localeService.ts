import { logger } from '../lib/logger';

// Supported locales (aligned with frontend)
export const SUPPORTED_LOCALES = ['en-US', 'es-ES'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Perspective profiles for tone adjustment
export const PERSPECTIVE_PROFILES = {
  calm: {
    tone: "gentle, reassuring, peaceful",
    focus: "inner harmony, meditation, balance", 
    style: "soft, flowing, contemplative",
    keywords: ["peace", "serenity", "mindfulness", "tranquility"],
    weight: 0.7
  },
  knowledge: {
    tone: "informative, educational, curious",
    focus: "learning, understanding, wisdom",
    style: "detailed, analytical, exploratory", 
    keywords: ["discover", "understand", "explore", "learn"],
    weight: 0.7
  },
  success: {
    tone: "motivational, action-oriented, confident",
    focus: "achievement, goals, progress",
    style: "direct, energetic, ambitious",
    keywords: ["achieve", "succeed", "accomplish", "excel"],
    weight: 0.7
  },
  evidence: {
    tone: "factual, scientific, objective",
    focus: "astronomical events, data, observations",
    style: "precise, technical, informative",
    keywords: ["data", "observation", "phenomenon", "measurement"],
    weight: 0.7
  }
} as const;

export type PerspectiveType = keyof typeof PERSPECTIVE_PROFILES;

// Locale data structure - comprehensive for full system localization
export interface LocaleData {
  email: {
    subjects: {
      welcome: string;
      daily_morning: string;
      daily_evening: string;
      weekly: string;
      monthly: string;
      trial_ending: string;
      trial_expired: string;
      upgrade_confirmation: string;
      upgrade_reminder: string;
      payment_failed: string;
      cancellation: string;
    };
    templates: {
      greeting_morning: string;
      greeting_evening: string;
      closing: string;
      signature: string;
      unsubscribe_text: string;
      footer_disclaimer: string;
    };
    buttons: {
      upgrade_basic: string;
      upgrade_pro: string;
      unsubscribe: string;
      change_perspective: string;
      update_preferences: string;
    };
  };
  perspectives: {
    [K in PerspectiveType]: {
      name: string;
      description: string;
      short_description: string;
      // For AI prompts
      prompt_tone: string;
      prompt_focus: string;
      prompt_keywords: string[];
    };
  };
  formats: {
    date_format: string;
    currency: string;
    timezone_display: string;
    number_format: string;
  };
  // Frontend UI strings
  ui: {
    hero: {
      mission: string;
      title: string;
      description: string;
      cta: string;
    };
    features: {
      sectionTitle: string;
      title: string;
      description: string;
      features: Array<{
        title: string;
        description: string;
      }>;
    };
    signup: {
      email: string;
      dateOfBirth: string;
      birthLocation: string;
      birthTime: string;
      timezone: string;
      perspective: string;
      focusAreas: string;
      referralCode: string;
      submit: string;
      submitting: string;
      // Tooltips
      tooltips: {
        email: string;
        dateOfBirth: string;
        birthLocation: string;
        birthTime: string;
        perspective: string;
        focusAreas: string;
      };
    };
    pricing: {
      sectionTitle: string;
      title: string;
      description: string;
      loading: string;
      error: string;
      selectPlan: string;
      monthly: string;
      annually: string;
      tiers: {
        free: {
          name: string;
          description: string;
          features: string[];
        };
        basic: {
          name: string;
          description: string;
          features: string[];
        };
        pro: {
          name: string;
          description: string;
          features: string[];
        };
      };
    };
    referral: {
      title: string;
      description: string;
      bonusDays: string;
    };
    verify: {
      verifying: string;
      success: string;
      successMessage: string;
      redirecting: string;
      error: string;
      goHome: string;
    };
    legal: {
      terms: string;
      privacy: string;
      disclaimer: string;
    };
  };
  // API response messages
  api: {
    errors: {
      generic: string;
      notFound: string;
      unauthorized: string;
      rateLimited: string;
      invalidInput: string;
      serverError: string;
      // Specific errors
      emailExists: string;
      invalidEmail: string;
      invalidDate: string;
      invalidLocation: string;
      trialExpired: string;
      paymentFailed: string;
      subscriptionNotFound: string;
    };
    success: {
      registered: string;
      verified: string;
      updated: string;
      cancelled: string;
      upgraded: string;
    };
  };
  // Form validation messages
  validation: {
    required: string;
    email: string;
    date: string;
    minLength: string;
    maxLength: string;
    pattern: string;
    minItems: string;
    maxItems: string;
    // Field-specific
    birthDate: {
      future: string;
      tooYoung: string;
      tooOld: string;
    };
    birthLocation: {
      format: string;
      invalid: string;
    };
    focusAreas: {
      min: string;
      max: string;
    };
  };
  // AI prompts - localized system and base prompts
  prompts: {
    // System prompts for each perspective
    system: {
      [K in PerspectiveType]: {
        core: string;
        principles: string;
        guidelines: string;
        restrictions: string;
      };
    };
    // Base prompts for content generation
    base: {
      daily: {
        free: string;
        basic: string;
        pro: string;
      };
      weekly: string;
      monthly: string;
    };
    // Variable descriptions for prompts
    variables: {
      date: string;
      sunSign: string;
      moonSign: string;
      moonPhase: string;
      risingSign: string;
      birthLocation: string;
      focusAreas: string;
    };
  };
  // Common strings used throughout
  common: {
    loading: string;
    error: string;
    retry: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    update: string;
    delete: string;
    back: string;
    next: string;
    yes: string;
    no: string;
    or: string;
    and: string;
  };
  // Focus area descriptions
  focus_areas: {
    relationships: string;
    career: string;
    wellness: string;
    social: string;
    spiritual: string;
    'evidence-based': string;
  };
}

// Environment interface for locale service
export interface LocaleEnv {
  KV_I18N: KVNamespace;
  DB: D1Database;
}

/**
 * Production-grade locale service with KV-based loading and perspective integration
 */
export class LocaleService {
  private cache = new Map<string, LocaleData>();
  private env: LocaleEnv;
  private defaultLocale: SupportedLocale = 'en-US';
  private brand: string = 'astropal';

  constructor(env: LocaleEnv, brand: string = 'astropal') {
    this.env = env;
    this.brand = brand;
  }

  /**
   * Load locale data with fallback chain and caching
   */
  async loadLocale(locale: SupportedLocale): Promise<LocaleData> {
    const cacheKey = `${locale}:${this.brand}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      logger.debug('Locale cache hit', { 
        locale, 
        brand: this.brand,
        component: 'locale-service'
      });
      return this.cache.get(cacheKey)!;
    }

    try {
      // Load from KV
      const kvKey = `i18n:${locale}:${this.brand}`;
      const data = await this.env.KV_I18N.get(kvKey, 'json') as LocaleData | null;

      if (data) {
        this.cache.set(cacheKey, data);
        logger.debug('Locale loaded from KV', {
          locale,
          brand: this.brand,
          kvKey,
          component: 'locale-service'
        });
        return data;
      }

      // Fallback to default locale if not default
      if (locale !== this.defaultLocale) {
        logger.warn('Locale not found, falling back to default', {
          requestedLocale: locale,
          fallbackLocale: this.defaultLocale,
          component: 'locale-service'
        });
        return await this.loadLocale(this.defaultLocale);
      }

      // If default locale missing, throw error
      throw new Error(`Default locale ${this.defaultLocale} not found in KV`);

    } catch (error) {
      logger.error('Failed to load locale', {
        locale,
        brand: this.brand,
        error: error.message,
        component: 'locale-service'
      });

      // Return minimal fallback to prevent system failure
      return this.getMinimalFallback();
    }
  }

  /**
   * Get localized token with variable substitution
   */
  getToken(
    data: LocaleData, 
    path: string, 
    variables?: Record<string, string>
  ): string {
    try {
      let value = path.split('.').reduce((obj: any, key) => obj?.[key], data);

      if (!value) {
        logger.warn('Missing i18n token', { 
          path, 
          component: 'locale-service'
        });
        return `[${path}]`; // Return key in brackets as fallback
      }

      // Replace variables
      if (variables) {
        Object.entries(variables).forEach(([key, val]) => {
          value = value.replace(new RegExp(`{{${key}}}`, 'g'), val);
        });
      }

      return value;
    } catch (error) {
      logger.error('Token retrieval failed', {
        path,
        error: error.message,
        component: 'locale-service'
      });
      return `[${path}]`;
    }
  }

  /**
   * Apply perspective weighting to content prompts
   */
  applyPerspectiveToPrompt(
    basePrompt: string,
    perspective: PerspectiveType,
    locale: SupportedLocale = 'en-US'
  ): string {
    const profile = PERSPECTIVE_PROFILES[perspective];
    
    logger.debug('Applying perspective to prompt', {
      perspective,
      locale,
      weight: profile.weight,
      component: 'locale-service'
    });

    // Locale-specific perspective adjustments
    const localeAdjustments = this.getLocaleSpecificAdjustments(locale);

    return `
${basePrompt}

CRITICAL PERSPECTIVE INSTRUCTIONS:
Apply the following perspective with ${profile.weight * 100}% influence:
- Tone: ${profile.tone}
- Focus Areas: ${profile.focus}
- Writing Style: ${profile.style}
- Natural Keywords: ${profile.keywords.join(', ')}
- Cultural Context: ${localeAdjustments}

The remaining ${(1 - profile.weight) * 100}% should maintain general astrological guidance.
Ensure the content feels authentic and not forced.`;
  }

  /**
   * Get perspective-specific email subject
   */
  async getLocalizedSubject(
    locale: SupportedLocale,
    templateType: keyof LocaleData['email']['subjects'],
    perspective: PerspectiveType,
    variables?: Record<string, string>
  ): Promise<string> {
    try {
      const data = await this.loadLocale(locale);
      let subject = this.getToken(data, `email.subjects.${templateType}`, variables);

      // Apply subtle perspective influence to subject
      subject = this.applyPerspectiveToSubject(subject, perspective, locale);

      logger.debug('Localized subject generated', {
        locale,
        templateType,
        perspective,
        component: 'locale-service'
      });

      return subject;
    } catch (error) {
      logger.error('Failed to get localized subject', {
        locale,
        templateType,
        perspective,
        error: error.message,
        component: 'locale-service'
      });

      // Fallback to English with perspective
      if (locale !== 'en-US') {
        return this.getLocalizedSubject('en-US', templateType, perspective, variables);
      }
      
      return `Your Cosmic Update`; // Ultimate fallback
    }
  }

  /**
   * Validate locale support
   */
  isValidLocale(locale: string): locale is SupportedLocale {
    return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
  }

  /**
   * Validate perspective support  
   */
  isValidPerspective(perspective: string): perspective is PerspectiveType {
    return Object.keys(PERSPECTIVE_PROFILES).includes(perspective);
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, locale: SupportedLocale): string {
    try {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      logger.warn('Date formatting failed, using fallback', {
        locale,
        error: error.message,
        component: 'locale-service'
      });
      return date.toDateString(); // Fallback to simple string
    }
  }

  /**
   * Get all available locales
   */
  getSupportedLocales(): readonly SupportedLocale[] {
    return SUPPORTED_LOCALES;
  }

  /**
   * Get all available perspectives
   */
  getSupportedPerspectives(): readonly PerspectiveType[] {
    return Object.keys(PERSPECTIVE_PROFILES) as readonly PerspectiveType[];
  }

  /**
   * Clear locale cache (useful for testing or updates)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Locale cache cleared', { component: 'locale-service' });
  }

  /**
   * Get locale-specific cultural adjustments
   */
  private getLocaleSpecificAdjustments(locale: SupportedLocale): string {
    const adjustments = {
      'en-US': "American cultural context, direct communication style",
      'es-ES': "Spanish cultural context, warm and personal communication, formal 'usted' for respectful tone"
    };

    return adjustments[locale] || adjustments['en-US'];
  }

  /**
   * Apply subtle perspective influence to email subjects
   */
  private applyPerspectiveToSubject(
    subject: string, 
    perspective: PerspectiveType,
    locale: SupportedLocale
  ): string {
    // For now, return subject as-is
    // In production, could add perspective-specific emoji or tone words
    return subject;
  }

  /**
   * Minimal fallback data to prevent system failure
   */
  private getMinimalFallback(): LocaleData {
    return {
      email: {
        subjects: {
          welcome: "Welcome to Astropal",
          daily_morning: "Your Daily Cosmic Forecast",
          daily_evening: "Evening Cosmic Reflection", 
          weekly: "Your Weekly Cosmic Overview",
          monthly: "Monthly Cosmic Insights",
          trial_ending: "Your trial ends soon",
          trial_expired: "Continue your cosmic journey",
          upgrade_confirmation: "Welcome to Astropal Premium",
          upgrade_reminder: "Enhance your cosmic insights",
          payment_failed: "Payment failed - Update your method",
          cancellation: "Subscription cancelled"
        },
        templates: {
          greeting_morning: "Good morning!",
          greeting_evening: "Good evening!",
          closing: "Until the stars align again",
          signature: "The Astropal Team",
          unsubscribe_text: "Unsubscribe from these emails",
          footer_disclaimer: "This email was sent by Astropal"
        },
        buttons: {
          upgrade_basic: "Upgrade to Basic",
          upgrade_pro: "Upgrade to Pro", 
          unsubscribe: "Unsubscribe",
          change_perspective: "Change Perspective",
          update_preferences: "Update Preferences"
        }
      },
      perspectives: {
        calm: { 
          name: "Calm", 
          description: "Peaceful guidance", 
          short_description: "Peace",
          prompt_tone: "gentle, nurturing, peaceful",
          prompt_focus: "inner harmony, meditation, balance",
          prompt_keywords: ["peace", "serenity", "mindfulness", "tranquility"]
        },
        knowledge: { 
          name: "Knowledge", 
          description: "Educational insights", 
          short_description: "Learn",
          prompt_tone: "informative, educational, curious",
          prompt_focus: "learning, understanding, wisdom",
          prompt_keywords: ["discover", "understand", "explore", "learn"]
        },
        success: { 
          name: "Success", 
          description: "Achievement focus", 
          short_description: "Achieve",
          prompt_tone: "motivational, action-oriented, confident",
          prompt_focus: "achievement, goals, progress",
          prompt_keywords: ["achieve", "succeed", "accomplish", "excel"]
        },
        evidence: { 
          name: "Evidence", 
          description: "Scientific approach", 
          short_description: "Science",
          prompt_tone: "factual, scientific, objective",
          prompt_focus: "astronomical events, data, observations",
          prompt_keywords: ["data", "observation", "phenomenon", "measurement"]
        }
      },
      formats: {
        date_format: "MMMM d, yyyy",
        currency: "USD",
        timezone_display: "UTC",
        number_format: "en-US"
      },
      // Add minimal UI, API, validation, prompts, and common sections
      ui: {
        hero: { mission: "", title: "", description: "", cta: "" },
        features: { sectionTitle: "", title: "", description: "", features: [] },
        signup: { 
          email: "", dateOfBirth: "", birthLocation: "", birthTime: "", 
          timezone: "", perspective: "", focusAreas: "", referralCode: "",
          submit: "", submitting: "", 
          tooltips: { email: "", dateOfBirth: "", birthLocation: "", birthTime: "", perspective: "", focusAreas: "" }
        },
        pricing: {
          sectionTitle: "", title: "", description: "", loading: "", error: "",
          selectPlan: "", monthly: "", annually: "",
          tiers: {
            free: { name: "", description: "", features: [] },
            basic: { name: "", description: "", features: [] },
            pro: { name: "", description: "", features: [] }
          }
        },
        referral: { title: "", description: "", bonusDays: "" },
        verify: { verifying: "", success: "", successMessage: "", redirecting: "", error: "", goHome: "" },
        legal: { terms: "", privacy: "", disclaimer: "" }
      },
      api: {
        errors: {
          generic: "An error occurred", notFound: "Not found", unauthorized: "Unauthorized",
          rateLimited: "Too many requests", invalidInput: "Invalid input", serverError: "Server error",
          emailExists: "Email already exists", invalidEmail: "Invalid email", invalidDate: "Invalid date",
          invalidLocation: "Invalid location", trialExpired: "Trial expired", 
          paymentFailed: "Payment failed", subscriptionNotFound: "Subscription not found"
        },
        success: {
          registered: "Registered successfully", verified: "Verified successfully",
          updated: "Updated successfully", cancelled: "Cancelled successfully",
          upgraded: "Upgraded successfully"
        }
      },
      validation: {
        required: "This field is required", email: "Invalid email", date: "Invalid date",
        minLength: "Too short", maxLength: "Too long", pattern: "Invalid format",
        minItems: "Select at least {{min}}", maxItems: "Select at most {{max}}",
        birthDate: { future: "Cannot be in future", tooYoung: "Must be 13+", tooOld: "Invalid age" },
        birthLocation: { format: "Use City, Country format", invalid: "Invalid location" },
        focusAreas: { min: "Select at least 1", max: "Select at most 3" }
      },
      prompts: {
        system: {
          calm: { core: "", principles: "", guidelines: "", restrictions: "" },
          knowledge: { core: "", principles: "", guidelines: "", restrictions: "" },
          success: { core: "", principles: "", guidelines: "", restrictions: "" },
          evidence: { core: "", principles: "", guidelines: "", restrictions: "" }
        },
        base: {
          daily: { free: "", basic: "", pro: "" },
          weekly: "", monthly: ""
        },
        variables: {
          date: "", sunSign: "", moonSign: "", moonPhase: "",
          risingSign: "", birthLocation: "", focusAreas: ""
        }
      },
      common: {
        loading: "Loading...", error: "Error", retry: "Retry", success: "Success",
        cancel: "Cancel", confirm: "Confirm", save: "Save", update: "Update",
        delete: "Delete", back: "Back", next: "Next", yes: "Yes", no: "No",
        or: "or", and: "and"
      },
      focus_areas: {
        relationships: "Relationships", career: "Career", wellness: "Wellness",
        social: "Social", spiritual: "Spiritual", "evidence-based": "Evidence-based"
      }
    };
  }
}

/**
 * Factory function for creating locale service
 */
export function createLocaleService(env: LocaleEnv, brand?: string): LocaleService {
  return new LocaleService(env, brand);
}

/**
 * Utility function to extract locale from user preferences
 */
export function getUserLocale(userLocale?: string): SupportedLocale {
  if (userLocale && SUPPORTED_LOCALES.includes(userLocale as SupportedLocale)) {
    return userLocale as SupportedLocale;
  }
  return 'en-US'; // Default fallback
}

/**
 * Utility function to extract perspective from user preferences
 */
export function getUserPerspective(userPerspective?: string): PerspectiveType {
  if (userPerspective && Object.keys(PERSPECTIVE_PROFILES).includes(userPerspective)) {
    return userPerspective as PerspectiveType;
  }
  return 'calm'; // Default fallback
} 