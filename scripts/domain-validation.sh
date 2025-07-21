#!/bin/bash

# Domain Validation Script for Astropal.io
# Comprehensive testing to diagnose custom domain issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔍 Astropal Domain Validation Report"
echo "=================================="
echo ""

# Test 1: DNS Resolution
log_info "1. Testing DNS Resolution..."
echo ""

# Check root domain
log_info "Checking astropal.io DNS resolution:"
if dig +short astropal.io > /dev/null 2>&1; then
    DIG_RESULT=$(dig +short astropal.io | head -1)
    log_success "DNS resolves to: $DIG_RESULT"
else
    log_error "DNS resolution failed for astropal.io"
fi

# Check www subdomain
log_info "Checking www.astropal.io DNS resolution:"
if dig +short www.astropal.io > /dev/null 2>&1; then
    DIG_WWW_RESULT=$(dig +short www.astropal.io | head -1)
    log_success "WWW DNS resolves to: $DIG_WWW_RESULT"
else
    log_error "DNS resolution failed for www.astropal.io"
fi

# Check API subdomain
log_info "Checking api.astropal.io DNS resolution:"
if dig +short api.astropal.io > /dev/null 2>&1; then
    DIG_API_RESULT=$(dig +short api.astropal.io | head -1)
    log_success "API DNS resolves to: $DIG_API_RESULT"
else
    log_error "DNS resolution failed for api.astropal.io"
fi

echo ""

# Test 2: Direct Cloudflare Pages URL
log_info "2. Testing Direct Cloudflare Pages URL..."
echo ""

# Check if we can determine the Pages URL
PAGES_URL=""
if [ -f "apps/web/.vercel/output/config.json" ]; then
    log_info "Looking for Cloudflare Pages URL in build output..."
    # Try to extract from build logs or config
fi

# Test a few common patterns
POSSIBLE_URLS=(
    "https://563ef2f1.astropal.pages.dev"
    "https://astropal.pages.dev"
    "https://astropal-web.pages.dev"
    "https://astropal-frontend.pages.dev"
)

for url in "${POSSIBLE_URLS[@]}"; do
    log_info "Testing: $url"
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        log_success "✅ Direct Pages URL working: $url"
        PAGES_URL="$url"
        break
    else
        log_warning "❌ Not accessible: $url"
    fi
done

echo ""

# Test 3: Custom Domain HTTP Tests
log_info "3. Testing Custom Domain HTTP Response..."
echo ""

DOMAINS=("astropal.io" "www.astropal.io")

for domain in "${DOMAINS[@]}"; do
    log_info "Testing https://$domain"
    
    # Test HTTP response
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" || echo "000")
    REDIRECT_URL=$(curl -s -o /dev/null -w "%{redirect_url}" "https://$domain" || echo "")
    
    echo "  HTTP Status: $HTTP_CODE"
    if [ "$REDIRECT_URL" != "" ]; then
        echo "  Redirect to: $REDIRECT_URL"
    fi
    
    case $HTTP_CODE in
        200)
            log_success "✅ Domain responding correctly"
            ;;
        301|302)
            log_warning "⚠️ Domain redirecting (might be expected)"
            ;;
        404)
            log_error "❌ 404 Not Found - This is the main issue!"
            ;;
        000)
            log_error "❌ Connection failed - DNS or SSL issue"
            ;;
        *)
            log_warning "⚠️ Unexpected response: $HTTP_CODE"
            ;;
    esac
    
    # Test SSL certificate
    log_info "Checking SSL certificate..."
    if echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -subject 2>/dev/null; then
        log_success "✅ SSL certificate valid"
    else
        log_error "❌ SSL certificate issue"
    fi
    
    echo ""
done

# Test 4: API Endpoint Test
log_info "4. Testing API Endpoint..."
echo ""

API_URL="https://api.astropal.io/healthz"
log_info "Testing: $API_URL"

API_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")
echo "API HTTP Status: $API_HTTP_CODE"

if [ "$API_HTTP_CODE" = "200" ]; then
    log_success "✅ API endpoint working"
    API_RESPONSE=$(curl -s "$API_URL" || echo "")
    echo "API Response: $API_RESPONSE"
else
    log_error "❌ API endpoint not working"
fi

echo ""

# Test 5: Cloudflare Detection
log_info "5. Cloudflare Configuration Check..."
echo ""

