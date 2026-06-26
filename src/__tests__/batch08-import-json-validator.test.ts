// ═══════════════════════════════════════════════════════════════
// BATCH-08: IMPORT-JSON-VALIDATOR-01 — Tests
// ═══════════════════════════════════════════════════════════════
// Tests for the SILSE import JSON validator.
//
// Coverage:
//   A. Source audit — validator module exports correct API
//   B. Valid fixtures — should PASS
//   C. Invalid fixtures — should FAIL with correct reason
//   D. Edge cases — boundary conditions
//   E. Dangerous content patterns — all 9 patterns detected
//   F. Recursive scan — nested objects/arrays scanned
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  validateSilseImport,
  validateSilseImportJsonString,
  __TEST__,
  type SilseImportJson,
  type SilseImportValidationResult,
  type SilseImportRejectReason,
} from '@/lib/silse-import-validator';
import { CURRENT_PROJECT_SCHEMA_VERSION } from '@/core/schema/project-schema-versioning';

const FIXTURES_DIR = resolve(__dirname, '../../fixtures/silse-import');

function loadFixture(name: string): unknown {
  const raw = readFileSync(resolve(FIXTURES_DIR, name), 'utf-8');
  // Strip _fixture metadata before validation (validator doesn't expect it)
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === 'object' && '_fixture' in parsed) {
    delete parsed._fixture;
  }
  return parsed;
}

function loadFixtureRaw(name: string): string {
  return readFileSync(resolve(FIXTURES_DIR, name), 'utf-8');
}

// ───────────────────────────────────────────────────────────────
// A. Source audit — validator module exports correct API
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: silse-import-validator — module exports', () => {
  const src = readFileSync(resolve(__dirname, '../lib/silse-import-validator.ts'), 'utf-8');

  it('exports SilseImportJson interface', () => {
    expect(src).toContain('export interface SilseImportJson');
  });

  it('exports SilseImportPage interface', () => {
    expect(src).toContain('export interface SilseImportPage');
  });

  it('exports SilseImportBlock interface', () => {
    expect(src).toContain('export interface SilseImportBlock');
  });

  it('exports SilseImportRejectReason type', () => {
    expect(src).toContain('export type SilseImportRejectReason');
  });

  it('exports SilseImportValidationResult interface', () => {
    expect(src).toContain('export interface SilseImportValidationResult');
  });

  it('exports validateSilseImport function', () => {
    expect(src).toContain('export function validateSilseImport');
  });

  it('exports validateSilseImportJsonString function', () => {
    expect(src).toContain('export function validateSilseImportJsonString');
  });

  it('exports __TEST__ for unit test access', () => {
    expect(src).toContain('export const __TEST__');
  });

  it('imports CURRENT_PROJECT_SCHEMA_VERSION', () => {
    expect(src).toContain("from '@/core/schema/project-schema-versioning'");
  });

  it('imports getRegisteredBlockTypes from validation.ts', () => {
    expect(src).toContain("from '@/core/schema/validation'");
    expect(src).toContain('getRegisteredBlockTypes');
  });

  it('reject reasons include all 6 layers', () => {
    const reasons: SilseImportRejectReason[] = [
      'future-schemaversion',
      'invalid-schemaversion',
      'missing-meta',
      'missing-meta-judul',
      'missing-meta-mapel',
      'missing-meta-kelas',
      'missing-pages',
      'empty-pages',
      'unregistered-block-type',
      'block-missing-type',
      'block-missing-id',
      'dangerous-html-script',
      'dangerous-html-style',
      'dangerous-event-handler',
      'dangerous-javascript-url',
      'dangerous-eval',
      'dangerous-function-constructor',
      'dangerous-settimeout-string',
    ];
    for (const r of reasons) {
      expect(src, `must include reject reason '${r}'`).toContain(`'${r}'`);
    }
  });
});

