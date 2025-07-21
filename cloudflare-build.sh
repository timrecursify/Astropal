#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build for Astropal frontend..."

# Navigate to frontend directory
cd apps/web

# Build the frontend (dependencies already installed at root)
echo "🔨 Building Next.js application..."
npm run build

# Check if static export succeeded and 'out' directory exists
if [ -d "out" ]; then
  echo "✅ Static export successful - 'out' directory created"
  
  # Clean up any large files to avoid Cloudflare Pages 25MB limit
  echo "🧹 Cleaning up large files for deployment..."
  find out -name "*.pack" -size +20M -delete || true
  find out -name "*webpack*" -size +20M -delete || true
  
  echo "📊 Checking final build size..."
  du -sh out/ || true
  
  echo "✅ Build completed and optimized for Cloudflare Pages!"
  echo "📁 Build output is in apps/web/out/"
else
  echo "❌ ERROR: Static export failed - 'out' directory not found!"
  echo "Check if Next.js is configured for static export (output: 'export')"
  exit 1
fi 