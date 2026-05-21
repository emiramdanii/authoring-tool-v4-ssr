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

// ═══════════════════════════════════════════════════════════════
// FASE 11A.2 — TRANSITION RHYTHM ENGINE TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Transition kinds — WHY two blocks are next to each other.
 *
 * Spacing depends on the TRANSITION between blocks, not on
 * individual blocks in isolation. This produces natural visual cadence:
 *
 *   section-open    → big gap (new section begins)
 *   heading-entry   → big gap (heading introduces content)
 *   visual-break    → big gap (visual needs breathing room)
 *   repetition      → small gap (same-type items are grouped)
 *   text-separator  → small gap (text between visuals)
 *   intent-amplify  → medium gap (escalating importance)
 *   intent-deescalate → small gap (winding down)
 *   cta-zone        → big gap (call to action stands alone)
 *   milestone       → big gap (achievement/progress marker)
 *   mixed-flow      → medium gap (unusual transition, safe default)
 *   interactive-entry → medium gap (entering interactive section)
 *   section-close   → big gap (section ending, breathing room)
 *   default         → base gap (fallback)
 */
export type TransitionKind =
  | 'section-open'
  | 'section-close'
  | 'repetition'
  | 'visual-break'
  | 'text-separator'
  | 'heading-entry'
  | 'interactive-entry'
  | 'intent-amplify'
  | 'intent-deescalate'
  | 'mixed-flow'
  | 'cta-zone'
  | 'milestone'
  | 'default';

/**
 * Gap multiplier per transition kind.
 * Applied to RhythmConfig.baseGap to produce the actual gap in px.
 */
export const TRANSITION_GAP_MULTIPLIERS: Record<TransitionKind, number> = {
  'section-open':     2.5,
  'section-close':    2.0,
  'repetition':       0.6,
  'visual-break':     2.0,
  'text-separator':   0.8,
  'heading-entry':    2.0,
  'interactive-entry': 1.8,
  'intent-amplify':   1.5,
  'intent-deescalate': 0.7,
  'mixed-flow':       1.2,
  'cta-zone':         2.5,
  'milestone':        2.2,
  'default':          1.0,
};

/**
 * Describes a single transition between two adjacent blocks.
 */
export interface BlockTransitionInfo {
  /** Index of the FIRST block in the transition */
  fromIndex: number;
  /** Index of the SECOND block in the transition */
  toIndex: number;
  /** Classified transition kind */
  kind: TransitionKind;
  /** Computed gap in px */
  gap: number;
}

/**
 * Complete rhythm analysis for a screen's block sequence.
 */
export interface ScreenRhythm {
  /** Number of blocks analyzed */
  blockCount: number;
  /** Per-transition analysis (length = blockCount - 1) */
  transitions: BlockTransitionInfo[];
  /** Per-block gaps (length = blockCount). First element = 0 (no gap before first block) */
  perBlockGaps: number[];
  /** Cadence score 0-100 (measures rhythm quality) */
  cadenceScore: number;
  /** Total gap budget (sum of all gaps) */
  totalGapBudget: number;
  /** Average gap */
  averageGap: number;
  /** Warnings about rhythm issues */
  warnings: VisualWarning[];
}

// ═══════════════════════════════════════════════════════════════
// FASE 11A.3 — COMPOSITION ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Block classification for composition purposes.
 * Different from block functionality — this is about visual role.
 *
 *   VISUAL:      gambar, chart, code, table, carousel
 *   INTERACTIVE: quiz, input, cta only
 *   TEXT:        everything else (def-box, nc-grid, diskusi, etc.)
 */
export type BlockCompositionClass = 'visual' | 'interactive' | 'text';

/**
 * Density analysis of a screen's content.
 */
export interface DensityAnalysis {
  /** Total number of blocks */
  blockCount: number;
  /** Estimated total content height in px */
  totalContentHeight: number;
  /** Ratio of content height to available height (0-1+, >1 = overflow) */
  densityRatio: number;
  /** Whether the screen is over the density limit */
  isOverDense: boolean;
  /** Longest consecutive text-only streak */
  consecutiveTextStreak: number;
  /** Longest consecutive visual-only streak */
  consecutiveVisualStreak: number;
  /** Density assessment label */
  level: 'sparse' | 'comfortable' | 'dense' | 'overloaded';
}

/**
 * Visual balance analysis.
 * Uses gaussian scoring for smooth degradation instead of cliff-edge penalties.
 */
export interface BalanceAnalysis {
  /** Top-heavy ratio (0 = balanced, >0 = top-heavy, <0 = bottom-heavy) */
  topHeavyRatio: number;
  /** Balance score 0-100 (100 = perfectly balanced) */
  score: number;
  /** Whether the screen is visually balanced */
  isBalanced: boolean;
  /** Distribution of visual weight across 3 zones (top/middle/bottom) */
  weightDistribution: {
    top: number;
    middle: number;
    bottom: number;
  };
}

