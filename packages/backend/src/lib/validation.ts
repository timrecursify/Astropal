import { z } from 'zod';
import { logger } from '@/lib/logger';

// Valid focus areas
export const FOCUS_AREAS = [
  'relationships',
  'career', 
  'wellness',
  'social',
  'spiritual',
  'evidence-based'
] as const;

// Valid perspectives
export const PERSPECTIVES = [
  'calm',
  'knowledge', 
  'success',
  'evidence'
] as const;

// Valid locales
export const LOCALES = [
  'en-US',
  'es-ES'
] as const;

// Valid tiers
export const TIERS = [
  'trial',
  'free',
  'basic',
  'pro'
] as const;

// Email validation with proper RFC compliance
const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(320, 'Email too long') // RFC 5321 limit
  .toLowerCase()
  .refine(email => !email.includes('+'), 'Email aliases not allowed');

// Birth date validation
const birthDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be YYYY-MM-DD format')
  .refine(date => {
    const parsed = new Date(date);
    const now = new Date();
    const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    const maxAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
    
    return parsed >= minAge && parsed <= maxAge;
  }, 'Birth date must be between 13 and 120 years ago');

// Birth location validation  
const birthLocationSchema = z.string()
  .min(3, 'Birth location too short')
  .max(100, 'Birth location too long')
  .regex(/^.+,\s*.+$/, 'Birth location must be "City, Country" format')
  .refine(location => {
    const parts = location.split(',');
    return parts.length === 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0;
  }, 'Birth location must have both city and country');

// Birth time validation
const birthTimeSchema = z.string()
  .regex(/^\d{2}:\d{2}$/, 'Birth time must be HH:MM format')
  .refine(time => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }, 'Invalid time format')
  .optional()
  .default('12:00');

// Timezone validation
const timezoneSchema = z.string()
  .min(1, 'Timezone required')
  .max(50, 'Timezone too long')
  .refine(tz => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid timezone identifier');

// Registration request schema
export const RegisterRequestSchema = z.object({
  email: emailSchema,
  birthDate: birthDateSchema,
  birthLocation: birthLocationSchema,
  birthTime: birthTimeSchema,
  timezone: timezoneSchema,
  locale: z.enum(LOCALES).default('en-US'),
  perspective: z.enum(PERSPECTIVES).default('calm'),
  focusAreas: z.array(z.enum(FOCUS_AREAS))
    .min(1, 'At least one focus area required')
    .max(3, 'Maximum 3 focus areas allowed')
    .refine(areas => new Set(areas).size === areas.length, 'Focus areas must be unique'),
  referralCode: z.string().max(20, 'Referral code too long').optional()
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// Registration response schema
export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    tier: z.enum(TIERS),
    trialEnd: z.string(),
    authToken: z.string()
  }).optional(),
  error: z.string().optional(),
  traceId: z.string()
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// Token validation schema
export const TokenValidationSchema = z.object({
  token: z.string()
    .min(32, 'Token too short')
    .max(128, 'Token too long')
    .regex(/^[a-f0-9]+$/, 'Invalid token format')
});

export type TokenValidation = z.infer<typeof TokenValidationSchema>;

// User update schema
export const UserUpdateSchema = z.object({
  locale: z.enum(LOCALES).optional(),
  perspective: z.enum(PERSPECTIVES).optional(),
  focusAreas: z.array(z.enum(FOCUS_AREAS))
    .min(1)
    .max(3)
    .refine(areas => new Set(areas).size === areas.length)
    .optional(),
  timezone: timezoneSchema.optional()
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Rate limiting validation
export const RateLimitSchema = z.object({
  key: z.string().min(1),
  window: z.number().positive(),
  limit: z.number().positive()
});

// Email log schema
export const EmailLogSchema = z.object({
  userId: z.string(),
  templateType: z.enum(['welcome', 'daily', 'weekly', 'monthly', 'trial_ending']),
  subject: z.string().min(1).max(200),
  status: z.enum(['sent', 'failed', 'bounced', 'delivered']),
  resendId: z.string().optional(),
  errorMessage: z.string().optional()
});

export type EmailLog = z.infer<typeof EmailLogSchema>;

// Validation helper functions
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validate and parse request data with logging
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = 'request'
): T {
  try {
    logger.debug('Validating request data', { 
      context,
      component: 'validation'
    });
    
    const result = schema.parse(data);
    
    logger.debug('Request validation successful', { 
      context,
      component: 'validation'
    });
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      logger.warn('Request validation failed', {
        context,
        errors: validationErrors,
        component: 'validation'
      });
      
      throw new ValidationError(
        `Validation failed: ${validationErrors[0].message}`,
        validationErrors[0].field,
        validationErrors[0].code
      );
    }
    
    logger.error('Unexpected validation error', {
      context,
      error: (error as Error).message,
      component: 'validation'
    });
    
    throw error;
  }
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

// Validate IP address format
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Validate user agent string
export function sanitizeUserAgent(userAgent: string): string {
  return userAgent
    .replace(/[^\w\s\-\.\(\)\/;:]/g, '') // Keep only safe characters
    .substring(0, 500); // Limit length
}

// Password strength validation (if needed for admin accounts)
export const PasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

// Common validation patterns
export const ValidationPatterns = {
  // ID validation
  id: z.string().min(1).max(50),
  
  // URL validation
  url: z.string().url().max(2000),
  
  // Date validation
  isoDate: z.string().datetime(),
  
  // Positive integer
  positiveInt: z.number().int().positive(),
  
  // Non-negative number
  nonNegativeNumber: z.number().min(0),
  
  // Slug validation
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  
  // JSON string validation
  jsonString: z.string().refine(str => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON format')
}; 