for domain in astropal.io www.astropal.io; do
    log_info "Checking Cloudflare headers for $domain:"
    CF_RAY=$(curl -s -I "https://$domain" | grep -i "cf-ray" || echo "")
    CF_CACHE=$(curl -s -I "https://$domain" | grep -i "cf-cache-status" || echo "")
    
    if [ "$CF_RAY" != "" ]; then
        log_success "✅ Cloudflare proxy detected: $CF_RAY"
    else
        log_warning "⚠️ No Cloudflare headers detected"
    fi
    
    if [ "$CF_CACHE" != "" ]; then
        echo "   Cache status: $CF_CACHE"
    fi
done

echo ""

# Test 6: Build Output Verification
log_info "6. Build Output Verification..."
echo ""

if [ -f "apps/web/.vercel/output/static/_worker.js/index.js" ]; then
    log_success "✅ Cloudflare Pages Functions file exists"
    WORKER_SIZE=$(wc -c < "apps/web/.vercel/output/static/_worker.js/index.js")
    echo "   Worker size: $WORKER_SIZE bytes"
else
    log_error "❌ Cloudflare Pages Functions file missing"
fi

if [ -f "apps/web/.vercel/output/config.json" ]; then
    log_success "✅ Vercel output config exists"
    echo "   Routes configured:"
    grep -A 5 '"src"' apps/web/.vercel/output/config.json | head -10 || echo "   Unable to read routes"
else
    log_error "❌ Vercel output config missing"
fi

echo ""

# Test 7: Root Route Specific Test
log_info "7. Root Route Specific Test..."
echo ""

log_info "Testing specific routes for debugging:"

ROUTES=("/" "/en" "/es" "/en/portal" "/es/portal")

for route in "${ROUTES[@]}"; do
    log_info "Testing route: $route"
    
    for domain in astropal.io; do
        FULL_URL="https://$domain$route"
        ROUTE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FULL_URL" || echo "000")
        
        case $ROUTE_CODE in
            200)
                log_success "  ✅ $FULL_URL → $ROUTE_CODE (OK)"
                ;;
            301|302)
                REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" "$FULL_URL" || echo "")
                log_warning "  ⚠️ $FULL_URL → $ROUTE_CODE (Redirect to: $REDIRECT)"
                ;;
            404)
                log_error "  ❌ $FULL_URL → $ROUTE_CODE (NOT FOUND)"
                ;;
            *)
                log_warning "  ⚠️ $FULL_URL → $ROUTE_CODE"
                ;;
        esac
    done
    echo ""
done

# Summary and Recommendations
echo ""
echo "🎯 SUMMARY AND RECOMMENDATIONS"
echo "==============================="
echo ""

if [ "$PAGES_URL" != "" ]; then
    log_info "✅ Direct Pages URL working: $PAGES_URL"
    log_info "➡️ This means the build and deployment are successful"
    echo ""
fi

log_info "🔧 NEXT STEPS TO FIX THE ISSUE:"
echo ""

echo "1. Check Cloudflare Pages Custom Domain Configuration:"
echo "   • Go to Cloudflare Pages dashboard"
echo "   • Find your Astropal project"
echo "   • Settings → Custom domains"
echo "   • Verify 'astropal.io' is added and status is 'Active'"
echo ""

echo "2. Verify Cloudflare DNS Settings:"
echo "   • Go to Cloudflare DNS dashboard for astropal.io"
echo "   • Ensure these records exist:"
echo "     - Type: CNAME, Name: @, Target: your-project.pages.dev, Proxied: Yes"
echo "     - Type: CNAME, Name: www, Target: astropal.io, Proxied: Yes"
echo ""

echo "3. Check Build Output Directory Setting:"
echo "   • In Cloudflare Pages project settings"
echo "   • Build configuration → Build output directory"
echo "   • Should be: .vercel/output/static"
echo ""

echo "4. Force New Deployment:"
echo "   • If settings look correct, try:"
echo "   • git commit --allow-empty -m 'trigger deployment'"
echo "   • git push origin main"
echo ""

if [ "$API_HTTP_CODE" != "200" ]; then
    echo "5. Fix API Domain Configuration:"
    echo "   • Add custom domain for API worker:"
    echo "   • npx wrangler custom-domains add api.astropal.io --zone-id YOUR_ZONE_ID"
    echo ""
fi

echo "📊 For more detailed debugging:"
echo "   • Check Cloudflare Pages deployment logs"
echo "   • Verify environment variables are set"
echo "   • Test using curl with -v flag for verbose output"
echo ""

log_info "Domain validation report complete!" 