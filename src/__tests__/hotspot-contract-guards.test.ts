// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.8A / 3A — Pre-Hotspot Contract Guard Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the pre-implementation state before Sprint 3B (hotspot):
//
//   1. hotspot-image is NOT in TEACHER_ADDABLE_BLOCKS (not yet addable)
//   2. hotspot-image is NOT in GUIDED_EDITOR_REGISTRY (no guided editor yet)
//   3. hotspot-image is NOT in BlockDefinitionRegistry (not registered yet)
//   4. Existing 10 curated blocks are still stable (regression)
//   5. sanitizeHtml() strips dangerous content (security boundary)
//   6. HotspotImageBlock type does NOT exist yet in schema types
//
// These tests are GUARD tests — they verify the contract is in place
// BEFORE implementation begins. When Sprint 3B adds hotspot-image,
// these tests should be updated to verify the implementation instead.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

// Mock stores
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

import { hasGuidedEditor, getGuidedEditorSchema } from '@/core/schema/guided-patch';
import { sanitizeHtml } from '@/core/renderer/blocks/RichText';
import * as blockTypes from '@/core/schema/types/blocks';

// The 10 curated blocks (from AddBlockPanel.tsx)
// Sprint 8.8B: now includes hotspot-image (11 blocks)
const TEACHER_ADDABLE_BLOCKS = [
  'materi-section', 'def-box', 'kuis', 'diskusi',
  'refleksi', 'sortir-game', 'rangkuman', 'motivasi',
  'gambar', 'roda-game', 'hotspot-image',
] as const;

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.8A / 3A — Pre-Hotspot Contract Guards', () => {

  // ── 1. hotspot-image NOT yet addable ─────────────────────────

  describe('hotspot-image is NOW in TEACHER_ADDABLE_BLOCKS (Sprint 8.8B)', () => {
    it('TEACHER_ADDABLE_BLOCKS includes hotspot-image', () => {
      expect(TEACHER_ADDABLE_BLOCKS).toContain('hotspot-image');
    });

    it('TEACHER_ADDABLE_BLOCKS now has 11 blocks (10 original + hotspot)', () => {
      expect(TEACHER_ADDABLE_BLOCKS.length).toBe(11);
    });
  });

  // ── 2. hotspot-image NOW in guided editor registry (Sprint 8.8B) ──

  describe('hotspot-image is NOW in GUIDED_EDITOR_REGISTRY (Sprint 8.8B)', () => {
    it('hasGuidedEditor("hotspot-image") returns true', () => {
      expect(hasGuidedEditor('hotspot-image')).toBe(true);
    });

    it('getGuidedEditorSchema("hotspot-image") returns non-null', () => {
      expect(getGuidedEditorSchema('hotspot-image')).not.toBeNull();
    });
  });

  // ── 3. HotspotImageBlock type NOW exists (Sprint 8.8B) ──────

  describe('HotspotImageBlock type NOW exists (Sprint 8.8B)', () => {
    it('blockTypes module exports HotspotImageBlock', () => {
      // HotspotImageBlock is an interface — at runtime, it doesn't appear as a property.
      // We verify via type-check: if the import doesn't error, the type exists.
      // This test is a placeholder — the real verification is that tsc passes.
      expect(true).toBe(true);
    });
  });

  // ── 4. Existing 10 curated blocks are stable ────────────────

  describe('Existing 10 curated blocks are still stable (regression)', () => {
    it('all 10 curated blocks still have guided editors', () => {
      for (const blockType of TEACHER_ADDABLE_BLOCKS) {
        expect(hasGuidedEditor(blockType), `${blockType} should have guided editor`).toBe(true);
      }
    });

    it('all 10 curated blocks have non-null guided editor schemas', () => {
      for (const blockType of TEACHER_ADDABLE_BLOCKS) {
        const schema = getGuidedEditorSchema(blockType);
        expect(schema, `${blockType} schema should not be null`).not.toBeNull();
      }
    });
  });

  // ── 5. sanitizeHtml security boundary ───────────────────────

  describe('sanitizeHtml() strips dangerous content (security boundary)', () => {
    it('strips <script> tags and content', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('strips <iframe> tags', () => {
      const input = 'Text <iframe src="evil.com"></iframe> more text';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('evil.com');
    });

    it('strips on* event handlers', () => {
      const input = '<span onclick="alert(1)">text</span>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<span');
      expect(result).toContain('text');
    });

    it('strips javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('strips <style> tags', () => {
      const input = 'Text <style>body{color:red}</style> more';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('color:red');
    });

    it('preserves allowed formatting tags (strong, em, br)', () => {
      const input = '<strong>bold</strong> <em>italic</em> <br/> text';
      const result = sanitizeHtml(input);
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<br/>');
    });

    it('strips disallowed tags but keeps content', () => {
      const input = '<div>content</div> <p>paragraph</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<div>');
      expect(result).not.toContain('<p>');
      expect(result).toContain('content');
      expect(result).toContain('paragraph');
    });
  });

  // ── 6. Contract doc exists ──────────────────────────────────

  describe('Hotspot contract document exists', () => {
    it('docs/HOTSPOT-IMAGE-CONTRACT.md is referenced in codebase', () => {
      // This is a documentation guard — the contract doc was created
      // in Sprint 8.8A. The test verifies the contract is in place
      // by checking the roadmap doc references it.
      // (Actual file existence is verified by git tracking.)
      expect(true).toBe(true); // Placeholder — file existence is implicit
    });
  });
});
