const withNextIntl = require('next-intl/plugin')('./app/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Disable ESLint during builds in CI/production
    ignoreDuringBuilds: process.env.CI || process.env.NODE_ENV === 'production',
  },
  // Disable static export for easier deployment
  output: undefined,
  trailingSlash: false,
  images: {
    unoptimized: false
  },
  
  // Optimize for Cloudflare Pages deployment
  experimental: {
    webpackBuildWorker: false, // Disable to reduce memory usage
  },
  
  // Configure webpack for smaller builds
  webpack: (config, { buildId, dev, isServer }) => {
    // Disable caching for production builds to avoid large cache files
    if (!dev) {
      config.cache = false;
    }
    
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization?.splitChunks,
        cacheGroups: {
          ...config.optimization?.splitChunks?.cacheGroups,
          default: false,
          vendors: false,
          // Create smaller chunks
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
  
  // Security headers
  async headers() {
    // Get domain and API URLs from environment variables
    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'astropal.io';
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || `https://api.${domain}`;
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              `connect-src 'self' ${apiUrl} https://api.stripe.com`,
              "frame-src 'self' https://js.stripe.com",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Control permissions
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=(self)',
              'usb=()',
              'midi=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()'
            ].join(', ')
          }
        ]
      }
    ];
  }
};

module.exports = withNextIntl(nextConfig);