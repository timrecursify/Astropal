import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import Providers from '../../components/Providers';
import ErrorBoundary from '../../components/ErrorBoundary';
import '../globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// Enhanced logging utility for layout
const log = (level: string, message: string, data: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: 'layout',
    message,
    ...data
  };
  
  console[level === 'error' ? 'error' : 'log'](`[LAYOUT-${level.toUpperCase()}]`, JSON.stringify(logEntry));
};

// Get domain from environment variables
const getDomain = () => {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'astropal.io';
  log('debug', 'Domain resolved', { domain, source: process.env.NEXT_PUBLIC_DOMAIN ? 'env' : 'default' });
  return domain;
};

// Get API base URL from environment variables
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    log('debug', 'API URL from explicit env var', { apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL });
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
    const domain = getDomain();
    const apiUrl = `https://api.${domain}`;
    log('debug', 'API URL generated for production', { apiUrl, domain });
    return apiUrl;
  }
  
  log('debug', 'API URL defaulting to localhost', { apiUrl: 'http://localhost:8787' });
  return 'http://localhost:8787';
};

const BASE_URL = `https://${getDomain()}`;
const API_URL = getApiBaseUrl();

// Log environment configuration at module load
log('info', 'Layout module loaded', {
  nodeEnv: process.env.NODE_ENV,
  publicEnv: process.env.NEXT_PUBLIC_ENVIRONMENT,
  cfPages: !!process.env.CF_PAGES,
  cfPagesUrl: process.env.CF_PAGES_URL,
  cfPagesBranch: process.env.CF_PAGES_BRANCH,
  cfPagesCommitSha: process.env.CF_PAGES_COMMIT_SHA,
  baseUrl: BASE_URL,
  apiUrl: API_URL,
  domain: getDomain()
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Astropal - Your Personal Cosmic Guide',
    template: '%s | Astropal'
  },
  description: 'Transform your daily routine with cosmic wisdom tailored to your unique astrological profile. Get personalized insights delivered to your inbox every morning.',
  applicationName: 'Astropal',
  keywords: ['astrology', 'horoscope', 'daily insights', 'cosmic guide', 'personal astrology', 'wellness', 'mindfulness'],
  authors: [{ name: 'Astropal Team' }],
  creator: 'Astropal',
  publisher: 'Astropal',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Astropal',
    title: 'Astropal - Your Personal Cosmic Guide',
    description: 'Transform your daily routine with cosmic wisdom tailored to your unique astrological profile.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Astropal - Your Personal Cosmic Guide'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astropal - Your Personal Cosmic Guide',
    description: 'Transform your daily routine with cosmic wisdom tailored to your unique astrological profile.',
    images: [`${BASE_URL}/twitter-image.png`],
    creator: '@astropal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en': `${BASE_URL}/en`,
      'es': `${BASE_URL}/es`,
    },
  },
};

const locales = ['en', 'es'];

export async function generateStaticParams() {
  log('info', 'Generating static params', { locales });
  
  const params = locales.map((locale) => ({ locale }));
  
  log('info', 'Static params generated', { 
    params,
    count: params.length,
    buildTime: new Date().toISOString()
  });
  
  return params;
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const requestId = Math.random().toString(36).substring(7);
  
  log('info', 'Layout rendering', {
    requestId,
    locale,
    supportedLocales: locales,
    timestamp: new Date().toISOString()
  });

  // Validate locale with enhanced logging
  if (!locales.includes(locale)) {
    log('error', 'Invalid locale - triggering 404', {
      requestId,
      requestedLocale: locale,
      supportedLocales: locales,
      localeType: typeof locale,
      localeLength: locale?.length
    });
    
    // Log additional debugging info
    log('error', 'Locale validation failure details', {
      requestId,
      exactMatches: locales.map(l => ({ locale: l, matches: l === locale, comparison: `'${l}' === '${locale}'` })),
      trimmedLocale: locale?.trim(),
      normalizedLocale: locale?.toLowerCase(),
    });
    
    notFound();
  }

  let messages;
  try {
    log('debug', 'Loading messages for locale', { requestId, locale });
    messages = await getMessages();
    log('info', 'Messages loaded successfully', {
      requestId,
      locale,
      messageKeys: Object.keys(messages || {}),
      messageCount: Object.keys(messages || {}).length
    });
  } catch (error) {
    log('error', 'Failed to load messages', {
      requestId,
      locale,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Astropal",
    "description": "Your Personal Cosmic Guide",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  log('info', 'Layout render complete', {
    requestId,
    locale,
    hasMessages: !!messages,
    structuredDataUrl: structuredData.url,
    renderTime: new Date().toISOString()
  });

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={API_URL} />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <ErrorBoundary componentName="RootLayout">
          <Providers messages={messages} locale={locale}>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
} 