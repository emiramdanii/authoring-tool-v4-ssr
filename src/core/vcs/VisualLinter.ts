/**
 * FASE 11A.5 — Visual Linter
 *
 * PASSIVE quality indicator for visual composition.
 * Collects warnings from VCS subsystems, enriches with smart suggestions,
 * and produces a composite quality score with letter grade.
 *
 * Principle: Design Assistant, Not Design Police
 *   - Linter shows score + suggestions but NEVER blocks authoring
 *   - Warnings guide, they don't enforce
 *   - Quality indicator is informational, not pass/fail
 *
 * Architecture:
 *   ScreenSchema → resolveVCS() → lintFromResolvedVCS() → VisualLinterResult
 *
 * The linter is a POST-HOC enrichment layer:
 *   1. Collect warnings from preset, rhythm, composition subsystems
 *   2. Synthesize cross-cutting warnings (dual-issue, accessibility, sequence)
 *   3. Deduplicate (same code + targetId → keep highest severity)
 *   4. Enrich each warning with SmartSuggestion
 *   5. Compute composite score + grade
 */

import type { ScreenSchema } from '../schema/types';
import type {
  LinterCategory,
  LinterGrade,
  SmartSuggestion,
  SuggestionContext,
  EnrichedVisualWarning,
  CategoryScore,
  VisualLinterResult,
  VisualWarning,
  VisualWarningSeverity,
} from './types';
import { resolveVCS, type ResolvedVCS } from './resolver';
import { getSectionPreset } from './SectionPreset';

// ═══════════════════════════════════════════════════════════════
// SMART SUGGESTION REGISTRY
// ═══════════════════════════════════════════════════════════════

/**
 * Registry of smart suggestions per warning code.
 * Each code maps to a template suggestion that gets enriched
 * with context-specific values at runtime.
 */
const SUGGESTION_REGISTRY: Record<string, SmartSuggestion> = {
  // ── Preset warnings ──
  VCS_GRAMMAR_INCOMPATIBLE: {
    quickFix: 'Switch layout grammar to match section intent',
    reasoning: 'Section type determines layout — mismatch creates visual dissonance. Each section type has specific grammars designed for its content flow.',
    autoFixHint: 'preset.allowedGrammars[0]',
  },
  VCS_BLOCK_NOT_ALLOWED: {
    quickFix: 'Replace with a typical block for this section',
    reasoning: 'Atypical blocks may confuse the reading flow. Each section type has recommended blocks that match its pedagogical purpose.',
  },

  // ── Rhythm warnings ──
  RHYTHM_REPETITION_STREAK: {
    quickFix: 'Insert a visual or interactive block between repeats',
    reasoning: '4+ same-type blocks create monotony — the eye needs variety to maintain engagement. A visual break resets attention.',
    suggestedBlockTypes: ['gambar', 'nc-grid', 'reveal'],
    autoFixHint: "insertBlockAfter(index, 'gambar')",
  },
  RHYTHM_NO_VISUAL_BREAK: {
    quickFix: 'Add an image, chart, or card grid',
    reasoning: 'Screens with more than 4 blocks need visual anchors to break text walls. Visual elements aid comprehension and retention.',
    suggestedBlockTypes: ['gambar', 'chart', 'nc-grid', 'tabel'],
  },
  RHYTHM_UNIFORM: {
    quickFix: 'Vary block types or set different visual intents',
    reasoning: 'All-default transitions produce a flat, undifferentiated reading experience. Varying block types creates natural visual hierarchy.',
    autoFixHint: "setIntent(index, 'highlight')",
  },

  // ── Composition warnings ──
  COMPOSITION_OVERLOADED: {
    quickFix: 'Split into 2 screens to preserve readability',
    reasoning: 'Overflow forces scrolling or compression — splitting preserves readability and ensures all content is visible without degradation.',
    autoFixHint: 'splitAt(densestIndex)',
  },
  COMPOSITION_UNBALANCED: {
    quickFix: 'Move a heavy block to balance visual weight',
    reasoning: 'Top-heavy or bottom-heavy layouts feel unstable. Distributing visual weight evenly creates a more professional appearance.',
  },
  COMPOSITION_TEXT_HEAVY: {
    quickFix: 'Add a gambar or nc-grid block for visual variety',
    reasoning: 'Text-heavy screens (more than 70% text blocks) create "wall of text" effect. Visual elements break monotony and aid retention.',
    suggestedBlockTypes: ['gambar', 'nc-grid', 'chart'],
  },
  COMPOSITION_TEXT_STREAK: {
    quickFix: 'Insert a visual break between text blocks',
    reasoning: '3+ consecutive text blocks cause scanning fatigue. Visual breaks give the eye a rest and improve information processing.',
    suggestedBlockTypes: ['gambar', 'reveal', 'compare'],
  },
  COMPOSITION_MONOTONOUS_INTENT: {
    quickFix: "Set key blocks to 'highlight' or 'quiet' for visual hierarchy",
    reasoning: 'Uniform intent means no visual hierarchy — readers cannot distinguish importance. Differentiating key content improves scanning.',
    autoFixHint: "setIntent(keyIndex, 'highlight')",
  },
  COMPOSITION_SPARSE: {
    quickFix: 'Add more content or reduce empty space',
    reasoning: 'Sparse screens waste visual real estate and feel incomplete. Consider adding supporting content or consolidating into fewer screens.',
  },

  // ── Cross-cutting linter warnings ──
  LINTER_DUAL_ISSUE: {
    quickFix: 'Address both rhythm and composition for best results',
    reasoning: 'Fixing only one dimension leaves the other dragging the score down. Combined improvements compound for better visual quality.',
  },
  LINTER_SEQUENCE_ABNORMAL: {
    quickFix: 'Consider the recommended block sequence for this section',
    reasoning: 'Section presets define ideal block ordering based on pedagogical patterns. Following the sequence improves learning flow.',
  },
};

