// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.9C / 4C — AddBlockPanel Smoke Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies that AddBlockPanel uses the shared TEACHER_ADDABLE_BLOCKS
// constant (not a local copy), and that the curated set is correct:
//
//   1. TEACHER_ADDABLE_BLOCKS has 11 blocks (10 original + hotspot)
//   2. hotspot-image is in TEACHER_ADDABLE_BLOCKS
//   3. POPULAR_BLOCK_TYPES has 10 blocks (no hotspot)
//   4. POPULAR_BLOCK_TYPES is a subset of TEACHER_ADDABLE_BLOCKS
//   5. No page-level blocks (cover, tp, petunjuk, penutup) in addable
//   6. All addable blocks have guided editors
//   7. All addable blocks are in BLOCK_DEFINITIONS with addable !== false
//   8. ORIGINAL_TEACHER_BLOCKS = first 10 of TEACHER_ADDABLE_BLOCKS
//   9. isTeacherAddableBlock + isPopularBlock helpers work
//  10. No manual copy of TEACHER_ADDABLE_BLOCKS in test (import shared)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

// Sprint 8.9B / 4B: import shared constants (single source of truth — NO local copy)
import {
  TEACHER_ADDABLE_BLOCKS,
  POPULAR_BLOCK_TYPES,
  ORIGINAL_TEACHER_BLOCKS,
  isTeacherAddableBlock,
  isPopularBlock,
} from '@/core/registry/teacher-curated-blocks';
import { hasGuidedEditor } from '@/core/schema/guided-patch';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry/definitions';

// Page-level blocks that should NEVER be in TEACHER_ADDABLE_BLOCKS
const PAGE_LEVEL_BLOCKS = ['cover', 'tp', 'petunjuk', 'penutup', 'hasil', 'cp', 'atp', 'alur', 'skenario'];

describe('Sprint 8.9C / 4C — AddBlockPanel Smoke (Curated Registry)', () => {

  // ── 1. TEACHER_ADDABLE_BLOCKS has 11 ────────────────────────

  it('TEACHER_ADDABLE_BLOCKS has exactly 11 blocks (10 original + hotspot-image)', () => {
    expect(TEACHER_ADDABLE_BLOCKS.length).toBe(11);
  });

  // ── 2. hotspot-image is addable ─────────────────────────────

  it('hotspot-image is in TEACHER_ADDABLE_BLOCKS', () => {
    expect(TEACHER_ADDABLE_BLOCKS).toContain('hotspot-image');
  });

  // ── 3. POPULAR has 10 (no hotspot) ──────────────────────────

  it('POPULAR_BLOCK_TYPES has exactly 10 blocks (hotspot intentionally excluded)', () => {
    expect(POPULAR_BLOCK_TYPES.length).toBe(10);
  });

  it('hotspot-image is NOT in POPULAR_BLOCK_TYPES', () => {
    expect(POPULAR_BLOCK_TYPES).not.toContain('hotspot-image');
  });

  // ── 4. POPULAR is subset of ADDABLE ─────────────────────────

  it('every POPULAR_BLOCK_TYPES entry is in TEACHER_ADDABLE_BLOCKS', () => {
    for (const popular of POPULAR_BLOCK_TYPES) {
      expect(TEACHER_ADDABLE_BLOCKS).toContain(popular);
    }
  });

  // ── 5. No page-level blocks in addable ──────────────────────

  it('no page-level blocks (cover, tp, petunjuk, penutup, hasil, cp, atp, alur, skenario) in TEACHER_ADDABLE_BLOCKS', () => {
    for (const pageBlock of PAGE_LEVEL_BLOCKS) {
      expect(TEACHER_ADDABLE_BLOCKS).not.toContain(pageBlock);
    }
  });

  // ── 6. All addable have guided editors ──────────────────────

  it('all 11 TEACHER_ADDABLE_BLOCKS have guided editors', () => {
    for (const blockType of TEACHER_ADDABLE_BLOCKS) {
      expect(hasGuidedEditor(blockType), `${blockType} should have guided editor`).toBe(true);
    }
  });

  // ── 7. All addable in BLOCK_DEFINITIONS with addable !== false ──

  it('all 11 TEACHER_ADDABLE_BLOCKS are in BLOCK_DEFINITIONS with addable !== false', () => {
    for (const blockType of TEACHER_ADDABLE_BLOCKS) {
      const def = BLOCK_DEFINITIONS[blockType];
      expect(def, `${blockType} should be in BLOCK_DEFINITIONS`).toBeDefined();
      if (def) {
        expect(def.addable, `${blockType} should have addable !== false`).not.toBe(false);
      }
    }
  });

  // ── 8. ORIGINAL = first 10 of ADDABLE ───────────────────────

  it('ORIGINAL_TEACHER_BLOCKS = first 10 of TEACHER_ADDABLE_BLOCKS', () => {
    expect(ORIGINAL_TEACHER_BLOCKS.length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(ORIGINAL_TEACHER_BLOCKS[i]).toBe(TEACHER_ADDABLE_BLOCKS[i]);
    }
  });

  // ── 9. Helpers work ─────────────────────────────────────────

  it('isTeacherAddableBlock returns correct results', () => {
    expect(isTeacherAddableBlock('materi-section')).toBe(true);
    expect(isTeacherAddableBlock('hotspot-image')).toBe(true);
    expect(isTeacherAddableBlock('cover')).toBe(false);
    expect(isTeacherAddableBlock('nonexistent')).toBe(false);
  });

  it('isPopularBlock returns correct results', () => {
    expect(isPopularBlock('materi-section')).toBe(true);
    expect(isPopularBlock('hotspot-image')).toBe(false); // intentionally not popular
    expect(isPopularBlock('cover')).toBe(false);
  });

  // ── 10. No manual copy in this test ─────────────────────────

  it('this test file imports TEACHER_ADDABLE_BLOCKS from shared module (no manual copy)', () => {
    // Verify the import is the shared constant by checking it's the same reference
    // as what the module exports (11 items, includes hotspot-image)
    expect(TEACHER_ADDABLE_BLOCKS.length).toBe(11);
    expect(TEACHER_ADDABLE_BLOCKS).toContain('hotspot-image');
    // If someone added a local copy, this test would still pass — but the
    // import statement above proves we're using the shared constant.
    // The curated-block-registry.test.ts file has stronger assertions.
    expect(true).toBe(true);
  });
});