/**
 * Text-to-visual ratio analysis.
 */
export interface TextVisualRatio {
  /** Number of text-classified blocks */
  textBlocks: number;
  /** Number of visual-classified blocks */
  visualBlocks: number;
  /** Number of interactive-classified blocks */
  interactiveBlocks: number;
  /** Text-to-visual ratio (text / (text + visual)) */
  ratio: number;
  /** Assessment */
  assessment: 'text-heavy' | 'balanced' | 'visual-heavy' | 'empty';
}

/**
 * Visual intent distribution analysis.
 */
export interface IntentDistribution {
  /** Count per intent */
  counts: Partial<Record<VisualIntent, number>>;
  /** Dominant intent */
  dominant: VisualIntent;
  /** Whether the distribution is varied enough */
  isVaried: boolean;
}

/**
 * Complete composition analysis for a screen.
 */
export interface CompositionAnalysis {
  /** Density analysis */
  density: DensityAnalysis;
  /** Balance analysis */
  balance: BalanceAnalysis;
  /** Text-to-visual ratio */
  textVisualRatio: TextVisualRatio;
  /** Intent distribution */
  intentDistribution: IntentDistribution;
  /** Overall composition score 0-100 */
  score: number;
  /** Warnings about composition issues */
  warnings: VisualWarning[];
}

/**
 * Block type sets for composition classification.
 * Only quiz/input/cta are truly interactive in composition terms.
 * Other "interactive" blocks (checklist, flashcard-set, reveal)
 * are classified as text because they don't fundamentally change
 * the visual rhythm like quiz/cta blocks do.
 */
export const VISUAL_BLOCK_TYPES = new Set([
  'gambar', 'chart', 'code', 'tabel', 'carousel',
]);

export const INTERACTIVE_BLOCK_TYPES = new Set([
  'kuis', 'input', 'cta',
]);

export const CTA_BLOCK_TYPES = new Set([
  'cta', 'hasil',
]);

// ═══════════════════════════════════════════════════════════════
// FASE 11A.5 — VISUAL LINTER TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Visual Linter categories — group warnings by subsystem.
 */
export type LinterCategory = 'preset' | 'rhythm' | 'composition' | 'density' | 'accessibility';

/**
 * Quality grade bands — from excellent to critical.
 * A: 90+, B: 75+, C: 60+, D: 40+, F: <40
 */
export type LinterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Smart suggestion — actionable advice for a visual warning.
 * The linter enriches every warning with a SmartSuggestion.
 */
export interface SmartSuggestion {
  /** Short actionable fix (1 line, imperative mood) */
  quickFix: string;
  /** Longer explanation with reasoning */
  reasoning: string;
  /** Specific block types that would solve the issue */
  suggestedBlockTypes?: string[];
  /** Auto-fix hint for future AI authoring assist */
  autoFixHint?: string;
}

/**
 * Context passed to getSmartSuggestion for parameterized suggestions.
 */
export interface SuggestionContext {
  sectionType?: SectionType;
  blockCount?: number;
  textRatio?: number;
  cadenceScore?: number;
  compositionScore?: number;
}

/**
 * Extended VisualWarning with linter enrichment.
 * Adds category, smart suggestion, and source tracking.
 */
export interface EnrichedVisualWarning extends VisualWarning {
  /** Which linter category this belongs to */
  category: LinterCategory;
  /** Smart suggestion (enriched by the linter) */
  smartSuggestion: SmartSuggestion;
  /** Which subsystem generated this warning */
  source: 'preset' | 'rhythm' | 'composition' | 'linter';
}

/**
 * Per-category score breakdown.
 */
export interface CategoryScore {
  /** Linter category */
  category: LinterCategory;
  /** Score 0-100 */
  score: number;
  /** Weight in composite score (0-1) */
  weight: number;
  /** Number of warnings in this category */
  warningCount: number;
}

/**
 * The complete output of the Visual Linter.
 *
 * This is a PASSIVE quality indicator — it shows score + suggestions
 * but NEVER blocks authoring. The linter is a Design Assistant,
 * not Design Police.
 *
 * Usage: lintVisual(screen) → VisualLinterResult
 */
export interface VisualLinterResult {
  /** Composite quality score 0-100 */
  score: number;
  /** Letter grade (A: 90+, B: 75+, C: 60+, D: 40+, F: <40) */
  grade: LinterGrade;
  /** Quick one-line summary for UI header */
  summary: string;
  /** Per-category score breakdown */
  categories: CategoryScore[];
  /** All warnings (collected + synthesized + enriched) */
  warnings: EnrichedVisualWarning[];
  /** Counts by severity */
  counts: {
    info: number;
    suggestion: number;
    warning: number;
    error: number;
  };
  /** Source VCS resolution (for debugging / advanced UI) */
  resolvedVCS: import('./resolver').ResolvedVCS;
}
