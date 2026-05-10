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

  constructor(themeId?: string) {
    this.tokens = resolveTokens(themeId);
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
}
