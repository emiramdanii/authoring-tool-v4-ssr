/**
 * FASE 11A.2 — Transition Rhythm Engine
 *
 * The rhythm engine computes VARIABLE gaps between blocks based on
 * the TRANSITION between adjacent blocks — not on individual blocks.
 *
 * Principle: Transition-Based Rhythm
 *   getTransitionGap(prevBlock, nextBlock, preset)
 *   NOT getGap(block)
 *
 * This produces natural visual cadence:
 *   Heading → big gap (heading introduces content)
 *   Repetition → small gap (same-type items are grouped)
 *   Visual break → big gap (visuals need breathing room)
 *
 * Architecture:
 *   1. classifyTransition() → TransitionKind
 *   2. computeTransitionGap() → px
 *   3. resolveScreenRhythm() → ScreenRhythm (complete analysis)
 *   4. computePerBlockGaps() → number[] (for layout engines)
 *   5. computeCadenceScore() → 0-100
 */

import type { SchemaBlock } from '../schema/types';
import type {
  TransitionKind,
  BlockTransitionInfo,
  ScreenRhythm,
  VisualIntent,
  VisualWarning,
  RhythmConfig,
} from './types';
import { TRANSITION_GAP_MULTIPLIERS } from './types';
import { isVisualBreak, isTextSeparator, getBlockStyleContract } from './BlockStyleContract';
import { getSectionPreset, inferSectionType } from './SectionPreset';

// ═══════════════════════════════════════════════════════════════
// BLOCK CLASSIFICATION HELPERS
// ═══════════════════════════════════════════════════════════════

/** Block types that act as section headers/openers */
const SECTION_HEADER_TYPES = new Set([
  'materi-section', 'ftab', 'cover', 'hero',
]);

/** Block types that mark section endings */
const SECTION_CLOSER_TYPES = new Set([
  'penutup', 'rangkuman', 'hasil',
]);

/** Intent weight hierarchy for transition classification */
const INTENT_WEIGHT: Record<VisualIntent, number> = {
  'quiet': 1,
  'supporting': 2,
  'secondary': 3,
  'primary': 4,
  'warning': 5,
  'highlight': 6,
};

/**
 * Get the effective visual intent for a block.
 * Uses block.visualIntent if set, otherwise falls back to the
 * block type's default intent from its BlockStyleContract.
 */
function getEffectiveIntent(block: SchemaBlock): VisualIntent {
  if (block.visualIntent) return block.visualIntent;
  return getBlockStyleContract(block.type).defaultIntent;
}

/**
 * Classify a block as 'visual', 'interactive', or 'text' for composition.
 */
export function classifyBlock(block: SchemaBlock): 'visual' | 'interactive' | 'text' {
  const contract = getBlockStyleContract(block.type);
  if (contract.isVisualBreak) return 'visual';
  if (block.type === 'kuis' || block.type === 'cta') return 'interactive';
  return 'text';
}

// ═══════════════════════════════════════════════════════════════
// TRANSITION CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Classify the transition between two adjacent blocks.
 *
 * Resolution order (first match wins):
 *   1. Section boundary (section-open / section-close)
 *   2. Repetition (same block type)
 *   3. CTA zone (entering a CTA/hasil block)
 *   4. Milestone (entering a heavy weight block)
 *   5. Heading entry (section header introduces content)
 *   6. Interactive entry (entering an interactive block)
 *   7. Visual break (text → visual)
 *   8. Text separator (visual → text)
 *   9. Intent amplify / deescalate (escalating / de-escalating importance)
 *  10. Mixed flow (unusual transition)
 *  11. Default
 */
