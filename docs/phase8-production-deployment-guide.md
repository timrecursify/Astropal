# Phase 8 Beta Launch - Production Deployment Guide

**Date:** January 20, 2025  
**Objective:** Deploy Astropal to production with full multilingual support, test users, and complete functionality  
**Target Domain:** astropal.io

---

## Pre-Deployment Checklist

### Required Environment Setup
- [ ] Node.js 20.x+ installed
- [ ] Wrangler CLI installed and authenticated
- [ ] Cloudflare account with domain `astropal.io` configured
- [ ] All API keys and secrets ready (see secrets section below)

### Required Secrets Configuration
Before deployment, ensure all secrets are set via `wrangler secret put`:

```bash
cd packages/backend

# Core API Keys (Required)
wrangler secret put GROK_API_KEY
wrangler secret put OPENAI_API_KEY  
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put NEWSAPI_KEY

# Webhook Secrets (Required for billing)
wrangler secret put STRIPE_WEBHOOK_SECRET_SUBSCRIPTION
wrangler secret put STRIPE_WEBHOOK_SECRET_PAYMENT

# Payment Links (Required for upgrades)
wrangler secret put STRIPE_BASIC_PAYMENT_LINK
wrangler secret put STRIPE_PRO_PAYMENT_LINK

# Internal Security (Required)
wrangler secret put HMAC_SECRET     # Generate: openssl rand -hex 32
wrangler secret put JWT_SECRET      # Generate: openssl rand -hex 32
```

---

## Deployment Steps

### 1. Run Complete Deployment Script
```bash
# From project root
./scripts/deploy.sh production
```

This script will automatically:
- ✅ Install dependencies and run quality checks
- ✅ Build frontend and backend
- ✅ Apply database migrations
- ✅ Upload multilingual locale data (en-US, es-ES)
- ✅ Deploy backend worker to Cloudflare
- ✅ Deploy frontend to Cloudflare Pages
- ✅ Seed 4 test users for beta testing
- ✅ Run health checks
- ✅ Generate summary report

### 2. Configure Custom Domain for API
The deployment script handles most setup, but you need to manually configure the custom domain:

```bash
# Get your Cloudflare zone ID from the dashboard
# Go to: https://dash.cloudflare.com -> astropal.io -> Overview (right sidebar)

# Add custom domain to worker
npx wrangler custom-domains add api.astropal.io --zone-id <your-zone-id>

# Verify domain configuration
npx wrangler custom-domains list
```

### 3. Configure Frontend Domain (if needed)
```bash
cd apps/web

# Add custom domain to Pages project
npx wrangler pages domain add astropal.io --project-name astropal-web

# Verify Pages domain
npx wrangler pages domain list --project-name astropal-web
```

---

## Post-Deployment Verification

### 1. Health Checks
```bash
# Backend health check
curl https://api.astropal.io/healthz

# Frontend accessibility
curl https://astropal.io
```

### 2. Test User Verification
Check that all 4 test users were created successfully:

```bash
cd packages/backend
node scripts/seedTestUsers.js verify production
```

### 3. Database Verification
```bash
# Check database tables exist
wrangler d1 execute astropal_main --env production --command "SELECT name FROM sqlite_master WHERE type='table';"

# Check test users in database
wrangler d1 execute astropal_main --env production --command "SELECT email, perspective, tier FROM users LIMIT 10;"
```

### 4. Locale Data Verification
```bash
# Check locale data was uploaded
wrangler kv:key list --binding KV_I18N --env production

# Should show keys like:
# - i18n:en-US:astropal
# - i18n:es-ES:astropal
```

---

## Test User Details

After deployment, the following test users will be available:

| Email | Perspective | Focus Areas | Portal URL |
|-------|------------|-------------|------------|
| timvvoss@icloud.com | calm | wellness, spiritual | https://astropal.io/portal?token={auth_token} |
| tim@synthetic.jp | knowledge | evidence-based, career | https://astropal.io/portal?token={auth_token} |
| tim@voss-intelligence.com | success | career, social | https://astropal.io/portal?token={auth_token} |
| tim@reshoringhq.com | evidence | evidence-based, wellness | https://astropal.io/portal?token={auth_token} |

