// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Legacy Adapter  (Sprint 8.1-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
// Patch:    P0-2 — exhaustive mapping from actual THEME_PRESETS registry
//                  (17 themes), explicit decisions for each, no silent
//                  fallbacks for domain themes (hakikat-norma, macam-norma,
//                  nilai-pancasila, bhinneka-tunggal-ika, ham-hak-kewajiban,
//                  demokrasi-pancasila, globalisasi).
//           P0-4 — overlay adapters split by source (Canva 0-100, DB 0-1,
//                  Schema 0-80). Removed the ambiguous "<=1 → fraction"
//                  heuristic.
//           P1   — removed _legacyNavbarStyle side-channel. The resolver
//                  no longer accepts hidden fields; navbar style is
//                  derived from the preset.
// Patch-2:  P0-1 — overlay conversions now PRESERVE opacity percentage
//                  instead of rescaling. Canva 40 = DB 0.4 = Schema 40
//                  = 40 (all clamped to 0-80 max). Previously Canva 40
//                  silently became 32 — visual meaning was lost.
//           P0-2 — legacy navbarStyle now properly carries through to
//                  PageStyle.navigation.style (no more `void` discard).
//                  Side-channel still gone — the value lives in the
//                  contract, not in a hidden field.
//           P0-3 — original legacy schemaThemeId preserved on the
//                  StyleContract as `compatibility.legacyThemeId`. The
//                  resolver will emit this verbatim (instead of the
//                  preset's bridge ID) so Sprint 8.2 can still branch
//                  on the original legacy theme to preserve exact
//                  visual fidelity.
//                  `PRESET_TO_LEGACY_THEME` made Partial — the fake
//                  `mission-adventure → 'glass'` bridge is removed
//                  (it caused an unstable round-trip:
//                  mission-adventure → 'glass' → dark-elegant).
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
//   - Original legacy themeId is preserved for Sprint 8.2 fidelity.
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
  NavigationStyle,
  PageBackgroundStyle,
  PageStyle,
  StyleCompatibility,
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
 * Patch-2 (P0-1): All three sources now PRESERVE the opacity percentage
 * rather than rescale to a 0-80 fraction. The schema max is 80; values
 * above 80 are clamped, not rescaled.
 *
 *   'canva'  → 0-100 integer (CanvaPage.overlay) — clamp to 0-80.
 *              Canva 40 → 40 (was 32 in Patch-1; the old ×0.8 rescale
 *              silently changed the visual meaning).
 *   'db'     → 0-1 float (Page.bgOverlay DB column) — multiply by 100
 *              and clamp to 0-80. DB 0.4 → 40 (was 32 in Patch-1).
 *   'schema' → 0-80 integer (ScreenSchema.background.overlay) — pass
 *              through with clamp only. Schema 40 → 40.
 *
 * Semantic equality (Patch-2 invariant):
 *   Canva 40 === DB 0.4 === Schema 40 === 40
 *   Canva 100 === DB 1.0 === Schema 80 === 80
 *
 * Default source: 'canva' (most legacy callers pass CanvaPage.overlay
 * directly).
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
 *
 * Patch-2 (P0-3): Made Partial. `mission-adventure` is intentionally
 * absent — it has no real 1:1 legacy theme counterpart ('petualangan'
 * is a block preset, not a theme). The previous fake bridge to 'glass'
 * caused an unstable round-trip:
 *   mission-adventure → 'glass' → dark-elegant
 * Fresh projects that pick `mission-adventure` will get
 * `_legacyThemeId: undefined` from the resolver — Sprint 8.2 then
 * knows there is no legacy renderer to fall back to.
 */
