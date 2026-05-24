// ═══════════════════════════════════════════════════════════════════════
// API VALIDATION TESTS — Zod schema validation for all API routes
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  aiRequestSchema,
  lessonRequestSchema,
  refineRequestSchema,
  createProjectSchema,
  updateProjectSchema,
  saveProjectSchema,
  exportRequestSchema,
  createTemplateSchema,
  listProjectsQuerySchema,
  listTemplatesQuerySchema,
  formatZodErrors,
} from '@/lib/api-validation';

// ── AI Request Schema ───────────────────────────────────────────────

describe('aiRequestSchema', () => {
  const valid = {
    action: 'kuis',
    mapel: 'PPKn',
    kelas: 'Kelas VII',
    topik: 'Pancasila',
  };

  it('accepts valid minimal request', () => {
    expect(aiRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid actions', () => {
    const actions = ['kuis', 'matching', 'fill-blank', 'word-search', 'crossword',
      'true-false', 'drag-drop', 'memory', 'roda', 'sortir',
      'diskusi', 'refleksi', 'materi-summary', 'tp', 'petunjuk', 'motivasi'];
    for (const action of actions) {
      expect(aiRequestSchema.safeParse({ ...valid, action }).success).toBe(true);
    }
  });

  it('rejects invalid action', () => {
    const result = aiRequestSchema.safeParse({ ...valid, action: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('requires action, mapel, kelas, topik', () => {
    expect(aiRequestSchema.safeParse({}).success).toBe(false);
    expect(aiRequestSchema.safeParse({ action: 'kuis' }).success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = aiRequestSchema.safeParse({
      ...valid,
      konteks: 'Some context',
      jumlah: 10,
      instruksi: 'Extra instruction',
    });
    expect(result.success).toBe(true);
  });

  it('rejects jumlah out of range', () => {
    expect(aiRequestSchema.safeParse({ ...valid, jumlah: 0 }).success).toBe(false);
    expect(aiRequestSchema.safeParse({ ...valid, jumlah: 51 }).success).toBe(false);
  });

  it('rejects oversized strings', () => {
    expect(aiRequestSchema.safeParse({ ...valid, topik: 'x'.repeat(201) }).success).toBe(false);
  });
});

// ── Lesson Request Schema ───────────────────────────────────────────

describe('lessonRequestSchema', () => {
  const valid = {
    topik: 'Pancasila',
    mapel: 'PPKn',
    kelas: 'Kelas VII',
  };

  it('accepts valid request', () => {
    expect(lessonRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid patterns', () => {
    for (const pattern of ['standar', 'interaktif', 'eksperimen', 'mini'] as const) {
      expect(lessonRequestSchema.safeParse({ ...valid, pattern }).success).toBe(true);
    }
  });

  it('rejects invalid pattern', () => {
    expect(lessonRequestSchema.safeParse({ ...valid, pattern: 'invalid' }).success).toBe(false);
  });

  it('requires topik, mapel, kelas', () => {
    expect(lessonRequestSchema.safeParse({}).success).toBe(false);
  });
});

// ── Refine Request Schema ───────────────────────────────────────────

describe('refineRequestSchema', () => {
  const valid = {
    blockType: 'kuis',
    blockContent: { questions: [] },
    mode: 'menarik',
    mapel: 'PPKn',
    kelas: 'Kelas VII',
  };

  it('accepts valid request', () => {
    expect(refineRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts custom mode with instruction', () => {
    expect(refineRequestSchema.safeParse({ ...valid, mode: 'custom', customInstruction: 'Make it better' }).success).toBe(true);
  });

  it('rejects custom mode without instruction', () => {
    const result = refineRequestSchema.safeParse({ ...valid, mode: 'custom' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid mode', () => {
    expect(refineRequestSchema.safeParse({ ...valid, mode: 'invalid' }).success).toBe(false);
  });

  it('requires blockType, blockContent, mode', () => {
    expect(refineRequestSchema.safeParse({}).success).toBe(false);
  });
});

// ── Project Schemas ─────────────────────────────────────────────────

describe('createProjectSchema', () => {
  it('accepts valid project', () => {
    expect(createProjectSchema.safeParse({ title: 'My Project' }).success).toBe(true);
  });

  it('requires title', () => {
    expect(createProjectSchema.safeParse({}).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(createProjectSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('accepts all optional fields', () => {
    const result = createProjectSchema.safeParse({
      title: 'Test',
      description: 'Desc',
      subject: 'PPKn',
      grade: '7',
      semester: 1,
      teacherName: 'Guru',
      schoolName: 'SMP 1',
      templateId: 'tpl-1',
      themeId: 'theme-1',
      schemaPreset: 'ipa',
      ratioId: '16:9',
      isPublished: false,
    });
    expect(result.success).toBe(true);
  });
});

describe('updateProjectSchema', () => {
  it('accepts partial update', () => {
    expect(updateProjectSchema.safeParse({ title: 'New Title' }).success).toBe(true);
  });

  it('rejects empty update', () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
  });
});

// ── Save Project Schema ─────────────────────────────────────────────

describe('saveProjectSchema', () => {
  it('accepts valid save payload', () => {
    const result = saveProjectSchema.safeParse({
      pages: [{ id: 'page-1' }],
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one page', () => {
    expect(saveProjectSchema.safeParse({ pages: [] }).success).toBe(false);
  });

  it('requires pages array', () => {
    expect(saveProjectSchema.safeParse({}).success).toBe(false);
  });
});

// ── Export Request Schema ───────────────────────────────────────────

describe('exportRequestSchema', () => {
  it('accepts valid export', () => {
    const result = exportRequestSchema.safeParse({
      pages: [{ type: 'kuis' }],
    });
    expect(result.success).toBe(true);
  });

  it('requires pages', () => {
    expect(exportRequestSchema.safeParse({}).success).toBe(false);
  });

  it('requires non-empty pages', () => {
    expect(exportRequestSchema.safeParse({ pages: [] }).success).toBe(false);
  });
});

// ── Template Schema ─────────────────────────────────────────────────

describe('createTemplateSchema', () => {
  it('accepts valid template with object schemaData', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Template',
      schemaData: { pages: [] },
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid template with string schemaData', () => {
    const result = createTemplateSchema.safeParse({
      name: 'Template',
      schemaData: '{"pages":[]}',
    });
    expect(result.success).toBe(true);
  });

  it('requires name and schemaData', () => {
    expect(createTemplateSchema.safeParse({}).success).toBe(false);
  });
});

// ── Query Schemas ───────────────────────────────────────────────────

describe('listProjectsQuerySchema', () => {
  it('applies defaults', () => {
    const result = listProjectsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces string to number', () => {
    const result = listProjectsQuerySchema.safeParse({ page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('rejects limit above 100', () => {
    expect(listProjectsQuerySchema.safeParse({ limit: 200 }).success).toBe(false);
  });
});

describe('listTemplatesQuerySchema', () => {
  it('applies defaults', () => {
    const result = listTemplatesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });
});

// ── Error Formatting ────────────────────────────────────────────────

describe('formatZodErrors', () => {
  it('formats errors by field', () => {
    const result = aiRequestSchema.safeParse({});
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted.action).toBeDefined();
      expect(formatted.mapel).toBeDefined();
      expect(formatted.kelas).toBeDefined();
      expect(formatted.topik).toBeDefined();
    }
  });
});
