/**
 * FASE 11A.1 — Visual Composition Standard (VCS) Types
 *
 * Pure data definitions for the Visual Contract Layer.
 * NO renderer changes — these types define WHAT the visual rules ARE,
 * not HOW they are applied.
 *
 * Architecture: 3-layer separation
 *   sectionType   → semantic intent (determines rhythm + density + allowed blocks)
 *   layoutGrammar → visual structure (determines spatial arrangement)
 *   theme         → color & typography (determines look & feel)
 *
 * Principle: Visual Guidance Over Visual Enforcement
 *   Engine gives guidance and composition assistance,
 *   but does NOT block authoring except for fatal overflow.
 */

// ═══════════════════════════════════════════════════════════════
// SECTION TYPE — Semantic Intent
// ═══════════════════════════════════════════════════════════════

/**
 * Semantic section types — WHAT the section is FOR.
 * Replaces the mixed `templateType` with clean semantic intent.
 *
 * Each sectionType maps to a SectionPreset that defines:
 *   - reading rhythm
 *   - content density limits
 *   - allowed block types
 *   - default layout grammar
 */
export type SectionType =
  // ── Opening sections ──
  | 'cover'          // Full-page identity + CTA
  | 'petunjuk'       // Instructions & orientation
  | 'tujuan'         // Learning objectives (TP/CP/ATP)
  | 'motivasi'       // Hook + prior knowledge activation

  // ── Content sections ──
  | 'materi'         // Core learning material
  | 'eksplorasi'     // Guided exploration (tabs/missions)
  | 'definisi'       // Key terms & definitions

  // ── Interactive sections ──
  | 'diskusi'        // Discussion & group work
  | 'skenario'       // Interactive story/branching
  | 'game'           // Gamified assessment
  | 'kuis'           // Quiz/evaluation

  // ── Closing sections ──
  | 'hasil'          // Score/appraisal display
  | 'refleksi'       // Self-reflection + portfolio
  | 'penutup'        // Closing + next meeting preview

  // ── Special ──
  | 'dokumen'        // Document viewer
  | 'custom';        // Free-form section

// ═══════════════════════════════════════════════════════════════
// LAYOUT GRAMMAR — Visual Structure
// ═══════════════════════════════════════════════════════════════

/**
 * Layout grammar keys — HOW content is spatially arranged.
 *
 * Each grammar defines:
 *   - content area shape (full-width, narrow, split, etc.)
 *   - block flow direction
 *   - safe area margins
 *   - overflow strategy
 *
 * Sections SELECT a grammar; they don't define it.
 * This separation allows the same grammar to be reused
 * across different section types.
 */
export type LayoutGrammarKey =
  // ── Full-page layouts ──
  | 'hero-center'       // Dominant center, full-bleed background
  | 'hero-split'        // 60/40 split with visual + content

  // ── Reading layouts ──
  | 'article-flow'      // Vertical flow, narrow readable column
  | 'card-flow'         // Vertical flow with card containers
  | 'tab-flow'          // Content organized in tabs, one visible

  // ── Grid layouts ──
  | 'grid-2'            // 2-column grid
  | 'grid-3'            // 3-column grid
  | 'grid-auto'         // Auto-fit responsive grid

  // ── Interactive layouts ──
  | 'game-landscape'    // Fixed game area with HUD
  | 'split-contrast'    // Two-column comparison/VS

  // ── Special ──
  | 'timeline-flow'     // Horizontal/vertical step sequence
  | 'overlay-modal'     // Overlay on top of background
  | 'free';             // No constraints (legacy/custom)

// ═══════════════════════════════════════════════════════════════
// VISUAL INTENT — Block-level visual role
// ═══════════════════════════════════════════════════════════════

/**
 * Visual intent — WHY a block is visually present.
 *
 * Same block type can have different visual treatment:
 *   def-box + 'highlight' → bold border, larger spacing, accent color
 *   def-box + 'quiet'     → subtle background, small spacing, muted
 *
 * This allows AI/template engine to say "this section needs emphasis"
 * without changing the block type.
 *
 * Visual Intent affects:
 *   - Border weight & style
 *   - Spacing (padding/margin)
 *   - Accent color intensity
 *   - Typography emphasis
 *   - Animation priority
 */
export type VisualIntent =
  | 'primary'      // Main content, dominant position
  | 'secondary'    // Supporting content, less prominent
  | 'supporting'   // Background/contextual info
  | 'quiet'        // Minimal visual weight, footnote style
  | 'highlight'    // Emphasized, draws attention
  | 'warning';     // Alert/caution, stands out

// ═══════════════════════════════════════════════════════════════
// RHYTHM — Spacing cadence
// ═══════════════════════════════════════════════════════════════

/**
 * Reading rhythm — the "beat" of visual spacing.
 *
 * Professional design uses "visual cadence":
 *   Heading → big gap
 *   Explanation → small gap
 *   Visual → big gap
 *   Activity → medium gap
 *
 * Rhythm is TRANSITION-based, not per-block:
 *   getTransitionGap(prevBlock, nextBlock, preset)
 *   NOT getGap(block)
 */
