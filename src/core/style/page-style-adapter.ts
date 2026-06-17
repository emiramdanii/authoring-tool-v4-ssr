// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Page → StyleContract Adapter  (Sprint 8.2A)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A — Style Consumer Wiring: Canvas + Preview
//
// `createStyleContractFromPage()` is the SINGLE adapter that converts
// an actual CanvaPage (schema-driven OR legacy element page) into a
// normalized StyleContract that can be fed to `resolveStyleContract()`.
//
// Pipeline:
//   CanvaPage / ScreenSchema
//     → createStyleContractFromPage(page)
//       → StyleContract
//         → resolveStyleContract()
//           → ResolvedStyleTokens
//             → Canvas + Preview (via resolvePageStyleTokens helper)
//
// Adapter guarantees:
//   - Pure. No side effects.
//   - Deterministic. Same input → same output, always.
//   - Does NOT read Zustand / React context / DOM.
//   - Does NOT write back to page or schema.
//   - SSR-safe (no window / document access).
//   - Accepts both schema pages (page.schema) and legacy element pages.
//   - Uses resolveLegacyStyle() for legacy data — no duplicated mapping.
//   - Honors page.contractId as highest-priority metadata.
//   - Preserves original legacyThemeId via compatibility.legacyThemeId.
//
// Source priority (matches Sprint 8.1-Patch-2 integration guard):
//   1. page.contractId eksplisit           → source: 'explicit-contract'
//   2. compatibility.legacyThemeId /        → source: 'legacy-theme'
//      schemaThemeId lama
//   3. preset._legacyContractId sebagai     → source: 'new-preset'
//      bridge (preset-driven)
//   4. default style contract               → source: 'default'
//
// `page.contractId` NEVER gets overwritten by `preset._legacyContractId`.
// The contract id remains a page-level persistent field with its own
// authority — see `TemplateThemeContract` for the legacy enforcement
// pipeline (Sprint 8.2B will wire Present/Export through the same path).
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage, NavConfig } from '@/components/canva/types';
import type { ScreenSchema } from '@/core/schema/types';
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
import {
  DEFAULT_PRESET_ID,
} from './defaults';
import {
  isValidPresetId,
} from './preset-registry';
import {
  LEGACY_THEME_TO_PRESET,
  resolveLegacyStyle,
  type LegacyStyleInput,
} from './legacy-style-adapter';

// ─────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────

/**
 * Input to `createStyleContractFromPage()`. Wraps a single CanvaPage.
 * The page is treated as read-only — the adapter never mutates it.
 */
export interface PageStyleAdapterInput {
  page: CanvaPage;
}

/**
 * Classification of how the contract was derived. Consumers in
 * Sprint 8.2B+ may branch on this (e.g. show "Legacy theme: macam-norma"
 * in the teacher picker, or hide the picker entirely when an
 * explicit contract is active).
 *
 *   'explicit-contract' — page.contractId is set. The legacy
 *                         TemplateThemeContract enforcement pipeline
 *                         remains the authority; this StyleContract
 *                         is consulted only for tokens that the
 *                         contract doesn't override (background image
 *                         layer, navbar style, etc).
 *   'legacy-theme'      — page has a real legacy schemaThemeId OR
 *                         page.schema.themeId. The original theme id
 *                         is preserved via compatibility.legacyThemeId
 *                         so Sprint 8.2B can still branch on it.
 *   'new-preset'        — page.schema.themeId is a valid StylePresetId
 *                         (or schemaThemeId maps to a preset bridge).
 *                         Fresh projects created with the new picker
 *                         land here.
 *   'default'           — none of the above. Falls back to
 *                         DEFAULT_PRESET_ID (academic-clean) for
 *                         visual stability.
 */
export type PageStyleSource =
  | 'explicit-contract'
  | 'legacy-theme'
  | 'new-preset'
  | 'default';

/**
 * Result of `createStyleContractFromPage()`. The `contract` field is
 * ready to be fed to `resolveStyleContract()`. The metadata fields
 * tell consumers WHY this contract was chosen.
 */
