'use client';

import { useEffect, useState } from 'react';
import { logger } from '../../lib/logger';
import ErrorBoundary from '../../components/ErrorBoundary';

// Enhanced 404 diagnostic information
const collect404Diagnostics = () => {
  if (typeof window === 'undefined') return {};
  
  return {
    timestamp: new Date().toISOString(),
    page: {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      host: window.location.host,
      title: document.title,
      referrer: document.referrer
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth
    },
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      devicePixelRatio: window.devicePixelRatio
    },
    routing: {
      expectedLocales: ['en', 'es'],
      detectedLocale: window.location.pathname.split('/')[1],
      pathSegments: window.location.pathname.split('/').filter(Boolean),
      isValidLocale: ['en', 'es'].includes(window.location.pathname.split('/')[1]),
      routePattern: window.location.pathname.replace(/^\/[a-z]{2}/, '/[locale]')
    },
    storage: {
      localStorage: {
        available: !!window.localStorage,
        astropalVariant: window.localStorage?.getItem('astropal_variant'),
        itemCount: window.localStorage?.length || 0
      },
      sessionStorage: {
        available: !!window.sessionStorage,
        itemCount: window.sessionStorage?.length || 0
      }
    },
    performance: window.performance ? {
      timeOrigin: window.performance.timeOrigin,
      now: window.performance.now(),
      timing: {
        navigationStart: window.performance.timing.navigationStart,
        domContentLoadedEventEnd: window.performance.timing.domContentLoadedEventEnd,
        loadEventEnd: window.performance.timing.loadEventEnd
      }
    } : null
  };
};

export default function NotFound() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [errorId] = useState(`404_${Date.now()}_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    const diag = collect404Diagnostics();
    setDiagnostics(diag);

    // Log the 404 error with comprehensive diagnostics
    logger.error('404 Page Not Found', {
      errorId,
      type: '404_not_found',
      diagnostics: diag,
      potentialIssues: {
        invalidLocale: diag.routing?.detectedLocale && !diag.routing?.isValidLocale,
        missingLocalePath: !diag.routing?.detectedLocale,
        malformedRoute: diag.page?.pathname?.includes('//') || diag.page?.pathname?.includes('%'),
        expectedRoutes: [
          '/',
          '/en',
          '/es', 
          '/en/portal',
          '/es/portal',
          '/en/pricing',
          '/es/pricing',
          '/en/privacy',
          '/es/privacy',
          '/en/terms',
          '/es/terms'
        ]
      }
    });

    // Also log to console for immediate debugging
    console.group('🚨 404 Error Diagnostics');
    console.log('Error ID:', errorId);
    console.log('Current URL:', diag.page?.url);
    console.log('Detected Locale:', diag.routing?.detectedLocale);
    console.log('Is Valid Locale:', diag.routing?.isValidLocale);
    console.log('Path Segments:', diag.routing?.pathSegments);
    console.log('Full Diagnostics:', diag);
    console.groupEnd();
  }, [errorId]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary componentName="NotFoundPage">
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-purple-400 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-200 mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-400 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            {errorId && (
              <p className="font-mono text-sm text-red-300 mb-6">
                Error ID: {errorId}
              </p>
            )}
          </div>

          {/* Navigation Options */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              🏠 Go Home
            </button>
            
            <button
              onClick={() => window.location.href = '/en'}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              🇺🇸 English
            </button>
            
            <button
              onClick={() => window.location.href = '/es'}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              🇪🇸 Español
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              🔄 Reload
            </button>
          </div>

          {/* Diagnostic Information (Development/Debug Mode) */}
          {diagnostics && (isDevelopment || window.location.search.includes('debug=true')) && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                🔍 Diagnostic Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Current Request</h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p><strong>URL:</strong> {diagnostics.page?.url}</p>
                    <p><strong>Pathname:</strong> {diagnostics.page?.pathname}</p>
                    <p><strong>Detected Locale:</strong> {diagnostics.routing?.detectedLocale || 'None'}</p>
                    <p><strong>Valid Locale:</strong> {diagnostics.routing?.isValidLocale ? 'Yes' : 'No'}</p>
                    <p><strong>Referrer:</strong> {diagnostics.page?.referrer || 'Direct'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Expected Routes</h4>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>✅ / (redirects to /en)</p>
                    <p>✅ /en (English homepage)</p>
                    <p>✅ /es (Spanish homepage)</p>
                    <p>✅ /en/portal, /es/portal</p>
                    <p>✅ /en/pricing, /es/pricing</p>
                    <p>✅ /en/privacy, /es/privacy</p>
                  </div>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-yellow-300 hover:text-yellow-100">
                  📊 Full Diagnostic Data (Click to expand)
                </summary>
                <div className="mt-3 p-4 bg-black/30 rounded border border-gray-600">
                  <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              If you continue to experience issues, please contact support with Error ID: {errorId}
            </p>
            
            {!isDevelopment && !window.location.search.includes('debug=true') && (
              <p className="text-gray-600 text-xs mt-2">
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('debug', 'true');
                    window.location.href = url.toString();
                  }}
                  className="underline hover:text-gray-400"
                >
                  Show diagnostic information
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 