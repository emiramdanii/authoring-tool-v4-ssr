/**
 * FASE 11A.3 — Composition Analyzer
 *
 * Analyzes the visual composition of a screen:
 *   - Density: how much content is packed into the available space
 *   - Balance: visual weight distribution (top vs bottom)
 *   - Text-to-Visual ratio: is the screen text-heavy or visual-heavy?
 *   - Intent distribution: are visual intents varied or monotonous?
 *
 * Architecture:
 *   analyzeComposition() → CompositionAnalysis
 *     ├── analyzeDensity() → DensityAnalysis
 *     ├── analyzeBalance() → BalanceAnalysis
 *     ├── analyzeTextVisualRatio() → TextVisualRatio
 *     └── analyzeIntentDistribution() → IntentDistribution
 *
 * computeCompositionScore() → number (0-100)
 *   Weighted: density 30% + balance 30% + textVisual 25% + intent 15%
 *
 * Principle: Design Assistant, Not Design Police
 *   The composition score is guidance, not enforcement.
 *   Low scores produce warnings, not errors.
 */

import type { SchemaBlock, ScreenSchema } from '../schema/types';
import type {
  VisualIntent,
  DensityAnalysis,
  BalanceAnalysis,
  TextVisualRatio,
  IntentDistribution,
  CompositionAnalysis,
  VisualWarning,
  BlockCompositionClass,
} from './types';
import {
  VISUAL_BLOCK_TYPES,
  INTERACTIVE_BLOCK_TYPES,
} from './types';
import { getBlockStyleContract } from './BlockStyleContract';
import { getSectionPreset, inferSectionType } from './SectionPreset';

// ═══════════════════════════════════════════════════════════════
// BLOCK CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Classify a block into its composition class.
 * visual: gambar, chart, code, tabel, carousel
 * interactive: kuis, input, cta
 * text: everything else
 */
export function classifyBlockComposition(blockType: string): BlockCompositionClass {
  if (VISUAL_BLOCK_TYPES.has(blockType)) return 'visual';
  if (INTERACTIVE_BLOCK_TYPES.has(blockType)) return 'interactive';
  return 'text';
}

/**
 * Get the effective visual intent for a block.
 * Uses block.visualIntent if set, otherwise falls back to default.
 */
function getEffectiveIntent(block: SchemaBlock): VisualIntent {
  if (block.visualIntent) return block.visualIntent;
  return getBlockStyleContract(block.type).defaultIntent;
}

/**
 * Get visual weight as a numeric value for balance computation.
 */
function getVisualWeightValue(block: SchemaBlock): number {
  const contract = getBlockStyleContract(block.type);
  const weightMap: Record<string, number> = {
    'heavy': 4,
    'medium': 2,
    'light': 1,
    'minimal': 0.5,
  };
  let weight = weightMap[contract.visualWeight] ?? 2;

  // Intent can amplify or reduce weight
  const intent = getEffectiveIntent(block);
  const intentMultiplier: Record<VisualIntent, number> = {
    'highlight': 1.5,
    'warning': 1.4,
    'primary': 1.2,
    'secondary': 1.0,
    'supporting': 0.8,
    'quiet': 0.6,
  };
  weight *= intentMultiplier[intent] ?? 1.0;

  return weight;
}

// ═══════════════════════════════════════════════════════════════
// DENSITY ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze content density of a screen.
 *
 * Density = content height / available height
 *   < 0.5  → sparse (too little content)
 *   0.5-0.8 → comfortable
 *   0.8-1.0 → dense
 *   > 1.0  → overloaded (overflow)
 */
