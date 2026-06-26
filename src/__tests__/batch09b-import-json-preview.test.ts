// ═══════════════════════════════════════════════════════════════
// BATCH-09B: IMPORT-JSON-ADAPTER-PREVIEW — Tests
// ═══════════════════════════════════════════════════════════════
// Tests for the SILSE import preview generator.
//
// Coverage:
//   A. Source audit — preview module exports correct API
//   B. blockTypeHasEditor — known editor vs no editor
//   C. deriveSilseImportPreview — happy path (valid multi-page doc)
//   D. Preview warnings — no-editor, empty-page, missing-label
//   E. Edge cases — single page, many blocks, no blocks
//   F. Block type summary — sorting, counts, hasEditor flags
//   G. ImportJsonPanelV5 — preview rendering (source audit)
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  deriveSilseImportPreview,
  blockTypeHasEditor,
  getBlockTypesWithEditors,
  __TEST__,
  type SilseImportPreview,
} from '@/lib/silse-import-preview';
import type { SilseImportJson } from '@/lib/silse-import-validator';

const readSrc = (rel: string) =>
  readFileSync(resolve(__dirname, '..', rel), 'utf-8');

// ───────────────────────────────────────────────────────────────
// A. Source audit — preview module exports correct API
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: silse-import-preview — module exports', () => {
  const src = readSrc('lib/silse-import-preview.ts');

  it('exports SilseImportPreview interface', () => {
    expect(src).toContain('export interface SilseImportPreview');
  });

  it('exports PreviewPageInfo interface', () => {
    expect(src).toContain('export interface PreviewPageInfo');
  });

  it('exports PreviewBlockTypeSummary interface', () => {
    expect(src).toContain('export interface PreviewBlockTypeSummary');
  });

  it('exports PreviewWarning + PreviewWarningCode types', () => {
    expect(src).toContain('export interface PreviewWarning');
    expect(src).toContain('export type PreviewWarningCode');
  });

  it('exports deriveSilseImportPreview function', () => {
    expect(src).toContain('export function deriveSilseImportPreview');
  });

  it('exports blockTypeHasEditor function', () => {
    expect(src).toContain('export function blockTypeHasEditor');
  });

  it('exports getBlockTypesWithEditors function', () => {
    expect(src).toContain('export function getBlockTypesWithEditors');
  });

  it('exports __TEST__ for unit test access', () => {
    expect(src).toContain('export const __TEST__');
  });

  it('imports SilseImportJson type from silse-import-validator', () => {
    expect(src).toContain("from './silse-import-validator'");
    expect(src).toContain('SilseImportJson');
  });

  it('imports getBlockFields from inspector-field-registry', () => {
    expect(src).toContain("from '@/components/canva/mpi-workspace-v2/inspector-field-registry'");
    expect(src).toContain('getBlockFields');
  });

  it('PreviewWarningCode includes all 3 codes', () => {
    const s = readSrc('lib/silse-import-preview.ts');
    expect(s).toContain("'no-editor'");
    expect(s).toContain("'empty-page'");
    expect(s).toContain("'missing-label'");
  });
});

