-- Migration: 0001_initial_schema.sql
-- Description: Create all initial tables for Astropal newsletter platform
-- Date: 2025-01-20

-- Users table - Core user data and authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  auth_token TEXT NOT NULL UNIQUE, -- Hashed auth token for email-based authentication
  birth_date TEXT NOT NULL, -- YYYY-MM-DD format
  birth_location TEXT NOT NULL, -- "City, Country" format for chart calculation
  birth_time TEXT DEFAULT '12:00', -- HH:MM format
  timezone TEXT NOT NULL, -- IANA timezone identifier
  locale TEXT DEFAULT 'en-US', -- Internationalization locale
  perspective TEXT DEFAULT 'calm', -- calm|knowledge|success|evidence
  tier TEXT DEFAULT 'trial', -- trial|free|basic|pro
  trial_end TEXT, -- ISO timestamp when trial expires
  referral_code TEXT, -- Referral code from signup
  focus_preferences TEXT, -- JSON array of focus areas
  last_activity TEXT, -- ISO timestamp of last activity
  email_status TEXT DEFAULT 'active', -- active|bounced|unsubscribed
  unsubscribed_at TEXT, -- ISO timestamp when unsubscribed
  last_bounce TEXT, -- ISO timestamp of last email bounce
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table - Billing and subscription management
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- active|canceled|past_due|unpaid
  stripe_customer TEXT, -- Stripe customer ID
  stripe_subscription TEXT, -- Stripe subscription ID
  current_period_end TEXT, -- ISO timestamp of current billing period end
  cancel_at_period_end INTEGER DEFAULT 0, -- Boolean: cancel at period end
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Signup attempts table - Rate limiting and abuse prevention
CREATE TABLE signup_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL, -- success|duplicate|rate_limited|invalid|failed
  user_agent TEXT, -- Browser user agent
  referrer TEXT -- HTTP referrer
);

-- Email logs table - Email delivery tracking and analytics
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL, -- welcome|daily|weekly|monthly|trial_ending
  subject TEXT NOT NULL,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL, -- sent|failed|bounced|delivered
  resend_id TEXT, -- Resend email ID for tracking
  open_at TEXT, -- ISO timestamp when email was opened
  click_at TEXT, -- ISO timestamp when email was clicked
  error_message TEXT -- Error message if delivery failed
);

-- Ephemeris cache table - Astronomical data caching
CREATE TABLE ephemeris_cache (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD format
  json_data TEXT NOT NULL, -- Stringified astronomical data
  source TEXT NOT NULL, -- nasa_jpl|swiss_ephemeris
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- News cache table - News headlines for Pro tier
CREATE TABLE news_cache (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD when news was published
  headline TEXT NOT NULL,
  summary TEXT, -- Brief summary of the article
  url TEXT, -- Original article URL
  source TEXT NOT NULL, -- newsapi|guardian|etc
  category TEXT, -- business|technology|health|etc
  fetched_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Content templates table - Email template metadata
CREATE TABLE content_templates (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL, -- cosmic-pulse|personal-horoscope|weekly-insight
  tier TEXT NOT NULL, -- free|basic|pro
  cadence TEXT NOT NULL, -- daily|weekly|monthly
  send_time TEXT NOT NULL, -- HH:MM format for send scheduling
  locale TEXT DEFAULT 'en-US',
  mjml_path TEXT NOT NULL, -- R2 path to MJML template
  prompt_template TEXT NOT NULL, -- LLM prompt template
  active INTEGER DEFAULT 1, -- Boolean: template is active
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table - Referral tracking and bonus management
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  bonus_days INTEGER DEFAULT 3, -- Days of bonus access
  credited_at TEXT, -- ISO timestamp when bonus was credited
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Email engagement table - Detailed email interaction tracking
CREATE TABLE email_engagement (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_log_id TEXT NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- open|click|unsubscribe|upgrade|change_perspective
  action_target TEXT, -- URL clicked, button pressed, etc
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT, -- Browser user agent
  ip_address TEXT -- User IP address
);

-- Perspective changes table - Track perspective switching behavior
CREATE TABLE perspective_changes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_perspective TEXT, -- Previous perspective
  new_perspective TEXT NOT NULL, -- New perspective
  changed_via TEXT DEFAULT 'email', -- email|api|admin
  changed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Subscription tokens table - Secure tokens for email-based actions
CREATE TABLE subscription_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL, -- upgrade|cancel|unsubscribe|change_perspective
  token_hash TEXT NOT NULL, -- Hashed token for security
  expires_at TEXT NOT NULL, -- ISO timestamp when token expires
  used_at TEXT, -- ISO timestamp when token was used
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- LLM usage tracking table - Cost management and quota enforcement
CREATE TABLE llm_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD for daily aggregation
  model TEXT NOT NULL, -- grok-3-mini|grok-3|gpt-4o
  tokens_used INTEGER NOT NULL, -- Number of tokens consumed
  cost_usd REAL NOT NULL, -- Cost in USD for this usage
  request_type TEXT NOT NULL, -- daily|weekly|monthly|fallback
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Rate limits table - Centralized rate limiting storage
CREATE TABLE rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- rate:email:user@example.com or rate:ip:192.168.1.1
  count INTEGER NOT NULL DEFAULT 1, -- Current count in window
  window_start TEXT NOT NULL, -- ISO timestamp when window started
  expires_at TEXT NOT NULL -- ISO timestamp when rate limit expires
);

-- Performance indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_token ON users(auth_token);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_signup_attempts_email ON signup_attempts(email);
CREATE INDEX idx_signup_attempts_ip_address ON signup_attempts(ip_address);
CREATE INDEX idx_signup_attempts_attempted_at ON signup_attempts(attempted_at);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_status ON email_logs(status);

CREATE INDEX idx_ephemeris_cache_date ON ephemeris_cache(date);
CREATE INDEX idx_news_cache_date ON news_cache(date);
CREATE INDEX idx_news_cache_source ON news_cache(source);

CREATE INDEX idx_content_templates_tier ON content_templates(tier);
CREATE INDEX idx_content_templates_active ON content_templates(active);

CREATE INDEX idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred_email ON referrals(referred_email);

CREATE INDEX idx_email_engagement_user_id ON email_engagement(user_id);
CREATE INDEX idx_email_engagement_email_log_id ON email_engagement(email_log_id);
CREATE INDEX idx_email_engagement_action_type ON email_engagement(action_type);

CREATE INDEX idx_perspective_changes_user_id ON perspective_changes(user_id);
CREATE INDEX idx_perspective_changes_changed_at ON perspective_changes(changed_at);

CREATE INDEX idx_subscription_tokens_user_id ON subscription_tokens(user_id);
CREATE INDEX idx_subscription_tokens_token_hash ON subscription_tokens(token_hash);
CREATE INDEX idx_subscription_tokens_expires_at ON subscription_tokens(expires_at);

CREATE INDEX idx_llm_usage_user_id ON llm_usage(user_id);
CREATE INDEX idx_llm_usage_date ON llm_usage(date);
CREATE INDEX idx_llm_usage_model ON llm_usage(model);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_expires_at ON rate_limits(expires_at); 