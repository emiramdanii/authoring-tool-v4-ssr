// ═══════════════════════════════════════════════════════════════════
// PRIMITIVE TOKENS — Raw values, no semantic meaning
// ═══════════════════════════════════════════════════════════════════
// These are the lowest-level values in the design system.
// They should NEVER be consumed directly by components — instead,
// reference them through semantic-tokens.ts so theme switching works.

export const PRIMITIVES = {
  color: {
    // Slate scale (for UI chrome)
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    slate950: '#020617',

    // Accent colors (from existing DesignTokens)
    yellow: '#fbbf24',
    yellowDark: '#f59e0b',
    cyan: '#3ecfcf',
    red: '#ff6b6b',
    purple: '#a78bfa',
    green: '#34d399',
    orange: '#fb923c',

    // Norma-specific (macam-norma presets)
    nagama: '#f9c12e',
    nkesusilaan: '#ff6b6b',
    nkesopanan: '#3ecfcf',
    nhukum: '#a78bfa',

    // Semantic quick-access (derived)
    success: '#34d399',
    successDark: '#16a34a',
    warning: '#f59e0b',
    error: '#f87171',
    errorDark: '#dc2626',
    info: '#3b82f6',

    // Canvas background — dark blue palette (matches --semantic-canvas-bg in dark mode).
    // The app defaults to dark mode, so DEFAULT_TOKENS must use dark values.
    // Previously used light values (#f8fafc) which caused "canvas putih" bug:
    // the TokenResolver reads JS tokens (not CSS vars), so even in dark mode
    // the canvas rendered with white background, making cards invisible.
    canvasBg: '#0e1c2f',
    canvasBg2: '#13243a',
    canvasCard: '#182d45',
  },
  spacing: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
  },
  radius: {
    none: 0, sm: 6, md: 8, lg: 10, xl: 12, '2xl': 16, full: 9999,
  },
  fontSize: {
    xs: '0.6875rem',  // 11px
    sm: '0.75rem',    // 12px
    base: '0.8125rem', // 13px
    md: '0.875rem',   // 14px
    lg: '1rem',       // 16px
    xl: '1.125rem',   // 18px
    '2xl': '1.375rem', // 22px
    '3xl': '1.75rem',  // 28px
  },
  fontWeight: {
    normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900,
  },
} as const;

// Type helper for accessing primitive values
export type PrimitiveColor = typeof PRIMITIVES.color;
export type PrimitiveSpacing = typeof PRIMITIVES.spacing;
export type PrimitiveRadius = typeof PRIMITIVES.radius;
export type PrimitiveFontSize = typeof PRIMITIVES.fontSize;
export type PrimitiveFontWeight = typeof PRIMITIVES.fontWeight;
