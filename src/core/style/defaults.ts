// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Default Values
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// Default values used when a StyleContract field is missing or invalid.
// These are also the values the resolver falls back to, ensuring
// deterministic output for any input (including empty/legacy projects).
// ═══════════════════════════════════════════════════════════════════

import type {
  BlockStyle,
  DocumentStyle,
  PageStyle,
  StylePresetId,
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

/**
 * Default overlay opacity (0-100) when a page background image is set
 * but no overlay value is provided.
 */
export const DEFAULT_OVERLAY_OPACITY = 40;

/**
 * Default overlay tone when a page background image is set but no
 * overlayType is provided.
 */
export const DEFAULT_OVERLAY_TYPE: PageStyle['background'] extends {
  overlayType?: infer T;
}
  ? T
  : 'dark' = 'dark' as const;

/**
 * Default background type when none is specified.
 */
export const DEFAULT_BACKGROUND_TYPE: PageStyle['background'] extends {
  type?: infer T;
}
  ? T
  : 'solid' = 'solid' as const;

/**
 * Default surface treatment.
 */
export const DEFAULT_SURFACE: NonNullable<PageStyle['surface']> = 'soft';

/**
 * Default composition intent.
 */
export const DEFAULT_COMPOSITION: NonNullable<
  PageStyle['composition']
> = 'default';

/**
 * Default block emphasis.
 */
export const DEFAULT_BLOCK_EMPHASIS: NonNullable<
  BlockStyle['emphasis']
> = 'normal';

/**
 * Default block variant.
 */
export const DEFAULT_BLOCK_VARIANT: NonNullable<BlockStyle['variant']> = 'A';

/**
 * Default navbar style.
 */
export const DEFAULT_NAVIGATION_STYLE = 'colorful';

/**
 * Default font scale multiplier. Maps FontScale → numeric multiplier
 * applied to the preset's base typography scale.
 *
 *   compact     → 0.92  (slightly smaller, denser)
 *   comfortable → 1.00  (preset default)
 *   large       → 1.12  (slightly larger, more readable)
 */
export const FONT_SCALE_MULTIPLIER: Record<
  NonNullable<DocumentStyle['fontScale']>,
  number
> = {
  compact: 0.92,
  comfortable: 1.0,
  large: 1.12,
};

/**
 * Default density → spacing map. Maps Density → spacing token values.
 * These are CSS strings consumed by the resolver.
 */
export const DENSITY_SPACING: Record<
  NonNullable<DocumentStyle['density']>,
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
