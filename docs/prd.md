# Astropal – AI-Driven Astrology Newsletter

**Document Version:** 1.0  
**Date:** July 17 2025  
**Author:** Senior Software Engineer (AI Developer – Cursor)

---

## 1  Purpose & Scope
Astropal will deliver the world’s most precise, personalised astrology insights via a daily email newsletter.  
The system must be:
• Fully automated (AI-generated content, zero-human ops)  
• Low-cost – built on Cloudflare’s free developer stack  
• GDPR-compliant  
• Capable of scaling from 100 → 100 000 subscribers without re-architecture.

This PRD defines functional & non-functional requirements for the Astropal MVP (V1) and provides the technical blueprint for implementation.

---

## 2  Objectives & Success Metrics
| Category | KPI | Target |
|---|---|---|
| Business | Paying subscribers after 6 mo | ≥ 1 000 |
|   | Trial-→-Paid conversion | ≥ 20 % |
|   | Monthly churn | ≤ 5 % |
| Technical | Newsletter generation latency | ≤ 5 s / user |
|   | Email delivery rate | ≥ 98 % |
|   | Uptime (overall) | ≥ 99.9 % |
| Engagement | Avg open rate | ≥ 40 % |
|   | Avg click-through | ≥ 8 % |

---

## 3  Personas & User Stories
### 3.1 Personas
1. **Cosmic Rookie (Free Tier)** – 22-year-old Gen Z user curious about astrology, seeks quick daily vibes.  
2. **Growth Seeker (Basic)** – 29-year-old professional, uses astrology for self-reflection & planning.  
3. **Astro Power-User (Pro)** – 34-year-old enthusiast wanting deep dives, market/economic astro-analysis, news digest.

### 3.2 Core User Stories
* **US-1** As a new visitor I can enter just my email & DOB to start a 7-day free trial so that onboarding is frictionless.
* **US-2** As a subscriber I receive a personalised daily email at 06:00 in my timezone.
* **US-3** As an Astro Power-User I get a daily news digest analysed through an astrological lens.
* **US-4** As any user I can one-click unsubscribe or delete my data in compliance with GDPR.
* **US-5** As a product owner I can view deliverability, engagement and revenue dashboards in real time.

---

## 4  Feature Catalogue (V1)
| ID | Feature | Tier | Priority |
|---|---|---|---|
| F1 | Email + DOB signup w/ 7-day Pro trial | All | P1 |
| F2 | Daily morning horoscope (6:00 AM) | Basic, Pro | P1 |
| F3 | Daily "Cosmic Pulse" (6:00 AM) | Free | P1 |
| F4 | Evening reflection email (7:00 PM) | Basic, Pro | P1 |
| F5 | Midday news digest (12:00 PM) | Pro | P1 |
| F6 | Weekly "Cosmic Week Ahead" summary | All | P2 |
| F7 | Monthly deep-dive reports | Pro | P2 |
| F8 | Payment & subscription lifecycle (Stripe) | Paid tiers | P1 |
| F9 | Admin dashboard (content templates, metrics) | Staff | P2 |
| F10 | Referral links & upgrade prompts | All | P2 |
| F11 | Shareable cosmic snippets for social media | All | P2 |

**Email Frequency by Tier:**
- **Free**: 1 email/day (Daily Cosmic Pulse) + weekly/monthly
- **Basic**: 2 emails/day (Morning + Evening) + weekly/monthly  
- **Pro**: 3 emails/day (Morning + Midday + Evening) + weekly/monthly

Out-of-Scope V1: mobile apps, social network integrations, live astrologer chats, multi-lingual support.

---

## 4A  Focus Selection & Content Personalization (NEW)

### 4A.1 User Focus Areas
Users select 1-3 focus areas during signup to personalize newsletter content:

