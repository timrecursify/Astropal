# Phase 7 - Observability & Production Hardening

**Objective:** Implement comprehensive monitoring, alerting, and security hardening for production-grade reliability.

**Duration:** Immediate after Phase 6
**Dependencies:** All core systems operational
**Output:** Production-ready platform with full observability

---

## Observability Architecture

### Monitoring Stack
```
Application → Structured Logs → R2 Storage → Analytics
     ↓              ↓                ↓
  Metrics    Error Tracking    Alerting → Slack/Email
```

---

## Task Checklist

### 1. Structured Logging Enhancement
- [ ] Finalize logger implementation per .cursorrules
- [ ] Add request correlation IDs
- [ ] Implement log sampling for high-volume events
- [ ] Create log aggregation pipeline
- [ ] Set up log retention policies

### 2. Metrics & KPIs
- [ ] Implement custom metrics collection
- [ ] Create business metrics dashboards
- [ ] Set up performance tracking
- [ ] Build cost monitoring system
- [ ] Add user behavior analytics

### 3. Error Tracking
- [ ] Integrate Sentry for production
- [ ] Configure source maps
- [ ] Set up error grouping rules
- [ ] Create error alerting thresholds
- [ ] Build error recovery workflows

### 4. Health Monitoring
- [ ] Enhance /healthz endpoint
- [ ] Create dependency health checks
- [ ] Implement synthetic monitoring
- [ ] Build status page
- [ ] Add uptime tracking

### 5. Security Hardening
- [ ] Implement rate limiting across all endpoints
- [ ] Add request validation middleware
- [ ] Create security headers middleware
- [ ] Build abuse detection system
- [ ] Set up vulnerability scanning

### 6. GDPR Compliance
- [ ] Implement data export endpoint
- [ ] Create data deletion workflow
- [ ] Build consent tracking
- [ ] Add audit logging
- [ ] Create compliance reports

### 7. Performance Optimization
- [ ] Implement response caching
- [ ] Optimize database queries
- [ ] Add connection pooling
- [ ] Create CDN integration
- [ ] Build performance budgets

---

## Enhanced Logger Implementation

### Production Logger with External Services
```typescript
// lib/logger.ts - Production-ready implementation
export class ProductionLogger {
  private sentry: Sentry.Client | null = null;
  private logBuffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  
  constructor(env: Env) {
    if (env.SENTRY_DSN) {
      this.sentry = new Sentry.Client({ dsn: env.SENTRY_DSN });
    }
    
    // Start batch upload timer
    this.startBatchUpload(env);
  }
  
  log(level: LogLevel, message: string, data: LogData = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: env.NODE_ENV,
      component: data.component || 'unknown',
      traceId: data.traceId || this.getTraceId(),
      userId: data.userId,
      ...data
    };
    
    // Console output for development
    if (env.NODE_ENV !== 'production' || level === 'error') {
      console[level](`[${level.toUpperCase()}]`, message, data);
    }
    
    // Buffer for batch upload
    this.logBuffer.push(entry);
    
    // Send errors to Sentry immediately
    if (level === 'error' && this.sentry) {
      this.sentry.captureException(new Error(message), {
        extra: data,
        tags: {
          component: data.component,
          userId: data.userId
        }
      });
    }
    
    // Critical errors trigger immediate alert
    if (data.critical) {
      this.sendAlert(entry);
    }
  }
  
  private async batchUploadLogs(env: Env) {
    if (this.logBuffer.length === 0) return;
    
    const batch = this.logBuffer.splice(0, 1000); // Max 1000 logs per batch
    const fileName = `logs/${new Date().toISOString()}-${generateId()}.json`;
    
    try {
      await env.R2_LOGS.put(fileName, JSON.stringify(batch), {
        httpMetadata: {
          contentType: 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to upload logs', error);
    }
  }
}
```

---

## Metrics Collection

### Custom Metrics System
```typescript
export class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  
  increment(name: string, value: number = 1, tags: Record<string, string> = {}) {
    const key = this.buildKey(name, tags);
    const metric = this.metrics.get(key) || { name, value: 0, tags };
    metric.value += value;
    this.metrics.set(key, metric);
  }
  
  gauge(name: string, value: number, tags: Record<string, string> = {}) {
    const key = this.buildKey(name, tags);
    this.metrics.set(key, { name, value, tags, type: 'gauge' });
  }
  
  timing(name: string, duration: number, tags: Record<string, string> = {}) {
    this.gauge(`${name}.duration`, duration, tags);
    this.increment(`${name}.count`, 1, tags);
  }
  
  async flush(env: Env) {
    const timestamp = Date.now();
    const metrics = Array.from(this.metrics.values());
    
    // Store in KV for real-time dashboards
    await env.KV_METRICS.put(
      `metrics:${timestamp}`,
      JSON.stringify(metrics),
      { expirationTtl: 86400 } // 24 hour TTL
    );
    
    // Reset metrics
    this.metrics.clear();
  }
}
```

