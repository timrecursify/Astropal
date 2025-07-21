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

### Build settings (Alternative if script fails)
If the shell script doesn't work, use:
- **Build command**: `cd apps/web && npm ci && npm run build`
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
2. The build command MUST navigate to `apps/web` first
3. Make sure to install dependencies in the correct workspace
4. Production deployments should come from the `main` branch 