export type RhythmLevel = 'tight' | 'normal' | 'relaxed' | 'spacious';

export interface RhythmConfig {
  /** Base vertical gap between blocks (in px at 1x) */
  baseGap: number;
  /** Gap multiplier for heading → content transition */
  headingGapMultiplier: number;
  /** Gap multiplier for content → visual transition */
  visualGapMultiplier: number;
  /** Gap multiplier for visual → activity transition */
  activityGapMultiplier: number;
  /** Gap multiplier for same-type blocks (repetition) */
  repetitionGapMultiplier: number;
  /** Gap multiplier for section-ending block */
  sectionEndGapMultiplier: number;
}

// ═══════════════════════════════════════════════════════════════
// DENSITY — Content density rules
// ═══════════════════════════════════════════════════════════════

/**
 * Content density — how much content is "too much" for a section.
 *
 * Prevents visual overload by setting limits on:
 *   - Total text length per section
 *   - Maximum number of blocks
 *   - Maximum consecutive text blocks without visual break
 *   - Maximum consecutive visual blocks without text separator
 */
export type DensityLevel = 'sparse' | 'comfortable' | 'dense' | 'compact';

export interface DensityConfig {
  /** Maximum total text characters in section before suggesting split */
  maxTextChars: number;
  /** Maximum number of blocks before density warning */
  maxBlocks: number;
  /** Maximum consecutive text-only blocks before visual break needed */
  maxConsecutiveText: number;
  /** Maximum consecutive visual-only blocks before text separator needed */
  maxConsecutiveVisual: number;
  /** Maximum nested depth (ftab → materi-blok → etc.) */
  maxNestingDepth: number;
}

// ═══════════════════════════════════════════════════════════════
// SECTION PRESET — Complete visual contract per section type
// ═══════════════════════════════════════════════════════════════

/**
 * SectionPreset — the complete visual contract for a section type.
 *
 * Resolved via: resolveSectionPreset(screen)
 * Returns: { rhythm, density, contracts, grammar }
 *
 * This is the SINGLE SOURCE OF TRUTH for visual rules per section.
 * Renderer reads from this; never hardcodes visual rules.
 */
export interface SectionPreset {
  /** The section type this preset applies to */
  sectionType: SectionType;

  /** Human-readable label for this preset */
  label: string;

  /** Description of when to use this preset */
  description: string;

  /** Default layout grammar for this section type */
  defaultGrammar: LayoutGrammarKey;

  /** Allowed layout grammars (engine constrains choices) */
  allowedGrammars: LayoutGrammarKey[];

  /** Reading rhythm configuration */
  rhythm: RhythmConfig;

  /** Content density limits */
  density: DensityConfig;

  /** Allowed block types (empty = all allowed) */
  allowedBlocks?: string[];

  /** Recommended block sequence pattern */
  recommendedSequence?: BlockSequencePattern[];

  /** Typography scale override (relative to base) */
  typographyScale?: TypographyScale;

  /** Visual priority (affects how "loud" the section feels) */
  visualPriority: 'dominant' | 'standard' | 'subordinate';
}

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE
// ═══════════════════════════════════════════════════════════════

export interface TypographyScale {
  /** Heading 1 scale factor (relative to base) */
  h1: number;
  /** Heading 2 scale factor */
  h2: number;
  /** Heading 3 scale factor */
  h3: number;
  /** Body text scale factor */
  body: number;
  /** Small/caption text scale factor */
  caption: number;
  /** Line height multiplier */
  lineHeight: number;
}

// ═══════════════════════════════════════════════════════════════
// BLOCK SEQUENCE PATTERN — Recommended block ordering
// ═══════════════════════════════════════════════════════════════

/**
 * Describes a recommended position for a block type
 * within a section's block sequence.
 */
export interface BlockSequencePattern {
  /** Block type */
  blockType: string;
  /** Recommended position: 'start' | 'middle' | 'end' | 'any' */
  position: 'start' | 'middle' | 'end' | 'any';
  /** Whether this block is required in the section */
  required: boolean;
  /** Maximum instances of this block type */
  maxInstances?: number;
}

// ═══════════════════════════════════════════════════════════════
// BLOCK STYLE CONTRACT — Per-block visual role
// ═══════════════════════════════════════════════════════════════

/**
 * BlockStyleContract — the visual role a block type plays.
 *
 * Defines HOW a block should LOOK depending on:
 *   - Its visualIntent
 *   - Its section context
 *   - Its position in the reading flow
 *
 * This is NOT CSS — it's a design contract that the renderer
 * translates into actual styles.
 */
export interface BlockStyleContract {
  /** Block type this contract applies to */
  blockType: string;

  /** Default visual intent for this block type */
  defaultIntent: VisualIntent;

  /** Human-readable description of the block's visual role */
  roleDescription: string;

  /** Visual weight of this block (affects spacing around it) */
  visualWeight: 'heavy' | 'medium' | 'light' | 'minimal';

  /** Whether this block is a "visual break" (breaks text monotony) */
  isVisualBreak: boolean;

  /** Whether this block is a "text separator" (breaks visual monotony) */
  isTextSeparator: boolean;

