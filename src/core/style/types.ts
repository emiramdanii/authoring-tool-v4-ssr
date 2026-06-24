// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Type Definitions  (Sprint 8.1-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
// Patch:    Senior Review CHANGES REQUIRED — P0-1/P0-2/P0-3/P0-4 + P1.
// Patch-2:  Senior Review CHANGES REQUIRED — P0-1/P0-2/P0-3 + P1-1/P1-2.
//
// This module defines the SINGLE source of truth for style types:
//   - DocumentStyle   → persisted, affects whole media/project
//   - PageStyle       → persisted, affects a single page
//   - BlockStyle      → persisted, affects a single block
//   - StyleContract   → combined input to the resolver
//   - ResolvedStyleTokens → runtime-only output, NEVER persisted
//
// Architectural flow:
//   Teacher Style Choice
//     → StyleContract persisted in schema
//       → resolveStyleContract()
//         → ResolvedStyleTokens  (FULLY resolved — no second resolver)
//           → Canvas / Preview / Present / Export HTML
//
// Patch-2 changes vs Patch-1:
//   - PageStyle.navigation added — legacy navbarStyle now carries through
//     instead of being silently dropped (P0-2).
//   - StyleContract.compatibility.legacyThemeId added — original legacy
//     theme identity preserved so Sprint 8.2 can still select the legacy
//     pipeline for visual fidelity (P0-3).
//   - ResolvedStyleTokens._legacyThemeId made optional — presets with no
//     real 1:1 legacy bridge (mission-adventure) no longer emit a fake
//     bridge ID (P0-3).
//   - NavigationStyle type formally modeled ('colorful'|'minimal'|'glass').
//
// Patch-1 changes (kept for context):
//   - PageBackgroundStyle aligned with ScreenSchema.background
//     (radial, color1/color2, imageFit, imageOpacity, imageBlur, overlay 0-80)
//   - ResolvedStyleTokens extended with page + block sections so every
//     teacher-facing control actually changes the output (P0-1)
//   - Semantic palette added (accents + categories) so DesignTokens
//     features (norma colors, feedback colors, phase colors) survive (P0-3)
//   - Token keys ('y','c','g',...) resolved to concrete CSS hex inside
//     the resolver — ResolvedStyleTokens is now consumer-ready (P1)
// ═══════════════════════════════════════════════════════════════════

/**
 * Stable preset identifiers. Sprint 8.1 establishes the IDENTITY only.
 * Visual polishing happens in Sprint 8.2.
 *
 * These IDs are stable contracts — once shipped, they MUST NOT be renamed
 * or reused for a different visual identity. Adding new IDs is allowed.
 */
export type StylePresetId =
  | 'academic-clean'
  | 'school-cheerful'
  | 'mission-adventure'
  | 'dark-elegant'
  | 'nusantara-nature'
  | 'modern-interactive';

/**
 * Text size multiplier. Maps to a scale factor applied on top of the
 * preset's base typography. Teacher-facing control.
 */
export type FontScale = 'compact' | 'comfortable' | 'large';

/**
 * Spacing density. Maps to the spacing scale used across the page.
 * Teacher-facing control.
 */
export type Density = 'compact' | 'comfortable' | 'spacious';

/**
 * Background type — ALIGNED with ScreenSchema.background.type.
 * Sprint 8.1 originally had 'solid' | 'gradient' | 'image'; the actual
 * schema uses 'solid' | 'gradient' | 'radial', with image layered on
 * top via separate `imageUrl` field (NOT a separate type).
 */
export type PageBackgroundType = 'solid' | 'gradient' | 'radial';

/**
 * Overlay tone — ALIGNED with ScreenSchema.background.overlayType.
 */
export type OverlayType = 'dark' | 'light' | 'gradient';

/**
 * Surface treatment for cards. Teacher-facing control.
 *   - flat      → no shadow, thin border
 *   - soft      → subtle shadow, thin border
 *   - elevated  → prominent shadow, no border
 */
export type SurfaceTreatment = 'flat' | 'soft' | 'elevated';

/**
 * Page composition intent. Teacher-facing control.
 *   - default    → standard rhythm
 *   - focus      → fewer elements, larger type
 *   - immersive  → image-driven, minimal chrome
 */
export type CompositionIntent = 'default' | 'focus' | 'immersive';

/**
 * Block emphasis. Teacher-facing control.
 *   - normal     → standard treatment
 *   - highlight  → accent border / tinted background
 *   - strong     → filled accent background, contrasting text
 */
