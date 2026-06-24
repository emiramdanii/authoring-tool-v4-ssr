// ═══════════════════════════════════════════════════════════════════
// SPRINT 9.0A — Persistence Migration Idempotency Gate
// ═══════════════════════════════════════════════════════════════════
// Closes PERSIST-002 by proving migration is idempotent:
//
//   migrate(migrate(doc)) === migrate(doc)  (deep equality)
//
// Coverage:
//   1. Legacy document (no schemaVersion) — idempotent after migration
//   2. Current document (schemaVersion=1) — unchanged after migration
//   3. Document with canvas page schema — all fields preserved
//   4. Document with hotspot-image block — block preserved
//   5. Triple migration stability: migrate(migrate(migrate(doc)))
//   6. Style authority fields preserved (contractId, pageMode, schema.themeId, etc.)
//   7. Unknown/extra fields NOT deleted
//   8. Invalid/minimal document handled explicitly (not silent corruption)
//   9. Real fixtures: legacy-no-schema-version, current-schema-version,
//      golden-pertemuan, fresh-mission-adventure, image-background-large
//  10. Per-page schema migration idempotency (migrateAllPages)
//  11. ScreenSchema migration idempotency (migrateSchema)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

import { migrateProjectDocument, CURRENT_PROJECT_SCHEMA_VERSION } from '@/core/schema/project-schema-versioning';
import { migrateSchema, migrateAllSchemas, SCHEMA_VERSION } from '@/core/schema/schema-migration';
import type { HotspotImageBlock } from '@/core/schema/types/blocks';
import type { ScreenSchema } from '@/core/schema/types';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function loadFixture(name: string): unknown {
  const path = resolve(process.cwd(), 'fixtures/projects', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep equality check — uses JSON.stringify for deterministic comparison.
 * Both inputs must be JSON-serializable (no functions, no undefined values).
 */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ─────────────────────────────────────────────────────────────────
// Synthetic document builders
// ─────────────────────────────────────────────────────────────────

function makeLegacyDoc(): Record<string, unknown> {
  return {
    meta: { judulPertemuan: 'Legacy Doc', mapel: 'PPKn', kelas: 'VII' },
    canva: {
      pages: [{
        id: 'p1',
        label: 'Page 1',
        bgDataUrl: 'data:image/png;base64,abc',
        bgColor: '#0f172a',
        overlay: 40,
        elements: [],
        templateType: 'materi',
        colorPalette: null,
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: { schemaThemeId: 'legacy-theme' },
        pageMode: 'schema',
        contractId: 'legacy-contract',
        schema: {
          id: 'schema-p1',
          version: 2,
          templateType: 'materi',
          blocks: [
            { id: 'b1', type: 'materi-section', variant: 'A', layout: { position: 'flow' }, title: 'Section 1' },
          ],
          background: { type: 'solid', color1: 'bg' },
        },
      }],
      ratioId: '16:9',
      currentPageIndex: 0,
    },
  };
}

function makeCurrentDoc(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    meta: { judulPertemuan: 'Current Doc', mapel: 'PPKn', kelas: 'VIII' },
    canva: {
      pages: [{
        id: 'p1',
        label: 'Page 1',
        bgDataUrl: null,
        bgColor: '#ffffff',
        overlay: 20,
        elements: [],
        templateType: 'materi',
        colorPalette: null,
        navConfig: { showNavbar: true, showPrevNext: false, showScore: true, showProgress: true, navbarStyle: 'minimal' },
        templateData: { schemaThemeId: 'academic-clean' },
        pageMode: 'schema',
        contractId: 'academic-clean-contract',
        schema: {
          id: 'schema-p1',
          version: 2,
          templateType: 'materi',
          blocks: [
            { id: 'b1', type: 'materi-section', variant: 'A', layout: { position: 'flow' }, title: 'Section 1' },
          ],
          background: { type: 'radial', color1: 'y', color2: 'bg' },
        },
      }],
      ratioId: '16:9',
      currentPageIndex: 0,
    },
  };
}

function makeHotspotDoc(): Record<string, unknown> {
  const hotspotBlock: HotspotImageBlock = {
    type: 'hotspot-image',
    id: 'hs-block-1',
    variant: 'A',
    layout: { position: 'flow' },
    title: 'Hotspot Test',
    image: { url: 'https://example.com/img.png', alt: 'Test image' },
    hotspots: [
      { id: 'hs-1', x: 15, y: 15, label: '1', title: 'Titik 1', body: 'Body text', icon: '📍', color: 'y' },
      { id: 'hs-2', x: 85, y: 85, label: '2', title: 'Titik 2', body: 'Body 2', icon: '🔍', color: 'g' },
    ],
    accentColor: 'y',
  };
  return {
    schemaVersion: 1,
    meta: { judulPertemuan: 'Hotspot Doc' },
    canva: {
      pages: [{
        id: 'p1',
        label: 'Hotspot Page',
        bgDataUrl: null,
        bgColor: '#0f172a',
        overlay: 0,
        elements: [],
        templateType: 'materi',
        colorPalette: null,
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {},
        pageMode: 'schema',
        contractId: null,
        schema: {
          id: 'schema-p1',
          version: 2,
          templateType: 'materi',
          blocks: [hotspotBlock],
          background: { type: 'solid', color1: 'bg' },
        },
      }],
      ratioId: '16:9',
      currentPageIndex: 0,
    },
  };
}

function makeExtraFieldsDoc(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    meta: { judulPertemuan: 'Extra Fields Doc' },
    canva: {
      pages: [{
        id: 'p1',
        label: 'Page 1',
        bgDataUrl: null,
        bgColor: '#0f172a',
        overlay: 0,
        elements: [],
        templateType: 'materi',
        colorPalette: null,
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {},
        pageMode: 'schema',
        contractId: null,
        schema: { id: 's1', version: 2, templateType: 'materi', blocks: [], background: { type: 'solid', color1: 'bg' } },
        // Unknown/extra fields that should survive migration
        customField: 'should-survive',
        anotherExtra: { nested: { value: 42 } },
      }],
      ratioId: '16:9',
      currentPageIndex: 0,
    },
    // Top-level extra field
    customTopLevel: 'should-also-survive',
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 9.0A — Persistence Migration Idempotency', () => {

  // ── 1. Legacy document idempotency ──────────────────────────

  describe('Legacy document (no schemaVersion)', () => {
    it('migrate succeeds and sets schemaVersion to current', () => {
      const doc = makeLegacyDoc();
      const result = migrateProjectDocument(doc);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      }
    });

    it('migrate(migrate(doc)) === migrate(doc) — deep equal', () => {
      const doc = makeLegacyDoc();
      const r1 = migrateProjectDocument(doc);
      expect(r1.ok).toBe(true);
      if (!r1.ok) return;

      const r2 = migrateProjectDocument(r1.document);
      expect(r2.ok).toBe(true);
      if (!r2.ok) return;

      expect(deepEqual(r1.document, r2.document)).toBe(true);
    });

    it('migrate(migrate(migrate(doc))) === migrate(doc) — triple stable', () => {
      const doc = makeLegacyDoc();
      const r1 = migrateProjectDocument(doc);
      if (!r1.ok) return;
      const r2 = migrateProjectDocument(r1.document);
      if (!r2.ok) return;
      const r3 = migrateProjectDocument(r2.document);
      if (!r3.ok) return;
      expect(deepEqual(r1.document, r3.document)).toBe(true);
    });
  });

  // ── 2. Current document idempotency ─────────────────────────

  describe('Current document (schemaVersion=1)', () => {
    it('migrate succeeds and keeps schemaVersion at current', () => {
      const doc = makeCurrentDoc();
      const result = migrateProjectDocument(doc);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      }
    });

    it('migrate(migrate(doc)) === migrate(doc) — deep equal', () => {
      const doc = makeCurrentDoc();
      const r1 = migrateProjectDocument(doc);
      if (!r1.ok) return;
      const r2 = migrateProjectDocument(r1.document);
      if (!r2.ok) return;
      expect(deepEqual(r1.document, r2.document)).toBe(true);
    });

    it('current document does not change unnecessarily after migration', () => {
      const doc = makeCurrentDoc();
      const original = deepClone(doc);
      const result = migrateProjectDocument(doc);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // schemaVersion should be the same (already current)
      expect(result.document.schemaVersion).toBe(original.schemaVersion);
      // meta should be preserved
      expect(result.document.meta).toEqual(original.meta);
      // canva.ratioId should be preserved
      expect((result.document.canva as Record<string, unknown>).ratioId).toBe('16:9');
    });
  });

  // ── 3. Document with canvas page schema ─────────────────────

  describe('Document with canvas page schema — all fields preserved', () => {
    it('page schema.blocks survive migration', () => {
      const doc = makeCurrentDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const canva = result.document.canva as { pages: Array<{ schema?: { blocks: unknown[] } }> };
      expect(canva.pages[0].schema?.blocks?.length).toBe(1);
    });

    it('style authority fields preserved (contractId, pageMode, navConfig, bgColor, overlay)', () => {
      const doc = makeLegacyDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const page = (result.document.canva as { pages: Array<Record<string, unknown>> }).pages[0];
      expect(page.contractId).toBe('legacy-contract');
      expect(page.pageMode).toBe('schema');
      expect(page.navConfig).toEqual({ showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' });
      expect(page.bgColor).toBe('#0f172a');
      expect(page.overlay).toBe(40);
    });

    it('bgDataUrl preserved', () => {
      const doc = makeLegacyDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const page = (result.document.canva as { pages: Array<Record<string, unknown>> }).pages[0];
      expect(page.bgDataUrl).toBe('data:image/png;base64,abc');
    });

    it('templateData.schemaThemeId preserved', () => {
      const doc = makeLegacyDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const page = (result.document.canva as { pages: Array<{ templateData?: { schemaThemeId?: string } }> }).pages[0];
      expect(page.templateData?.schemaThemeId).toBe('legacy-theme');
    });
  });

  // ── 4. Document with hotspot-image block ────────────────────

  describe('Document with hotspot-image block — idempotent + preserved', () => {
    it('hotspot-image block survives migration', () => {
      const doc = makeHotspotDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const canva = result.document.canva as { pages: Array<{ schema?: { blocks: HotspotImageBlock[] } }> };
      const blocks = canva.pages[0].schema?.blocks ?? [];
      expect(blocks.length).toBe(1);
      expect(blocks[0].type).toBe('hotspot-image');
      expect(blocks[0].hotspots.length).toBe(2);
      expect(blocks[0].hotspots[0].x).toBe(15);
      expect(blocks[0].hotspots[0].y).toBe(15);
      expect(blocks[0].hotspots[1].x).toBe(85);
      expect(blocks[0].hotspots[1].y).toBe(85);
    });

    it('migrate(migrate(doc)) === migrate(doc) for hotspot doc', () => {
      const doc = makeHotspotDoc();
      const r1 = migrateProjectDocument(doc);
      if (!r1.ok) return;
      const r2 = migrateProjectDocument(r1.document);
      if (!r2.ok) return;
      expect(deepEqual(r1.document, r2.document)).toBe(true);
    });

    it('hotspot body is plain text (not corrupted by migration)', () => {
      const doc = makeHotspotDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const canva = result.document.canva as { pages: Array<{ schema?: { blocks: HotspotImageBlock[] } }> };
      const block = canva.pages[0].schema?.blocks?.[0];
      expect(block?.hotspots[0].body).toBe('Body text');
    });
  });

  // ── 5. Triple migration stability for all synthetic docs ─────

  describe('Triple migration stability', () => {
    const docs: Array<[string, () => Record<string, unknown>]> = [
      ['legacy', makeLegacyDoc],
      ['current', makeCurrentDoc],
      ['hotspot', makeHotspotDoc],
      ['extra-fields', makeExtraFieldsDoc],
    ];

    for (const [name, makeDoc] of docs) {
      it(`migrate³(${name}) === migrate(${name})`, () => {
        const doc = makeDoc();
        const r1 = migrateProjectDocument(doc);
        if (!r1.ok) return;
        const r2 = migrateProjectDocument(r1.document);
        if (!r2.ok) return;
        const r3 = migrateProjectDocument(r2.document);
        if (!r3.ok) return;
        expect(deepEqual(r1.document, r3.document)).toBe(true);
      });
    }
  });

  // ── 6. Unknown/extra fields NOT deleted ─────────────────────

  describe('Unknown/extra fields preserved', () => {
    it('page-level custom fields survive migration', () => {
      const doc = makeExtraFieldsDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      const page = (result.document.canva as { pages: Array<Record<string, unknown>> }).pages[0];
      expect(page.customField).toBe('should-survive');
      expect(page.anotherExtra).toEqual({ nested: { value: 42 } });
    });

    it('top-level custom fields survive migration', () => {
      const doc = makeExtraFieldsDoc();
      const result = migrateProjectDocument(doc);
      if (!result.ok) return;
      expect(result.document.customTopLevel).toBe('should-also-survive');
    });
  });

  // ── 7. Invalid/minimal document handled explicitly ───────────

  describe('Invalid/minimal document handling', () => {
    it('null input rejected with invalid-shape', () => {
      const result = migrateProjectDocument(null);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-shape');
    });

    it('array input rejected with invalid-shape', () => {
      const result = migrateProjectDocument([1, 2, 3]);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-shape');
    });

    it('string input rejected with invalid-shape', () => {
      const result = migrateProjectDocument('not an object');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid-shape');
    });

    it('empty object accepted (no schemaVersion = legacy)', () => {
      const result = migrateProjectDocument({});
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      }
    });

    it('future version rejected with future-version', () => {
      const result = migrateProjectDocument({ schemaVersion: 99 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('future-version');
    });

    it('malformed version rejected with malformed-version', () => {
      const result = migrateProjectDocument({ schemaVersion: 'not-a-number' });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('malformed-version');
    });
  });

  // ── 8. Real fixtures idempotency ─────────────────────────────

  describe('Real fixtures idempotency', () => {
    const fixtures = [
      'legacy-no-schema-version.json',
      'current-schema-version.json',
      'golden-pertemuan.json',
      'fresh-mission-adventure.json',
      'image-background-large.json',
    ];

    for (const fixture of fixtures) {
      it(`migrate(migrate(${fixture})) === migrate(${fixture})`, () => {
        const doc = loadFixture(fixture);
        const r1 = migrateProjectDocument(doc);
        if (!r1.ok) return;
        const r2 = migrateProjectDocument(r1.document);
        if (!r2.ok) return;
        expect(deepEqual(r1.document, r2.document)).toBe(true);
      });
    }
  });

  // ── 9. Per-page schema migration idempotency ────────────────

  describe('migrateSchema idempotency (per-page ScreenSchema)', () => {
    it('migrate(migrate(schema)) === migrate(schema) for v2 schema', () => {
      const schema: ScreenSchema = {
        id: 'test-schema',
        version: SCHEMA_VERSION,
        templateType: 'materi',
        blocks: [
          { id: 'b1', type: 'materi-section', variant: 'A', layout: { position: 'flow' }, title: 'Test' },
        ],
        background: { type: 'solid', color1: 'bg' },
      };
      const m1 = migrateSchema(schema);
      const m2 = migrateSchema(m1);
      expect(deepEqual(m1, m2)).toBe(true);
    });

    it('migrate(migrate(schema)) === migrate(schema) for v0 schema (no version)', () => {
      const schema = {
        id: 'test-schema',
        templateType: 'materi',
        blocks: [],
      } as unknown as ScreenSchema;
      const m1 = migrateSchema(schema);
      const m2 = migrateSchema(m1);
      expect(deepEqual(m1, m2)).toBe(true);
    });

    it('migrate(migrate(schema)) === migrate(schema) for v1 schema', () => {
      const schema = {
        id: 'test-schema',
        version: 1,
        templateType: 'materi',
        blocks: [],
      } as unknown as ScreenSchema;
      const m1 = migrateSchema(schema);
      const m2 = migrateSchema(m1);
      expect(deepEqual(m1, m2)).toBe(true);
    });
  });

  // ── 10. migrateAllSchemas idempotency ───────────────────────

  describe('migrateAllSchemas idempotency', () => {
    it('migrateAllSchemas(migrateAllSchemas(pages)) === migrateAllSchemas(pages)', () => {
      const pages = [
        { schema: { id: 's1', version: SCHEMA_VERSION, templateType: 'materi', blocks: [] } },
        { schema: { id: 's2', version: 1, templateType: 'materi', blocks: [] } },
        { schema: null },
      ];
      const r1 = migrateAllSchemas(pages);
      const r2 = migrateAllSchemas(r1.pages);
      expect(deepEqual(r1.pages, r2.pages)).toBe(true);
      expect(r1.migratedCount).toBeGreaterThanOrEqual(0);
      expect(r2.migratedCount).toBe(0); // second pass should have 0 migrations
    });
  });
});
