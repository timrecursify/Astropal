# Cloudflare Pages Configuration for Astropal

## Build Settings

Use these **exact settings** in Cloudflare Pages dashboard:

### Framework preset
- **Framework**: `Next.js`

### Build configuration
- **Build command**: `./cloudflare-build.sh`
- **Build output directory**: `apps/web/.next`
- **Root directory**: `` (leave empty)

### Environment variables
```
NODE_VERSION=20.11.0
NPM_VERSION=10.5.0
```

### Build settings (Alternative - Recommended)
**Simple approach without shell script:**
- **Build command**: `cd apps/web && npm run build`
- **Build output directory**: `apps/web/.next`

## Production Deployment
- **Production branch**: `main`
- **Branch for production**: `main`
- **Environment**: `Production`

## Repository
- **GitHub Repository**: `timrecursify/Astropal`
- **Branch**: `main`

## Important Notes
1. The build output directory MUST be `apps/web/.next` (not `dist`)
2. Dependencies are installed at root level by Cloudflare Pages automatically
3. The build command only needs to navigate to `apps/web` and run build
4. Husky git hooks are disabled for CI/build environments 