// ───────────────────────────────────────────────────────────────
// B. Valid fixtures — should PASS
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: valid fixtures should PASS validation', () => {
  it('valid-minimal.json passes', () => {
    const doc = loadFixture('valid-minimal.json');
    const result = validateSilseImport(doc);
    expect(result.valid, `Expected valid, got: ${result.message}`).toBe(true);
    expect(result.document).toBeDefined();
    expect(result.document?.schemaVersion).toBe(1);
    expect(result.document?.meta.judulPertemuan).toBe('Pertemuan 1: Hakikat Norma');
  });

  it('valid-multi-page.json passes (3 pages, multiple block types)', () => {
    const doc = loadFixture('valid-multi-page.json');
    const result = validateSilseImport(doc);
    expect(result.valid, `Expected valid, got: ${result.message}`).toBe(true);
    expect(result.document?.canva.pages.length).toBe(3);
    expect(result.document?.canva.pages[0]?.schema?.blocks[0]?.type).toBe('cover');
    expect(result.document?.canva.pages[1]?.schema?.blocks[0]?.type).toBe('kuis');
    expect(result.document?.canva.pages[2]?.schema?.blocks[0]?.type).toBe('refleksi');
  });

  it('document with empty optional fields (no kuis/modules/etc.) still passes', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            templateType: 'cover',
            schema: { blocks: [{ id: 'b1', type: 'cover' }] },
          },
        ],
      },
    };
    const result = validateSilseImport(doc);
    expect(result.valid, `Expected valid, got: ${result.message}`).toBe(true);
  });

  it('legacy document (no schemaVersion) passes — will be migrated', () => {
    const doc = {
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            templateType: 'cover',
            schema: { blocks: [{ id: 'b1', type: 'cover' }] },
          },
        ],
      },
    };
    const result = validateSilseImport(doc);
    expect(result.valid, `Expected valid (legacy), got: ${result.message}`).toBe(true);
  });
});

// ───────────────────────────────────────────────────────────────
// C. Invalid fixtures — should FAIL with correct reason
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: invalid fixtures should FAIL with correct reason', () => {
  const cases: Array<{ file: string; expectedReason: SilseImportRejectReason }> = [
    { file: 'invalid-future-version.json', expectedReason: 'future-schemaversion' },
    { file: 'invalid-missing-meta.json', expectedReason: 'missing-meta' },
    { file: 'invalid-empty-pages.json', expectedReason: 'empty-pages' },
    { file: 'invalid-unregistered-block-type.json', expectedReason: 'unregistered-block-type' },
    { file: 'invalid-script-tag.json', expectedReason: 'dangerous-html-script' },
    { file: 'invalid-event-handler.json', expectedReason: 'dangerous-event-handler' },
    { file: 'invalid-javascript-url.json', expectedReason: 'dangerous-javascript-url' },
    { file: 'invalid-eval.json', expectedReason: 'dangerous-eval' },
    { file: 'invalid-block-missing-type.json', expectedReason: 'block-missing-type' },
  ];

  for (const { file, expectedReason } of cases) {
    it(`${file} fails with reason="${expectedReason}"`, () => {
      const doc = loadFixture(file);
      const result = validateSilseImport(doc);
      expect(result.valid, `Expected invalid, but got valid`).toBe(false);
      expect(result.reason, `Expected reason ${expectedReason}, got ${result.reason}`).toBe(expectedReason);
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.errors?.length ?? 0).toBeGreaterThan(0);
    });
  }
});

// ───────────────────────────────────────────────────────────────
// D. Edge cases — boundary conditions
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: edge cases', () => {
  it('rejects non-object input (string)', () => {
    const result = validateSilseImport('hello');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-object');
  });

  it('rejects non-object input (array)', () => {
    const result = validateSilseImport([1, 2, 3]);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-object');
  });

  it('rejects non-object input (null)', () => {
    const result = validateSilseImport(null);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-object');
  });

  it('rejects non-object input (number)', () => {
    const result = validateSilseImport(42);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-object');
  });

  it('rejects NaN schemaVersion', () => {
    const doc = {
      schemaVersion: NaN,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-schemaversion');
  });

  it('rejects negative schemaVersion', () => {
    const doc = {
      schemaVersion: -1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-schemaversion');
  });

  it('rejects string schemaVersion', () => {
    const doc = {
      schemaVersion: '1',
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-schemaversion');
  });

  it('accepts schemaVersion = CURRENT_PROJECT_SCHEMA_VERSION (=1)', () => {
    const doc = {
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid, `Expected valid for v=${CURRENT_PROJECT_SCHEMA_VERSION}`).toBe(true);
  });

  it('rejects empty meta.judulPertemuan (whitespace only)', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: '   ', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing-meta-judul');
  });

  it('rejects meta.kelas as empty string', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing-meta-kelas');
  });

  it('rejects canva.pages as non-array (string)', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: 'not an array' },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing-pages');
  });

  it('rejects page without schema field', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover' }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('page-missing-schema');
  });

  it('rejects page with schema.blocks as non-array', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: 'not array' } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('page-missing-blocks');
  });

  it('rejects block without id field', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ type: 'cover' }] } }] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('block-missing-id');
  });

  it('rejects page that is not a plain object', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: ['not an object'] },
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-page-shape');
  });
});

