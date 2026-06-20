// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.9B / 4B — Curated Block Registry Single Source Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the curated block registry contract:
//
//   1. TEACHER_ADDABLE_BLOCKS has exactly 11 blocks
//   2. ORIGINAL_TEACHER_BLOCKS has exactly 10 blocks
//   3. Every TEACHER_ADDABLE_BLOCKS has a guided editor
//   4. Every TEACHER_ADDABLE_BLOCKS is in BLOCK_DEFINITIONS
//   5. Every TEACHER_ADDABLE_BLOCKS has addable !== false
//   6. POPULAR_BLOCK_TYPES is a subset of TEACHER_ADDABLE_BLOCKS
//   7. hotspot-image is in TEACHER_ADDABLE_BLOCKS
//   8. hotspot-image is NOT in POPULAR_BLOCK_TYPES (intentional)
//   9. 10 original blocks are still in TEACHER_ADDABLE_BLOCKS
//  10. isTeacherAddableBlock() + isPopularBlock() helpers work
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

import {
  TEACHER_ADDABLE_BLOCKS,
  POPULAR_BLOCK_TYPES,
  ORIGINAL_TEACHER_BLOCKS,
  isTeacherAddableBlock,
  isPopularBlock,
} from '@/core/registry/teacher-curated-blocks';
import { hasGuidedEditor } from '@/core/schema/guided-patch';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry/definitions';

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.9B / 4B — Curated Block Registry Single Source', () => {

  // ── 1-2. Counts ─────────────────────────────────────────────

  it('TEACHER_ADDABLE_BLOCKS has exactly 11 blocks', () => {
    expect(TEACHER_ADDABLE_BLOCKS.length).toBe(11);
  });

  it('ORIGINAL_TEACHER_BLOCKS has exactly 10 blocks', () => {
    expect(ORIGINAL_TEACHER_BLOCKS.length).toBe(10);
  });

  it('POPULAR_BLOCK_TYPES has exactly 10 blocks', () => {
    expect(POPULAR_BLOCK_TYPES.length).toBe(10);
  });

  // ── 3. All have guided editors ──────────────────────────────

  it('every TEACHER_ADDABLE_BLOCKS has a guided editor', () => {
    for (const blockType of TEACHER_ADDABLE_BLOCKS) {
      expect(hasGuidedEditor(blockType), `${blockType} should have guided editor`).toBe(true);
    }
  });

  // ── 4. All in BLOCK_DEFINITIONS ─────────────────────────────

  it('every TEACHER_ADDABLE_BLOCKS is in BLOCK_DEFINITIONS', () => {
    for (const blockType of TEACHER_ADDABLE_BLOCKS) {
      expect(BLOCK_DEFINITIONS[blockType], `${blockType} should be in BLOCK_DEFINITIONS`).toBeDefined();
    }
  });

  // ── 5. All have addable !== false ───────────────────────────

  it('every TEACHER_ADDABLE_BLOCKS has addable !== false in BLOCK_DEFINITIONS', () => {
    for (const blockType of TEACHER_ADDABLE_BLOCKS) {
      const def = BLOCK_DEFINITIONS[blockType];
      expect(def, `${blockType} definition should exist`).toBeDefined();
      if (!def) continue;
      expect(def.addable, `${blockType} should have addable !== false`).not.toBe(false);
    }
  });

  // ── 6. POPULAR is subset of ADDABLE ─────────────────────────

  it('POPULAR_BLOCK_TYPES is a subset of TEACHER_ADDABLE_BLOCKS', () => {
    for (const popularType of POPULAR_BLOCK_TYPES) {
      expect(TEACHER_ADDABLE_BLOCKS).toContain(popularType);
    }
  });

  // ── 7. hotspot-image is addable ─────────────────────────────

  it('hotspot-image is in TEACHER_ADDABLE_BLOCKS', () => {
    expect(TEACHER_ADDABLE_BLOCKS).toContain('hotspot-image');
  });

  // ── 8. hotspot-image NOT in popular ─────────────────────────

  it('hotspot-image is NOT in POPULAR_BLOCK_TYPES (intentional)', () => {
    expect(POPULAR_BLOCK_TYPES).not.toContain('hotspot-image');
  });

  // ── 9. 10 original blocks still present ─────────────────────

  it('all 10 ORIGINAL_TEACHER_BLOCKS are in TEACHER_ADDABLE_BLOCKS', () => {
    for (const blockType of ORIGINAL_TEACHER_BLOCKS) {
      expect(TEACHER_ADDABLE_BLOCKS).toContain(blockType);
    }
  });

  // ── 10. Helper functions ────────────────────────────────────

  it('isTeacherAddableBlock returns true for known addable blocks', () => {
    expect(isTeacherAddableBlock('materi-section')).toBe(true);
    expect(isTeacherAddableBlock('hotspot-image')).toBe(true);
    expect(isTeacherAddableBlock('kuis')).toBe(true);
  });

  it('isTeacherAddableBlock returns false for non-addable blocks', () => {
    expect(isTeacherAddableBlock('cover')).toBe(false);
    expect(isTeacherAddableBlock('tp')).toBe(false);
    expect(isTeacherAddableBlock('nonexistent-block')).toBe(false);
  });

  it('isPopularBlock returns true for popular blocks', () => {
    expect(isPopularBlock('materi-section')).toBe(true);
    expect(isPopularBlock('kuis')).toBe(true);
  });

  it('isPopularBlock returns false for non-popular blocks', () => {
    expect(isPopularBlock('hotspot-image')).toBe(false);
    expect(isPopularBlock('cover')).toBe(false);
  });
});