| Focus ID | Name | Description | Target Content |
|----------|------|-------------|----------------|
| `relationships` | Relationships | Love, dating, friendships, family dynamics | Compatibility insights, communication timing, emotional guidance |
| `career` | Career & Business | Professional growth, timing, financial success | Career opportunities, business strategy, financial timing |
| `wellness` | Mental Wellness | Emotional health, stress management, self-care | Mental health tips, stress relief, emotional patterns |
| `social` | Social Life | Communication, networking, group dynamics | Social energy, networking timing, group compatibility |
| `spiritual` | Spiritual Growth | Personal development, manifestation, intuition | Spiritual practices, manifestation timing, inner growth |
| `evidence-based` | Evidence-Based Astrology | Scientific methods, astronomical data, research-backed insights | Scientific explanations, methodology transparency, research references |

### 4A.2 Content Provisioning Rules
- **Free Tier**: Generic content with focus-based flavor (20% personalization)
- **Basic Tier**: Focus-weighted content sections (60% personalization)
- **Pro Tier**: Fully customized content based on focus preferences (90% personalization)

### 4A.3 Focus Selection UX
- **Signup Flow**: Mandatory focus selection before email/DOB entry
- **Preference Updates**: Users can modify focuses in account settings
- **Max Selections**: 3 focus areas maximum to maintain content quality
- **Min Selections**: 1 focus area minimum for personalization

### 4A.4 AI Prompt Integration
Focus preferences modify content generation prompts:
```
Base Prompt: "Generate horoscope for {user_chart} on {date}"
Focus Overlay: "Focus on {focus_areas}: relationships (70%), career (30%)"
Content Weight: "Prioritize relationship insights and timing guidance"
```

---

## 5  System Architecture
```
               +----------------------+
               |  Scheduler (Cron)   |
               +----------+----------+
                          |
                daily/weekly jobs
                          v
+----------+  fetch  +--------------+  generate  +----------------+
| Ephemeris |------->| Grok 4 Client|----------->| KV Content Cache|
| Service   |        +--------------+            +----------------+
   ^  | NASA JPL / SwissEphemeris                      |
   |  +-----------------------------------------------+
   |                                                  |
   |                                         read at send-time
   v                                                  v
+----------------+      send via API       +--------------------+
| Cloudflare D1  |------------------------>|  Email Worker      |
|  Subscribers   |                         |  (Resend service)  |
+----------------+                         +--------------------+
```
Components:
1. **Cloudflare Workers** – REST API, cron jobs, email worker.  
2. **Cloudflare D1 (SQLite)** – primary relational store (users, subscriptions, logs).  
3. **Cloudflare KV** – per-user generated content (TTL 24 h) to avoid regenerating.  
4. **Cloudflare R2** – assets/backups.  
5. **Grok 4 API** – LLM for content generation (function-call JSON schema).  
6. **NASA JPL / Swiss Ephemeris** – planetary data.  
7. **Resend** – email delivery (supports schedules, analytics).  
8. **Stripe** – payments, webhook into Workers.

### 5.1 Data Flow
1. Scheduler triggers at 00:05 UTC: fetch ephemeris ⇒ populate KV `astro:YYYY-MM-DD`.  
2. For each active subscriber, Worker checks KV for personalised content; generates via Grok if miss.
3. Render Markdown → HTML using Mustache templates; store in KV (expiry 48 h).
4. Queue email through Resend API respecting per-user timezone.
5. Webhooks (Stripe, Resend) update D1 tables (`subscriptions`, `email_logs`).

### 5.2 Scalability Notes
* Workers free plan: 100k req/day; upgrade to $5 plan after 10k users.  
* KV read heavy; within free 100k/day until ≈ 10k users.  
* Generation cost: ≈ 0.15 $ per active user / month (token calc per earlier analysis).

### 5.3 Registration & Rate Limiting (NEW)

**Signup Form Requirements:**
- **Email**: Primary identifier, must be unique across system
- **Birth Date**: Required for chart calculations, validated against future dates
- **Birth Location**: Required for accurate rising signs and house positions (City, Country format)
- **Focus Preferences**: 1-3 selected areas for content personalization
- **Birth Time**: Optional for enhanced accuracy (defaults to noon if not provided)

