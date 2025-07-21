#!/bin/bash
set -e

echo "🔍 Astropal Deployment Diagnostics Script"
echo "=========================================="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Function to log with timestamp
log() {
    echo "[$(date -u +"%H:%M:%S")] $1"
}

# Function to log section headers
section() {
    echo ""
    echo "📋 $1"
    echo "$(printf '%.0s-' {1..50})"
}

section "Environment Information"
log "Node.js version: $(node --version 2>/dev/null || echo 'Not available')"
log "npm version: $(npm --version 2>/dev/null || echo 'Not available')"
log "Current directory: $(pwd)"
log "Operating system: $(uname -a)"
log "User: $(whoami)"

if [ -n "$CF_PAGES" ]; then
    log "🔵 Cloudflare Pages Environment Detected"
    log "CF_PAGES: $CF_PAGES"
    log "CF_PAGES_URL: ${CF_PAGES_URL:-'Not set'}"
    log "CF_PAGES_BRANCH: ${CF_PAGES_BRANCH:-'Not set'}"
    log "CF_PAGES_COMMIT_SHA: ${CF_PAGES_COMMIT_SHA:-'Not set'}"
else
    log "⚪ Local/Other Environment"
fi

section "Project Structure Analysis"
log "Root directory contents:"
ls -la | head -20

log ""
log "Frontend directory (apps/web):"
if [ -d "apps/web" ]; then
    cd apps/web
    log "✅ Frontend directory exists"
    
    log "Frontend directory contents:"
    ls -la | head -15
    
    log ""
    log "Frontend package.json info:"
    if [ -f "package.json" ]; then
        log "✅ package.json exists"
        log "Next.js version: $(grep '"next"' package.json | cut -d'"' -f4 || echo 'Not found')"
        log "next-intl version: $(grep '"next-intl"' package.json | cut -d'"' -f4 || echo 'Not found')"
        log "@cloudflare/next-on-pages version: $(grep '"@cloudflare/next-on-pages"' package.json | cut -d'"' -f4 || echo 'Not found')"
    else
        log "❌ package.json missing"
    fi
    
    cd ../..
else
    log "❌ Frontend directory missing"
fi

section "Build Configuration Verification"
log "Checking build configuration files..."

# Check Next.js config
if [ -f "apps/web/next.config.js" ]; then
    log "✅ next.config.js exists"
    log "Next.js config preview:"
    head -10 apps/web/next.config.js
else
    log "❌ next.config.js missing"
fi

# Check middleware
if [ -f "apps/web/middleware.ts" ]; then
    log "✅ middleware.ts exists"
    log "Middleware config matcher:"
    grep -A 5 "export const config" apps/web/middleware.ts || log "Config not found"
else
    log "❌ middleware.ts missing"
fi

# Check i18n config
if [ -f "apps/web/app/i18n.ts" ]; then
    log "✅ i18n.ts exists"
    log "Supported locales:"
    grep -E "locales.*=|'en'|'es'" apps/web/app/i18n.ts || log "Locales not found"
else
    log "❌ i18n.ts missing"
fi

section "Static Route Generation Analysis"
log "Checking for locale-based routes..."

if [ -d "apps/web/app/[locale]" ]; then
    log "✅ Dynamic locale route exists: [locale]"
    
    log "Route structure:"
    find apps/web/app/[locale] -name "*.tsx" -o -name "*.ts" | head -10
    
    log ""
    log "Layout file analysis:"
    if [ -f "apps/web/app/[locale]/layout.tsx" ]; then
        log "✅ layout.tsx exists"
        log "generateStaticParams function:"
        grep -A 10 "generateStaticParams" apps/web/app/[locale]/layout.tsx || log "generateStaticParams not found"
    else
        log "❌ layout.tsx missing"
    fi
    
    log ""
    log "Main page analysis:"
    if [ -f "apps/web/app/[locale]/page.tsx" ]; then
        log "✅ page.tsx exists"
        log "Runtime config:"
        grep "export const runtime" apps/web/app/[locale]/page.tsx || log "Runtime config not found"
    else
        log "❌ page.tsx missing"
    fi
else
    log "❌ Dynamic locale route missing"
fi

section "Build Output Verification"
log "Checking build outputs..."

# Check if we're in build process or checking existing build
if [ "$1" = "build" ]; then
    log "🔨 Running build process..."
    cd apps/web
    
    log "Installing dependencies..."
    npm ci || log "⚠️ npm ci failed, trying npm install"
    npm install || log "❌ npm install failed"
    
    log "Running Next.js build..."
    npm run build:cf 2>&1 | tee build.log
    
    log "Build process completed. Checking output..."
    cd ../..
fi

