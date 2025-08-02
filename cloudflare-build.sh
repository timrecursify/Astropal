#!/bin/bash

# Cloudflare Pages Build Script for Astropal.io
# Builds the React application directly from root

echo "🚀 Starting Astropal.io build process..."

echo "📦 Installing dependencies..."
# Clear npm cache and install dependencies fresh
npm cache clean --force
npm install --no-audit --no-fund

echo "🔨 Building application..."
npm run build

echo "✅ Build process completed successfully!"
echo "📁 Build output available in .vercel/output/static/ directory"

# Ensure the output directory exists for Cloudflare Pages
if [ ! -d ".vercel/output/static" ]; then
  echo "❌ Error: .vercel/output/static directory not found after build!"
  exit 1
fi

echo "📋 Build output contents:"
ls -la .vercel/output/static/ 