**Form UX Features:**
- **Tooltips**: Info icons with helpful explanations for each field
- **Responsive Layout**: Three fields in one row on desktop, stacked on mobile
- **Validation**: Real-time client-side validation with error messages

**Rate Limiting Implementation:**
- **One submission per email per 24 hours**: Enforced both frontend (localStorage) and backend (database)
- **IP-based rate limiting**: Max 5 signup attempts per IP per hour
- **Duplicate email handling**: Return user-friendly message without revealing existing accounts
- **Client-side validation**: Immediate feedback with tooltips for field requirements

**Backend Validation Rules:**
```javascript
// Email validation
if (await userExists(email)) {
  logAttempt(email, ip, 'duplicate');
  return { error: 'This email is already registered. Please check your inbox.' };
}

// Rate limiting check
const recentAttempts = await getRecentAttempts(email, '24h');
if (recentAttempts.length > 0) {
  return { error: 'Registration already submitted. Please check your email.' };
}

// IP rate limiting
const ipAttempts = await getIPAttempts(ip, '1h');
if (ipAttempts.length >= 5) {
  return { error: 'Too many attempts. Please try again later.' };
}
```

**Security Measures:**
- **CSRF Protection**: Validate referrer and origin headers
- **Input Sanitization**: Escape all user inputs, validate birth location format
- **Attempt Logging**: Track all signup attempts for monitoring and abuse detection
- **Error Handling**: Generic error messages to prevent email enumeration

---

## 5.3 Multilingual & Modular Design (NEW)
Astropal’s core is a **language-agnostic, template-driven** engine. Key design rules:
1. **Locale-aware user record** – each subscriber has `locale` (IETF tag, e.g. `en-US`, `es-ES`).
2. **Dynamic Prompt Loader** – prompt strings stored in KV `prompt:{locale}:{templateId}`; fallback to `en-US`.
3. **i18n Template Tokens** – MJML templates contain ICU‐style tokens (`{greeting}`) resolved from `i18n:{locale}` JSON.
4. **Module Isolation** – business logic (generation, billing, delivery) lives in `core/` Worker package; project-specific adapters (Astropal) reside in `projects/astropal/`.
   Swapping projects = new env vars + new prompt KV namespace, no code change.

---

## 6  Content Generation & Prompt Engineering (NEW)
### 6.1 Overview
Astropal uses a deterministic, schema-driven pipeline:
1. **Ephemeris Fetcher** (Worker CRON @ 00:05 UTC) retrieves planetary positions for the next 48 h (NASA JPL primary, Swiss fallback) and stores JSON under KV key `astro:{YYYY-MM-DD}`.
2. **User Batch Builder** groups active subscribers by tier and local send-time.
3. **Prompt Composer** injects user data + ephemeris into a *parameterised system prompt* and calls the Grok function-calling API.
4. **Response Validator** runs JSON-schema validation; if it fails → retry (max 2) then fall back to generic template.
5. **Renderer** maps JSON → Mustache/Handlebars HTML and plaintext; stores under `content:{userId}:{YYYYMMDD}` with 48 h TTL.
6. **Email Dispatcher** pulls rendered output and fires Resend API.

### 6.2 Grok API Call
Endpoint `POST https://api.x.ai/v1/chat/completions`
```json
{
  "model": "grok-3-mini",          // grok-3 for Basic/Free, grok-3-plus for Pro
  "temperature": 0.8,
  "max_tokens": 900,
  "tools": [{
      "type": "function",
      "function": {
        "name": "create_newsletter_block",
        "description": "Return structured astro newsletter block",
        "parameters": { "$ref": "#/definitions/NewsletterSchema" }
      }
  }],
  "messages": [
    {"role": "system", "content": "You are Astropal, an ethical professional astrologer writing concise, uplifting emails for Gen-Z."},
    {"role": "user", "content": "{{PROMPT_BODY}}"}
  ]
}
```

