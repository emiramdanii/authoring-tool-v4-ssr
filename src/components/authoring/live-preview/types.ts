// ═══════════════════════════════════════════════════════════════
// TYPES for Live Preview
// ═══════════════════════════════════════════════════════════════

export type PreviewMode = 'canvas' | 'template' | 'legacy' | 'unified' | 'schema';
export type DeviceMode = 'mobile' | 'tablet' | 'desktop';
export type LayoutTheme = 'colorful' | 'neon' | 'glass' | 'default' | 'minimal';

// ── Simplified mode display names (8.4) ──────────────────────
// Primary modes shown in the simplified selector:
//   'unified' → "Preview" (default, best for most users)
//   'schema'  → "Dengan Skema" (when a preset is active)
// Advanced modes (canvas, template, legacy) hidden behind Advanced submenu
