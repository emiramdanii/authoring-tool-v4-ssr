import type { LayoutVariant } from './types';

// ═══════════════════════════════════════════════════════════════════
// LAYOUT VARIANTS
// ═══════════════════════════════════════════════════════════════════

export const LAYOUT_VARIANTS = [
  { id: 'A' as const, label: 'Default', icon: '📐', desc: 'Tampilan standar grid' },
  { id: 'B' as const, label: 'Compact', icon: '📋', desc: 'Tata letak ringkas' },
  { id: 'C' as const, label: 'Visual', icon: '🎨', desc: 'Kartu besar visual' },
  { id: 'D' as const, label: 'Minimal', icon: '📝', desc: 'Fokus teks minimalis' },
] as const;

export type { LayoutVariant };
