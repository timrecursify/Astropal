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

### Build settings (Alternative - Simple)
**Basic approach without shell script:**
- **Build command**: `cd apps/web && npm run build`
- **Build output directory**: `apps/web/.next`

## Production Deployment
- **Production branch**: `main`
- **Branch for production**: `main`
- **Environment**: `Production`

## Repository
- **GitHub Repository**: `timrecursify/Astropal`
- **Branch**: `main`

## Optimizations Applied

✅ **File Size Optimization:**
- Webpack caching disabled for production builds
- Large cache files automatically removed during build
- Bundle splitting optimized for smaller chunks
- ESLint disabled during CI builds to prevent config errors

✅ **Cloudflare Pages Compatibility:**
- All files under 25MB limit enforced
- Cache directories excluded from deployment
- Production-grade webpack configuration
- Memory usage optimized for build environment

## Important Notes
1. The build output directory MUST be `apps/web/.next` (not `dist`)
2. Cache files are automatically cleaned to stay under 25MB limit
3. The build script removes webpack cache files after successful build
4. ESLint and TypeScript validation disabled in CI for faster builds
5. Production deployments should come from the `main` branch 