// ───────────────────────────────────────────────────────────────
// B. blockTypeHasEditor — known editor vs no editor
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: blockTypeHasEditor — known editor vs no editor', () => {
  const typesWithEditors = [
    'cover', 'hero', 'petunjuk', 'tujuan-display', 'motivasi',
    'materi-section', 'def-box', 'materi-blok', 'diskusi', 'kuis',
    'sortir-game', 'refleksi', 'rangkuman', 'penutup', 'tabel-accord',
    'hasil',
  ];

  for (const bt of typesWithEditors) {
    it(`'${bt}' has editor`, () => {
      expect(blockTypeHasEditor(bt)).toBe(true);
    });
  }

  const typesWithoutEditors = [
    'tp', 'alur', 'skenario', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card',
    'roda-game', 'memory-game', 'matching-game', 'fill-blank-game',
    'word-search-game', 'true-false-game', 'drag-drop-game',
    'crossword-game', 'team-buzzer-game',
    'tabel', 'gambar', 'timeline', 'checklist', 'statistik', 'studi',
    'compare', 'reveal',
  ];

  for (const bt of typesWithoutEditors) {
    it(`'${bt}' does NOT have editor`, () => {
      expect(blockTypeHasEditor(bt)).toBe(false);
    });
  }

  it('unknown block type does NOT have editor', () => {
    expect(blockTypeHasEditor('unknown-block')).toBe(false);
    expect(blockTypeHasEditor('')).toBe(false);
  });

  it('getBlockTypesWithEditors returns 16 known types', () => {
    const editors = getBlockTypesWithEditors();
    expect(editors.length).toBe(16);
    expect(editors).toContain('cover');
    expect(editors).toContain('kuis');
    expect(editors).toContain('refleksi');
  });
});

// ───────────────────────────────────────────────────────────────
// C. deriveSilseImportPreview — happy path
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: deriveSilseImportPreview — happy path', () => {
  const validDoc: SilseImportJson = {
    schemaVersion: 1,
    meta: {
      judulPertemuan: 'Pertemuan 1: Hakikat Norma',
      mapel: 'PPKn',
      kelas: '7',
      namaGuru: 'Budi Santoso, S.Pd.',
      namaSekolah: 'SMP Negeri 1',
    },
    canva: {
      pages: [
        {
          id: 'p1',
          label: 'Cover',
          templateType: 'cover',
          schema: {
            blocks: [
              { id: 'b1', type: 'cover', title: 'Hakikat Norma' },
            ],
          },
        },
        {
          id: 'p2',
          label: 'Kuis',
          templateType: 'kuis',
          schema: {
            blocks: [
              { id: 'b2', type: 'kuis', title: 'Kuis 1', questions: [] },
            ],
          },
        },
        {
          id: 'p3',
          label: 'Refleksi',
          templateType: 'refleksi',
          schema: {
            blocks: [
              { id: 'b3', type: 'refleksi', title: 'Refleksi' },
            ],
          },
        },
      ],
    },
  };

  it('returns preview with correct meta', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.meta.judulPertemuan).toBe('Pertemuan 1: Hakikat Norma');
    expect(preview.meta.mapel).toBe('PPKn');
    expect(preview.meta.kelas).toBe('7');
    expect(preview.meta.namaGuru).toBe('Budi Santoso, S.Pd.');
    expect(preview.meta.namaSekolah).toBe('SMP Negeri 1');
  });

  it('returns preview with totalPages=3', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.totalPages).toBe(3);
  });

  it('returns preview with totalBlocks=3', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.totalBlocks).toBe(3);
  });

  it('returns preview with 3 page infos', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.pages.length).toBe(3);
    expect(preview.pages[0].label).toBe('Cover');
    expect(preview.pages[0].templateType).toBe('cover');
    expect(preview.pages[0].blockCount).toBe(1);
    expect(preview.pages[0].blockTypes).toEqual(['cover']);
    expect(preview.pages[1].label).toBe('Kuis');
    expect(preview.pages[2].label).toBe('Refleksi');
  });

  it('page index is 0-based', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.pages[0].index).toBe(0);
    expect(preview.pages[1].index).toBe(1);
    expect(preview.pages[2].index).toBe(2);
  });

  it('returns blockTypeSummary with all 3 types', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.blockTypeSummary.length).toBe(3);
    const types = preview.blockTypeSummary.map((s) => s.type);
    expect(types).toContain('cover');
    expect(types).toContain('kuis');
    expect(types).toContain('refleksi');
  });

  it('blockTypeSummary has hasEditor=true for cover/kuis/refleksi', () => {
    const preview = deriveSilseImportPreview(validDoc);
    for (const s of preview.blockTypeSummary) {
      expect(s.hasEditor, `${s.type} should have editor`).toBe(true);
    }
  });

  it('blockTypeSummary has count=1 for each type', () => {
    const preview = deriveSilseImportPreview(validDoc);
    for (const s of preview.blockTypeSummary) {
      expect(s.count, `${s.type} count should be 1`).toBe(1);
    }
  });

  it('returns no warnings for valid doc with all editors', () => {
    const preview = deriveSilseImportPreview(validDoc);
    expect(preview.warnings).toEqual([]);
  });
});

