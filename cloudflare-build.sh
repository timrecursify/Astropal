#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build for Astropal frontend..."

# Navigate to frontend directory
cd apps/web

# Ensure wrangler.json is in the correct location for Cloudflare Pages
echo "📋 Ensuring wrangler.json configuration..."
if [ ! -f "wrangler.json" ]; then
  echo "❌ ERROR: wrangler.json not found in apps/web directory!"
  exit 1
fi

# Build the frontend (dependencies already installed at root)
echo "🔨 Building Next.js application with Cloudflare Pages Functions..."
npm run build:cf

# Verify Next-on-Pages output exists
if [ ! -d ".vercel/output/static" ]; then
  echo "❌ ERROR: Next-on-Pages static output not found!"
  echo "Expected .vercel/output/static directory to be created by next-on-pages"
  exit 1
fi

if [ ! -d ".vercel/output/static/_worker.js" ]; then
  echo "❌ ERROR: Next-on-Pages _worker.js not found!"
  echo "Expected .vercel/output/static/_worker.js directory with Edge Functions"
  exit 1
fi

echo "✅ Next-on-Pages output verified:"
echo "📁 Static files: .vercel/output/static"
echo "⚡ Functions: .vercel/output/static/_worker.js"

# CRITICAL: Copy the output to the root where Cloudflare Pages expects it
echo "📦 Copying build output to root directory for Cloudflare Pages..."
cd ../..
rm -rf .vercel
cp -r apps/web/.vercel .

echo "✅ Build output copied to root .vercel/output/static"
echo "🎉 Build completed successfully!" 