import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from '@/lib/logger';
import { createDatabaseClient } from '@/db/client';
import { RateLimiter } from '@/services/rateLimiter';
import { createEmailService } from '@/services/emailService';
import { createUserService } from '@/services/userService';

// Worker environment interface
export interface Env {
  // Database
  DB: D1Database;
  
  // KV Stores
  KV_ASTRO: KVNamespace;
  KV_CONTENT: KVNamespace;
  KV_I18N: KVNamespace;
  KV_METRICS: KVNamespace;
  
  // R2 Storage
  R2_TEMPLATES: R2Bucket;
  R2_LOGS: R2Bucket;
  
  // Secrets (set via wrangler secret put)
  GROK_API_KEY: string;
  OPENAI_API_KEY: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: string;
  STRIPE_WEBHOOK_SECRET_PAYMENT: string;
  STRIPE_BASIC_PAYMENT_LINK: string;
  STRIPE_PRO_PAYMENT_LINK: string;
  NEWSAPI_KEY: string;
  HMAC_SECRET: string;
  JWT_SECRET: string;
  
  // Environment variables
  NODE_ENV: string;
  LOG_LEVEL: string;
  FRONTEND_DOMAIN: string;
  
  [key: string]: any; // Index signature for Cloudflare Worker bindings
}

// Hono context types
type Variables = {
  db: any;
  rateLimiter: RateLimiter;
  emailService: any;
  userService: any;
};

// Initialize Hono app with proper typing
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'https://astropal.com', 
    'https://preview.astropal.com',
    'https://astropal.io',
    'https://www.astropal.io',
    'https://preview.astropal.io',
    // Development URLs
    'http://localhost:3000',
    'https://astropal-frontend.pages.dev',
    'https://astropal-web.pages.dev',
    'https://astropal-web-dev.pages.dev'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-APIsig'],
  exposeHeaders: ['X-Total-Count', 'X-Trace-Id'],
  maxAge: 86400, // 24 hours
  credentials: false // Explicit for security
}));

// Health check endpoint
app.get('/healthz', async (c) => {
  const env = c.env;
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV || 'unknown',
    checks: {
      database: await checkD1Connection(env.DB),
      kv: await checkKVConnection(env.KV_ASTRO),
      r2: await checkR2Connection(env.R2_LOGS)
    }
  };
  
  const allHealthy = Object.values(healthData.checks).every(check => check.status === 'healthy');
  
  logger.info('Health check performed', {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks: healthData.checks,
    component: 'health-check'
  });
  
  return c.json(healthData, allHealthy ? 200 : 503);
});

// Health check helper functions
const checkD1Connection = async (db: D1Database) => {
  try {
    await db.prepare('SELECT 1').first();
    return { status: 'healthy' as const, latency: Date.now() };
  } catch (error: any) {
    return { status: 'unhealthy' as const, error: error.message };
  }
};

const checkKVConnection = async (kv: KVNamespace) => {
  try {
    await kv.put('health-check', 'ok', { expirationTtl: 60 });
    await kv.delete('health-check');
    return { status: 'healthy' as const };
  } catch (error: any) {
    return { status: 'unhealthy' as const, error: error.message };
  }
};

const checkR2Connection = async (r2: R2Bucket) => {
  try {
    await r2.put('health-check.txt', 'ok');
    await r2.delete('health-check.txt');
    return { status: 'healthy' as const };
  } catch (error: any) {
    return { status: 'unhealthy' as const, error: error.message };
  }
};

// Request context middleware - inject services
app.use('*', async (c, next) => {
  const env = c.env;
  
  try {
    c.set('db', createDatabaseClient(env.DB));
    c.set('rateLimiter', new RateLimiter(createDatabaseClient(env.DB), env.KV_METRICS));
    c.set('emailService', createEmailService(env.RESEND_API_KEY, createDatabaseClient(env.DB)));
    c.set('userService', 
      createUserService(
        createDatabaseClient(env.DB),
        new RateLimiter(createDatabaseClient(env.DB), env.KV_METRICS),
        createEmailService(env.RESEND_API_KEY, createDatabaseClient(env.DB))
      )
    );
    
    await next();
  } catch (error: any) {
    logger.error('Failed to initialize services', { error: error.message });
    return c.json({ error: 'Service initialization failed' }, 500);
  }
});

// User registration endpoint
app.post('/register', async (c) => {
  try {
    const userService = c.get('userService');
    const body = await c.req.json();
    
    logger.info('Registration attempt', {
      email: body.email,
      perspective: body.perspective,
      component: 'registration'
    });
    
    const result = await userService.registerUser(body);
    
    if (result.success) {
      logger.info('User registered successfully', {
        userId: result.user.id,
        tier: result.user.tier,
        component: 'registration'
      });
      
      return c.json({
        success: true,
        user: result.user,
        traceId: result.traceId || 'unknown'
      });
    } else {
      logger.warn('Registration failed', {
        email: body.email,
        error: result.error,
        component: 'registration'
      });
      
      return c.json({
        success: false,
        error: result.error,
        traceId: result.traceId || 'unknown'
      }, 400);
    }
  } catch (error: any) {
    logger.error('Registration endpoint error', {
      error: error.message,
      stack: error.stack,
      component: 'registration'
    });
    
    return c.json({
      success: false,
      error: 'Registration failed',
      traceId: 'error'
    }, 500);
  }
});

