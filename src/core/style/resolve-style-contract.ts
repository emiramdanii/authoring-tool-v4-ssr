// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Pure Resolver  (Sprint 8.1-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
// Patch: P0-1 — every teacher-facing control now produces a visible
//               change in the output (no more `void` discards).
//        P1   — token keys ('y','c','g',...) resolved to concrete CSS
//               hex inside the resolver. ResolvedStyleTokens is now
//               consumer-ready — no second resolver needed.
//
// `resolveStyleContract()` is the SINGLE entry point that turns a
// StyleContract (teacher choices) into ResolvedStyleTokens (technical
// tokens for Canvas / Preview / Present / Export).
//
// Contract guarantees:
//   - Pure function. No side effects.
//   - Deterministic. Same input → same output, always.
//   - No React state reads. No DOM access. SSR-safe.
//   - No store mutations. Never writes to schema.
//   - Has default fallbacks for every optional field.
//   - Invalid presetId falls back to DEFAULT_PRESET_ID.
//   - All token keys resolved to concrete CSS hex (P1).
//   - All PageStyle / BlockStyle fields produce output changes (P0-1).
// ═══════════════════════════════════════════════════════════════════

import {
  DEFAULT_BACKGROUND_TYPE,
  DEFAULT_BLOCK_EMPHASIS,
  DEFAULT_BLOCK_VARIANT,
  DEFAULT_COMPOSITION,
  DEFAULT_IMAGE_BLUR,
  DEFAULT_IMAGE_FIT,
  DEFAULT_IMAGE_OPACITY,
  DEFAULT_NAVIGATION_STYLE,
  DEFAULT_OVERLAY_OPACITY,
  DEFAULT_OVERLAY_TYPE,
  DEFAULT_SURFACE,
  DEFAULT_TOKEN_KEY_HEX,
  DENSITY_SPACING,
  FONT_SCALE_MULTIPLIER,
  MAX_OVERLAY_OPACITY,
  isTokenKey,
} from './defaults';
import { getPreset } from './preset-registry';
import type {
  BlockEmphasis,
  BlockStyle,
  CompositionIntent,
  Density,
  DocumentStyle,
  ImageFit,
  OverlayType,
  PageBackgroundStyle,
  PageBackgroundType,
  PageStyle,
  ResolvedBackground,
  ResolvedBlockTokens,
  ResolvedPageTokens,
  ResolvedStyleTokens,
  StyleContract,
  StylePresetId,
  SurfaceTreatment,
} from './types';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function withDefault<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

/**
 * Resolve a possibly-token-key color to a concrete CSS hex string.
 * If the value is a known token key ('y','c','g','p','o','r'), look up
 * the hex from the preset's semantic.accents map first (so the color
 * matches the active preset), falling back to the default token map.
 *
 * If the value is NOT a token key (e.g. '#ff0000', 'rgb(...)', 'red'),
 * return it verbatim — the consumer will pass it through to CSS.
 *
 * If the value is empty/undefined, return the fallback.
 *
 * (P1 patch: previously this function passed token keys through
 *  verbatim, leaving each consumer to resolve them. Now resolution
 *  happens here, in the single source of truth.)
 */
function resolveColor(
  value: string | undefined | null,
  fallback: string,
  presetAccents?: Record<string, string>,
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }
  const trimmed = value.trim();
  if (isTokenKey(trimmed)) {
    // Look up in preset accents first (preset may override), then default
    if (presetAccents && trimmed in presetAccents) {
      return presetAccents[trimmed];
    }
    return DEFAULT_TOKEN_KEY_HEX[trimmed];
  }
  return trimmed;
}

function resolveFontScaleMultiplier(
  scale: DocumentStyle['fontScale'] | undefined,
): number {
  if (scale && scale in FONT_SCALE_MULTIPLIER) {
    return FONT_SCALE_MULTIPLIER[scale];
  }
  return FONT_SCALE_MULTIPLIER.comfortable;
}

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
 * Resolve a background overlay into the schema-aligned 0-80 range.
 * Out-of-range values are clamped. NaN/undefined fall back to default.
 *
 * IMPORTANT: This function does NOT use the Sprint 8.1 heuristic of
 * "value <= 1 → assume 0-1 fraction". That heuristic was ambiguous
 * (1% overlay would be detected as fraction 1.0 and converted to 100%).
 * Legacy adapters now split by source — see legacy-style-adapter.ts.
 */