// ───────────────────────────────────────────────────────────────
// D. Preview warnings — no-editor, empty-page, missing-label
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: preview warnings', () => {
  it('warns about block type without editor (no-editor)', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Page 1',
            templateType: 'materi',
            schema: {
              blocks: [
                { id: 'b1', type: 'tp', title: 'TP' },  // 'tp' has no editor
              ],
            },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    const noEditorWarnings = preview.warnings.filter((w) => w.code === 'no-editor');
    expect(noEditorWarnings.length).toBe(1);
    expect(noEditorWarnings[0].blockType).toBe('tp');
    expect(noEditorWarnings[0].message).toContain('tp');
    expect(noEditorWarnings[0].message).toContain('belum punya editor');
  });

  it('warns about empty page (empty-page)', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Empty Page',
            templateType: 'cover',
            schema: { blocks: [] },  // 0 blocks
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    const emptyWarnings = preview.warnings.filter((w) => w.code === 'empty-page');
    expect(emptyWarnings.length).toBe(1);
    expect(emptyWarnings[0].message).toContain('Empty Page');
    expect(emptyWarnings[0].message).toContain('tidak memiliki blok');
  });

  it('warns about missing label (missing-label)', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            // no label field
            templateType: 'cover',
            schema: { blocks: [{ id: 'b1', type: 'cover' }] },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    const labelWarnings = preview.warnings.filter((w) => w.code === 'missing-label');
    expect(labelWarnings.length).toBe(1);
    expect(labelWarnings[0].message).toContain('Halaman 1');
    expect(labelWarnings[0].message).toContain('Halaman 1');  // fallback label
  });

  it('can return multiple warnings at once', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            // no label (missing-label)
            templateType: 'materi',
            schema: { blocks: [] },  // empty (empty-page)
          },
          {
            id: 'p2',
            label: 'Page 2',
            templateType: 'materi',
            schema: {
              blocks: [
                { id: 'b1', type: 'tp' },      // no-editor
                { id: 'b2', type: 'skenario' }, // no-editor
              ],
            },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    expect(preview.warnings.length).toBeGreaterThanOrEqual(4);  // 1 missing-label + 1 empty-page + 2 no-editor
    const codes = preview.warnings.map((w) => w.code);
    expect(codes).toContain('missing-label');
    expect(codes).toContain('empty-page');
    expect(codes.filter((c) => c === 'no-editor').length).toBe(2);
  });

  it('warning paths point to the affected field', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Page 1',
            templateType: 'materi',
            schema: { blocks: [] },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    const emptyWarning = preview.warnings.find((w) => w.code === 'empty-page');
    expect(emptyWarning?.path).toBe('canva.pages[0].schema.blocks');
  });
});

