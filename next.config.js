// @ts-check
// ── Next.js Configuration — Ultra-Lightweight for Sandbox Testing ────
// Optimized for minimal memory/CPU footprint in constrained environments.
// Uses CommonJS (.js) so `require()` works for PWA plugin.
// ────────────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip type-checking during build for faster compilation
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,

  // ── Standalone output for minimal memory footprint ───────────
  output: 'standalone',

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
    // Optimize CSS
    optimizeCss: true,
  },
  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  // ── Webpack/Turbopack optimization ──────────────────────────────
  turbopack: {},
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    // Externalize heavy server-only packages
    if (isServer) {
      config.externals = config.externals || [];
      // These are only used in API routes — no need to bundle
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
    '.space.chatglm.site',
    '.space-z.ai',
  ],
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    }];
  },
};

// ── PWA Configuration ────────────────────────────────────────────
// DISABLED for lightweight testing — re-enable for production
/* eslint-disable @typescript-eslint/no-require-imports */

/** @type {(config: import('next').NextConfig) => import('next').NextConfig} */
const withPWA = (config) => config; // PWA disabled for testing

module.exports = withPWA(nextConfig);
