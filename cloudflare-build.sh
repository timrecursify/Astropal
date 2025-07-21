#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build for Astropal frontend..."

# Navigate to frontend directory
cd apps/web

# Build the frontend (dependencies already installed at root)
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output is in apps/web/.next/" 