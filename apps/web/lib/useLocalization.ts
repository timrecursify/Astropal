import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { logger } from './logger';

// Types matching our backend locale structure
export type SupportedLocale = 'en-US' | 'es-ES';
export type PerspectiveType = 'calm' | 'knowledge' | 'success' | 'evidence';

// Hook for comprehensive localization
export function useLocalization() {
  const locale = useLocale() as SupportedLocale;
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const tUI = useTranslations('ui');
  const tPerspectives = useTranslations('perspectives');
  const tFocusAreas = useTranslations('focus_areas');

  // Date/time formatting functions
  const formatters = useMemo(() => {
    const dateFormat = locale === 'es-ES' ? 
      "d 'de' MMMM 'de' yyyy" : 
      'MMMM d, yyyy';

    return {
      date: new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit'
      }),
      currency: new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD'
      }),
      number: new Intl.NumberFormat(locale)
    };
  }, [locale]);

  // Perspective localization
  const getPerspectiveInfo = (perspective: PerspectiveType) => {
    try {
      return {
        name: tPerspectives(`${perspective}.name`),
        description: tPerspectives(`${perspective}.description`),
        shortDescription: tPerspectives(`${perspective}.short_description`)
      };
    } catch (error) {
      logger.log('error', 'Perspective info failed', { 
        component: 'useLocalization', 
        perspective,
        error: (error as Error).message
      });
      return {
        name: perspective,
        description: '',
        shortDescription: ''
      };
    }
  };

  // Focus area localization
  const getFocusAreaName = (focusArea: string) => {
    try {
      return tFocusAreas(focusArea);
    } catch (error) {
      return focusArea;
    }
  };

  // Validation message helpers
  const getValidationMessage = (field: string, errorType: string, variables?: Record<string, string>) => {
    try {
      // Try field-specific first
      const fieldSpecific = `${field}.${errorType}`;
      let message = tValidation(fieldSpecific);
      
      // Fallback to general validation message
      if (message === fieldSpecific) {
        message = tValidation(errorType);
      }

      // Replace variables if provided
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          message = message.replace(`{{${key}}}`, value);
        });
      }

      return message;
    } catch (error) {
      logger.log('error', 'Validation message failed', { 
        component: 'useLocalization', 
        field, 
        errorType,
        error: (error as Error).message
      });
      return `Validation error: ${errorType}`;
    }
  };

  // UI text helpers
  const getUIText = (path: string, variables?: Record<string, string>) => {
    try {
      let text = tUI(path);
      
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          text = text.replace(`{{${key}}}`, value);
        });
      }

      return text;
    } catch (error) {
      logger.log('error', 'UI text failed', { 
        component: 'useLocalization', 
        path,
        error: (error as Error).message
      });
      return path;
    }
  };

  // Common text helpers
  const getCommonText = (key: string) => {
    try {
      return tCommon(key);
    } catch (error) {
      return key;
    }
  };

  // Form validation schema helper
  const getValidationSchema = () => {
    return {
      required: getValidationMessage('', 'required'),
      email: getValidationMessage('', 'email'),
      minLength: (min: number) => getValidationMessage('', 'minLength', { min: min.toString() }),
      maxLength: (max: number) => getValidationMessage('', 'maxLength', { max: max.toString() }),
      birthDate: {
        future: getValidationMessage('birthDate', 'future'),
        tooYoung: getValidationMessage('birthDate', 'tooYoung'),
        tooOld: getValidationMessage('birthDate', 'tooOld')
      },
      birthLocation: {
        format: getValidationMessage('birthLocation', 'format'),
        invalid: getValidationMessage('birthLocation', 'invalid')
      },
      focusAreas: {
        min: getValidationMessage('focusAreas', 'min'),
        max: getValidationMessage('focusAreas', 'max')
      }
    };
  };

  return {
    locale,
    formatters,
    getPerspectiveInfo,
    getFocusAreaName,
    getValidationMessage,
    getUIText,
    getCommonText,
    getValidationSchema,
    
    // Direct formatter functions
    formatDate: (date: Date) => formatters.date.format(date),
    formatTime: (date: Date) => formatters.time.format(date),
    formatCurrency: (amount: number) => formatters.currency.format(amount),
    formatNumber: (number: number) => formatters.number.format(number),
    
    // Convenience getters
    isSpanish: locale === 'es-ES',
    isEnglish: locale === 'en-US'
  };
}

// Hook for perspective-specific content
export function usePerspectiveContent(perspective: PerspectiveType) {
  const { getPerspectiveInfo } = useLocalization();
  
  return useMemo(() => {
    const info = getPerspectiveInfo(perspective);
    
    const colors = {
      calm: { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/30' },
      knowledge: { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      success: { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      evidence: { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-500/30' }
    };

    return {
      ...info,
      colors: colors[perspective],
      cssClass: `perspective-${perspective}`
    };
  }, [perspective, getPerspectiveInfo]);
}

// Hook for form field localization
export function useFormLocalization() {
  const { getUIText, getValidationSchema } = useLocalization();
  
  return {
    labels: {
      email: getUIText('signup.email'),
      dateOfBirth: getUIText('signup.dateOfBirth'),
      birthLocation: getUIText('signup.birthLocation'),
      birthTime: getUIText('signup.birthTime'),
      timezone: getUIText('signup.timezone'),
      perspective: getUIText('signup.perspective'),
      focusAreas: getUIText('signup.focusAreas'),
      submit: getUIText('signup.submit'),
      submitting: getUIText('signup.submitting')
    },
    tooltips: {
      email: getUIText('signup.tooltips.email'),
      dateOfBirth: getUIText('signup.tooltips.dateOfBirth'),
      birthLocation: getUIText('signup.tooltips.birthLocation'),
      birthTime: getUIText('signup.tooltips.birthTime'),
      perspective: getUIText('signup.tooltips.perspective'),
      focusAreas: getUIText('signup.tooltips.focusAreas')
    },
    validation: getValidationSchema()
  };
} 