// ───────────────────────────────────────────────────────────────
// E. Edge cases — single page, many blocks, no blocks
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: edge cases', () => {
  it('handles single page with single block', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Only Page',
            templateType: 'cover',
            schema: { blocks: [{ id: 'b1', type: 'cover' }] },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    expect(preview.totalPages).toBe(1);
    expect(preview.totalBlocks).toBe(1);
    expect(preview.pages.length).toBe(1);
  });

  it('handles page with multiple blocks of same type', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Multi',
            templateType: 'materi',
            schema: {
              blocks: [
                { id: 'b1', type: 'def-box' },
                { id: 'b2', type: 'def-box' },
                { id: 'b3', type: 'def-box' },
              ],
            },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    expect(preview.totalBlocks).toBe(3);
    expect(preview.pages[0].blockCount).toBe(3);
    // Distinct types — only 1 unique type
    expect(preview.pages[0].blockTypes).toEqual(['def-box']);
    // Summary has 1 entry with count=3
    expect(preview.blockTypeSummary.length).toBe(1);
    expect(preview.blockTypeSummary[0].type).toBe('def-box');
    expect(preview.blockTypeSummary[0].count).toBe(3);
  });

  it('handles page with no blocks (empty-page warning)', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Empty',
            templateType: 'custom',
            schema: { blocks: [] },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    expect(preview.totalBlocks).toBe(0);
    expect(preview.pages[0].blockCount).toBe(0);
    expect(preview.pages[0].blockTypes).toEqual([]);
    expect(preview.blockTypeSummary).toEqual([]);
    expect(preview.warnings.some((w) => w.code === 'empty-page')).toBe(true);
  });

  it('handles missing optional meta fields (namaGuru, namaSekolah)', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      // no namaGuru, no namaSekolah
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Page',
            templateType: 'cover',
            schema: { blocks: [{ id: 'b1', type: 'cover' }] },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    expect(preview.meta.namaGuru).toBeUndefined();
    expect(preview.meta.namaSekolah).toBeUndefined();
    expect(preview.meta.judulPertemuan).toBe('T');
  });

  it('does NOT include empty-string namaGuru in preview meta', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: {
        judulPertemuan: 'T',
        mapel: 'P',
        kelas: '7',
        namaGuru: '   ',  // whitespace only
      },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'Page',
            templateType: 'cover',
            schema: { blocks: [{ id: 'b1', type: 'cover' }] },
          },
        ],
      },
    } as unknown as SilseImportJson;
    const preview = deriveSilseImportPreview(doc);
    expect(preview.meta.namaGuru).toBeUndefined();
  });
});

// ───────────────────────────────────────────────────────────────
// F. Block type summary — sorting, counts, hasEditor flags
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: block type summary', () => {
  it('sorts by count desc, then by type name asc', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'P1',
            templateType: 'materi',
            schema: {
              blocks: [
                { id: 'b1', type: 'def-box' },
                { id: 'b2', type: 'def-box' },
                { id: 'b3', type: 'def-box' },
                { id: 'b4', type: 'cover' },
                { id: 'b5', type: 'cover' },
                { id: 'b6', type: 'kuis' },
              ],
            },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    expect(preview.blockTypeSummary.length).toBe(3);
    // def-box (3) > cover (2) > kuis (1)
    expect(preview.blockTypeSummary[0].type).toBe('def-box');
    expect(preview.blockTypeSummary[0].count).toBe(3);
    expect(preview.blockTypeSummary[1].type).toBe('cover');
    expect(preview.blockTypeSummary[1].count).toBe(2);
    expect(preview.blockTypeSummary[2].type).toBe('kuis');
    expect(preview.blockTypeSummary[2].count).toBe(1);
  });

  it('hasEditor flag is correct for each type in summary', () => {
    const doc: SilseImportJson = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            label: 'P1',
            templateType: 'materi',
            schema: {
              blocks: [
                { id: 'b1', type: 'cover' },     // has editor
                { id: 'b2', type: 'tp' },         // no editor
                { id: 'b3', type: 'skenario' },   // no editor
              ],
            },
          },
        ],
      },
    };
    const preview = deriveSilseImportPreview(doc);
    const cover = preview.blockTypeSummary.find((s) => s.type === 'cover');
    const tp = preview.blockTypeSummary.find((s) => s.type === 'tp');
    const skenario = preview.blockTypeSummary.find((s) => s.type === 'skenario');
    expect(cover?.hasEditor).toBe(true);
    expect(tp?.hasEditor).toBe(false);
    expect(skenario?.hasEditor).toBe(false);
  });
});

