#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build for Astropal frontend..."

# Navigate to frontend directory
cd apps/web

# Build the frontend (dependencies already installed at root)
echo "🔨 Building Next.js application with Cloudflare Pages Functions..."
npm run build:cf

# Verify Next-on-Pages output exists
if [ ! -d ".vercel/output/static" ]; then
  echo "❌ ERROR: Next-on-Pages static output not found!"
  echo "Expected .vercel/output/static directory to be created by next-on-pages"
  exit 1
fi

if [ ! -d ".vercel/output/functions" ]; then
  echo "❌ ERROR: Next-on-Pages functions output not found!"
  echo "Expected .vercel/output/functions directory to be created by next-on-pages"
  exit 1
fi

echo "✅ Next-on-Pages output verified:"
echo "📁 Static files: .vercel/output/static"
echo "⚡ Functions: .vercel/output/functions"

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
find .vercel/output -name "*.pack" -size +20M -delete || true
find .vercel/output -name "*webpack*" -size +20M -delete || true

echo "📊 Checking final build size..."
du -sh .vercel/output/ || true

echo "✅ Build completed and optimized for Cloudflare Pages!"
echo "📁 Build output is in apps/web/.vercel/output/"
echo "🌐 Static files ready for deployment from .vercel/output/static"
echo "⚡ Pages Functions ready for deployment from .vercel/output/functions" 