export type BlockEmphasis = 'normal' | 'highlight' | 'strong';

/**
 * Navigation / navbar style. ALIGNED with legacy `NavConfig.navbarStyle`.
 * Patch-2 (P0-2): previously the resolver silently dropped legacy
 * `navbarStyle` after removing the `_legacyNavbarStyle` side-channel.
 * It is now formally modeled as a PageStyle override so legacy projects
 * that chose 'minimal' or 'glass' keep that choice after migration.
 *   - colorful → bold colored navbar (default for academic-clean)
 *   - minimal  → thin, unobtrusive navbar
 *   - glass    → translucent / glassmorphism navbar
 */
export type NavigationStyle = 'colorful' | 'minimal' | 'glass';

/**
 * Image fit mode — ALIGNED with ScreenSchema.background.imageFit.
 */
export type ImageFit = 'cover' | 'contain';

/**
 * Page background style — ALIGNED with ScreenSchema.background.
 *
 * Key alignment changes (P0-4):
 *   - `type` includes 'radial' (was missing in Sprint 8.1)
 *   - `color1` / `color2` replace the old `color` field (gradient support)
 *   - `imageUrl` is layered ON TOP of solid/gradient/radial — NOT a
 *     separate background type
 *   - `imageFit` / `imageOpacity` / `imageBlur` are now in the contract
 *   - `overlay` range is 0-80 (matches ScreenSchema) NOT 0-100
 *
 * Legacy adapters convert their respective scales to 0-80.
 */
export interface PageBackgroundStyle {
  type: PageBackgroundType;
  /** Primary color — hex string OR token key ('bg','y','c','g','p','o','r'). */
  color1?: string;
  /** Secondary color (gradient/radial only). */
  color2?: string;
  /** Background image URL (data URL or remote URL), layered on top. */
  imageUrl?: string;
  /** Overlay opacity 0-80. Default 40 (matches ScreenSchema). */
  overlay?: number;
  /** Overlay tone. Default 'dark'. */
  overlayType?: OverlayType;
  /** Image fit mode. Default 'cover'. */
  imageFit?: ImageFit;
  /** Image opacity 0-100. Default 100. */
  imageOpacity?: number;
  /** Image blur radius in px 0-20. Default 0. */
  imageBlur?: number;
}

/**
 * Resolved background — output form. All token keys resolved to CSS.
 * All numeric ranges normalized. Image fields passed through verbatim.
 */
export interface ResolvedBackground {
  type: PageBackgroundType;
  /** Resolved CSS color (hex), never a token key. */
  color1: string;
  /** Resolved CSS color (hex), never a token key. '' if not set. */
  color2: string;
  /** Image URL passed through verbatim. '' if not set. */
  imageUrl: string;
  /** Overlay opacity 0-80. */
  overlay: number;
  /** Overlay tone. */
  overlayType: OverlayType;
  /** Image fit. */
  imageFit: ImageFit;
  /** Image opacity 0-100. */
  imageOpacity: number;
  /** Image blur in px 0-20. */
  imageBlur: number;
}

/**
 * Document-level style. Persisted in schema at the project/lesson level.
 */
export interface DocumentStyle {
  /** Stable preset identity. Source of truth for visual DNA. */
  presetId: StylePresetId;
  /**
   * Optional accent color override. May be a token key ('y','c','g','p','o','r')
   * or a hex string ('#...'). When omitted, the preset's accent is used.
   * The resolver converts token keys to concrete CSS hex.
   */
  accentColor?: string;
  /** Optional text scale override. */
  fontScale?: FontScale;
  /** Optional density override. */
  density?: Density;
}

/**
 * Page-level style. Persisted in schema at the page level.
 * All fields optional — when omitted, document-level defaults apply.
 *
 * Patch-2 (P0-2): `navigation` added so legacy `navbarStyle` is no
 * longer silently dropped. Teachers can override the preset's default
 * navbar style per page.
 */
export interface PageStyle {
  /** Page background. Aligned with ScreenSchema.background. */
  background?: PageBackgroundStyle;
  surface?: SurfaceTreatment;
  composition?: CompositionIntent;
  /** Page-level navigation override (Patch-2 P0-2). */
  navigation?: {
    /** Navbar style override. Falls back to preset default when omitted. */
    style?: NavigationStyle;
  };
}

