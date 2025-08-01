# Astropal.io Deployment Guide

## Project Structure

This is a React + TypeScript application with A/B testing functionality built with Vite.

### A/B Testing Implementation

- **Dynamic Routing**: Root `/` displays `ABTestRouter` which assigns variants with 33% distribution
- **Variant Assignment**: Uses cookies (`astropal_ab_variant`) with 30-day expiry
- **Direct Access**: `/variant0`, `/variant1`, `/variant2` for testing
- **Tracking**: Facebook Pixel and Microsoft Clarity integration

### Variants
- **Variant0**: Authority + Scientific Credibility theme
- **Variant1**: Personal Transformation + Empowerment theme  
- **Variant2**: Convenience + Lifestyle Integration theme

## Environment Configuration

### Required Environment Variables (Cloudflare Pages Secrets)
```bash
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your-webhook-url
```

## Build Process

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm install
npm run build
```

## Form Submission Data Format

All forms send consistent data to webhook:
```javascript
{
  email: "user@example.com",
  name: "User Name", 
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthLocation: "City, Country",
  timeZone: "America/New_York",
  deliveryTime: "09:00",
  variant: "authority|transformation|convenience",
  abTestVariant: "variant0|variant1|variant2",
  timestamp: "2025-01-01T12:00:00.000Z"
}
```

## Security Features

- ✅ Input validation on all forms
- ✅ HTTPS enforcement 
- ✅ Secure cookie settings (SameSite=Lax, Secure)
- ✅ Environment variable protection for webhooks
- ✅ Error handling for webhook failures

## Analytics Integration

### Microsoft Clarity
- Tracking ID: `so6j2uvy4i`
- Variant tracking: `clarity('set', 'ab_variant', variant)`

### Facebook Pixel  
- Pixel ID: `1547406942906619`
- Events: `PageView`, `VariantAssigned`, `CompleteRegistration`

## Deployment to Cloudflare Pages

### GitHub Repository
```
https://github.com/timrecursify/Astropal
```

### Cloudflare Pages Configuration
- **Build Command**: `./cloudflare-build.sh`
- **Build Output Directory**: `dist`
- **Root Directory**: `/` (project root)

### Environment Variables Setup
1. Go to Cloudflare Pages → Settings → Environment Variables
2. Add `VITE_ZAPIER_WEBHOOK_URL` with your Zapier webhook URL
3. Save and redeploy

### Build Script (`cloudflare-build.sh`)
```bash
#!/bin/bash
echo "🚀 Starting Astropal.io build process..."
echo "📦 Installing dependencies..."
npm install --no-audit --no-fund
echo "🔨 Building application..."
npm run build
echo "✅ Build process completed successfully!"
```

## Testing & Monitoring

### A/B Test Verification
1. Clear cookies and visit `/` - should randomly assign variant
2. Check `astropal_ab_variant` cookie value
3. Test direct URLs: `/variant0`, `/variant1`, `/variant2`

### Analytics Verification
1. Check Facebook Events Manager for pixel events
2. Monitor Microsoft Clarity for session recordings
3. Verify webhook receives form submissions

### Form Testing
1. Fill out forms on each variant
2. Verify webhook receives data in correct format
3. Check confirmation modal displays
4. Confirm Facebook conversion event fires

## Legal Pages
- **Privacy Policy**: `/privacy` - Updated with support@astropal.io contact
- **Terms of Service**: `/terms` - Entertainment purposes disclaimer

## Mobile Optimization
- ✅ Responsive design with Tailwind CSS
- ✅ Touch-friendly form inputs
- ✅ Optimized text sizes for mobile reading
- ✅ Fixed footer on mobile devices 