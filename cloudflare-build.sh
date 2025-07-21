#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build for Astropal frontend..."

# Navigate to frontend directory
cd apps/web

# Build the frontend (dependencies already installed at root)
echo "🔨 Building Next.js application..."
npm run build

# Clean up large cache files to avoid Cloudflare Pages 25MB limit
echo "🧹 Cleaning up cache files for deployment..."
if [ -d ".next/cache" ]; then
  echo "Removing .next/cache directory..."
  rm -rf .next/cache
fi

if [ -d ".next/static/chunks/webpack" ]; then
  echo "Removing webpack cache files..."
  rm -rf .next/static/chunks/webpack
fi

# Remove other cache files that exceed size limits
find .next -name "*.pack" -size +20M -delete || true
find .next -name "*webpack*" -size +20M -delete || true

echo "📊 Checking final build size..."
du -sh .next/ || true

echo "✅ Build completed and optimized for Cloudflare Pages!"
echo "📁 Build output is in apps/web/.next/" 