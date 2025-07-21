import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table - Core user data
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  authToken: text('auth_token').notNull().unique(), // Hashed auth token
  birthDate: text('birth_date').notNull(), // YYYY-MM-DD format
  birthLocation: text('birth_location').notNull(), // "City, Country"
  birthTime: text('birth_time').default('12:00'), // HH:MM format
  timezone: text('timezone').notNull(), // IANA timezone
  locale: text('locale').default('en-US'), // i18n locale
  perspective: text('perspective').default('calm'), // calm|knowledge|success|evidence
  tier: text('tier').default('trial'), // trial|free|basic|pro
  trialEnd: text('trial_end'), // ISO timestamp
  trialReminderSent: integer('trial_reminder_sent', { mode: 'boolean' }).default(false),
  lastUpgradeReminder: text('last_upgrade_reminder'), // ISO timestamp
  referralCode: text('referral_code'),
  focusPreferences: text('focus_preferences'), // JSON array of focus areas
  lastActivity: text('last_activity'), // ISO timestamp
  emailStatus: text('email_status').default('active'), // active|bounced|unsubscribed
  unsubscribedAt: text('unsubscribed_at'), // ISO timestamp
  lastBounce: text('last_bounce'), // ISO timestamp
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Subscriptions table - Billing and subscription management
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // active|canceled|past_due|unpaid
  stripeCustomer: text('stripe_customer'),
  stripeSubscription: text('stripe_subscription'),
  currentPeriodEnd: text('current_period_end'), // ISO timestamp
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Signup attempts table - Rate limiting and abuse prevention
export const signupAttempts = sqliteTable('signup_attempts', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  ipAddress: text('ip_address').notNull(),
  attemptedAt: text('attempted_at').default(sql`CURRENT_TIMESTAMP`),
  status: text('status').notNull(), // success|duplicate|rate_limited|invalid|failed
  userAgent: text('user_agent'),
  referrer: text('referrer'),
});

// Email logs table - Email delivery tracking
export const emailLogs = sqliteTable('email_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  templateType: text('template_type').notNull(), // welcome|daily|weekly|monthly|trial_ending
  subject: text('subject').notNull(),
  sentAt: text('sent_at').default(sql`CURRENT_TIMESTAMP`),
  status: text('status').notNull(), // sent|failed|bounced|delivered
  resendId: text('resend_id'), // Resend email ID for tracking
  openAt: text('open_at'), // ISO timestamp when opened
  clickAt: text('click_at'), // ISO timestamp when clicked
  errorMessage: text('error_message'), // If delivery failed
});

// Ephemeris cache table - Astronomical data caching
export const ephemerisCache = sqliteTable('ephemeris_cache', {
  date: text('date').primaryKey(), // YYYY-MM-DD
  jsonData: text('json_data').notNull(), // Stringified astronomical data
  source: text('source').notNull(), // nasa_jpl|swiss_ephemeris
  fetchedAt: text('fetched_at').default(sql`CURRENT_TIMESTAMP`),
});

// News cache table - News data for Pro tier
export const newsCache = sqliteTable('news_cache', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  headline: text('headline').notNull(),
  summary: text('summary'),
  url: text('url'),
  source: text('source').notNull(), // newsapi|guardian|etc
  category: text('category'), // business|technology|health|etc
  fetchedAt: text('fetched_at').default(sql`CURRENT_TIMESTAMP`),
});

// Content templates table - Email template metadata
export const contentTemplates = sqliteTable('content_templates', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(), // cosmic-pulse|personal-horoscope|weekly-insight
  tier: text('tier').notNull(), // free|basic|pro
  cadence: text('cadence').notNull(), // daily|weekly|monthly
  sendTime: text('send_time').notNull(), // HH:MM format
  locale: text('locale').default('en-US'),
  mjmlPath: text('mjml_path').notNull(), // R2 path to template
  promptTemplate: text('prompt_template').notNull(), // LLM prompt template
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Referrals table - Referral tracking
export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  referrerUserId: text('referrer_user_id').references(() => users.id, { onDelete: 'cascade' }),
  referredEmail: text('referred_email').notNull(),
  referredUserId: text('referred_user_id').references(() => users.id, { onDelete: 'set null' }),
  bonusDays: integer('bonus_days').default(3),
  creditedAt: text('credited_at'), // ISO timestamp when bonus was credited
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Email engagement table - Detailed engagement tracking
export const emailEngagement = sqliteTable('email_engagement', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emailLogId: text('email_log_id').notNull().references(() => emailLogs.id, { onDelete: 'cascade' }),
  actionType: text('action_type').notNull(), // open|click|unsubscribe|upgrade|change_perspective
  actionTarget: text('action_target'), // URL clicked, button pressed, etc
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});

// Perspective changes table - Track perspective switching
export const perspectiveChanges = sqliteTable('perspective_changes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  oldPerspective: text('old_perspective'),
  newPerspective: text('new_perspective').notNull(),
  changedVia: text('changed_via').default('email'), // email|api|admin
  changedAt: text('changed_at').default(sql`CURRENT_TIMESTAMP`),
});

// Subscription tokens table - Secure email action tokens
export const subscriptionTokens = sqliteTable('subscription_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenType: text('token_type').notNull(), // upgrade|cancel|unsubscribe|change_perspective
  tokenHash: text('token_hash').notNull(), // Hashed token for security
  expiresAt: text('expires_at').notNull(), // ISO timestamp
  usedAt: text('used_at'), // ISO timestamp when used
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// LLM usage tracking table - Cost and quota management
export const llmUsage = sqliteTable('llm_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  model: text('model').notNull(), // grok-3-mini|grok-3|gpt-4o
  tokensUsed: integer('tokens_used').notNull(),
  costUsd: real('cost_usd').notNull(), // Cost in USD
  requestType: text('request_type').notNull(), // daily|weekly|monthly|fallback
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Rate limiting table - Centralized rate limit tracking
export const rateLimits = sqliteTable('rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(), // rate:email:user@example.com or rate:ip:192.168.1.1
  count: integer('count').notNull().default(1),
  windowStart: text('window_start').notNull(), // ISO timestamp
  expiresAt: text('expires_at').notNull(), // ISO timestamp
});

// Export type definitions for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type SignupAttempt = typeof signupAttempts.$inferSelect;
export type NewSignupAttempt = typeof signupAttempts.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type EphemerisCache = typeof ephemerisCache.$inferSelect;
export type NewEphemerisCache = typeof ephemerisCache.$inferInsert;
export type NewsCache = typeof newsCache.$inferSelect;
export type NewNewsCache = typeof newsCache.$inferInsert;
export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type NewContentTemplate = typeof contentTemplates.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type EmailEngagement = typeof emailEngagement.$inferSelect;
export type NewEmailEngagement = typeof emailEngagement.$inferInsert;
export type PerspectiveChange = typeof perspectiveChanges.$inferSelect;
export type NewPerspectiveChange = typeof perspectiveChanges.$inferInsert;
export type SubscriptionToken = typeof subscriptionTokens.$inferSelect;
export type NewSubscriptionToken = typeof subscriptionTokens.$inferInsert;
export type LlmUsage = typeof llmUsage.$inferSelect;
export type NewLlmUsage = typeof llmUsage.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert; 