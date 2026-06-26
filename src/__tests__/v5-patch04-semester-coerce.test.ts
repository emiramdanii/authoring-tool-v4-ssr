// ═══════════════════════════════════════════════════════════════
// V5-METADATA-FINAL-PATCH-04 — Semester coercion test
// ═══════════════════════════════════════════════════════════════
import { describe, it, expect } from 'vitest';
import { saveProjectSchema } from '@/lib/api-validation';

describe('V5-PATCH-04: saveProjectSchema semester coercion', () => {
  // Minimal valid pages array for saveProjectSchema
  const minPages = [{
    id: 'test-page',
    label: 'Test',
    templateType: 'cover',
    bgColor: '#ffffff',
    overlay: 20,
    elements: [],
    bgDataUrl: null,
    colorPalette: null,
    navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
    templateData: {},
    pageMode: 'schema',
    schema: {
      id: 'test-schema',
      templateType: 'cover',
      blocks: [],
      themeId: 'modern-interactive',
      background: { type: 'gradient' },
    },
  }];

  it('"1 (Ganjil)" → 1 (number)', () => {
    const result = saveProjectSchema.safeParse({
      pages: minPages,
      meta: { semester: '1 (Ganjil)' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta?.semester).toBe(1);
      expect(typeof result.data.meta?.semester).toBe('number');
    }
  });

  it('"2 (Genap)" → 2 (number)', () => {
    const result = saveProjectSchema.safeParse({
      pages: minPages,
      meta: { semester: '2 (Genap)' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta?.semester).toBe(2);
      expect(typeof result.data.meta?.semester).toBe('number');
    }
  });

  it('"" → undefined (cleared)', () => {
    const result = saveProjectSchema.safeParse({
      pages: minPages,
      meta: { semester: '' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta?.semester).toBeUndefined();
    }
  });

  it('number 1 → 1 (passes through)', () => {
    const result = saveProjectSchema.safeParse({
      pages: minPages,
      meta: { semester: 1 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta?.semester).toBe(1);
      expect(typeof result.data.meta?.semester).toBe('number');
    }
  });

  it('number 2 → 2 (passes through)', () => {
    const result = saveProjectSchema.safeParse({
      pages: minPages,
      meta: { semester: 2 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta?.semester).toBe(2);
      expect(typeof result.data.meta?.semester).toBe('number');
    }
  });

  it('undefined → undefined (not provided)', () => {
    const result = saveProjectSchema.safeParse({
      pages: minPages,
      meta: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta?.semester).toBeUndefined();
    }
  });

  it('output is never string type', () => {
    const cases = ['1 (Ganjil)', '2 (Genap)', '', 'abc'];
    for (const val of cases) {
      const result = saveProjectSchema.safeParse({
        pages: minPages,
        meta: { semester: val },
      });
      if (result.success && result.data.meta?.semester !== undefined) {
        expect(typeof result.data.meta.semester).toBe('number');
      }
    }
  });
});