// ───────────────────────────────────────────────────────────────
// G. ImportJsonPanelV5 — preview rendering (source audit)
// ───────────────────────────────────────────────────────────────

describe('BATCH-09B: ImportJsonPanelV5 — preview rendering (source audit)', () => {
  const src = () =>
    readSrc('components/product-v5/ImportJsonPanelV5.tsx');

  it('imports deriveSilseImportPreview + SilseImportPreview type', () => {
    const s = src();
    expect(s).toContain("from '@/lib/silse-import-preview'");
    expect(s).toContain('deriveSilseImportPreview');
    expect(s).toContain('SilseImportPreview');
  });

  it('has preview state', () => {
    expect(src()).toContain('const [preview, setPreview] = useState<SilseImportPreview | null>(null)');
  });

  it('resets preview when modal opens', () => {
    expect(src()).toMatch(/if \(open\) \{[\s\S]*?setPreview\(null\)/);
  });

  it('derives preview when validation result is valid', () => {
    const s = src();
    expect(s).toContain('validationResult.valid');
    expect(s).toContain('validationResult.document');
    expect(s).toContain('deriveSilseImportPreview(validationResult.document)');
  });

  it('clears preview when validation result is invalid', () => {
    const s = src();
    // The else branch after the valid check
    expect(s).toMatch(/} else \{[\s\S]*?setPreview\(null\)/);
  });

  it('clears preview in handleClear', () => {
    expect(src()).toMatch(/handleClear[\s\S]*?setPreview\(null\)/);
  });

  it('clears preview when validate called with empty input', () => {
    expect(src()).toMatch(/if \(!jsonInput\.trim\(\)\) \{[\s\S]*?setPreview\(null\)/);
  });

  it('wraps preview derivation in try/catch (no crash)', () => {
    const s = src();
    expect(s).toContain('try {');
    expect(s).toContain('deriveSilseImportPreview');
    expect(s).toMatch(/catch \(err\)[\s\S]*?setPreview\(null\)/);
  });

  it('renders preview section with data-testid="import-json-preview"', () => {
    expect(src()).toContain('data-testid="import-json-preview"');
  });

  it('renders preview only when isValid && preview', () => {
    expect(src()).toContain('{isValid && preview && (');
  });

  it('has preview-total-pages data-testid', () => {
    expect(src()).toContain('data-testid="preview-total-pages"');
  });

  it('has preview-total-blocks data-testid', () => {
    expect(src()).toContain('data-testid="preview-total-blocks"');
  });

  it('has preview-page-list data-testid', () => {
    expect(src()).toContain('data-testid="preview-page-list"');
  });

  it('has per-page data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`preview-page-\$\{page\.index\}`\}/);
  });

  it('has per-page block-types data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`preview-page-\$\{page\.index\}-block-types`\}/);
  });

  it('has preview-block-type-summary data-testid', () => {
    expect(src()).toContain('data-testid="preview-block-type-summary"');
  });

  it('has per-block-type data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`preview-block-type-\$\{s\.type\}`\}/);
  });

  it('has preview-warnings data-testid (only when warnings exist)', () => {
    expect(src()).toContain('data-testid="preview-warnings"');
  });

  it('has preview-warnings-list data-testid', () => {
    expect(src()).toContain('data-testid="preview-warnings-list"');
  });

  it('has per-warning data-testid', () => {
    expect(src()).toMatch(/data-testid=\{`preview-warning-\$\{idx\}`\}/);
  });

  it('shows warning icon for block types without editor', () => {
    // The warning icon should appear next to block types with hasEditor=false
    expect(src()).toContain('!s.hasEditor && (');
  });

  it('does NOT mutate store (no store imports)', () => {
    const s = src()
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(s).not.toContain('useCanvaStore');
    expect(s).not.toContain('useAuthoringStore');
    expect(s).not.toContain('updateSchemaBlock');
  });
});
