// ═══════════════════════════════════════════════════════════════════
// EXPORT WIRING INTEGRATION TESTS  (Sprint 8.2C)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2C — Export Wiring Integration Tests
//
// Tests render the ACTUAL Export path:
//   ExportApp → PageRenderer mode="export" → SchemaScreenRenderer
//
// Verifies that resolved Style Contract tokens reach Export output
// for 4 fixtures: golden-pertemuan, fresh-mission-adventure,
// macam-norma-legacy, image-background-large.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import type { ResolvePageStyleTokensResult } from '@/core/style';

// vi.hoisted: sync localStorage mock
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

// Capture props passed to PageRenderer
let capturedPageStyleTokens: ResolvePageStyleTokensResult | undefined;

vi.mock('@/components/canva/page-renderer/PageFrame', () => ({
  PageFrame: React.memo(function MockPageFrame(props: any) {
    capturedPageStyleTokens = props.pageStyleTokens;
    return React.createElement('div', { 'data-testid': 'mock-page-frame' }, props.children);
  }),
}));

vi.mock('@/core/renderer/SchemaRenderer', async () => {
  const actual = await vi.importActual<typeof import('@/core/renderer/SchemaRenderer')>(
    '@/core/renderer/SchemaRenderer',
  );
  return {
    ...actual,
    SchemaScreenRenderer: React.memo(function MockSchemaRenderer(props: any) {
      return React.createElement('div', { 'data-testid': 'mock-schema-renderer' });
    }),
  };
});

vi.mock('@/core/renderer/GoldenPageRenderer', () => ({
  GoldenPageRenderer: React.memo(function MockGolden(props: any) {
    return React.createElement('div', { 'data-testid': 'mock-golden' }, props.children);
  }),
}));

vi.mock('@/core/renderer/screens', () => ({
  getScreenAdapter: () => null,
  getScreenConfig: () => null,
}));

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

describe('Sprint 8.2C — Export Wiring Integration', () => {
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
    capturedPageStyleTokens = undefined;
  });

  afterEach(() => { cleanup(); });

  // ── Fixture 1: golden-pertemuan ───────────────────────────────────
  describe('Fixture 1: golden-pertemuan', () => {
    it('ExportApp renders with academic-clean tokens via PageRenderer', async () => {
      const pages = loadFixturePages('golden-pertemuan');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(capturedPageStyleTokens).toBeDefined();
      });
      expect(capturedPageStyleTokens!.presetId).toBe('academic-clean');
      expect(capturedPageStyleTokens!.source).toBe('explicit-contract');
    });

    it('chrome background uses academic-clean #0f172a', async () => {
      const pages = loadFixturePages('golden-pertemuan');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      await waitFor(() => {
        const bgElements = findElementsWithBackground(container, ['rgb(15, 23, 42)', '#0f172a']);
        expect(bgElements.length, 'Chrome should use academic-clean background').toBeGreaterThan(0);
      });
    });
  });

  // ── Fixture 2: fresh-mission-adventure ────────────────────────────
  describe('Fixture 2: fresh-mission-adventure', () => {
    it('ExportApp renders with mission-adventure tokens (NOT golden)', async () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(capturedPageStyleTokens).toBeDefined();
      });
      expect(capturedPageStyleTokens!.presetId).toBe('mission-adventure');
      expect(capturedPageStyleTokens!.source).toBe('new-preset');
    });

    it('chrome background uses mission-adventure #1c1917', async () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      await waitFor(() => {
        const bgElements = findElementsWithBackground(container, ['rgb(28, 25, 23)', '#1c1917']);
        expect(bgElements.length, 'Chrome should use mission-adventure background').toBeGreaterThan(0);
      });
    });
  });

  // ── Fixture 3: macam-norma-legacy ─────────────────────────────────
  describe('Fixture 3: macam-norma-legacy', () => {
    it('ExportApp renders with legacy fallback (auto-golden)', async () => {
      const pages = loadFixturePages('macam-norma-legacy');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(capturedPageStyleTokens).toBeDefined();
      });
      expect(capturedPageStyleTokens!.source).toBe('legacy-theme');
      expect(capturedPageStyleTokens!.legacyThemeId).toBe('macam-norma');
    });
  });

  // ── Fixture 4: image-background-large ─────────────────────────────
  describe('Fixture 4: image-background-large', () => {
    it('ExportApp renders with overlay=40 in resolved tokens', async () => {
      const pages = loadFixturePages('image-background-large');
      useCanvaStore.setState({ pages, currentPageIndex: 0 });

      const ExportApp = (await import('@/export/ExportApp')).default;
      const { container } = render(React.createElement(ExportApp));

      expect(container.children.length).toBeGreaterThan(0);
      await waitFor(() => {
        expect(capturedPageStyleTokens).toBeDefined();
      });
      expect(capturedPageStyleTokens!.tokens.page.background.overlay).toBe(40);
      expect(capturedPageStyleTokens!.tokens.page.background.overlayType).toBe('dark');
    });
  });

  // ── Canvas/Present/Export token parity ─────────────────────────────
  describe('Canvas/Present/Export token parity', () => {
    it('same page in Canvas and Export mode produces identical pageStyleTokens', async () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      useCanvaStore.setState({ pages, currentPageIndex: 0, appMode: 'edit' });

      // Render in Canvas mode
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      render(React.createElement(PageRenderer, {
        mode: 'canvas', page: pages[0]!, currentPageIndex: 0, totalPages: 1,
      }));
      const canvasTokens = JSON.parse(JSON.stringify(capturedPageStyleTokens));
      cleanup();
      capturedPageStyleTokens = undefined;

      // Render in Export mode (via ExportApp)
      useCanvaStore.setState({ appMode: 'export', currentPageIndex: 0 });
      const ExportApp = (await import('@/export/ExportApp')).default;
      render(React.createElement(ExportApp));
      await waitFor(() => {
        expect(capturedPageStyleTokens).toBeDefined();
      });
      const exportTokens = JSON.parse(JSON.stringify(capturedPageStyleTokens));

      expect(exportTokens).toEqual(canvasTokens);
    });
  });
});