export const PRESET_TO_LEGACY_THEME: Partial<Record<StylePresetId, string>> = {
  'academic-clean': 'golden-presentation',
  'school-cheerful': 'colorful',
  // 'mission-adventure' intentionally omitted (P0-3 patch-2).
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

/**
 * Normalize legacy `navbarStyle` ('colorful' | 'minimal' | 'glass').
 * Patch-2 (P0-2): The previous patch removed the `_legacyNavbarStyle`
 * side-channel AND silently dropped the value. This helper restores
 * the carry-through via the proper `PageStyle.navigation.style`
 * contract field — the side-channel stays removed.
 *
 * Invalid values (null, undefined, unknown strings) return undefined,
 * causing the resolver to fall back to the preset's default nav style.
 */
function normalizeNavbarStyle(
  value: string | null | undefined,
): NavigationStyle | undefined {
  if (value === 'colorful' || value === 'minimal' || value === 'glass') {
    return value;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────
// Source-aware overlay resolvers (P0-4 / Patch-2 P0-1)
// ─────────────────────────────────────────────────────────────────
// Removed the ambiguous "<=1 → fraction" heuristic from Sprint 8.1.
// Each source has its own resolver with explicit scale conversion.
//
// Patch-2 (P0-1): Conversion now PRESERVES the opacity percentage
// instead of rescaling to a 0-80 fraction. The schema max is 80;
// values above 80 are clamped, not rescaled.
//
// Semantic equality invariant:
//   resolveCanvaOverlay(40) === resolveDbOverlay(0.4) === resolveSchemaOverlay(40) === 40
//   resolveCanvaOverlay(100) === resolveDbOverlay(1.0) === resolveSchemaOverlay(80) === 80
// ─────────────────────────────────────────────────────────────────

/**
 * Resolve overlay from CanvaPage.overlay (0-100 integer).
 *
 * Patch-2 (P0-1): The value is treated as a percentage and CLAMPED to
 * the schema's 0-80 max. Previously Patch-1 multiplied by 0.8 — Canva 40
 * silently became 32, losing the visual meaning the teacher intended.
 *
 *   resolveCanvaOverlay(40)  → 40   (was 32 in Patch-1)
 *   resolveCanvaOverlay(80)  → 80
 *   resolveCanvaOverlay(100) → 80   (clamped)
 */
export function resolveCanvaOverlay(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  const rounded = Math.round(value);
  if (rounded < 0) return 0;
  if (rounded > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return rounded;
}

/**
 * Resolve overlay from Page.bgOverlay DB column (0-1 float).
 *
 * Patch-2 (P0-1): The 0-1 fraction is converted to a 0-100 percentage
 * and then clamped to the schema's 0-80 max. Previously Patch-1
 * multiplied by 80 — DB 0.4 silently became 32 instead of 40.
 *
 *   resolveDbOverlay(0.4) → 40   (was 32 in Patch-1)
 *   resolveDbOverlay(0.8) → 80
 *   resolveDbOverlay(1.0) → 80   (clamped)
 */
export function resolveDbOverlay(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  const scaled = Math.round(value * 100);
  if (scaled < 0) return 0;
  if (scaled > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return scaled;
}

/**
 * Resolve overlay from ScreenSchema.background.overlay (0-80 integer).
 * Output: 0-80 schema-aligned scale (clamp only, no conversion).
 *
 *   resolveSchemaOverlay(40) → 40
 *   resolveSchemaOverlay(80) → 80
 *   resolveSchemaOverlay(120) → 80   (clamped)
 */
export function resolveSchemaOverlay(
  value: number | null | undefined,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_OPACITY;
  }
  const rounded = Math.round(value);
  if (rounded < 0) return 0;
  if (rounded > MAX_OVERLAY_OPACITY) return MAX_OVERLAY_OPACITY;
  return rounded;
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

  // navbarStyle: Patch-2 (P0-2). The P1 patch correctly removed the
  // `_legacyNavbarStyle` side-channel, but went too far and silently
  // discarded the legacy value via `void input.navbarStyle`. That
  // caused projects with `navbarStyle: 'minimal'` or `'glass'` to lose
  // their chrome choice on migration.
  //
  // We now carry it through via the proper `PageStyle.navigation.style`
  // contract field. The side-channel stays removed — the value lives
  // in the contract, in a typed field, where it belongs.
  const navbarStyle = normalizeNavbarStyle(input.navbarStyle);
  if (navbarStyle) {
    page.navigation = { style: navbarStyle };
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

  // ── Patch-2 P0-3: Preserve original legacy theme identity ──────
  // The LEGACY_THEME_TO_PRESET table is intentionally many-to-one
  // (7 PPKn domain themes all map to academic-clean). Without this
  // compatibility field, the resolver would emit the preset's bridge
  // `_legacyThemeId` (e.g. 'golden-presentation') even when the source
  // legacy theme was 'macam-norma' — Sprint 8.2 would then be unable
  // to select the legacy pipeline for exact visual fidelity.
  //
  // We only set `compatibility.legacyThemeId` when the source is a
  // real legacy project (input.schemaThemeId is a non-empty string).
  // Fresh projects created directly with new preset IDs have no
  // `compatibility` field — the resolver then falls back to
  // `preset._legacyThemeId` (or undefined for `mission-adventure`).
  if (
    typeof input.schemaThemeId === 'string' &&
    input.schemaThemeId.length > 0
  ) {
    const compatibility: StyleCompatibility = {
      legacyThemeId: input.schemaThemeId,
    };
    contract.compatibility = compatibility;
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
