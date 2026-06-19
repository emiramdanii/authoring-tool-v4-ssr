// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE ROUNDTRIP TESTS  (Sprint 8.3)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.3 — Persistence & Schema Versioning
//
// Verifies that all style authority fields survive a save → reload
// roundtrip through the DB layer. Uses the actual DBPageData type
// and reconstructPages logic to simulate what happens when a page
// is saved to the database and then loaded back.
//
// Fields tested for durability:
//   contractId, pageMode, templateVariant, schema.themeId,
//   templateData.schemaThemeId, navConfig, bgColor, bgDataUrl, overlay,
//   colorPalette, schema.background
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import type { DBPageData } from '@/store/canva/types';
import { resolvePageStyleTokens } from '@/core/style';
import { loadFixturePages } from '@/core/style/test-fixture-loader';

// ─────────────────────────────────────────────────────────────────
// Helper: simulate CanvaPage → DB → CanvaPage roundtrip
// ─────────────────────────────────────────────────────────────────

/**
 * Simulate what the save route does: extract DB fields from CanvaPage.
 * This mirrors the `tx.page.create({ data: { ... } })` in save/route.ts.
 */
function canvaPageToDB(page: CanvaPage): DBPageData {
  return {
    id: page.id,
    pageIndex: 0,
    label: page.label || null,
    templateType: page.templateType || null,
    variant: page.templateVariant || null,
    contractId: page.contractId || null,
    pageMode: page.pageMode || null,
    bgColor: page.bgColor || null,
    bgImage: page.bgDataUrl || null,
    bgOverlay: page.overlay !== undefined ? page.overlay / 100 : null,
    schemaData: page.schema ? JSON.stringify(page.schema) : null,
    navConfig: page.navConfig ? JSON.stringify(page.navConfig) : null,
    templateData: page.templateData ? JSON.stringify(page.templateData) : null,
    colorPalette: page.colorPalette ? JSON.stringify(page.colorPalette) : null,
    blocks: [],
  };
}

/**
 * Simulate what loadFromDB does: reconstruct CanvaPage from DBPageData.
 * This mirrors the `loadFromDB` logic in persistence-slice.ts.
 */
