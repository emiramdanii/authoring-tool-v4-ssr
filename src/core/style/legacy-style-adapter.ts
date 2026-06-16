// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Legacy Adapter
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// `resolveLegacyStyle()` converts a legacy project's scattered style
// fields into a normalized `StyleContract` that can be fed to
// `resolveStyleContract()`.
//
// Goals:
//   - Old projects continue to render correctly.
//   - No legacy field is deleted or migrated destructively.
//   - The adapter is pure and deterministic.
//   - When a legacy field has no clean mapping, fall back to preset
//     defaults rather than guessing.
//
// Mapping table (full detail in STYLE_CONTRACT_AUDIT.md §3):
//
//   schemaThemeId      → presetId (via LEGACY_THEME_TO_PRESET map)
//   colorPalette       → ignored (legacy extraction; preset owns color)
//   templateVariant    → page.block.variant + document-level hint
//   bgColor            → page.background.color (when no schema bg present)
//   bgDataUrl          → page.background.imageUrl
//   overlay            → page.background.overlay
//   navbarStyle        → page.navigation (carried through _legacy field)
//   block.accentColor  → block-level (kept on block, not document)
//   block.variant      → block.variant
//   block.stylePreset  → block.presetId
//
// Sprint 8.1 constraint: the adapter does NOT modify the input. It
// returns a fresh StyleContract. The legacy fields remain in the
// project data untouched. Migration to the new contract is deferred
// to Sprint 8.2+.
// ═══════════════════════════════════════════════════════════════════

import { DEFAULT_PRESET_ID } from './defaults';
import { isValidPresetId } from './preset-registry';
import type {
  BlockStyle,
  DocumentStyle,
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
  colorPalette?: { colors?: unknown[]; mapping?: Record<string, unknown> } | null;
  /** Legacy templateVariant ('A' | 'B' | 'C'). */
  templateVariant?: string | null;
  /** Legacy page-level background color (hex string). */
  bgColor?: string | null;
  /** Legacy page-level background image (data URL or remote URL). */
  bgDataUrl?: string | null;
  /** Legacy overlay opacity (0-100). */
  overlay?: number | null;
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
 * Mapping from legacy themeId → new StylePresetId.
 *
 * This is the canonical migration table. When a legacy project has
 * `schemaThemeId === 'golden-presentation'`, the adapter maps it to
 * the 'academic-clean' preset. Themes without a clean mapping fall
 * back to DEFAULT_PRESET_ID.
 *
 * Adding entries here is safe. Removing or renaming entries is a
 * breaking change to legacy project compatibility.
 */
export const LEGACY_THEME_TO_PRESET: Record<string, StylePresetId> = {
  // Direct mappings (high confidence)
  'golden-presentation': 'academic-clean',
  ceria: 'school-cheerful',
  petualangan: 'mission-adventure',
  neon: 'dark-elegant',
  'warm-light': 'nusantara-nature',
  'ios-light': 'modern-interactive',

  // Approximate mappings (lower confidence — pick closest visual identity)
  minimal: 'modern-interactive',
  'ocean-light': 'modern-interactive',
  'ios-warm': 'school-cheerful',
  colorful: 'school-cheerful',
  glass: 'dark-elegant',

  // Themes with no clean preset mapping fall through to DEFAULT_PRESET_ID
};

/**
 * Reverse mapping for the migration period. Used by consumers that
 * need to derive the legacy themeId from a new presetId (e.g. when
 * reading a new-format project through the legacy TokenResolver).
 *
 * Note: this is the IDENTITY mapping (preset → preferred legacy theme).
 * It is NOT the inverse of LEGACY_THEME_TO_PRESET (which is many-to-one).
 */
export const PRESET_TO_LEGACY_THEME: Record<StylePresetId, string> = {
  'academic-clean': 'golden-presentation',
  'school-cheerful': 'ceria',
  'mission-adventure': 'petualangan',
  'dark-elegant': 'neon',
  'nusantara-nature': 'warm-light',
  'modern-interactive': 'ios-light',
};

/**
 * Resolve a legacy themeId to a new StylePresetId.
 * Falls back to DEFAULT_PRESET_ID if no mapping exists.
 */
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

/**
 * Validate a navbar style string against the known set.
 */
function normalizeNavbarStyle(
  value: string | null | undefined,
): 'colorful' | 'minimal' | 'glass' | undefined {
  if (
    value === 'colorful' ||
    value === 'minimal' ||
    value === 'glass'
  ) {
    return value;
  }
  return undefined;
}

/**
 * Normalize a block variant string. Returns undefined if invalid.
 */
function normalizeBlockVariant(
  value: string | null | undefined,
): 'A' | 'B' | 'C' | undefined {
  if (value === 'A' || value === 'B' || value === 'C') {
    return value;
  }
  return undefined;
}

/**
 * Normalize overlay opacity. Returns undefined if missing/invalid.
 * Clamps to 0-100 if out of range. Accepts both 0-100 and 0-1 ranges
 * (legacy DB stored 0-1 as a float — detect heuristically).
 */
function normalizeOverlay(
  value: number | null | undefined,
): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  // Heuristic: if value <= 1.0, assume 0-1 range and convert to 0-100.
  // This is safe because overlay=0 is the same in both scales.
  if (value >= 0 && value <= 1) {
    return Math.round(value * 100);
  }
  if (value > 1 && value <= 100) {
    return Math.round(value);
  }
  // Out of range — clamp.
  if (value < 0) return 0;
  return 100;
}

