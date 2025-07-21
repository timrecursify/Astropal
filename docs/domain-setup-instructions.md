# Domain Setup Instructions for Astropal.io

## Overview
This guide helps you connect astropal.io domain to Cloudflare Pages (frontend) and Cloudflare Workers (backend API).

## Prerequisites
- astropal.io domain added to Cloudflare (✅ already done)
- Frontend built and ready for deployment
- Backend worker deployed and tested

## 1. Frontend - Cloudflare Pages Setup

### Deploy Frontend to Pages
```bash
# From apps/web directory
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name astropal-frontend --compatibility-date 2024-01-01
```

### Configure Custom Domain for Pages
```bash
# Add custom domain to Pages project
npx wrangler pages domain add astropal.io --project-name astropal-frontend

# Verify DNS configuration (should auto-configure)
npx wrangler pages domain list --project-name astropal-frontend
```

### DNS Records for Frontend (Auto-configured by Pages)
```
Type: CNAME
Name: astropal.io (or @)
Target: astropal-frontend.pages.dev
Proxy: Enabled (orange cloud)
```

## 2. Backend - Cloudflare Workers Custom Domain

### Configure API Subdomain
```bash
# Add custom domain to worker
npx wrangler custom-domains add api.astropal.io --zone-id <your-zone-id>
```

### DNS Records for Backend API
```
Type: CNAME  
Name: api
Target: astropal-api.<worker-subdomain>.workers.dev
Proxy: Enabled (orange cloud)
```

### Update wrangler.toml
```toml
# packages/backend/wrangler.toml
[env.production]
name = "astropal-api"
route = { pattern = "api.astropal.io/*", zone_name = "astropal.io" }

# ... rest of existing config
```

## 3. Environment Variables Update

### Frontend Environment Variables
Create/update `apps/web/.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.astropal.io
NEXT_PUBLIC_FRONTEND_DOMAIN=astropal.io
```

### Backend Environment Variables
Update via Wrangler secrets:
```bash
cd packages/backend
wrangler secret put FRONTEND_DOMAIN
# Enter: astropal.io

wrangler secret put API_BASE_URL  
# Enter: api.astropal.io
```

## 4. Update CORS Configuration

Update backend CORS to allow the new domain:
```typescript
// packages/backend/src/index.ts
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'https://astropal.io',
    'https://www.astropal.io',
    'https://preview.astropal.io'
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Total-Count'],
  maxAge: 86400,
}));
```

## 5. SSL Certificate Setup

SSL certificates are automatically provisioned by Cloudflare for both:
- astropal.io (Pages)
- api.astropal.io (Workers)

Verify SSL status:
```bash
# Check Pages SSL
curl -I https://astropal.io

# Check Workers SSL  
curl -I https://api.astropal.io/healthz
```

## 6. Deployment Commands

### Complete Deployment Process
```bash
# 1. Deploy backend worker
cd packages/backend
wrangler deploy --env production

# 2. Build and deploy frontend
cd ../../apps/web
npm run build
npx wrangler pages deploy out --project-name astropal-frontend

# 3. Verify deployments
curl https://api.astropal.io/healthz
curl https://astropal.io
```

## 7. Verification Checklist

- [ ] Frontend accessible at https://astropal.io
- [ ] API accessible at https://api.astropal.io/healthz
- [ ] SSL certificates valid for both domains
- [ ] CORS working between frontend and API
- [ ] Registration flow works end-to-end
- [ ] Email delivery working with new domain

## 8. DNS Propagation

DNS changes may take up to 24 hours to propagate globally. Check propagation status:
```bash
# Check DNS propagation
dig astropal.io
dig api.astropal.io

# Test from different locations
nslookup astropal.io 8.8.8.8
nslookup api.astropal.io 1.1.1.1
```

## 9. Monitoring & Alerts

Setup monitoring for the new domains:
- Cloudflare Analytics for traffic monitoring
- Uptime monitoring for both frontend and API
- Error rate tracking via Workers Analytics

## Troubleshooting

### Common Issues

1. **DNS not resolving**: Check Cloudflare DNS settings, ensure proxy is enabled
2. **SSL errors**: Wait for certificate provisioning (usually 5-15 minutes)
3. **CORS errors**: Verify origin configuration in worker
4. **404 errors**: Check routing configuration in wrangler.toml

### Support Commands
```bash
# Check worker logs
wrangler tail

# Check Pages deployment status
npx wrangler pages deployment list --project-name astropal-frontend

# Check DNS configuration
dig +trace astropal.io
```

## Security Notes

- Always use HTTPS in production
- Enable HSTS headers via Cloudflare
- Configure proper CSP headers
- Monitor for SSL/TLS vulnerabilities
- Enable Bot Fight Mode in Cloudflare for additional protection 