/**
 * FASE 11A — VCS Resolver
 *
 * The resolver is the MAIN ENTRY POINT for the Visual Composition Standard.
 * It ties together all VCS subsystems:
 *
 *   resolveSectionPreset() — resolves the visual contract for a screen
 *   getTransitionGap()     — computes gap between two blocks
 *   computeCompositionScore() — full composition analysis + score
 *
 * Architecture:
 *   ScreenSchema → resolveSectionPreset() → ResolvedSectionPreset
 *   [prev, next] → getTransitionGap() → number
 *   ScreenSchema → computeCompositionScore() → CompositionAnalysis
 *
 * FASE 11A.4 — Layout Integration:
 *   This file wires the rhythm engine and composition analyzer
 *   into a unified pipeline that layout engines can consume.
 */

import type { SchemaBlock, ScreenSchema } from '../schema/types';
import type {
  SectionType,
  LayoutGrammarKey,
  ResolvedSectionPreset,
  RhythmConfig,
  VisualWarning,
  CompositionAnalysis,
  ScreenRhythm,
} from './types';
import { getSectionPreset, inferSectionType, inferLayoutGrammar } from './SectionPreset';
import { getBlockStyleContract } from './BlockStyleContract';
import { getLayoutGrammar, isGrammarCompatibleWithSection } from './LayoutGrammar';
import { resolveScreenRhythm, getTransitionGap as rhythmGetTransitionGap, computePerBlockGaps } from './TransitionRhythmEngine';
import { analyzeComposition, computeCompositionScore as analyzerComputeScore } from './CompositionAnalyzer';

// ═══════════════════════════════════════════════════════════════
// SECTION PRESET RESOLUTION
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve the complete visual contract for a screen.
 *
 * Resolution order:
 *   1. sectionType: from screen.sectionType (explicit) or inferred from templateType
 *   2. layoutGrammar: from screen.layoutGrammar (explicit) or default from preset
 *   3. rhythm: from preset's RhythmConfig
 *   4. density: from preset's DensityConfig
 *   5. contracts: built from BlockStyleContract registry for each block
 *   6. warnings: grammar compatibility check
 *
 * This is the SINGLE SOURCE OF TRUTH for visual rules per screen.
 * Renderer reads from ResolvedSectionPreset — never hardcodes visual rules.
 */
export function resolveSectionPreset(screen: ScreenSchema): ResolvedSectionPreset {
  // 1. Resolve section type
  const sectionType: SectionType = screen.sectionType ?? inferSectionType(screen.templateType);
  const preset = getSectionPreset(sectionType);

  // 2. Resolve layout grammar
  let grammar: LayoutGrammarKey;
  const explicitGrammar = screen.layoutGrammar;

  if (explicitGrammar) {
    // Author explicitly chose a grammar — check compatibility
    if (isGrammarCompatibleWithSection(explicitGrammar, sectionType)) {
      grammar = explicitGrammar;
    } else {
      // Grammar is incompatible — use default and warn
      grammar = preset.defaultGrammar;
    }
  } else {
    // No explicit grammar — infer from templateType or use default
    grammar = inferLayoutGrammar(screen.templateType);
    // Verify compatibility
    if (!isGrammarCompatibleWithSection(grammar, sectionType)) {
      grammar = preset.defaultGrammar;
    }
  }

  // 3. Build contracts map for each block type in the screen
  const contracts = new Map<string, ReturnType<typeof getBlockStyleContract>>();
  for (const block of screen.blocks) {
    if (!contracts.has(block.type)) {
      contracts.set(block.type, getBlockStyleContract(block.type));
    }
  }

  // 4. Typography scale
  const typography = preset.typographyScale ?? {
    h1: 2.0, h2: 1.5, h3: 1.25, body: 1.0, caption: 0.85, lineHeight: 1.6,
  };

  // 5. Warnings
  const warnings: VisualWarning[] = [];

  if (explicitGrammar && !isGrammarCompatibleWithSection(explicitGrammar, sectionType)) {
    warnings.push({
      code: 'VCS_GRAMMAR_INCOMPATIBLE',
      severity: 'warning',
      message: `Layout grammar '${explicitGrammar}' is not compatible with section type '${sectionType}'. Using '${grammar}' instead.`,
      suggestion: `Choose from: ${preset.allowedGrammars.join(', ')}`,
    });
  }

  // Check for block types not in the preset's allowedBlocks
  if (preset.allowedBlocks && preset.allowedBlocks.length > 0) {
    const allowedSet = new Set(preset.allowedBlocks);
    for (const block of screen.blocks) {
      if (!allowedSet.has(block.type)) {
        warnings.push({
          code: 'VCS_BLOCK_NOT_ALLOWED',
          severity: 'info',
          message: `Block type '${block.type}' is not typical for '${sectionType}' sections.`,
          suggestion: `Typical blocks: ${preset.allowedBlocks.join(', ')}`,
          targetId: block.id,
        });
      }
    }
  }

  return {
    sectionType,
    grammar,
    rhythm: preset.rhythm,
    density: preset.density,
    contracts,
    typography,
    visualPriority: preset.visualPriority,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// TRANSITION GAP — Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Get the gap between two blocks.
 * Uses the rhythm engine's transition-based gap computation.
 *
 * This is the layout engine's primary entry point for spacing.
 * Falls back to base gap if no preset is available.
 */
export function getTransitionGap(
  prev: SchemaBlock,
  next: SchemaBlock,
  rhythm: RhythmConfig,
  prevIndex?: number,
  nextIndex?: number,
): number {
  return rhythmGetTransitionGap(prev, next, rhythm, prevIndex, nextIndex);
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITION SCORE — Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Compute composition score for a screen.
 * This is the REAL implementation (not a stub).
 *
 * Returns a CompositionAnalysis with:
 *   - density analysis
 *   - balance analysis
 *   - text-to-visual ratio
 *   - intent distribution
 *   - overall score (0-100)
 *   - warnings
 */
export function computeCompositionScore(
  screen: ScreenSchema,
  availableHeight?: number,
): CompositionAnalysis {
  return analyzeComposition(screen.blocks, availableHeight);
}

// ═══════════════════════════════════════════════════════════════
// SCREEN RHYTHM — Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve screen rhythm for a screen.
 * Returns per-block gaps and cadence score.
 */
export { resolveScreenRhythm } from './TransitionRhythmEngine';

/**
 * Compute per-block gaps for a screen.
 * Layout engines use this to apply variable spacing.
 */
export { computePerBlockGaps } from './TransitionRhythmEngine';

// ═══════════════════════════════════════════════════════════════
// COMPOSITION ANALYSIS — Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Full composition analysis.
 */
export { analyzeComposition } from './CompositionAnalyzer';

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE: Resolve everything for a screen
// ═══════════════════════════════════════════════════════════════

/**
 * Complete VCS resolution for a screen.
 * Returns preset + rhythm + composition in one call.
 *
 * This is the ALL-IN-ONE entry point for the renderer pipeline.
 */
export interface ResolvedVCS {
  preset: ResolvedSectionPreset;
  rhythm: ScreenRhythm;
  composition: CompositionAnalysis;
}

export function resolveVCS(
  screen: ScreenSchema,
  availableHeight?: number,
): ResolvedVCS {
  const preset = resolveSectionPreset(screen);
  const rhythm = resolveScreenRhythm(screen.blocks, screen.templateType, screen.sectionType);
  const composition = analyzeComposition(screen.blocks, availableHeight);

  return { preset, rhythm, composition };
}
