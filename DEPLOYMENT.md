# Astropal.io Deployment Guide

## Project Structure

This is a React + TypeScript application with A/B testing functionality built with Vite and Cloudflare Pages Functions.

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
The webhook URL is configured as a **secret** in Cloudflare Pages:
- Name: `VITE_PUBLIC_ZAPIER_WEBHOOK_URL`
- Value: Your Zapier webhook URL
- Type: **Secret** (encrypted)

### How It Works
1. **Client-side forms** submit to `/api/submit-form` (Cloudflare Pages function)
2. **Cloudflare function** has access to the secret webhook URL at runtime
3. **Function securely forwards** form data to Zapier webhook
4. **No sensitive URLs** are exposed in the client-side JavaScript

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

Forms submit to the Cloudflare function which forwards enhanced data to the webhook:
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
  ab_test_variant: "variant0|variant1|variant2",
  submission_timestamp: "2025-01-01T12:00:00.000Z",
  form_version: "2.0",
  visitor_data: {
    utm_source: "facebook",
    utm_medium: "cpc",
    utm_campaign: "launch",
    page_url: "https://astropal.io",
    referrer: "https://facebook.com",
    session_id: "sess_1234567890_abc123"
    // ... and more tracking data
  }
}
```

## Security Features

- ✅ Input validation on all forms
- ✅ HTTPS enforcement 
- ✅ Secure cookie settings (SameSite=Lax, Secure)
- ✅ **Webhook URL kept as encrypted secret on server**
- ✅ **Client never has access to sensitive webhook URL**
- ✅ CORS protection on API functions
- ✅ Error handling for webhook failures

## Analytics Integration

### Microsoft Clarity
- Tracking ID: `so6j2uvy4i`
- Variant tracking: `clarity('set', 'ab_variant', variant)`

### Facebook Pixel  
- Pixel ID: `1086322613060078`
- Events: `PageView`, `VariantAssigned`, `CompleteRegistration`

## Deployment to Cloudflare Pages

### GitHub Repository
```
https://github.com/timrecursify/Astropal
```

### Cloudflare Pages Configuration
- **Build Command**: `./cloudflare-build.sh`
- **Build Output Directory**: `.vercel/output/static`
- **Root Directory**: `/` (project root)
- **Functions**: Enabled (for `/api/submit-form` endpoint)

### Environment Variables Setup
1. Go to Cloudflare Pages → Settings → Environment Variables
2. Add a **Secret** (not a regular variable):
   - Name: `VITE_PUBLIC_ZAPIER_WEBHOOK_URL`
   - Value: Your Zapier webhook URL
   - Type: **Secret** (encrypted)
3. Save and redeploy

### Project Files
- `wrangler.toml` - Cloudflare Pages configuration
- `functions/api/submit-form.ts` - Server-side form handler with access to secrets
- `cloudflare-build.sh` - Build script

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
2. Check browser developer tools for successful `/api/submit-form` calls
3. Verify webhook receives data in correct format
4. Check confirmation modal displays
5. Confirm Facebook conversion event fires

### Function Logs
- Check Cloudflare Pages dashboard for function logs
- Monitor for any errors in form submission

## Legal Pages
- **Privacy Policy**: `/privacy` - Updated with support@astropal.io contact
- **Terms of Service**: `/terms` - Entertainment purposes disclaimer

## Mobile Optimization
- ✅ Responsive design with Tailwind CSS
- ✅ Touch-friendly form inputs
- ✅ Optimized text sizes for mobile reading
- ✅ Fixed footer on mobile devices 