import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost:8080',
    '.space.chatglm.site',
    '.space-z.ai',
  ],
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};

// ── PWA Configuration ────────────────────────────────────────────
// Only enable PWA in production builds to avoid dev-mode issues.
// Service worker caching strategies:
//   - App shell (HTML): CacheFirst
//   - Static assets (_next/static): CacheFirst with 30d expiry
//   - API routes: NetworkFirst with 10s timeout, fallback to cache
//   - Images: CacheFirst with 7d expiry

const isProd = process.env.NODE_ENV === 'production';

/* eslint-disable @typescript-eslint/no-require-imports */
const withPWA: (config: NextConfig) => NextConfig = isProd
  ? require('@ducanh2912/next-pwa').default({
      dest: 'public',
      disable: !isProd,
      register: false, // We register manually via our hook
      skipWaiting: true,
      runtimeCaching: [
        // App shell — CacheFirst (HTML navigation)
        {
          urlPattern: /^https?:\/\/.*\/$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'app-shell',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 24 * 60 * 60, // 1 day
            },
          },
        },
        // Static assets — CacheFirst with 30d expiry
        {
          urlPattern: /\/_next\/static\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'next-static',
            expiration: {
              maxEntries: 150,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },
        // API routes — NetworkFirst with 10s timeout
        {
          urlPattern: /\/api\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60, // 1 day
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Images — CacheFirst with 7d expiry
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Fonts — CacheFirst with 1yr expiry
        {
          urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    })
  : (config: NextConfig) => config;

export default withPWA(withBundleAnalyzer(nextConfig));
