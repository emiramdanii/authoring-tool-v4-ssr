// ═══════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES — Shared helpers for the export pipeline
// ═══════════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '@/core/schema/types';
import { PRIMITIVES } from '@/core/themes/primitive-tokens';

// ── Color token map (imported from primitive-tokens.ts + semantic additions) ──
// This replaces the previous hardcoded TOKEN_COLORS that duplicated values.
// Now a single source of truth: PRIMITIVES.color
export const TOKEN_COLORS: Record<string, string> = {
  // Accent colors — from PRIMITIVES
  y: PRIMITIVES.color.yellow,
  c: PRIMITIVES.color.cyan,
  r: PRIMITIVES.color.red,
  p: PRIMITIVES.color.purple,
  g: PRIMITIVES.color.green,
  o: PRIMITIVES.color.orange,
  
  // Norma colors — from PRIMITIVES
  nagama: PRIMITIVES.color.nagama,
  nkesusilaan: PRIMITIVES.color.nkesusilaan,
  nkesopanan: PRIMITIVES.color.nkesopanan,
  nhukum: PRIMITIVES.color.nhukum,
  
  // Semantic — dark mode defaults (export defaults to dark theme)
  bg: PRIMITIVES.color.canvasBg,
  bg2: PRIMITIVES.color.canvasBg2,
  card: PRIMITIVES.color.canvasCard,
  text: '#e8f2ff',
  muted: '#6e90b5',
  border: 'rgba(255,255,255,.09)',
  
  // Semantic — light mode (used by prefers-color-scheme)
  'light-bg': '#f8fafc',
  'light-bg2': '#f1f5f9',
  'light-card': '#ffffff',
  'light-text': '#0f172a',
  'light-muted': '#475569',
  'light-border': 'rgba(0,0,0,.06)',
};

export function resolveColor(tokenOrHex: string | undefined, fallback: string): string {
  if (!tokenOrHex) return fallback;
  if (tokenOrHex.startsWith('#') || tokenOrHex.startsWith('rgb')) return tokenOrHex;
  return TOKEN_COLORS[tokenOrHex] || fallback;
}

/** Resolve a semantic color with light/dark mode support.
 *  When `theme` is 'auto', the CSS will handle it via prefers-color-scheme.
 *  This helper is for JS-generated content that needs explicit colors. */
export function resolveSemanticColor(
  key: string,
  theme: 'dark' | 'light' = 'dark',
): string {
  if (theme === 'light') {
    const lightKey = `light-${key}`;
    return TOKEN_COLORS[lightKey] || TOKEN_COLORS[key] || key;
  }
  return TOKEN_COLORS[key] || key;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Type for the recursive renderBlock function ────────────────────
export type RenderBlockFn = (block: SchemaBlock) => string;
