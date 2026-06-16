// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Legacy Adapter  (Sprint 8.1-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
// Patch: P0-2 — exhaustive mapping from actual THEME_PRESETS registry
//               (17 themes), explicit decisions for each, no silent
//               fallbacks for domain themes (hakikat-norma, macam-norma,
//               nilai-pancasila, bhinneka-tunggal-ika, ham-hak-kewajiban,
//               demokrasi-pancasila, globalisasi).
//        P0-4 — overlay adapters split by source (Canva 0-100, DB 0-1,
//               Schema 0-80). Removed the ambiguous "<=1 → fraction"
//               heuristic.
//        P1   — removed _legacyNavbarStyle side-channel. The resolver
//               no longer accepts hidden fields; navbar style is
//               derived from the preset.
//
// `resolveLegacyStyle()` converts a legacy project's scattered style
// fields into a normalized `StyleContract` that can be fed to
// `resolveStyleContract()`.
//
// Goals:
//   - Old projects continue to render correctly.
//   - No legacy field is deleted or migrated destructively.
//   - The adapter is pure and deterministic.
//   - Each legacy themeId has an explicit decision.
//   - colorPalette is intentionally NOT mapped (preset owns color).
// ═══════════════════════════════════════════════════════════════════

import {
  DEFAULT_OVERLAY_OPACITY,
  MAX_OVERLAY_OPACITY,
} from './defaults';
import { DEFAULT_PRESET_ID } from './defaults';
import { isValidPresetId } from './preset-registry';
import type {
  BlockStyle,
  DocumentStyle,
  PageBackgroundStyle,
  PageStyle,
  StyleContract,
  StylePresetId,
} from './types';

/**
 * Raw legacy style input. All fields optional. The adapter normalizes
 * whatever is present into a StyleContract.
 *
 * Fields are intentionally permissive (string | undefined | null)
 * because legacy data is messy.
 */
export interface LegacyStyleInput {
  /** Legacy schemaThemeId (e.g. 'golden-presentation', 'macam-norma'). */
  schemaThemeId?: string | null;
  /** Legacy colorPalette (extracted from bg image). Not mapped — ignored. */
  colorPalette?:
    | { colors?: unknown[]; mapping?: Record<string, unknown> }
    | null;
  /** Legacy templateVariant ('A' | 'B' | 'C'). */
  templateVariant?: string | null;
  /** Legacy page-level background color (hex string). */
  bgColor?: string | null;
  /** Legacy page-level background image (data URL or remote URL). */
  bgDataUrl?: string | null;
  /** Legacy overlay opacity. Source determines the scale — see OverlaySource. */
  overlay?: number | null;
  /** Source of the overlay value — determines scale conversion. */
  overlaySource?: OverlaySource;
  /** Legacy navbar style ('colorful' | 'minimal' | 'glass'). */
  navbarStyle?: string | null;
  /** Legacy block-level accent color (token key or hex). */
  blockAccentColor?: string | null;
  /** Legacy block-level variant. */
  blockVariant?: string | null;
  /** Legacy block-level style preset ID (e.g. 'ceria','formal'). */
  blockStylePreset?: string | null;
}

/**
 * Source of the overlay value — determines the scale and how it is
 * converted to the schema-aligned 0-80 range.
 *
 *   'canva'  → 0-100 integer (CanvaPage.overlay) — divide by 1.25
 *   'db'     → 0-1 float (Page.bgOverlay DB column) — multiply by 80
 *   'schema' → 0-80 integer (ScreenSchema.background.overlay) — pass through
 *
 * Default: 'canva' (most legacy callers pass CanvaPage.overlay directly).
 */
export type OverlaySource = 'canva' | 'db' | 'schema';

