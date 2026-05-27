// ═══════════════════════════════════════════════════════════════════
// SEMANTIC TOKENS — Functional roles in the UI
// ═══════════════════════════════════════════════════════════════════
// These map primitive values to roles, enabling theme switching.
// Components should reference these (or the CSS variable equivalents)
// rather than reaching into PRIMITIVES directly.
//
// Architecture (Sprint 1 Foundation):
//   - SEMANTIC_TOKENS = LIGHT mode defaults (matches :root in globals.css)
//   - DARK_MODE_OVERRIDES = dark mode overrides (matches .dark in globals.css)
//   - Both toggled by single `.dark` class via next-themes ThemeProvider

import { PRIMITIVES } from './primitive-tokens';

// ═══════════════════════════════════════════════════════════════════
// LIGHT MODE (Default — matches :root in globals.css)
// ═══════════════════════════════════════════════════════════════════

export const SEMANTIC_TOKENS = {
  color: {
    // App chrome (light mode)
    'bg-app': PRIMITIVES.color.slate50,
    'bg-surface': '#ffffff',
    'bg-elevated': PRIMITIVES.color.slate100,
    'bg-overlay': 'rgba(0,0,0,0.3)',

    // Text
    'text-primary': PRIMITIVES.color.slate900,
    'text-secondary': PRIMITIVES.color.slate500,
    'text-muted': PRIMITIVES.color.slate400,
    'text-inverse': PRIMITIVES.color.slate50,

    // Borders
    'border-default': PRIMITIVES.color.slate200,
    'border-subtle': PRIMITIVES.color.slate100,
    'border-strong': PRIMITIVES.color.slate300,

    // Interactive
    'accent-primary': PRIMITIVES.color.yellow,
    'accent-primary-dark': PRIMITIVES.color.yellowDark,
    'accent-secondary': PRIMITIVES.color.cyan,

    // Status (darker variants for light mode readability)
    'status-success': PRIMITIVES.color.successDark,
    'status-warning': PRIMITIVES.color.warning,
    'status-error': PRIMITIVES.color.errorDark,
    'status-info': PRIMITIVES.color.info,

    // Navigation
    'nav-active-bg': 'rgba(251,191,36,0.1)',
    'nav-active-border': 'rgba(251,191,36,0.3)',
    'nav-active-text': PRIMITIVES.color.yellowDark,

    // Glass
    'glass-bg': 'rgba(255,255,255,0.8)',
    'glass-bg-strong': 'rgba(255,255,255,0.95)',
    'glass-border': PRIMITIVES.color.slate200,

    // Canvas (lighter palette for light mode)
    'canvas-bg': '#f8fafc',
    'canvas-bg2': '#f1f5f9',
    'canvas-card': '#ffffff',
    'canvas-text': '#0f172a',
    'canvas-muted': '#475569',
  },
  spacing: {
    'panel-collapsed': 60,
    'panel-default': 240,
    'panel-expanded': 320,
    'toolbar-height': 48,
    'statusbar-height': 28,
    'sidebar-width': 48,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// DARK MODE OVERRIDES — Swap semantic tokens for dark theme
// (matches .dark selector in globals.css)
// ═══════════════════════════════════════════════════════════════════

export const DARK_MODE_OVERRIDES = {
  color: {
    'bg-app': PRIMITIVES.color.slate900,
    'bg-surface': PRIMITIVES.color.slate800,
    'bg-elevated': PRIMITIVES.color.slate700,
    'bg-overlay': 'rgba(0,0,0,0.5)',

    'text-primary': PRIMITIVES.color.slate50,
    'text-secondary': PRIMITIVES.color.slate400,
    'text-muted': PRIMITIVES.color.slate500,
    'text-inverse': PRIMITIVES.color.slate900,

    'border-default': 'rgba(148,163,184,0.15)',
    'border-subtle': 'rgba(148,163,184,0.08)',
    'border-strong': 'rgba(148,163,184,0.25)',

    // Status (brighter variants for dark mode readability)
    'status-success': PRIMITIVES.color.success,
    'status-warning': PRIMITIVES.color.warning,
    'status-error': PRIMITIVES.color.error,
    'status-info': PRIMITIVES.color.info,

    'nav-active-bg': 'rgba(251,191,36,0.15)',
    'nav-active-border': 'rgba(251,191,36,0.2)',
    'nav-active-text': PRIMITIVES.color.yellow,

    'glass-bg': 'rgba(30,41,59,0.75)',
    'glass-bg-strong': 'rgba(30,41,59,0.9)',
    'glass-border': 'rgba(148,163,184,0.15)',

    'canvas-bg': PRIMITIVES.color.canvasBg,
    'canvas-bg2': PRIMITIVES.color.canvasBg2,
    'canvas-card': PRIMITIVES.color.canvasCard,
    'canvas-text': '#e8f2ff',
    'canvas-muted': '#6e90b5',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — LIGHT_MODE_OVERRIDES alias
// ═══════════════════════════════════════════════════════════════════
// Previously, SEMANTIC_TOKENS was dark-default and LIGHT_MODE_OVERRIDES
// contained light values. Now it's inverted. This alias preserves
// backward compatibility for any consumers that import LIGHT_MODE_OVERRIDES.
/** @deprecated Use DARK_MODE_OVERRIDES instead — the base SEMANTIC_TOKENS is now light-mode. */
export const LIGHT_MODE_OVERRIDES = SEMANTIC_TOKENS;

// Type helpers
export type SemanticColorKey = keyof typeof SEMANTIC_TOKENS.color;
export type SemanticSpacingKey = keyof typeof SEMANTIC_TOKENS.spacing;
