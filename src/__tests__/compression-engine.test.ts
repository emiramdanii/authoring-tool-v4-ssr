// ═══════════════════════════════════════════════════════════════════
// COMPRESSION ENGINE TESTS — Core compression logic for fixed scenes
// ═══════════════════════════════════════════════════════════════════
// Tests the pure-logic functions of CompressionEngine:
//   - countBlockItems() (tested indirectly — not exported)
//   - getCompressionProfile() — profile lookup per block type
//   - computeCompressionDecision() — single-block compression decision
//   - computeSceneCompression() — multi-block scene compression
//   - supportsCompression() — block type compression check
//   - Edge cases: empty blocks, unknown types, no items

import { describe, it, expect } from 'vitest';
import {
  computeCompressionDecision,
  computeSceneCompression,
  getCompressionProfile,
  supportsCompression,
  COMPRESSION_PROFILES,
} from '@/core/layout/CompressionEngine';
import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';

// ── Test Helpers ─────────────────────────────────────────────────

/** Create a minimal SchemaBlock with a given type and optional overrides */
function makeBlock(overrides: Partial<SchemaBlock> & { type: string; id: string }): SchemaBlock {
  return { ...overrides } as SchemaBlock;
}

/** Create a petunjuk block with N items */
function makePetunjukBlock(id: string, itemCount: number): SchemaBlock {
  return makeBlock({
    type: 'petunjuk',
    id,
    items: Array.from({ length: itemCount }, (_, i) => ({
      icon: '📌',
      title: `Step ${i + 1}`,
      body: `Body ${i + 1}`,
    })),
  }) as SchemaBlock;
}

/** Create a kuis block with N questions */
function makeKuisBlock(id: string, questionCount: number): SchemaBlock {
  return makeBlock({
    type: 'kuis',
    id,
    questions: Array.from({ length: questionCount }, (_, i) => ({
      q: `Question ${i + 1}?`,
      opts: ['A', 'B', 'C'],
      ans: 0,
      ex: 'Explanation',
    })),
  }) as SchemaBlock;
}

/** Create a def-box block (single content item) */
function makeDefBoxBlock(id: string, content = 'Some definition'): SchemaBlock {
  return makeBlock({
    type: 'def-box',
    id,
    content,
    borderColor: 'y',
  }) as SchemaBlock;
}

/** Create an nc-grid block with N cards */
function makeNcGridBlock(id: string, cardCount: number): SchemaBlock {
  return makeBlock({
    type: 'nc-grid',
    id,
    cards: Array.from({ length: cardCount }, (_, i) => ({
      icon: '🏷️',
      title: `Card ${i + 1}`,
      body: `Body ${i + 1}`,
      color: 'y',
    })),
  }) as SchemaBlock;
}

/** Create an ftab block with N tabs */
function makeFtabBlock(id: string, tabCount: number): SchemaBlock {
  return makeBlock({
    type: 'ftab',
    id,
    tabs: Array.from({ length: tabCount }, (_, i) => ({
      icon: '📑',
      label: `Tab ${i + 1}`,
      content: [],
    })),
  }) as SchemaBlock;
}

// ═══════════════════════════════════════════════════════════════════
// 1. COMPRESSION PROFILES — Registry completeness and correctness
// ═══════════════════════════════════════════════════════════════════

