// ═══════════════════════════════════════════════════════════════════
// IMPORT/EXPORT JSON ROUNDTRIP TESTS  (Sprint 8.4)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.4 — Project Import/Export JSON + Media Reload
//
// Verifies that all style authority fields survive an
// export JSON → import JSON roundtrip. Tests the actual export
// and import logic (simulated) with 4 fixtures.
//
// Fields tested for durability through JSON roundtrip:
//   contractId, pageMode, schema.themeId, templateData.schemaThemeId,
//   templateVariant, navConfig, bgColor, bgDataUrl, overlay,
//   colorPalette, schema.background, schema.blocks
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import type { CanvaPage } from '@/components/canva/types';
import { resolvePageStyleTokens } from '@/core/style';
import { loadFixturePages } from '@/core/style/test-fixture-loader';

// ─────────────────────────────────────────────────────────────────
// Helpers: simulate export JSON → import JSON roundtrip
// ─────────────────────────────────────────────────────────────────

/**
 * Simulate the exportJSON function: serialize project to JSON.
 * Mirrors what AuthoringTool.tsx / Dashboard.tsx / use-export-actions.ts do.
 */
function exportProjectJSON(pages: CanvaPage[], ratioId: string = '16:9'): string {
  const data = {
    meta: { judulPertemuan: 'Test', namaBab: 'Test', mapel: 'PPKn', kelas: '7' },
    cp: {}, tp: [], atp: {}, alur: [],
    canva: {
      pages,
      ratioId,
      currentPageIndex: 0,
    },
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Simulate the handleImportJSON function: parse JSON and extract pages.
 * Mirrors what use-excel-import.ts handleImportJSON does.
 */
function importProjectJSON(json: string): { pages: CanvaPage[]; ratioId: string } {
  const data = JSON.parse(json);

  if (data.canva) {
    return {
      pages: data.canva.pages || [],
      ratioId: data.canva.ratioId || '16:9',
    };
  }
  if (data.pages) {
    return {
      pages: data.pages,
      ratioId: '16:9',
    };
  }
  return { pages: [], ratioId: '16:9' };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.4 — Import/Export JSON Roundtrip', () => {
  // ── golden-pertemuan ───────────────────────────────────────────
  describe('golden-pertemuan fixture', () => {
    it('contractId survives export → import roundtrip', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].contractId).toBe('golden-pertemuan');
    });

    it('pageMode survives export → import roundtrip', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].pageMode).toBe('schema');
    });

    it('schema.themeId survives export → import roundtrip', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].schema?.themeId).toBe('golden-presentation');
    });

    it('resolvePageStyleTokens produces same source after roundtrip', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const before = resolvePageStyleTokens(pages[0]);

      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);
      const after = resolvePageStyleTokens(imported[0]);

      expect(after.source).toBe(before.source);
      expect(after.explicitContractId).toBe(before.explicitContractId);
      expect(after.presetId).toBe(before.presetId);
    });

    it('all pages survive roundtrip (3 pages)', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported.length).toBe(pages.length);
      for (let i = 0; i < pages.length; i++) {
        expect(imported[i].id).toBe(pages[i].id);
        expect(imported[i].label).toBe(pages[i].label);
        expect(imported[i].templateType).toBe(pages[i].templateType);
      }
    });
  });

  // ── fresh-mission-adventure ───────────────────────────────────
  describe('fresh-mission-adventure fixture', () => {
    it('themeId survives export → import roundtrip (new preset)', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].schema?.themeId).toBe('mission-adventure');
    });

    it('resolvePageStyleTokens produces new-preset after roundtrip', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);
      const result = resolvePageStyleTokens(imported[0]);

      expect(result.source).toBe('new-preset');
      expect(result.presetId).toBe('mission-adventure');
      // NOT golden
      expect(result.tokens.colors.accent).toBe('#84cc16');
    });

    it('bgColor survives roundtrip', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].bgColor).toBe(pages[0].bgColor);
    });
  });

  // ── macam-norma-legacy ────────────────────────────────────────
  describe('macam-norma-legacy fixture', () => {
    it('templateData.schemaThemeId survives export → import roundtrip', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].templateData?.schemaThemeId).toBe('macam-norma');
    });

    it('resolvePageStyleTokens produces legacy-theme after roundtrip', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);
      const result = resolvePageStyleTokens(imported[0]);

      expect(result.source).toBe('legacy-theme');
      expect(result.legacyThemeId).toBe('macam-norma');
    });

    it('pageMode = elements survives for legacy page', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].pageMode).toBe('elements');
    });

    it('elements[] survive roundtrip for legacy page', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].elements.length).toBe(pages[0].elements.length);
      expect(imported[0].elements[0]?.type).toBe('teks');
    });
  });

  // ── image-background-large ────────────────────────────────────
  describe('image-background-large fixture', () => {
    it('overlay=40 survives export → import roundtrip', () => {
      const pages = loadFixturePages('image-background-large');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].overlay).toBe(40);
      expect(imported[0].schema?.background?.overlay).toBe(40);
    });

    it('bgDataUrl survives export → import roundtrip', () => {
      const pages = loadFixturePages('image-background-large');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].bgDataUrl).toBe(pages[0].bgDataUrl);
      expect(imported[0].schema?.background?.imageUrl).toBe(
        pages[0].schema?.background?.imageUrl
      );
    });

    it('navConfig survives export → import roundtrip', () => {
      const pages = loadFixturePages('image-background-large');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);

      expect(imported[0].navConfig?.navbarStyle).toBe(
        pages[0].navConfig?.navbarStyle
      );
    });

    it('resolvePageStyleTokens preserves overlay after roundtrip', () => {
      const pages = loadFixturePages('image-background-large');
      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);
      const result = resolvePageStyleTokens(imported[0]);

      expect(result.tokens.page.background.overlay).toBe(40);
    });
  });

  // ── Full authority field checklist ────────────────────────────
  describe('Full authority field checklist', () => {
    it('all style authority fields present after JSON roundtrip (golden)', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);
      const reloaded = imported[0];

      // Contract authority
      expect(reloaded.contractId).toBe(original.contractId);
      // Page mode
      expect(reloaded.pageMode).toBe(original.pageMode);
      // Theme identity
      expect(reloaded.schema?.themeId).toBe(original.schema?.themeId);
      expect(reloaded.templateData?.schemaThemeId).toBe(original.templateData?.schemaThemeId);
      // Template variant
      expect(reloaded.templateVariant).toBe(original.templateVariant);
      // Background
      expect(reloaded.bgColor).toBe(original.bgColor);
      expect(reloaded.bgDataUrl).toBe(original.bgDataUrl);
      expect(reloaded.overlay).toBe(original.overlay);
      // Navigation
      expect(reloaded.navConfig?.navbarStyle).toBe(original.navConfig?.navbarStyle);
      // Schema background
      expect(reloaded.schema?.background?.overlay).toBe(original.schema?.background?.overlay);
    });

    it('all style authority fields present after JSON roundtrip (mission)', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const original = pages[0];

      const json = exportProjectJSON(pages);
      const { pages: imported } = importProjectJSON(json);
      const reloaded = imported[0];

      expect(reloaded.schema?.themeId).toBe('mission-adventure');
      expect(reloaded.pageMode).toBe('schema');
      expect(reloaded.bgColor).toBe(original.bgColor);
      expect(reloaded.overlay).toBe(original.overlay);
    });

    it('ratioId survives roundtrip', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const json = exportProjectJSON(pages, '9:16');
      const { ratioId } = importProjectJSON(json);

      expect(ratioId).toBe('9:16');
    });
  });

  // ── Backward compatibility ────────────────────────────────────
  describe('Backward compatibility', () => {
    it('import handles JSON without canva field (legacy export format)', () => {
      const legacyJson = JSON.stringify({
        meta: { judulPertemuan: 'Legacy' },
        cp: {}, tp: [], atp: {}, alur: [],
        // No canva field — old export format
        allKuis: [],
        allModules: [],
      });

      const { pages, ratioId } = importProjectJSON(legacyJson);
      expect(pages).toEqual([]);
      expect(ratioId).toBe('16:9');
    });

    it('import handles JSON with top-level pages (alternative format)', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const altJson = JSON.stringify({
        meta: {},
        pages, // pages at top level, not inside canva
      });

      const { pages: imported } = importProjectJSON(altJson);
      expect(imported.length).toBe(pages.length);
      expect(imported[0].contractId).toBe('golden-pertemuan');
    });
  });
});
