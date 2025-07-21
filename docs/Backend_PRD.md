# Backend_PRD.md – Astropal Modular Newsletter Platform

**Document Version:** 2.0  
**Date:** January 20 2025  
**Audience:** Claude Sonnet 4 (AI Coding Engineer)  
**Author:** Senior Software Engineer (Production Systems)
**Last Updated:** Comprehensive additions for database schema, email controls, external dependencies, and production-grade observability

---

## 1  Purpose & Scope
Astropal’s backend must generate, store, and deliver fully-personalised multi-lingual newsletter content at planetary scale while remaining **100 % serverless on Cloudflare free tiers** (upgrade-ready).  
The system must be **project-agnostic** – configurable via prompts, templates, and locale packs so it can power future newsletter brands without code changes.

### Primary Goals
1. Handle user lifecycle (signup → trial → paid tier → churn) with GDPR compliance.  
2. Automate daily/weekly/monthly content generation & email dispatch per tier, language, perspective, and personal data.  
3. Integrate external data providers (NASA JPL, Swiss Ephemeris, news APIs) and LLMs (Grok 3/4, OpenAI GPT-4o) with cost-aware fallback logic.  
4. Provide modular, reusable core that other projects configure via **single `project.config.ts`** (templates, prompts, branding, locale tokens).

---

## 2  Non-Functional Requirements
| Category | Target |
|----------|--------|
| **Latency** | < 300 ms API P95, < 5 s content generation | 
| **Throughput** | 100 k req/day (Workers free tier) | 
| **Uptime** | ≥ 99.9 % | 
| **Cost** | ≤ $5/mo until 10 k users | 
| **Scalability** | Linear by upgrading CF service plans only | 
| **Security** | OWASP-10, GDPR, PCI for Stripe | 
| **Observability** | Structured logs → R2, metrics → CF Analytics | 

---

## 3  High-Level Architecture
```
┌──────────────────────────────────┐
│ Cloudflare Worker: API Gateway   │  /api/* (HMAC signed)              
└──────────────┬───────────────────┘
               │ DB & KV access
┌──────────────▼────────────┐   cron triggers   ┌────────────────────┐
│ Cloudflare Worker: Core   │◀───────────────────│ Scheduler (Cron)   │
│  • Content Generator      │                   └────────┬───────────┘
│  • Template Renderer      │ fetch ephemeris/news   daily|weekly
└────────┬────────┬─────────┘                             ▼
         │        │                          ┌─────────────────────────┐
         │        └─► KV: content:{uid:date} │  Email Worker (Resend) │
         │              astro:{date}         └─────────────────────────┘
         │                                     ▲ send          │
         │                                     │               │ webhooks
         │        ┌──────────────────┐         │               ▼
         └────────► Cloudflare D1    │◄────────┴───────────Stripe/Resend
                  │ users, subs, ... │
                  └──────────────────┘
```
*Static assets & MJML templates* live in **R2** (CDN cache).  
*Logs & metrics* stream to R2 / CF Logs.

---

## 4  Cloudflare Resource Allocation
| Resource | Namespace / Route | Purpose | Free-tier Limit |
|----------|------------------|---------|-----------------|
| **Workers** | `api`, `core`, `email`, `scheduler` | API, generation, email, cron | 100 k req/day each acct |
| **Cron Triggers** | 5 jobs | Ephemeris fetch, daily send, weekly send, monthly send, cleanup | 5 limit met |
| **D1** | `astropal_main` | Relational data | 25 GB |
| **KV** | `astro`, `content`, `i18n` | Ephemeris, rendered content, locale packs | 1 GB free |
| **R2** | `templates`, `logs` | MJML, assets, structured logs | 10 GB egress free |
| **Pages** | `frontend` | Next.js static frontend | unlimited builds (free) |

---