function resolveOverlayOpacity(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  if (value < 0) return 0;
  if (value > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return value;
}

function resolveBackgroundType(
  value: PageBackgroundType | undefined,
): PageBackgroundType {
  if (
    value === 'solid' ||
    value === 'gradient' ||
    value === 'radial'
  ) {
    return value;
  }
  return DEFAULT_BACKGROUND_TYPE;
}

function resolveOverlayType(value: OverlayType | undefined): OverlayType {
  if (value === 'dark' || value === 'light' || value === 'gradient') {
    return value;
  }
  return DEFAULT_OVERLAY_TYPE;
}

function resolveImageFit(value: ImageFit | undefined): ImageFit {
  if (value === 'cover' || value === 'contain') {
    return value;
  }
  return DEFAULT_IMAGE_FIT;
}

function resolveImageOpacity(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_IMAGE_OPACITY;
  }
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function resolveImageBlur(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_IMAGE_BLUR;
  }
  if (value < 0) return 0;
  if (value > 20) return 20;
  return value;
}

function resolveSurface(value: SurfaceTreatment | undefined): SurfaceTreatment {
  if (value === 'flat' || value === 'soft' || value === 'elevated') {
    return value;
  }
  return DEFAULT_SURFACE;
}

function resolveComposition(
  value: CompositionIntent | undefined,
): CompositionIntent {
  if (value === 'default' || value === 'focus' || value === 'immersive') {
    return value;
  }
  return DEFAULT_COMPOSITION;
}

function resolveBlockEmphasis(
  value: BlockEmphasis | undefined,
): BlockEmphasis {
  if (value === 'normal' || value === 'highlight' || value === 'strong') {
    return value;
  }
  return DEFAULT_BLOCK_EMPHASIS;
}

function resolveBlockVariant(
  value: BlockStyle['variant'] | undefined,
): 'A' | 'B' | 'C' {
  if (value === 'A' || value === 'B' || value === 'C') {
    return value;
  }
  return DEFAULT_BLOCK_VARIANT;
}

// ─────────────────────────────────────────────────────────────────
// Page background resolver
// ─────────────────────────────────────────────────────────────────

function resolvePageBackground(
  bg: PageBackgroundStyle | undefined,
  presetBackground: string,
  presetAccents: Record<string, string>,
): ResolvedBackground {
  if (!bg) {
    return {
      type: DEFAULT_BACKGROUND_TYPE,
      color1: presetBackground,
      color2: '',
      imageUrl: '',
      overlay: DEFAULT_OVERLAY_OPACITY,
      overlayType: DEFAULT_OVERLAY_TYPE,
      imageFit: DEFAULT_IMAGE_FIT,
      imageOpacity: DEFAULT_IMAGE_OPACITY,
      imageBlur: DEFAULT_IMAGE_BLUR,
    };
  }

  return {
    type: resolveBackgroundType(bg.type),
    color1: resolveColor(bg.color1, presetBackground, presetAccents),
    color2: resolveColor(bg.color2, '', presetAccents),
    imageUrl:
      typeof bg.imageUrl === 'string' && bg.imageUrl.length > 0
        ? bg.imageUrl
        : '',
    overlay: resolveOverlayOpacity(bg.overlay),
    overlayType: resolveOverlayType(bg.overlayType),
    imageFit: resolveImageFit(bg.imageFit),
    imageOpacity: resolveImageOpacity(bg.imageOpacity),
    imageBlur: resolveImageBlur(bg.imageBlur),
  };
}

// ─────────────────────────────────────────────────────────────────
// Block tokens resolver — emphasis actually changes surface/text/border (P0-1)
// ─────────────────────────────────────────────────────────────────