# Check build output
if [ -d "apps/web/.vercel/output" ]; then
    log "✅ Vercel output directory exists"
    
    log "Output structure:"
    find apps/web/.vercel/output -type f | head -20
    
    log ""
    log "Static files:"
    if [ -d "apps/web/.vercel/output/static" ]; then
        log "✅ Static directory exists"
        log "Static files count: $(find apps/web/.vercel/output/static -type f | wc -l)"
        
        log "Key static files:"
        find apps/web/.vercel/output/static -name "*.html" -o -name "_worker.js" -o -name "*.json" | head -10
        
        # Check for locale-specific files
        log ""
        log "Locale-specific files:"
        find apps/web/.vercel/output/static -path "*en*" -o -path "*es*" | head -10
    else
        log "❌ Static directory missing"
    fi
    
    log ""
    log "Functions:"
    if [ -d "apps/web/.vercel/output/functions" ]; then
        log "✅ Functions directory exists"
        find apps/web/.vercel/output/functions -type f | head -10
    else
        log "⚪ No functions directory (expected for static sites)"
    fi
    
    # Check for _worker.js (Cloudflare Pages Functions)
    if [ -f "apps/web/.vercel/output/static/_worker.js" ]; then
        log "✅ _worker.js exists for Cloudflare Pages Functions"
        log "_worker.js size: $(wc -c < apps/web/.vercel/output/static/_worker.js) bytes"
    else
        log "❌ _worker.js missing - this is required for Cloudflare Pages Functions"
    fi
    
else
    log "❌ Build output directory missing"
fi

# Check root build output (after cloudflare-build.sh copies it)
if [ -d ".vercel/output/static" ]; then
    log "✅ Root build output exists (copied by cloudflare-build.sh)"
    log "Root static files count: $(find .vercel/output/static -type f | wc -l)"
else
    log "❌ Root build output missing"
fi

section "Cloudflare Configuration"
if [ -f "apps/web/wrangler.json" ]; then
    log "✅ wrangler.json exists"
    log "Wrangler configuration:"
    cat apps/web/wrangler.json
else
    log "❌ wrangler.json missing"
fi

section "Environment Variables Check"
log "Checking critical environment variables..."

# Check build-time env vars
log "NODE_ENV: ${NODE_ENV:-'Not set'}"
log "NEXT_PUBLIC_DOMAIN: ${NEXT_PUBLIC_DOMAIN:-'Not set'}"
log "NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL:-'Not set'}"
log "NEXT_PUBLIC_ENVIRONMENT: ${NEXT_PUBLIC_ENVIRONMENT:-'Not set'}"

section "Routing Diagnostics"
log "Expected routes that should be available:"
log "  / (root - should redirect to /en)"
log "  /en (English homepage)"
log "  /es (Spanish homepage)"
log "  /en/portal"
log "  /es/portal"
log "  /en/pricing"
log "  /es/pricing"

log ""
log "Middleware configuration should handle:"
log "  - Locale detection from Accept-Language header"
log "  - Locale prefix handling with 'as-needed' strategy"
log "  - Static asset bypass for /_next/, /api/, etc."

section "Common Issues to Check"
log "🔍 Potential issues to investigate:"
log ""
log "1. LOCALE RESOLUTION:"
log "   - Check if middleware is properly detecting locales"
log "   - Verify generateStaticParams is creating en/es routes"
log "   - Ensure locale parameter validation is working"
log ""
log "2. BUILD OUTPUT:"
log "   - Verify Next-on-Pages is generating correct static files"
log "   - Check if _worker.js contains proper routing logic"
log "   - Ensure locale-specific HTML files are created"
log ""
log "3. CLOUDFLARE PAGES:"
log "   - Verify wrangler.json configuration"
log "   - Check if build output is in correct location"
log "   - Ensure Functions are properly configured"
log ""
log "4. ENVIRONMENT VARIABLES:"
log "   - Verify all NEXT_PUBLIC_ variables are set"
log "   - Check if production environment is detected correctly"

section "Next Steps for Debugging"
log "🚀 If 404 errors persist after deployment:"
log ""
log "1. Check Cloudflare Pages Functions logs"
log "2. Verify DNS and domain configuration"
log "3. Test specific routes: /en, /es, /en/portal"
log "4. Check browser network tab for failed requests"
log "5. Review middleware logs in production"
log "6. Verify static file generation for each locale"

echo ""
echo "✅ Diagnostics complete!"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""
echo "📤 To share these logs:"
echo "1. Save this output to a file: ./scripts/deployment-diagnostics.sh > diagnostics.log"
echo "2. Share the diagnostics.log file with your team"
echo "3. Include any error messages from the build process"
echo "4. Add browser console logs from the production site" 