// ═══════════════════════════════════════════════════════════════
// CATEGORY CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Map warning code prefix to linter category.
 */
function categorize(code: string): LinterCategory {
  if (code.startsWith('VCS_')) return 'preset';
  if (code.startsWith('RHYTHM_')) return 'rhythm';
  if (code.startsWith('COMPOSITION_DENSITY') || code === 'COMPOSITION_OVERLOADED' || code === 'COMPOSITION_SPARSE') return 'density';
  if (code.startsWith('COMPOSITION_')) return 'composition';
  if (code.startsWith('LINTER_ACCESSIBILITY')) return 'accessibility';
  if (code.startsWith('LINTER_')) return 'composition'; // cross-cutting defaults to composition
  return 'composition';
}

// ═══════════════════════════════════════════════════════════════
// SEVERITY ORDERING (for dedup)
// ═══════════════════════════════════════════════════════════════

const SEVERITY_RANK: Record<VisualWarningSeverity, number> = {
  info: 0,
  suggestion: 1,
  warning: 2,
  error: 3,
};

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Deduplicate warnings: same code + targetId → keep highest severity.
 * This prevents duplicate warnings when multiple subsystems flag the same issue.
 */
function deduplicateWarnings(
  warnings: Array<EnrichedVisualWarning>,
): EnrichedVisualWarning[] {
  const seen = new Map<string, EnrichedVisualWarning>();

  for (const w of warnings) {
    const key = `${w.code}::${w.targetId ?? '_'}`;
    const existing = seen.get(key);
    if (!existing || SEVERITY_RANK[w.severity] > SEVERITY_RANK[existing.severity]) {
      seen.set(key, w);
    }
  }

  return Array.from(seen.values());
}

// ═══════════════════════════════════════════════════════════════
// CROSS-CUTTING SYNTHESIS
// ═══════════════════════════════════════════════════════════════

/**
 * Synthesize cross-cutting warnings that no single subsystem can detect.
 * These require looking at the overall VCS resolution holistically.
 */
