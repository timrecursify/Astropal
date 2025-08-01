# Astropal.io Deployment Guide

## A/B Testing Implementation ✅

The site now implements sophisticated A/B testing with:

- **33% equal distribution** across three variants:
  - `variant0` (Authority + Scientific Credibility)
  - `variant1` (Personal Transformation + Empowerment) 
  - `variant2` (Convenience + Lifestyle Integration)

- **Cookie-based persistence** (30-day expiry)
- **Analytics tracking** for both Clarity and Facebook Pixel
- **Consistent form data structure** across all variants

## Routing Structure

- `/` - Dynamically assigns and loads user's variant
- `/variant0` - Direct access to Authority variant (for testing)
- `/variant1` - Direct access to Transformation variant (for testing)
- `/variant2` - Direct access to Convenience variant (for testing)
- `/privacy` - Privacy policy
- `/terms` - Terms of service

## Environment Configuration

### Required Environment Variables in Cloudflare Pages:

```bash
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/
```

### Setting Environment Variables:

1. In Cloudflare Pages dashboard
2. Go to Settings > Environment variables
3. Add `VITE_ZAPIER_WEBHOOK_URL` for both Production and Preview environments
4. Set the value to your Zapier webhook URL

## Form Submission Data Structure

All forms send consistent data to the webhook:

```json
{
  "fullName": "string",
  "preferredName": "string", 
  "email": "string",
  "birthDate": "YYYY-MM-DD",
  "birthLocation": "string",
  "timeZone": "string",
  "dayStartTime": "HH:MM",
  "birthTime": "HH:MM" | "unknown",
  "relationshipStatus": "string",
  "practices": ["array", "of", "strings"],
  "lifeFocus": ["array", "of", "strings"],
  "variant": "authority" | "transformation" | "convenience",
  "abTestVariant": "variant0" | "variant1" | "variant2",
  "timestamp": "ISO string"
}
```

## Security Features ✅

- **CORS-compliant** fetch requests with proper headers
- **Error handling** - forms continue to work even if webhook fails
- **Input validation** - client-side validation with type safety
- **Age verification** - 18+ requirement enforced
- **Secure cookies** - SameSite=Lax, Secure flags
- **Environment variable protection** - secrets stored in Cloudflare

## Analytics & Tracking ✅

### Microsoft Clarity
- **Tracking ID**: `so6j2uvy4i`
- **A/B variant tracking**: Sets custom variable `ab_variant`

### Facebook Pixel  
- **Pixel ID**: `1547406942906619`
- **Page view tracking**: Automatic on all pages
- **Conversion tracking**: Fires on form confirmations
- **A/B variant tracking**: Custom event `VariantAssigned`

## Deployment Steps

### 1. GitHub Repository
```bash
git add .
git commit -m "Complete A/B testing implementation with tracking"
git push origin main
```

### 2. Cloudflare Pages Setup
1. Connect GitHub repository to Cloudflare Pages
2. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`

### 3. Environment Variables
Set in Cloudflare Pages > Settings > Environment variables:
- `VITE_ZAPIER_WEBHOOK_URL`: Your Zapier webhook URL

### 4. Domain Configuration
- Point `astropal.io` to Cloudflare Pages
- Ensure SSL/TLS is enabled

## Testing the Implementation

### A/B Testing Verification:
1. Visit root domain multiple times in incognito
2. Check browser dev tools > Application > Cookies
3. Verify `astropal_ab_variant` cookie is set
4. Confirm 33% distribution over multiple tests

### Analytics Verification:
1. Check Clarity dashboard for session recordings
2. Verify Facebook Events Manager shows pixel fires
3. Test conversion events by completing forms

### Form Submission Testing:
1. Complete forms on each variant
2. Check Zapier webhook receives data
3. Verify localStorage fallback works
4. Test validation and error handling

## Performance Optimizations ✅

- **Lazy loading** of variants prevents unnecessary bundle loading
- **Client-side routing** with React Router for smooth navigation
- **Optimized images** and assets
- **Production build** with tree shaking and minification

## Mobile Optimization ✅

All variants are fully responsive with:
- **Mobile-first design**
- **Touch-friendly interactions**
- **Optimized form layouts** for mobile screens
- **Proper viewport configuration**
- **Loading states** for better UX

## Security Headers (Recommended for Cloudflare)

Add these headers in Cloudflare Pages settings:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Monitoring & Maintenance

- **Analytics**: Monitor conversion rates by variant
- **Error tracking**: Check browser console for JavaScript errors  
- **Performance**: Monitor Core Web Vitals in Clarity
- **A/B test results**: Analyze conversion rates to determine winning variant

---

**🚀 Ready for Production Deployment!**

The implementation is complete with enterprise-grade security, analytics, and A/B testing capabilities. 