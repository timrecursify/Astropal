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
  // Form fields
  email: "user@example.com",
  name: "User Name", 
  birthDate: "1990-01-01",
  birthTime: "12:00",
  birthLocation: "City, Country",
  timeZone: "America/New_York",
  deliveryTime: "09:00",
  
  // Variant identification
  variant: "authority|transformation|convenience",
  ab_test_variant: "variant0|variant1|variant2",
  
  // Generated UID (10-digit: 2-letter country code + 8-digit timestamp)
  uid: "US12345678",   // Based on birth location country + timestamp
  
  // UTM Parameters (always included, null if not present)
  utm_source: "facebook",      // or null
  utm_medium: "cpc",           // or null
  utm_campaign: "launch",      // or null
  utm_term: "astrology",       // or null
  utm_content: "ad_variant_1", // or null
  
  // Click tracking parameters (always included, null if not present)
  fbclid: "abc123",   // Facebook Click ID, or null
  ttclid: "def456",   // TikTok Click ID, or null
  gclid: "ghi789",    // Google Click ID, or null
  
  // Page and session data (always included)
  page_url: "https://astropal.io/variant1",
  page_title: "Astropal - Personal Astrology",
  referrer: "https://facebook.com",
  user_agent: "Mozilla/5.0...",
  language: "en-US",
  screen_resolution: "1920x1080",
  viewport_size: "1440x900",
  session_id: "sess_1234567890_abc123",
  timezone: "America/New_York",
  
  // Metadata
  submission_timestamp: "2025-01-01T12:00:00.000Z",
  form_version: "2.0",
  
  // Complete visitor data object (for backup/detailed analysis)
  visitor_data: {
    // Contains all the above tracking data plus any additional fields
    utm_source: "facebook",
    utm_medium: "cpc",
    // ... etc
  }
}
```

**Key Features:**
- ✅ **Unique UID generated** for each submission (country code + timestamp)
- ✅ **UTM parameters always included** at top level (even if null)
- ✅ **Consistent format** regardless of whether UTM data is present
- ✅ **Click tracking** for Facebook, TikTok, and Google
- ✅ **Session persistence** - UTM data persists across page navigation
- ✅ **Complete visitor context** included

**UID Format Examples:**
- `US12345678` - United States birth location
- `GB12345678` - United Kingdom birth location  
- `CA12345678` - Canada birth location
- `AU12345678` - Australia birth location
- `XX12345678` - Unknown/fallback country code

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
- Pixel ID: `1840372693567321`
- **Events**:
  - `PageView`: Fires on every page load
  - `VariantAssigned`: Fires when A/B test assigns a variant (custom event)
  - `CompleteRegistration`: Fires AFTER successful form submission to webhook
  - `Lead`: Fires when confirmation screen is displayed to user
- **Conversion Flow**:
  1. User submits form → Form validates → Webhook receives data
  2. `CompleteRegistration` event fires (accurate conversion tracking)
  3. Confirmation screen shows → `Lead` event fires (lead confirmation)
- **Testing**: Use Facebook Pixel Helper browser extension to verify pixel fires
- **Security**: CSP headers in `_headers` file allow Facebook domains

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

### Facebook Pixel Testing
1. **Install Facebook Pixel Helper**: Chrome extension to monitor pixel events
2. **Test PageView Events**: 
   - Visit `/` (should auto-assign variant and fire PageView)
   - Visit `/variant0`, `/variant1`, `/variant2` directly
   - Verify PageView event fires on each page
3. **Test VariantAssigned Event**:
   - Clear cookies and visit `/`
   - Check that VariantAssigned custom event fires
4. **Test CompleteRegistration Event** (MAIN CONVERSION):
   - Fill out and submit forms on each variant
   - Wait for "Registration successful" message
   - Verify CompleteRegistration event fires ONLY after successful submission
   - Check event includes variant identifier (variant0/variant1/variant2)
5. **Test Lead Event**:
   - After form submission, confirmation screen should appear
   - Verify Lead event fires when confirmation is displayed
6. **Check Facebook Events Manager**:
   - Log into Facebook Business Manager
   - Go to Events Manager → Data Sources → Your Pixel
   - Verify events are received in real-time

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