function synthesizeCrossCutting(
  resolved: ResolvedVCS,
  screen?: ScreenSchema,
): EnrichedVisualWarning[] {
  const { preset, rhythm, composition } = resolved;
  const warnings: EnrichedVisualWarning[] = [];

  // LINTER_DUAL_ISSUE: both rhythm AND composition have issues
  if (
    rhythm.warnings.length > 0 &&
    composition.warnings.length > 0 &&
    rhythm.cadenceScore < 70 &&
    composition.score < 70
  ) {
    warnings.push({
      code: 'LINTER_DUAL_ISSUE',
      severity: 'warning',
      message: 'Both rhythm and composition need improvement. Addressing both together yields the best results.',
      category: 'composition',
      source: 'linter',
      smartSuggestion: SUGGESTION_REGISTRY['LINTER_DUAL_ISSUE']!,
    });
  }

  // LINTER_SEQUENCE_ABNORMAL: block sequence deviates from recommended
  if (screen) {
    const actualTypes = screen.blocks.map(b => b.type);
    const sectionPreset = getSectionPreset(preset.sectionType);
    const recommended = sectionPreset.recommendedSequence;
    if (recommended && recommended.length > 0) {
      // Check if required blocks are present
      const missingRequired = recommended
        .filter(r => r.required)
        .filter(r => !actualTypes.includes(r.blockType));
      if (missingRequired.length > 0) {
        warnings.push({
          code: 'LINTER_SEQUENCE_ABNORMAL',
          severity: 'info',
          message: `Missing recommended blocks: ${missingRequired.map(r => r.blockType).join(', ')}`,
          category: 'preset',
          source: 'linter',
          smartSuggestion: SUGGESTION_REGISTRY['LINTER_SEQUENCE_ABNORMAL']!,
        });
      }
    }
  }

  return warnings;
}

// ═══════════════════════════════════════════════════════════════
// SMART SUGGESTION RESOLVER
// ═══════════════════════════════════════════════════════════════

/**
 * Get smart suggestion for a warning code.
 * Falls back to a generic suggestion for unknown codes.
 */
export function getSmartSuggestion(
  code: string,
  context?: SuggestionContext,
): SmartSuggestion {
  const template = SUGGESTION_REGISTRY[code];
  if (!template) {
    return {
      quickFix: 'Review this visual composition issue',
      reasoning: 'This warning indicates a potential improvement in the visual layout. Consider the context and adjust accordingly.',
    };
  }

  // Context-parameterized enhancement for specific codes
  if (code === 'COMPOSITION_UNBALANCED' && context) {
    return {
      ...template,
      quickFix: `Move a heavy block to balance visual weight (composition score: ${context.compositionScore ?? '?'}/100)`,
    };
  }

  if (code === 'COMPOSITION_TEXT_HEAVY' && context?.textRatio != null) {
    return {
      ...template,
      reasoning: `Text-heavy screens (${Math.round(context.textRatio * 100)}% text blocks) create "wall of text" effect. Visual elements break monotony and aid retention.`,
    };
  }

  return template;
}

// ═══════════════════════════════════════════════════════════════
// SCORE COMPUTATION
// ═══════════════════════════════════════════════════════════════

/**
 * Compute letter grade from numeric score.
 * A: 90+, B: 75+, C: 60+, D: 40+, F: <40
 */
function scoreToGrade(score: number): LinterGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Generate one-line summary based on grade and warning count.
 */
