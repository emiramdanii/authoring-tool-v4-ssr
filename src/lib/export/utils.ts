// ═══════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES — Shared helpers for the export pipeline
// ═══════════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '@/core/schema/types';

// ── Color token map (matches primitive-tokens.ts) ─────────────────
export const TOKEN_COLORS: Record<string, string> = {
  y: '#fbbf24',
  c: '#3ecfcf',
  r: '#ff6b6b',
  p: '#a78bfa',
  g: '#34d399',
  o: '#fb923c',
  bg: '#0e1c2f',
  bg2: '#13243a',
  card: '#182d45',
  text: '#e8f2ff',
  muted: '#6e90b5',
  border: 'rgba(255,255,255,.09)',
  // Norma colors
  nagama: '#f9c12e',
  nkesusilaan: '#ff6b6b',
  nkesopanan: '#3ecfcf',
  nhukum: '#a78bfa',
};

export function resolveColor(tokenOrHex: string | undefined, fallback: string): string {
  if (!tokenOrHex) return fallback;
  if (tokenOrHex.startsWith('#') || tokenOrHex.startsWith('rgb')) return tokenOrHex;
  return TOKEN_COLORS[tokenOrHex] || fallback;
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
