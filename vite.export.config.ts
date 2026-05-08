// ═══════════════════════════════════════════════════════════════════════
// VITE EXPORT CONFIG — Builds a single standalone HTML file
// Uses: React SSR + Tailwind CSS + vite-plugin-singlefile
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
    react(),
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
    'process.env': {},
  },
});