export function analyzeDensity(
  blocks: SchemaBlock[],
  availableHeight: number = 720,
): DensityAnalysis {
  const blockCount = blocks.length;

  // Estimate total content height (rough estimation)
  let totalContentHeight = 0;
  for (const block of blocks) {
    const contract = getBlockStyleContract(block.type);
    // Rough height estimates by visual weight
    const heightByWeight: Record<string, number> = {
      'heavy': 300,
      'medium': 180,
      'light': 100,
      'minimal': 50,
    };
    totalContentHeight += heightByWeight[contract.visualWeight] ?? 180;
  }

  const densityRatio = availableHeight > 0
    ? totalContentHeight / availableHeight
    : 0;

  // Count consecutive streaks
  let consecutiveTextStreak = 0;
  let consecutiveVisualStreak = 0;
  let maxTextStreak = 0;
  let maxVisualStreak = 0;

  for (const block of blocks) {
    const cls = classifyBlockComposition(block.type);
    if (cls === 'text') {
      consecutiveTextStreak++;
      consecutiveVisualStreak = 0;
      maxTextStreak = Math.max(maxTextStreak, consecutiveTextStreak);
    } else if (cls === 'visual') {
      consecutiveVisualStreak++;
      consecutiveTextStreak = 0;
      maxVisualStreak = Math.max(maxVisualStreak, consecutiveVisualStreak);
    } else {
      // Interactive breaks both streaks
      consecutiveTextStreak = 0;
      consecutiveVisualStreak = 0;
    }
  }

  let level: DensityAnalysis['level'];
  if (densityRatio < 0.5) level = 'sparse';
  else if (densityRatio < 0.8) level = 'comfortable';
  else if (densityRatio <= 1.0) level = 'dense';
  else level = 'overloaded';

  return {
    blockCount,
    totalContentHeight,
    densityRatio,
    isOverDense: densityRatio > 1.0,
    consecutiveTextStreak: maxTextStreak,
    consecutiveVisualStreak: maxVisualStreak,
    level,
  };
}

// ═══════════════════════════════════════════════════════════════
// BALANCE ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze visual balance across three zones (top/middle/bottom).
 *
 * Uses gaussian scoring for smooth degradation:
 *   Score = 100 × exp(-(topHeavyRatio² / (2 × σ²)))
 *   where σ = 0.5 (standard deviation)
 *
 * This gives a smooth curve instead of a cliff-edge penalty,
 * so borderline cases don't jump dramatically in score.
 */
export function analyzeBalance(blocks: SchemaBlock[]): BalanceAnalysis {
  if (blocks.length === 0) {
    return {
      topHeavyRatio: 0,
      score: 100,
      isBalanced: true,
      weightDistribution: { top: 0, middle: 0, bottom: 0 },
    };
  }

  // Divide blocks into 3 zones
  const third = Math.max(1, Math.ceil(blocks.length / 3));
  const topBlocks = blocks.slice(0, third);
  const middleBlocks = blocks.slice(third, third * 2);
  const bottomBlocks = blocks.slice(third * 2);

  const topWeight = topBlocks.reduce((sum, b) => sum + getVisualWeightValue(b), 0);
  const middleWeight = middleBlocks.reduce((sum, b) => sum + getVisualWeightValue(b), 0);
  const bottomWeight = bottomBlocks.reduce((sum, b) => sum + getVisualWeightValue(b), 0);
  const totalWeight = topWeight + middleWeight + bottomWeight;

  const weightDistribution = totalWeight > 0 ? {
    top: topWeight / totalWeight,
    middle: middleWeight / totalWeight,
    bottom: bottomWeight / totalWeight,
  } : { top: 0.33, middle: 0.34, bottom: 0.33 };

  // Top-heavy ratio: positive = top-heavy, negative = bottom-heavy
  const topHeavyRatio = totalWeight > 0
    ? (topWeight - bottomWeight) / totalWeight
    : 0;

  // Gaussian scoring: smooth degradation
  const sigma = 0.5;
  const score = Math.round(100 * Math.exp(-(topHeavyRatio * topHeavyRatio) / (2 * sigma * sigma)));

  return {
    topHeavyRatio,
    score,
    isBalanced: score >= 60,
    weightDistribution,
  };
}

