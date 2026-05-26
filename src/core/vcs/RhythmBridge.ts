/**
 * FASE 11A.4 — Rhythm Bridge
 *
 * Connects the VCS analysis pipeline to the layout engine.
 * This is the integration layer between:
 *   - VCS (FASE 11A.1–11A.3): resolveSectionPreset, resolveScreenRhythm
 *   - Layout Engine (FASE 11A.2): resolveSceneLayout, computeScenePlan
 *
 * Architecture:
 *   ScreenSchema
 *     → resolveSectionPreset(screen)    // FASE 11A.1
 *     → resolveScreenRhythm(screen, resolved)  // FASE 11A.2
 *     → computePerBlockGaps(blocks, rhythm)    // FASE 11A.2
 *     → perBlockGaps[] → resolveSceneLayout({ perBlockGaps })  // FASE 11A.4
 *
 * Principle: Visual Guidance Over Visual Enforcement
 *   The rhythm bridge provides better spacing, but does NOT break
 *   existing behavior. When VCS data is unavailable (legacy screens),
 *   the fixed BLOCK_GAP is used as fallback.
 *
 * Performance: All computations are memoized upstream.
 *   - resolveSectionPreset is O(blocks) — lightweight
 *   - resolveScreenRhythm is O(blocks) — lightweight
 *   - computePerBlockGaps is O(blocks) — lightweight
 *   - Total: O(blocks) per render, same as before
 */

import type { ScreenSchema } from '../schema/types';
import type { ResolvedSectionPreset, ScreenRhythm, CompositionAnalysis } from '../vcs/types';

import { resolveSectionPreset } from '../vcs/resolver';
import { resolveScreenRhythm, computePerBlockGaps } from '../vcs/TransitionRhythmEngine';
import { analyzeComposition } from '../vcs/CompositionAnalyzer';

// ═══════════════════════════════════════════════════════════════
// RHYTHM BRIDGE RESULT
// ═══════════════════════════════════════════════════════════════

/**
 * Complete VCS resolution for a screen, ready for layout consumption.
 *
 * This is the output of `resolveVCSForScreen()` — the single function
 * that the renderer calls to get all VCS data in one pass.
 *
 * Contains:
 *   - resolved: ResolvedSectionPreset (rhythm config, density config, contracts)
 *   - rhythm: ScreenRhythm (per-transition gaps, cadence score, diagnostics)
 *   - perBlockGaps: number[] (ready for resolveSceneLayout options)
 *   - compositionScore: number (0–100, for Visual Linter in FASE 11A.5)
 */
export interface VCSResolution {
  /** Resolved section preset (rhythm, density, contracts, grammar) */
  resolved: ResolvedSectionPreset;
  /** Screen rhythm (gaps, transitions, cadence) */
  rhythm: ScreenRhythm;
  /** Per-block gaps ready for resolveSceneLayout({ perBlockGaps }) */
  perBlockGaps: number[];
  /** Composition quality score 0–100 (for Visual Linter) */
  compositionScore: number;
}

/**
 * Extended VCS resolution with full CompositionAnalysis.
 *
 * Use this when you need the full diagnostics (for Visual Linter UI).
 * For layout-only usage, `resolveVCSForScreen()` is sufficient.
 */
export interface VCSResolutionWithReport extends VCSResolution {
  /** Full composition analysis with diagnostics */
  report: CompositionAnalysis;
}

// ═══════════════════════════════════════════════════════════════
// MAIN: RESOLVE VCS FOR SCREEN
// ═══════════════════════════════════════════════════════════════

/**
 * Resolves all VCS data for a screen in a single pass.
 *
 * This is the INTEGRATION FUNCTION for FASE 11A.4.
 * Call this in the renderer's useMemo to get:
 *   - perBlockGaps[] for resolveSceneLayout() and computeScenePlan()
 *   - compositionScore for Visual Linter (FASE 11A.5)
 *
 * Usage in SchemaRenderer:
 * ```tsx
 * const vcs = useMemo(() => resolveVCSForScreen(screen), [screen]);
 *
 * const resolvedBlocks = resolveSceneLayout(
 *   blocks, sceneRes, safeArea,
 *   { isCompact, perBlockGaps: vcs.perBlockGaps }
 * );
 *
 * const scenePlan = computeScenePlan(
 *   screen, sceneRes, safeArea,
 *   { isCompact, perBlockGaps: vcs.perBlockGaps }
 * );
 * ```
 *
 * @param screen - The ScreenSchema to resolve VCS for
 * @returns VCSResolution with all data needed by layout engine
 */
export function resolveVCSForScreen(screen: ScreenSchema): VCSResolution {
  // Step 1: Resolve section preset (FASE 11A.1)
  const resolved = resolveSectionPreset(screen);

  // Step 2: Resolve screen rhythm (FASE 11A.2)
  const rhythm = resolveScreenRhythm(screen.blocks, screen.templateType, screen.sectionType);

  // Step 3: Compute per-block gaps for layout engine consumption
  const perBlockGaps = computePerBlockGaps(screen.blocks, screen.templateType, screen.sectionType);

  // Step 4: Quick composition score (FASE 11A.3)
  const analysis = analyzeComposition(screen.blocks);
  const compositionScore = analysis.score;

  return {
    resolved,
    rhythm,
    perBlockGaps,
    compositionScore,
  };
}

/**
 * Resolves all VCS data including the full CompositionAnalysis.
 *
 * Use this when you need the complete diagnostics (for Visual Linter UI).
 * This is slightly more expensive than resolveVCSForScreen() because
 * it generates the full report with all sub-analyses and diagnostics.
 *
 * @param screen - The ScreenSchema to resolve VCS for
 * @returns VCSResolutionWithReport with full composition diagnostics
 */
export function resolveVCSForScreenFull(screen: ScreenSchema): VCSResolutionWithReport {
  const resolved = resolveSectionPreset(screen);
  const rhythm = resolveScreenRhythm(screen.blocks, screen.templateType, screen.sectionType);
  const perBlockGaps = computePerBlockGaps(screen.blocks, screen.templateType, screen.sectionType);
  const report = analyzeComposition(screen.blocks);

  return {
    resolved,
    rhythm,
    perBlockGaps,
    compositionScore: report.score,
    report,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Get gap array for overflow engine
// ═══════════════════════════════════════════════════════════════

/**
 * Gets the per-block gaps in the format expected by computeScenePlan().
 *
 * The computeScenePlan() function expects perBlockGaps where
 * perBlockGaps[flowBlockIndex] = gap after that flow block.
 * This is the same format as computePerBlockGaps() produces.
 *
 * @param screen - The ScreenSchema
 * @param vcs - VCSResolution from resolveVCSForScreen()
 * @returns Gap array for computeScenePlan options
 */
export function getOverflowGaps(
  screen: ScreenSchema,
  vcs: VCSResolution,
): number[] {
  // Reuse the same perBlockGaps — the format is compatible
  return vcs.perBlockGaps;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Legacy gap fallback
// ═══════════════════════════════════════════════════════════════

/**
 * Computes gap to use when VCS is not available.
 *
 * This ensures backward compatibility — when VCS resolution fails
 * or is disabled, the fixed BLOCK_GAP is used.
 *
 * @param isCompact - Whether in compact (canvas) mode
 * @returns Fixed gap value
 */
export function getLegacyGap(isCompact: boolean): number {
  return isCompact ? 8 : 12;
}