export function classifyTransition(
  prev: SchemaBlock,
  next: SchemaBlock,
  prevIndex: number,
  nextIndex: number,
): TransitionKind {
  const prevContract = getBlockStyleContract(prev.type);
  const nextContract = getBlockStyleContract(next.type);

  // 1. Section boundary: first block or last block transition
  if (prevIndex === 0 && SECTION_HEADER_TYPES.has(next.type)) {
    return 'section-open';
  }

  // 2. CTA zone: entering a CTA/hasil block (before section-close check)
  // hasil is both a CTA-zone and a section-closer. CTA-zone takes priority
  // because the spacing is the same (big gap) and it's more specific.
  if (next.type === 'cta' || next.type === 'hasil') {
    return 'cta-zone';
  }

  if (SECTION_CLOSER_TYPES.has(next.type)) {
    return 'section-close';
  }

  // 3. Intent amplify / deescalate (BEFORE repetition check)
  // When same-type blocks have escalating/deescalating intent,
  // the intent transition is more important than the repetition.
  const prevIntentWeight = INTENT_WEIGHT[getEffectiveIntent(prev)];
  const nextIntentWeight = INTENT_WEIGHT[getEffectiveIntent(next)];
  const intentDelta = nextIntentWeight - prevIntentWeight;
  if (intentDelta >= 2) return 'intent-amplify';
  if (intentDelta <= -2) return 'intent-deescalate';

  // 4. Repetition: same block type (after intent check)
  if (prev.type === next.type) {
    return 'repetition';
  }

  // 4. Heading entry: section header introduces content
  if (SECTION_HEADER_TYPES.has(prev.type) && !SECTION_HEADER_TYPES.has(next.type)) {
    return 'heading-entry';
  }

  // 5. Interactive entry: entering an interactive block
  const nextIsInteractive = next.type === 'kuis' || next.type === 'cta';
  const prevIsInteractive = prev.type === 'kuis' || prev.type === 'cta';
  if (nextIsInteractive && !prevIsInteractive) {
    return 'interactive-entry';
  }

  // 6. Visual break: text → visual (check BEFORE milestone)
  if (prevContract.isTextSeparator && nextContract.isVisualBreak) {
    return 'visual-break';
  }
  // Also: non-visual → visual
  if (!prevContract.isVisualBreak && nextContract.isVisualBreak) {
    return 'visual-break';
  }

  // 7. Text separator: visual → text
  if (prevContract.isVisualBreak && nextContract.isTextSeparator) {
    return 'text-separator';
  }
  // Also: visual → non-visual
  if (prevContract.isVisualBreak && !nextContract.isVisualBreak) {
    return 'text-separator';
  }

  // 8. Milestone: entering a heavy weight block from non-heavy
  if (nextContract.visualWeight === 'heavy' && prevContract.visualWeight !== 'heavy') {
    return 'milestone';
  }

  // 9. Mixed flow: unusual combination
  if (prevContract.visualWeight !== nextContract.visualWeight &&
      prevContract.isVisualBreak !== nextContract.isVisualBreak) {
    return 'mixed-flow';
  }

  // 11. Default
  return 'default';
}

// ═══════════════════════════════════════════════════════════════
// GAP COMPUTATION
// ═══════════════════════════════════════════════════════════════

/**
 * Compute the gap between two blocks based on their transition kind
 * and the section's rhythm configuration.
 *
 * Gap = baseGap × transitionMultiplier
 * Rounded to nearest integer for pixel-perfect layout.
 */
export function computeTransitionGap(
  kind: TransitionKind,
  rhythm: RhythmConfig,
): number {
  const multiplier = TRANSITION_GAP_MULTIPLIERS[kind];
  return Math.round(rhythm.baseGap * multiplier);
}

/**
 * Convenience: get gap between two blocks.
 * Classifies the transition and computes the gap in one call.
 */
export function getTransitionGap(
  prev: SchemaBlock,
  next: SchemaBlock,
  rhythm: RhythmConfig,
  prevIndex: number = 0,
  nextIndex: number = 1,
): number {
  const kind = classifyTransition(prev, next, prevIndex, nextIndex);
  return computeTransitionGap(kind, rhythm);
}

// ═══════════════════════════════════════════════════════════════
// SCREEN RHYTHM RESOLUTION
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve complete rhythm analysis for a screen.
 *
 * Input: screen's blocks + section type (from screen.sectionType or templateType)
 * Output: ScreenRhythm with per-block gaps, cadence score, and warnings
 *
 * This is the main entry point for the rhythm engine.
 * Layout engines consume perBlockGaps[] to produce variable spacing.
 */