function dbToCanvaPage(p: DBPageData): CanvaPage {
  let schema: CanvaPage['schema'];
  if (p.schemaData) {
    try { schema = JSON.parse(p.schemaData); } catch { schema = undefined; }
  }

  const navConfig: NavConfig = p.navConfig
    ? (() => { try { return JSON.parse(p.navConfig); } catch { return { ...DEFAULT_NAV_CONFIG }; } })()
    : { ...DEFAULT_NAV_CONFIG };

  const templateData = p.templateData
    ? (() => { try { return JSON.parse(p.templateData); } catch { return {}; } })()
    : {};

  const colorPalette = p.colorPalette
    ? (() => { try { return JSON.parse(p.colorPalette); } catch { return null; } })()
    : null;

  return {
    id: p.id,
    label: p.label || 'Halaman 1',
    bgDataUrl: p.bgImage || null,
    bgColor: p.bgColor || '#ffffff',
    overlay: p.bgOverlay !== null ? Math.round(p.bgOverlay * 100) : 20,
    elements: [],
    templateType: (p.templateType as CanvaPage['templateType']) || 'custom',
    colorPalette,
    navConfig,
    templateData,
    templateVariant: (p.variant as 'A' | 'B' | 'C') || undefined,
    contractId: p.contractId || undefined,
    pageMode: (p.pageMode as 'schema' | 'elements') || (schema ? 'schema' : 'elements'),
    schema,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.3 — Persistence Roundtrip', () => {
  // ── Golden Pertemuan: explicit contractId ─────────────────────
  describe('golden-pertemuan fixture roundtrip', () => {
    it('contractId survives save → reload', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      expect(dbPage.contractId).toBe('golden-pertemuan');

      const reloaded = dbToCanvaPage(dbPage);
      expect(reloaded.contractId).toBe('golden-pertemuan');
    });

    it('pageMode survives save → reload', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      expect(dbPage.pageMode).toBe('schema');

      const reloaded = dbToCanvaPage(dbPage);
      expect(reloaded.pageMode).toBe('schema');
    });

    it('schema.themeId survives save → reload', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.schema?.themeId).toBe(original.schema?.themeId);
    });

    it('resolvePageStyleTokens produces same source after roundtrip', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const before = resolvePageStyleTokens(original);

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);
      const after = resolvePageStyleTokens(reloaded);

      expect(after.source).toBe(before.source);
      expect(after.explicitContractId).toBe(before.explicitContractId);
      expect(after.presetId).toBe(before.presetId);
    });
  });

  // ── Fresh mission-adventure: new preset ───────────────────────
  describe('fresh-mission-adventure fixture roundtrip', () => {
    it('themeId survives save → reload (new preset)', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.schema?.themeId).toBe('mission-adventure');
    });

    it('resolvePageStyleTokens produces new-preset source after roundtrip', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const original = pages[0];

      const before = resolvePageStyleTokens(original);
      expect(before.source).toBe('new-preset');

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);
      const after = resolvePageStyleTokens(reloaded);

      expect(after.source).toBe('new-preset');
      expect(after.presetId).toBe('mission-adventure');
    });
  });

  // ── macam-norma-legacy: legacy theme ──────────────────────────
  describe('macam-norma-legacy fixture roundtrip', () => {
    it('templateData.schemaThemeId survives save → reload', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.templateData?.schemaThemeId).toBe('macam-norma');
    });

    it('resolvePageStyleTokens produces legacy-theme source after roundtrip', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const original = pages[0];

      const before = resolvePageStyleTokens(original);
      expect(before.source).toBe('legacy-theme');

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);
      const after = resolvePageStyleTokens(reloaded);

      expect(after.source).toBe('legacy-theme');
      expect(after.legacyThemeId).toBe('macam-norma');
    });

    it('pageMode = elements survives for legacy page', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      expect(dbPage.pageMode).toBe('elements');

      const reloaded = dbToCanvaPage(dbPage);
      expect(reloaded.pageMode).toBe('elements');
    });
  });

  // ── image-background-large: overlay + bg image ────────────────
  describe('image-background-large fixture roundtrip', () => {
    it('overlay=40 survives save → reload (40/100 → 0.4 → 40)', () => {
      const pages = loadFixturePages('image-background-large');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      // overlay stored as 0-1 in DB
      expect(dbPage.bgOverlay).toBe(0.4);

      const reloaded = dbToCanvaPage(dbPage);
      // overlay reconstructed as 0-100
      expect(reloaded.overlay).toBe(40);
    });

    it('bgDataUrl survives save → reload', () => {
      const pages = loadFixturePages('image-background-large');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.bgDataUrl).toBe(original.bgDataUrl);
    });

    it('schema.background.overlay survives via schemaData JSON', () => {
      const pages = loadFixturePages('image-background-large');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.schema?.background?.overlay).toBe(40);
    });

    it('resolvePageStyleTokens preserves overlay after roundtrip', () => {
      const pages = loadFixturePages('image-background-large');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);
      const after = resolvePageStyleTokens(reloaded);

      expect(after.tokens.page.background.overlay).toBe(40);
    });
  });

  // ── navConfig durability ──────────────────────────────────────
  describe('navConfig durability', () => {
    it('navbarStyle survives save → reload', () => {
      const pages = loadFixturePages('image-background-large');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.navConfig?.navbarStyle).toBe(original.navConfig?.navbarStyle);
    });

    it('all navConfig fields survive save → reload', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.navConfig?.showNavbar).toBe(original.navConfig?.showNavbar);
      expect(reloaded.navConfig?.showPrevNext).toBe(original.navConfig?.showPrevNext);
      expect(reloaded.navConfig?.showScore).toBe(original.navConfig?.showScore);
      expect(reloaded.navConfig?.showProgress).toBe(original.navConfig?.showProgress);
    });
  });

  // ── templateVariant durability ───────────────────────────────
  describe('templateVariant durability', () => {
    it('templateVariant survives save → reload (stored as variant)', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      expect(dbPage.variant).toBe(original.templateVariant || null);

      const reloaded = dbToCanvaPage(dbPage);
      expect(reloaded.templateVariant).toBe(original.templateVariant);
    });
  });

  // ── Full authority field checklist ────────────────────────────
  describe('Full authority field checklist', () => {
    it('all style authority fields present after roundtrip (golden)', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

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

    it('all style authority fields present after roundtrip (mission)', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const original = pages[0];

      const dbPage = canvaPageToDB(original);
      const reloaded = dbToCanvaPage(dbPage);

      expect(reloaded.schema?.themeId).toBe('mission-adventure');
      expect(reloaded.pageMode).toBe('schema');
      expect(reloaded.bgColor).toBe(original.bgColor);
      expect(reloaded.overlay).toBe(original.overlay);
    });
  });
});
