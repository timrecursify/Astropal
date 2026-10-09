# Astropal.io

Personalized daily cosmic highlights delivered by email. Built with React + TypeScript, deployed on Cloudflare Pages + Functions, with a robust A/B testing system for page variants, taglines, and CTAs.

## 🏗️ Project Structure

```
Astropal_io/
├── src/
│   ├── components/
│   │   ├── variants/           # A/B test variant components
│   │   │   ├── Variant0.tsx    # Authority + Scientific Credibility
│   │   │   ├── Variant1.tsx    # Personal Transformation + Empowerment  
│   │   │   ├── Variant1Form.tsx
│   │   │   ├── Variant1Hero.tsx
│   │   │   ├── Variant1Pricing.tsx
│   │   │   ├── Variant2.tsx    # Convenience + Lifestyle Integration
│   │   │   ├── Variant2Form.tsx
│   │   │   └── Variant2Hero.tsx
│   │   ├── ABTestRouter.tsx    # Dynamic variant routing & tracking
│   │   ├── ConfirmationBlock.tsx
│   │   ├── FieldTooltip.tsx
│   │   ├── NewsletterForm.tsx
│   │   ├── TrackingFreeLayout.tsx
│   │   ├── Feedback.tsx
│   │   ├── Unsubscribe.tsx
│   │   └── cosmic/             # Cosmic UI components
│   │       ├── StarField.tsx
│   │       └── TerminalAnimation.tsx
│   ├── utils/
│   │   ├── abTesting.ts        # A/B testing logic & variant assignment
│   │   ├── trackingLoader.ts   # Conditional tracking script loader
│   │   ├── visitorTracking.ts  # Visitor data capture
│   │   ├── formValidation.ts   # Form validation utilities
│   │   └── taglineVariants.ts  # Dynamic tagline system
│   ├── hooks/
│   │   ├── useFormState.ts     # Form state management
│   │   └── useTaglineVariant.ts
│   └── types/
│       ├── facebook.d.ts       # Facebook Pixel TypeScript definitions
│       └── globals.d.ts
├── functions/
│   └── api/
│       └── submit-form.ts      # Cloudflare Functions API endpoint
├── public/
│   ├── _headers                # Cloudflare security headers
│   └── [static assets]
├── .vercel/output/static/      # Build output for Cloudflare Pages
└── [config files]
```

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion animations
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Validation**: Validator.js
- **Deployment**: Cloudflare Pages + Functions
- **Analytics**: Microsoft Clarity + Facebook Pixel
- **Build Tool**: Vite with React plugin

## 📊 A/B Testing System (Scope)

- Page variants (33/33/33):
  - Variant 0: Authority + scientific credibility
  - Variant 1: Personal transformation + empowerment
  - Variant 2: Convenience + lifestyle integration
- Tagline variants: Intent‑based buckets (Timing/Outcome, Relationships, Wellbeing, Career/Results, Simplicity, Credibility)
- CTA variants: Multiple labels testing outcome, simplicity, personalization
- Persistence & tracking:
  - Variant via cookie (30 days), tagline via localStorage TTL (7 days), CTA via cookie (14 days)
  - All variants forwarded to webhook on form submit with UTM/click IDs

## 🛠️ Development

### **Prerequisites**
```bash
Node.js 18+ 
npm or yarn
```

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### **Environment Variables**
```bash
# Required for form submissions
LEAD_RECEIVER_URL=https://lead-receiver.example
LEAD_RECEIVER_TOKEN=your_server_side_token
```

## 🚀 Deployment

### **Cloudflare Pages Setup**
1. **Build Command**: `npm run build`
2. **Output Directory**: `.vercel/output/static`
3. **Functions Directory**: `functions/`
4. **Framework Preset**: None (custom Vite build)

### **Build Process**
- Vite builds to `.vercel/output/static/` for Cloudflare compatibility
- Cloudflare Functions in `functions/api/` handle form submissions
- Security headers configured in `public/_headers`
- Automatic deployment on git push to main branch

### **Production Features**
- CSP & security headers in `public/_headers`
- Error boundaries and centralized logging (`src/utils/logger.ts`)
- Cloudflare Pages Function for form submission (`functions/api/submit-form.ts`)

## 🔍 Key Components

### **A/B Testing Flow**
1. `ABTestRouter.tsx` assigns page variant client‑side and loads tracking scripts (blocked on service pages)
2. Tagline chosen with TTL (7 days) from `src/utils/taglineVariants.ts`
3. CTA variant chosen via cookie from `src/utils/ctaVariants.ts`
4. On submit, `visitorTracking.ts` posts form + `variant`, `tagline_variant`, `cta_variant`, and UTM data to `/api/submit-form`

### **Form System**
- Multi-step form with validation (`formValidation.ts`)
- Conditional fields based on selected practices
- Tooltip system for user guidance (`FieldTooltip.tsx`)
- Confirmation flow with compact design

### **Tracking & Analytics**
- Microsoft Clarity + Facebook Pixel (conditionally loaded)
- Visitor data: UTM/click IDs, page/session, device/viewport, timezone
- A/B metadata: page `variant`, `tagline_variant`, `cta_variant`

---

See `docs/architecture.md` for a full technical deep‑dive.
