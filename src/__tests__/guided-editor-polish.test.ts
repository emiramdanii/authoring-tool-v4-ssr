// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.7B — Guided Editor Polish Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the guided editor polish items:
//
//   1. Refleksi: guided editor exposes `warna` field on questions[]
//   2. Roda-game: guided editor uses `exclusiveToggle` for opts[].correct
//   3. Diskusi: guided editor has label, icon, teks, petunjuk, color (regression)
//   4. Kuis: opts stays string[], ans stays number (regression guard)
//
// Approach: test the GUIDED_EDITOR_REGISTRY metadata — no UI rendering
// needed. This verifies the contract between the guided editor config
// and the block schema/renderers.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

// Mock stores — guided-patch.ts transitively imports canva-store + authoring-store
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

import { getGuidedEditorSchema, hasGuidedEditor } from '@/core/schema/guided-patch';

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.7B — Guided Editor Polish', () => {

  // ── 1. Refleksi warna ────────────────────────────────────────

  describe('Refleksi — warna field exposed', () => {
    it('refleksi guided editor has a questions array field', () => {
      const schema = getGuidedEditorSchema('refleksi');
      expect(schema).not.toBeNull();
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      expect(questionsField).toBeDefined();
      expect(questionsField!.type).toBe('array');
      expect(questionsField!.fields).toBeDefined();
    });

    it('refleksi questions[] has a warna field (Sprint 8.7B)', () => {
      const schema = getGuidedEditorSchema('refleksi');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const warnaField = questionsField.fields.find(f => f.key === 'warna');
      expect(warnaField, 'refleksi questions[] should have a warna field').toBeDefined();
      expect(warnaField!.type).toBe('color');
      expect(warnaField!.options).toBeDefined();
      expect(warnaField!.options!.length).toBeGreaterThan(0);
    });

    it('refleksi questions[] still has teks, petunjuk, icon (regression)', () => {
      const schema = getGuidedEditorSchema('refleksi');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const fieldKeys = questionsField.fields.map(f => f.key);
      expect(fieldKeys).toContain('teks');
      expect(fieldKeys).toContain('petunjuk');
      expect(fieldKeys).toContain('icon');
      expect(fieldKeys).toContain('warna');
    });
  });

  // ── 2. Roda-game exclusiveToggle ─────────────────────────────

  describe('Roda-game — exclusiveToggle for opts[].correct', () => {
    it('roda-game guided editor has questions array', () => {
      const schema = getGuidedEditorSchema('roda-game');
      expect(schema).not.toBeNull();
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      expect(questionsField).toBeDefined();
      expect(questionsField!.type).toBe('array');
    });

    it('roda-game questions[] has opts nested array', () => {
      const schema = getGuidedEditorSchema('roda-game');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const optsField = questionsField.fields.find(f => f.key === 'opts');
      expect(optsField, 'roda-game questions[] should have opts field').toBeDefined();
      expect(optsField!.type).toBe('array');
      expect(optsField!.fields).toBeDefined();
    });

    it('roda-game opts[] has correct field with exclusiveToggle=true (Sprint 8.7B)', () => {
      const schema = getGuidedEditorSchema('roda-game');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const optsField = questionsField.fields.find(f => f.key === 'opts');
      if (!optsField?.fields) return;

      const correctField = optsField.fields.find(f => f.key === 'correct');
      expect(correctField, 'opts[] should have correct field').toBeDefined();
      expect(correctField!.type).toBe('boolean');
      expect(correctField!.exclusiveToggle, 'correct field should have exclusiveToggle=true').toBe(true);
    });

    it('roda-game opts[] still has text field (regression)', () => {
      const schema = getGuidedEditorSchema('roda-game');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const optsField = questionsField.fields.find(f => f.key === 'opts');
      if (!optsField?.fields) return;

      const textField = optsField.fields.find(f => f.key === 'text');
      expect(textField, 'opts[] should have text field').toBeDefined();
      expect(textField!.type).toBe('text');
    });
  });

  // ── 3. Diskusi label/icon/color (regression guard) ──────────

  describe('Diskusi — label/icon/color guard', () => {
    it('diskusi guided editor has all 5 fields on questions[]', () => {
      const schema = getGuidedEditorSchema('diskusi');
      expect(schema).not.toBeNull();
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      expect(questionsField).toBeDefined();
      expect(questionsField!.fields).toBeDefined();
      if (!questionsField?.fields) return;

      const fieldKeys = questionsField.fields.map(f => f.key);
      expect(fieldKeys).toContain('label');
      expect(fieldKeys).toContain('icon');
      expect(fieldKeys).toContain('teks');
      expect(fieldKeys).toContain('petunjuk');
      expect(fieldKeys).toContain('color');
    });

    it('diskusi questions[] color field is type=color with options', () => {
      const schema = getGuidedEditorSchema('diskusi');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const colorField = questionsField.fields.find(f => f.key === 'color');
      expect(colorField).toBeDefined();
      expect(colorField!.type).toBe('color');
      expect(colorField!.options).toBeDefined();
      expect(colorField!.options!.length).toBeGreaterThan(0);
    });
  });

  // ── 4. Kuis opts schema guard (no change) ───────────────────

  describe('Kuis — opts schema guard (no change in 8.7B)', () => {
    it('kuis guided editor has questions array with displayMode=tab', () => {
      const schema = getGuidedEditorSchema('kuis');
      expect(schema).not.toBeNull();
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      expect(questionsField).toBeDefined();
      expect(questionsField!.type).toBe('array');
      expect(questionsField!.displayMode).toBe('tab');
    });

    it('kuis questions[] opts is flat string array (NOT changed to object array)', () => {
      const schema = getGuidedEditorSchema('kuis');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const optsField = questionsField.fields.find(f => f.key === 'opts');
      expect(optsField, 'kuis questions[] should have opts field').toBeDefined();
      expect(optsField!.type).toBe('array');
      // opts sub-field should have empty key '' (flat string array, NOT { text, correct })
      if (optsField!.fields) {
        expect(optsField!.fields.length).toBe(1);
        expect(optsField!.fields[0].key).toBe('');
        expect(optsField!.fields[0].type).toBe('text');
      }
    });

    it('kuis questions[] ans is select with A/B/C/D options (NOT changed)', () => {
      const schema = getGuidedEditorSchema('kuis');
      if (!schema) return;

      const questionsField = schema.fields!.find(f => f.key === 'questions');
      if (!questionsField?.fields) return;

      const ansField = questionsField.fields.find(f => f.key === 'ans');
      expect(ansField, 'kuis questions[] should have ans field').toBeDefined();
      expect(ansField!.type).toBe('select');
      expect(ansField!.options).toBeDefined();
      expect(ansField!.options!.length).toBe(4);
      expect(ansField!.options!.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  // ── 5. Cross-check: all 4 block types still have guided editors ──

  describe('Cross-check: all 4 block types still have guided editors', () => {
    it('refleksi, roda-game, diskusi, kuis all have guided editors', () => {
      expect(hasGuidedEditor('refleksi')).toBe(true);
      expect(hasGuidedEditor('roda-game')).toBe(true);
      expect(hasGuidedEditor('diskusi')).toBe(true);
      expect(hasGuidedEditor('kuis')).toBe(true);
    });

    it('all 4 have non-empty displayName + icon', () => {
      for (const blockType of ['refleksi', 'roda-game', 'diskusi', 'kuis']) {
        const schema = getGuidedEditorSchema(blockType);
        expect(schema, `${blockType} should have guided editor`).not.toBeNull();
        if (!schema) continue;
        expect(schema.displayName.length).toBeGreaterThan(0);
        expect(schema.icon.length).toBeGreaterThan(0);
      }
    });
  });
});
