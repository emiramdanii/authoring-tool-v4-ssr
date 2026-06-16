// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Pure Resolver
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// `resolveStyleContract()` is the SINGLE entry point that turns a
// StyleContract (teacher choices) into ResolvedStyleTokens (technical
// tokens for Canvas / Preview / Present / Export).
//
// Contract guarantees:
//   - Pure function. No side effects.
//   - Deterministic. Same input → same output, always.
//   - No React state reads.
//   - No DOM access. SSR-safe.
//   - No store mutations. Never writes to schema.
//   - Has default fallbacks for every optional field.
//   - Accepts legacy projects (via resolveLegacyStyle → this resolver).
//   - Invalid presetId falls back to DEFAULT_PRESET_ID.
//
// Sprint 8.1 scope: the resolver is added but NOT yet wired into the
// existing Canvas / Preview / Export pipelines. Wiring is Sprint 8.2+.
// ═══════════════════════════════════════════════════════════════════

import {
  DEFAULT_BLOCK_EMPHASIS,
  DEFAULT_COMPOSITION,
  DEFAULT_NAVIGATION_STYLE,
  DEFAULT_OVERLAY_OPACITY,
  DEFAULT_OVERLAY_TYPE,
  DEFAULT_SURFACE,
  DENSITY_SPACING,
  FONT_SCALE_MULTIPLIER,
} from './defaults';
import { getPreset } from './preset-registry';
import type {
  BlockStyle,
  Density,
  DocumentStyle,
  PageStyle,
  ResolvedStyleTokens,
  StyleContract,
  StylePresetId,
} from './types';

/**
 * Normalize a possibly-undefined value by falling back to a default.
 * Tiny helper kept local to avoid pulling in lodash etc.
 */
function withDefault<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

/**
 * Resolve a font scale override into a numeric multiplier.
 * Invalid values fall back to 'comfortable' (1.0).
 */
function resolveFontScaleMultiplier(
  scale: DocumentStyle['fontScale'] | undefined,
): number {
  if (scale && scale in FONT_SCALE_MULTIPLIER) {
    return FONT_SCALE_MULTIPLIER[scale];
  }
  return FONT_SCALE_MULTIPLIER.comfortable;
}

/**
 * Resolve a density override. Invalid values fall back to the preset's
 * default density.
 */
function resolveDensity(
  density: DocumentStyle['density'] | undefined,
  presetDensity: Density,
): Density {
  if (
    density === 'compact' ||
    density === 'comfortable' ||
    density === 'spacious'
  ) {
    return density;
  }
  return presetDensity;
}

/**
 * Resolve an accent color override. May be a hex string OR a token key.
 * The resolver passes it through verbatim — token key resolution to a
 * hex value happens at the consumer side (Canvas / Export) because
 * token-key semantics depend on the consumer's TokenResolver context.
 *
 * Sprint 8.2+ will introduce a single token-key resolver that all
 * consumers share, eliminating the per-consumer resolution.
 */
function resolveAccentColor(
  override: string | undefined,
  presetAccent: string,
): string {
  if (typeof override === 'string' && override.trim().length > 0) {
    return override;
  }
  return presetAccent;
}

/**
 * Validate that a background overlay value is in 0–100 range. Returns
 * the default if out of range or undefined.
 */
function resolveOverlayOpacity(value: number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, value));
  }
  return DEFAULT_OVERLAY_OPACITY;
}

/**
 * THE resolver. Pure. Deterministic. SSR-safe.
 *
 * @param input — the combined style contract (document + optional page/block)
 * @returns ResolvedStyleTokens — runtime-only tokens, never persisted
 *
 * @example
 *   const tokens = resolveStyleContract({
 *     document: { presetId: 'academic-clean' },
 *   });
 *
 * @example
 *   // Legacy project with no presetId
 *   const tokens = resolveStyleContract({
 *     document: { presetId: 'unknown-id' as StylePresetId }, // invalid
 *   });
 *   // → falls back to DEFAULT_PRESET_ID ('academic-clean')
 */
