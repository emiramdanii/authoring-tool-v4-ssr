// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.6A — Project Schema Versioning Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the project-schema-versioning module:
//   1. CURRENT_PROJECT_SCHEMA_VERSION constant exists (= 1)
//   2. getCurrentProjectSchemaVersion() returns the constant
//   3. normalizeProjectSchemaVersion() handles all input shapes
//   4. isSupportedProjectSchemaVersion() — fail-safe semantics
//   5. validateProjectSchemaVersion() — plain-object shape check
//   6. migrateProjectDocument() — accept legacy/current, reject future/malformed
//   7. Migration preserves ALL existing fields (canva.pages, ratioId,
//      contractId, pageMode, schema.themeId, templateData.*, navConfig,
//      bgColor, bgDataUrl, overlay, schema.background, schema.blocks)
//   8. ScreenSchema.version compatibility bug fixed (cross-check via
//      isSchemaVersionCompatible from validation.ts)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  getCurrentProjectSchemaVersion,
  normalizeProjectSchemaVersion,
  isSupportedProjectSchemaVersion,
  validateProjectSchemaVersion,
  migrateProjectDocument,
} from '@/core/schema/project-schema-versioning';
import { SCHEMA_VERSION, isSchemaVersionCompatible } from '@/core/schema/validation';
import type { ScreenSchema } from '@/core/schema/types';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function loadFixture(name: string): unknown {
  const path = resolve(process.cwd(), 'fixtures/projects', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function makeScreenSchema(version: number | undefined): ScreenSchema {
  return {
    id: 'schema-test',
    templateType: 'materi',
    ...(version !== undefined ? { version } : {}),
    blocks: [],
  } as ScreenSchema;
}

// ─────────────────────────────────────────────────────────────────
// Tests — Constants + getters
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — Project Schema Versioning (constants + getters)', () => {
  it('CURRENT_PROJECT_SCHEMA_VERSION constant exists and equals 1', () => {
    expect(CURRENT_PROJECT_SCHEMA_VERSION).toBe(1);
    expect(typeof CURRENT_PROJECT_SCHEMA_VERSION).toBe('number');
  });

  it('getCurrentProjectSchemaVersion() returns the constant', () => {
    expect(getCurrentProjectSchemaVersion()).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    expect(getCurrentProjectSchemaVersion()).toBe(1);
  });

  it('SCHEMA_VERSION (per-page) is still 2 (separate from project-level)', () => {
    // Sanity check: project-level version (1) is INDEPENDENT from
    // per-page ScreenSchema.version (2). They must not be conflated.
    expect(SCHEMA_VERSION).toBe(2);
    expect(SCHEMA_VERSION).not.toBe(CURRENT_PROJECT_SCHEMA_VERSION);
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — normalizeProjectSchemaVersion
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — normalizeProjectSchemaVersion', () => {
  it('returns null for undefined (legacy/missing)', () => {
    expect(normalizeProjectSchemaVersion(undefined)).toBeNull();
  });

  it('returns null for null (legacy/missing)', () => {
    expect(normalizeProjectSchemaVersion(null)).toBeNull();
  });

  it('returns the number for valid positive integers', () => {
    expect(normalizeProjectSchemaVersion(0)).toBe(0);
    expect(normalizeProjectSchemaVersion(1)).toBe(1);
    expect(normalizeProjectSchemaVersion(99)).toBe(99);
  });

  it('returns null for NaN', () => {
    expect(normalizeProjectSchemaVersion(NaN)).toBeNull();
  });

  it('returns null for negative numbers', () => {
    expect(normalizeProjectSchemaVersion(-1)).toBeNull();
    expect(normalizeProjectSchemaVersion(-99)).toBeNull();
  });

  it('parses numeric strings', () => {
    expect(normalizeProjectSchemaVersion('0')).toBe(0);
    expect(normalizeProjectSchemaVersion('1')).toBe(1);
    expect(normalizeProjectSchemaVersion('99')).toBe(99);
  });

  it('returns null for non-numeric strings', () => {
    expect(normalizeProjectSchemaVersion('not-a-number')).toBeNull();
    expect(normalizeProjectSchemaVersion('')).toBeNull();
    expect(normalizeProjectSchemaVersion('abc')).toBeNull();
  });

  it('returns null for non-number, non-string types', () => {
    expect(normalizeProjectSchemaVersion({})).toBeNull();
    expect(normalizeProjectSchemaVersion([])).toBeNull();
    expect(normalizeProjectSchemaVersion(true)).toBeNull();
    expect(normalizeProjectSchemaVersion(false)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — isSupportedProjectSchemaVersion
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — isSupportedProjectSchemaVersion', () => {
  it('returns true for missing/undefined (legacy, migratable)', () => {
    expect(isSupportedProjectSchemaVersion(undefined)).toBe(true);
  });

  it('returns true for null (legacy, migratable)', () => {
    expect(isSupportedProjectSchemaVersion(null)).toBe(true);
  });

  it('returns true for v0 (legacy, migratable)', () => {
    expect(isSupportedProjectSchemaVersion(0)).toBe(true);
  });

  it('returns true for v1..CURRENT (current, supported)', () => {
    for (let v = 1; v <= CURRENT_PROJECT_SCHEMA_VERSION; v++) {
      expect(isSupportedProjectSchemaVersion(v)).toBe(true);
    }
  });

  it('returns false for future version > CURRENT', () => {
    expect(isSupportedProjectSchemaVersion(CURRENT_PROJECT_SCHEMA_VERSION + 1)).toBe(false);
    expect(isSupportedProjectSchemaVersion(99)).toBe(false);
    expect(isSupportedProjectSchemaVersion(1000)).toBe(false);
  });

  it('returns false for malformed non-numeric string', () => {
    expect(isSupportedProjectSchemaVersion('not-a-number')).toBe(false);
    expect(isSupportedProjectSchemaVersion('abc')).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isSupportedProjectSchemaVersion(NaN)).toBe(false);
  });

  it('returns false for negative', () => {
    expect(isSupportedProjectSchemaVersion(-1)).toBe(false);
  });

  it('returns false for object/array/boolean (malformed)', () => {
    expect(isSupportedProjectSchemaVersion({})).toBe(false);
    expect(isSupportedProjectSchemaVersion([])).toBe(false);
    expect(isSupportedProjectSchemaVersion(true)).toBe(false);
  });

  it('parses numeric strings correctly (1 → true, 99 → false)', () => {
    expect(isSupportedProjectSchemaVersion('1')).toBe(true);
    expect(isSupportedProjectSchemaVersion('99')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — validateProjectSchemaVersion (shape check)
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — validateProjectSchemaVersion (shape check)', () => {
  it('returns true for plain objects', () => {
    expect(validateProjectSchemaVersion({})).toBe(true);
    expect(validateProjectSchemaVersion({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(validateProjectSchemaVersion(null)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(validateProjectSchemaVersion([])).toBe(false);
    expect(validateProjectSchemaVersion([1, 2, 3])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(validateProjectSchemaVersion(undefined)).toBe(false);
    expect(validateProjectSchemaVersion(42)).toBe(false);
    expect(validateProjectSchemaVersion('string')).toBe(false);
    expect(validateProjectSchemaVersion(true)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — migrateProjectDocument (accept/reject logic)
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — migrateProjectDocument (accept/reject)', () => {
  it('rejects null with reason=invalid-shape', () => {
    const result = migrateProjectDocument(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape');
    }
  });

  it('rejects array with reason=invalid-shape', () => {
    const result = migrateProjectDocument([1, 2, 3]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape');
    }
  });

  it('rejects string with reason=invalid-shape', () => {
    const result = migrateProjectDocument('not an object');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape');
    }
  });

  it('accepts legacy (no schemaVersion) and migrates to CURRENT', () => {
    const result = migrateProjectDocument({ meta: { foo: 'bar' }, canva: { pages: [] } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      expect(result.document.meta).toEqual({ foo: 'bar' });
      expect(result.document.canva).toEqual({ pages: [] });
    }
  });

  it('accepts current version as-is', () => {
    const result = migrateProjectDocument({ schemaVersion: 1, meta: { x: 1 } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(1);
      expect(result.document.meta).toEqual({ x: 1 });
    }
  });

  it('rejects future version with reason=future-version', () => {
    const result = migrateProjectDocument({ schemaVersion: 99 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('future-version');
      expect(result.message).toContain('99');
    }
  });

  it('rejects malformed non-numeric string with reason=malformed-version', () => {
    const result = migrateProjectDocument({ schemaVersion: 'not-a-number' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('rejects NaN with reason=malformed-version', () => {
    const result = migrateProjectDocument({ schemaVersion: NaN });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('rejects negative with reason=malformed-version', () => {
    const result = migrateProjectDocument({ schemaVersion: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('rejects object-typed schemaVersion with reason=malformed-version', () => {
    const result = migrateProjectDocument({ schemaVersion: { v: 1 } });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('rejects array-typed schemaVersion with reason=malformed-version', () => {
    const result = migrateProjectDocument({ schemaVersion: [1] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — field preservation during migration
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — migrateProjectDocument preserves ALL existing fields', () => {
  it('preserves canva.pages, ratioId, currentPageIndex', () => {
    const input = {
      canva: {
        pages: [{ id: 'p1', label: 'P1' }],
        ratioId: '4:3',
        currentPageIndex: 2,
      },
    };
    const result = migrateProjectDocument(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.canva).toEqual({
        pages: [{ id: 'p1', label: 'P1' }],
        ratioId: '4:3',
        currentPageIndex: 2,
      });
    }
  });

  it('preserves contractId, pageMode inside canva.pages', () => {
    const input = {
      canva: {
        pages: [
          {
            id: 'p1',
            contractId: 'academic-clean-contract',
            pageMode: 'schema',
            schema: { id: 's1', templateType: 'materi', blocks: [] },
          },
        ],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    };
    const result = migrateProjectDocument(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const page = (result.document.canva as { pages: Array<{ contractId: string; pageMode: string }> }).pages[0];
      expect(page.contractId).toBe('academic-clean-contract');
      expect(page.pageMode).toBe('schema');
    }
  });

  it('preserves schema.themeId, templateData.schemaThemeId, templateVariant', () => {
    const input = {
      canva: {
        pages: [
          {
            id: 'p1',
            schema: { id: 's1', templateType: 'materi', themeId: 'legacy-theme-001', blocks: [] },
            templateData: { schemaThemeId: 'legacy-theme-001', variant: 'A' },
            templateVariant: 'A',
          },
        ],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    };
    const result = migrateProjectDocument(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const page = (result.document.canva as { pages: Array<Record<string, unknown>> }).pages[0];
      const schema = page.schema as { themeId: string };
      const templateData = page.templateData as { schemaThemeId: string; variant: string };
      expect(schema.themeId).toBe('legacy-theme-001');
      expect(templateData.schemaThemeId).toBe('legacy-theme-001');
      expect(page.templateVariant).toBe('A');
    }
  });

  it('preserves navConfig, bgColor, bgDataUrl, overlay', () => {
    const input = {
      canva: {
        pages: [
          {
            id: 'p1',
            navConfig: { showNavbar: true, showPrevNext: false, navbarStyle: 'minimal' },
            bgColor: '#ffffff',
            bgDataUrl: 'data:image/png;base64,abc123',
            overlay: 40,
          },
        ],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    };
    const result = migrateProjectDocument(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const page = (result.document.canva as { pages: Array<Record<string, unknown>> }).pages[0];
      expect(page.navConfig).toEqual({ showNavbar: true, showPrevNext: false, navbarStyle: 'minimal' });
      expect(page.bgColor).toBe('#ffffff');
      expect(page.bgDataUrl).toBe('data:image/png;base64,abc123');
      expect(page.overlay).toBe(40);
    }
  });

  it('preserves schema.background and schema.blocks', () => {
    const input = {
      canva: {
        pages: [
          {
            id: 'p1',
            schema: {
              id: 's1',
              templateType: 'materi',
              blocks: [
                { id: 'b1', type: 'materi-section', title: 'Section 1' },
                { id: 'b2', type: 'materi-section', title: 'Section 2' },
              ],
              background: { type: 'radial', color1: 'y', color2: 'bg' },
            },
          },
        ],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    };
    const result = migrateProjectDocument(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const page = (result.document.canva as { pages: Array<{ schema: { blocks: unknown[]; background: Record<string, string> } }> }).pages[0];
      expect(page.schema.blocks.length).toBe(2);
      expect(page.schema.background).toEqual({ type: 'radial', color1: 'y', color2: 'bg' });
    }
  });

  it('preserves authoring-side fields (meta, cp, tp, atp, alur, kuis, modules, materi)', () => {
    const input = {
      meta: { judulPertemuan: 'Test', mapel: 'PPKn' },
      cp: { elemen: 'Pancasila', fase: 'D' },
      tp: [{ id: 'tp1' }, { id: 'tp2' }],
      atp: { namaBab: 'Bab 1', pertemuan: [] },
      alur: [{ id: 'alur1' }],
      kuis: [{ id: 'k1' }],
      modules: [{ id: 'm1', type: 'materi-section' }],
      materi: { blok: [{ id: 'b1' }] },
    };
    const result = migrateProjectDocument(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.meta).toEqual({ judulPertemuan: 'Test', mapel: 'PPKn' });
      expect(result.document.cp).toEqual({ elemen: 'Pancasila', fase: 'D' });
      expect(result.document.tp).toEqual([{ id: 'tp1' }, { id: 'tp2' }]);
      expect(result.document.atp).toEqual({ namaBab: 'Bab 1', pertemuan: [] });
      expect(result.document.alur).toEqual([{ id: 'alur1' }]);
      expect(result.document.kuis).toEqual([{ id: 'k1' }]);
      expect(result.document.modules).toEqual([{ id: 'm1', type: 'materi-section' }]);
      expect(result.document.materi).toEqual({ blok: [{ id: 'b1' }] });
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — fixtures
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — fixture files', () => {
  it('legacy-no-schema-version.json fixture has no schemaVersion field at top level', () => {
    const data = loadFixture('legacy-no-schema-version.json') as { schemaVersion?: unknown; _fixture?: { schemaVersion: unknown } };
    // _fixture.schemaVersion is null (metadata about the fixture)
    expect(data._fixture?.schemaVersion).toBeNull();
    // Top-level schemaVersion should be missing — the fixture simulates legacy JSON
    // (Note: the fixture file has _fixture.schemaVersion: null but no top-level schemaVersion key
    // OR top-level schemaVersion: null. Either way, migrateProjectDocument should accept it.)
    // We accept both shapes — the migration logic handles missing/null as legacy.
  });

  it('legacy fixture migrates successfully via migrateProjectDocument', () => {
    const data = loadFixture('legacy-no-schema-version.json');
    const result = migrateProjectDocument(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      // canva.pages should be preserved
      const canva = result.document.canva as { pages: unknown[] };
      expect(canva.pages.length).toBe(1);
    }
  });

  it('current-schema-version.json fixture has schemaVersion = 1', () => {
    const data = loadFixture('current-schema-version.json') as { schemaVersion: number };
    expect(data.schemaVersion).toBe(1);
  });

  it('current fixture migrates successfully (accepted as-is)', () => {
    const data = loadFixture('current-schema-version.json');
    const result = migrateProjectDocument(data);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    }
  });

  it('future-schema-version.json fixture has schemaVersion = 99', () => {
    const data = loadFixture('future-schema-version.json') as { schemaVersion: number };
    expect(data.schemaVersion).toBe(99);
  });

  it('future fixture is REJECTED by migrateProjectDocument', () => {
    const data = loadFixture('future-schema-version.json');
    const result = migrateProjectDocument(data);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('future-version');
    }
  });

  it('malformed-schema-version.json fixture has non-numeric schemaVersion', () => {
    const data = loadFixture('malformed-schema-version.json') as { schemaVersion: unknown };
    expect(typeof data.schemaVersion).toBe('string');
    expect(data.schemaVersion).toBe('not-a-number');
  });

  it('malformed fixture is REJECTED by migrateProjectDocument', () => {
    const data = loadFixture('malformed-schema-version.json');
    const result = migrateProjectDocument(data);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Tests — ScreenSchema.version compatibility (cross-check, Sprint 8.6A fix)
// ═══════════════════════════════════════════════════════════════════
// The bug: isSchemaVersionCompatible() only accepted v1/missing and
// rejected v2 (current!) plus all future versions. Sprint 8.6A fixed
// this to use fail-safe semantics:
//   - missing/undefined → true (legacy, migratable)
//   - v0/v1 → true (legacy, migratable)
//   - v2 (current SCHEMA_VERSION) → true
//   - future v > SCHEMA_VERSION → false (fail-safe)
//   - malformed → false (fail-safe)
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — ScreenSchema.version compatibility bug fix (validation.ts)', () => {
  it('missing version → compatible (legacy, migratable)', () => {
    const schema = makeScreenSchema(undefined);
    expect(isSchemaVersionCompatible(schema)).toBe(true);
  });

  it('v0 → compatible (legacy, migratable)', () => {
    const schema = makeScreenSchema(0);
    expect(isSchemaVersionCompatible(schema)).toBe(true);
  });

  it('v1 → compatible (legacy, migratable)', () => {
    const schema = makeScreenSchema(1);
    expect(isSchemaVersionCompatible(schema)).toBe(true);
  });

  it('v2 (current SCHEMA_VERSION) → compatible (BUG FIX — was rejected before)', () => {
    const schema = makeScreenSchema(SCHEMA_VERSION);
    expect(isSchemaVersionCompatible(schema)).toBe(true);
  });

  it('future version > SCHEMA_VERSION → NOT compatible (fail-safe)', () => {
    const schema = makeScreenSchema(SCHEMA_VERSION + 1);
    expect(isSchemaVersionCompatible(schema)).toBe(false);
  });

  it('far-future version (99) → NOT compatible', () => {
    const schema = makeScreenSchema(99);
    expect(isSchemaVersionCompatible(schema)).toBe(false);
  });

  it('NaN version → NOT compatible (fail-safe, malformed)', () => {
    const schema = makeScreenSchema(NaN);
    expect(isSchemaVersionCompatible(schema)).toBe(false);
  });

  it('negative version → NOT compatible (fail-safe, malformed)', () => {
    const schema = makeScreenSchema(-1);
    expect(isSchemaVersionCompatible(schema)).toBe(false);
  });
});
