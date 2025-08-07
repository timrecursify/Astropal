# Astropal.io - A/B Testing Cosmic Intelligence Platform

**Advanced cosmic intelligence system with comprehensive A/B testing capabilities**

## 🚀 Quick Start

A modern React + TypeScript application built with Vite, featuring sophisticated A/B testing implementation and cosmic-themed UI.

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

## 📊 A/B Testing System

### **33% Traffic Distribution**
- **Variant 0** (33%): Authority + Scientific Credibility approach
- **Variant 1** (33%): Personal Transformation + Empowerment messaging  
- **Variant 2** (33%): Convenience + Lifestyle Integration focus

### **Features**
- **Cookie Persistence**: Users see consistent variant for 30 days
- **Dynamic Routing**: `ABTestRouter.tsx` handles variant assignment
- **Analytics Integration**: Each variant tracked with custom events
- **Conditional Tracking**: Scripts blocked on service pages (`/feedback`, `/unsubscribe`)
- **Mobile Optimized**: All variants fully responsive

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
VITE_ZAPIER_WEBHOOK_URL=your_zapier_webhook_url
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
- **CSP Headers**: Content Security Policy for Facebook Pixel & Clarity
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **CORS Support**: Configured for API endpoints
- **Error Handling**: Production-ready error boundaries

## 🔍 Key Components

### **A/B Testing Flow**
1. `ABTestRouter.tsx` assigns variant based on cookie or new assignment
2. Variant components render different messaging/UI approaches
3. `trackingLoader.ts` conditionally loads analytics scripts
4. Form submissions tracked with variant data via `visitorTracking.ts`

### **Form System**
- Multi-step form with validation (`formValidation.ts`)
- Conditional fields based on selected practices
- Tooltip system for user guidance (`FieldTooltip.tsx`)
- Confirmation flow with compact design

### **Tracking & Analytics**
- **Microsoft Clarity**: Heat maps, session recordings, A/B variant tracking
- **Facebook Pixel**: Conversion tracking, lead events
- **Conditional Loading**: Scripts only load on main pages, blocked on service pages
- **Visitor Data**: UTM parameters, session data, form completion tracking

---

**Built with React, TypeScript, Tailwind CSS, and enterprise-grade A/B testing capabilities.**