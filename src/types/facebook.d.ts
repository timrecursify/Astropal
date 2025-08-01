// Facebook Pixel type declarations
interface FacebookPixelParameters {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    fbq?: (
      command: 'track' | 'init' | 'trackCustom',
      event?: string,
      parameters?: FacebookPixelParameters
    ) => void;
  }
}

export {}; 