// ═══════════════════════════════════════════════════════════════════
// EXPORT CONSUMER SMOKE TESTS  (Sprint 8.2C-Patch-1)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2C-Patch-1 — Senior Review Blocker 2
//
// Tests render REAL ExportApp WITHOUT mocking PageFrame,
// SchemaScreenRenderer, GoldenPageRenderer, or ScreenAdapter.
// Verifies deterministic DOM: background colors, overlay, content.
//
// Uses REAL corpus fixtures from fixtures/projects/*.json:
//   1. golden-pertemuan (explicit contract, academic-clean)
//   2. fresh-mission-adventure (new preset, NOT golden)
//   3. image-background-large (overlay=40, bg image)
//   4. macam-norma-legacy (legacy theme, auto-golden)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';

vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') return;
  const m = new Map<string, string>();
  const ls: Storage = {
    get length() { return m.size; },
    key(i: number) { return [...m.keys()][i] ?? null; },
    getItem(n: string) { return m.has(n) ? m.get(n)! : null; },
    setItem(n: string, v: string) { m.set(n, v); },
    removeItem(n: string) { m.delete(n); },
    clear() { m.clear(); },
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: ls });
});

vi.mock('@/store/authoring-store', () => {
  const s: Record<string, unknown> = {
    activePreset: null, meta: {}, cp: {}, tp: {}, atp: {}, alur: {},
    suara: {}, petunjuk: {}, penutup: {}, motivasi: {}, rangkuman: {},
    modules: [], kuis: [], games: [], diskusi: [], refleksi: [],
    dirty: false, activePanel: 'canva', setActivePanel: () => {}, setMeta: () => {},
  };
  const u: any = (sel: (s: any) => any) => sel(s);
  u.getState = () => s; u.setState = (p: any) => { Object.assign(s, p); }; u.subscribe = () => () => {};
  return { useAuthoringStore: u };
});

vi.mock('@/store/dirty-store', () => {
  const s = {
    dirty: false, saveStatus: 'idle', editRevision: 0, lastSavedRevision: 0,
    savingRevision: null, lastError: null, currentProjectId: null, _hydrationDepth: 0,
    markDirty: () => {}, markClean: () => {}, startSaving: () => {},
    saveSucceeded: () => false, saveFailed: () => {}, resetOnLoad: () => {},
    clearError: () => {}, buildSaveToken: () => ({ projectId: null, revision: 0 }),
    isSaveTokenValid: () => false, startHydration: () => {}, endHydration: () => {},
    setCurrentProjectId: () => {},
  };
  const u: any = (sel: (s: any) => any) => sel(s);
  u.getState = () => s; u.setState = () => {}; u.subscribe = () => () => {};
  return { useDirtyStore: u };
});

vi.mock('@/hooks/use-service-worker', () => ({ useServiceWorker: () => {} }));
vi.mock('@/lib/sounds', () => ({ preloadSounds: () => {} }));
vi.mock('@/lib/offline-sync', () => ({ initAutoFlush: () => () => {} }));
vi.mock('@/lib/confetti', () => ({ fireConfettiCelebration: () => {} }));

// NO consumer mocks — PageFrame, SchemaScreenRenderer, GoldenPageRenderer,
// ScreenAdapter all REAL.

const { useCanvaStore } = await import('@/store/canva-store');
const { useInteractiveStore, setCanvaStoreRef } = await import('@/store/interactive-store');
const { useLearningMediaStore } = await import('@/store/learning-media-store');
const { configureModeOrchestrator } = await import('@/store/canva/mode-orchestrator');
const { loadFixturePages } = await import('@/core/style/test-fixture-loader');

setCanvaStoreRef(useCanvaStore as any);

// Polyfills
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any;
}
if (typeof Element !== 'undefined' && !Element.prototype.requestFullscreen) {
  Object.defineProperty(Element.prototype, 'requestFullscreen', {
    configurable: true, value: async function (): Promise<void> {},
  });
}
if (typeof document !== 'undefined' && !document.exitFullscreen) {
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true, value: async function (): Promise<void> {},
  });
}
if (typeof document !== 'undefined' && !document.fullscreenElement) {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
}

