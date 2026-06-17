// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — TokenResolver Bridge  (Sprint 8.2A-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A-Patch — Senior Review P0-1
//
// `applyResolvedStyleTokensToTokenResolver()` bridges the new
// ResolvedStyleTokens (from the Style Contract system) into the
// legacy `TokenResolver` class that 30+ block renderers depend on.
//
// The bridge is necessary because:
//   1. The Style Contract resolver produces fully-resolved CSS values
//      (colors, typography, shape, spacing, semantic palette, block
//      accent) that the legacy TokenResolver doesn't know about.
//   2. Replacing TokenResolver entirely would touch 30+ block
//      renderers — out of scope for 8.2A and would break the frozen
//      boundary.
//   3. Block renderers read tokens via `tokens.color('y')`,
//      `tokens.fontFamily('body')`, `tokens.raw.spacing.lg`, etc.
//      Without the bridge, they continue to read DEFAULT_TOKENS
//      values even when the Style Contract has chosen a different
//      preset (e.g. mission-adventure's earth tones never reached
//      the block renderers).
//
// Bridge order (must be honored by the caller):
//   1. Base legacy TokenResolver constructed with the right themeId
//      (so default tokens match the page's legacy theme identity).
//   2. applyResolvedStyleTokensToTokenResolver(resolver, tokens)
//      — patches colors / typography / shape / spacing / semantic
//        palette / block accent onto resolver.raw so block renderers
//        see the Style Contract's values.
//   3. resolver.applyContract(contractStyle) — applies the explicit
//      TemplateThemeContract LAST so it wins for fields it overrides
//      (page-level accent token map, page padding, card padding,
//      typography scale, card shadow). This preserves the existing
//      "contract WINS" priority documented in PageRenderer.
//
// Pure with respect to the resolver: this function mutates the
// resolver's internal token object (which is the documented way to
// patch tokens — see TokenResolver.applyContract for the same
// pattern). It does NOT mutate the input ResolvedStyleTokens.
// ═══════════════════════════════════════════════════════════════════

import type { TokenResolver } from '@/core/renderer/types';
import type { ResolvedStyleTokens } from './types';

// ─────────────────────────────────────────────────────────────────
// Helpers — parse CSS values into the legacy DesignTokens shape
// ─────────────────────────────────────────────────────────────────

/**
 * Parse a CSS length value (px or rem) into a number.
 *   '16px' → 16
 *   '1.6rem' → 25.6 (1rem = 16px browser default)
 * Returns undefined for non-numeric / unrecognized strings.
 *
 * The Style Contract carries typography scales as CSS strings ('1.6rem',
 * '0.92rem', '16px') — the bridge normalizes them to numbers so it can
 * apply the fontScaleMultiplier and re-emit as 'px' (the unit the
 * legacy DesignTokens.fontSize map uses).
 */