`NewsletterSchema` (shared for validator):
```json
{
  "type": "object",
  "properties": {
    "subject": {"type": "string", "description": "Email subject line <=60 chars"},
    "preheader": {"type": "string", "description": "Preview text <=100 chars"},
    "shareableSnippet": {"type": "string", "description": "One-liner for social share"},
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "heading": {"type": "string"},
          "html": {"type": "string"},
          "text": {"type": "string"}
        },
        "required": ["heading", "html", "text"]
      }
    }
  },
  "required": ["subject", "sections"]
}
```

### 6.3 Prompt Templates
#### 6.3.1 Free – Cosmic Pulse
```
Compose a Cosmic Pulse for {sun_sign} on {date}.
User: {first_name}, DOB: {dob}, Timezone: {tz}.
Current planetary positions: {ephemeris_json}
Return JSON via function create_newsletter_block with:
 • subject
 • preheader
 • shareableSnippet (max 120 chars)
 • sections[0]: Heading "Cosmic Pulse", html paragraph with <150 words, plus bullet list of 3 affirmations.
```
#### 6.3.2 Basic – Daily Personal Horoscope
```
Generate personalised horoscope accounting for:
 • Natal chart: {natal_chart_json}
 • Today’s transits: {ephemeris_json}
Focus on career, relationships, energy.
Output through create_newsletter_block.
```
#### 6.3.3 Pro – News Digest
```
You are an astro-analyst.
Analyse these 4 headlines {news_json} in context of {ephemeris_json} & user chart {natal_chart_json}.
Focus areas: {focus_preferences} - weight content accordingly.
Return newsletter block with sections:
 1. "Top Cosmic Take" (summary)
 2. One section per headline (analysis + dates).
```

#### 6.3.4 Focus-Based Content Adaptation
All prompts include focus preference weighting:
```
Base content generation with focus overlay:
- Primary focus (first selected): 50% content weight
- Secondary focus (if selected): 30% content weight  
- Tertiary focus (if selected): 20% content weight
- Remaining content: Generic astrological insights

Example for user with [relationships, career] focuses:
"Generate daily horoscope prioritizing:
1. Relationship insights and timing (50%)
2. Career guidance and opportunities (30%)
3. General astrological guidance (20%)"
```

### 6.4 Email Template Skeleton (MJML excerpt)
```mjml
<mjml><mj-body>
  <mj-section><mj-column>
    <mj-text font-size="20px" font-weight="bold">{{subject}}</mj-text>
    <mj-text font-size="14px" color="#555">{{preheader}}</mj-text>
  </mj-column></mj-section>
  {{#each sections}}
  <mj-section><mj-column>
    <mj-text font-size="18px" font-weight="bold">{{heading}}</mj-text>
    <mj-raw>{{{html}}}</mj-raw>
  </mj-column></mj-section>
  {{/each}}
  <mj-section><mj-column>
    <mj-text font-size="14px" align="center">Share: {{shareableSnippet}}</mj-text>
    <mj-text font-size="11px" color="#999">Astropal • Unsubscribe • Privacy</mj-text>
  </mj-column></mj-section>
</mj-body></mjml>
```
Conversion to HTML occurs in Worker via `@brevo/mjml`.

### 6.5 Validation & Monitoring
* **JSON Schema validation** with Ajv; log violation percentages.
* **Content profanity & negativity check** (OpenAI moderation endpoint fallback).
* **Duplicate detection** via SHA-1 hash of `sections[0].text`.
* **Observability**: metric `content_gen_latency` & `grok_cost_usd` pushed to Cloudflare Analytics.

---

## 6.6 Fallback Model Strategy (NEW)
If Grok API returns 5XX or exceeds 3 s latency, switch to **OpenAI gpt-4o**:
* Endpoint: `POST https://api.openai.com/v1/chat/completions`
* Model: `gpt-4o-mini` (closest cost/perf)
* Same `NewsletterSchema`; prompt composer swaps placeholders.
* Circuit-breaker metric `grok_failure_rate > 5%` triggers automatic route for 15 min.

