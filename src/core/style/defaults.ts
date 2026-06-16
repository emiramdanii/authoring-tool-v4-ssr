// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Default Values  (Sprint 8.1-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
// Patch: P0-4 — overlay range aligned with ScreenSchema (0-80, not 0-100).
// ═══════════════════════════════════════════════════════════════════

import type {
  BlockStyle,
  CompositionIntent,
  Density,
  DocumentStyle,
  FontScale,
  ImageFit,
  OverlayType,
  PageBackgroundType,
  PageStyle,
  StylePresetId,
  SurfaceTreatment,
} from './types';

/**
 * Default preset ID. Used when:
 *   - The project has no presetId
 *   - The stored presetId is invalid / unknown
 *   - The legacy adapter cannot derive a preset
 *
 * 'academic-clean' is chosen because it is the most conservative visual
 * identity and maps cleanly to the existing 'golden-presentation' theme
 * already used as the project default.
 */
export const DEFAULT_PRESET_ID: StylePresetId = 'academic-clean';

/**
 * Default DocumentStyle. Always carries a valid presetId.
 */
export const DEFAULT_DOCUMENT_STYLE: DocumentStyle = {
  presetId: DEFAULT_PRESET_ID,
};

/**
 * Default PageStyle. All fields omitted — the resolver will fall back
 * to the document-level preset defaults.
 */
export const DEFAULT_PAGE_STYLE: PageStyle = {};

/**
 * Default BlockStyle. All fields omitted — the resolver will fall back
 * to the document/page defaults.
 */
export const DEFAULT_BLOCK_STYLE: BlockStyle = {};

// ─────────────────────────────────────────────────────────────────
// Schema-aligned background defaults (P0-4)
// ─────────────────────────────────────────────────────────────────

/**
 * Default overlay opacity. ALIGNED with ScreenSchema.background.overlay
 * which uses 0-80 range (default 40).
 *
 * Sprint 8.1 originally used 0-100; this was a contract drift.
 */
export const DEFAULT_OVERLAY_OPACITY = 40;

/** Maximum overlay opacity in the schema-aligned 0-80 scale. */
export const MAX_OVERLAY_OPACITY = 80;

/** Default overlay tone. */
export const DEFAULT_OVERLAY_TYPE: OverlayType = 'dark';

/** Default background type. */
export const DEFAULT_BACKGROUND_TYPE: PageBackgroundType = 'solid';

/** Default image fit. */
export const DEFAULT_IMAGE_FIT: ImageFit = 'cover';

/** Default image opacity (0-100). */
export const DEFAULT_IMAGE_OPACITY = 100;

/** Default image blur in px (0-20). */
export const DEFAULT_IMAGE_BLUR = 0;

// ─────────────────────────────────────────────────────────────────
// Other defaults
// ─────────────────────────────────────────────────────────────────

/** Default surface treatment. */
export const DEFAULT_SURFACE: SurfaceTreatment = 'soft';

/** Default composition intent. */
export const DEFAULT_COMPOSITION: CompositionIntent = 'default';

/** Default block emphasis. */
export const DEFAULT_BLOCK_EMPHASIS: NonNullable<BlockStyle['emphasis']> = 'normal';

/** Default block variant. */
export const DEFAULT_BLOCK_VARIANT: NonNullable<BlockStyle['variant']> = 'A';

/** Default navbar style. */
export const DEFAULT_NAVIGATION_STYLE = 'colorful';

/**
 * Default font scale multiplier. Maps FontScale → numeric multiplier
 * applied to the preset's base typography scale.
 *
 *   compact     → 0.92  (slightly smaller, denser)
 *   comfortable → 1.00  (preset default)
 *   large       → 1.12  (slightly larger, more readable)
 */
export const FONT_SCALE_MULTIPLIER: Record<FontScale, number> = {
  compact: 0.92,
  comfortable: 1.0,
  large: 1.12,
};

/**
 * Default density → spacing map. Maps Density → spacing token values.
 * These are CSS strings consumed by the resolver.
 */
export const DENSITY_SPACING: Record<
  Density,
  { pagePadding: string; cardPadding: string; blockGap: string }
> = {
  compact: {
    pagePadding: '12px',
    cardPadding: '10px',
    blockGap: '8px',
  },
  comfortable: {
    pagePadding: '20px',
    cardPadding: '16px',
    blockGap: '12px',
  },
  spacious: {
    pagePadding: '32px',
    cardPadding: '24px',
    blockGap: '20px',
  },
};

// ─────────────────────────────────────────────────────────────────
// Token-key → CSS hex resolution map (P1)
// ─────────────────────────────────────────────────────────────────
// Sprint 8.1 originally passed token keys ('y','c','g',...) through
// verbatim, leaving each consumer to resolve them. The senior reviewer
// required that ResolvedStyleTokens be fully resolved — no second
// resolver. This map is the single source for token-key → hex.
//
// Values mirror src/core/themes/primitive-tokens.ts so the contract
// produces identical colors to the legacy DesignTokens system.
// ═══════════════════════════════════════════════════════════════════

/**
 * Token key → CSS hex map. The 6 accent colors from the legacy
 * DesignTokens.colors map (y/c/r/p/g/o).
 *
 * These are the DEFAULT values; presets override per-preset via
 * StylePresetDefinition.semantic.accents.
 */
export const DEFAULT_TOKEN_KEY_HEX: Record<string, string> = {
  y: '#fbbf24', // yellow
  c: '#3ecfcf', // cyan (macam-norma teal — also the default)
  r: '#ff6b6b', // red
  p: '#a78bfa', // purple
  g: '#34d399', // green
  o: '#fb923c', // orange
};

/**
 * Check whether a string is a known token key.
 */
export function isTokenKey(value: string): boolean {
  return value in DEFAULT_TOKEN_KEY_HEX;
}