// ───────────────────────────────────────────────────────────────
// E. Dangerous content patterns — all 9 patterns detected
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: dangerous content patterns — all detected', () => {
  const dangerousStrings: Array<{ value: string; reason: SilseImportRejectReason; label: string }> = [
    { value: '<script>alert(1)</script>', reason: 'dangerous-html-script', label: '<script> tag' },
    { value: '</script>', reason: 'dangerous-html-script', label: '</script> close tag' },
    { value: '<SCRIPT>alert(1)</SCRIPT>', reason: 'dangerous-html-script', label: '<SCRIPT> uppercase' },
    { value: '<style>body{display:none}</style>', reason: 'dangerous-html-style', label: '<style> tag' },
    { value: '<img src=x onerror=alert(1)>', reason: 'dangerous-event-handler', label: 'onerror=' },
    { value: '<div onclick="alert(1)">click</div>', reason: 'dangerous-event-handler', label: 'onclick=' },
    { value: 'javascript:alert(1)', reason: 'dangerous-javascript-url', label: 'javascript: URL' },
    { value: 'JavaScript:alert(1)', reason: 'dangerous-javascript-url', label: 'JavaScript: mixed case' },
    { value: 'eval("alert(1)")', reason: 'dangerous-eval', label: 'eval() call' },
    { value: 'new Function("alert(1)")()', reason: 'dangerous-function-constructor', label: 'new Function()' },
    { value: 'setTimeout("alert(1)", 100)', reason: 'dangerous-settimeout-string', label: 'setTimeout(string)' },
    { value: 'setInterval("alert(1)", 100)', reason: 'dangerous-settimeout-string', label: 'setInterval(string)' },
  ];

  for (const { value, reason, label } of dangerousStrings) {
    it(`detects ${label} → reason=${reason}`, () => {
      const result = __TEST__.scanStringForDangerousContent(value);
      expect(result, `Should detect ${label} in "${value}"`).not.toBeNull();
      expect(result?.reason).toBe(reason);
    });
  }

  it('does NOT flag safe content (plain text)', () => {
    expect(__TEST__.scanStringForDangerousContent('Hello world')).toBeNull();
    expect(__TEST__.scanStringForDangerousContent('Norma adalah peraturan')).toBeNull();
  });

  it('does NOT flag safe HTML (allowed tags)', () => {
    // <p>, <b>, <i>, <strong>, <em> are safe HTML tags
    expect(__TEST__.scanStringForDangerousContent('<p>Paragraf</p>')).toBeNull();
    expect(__TEST__.scanStringForDangerousContent('<b>Bold</b>')).toBeNull();
    expect(__TEST__.scanStringForDangerousContent('<em>Italic</em>')).toBeNull();
  });

  it('does NOT flag "evaluation" word (substring of "eval" but not eval())', () => {
    // The pattern \beval\s*\( requires eval followed by (, so "evaluation" alone is safe
    expect(__TEST__.scanStringForDangerousContent('The evaluation was completed')).toBeNull();
  });

  it('does NOT flag "online" or "onloadtest" (no = after onXXX)', () => {
    // The pattern \bon\w+\s*= requires on<word>=, so "online" alone is safe
    expect(__TEST__.scanStringForDangerousContent('The user is online')).toBeNull();
    expect(__TEST__.scanStringForDangerousContent('onloadtest function')).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────
// F. Recursive scan — nested objects/arrays scanned
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: recursive tree scan', () => {
  it('detects dangerous content in nested object', () => {
    const tree = {
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            schema: {
              blocks: [
                {
                  id: 'b1',
                  type: 'cover',
                  nested: { deep: { value: '<script>alert(1)</script>' } },
                },
              ],
            },
          },
        ],
      },
    };
    const result = __TEST__.scanTreeForDangerousContent(tree, '');
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('dangerous-html-script');
    expect(result?.path).toContain('nested.deep.value');
  });

  it('detects dangerous content in array element', () => {
    const tree = {
      blocks: [
        { id: 'b1', content: 'safe' },
        { id: 'b2', content: '<img src=x onerror=alert(1)>' },
      ],
    };
    const result = __TEST__.scanTreeForDangerousContent(tree, '');
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('dangerous-event-handler');
    expect(result?.path).toBe('blocks[1].content');
  });

  it('detects dangerous content in meta field (top-level)', () => {
    const tree = {
      meta: { judulPertemuan: '<script>alert(1)</script>', mapel: 'P', kelas: '7' },
      canva: { pages: [] },
    };
    const result = __TEST__.scanTreeForDangerousContent(tree, '');
    expect(result).not.toBeNull();
    expect(result?.reason).toBe('dangerous-html-script');
    expect(result?.path).toBe('meta.judulPertemuan');
  });

  it('returns null for safe tree', () => {
    const tree = {
      meta: { judulPertemuan: 'Halo', mapel: 'PPKn', kelas: '7' },
      canva: { pages: [{ id: 'p1', schema: { blocks: [{ id: 'b1', type: 'cover', title: 'Safe' }] } }] },
    };
    expect(__TEST__.scanTreeForDangerousContent(tree, '')).toBeNull();
  });

  it('stops at first match (does not scan whole tree)', () => {
    const tree = {
      a: '<script>first</script>',
      b: '<script>second</script>',
    };
    const result = __TEST__.scanTreeForDangerousContent(tree, '');
    expect(result).not.toBeNull();
    expect(result?.path).toBe('a'); // stops at first
  });
});

