import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import Providers from '../../components/Providers';
import '../globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// Get domain from environment variables
const getDomain = () => {
  return process.env.NEXT_PUBLIC_DOMAIN || 'astropal.io';
};

// Get API base URL from environment variables
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
    const domain = getDomain();
    return `https://api.${domain}`;
  }
  
  return 'http://localhost:8787';
};

const BASE_URL = `https://${getDomain()}`;
const API_URL = getApiBaseUrl();

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
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

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
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
} 