export interface PageStyleAdapterResult {
  /** The normalized StyleContract. Always non-null. */
  contract: StyleContract;
  /** How the contract was derived (see PageStyleSource docstring). */
  source: PageStyleSource;
  /**
   * The original `page.contractId` value, when source === 'explicit-contract'.
   * Undefined otherwise. Consumers MUST treat this as the highest-
   * authority metadata — `preset._legacyContractId` is only a bridge
   * and never replaces a page-level contract id.
   */
  explicitContractId?: string;
  /**
   * The original legacy theme id, when the page carries a KNOWN legacy
   * theme id (one that has an entry in LEGACY_THEME_TO_PRESET).
   * Undefined for fresh projects and for unrecognized theme ids.
   *
   * This is the SAME value as `contract.compatibility?.legacyThemeId`
   * — exposed as a top-level field for convenience so consumers don't
   * have to drill into the contract structure.
   *
   * Patch (P1-hardening — Senior Review 8.2A): separated from
   * `unrecognizedThemeId`. Only KNOWN legacy IDs land here, so
   * downstream consumers (Sprint 8.2B legacy renderer branch) can
   * safely use this field without validating it.
   */
  legacyThemeId?: string;
  /**
   * The schemaThemeId value when it is NOT a known legacy theme id
   * and NOT a valid StylePresetId. Diagnostic only — consumers MUST
   * NOT feed this to a legacy renderer (it would fail to resolve).
   *
   * Patch (P1-hardening — Senior Review 8.2A): previously the adapter
   * set `legacyThemeId` to the unrecognized string, which risked
   * downstream consumers attempting to look it up in THEME_PRESETS
   * and crashing. The unrecognized value is now isolated here for
   * telemetry / debugging / teacher-facing "theme not recognized"
   * warnings.
   */
  unrecognizedThemeId?: string;
  /**
   * The StylePresetId chosen by the adapter. Always set — defaults
   * to DEFAULT_PRESET_ID when nothing else applies.
   */
  presetId: StylePresetId;
}

// ─────────────────────────────────────────────────────────────────
// Helpers — schema background mapping
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a ScreenSchema.background into the StyleContract's
 * PageBackgroundStyle. NO scale conversion — schema overlay is
 * already on the 0-80 scale (matches MAX_OVERLAY_OPACITY).
 *
 * Schema fields are passed through verbatim; only the type field
 * is constrained to the Style Contract's PageBackgroundType union.
 *
 * Patch (P1-2 — Senior Review 8.2A): ALL fields are copied when
 * present, REGARDLESS of whether `imageUrl` is set. The previous
 * implementation skipped overlay/overlayType/imageFit/imageOpacity/
 * imageBlur when imageUrl was absent — that silently dropped data
 * the contract promised to preserve. The contract states "no field
 * is lost"; this function now honors that literally.
 *
 * Consumers that consider overlay meaningless without an image are
 * free to ignore it — but the adapter must not drop it.
 */
function mapSchemaBackground(
  schemaBg: ScreenSchema['background'],
): PageBackgroundStyle | undefined {
  if (!schemaBg) return undefined;

  const bg: PageBackgroundStyle = {
    type: schemaBg.type,
  };

  // Colors — passed through verbatim. May be hex OR token key;
  // the resolver handles both.
  if (typeof schemaBg.color1 === 'string' && schemaBg.color1.length > 0) {
    bg.color1 = schemaBg.color1;
  }
  if (typeof schemaBg.color2 === 'string' && schemaBg.color2.length > 0) {
    bg.color2 = schemaBg.color2;
  }

  // Image URL — layered ON TOP of solid/gradient/radial. Passed
  // through verbatim (may be '' when not set).
  if (typeof schemaBg.imageUrl === 'string' && schemaBg.imageUrl.length > 0) {
    bg.imageUrl = schemaBg.imageUrl;
  }

  // P1-2: ALL overlay/image fields copied unconditionally when present.
  // The contract guarantees "no field loss"; the adapter must not
  // second-guess whether a field is meaningful.
  if (typeof schemaBg.overlay === 'number') {
    bg.overlay = schemaBg.overlay;
  }
  if (schemaBg.overlayType) {
    bg.overlayType = schemaBg.overlayType;
  }
  if (schemaBg.imageFit) {
    bg.imageFit = schemaBg.imageFit;
  }
  if (typeof schemaBg.imageOpacity === 'number') {
    bg.imageOpacity = schemaBg.imageOpacity;
  }
  if (typeof schemaBg.imageBlur === 'number') {
    bg.imageBlur = schemaBg.imageBlur;
  }

  return bg;
}