/**
 * Block-level style. Persisted in schema at the block level.
 */
export interface BlockStyle {
  /** Block style preset ID (e.g. 'ceria','formal','modern'). */
  presetId?: string;
  /** Block variant A/B/C. Synced with page.templateVariant by store. */
  variant?: 'A' | 'B' | 'C';
  /** Block emphasis. */
  emphasis?: BlockEmphasis;
  /**
   * Optional accent override specific to this block. Token key or hex.
   * When omitted, the document-level accent applies.
   */
  accentColor?: string;
}

/**
 * Compatibility metadata — used during the migration period to preserve
 * identity that the curated-preset mapping cannot express losslessly.
 *
 * Patch-2 (P0-3): The 17-entry LEGACY_THEME_TO_PRESET table is lossy
 * (many-to-one: 7 PPKn domain themes all map to academic-clean). Without
 * this field, the resolver would emit `preset._legacyThemeId` (e.g.
 * 'golden-presentation') even when the source legacy theme was
 * 'macam-norma' — Sprint 8.2 would then be unable to select the legacy
 * pipeline to preserve exact visual fidelity.
 *
 * `compatibility.legacyThemeId` carries the ORIGINAL legacy theme ID
 * forward so consumers in Sprint 8.2 can branch on it.
 */
export interface StyleCompatibility {
  /**
   * Original legacy `schemaThemeId` (e.g. 'macam-norma', 'golden-presentation').
   * Populated by `resolveLegacyStyle()` from `input.schemaThemeId`.
   * Undefined for fresh projects created directly with the new preset IDs.
   */
  legacyThemeId?: string;
}

/**
 * Combined style contract — the resolver's input.
 *
 * Patch-2 (P0-3): `compatibility` added so the original legacy theme
 * identity is preserved end-to-end. See StyleCompatibility docstring.
 */
export interface StyleContract {
  document: DocumentStyle;
  page?: PageStyle;
  block?: BlockStyle;
  compatibility?: StyleCompatibility;
}

/**
 * Semantic palette — covers the 6 accent colors (y/c/r/p/g/o) plus
 * domain-specific category colors (e.g. macam-norma's 4 norma types).
 * This replaces the lossy single-`accent` model from Sprint 8.1.
 *
 * All values are concrete CSS hex strings — NO token keys.
 */
export interface SemanticPalette {
  /** Standard semantic colors. */
  primary: string;
  secondary: string;
  info: string;
  warning: string;
  success: string;
  error: string;

  /** The 6 accent colors from the legacy DesignTokens.colors map. */
  accents: {
    yellow: string; // 'y'
    cyan: string; // 'c'
    red: string; // 'r'
    purple: string; // 'p'
    green: string; // 'g'
    orange: string; // 'o'
  };

  /**
   * Domain-specific category colors. Populated only when the preset
   * defines them (e.g. macam-norma). Empty record otherwise.
   * Consumers MAY read keys like 'agama', 'kesusilaan', etc.
   */
  categories: Record<string, string>;
}

/**
 * Resolved page tokens — every PageStyle field produces a change here.
 */
export interface ResolvedPageTokens {
  background: ResolvedBackground;
  surface: SurfaceTreatment;
  composition: CompositionIntent;
}

/**
 * Resolved block tokens — every BlockStyle field produces a change here.
 */
export interface ResolvedBlockTokens {
  presetId: string;
  variant: 'A' | 'B' | 'C';
  emphasis: BlockEmphasis;
  /** Resolved CSS color for the block's accent (hex, never token key). */
  accent: string;
  /**
   * Resolved CSS surface color for the block, influenced by `emphasis`:
   *   - normal    → preset surface
   *   - highlight → preset surfaceStrong
   *   - strong    → preset accent
   */
  surface: string;
  /**
   * Resolved CSS text color for the block, influenced by `emphasis`:
   *   - normal    → preset text
   *   - highlight → preset text
   *   - strong    → preset accentContrast
   */
  text: string;
  /** Resolved CSS border color for the block. */
  border: string;
}

/**
 * Resolved technical tokens — the resolver's FULLY-RESOLVED output.
 *
 * Runtime-only. NEVER persisted. Consumers read directly — no second
 * resolver needed. All token keys ('y','c','g',...) have been resolved
 * to concrete CSS hex strings.
 *
 * Patch vs Sprint 8.1:
 *   - Semantic palette added (P0-3)
 *   - `page` section added — surface/composition/background now produce
 *     visible output changes (P0-1)
 *   - `block` section added — presetId/variant/emphasis now produce
 *     visible output changes (P0-1)
 *   - All accent colors are concrete CSS hex, not token keys (P1)
 */