### Key Metrics to Track
```typescript
// Business Metrics
metrics.increment('user.registration', 1, { tier: 'trial' });
metrics.increment('email.sent', 1, { type: 'daily', tier: user.tier });
metrics.gauge('conversion.rate', conversionRate, { period: 'daily' });

// Technical Metrics
metrics.timing('api.request', duration, { endpoint: '/register' });
metrics.gauge('llm.tokens.used', tokenCount, { model: 'grok-3' });
metrics.increment('error.rate', 1, { type: 'validation' });

// Cost Metrics
metrics.gauge('cost.daily.llm', llmCost);
metrics.gauge('cost.daily.email', emailCost);
metrics.gauge('cost.daily.total', totalCost);
```

---

## Health Check Implementation

### Comprehensive Health Endpoint
```typescript
export const healthCheck = async (request: Request, env: Env): Promise<Response> => {
  const checks = {
    database: await checkDatabase(env),
    kv: await checkKV(env),
    r2: await checkR2(env),
    grok: await checkGrokAPI(env),
    resend: await checkResendAPI(env),
    stripe: await checkStripeAPI(env)
  };
  
  const status = Object.values(checks).every(c => c.status === 'healthy') 
    ? 'healthy' 
    : 'degraded';
  
  const response = {
    status,
    timestamp: new Date().toISOString(),
    version: env.APP_VERSION,
    checks,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requestsPerSecond: await getRequestRate(env)
    }
  };
  
  return new Response(JSON.stringify(response), {
    status: status === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## Security Middleware

### Rate Limiting Implementation
```typescript
export const rateLimitMiddleware = async (
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response | null> => {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const endpoint = new URL(request.url).pathname;
  
  const limits = {
    '/api/register': { requests: 5, window: 3600 }, // 5 per hour
    '/api/preferences': { requests: 20, window: 3600 },
    default: { requests: 100, window: 60 } // 100 per minute
  };
  
  const limit = limits[endpoint] || limits.default;
  const key = `rate:${ip}:${endpoint}`;
  
  const current = await env.KV_RATE.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit.requests) {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      count,
      component: 'security'
    });
    
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': limit.window.toString(),
        'X-RateLimit-Limit': limit.requests.toString(),
        'X-RateLimit-Remaining': '0'
      }
    });
  }
  
  await env.KV_RATE.put(key, (count + 1).toString(), {
    expirationTtl: limit.window
  });
  
  return null; // Continue to handler
};
```

---

## GDPR Implementation

### Data Export Endpoint
```typescript
export const exportUserData = async (
  userId: string,
  env: Env
): Promise<Response> => {
  const exportId = generateId();
  
  logger.info('GDPR export requested', {
    userId,
    exportId,
    component: 'gdpr'
  });
  
  // Collect all user data
  const userData = await collectUserData(userId, env);
  
  // Generate export file
  const exportData = {
    exportId,
    timestamp: new Date().toISOString(),
    user: userData.user,
    subscriptions: userData.subscriptions,
    emails: userData.emails,
    preferences: userData.preferences,
    engagement: userData.engagement
  };
  
  // Store in R2 with expiry
  const fileName = `exports/${userId}/${exportId}.json`;
  await env.R2_EXPORTS.put(fileName, JSON.stringify(exportData), {
    customMetadata: {
      userId,
      createdAt: new Date().toISOString()
    }
  });
  
  // Generate signed download URL
  const downloadUrl = await generateSignedUrl(fileName, env);
  
  return new Response(JSON.stringify({
    exportId,
    downloadUrl,
    expiresIn: 86400 // 24 hours
  }));
};
```

---

## Performance Monitoring

### Request Performance Tracking
```typescript
export const performanceMiddleware = (
  handler: Handler
): Handler => {
  return async (request, env, ctx) => {
    const start = Date.now();
    const traceId = generateTraceId();
    
    // Add trace header
    const headers = new Headers(request.headers);
    headers.set('X-Trace-Id', traceId);
    
    try {
      const response = await handler(
        new Request(request, { headers }),
        env,
        ctx
      );
      
      const duration = Date.now() - start;
      
      // Log performance metrics
      metrics.timing('request.duration', duration, {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        status: response.status.toString()
      });
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Trace-Id', traceId);
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - start;
      
      metrics.timing('request.error.duration', duration, {
        endpoint: new URL(request.url).pathname,
        method: request.method
      });
      
      throw error;
    }
  };
};
```

---

## Testing Requirements

### Load Testing
- [ ] 10k concurrent users simulation
- [ ] Sustained load testing (24 hours)
- [ ] Spike testing (5x normal load)
- [ ] Database connection limits
- [ ] API rate limit verification

### Security Testing
- [ ] OWASP Top 10 scan
- [ ] Penetration testing
- [ ] Token security audit
- [ ] Rate limit bypass attempts
- [ ] Data encryption verification

---

## Success Criteria
- [ ] <1% error rate in production
- [ ] <300ms P95 API response time
- [ ] 99.9% uptime achieved
- [ ] All security scans pass
- [ ] GDPR compliance verified
- [ ] Monitoring dashboards operational

---

## Production Readiness Checklist
- [ ] All endpoints have rate limiting
- [ ] Structured logging implemented everywhere
- [ ] Error tracking configured
- [ ] Health checks passing
- [ ] Security headers enabled
- [ ] GDPR endpoints functional
- [ ] Performance budgets met
- [ ] Alerts configured
- [ ] Runbooks documented
- [ ] Disaster recovery tested 