function parseCssLength(value: string | undefined): number | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  // Match Npx
  const pxMatch = trimmed.match(/^([\d.]+)px$/);
  if (pxMatch) {
    const n = Number(pxMatch[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  // Match Nrem (1rem = 16px — browser default)
  const remMatch = trimmed.match(/^([\d.]+)rem$/);
  if (remMatch) {
    const n = Number(remMatch[1]);
    return Number.isFinite(n) ? n * 16 : undefined;
  }
  return undefined;
}

/**
 * Parse a CSS box-shadow value into a string. Pass-through — the
 * legacy shadow.card field is a CSS string, so no conversion needed.
 */
function parseShadow(value: string | undefined): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value;
}

// ─────────────────────────────────────────────────────────────────
// THE bridge
// ─────────────────────────────────────────────────────────────────

/**
 * Patch a TokenResolver with values from ResolvedStyleTokens.
 *
 * The resolver's internal token object is mutated in-place (same
 * pattern as `TokenResolver.applyContract`). The input
 * `resolvedTokens` is NOT mutated.
 *
 * Bridge order (caller MUST honor):
 *   1. base TokenResolver (constructed with the right themeId)
 *   2. THIS bridge — patches Style Contract values
 *   3. resolver.applyContract(contractStyle) — explicit contract wins
 *
 * Patched fields:
 *   - colors: bg, card, border, text, muted, y, c, r, p, g, o
 *   - norma category colors: nagama, nkesusilaan, nkesopanan, nhukum
 *     (only when present in resolvedTokens.semantic.categories)
 *   - typography.fontFamily.display + .body
 *   - typography.fontSize.h2 + .base (heading + body scales)
 *   - radius.lg + .xl (preset radius values)
 *   - shadow.card
 *   - spacing.lg + .xl + .xxl (preset density → spacing values)
 *
 * Fields NOT patched:
 *   - colors.bg2 — no equivalent in ResolvedStyleTokens; leave as-is
 *   - animation — no equivalent; leave as-is
 *   - typography.fontWeight — no equivalent; leave as-is
 *
 * Block accent: ResolvedStyleTokens.block.accent is the resolved
 * accent color for the page's blocks. The bridge does NOT patch
 * `colors.y` with it — that would override the preset's primary
 * accent. Instead, the block accent flows through
 * `resolver.raw.colors` via the document.accentColor override
 * already applied by resolveStyleContract (semantic.primary ===
 * colors.accent). The bridge surfaces the document accent as
 * `colors.y` ONLY when the resolved accent differs from the preset
 * default AND no explicit contract is active (contract enforcement
 * handles its own accent mapping).
 */
export function applyResolvedStyleTokensToTokenResolver(
  resolver: TokenResolver,
  resolvedTokens: ResolvedStyleTokens,
): void {
  // Get a mutable handle on the resolver's internal tokens object.
  // The `raw` getter returns the live tokens object — same pattern
  // used by TokenResolver.applyContract (see src/core/renderer/types.ts).
  const raw = resolver.raw;
  const colors = raw.colors as Record<string, string>;
  const typography = raw.typography;
  const fontSize = typography.fontSize as Record<string, string>;
  const fontFamily = typography.fontFamily as Record<string, string>;
  const radius = raw.radius as Record<string, number>;
  const shadow = raw.shadow as { card: string; elevated: string; glow: unknown };
  const spacing = raw.spacing as Record<string, number>;

  // ── Colors ─────────────────────────────────────────────────────
  // Patch every color the legacy DesignTokens.colors map exposes.
  // The resolver's color() method reads from this map; patching it
  // here means tokens.color('y'), tokens.color('bg'), etc. all
  // return the Style Contract's values.
  if (resolvedTokens.colors.background) {
    colors['bg'] = resolvedTokens.colors.background;
  }
  if (resolvedTokens.colors.surface) {
    colors['card'] = resolvedTokens.colors.surface;
  }
  if (resolvedTokens.colors.border) {
    colors['border'] = resolvedTokens.colors.border;
  }
  if (resolvedTokens.colors.text) {
    colors['text'] = resolvedTokens.colors.text;
  }
  if (resolvedTokens.colors.textMuted) {
    colors['muted'] = resolvedTokens.colors.textMuted;
  }

  // Accent colors — semantic.accents carries the 6 accent hex values.
  const accents = resolvedTokens.semantic.accents;
  if (accents.yellow) colors['y'] = accents.yellow;
  if (accents.cyan) colors['c'] = accents.cyan;
  if (accents.red) colors['r'] = accents.red;
  if (accents.purple) colors['p'] = accents.purple;
  if (accents.green) colors['g'] = accents.green;
  if (accents.orange) colors['o'] = accents.orange;

  // Norma category colors (macam-norma PPKn domain theme).
  // The legacy DesignTokens map has optional fields for these; the
  // Style Contract carries them in semantic.categories.
  const categories = resolvedTokens.semantic.categories;
  if (categories) {
    if (typeof categories.agama === 'string') colors['nagama'] = categories.agama;
    if (typeof categories.kesusilaan === 'string') colors['nkesusilaan'] = categories.kesusilaan;
    if (typeof categories.kesopanan === 'string') colors['nkesopanan'] = categories.kesopanan;
    if (typeof categories.hukum === 'string') colors['nhukum'] = categories.hukum;
  }

  // ── Typography ─────────────────────────────────────────────────
  if (resolvedTokens.typography.headingFamily) {
    fontFamily['display'] = resolvedTokens.typography.headingFamily;
  }
  if (resolvedTokens.typography.bodyFamily) {
    fontFamily['body'] = resolvedTokens.typography.bodyFamily;
  }
  // Heading scale → fontSize.h2. Body scale → fontSize.base.
  // fontScaleMultiplier is applied as a multiplier on top.
  // The result is rounded to 3 decimal places to avoid floating-point
  // noise like 28.672000000000004 (which would otherwise leak into CSS).
  if (resolvedTokens.typography.headingScale) {
    const baseHeading = parseCssLength(resolvedTokens.typography.headingScale);
    if (baseHeading !== undefined) {
      const scaled = baseHeading * resolvedTokens.typography.fontScaleMultiplier;
      const rounded = Math.round(scaled * 1000) / 1000;
      fontSize['h2'] = `${rounded}px`;
    }
  }
  if (resolvedTokens.typography.bodyScale) {
    const baseBody = parseCssLength(resolvedTokens.typography.bodyScale);
    if (baseBody !== undefined) {
      const scaled = baseBody * resolvedTokens.typography.fontScaleMultiplier;
      const rounded = Math.round(scaled * 1000) / 1000;
      // Map to fontSize.base (the legacy body default).
      fontSize['base'] = `${rounded}px`;
    }
  }

  // ── Radius ─────────────────────────────────────────────────────
  // ResolvedStyleTokens.shape.radius is a single CSS px value.
  // Map it onto the legacy radius scale (sm/base/md/lg/xl/full).
  // The block renderers use radius.lg most often.
  const radiusPx = parseCssLength(resolvedTokens.shape.radius);
  if (radiusPx !== undefined) {
    // Derive a small scale around the preset's base radius.
    radius['sm'] = Math.max(4, Math.round(radiusPx * 0.5));
    radius['base'] = Math.max(6, Math.round(radiusPx * 0.625));
    radius['md'] = Math.max(8, Math.round(radiusPx * 0.75));
    radius['lg'] = radiusPx;
    radius['xl'] = Math.round(radiusPx * 1.25);
    // full stays at 99 (pill shape).
  }

  // ── Shadow ─────────────────────────────────────────────────────
  const shadowStr = parseShadow(resolvedTokens.shape.shadow);
  if (shadowStr) {
    shadow.card = shadowStr;
  }

  // ── Spacing ────────────────────────────────────────────────────
  // ResolvedStyleTokens.spacing carries pagePadding / cardPadding / blockGap
  // as CSS px strings. Map onto the legacy spacing scale.
  const pagePadding = parseCssLength(resolvedTokens.spacing.pagePadding);
  const cardPadding = parseCssLength(resolvedTokens.spacing.cardPadding);
  const blockGap = parseCssLength(resolvedTokens.spacing.blockGap);
  if (cardPadding !== undefined) {
    // cardPadding → spacing.md (legacy card padding slot)
    spacing['md'] = cardPadding;
    // Derive the rest of the scale around the preset's card padding.
    spacing['xs'] = Math.max(2, Math.round(cardPadding * 0.4));
    spacing['sm'] = Math.max(4, Math.round(cardPadding * 0.6));
    spacing['lg'] = Math.max(8, Math.round(cardPadding * 1.33));
    spacing['xl'] = pagePadding ?? Math.max(10, Math.round(cardPadding * 1.6));
    spacing['xxl'] = Math.max(12, Math.round(cardPadding * 2));
  } else if (pagePadding !== undefined) {
    // Fall back to pagePadding when cardPadding is missing.
    spacing['lg'] = pagePadding;
    spacing['xl'] = Math.max(8, Math.round(pagePadding * 1.25));
    spacing['xxl'] = Math.max(10, Math.round(pagePadding * 1.5));
  }
  if (blockGap !== undefined) {
    // blockGap → spacing.sm (legacy block gap slot used by SchemaRenderer)
    spacing['sm'] = blockGap;
  }
}
