// User and subscription types
export interface User {
  id: string;
  email: string;
  authToken: string;
  birthDate: string; // YYYY-MM-DD format
  birthLocation: string; // "City, Country" format
  birthTime: string; // "HH:MM" format
  timezone: string;
  locale: string; // ISO locale code (en-US, es-ES)
  perspective: Perspective;
  tier: SubscriptionTier;
  focusPreferences: FocusArea[];
  trialEnd?: string; // ISO date string
  lastActivity?: string; // ISO date string
  createdAt: string; // ISO date string
}

// Subscription tiers
export type SubscriptionTier = 'trial' | 'free' | 'basic' | 'pro';

// User perspectives for content generation
export type Perspective = 'calm' | 'knowledge' | 'success' | 'evidence';

// Focus areas for personalization
export type FocusArea = 'relationships' | 'career' | 'wellness' | 'social' | 'spiritual' | 'evidence-based';

// Locale codes supported by the platform
export type LocaleCode = 'en-US' | 'es-ES';

// Newsletter content structure
export interface NewsletterContent {
  id: string;
  userId: string;
  generatedAt: string; // ISO date string
  locale: LocaleCode;
  perspective: Perspective;
  tier: SubscriptionTier;
  subject: string;
  preheader: string;
  sections: ContentSection[];
  fallback?: boolean; // True if fallback content was used
  metadata: ContentMetadata;
}

export interface ContentSection {
  id: string;
  type: 'introduction' | 'daily_insight' | 'horoscope' | 'news_analysis' | 'call_to_action';
  heading: string;
  content: string;
  html: string;
  focusArea?: FocusArea;
}

export interface ContentMetadata {
  generationTime: number; // milliseconds
  tokenCount: number;
  model: string; // 'grok-3-mini', 'grok-3', 'gpt-4o'
  ephemerisDate: string; // YYYY-MM-DD
  cost: number; // USD cents
}

// API Request/Response types
export interface RegisterRequest {
  email: string;
  birthDate: string;
  birthLocation: string;
  birthTime?: string;
  timezone: string;
  locale: LocaleCode;
  perspective: Perspective;
  focusAreas: FocusArea[];
  referralCode?: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    tier: SubscriptionTier;
    trialEnd: string;
    authToken: string;
  };
  error?: string;
  traceId: string;
}

export interface UpdatePreferencesRequest {
  locale?: LocaleCode;
  perspective?: Perspective;
  focusAreas?: FocusArea[];
  timezone?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  traceId: string;
  timestamp: string;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Ephemeris and astronomical data
export interface EphemerisData {
  date: string; // YYYY-MM-DD
  sun: PlanetaryPosition;
  moon: PlanetaryPosition;
  planets: Record<string, PlanetaryPosition>;
  aspects: AspectData[];
  moonPhase: MoonPhase;
}

export interface PlanetaryPosition {
  longitude: number; // degrees
  latitude: number; // degrees
  distance: number; // AU
  sign: ZodiacSign;
  degree: number; // within sign
  retrograde: boolean;
}

export interface AspectData {
  planet1: string;
  planet2: string;
  type: AspectType;
  orb: number; // degrees
  exact: boolean;
}

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'quincunx';

export type ZodiacSign = 
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface MoonPhase {
  phase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 
         'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  illumination: number; // 0-1
  age: number; // days since new moon
}

// Email and notification types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  locale: LocaleCode;
  variables: string[];
}

export interface EmailLog {
  id: string;
  userId: string;
  template: string;
  sentAt: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  openAt?: string;
  clickAt?: string;
  metadata: Record<string, any>;
}

// Billing and subscription types
export interface SubscriptionData {
  id: string;
  userId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  tier: SubscriptionTier;
}

export interface PaymentLink {
  name: string;
  description: string;
  price: number; // cents
  interval: 'month' | 'year';
  paymentLink: string;
  features: string[];
}

// Error types
export interface AppError extends Error {
  code: string;
  statusCode: number;
  context?: Record<string, any>;
} 