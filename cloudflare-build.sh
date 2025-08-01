#!/bin/bash

# Cloudflare Pages Build Script for Astropal.io
# Builds the React application directly from root

echo "🚀 Starting Astropal.io build process..."

echo "📦 Installing dependencies..."
npm install --no-audit --no-fund

echo "🔨 Building application..."
npm run build

echo "✅ Build process completed successfully!"
echo "📁 Build output available in dist/ directory" 