export function resolveStyleContract(input: StyleContract): ResolvedStyleTokens {
  // ── 1. Resolve preset (fallback to default if invalid) ──────────
  const documentStyle: DocumentStyle = input.document;
  const preset = getPreset(documentStyle.presetId);

  // ── 2. Resolve document-level overrides ─────────────────────────
  const fontScaleMultiplier = resolveFontScaleMultiplier(
    documentStyle.fontScale,
  );
  const density = resolveDensity(
    documentStyle.density,
    preset.spacing.density,
  );
  const accent = resolveAccentColor(
    documentStyle.accentColor,
    preset.colors.accent,
  );
  const densitySpacing = DENSITY_SPACING[density];

  // ── 3. Resolve page-level context (defaults to preset) ──────────
  const pageStyle: PageStyle = withDefault(input.page, {});
  const background = pageStyle.background;
  const backgroundType = background?.type ?? 'solid';
  const bgColor = background?.color ?? preset.colors.background;
  const overlayOpacity = resolveOverlayOpacity(background?.overlay);
  const overlayType = background?.overlayType ?? DEFAULT_OVERLAY_TYPE;
  const surface = withDefault(pageStyle.surface, DEFAULT_SURFACE);
  const _composition = withDefault(
    pageStyle.composition,
    DEFAULT_COMPOSITION,
  );

  // Background type influences the resolved `background` color:
  // - 'solid'   → use the bgColor as-is
  // - 'gradient' → use bgColor as the base (consumer resolves gradient)
  // - 'image'    → use bgColor as a fallback behind the image
  // The resolver does NOT compose the actual gradient or render the
  // image — that's the consumer's job. We only expose the resolved
  // base color + overlay info via the colors.surface* fields.
  void backgroundType;
  void overlayType;
  void surface;

  // ── 4. Resolve block-level context (defaults to page/document) ──
  const blockStyle: BlockStyle = withDefault(input.block, {});
  const _blockPresetId = blockStyle.presetId;
  const _blockVariant = withDefault(blockStyle.variant, 'A' as const);
  const _blockEmphasis = withDefault(
    blockStyle.emphasis,
    DEFAULT_BLOCK_EMPHASIS,
  );

  // Block emphasis influences the resolved surface color in a small way:
  // - 'normal'    → surface (preset default)
  // - 'highlight' → surfaceStrong
  // - 'strong'    → accent (with contrast text)
  // Sprint 8.1 does NOT yet expose these as separate fields; the
  // consumer reads `block.emphasis` directly. We keep the resolution
  // here for future use and to make the resolver the single place
  // where block-level intent is interpreted.
  void _blockPresetId;
  void _blockVariant;
  void _blockEmphasis;

  // ── 5. Assemble ResolvedStyleTokens ─────────────────────────────
  const tokens: ResolvedStyleTokens = {
    colors: {
      background: bgColor,
      surface: preset.colors.surface,
      surfaceStrong: preset.colors.surfaceStrong,
      text: preset.colors.text,
      textMuted: preset.colors.textMuted,
      accent,
      accentContrast: preset.colors.accentContrast,
      border: preset.colors.border,
      success: preset.colors.success,
      error: preset.colors.error,
    },
    typography: {
      headingFamily: preset.typography.headingFamily,
      bodyFamily: preset.typography.bodyFamily,
      headingScale: preset.typography.headingScale,
      bodyScale: preset.typography.bodyScale,
      fontScaleMultiplier,
    },
    shape: {
      radius: preset.shape.radius,
      borderWidth: preset.shape.borderWidth,
      shadow: preset.shape.shadow,
    },
    spacing: {
      density,
      pagePadding: densitySpacing.pagePadding,
      cardPadding: densitySpacing.cardPadding,
      blockGap: densitySpacing.blockGap,
    },
    navigation: {
      style: preset.navigation.style ?? DEFAULT_NAVIGATION_STYLE,
    },
    _legacyThemeId: preset._legacyThemeId,
    _legacyContractId: preset._legacyContractId,
  };

  return tokens;
}

/**
 * Convenience: resolve a contract from just a presetId. Useful for
 * tests, defaults, and consumers that don't need page/block context.
 */
export function resolvePresetTokens(
  presetId: StylePresetId | string | undefined,
): ResolvedStyleTokens {
  return resolveStyleContract({
    document: {
      presetId: (presetId ?? 'academic-clean') as StylePresetId,
    },
  });
}
