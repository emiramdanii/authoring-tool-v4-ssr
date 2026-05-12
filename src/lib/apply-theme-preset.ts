// ═══════════════════════════════════════════════════════════════════
// APPLY THEME PRESET — Maps DesignTokens to CSS custom properties
// ═══════════════════════════════════════════════════════════════════
// When a user selects a theme preset, we resolve the full token set
// (merging with defaults) and write the values as inline CSS custom
// properties on document.documentElement.  Inline styles take
// precedence over both :root and .dark declarations, so the preset
// overrides the current light/dark base until explicitly cleared.

import {
  THEME_PRESETS,
  DEFAULT_TOKENS,
  resolveTokens,
  type DesignTokens,
} from '@/core/themes/tokens';

// ── localStorage key ─────────────────────────────────────────────
const STORAGE_KEY = 'mpi-theme-preset';

// ── Token color key → CSS custom property mapping ────────────────
// Each DesignToken color key can map to multiple --semantic-* vars.
// We also map to the shadcn/ui primitives where it makes sense so
// that popover/dialog surfaces pick up the preset too.

const COLOR_TO_CSS_VARS: Record<string, string[]> = {
  bg: [
    '--semantic-bg-app',
    '--semantic-canvas-bg',
  ],
  bg2: [
    '--semantic-bg-surface',
    '--semantic-canvas-bg2',
  ],
  card: [
    '--semantic-bg-elevated',
    '--semantic-canvas-card',
  ],
  border: [
    '--semantic-border-default',
    '--semantic-border-subtle',
  ],
  y: [
    '--semantic-accent',
    '--semantic-accent-hover',
    '--semantic-nav-active-text',
  ],
  c: [
    '--semantic-accent-secondary',
  ],
  r: [
    '--semantic-status-error',
  ],
  g: [
    '--semantic-status-success',
  ],
  p: [
    '--semantic-nav-active-border',
  ],
  text: [
    '--semantic-text-primary',
    '--semantic-canvas-text',
  ],
  muted: [
    '--semantic-text-secondary',
    '--semantic-text-muted',
    '--semantic-canvas-muted',
  ],
};

// Keep track of every CSS var we've ever set so we can clean up
const ALL_CSS_VARS = Object.values(COLOR_TO_CSS_VARS).flat();

// ── Public API ───────────────────────────────────────────────────

/**
 * Apply a theme preset by ID.
 * Resolves tokens (merging with defaults), then writes CSS custom
 * properties to document.documentElement.style.
 */
export function applyThemePreset(presetId: string): void {
  const tokens = resolveTokens(presetId);
  const root = document.documentElement;

  // Clear any previously set custom properties first
  for (const cssVar of ALL_CSS_VARS) {
    root.style.removeProperty(cssVar);
  }

  // Apply new values from resolved tokens
  const colors = tokens.colors;
  for (const [tokenKey, cssVars] of Object.entries(COLOR_TO_CSS_VARS)) {
    const value = colors[tokenKey as keyof typeof colors];
    if (value) {
      for (const cssVar of cssVars) {
        root.style.setProperty(cssVar, value);
      }
    }
  }

  // Persist selection
  localStorage.setItem(STORAGE_KEY, presetId);
}

/**
 * Reset to the base theme (remove all inline overrides).
 * The next paint will fall back to the :root / .dark declarations.
 */
export function resetThemePreset(): void {
  const root = document.documentElement;
  for (const cssVar of ALL_CSS_VARS) {
    root.style.removeProperty(cssVar);
  }
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Read the stored preset ID from localStorage (client-only).
 */
export function getStoredPresetId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Extract swatch colors for a preset (used in the picker UI).
 * Returns 4 representative colors: background, accent, primary, secondary.
 */
export function getPresetSwatchColors(presetId: string): {
  bg: string;
  accent: string;
  primary: string;
  secondary: string;
} {
  const tokens = resolveTokens(presetId);
  return {
    bg: tokens.colors.bg,
    accent: tokens.colors.y,
    primary: tokens.colors.c,
    secondary: tokens.colors.p,
  };
}

/**
 * Check whether a given preset ID is valid.
 */
export function isValidPreset(presetId: string): boolean {
  return THEME_PRESETS.some(p => p.id === presetId);
}
