# Domain Setup Troubleshooting for astropal.io

## 🚨 Current Issue: 404 Error on www.astropal.io

### Quick Diagnosis Checklist

1. **Check Cloudflare Pages Custom Domains**
   - Go to Cloudflare Pages → Your Astropal Project → Settings → Custom domains
   - Should show:
     - ✅ `astropal.io` (Active)
     - ✅ `www.astropal.io` (Active)

2. **Check DNS Records**
   - Go to Cloudflare Dashboard → astropal.io domain → DNS → Records
   - Verify these records exist:

```
Type: CNAME | Name: @ | Target: your-project-name.pages.dev | Proxied: Yes
Type: CNAME | Name: www | Target: astropal.io | Proxied: Yes  
Type: CNAME | Name: api | Target: astropal-api.tim-611.workers.dev | Proxied: Yes
```

3. **Check Latest Deployment**
   - Go to Cloudflare Pages → Your Astropal Project → Deployments
   - Latest deployment should be ✅ Success
   - Click "View deployment" to test the Pages URL directly

## 🔧 Step-by-Step Fix

### Step 1: Add Custom Domains in Cloudflare Pages

1. **Go to Cloudflare Pages Dashboard**
2. **Select your Astropal project**
3. **Settings tab → Custom domains**
4. **Add domain**: `astropal.io`
5. **Add domain**: `www.astropal.io`
6. **Wait for DNS propagation** (can take 5-15 minutes)

### Step 2: Verify DNS Records

Your DNS should look like this:
```
@ (root)     CNAME    your-project.pages.dev     🟠 Proxied
www          CNAME    astropal.io                🟠 Proxied
api          CNAME    astropal-api.tim-611.workers.dev    🟠 Proxied
```

### Step 3: Test Direct Pages URL

Before testing your custom domain, verify the build works:
1. Go to Cloudflare Pages → Deployments
2. Click on latest successful deployment
3. Click "Visit site" - this should show your frontend working
4. If this fails, there's a build/deployment issue, not domain issue

### Step 4: Check Environment Variables

Verify these are set in **Cloudflare Pages → Settings → Environment variables → Production**:
```
NEXT_PUBLIC_DOMAIN=astropal.io
NEXT_PUBLIC_API_BASE_URL=https://api.astropal.io
NEXT_PUBLIC_HMAC_SECRET=your-secret-here
```

### Step 5: Force New Deployment

If everything looks correct but still not working:
1. Go to Cloudflare Pages → Deployments
2. Click "Retry deployment" on latest build
3. Or make a small commit to trigger new deployment

## 🔍 Debugging Commands

Test your domain resolution:
```bash
# Check if domain resolves
nslookup astropal.io

# Check if www resolves  
nslookup www.astropal.io

# Test direct connection
curl -I https://astropal.io
curl -I https://www.astropal.io
```

## 🚀 Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| **404 on www** | `www.astropal.io` shows 404 | Add `www.astropal.io` as custom domain |
| **404 on root** | `astropal.io` shows 404 | Check DNS @ record points to pages.dev |
| **SSL errors** | Certificate warnings | Wait for SSL provisioning (up to 24h) |
| **DNS not propagating** | Still showing old content | Wait 24-48h, clear DNS cache |
| **Build output wrong** | Pages loads but broken | Verify build output is `apps/web/.next` |

## ⚡ Quick Test

Try these URLs in order:
1. **Direct Pages URL**: `https://your-project.pages.dev` (should work)
2. **Root domain**: `https://astropal.io` (if fails, DNS issue)
3. **WWW domain**: `https://www.astropal.io` (if fails, missing www custom domain)

If #1 fails → Build/deployment issue
If #1 works but #2 fails → DNS/custom domain issue
If #2 works but #3 fails → Missing www custom domain 