// ─────────────────────────────────────────────────────────────────
// EXHAUSTIVE LEGACY_THEME_TO_PRESET MAPPING (P0-2)
// ─────────────────────────────────────────────────────────────────
// This table covers ALL 17 theme IDs in the actual THEME_PRESETS
// registry (src/core/themes/tokens.ts). Each has an explicit decision.
//
// Mapping rationale:
//
//   DIRECT MAPPINGS (1:1 color match with new preset):
//     golden-presentation → academic-clean (golden + navy)
//     ios-light           → modern-interactive (iOS blue + light)
//     neon                → dark-elegant (neon cyan + dark)
//     warm-light          → nusantara-nature (warm earth tones)
//     colorful            → school-cheerful (bright playful)
//
//   APPROXIMATE MAPPINGS (closest visual identity):
//     ios-warm            → school-cheerful (warm + friendly)
//     glass               → dark-elegant (dark + glassmorphism)
//     minimal             → modern-interactive (light + minimal)
//     ocean-light         → modern-interactive (light + blue)
//     default             → academic-clean (DEFAULT_THEME_ID maps here)
//
//   DOMAIN THEME MAPPINGS (PPKn domain themes — preserve identity via
//   academic-clean + categories palette. The academic-clean preset
//   carries the macam-norma categories so PPKn norma cards keep their
//   4-color distinction after migration):
//     hakikat-norma          → academic-clean (golden accent preserved)
//     macam-norma            → academic-clean (teal + 4 norma categories)
//     nilai-pancasila        → academic-clean (red accent → categories)
//     bhinneka-tunggal-ika   → academic-clean (cyan accent → categories)
//     ham-hak-kewajiban      → academic-clean (purple accent → categories)
//     demokrasi-pancasila    → academic-clean (orange accent → categories)
//     globalisasi            → academic-clean (green accent → categories)
//
//   Note: 'ceria' and 'petualangan' are NOT in this table because they
//   are BLOCK style presets (BLOCK_STYLE_PRESETS in
//   src/core/schema/block-style-presets.ts), NOT document theme
//   presets. Sprint 8.1 incorrectly listed them as theme IDs.
//
// Adding entries here is safe. Removing or renaming entries is a
// breaking change to legacy project compatibility.
// ─────────────────────────────────────────────────────────────────

export const LEGACY_THEME_TO_PRESET: Record<string, StylePresetId> = {
  // Direct mappings (1:1)
  'golden-presentation': 'academic-clean',
  'ios-light': 'modern-interactive',
  neon: 'dark-elegant',
  'warm-light': 'nusantara-nature',
  colorful: 'school-cheerful',

  // Approximate mappings (closest visual identity)
  'ios-warm': 'school-cheerful',
  glass: 'dark-elegant',
  minimal: 'modern-interactive',
  'ocean-light': 'modern-interactive',
  default: 'academic-clean',

  // PPKn domain themes — all preserve identity via academic-clean
  // (which carries the macam-norma categories palette).
  // Sprint 8.2+ may introduce dedicated domain presets.
  'hakikat-norma': 'academic-clean',
  'macam-norma': 'academic-clean',
  'nilai-pancasila': 'academic-clean',
  'bhinneka-tunggal-ika': 'academic-clean',
  'ham-hak-kewajiban': 'academic-clean',
  'demokrasi-pancasila': 'academic-clean',
  globalisasi: 'academic-clean',
};

/**
 * Reverse mapping for the migration period.
 */
export const PRESET_TO_LEGACY_THEME: Record<StylePresetId, string> = {
  'academic-clean': 'golden-presentation',
  'school-cheerful': 'colorful',
  'mission-adventure': 'glass',
  'dark-elegant': 'neon',
  'nusantara-nature': 'warm-light',
  'modern-interactive': 'ios-light',
};

/**
 * The complete list of legacy theme IDs that have an explicit mapping.
 * Used by tests to verify the mapping is exhaustive against the actual
 * THEME_PRESETS registry.
 */
export const LEGACY_THEME_IDS_WITH_MAPPING: string[] = Object.keys(
  LEGACY_THEME_TO_PRESET,
);

// ─────────────────────────────────────────────────────────────────
// Resolver helpers
// ─────────────────────────────────────────────────────────────────

function resolveLegacyPresetId(
  legacyThemeId: string | null | undefined,
): StylePresetId {
  if (
    typeof legacyThemeId === 'string' &&
    legacyThemeId in LEGACY_THEME_TO_PRESET
  ) {
    return LEGACY_THEME_TO_PRESET[legacyThemeId];
  }
  return DEFAULT_PRESET_ID;
}