// Token validation endpoint
app.get('/validate-token', async (c) => {
  try {
    const userService = c.get('userService');
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({ success: false, error: 'Token required' }, 400);
    }
    
    const user = await userService.validateAuthToken(token);
    
    if (user) {
      logger.info('Token validated', {
        userId: user.id,
        component: 'auth'
      });
      
      return c.json({
        success: true,
        user,
        traceId: 'validated'
      });
    } else {
      logger.warn('Invalid token', {
        token: token.substring(0, 8),
        component: 'auth'
      });
      
      return c.json({
        success: false,
        error: 'Invalid token',
        traceId: 'invalid'
      }, 401);
    }
  } catch (error: any) {
    logger.error('Token validation error', {
      error: error.message,
      component: 'auth'
    });
    
    return c.json({
      success: false,
      error: 'Validation failed',
      traceId: 'error'
    }, 500);
  }
});

// User preferences update endpoint
app.put('/preferences', async (c) => {
  try {
    const userService = c.get('userService');
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ success: false, error: 'Authorization required' }, 401);
    }
    
    const user = await userService.validateAuthToken(token);
    if (!user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    
    const body = await c.req.json();
    const result = await userService.updateUserPreferences(user.id, body);
    
    if (result.success) {
      logger.info('Preferences updated', {
        userId: user.id,
        changes: Object.keys(body),
        component: 'preferences'
      });
      
      return c.json({
        success: true,
        user: result.user,
        traceId: 'updated'
      });
    } else {
      return c.json({
        success: false,
        error: result.error,
        traceId: 'failed'
      }, 400);
    }
  } catch (error: any) {
    logger.error('Preferences update error', {
      error: error.message,
      component: 'preferences'
    });
    
    return c.json({
      success: false,
      error: 'Update failed',
      traceId: 'error'
    }, 500);
  }
});

// Stripe subscription webhook endpoint
app.post('/stripe/webhook/subscription', async (c) => {
  try {
    const env = c.env as Env;
    const { billingService } = await import('./services/billingService');
    
    const billing = billingService.create({
      DB: env.DB,
      STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION,
      STRIPE_WEBHOOK_SECRET_PAYMENT: env.STRIPE_WEBHOOK_SECRET_PAYMENT,
      STRIPE_BASIC_PAYMENT_LINK: env.STRIPE_BASIC_PAYMENT_LINK,
      STRIPE_PRO_PAYMENT_LINK: env.STRIPE_PRO_PAYMENT_LINK,
      KV_CONTENT: env.KV_CONTENT,
      KV_METRICS: env.KV_METRICS,
      RESEND_API_KEY: env.RESEND_API_KEY
    });
    
    const response = await billing.processWebhook(c.req.raw, 'subscription');
    
    logger.info('Stripe subscription webhook processed', {
      status: response.status,
      component: 'billing-webhook'
    });
    
    return response;
  } catch (error: any) {
    logger.error('Stripe subscription webhook error', {
      error: error.message,
      component: 'billing-webhook'
    });
    
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Stripe payment webhook endpoint
app.post('/stripe/webhook/payment', async (c) => {
  try {
    const env = c.env as Env;
    const { billingService } = await import('./services/billingService');
    
    const billing = billingService.create({
      DB: env.DB,
      STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET_SUBSCRIPTION: env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION,
      STRIPE_WEBHOOK_SECRET_PAYMENT: env.STRIPE_WEBHOOK_SECRET_PAYMENT,
      STRIPE_BASIC_PAYMENT_LINK: env.STRIPE_BASIC_PAYMENT_LINK,
      STRIPE_PRO_PAYMENT_LINK: env.STRIPE_PRO_PAYMENT_LINK,
      KV_CONTENT: env.KV_CONTENT,
      KV_METRICS: env.KV_METRICS,
      RESEND_API_KEY: env.RESEND_API_KEY
    });
    
    const response = await billing.processWebhook(c.req.raw, 'payment');
    
    logger.info('Stripe payment webhook processed', {
      status: response.status,
      component: 'billing-webhook'
    });
    
    return response;
  } catch (error: any) {
    logger.error('Stripe payment webhook error', {
      error: error.message,
      component: 'billing-webhook'
    });
    
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Default export for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },
  
  // Scheduled event handler for cron triggers
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    // Import and run scheduler
    const { handleScheduled } = await import('./workers/scheduler');
    await handleScheduled(event, env);
  }
}; 