export function resolveScreenRhythm(
  blocks: SchemaBlock[],
  templateType: string,
  sectionType?: string,
): ScreenRhythm {
  const effectiveSectionType = sectionType
    ? (sectionType as import('./types').SectionType)
    : inferSectionType(templateType);
  const preset = getSectionPreset(effectiveSectionType);
  const rhythm = preset.rhythm;

  const transitions: BlockTransitionInfo[] = [];
  const perBlockGaps: number[] = blocks.length === 0 ? [] : [0]; // First block has no gap before it

  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const next = blocks[i];
    const kind = classifyTransition!(prev, next, i - 1, i);
    const gap = computeTransitionGap(kind, rhythm);

    transitions.push({
      fromIndex: i - 1,
      toIndex: i,
      kind,
      gap,
    });
    perBlockGaps.push(gap);
  }

  const totalGapBudget = perBlockGaps.reduce((sum, g) => sum + g, 0);
  const averageGap = blocks.length > 1
    ? totalGapBudget / (blocks.length - 1)
    : 0;

  const cadenceScore = computeCadenceScore(transitions, rhythm);
  const warnings = generateRhythmWarnings(transitions, blocks);

  return {
    blockCount: blocks.length,
    transitions,
    perBlockGaps,
    cadenceScore,
    totalGapBudget,
    averageGap,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// CADENCE SCORE
// ═══════════════════════════════════════════════════════════════

/**
 * Compute cadence score (0-100) measuring rhythm quality.
 *
 * Good cadence has:
 *   - Variety in gap sizes (not all the same)
 *   - No long repetition streaks (monotony)
 *   - Breathing room around visual breaks
 *   - Balance between tight and spacious transitions
 *
 * Bad cadence:
 *   - All transitions are 'default' (no variety)
 *   - Long repetition streaks
 *   - No visual breaks
 *   - All gaps are identical
 */
export function computeCadenceScore(
  transitions: BlockTransitionInfo[],
  rhythm: RhythmConfig,
): number {
  if (transitions.length === 0) return 100; // Single block = perfect

  let score = 70; // Start at baseline

  // 1. Variety bonus (0-15): Different transition kinds = good
  const uniqueKinds = new Set(transitions.map(t => t.kind));
  const varietyRatio = uniqueKinds.size / Math.max(transitions.length, 1);
  score += Math.min(15, Math.round(varietyRatio * 15));

  // 2. Repetition streak penalty (0-20): Long streaks = monotony
  let maxRepetitionStreak = 0;
  let currentStreak = 0;
  for (const t of transitions) {
    if (t.kind === 'repetition') {
      currentStreak++;
      maxRepetitionStreak = Math.max(maxRepetitionStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  // Penalty: 5 points per streak beyond 2
  if (maxRepetitionStreak > 2) {
    score -= Math.min(20, (maxRepetitionStreak - 2) * 5);
  }

  // 3. Breathing room bonus (0-10): Visual breaks with big gaps = good
  const visualBreakGaps = transitions
    .filter(t => t.kind === 'visual-break')
    .map(t => t.gap);
  if (visualBreakGaps.length > 0) {
    const avgVisualGap = visualBreakGaps.reduce((s, g) => s + g, 0) / visualBreakGaps.length;
    const expectedVisualGap = rhythm.baseGap * TRANSITION_GAP_MULTIPLIERS['visual-break'];
    if (avgVisualGap >= expectedVisualGap * 0.8) {
      score += 10; // Visual breaks have adequate breathing room
    }
  }

  // 4. Balance bonus (0-5): Mix of tight and spacious = good rhythm
  const tightTransitions = transitions.filter(t =>
    t.kind === 'repetition' || t.kind === 'intent-deescalate' || t.kind === 'text-separator'
  ).length;
  const spaciousTransitions = transitions.filter(t =>
    t.kind === 'section-open' || t.kind === 'visual-break' || t.kind === 'heading-entry' || t.kind === 'cta-zone'
  ).length;
  if (tightTransitions > 0 && spaciousTransitions > 0) {
    const tightRatio = tightTransitions / transitions.length;
    // Ideal: 30-60% tight, rest spacious
    if (tightRatio >= 0.3 && tightRatio <= 0.6) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// ═══════════════════════════════════════════════════════════════
// RHYTHM WARNINGS
// ═══════════════════════════════════════════════════════════════

function generateRhythmWarnings(
  transitions: BlockTransitionInfo[],
  blocks: SchemaBlock[],
): VisualWarning[] {
  const warnings: VisualWarning[] = [];

  // 1. Long repetition streak
  let streak = 0;
  for (let i = 0; i < transitions.length; i++) {
    if (transitions[i]!.kind === 'repetition') {
      streak++;
      if (streak >= 4) {
        warnings.push({
          code: 'RHYTHM_REPETITION_STREAK',
          severity: 'warning',
          message: `4+ consecutive same-type blocks (${blocks[i + 1]?.type}). Consider adding a visual break.`,
          targetId: blocks[i + 1]?.id,
        });
      }
    } else {
      streak = 0;
    }
  }

  // 2. No visual breaks at all
  if (blocks.length > 4) {
    const hasVisualBreak = blocks.some(b => isVisualBreak(b.type));
    if (!hasVisualBreak) {
      warnings.push({
        code: 'RHYTHM_NO_VISUAL_BREAK',
        severity: 'suggestion',
        message: 'No visual break blocks found. Consider adding gambar, chart, or nc-grid to break text monotony.',
      });
    }
  }

  // 3. All transitions are default
  if (transitions.length > 2 && transitions.every(t => t.kind === 'default')) {
    warnings.push({
      code: 'RHYTHM_UNIFORM',
      severity: 'info',
      message: 'All transitions are default. The layout may feel flat. Consider varying block types and intents.',
    });
  }

  return warnings;
}

// ═══════════════════════════════════════════════════════════════
// PER-BLOCK GAPS HELPER
// ═══════════════════════════════════════════════════════════════

/**
 * Compute per-block gaps for a screen.
 * This is the main integration point for layout engines.
 *
 * Returns an array where:
 *   - gaps[0] = 0 (no gap before first block)
 *   - gaps[i] = gap between block[i-1] and block[i]
 *
 * Layout engines use this to apply variable spacing instead of
 * a uniform BLOCK_GAP.
 *
 * Backward compatibility: if no blocks or single block, returns [0].
 */
export function computePerBlockGaps(
  blocks: SchemaBlock[],
  templateType: string,
  sectionType?: string,
): number[] {
  if (blocks.length <= 1) return blocks.length === 0 ? [] : [0];
  const rhythm = resolveScreenRhythm(blocks, templateType, sectionType);
  return rhythm.perBlockGaps;
}
