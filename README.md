# Astropal.io - A/B Testing Cosmic Intelligence Platform

**Advanced cosmic intelligence system with comprehensive A/B testing capabilities**

## 🚀 Quick Start

This is a monorepo containing the Astropal.io web application with sophisticated A/B testing implementation.

### Web Application (`/apps/web`)

A modern React + TypeScript application featuring:

- **33% A/B Testing Distribution** across three messaging strategies:
  - **Variant 0** (Authority + Scientific Credibility) 
  - **Variant 1** (Personal Transformation + Empowerment)
  - **Variant 2** (Convenience + Lifestyle Integration)

- **Advanced Analytics Integration**:
  - Microsoft Clarity tracking with custom A/B variant variables
  - Facebook Pixel with conversion event tracking
  - Cookie-based variant persistence (30-day expiry)

- **Enterprise-Grade Security**:
  - Secure webhook integration with Zapier
  - Input validation and age verification
  - CORS-compliant API calls

### 🏗️ Architecture

```
apps/
  web/           # React + Vite web application
    src/
      components/
        variants/  # A/B test variant components
        ABTestRouter.tsx  # Dynamic variant routing
      utils/
        abTesting.ts      # A/B testing logic
```

### 🔧 Development

```bash
cd apps/web
npm install
npm run dev
```

### 📊 A/B Testing Features

- **Dynamic Variant Assignment**: 33% traffic distribution
- **Cookie Persistence**: Users see consistent variant for 30 days  
- **Analytics Tracking**: Each variant tracked with custom events
- **Mobile Optimized**: All variants fully responsive
- **Production Ready**: Built with enterprise security standards

### 🚀 Deployment

Deploy to Cloudflare Pages with:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Environment Variable**: `VITE_ZAPIER_WEBHOOK_URL`

See `/apps/web/DEPLOYMENT.md` for complete deployment guide.

---

**Built with React, TypeScript, Tailwind CSS, and advanced A/B testing capabilities.** 