---

## 6.7 Sharable Content & Social Layer (NEW)
Gen Z growth relies on virality. Each send includes **Shareable Assets**:
* **shareableSnippet** – text <=120 chars already in `NewsletterSchema`.
* **shareableImageUrl** – optional URL for a 1080×1080 PNG card auto-generated by Worker.

### 6.7.1 Image Generation Service
* **Tech**: `@vercel/satori` + `svg2png` inside Worker.
* **Endpoint**: `/api/share/{contentId}` returns PNG (cached 7 days in R2/CDN).
* **Template**: Card shows user sun-sign icon + quote.
* **OpenGraph Tags** on landing pages embed card for social previews.

### 6.7.2 Referral Links
* Unique `referral_code` issued at signup, appended to `?r=CODE` in share URL.
* When a new user registers with code, referrer gains `free_days += 3` (stored in `users.bonus_days`).

`NewsletterSchema` extension:
```json
"shareableImageUrl": {"type":"string"},
"cta": {"type":"string", "description":"Upgrade or referral call-to-action"}
```

---

## 6.8 Full Content JSON Layout (for developers)
```json
{
  "subject": "string",
  "preheader": "string",
  "shareableSnippet": "string",
  "shareableImageUrl": "string|null",
  "sections": [
    {
      "id": "intro",              // stable key for template mapping
      "heading": "string",
      "html": "<p>..</p>",
      "text": "string",
      "cta": {
         "label": "string",
         "url": "string"          // upgrade / referral links
      }
    }
  ],
  "generatedAt": "ISO8601"
}
```
Frontend renderer maps `id` to MJML partial includes so designers can reorder without code.

---

## 7  Security  (Dedicated Section)
### 7.1 Threat Model
Assets: subscriber PII (email, DOB), subscription tokens, Stripe & Grok API keys. Primary threats: data breach, account enumeration, API key leakage, prompt injection.

### 7.2 Controls
| Layer | Control | Implementation |
|-------|---------|----------------|
| Transport | TLS 1.3 everywhere | Cloudflare automatic, HSTS preload |
| Data at Rest | AES-256-GCM | Workers Secrets for key; D1 PRAGMA key |
| Secrets | Zero-trust secrets storage | CF Worker Secrets; access via env vars only |
| Auth | HMAC-signed internal requests | `X-APIsig` header with rotating key |
| Rate Limiting | 100 req/min/IP | CF WAF rules |
| Input Validation | AJV schema + OWASP sanitizer | For all inbound JSON |
| Prompt Injection | Escaping user-supplied names; instruction hierarchy (system role dominates) | Unit tests for attack vectors |
| Backup | Encrypted R2 snapshots every 6 h | Lifecycle rule 30 days |
| Logging | CF Logs → R2 → retained 90 days | Pseudonymised user IDs |
| Compliance | GDPR DPA, CAN-SPAM | Auto-purge inactive >24 mo |

### 7.3 Incident Response
1. **Detect** via alert on anomalous access.  
2. **Contain** – rotate secrets, block IP via WAF.  
3. **Notify** affected users within 72 h (GDPR).  
4. **Remediate** – post-mortem and patch.

---

## 8  Data Model (renumbered)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  birth_date DATE NOT NULL,
  birth_location TEXT NOT NULL, -- City, Country format
  timezone TEXT NOT NULL,
  tier TEXT DEFAULT 'trial', -- trial|free|basic|pro
  trial_end DATETIME,
  focus_preferences TEXT, -- JSON array of focus IDs ["relationships", "career"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signup_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT -- 'success', 'duplicate', 'error'
);

CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  status TEXT, -- active|past_due|canceled
  current_period_end DATETIME,
  stripe_customer TEXT,
  stripe_subscription TEXT
);

CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  template TEXT,
  sent_at DATETIME,
  status TEXT,
  open_at DATETIME,
  click_at DATETIME
);
```
KV Namespace keys:
* `content:{userId}:{YYYYMMDD}` – JSON generated body
* `astro:{YYYYMMDD}` – planetary positions cache

---

## 9A Content Types & Send Schedule (NEW)
| Tier | Cadence | Template Slug | Sections |
|------|---------|---------------|----------|
| Free | Daily 06:00 | `cosmic-pulse` | Pulse insight, 3 affirmations, shareable snippet |
| Free | Weekly Sun 08:00 | `week-ahead-teaser` | 7-day summary, upgrade CTA |
| Free | Monthly 1st 09:00 | `monthly-preview` | Major transits, testimonials |
| Basic | Daily 06:00 | `personal-horoscope` | Full chart analysis, career, relationships |
| Basic | Daily 19:00 | `evening-reflection` | Day review, tomorrow prep, gratitude |
| Basic | Weekly Sun 07:00 | `astro-weather` | Planetary movements, rituals |
| Basic | Monthly 1st 08:00 | `monthly-forecast` | Personal analysis, growth areas |
| Pro | Daily 06:00 | `deep-dive-horoscope` | Advanced insights, health, business |
| Pro | Daily 12:00 | `news-digest` | 3-5 stories analysis, market insights |
| Pro | Daily 19:00 | `evening-guidance` | Advanced reflection, tomorrow strategy |
| Pro | Weekly Sun 06:30 | `authority-report` | Business strategy, financial timing |
| Pro | Weekly Wed 12:00 | `midweek-adjustment` | Course corrections, opportunities |
| Pro | Monthly 1st 07:00 | `deep-dive-report` | 2000+ word analysis, PDF link |
| Pro | Monthly 15th 12:00 | `strategy-session` | Long-term planning, life transitions |

Scheduler maps above table → cron jobs per locale/timezone.

---

## 9B Template Storage & Injection (NEW)
* **Storage** – All MJML templates versioned in R2 bucket `templates/`. Filenames follow `{slug}/{locale}/v{semver}.mjml`.
* **Lookup** – Renderer fetches template from R2 (cached in KV 24 h).
* **Injection** – Mustache data = validated Grok/GPT JSON merged with i18n tokens then compiled to HTML.
* **Template List (MVP)**:
  - `cosmic-pulse`
  - `week-ahead-teaser`
  - `personal-horoscope`
  - `mental-health`
  - `news-digest`
  - `astro-weather`
  - `deep-dive-report`
  - `upgrade-offer`
  - `referral-reward`

---

## 10  Non-Functional Requirements (renumbered)
* **Performance**: 95-th percentile < 3 s API, < 5 s content generation.  
* **Security**: TLS 1.3, AES-256 at rest, OWASP top-10 mitigations.  
* **Privacy/GDPR**: data minimisation; one-click delete; data export JSON; 2-year auto-purge.  
* **Reliability**: graceful degradation – fallback to previous day’s generic content if Grok/API down.  
* **Observability**: Cloudflare Logs → Grafana dashboard, alerting via Slack.

---

## 11  Testing Strategy (renumbered)
1. **Unit tests** – API routes, content assembler, ephemeris calculations (> 90 % coverage).  
2. **Integration** – end-to-end registration→email send using MailHog mock.  
3. **Load** – k6 script: 10 k concurrent newsletter generations.  
4. **Security** – automated ZAP scan; dependency SCA.  
5. **Acceptance** – Stakeholder review of email rendering across clients.

---

## 11B Front-End Project Structure (NEW)
**Stack**: Next.js 14 (App Router) + TypeScript + TailwindCSS + next-intl.

```
/apps/web
  /app
    layout.tsx          // global providers (Intl, Logger)
    page.tsx            // Landing (marketing)
    pricing/page.tsx
    privacy/page.tsx
    terms/page.tsx
    verify/[token]/page.tsx   // magic-link callback
  /components
    SignUpForm.tsx      // RFC, zod validation, logger hooks
    Hero.tsx
    FeatureGrid.tsx
    ReferralBanner.tsx
  /lib
    api.ts              // fetch wrapper with HMAC header
    logger.ts           // frontend logger per .cursorrules
    i18n.ts
  /styles
    globals.css
  /middleware.ts        // locale detection
