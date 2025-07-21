import type { Perspective, FocusArea, SubscriptionTier, LocaleCode } from './types';

// Subscription tier configuration
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, {
  name: string;
  description: string;
  price: number; // USD cents per month
  features: string[];
  emailsPerDay: number;
  maxTokensPerEmail: number;
}> = {
  trial: {
    name: 'Trial',
    description: '7-day free trial with full access',
    price: 0,
    features: [
      '2 personalized emails daily',
      'All perspectives available',
      'Basic astrological insights'
    ],
    emailsPerDay: 2,
    maxTokensPerEmail: 1000
  },
  free: {
    name: 'Free',
    description: 'Basic cosmic guidance',
    price: 0,
    features: [
      '1 personalized email daily',
      'Basic astrological insights',
      'Limited perspective options'
    ],
    emailsPerDay: 1,
    maxTokensPerEmail: 800
  },
  basic: {
    name: 'Basic',
    description: 'Enhanced daily guidance',
    price: 799, // $7.99
    features: [
      '2 personalized emails daily',
      'Weekly cosmic weather',
      'Monthly forecast',
      'All perspectives available'
    ],
    emailsPerDay: 2,
    maxTokensPerEmail: 1200
  },
  pro: {
    name: 'Pro',
    description: 'Complete cosmic guidance',
    price: 1499, // $14.99
    features: [
      '3 personalized emails daily',
      'News analysis with cosmic interpretation',
      'Advanced astrological insights',
      'Priority support',
      'Early access to new features'
    ],
    emailsPerDay: 3,
    maxTokensPerEmail: 1800
  }
};

// Perspective configuration
export const PERSPECTIVES: Record<Perspective, {
  name: string;
  description: string;
  tone: string;
  focus: string;
  style: string;
  keywords: string[];
  color: string; // For UI theming
}> = {
  calm: {
    name: 'Calm & Centered',
    description: 'Gentle guidance for inner peace and mindful living',
    tone: 'gentle, reassuring, peaceful',
    focus: 'inner harmony, meditation, balance',
    style: 'soft, flowing, contemplative',
    keywords: ['peace', 'serenity', 'mindfulness', 'tranquility', 'balance', 'harmony'],
    color: '#10B981' // Emerald
  },
  knowledge: {
    name: 'Knowledge Seeker',
    description: 'Deep insights and astronomical understanding',
    tone: 'informative, educational, curious',
    focus: 'learning, understanding, wisdom',
    style: 'detailed, analytical, exploratory',
    keywords: ['discover', 'understand', 'explore', 'learn', 'wisdom', 'insight'],
    color: '#3B82F6' // Blue
  },
  success: {
    name: 'Success Driven',
    description: 'Achievement-focused guidance with strategic timing',
    tone: 'motivational, action-oriented, confident',
    focus: 'achievement, goals, progress',
    style: 'direct, energetic, ambitious',
    keywords: ['achieve', 'succeed', 'accomplish', 'excel', 'progress', 'goals'],
    color: '#F59E0B' // Amber
  },
  evidence: {
    name: 'Evidence Based',
    description: 'Scientific approach with data-driven observations',
    tone: 'factual, scientific, objective',
    focus: 'astronomical events, data, observations',
    style: 'precise, technical, informative',
    keywords: ['data', 'observation', 'phenomenon', 'measurement', 'scientific', 'empirical'],
    color: '#6366F1' // Indigo
  }
};

// Focus area configuration
export const FOCUS_AREAS: Record<FocusArea, {
  name: string;
  description: string;
  keywords: string[];
  icon: string; // For UI representation
}> = {
  relationships: {
    name: 'Relationships',
    description: 'Love, partnerships, family, and social connections',
    keywords: ['love', 'partnership', 'family', 'friends', 'communication', 'intimacy'],
    icon: '❤️'
  },
  career: {
    name: 'Career',
    description: 'Professional growth, leadership, and financial success',
    keywords: ['career', 'job', 'leadership', 'money', 'success', 'ambition'],
    icon: '💼'
  },
  wellness: {
    name: 'Wellness',
    description: 'Physical health, mental well-being, and life balance',
    keywords: ['health', 'fitness', 'energy', 'vitality', 'healing', 'balance'],
    icon: '🌱'
  },
  social: {
    name: 'Social',
    description: 'Community, networking, and public interactions',
    keywords: ['community', 'networking', 'social', 'public', 'reputation', 'influence'],
    icon: '🤝'
  },
  spiritual: {
    name: 'Spiritual',
    description: 'Personal growth, intuition, and life purpose',
    keywords: ['spiritual', 'intuition', 'purpose', 'growth', 'wisdom', 'consciousness'],
    icon: '✨'
  },
  'evidence-based': {
    name: 'Evidence-Based',
    description: 'Data-driven insights and scientific observations',
    keywords: ['data', 'science', 'research', 'evidence', 'analysis', 'facts'],
    icon: '🔬'
  }
};

