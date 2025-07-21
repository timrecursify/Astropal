#!/bin/bash

# Astropal Development Script
# Starts the full development environment

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

log_info "Starting Astropal development environment..."

# Pre-flight checks
log_info "Running pre-flight checks..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    log_error "Must be run from the project root directory"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 20 ]]; then
    log_error "Node.js 20.x or higher required. Current version: $(node -v)"
    exit 1
fi

# Check for dependencies
if [[ ! -d "node_modules" ]]; then
    log_info "Installing dependencies..."
    npm install
fi

# Check for wrangler CLI
if ! command -v wrangler &> /dev/null; then
    log_warning "Wrangler CLI not found. Installing locally..."
    npm install -g wrangler
fi

# Environment setup
log_info "Setting up development environment..."

# Create .env.development if it doesn't exist
if [[ ! -f "apps/web/.env.local" ]]; then
    log_info "Creating frontend environment file..."
    cat > apps/web/.env.local << EOF
# Frontend Development Environment
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_LOG_LEVEL=debug

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
EOF
fi

# Create backend environment if needed
if [[ ! -f "packages/backend/.env" ]]; then
    log_info "Creating backend environment file..."
    cat > packages/backend/.env << EOF
# Backend Development Environment
NODE_ENV=development
LOG_LEVEL=debug

# API Keys (will be set via wrangler secrets in production)
# Uncomment and fill these for local development
# GROK_API_KEY=your_grok_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
# RESEND_API_KEY=your_resend_api_key_here
EOF
fi

# Health check function
health_check() {
    local url=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service to be ready..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$service is ready at $url"
            return 0
        fi
        
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    log_error "$service failed to start within $max_attempts seconds"
    return 1
}

# Clean up function for graceful shutdown
cleanup() {
    log_info "Shutting down development environment..."
    
    # Kill background processes
    if [[ -n $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null || true
        log_info "Backend stopped"
    fi
    
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        log_info "Frontend stopped"
    fi
    
    log_success "Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

log_info "Starting services..."

# Start backend in background
log_info "Starting backend (Cloudflare Workers)..."
cd packages/backend
npm run dev > /tmp/astropal-backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Start frontend in background  
log_info "Starting frontend (Next.js)..."
cd apps/web
npm run dev > /tmp/astropal-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for services to be ready
sleep 5

# Health checks
if health_check "http://localhost:8787/healthz" "Backend"; then
    log_success "Backend ready at http://localhost:8787"
else
    log_error "Backend failed to start. Check logs: tail -f /tmp/astropal-backend.log"
    cleanup
fi

if health_check "http://localhost:3000" "Frontend"; then
    log_success "Frontend ready at http://localhost:3000"
else
    log_error "Frontend failed to start. Check logs: tail -f /tmp/astropal-frontend.log"
    cleanup
fi

# Development environment ready
log_success "🚀 Development environment ready!"
echo
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:8787"
echo "📋 API Docs: http://localhost:8787/healthz"
echo
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/astropal-backend.log"
echo "   Frontend: tail -f /tmp/astropal-frontend.log"
echo
echo "Press Ctrl+C to stop all services"

# Keep script running and show logs
while true; do
    sleep 1
done 