function generateSummary(grade: LinterGrade, warningCount: number): string {
  switch (grade) {
    case 'A': return 'Excellent visual composition';
    case 'B': return 'Good composition, minor improvements possible';
    case 'C': return `Fair composition — ${warningCount} suggestion${warningCount !== 1 ? 's' : ''} available`;
    case 'D': return 'Needs attention — composition score is low';
    case 'F': return 'Significant issues — consider restructuring';
  }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Lint a screen's visual composition.
 * Main entry point — resolves VCS and produces linter result.
 *
 * PASSIVE — never throws, never blocks, always returns a result.
 */
export function lintVisual(
  screen: ScreenSchema,
  availableHeight?: number,
): VisualLinterResult {
  const resolved = resolveVCS(screen, availableHeight);
  return lintFromResolvedVCS(resolved, screen);
}

/**
 * Lint from an already-resolved VCS.
 * Use when the caller already has a ResolvedVCS to avoid double resolution.
 *
 * @param resolved - Pre-computed VCS resolution
 * @param screen - Optional screen schema (enables cross-cutting checks)
 */
export function lintFromResolvedVCS(
  resolved: ResolvedVCS,
  screen?: ScreenSchema,
): VisualLinterResult {
  const { preset, rhythm, composition } = resolved;

  // ── 1. Collect all warnings with source tag ──
  const rawWarnings: EnrichedVisualWarning[] = [
    ...preset.warnings.map(w => ({
      ...w,
      category: categorize(w.code) as LinterCategory,
      source: 'preset' as const,
      smartSuggestion: getSmartSuggestion(w.code),
    })),
    ...rhythm.warnings.map(w => ({
      ...w,
      category: categorize(w.code) as LinterCategory,
      source: 'rhythm' as const,
      smartSuggestion: getSmartSuggestion(w.code),
    })),
    ...composition.warnings.map(w => ({
      ...w,
      category: categorize(w.code) as LinterCategory,
      source: 'composition' as const,
      smartSuggestion: getSmartSuggestion(w.code, {
        compositionScore: composition.score,
        textRatio: composition.textVisualRatio.ratio,
        blockCount: composition.density.blockCount,
      }),
    })),
  ];

  // ── 2. Synthesize cross-cutting warnings ──
  const synthWarnings = synthesizeCrossCutting(resolved, screen);
  rawWarnings.push(...synthWarnings);

  // ── 3. Deduplicate ──
  const deduped = deduplicateWarnings(rawWarnings);

  // ── 4. Compute per-category scores ──
  const presetFitScore = Math.max(0, 100 - preset.warnings.length * 20);
  const context: SuggestionContext = {
    sectionType: preset.sectionType,
    blockCount: composition.density.blockCount,
    textRatio: composition.textVisualRatio.ratio,
    cadenceScore: rhythm.cadenceScore,
    compositionScore: composition.score,
  };

  // Enrich with context-parameterized suggestions
  const enriched = deduped.map(w => ({
    ...w,
    smartSuggestion: getSmartSuggestion(w.code, context),
  }));

  // ── 5. Build category scores ──
  const categoryWarningCounts: Record<string, number> = {};
  for (const w of enriched) {
    categoryWarningCounts[w.category] = (categoryWarningCounts[w.category] || 0) + 1;
  }

  const categories: CategoryScore[] = [
    {
      category: 'composition',
      score: composition.score,
      weight: 0.40,
      warningCount: categoryWarningCounts['composition'] ?? 0,
    },
    {
      category: 'rhythm',
      score: rhythm.cadenceScore,
      weight: 0.35,
      warningCount: categoryWarningCounts['rhythm'] ?? 0,
    },
    {
      category: 'preset',
      score: presetFitScore,
      weight: 0.25,
      warningCount: categoryWarningCounts['preset'] ?? 0,
    },
  ];

  // ── 6. Compute composite score ──
  const score = Math.round(
    composition.score * 0.40 +
    rhythm.cadenceScore * 0.35 +
    presetFitScore * 0.25
  );
  const clampedScore = Math.max(0, Math.min(100, score));
  const grade = scoreToGrade(clampedScore);

  // ── 7. Build counts ──
  const counts = { info: 0, suggestion: 0, warning: 0, error: 0 };
  for (const w of enriched) {
    counts[w.severity]++;
  }

  return {
    score: clampedScore,
    grade,
    summary: generateSummary(grade, enriched.length),
    categories,
    warnings: enriched,
    counts,
    resolvedVCS: resolved,
  };
}

/**
 * Lint a specific category only.
 * Useful for UI panels that show one category at a time.
 */
export function lintCategory(
  screen: ScreenSchema,
  category: LinterCategory,
  availableHeight?: number,
): EnrichedVisualWarning[] {
  const result = lintVisual(screen, availableHeight);
  return result.warnings.filter(w => w.category === category);
}
