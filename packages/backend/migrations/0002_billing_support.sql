-- Migration: Add billing support fields to users table
-- Date: 2025-01-20
-- Description: Add trial reminder tracking and upgrade reminder fields for billing system

-- Add trial reminder tracking
ALTER TABLE users ADD COLUMN trial_reminder_sent INTEGER DEFAULT 0;

-- Add last upgrade reminder timestamp for free tier users
ALTER TABLE users ADD COLUMN last_upgrade_reminder TEXT;

-- Create index for efficient trial management queries
CREATE INDEX IF NOT EXISTS idx_users_trial_status ON users(tier, trial_end) WHERE tier = 'trial';

-- Create index for free tier upgrade reminder queries
CREATE INDEX IF NOT EXISTS idx_users_free_reminders ON users(tier, last_upgrade_reminder) WHERE tier = 'free'; 