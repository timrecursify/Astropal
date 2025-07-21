# Astropal Development Master Plan

**Purpose:** Production-grade development roadmap for AI coding agent implementation

**Target:** Build and deploy a complete newsletter platform serving 4 beta users within a single development session

---

## 🎯 Development Philosophy

1. **Production-First**: Every line of code is production-ready from day one
2. **No Iterations**: Build it right the first time
3. **Full Observability**: Structured logging and monitoring everywhere
4. **Zero Technical Debt**: Clean architecture, no shortcuts
5. **Complete Automation**: Human provides credentials, AI builds everything

---

## 📋 Phase Overview

### Phase 0: Repository Bootstrap
**Goal:** Establish foundation with proper structure and tooling
- Monorepo setup with workspaces
- TypeScript, ESLint, Prettier configuration
- Logger implementation per .cursorrules
- CI/CD pipeline foundation

### Phase 1: Data Layer & Authentication
**Goal:** Core user management and persistence
- D1 database with full schema
- Token-based authentication (no passwords)
- Registration flow with rate limiting
- Email integration foundation

### Phase 2: Scheduler & External Data
**Goal:** Automated data collection and caching
- Cron job architecture (5 jobs)
- Ephemeris data integration
- News API for Pro tier
- KV storage optimization

### Phase 3: Core Content Generator
**Goal:** AI-powered personalized content
- Grok API integration with fallback
- Prompt engineering system
- Content validation pipeline
- Cost optimization logic

### Phase 4: Email Worker & Templates
**Goal:** Beautiful, trackable email delivery
- MJML template system
- Resend integration
- Auth token email controls
- Engagement tracking

### Phase 5: Billing & Subscriptions
**Goal:** Monetization and tier management
- Stripe integration
- Subscription lifecycle
- Trial management
- Payment failure handling

### Phase 6: Localization & Perspectives
**Goal:** Personalized, multi-language experience
- i18n infrastructure
- 4 perspective systems
- Locale-specific content
- Dynamic switching

### Phase 7: Observability & Hardening
**Goal:** Production-grade reliability
- Enhanced structured logging
- Comprehensive metrics
- Security hardening
- GDPR compliance

### Phase 8: Beta Launch
**Goal:** Deploy and monitor with real users
- Production deployment
- 4 test user onboarding
- Operational excellence
- Success metrics tracking

---

## 🏗️ Technical Architecture

### Backend (Cloudflare Workers)
```
packages/backend/
├── src/
│   ├── workers/
│   │   ├── api.ts         # Main API gateway
│   │   ├── scheduler.ts   # Cron job handler
│   │   ├── email.ts       # Email delivery
│   │   └── webhook.ts     # Stripe webhooks
│   ├── lib/
│   │   ├── logger.ts      # Structured logging
│   │   ├── auth.ts        # Token management
│   │   ├── metrics.ts     # Performance tracking
│   │   └── validation.ts  # Input sanitization
│   ├── services/
│   │   ├── content.ts     # LLM integration
│   │   ├── email.ts       # Resend client
│   │   ├── billing.ts     # Stripe client
│   │   └── ephemeris.ts   # Astro data
│   └── db/
│       ├── schema.ts      # Drizzle schema
│       └── migrations/    # SQL migrations
```

### Frontend (Next.js)
```
apps/web/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx       # Landing page
│   │   ├── pricing/       # Tier selection
│   │   └── confirm/       # Email actions
│   ├── components/
│   │   ├── SignUpForm.tsx
│   │   ├── ActionResult.tsx
│   │   └── ErrorBoundary.tsx
│   └── lib/
│       ├── auth.ts        # Token validation
│       ├── api.ts         # Backend client
│       └── logger.ts      # Frontend logging
```

---

## 🔄 Development Flow

### 1. Pre-Development (Human Tasks)
- [ ] Obtain all API keys (see `human_todo.md`)
- [ ] Purchase and configure domain
- [ ] Set up Cloudflare account
- [ ] Create email templates
- [ ] Prepare design assets

### 2. Development Execution (AI Tasks)
```bash
# Phase 0-3: Infrastructure & Core
- Bootstrap repository
- Implement data layer
- Build scheduler system
- Create content generator

# Phase 4-6: Features
- Email delivery system
- Billing integration
- Localization

# Phase 7-8: Production
- Observability
- Deploy & monitor
```

### 3. Post-Development (Human Verification)
- [ ] Verify all 4 test users registered
- [ ] Confirm daily emails delivering
- [ ] Check cost metrics
- [ ] Monitor error rates

---

## 🚨 Critical Success Factors

### Non-Negotiable Requirements
1. **Structured Logging**: Every operation logged with context
2. **Error Handling**: Graceful failures with fallbacks
3. **Rate Limiting**: Protect all endpoints
4. **Cost Controls**: Token budgets enforced
5. **Security**: Input validation, HMAC signing, secure tokens

