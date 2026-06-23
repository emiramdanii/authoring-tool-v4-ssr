// ═══════════════════════════════════════════════════════════════════════
// VITE EXPORT CONFIG — Builds a single standalone HTML file
// Uses: React SSR + Tailwind CSS + vite-plugin-singlefile
//
// V5-BLOCKER-FIX-01B: Added jsxRuntime 'classic' override to prevent
// the jsxDEV mismatch bug. Previously, the bundle imported from
// react/jsx-dev-runtime but ran with NODE_ENV=production, causing
// jsxDEV = void 0 and a "is not a function" TypeError at render time.
// ═══════════════════════════════════════════════════════════════════════

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import tailwindcss from '@tailwindcss/postcss';
import postcssNested from 'postcss-nested';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/export'),
  plugins: [
    react({
      // V5-BLOCKER-FIX-01B: Force production JSX runtime (react/jsx-runtime)
      // instead of dev runtime (react/jsx-dev-runtime). The dev runtime
      // exports jsxDEV=void 0 in production mode, causing a TypeError.
      // With 'automatic' runtime + NODE_ENV=production, Babel should
      // use jsx (not jsxDEV). This explicit config ensures correctness.
      babel: {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-react', {
            runtime: 'automatic',
            // Force prod JSX (jsx, not jsxDEV) regardless of NODE_ENV
            development: false,
          }],
        ],
      },
    }),
    viteSingleFile(),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        postcssNested(),
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'export-output'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': {},
  },
});