## 5  Data Model (D1)
```sql
-- users & auth
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  auth_token TEXT UNIQUE NOT NULL, -- system-generated unique token
  birth_date DATE NOT NULL,
  birth_location TEXT NOT NULL,
  birth_time TEXT DEFAULT '12:00',
  timezone TEXT NOT NULL,
  locale TEXT DEFAULT 'en-US', -- i18n
  perspective TEXT DEFAULT 'calm',
  tier TEXT DEFAULT 'trial',   -- trial|free|basic|pro
  trial_end DATETIME,
  referral_code TEXT,
  focus_preferences TEXT, -- JSON array
  last_activity DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- subscription & billing
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  status TEXT,
  stripe_customer TEXT,
  stripe_subscription TEXT,
  current_period_end DATETIME
);

-- signup & rate limiting
CREATE TABLE signup_attempts (
  id TEXT PRIMARY KEY,
  email TEXT,
  ip_address TEXT,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT -- duplicate|rate_limited|success
);

-- email send & engagement logs
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  template TEXT,
  sent_at DATETIME,
  status TEXT,
  open_at DATETIME,
  click_at DATETIME
);

-- external data caches
CREATE TABLE ephemeris_cache (
  date DATE PRIMARY KEY,
  json TEXT,
  fetched_at DATETIME
);

-- news cache for Pro tier
CREATE TABLE news_cache (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT,
  category TEXT,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- content templates metadata
CREATE TABLE content_templates (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL, -- cosmic-pulse, personal-horoscope, etc.
  tier TEXT NOT NULL, -- free|basic|pro
  cadence TEXT NOT NULL, -- daily|weekly|monthly
  send_time TEXT NOT NULL, -- 06:00, 19:00, etc.
  locale TEXT DEFAULT 'en-US',
  mjml_path TEXT NOT NULL, -- R2 path to template
  prompt_template TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- referral tracking
CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_user_id TEXT REFERENCES users(id),
  referred_email TEXT NOT NULL,
  referred_user_id TEXT REFERENCES users(id), -- NULL until signup
  bonus_days INTEGER DEFAULT 3,
  credited_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- email engagement detailed tracking
CREATE TABLE email_engagement (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  email_log_id TEXT REFERENCES email_logs(id),
  action_type TEXT NOT NULL, -- open|click|unsubscribe|upgrade|change_perspective
  action_target TEXT, -- URL clicked, button pressed, etc.
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address TEXT
);

-- perspective change tracking (for email buttons)
CREATE TABLE perspective_changes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  old_perspective TEXT,
  new_perspective TEXT,
  changed_via TEXT DEFAULT 'email', -- email|api|admin
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- subscription management tokens (for email buttons)
CREATE TABLE subscription_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token_type TEXT NOT NULL, -- upgrade|cancel|unsubscribe|change_perspective
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
*Schema versioned via Drizzle-ORM migrations with proper indexing for performance.*

---

## 6  Configuration & Extensibility
All project-specific knobs live in **`project.config.ts`** (imported by Workers):
```ts
export default {
  brand: 'Astropal',
  locales: ['en-US','es-ES'],
  defaultPerspective: 'calm',
  tiers: ['free','basic','pro'],
  perspectives: ['calm', 'knowledge', 'success', 'evidence'],
  focusAreas: ['relationships', 'career', 'wellness', 'social', 'spiritual', 'evidence-based'],
  prompts: {
    'cosmic-pulse': {
      model: 'grok-3-mini',
      templateId: 'cosmic-pulse',
      fnName: 'create_newsletter_block',
      systemPrompt: 'You are Astropal, an ethical astrologer...',
      basePrompt: 'Compose a Cosmic Pulse for {{sun_sign}} ...'
    },
    /* more templates */
  },
  emailTemplates: {
    'cosmic-pulse': 'v1.0/cosmic-pulse.mjml',
    // ...
  },
  frontend: {
    landingPageVariant: 'astropal', // astropal|fitness|wellness|etc
    brandColors: {
      primary: '#8B5CF6',
      secondary: '#F59E0B',
      background: '#0F172A'
    },
    domains: {
      production: 'astropal.com',
      preview: 'preview.astropal.com'
    }
  }
};
```

### 6.1 Project Swapping Architecture
Switching to a new newsletter brand requires **both backend and frontend** changes:

**Backend Changes:**
- Swap `project.config.ts` with new brand configuration
- Upload new MJML templates to R2 under new brand namespace
- Provide new locale JSON in KV `i18n:{locale}:{brand}`
- Update `content_templates` table with new brand slug patterns

**Frontend Changes:**
- Deploy new frontend with brand-specific:
  - Landing page copy and imagery (`apps/web-{brand}/`)
  - Color scheme and typography (`tailwind.config.js`)
  - Signup flow messaging and legal pages
  - Brand assets (logo, favicon, social images)
- Configure new Cloudflare Pages project for brand domain
- Update environment variables for API endpoints

**Deployment Process:**
1. Create new `project.config.{brand}.ts`
2. Deploy frontend to new Pages project
3. Update Worker environment variables to point to new config
4. Test end-to-end signup → email generation → delivery
5. Configure DNS and SSL for new brand domain

---

## 7  API Surface (`/api/*`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | none | Signup + immediate account creation, rate-limited |
| PUT  | `/preferences` | bearer | Update locale, perspective, focuses |
| POST | `/stripe/webhook` | secret | Subscription events |
| GET  | `/share/{contentId}` | public | Social PNG card |
| GET  | `/healthz` | none | System health check for load balancers |
| GET  | `/email/upgrade?token=` | signed-token | Upgrade subscription from email |
| GET  | `/email/cancel?token=` | signed-token | Cancel subscription from email |
| GET  | `/email/unsubscribe?token=` | signed-token | Complete unsubscribe from email |
| GET  | `/email/perspective?token=&p=` | signed-token | Change perspective from email |

All responses JSON with `traceId`; errors logged via structured logger.

---

## 7B  Authentication Strategy (Token-Based)
Astropal uses **token-based authentication** where each user receives a unique system-generated auth token in their emails that enables account management without passwords.

### 7B.1 Registration Flow
```typescript
// POST /api/register
interface RegisterRequest {
  email: string;
  birthDate: string; // YYYY-MM-DD
  birthLocation: string; // "City, Country"
  birthTime?: string; // optional, defaults to "12:00"
  timezone: string; // auto-detected or user selected
  locale: 'en-US' | 'es-ES'; // language preference
  perspective: 'calm' | 'knowledge' | 'success' | 'evidence';
  focusAreas: string[]; // 1-3 areas from predefined list
  referralCode?: string;
}

interface RegisterResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    tier: 'trial'; // always starts as trial
    trialEnd: string; // 7 days from registration
    authToken: string; // unique token for account management
  };
  traceId: string;
}

// Auth token generation
const generateAuthToken = (): string => {
  // Generate cryptographically secure unique token
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
```

### 7B.2 Token-Based Account Access
**Token Usage:**
- Each user has a permanent unique auth token stored in the database
- Token is included in all email links for account management
- No passwords, no login/logout - just secure tokenized links
- Token enables access to unsubscribe page with full account controls

**Email Link Structure:**
```
https://astropal.com/manage?token={authToken}
https://astropal.com/confirm/upgrade?token={authToken}&action=upgrade
https://astropal.com/confirm/cancel?token={authToken}&action=cancel
```

### 7B.3 Security Considerations
- **Token Generation**: Cryptographically secure random tokens
- **Token Storage**: Hashed in database, plaintext only in emails
- **Rate Limiting**: Account management actions limited to 5 per hour
- **Token Rotation**: Optional manual rotation for compromised accounts

### 7B.4 Frontend Integration
```typescript
// lib/auth.ts
export const useTokenAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Extract token from URL and validate
  const validateToken = async (token: string) => {
    const response = await fetch(`/api/validate-token?token=${token}`);
    const data = await response.json();
    
    if (data.success) {
      setUser(data.user);
      logger.info('Token validated', { userId: data.user.id });
    }
    return data;
  };
  
  // Register new user
  const register = async (registrationData: RegisterRequest) => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    const data = await response.json();
    if (data.success) {
      logger.info('User registered', { 
        userId: data.user.id, 
        tier: data.user.tier,
        component: 'registration'
      });
    }
    return data;
  };
  
  return { user, validateToken, register, loading };
};
```

---

## 7A  Email Control Integration (No User Dashboard)
Since Astropal operates without a user dashboard, all subscription management occurs through **secure, tokenized links embedded in email templates**. This approach reduces development complexity while maintaining security and user experience.

### 7A.1 Email Button Framework
Each newsletter email contains action buttons in the footer section:

**Free Tier Emails:**
- **"Upgrade to Basic"** → `/email/upgrade?token={signed_token}&tier=basic`
- **"Change Perspective"** → `/email/perspective?token={signed_token}&p={perspective}`
- **"Unsubscribe"** → `/email/unsubscribe?token={signed_token}`

**Basic/Pro Tier Emails:**
- **"Upgrade to Pro"** (Basic only) → `/email/upgrade?token={signed_token}&tier=pro`
- **"Cancel Subscription"** → `/email/cancel?token={signed_token}`
- **"Change Perspective"** → `/email/perspective?token={signed_token}&p={perspective}`
- **"Unsubscribe Completely"** → `/email/unsubscribe?token={signed_token}`

### 7A.2 Secure Token Generation
Tokens are generated when composing each email and stored in `subscription_tokens` table:

```javascript
// Token generation for email buttons
const generateEmailToken = (userId, tokenType, expiryHours = 72) => {
  const payload = {
    userId,
    tokenType,
    timestamp: Date.now(),
    expires: Date.now() + (expiryHours * 60 * 60 * 1000)
  };
  const token = hmacSign(JSON.stringify(payload), WORKER_SECRET);
  
  // Store in D1 for tracking and prevent replay
  await db.insert(subscription_tokens).values({
    id: generateId(),
    user_id: userId,
    token_type: tokenType,
    token_hash: sha256(token),
    expires_at: new Date(payload.expires)
  });
  
  return token;
};
```

### 7A.3 Token Processing & User Experience
When user clicks email button:

1. **Token Validation**: Verify signature, check expiry, ensure single-use
2. **Action Processing**: Execute subscription change via Stripe API
3. **Confirmation Page**: Minimal HTML page confirming action with option to:
   - Return to email
   - Update additional preferences
   - Share feedback
4. **Email Confirmation**: Send confirmation email for significant changes
5. **Logging**: Track all actions in `email_engagement` table

### 7A.4 Email Template Integration
MJML templates include dynamic button sections:

```mjml
<mj-section>
  <mj-column>
    <mj-button href="{{upgradeUrl}}" background-color="#8B5CF6">
      Upgrade to {{targetTier}} - {{tierPrice}}
    </mj-button>
    
    <mj-text align="center" font-size="12px">
      <a href="{{perspectiveUrl}}">Change to {{altPerspective}} perspective</a> |
      <a href="{{unsubscribeUrl}}">Unsubscribe</a>
    </mj-text>
  </mj-column>
</mj-section>
```

Perspective selector includes quick-change links for all 4 perspectives:
```mjml
<mj-text align="center" font-size="11px" color="#666">
  Switch perspective: 
  <a href="{{calmUrl}}">Calm</a> | 
  <a href="{{knowledgeUrl}}">Knowledge</a> | 
  <a href="{{successUrl}}">Success</a> | 
  <a href="{{evidenceUrl}}">Evidence</a>
</mj-text>
```

### 7A.5 Frontend Confirmation Pages (Next.js Routes)
Since email buttons should provide a seamless branded experience, all email actions redirect to **static Next.js pages** on the frontend domain rather than Worker-generated HTML.

**Required Frontend Routes:**
```typescript
// app/confirm/upgrade/page.tsx
export default function UpgradePage({ searchParams }: { searchParams: { token: string } }) {
  const { logUserAction, logError } = useLogger('ConfirmUpgradePage');
  
  useEffect(() => {
    const processUpgrade = async () => {
      try {
        logUserAction('upgrade_attempt', { token: searchParams.token?.slice(0, 8) });
        const response = await fetch(`/api/email/upgrade?token=${searchParams.token}`);
        const result = await response.json();
        
        if (result.success) {
          logUserAction('upgrade_success', { newTier: result.tier });
          // Show success message with new tier benefits
        } else {
          logError(new Error(result.error), { action: 'upgrade' });
        }
      } catch (error) {
        logError(error, { action: 'upgrade', token: searchParams.token?.slice(0, 8) });
      }
    };
    
    if (searchParams.token) processUpgrade();
  }, [searchParams.token]);
  
  return <ActionResult type="upgrade" />;
}
```

**Complete Route Structure:**
- `/confirm/upgrade` - Stripe checkout initiation and confirmation
- `/confirm/cancel` - Subscription cancellation with retention offers
- `/confirm/unsubscribe` - Complete email removal with feedback collection
- `/confirm/perspective` - Perspective change with explanation of new style
- `/confirm/expired` - Shared page for expired/invalid tokens

### 7A.6 Enhanced Token Strategy
Email tokens now contain **encrypted user context** to enable seamless frontend experience:

```typescript
// Enhanced token generation with user context
const generateEmailToken = (userId: string, tokenType: string, userContext: any) => {
  const payload = {
    userId,
    tokenType,
    userContext: {
      currentTier: userContext.tier,
      currentPerspective: userContext.perspective,
      email: userContext.email, // for display only
      firstName: userContext.firstName
    },
    timestamp: Date.now(),
    expires: Date.now() + (72 * 60 * 60 * 1000)
  };
  
  // Encrypt payload for frontend decoding
  const encryptedPayload = encrypt(JSON.stringify(payload), ENCRYPTION_SECRET);
  const token = hmacSign(encryptedPayload, WORKER_SECRET);
  
  return `${token}.${encryptedPayload}`;
};
```

**Frontend Token Processing:**
```typescript
// lib/tokenUtils.ts
export const decodeEmailToken = (token: string) => {
  try {
    const [signature, encryptedPayload] = token.split('.');
    
    // Verify HMAC signature
    const expectedSignature = hmacSign(encryptedPayload, WORKER_SECRET);
    if (signature !== expectedSignature) throw new Error('Invalid token signature');
    
    // Decrypt and parse payload
    const payload = JSON.parse(decrypt(encryptedPayload, ENCRYPTION_SECRET));
    
    // Check expiry
    if (Date.now() > payload.expires) throw new Error('Token expired');
    
    return payload;
  } catch (error) {
    logger.error('Token decode failed', { error: error.message });
    return null;
  }
};
```

### 7A.7 Shared Frontend Components
**ActionResult Component:**
```typescript
// components/ActionResult.tsx
interface ActionResultProps {
  type: 'upgrade' | 'cancel' | 'unsubscribe' | 'perspective';
}

export function ActionResult({ type }: ActionResultProps) {
  const { logUserAction } = useLogger('ActionResult');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [userContext, setUserContext] = useState<any>(null);
  
  // Auto-decode token from URL and set user context
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      const decoded = decodeEmailToken(token);
      if (decoded) {
        setUserContext(decoded.userContext);
        logUserAction('token_decoded', { type, userId: decoded.userId });
      } else {
        setStatus('expired');
      }
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-cosmic-dark">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && <LoadingSpinner />}
        {status === 'success' && <SuccessMessage type={type} userContext={userContext} />}
        {status === 'error' && <ErrorMessage type={type} />}
        {status === 'expired' && <ExpiredMessage />}
      </div>
    </div>
  );
}
```

### 7A.8 Error Handling & Fallbacks
- **Expired Tokens**: Show branded expired page with "Request new link" option
- **Already Used**: Display current subscription status with available actions
- **Stripe Errors**: Branded error page with support contact and retry options
- **Rate Limiting**: User-friendly message with cooldown timer
- **Network Errors**: Retry mechanism with exponential backoff

---

## 8  Content Generation Pipeline
1. **Scheduler cron @00:05 UTC** → `core` Worker:
   - Fetch ephemeris (NASA JPL primary, Swiss fallback) -> KV `astro:{YYYY-MM-DD}` & D1 `ephemeris_cache`.
2. **User batch** grouping by tier & local send-time.
3. **Prompt Composer** builds prompt using user data + ephemeris + `project.config.prompts` entry.
4. **LLM Call** (Grok 3/4; fallback GPT-4o if >3 s or ≥5 % 5xx).
5. **Schema Validation** via Ajv; profanity & duplication checks.
6. **MJML Render** using template path in `project.config.emailTemplates` fetched from R2 (cached in KV).
7. **Store** rendered HTML/plain in KV `content:{userId}:{YYYYMMDD}` (TTL 48 h).
8. **Email Worker** immediately sends morning email via Resend, schedules afternoon/evening if needed.
9. **Log** generation latency & cost metrics.

---

## 9  Multi-Language & Perspective Logic
* Each `locale` has:
  * `i18n:{locale}` JSON – static tokens for templates & prompts.
  * `project.config.prompts` may override per-locale model/temperature.
* Perspectives (`calm`, `knowledge`, `success`, `evidence`) are injected as weighting in prompt: e.g. `Focus on {{perspective}} tone (70 %)`.
* Renderer selects locale MJML (fallback to `en-US`).

---

## 10  External Integrations
| Service | Purpose | SDK / Endpoint |
|---------|---------|----------------|
| **Grok 3/4** | Content generation | REST `POST /chat/completions` |
| **OpenAI GPT-4o** | Fallback LLM | `/v1/chat/completions` |
| **NASA JPL** | Planetary data | HTTPS CSV | 
| **Swiss Ephemeris** | Backup astro data | HTTP JSON |
| **NewsAPI** | Headlines for Pro | `/v2/top-headlines` |
| **Resend** | Email send & analytics | `/emails` |
| **Stripe** | Billing | Webhooks + client |

All outbound requests include `X-APIsig` HMAC header for traceability.

---

## 9A  Infrastructure & Operational Requirements
Production-grade infrastructure setup with Infrastructure-as-Code principles and comprehensive health monitoring.

### 9A.1 Health Check & Monitoring Endpoints
**Public Health Check Endpoint:**
```typescript
// GET /healthz - Public endpoint for load balancers and synthetic monitoring
export const healthCheck = async (request: Request, env: Env): Promise<Response> => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION || '1.0.0',
    environment: env.NODE_ENV,
    checks: {
      database: await checkD1Connection(env.DB),
      kv: await checkKVConnection(env.KV_ASTRO),
      grok: await checkGrokAPI(env.GROK_API_KEY),
      resend: await checkResendAPI(env.RESEND_API_KEY)
    }
  };
  
  const allHealthy = Object.values(healthData.checks).every(check => check.status === 'healthy');
  const statusCode = allHealthy ? 200 : 503;
  
  logger.info('Health check performed', { 
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks: healthData.checks,
    component: 'health-check'
  });
  
  return new Response(JSON.stringify(healthData), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Individual health check functions
const checkD1Connection = async (db: D1Database) => {
  try {
    await db.prepare('SELECT 1').first();
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};
```

### 9A.2 Infrastructure-as-Code Requirements
**Repository Structure:**
```
/infrastructure
  /cloudflare
    wrangler.toml         # Worker configuration
    d1-migrations/        # Database schema versions
    kv-namespaces.json   # KV namespace definitions
    dns-records.json     # Cloudflare DNS configuration
  /scripts
    bootstrap.sh         # One-shot environment setup
    deploy.sh           # Production deployment script
    backup.sh           # Daily backup automation
  /terraform (optional)
    main.tf             # Cloudflare resources as code
    variables.tf        # Environment-specific configs
```

**Wrangler Configuration Template:**
```toml
# wrangler.toml
name = "astropal-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "astropal-api"
route = { pattern = "api.astropal.com/*", zone_name = "astropal.com" }
kv_namespaces = [
  { binding = "KV_ASTRO", id = "astro_namespace_id", preview_id = "astro_preview_id" },
  { binding = "KV_CONTENT", id = "content_namespace_id", preview_id = "content_preview_id" },
  { binding = "KV_I18N", id = "i18n_namespace_id", preview_id = "i18n_preview_id" }
]

[[env.production.d1_databases]]
binding = "DB"
database_name = "astropal_main"
database_id = "database_uuid"

[env.production.vars]
NODE_ENV = "production"
LOG_LEVEL = "warn"
STRIPE_PUBLISHABLE_KEY = "pk_live_..."
RESEND_FROM_EMAIL = "cosmic@astropal.com"
RESEND_FROM_NAME = "Astropal"
APP_VERSION = "1.0.0"

[env.development]
name = "astropal-api-dev"
# Similar configuration for development environment
```

**Bootstrap Script:**
```bash
#!/bin/bash
# scripts/bootstrap.sh - One-shot environment setup

set -e

echo "🚀 Bootstrapping Astropal infrastructure..."

# 1. Create D1 database
wrangler d1 create astropal_main
echo "✅ D1 database created"

# 2. Run initial migrations
wrangler d1 migrations apply astropal_main --env production
echo "✅ Database schema applied"

# 3. Create KV namespaces
wrangler kv:namespace create "KV_ASTRO" --env production
wrangler kv:namespace create "KV_CONTENT" --env production
wrangler kv:namespace create "KV_I18N" --env production
echo "✅ KV namespaces created"

# 4. Create R2 buckets
wrangler r2 bucket create astropal-templates
wrangler r2 bucket create astropal-logs
echo "✅ R2 buckets created"

# 5. Set up DNS records
cloudflare-cli dns create --type A --name "@" --content "192.0.2.1" --zone astropal.com
cloudflare-cli dns create --type CNAME --name "api" --content "astropal-api.workers.dev" --zone astropal.com
echo "✅ DNS records configured"

# 6. Deploy initial workers
wrangler deploy --env production
echo "✅ Workers deployed"

echo "🎉 Bootstrap complete! Don't forget to:"
echo "  1. Add secrets with 'wrangler secret put'"
echo "  2. Configure Stripe webhooks"
echo "  3. Verify Resend domain"
echo "  4. Upload MJML templates to R2"
```

### 9A.3 Database Migration Strategy
**Migration Framework:**
```typescript
// migrations/0001_initial_schema.sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  -- ... full schema
);

-- migrations/0002_add_password_auth.sql  
ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN last_login DATETIME;

-- migrations/0003_email_controls.sql
CREATE TABLE subscription_tokens (
  -- ... token management schema
);
```

**Migration Execution:**
```bash
# Apply migrations with rollback capability
wrangler d1 migrations apply astropal_main --env production

# Rollback if needed (manual process)
wrangler d1 execute astropal_main --env production --command "DROP TABLE subscription_tokens;"
```

### 9A.4 Deployment Pipeline
**GitHub Actions Configuration:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Run security scan
        run: npm audit --audit-level=high
        
      - name: Deploy to Cloudflare
        run: npx wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          
      - name: Run health check
        run: curl -f https://api.astropal.com/healthz
        
      - name: Notify deployment
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H 'Content-Type: application/json' \
            -d '{"text":"🚀 Astropal backend deployed successfully"}'
```

### 9A.5 Backup & Disaster Recovery
**Automated Backup Strategy:**
```bash
#!/bin/bash
# scripts/backup.sh - Daily backup automation

# 1. Export D1 database
wrangler d1 export astropal_main --output="/tmp/astropal_backup_$(date +%Y%m%d).sql"

# 2. Upload to R2 with encryption
wrangler r2 object put astropal-backups/db/backup_$(date +%Y%m%d).sql.gz \
  --file="/tmp/astropal_backup_$(date +%Y%m%d).sql" \
  --content-encoding="gzip"

# 3. Export KV namespaces
wrangler kv:bulk get --namespace-id="$KV_ASTRO_ID" > /tmp/kv_astro_$(date +%Y%m%d).json
wrangler r2 object put astropal-backups/kv/astro_$(date +%Y%m%d).json --file="/tmp/kv_astro_$(date +%Y%m%d).json"

# 4. Clean up local files
rm /tmp/astropal_backup_* /tmp/kv_*

echo "✅ Backup completed: $(date)"
```

**Recovery Procedures:**
1. **Database Recovery**: Download latest backup from R2, restore with `wrangler d1 execute`
2. **KV Recovery**: Bulk import from backup JSON files
3. **Worker Recovery**: Redeploy from Git with `wrangler deploy`
4. **DNS Recovery**: Cloudflare DNS records backed up daily to Git

---

## 10A  External Dependencies & Manual Setup Requirements
This section lists all API keys, services, and configuration data that must be manually obtained and configured by the human developer before system deployment.

### 10A.1 Required API Keys & Credentials
**Critical Path - System Won't Function Without These:**

| Service | Required Credentials | Signup Location | Configuration Notes |
|---------|---------------------|----------------|-------------------|
| **Grok API** | API Key | https://x.ai/api | Rate limits vary by plan; essential for content generation |
| **OpenAI** | API Key + Organization ID | https://platform.openai.com | Fallback LLM; GPT-4o access required |
| **Resend** | API Key | https://resend.com | Email delivery; verify domain ownership |
| **Stripe** | Publishable Key + Secret Key + Webhook Secret | https://stripe.com | Payment processing; webhook endpoint required |
| **NewsAPI** | API Key | https://newsapi.org | Pro tier news content; free tier limited |

**Domain & Infrastructure:**
| Component | Manual Setup Required | Configuration Details |
|-----------|----------------------|---------------------|
| **Custom Domain** | DNS + SSL Configuration | Point to Cloudflare Pages; configure CNAME |
| **Email Domain** | SPF/DKIM/DMARC Records | Required for Resend email delivery |
| **Cloudflare Account** | Workers/Pages/D1/KV Setup | Free tier sufficient for MVP |

### 10A.2 Worker Secrets Configuration
Store all credentials as Cloudflare Worker Secrets (never in code):

```bash
# Core API Keys
wrangler secret put GROK_API_KEY
wrangler secret put OPENAI_API_KEY  
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Domain Configuration
wrangler secret put FRONTEND_DOMAIN # e.g., "astropal.com"
wrangler secret put API_BASE_URL    # e.g., "api.astropal.com"

# Internal Security
wrangler secret put HMAC_SECRET     # Generate: openssl rand -hex 32
wrangler secret put JWT_SECRET      # Generate: openssl rand -hex 32
```

### 10A.3 Environment Variables (wrangler.toml)
```toml
[env.production.vars]
NODE_ENV = "production"
LOG_LEVEL = "warn"
STRIPE_PUBLISHABLE_KEY = "pk_live_..."  # Safe to expose
RESEND_FROM_EMAIL = "cosmic@astropal.com"
RESEND_FROM_NAME = "Astropal"
```

### 10A.4 External Service Configuration Requirements

**Stripe Setup:**
1. Create products for each tier (Free trial, Basic $7.99, Pro $14.99)
2. Configure webhook endpoint: `https://api.astropal.com/stripe/webhook`
3. Enable webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Test webhooks with Stripe CLI during development

**Resend Email Setup:**
1. Verify domain ownership (astropal.com)
2. Configure SPF record: `v=spf1 include:spf.resend.com ~all`
3. Add DKIM records provided by Resend
4. Configure DMARC policy for reputation
5. Test deliverability to major providers (Gmail, Outlook, Yahoo)

**Domain Configuration:**
1. Purchase domain (astropal.com)
2. Point to Cloudflare nameservers
3. Configure DNS records:
   - `A` record: `@` → Cloudflare Pages IP
   - `CNAME` record: `api` → Cloudflare Workers custom domain
   - `CNAME` record: `www` → `@`

### 10A.5 Development vs Production Separation
| Environment | API Endpoints | Database | Email Domain |
|-------------|---------------|----------|--------------|
| **Development** | x.ai API test keys | D1 shadow DB | resend test mode |
| **Production** | x.ai API production keys | D1 production DB | astropal.com domain |

### 10A.6 Backup & Recovery Requirements
**Critical Data Backups:**
- D1 database automatic backups (Cloudflare provides)
- KV namespace exports (weekly manual backup to R2)
- Environment secrets backup (secure offline storage)
- MJML templates versioned in R2 with lifecycle policies

**Disaster Recovery:**
- Document all external service configurations
- Maintain infrastructure-as-code for rapid redeploy
- Test recovery procedures quarterly
- Monitor external service status pages for outages

### 10A.7 Pre-Launch Testing Checklist
- [ ] All API keys functional in production environment
- [ ] Email delivery working from custom domain
- [ ] Stripe webhooks receiving events correctly
- [ ] DNS propagation complete for all subdomains
- [ ] SSL certificates active and auto-renewing
- [ ] Content generation pipeline end-to-end test
- [ ] Signup → trial → payment → cancellation flow verified

---

## 10B  Testing Strategy & Quality Assurance
Comprehensive testing framework ensuring production-grade reliability and performance across all system components.

### 10B.1 Unit Testing (Vitest + TypeScript)
**Coverage Target: >90% for critical paths**

```typescript
// Example test structure
describe('Content Generation Pipeline', () => {
  test('generates valid newsletter JSON for all tiers', async () => {
    const ephemerisData = mockEphemerisData();
    const user = mockUser({ tier: 'basic', perspective: 'calm' });
    
    const content = await generateNewsletterContent(user, ephemerisData);
    
    expect(content).toMatchSchema(NewsletterSchema);
    expect(content.sections).toHaveLength.greaterThan(0);
    expect(content.subject).toBeTruthy();
  });
  
  test('falls back to generic content on LLM failure', async () => {
    mockGrokAPI.mockRejectedValue(new Error('API timeout'));
    
    const content = await generateNewsletterContent(mockUser(), mockEphemerisData());
    
    expect(content.fallback).toBe(true);
    expect(content.sections).toBeDefined();
  });
});
```

**Critical Test Categories:**
- Email token generation and validation
- Content schema validation and fallbacks  
- API rate limiting and error handling
- Database operations and migrations
- Perspective and focus preference application

### 10B.2 Integration Testing (Playwright)
**End-to-End User Journeys:**

```typescript
test('complete signup to newsletter delivery flow', async ({ page }) => {
  // 1. Landing page signup
  await page.goto('/');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="birth-date"]', '1990-01-01');
  await page.selectOption('[data-testid="perspective"]', 'calm');
  await page.click('[data-testid="signup-button"]');
  
  // 2. Email verification (mock)
  const user = await db.query.users.findFirst({
    where: eq(users.email, 'test@example.com')
  });
  expect(user).toBeTruthy();
  
  // 3. Trigger content generation
  await triggerContentGeneration();
  
  // 4. Verify email sent via Resend mock
  expect(mockResend.send).toHaveBeenCalledWith({
    to: 'test@example.com',
    subject: expect.stringContaining('Cosmic'),
    html: expect.stringContaining('calm')
  });
});
```

### 10B.3 Load Testing (k6)
**Performance Benchmarks:**

```javascript
// Content generation load test
export default function() {
  const payload = {
    userId: `user-${Math.random()}`,
    tier: 'basic',
    perspective: 'calm'
  };
  
  const response = http.post('https://api.astropal.com/internal/generate', 
    JSON.stringify(payload), 
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'generation completes': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 5000,
    'valid content returned': (r) => JSON.parse(r.body).sections.length > 0
  });
}

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 1000 }, // Peak load
    { duration: '2m', target: 0 },    // Ramp down
  ],
};
```

### 10B.4 Security Testing
**Automated Security Scans:**
- OWASP ZAP integration in CI pipeline
- Dependency vulnerability scanning (npm audit)
- Secret detection (GitLeaks)
- API endpoint security testing

**Manual Security Reviews:**
- Token-based email controls penetration testing
- Rate limiting effectiveness verification  
- Input validation and SQL injection prevention
- GDPR compliance audit

### 10B.5 Content Quality Testing
**AI Content Validation Pipeline:**

```typescript
const contentQualityTests = {
  sentiment: (content) => {
    // Ensure positive/neutral sentiment (>0.1 score)
    const sentiment = analyzeSentiment(content.sections.map(s => s.text).join(' '));
    return sentiment.score > 0.1;
  },
  
  personalization: (content, user) => {
    // Verify perspective and focus integration
    const text = content.sections.map(s => s.text).join(' ').toLowerCase();
    const perspectiveKeywords = PERSPECTIVE_KEYWORDS[user.perspective];
    return perspectiveKeywords.some(keyword => text.includes(keyword));
  },
  
  accuracy: (content, ephemerisData) => {
    // Check astronomical data accuracy
    const mentionedPlanets = extractPlanetaryMentions(content);
    return mentionedPlanets.every(planet => 
      validatePlanetaryPosition(planet, ephemerisData)
    );
  }
};
```

### 10B.6 Email Deliverability Testing
**Multi-Provider Testing:**
- Gmail, Outlook, Yahoo, Apple Mail rendering
- Spam score validation (SpamAssassin)
- MJML compilation accuracy across email clients
- Mobile responsiveness verification

**Deliverability Monitoring:**
- Open rate tracking by email provider
- Bounce rate analysis and list hygiene
- Reputation monitoring for domain and IPs
- Feedback loop processing for major ISPs

### 10B.7 Monitoring & Alerting Tests
**Operational Readiness:**
- Synthetic transaction monitoring (Pingdom/DataDog)
- Error rate threshold alerting
- Performance degradation detection
- External service outage simulation

### 10B.8 Database Migration Testing
**Schema Evolution Safety:**
```sql
-- Migration test framework
BEGIN TRANSACTION;

-- 1. Backup current schema
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. Apply migration
ALTER TABLE users ADD COLUMN new_field TEXT;

-- 3. Validate data integrity
SELECT COUNT(*) FROM users = SELECT COUNT(*) FROM users_backup;

-- 4. Test application compatibility
-- Run integration tests against new schema

-- 5. Rollback capability verification
ROLLBACK; -- Ensure clean rollback possible
```

---

## 11  Security & Compliance
* TLS 1.3 enforced by Cloudflare.
* HMAC-signed internal calls (`X-APIsig` rotating secret).
* Rate limiting: 100 req/min/IP via CF WAF; signup 1/email/24 h, 5 IP/h.
* Input validation with Zod + sanitizer.
* GDPR endpoints: `/api/delete`, `/api/export` (JSON). Auto-purge inactive >24 mo.
* Secrets stored in **Workers Secrets**; no plaintext logs.

---

## 11A  GDPR & Legal Compliance Framework
Comprehensive privacy and legal compliance ensuring global regulatory adherence.

### 11A.1 GDPR Implementation
**Required API Endpoints:**
```typescript
// GET /api/gdpr/export - User data export
export const exportUserData = async (userId: string, env: Env) => {
  const userData = await db.prepare(`
    SELECT email, birth_date, birth_location, birth_time, timezone, 
           perspective, focus_preferences, tier, created_at, last_login
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  const subscriptionData = await db.prepare(`
    SELECT status, current_period_end, created_at 
    FROM subscriptions WHERE user_id = ?
  `).bind(userId).all();
  
  const emailLogs = await db.prepare(`
    SELECT template, sent_at, status, open_at, click_at
    FROM email_logs WHERE user_id = ? 
    ORDER BY sent_at DESC LIMIT 100
  `).bind(userId).all();
  
  const exportData = {
    personal_data: userData,
    subscription_history: subscriptionData,
    email_engagement: emailLogs,
    export_timestamp: new Date().toISOString(),
    retention_period: "24 months from last activity"
  };
  
  logger.info('GDPR data export generated', { 
    userId, 
    dataTypes: Object.keys(exportData),
    component: 'gdpr-compliance'
  });
  
  return exportData;
};

// DELETE /api/gdpr/delete - Complete data deletion
export const deleteUserData = async (userId: string, env: Env) => {
  // Cascade delete all related data
  const tables = ['email_logs', 'email_engagement', 'perspective_changes', 
                  'subscription_tokens', 'referrals', 'subscriptions', 'users'];
  
  for (const table of tables) {
    await db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId).run();
  }
  
  // Remove from KV caches
  const kvKeys = await env.KV_CONTENT.list({ prefix: `content:${userId}:` });
  for (const key of kvKeys.keys) {
    await env.KV_CONTENT.delete(key.name);
  }
  
  // Cancel Stripe subscription
  if (stripeCustomerId) {
    await stripe.customers.del(stripeCustomerId);
  }
  
  logger.info('GDPR data deletion completed', { 
    userId, 
    deletedTables: tables.length,
    component: 'gdpr-compliance'
  });
};
```

**Email Footer Compliance:**
```mjml
<!-- Required in ALL email templates -->
<mj-section>
  <mj-column>
    <mj-text font-size="11px" color="#666" align="center">
      <p>
        <a href="{{unsubscribeUrl}}">Unsubscribe</a> | 
        <a href="{{preferencesUrl}}">Update Preferences</a> | 
        <a href="{{exportUrl}}">Download My Data</a> | 
        <a href="{{deleteUrl}}">Delete My Account</a>
      </p>
      <p>
        Astropal, Inc. | 123 Cosmic St, San Francisco, CA 94105 | 
        <a href="https://astropal.com/privacy">Privacy Policy</a> | 
        <a href="https://astropal.com/terms">Terms of Service</a>
      </p>
      <p>
        This email was sent to {{email}}. You can update your email preferences 
        or unsubscribe at any time. For support, reply to this email.
      </p>
    </mj-text>
  </mj-column>
</mj-section>
```

### 11A.2 CAN-SPAM Compliance
**Required Header Information:**
- **From Name**: "Astropal" (consistent across all emails)
- **From Address**: `cosmic@astropal.com` (verified domain)
- **Physical Address**: In footer of every email
- **Unsubscribe Link**: One-click, processed within 10 business days
- **Subject Line**: No deceptive content, accurate representation

**List Hygiene:**
```typescript
// Automatic bounce and complaint handling
const handleEmailBounce = async (email: string, bounceType: string) => {
  if (bounceType === 'hard') {
    // Immediately suppress hard bounces
    await db.prepare(`
      UPDATE users SET email_status = 'bounced', last_bounce = ? 
      WHERE email = ?
    `).bind(new Date().toISOString(), email).run();
    
    logger.warn('Hard bounce recorded', { email, component: 'email-compliance' });
  }
};

// Unsubscribe processing (must be <10 business days)
const processUnsubscribe = async (email: string) => {
  await db.prepare(`
    UPDATE users SET email_status = 'unsubscribed', unsubscribed_at = ?
    WHERE email = ?
  `).bind(new Date().toISOString(), email).run();
  
  // Send confirmation email (required by CAN-SPAM)
  await sendUnsubscribeConfirmation(email);
  
  logger.info('Unsubscribe processed', { email, component: 'email-compliance' });
};
```

### 11A.3 WCAG 2.1 AA Accessibility
**Frontend Accessibility Requirements:**
```typescript
// Accessibility testing in CI pipeline
const accessibilityTests = {
  colorContrast: 'Minimum 4.5:1 ratio for normal text, 3:1 for large text',
  keyboardNavigation: 'All interactive elements accessible via keyboard',
  screenReaders: 'Semantic HTML, proper ARIA labels',
  focusIndicators: 'Visible focus states for all interactive elements',
  altText: 'Descriptive alt text for all images',
  headingStructure: 'Logical heading hierarchy (H1 > H2 > H3)',
  formLabels: 'Explicit labels for all form inputs'
};

// Automated accessibility testing
// package.json
{
  "scripts": {
    "test:a11y": "pa11y http://localhost:3000 --threshold 0",
    "test:lighthouse": "lighthouse http://localhost:3000 --chrome-flags='--headless' --only-categories=accessibility"
  }
}
```

**Email Accessibility:**
```mjml
<!-- Accessible email template structure -->
<mjml>
  <mj-head>
    <mj-title>Daily Cosmic Pulse - January 20, 2025</mj-title>
    <mj-attributes>
      <mj-text color="#333" font-size="16px" line-height="1.5" />
    </mj-attributes>
  </mj-head>
  <mj-body>
    <!-- High contrast colors, readable fonts, logical structure -->
    <mj-section>
      <mj-column>
        <mj-text>
          <h1>Your Daily Cosmic Pulse</h1>
          <!-- Content with proper heading hierarchy -->
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

---

## 11B  Cost Management & Budget Controls
Comprehensive cost monitoring and budget management to prevent overruns and optimize spend.

### 11B.1 LLM Token Budget Analysis
**Token Consumption Projections:**

| Tier | Daily Emails | Avg Tokens/Email | Monthly Tokens | Monthly Cost (Grok-3-mini @ $0.50/1M) |
|------|--------------|------------------|----------------|----------------------------------------|
| Free | 1 | 800 | 24,000 | $0.012 |
| Basic | 2 | 1,200 | 72,000 | $0.036 |
| Pro | 3 | 1,800 | 162,000 | $0.081 |

**Scaling Projections:**
```typescript
// Cost calculation with user growth
interface CostProjection {
  users: {
    free: number;
    basic: number;
    pro: number;
  };
  monthlyCosts: {
    llm: number;
    email: number;
    infrastructure: number;
    total: number;
  };
}

const calculateMonthlyCosts = (userCounts: CostProjection['users']): CostProjection['monthlyCosts'] => {
  const tokenCosts = {
    free: userCounts.free * 24000 * 0.0000005, // $0.50/1M tokens
    basic: userCounts.basic * 72000 * 0.0000005,
    pro: userCounts.pro * 162000 * 0.0000008 // Grok-3 for Pro
  };
  
  const emailCosts = {
    free: userCounts.free * 30 * 0.001, // $0.001 per email via Resend
    basic: userCounts.basic * 60 * 0.001,
    pro: userCounts.pro * 90 * 0.001
  };
  
  return {
    llm: tokenCosts.free + tokenCosts.basic + tokenCosts.pro,
    email: emailCosts.free + emailCosts.basic + emailCosts.pro,
    infrastructure: 25, // Fixed CF Workers/D1/KV costs
    total: tokenCosts.free + tokenCosts.basic + tokenCosts.pro + 
           emailCosts.free + emailCosts.basic + emailCosts.pro + 25
  };
};
```

### 11B.2 Budget Alerts & Controls
**Cost Monitoring Implementation:**
```typescript
// Daily cost tracking in KV
const trackDailyCosts = async (env: Env) => {
  const today = new Date().toISOString().split('T')[0];
  const costs = await calculateDailyCosts();
  
  await env.KV_METRICS.put(`daily_cost:${today}`, JSON.stringify(costs));
  
  // Alert if daily costs exceed thresholds
  if (costs.total > 10) { // $10/day = $300/month threshold
    await sendCostAlert('high', costs);
  }
  
  if (costs.total > 25) { // Critical threshold
    await sendCostAlert('critical', costs);
    // Optionally pause non-essential operations
  }
};

// Token usage quotas per tier
const TOKEN_QUOTAS = {
  daily: {
    free: 1000,   // tokens per user per day
    basic: 1500,
    pro: 2000
  },
  monthly: {
    free: 30000,  // total monthly budget per user
    basic: 45000,
    pro: 60000
  }
};

// Quota enforcement
const checkTokenQuota = async (userId: string, tier: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  const usageKey = `token_usage:${userId}:${today}`;
  
  const currentUsage = await env.KV_METRICS.get(usageKey) || '0';
  const dailyQuota = TOKEN_QUOTAS.daily[tier];
  
  if (parseInt(currentUsage) >= dailyQuota) {
    logger.warn('Token quota exceeded', { 
      userId, 
      tier, 
      usage: currentUsage, 
      quota: dailyQuota,
      component: 'cost-control'
    });
    return false;
  }
  
  return true;
};
```

### 11B.3 Fallback Content Strategy
**Cost-Saving Fallbacks:**
```typescript
// Fallback content when quotas exceeded or API unavailable
const FALLBACK_CONTENT = {
  calm: {
    subject: "Your Cosmic Moment",
    preheader: "Take a breath and center yourself",
    sections: [{
      heading: "Today's Gentle Reminder",
      html: "<p>The universe encourages you to move with intention today...</p>",
      text: "The universe encourages you to move with intention today..."
    }]
  },
  knowledge: {
    subject: "Today's Cosmic Wisdom",
    preheader: "Expand your understanding",
    sections: [{
      heading: "Astronomical Insight",
      html: "<p>Today's planetary alignments invite deeper learning...</p>",
      text: "Today's planetary alignments invite deeper learning..."
    }]
  },
  // ... similar for success and evidence perspectives
};

const getFallbackContent = async (user: User): Promise<NewsletterContent> => {
  const template = FALLBACK_CONTENT[user.perspective];
  
  // Personalize with user's focus areas
  const personalizedContent = {
    ...template,
    sections: template.sections.map(section => ({
      ...section,
      html: section.html.replace('{{focus}}', user.focusAreas[0] || 'personal growth'),
      text: section.text.replace('{{focus}}', user.focusAreas[0] || 'personal growth')
    }))
  };
  
  logger.info('Fallback content served', { 
    userId: user.id, 
    perspective: user.perspective,
    reason: 'quota_exceeded',
    component: 'cost-control'
  });
  
  return personalizedContent;
};
```

### 11B.4 Cost Optimization Strategies
**Dynamic Model Selection:**
```typescript
// Choose model based on tier and current costs
const selectLLMModel = (tier: string, currentMonthlyCost: number) => {
  const models = {
    free: 'grok-3-mini',     // Cheapest option
    basic: currentMonthlyCost > 50 ? 'grok-3-mini' : 'grok-3',
    pro: currentMonthlyCost > 200 ? 'grok-3' : 'grok-3-plus'
  };
  
  return models[tier] || 'grok-3-mini';
};

// Batch processing for efficiency
const generateContentBatch = async (users: User[], ephemerisData: any) => {
  const batches = chunk(users, 10); // Process in batches of 10
  
  for (const batch of batches) {
    const promises = batch.map(user => 
      generateContentWithQuotaCheck(user, ephemerisData)
    );
    
    await Promise.allSettled(promises);
    
    // Rate limiting between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

---

## 12  Observability & Logging
Production-grade monitoring and alerting infrastructure following .cursorrules standards for structured logging and comprehensive observability.

### 12.1 Structured Logging Framework
**Central Logger Implementation:**
```typescript
// lib/logger.ts (per .cursorrules requirement)
class Logger {
  constructor() {
    this.levels = ["debug", "info", "warn", "error"];
    this.currentLevel = env.NODE_ENV === 'production' ? "warn" : "debug";
  }
  
  log(level: string, message: string, data: Record<string, any> = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: env.NODE_ENV,
      component: data.component || 'worker',
      traceId: data.traceId || generateTraceId(),
      userId: data.userId,
      requestId: data.requestId,
      ...data
    };
    
    console[level](`[${level.toUpperCase()}] ${logEntry.timestamp}:`, message, data);
    
    // Production external service integration
    if (env.NODE_ENV === 'production') {
      this.sendToExternalService(logEntry);
    }
  }
  
  private async sendToExternalService(logEntry: LogEntry) {
    // Sentry for errors, LogRocket for user sessions
    if (logEntry.level === 'error' && env.SENTRY_DSN) {
      await reportToSentry(logEntry);
    }
  }
}
```

### 12.2 Critical Metrics & KPIs
**Performance Metrics (stored in KV + exported to CF Analytics):**

| Metric | Description | Threshold | Alert Condition |
|--------|-------------|-----------|-----------------|
| `content_gen_latency` | LLM API response time | <5s P95 | >7s for 5 consecutive requests |
| `grok_cost_usd` | Daily AI generation cost | <$50/day | >$75/day |
| `email_send_latency` | Resend API response time | <2s P95 | >5s for 3 consecutive requests |
| `email_delivery_rate` | Successful delivery % | >98% | <95% over 1 hour |
| `user_signup_rate` | New signups per hour | Variable | <50% of 7-day average |
| `subscription_conversion` | Trial to paid % | >20% | <15% over 24 hours |
| `error_rate` | 5XX responses % | <1% | >5% over 15 minutes |

### 12.3 Application Performance Monitoring
**Worker Instrumentation:**
```typescript
// Request tracing wrapper
export const withTracing = (handler: Handler): Handler => {
  return async (request, env, ctx) => {
    const traceId = generateTraceId();
    const startTime = Date.now();
    
    try {
      logger.info('Request started', {
        method: request.method,
        url: request.url,
        traceId,
        component: 'api-gateway'
      });
      
      const response = await handler(request, env, ctx);
      
      logger.info('Request completed', {
        status: response.status,
        duration: Date.now() - startTime,
        traceId,
        component: 'api-gateway'
      });
      
      return response;
    } catch (error) {
      logger.error('Request failed', {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
        traceId,
        component: 'api-gateway'
      });
      throw error;
    }
  };
};
```

### 12.4 Content Generation Monitoring
**AI Pipeline Observability:**
```typescript
// Content generation telemetry
export const generateContentWithTelemetry = async (user: User, ephemeris: any) => {
  const genStartTime = Date.now();
  const generationId = generateId();
  
  logger.info('Content generation started', {
    userId: user.id,
    tier: user.tier,
    perspective: user.perspective,
    generationId,
    component: 'content-generator'
  });
  
  try {
    const content = await callGrokAPI(user, ephemeris);
    const duration = Date.now() - genStartTime;
    
    // Store metrics in KV for analytics
    await storeMetric('content_gen_latency', duration, {
      tier: user.tier,
      perspective: user.perspective,
      model: 'grok-3-mini'
    });
    
    logger.info('Content generation completed', {
      userId: user.id,
      duration,
      contentLength: JSON.stringify(content).length,
      generationId,
      component: 'content-generator'
    });
    
    return content;
  } catch (error) {
    logger.error('Content generation failed', {
      userId: user.id,
      error: error.message,
      duration: Date.now() - genStartTime,
      generationId,
      component: 'content-generator'
    });
    
    // Fallback to cached content
    return await getFallbackContent(user);
  }
};
```

### 12.5 Error Boundary & Recovery
**Worker Error Handling:**
```typescript
// Global error boundary for Workers
export class WorkerErrorBoundary {
  static async handleError(error: Error, context: any) {
    const errorId = generateId();
    
    logger.error('Worker error boundary triggered', {
      errorId,
      error: error.message,
      stack: error.stack,
      context,
      component: 'error-boundary'
    });
    
    // Increment error rate metric
    await incrementMetric('worker_errors', 1, {
      workerName: context.workerName,
      errorType: error.constructor.name
    });
    
    // Critical error alerting
    if (this.isCriticalError(error)) {
      await this.sendCriticalAlert(errorId, error, context);
    }
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        traceId: errorId,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 12.6 External Service Health Monitoring
**Service Dependency Tracking:**
```typescript
// Monitor external service health
const serviceHealthCheck = {
  async checkGrokAPI() {
    const start = Date.now();
    try {
      await fetch('https://api.x.ai/health', { timeout: 5000 });
      await storeMetric('grok_api_health', 1, { status: 'healthy' });
    } catch (error) {
      await storeMetric('grok_api_health', 0, { status: 'unhealthy' });
      logger.warn('Grok API health check failed', { error: error.message });
    }
  },
  
  async checkResend() {
    // Similar health checks for Resend, Stripe, etc.
  }
};
```

### 12.7 Real-Time Alerting Configuration
**Alert Rules (Slack/Email notifications):**
```yaml
# alerting.yml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5% for 15m"
    severity: "critical"
    channels: ["#alerts", "engineering@astropal.com"]
    
  - name: "Content Generation Failures"
    condition: "content_gen_failure_rate > 10% for 5m"
    severity: "high"
    channels: ["#content-alerts"]
    
  - name: "Email Delivery Issues"
    condition: "email_delivery_rate < 95% for 1h"
    severity: "medium"
    channels: ["#operations"]
    
  - name: "Cost Overrun"
    condition: "daily_grok_cost > $75"
    severity: "medium"
    channels: ["#billing-alerts"]
```

### 12.8 Performance Dashboards
**Grafana Dashboard Sections:**
1. **System Health**: Error rates, response times, uptime
2. **Content Pipeline**: Generation latency, AI costs, success rates
3. **User Metrics**: Signups, conversions, engagement rates
4. **Email Performance**: Delivery rates, open rates, bounce rates
5. **Infrastructure**: Worker CPU/memory, D1 query performance, KV hit rates

### 12.9 Log Retention & Analytics
**Data Management:**
- **Real-time logs**: Console → CF Logs → 24 hours retention
- **Structured logs**: R2 storage → 90 days retention  
- **Metrics**: KV → 7 days, CF Analytics → 6 months
- **Critical events**: Long-term storage in D1 → 2 years (GDPR)

---

## 12A  Incident Response & Alert Playbooks
Production-grade incident management with clear escalation procedures and response protocols.

### 12A.1 Alert Severity Levels
| Severity | Response Time | Escalation | Examples |
|----------|---------------|------------|----------|
| **Critical** | 15 minutes | Immediate page | System down, data loss, security breach |
| **High** | 1 hour | During business hours | High error rate, API degradation |
| **Medium** | 4 hours | Next business day | Performance issues, non-critical failures |
| **Low** | 24 hours | Weekly review | Quota warnings, maintenance notifications |

### 12A.2 Critical Alert Playbooks
**Alert: System Down (HTTP 5XX > 50%)**
```yaml
# Playbook: system-down
trigger: "HTTP 5XX rate > 50% for 5 minutes"
severity: critical
response_time: 15_minutes

steps:
  1. acknowledge_alert:
     - slack: "#incidents"
     - pagerduty: escalate
  
  2. immediate_assessment:
     - check: "/healthz endpoint status"
     - check: "Cloudflare Workers dashboard"
     - check: "External service status pages"
  
  3. mitigation:
     - rollback: "Deploy previous version if recent deployment"
     - failover: "Route traffic to backup systems"
     - communicate: "Status page update"
  
  4. investigation:
     - gather: "Error logs from last 30 minutes"
     - analyze: "Recent deployments and config changes"
     - identify: "Root cause"
  
  5. resolution:
     - implement: "Permanent fix"
     - verify: "System functionality restored"
     - document: "Post-incident review"

escalation:
  - 15m: "Page engineering lead"
  - 30m: "Page CTO"
  - 60m: "Notify CEO and board"
```

**Alert: Content Generation Failures**
```yaml
# Playbook: content-gen-failure
trigger: "Content generation failure rate > 25% for 10 minutes"
severity: high
response_time: 1_hour

steps:
  1. immediate_check:
     - verify: "Grok API status"
     - verify: "OpenAI API status"
     - check: "Token quotas and budgets"
  
  2. fallback_activation:
     - enable: "Fallback content for affected users"
     - notify: "Users about service degradation"
     - monitor: "Fallback content delivery"
  
  3. service_recovery:
     - attempt: "API key rotation if authentication issue"
     - switch: "To backup LLM provider"
     - adjust: "Rate limits and retry logic"
  
  4. user_communication:
     - send: "Apology email to affected users"
     - offer: "Service credits if applicable"
     - update: "Status page with ETA"
```

**Alert: High Cost Overrun**
```yaml
# Playbook: cost-overrun
trigger: "Daily costs > $50 or 200% of budget"
severity: medium
response_time: 2_hours

steps:
  1. cost_analysis:
     - identify: "Top cost drivers"
     - check: "Unusual usage patterns"
     - verify: "Legitimate vs abuse traffic"
  
  2. immediate_controls:
     - enable: "Emergency rate limiting"
     - activate: "Cost-saving fallbacks"
     - pause: "Non-essential operations"
  
  3. optimization:
     - implement: "Dynamic model selection"
     - adjust: "Token quotas per tier"
     - optimize: "Batch processing efficiency"
```

### 12A.3 External Service Outage Responses
**Grok API Outage:**
```typescript
// Automatic failover with circuit breaker
class GrokCircuitBreaker {
  private failureCount = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async callGrokAPI(prompt: string): Promise<any> {
    if (this.state === 'open') {
      // Circuit open - use fallback
      logger.warn('Grok circuit breaker open, using fallback');
      return this.useOpenAIFallback(prompt);
    }
    
    try {
      const response = await fetch('https://api.x.ai/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROK_API_KEY}` },
        body: JSON.stringify(prompt)
      });
      
      if (!response.ok) throw new Error(`Grok API error: ${response.status}`);
      
      // Success - reset circuit breaker
      this.failureCount = 0;
      this.state = 'closed';
      
      return response.json();
    } catch (error) {
      this.failureCount++;
      this.lastFailure = Date.now();
      
      // Open circuit after 3 failures
      if (this.failureCount >= 3) {
        this.state = 'open';
        logger.error('Grok circuit breaker opened', { 
          failures: this.failureCount,
          component: 'circuit-breaker'
        });
      }
      
      return this.useOpenAIFallback(prompt);
    }
  }
  
  private async useOpenAIFallback(prompt: string) {
    logger.info('Falling back to OpenAI', { component: 'failover' });
    // OpenAI API call implementation
  }
}
```

**Resend Email Outage:**
```typescript
// Email queue with retry and alternative providers
class EmailService {
  private providers = ['resend', 'sendgrid', 'mailgun'];
  private currentProvider = 0;
  
  async sendEmail(emailData: EmailRequest): Promise<boolean> {
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.providers[this.currentProvider];
      
      try {
        await this.sendViaProvider(provider, emailData);
        logger.info('Email sent successfully', { 
          provider, 
          attempt: attempt + 1,
          component: 'email-service'
        });
        return true;
      } catch (error) {
        logger.warn('Email provider failed', { 
          provider, 
          error: error.message,
          component: 'email-service'
        });
        
        // Try next provider
        this.currentProvider = (this.currentProvider + 1) % this.providers.length;
      }
    }
    
    // All providers failed - queue for retry
    await this.queueForRetry(emailData);
    logger.error('All email providers failed', { 
      emailId: emailData.id,
      component: 'email-service'
    });
    
    return false;
  }
  
  private async queueForRetry(emailData: EmailRequest) {
    const retryTime = Date.now() + (15 * 60 * 1000); // 15 minutes
    await env.KV_EMAIL_QUEUE.put(
      `retry:${emailData.id}:${retryTime}`,
      JSON.stringify(emailData),
      { expirationTtl: 24 * 60 * 60 } // 24 hours max retry
    );
  }
}
```

### 12A.4 Business Continuity Planning
**Data Loss Prevention:**
- **Automated backups**: Hourly D1 exports to R2
- **KV replication**: Multi-region namespace setup
- **Code repository**: All infrastructure as code in Git
- **Secrets backup**: Encrypted offline storage of critical secrets

**Service Degradation Levels:**
1. **Level 1**: Use fallback content, maintain email delivery
2. **Level 2**: Reduce email frequency, batch processing only
3. **Level 3**: Emergency mode - essential emails only
4. **Level 4**: Complete shutdown with status page notifications

**Communication Templates:**
```typescript
const incidentTemplates = {
  serviceDown: {
    subject: "Astropal Service Temporarily Unavailable",
    message: "We're experiencing technical difficulties and are working to restore service. Your data is safe and secure. Updates: status.astropal.com"
  },
  degraded: {
    subject: "Astropal Service Degradation Notice",
    message: "You may experience delays in email delivery. Our team is investigating and will have service restored shortly."
  },
  resolved: {
    subject: "Astropal Service Restored",
    message: "All systems are now operating normally. Thank you for your patience during this incident. We've implemented additional safeguards to prevent future occurrences."
  }
};
```

### 12A.5 Post-Incident Review Process
**Required Documentation:**
1. **Timeline**: Detailed chronology of events
2. **Root Cause**: Technical and process failures identified
3. **Impact Assessment**: Users affected, revenue impact, data integrity
4. **Response Evaluation**: What worked, what didn't
5. **Action Items**: Specific improvements with owners and deadlines

**Review Meeting (within 48 hours):**
- **Attendees**: Engineering team, product owner, customer success
- **Duration**: 60 minutes maximum
- **Output**: Actionable improvement plan
- **Follow-up**: 30-day implementation review

---

## 13  CI/CD & Deployment
* GitHub → GitHub Actions → `wrangler deploy --env production` (scripted).  
* Branch previews deploy to CF Pages `preview` env.  
* Schema migrations run via Drizzle in `wrangler d1 migrations apply` step.
* Automatic rollback on failed health-check (status endpoint).

---

## 14  Development Phases & TODO Lists

### Phase 0 – Repo Bootstrap (Day 0-2)
- [ ] Create mono-repo `apps/web`, `packages/backend` structure.  
- [ ] Add Wrangler, TypeScript, ESLint, Prettier configs.  
- [ ] Implement central logger utility per .cursorrules.  
- [ ] Setup CI with test, lint, deploy jobs.

### Phase 1 – Data Layer & Auth (Day 3-6)
- [ ] Define D1 schema (tables above) + Drizzle migrations.  
- [ ] Implement `/register` + `/verify` endpoints with rate limiting & email magic-link (Resend).  
- [ ] Add signup_attempts logging.  
- [ ] Unit tests (Vitest) for validation utilities.

### Phase 2 – Scheduler & External Data (Day 7-10)
- [ ] Create Cron Worker `scheduler` with 5 triggers.  
- [ ] Implement ephemeris fetch/storage with retry/backoff.  
- [ ] Add news cache fetch (for Pro).  
- [ ] Metric logging for fetch latency.

### Phase 3 – Core Content Generator (Day 11-15)
- [ ] Build Prompt Composer reading `project.config`.  
- [ ] Integrate Grok client with schema function calling.  
- [ ] Implement fallback to GPT-4o.  
- [ ] Add validator, profanity filter, duplication check.  
- [ ] Store JSON & rendered MJML in KV.

### Phase 4 – Email Worker & Templates (Day 16-19)
- [ ] Upload MJML templates to R2 (`templates/`).  
- [ ] Implement renderer with Mustache + mjml2html.  
- [ ] Create Email Worker calling Resend; schedule secondary emails.  
- [ ] Engagement webhooks update `email_logs`.

### Phase 5 – Billing & Tiers (Day 20-23)
- [ ] Stripe webhook Worker: checkout/session, subscription status updates.  
- [ ] Auto-downgrade to Free on `past_due`.  
- [ ] Add trial expiry logic in daily scheduler.

### Phase 6 – Localization & Perspective (Day 24-26)
- [ ] Build `i18n` loader from KV.  
- [ ] Ensure Prompt Composer & Renderer apply locale tokens.  
- [ ] Add perspective weighting in prompts.  
- [ ] Update `/preferences` endpoint.

### Phase 7 – Observability & Hardening (Day 27-28)
- [ ] Integrate Sentry (prod only) + LogRocket.  
- [ ] Add health-check Worker route.  
- [ ] Implement GDPR delete/export endpoints.  
- [ ] Load tests with k6 (10 k concurrent generation).

### Phase 8 – Beta Launch & Feedback Loop (Day 29-30)
- [ ] Seed 4 test users (one per perspective: calm, knowledge, success, evidence); validate daily pipeline end-to-end.  
- [ ] Monitor metrics; optimise token & KV costs.  
- [ ] Prepare migration guide for future newsletter projects (update `project.config`).

---

## 14A  Test User Seed Data Specification
Exact format for 4 test users covering all perspectives for comprehensive beta testing.

### 14A.1 Test User Specifications
**Production Test Users (Hardcoded):**
```typescript
const TEST_USERS = [
  {
    email: "timvvoss@icloud.com",
    perspective: "calm",
    focusAreas: ["wellness", "spiritual"]
  },
  {
    email: "tim@synthetic.jp", 
    perspective: "knowledge",
    focusAreas: ["evidence-based", "career"]
  },
  {
    email: "tim@voss-intelligence.com",
    perspective: "success", 
    focusAreas: ["career", "social"]
  },
  {
    email: "tim@reshoringhq.com",
    perspective: "evidence",
    focusAreas: ["evidence-based", "wellness"]
  }
];
```

**Note:** Birth date, location, time, and timezone will be provided during actual testing via the registration form. These emails are pre-authorized for beta testing.

### 14A.2 Seed Data Loading Script
```typescript
// scripts/seedTestUsers.ts - Only used for initial beta testing
export const preAuthorizedTestEmails = [
  "timvvoss@icloud.com",
  "tim@synthetic.jp",
  "tim@voss-intelligence.com",
  "tim@reshoringhq.com"
];

// Test data will be collected via registration form during actual testing
// This script only validates that test emails are pre-authorized
export const validateTestUser = (email: string): boolean => {
  return preAuthorizedTestEmails.includes(email.toLowerCase());
};

// Production note: Remove test email validation after beta phase
export const isTestingPhase = (): boolean => {
  return env.DEPLOYMENT_PHASE === 'beta';
};
```

### 14A.3 Test User Validation
**Automated Verification:**
```typescript
// tests/seedValidation.test.ts
describe('Test User Seed Data', () => {
  test('all 4 perspectives represented', () => {
    const perspectives = testUsers.map(u => u.perspective);
    expect(perspectives).toContain('calm');
    expect(perspectives).toContain('knowledge');
    expect(perspectives).toContain('success');
    expect(perspectives).toContain('evidence');
  });
  
  test('all users have valid birth data for chart calculation', () => {
    testUsers.forEach(user => {
      expect(new Date(user.birthDate)).toBeInstanceOf(Date);
      expect(user.birthLocation).toMatch(/^.+, .+$/); // "City, Country" format
      expect(user.birthTime).toMatch(/^\d{2}:\d{2}$/); // "HH:MM" format
    });
  });
  
  test('focus areas are valid and diverse', () => {
    const allFocuses = testUsers.flatMap(u => u.focusAreas);
    const validFocuses = ['relationships', 'career', 'wellness', 'social', 'spiritual', 'evidence-based'];
    
    allFocuses.forEach(focus => {
      expect(validFocuses).toContain(focus);
    });
    
    // Ensure diversity - at least 4 different focus areas used
    const uniqueFocuses = [...new Set(allFocuses)];
    expect(uniqueFocuses.length).toBeGreaterThanOrEqual(4);
  });
});
```

---

## 14B  Security Policies & Implementation Details
Comprehensive security framework following OWASP best practices and .cursorrules compliance requirements.

### 14B.1 Auth Token Security Policy
**Token Configuration:**
```typescript
interface AuthTokenConfig {
  tokenLength: 64; // 64 character hex string
  hashAlgorithm: 'SHA-256';
  storageFormat: 'hashed'; // Only store hashed version in DB
}

// Auth token generation for user account access
const generateAuthToken = (): string => {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Store hashed version in database
const hashAuthToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
```

**Token Security Measures:**
```typescript
// Validate auth token from email link
const validateAuthToken = async (token: string, db: D1Database): Promise<User | null> => {
  const hashedToken = await hashAuthToken(token);
  
  const user = await db.prepare(`
    SELECT * FROM users WHERE auth_token = ?
  `).bind(hashedToken).first();
  
  if (user) {
    // Update last activity
    await db.prepare(`
      UPDATE users SET last_activity = ? WHERE id = ?
    `).bind(new Date().toISOString(), user.id).run();
    
    logger.info('Auth token validated', { 
      userId: user.id,
      component: 'auth-security'
    });
  }
  
  return user;
};
```

### 14B.2 HMAC Secret Rotation Policy
**Rotation Schedule:** Every 90 days (quarterly) with 30-day overlap for email tokens

```typescript
interface SecretRotationConfig {
  currentSecretVersion: number;
  rotationIntervalDays: 90;
  overlapDays: 30;
  secrets: {
    [version: number]: {
      secret: string;
      createdAt: string;
      expiresAt: string;
      status: 'active' | 'pending' | 'deprecated';
    };
  };
}

// Multi-version secret validation for gradual rotation
const validateHMAC = (payload: string, signature: string, env: Env): boolean => {
  const rotationConfig = JSON.parse(env.SECRET_ROTATION_CONFIG);
  
  // Try current and previous versions during overlap period
  for (const version in rotationConfig.secrets) {
    const secretData = rotationConfig.secrets[version];
    if (secretData.status === 'deprecated') continue;
    
    const expectedSignature = hmacSign(payload, secretData.secret);
    if (expectedSignature === signature) {
      logger.info('HMAC validated', { secretVersion: version, component: 'security' });
      return true;
    }
  }
  
  logger.warn('HMAC validation failed', { signature: signature.slice(0, 8), component: 'security' });
  return false;
};
```

**Automated Rotation Script:**
```bash
#!/bin/bash
# scripts/rotateSecrets.sh - Quarterly secret rotation

# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)
NEW_VERSION=$(($(date +%Y) * 100 + $(date +%m)))

# Add to Worker secrets with version
wrangler secret put "HMAC_SECRET_V${NEW_VERSION}" <<< "$NEW_SECRET"

# Update rotation configuration
cat > rotation_config.json << EOF
{
  "currentSecretVersion": ${NEW_VERSION},
  "rotationIntervalDays": 90,
  "overlapDays": 30,
  "secrets": {
    "${NEW_VERSION}": {
      "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "expiresAt": "$(date -u -d '+90 days' +%Y-%m-%dT%H:%M:%SZ)",
      "status": "active"
    }
  }
}
EOF

wrangler secret put SECRET_ROTATION_CONFIG < rotation_config.json

echo "✅ Secret rotation completed: version ${NEW_VERSION}"
echo "⚠️  Update all email tokens to use new secret within 30 days"
```

### 14B.3 API Security Headers
```typescript
// Security headers for all API responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Apply to all responses
const addSecurityHeaders = (response: Response): Response => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};
```

### 14B.4 Input Validation & Sanitization
```typescript
// Comprehensive input validation using Zod
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email().max(320), // RFC 5321 limit
  password: z.string().min(8).max(128),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthLocation: z.string().min(3).max(100).regex(/^.+, .+$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().min(1).max(50),
  perspective: z.enum(['calm', 'knowledge', 'success', 'evidence']),
  focusAreas: z.array(z.string()).min(1).max(3),
  referralCode: z.string().max(20).optional()
});

// SQL injection prevention with parameterized queries
const createUser = async (userData: RegisterRequest, db: D1Database) => {
  const userId = generateId();
  const authToken = generateAuthToken();
  const hashedToken = await hashAuthToken(authToken);
  
  // All queries use parameterized statements - never string concatenation
  const result = await db.prepare(`
    INSERT INTO users (id, email, auth_token, birth_date, birth_location, birth_time,
                      timezone, locale, perspective, tier, focus_preferences, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId,
    userData.email,
    hashedToken, // Store only hashed version
    userData.birthDate,
    userData.birthLocation,
    userData.birthTime || '12:00',
    userData.timezone,
    userData.locale,
    userData.perspective,
    'trial',
    JSON.stringify(userData.focusAreas),
    new Date().toISOString()
  ).run();
  
  // Return user data with plaintext token for initial email
  return { result, authToken };
};
```

---

## 15  Assumptions & Open Questions
1. Resend supports delayed send API for scheduling; else fallback to cron-based send.  
2. Swiss Ephemeris API has 99 % uptime; monitor to decide paid backup.  
3. Perspectives list fixed (`calm`,`knowledge`,`success`,`evidence`) – confirm naming.  
4. Free plan email frequency strictly 1/day; confirm weekly/monthly cron windows fit 5-cron limit.

---

## 16  Definition of Done
* All phases completed with green CI.  
* Structured logs & metrics visible in Grafana.  
* Daily content pipeline successfully delivers to 4 beta users (one per perspective) for 7 days.  
* `project.config` swap verified for second demo brand.  
* Email control buttons functional (upgrade, cancel, unsubscribe, perspective change).  
* External service integrations tested and documented.  
* No P1 bugs; performance & cost within targets.

---

_End of Backend_PRD.md_ 