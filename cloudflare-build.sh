#!/bin/bash
set -e

echo "🚀 Starting Cloudflare Pages build for Astropal frontend..."

# Navigate to frontend directory
cd apps/web

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm ci

# Build the frontend
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output is in apps/web/.next/" 