describe('CompressionEngine — Profile Registry', () => {
  it('should have profiles for all compressible block types', () => {
    const expectedTypes = [
      'petunjuk', 'tp', 'alur', 'kuis', 'materi-section',
      'ftab', 'nc-grid', 'diskusi', 'rangkuman', 'skenario',
      'refleksi', 'tabel-accord', 'def-box', 'tujuan-display',
      'motivasi', 'penutup', 'nk-card',
    ];
    for (const type of expectedTypes) {
      expect(COMPRESSION_PROFILES[type], `Profile for "${type}" should exist`).toBeDefined();
    }
  });

  it('should return correct profile via getCompressionProfile', () => {
    const profile = getCompressionProfile('petunjuk');
    expect(profile).toBeDefined();
    expect(profile!.blockType).toBe('petunjuk');
    expect(profile!.defaultStrategy).toBe('accordion');
    expect(profile!.minItemsForCompression).toBe(4);
  });

  it('should return undefined for unknown block type', () => {
    expect(getCompressionProfile('unknown-block')).toBeUndefined();
    expect(getCompressionProfile('cover')).toBeUndefined(); // cover has no compression profile
  });

  it('should have valid strategies for every profile', () => {
    const validStrategies = ['accordion', 'collapsible', 'reveal-set', 'step-reveal'];
    for (const [type, profile] of Object.entries(COMPRESSION_PROFILES)) {
      expect(profile.strategies.length, `"${type}" should have at least one strategy`).toBeGreaterThan(0);
      for (const s of profile.strategies) {
        expect(validStrategies, `"${type}" strategy "${s}" should be valid`).toContain(s);
      }
      expect(profile.strategies, `"${type}" defaultStrategy should be in strategies list`).toContain(profile.defaultStrategy);
    }
  });

  it('should have savings ratios for all four strategies in every profile', () => {
    const allStrategies: Array<'accordion' | 'collapsible' | 'reveal-set' | 'step-reveal'> =
      ['accordion', 'collapsible', 'reveal-set', 'step-reveal'];
    for (const [type, profile] of Object.entries(COMPRESSION_PROFILES)) {
      for (const s of allStrategies) {
        expect(profile.savingsRatios[s], `"${type}" should have savingsRatio for "${s}"`).toBeDefined();
        expect(profile.savingsRatios[s], `"${type}" savingsRatio for "${s}" should be > 0 and <= 1`).toBeGreaterThan(0);
        expect(profile.savingsRatios[s], `"${type}" savingsRatio for "${s}" should be <= 1`).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. SUPPORTS COMPRESSION — Block type eligibility check
// ═══════════════════════════════════════════════════════════════════

describe('CompressionEngine — supportsCompression', () => {
  it('should return true for block types with compression profiles', () => {
    const compressible = ['petunjuk', 'tp', 'alur', 'kuis', 'def-box', 'nc-grid', 'ftab'];
    for (const type of compressible) {
      expect(supportsCompression(type), `"${type}" should support compression`).toBe(true);
    }
  });

  it('should return false for block types without profiles', () => {
    expect(supportsCompression('cover')).toBe(false);
    expect(supportsCompression('sortir-game')).toBe(false);
    expect(supportsCompression('unknown-type')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. COUNT BLOCK ITEMS (indirect) — Verifies item counting logic
// ═══════════════════════════════════════════════════════════════════
// countBlockItems() is a private function, so we test it indirectly
// by observing whether computeCompressionDecision applies compression
// based on the internal item count vs minItemsForCompression threshold.

describe('CompressionEngine — countBlockItems (indirect)', () => {
  it('should count petunjuk items correctly (profile requires min 4)', () => {
    // 3 items — below minItemsForCompression=4 → no compression
    const block3 = makePetunjukBlock('p3', 3);
    const result3 = computeCompressionDecision(block3, 500, 200);
    expect(result3, '3 items should not compress (below min 4)').toBeNull();

    // 4 items — meets minItemsForCompression=4 → compression
    const block4 = makePetunjukBlock('p4', 4);
    const result4 = computeCompressionDecision(block4, 500, 200);
    expect(result4, '4 items should compress (meets min 4)').not.toBeNull();
    expect(result4!.isCompressed).toBe(true);
  });

  it('should count kuis questions correctly (profile requires min 3)', () => {
    // 2 questions — below minItemsForCompression=3
    const block2 = makeKuisBlock('k2', 2);
    expect(computeCompressionDecision(block2, 500, 200)).toBeNull();

    // 3 questions — meets minItemsForCompression=3
    const block3 = makeKuisBlock('k3', 3);
    expect(computeCompressionDecision(block3, 500, 200)).not.toBeNull();
  });

  it('should count nc-grid cards correctly (profile requires min 4)', () => {
    const block3 = makeNcGridBlock('nc3', 3);
    expect(computeCompressionDecision(block3, 500, 200)).toBeNull();

    const block4 = makeNcGridBlock('nc4', 4);
    expect(computeCompressionDecision(block4, 500, 200)).not.toBeNull();
  });

  it('should count ftab tabs correctly (profile requires min 3)', () => {
    const block2 = makeFtabBlock('ft2', 2);
    expect(computeCompressionDecision(block2, 500, 200)).toBeNull();

    const block3 = makeFtabBlock('ft3', 3);
    expect(computeCompressionDecision(block3, 500, 200)).not.toBeNull();
  });

  it('should return 1 as default for unknown block types with no item fields', () => {
    // def-box has minItemsForCompression=1, so even with no items array,
    // countBlockItems returns 1 (default case) which meets the threshold
    const block = makeDefBoxBlock('db1');
    const result = computeCompressionDecision(block, 500, 200);
    expect(result, 'def-box should compress (default count=1, min=1)').not.toBeNull();
  });

  it('should allow itemCount override to bypass internal counting', () => {
    // petunjuk with 0 items but override itemCount to 10 → should compress
    const block = makeBlock({ type: 'petunjuk', id: 'p-override', items: [] }) as SchemaBlock;
    const result = computeCompressionDecision(block, 500, 200, { itemCount: 10 });
    expect(result, 'itemCount override should enable compression').not.toBeNull();

    // petunjuk with 10 items but override itemCount to 0 → should NOT compress
    const blockFull = makePetunjukBlock('p-full', 10);
    const resultZero = computeCompressionDecision(blockFull, 500, 200, { itemCount: 0 });
    expect(resultZero, 'itemCount=0 override should prevent compression').toBeNull();
  });

  it('should handle block with no items array (returns 0 for known types)', () => {
    // petunjuk without items array → countBlockItems returns 0
    const block = makeBlock({ type: 'petunjuk', id: 'p-no-items' }) as SchemaBlock;
    const result = computeCompressionDecision(block, 500, 200);
    expect(result, 'petunjuk without items should not compress (count=0 < min=4)').toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. COMPUTE COMPRESSION DECISION — Single-block compression logic
// ═══════════════════════════════════════════════════════════════════

describe('CompressionEngine — computeCompressionDecision', () => {
  it('should return null when block does not overflow', () => {
    const block = makePetunjukBlock('p1', 5);
    const result = computeCompressionDecision(block, 200, 500);
    expect(result, 'No compression when measured <= available').toBeNull();
  });

  it('should return null for block types without compression profile', () => {
    const block = makeBlock({ type: 'cover', id: 'c1' }) as SchemaBlock;
    const result = computeCompressionDecision(block, 500, 200);
    expect(result, 'No compression for unsupported block type').toBeNull();
  });

  it('should return a valid decision when block overflows and has enough items', () => {
    const block = makePetunjukBlock('p1', 5);
    // Use availableHeight=300 so accordion (0.5 ratio → 250) fits without fallback
    const result = computeCompressionDecision(block, 500, 300);
    expect(result).not.toBeNull();
    expect(result!.blockId).toBe('p1');
    expect(result!.isCompressed).toBe(true);
    expect(result!.strategy).toBe('accordion'); // default for petunjuk
    expect(result!.expandedHeight).toBe(500);
    expect(result!.compressedHeight).toBeLessThan(500);
    expect(result!.savingsRatio).toBeGreaterThan(0);
  });

  it('should use the default strategy when no preferredStrategy is given', () => {
    const block = makeKuisBlock('k1', 5);
    // Use availableHeight=200 so step-reveal (0.3 ratio → 150) fits
    const result = computeCompressionDecision(block, 500, 200);
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('step-reveal'); // default for kuis
  });

  it('should use preferredStrategy when specified', () => {
    const block = makeKuisBlock('k1', 5);
    // Use availableHeight=350 so reveal-set (0.6 ratio → 300) fits
    const result = computeCompressionDecision(block, 500, 350, {
      preferredStrategy: 'reveal-set',
    });
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('reveal-set');
  });

  it('should try alternative strategies if default compressed height still overflows', () => {
    // Create a scenario where the first strategy's compressed height is still too big
    // petunjuk default is accordion with 0.5 savings ratio → 1000*0.5=500, still > 200
    // It should try other strategies to find one that fits
    const block = makePetunjukBlock('p1', 10);
    const result = computeCompressionDecision(block, 1000, 200);
    expect(result).not.toBeNull();
    // Compressed height should be capped at available height at worst
    expect(result!.compressedHeight).toBeLessThanOrEqual(200);
  });

  it('should compute correct compressed height based on savings ratio', () => {
    const block = makePetunjukBlock('p1', 5);
    const result = computeCompressionDecision(block, 500, 300);
    expect(result).not.toBeNull();
    // accordion savings ratio is 0.5 → 500 * 0.5 = 250
    expect(result!.compressedHeight).toBe(250);
  });

  it('should provide correct default params for each strategy', () => {
    // accordion: expandedIndices = [0]
    const block1 = makeBlock({ type: 'petunjuk', id: 'acc', items: Array(5).fill({}) }) as SchemaBlock;
    // Use availableHeight=300 so accordion (0.5 ratio → 250) is chosen
    const result1 = computeCompressionDecision(block1, 500, 300);
    expect(result1).not.toBeNull();
    expect(result1!.strategy).toBe('accordion');
    expect(result1!.params.expandedIndices).toEqual([0]);

    // step-reveal: currentStep = 0
    const block2 = makeKuisBlock('sr', 5);
    // Use availableHeight=200 so step-reveal (0.3 ratio → 150) is chosen
    const result2 = computeCompressionDecision(block2, 500, 200);
    expect(result2).not.toBeNull();
    expect(result2!.strategy).toBe('step-reveal');
    expect(result2!.params.currentStep).toBe(0);

    // collapsible: isExpanded = false
    const block3 = makeDefBoxBlock('coll');
    // Use availableHeight=250 so collapsible (0.4 ratio → 200) is chosen
    const result3 = computeCompressionDecision(block3, 500, 250);
    expect(result3).not.toBeNull();
    expect(result3!.strategy).toBe('collapsible');
    expect(result3!.params.isExpanded).toBe(false);
  });

  it('should use block.type as fallback blockId when id is missing', () => {
    const block = makeBlock({ type: 'petunjuk', items: Array(5).fill({}) } as any) as SchemaBlock;
    // Remove the id property
    delete (block as any).id;
    const result = computeCompressionDecision(block, 500, 200);
    expect(result).not.toBeNull();
    expect(result!.blockId).toBe('petunjuk');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. COMPUTE SCENE COMPRESSION — Multi-block scene-level compression
// ═══════════════════════════════════════════════════════════════════

describe('CompressionEngine — computeSceneCompression', () => {
  it('should return empty map for empty blocks array', () => {
    const heights = new Map<string, number>();
    const result = computeSceneCompression([], heights, 500);
    expect(result.size).toBe(0);
  });

  it('should return empty map when no measured heights are provided', () => {
    const blocks = [makePetunjukBlock('p1', 5)];
    const heights = new Map<string, number>();
    const result = computeSceneCompression(blocks, heights, 500);
    expect(result.size).toBe(0);
  });

  it('should compress only blocks that overflow', () => {
    const blocks = [
      makePetunjukBlock('p-overflow', 5),  // will overflow
      makePetunjukBlock('p-fits', 5),       // will fit
    ];
    const heights = new Map<string, number>([
      ['p-overflow', 800],
      ['p-fits', 200],
    ]);
    const result = computeSceneCompression(blocks, heights, 500);
    expect(result.has('p-overflow')).toBe(true);
    expect(result.has('p-fits')).toBe(false);
  });

  it('should skip blocks without compression profiles', () => {
    const blocks = [
      makeBlock({ type: 'cover', id: 'c1' }) as SchemaBlock,
      makePetunjukBlock('p1', 5),
    ];
    const heights = new Map<string, number>([
      ['c1', 800],
      ['p1', 800],
    ]);
    const result = computeSceneCompression(blocks, heights, 500);
    expect(result.has('c1')).toBe(false);
    expect(result.has('p1')).toBe(true);
  });

  it('should handle multiple compressible blocks', () => {
    const blocks = [
      makePetunjukBlock('p1', 5),
      makeKuisBlock('k1', 5),
      makeDefBoxBlock('d1'),
    ];
    const heights = new Map<string, number>([
      ['p1', 600],
      ['k1', 700],
      ['d1', 400],
    ]);
    const result = computeSceneCompression(blocks, heights, 300);
    expect(result.size).toBe(3);
    expect(result.get('p1')!.strategy).toBe('accordion');
    expect(result.get('k1')!.strategy).toBe('step-reveal');
    expect(result.get('d1')!.strategy).toBe('collapsible');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. EDGE CASES — Boundary conditions and error handling
// ═══════════════════════════════════════════════════════════════════

describe('CompressionEngine — Edge Cases', () => {
  it('should not compress when measured height equals available height', () => {
    const block = makePetunjukBlock('p1', 5);
    const result = computeCompressionDecision(block, 500, 500);
    expect(result, 'No compression when measured == available').toBeNull();
  });

  it('should not compress when measured height is less than available', () => {
    const block = makePetunjukBlock('p1', 5);
    const result = computeCompressionDecision(block, 100, 500);
    expect(result).toBeNull();
  });

  it('should handle zero available height', () => {
    const block = makeDefBoxBlock('d1');
    const result = computeCompressionDecision(block, 500, 0);
    // Compressed height should be capped to availableHeight (0)
    if (result) {
      expect(result.compressedHeight).toBe(0);
    }
  });

  it('should handle very large measured height', () => {
    const block = makePetunjukBlock('p1', 100);
    const result = computeCompressionDecision(block, 100000, 500);
    expect(result).not.toBeNull();
    expect(result!.compressedHeight).toBeLessThanOrEqual(500);
  });
});