```

* **State**: React Query for API, `cookies` for auth token.
* **Logging**: use `logger` wrapper; events: signup_attempt, signup_success, preference_update.
* **CI**: Vercel preview on PR; Cloudflare Pages prod.

---

## 11A Graphic Designer Technical Tasks (UPDATED)
1. Provide responsive MJML assets (Figma or HTML) for each template slug (see Template List). Must support `{{#each sections}}` loop with stable IDs.
2. Dark-mode colours via `prefers-color-scheme` query.
3. Provide 1080×1080 SVG card template consumed by image generation service.
4. Icons (sun, moon, planets) as monochrome SVG line art.
5. Deliver style-token JSON (`brand.json`) mapping colours, spacing, font scales.

---

## 12  Deployment & CI/CD (renumbered)
* GitHub → GitHub Actions → Wrangler deploy script (`scripts/deploy.sh --env production`).  
* Staged environments: `preview`, `production` (D1 shadow DB).  
* Automatic rollback on failed health-check.

---

## 12  Cloudflare Compatibility Review  (updated endpoints)
| Path | Verb | Body | Purpose |
|------|------|------|---------|
| `/api/register` | POST | { email, dob, birthLocation, locale, referral?, focuses[] } | New signup with rate limiting |
| `/api/verify` | GET | token param | Email verification |
| `/api/preferences` | PUT | { locale, frequency } | Update prefs |
| `/api/referral/{code}` | GET |  | Credit referral |
| `/api/share/{contentId}` | GET |  | Dynamic card PNG |

All responses JSON; errors include `traceId` logged via logger.

---

## 13  Timeline (MVP) (renumbered)
| Week | Deliverable |
|---|---|
| 1 | Repo bootstrap, CI/CD, D1 schema, user registration endpoint |
| 2 | Ephemeris fetcher, KV namespaces, Grok client wrapper |
| 3 | Content templates & generation pipeline |
| 4 | Resend integration, daily cron, basic tier email |
| 5 | Stripe billing, trial automation |
| 6 | Analytics dashboard, GDPR flows, load tests |
| 7 | Beta cohort onboarding (100 users) |
| 8 | Production launch |

---

## 14  Risks & Mitigations (renumbered)
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Grok API outage | Med | High | Cache previous content, switch to generic template |
| Email spam filters | Med | Med | SPF, DKIM, DMARC; gradual IP warm-up |
| API cost overrun | Med | Med | Prompt optimisation, usage monitoring alerts |
| Data breach | Low | High | Encryption, logging, regular audits |
| Subscriber churn | Med | Med | A/B test content, referral incentives |

---

## 15  Open Questions (renumbered)
1. Will mental-health content require clinical disclaimer/legal review?  
2. What localisation strategy for future non-EN markets?  
3. Do we store birth **time** (optional) now or defer to V2?  
4. Should pro tier news digest be separate send or appended to daily newsletter?

---

## 16  Appendix (renumbered)
### Token Cost Calculation (per user / month)
* Avg daily content 800 output + 300 input tokens = 1 100 tokens.  
* 30 days ⇒ 33 k tokens. At $15/1 M output & $5/1 M input ⇒ ≈ $0.033 per user / mo.  
* Pro tier extra digests triple usage ⇒ ≈ $0.10 per pro user / mo.

### Cloudflare Free Tier Headroom
* Workers 100 k req/day ≈ 10 k active users (10 req/user).  
* KV 100 k reads/day matches above; plan to upgrade to Workers Paid at 10 k users.

---

*End of Document* 