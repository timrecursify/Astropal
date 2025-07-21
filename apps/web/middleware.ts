import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// Enhanced logging utility for middleware
const log = (level: string, message: string, data: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'middleware',
    message,
    ...data
  };
  
  console[level === 'error' ? 'error' : 'log'](`[MIDDLEWARE-${level.toUpperCase()}]`, JSON.stringify(logEntry));
};

// Create the base middleware
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  
  // Locale prefix handling
  localePrefix: 'as-needed'
});

// Enhanced middleware with comprehensive logging
export default function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Log incoming request details
  log('info', 'Middleware processing request', {
    requestId,
    url: request.url,
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    acceptLanguage: request.headers.get('accept-language'),
    referer: request.headers.get('referer'),
    host: request.headers.get('host'),
    cfRay: request.headers.get('cf-ray'),
    cfCountry: request.headers.get('cf-ipcountry'),
    cfConnectingIp: request.headers.get('cf-connecting-ip'),
    forwardedFor: request.headers.get('x-forwarded-for'),
    environment: process.env.NODE_ENV,
    cloudflarePages: process.env.CF_PAGES,
    cfPagesUrl: process.env.CF_PAGES_URL,
    cfPagesBranch: process.env.CF_PAGES_BRANCH,
    cfPagesCommitSha: process.env.CF_PAGES_COMMIT_SHA,
  });

  try {
    // Check if this is a static asset that should bypass i18n
    const staticPaths = [
      '/_next/',
      '/api/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/og-image.png',
      '/twitter-image.png',
      '/.well-known/',
      '/manifest.json'
    ];
    
    const isStaticAsset = staticPaths.some(path => request.nextUrl.pathname.startsWith(path)) ||
                         request.nextUrl.pathname.includes('.');
    
    if (isStaticAsset) {
      log('debug', 'Bypassing i18n for static asset', {
        requestId,
        pathname: request.nextUrl.pathname,
        isStaticAsset: true
      });
      return;
    }

    // Log locale detection attempt
    log('debug', 'Attempting locale detection', {
      requestId,
      pathname: request.nextUrl.pathname,
      acceptLanguage: request.headers.get('accept-language'),
      supportedLocales: ['en', 'es'],
      defaultLocale: 'en'
    });

    // Process with next-intl middleware
    const response = intlMiddleware(request);
    
    const processingTime = Date.now() - startTime;
    
    // Log the middleware response
    if (response) {
      log('info', 'Middleware response generated', {
        requestId,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        redirectLocation: response.headers.get('location'),
        processingTime,
        hasRedirect: response.status >= 300 && response.status < 400
      });
    } else {
      log('info', 'Middleware passthrough (no response)', {
        requestId,
        originalUrl: request.url,
        processingTime
      });
    }
    
    return response;
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    log('error', 'Middleware error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      pathname: request.nextUrl.pathname,
      processingTime
    });
    
    // Log environment diagnostics on error
    log('error', 'Environment diagnostics', {
      requestId,
      nodeEnv: process.env.NODE_ENV,
      cfPages: !!process.env.CF_PAGES,
      cfPagesUrl: process.env.CF_PAGES_URL,
      cfPagesBranch: process.env.CF_PAGES_BRANCH,
      nextjsVersion: process.env.npm_package_dependencies_next,
      intlVersion: process.env.npm_package_dependencies_next_intl,
      runtime: typeof EdgeRuntime !== 'undefined' ? 'edge' : 'nodejs'
    });
    
    // Don't throw, let the request continue
    return;
  }
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};