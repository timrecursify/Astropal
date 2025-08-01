#!/bin/bash

# Cloudflare Pages Build Script for Astropal.io
# Builds the web application from the monorepo structure

echo "🚀 Starting Astropal.io build process..."

# Navigate to the web app directory
cd apps/web

echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

echo "📁 Build complete! Output in apps/web/dist"

# Copy dist to root level for Cloudflare Pages
echo "📋 Copying build files to root for deployment..."
cp -r dist ../../dist

echo "✅ Build process completed successfully!" 