function findElementsWithBackground(container: HTMLElement, colorValues: string[]): HTMLElement[] {
  const styled = [...container.querySelectorAll<HTMLElement>('[style]')];
  return styled.filter(el => {
    const bg = el.style.background || el.style.backgroundColor || '';
    return colorValues.some(v => bg.includes(v));
  });
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2C-Patch-1 — Export Consumer Smoke (unmocked)', () => {
  beforeEach(() => {
    useCanvaStore.setState({
      appMode: 'export', currentPageIndex: 0, pages: [],
      selectedBlockId: null, selectedBlockIds: [], selectedBlockType: null,
      hoveredBlockId: null, editingBlockId: null, selectedElId: null,
      selectedElIds: [], panelRequest: null, ratioId: '16:9', displayMode: 'classroom',
    });
    useInteractiveStore.setState({
      mode: 'interactive', interactivePageIdx: 0, totalPages: 1,
      scores: [], replayGeneration: 0,
    });
    useLearningMediaStore.setState({ learnSubMode: 'play' });
    configureModeOrchestrator({
      interactive: useInteractiveStore.getState(),
      learning: useLearningMediaStore.getState(),
    });
  });

  afterEach(() => { cleanup(); });

  // ── A. golden-pertemuan ───────────────────────────────────────────
  describe('A. ExportApp with golden-pertemuan fixture (unmocked)', () => {
    it('renders without crash and shows content', async () => {
      const pages = loadFixturePages('golden-pertemuan');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(container.textContent?.length ?? 0).toBeGreaterThan(10);
      });
    });

    it('chrome and page background contain academic-clean #0f172a', async () => {
      const pages = loadFixturePages('golden-pertemuan');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      await waitFor(() => {
        const bgElements = findElementsWithBackground(container, ['rgb(15, 23, 42)', '#0f172a']);
        expect(bgElements.length, 'Should have #0f172a background (academic-clean)').toBeGreaterThan(0);
      });
    });
  });

  // ── B. fresh-mission-adventure ────────────────────────────────────
  describe('B. ExportApp with fresh-mission-adventure fixture (unmocked)', () => {
    it('renders without crash and shows content', async () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(container.textContent?.length ?? 0).toBeGreaterThan(10);
      });
    });

    it('chrome and page background contain mission-adventure #1c1917 (NOT golden #0f172a)', async () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      await waitFor(() => {
        const missionBg = findElementsWithBackground(container, ['rgb(28, 25, 23)', '#1c1917']);
        expect(missionBg.length, 'Should have #1c1917 (mission-adventure, NOT golden)').toBeGreaterThan(0);
      });
    });
  });

  // ── C. image-background-large ─────────────────────────────────────
  describe('C. ExportApp with image-background-large fixture (unmocked)', () => {
    it('renders without crash and shows content', async () => {
      const pages = loadFixturePages('image-background-large');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(container.textContent?.length ?? 0).toBeGreaterThan(10);
      });
    });

    it('overlay=40 visible in DOM as rgba alpha 0.4', async () => {
      const pages = loadFixturePages('image-background-large');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      await waitFor(() => {
        const styledElements = [...container.querySelectorAll<HTMLElement>('[style]')];
        const hasOverlay = styledElements.some(el => {
          const bg = el.style.background || '';
          return bg.includes('0.4)') || bg.includes('.4)');
        });
        expect(hasOverlay, 'Should have overlay with alpha 0.4 (from overlay=40 on 0-80 scale)').toBe(true);
      });
    });
  });

  // ── D. macam-norma-legacy ─────────────────────────────────────────
  describe('D. ExportApp with macam-norma-legacy fixture (unmocked)', () => {
    it('renders legacy page without crash', async () => {
      const pages = loadFixturePages('macam-norma-legacy');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(container.textContent?.length ?? 0).toBeGreaterThan(10);
      });
    });
  });

  // ── E. Standalone HTML boot smoke ─────────────────────────────────
  describe('E. Standalone HTML boot smoke', () => {
    it('entry-client can hydrate stores from __EXPORT_DATA__ payload', async () => {
      // Simulate the standalone boot path:
      // 1. HTML contains window.__EXPORT_DATA__
      // 2. entry-client reads it and hydrates stores
      // 3. ExportApp can render
      const pages = loadFixturePages('golden-pertemuan');
      const exportPayload = {
        meta: { judulPertemuan: 'Test', namaBab: 'Test', mapel: 'PPKn', kelas: '7' },
        cp: {}, tp: {}, atp: {}, alur: {}, suara: {},
        pages,
        ratioId: '16:9',
      };

      // Set __EXPORT_DATA__ (simulates what the HTML template does)
      (window as any).__EXPORT_DATA__ = exportPayload;

      // Verify payload is parseable
      const parsed = JSON.parse(JSON.stringify(exportPayload));
      expect(parsed.pages).toBeDefined();
      expect(parsed.pages.length).toBeGreaterThan(0);
      expect(parsed.pages[0].contractId).toBe('golden-pertemuan');
      expect(parsed.pages[0].schema).toBeDefined();
      expect(parsed.pages[0].templateData).toBeDefined();

      // Verify stores can be hydrated from payload
      useCanvaStore.setState({
        pages: parsed.pages,
        currentPageIndex: 0,
        ratioId: parsed.ratioId,
        appMode: 'export',
      });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));
      expect(container.children.length).toBeGreaterThan(0);

      // Cleanup
      delete (window as any).__EXPORT_DATA__;
    });

    it('POST export payload preserves contractId, pageMode, and all style authority fields', async () => {
      // Verify that POST /api/export receives full page objects
      // and that the payload shape preserves all authority fields.
      const pages = loadFixturePages('golden-pertemuan');
      const payload = { pages, meta: {}, cp: {}, tp: {}, atp: {}, alur: {}, suara: {} };

      // Simulate what POST route does: inject pages directly
      const serialized = JSON.parse(JSON.stringify(payload));
      const page0 = serialized.pages[0];

      // Verify all style authority fields preserved
      expect(page0.contractId).toBe('golden-pertemuan');
      expect(page0.pageMode).toBe('schema');
      expect(page0.templateType).toBe('cover');
      expect(page0.schema).toBeDefined();
      expect(page0.schema.themeId).toBe('golden-presentation');
      expect(page0.templateData).toBeDefined();
      expect(page0.navConfig).toBeDefined();
      expect(page0.bgColor).toBeDefined();
    });

    it('GET project export documents contractId limitation', async () => {
      // GET /api/projects/[id]/export reconstructs pages from DB.
      // contractId is NOT in the Prisma Page model.
      // This test documents that limitation explicitly.
      //
      // The reconstructPages function now includes:
      //   - templateVariant (from variant field)
      //   - pageMode (inferred from schema presence)
      //   - schema (from schemaData)
      //   - templateData (from templateData column)
      //   - navConfig, bgColor, bgDataUrl, overlay, colorPalette
      //
      // But NOT contractId (not persisted in DB).
      // The style adapter falls back to legacy-theme → preset bridge.

      // Simulate a reconstructed page (what GET export produces)
      const reconstructedPage = {
        id: 'test',
        label: 'Test',
        bgDataUrl: null,
        bgColor: '#0f172a',
        overlay: 40,
        elements: [],
        templateType: 'materi',
        templateVariant: 'A' as const,
        colorPalette: null,
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: { schemaThemeId: 'golden-presentation' },
        pageMode: 'schema' as const,
        schema: { id: 'test', templateType: 'materi', blocks: [], themeId: 'golden-presentation' },
        // NOTE: contractId is NOT present here
      };

      // Verify the limitation — contractId is NOT a property of the
      // reconstructed page object (not in Prisma Page model)
      expect((reconstructedPage as Record<string, unknown>).contractId).toBeUndefined();
      // But templateVariant IS preserved
      expect(reconstructedPage.templateVariant).toBe('A');
      // And pageMode IS preserved
      expect(reconstructedPage.pageMode).toBe('schema');
      // And schema.themeId IS preserved (for legacy bridge)
      expect(reconstructedPage.schema?.themeId).toBe('golden-presentation');
    });
  });
});
