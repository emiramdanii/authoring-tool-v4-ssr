// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Type Definitions
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
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
//         → ResolvedStyleTokens
//           → Canvas / Preview / Present / Export HTML
//
// Forbidden:
//   - Canvas computing its own style tokens
//   - Preview computing its own style tokens
//   - Export computing its own style tokens
//   - Templates hardcoding their own style tokens
//
// Sprint 8.1 constraint: this module is purely additive. It does NOT
// modify existing schema, persistence, renderer, export pipeline, or
// TemplateAdapter boundaries. Consumers will be wired in 8.2+.
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
 * Background type for a page. Teacher-facing control.
 */
export type PageBackgroundType = 'solid' | 'gradient' | 'image';

/**
 * Overlay tone for background images. Teacher-facing control.
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
 * Document-level style. Persisted in schema at the project/lesson level.
 * Affects every page in the media.
 *
 * Teachers choose `presetId` plus optional overrides. Overrides are only
 * persisted when they differ from the preset default (storage honesty).
 */
export interface DocumentStyle {
  /** Stable preset identity. Source of truth for visual DNA. */
  presetId: StylePresetId;
  /**
   * Optional accent color override. May be a token key ('y','c','g','p','o','r')
   * or a hex string ('#...'). When omitted, the preset's accent is used.
   */
  accentColor?: string;
  /** Optional text scale override. */
  fontScale?: FontScale;
  /** Optional density override. */
  density?: Density;
}

/**
 * Page-level style. Persisted in schema at the page level.
 * Affects a single page.
 *
 * All fields are optional — when omitted, the document-level defaults
 * (or preset defaults) apply.
 */
export interface PageStyle {
  background?: {
    type: PageBackgroundType;
    /** Solid color: hex string OR token key (e.g. 'bg','y'). */
    color?: string;
    /** Gradient preset ID (referenced from a future gradient registry). */
    gradientId?: string;
    /** Background image URL (data URL or remote URL). */
    imageUrl?: string;
    /** Overlay opacity 0-100. */
    overlay?: number;
    /** Overlay tone. */
    overlayType?: OverlayType;
  };
  surface?: SurfaceTreatment;
  composition?: CompositionIntent;
}

/**
 * Block-level style. Persisted in schema at the block level.
 * Affects a single block.
 *
 * All fields are optional — when omitted, the document/page defaults apply.
 */
export interface BlockStyle {
  /** Block style preset ID (e.g. 'ceria','formal','modern'). */
  presetId?: string;
  /** Block variant A/B/C. Synced with page.templateVariant by store. */
  variant?: 'A' | 'B' | 'C';
  /** Block emphasis. */
  emphasis?: BlockEmphasis;
}

/**
 * Combined style contract — the resolver's input.
 *
 * `document` is required (it carries the preset identity).
 * `page` and `block` are optional context layers.
 */
export interface StyleContract {
  document: DocumentStyle;
  page?: PageStyle;
  block?: BlockStyle;
}

/**
 * Resolved technical tokens — the resolver's output.
 *
 * Runtime-only. NEVER persisted to schema. NEVER written to a store.
 * Consumers (Canvas / Preview / Present / Export) read from this shape.
 *
 * The `_legacy*` fields are metadata for compatibility mapping during
 * the migration period (Sprint 8.1–8.4). They MUST NOT be relied upon
 * as the source of truth — only `presetId` is the contract.
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
   * Legacy themeId this contract maps to. Used by consumers during
   * migration to look up the existing `THEME_PRESETS` resolver.
   * Sprint 8.2+ will replace these lookups with direct token reads.
   */
  _legacyThemeId: string;
  /**
   * Legacy template contractId this preset maps to. Optional — only
   * presets that have a 1:1 contract mapping set this field.
   */
  _legacyContractId?: string;
}

/**
 * Teacher-facing control surface. ONLY these fields may appear in
 * teacher-facing UI pickers. Anything else is a technical token.
 *
 * Sprint 8.1 establishes the contract; the actual picker UI is Sprint 8.2.
 */
export type TeacherStyleControl =
  | { kind: 'preset'; value: StylePresetId }
  | { kind: 'accentColor'; value: string }
  | { kind: 'fontScale'; value: FontScale }
  | { kind: 'density'; value: Density }
  | { kind: 'pageBackground'; value: NonNullable<PageStyle['background']> }
  | { kind: 'surface'; value: SurfaceTreatment }
  | { kind: 'composition'; value: CompositionIntent }
  | { kind: 'blockPreset'; value: string }
  | { kind: 'blockVariant'; value: 'A' | 'B' | 'C' }
  | { kind: 'blockEmphasis'; value: BlockEmphasis };

/**
 * Technical tokens that MUST NOT be exposed directly to teachers.
 * These are derived from the preset, never edited one-by-one.
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
  | 'typography.headingFamily'
  | 'typography.bodyFamily'
  | 'typography.headingScale'
  | 'typography.bodyScale'
  | 'shape.radius'
  | 'shape.borderWidth'
  | 'shape.shadow'
  | 'spacing.pagePadding'
  | 'spacing.cardPadding'
  | 'spacing.blockGap'
  | 'navigation.style';