**Note:** Auth tokens are saved to `/tmp/astropal_test_tokens.json` after seeding.

---

## Manual Testing Checklist

### 1. Registration Flow Test
- [ ] Visit https://astropal.io
- [ ] Fill out registration form with test data
- [ ] Verify form validation works
- [ ] Submit registration
- [ ] Check for success confirmation

### 2. API Integration Test
- [ ] Verify registration creates user in database
- [ ] Check API endpoints respond correctly
- [ ] Test CORS configuration with frontend
- [ ] Verify logging is working

### 3. Multilingual Support Test
- [ ] Test frontend in English (en-US)
- [ ] Test frontend in Spanish (es-ES) if language switcher available
- [ ] Verify locale data loads correctly from KV

### 4. Focus Areas and Perspectives Test
- [ ] Test all 4 perspectives (calm, knowledge, success, evidence)
- [ ] Verify all 6 focus areas work (relationships, career, wellness, social, spiritual, evidence-based)
- [ ] Check perspective mapping from focus areas

---

## Production URLs

After successful deployment:

- **Frontend:** https://astropal.io
- **Backend API:** https://api.astropal.io
- **Health Check:** https://api.astropal.io/healthz
- **Test Registration:** https://astropal.io (main signup form)

---

## Troubleshooting

### Common Issues

**1. Custom Domain Not Working**
```bash
# Check DNS propagation
dig api.astropal.io

# Check Cloudflare worker domain status
wrangler custom-domains list

# Ensure zone ID is correct
```

**2. Frontend Not Loading**
```bash
# Check Pages deployment status
wrangler pages deployment list --project-name astropal-web

# Verify build completed successfully
wrangler pages deployment tail --project-name astropal-web
```

**3. Database Connection Issues**
```bash
# Verify database exists
wrangler d1 list

# Check database binding in wrangler.toml
cat packages/backend/wrangler.toml
```

**4. Secrets Not Working**
```bash
# List all secrets
wrangler secret list

# Re-add any missing secrets
wrangler secret put SECRET_NAME
```

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**
```bash
# Revert to previous worker version
wrangler rollback --env production

# Revert frontend if needed
wrangler pages deployment list --project-name astropal-web
# Note previous deployment ID and redeploy it
```

2. **Database Rollback:**
```bash
# Restore from backup if needed
# (Database backups are handled automatically by Cloudflare)
```

3. **Full System Rollback:**
```bash
# Redeploy previous known-good version
git checkout <previous-commit>
./scripts/deploy.sh production
```

---

## Success Criteria

Phase 8 Beta Launch is successful when:

- [ ] All 4 test users can register successfully
- [ ] Frontend loads at https://astropal.io
- [ ] Backend API responds at https://api.astropal.io
- [ ] Database contains test users with correct data
- [ ] Multilingual locales are loaded in KV
- [ ] Health checks pass
- [ ] No critical errors in worker logs
- [ ] Registration form works end-to-end
- [ ] All 4 perspectives are represented in test users

---

## Next Steps (Post-Launch)

1. **Monitor System Health:**
   - Watch worker logs for errors
   - Monitor API response times
   - Check database performance

2. **Test Content Generation:**
   - Manually trigger content generation
   - Verify email templates render correctly
   - Test email delivery to test accounts

3. **Complete Feature Testing:**
   - Test subscription upgrades
   - Test email-based account management
   - Verify perspective switching works

4. **Performance Optimization:**
   - Monitor costs and usage
   - Optimize content generation timing
   - Fine-tune logging levels

---

**🎯 Phase 8 Beta Launch Goal:** A fully functional, production-ready Astropal system with 4 beta test users representing all perspectives, complete multilingual support, and robust architecture ready for scaling. 