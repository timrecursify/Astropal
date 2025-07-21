import { z } from 'zod';

// Security constants
const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit
const MAX_LOCATION_LENGTH = 100;
const MIN_AGE_YEARS = 13;
const MAX_AGE_YEARS = 120;

// Email security validation
const emailSecurity = z.string()
  .min(1, 'Email is required')
  .max(MAX_EMAIL_LENGTH, `Email must be less than ${MAX_EMAIL_LENGTH} characters`)
  .email('Please enter a valid email address')
  .refine((email) => {
    // Prevent email injection attacks
    const dangerousChars = /[<>'"&;]/;
    return !dangerousChars.test(email);
  }, 'Email contains invalid characters')
  .refine((email) => {
    // Prevent homograph attacks and ensure ASCII domain
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    // Only allow ASCII characters in domain
    return /^[a-zA-Z0-9.-]+$/.test(domain);
  }, 'Email domain contains invalid characters')
  .refine((email) => {
    // Check for common disposable email patterns
    const disposablePatterns = [
      /temp.*mail/i, /disposable/i, /throwaway/i, /guerrilla/i, /spam/i
    ];
    return !disposablePatterns.some(pattern => pattern.test(email));
  }, 'Please use a permanent email address')
  .refine((email) => {
    // Ensure proper domain structure
    const parts = email.split('@');
    const domain = parts[1];
    const domainParts = domain.split('.');
    return domainParts.length >= 2 && domainParts[domainParts.length - 1].length >= 2;
  }, 'Please enter a valid email domain');

// Location security validation
const locationSecurity = z.string()
  .min(1, 'Birth location is required')
  .min(3, 'Birth location must be at least 3 characters')
  .max(MAX_LOCATION_LENGTH, `Birth location must be less than ${MAX_LOCATION_LENGTH} characters`)
  .refine((location) => {
    // Prevent injection attacks
    const dangerousChars = /[<>'"&;{}()[\]]/;
    return !dangerousChars.test(location);
  }, 'Location contains invalid characters')
  .refine((location) => {
    // Validate city, country format
    const parts = location.split(',').map(part => part.trim());
    return parts.length >= 2 && 
           parts[0].length >= 2 && 
           parts[1].length >= 2;
  }, 'Please enter in "City, Country" format')
  .refine((location) => {
    // Only allow letters, spaces, commas, hyphens, apostrophes, and periods
    const validChars = /^[a-zA-Z\s,'-.\u00C0-\u017F\u0100-\u01FF]+$/;
    return validChars.test(location);
  }, 'Location can only contain letters, spaces, commas, hyphens, apostrophes, and periods')
  .refine((location) => {
    // Prevent excessively long words (potential attack)
    const words = location.split(/[\s,]+/);
    return words.every(word => word.length <= 50);
  }, 'Location contains words that are too long');

// Date security validation
const dateOfBirthSecurity = z.string()
  .min(1, 'Date of birth is required')
  .refine((date) => {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
  }, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Please enter a valid date')
  .refine((date) => {
    const parsed = new Date(date);
    const today = new Date();
    return parsed <= today;
  }, 'Birth date cannot be in the future')
  .refine((date) => {
    const parsed = new Date(date);
    const today = new Date();
    const minAge = new Date();
    minAge.setFullYear(today.getFullYear() - MIN_AGE_YEARS);
    return parsed <= minAge;
  }, `You must be at least ${MIN_AGE_YEARS} years old`)
  .refine((date) => {
    const parsed = new Date(date);
    const today = new Date();
    const maxAge = new Date();
    maxAge.setFullYear(today.getFullYear() - MAX_AGE_YEARS);
    return parsed >= maxAge;
  }, `Please enter a valid birth date (maximum age ${MAX_AGE_YEARS} years)`);

// Focus areas validation with security
const focusAreasSecurity = z.array(z.string())
  .min(1, 'Please select at least one focus area')
  .max(3, 'Please select no more than 3 focus areas')
  .refine((focuses) => {
    const validFocuses = ['relationships', 'career', 'wellness', 'social', 'spiritual', 'evidence-based'];
    return focuses.every(focus => validFocuses.includes(focus));
  }, 'Invalid focus area selected')
  .refine((focuses) => {
    // Ensure no duplicates
    return new Set(focuses).size === focuses.length;
  }, 'Duplicate focus areas not allowed');

// Enhanced signup schema with security
export const createSignUpSchema = (t: (key: string, vars?: any) => string) => {
  return z.object({
    email: emailSecurity,
    dob: dateOfBirthSecurity,
    birthLocation: locationSecurity,
    focuses: focusAreasSecurity,
    locale: z.string().min(2).max(10).refine((locale) => {
      // Only allow valid locale formats
      return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
    }, 'Invalid locale format'),
    referral: z.string().max(50).optional().refine((ref) => {
      // If referral code exists, validate it
      if (!ref) return true;
      const validChars = /^[a-zA-Z0-9-_]+$/;
      return validChars.test(ref);
    }, 'Invalid referral code format'),
  });
};

// Legacy schema with enhanced security
export const signUpSchema = z.object({
  email: emailSecurity,
  dob: dateOfBirthSecurity,
  birthLocation: locationSecurity,
  focuses: focusAreasSecurity,
  locale: z.string().min(2).max(10).refine((locale) => {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
  }, 'Invalid locale format'),
  referral: z.string().max(50).optional().refine((ref) => {
    if (!ref) return true;
    const validChars = /^[a-zA-Z0-9-_]+$/;
    return validChars.test(ref);
  }, 'Invalid referral code format'),
});

export type SignUpData = z.infer<typeof signUpSchema>;

// Preferences validation schema
export const preferencesSchema = z.object({
  perspective: z.enum(['calm', 'knowledge', 'success', 'evidence'], {
    errorMap: () => ({ message: 'Please select a valid perspective' })
  }),
  focusAreas: focusAreasSecurity.optional(),
  locale: z.string().min(2).max(10).optional().refine((locale) => {
    if (!locale) return true;
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
  }, 'Invalid locale format'),
});

export type PreferencesData = z.infer<typeof preferencesSchema>;

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove dangerous HTML chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1000); // Limit length
};

export const sanitizeLocation = (location: string): string => {
  return location
    .trim()
    .replace(/[<>'"&{}()[\]]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, MAX_LOCATION_LENGTH);
};

// Rate limiting helpers
export const checkSubmissionRate = (email: string): boolean => {
  const key = `submission_${email}`;
  const lastSubmission = localStorage.getItem(key);
  
  if (lastSubmission) {
    const timeDiff = Date.now() - parseInt(lastSubmission);
    const cooldownPeriod = 60 * 1000; // 1 minute cooldown
    
    if (timeDiff < cooldownPeriod) {
      return false; // Too frequent
    }
  }
  
  localStorage.setItem(key, Date.now().toString());
  return true;
};

// CSRF token generation (for additional security)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Honeypot field validation (bot detection)
export const createHoneypotField = () => ({
  name: 'website', // Common honeypot field name
  style: { display: 'none' },
  'aria-hidden': true,
  tabIndex: -1,
  autoComplete: 'off'
});