// ═══════════════════════════════════════════════════════════════
// TEXT-TO-VISUAL RATIO ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze the text-to-visual ratio.
 *
 *   ratio < 0.4  → visual-heavy
 *   ratio 0.4-0.7 → balanced
 *   ratio > 0.7  → text-heavy
 *   ratio = NaN  → empty
 */
export function analyzeTextVisualRatio(blocks: SchemaBlock[]): TextVisualRatio {
  let textBlocks = 0;
  let visualBlocks = 0;
  let interactiveBlocks = 0;

  for (const block of blocks) {
    const cls = classifyBlockComposition(block.type);
    switch (cls) {
      case 'text': textBlocks++; break;
      case 'visual': visualBlocks++; break;
      case 'interactive': interactiveBlocks++; break;
    }
  }

  const total = textBlocks + visualBlocks;
  const ratio = total > 0 ? textBlocks / total : 0;

  let assessment: TextVisualRatio['assessment'];
  if (total === 0) assessment = 'empty';
  else if (ratio > 0.7) assessment = 'text-heavy';
  else if (ratio < 0.4) assessment = 'visual-heavy';
  else assessment = 'balanced';

  return {
    textBlocks,
    visualBlocks,
    interactiveBlocks,
    ratio,
    assessment,
  };
}

// ═══════════════════════════════════════════════════════════════
// INTENT DISTRIBUTION ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze the distribution of visual intents.
 *
 * Varied = more than one intent is used.
 * Monotonous = all blocks have the same intent.
 */
