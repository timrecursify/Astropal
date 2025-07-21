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

const getApiDomain = () => {
  const domain = getDomain();
  return process.env.NEXT_PUBLIC_API_BASE_URL || `https://api.${domain}`;
};

const BASE_URL = `https://${getDomain()}`;
const API_URL = getApiDomain();

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Astropal',
    default: 'Astropal - Your Personal Cosmic Guide'
  },
  description: 'Discover personalized cosmic insights tailored to your unique astrological profile. Daily wisdom, weekly forecasts, and monthly guidance.',
  keywords: ['astrology', 'horoscope', 'cosmic', 'personal', 'insights', 'guidance'],
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
    url: BASE_URL,
    siteName: 'Astropal',
    title: 'Astropal - Your Personal Cosmic Guide',
    description: 'Discover personalized cosmic insights tailored to your unique astrological profile.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Astropal - Your Personal Cosmic Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astropal - Your Personal Cosmic Guide',
    description: 'Discover personalized cosmic insights tailored to your unique astrological profile.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en-US': `${BASE_URL}/en`,
      'es-ES': `${BASE_URL}/es`
    }
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
};

const locales = ['en', 'es'];

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