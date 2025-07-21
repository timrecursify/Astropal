'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

// Enhanced diagnostic information collector
const collectDiagnostics = () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    search: typeof window !== 'undefined' ? window.location.search : 'unknown',
    hash: typeof window !== 'undefined' ? window.location.hash : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    languages: typeof navigator !== 'undefined' ? navigator.languages : [],
    cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    screenWidth: typeof window !== 'undefined' && window.screen ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' && window.screen ? window.screen.height : 0,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    localStorage: typeof window !== 'undefined' ? {
      available: !!window.localStorage,
      astropalVariant: window.localStorage?.getItem('astropal_variant'),
      itemCount: window.localStorage ? window.localStorage.length : 0
    } : null,
    sessionStorage: typeof window !== 'undefined' ? {
      available: !!window.sessionStorage,
      itemCount: window.sessionStorage ? window.sessionStorage.length : 0
    } : null,
    performance: typeof window !== 'undefined' && window.performance ? {
      navigationStart: window.performance.timing?.navigationStart,
      loadEventEnd: window.performance.timing?.loadEventEnd,
      domContentLoaded: window.performance.timing?.domContentLoadedEventEnd,
      timeOrigin: window.performance.timeOrigin
    } : null,
    referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
    documentReady: typeof document !== 'undefined' ? document.readyState : 'unknown',
    title: typeof document !== 'undefined' ? document.title : 'unknown'
  };
  
  return diagnostics;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `err_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const diagnostics = collectDiagnostics();
    
    // Log comprehensive error information
    logger.error('React Error Boundary Triggered', {
      errorId,
      component: this.props.componentName || 'Unknown',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause
      },
      errorInfo: {
        componentStack: errorInfo.componentStack || 'Not available',
        errorBoundary: this.constructor.name
      },
      diagnostics,
      props: {
        componentName: this.props.componentName,
        hasFallback: !!this.props.fallback
      }
    });

    // Check if this might be a 404-related error
    const is404Likely = 
      error.message.includes('404') ||
      error.message.includes('Not Found') ||
      error.message.includes('notFound') ||
      (errorInfo.componentStack && errorInfo.componentStack.includes('not-found')) ||
      diagnostics.pathname.includes('404');

    if (is404Likely) {
      logger.error('Potential 404 Error Detected', {
        errorId,
        diagnostics,
        routingInfo: {
          currentPath: diagnostics.pathname,
          fullUrl: diagnostics.url,
          searchParams: diagnostics.search,
          expectedRoutes: ['/en', '/es', '/en/portal', '/es/portal', '/en/pricing', '/es/pricing'],
          locale: diagnostics.pathname.split('/')[1],
          routeSegments: diagnostics.pathname.split('/').filter(Boolean)
        },
        i18nInfo: {
          detectedLanguage: diagnostics.language,
          supportedLanguages: diagnostics.languages,
          browserLocale: diagnostics.language,
          expectedFormat: 'ISO 639-1 (en, es)'
        }
      });
    }

    // Store error info in state for rendering
    this.setState({
      error,
      errorInfo,
      errorId
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI with detailed diagnostics
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const diagnostics = collectDiagnostics();
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-red-400 mb-4">
                🚨 Something went wrong
              </h1>
              
              <div className="text-red-200 mb-4">
                <p>We encountered an unexpected error. Our team has been notified.</p>
                {this.state.errorId && (
                  <p className="mt-2 font-mono text-sm">
                    Error ID: <span className="text-red-300">{this.state.errorId}</span>
                  </p>
                )}
              </div>

              {isDevelopment && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-red-300 hover:text-red-100">
                    🔍 Technical Details (Development Mode)
                  </summary>
                  <div className="mt-3 p-4 bg-black/30 rounded border border-red-500/20">
                    <div className="mb-3">
                      <strong className="text-red-300">Error:</strong>
                      <pre className="text-sm text-red-200 mt-1 whitespace-pre-wrap">
                        {this.state.error.message}
                      </pre>
                    </div>
                    
                    {this.state.error.stack && (
                      <div className="mb-3">
                        <strong className="text-red-300">Stack Trace:</strong>
                        <pre className="text-xs text-red-200 mt-1 overflow-x-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    <div className="mb-3">
                      <strong className="text-red-300">Current URL:</strong>
                      <p className="text-sm text-red-200 mt-1 break-all">{diagnostics.url}</p>
                    </div>

                    <div className="mb-3">
                      <strong className="text-red-300">Browser Info:</strong>
                      <pre className="text-xs text-red-200 mt-1">
                        {JSON.stringify({
                          language: diagnostics.language,
                          userAgent: diagnostics.userAgent?.substring(0, 100) + '...',
                          platform: diagnostics.platform
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                🔄 Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                🏠 Go Home
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                🧹 Clear Data & Reload
              </button>
            </div>

            {isDevelopment && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded">
                <p className="text-yellow-200 text-sm">
                  💡 <strong>Development Tip:</strong> Check the browser console for additional logs 
                  and network requests. The error has been logged with ID {this.state.errorId}.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 