function resolveBlockTokens(
  blockStyle: BlockStyle | undefined,
  presetAccent: string,
  presetAccentContrast: string,
  presetSurface: string,
  presetSurfaceStrong: string,
  presetText: string,
  presetBorder: string,
  presetAccents: Record<string, string>,
): ResolvedBlockTokens {
  const block = withDefault(blockStyle, {});
  const emphasis: BlockEmphasis = resolveBlockEmphasis(block.emphasis);
  const variant = resolveBlockVariant(block.variant);
  const presetId =
    typeof block.presetId === 'string' && block.presetId.length > 0
      ? block.presetId
      : '';

  // Resolve block accent: block-level override → document accent → preset accent
  const accent = resolveColor(block.accentColor, presetAccent, presetAccents);

  // Emphasis drives surface / text / border (P0-1 patch).
  let surface: string;
  let text: string;
  let border: string;
  switch (emphasis) {
    case 'normal':
      surface = presetSurface;
      text = presetText;
      border = presetBorder;
      break;
    case 'highlight':
      surface = presetSurfaceStrong;
      text = presetText;
      border = accent; // tinted border = accent color
      break;
    case 'strong':
      surface = accent; // filled accent background
      text = presetAccentContrast; // contrasting text on accent
      border = accent;
      break;
  }

  return {
    presetId,
    variant,
    emphasis,
    accent,
    surface,
    text,
    border,
  };
}

// ─────────────────────────────────────────────────────────────────
// THE resolver
// ─────────────────────────────────────────────────────────────────

/**
 * THE resolver. Pure. Deterministic. SSR-safe. Fully resolved.
 *
 * @param input — the combined style contract (document + optional page/block)
 * @returns ResolvedStyleTokens — runtime-only tokens, never persisted,
 *          fully resolved (no token keys, no second resolver needed)
 */
export function resolveStyleContract(input: StyleContract): ResolvedStyleTokens {
  // ── 1. Resolve preset (fallback to default if invalid) ──────────
  const documentStyle: DocumentStyle = input.document;
  const preset = getPreset(documentStyle.presetId);

  // Preset accents map (token-key → hex) for color resolution
  const presetAccents: Record<string, string> = {
    y: preset.semantic.accents.yellow,
    c: preset.semantic.accents.cyan,
    r: preset.semantic.accents.red,
    p: preset.semantic.accents.purple,
    g: preset.semantic.accents.green,
    o: preset.semantic.accents.orange,
  };

  // ── 2. Resolve document-level overrides ─────────────────────────
  const fontScaleMultiplier = resolveFontScaleMultiplier(
    documentStyle.fontScale,
  );
  const density = resolveDensity(
    documentStyle.density,
    preset.spacing.density,
  );
  const densitySpacing = DENSITY_SPACING[density];

  // Resolve accent (P1: token key → concrete hex)
  const accent = resolveColor(
    documentStyle.accentColor,
    preset.colors.accent,
    presetAccents,
  );

  // ── 3. Resolve page-level context (P0-1: actually produce output) ──
  const pageStyle: PageStyle = withDefault(input.page, {});
  const background = resolvePageBackground(
    pageStyle.background,
    preset.colors.background,
    presetAccents,
  );
  const surface = resolveSurface(pageStyle.surface);
  const composition = resolveComposition(pageStyle.composition);

  const page: ResolvedPageTokens = {
    background,
    surface,
    composition,
  };

  // ── 4. Resolve block-level context (P0-1: actually produce output) ──
  const block: ResolvedBlockTokens = resolveBlockTokens(
    input.block,
    accent,
    preset.colors.accentContrast,
    preset.colors.surface,
    preset.colors.surfaceStrong,
    preset.colors.text,
    preset.colors.border,
    presetAccents,
  );

  // ── 5. Assemble ResolvedStyleTokens ─────────────────────────────
  // When page.background.color1 is set, it overrides colors.background
  // so consumers reading the top-level color see the page bg.
  const resolvedBackground =
    background.color1 || preset.colors.background;

  const tokens: ResolvedStyleTokens = {
    colors: {
      background: resolvedBackground,
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
    semantic: preset.semantic,
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
    page,
    block,
    _legacyThemeId: preset._legacyThemeId,
    _legacyContractId: preset._legacyContractId,
  };

  return tokens;
}

/**
 * Convenience: resolve a contract from just a presetId.
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
