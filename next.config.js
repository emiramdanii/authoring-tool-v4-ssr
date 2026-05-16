// @ts-check
// ── Next.js Configuration — Optimized for Lightweight Production ────
// Uses CommonJS (.js) so `require()` works for PWA plugin.
// This avoids needing TypeScript at runtime, allowing
// `npm prune --production` to safely remove devDependencies.
// ────────────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── REMOVED: output: "standalone" ──────────────────────────────
  // standalone mode causes issues in container environments and
  // creates a duplicate .next/standalone directory (~646MB+).

  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,

  // ── Disable source maps in production ──────────────────────────
  productionBrowserSourceMaps: false,

  // ── Aggressive optimization ────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-icons',
      'xlsx',
    ],
  },
  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

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

/* eslint-disable @typescript-eslint/no-require-imports */

/** @type {(config: import('next').NextConfig) => import('next').NextConfig} */
const withPWA = isProd
  ? require('@ducanh2912/next-pwa').default({
      dest: 'public',
      disable: !isProd,
      register: false,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /^https?:\/\/.*\/$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'app-shell',
            expiration: { maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 },
          },
        },
        {
          urlPattern: /\/_next\/static\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'next-static',
            expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 60 * 60 },
          },
        },
        {
          urlPattern: /\/api\//,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    })
  : (config) => config;

module.exports = withPWA(nextConfig);