### Performance Targets
- API Response: <300ms P95
- Content Generation: <5s
- Email Delivery: >98% success
- Uptime: >99.9%
- Error Rate: <1%

### Cost Targets
- Infrastructure: <$5/month base
- Per User: <$0.10/month
- LLM Costs: <$0.003/email
- Total Beta: <$10/month

---

## 📊 Monitoring & Alerts

### Key Metrics
```typescript
const CRITICAL_METRICS = {
  // Business
  'user.signups': 'Track registration success',
  'email.delivery_rate': 'Monitor email health',
  'content.generation_time': 'LLM performance',
  'user.engagement': 'Open/click rates',
  
  // Technical
  'api.latency': 'Response times',
  'error.rate': 'System health',
  'cost.daily': 'Budget tracking',
  'external.api.health': 'Dependency status'
};
```

### Alert Thresholds
- P1: System down, no emails sent
- P2: High error rate (>5%)
- P3: Performance degradation
- P4: Cost overrun warnings

---

## 🏁 Definition of Done

### System Level
- [ ] All 8 phases completed
- [ ] Zero failing tests
- [ ] Production deployed
- [ ] Monitoring active
- [ ] Documentation complete

### User Level
- [ ] 4 beta users active
- [ ] Daily emails delivering
- [ ] Perspectives differentiated
- [ ] Engagement tracked
- [ ] No critical bugs

### Operational Level
- [ ] Costs within budget
- [ ] Performance targets met
- [ ] Security scans passed
- [ ] Backups automated
- [ ] Runbooks documented

---

## 🚀 Launch Sequence

1. **Infrastructure Ready**
   - All services configured
   - Secrets deployed
   - DNS propagated

2. **Code Complete**
   - All phases implemented
   - Tests passing
   - Logs structured

3. **Deploy to Production**
   ```bash
   npm run deploy:production
   ```

4. **Verify Health**
   ```bash
   curl https://api.astropal.com/healthz
   ```

5. **Onboard Beta Users**
   - Register 4 test accounts
   - Monitor first 24 hours
   - Check all perspectives

6. **Daily Operations**
   - Morning health checks
   - Cost monitoring
   - Performance review
   - User engagement

---

## ⚡ Quick Reference

### Commands
```bash
# Development
npm run dev              # Start all services
npm run test            # Run test suite
npm run lint            # Code quality

# Deployment
npm run deploy:production   # Full deployment
npm run migrate:production  # Database migrations
npm run health:check       # System health

# Monitoring
npm run logs:tail         # Live logs
npm run metrics:dashboard # Open metrics
npm run costs:report     # Cost analysis
```
🔗 API Documentation Links to Review
Primary Content Generation APIs
Grok API (X.AI) - CRITICAL
Main API Documentation: https://x.ai/api
Developer Platform: https://platform.x.ai/docs (referenced in search results)
Getting Started Guide: Available through the platform after API key creation
OpenAI API - CRITICAL (Fallback)
API Reference: https://platform.openai.com/docs/api-reference
Platform Overview: https://platform.openai.com/docs/overview
Python Library: https://github.com/openai/openai-python
Email Service APIs
Resend Email API - CRITICAL
Main Documentation: https://resend.com/docs/introduction
API Reference: https://resend.com/docs/api-reference/emails/send-email
Email API Features: https://resend.com/features/email-api
Payment Processing APIs
Stripe API - CRITICAL
API Documentation: https://stripe.com/docs/api
Webhooks Documentation: https://stripe.com/docs/webhooks
Subscription Management: https://stripe.com/docs/billing/subscriptions
News & Data APIs
NewsAPI - REQUIRED FOR PRO TIER
Documentation: https://newsapi.org/docs
Authentication Guide: https://newsapi.org/docs/authentication
Endpoints Reference: https://newsapi.org/docs/endpoints
Astronomical Data APIs
NASA JPL Horizons - PUBLIC API
Main System: https://ssd.jpl.nasa.gov/horizons/
API Documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
Manual & Tutorial: Available through the web interface tabs
Swiss Ephemeris - BACKUP
Main Site: https://www.astro.com/swisseph/
API Documentation: https://www.astro.com/swisseph/swephprg.htm
Infrastructure & Platform APIs
Cloudflare Workers
Workers Documentation: https://developers.cloudflare.com/workers/
D1 Database: https://developers.cloudflare.com/d1/
KV Storage: https://developers.cloudflare.com/kv/
R2 Storage: https://developers.cloudflare.com/r2/

---

## 📝 Final Notes

This system is designed to be:
- **Self-Healing**: Automatic fallbacks and retries
- **Self-Documenting**: Logs tell the story
- **Self-Monitoring**: Alerts before users notice
- **Cost-Efficient**: Optimized for free tiers
- **Extensible**: Ready for new newsletter brands

The AI coding agent has everything needed to build this system in one session. Human developers need only provide the external dependencies listed in `human_todo.md`.

**Let's build something magical! ✨** 