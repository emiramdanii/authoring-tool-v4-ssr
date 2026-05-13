// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS — Preset Module Card
// ═══════════════════════════════════════════════════════════════════
// Colors are now sourced from primitive-tokens.ts to ensure
// consistency with the unified design system.

import { PRIMITIVES } from '@/core/themes/primitive-tokens';

export const T = {
  bg: PRIMITIVES.color.canvasBg,
  bg2: PRIMITIVES.color.canvasBg2,
  card: PRIMITIVES.color.canvasCard,
  y: PRIMITIVES.color.nagama,
  c: PRIMITIVES.color.cyan,
  r: PRIMITIVES.color.red,
  p: PRIMITIVES.color.purple,
  g: PRIMITIVES.color.green,
  o: PRIMITIVES.color.orange,
  text: '#e8f2ff',
  muted: '#6e90b5',
} as const;

// ═══════════════════════════════════════════════════════════════════
// GRADIENT MAP FOR HERO
// ═══════════════════════════════════════════════════════════════════

export const GRADIENTS: Record<string, string> = {
  sunset: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
  ocean: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a78bfa 100%)',
  forest: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #0ea5e9 100%)',
  royal: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f43f5e 100%)',
  fire: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
  aurora: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)',
};
