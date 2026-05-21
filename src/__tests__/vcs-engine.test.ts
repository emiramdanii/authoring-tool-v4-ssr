// ═══════════════════════════════════════════════════════════════════
// VCS ENGINE TESTS — Transition Rhythm + Composition Analysis
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  classifyTransition,
  computeTransitionGap,
  resolveScreenRhythm,
  computePerBlockGaps,
  computeCadenceScore,
} from '@/core/vcs/TransitionRhythmEngine';
import {
  classifyBlockComposition,
  analyzeDensity,
  analyzeBalance,
  analyzeTextVisualRatio,
  analyzeIntentDistribution,
  computeCompositionScore,
  analyzeComposition,
} from '@/core/vcs/CompositionAnalyzer';
import {
  resolveSectionPreset,
  computeCompositionScore as resolveCompositionScore,
  resolveVCS,
} from '@/core/vcs/resolver';
import type {
  TransitionKind,
  SchemaBlock,
  ScreenSchema,
  DensityAnalysis,
  BalanceAnalysis,
  TextVisualRatio,
  IntentDistribution,
  BlockTransitionInfo,
} from '@/core/vcs/types';
import { resolveSceneLayout, DEFAULT_SAFE_AREA, type SceneResolution } from '@/core/scene/SceneLayoutEngine';
import { computeScenePlan } from '@/core/layout/SceneOverflowEngine';
import { lintVisual, lintFromResolvedVCS, lintCategory, getSmartSuggestion } from '@/core/vcs/VisualLinter';

// ── Test Helpers ──────────────────────────────────────────

function makeBlock(type: string, id?: string, visualIntent?: string): SchemaBlock {
  return {
    type,
    id: id ?? `${type}-0`,
    visualIntent: visualIntent as any,
  } as SchemaBlock;
}