export function analyzeIntentDistribution(blocks: SchemaBlock[]): IntentDistribution {
  const counts: Partial<Record<VisualIntent, number>> = {};

  for (const block of blocks) {
    const intent = getEffectiveIntent(block);
    counts[intent] = (counts[intent] || 0) + 1;
  }

  // Find dominant intent
  let dominant: VisualIntent = 'secondary';
  let maxCount = 0;
  for (const [intent, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = intent as VisualIntent;
    }
  }

  const uniqueIntents = Object.keys(counts).length;
  const isVaried = uniqueIntents >= 2 && (maxCount / Math.max(blocks.length, 1)) < 0.8;

  return {
    counts,
    dominant,
    isVaried,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITION SCORE
// ═══════════════════════════════════════════════════════════════

/**
 * Compute overall composition score (0-100).
 *
 * Weighted components:
 *   Density:  30% — comfortable density is ideal
 *   Balance:  30% — even visual weight distribution
 *   TextVisual: 25% — balanced text-to-visual ratio
 *   Intent:   15% — varied visual intents
 *
 * Returns 100 for empty screens (no content = perfect composition).
 */
export function computeCompositionScore(
  density: DensityAnalysis,
  balance: BalanceAnalysis,
  textVisual: TextVisualRatio,
  intent: IntentDistribution,
): number {
  // Density score: comfortable (0.5-0.8) = 100, sparse or dense = less
  let densityScore: number;
  if (density.densityRatio < 0.5) {
    densityScore = Math.round(density.densityRatio / 0.5 * 70); // Sparse: up to 70
  } else if (density.densityRatio <= 0.8) {
    densityScore = 100; // Comfortable: perfect
  } else if (density.densityRatio <= 1.0) {
    densityScore = Math.round(100 - (density.densityRatio - 0.8) * 150); // Dense: declining
  } else {
    densityScore = Math.max(0, Math.round(70 - (density.densityRatio - 1.0) * 100)); // Overloaded
  }

  // Balance score: directly from balance analysis
  const balanceScore = balance.score;

  // Text-visual score: balanced = 100, skewed = less
  let textVisualScore: number;
  if (textVisual.assessment === 'balanced') {
    textVisualScore = 100;
  } else if (textVisual.assessment === 'text-heavy') {
    textVisualScore = Math.round(100 - (textVisual.ratio - 0.7) * 200);
  } else if (textVisual.assessment === 'visual-heavy') {
    textVisualScore = Math.round(60 + textVisual.ratio * 100);
  } else {
    textVisualScore = 50; // Empty
  }

  // Intent score: varied = 100, monotonous = less
  const intentScore = intent.isVaried ? 100 : 50;

  // Weighted sum
  const score = Math.round(
    densityScore * 0.30 +
    balanceScore * 0.30 +
    textVisualScore * 0.25 +
    intentScore * 0.15
  );

  return Math.max(0, Math.min(100, score));
}

// ═══════════════════════════════════════════════════════════════
// FULL COMPOSITION ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Perform complete composition analysis for a screen.
 *
 * This is the main entry point for the composition analyzer.
 * Returns a CompositionAnalysis with all sub-analyses and an overall score.
 */
export function analyzeComposition(
  blocks: SchemaBlock[],
  availableHeight: number = 720,
): CompositionAnalysis {
  const density = analyzeDensity(blocks, availableHeight);
  const balance = analyzeBalance(blocks);
  const textVisualRatio = analyzeTextVisualRatio(blocks);
  const intentDistribution = analyzeIntentDistribution(blocks);

  const score = computeCompositionScore(density, balance, textVisualRatio, intentDistribution);
  const warnings = generateCompositionWarnings(density, balance, textVisualRatio, intentDistribution);

  return {
    density,
    balance,
    textVisualRatio,
    intentDistribution,
    score,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITION WARNINGS
// ═══════════════════════════════════════════════════════════════

function generateCompositionWarnings(
  density: DensityAnalysis,
  balance: BalanceAnalysis,
  textVisual: TextVisualRatio,
  intent: IntentDistribution,
): VisualWarning[] {
  const warnings: VisualWarning[] = [];

  // 1. Overloaded
  if (density.isOverDense) {
    warnings.push({
      code: 'COMPOSITION_OVERLOADED',
      severity: 'warning',
      message: `Content exceeds available space by ${Math.round((density.densityRatio - 1) * 100)}%. Consider splitting into multiple screens.`,
    });
  }

  // 2. Unbalanced
  if (!balance.isBalanced) {
    const direction = balance.topHeavyRatio > 0 ? 'top-heavy' : 'bottom-heavy';
    warnings.push({
      code: 'COMPOSITION_UNBALANCED',
      severity: 'suggestion',
      message: `Visual weight is ${direction} (balance score: ${balance.score}/100). Consider rearranging blocks.`,
    });
  }

  // 3. Text-heavy
  if (textVisual.assessment === 'text-heavy') {
    warnings.push({
      code: 'COMPOSITION_TEXT_HEAVY',
      severity: 'suggestion',
      message: `Screen is text-heavy (${Math.round(textVisual.ratio * 100)}% text blocks). Consider adding visual breaks like gambar or chart.`,
    });
  }

  // 4. Long consecutive text streak
  if (density.consecutiveTextStreak > 3) {
    warnings.push({
      code: 'COMPOSITION_TEXT_STREAK',
      severity: 'warning',
      message: `${density.consecutiveTextStreak} consecutive text blocks without visual break. Consider inserting a visual block.`,
    });
  }

  // 5. Monotonous intent
  if (!intent.isVaried && density.blockCount > 3) {
    warnings.push({
      code: 'COMPOSITION_MONOTONOUS_INTENT',
      severity: 'info',
      message: `All blocks have the same visual intent (${intent.dominant}). Consider varying intents for visual interest.`,
    });
  }

  // 6. Sparse
  if (density.level === 'sparse' && density.blockCount > 0) {
    warnings.push({
      code: 'COMPOSITION_SPARSE',
      severity: 'info',
      message: 'Screen has low content density. Consider adding more content or reducing empty space.',
    });
  }

  return warnings;
}
