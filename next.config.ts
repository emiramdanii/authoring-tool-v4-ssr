import type { NextConfig } from "next";

// ═══════════════════════════════════════════════════════════════════════
// SILSE — Next.js Configuration (Unified)
// Single source of truth — next.config.js has been DELETED.
// ═══════════════════════════════════════════════════════════════════════

const isProd = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ── NO standalone output — causes instability in sandbox ──────
  // output: "standalone",

  typescript: {
    // Skip type-checking during build for faster compilation in sandbox
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,

  // ── Disable source maps in production ──────────────────────────
  productionBrowserSourceMaps: false,

  // ── Aggressive optimization ────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'xlsx',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
    ],
    optimizeCss: true,
  },

  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  // ── Webpack/Turbopack optimization ──────────────────────────────
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            // ── Granular vendor splitting (replaces monolithic 'vendors' chunk) ──
            // Core framework: React, ReactDOM, Next.js runtime — changes rarely
            framework: {
              test: /[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 40,
            },
            // UI libraries: Radix, Lucide — moderate size, changes with UI updates
            ui: {
              test: /[\\/](@radix-ui|lucide-react|@floating-ui|framer-motion)[\\/]/,
              name: 'ui-vendor',
              chunks: 'all',
              priority: 30,
            },
            // State & utilities: Zustand, Zod, Immer, clsx — small, stable
            utils: {
              test: /[\\/](zustand|zod|immer|clsx|tailwind-merge|nanoid)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 20,
            },
            // All other node_modules — fallback
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },

  // ── Image optimization — minimal for testing ────────────────────
  images: {
    disableStaticImages: true,
    minimumCacheTTL: 60,
  },

  allowedDevOrigins: [
    'localhost:8080',
    '127.0.0.1:3000',
    'localhost:3000',
    '127.0.0.1',
    'localhost',
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
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // ── Connection: close — prevent keep-alive memory leak in constrained containers ──
        // Without this, each keep-alive connection holds V8 memory that doesn't get released,
        // causing the server to exceed container memory limits and get OOM-killed.
        { key: 'Connection', value: 'close' },
      ],
    }];
  },
};

// ── PWA Configuration ────────────────────────────────────────────
// Only enable PWA in production builds to avoid dev-mode issues.
// Service worker caching strategies for offline support.

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
              maxAgeSeconds: 24 * 60 * 60,
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
              maxAgeSeconds: 30 * 24 * 60 * 60,
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
              maxAgeSeconds: 24 * 60 * 60,
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
              maxAgeSeconds: 7 * 24 * 60 * 60,
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
              maxAgeSeconds: 365 * 24 * 60 * 60,
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