  /** Recommended maximum width relative to content area (0-1) */
  preferredWidthRatio: number;

  /** Whether this block should span full width */
  isFullWidth: boolean;

  /** Intent-specific style overrides */
  intentStyles: Partial<Record<VisualIntent, IntentStyleOverride>>;
}

export interface IntentStyleOverride {
  /** Border emphasis level */
  borderEmphasis: 'none' | 'subtle' | 'normal' | 'strong';
  /** Background emphasis level */
  backgroundEmphasis: 'none' | 'subtle' | 'normal' | 'strong';
  /** Spacing scale multiplier */
  spacingMultiplier: number;
  /** Typography emphasis */
  typographyEmphasis: 'normal' | 'elevated' | 'prominent';
  /** Accent color usage */
  accentUsage: 'none' | 'subtle' | 'moderate' | 'strong';
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT GRAMMAR DEFINITION
// ═══════════════════════════════════════════════════════════════

/**
 * LayoutGrammar — spatial arrangement rules.
 *
 * Defines the content area shape, flow direction,
 * and constraints for a specific layout grammar.
 */
export interface LayoutGrammarDefinition {
  /** Grammar key */
  key: LayoutGrammarKey;

  /** Human-readable label */
  label: string;

  /** Description of this layout */
  description: string;

  /** Content area shape */
  contentShape: 'full' | 'narrow' | 'split' | 'grid' | 'overlay' | 'free';

  /** Primary flow direction */
  flowDirection: 'vertical' | 'horizontal' | 'grid';

  /** Safe area margins (percentage of scene width) */
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Maximum content width ratio (0-1 of scene width) */
  maxContentWidth: number;

  /** Whether this layout supports scrolling */
  supportsScroll: boolean;

  /** Overflow strategy */
  overflowStrategy: 'split' | 'compress' | 'tabify' | 'truncate' | 'ignore';

  /** Compatible section types */
  compatibleSections: SectionType[];
}

// ═══════════════════════════════════════════════════════════════
// RESOLVED PRESET — The output of resolveSectionPreset()
// ═══════════════════════════════════════════════════════════════

/**
 * The complete resolved visual contract for a screen.
 *
 * This is what the renderer (in future phases) will consume.
 * FASE 11A.1 only produces this; does NOT consume it.
 */
export interface ResolvedSectionPreset {
  /** Section type (from screen.sectionType or inferred) */
  sectionType: SectionType;

  /** Layout grammar (from screen.layoutGrammar or default) */
  grammar: LayoutGrammarKey;

  /** Rhythm configuration */
  rhythm: RhythmConfig;

  /** Density configuration */
  density: DensityConfig;

  /** Block style contracts (indexed by block type) */
  contracts: Map<string, BlockStyleContract>;

  /** Typography scale */
  typography: TypographyScale;

  /** Visual priority */
  visualPriority: 'dominant' | 'standard' | 'subordinate';

  /** Warnings from resolution (for Visual Linter in future) */
  warnings: VisualWarning[];
}

// ═══════════════════════════════════════════════════════════════
// VISUAL WARNING — For future Visual Linter (FASE 11A.5)
// ═══════════════════════════════════════════════════════════════

export type VisualWarningSeverity = 'info' | 'suggestion' | 'warning' | 'error';

export interface VisualWarning {
  /** Warning code */
  code: string;
  /** Severity level */
  severity: VisualWarningSeverity;
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Affected block/screen ID */
  targetId?: string;
}

// ═══════════════════════════════════════════════════════════════
// ENGINE PRINCIPLES — Written into the codebase
// ═══════════════════════════════════════════════════════════════

/**
 * VCS Engine Principles — the philosophy that guides all VCS decisions.
 *
 * 1. Visual Guidance Over Visual Enforcement
 *    Engine gives guidance and composition assistance,
 *    but does NOT block authoring except for fatal overflow.
 *
 * 2. Section Determines Layout, Not The Other Way Around
 *    SectionType selects LayoutGrammar, not vice versa.
 *    Content intent drives visual structure.
 *
 * 3. Transition-Based Rhythm
 *    Spacing is determined by the TRANSITION between blocks,
 *    not by individual blocks in isolation.
 *    getTransitionGap(prev, next, preset) — NOT getGap(block)
 *
 * 4. Design Assistant, Not Design Police
 *    Warnings are suggestions, not errors.
 *    Visual Linter guides, doesn't block.
 *    Quality indicator shows score, not pass/fail.
 *
 * 5. Visual Intent Decouples Role From Type
 *    Same block type can serve different visual roles.
 *    visualIntent: 'highlight' vs 'quiet' changes treatment
 *    without changing block type.
 */
export const VCS_PRINCIPLES = {
  GUIDANCE_OVER_ENFORCEMENT: 'Visual Guidance Over Visual Enforcement',
  SECTION_DRIVES_LAYOUT: 'Section Determines Layout',
  TRANSITION_RHYTHM: 'Transition-Based Rhythm',
  ASSISTANT_NOT_POLICE: 'Design Assistant, Not Design Police',
  INTENT_DECouples_ROLE: 'Visual Intent Decouples Role From Type',
} as const;
