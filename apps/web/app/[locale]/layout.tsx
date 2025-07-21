import { getMessages } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Providers from '@/components/Providers';
import '../globals.css';
import { Metadata, Viewport } from 'next';

// Mobile-optimized viewport configuration
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B5CF6' },
    { media: '(prefers-color-scheme: dark)', color: '#8B5CF6' }
  ],
  colorScheme: 'dark light'
};

// SEO and social media metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://astropal.io'),
  title: {
    template: '%s | Astropal - Personalized Astrology Newsletter',
    default: 'Astropal - Your Daily Cosmic Insights & Personalized Astrology'
  },
  description: 'Get personalized daily astrology insights delivered to your inbox. Choose from 4 unique perspectives: Calm, Knowledge, Success, or Evidence-based astrology.',
  keywords: [
    'astrology',
    'horoscope',
    'personalized astrology',
    'daily horoscope',
    'birth chart',
    'cosmic insights',
    'astrology newsletter',
    'zodiac signs',
    'planetary positions',
    'astrology reading'
  ],
  authors: [{ name: 'Astropal Team' }],
  creator: 'Astropal',
  publisher: 'Astropal',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://astropal.io',
    siteName: 'Astropal',
    title: 'Astropal - Your Daily Cosmic Insights & Personalized Astrology',
    description: 'Get personalized daily astrology insights delivered to your inbox. Choose from 4 unique perspectives: Calm, Knowledge, Success, or Evidence-based astrology.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Astropal - Personalized Astrology Newsletter'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astropal - Your Daily Cosmic Insights',
    description: 'Personalized astrology newsletter with 4 unique perspectives delivered daily.',
    images: ['/twitter-image.jpg'],
    creator: '@astropal'
  },
  verification: {
    google: 'your-google-verification-code',
    other: {
      'msvalidate.01': 'your-bing-verification-code'
    }
  },
  alternates: {
    canonical: 'https://astropal.io',
    languages: {
      'en-US': 'https://astropal.io/en',
      'es-ES': 'https://astropal.io/es'
    }
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#8B5CF6' }
    ]
  }
};

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Enable static rendering by setting the locale
  setRequestLocale(locale);
  
  // Get messages for this locale
  const messages = await getMessages();

  return (
    <html 
      lang={locale} 
      className="scroll-smooth"
      style={{ backgroundColor: '#000000', color: '#ffffff' }}
      suppressHydrationWarning
    >
      <head>
        {/* Additional mobile optimization meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#8B5CF6" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.astropal.io" />
        
        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Astropal",
              "description": "Personalized daily astrology newsletter with 4 unique perspectives",
              "url": "https://astropal.io",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "author": {
                "@type": "Organization",
                "name": "Astropal"
              }
            })
          }}
        />
      </head>
      <body 
        className="overflow-x-hidden antialiased"
        style={{ 
          backgroundColor: '#000000', 
          color: '#ffffff', 
          minHeight: '100vh',
          WebkitTapHighlightColor: 'transparent',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
      >
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
        
        {/* Performance and accessibility optimizations */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Optimize touch events for mobile
              if ('ontouchstart' in window) {
                document.body.classList.add('touch-device');
              }
              
              // Prevent zoom on input focus (mobile)
              const preventZoom = () => {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                  viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
                }
              };
              
              // Re-enable zoom after input blur
              const enableZoom = () => {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                  viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5');
                }
              };
              
              // Apply to all inputs
              document.addEventListener('focusin', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                  preventZoom();
                }
              });
              
              document.addEventListener('focusout', enableZoom);
            `
          }}
        />
      </body>
    </html>
  );
}

// Generate routes for all supported locales
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
} 