/**
 * Normalize navbarStyle from NavConfig. Returns undefined for
 * invalid values so the resolver falls back to preset default.
 */
function normalizeNavbarStyle(
  value: string | null | undefined,
): NavigationStyle | undefined {
  if (value === 'colorful' || value === 'minimal' || value === 'glass') {
    return value;
  }
  return undefined;
}

/**
 * Extract navbarStyle from page.navConfig, with fail-safe default.
 */
function extractNavigationStyle(
  navConfig: NavConfig | undefined,
): NavigationStyle | undefined {
  if (!navConfig) return undefined;
  return normalizeNavbarStyle(navConfig.navbarStyle);
}

// ─────────────────────────────────────────────────────────────────
// Helpers — schema block extraction (best-effort, non-destructive)
// ─────────────────────────────────────────────────────────────────

/**
 * Extract block-level style from a schema page's content blocks.
 *
 * Patch (P0-4 — Senior Review 8.2A): The previous implementation
 * only copied `stylePreset` from the first block that had one, then
 * `break`-ed out of the loop. `accentColor`, `borderColor`,
 * `emphasis`, and per-block `variant` were silently dropped.
 *
 * The new implementation iterates ALL blocks and collects the first
 * non-empty value for EACH field independently. This means:
 *   - block.presetId       ← first block with stylePreset
 *   - block.variant        ← first block with variant (or templateVariant fallback)
 *   - block.accentColor    ← first block with accentColor (token key or hex)
 *   - block.emphasis       ← first block with emphasis ('normal'|'highlight'|'strong')
 *
 * `borderColor` is intentionally NOT surfaced as a top-level
 * BlockStyle field — the Style Contract models block accent via
 * `accentColor` only. If a schema block has only `borderColor`, we
 * treat it as an accent hint (resolveColor handles both token keys
 * and hex strings).
 *
 * The Style Contract block section is a PAGE-LEVEL hint. Per-block
 * style is the existing block-style-preset system's responsibility.
 * This extraction is best-effort: it surfaces the first non-empty
 * value per field so the resolver can produce non-default block
 * tokens for pages whose blocks carry explicit styling hints.
 */
function extractBlockStyleFromSchema(
  schema: ScreenSchema | undefined,
  templateVariant: 'A' | 'B' | 'C' | undefined,
): BlockStyle {
  const block: BlockStyle = {};

  if (templateVariant) {
    block.variant = templateVariant;
  }

  if (!schema) return block;

  // Iterate ALL blocks. For each field, take the first non-empty
  // value we encounter. DO NOT break early — different blocks may
  // carry different hints, and we want to surface every field.
  for (const schemaBlock of schema.blocks) {
    const maybe = schemaBlock as unknown as {
      stylePreset?: string;
      variant?: 'A' | 'B' | 'C';
      accentColor?: string;
      borderColor?: string;
      emphasis?: 'normal' | 'highlight' | 'strong';
    };

    if (
      !block.presetId &&
      typeof maybe.stylePreset === 'string' &&
      maybe.stylePreset.length > 0
    ) {
      block.presetId = maybe.stylePreset;
    }

    if (!block.variant && (maybe.variant === 'A' || maybe.variant === 'B' || maybe.variant === 'C')) {
      block.variant = maybe.variant;
    }

    if (
      !block.accentColor &&
      typeof maybe.accentColor === 'string' &&
      maybe.accentColor.length > 0
    ) {
      block.accentColor = maybe.accentColor;
    } else if (
      !block.accentColor &&
      typeof maybe.borderColor === 'string' &&
      maybe.borderColor.length > 0
    ) {
      // borderColor as accent hint — Style Contract models accent
      // via accentColor only. resolveColor handles both token keys
      // ('y','c','g',...) and hex strings.
      block.accentColor = maybe.borderColor;
    }

    if (
      !block.emphasis &&
      (maybe.emphasis === 'normal' || maybe.emphasis === 'highlight' || maybe.emphasis === 'strong')
    ) {
      block.emphasis = maybe.emphasis;
    }

    // Continue iterating — we want the first non-empty value PER FIELD,
    // not per block. Once all four fields are populated we can stop.
    if (block.presetId && block.variant && block.accentColor && block.emphasis) {
      break;
    }
  }

  return block;
}

