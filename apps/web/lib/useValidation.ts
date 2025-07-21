import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createSignUpSchema } from './validation';

// Hook for localized validation schemas
export function useLocalizedValidation() {
  const t = useTranslations();

  // Create localized validation schema
  const localizedSignUpSchema = useMemo(() => {
    const translator = (key: string, vars?: Record<string, string>) => {
      try {
        let message = t(key);
        
        // Replace variables if provided
        if (vars) {
          Object.entries(vars).forEach(([varKey, value]) => {
            message = message.replace(`{{${varKey}}}`, value);
          });
        }
        
        return message;
      } catch (error) {
        // Fallback to English if translation fails
        const fallbackMessages: Record<string, string> = {
          'validation.required': 'This field is required',
          'validation.email': 'Please enter a valid email address',
          'validation.minLength': 'Must be at least {{min}} characters',
          'validation.maxLength': 'Must be no more than {{max}} characters',
          'validation.birthDate.invalid': 'Please enter a valid birth date',
          'validation.birthDate.future': 'Birth date cannot be in the future',
          'validation.birthDate.tooYoung': 'You must be at least 13 years old',
          'validation.birthDate.tooOld': 'Please enter a valid birth date',
          'validation.birthLocation.format': 'Please enter in "City, Country" format',
          'validation.birthLocation.invalid': 'Location can only contain letters, spaces, commas, hyphens, and apostrophes',
          'validation.birthLocation.minLength': 'Birth location must be at least 3 characters',
          'validation.focusAreas.min': 'Please select at least one focus area',
          'validation.focusAreas.max': 'Please select no more than 3 focus areas'
        };
        
        let fallback = fallbackMessages[key] || key;
        
        // Replace variables in fallback
        if (vars) {
          Object.entries(vars).forEach(([varKey, value]) => {
            fallback = fallback.replace(`{{${varKey}}}`, value);
          });
        }
        
        return fallback;
      }
    };

    return createSignUpSchema(translator);
  }, [t]);

  return {
    signUpSchema: localizedSignUpSchema
  };
}

// Export for easy use
export { createSignUpSchema } from './validation'; 