export interface ResolvedStyleTokens {
  colors: {
    background: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    textMuted: string;
    accent: string;
    accentContrast: string;
    border: string;
    success: string;
    error: string;
  };
  semantic: SemanticPalette;
  typography: {
    headingFamily: string;
    bodyFamily: string;
    /** CSS value for heading font-size at base scale. */
    headingScale: string;
    /** CSS value for body font-size at base scale. */
    bodyScale: string;
    /** Multiplier applied to heading/body scale based on fontScale override. */
    fontScaleMultiplier: number;
  };
  shape: {
    /** CSS border-radius value. */
    radius: string;
    /** CSS border-width value. */
    borderWidth: string;
    /** CSS box-shadow value. */
    shadow: string;
  };
  spacing: {
    density: Density;
    /** CSS padding value for page-level containers. */
    pagePadding: string;
    /** CSS padding value for card surfaces. */
    cardPadding: string;
    /** CSS gap value between sibling blocks. */
    blockGap: string;
  };
  navigation: {
    /** Navbar style: 'colorful' | 'minimal' | 'glass'. */
    style: string;
  };
  /**
   * Page-level resolved tokens. Always present (P0-1 patch).
   */
  page: ResolvedPageTokens;
  /**
   * Block-level resolved tokens. Always present (P0-1 patch).
   */
  block: ResolvedBlockTokens;
  /**
   * Legacy themeId this contract maps to. Used by consumers during
   * migration to look up the existing THEME_PRESETS resolver.
   *
   * Patch-2 (P0-3): Now optional. Source priority:
   *   1. `StyleContract.compatibility.legacyThemeId` (original legacy ID
   *      preserved by `resolveLegacyStyle()`)
   *   2. `StylePresetDefinition._legacyThemeId` (1:1 bridge for presets
   *      that have one — undefined for `mission-adventure` which has no
   *      real legacy counterpart)
   *   3. undefined
   *
   * Sprint 8.4 will remove this field.
   */
  _legacyThemeId?: string;
  /**
   * Legacy template contractId this preset maps to, if any.
   */
  _legacyContractId?: string;
}

/**
 * Teacher-facing control surface. ONLY these fields may appear in
 * teacher-facing UI pickers. Anything else is a technical token.
 */
export type TeacherStyleControl =
  | { kind: 'preset'; value: StylePresetId }
  | { kind: 'accentColor'; value: string }
  | { kind: 'fontScale'; value: FontScale }
  | { kind: 'density'; value: Density }
  | { kind: 'pageBackground'; value: PageBackgroundStyle }
  | { kind: 'surface'; value: SurfaceTreatment }
  | { kind: 'composition'; value: CompositionIntent }
  | { kind: 'pageNavigation'; value: NavigationStyle }
  | { kind: 'blockPreset'; value: string }
  | { kind: 'blockVariant'; value: 'A' | 'B' | 'C' }
  | { kind: 'blockEmphasis'; value: BlockEmphasis };

/**
 * Technical tokens that MUST NOT be exposed directly to teachers.
 */
export type TechnicalTokenKey =
  | 'colors.background'
  | 'colors.surface'
  | 'colors.surfaceStrong'
  | 'colors.text'
  | 'colors.textMuted'
  | 'colors.accent'
  | 'colors.accentContrast'
  | 'colors.border'
  | 'colors.success'
  | 'colors.error'
  | 'semantic.primary'
  | 'semantic.secondary'
  | 'semantic.info'
  | 'semantic.warning'
  | 'semantic.success'
  | 'semantic.error'
  | 'semantic.accents.yellow'
  | 'semantic.accents.cyan'
  | 'semantic.accents.red'
  | 'semantic.accents.purple'
  | 'semantic.accents.green'
  | 'semantic.accents.orange'
  | 'semantic.categories'
  | 'typography.headingFamily'
  | 'typography.bodyFamily'
  | 'typography.headingScale'
  | 'typography.bodyScale'
  | 'typography.fontScaleMultiplier'
  | 'shape.radius'
  | 'shape.borderWidth'
  | 'shape.shadow'
  | 'spacing.pagePadding'
  | 'spacing.cardPadding'
  | 'spacing.blockGap'
  | 'navigation.style';