// ─────────────────────────────────────────────────────────────────
// THE adapter
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a CanvaPage into a normalized StyleContract.
 *
 * Pure. Deterministic. No side effects. SSR-safe.
 *
 * @param input — wraps a single CanvaPage (schema OR legacy)
 * @returns PageStyleAdapterResult — contract + source metadata
 */
export function createStyleContractFromPage(
  input: PageStyleAdapterInput,
): PageStyleAdapterResult {
  const page = input.page;

  // ═══ 1. Priority 1: explicit page.contractId ═══════════════════
  // When set, the contract remains the authority for visual
  // enforcement (via TemplateThemeContract pipeline in PageRenderer).
  // The StyleContract we produce here is still useful: it carries
  // background image, overlay, navbar style, and block hints that
  // the contract doesn't override.
  const explicitContractId =
    typeof page.contractId === 'string' && page.contractId.length > 0
      ? page.contractId
      : undefined;

  // ═══ 2. Detect schema page vs legacy element page ═════════════
  // page.schema (when present) is the canonical runtime representation.
  // page.templateData.schemaThemeId is the legacy bridge — kept in
  // sync by setSchemaThemeId() during the migration period.
  const schema: ScreenSchema | undefined = page.schema;
  const legacySchemaThemeId =
    typeof page.templateData?.schemaThemeId === 'string'
      ? (page.templateData.schemaThemeId as string)
      : undefined;
  const schemaThemeId = schema?.themeId || legacySchemaThemeId;

  // ═══ 3. Decide presetId + source classification ═══════════════
  // Patch (P1-hardening — Senior Review 8.2A): separate `legacyThemeId`
  // (KNOWN legacy id, safe for downstream consumers) from
  // `unrecognizedThemeId` (diagnostic only — must NOT be fed to a
  // legacy renderer because it would fail to resolve).
  let presetId: StylePresetId;
  let source: PageStyleSource;
  let legacyThemeId: string | undefined;
  let unrecognizedThemeId: string | undefined;

  if (explicitContractId) {
    // Priority 1: explicit contract. presetId is derived from the
    // theme id (if any) so tokens stay consistent; the contract
    // enforcement layer in PageRenderer will apply its own overrides.
    source = 'explicit-contract';
    if (schemaThemeId && schemaThemeId in LEGACY_THEME_TO_PRESET) {
      presetId = LEGACY_THEME_TO_PRESET[schemaThemeId]!;
      legacyThemeId = schemaThemeId;
    } else if (schemaThemeId && isValidPresetId(schemaThemeId)) {
      presetId = schemaThemeId as StylePresetId;
    } else if (schemaThemeId) {
      // Explicit contract + unrecognized theme id — keep the theme id
      // as diagnostic only; do NOT treat it as a known legacy id.
      presetId = DEFAULT_PRESET_ID;
      unrecognizedThemeId = schemaThemeId;
    } else {
      presetId = DEFAULT_PRESET_ID;
    }
  } else if (schemaThemeId) {
    // We have a theme id but no explicit contract.
    if (isValidPresetId(schemaThemeId)) {
      // It's already a new preset id (fresh project).
      presetId = schemaThemeId as StylePresetId;
      source = 'new-preset';
    } else if (schemaThemeId in LEGACY_THEME_TO_PRESET) {
      // Real legacy theme id — preserve identity via compatibility.
      presetId = LEGACY_THEME_TO_PRESET[schemaThemeId]!;
      source = 'legacy-theme';
      legacyThemeId = schemaThemeId;
    } else {
      // Unknown theme id — fail-safe to default. NOT throw.
      // The unrecognized id is kept as `unrecognizedThemeId`
      // (diagnostic only) so downstream consumers don't try to look
      // it up in THEME_PRESETS and crash.
      presetId = DEFAULT_PRESET_ID;
      source = 'default';
      unrecognizedThemeId = schemaThemeId;
    }
  } else {
    // No theme id at all. Could be a fresh custom page or a legacy
    // element-only page that never had a schemaThemeId set.
    presetId = DEFAULT_PRESET_ID;
    source = 'default';
  }

  // ═══ 4. Build PageStyle (background + navigation) ═════════════
  let pageStyle: PageStyle | undefined;

  if (schema) {
    // Schema-first page — use mapSchemaBackground (no scale conversion).
    const background = mapSchemaBackground(schema.background);
    const navigationStyle = extractNavigationStyle(page.navConfig);

    if (background || navigationStyle) {
      pageStyle = {};
      if (background) pageStyle.background = background;
      if (navigationStyle) {
        pageStyle.navigation = { style: navigationStyle };
      }
    }
  } else {
    // Legacy element page — delegate to resolveLegacyStyle() for the
    // background + overlay conversion (Canva 0-100 → 0-80 schema scale,
    // preserving percentage). We DON'T pass schemaThemeId here because
    // we've already computed presetId above; passing it would cause
    // resolveLegacyStyle to re-derive the same preset (redundant but
    // harmless). We pass it anyway so compatibility.legacyThemeId is
    // populated by the legacy adapter (single source of truth for
    // that field).
    const legacyInput: LegacyStyleInput = {
      schemaThemeId: schemaThemeId ?? null,
      bgColor: page.bgColor || null,
      bgDataUrl: page.bgDataUrl || null,
      // Legacy CanvaPage.overlay is on the 0-100 scale (Canva source).
      // The legacy adapter clamps to 0-80 — Patch-2 invariant:
      //   Canva 40 → 40 (NOT 32)
      overlay: page.overlay,
      overlaySource: 'canva',
      navbarStyle: page.navConfig?.navbarStyle ?? null,
    };
    const legacyContract = resolveLegacyStyle(legacyInput);
    if (legacyContract.page) {
      pageStyle = legacyContract.page;
    }
    // The legacy adapter sets `compatibility.legacyThemeId` whenever
    // input.schemaThemeId is non-empty — even for unrecognized ids.
    // We honor that setting ONLY when the id is a KNOWN legacy theme.
    // Unrecognized ids are routed to `unrecognizedThemeId` instead
    // (P1-hardening — Senior Review 8.2A).
    const legacyCompatId = legacyContract.compatibility?.legacyThemeId;
    if (legacyCompatId && legacyCompatId in LEGACY_THEME_TO_PRESET) {
      legacyThemeId = legacyCompatId;
    } else if (legacyCompatId) {
      unrecognizedThemeId = legacyCompatId;
    }
  }

  // ═══ 5. Build DocumentStyle + BlockStyle ══════════════════════
  const document: DocumentStyle = {
    presetId,
  };

  // Block style: extract variant from page.templateVariant + schema hints.
  const templateVariant =
    page.templateVariant === 'A' || page.templateVariant === 'B' || page.templateVariant === 'C'
      ? page.templateVariant
      : undefined;
  const blockStyle = extractBlockStyleFromSchema(schema, templateVariant);

  // ═══ 6. Assemble StyleContract ═════════════════════════════════
  const contract: StyleContract = {
    document,
  };
  if (pageStyle) {
    contract.page = pageStyle;
  }
  if (Object.keys(blockStyle).length > 0) {
    contract.block = blockStyle;
  }

  // Compatibility — preserve original legacy theme id end-to-end.
  // This is the SINGLE source that the resolver reads to emit
  // `ResolvedStyleTokens._legacyThemeId`. See resolve-style-contract.ts
  // P0-3 priority chain:
  //   1. input.compatibility?.legacyThemeId  (← we set this here)
  //   2. preset._legacyThemeId               (1:1 bridge, may be undefined)
  //   3. undefined
  if (legacyThemeId) {
    const compatibility: StyleCompatibility = { legacyThemeId };
    contract.compatibility = compatibility;
  }

  return {
    contract,
    source,
    explicitContractId,
    legacyThemeId,
    unrecognizedThemeId,
    presetId,
  };
}
