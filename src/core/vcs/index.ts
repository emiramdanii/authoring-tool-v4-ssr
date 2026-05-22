/**
 * FASE 11A — Visual Composition Standard (VCS)
 *
 * Public API barrel export.
 * Import from '@/core/vcs' to access the VCS system.
 *
 * Architecture: 3-layer separation
 *   sectionType   → semantic intent (rhythm + density + allowed blocks)
 *   layoutGrammar → visual structure (spatial arrangement)
 *   visualIntent  → block-level visual role (border, spacing, accent)
 *
 * Principle: Visual Guidance Over Visual Enforcement
 *   VCS is a Design Assistant, NOT Design Police.
 *   Warnings guide, they don't block.
 */

// ── Types ──────────────────────────────────────────────────
export type {
  SectionType,
  LayoutGrammarKey,
  VisualIntent,
  RhythmLevel,
  RhythmConfig,
  DensityLevel,
  DensityConfig,
  SectionPreset,
  TypographyScale,
  BlockSequencePattern,
  BlockStyleContract,
  IntentStyleOverride,
  LayoutGrammarDefinition,
  ResolvedSectionPreset,
  VisualWarningSeverity,
  VisualWarning,
  // 11A.2 — Transition Rhythm
  TransitionKind,
  BlockTransitionInfo,
  ScreenRhythm,
  // 11A.3 — Composition Analysis
  BlockCompositionClass,
  DensityAnalysis,
  BalanceAnalysis,
  TextVisualRatio,
  IntentDistribution,
  CompositionAnalysis,
  // 11A.5 — Visual Linter
  LinterCategory,
  LinterGrade,
  SmartSuggestion,
  SuggestionContext,
  EnrichedVisualWarning,
  CategoryScore,
  VisualLinterResult,
} from './types';

export {
  VCS_PRINCIPLES,
  TRANSITION_GAP_MULTIPLIERS,
  VISUAL_BLOCK_TYPES,
  INTERACTIVE_BLOCK_TYPES,
  CTA_BLOCK_TYPES,
} from './types';

// ── Section Presets (11A.1) ────────────────────────────────
export {
  SECTION_PRESETS,
  inferSectionType,
  getSectionPreset,
  inferLayoutGrammar,
} from './SectionPreset';

// ── Layout Grammar (11A.1) ─────────────────────────────────
export {
  LAYOUT_GRAMMARS,
  getLayoutGrammar,
  isGrammarCompatibleWithSection,
} from './LayoutGrammar';

// ── Block Style Contracts (11A.1) ──────────────────────────
export {
  BLOCK_STYLE_CONTRACTS,
  getBlockStyleContract,
  getIntentStyle,
  isVisualBreak,
  isTextSeparator,
} from './BlockStyleContract';

// ── Transition Rhythm Engine (11A.2) ───────────────────────
export {
  classifyTransition,
  computeTransitionGap,
  getTransitionGap as computeTransitionGapFromBlocks,
  resolveScreenRhythm,
  computePerBlockGaps,
  computeCadenceScore,
  classifyBlock as classifyBlockRhythm,
} from './TransitionRhythmEngine';

// ── Composition Analyzer (11A.3) ───────────────────────────
export {
  classifyBlockComposition,
  analyzeDensity,
  analyzeBalance,
  analyzeTextVisualRatio,
  analyzeIntentDistribution,
  computeCompositionScore as computeCompositionScoreFromAnalysis,
  analyzeComposition,
} from './CompositionAnalyzer';

// ── Resolver (11A.4) — Main Entry Point ────────────────────
export {
  resolveSectionPreset,
  getTransitionGap,
  computeCompositionScore,
  resolveScreenRhythm as resolveScreenRhythmFromSchema,
  computePerBlockGaps as computePerBlockGapsFromSchema,
  analyzeComposition as analyzeCompositionFromSchema,
  resolveVCS,
} from './resolver';

export type { ResolvedVCS } from './resolver';

// ── Visual Linter (11A.5) ──────────────────────────────────
export {
  lintVisual,
  lintFromResolvedVCS,
  lintCategory,
  getSmartSuggestion,
} from './VisualLinter';
