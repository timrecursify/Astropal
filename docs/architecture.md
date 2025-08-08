# Architecture

This document outlines the current technical architecture of Astropal.io.

## Overview
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Routing: React Router v7
- Deployment: Cloudflare Pages + Functions
- Analytics: Microsoft Clarity, Facebook Pixel (conditionally loaded)
- A/B Testing: Page variants, tagline variants, CTA variants
- Tracking: UTM/click IDs, session data, A/B metadata posted to a Pages Function webhook

## Frontend Structure
- `src/main.tsx`: App root with `BrowserRouter` and `ErrorBoundary`
- `src/App.tsx`: Defines routes including `/`, `/variant0/1/2`, and service pages
- `src/components/ABTestRouter.tsx`: Client‑side variant assignment and tracking script load
- `src/components/variants/Variant0|1|2*.tsx`: Variant pages and related sections (hero, form, benefits, reviews)
- `src/components/cosmic/EmailSampleModal.tsx`: Email preview modal (left‑aligned, variant‑tinted accents)
- `src/components/EnhancedConfirmation.tsx`: Post‑submit confirmation (inline with subtle animation)

## A/B Testing
### Page Variant
- `src/utils/abTesting.ts`: Cookie‑based assignment (30 days)
- Variant surfaced in UI and forwarded on submission

### Tagline Variant
- `src/utils/taglineVariants.ts`:
  - Intent categories: Timing/Outcome, Relationships, Wellbeing, Career/Results, Simplicity, Credibility
  - Persisted with TTL (7 days) via localStorage
  - Hook: `src/hooks/useTaglineVariant.ts`

### CTA Variant
- `src/utils/ctaVariants.ts`:
  - Multiple CTA labels for different hypotheses
  - Cookie persisted (14 days)

## Tracking & Webhook
- `src/utils/visitorTracking.ts`:
  - Captures: UTM (`utm_*`), click IDs (`fbclid`, `ttclid`, `gclid`), page/session/device, timezone
  - A/B metadata: `variantName` param (per page), `tagline_variant`, `cta_variant`
  - Posts payload to `/api/submit-form`

- `functions/api/submit-form.ts`:
  - Receives submission data and forwards to Zapier/endpoint (secrets managed on Cloudflare)
  - CORS, error handling

## Analytics Loading
- `src/utils/trackingLoader.ts`:
  - Blocks on service pages (`/feedback`, `/unsubscribe`)
  - Loads Clarity + Facebook Pixel on main pages only

## Logging & Errors
- `src/utils/logger.ts`: Central logger with environment‑aware levels
- `src/hooks/useLogger.ts`: Component lifecycle/action logging
- `src/components/ErrorBoundary.tsx`: Captures unhandled React errors

## Styling & Responsiveness
- Tailwind classes for responsive layouts
- Grids collapse on small screens; modals scroll within viewport; inputs use dark color scheme

## Security & Headers
- `public/_headers`: CSP and security headers for production
- Cookies: `SameSite=Lax; Secure`; no sensitive data stored client‑side

## Build & Deploy
- `npm run build` produces `.vercel/output/static` for Cloudflare Pages
- Pages Function in `functions/` deployed alongside static output
- Recommended production checks:
  - `npm run build` (green)
  - Confirm `/api/submit-form` env secrets
  - Validate analytics scripts block on service pages

## Data Sent on Submit (Simplified)

"""
{
  formData: { ... },
  variantName: "variant1",
  visitorData: {
    utm_source, utm_medium, utm_campaign, fbclid, ttclid, gclid,
    page_url, page_title, referrer, user_agent, language,
    screen_resolution, viewport_size, timestamp, timezone, session_id,
    tagline_variant, cta_variant
  }
}
"""

## Future Considerations
- Add admin endpoint to view A/B distribution
- Persist tagline variant via cookie to align consistency model
- Code‑split heavy components (TerminalAnimation) to reduce initial bundle