// Locale configuration
export const LOCALES: Record<LocaleCode, {
  name: string;
  nativeName: string;
  flag: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  rtl: boolean;
}> = {
  'en-US': {
    name: 'English (US)',
    nativeName: 'English',
    flag: '🇺🇸',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: 'h:mm a',
    currency: 'USD',
    rtl: false
  },
  'es-ES': {
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    flag: '🇪🇸',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    rtl: false
  }
};

// Content generation limits
export const CONTENT_LIMITS = {
  SUBJECT_MAX_LENGTH: 200,
  PREHEADER_MAX_LENGTH: 140,
  SECTION_HEADING_MAX_LENGTH: 100,
  SECTION_CONTENT_MAX_LENGTH: 2000,
  MAX_SECTIONS_PER_EMAIL: 6,
  MIN_SECTIONS_PER_EMAIL: 1
};

// Token and cost limits
export const TOKEN_LIMITS = {
  DAILY_QUOTA: {
    free: 1000,
    basic: 1500,
    pro: 2000,
    trial: 1200
  },
  MONTHLY_QUOTA: {
    free: 30000,
    basic: 45000,
    pro: 60000,
    trial: 36000
  },
  COST_PER_1K_TOKENS: {
    'grok-3-mini': 0.0005, // $0.50 per 1M tokens
    'grok-3': 0.0008,      // $0.80 per 1M tokens
    'gpt-4o': 0.0025       // $2.50 per 1M tokens
  }
};

// Email scheduling constants
export const EMAIL_SCHEDULE = {
  MORNING_SEND_TIME: '06:00',
  EVENING_SEND_TIME: '18:00',
  WEEKLY_SEND_TIME: '09:00',
  MONTHLY_SEND_TIME: '10:00',
  TRIAL_REMINDER_DAYS: 2,    // Days before trial ends
  UPGRADE_REMINDER_DAYS: 7   // Days between upgrade reminders
};

// API rate limits
export const RATE_LIMITS = {
  REGISTRATION: {
    PER_EMAIL: 1,              // 1 signup per email per day
    PER_IP: 5,                 // 5 signups per IP per hour
    WINDOW_HOURS: 24
  },
  API_REQUESTS: {
    PER_USER: 100,             // 100 requests per user per hour
    PER_IP: 1000,              // 1000 requests per IP per hour
    WINDOW_HOURS: 1
  },
  CONTENT_GENERATION: {
    PER_USER: 10,              // 10 generations per user per day
    WINDOW_HOURS: 24
  }
};

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  EPHEMERIS_DATA: 7 * 24 * 60 * 60,      // 7 days
  GENERATED_CONTENT: 48 * 60 * 60,        // 48 hours
  LOCALE_DATA: 0,                         // No expiry (manually managed)
  METRICS: 7 * 24 * 60 * 60,             // 7 days
  USER_PREFERENCES: 24 * 60 * 60,         // 24 hours
  EMAIL_TEMPLATES: 24 * 60 * 60           // 24 hours
};

// Validation constants
export const VALIDATION = {
  MIN_AGE_YEARS: 13,                      // COPPA compliance
  MAX_AGE_YEARS: 120,                     // Reasonable maximum
  MIN_LOCATION_LENGTH: 3,
  MAX_LOCATION_LENGTH: 100,
  MAX_EMAIL_LENGTH: 320,                  // RFC 5321 limit
  MAX_REFERRAL_CODE_LENGTH: 20,
  MIN_FOCUS_AREAS: 1,
  MAX_FOCUS_AREAS: 3
};

// External API endpoints
export const EXTERNAL_APIS = {
  NASA_JPL: 'https://ssd.jpl.nasa.gov/api/horizons.api',
  SWISS_EPHEMERIS: 'https://www.astro.com/swisseph/swetest',
  NEWS_API: 'https://newsapi.org/v2/top-headlines',
  GROK_API: 'https://api.x.ai/v1/chat/completions',
  OPENAI_API: 'https://api.openai.com/v1/chat/completions'
};

// Error codes
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  CONTENT_GENERATION_FAILED: 'CONTENT_GENERATION_FAILED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  EXTERNAL_API_FAILED: 'EXTERNAL_API_FAILED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SUBSCRIPTION_ERROR: 'SUBSCRIPTION_ERROR',
  WEBHOOK_ERROR: 'WEBHOOK_ERROR'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  PREFERENCES_UPDATED: 'Preferences updated successfully',
  CONTENT_GENERATED: 'Content generated successfully',
  EMAIL_SENT: 'Email sent successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
  WEBHOOK_PROCESSED: 'Webhook processed successfully'
} as const; 