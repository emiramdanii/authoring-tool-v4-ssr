// ═══════════════════════════════════════════════════════════════════
// RENDERER TYPES — Shared types for the renderer system
// ═══════════════════════════════════════════════════════════════════
// Extracted from SchemaRenderer.tsx to avoid circular dependencies.
// Block renderers import from this file instead of SchemaRenderer.

import { alpha } from '@/lib/color-palette';
import type { DesignTokens } from '../themes/tokens';
import { resolveTokens } from '../themes/tokens';

// ═══════════════════════════════════════════════════════════════════
// RENDER MODE
// ═══════════════════════════════════════════════════════════════════

export type SchemaRenderMode = 'canvas' | 'preview' | 'export';

// ═══════════════════════════════════════════════════════════════════
// TOKEN RESOLVER — Maps token keys to actual CSS values
// ═══════════════════════════════════════════════════════════════════

export class TokenResolver {
  private tokens: DesignTokens;
  private _themeId: string | undefined;

  constructor(themeId?: string) {
    this._themeId = themeId;
    this.tokens = resolveTokens(themeId);
  }

  /** Whether the current theme is a dark theme */
  isDark(): boolean {
    const bg = this.color('bg');
    // Simple luminance check: if bg is dark, theme is dark
    if (!bg || !bg.startsWith('#') || bg.length < 7) return true; // Default to dark
    const r = parseInt(bg.slice(1, 3), 16);
    const g = parseInt(bg.slice(3, 5), 16);
    const b = parseInt(bg.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  /** Get the theme ID */
  get themeId(): string | undefined {
    return this._themeId;
  }

  /** Minimum text opacity — enforces WCAG AA readability.
   *  Light themes need higher minimum opacity because dark text on light bg
   *  at low opacity has poor contrast. Dark themes can use lower opacity
   *  because light text on dark bg is readable even at lower alpha.
   *
   *  Previously, muted(0.5) on light bg resulted in ~2.5:1 contrast —
   *  failing WCAG AA for all text sizes. This clamp ensures minimum 0.65
   *  opacity on light themes (~4.5:1 contrast for body text).
   */
  private minOpacity(a: number): number {
    return this.isDark() ? Math.max(a, 0.4) : Math.max(a, 0.65);
  }

  /** Muted text color — adapts to dark/light automatically
   *  Dark: uses 'muted' token, Light: uses 'muted' token (both are theme-appropriate)
   */
  muted(a: number = 1): string {
    return this.colorAlpha('muted', this.minOpacity(a));
  }

  /** Secondary text — slightly dimmer than main text
   *  Uses text color with reduced alpha
   */
  textSecondary(a: number = 0.8): string {
    return this.colorAlpha('text', this.minOpacity(a));
  }

  /** Subtle text — for hints, placeholders, captions
   *  Uses text color with low alpha
   */
  textSubtle(a: number = 0.55): string {
    return this.colorAlpha('text', this.minOpacity(a));
  }

  /** Get a color by token key (e.g., 'y' → '#f9c12e') */
  color(key: string): string {
    const colors = this.tokens.colors as Record<string, string>;
    return colors[key] || key; // Pass through if not a token key (already a hex)
  }

  /** Get color with alpha */
  colorAlpha(key: string, a: number): string {
    return alpha(this.color(key), a);
  }

  /** Get spacing value in px */
  spacing(key: keyof DesignTokens['spacing']): string {
    return `${this.tokens.spacing[key]}px`;
  }

  /** Get radius value in px */
  radius(key: keyof DesignTokens['radius']): string {
    return `${this.tokens.radius[key]}px`;
  }

  /** Get font family */
  fontFamily(key: keyof DesignTokens['typography']['fontFamily']): string {
    // Use CSS variables from next/font/google (defined in layout.tsx)
    // Falls back to the token value if CSS vars aren't available
    if (key === 'display') return 'var(--font-fredoka), Fredoka, cursive';
    if (key === 'body') return 'var(--font-nunito), Nunito, sans-serif';
    return this.tokens.typography.fontFamily[key];
  }

  /** Get font size */
  fontSize(key: keyof DesignTokens['typography']['fontSize']): string {
    return this.tokens.typography.fontSize[key];
  }

  /** Get raw tokens */
  get raw(): DesignTokens {
    return this.tokens;
  }

  /** Surface/card background — adapts to theme */
  surface(a: number = 1): string {
    return this.colorAlpha('card', a);
  }

  /** Subtle background for inset areas — rgba(255,255,255,N) on dark, rgba(0,0,0,N) on light */
  subtleBg(opacity: number): string {
    return this.isDark()
      ? `rgba(255,255,255,${opacity})`
      : `rgba(0,0,0,${opacity})`;
  }

  /** Subtle border — rgba(255,255,255,N) on dark, rgba(0,0,0,N) on light */
  subtleBorder(opacity: number): string {
    return this.isDark()
      ? `rgba(255,255,255,${opacity})`
      : `rgba(0,0,0,${opacity})`;
  }
}
