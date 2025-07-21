'use client';

import { useEffect, useState } from 'react';
import { VariantA, VariantB, VariantC, VariantD } from '../../components/variants';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ErrorBoundary from '../../components/ErrorBoundary';
import { useLogger } from '../../lib/logger';

export const runtime = 'edge';

const variants = [
  { id: 'A', component: VariantA, name: 'Cosmic Calm', perspective: 'calm' },
  { id: 'B', component: VariantB, name: 'Know Before You Text', perspective: 'knowledge' },
  { id: 'C', component: VariantC, name: 'Time Your Success', perspective: 'success' },
  { id: 'D', component: VariantD, name: 'Precision Astrology', perspective: 'evidence' }
];

// Enhanced diagnostics logging
const logEnvironmentDiagnostics = (logger: any) => {
  if (typeof window !== 'undefined') {
    logger.logInfo('Client environment diagnostics', {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      origin: window.location.origin,
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      referrer: document.referrer,
      title: document.title,
      readyState: document.readyState,
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      platform: navigator.platform,
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
      localStorage: {
        available: !!window.localStorage,
        length: window.localStorage?.length || 0,
        astropalVariant: window.localStorage?.getItem('astropal_variant')
      },
      sessionStorage: {
        available: !!window.sessionStorage,
        length: window.sessionStorage?.length || 0
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
    });

    // Log any errors in the console
    const originalError = console.error;
    console.error = (...args) => {
      logger.logError(new Error('Console error captured'), {
        consoleArgs: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      });
      originalError.apply(console, args);
    };
  }
};

export default function HomePage() {
  const { logUserAction, logInfo, logError, logWarn } = useLogger('HomePage');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Log initial page load
  useEffect(() => {
    logInfo('HomePage component mounted', {
      availableVariants: variants.map(v => ({ id: v.id, name: v.name })),
      timestamp: new Date().toISOString()
    });

    logEnvironmentDiagnostics({ logInfo, logError, logWarn });
  }, [logInfo, logError, logWarn]);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    logInfo('Setting client state to true', {
      isServer: typeof window === 'undefined',
      timestamp: new Date().toISOString()
    });
    setIsClient(true);
  }, [logInfo]);

  useEffect(() => {
    if (!isClient) {
      logInfo('Skipping variant selection - not on client yet');
      return;
    }

    logInfo('Starting variant selection process', {
      isClient,
      availableVariants: variants.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Check if user has a stored variant preference
      let storedVariant: string | null = null;
      
      try {
        storedVariant = localStorage?.getItem('astropal_variant');
        logInfo('localStorage access successful', {
          storedVariant,
          localStorageAvailable: !!localStorage,
          localStorageLength: localStorage?.length || 0
        });
      } catch (storageError) {
        logWarn('localStorage access failed', {
          error: storageError instanceof Error ? storageError.message : String(storageError),
          fallbackBehavior: 'Will use random variant'
        });
      }
      
      let chosenVariant;
      
      if (storedVariant && variants.some(v => v.id === storedVariant)) {
        // Use stored variant
        chosenVariant = variants.find(v => v.id === storedVariant);
        logInfo('Using stored variant', {
          variantId: storedVariant,
          variantName: chosenVariant?.name,
          source: 'localStorage'
        });
      } else {
        // Randomly select a variant
        const randomIndex = Math.floor(Math.random() * variants.length);
        chosenVariant = variants[randomIndex];
        
        logInfo('Randomly selected variant', {
          variantId: chosenVariant.id,
          variantName: chosenVariant.name,
          randomIndex,
          totalVariants: variants.length,
          selectedFromArray: variants.map(v => v.id)
        });
        
        // Store the selection for consistency during the session
        try {
          localStorage?.setItem('astropal_variant', chosenVariant.id);
          logInfo('Variant stored in localStorage', { variantId: chosenVariant.id });
        } catch (e) {
          logWarn('Could not save variant preference', {
            error: e instanceof Error ? e.message : String(e),
            variantId: chosenVariant.id,
            impact: 'Variant will be re-randomized on refresh'
          });
        }
        
        logUserAction('random_variant_assigned', {
          variantId: chosenVariant.id,
          variantName: chosenVariant.name,
          perspective: chosenVariant.perspective
        });
      }
      
      if (!chosenVariant) {
        throw new Error('No variant could be selected');
      }

      logInfo('Variant selection complete', {
        selectedVariant: {
          id: chosenVariant.id,
          name: chosenVariant.name,
          perspective: chosenVariant.perspective
        },
        hasComponent: !!chosenVariant.component,
        componentName: chosenVariant.component?.name || 'unknown'
      });
      
      setSelectedVariant(chosenVariant);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logError(error instanceof Error ? error : new Error(errorMessage), {
        phase: 'variant_selection',
        fallbackVariant: variants[0].id,
        availableVariants: variants.map(v => v.id)
      });
      
      // Fallback to first variant if there's any error
      setSelectedVariant(variants[0]);
      setInitError(errorMessage);
    } finally {
      setIsLoading(false);
      logInfo('Variant selection process complete', {
        isLoading: false,
        hasError: !!initError,
        selectedVariantId: selectedVariant?.id || 'fallback'
      });
    }
  }, [isClient, logUserAction, logInfo, logError, logWarn, selectedVariant?.id, initError]);

  // Show loading state while determining variant
  if (isLoading || !selectedVariant || !isClient) {
    logInfo('Showing loading state', {
      isLoading,
      hasSelectedVariant: !!selectedVariant,
      isClient,
      reason: !isClient ? 'waiting_for_client' : !selectedVariant ? 'no_variant_selected' : 'still_loading'
    });

    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your cosmic experience...</p>
          {initError && (
            <p className="text-red-400 text-sm mt-2">
              Debug: {initError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render the selected variant
  const VariantComponent = selectedVariant.component;
  
  logInfo('Rendering selected variant', {
    variantId: selectedVariant.id,
    variantName: selectedVariant.name,
    componentName: VariantComponent?.name || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  return (
    <ErrorBoundary componentName={`HomePage-${selectedVariant.id}`}>
      <div className="relative">
        {/* Add language switcher overlay */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        
        {/* Render the selected variant */}
        <VariantComponent />
      </div>
    </ErrorBoundary>
  );
}