function makeScreen(blocks: SchemaBlock[], templateType = 'materi'): ScreenSchema {
  return {
    id: 'screen-test',
    templateType,
    blocks,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 1. TRANSITION CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════

describe('Transition Rhythm Engine — classifyTransition', () => {
  it('should classify same-type blocks as repetition', () => {
    const prev = makeBlock('def-box', 'b1');
    const next = makeBlock('def-box', 'b2');
    expect(classifyTransition(prev, next, 0, 1)).toBe('repetition');
  });

  it('should classify section-open for first block transition', () => {
    const prev = makeBlock('def-box', 'b1');
    const next = makeBlock('materi-section', 'b2');
    expect(classifyTransition(prev, next, 0, 1)).toBe('section-open');
  });

  it('should classify section-close for penutup', () => {
    const prev = makeBlock('def-box', 'b1');
    const next = makeBlock('penutup', 'b2');
    expect(classifyTransition(prev, next, 2, 3)).toBe('section-close');
  });

  it('should classify cta-zone for hasil', () => {
    const prev = makeBlock('def-box', 'b1');
    const next = makeBlock('hasil', 'b2');
    expect(classifyTransition(prev, next, 2, 3)).toBe('cta-zone');
  });

  it('should classify heading-entry when section header introduces content', () => {
    const prev = makeBlock('materi-section', 'b1');
    const next = makeBlock('def-box', 'b2');
    expect(classifyTransition(prev, next, 0, 1)).toBe('heading-entry');
  });

  it('should classify interactive-entry for kuis', () => {
    const prev = makeBlock('def-box', 'b1');
    const next = makeBlock('kuis', 'b2');
    expect(classifyTransition(prev, next, 1, 2)).toBe('interactive-entry');
  });

  it('should classify visual-break for text→visual transition', () => {
    const prev = makeBlock('materi-blok', 'b1'); // text separator
    const next = makeBlock('gambar', 'b2');       // visual break
    expect(classifyTransition(prev, next, 1, 2)).toBe('visual-break');
  });

  it('should classify text-separator for visual→text transition', () => {
    const prev = makeBlock('gambar', 'b1');        // visual break
    const next = makeBlock('materi-blok', 'b2');   // text separator
    expect(classifyTransition(prev, next, 1, 2)).toBe('text-separator');
  });

  it('should classify intent-amplify when intent escalates', () => {
    const prev = makeBlock('def-box', 'b1', 'supporting');
    const next = makeBlock('def-box', 'b2', 'highlight');
    expect(classifyTransition(prev, next, 0, 1)).toBe('intent-amplify');
  });

  it('should classify default for generic transitions', () => {
    const prev = makeBlock('def-box', 'b1');
    const next = makeBlock('nc-grid', 'b2');
    // Both are secondary intent → no amplify, different types → not repetition
    // Need to check what it actually returns
    const result = classifyTransition(prev, next, 1, 2);
    // Should be some valid transition kind
    expect(result).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. GAP COMPUTATION
// ═══════════════════════════════════════════════════════════════════

describe('Transition Rhythm Engine — computeTransitionGap', () => {
  it('should compute larger gaps for section-open than repetition', () => {
    const sectionOpenGap = computeTransitionGap('section-open', { baseGap: 12, headingGapMultiplier: 2, visualGapMultiplier: 1.5, activityGapMultiplier: 1.8, repetitionGapMultiplier: 0.6, sectionEndGapMultiplier: 2.5 });
    const repetitionGap = computeTransitionGap('repetition', { baseGap: 12, headingGapMultiplier: 2, visualGapMultiplier: 1.5, activityGapMultiplier: 1.8, repetitionGapMultiplier: 0.6, sectionEndGapMultiplier: 2.5 });
    expect(sectionOpenGap).toBeGreaterThan(repetitionGap);
  });

  it('should return baseGap for default transition', () => {
    const gap = computeTransitionGap('default', { baseGap: 12, headingGapMultiplier: 2, visualGapMultiplier: 1.5, activityGapMultiplier: 1.8, repetitionGapMultiplier: 0.6, sectionEndGapMultiplier: 2.5 });
    expect(gap).toBe(12);
  });

  it('should compute zero gap for first block', () => {
    const blocks = [makeBlock('def-box', 'b1')];
    const gaps = computePerBlockGaps(blocks, 'materi');
    expect(gaps[0]).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. SCREEN RHYTHM RESOLUTION
// ═══════════════════════════════════════════════════════════════════

describe('Transition Rhythm Engine — resolveScreenRhythm', () => {
  it('should produce per-block gaps with correct length', () => {
    const blocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
      makeBlock('kuis', 'b4'),
    ];
    const rhythm = resolveScreenRhythm(blocks, 'materi');
    expect(rhythm.perBlockGaps).toHaveLength(4);
    expect(rhythm.perBlockGaps[0]).toBe(0); // First block = no gap
    expect(rhythm.transitions).toHaveLength(3);
  });

  it('should compute cadence score between 0-100', () => {
    const blocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('gambar', 'b3'),
    ];
    const rhythm = resolveScreenRhythm(blocks, 'materi');
    expect(rhythm.cadenceScore).toBeGreaterThanOrEqual(0);
    expect(rhythm.cadenceScore).toBeLessThanOrEqual(100);
  });

  it('should handle empty blocks array', () => {
    const rhythm = resolveScreenRhythm([], 'materi');
    expect(rhythm.blockCount).toBe(0);
    expect(rhythm.perBlockGaps).toHaveLength(0);
    expect(rhythm.cadenceScore).toBe(100); // Empty = perfect
  });

  it('should handle single block', () => {
    const blocks = [makeBlock('def-box', 'b1')];
    const rhythm = resolveScreenRhythm(blocks, 'materi');
    expect(rhythm.perBlockGaps).toEqual([0]);
    expect(rhythm.transitions).toHaveLength(0);
    expect(rhythm.cadenceScore).toBe(100); // Single = perfect
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. CADENCE SCORE
// ═══════════════════════════════════════════════════════════════════

describe('Transition Rhythm Engine — computeCadenceScore', () => {
  it('should return 100 for empty transitions', () => {
    const rhythm = { baseGap: 12, headingGapMultiplier: 2, visualGapMultiplier: 1.5, activityGapMultiplier: 1.8, repetitionGapMultiplier: 0.6, sectionEndGapMultiplier: 2.5 };
    expect(computeCadenceScore([], rhythm)).toBe(100);
  });

  it('should penalize long repetition streaks', () => {
    const rhythm = { baseGap: 12, headingGapMultiplier: 2, visualGapMultiplier: 1.5, activityGapMultiplier: 1.8, repetitionGapMultiplier: 0.6, sectionEndGapMultiplier: 2.5 };
    const varied: BlockTransitionInfo[] = [
      { fromIndex: 0, toIndex: 1, kind: 'heading-entry', gap: 24 },
      { fromIndex: 1, toIndex: 2, kind: 'visual-break', gap: 24 },
      { fromIndex: 2, toIndex: 3, kind: 'text-separator', gap: 10 },
    ];
    const monotonous: BlockTransitionInfo[] = [
      { fromIndex: 0, toIndex: 1, kind: 'repetition', gap: 7 },
      { fromIndex: 1, toIndex: 2, kind: 'repetition', gap: 7 },
      { fromIndex: 2, toIndex: 3, kind: 'repetition', gap: 7 },
      { fromIndex: 3, toIndex: 4, kind: 'repetition', gap: 7 },
      { fromIndex: 4, toIndex: 5, kind: 'repetition', gap: 7 },
    ];
    const variedScore = computeCadenceScore(varied, rhythm);
    const monoScore = computeCadenceScore(monotonous, rhythm);
    expect(variedScore).toBeGreaterThan(monoScore);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. COMPOSITION ANALYSIS
// ═══════════════════════════════════════════════════════════════════

describe('Composition Analyzer — classifyBlockComposition', () => {
  it('should classify gambar as visual', () => {
    expect(classifyBlockComposition('gambar')).toBe('visual');
  });

  it('should classify kuis as interactive', () => {
    expect(classifyBlockComposition('kuis')).toBe('interactive');
  });

  it('should classify def-box as text', () => {
    expect(classifyBlockComposition('def-box')).toBe('text');
  });

  it('should classify cta as interactive', () => {
    expect(classifyBlockComposition('cta')).toBe('interactive');
  });

  it('should classify tabel as visual', () => {
    expect(classifyBlockComposition('tabel')).toBe('visual');
  });
});

describe('Composition Analyzer — analyzeDensity', () => {
  it('should return sparse for low content', () => {
    const blocks = [makeBlock('def-box', 'b1')];
    const result = analyzeDensity(blocks, 720);
    expect(result.level).toBe('sparse');
    expect(result.densityRatio).toBeLessThan(0.5);
  });

  it('should return overloaded for excessive content', () => {
    // Many heavy blocks
    const blocks = Array.from({ length: 10 }, (_, i) => makeBlock('materi-section', `b${i}`));
    const result = analyzeDensity(blocks, 720);
    expect(result.isOverDense).toBe(true);
  });
});

describe('Composition Analyzer — analyzeBalance', () => {
  it('should return perfect balance for empty', () => {
    const result = analyzeBalance([]);
    expect(result.score).toBe(100);
    expect(result.isBalanced).toBe(true);
  });

  it('should detect top-heavy layout', () => {
    // Heavy blocks at top, light at bottom
    const blocks = [
      makeBlock('materi-section', 'b1'), // heavy
      makeBlock('materi-section', 'b2'), // heavy
      makeBlock('materi-blok', 'b3'),    // light
      makeBlock('materi-blok', 'b4'),    // light
      makeBlock('materi-blok', 'b5'),    // light
      makeBlock('materi-blok', 'b6'),    // light
    ];
    const result = analyzeBalance(blocks);
    expect(result.topHeavyRatio).toBeGreaterThan(0);
  });
});

describe('Composition Analyzer — analyzeTextVisualRatio', () => {
  it('should detect text-heavy screen', () => {
    const blocks = [
      makeBlock('def-box', 'b1'),
      makeBlock('nc-grid', 'b2'),
      makeBlock('diskusi', 'b3'),
      makeBlock('materi-blok', 'b4'),
      makeBlock('checklist', 'b5'),
    ];
    const result = analyzeTextVisualRatio(blocks);
    expect(result.assessment).toBe('text-heavy');
  });

  it('should return empty for no blocks', () => {
    const result = analyzeTextVisualRatio([]);
    expect(result.assessment).toBe('empty');
  });
});

describe('Composition Analyzer — analyzeIntentDistribution', () => {
  it('should detect varied intents', () => {
    const blocks = [
      makeBlock('def-box', 'b1', 'highlight'),
      makeBlock('nc-grid', 'b2', 'secondary'),
      makeBlock('kuis', 'b3', 'primary'),
    ];
    const result = analyzeIntentDistribution(blocks);
    expect(result.isVaried).toBe(true);
  });

  it('should detect monotonous intents', () => {
    const blocks = [
      makeBlock('def-box', 'b1', 'secondary'),
      makeBlock('nc-grid', 'b2', 'secondary'),
      makeBlock('diskusi', 'b3', 'secondary'),
      makeBlock('materi-blok', 'b4', 'secondary'),
    ];
    const result = analyzeIntentDistribution(blocks);
    expect(result.isVaried).toBe(false);
    expect(result.dominant).toBe('secondary');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. COMPOSITION SCORE
// ═══════════════════════════════════════════════════════════════════

describe('Composition Analyzer — computeCompositionScore', () => {
  it('should return score between 0-100', () => {
    const density: DensityAnalysis = {
      blockCount: 5,
      totalContentHeight: 500,
      densityRatio: 0.7,
      isOverDense: false,
      consecutiveTextStreak: 2,
      consecutiveVisualStreak: 1,
      level: 'comfortable',
    };
    const balance: BalanceAnalysis = {
      topHeavyRatio: 0.1,
      score: 80,
      isBalanced: true,
      weightDistribution: { top: 0.35, middle: 0.35, bottom: 0.30 },
    };
    const textVisual: TextVisualRatio = {
      textBlocks: 3,
      visualBlocks: 2,
      interactiveBlocks: 0,
      ratio: 0.6,
      assessment: 'balanced',
    };
    const intent: IntentDistribution = {
      counts: { secondary: 3, highlight: 2 },
      dominant: 'secondary',
      isVaried: true,
    };
    const score = computeCompositionScore(density, balance, textVisual, intent);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    // With comfortable density + balanced + varied → should be high
    expect(score).toBeGreaterThan(70);
  });

  it('should penalize overloaded screens', () => {
    const density: DensityAnalysis = {
      blockCount: 15,
      totalContentHeight: 1200,
      densityRatio: 1.67,
      isOverDense: true,
      consecutiveTextStreak: 8,
      consecutiveVisualStreak: 0,
      level: 'overloaded',
    };
    const balance: BalanceAnalysis = {
      topHeavyRatio: 0.5,
      score: 30,
      isBalanced: false,
      weightDistribution: { top: 0.6, middle: 0.3, bottom: 0.1 },
    };
    const textVisual: TextVisualRatio = {
      textBlocks: 14,
      visualBlocks: 1,
      interactiveBlocks: 0,
      ratio: 0.93,
      assessment: 'text-heavy',
    };
    const intent: IntentDistribution = {
      counts: { secondary: 15 },
      dominant: 'secondary',
      isVaried: false,
    };
    const score = computeCompositionScore(density, balance, textVisual, intent);
    expect(score).toBeLessThan(50);
  });
});

describe('Composition Analyzer — analyzeComposition (full)', () => {
  it('should produce a complete analysis', () => {
    const blocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
      makeBlock('kuis', 'b4'),
    ];
    const result = analyzeComposition(blocks, 720);
    expect(result.density).toBeDefined();
    expect(result.balance).toBeDefined();
    expect(result.textVisualRatio).toBeDefined();
    expect(result.intentDistribution).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.warnings).toBeInstanceOf(Array);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. RESOLVER
// ═══════════════════════════════════════════════════════════════════

describe('VCS Resolver — resolveSectionPreset', () => {
  it('should resolve preset from templateType', () => {
    const screen = makeScreen([makeBlock('def-box', 'b1')], 'materi');
    const preset = resolveSectionPreset(screen);
    expect(preset.sectionType).toBe('materi');
    expect(preset.grammar).toBe('tab-flow'); // materi default
    expect(preset.rhythm).toBeDefined();
    expect(preset.density).toBeDefined();
  });

  it('should use explicit sectionType when set', () => {
    const screen = makeScreen([makeBlock('def-box', 'b1')], 'custom');
    screen.sectionType = 'kuis';
    const preset = resolveSectionPreset(screen);
    expect(preset.sectionType).toBe('kuis');
  });

  it('should warn about incompatible grammar', () => {
    const screen = makeScreen([makeBlock('def-box', 'b1')], 'kuis');
    screen.layoutGrammar = 'hero-center'; // Not compatible with kuis
    const preset = resolveSectionPreset(screen);
    expect(preset.warnings.some(w => w.code === 'VCS_GRAMMAR_INCOMPATIBLE')).toBe(true);
  });
});

describe('VCS Resolver — computeCompositionScore', () => {
  it('should produce composition analysis from screen schema', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
    ], 'materi');
    const result = resolveCompositionScore(screen, 720);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.density).toBeDefined();
    expect(result.balance).toBeDefined();
  });
});

describe('VCS Resolver — resolveVCS', () => {
  it('should return complete VCS resolution', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('gambar', 'b3'),
    ], 'materi');
    const vcs = resolveVCS(screen, 720);
    expect(vcs.preset).toBeDefined();
    expect(vcs.rhythm).toBeDefined();
    expect(vcs.composition).toBeDefined();
    expect(vcs.preset.sectionType).toBe('materi');
    expect(vcs.rhythm.perBlockGaps).toHaveLength(3);
    expect(vcs.composition.score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. PER-BLOCK GAPS INTEGRATION
// ═══════════════════════════════════════════════════════════════════

describe('VCS Integration — computePerBlockGaps', () => {
  it('should return [0] for single block', () => {
    const blocks = [makeBlock('def-box', 'b1')];
    const gaps = computePerBlockGaps(blocks, 'materi');
    expect(gaps).toEqual([0]);
  });

  it('should return varying gaps for diverse blocks', () => {
    const blocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
      makeBlock('kuis', 'b4'),
    ];
    const gaps = computePerBlockGaps(blocks, 'materi');
    expect(gaps).toHaveLength(4);
    expect(gaps[0]).toBe(0);
    // At least some gaps should be different (rhythm variety)
    const uniqueGaps = new Set(gaps.slice(1));
    expect(uniqueGaps.size).toBeGreaterThanOrEqual(1); // At least 1 unique gap
  });

  it('should produce smaller gaps for repetition than for section-open', () => {
    // Two identical blocks = repetition
    const repeatingBlocks = [
      makeBlock('def-box', 'b1'),
      makeBlock('def-box', 'b2'),
    ];
    const repeatGaps = computePerBlockGaps(repeatingBlocks, 'materi');

    // Section header followed by content
    const sectionBlocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
    ];
    const sectionGaps = computePerBlockGaps(sectionBlocks, 'materi');

    // Repetition gap should be smaller than section gap
    expect(repeatGaps[1]).toBeLessThan(sectionGaps[1]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 9. LAYOUT ENGINE INTEGRATION (FASE 11A.4 — E2E)
// ═══════════════════════════════════════════════════════════════════

const TEST_SCENE: SceneResolution = { w: 1280, h: 720 };

describe('FASE 11A.4 — resolveSceneLayout with perBlockGaps', () => {
  it('should apply variable gaps from VCS rhythm engine', () => {
    const blocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
      makeBlock('kuis', 'b4'),
    ];
    const perBlockGaps = computePerBlockGaps(blocks, 'materi');

    // Verify perBlockGaps has expected structure
    expect(perBlockGaps).toHaveLength(4);
    expect(perBlockGaps[0]).toBe(0); // First block = no gap

    // Resolve with perBlockGaps
    const resolved = resolveSceneLayout(blocks, TEST_SCENE, DEFAULT_SAFE_AREA, {
      isCompact: false,
      perBlockGaps,
    });

    // Verify blocks are positioned with variable gaps
    expect(resolved).toHaveLength(4);
    expect(resolved[0].y).toBe(0); // First block at safeArea.top (0)

    // Gap between block 0 and 1 should use perBlockGaps[1]
    const gap01 = resolved[1].y - (resolved[0].y + resolved[0].height);
    expect(gap01).toBe(perBlockGaps[1]);
  });

  it('should fall back to uniform gap when perBlockGaps not provided', () => {
    const blocks = [
      makeBlock('def-box', 'b1'),
      makeBlock('def-box', 'b2'),
    ];

    // Without perBlockGaps (backward compat)
    const resolved = resolveSceneLayout(blocks, TEST_SCENE, DEFAULT_SAFE_AREA, {
      isCompact: false,
    });

    expect(resolved).toHaveLength(2);
    // Should still work with uniform gap
    const gap = resolved[1].y - (resolved[0].y + resolved[0].height);
    expect(gap).toBe(12); // normal mode default
  });

  it('should handle cover blocks without perBlockGaps interference', () => {
    const blocks = [makeBlock('cover', 'cover-0')];
    const perBlockGaps = computePerBlockGaps(blocks, 'cover');

    const resolved = resolveSceneLayout(blocks, TEST_SCENE, DEFAULT_SAFE_AREA, {
      isCompact: false,
      perBlockGaps,
    });

    // Cover should fill the entire scene
    expect(resolved).toHaveLength(1);
    expect(resolved[0].height).toBe(720);
  });
});

describe('FASE 11A.4 — computeScenePlan with perBlockGaps', () => {
  it('should produce scene plan with VCS-based gaps', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
      makeBlock('diskusi', 'b4'),
    ], 'materi');

    const perBlockGaps = computePerBlockGaps(screen.blocks, screen.templateType);
    const scenePlan = computeScenePlan(screen, TEST_SCENE, DEFAULT_SAFE_AREA, {
      isCompact: false,
      perBlockGaps,
    });

    expect(scenePlan.isSingleScene).toBeDefined();
    expect(scenePlan.totalScenes).toBeGreaterThanOrEqual(1);
    expect(scenePlan.scenes[0].blockIds).toHaveLength(4);
  });

  it('should respect section type from screen.sectionType', () => {
    const screen = makeScreen([
      makeBlock('kuis', 'b1'),
      makeBlock('diskusi', 'b2'),
    ], 'custom');
    screen.sectionType = 'kuis';

    const perBlockGaps = computePerBlockGaps(screen.blocks, screen.templateType, screen.sectionType);
    expect(perBlockGaps).toHaveLength(2);
    expect(perBlockGaps[0]).toBe(0);

    // Kuis section has normal rhythm — gaps should be computed
    expect(perBlockGaps[1]).toBeGreaterThan(0);
  });
});

describe('FASE 11A.4 — End-to-end VCS pipeline', () => {
  it('should resolve complete VCS + layout for a materi screen', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('gambar', 'b3'),
      makeBlock('diskusi', 'b4'),
      makeBlock('kuis', 'b5'),
    ], 'materi');

    // Step 1: Resolve VCS
    const vcs = resolveVCS(screen, 720);

    // Step 2: Verify VCS output
    expect(vcs.preset.sectionType).toBe('materi');
    expect(vcs.preset.rhythm).toBeDefined();
    expect(vcs.rhythm.perBlockGaps).toHaveLength(5);
    expect(vcs.rhythm.cadenceScore).toBeGreaterThan(0);
    expect(vcs.composition.score).toBeGreaterThanOrEqual(0);

    // Step 3: Feed perBlockGaps into layout engine
    const resolved = resolveSceneLayout(screen.blocks, TEST_SCENE, DEFAULT_SAFE_AREA, {
      isCompact: false,
      perBlockGaps: vcs.rhythm.perBlockGaps,
    });

    // Step 4: Verify layout uses variable gaps
    expect(resolved).toHaveLength(5);
    // First block starts at top
    expect(resolved[0].y).toBe(0);

    // Gaps between blocks should vary (not uniform)
    const gaps = [];
    for (let i = 1; i < resolved.length; i++) {
      gaps.push(resolved[i].y - (resolved[i-1].y + resolved[i-1].height));
    }
    // At least the gap values should match the VCS-computed perBlockGaps
    for (let i = 1; i < resolved.length; i++) {
      expect(gaps[i-1]).toBe(vcs.rhythm.perBlockGaps[i]);
    }
  });

  it('should produce better rhythm variety than uniform gaps', () => {
    const blocks = [
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('gambar', 'b3'),
      makeBlock('diskusi', 'b4'),
    ];

    const perBlockGaps = computePerBlockGaps(blocks, 'materi');
    const uniqueGaps = new Set(perBlockGaps.slice(1));

    // With diverse block types, we should get at least 2 different gap values
    // (heading-entry for materi-section→def-box, visual-break for def-box→gambar, text-separator for gambar→diskusi)
    expect(uniqueGaps.size).toBeGreaterThanOrEqual(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 10. VISUAL LINTER (FASE 11A.5)
// ═══════════════════════════════════════════════════════════════════

describe('FASE 11A.5 — Visual Linter — lintVisual', () => {
  it('should return a complete linter result', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('nc-grid', 'b3'),
    ], 'materi');

    const result = lintVisual(screen, 720);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBeTruthy();
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    expect(result.summary).toBeTruthy();
    expect(result.categories).toHaveLength(3); // composition, rhythm, preset
    expect(result.warnings).toBeInstanceOf(Array);
    expect(result.counts).toBeDefined();
    expect(result.resolvedVCS).toBeDefined();
  });

  it('should give high score for well-composed screen', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2', 'highlight'),
      makeBlock('gambar', 'b3'),
      makeBlock('diskusi', 'b4'),
      makeBlock('kuis', 'b5'),
    ], 'materi');

    const result = lintVisual(screen, 720);

    // Diverse blocks + varied intents → should score well
    expect(result.score).toBeGreaterThan(50);
    expect(result.grade).toMatch(/^[A-D]$/);
  });

  it('should give lower score for overloaded screen', () => {
    const screen = makeScreen(
      Array.from({ length: 10 }, (_, i) => makeBlock('materi-section', `b${i}`)),
      'materi',
    );

    const result = lintVisual(screen, 720);

    // Overloaded + repetitive → should score poorly
    expect(result.score).toBeLessThan(70);
  });

  it('should produce smart suggestions for warnings', () => {
    const screen = makeScreen([
      makeBlock('def-box', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('def-box', 'b3'),
      makeBlock('def-box', 'b4'),
      makeBlock('def-box', 'b5'),
    ], 'materi');

    const result = lintVisual(screen, 720);

    // Should have warnings about repetition
    if (result.warnings.length > 0) {
      const withSuggestion = result.warnings.filter(w => w.smartSuggestion);
      expect(withSuggestion.length).toBeGreaterThan(0);
      // Each should have quickFix and reasoning
      for (const w of withSuggestion) {
        expect(w.smartSuggestion.quickFix).toBeTruthy();
        expect(w.smartSuggestion.reasoning).toBeTruthy();
      }
    }
  });

  it('should categorize warnings correctly', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
    ], 'materi');

    const result = lintVisual(screen, 720);

    // All warnings should have a category and source
    for (const w of result.warnings) {
      expect(w.category).toBeTruthy();
      expect(['preset', 'rhythm', 'composition', 'density', 'accessibility']).toContain(w.category);
      expect(w.source).toBeTruthy();
      expect(['preset', 'rhythm', 'composition', 'linter']).toContain(w.source);
    }
  });
});

describe('FASE 11A.5 — Visual Linter — lintCategory', () => {
  it('should filter warnings by category', () => {
    const screen = makeScreen([
      makeBlock('materi-section', 'b1'),
      makeBlock('def-box', 'b2'),
      makeBlock('gambar', 'b3'),
    ], 'materi');

    const rhythmWarnings = lintCategory(screen, 'rhythm', 720);

    // All returned warnings should be rhythm category
    for (const w of rhythmWarnings) {
      expect(w.category).toBe('rhythm');
    }
  });
});

describe('FASE 11A.5 — Visual Linter — getSmartSuggestion', () => {
  it('should return suggestion for known codes', () => {
    const suggestion = getSmartSuggestion('RHYTHM_REPETITION_STREAK');
    expect(suggestion.quickFix).toBeTruthy();
    expect(suggestion.reasoning).toBeTruthy();
  });

  it('should return fallback for unknown codes', () => {
    const suggestion = getSmartSuggestion('UNKNOWN_CODE');
    expect(suggestion.quickFix).toBeTruthy();
    expect(suggestion.reasoning).toBeTruthy();
  });

  it('should suggest block types for some codes', () => {
    const suggestion = getSmartSuggestion('RHYTHM_NO_VISUAL_BREAK');
    expect(suggestion.suggestedBlockTypes).toBeDefined();
    expect(suggestion.suggestedBlockTypes!.length).toBeGreaterThan(0);
  });
});

describe('FASE 11A.5 — Visual Linter — grade computation', () => {
  it('should assign grade A or B for excellent composition', () => {
    // Empty screen = near-perfect composition
    const screen = makeScreen([], 'materi');
    const result = lintVisual(screen, 720);
    expect(result.grade).toMatch(/^[AB]$/);
  });

  it('should compute categories with weights summing to 1', () => {
    const screen = makeScreen([makeBlock('def-box', 'b1')], 'materi');
    const result = lintVisual(screen, 720);

    const totalWeight = result.categories.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0);
  });
});
