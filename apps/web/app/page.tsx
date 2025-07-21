'use client';

import { useEffect } from 'react';
import { logger } from '../lib/logger';

export const runtime = 'edge';

export default function RootPage() {
  useEffect(() => {
    // Log the root page access
    logger.info('Root page accessed - performing locale detection', {
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      acceptLanguage: navigator.language,
      timestamp: new Date().toISOString()
    });

    // Client-side locale detection and redirect
    const detectAndRedirect = () => {
      try {
        // Get browser language
        const browserLang = navigator.language.toLowerCase();
        const supportedLocales = ['en', 'es'];
        
        // Determine best locale
        let targetLocale = 'en'; // default
        
        if (browserLang.startsWith('es')) {
          targetLocale = 'es';
        } else if (supportedLocales.some(locale => browserLang.startsWith(locale))) {
          targetLocale = browserLang.substring(0, 2);
        }

        // Check for stored preference
        try {
          const storedLocale = localStorage.getItem('preferred-locale');
          if (storedLocale && supportedLocales.includes(storedLocale)) {
            targetLocale = storedLocale;
          }
        } catch (e) {
          // localStorage might not be available
          logger.warn('LocalStorage not available for locale preference', { error: e });
        }

        logger.info('Root page redirecting to locale', {
          detectedLocale: targetLocale,
          browserLang,
          redirectUrl: `/${targetLocale}`,
          method: 'client-side-redirect'
        });

        // Perform redirect
        window.location.replace(`/${targetLocale}`);
        
      } catch (error) {
        logger.error('Error in locale detection', {
          error: error instanceof Error ? error.message : String(error),
          fallbackRedirect: '/en'
        });
        
        // Fallback to English
        window.location.replace('/en');
      }
    };

    // Small delay to ensure logging is captured
    setTimeout(detectAndRedirect, 100);
  }, []);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Detecting your language...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to the best experience for you</p>
      </div>
    </div>
  );
} 