/**
 * Convert a legacy style input into a normalized StyleContract.
 *
 * Pure. Deterministic. No side effects.
 *
 * @example
 *   const contract = resolveLegacyStyle({
 *     schemaThemeId: 'golden-presentation',
 *     templateVariant: 'B',
 *     bgColor: '#0f172a',
 *     overlay: 40,
 *     navbarStyle: 'colorful',
 *   });
 *   const tokens = resolveStyleContract(contract);
 */
export function resolveLegacyStyle(input: LegacyStyleInput): StyleContract {
  // ── 1. Document-level: derive presetId from legacy themeId ──────
  const presetId = resolveLegacyPresetId(input.schemaThemeId);

  const document: DocumentStyle = {
    presetId,
  };
  // Note: legacy colorPalette is intentionally NOT mapped to
  // document.accentColor. The palette was extracted from a bg image
  // and does not represent a teacher's accent choice. Sprint 8.2+
  // may introduce a "derived accent" feature, but Sprint 8.1 keeps
  // the contract honest: only explicit teacher choices become overrides.

  // ── 2. Page-level: derive background + navigation ───────────────
  const page: PageStyle = {};

  // Background: prefer bgDataUrl if present (image), else bgColor (solid).
  const hasBgImage =
    typeof input.bgDataUrl === 'string' && input.bgDataUrl.length > 0;
  const hasBgColor =
    typeof input.bgColor === 'string' && input.bgColor.length > 0;

  if (hasBgImage) {
    page.background = {
      type: 'image',
      imageUrl: input.bgDataUrl ?? undefined,
      overlay: normalizeOverlay(input.overlay) ?? 40,
    };
  } else if (hasBgColor) {
    page.background = {
      type: 'solid',
      color: input.bgColor ?? undefined,
    };
  }
  // If neither is present, leave page.background undefined — the
  // resolver will fall back to the preset's default background color.

  // Navigation: carry through if valid. Page-level navigation style
  // is recorded via the contract's `navigation` field on the resolver
  // output. We do NOT add a page.navigation field to PageStyle here
  // because the contract spec keeps navigation as a document-level
  // concern derived from the preset. The legacy navbarStyle is
  // preserved on the document via a side-channel for the migration
  // period (consumers may read it via `_legacyNavbarStyle`).
  const navStyle = normalizeNavbarStyle(input.navbarStyle);
  if (navStyle) {
    // We store this on the document as an override hint — but since
    // DocumentStyle doesn't have a navbar field, we record it as a
    // symbol-keyed extension that the resolver can optionally read.
    // Sprint 8.1 resolver does NOT read this — it stays as a hint
    // for consumers that need legacy nav compatibility.
    (document as DocumentStyle & { _legacyNavbarStyle?: string })._legacyNavbarStyle = navStyle;
  }

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

  // blockAccentColor is NOT lifted to document.accentColor because it
  // is a block-level concern, not a document-level one. Consumers
  // read it directly from the block during rendering. We DO NOT
  // surface it through the contract — it stays on the block.
  // (Recording this decision explicitly so future maintainers don't
  // accidentally lift it.)
  void input.blockAccentColor;

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
 * Used by the migration scanner (Sprint 8.2+) to identify projects
 * that should be migrated to the new contract.
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
 * Useful for distinguishing new-format projects from legacy ones.
 */
export function isNewFormatPresetId(id: unknown): id is StylePresetId {
  return isValidPresetId(id);
}