// ───────────────────────────────────────────────────────────────
// G. JSON string validator — parse + validate
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: validateSilseImportJsonString — parse + validate', () => {
  it('returns invalid-json for malformed JSON', () => {
    const result = validateSilseImportJsonString('{ not valid json');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-json');
    expect(result.message).toContain('JSON');
  });

  it('parses + validates valid JSON string', () => {
    const json = JSON.stringify({
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: { pages: [{ id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover' }] } }] },
    });
    const result = validateSilseImportJsonString(json);
    expect(result.valid).toBe(true);
  });

  it('parses + rejects dangerous JSON string', () => {
    const json = JSON.stringify({
      schemaVersion: 1,
      meta: { judulPertemuan: 'T', mapel: 'P', kelas: '7' },
      canva: {
        pages: [
          {
            id: 'p1',
            templateType: 'materi',
            schema: { blocks: [{ id: 'b1', type: 'def-box', content: '<script>alert(1)</script>' }] },
          },
        ],
      },
    });
    const result = validateSilseImportJsonString(json);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('dangerous-html-script');
  });

  it('handles empty string input', () => {
    const result = validateSilseImportJsonString('');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid-json');
  });

  it('handles non-JSON-string input (number)', () => {
    const result = validateSilseImportJsonString('42');
    const parsed = JSON.parse('42');
    // 42 parses to a number, which is not a plain object → not-object
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not-object');
  });
});

// ───────────────────────────────────────────────────────────────
// H. Fixture files — load via JSON string path (end-to-end)
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: fixture files via validateSilseImportJsonString', () => {
  it('valid-minimal.json (raw string) passes', () => {
    const raw = loadFixtureRaw('valid-minimal.json');
    // Strip _fixture line
    const cleaned = raw.replace(/"_fixture"\s*:\s*\{[\s\S]*?\},?\s*/m, '').replace(/,\s*}/, '}');
    // Simpler: parse, strip, re-stringify
    const parsed = JSON.parse(raw);
    delete parsed._fixture;
    const result = validateSilseImportJsonString(JSON.stringify(parsed));
    expect(result.valid, `Expected valid, got: ${result.message}`).toBe(true);
  });

  it('invalid-script-tag.json (raw string) fails with dangerous-html-script', () => {
    const raw = loadFixtureRaw('invalid-script-tag.json');
    const parsed = JSON.parse(raw);
    delete parsed._fixture;
    const result = validateSilseImportJsonString(JSON.stringify(parsed));
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('dangerous-html-script');
  });
});

// ───────────────────────────────────────────────────────────────
// I. Multi-error reporting — when multiple issues exist, all reported
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: multi-error reporting', () => {
  it('reports multiple errors when document has several issues', () => {
    const doc = {
      schemaVersion: 99, // future-version
      // missing meta entirely
      canva: { pages: [] }, // empty pages
    };
    const result = validateSilseImport(doc);
    expect(result.valid).toBe(false);
    expect(result.errors?.length ?? 0).toBeGreaterThanOrEqual(3);
    // First error reason should be one of them (we don't guarantee order)
    const reasons = (result.errors ?? []).map((e) => e.reason);
    expect(reasons).toContain('future-schemaversion');
    expect(reasons).toContain('missing-meta');
    expect(reasons).toContain('empty-pages');
  });

  it('reason field is the FIRST error (for quick rejection display)', () => {
    const doc = {
      schemaVersion: 99,
      // missing meta
      canva: { pages: [] },
    };
    const result = validateSilseImport(doc);
    expect(result.reason).toBeDefined();
    expect(result.errors?.[0]?.reason).toBe(result.reason);
  });
});

// ───────────────────────────────────────────────────────────────
// J. Security: validator does NOT mutate input
// ───────────────────────────────────────────────────────────────

describe('BATCH-08: security — validator does NOT mutate input', () => {
  it('does not modify the input document', () => {
    const doc = {
      schemaVersion: 1,
      meta: { judulPertemuan: 'Original Title', mapel: 'PPKn', kelas: '7' },
      canva: {
        pages: [
          { id: 'p1', templateType: 'cover', schema: { blocks: [{ id: 'b1', type: 'cover', title: 'Original' }] } },
        ],
      },
    };
    const originalSnapshot = JSON.parse(JSON.stringify(doc));
    validateSilseImport(doc);
    expect(doc).toEqual(originalSnapshot);
  });
});