function normalizeBlockVariant(
  value: string | null | undefined,
): 'A' | 'B' | 'C' | undefined {
  if (value === 'A' || value === 'B' || value === 'C') {
    return value;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────
// Source-aware overlay resolvers (P0-4)
// ─────────────────────────────────────────────────────────────────
// Removed the ambiguous "<=1 → fraction" heuristic from Sprint 8.1.
// Each source has its own resolver with explicit scale conversion.
// The schema-aligned output range is 0-80 (matches ScreenSchema).
// ─────────────────────────────────────────────────────────────────

/**
 * Resolve overlay from CanvaPage.overlay (0-100 integer).
 * Output: 0-80 schema-aligned scale (multiply by 0.8).
 */
export function resolveCanvaOverlay(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  // 0-100 → 0-80
  const scaled = value * 0.8;
  if (scaled < 0) return 0;
  if (scaled > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return Math.round(scaled);
}

/**
 * Resolve overlay from Page.bgOverlay DB column (0-1 float).
 * Output: 0-80 schema-aligned scale (multiply by 80).
 */
export function resolveDbOverlay(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  // 0-1 → 0-80
  const scaled = value * 80;
  if (scaled < 0) return 0;
  if (scaled > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return Math.round(scaled);
}

/**
 * Resolve overlay from ScreenSchema.background.overlay (0-80 integer).
 * Output: 0-80 schema-aligned scale (pass through, clamp only).
 */
export function resolveSchemaOverlay(
  value: number | null | undefined,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  if (value < 0) return 0;
  if (value > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return value;
}

/**
 * Dispatch overlay resolution by source. Defaults to 'canva' for
 * backward compatibility with Sprint 8.1 callers (which passed
 * CanvaPage.overlay directly without specifying a source).
 */
function resolveOverlayBySource(
  value: number | null | undefined,
  source: OverlaySource | undefined,
): number {
  switch (source) {
    case 'db':
      return resolveDbOverlay(value);
    case 'schema':
      return resolveSchemaOverlay(value);
    case 'canva':
    default:
      return resolveCanvaOverlay(value);
  }
}

// ─────────────────────────────────────────────────────────────────
// THE legacy adapter
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a legacy style input into a normalized StyleContract.
 *
 * Pure. Deterministic. No side effects.
 */
export function resolveLegacyStyle(input: LegacyStyleInput): StyleContract {
  // ── 1. Document-level: derive presetId from legacy themeId ──────
  const presetId = resolveLegacyPresetId(input.schemaThemeId);

  const document: DocumentStyle = {
    presetId,
  };
  // Note: legacy colorPalette is intentionally NOT mapped to
  // document.accentColor. The palette was extracted from a bg image
  // and does not represent a teacher's accent choice.

  // ── 2. Page-level: derive background ────────────────────────────
  const page: PageStyle = {};

  // Background: prefer bgDataUrl if present (image), else bgColor (solid).
  // Image is layered ON TOP of solid/gradient — schema-aligned model (P0-4).
  const hasBgImage =
    typeof input.bgDataUrl === 'string' && input.bgDataUrl.length > 0;
  const hasBgColor =
    typeof input.bgColor === 'string' && input.bgColor.length > 0;

  if (hasBgImage || hasBgColor) {
    const background: PageBackgroundStyle = {
      type: 'solid',
    };
    if (hasBgColor) {
      background.color1 = input.bgColor ?? undefined;
    }
    if (hasBgImage) {
      background.imageUrl = input.bgDataUrl ?? undefined;
      // Overlay only meaningful when image is present
      background.overlay = resolveOverlayBySource(
        input.overlay,
        input.overlaySource,
      );
    }
    page.background = background;
  }
  // If neither is present, leave page.background undefined.

  // navbarStyle: P1 patch — no longer stored as side-channel.
  // The resolver derives navbar style from the preset; legacy
  // navbarStyle is intentionally dropped. Sprint 8.2+ may add a
  // proper PageStyle.navigation field if teachers need per-page nav
  // override. For now, we don't accept hidden fields.
  void input.navbarStyle;

  // ── 3. Block-level: carry through variant + preset + accent ─────
  const block: BlockStyle = {};

  const blockVariant = normalizeBlockVariant(input.blockVariant);
  if (blockVariant) {
    block.variant = blockVariant;
  }

  // Legacy templateVariant (page-level) doubles as a default for
  // block.variant when the block doesn't specify its own.
  if (!block.variant) {
    const pageVariant = normalizeBlockVariant(input.templateVariant);
    if (pageVariant) {
      block.variant = pageVariant;
    }
  }

  if (
    typeof input.blockStylePreset === 'string' &&
    input.blockStylePreset.length > 0
  ) {
    block.presetId = input.blockStylePreset;
  }

  // blockAccentColor is lifted to block.accentColor (P0-1 patch —
  // block accent now produces a visible change in resolved tokens).
  if (
    typeof input.blockAccentColor === 'string' &&
    input.blockAccentColor.length > 0
  ) {
    block.accentColor = input.blockAccentColor;
  }

  // ── 4. Assemble StyleContract ───────────────────────────────────
  const contract: StyleContract = {
    document,
  };
  if (Object.keys(page).length > 0) {
    contract.page = page;
  }
  if (Object.keys(block).length > 0) {
    contract.block = block;
  }

  return contract;
}

/**
 * Detect whether a legacy project uses any legacy style fields.
 */
export function hasLegacyStyleFields(input: LegacyStyleInput): boolean {
  return (
    input.schemaThemeId != null ||
    input.colorPalette != null ||
    input.templateVariant != null ||
    input.bgColor != null ||
    input.bgDataUrl != null ||
    input.overlay != null ||
    input.navbarStyle != null ||
    input.blockAccentColor != null ||
    input.blockVariant != null ||
    input.blockStylePreset != null
  );
}

/**
 * Type guard: is the given preset ID valid (already in new format)?
 */
export function isNewFormatPresetId(id: unknown): id is StylePresetId {
  return isValidPresetId(id);
}
