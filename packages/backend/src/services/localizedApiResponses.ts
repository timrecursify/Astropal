import { logger } from '../lib/logger';
import { 
  LocaleService, 
  createLocaleService,
  getUserLocale,
  type SupportedLocale
} from './localeService';

// Environment interface for localized API responses
export interface LocalizedApiEnv {
  DB: D1Database;
  KV_I18N: KVNamespace;
}

/**
 * Localized API response builder
 */
export class LocalizedApiResponses {
  private localeService: LocaleService;

  constructor(env: LocalizedApiEnv, brand: string = 'astropal') {
    this.localeService = createLocaleService({
      KV_I18N: env.KV_I18N,
      DB: env.DB
    }, brand);
  }

  /**
   * Build localized error response
   */
  async buildErrorResponse(
    errorType: string,
    locale: SupportedLocale = 'en-US',
    variables?: Record<string, string>
  ): Promise<Response> {
    try {
      const localeData = await this.localeService.loadLocale(locale);
      const errorMessage = this.localeService.getToken(
        localeData,
        `api.errors.${errorType}`,
        variables
      );

      const response = {
        success: false,
        error: errorMessage,
        errorCode: errorType,
        timestamp: new Date().toISOString()
      };

      logger.warn('API error response', {
        errorType,
        locale,
        component: 'localized-api-responses'
      });

      return new Response(JSON.stringify(response), {
        status: this.getErrorStatusCode(errorType),
        headers: {
          'Content-Type': 'application/json',
          'Content-Language': locale
        }
      });

    } catch (error) {
      logger.error('Failed to build localized error response', {
        errorType,
        locale,
        error: error.message,
        component: 'localized-api-responses'
      });

      // Fallback error response
      return new Response(JSON.stringify({
        success: false,
        error: 'An error occurred',
        errorCode: errorType,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Build localized success response
   */
  async buildSuccessResponse(
    successType: string,
    data: any,
    locale: SupportedLocale = 'en-US',
    variables?: Record<string, string>
  ): Promise<Response> {
    try {
      const localeData = await this.localeService.loadLocale(locale);
      const successMessage = this.localeService.getToken(
        localeData,
        `api.success.${successType}`,
        variables
      );

      const response = {
        success: true,
        message: successMessage,
        data,
        timestamp: new Date().toISOString()
      };

      logger.info('API success response', {
        successType,
        locale,
        component: 'localized-api-responses'
      });

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Language': locale
        }
      });

    } catch (error) {
      logger.error('Failed to build localized success response', {
        successType,
        locale,
        error: error.message,
        component: 'localized-api-responses'
      });

      // Fallback success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Operation successful',
        data,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Build localized validation error response
   */
  async buildValidationErrorResponse(
    fieldErrors: Record<string, string[]>,
    locale: SupportedLocale = 'en-US'
  ): Promise<Response> {
    try {
      const localeData = await this.localeService.loadLocale(locale);
      const localizedErrors: Record<string, string[]> = {};

      // Localize each field error
      for (const [field, errors] of Object.entries(fieldErrors)) {
        localizedErrors[field] = await Promise.all(
          errors.map(async (errorKey) => {
            // Try field-specific error first
            const fieldSpecificPath = `validation.${field}.${errorKey}`;
            let message = this.localeService.getToken(localeData, fieldSpecificPath);
            
            // Fallback to general validation error
            if (message.startsWith('[')) {
              message = this.localeService.getToken(
                localeData,
                `validation.${errorKey}`
              );
            }
            
            return message;
          })
        );
      }

      const response = {
        success: false,
        error: this.localeService.getToken(localeData, 'api.errors.invalidInput'),
        validationErrors: localizedErrors,
        timestamp: new Date().toISOString()
      };

      logger.warn('Validation error response', {
        fieldCount: Object.keys(fieldErrors).length,
        locale,
        component: 'localized-api-responses'
      });

      return new Response(JSON.stringify(response), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Content-Language': locale
        }
      });

    } catch (error) {
      logger.error('Failed to build localized validation error response', {
        locale,
        error: error.message,
        component: 'localized-api-responses'
      });

      // Fallback validation error
      return new Response(JSON.stringify({
        success: false,
        error: 'Validation failed',
        validationErrors: fieldErrors,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Extract locale from request
   */
  extractLocaleFromRequest(request: Request): SupportedLocale {
    // Check Accept-Language header
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
      // Simple parsing - in production would use proper parser
      if (acceptLanguage.includes('es')) {
        return 'es-ES';
      }
    }

    // Check custom header
    const customLocale = request.headers.get('X-User-Locale');
    if (customLocale) {
      return getUserLocale(customLocale);
    }

    // Default to English
    return 'en-US';
  }

  /**
   * Get appropriate HTTP status code for error type
   */
  private getErrorStatusCode(errorType: string): number {
    const statusMap: Record<string, number> = {
      notFound: 404,
      unauthorized: 401,
      rateLimited: 429,
      invalidInput: 400,
      serverError: 500,
      emailExists: 409,
      invalidEmail: 400,
      invalidDate: 400,
      invalidLocation: 400,
      trialExpired: 403,
      paymentFailed: 402,
      subscriptionNotFound: 404
    };

    return statusMap[errorType] || 500;
  }

  /**
   * Build rate limit error with specific details
   */
  async buildRateLimitResponse(
    retryAfter: number,
    locale: SupportedLocale = 'en-US'
  ): Promise<Response> {
    try {
      const localeData = await this.localeService.loadLocale(locale);
      const errorMessage = this.localeService.getToken(
        localeData,
        'api.errors.rateLimited'
      );

      const response = {
        success: false,
        error: errorMessage,
        errorCode: 'rateLimited',
        retryAfter,
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(response), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Content-Language': locale,
          'Retry-After': retryAfter.toString()
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests',
        errorCode: 'rateLimited',
        retryAfter,
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        }
      });
    }
  }
}

/**
 * Factory function for creating localized API response builder
 */
export function createLocalizedApiResponses(
  env: LocalizedApiEnv,
  brand?: string
): LocalizedApiResponses {
  return new LocalizedApiResponses(env, brand);
}

/**
 * Express/Koa style middleware for adding localized response methods
 */
export function withLocalizedResponses(env: LocalizedApiEnv) {
  const apiResponses = createLocalizedApiResponses(env);

  return async (request: Request) => {
    const locale = apiResponses.extractLocaleFromRequest(request);

    return {
      locale,
      async error(errorType: string, variables?: Record<string, string>) {
        return apiResponses.buildErrorResponse(errorType, locale, variables);
      },
      async success(successType: string, data: any, variables?: Record<string, string>) {
        return apiResponses.buildSuccessResponse(successType, data, locale, variables);
      },
      async validationError(fieldErrors: Record<string, string[]>) {
        return apiResponses.buildValidationErrorResponse(fieldErrors, locale);
      },
      async rateLimitError(retryAfter: number) {
        return apiResponses.buildRateLimitResponse(retryAfter, locale);
      }
    };
  };
} 