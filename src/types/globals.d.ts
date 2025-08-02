// Global variable definitions for Vite build-time replacements
declare const __ZAPIER_WEBHOOK_URL__: string | undefined;

// Facebook Pixel type definitions
declare global {
  interface Window {
    fbq: (action: string, event: string, params?: Record<string, unknown>) => void;
  }
}

export {}; 