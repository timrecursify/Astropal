import { z } from 'zod';
import type { 
  Perspective, 
  FocusArea, 
  LocaleCode, 
  SubscriptionTier 
} from './types';

// Enum schemas for type safety
export const PerspectiveSchema = z.enum(['calm', 'knowledge', 'success', 'evidence'] as const);
export const FocusAreaSchema = z.enum(['relationships', 'career', 'wellness', 'social', 'spiritual', 'evidence-based'] as const);
export const LocaleCodeSchema = z.enum(['en-US', 'es-ES'] as const);
export const SubscriptionTierSchema = z.enum(['trial', 'free', 'basic', 'pro'] as const);

// Birth date validation with business rules
export const BirthDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
  .refine((date) => {
    const birthDate = new Date(date);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return false;
    }
    
    // Cannot be in the future
    if (birthDate > now) {
      return false;
    }
    
    // Must be at least 13 years old (COPPA compliance)
    const thirteenYearsAgo = new Date();
    thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
    if (birthDate > thirteenYearsAgo) {
      return false;
    }
    
    // Maximum 120 years old (reasonable limit)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 120);
    if (birthDate < maxAge) {
      return false;
    }
    
    return true;
  }, 'Please enter a valid birth date (must be at least 13 years old)');

// Birth location validation
export const BirthLocationSchema = z.string()
  .min(3, 'Birth location must be at least 3 characters')
  .max(100, 'Birth location must be no more than 100 characters')
  .regex(/^[a-zA-Z\s,'\-]+$/, 'Location can only contain letters, spaces, commas, hyphens, and apostrophes')
  .regex(/^.+,\s*.+$/, 'Please enter in "City, Country" format')
  .refine((location) => {
    const parts = location.split(',').map(p => p.trim());
    return parts.length >= 2 && parts.every(p => p.length > 0);
  }, 'Please provide both city and country');

// Birth time validation (optional)
export const BirthTimeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Birth time must be in HH:MM format (24-hour)')
  .optional()
  .default('12:00');

// Email validation with enhanced rules
export const EmailSchema = z.string()
  .email('Please enter a valid email address')
  .max(320, 'Email address is too long') // RFC 5321 limit
  .toLowerCase()
  .refine((email) => {
    // Basic disposable email check
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    return !disposableDomains.includes(domain);
  }, 'Please use a permanent email address');

// Timezone validation
export const TimezoneSchema = z.string()
  .min(1, 'Timezone is required')
  .max(50, 'Timezone name is too long')
  .refine((tz) => {
    try {
      // Validate timezone by attempting to create a date formatter
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid timezone');

// User registration schema
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  birthDate: BirthDateSchema,
  birthLocation: BirthLocationSchema,
  birthTime: BirthTimeSchema,
  timezone: TimezoneSchema,
  locale: LocaleCodeSchema,
  perspective: PerspectiveSchema,
  focusAreas: z.array(FocusAreaSchema)
    .min(1, 'Please select at least one focus area')
    .max(3, 'Please select no more than 3 focus areas')
    .refine((areas) => {
      // Ensure unique focus areas
      return new Set(areas).size === areas.length;
    }, 'Focus areas must be unique'),
  referralCode: z.string()
    .max(20, 'Referral code is too long')
    .regex(/^[A-Z0-9]+$/, 'Referral code can only contain uppercase letters and numbers')
    .optional()
});

// Preferences update schema
export const UpdatePreferencesRequestSchema = z.object({
  locale: LocaleCodeSchema.optional(),
  perspective: PerspectiveSchema.optional(),
  focusAreas: z.array(FocusAreaSchema)
    .min(1, 'Please select at least one focus area')
    .max(3, 'Please select no more than 3 focus areas')
    .optional(),
  timezone: TimezoneSchema.optional()
}).refine((data) => {
  // At least one field must be provided
  return Object.values(data).some(value => value !== undefined);
}, 'At least one preference must be specified');

// Content generation schemas
export const ContentSectionSchema = z.object({
  id: z.string(),
  type: z.enum(['introduction', 'daily_insight', 'horoscope', 'news_analysis', 'call_to_action']),
  heading: z.string().min(1, 'Section heading is required'),
  content: z.string().min(1, 'Section content is required'),
  html: z.string().min(1, 'Section HTML is required'),
  focusArea: FocusAreaSchema.optional()
});

export const NewsletterContentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  generatedAt: z.string().datetime(),
  locale: LocaleCodeSchema,
  perspective: PerspectiveSchema,
  tier: SubscriptionTierSchema,
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  preheader: z.string().min(1, 'Preheader is required').max(140, 'Preheader is too long'),
  sections: z.array(ContentSectionSchema).min(1, 'At least one content section is required'),
  fallback: z.boolean().optional(),
  metadata: z.object({
    generationTime: z.number().positive(),
    tokenCount: z.number().nonnegative(),
    model: z.string(),
    ephemerisDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cost: z.number().nonnegative()
  })
});

// API response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  traceId: z.string(),
  timestamp: z.string().datetime()
});

// Validation error schema
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string()
});

// Authentication token schema
export const AuthTokenSchema = z.string()
  .length(64, 'Authentication token must be exactly 64 characters')
  .regex(/^[a-f0-9]+$/, 'Authentication token must be hexadecimal');

// Utility functions for validation
export const validateEmail = (email: string) => {
  const result = EmailSchema.safeParse(email);
  return {
    isValid: result.success,
    error: result.success ? null : result.error.errors[0]?.message
  };
};

export const validateBirthDate = (date: string) => {
  const result = BirthDateSchema.safeParse(date);
  return {
    isValid: result.success,
    error: result.success ? null : result.error.errors[0]?.message
  };
};

export const validateBirthLocation = (location: string) => {
  const result = BirthLocationSchema.safeParse(location);
  return {
    isValid: result.success,
    error: result.success ? null : result.error.errors[0]?.message
  };
};

export const validateFocusAreas = (areas: string[]) => {
  const schema = z.array(FocusAreaSchema).min(1).max(3);
  const result = schema.safeParse(areas);
  return {
    isValid: result.success,
    error: result.success ? null : result.error.errors[0]?.message
  };
};

// Type exports derived from schemas
export type ValidatedRegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ValidatedUpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;
export type ValidatedNewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type ValidatedApiResponse = z.infer<typeof ApiResponseSchema>; 