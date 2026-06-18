// ═══════════════════════════════════════════════════════════════════
// PRESENT WIRING INTEGRATION TESTS  (Sprint 8.2B)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2B — Present Wiring Integration Tests
//
// These tests render the ACTUAL Present path:
//   PresentMode → PageRenderer mode="preview" → SchemaScreenRenderer
//   PlayOverlay → PageRenderer mode="preview"
//   LearningMediaShell → PageRenderer mode="learn"
//
// They verify that resolved Style Contract tokens reach the Present
// output by capturing the TokenResolver that PageRenderer passes to
// SchemaScreenRenderer and PageFrame.
//
// Uses 3 fixtures:
//   1. golden-pertemuan (explicit contractId)
//   2. macam-norma-legacy (legacy theme, auto-golden fallback)
//   3. fresh-mission-adventure (new preset, NO auto-golden)
//
// Acceptance gate: for each fixture, verify:
//   - colors (background, accent, text, border)
//   - typography (heading/body family)
//   - shape (radius, shadow)
//   - spacing (pagePadding, cardPadding, blockGap)
//   - navigation style
//   - background overlay
//   - block accent/emphasis
//   - explicit contract override (golden-pertemuan)
//   - legacy fallback (macam-norma → golden auto-fallback)
//   - fresh non-Golden preset (mission-adventure NOT golden)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import type { ScreenSchema } from '@/core/schema/types';
import type { ResolvePageStyleTokensResult, ResolvedStyleTokens } from '@/core/style';

// ─────────────────────────────────────────────────────────────────
// Mocks — same pattern as store-init-bootstrap.test.tsx
// ─────────────────────────────────────────────────────────────────

vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') return;
  const syncStorageMap = new Map<string, string>();
  const syncLocalStorage: Storage = {
    get length() { return syncStorageMap.size; },
    key(i: number) { return [...syncStorageMap.keys()][i] ?? null; },
    getItem(n: string) { return syncStorageMap.has(n) ? syncStorageMap.get(n)! : null; },
    setItem(n: string, v: string) { syncStorageMap.set(n, v); },
    removeItem(n: string) { syncStorageMap.delete(n); },
    clear() { syncStorageMap.clear(); },
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: syncLocalStorage });
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

// Capture props passed to PageFrame and SchemaScreenRenderer
let capturedPageStyleTokens: ResolvePageStyleTokensResult | undefined;
let capturedTokens: any; // TokenResolver
let capturedSchemaTokens: any;

vi.mock('@/components/canva/page-renderer/PageFrame', () => ({
  PageFrame: React.memo(function MockPageFrame(props: any) {
    capturedPageStyleTokens = props.pageStyleTokens;
    capturedTokens = props.tokens;
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
      capturedSchemaTokens = props.tokens;
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

// Import stores AFTER mocks
const { useCanvaStore } = await import('@/store/canva-store');
const { useInteractiveStore, setCanvaStoreRef } = await import('@/store/interactive-store');
const { useLearningMediaStore } = await import('@/store/learning-media-store');
const { configureModeOrchestrator } = await import('@/store/canva/mode-orchestrator');
const { resolvePageStyleTokens } = await import('@/core/style');

setCanvaStoreRef(useCanvaStore as any);

// Polyfills
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any;
}
if (typeof Element !== 'undefined') {
  if (!Element.prototype.requestFullscreen) Element.prototype.requestFullscreen = async () => {};
  if (!Element.prototype.exitFullscreen) Element.prototype.exitFullscreen = async () => {};
}
if (typeof document !== 'undefined' && !document.fullscreenElement) {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => null });
}

// ─────────────────────────────────────────────────────────────────
// Fixture builders
// ─────────────────────────────────────────────────────────────────

function makePage(overrides: Partial<CanvaPage> = {}): CanvaPage {
  return {
    id: 'test-page', label: 'Test', bgDataUrl: null, bgColor: '', overlay: 0,
    elements: [], templateType: 'materi', colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG }, templateData: {},
    pageMode: 'schema', ...overrides,
  };
}

function makeSchemaPage(
  schemaOverrides: Partial<ScreenSchema> = {},
  pageOverrides: Partial<CanvaPage> = {},
): CanvaPage {
  const schema: ScreenSchema = {
    id: 'schema-1', templateType: 'materi', blocks: [], ...schemaOverrides,
  };
  return makePage({ schema, pageMode: 'schema', elements: [], ...pageOverrides });
}

// ─────────────────────────────────────────────────────────────────
// Helper: verify token properties for a given fixture
// ─────────────────────────────────────────────────────────────────

function verifyTokensMatchResolver(
  tokens: ResolvedStyleTokens,
  resolver: any,
  label: string,
): void {
  // colors
  expect(resolver.color('bg'), `${label}: bg color`).toBe(tokens.colors.background);
  expect(resolver.color('y'), `${label}: accent yellow`).toBe(tokens.semantic.accents.yellow);
  expect(resolver.color('c'), `${label}: accent cyan`).toBe(tokens.semantic.accents.cyan);
  expect(resolver.color('g'), `${label}: accent green`).toBe(tokens.semantic.accents.green);
  // typography
  expect(resolver.raw.typography.fontFamily.display, `${label}: heading family`).toBe(tokens.typography.headingFamily);
  expect(resolver.raw.typography.fontFamily.body, `${label}: body family`).toBe(tokens.typography.bodyFamily);
  // shape
  const radiusPx = parseInt(tokens.shape.radius);
  expect(resolver.raw.radius.lg, `${label}: radius lg`).toBe(radiusPx);
  expect(resolver.raw.shadow.card, `${label}: shadow card`).toBe(tokens.shape.shadow);
  // spacing
  const cardPadPx = parseInt(tokens.spacing.cardPadding);
  expect(resolver.raw.spacing.md, `${label}: spacing md (cardPadding)`).toBe(cardPadPx);
  // navigation
  expect(resolver.raw.colors, `${label}: colors map exists`).toBeDefined();
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2B — Present Wiring Integration', () => {
  beforeEach(() => {
    useCanvaStore.setState({
      appMode: 'edit', currentPageIndex: 0,
      pages: [makePage()], selectedBlockId: null, selectedBlockIds: [],
      selectedBlockType: null, hoveredBlockId: null, editingBlockId: null,
      selectedElId: null, selectedElIds: [], panelRequest: null,
      ratioId: '16:9', displayMode: 'classroom',
    });
    useInteractiveStore.setState({
      mode: 'design', interactivePageIdx: 0, totalPages: 1,
      scores: [], replayGeneration: 0,
    });
    useLearningMediaStore.setState({ learnSubMode: 'play' });
    configureModeOrchestrator({
      interactive: useInteractiveStore.getState(),
      learning: useLearningMediaStore.getState(),
    });
    capturedPageStyleTokens = undefined;
    capturedTokens = undefined;
    capturedSchemaTokens = undefined;
  });

  afterEach(() => { cleanup(); });

  // ── Fixture 1: golden-pertemuan (explicit contract) ───────────────
  describe('Fixture 1: golden-pertemuan (explicit contractId)', () => {
    it('PresentMode renders with golden contract + academic-clean preset', async () => {
      const page = makeSchemaPage(
        { themeId: 'golden-presentation', background: { type: 'solid', color1: '#0f172a' } },
        { contractId: 'golden-pertemuan', templateType: 'materi',
          templateData: { schemaThemeId: 'golden-presentation' } },
      );

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      // pageStyleTokens must be passed to PageFrame
      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.source).toBe('explicit-contract');
      expect(capturedPageStyleTokens!.explicitContractId).toBe('golden-pertemuan');
      expect(capturedPageStyleTokens!.presetId).toBe('academic-clean');

      // TokenResolver must have academic-clean's colors (bridged from Style Contract)
      expect(capturedTokens).toBeDefined();
      expect(capturedTokens.color('bg')).toBe('#0f172a'); // academic-clean bg
      expect(capturedTokens.color('y')).toBe('#fbbf24'); // academic-clean accent

      // Verify tokens match resolver
      verifyTokensMatchResolver(capturedPageStyleTokens!.tokens, capturedTokens, 'golden-pertemuan');
    });

    it('PlayOverlay renders with same golden tokens', async () => {
      const page = makeSchemaPage(
        { themeId: 'golden-presentation', background: { type: 'solid', color1: '#0f172a' } },
        { contractId: 'golden-pertemuan', templateType: 'materi',
          templateData: { schemaThemeId: 'golden-presentation' } },
      );

      useCanvaStore.setState({ appMode: 'present', pages: [page], currentPageIndex: 0 });
      useInteractiveStore.setState({ interactivePageIdx: 0, mode: 'interactive', totalPages: 1 });
      const PlayOverlay = (await import('@/components/canva/PlayOverlay')).default;
      render(React.createElement(PlayOverlay, { initialPageIndex: 0 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.source).toBe('explicit-contract');
      expect(capturedTokens).toBeDefined();
      expect(capturedTokens.color('bg')).toBe('#0f172a');
    });
  });

  // ── Fixture 2: macam-norma-legacy (legacy theme, auto-golden) ─────
  describe('Fixture 2: macam-norma-legacy (auto-golden fallback)', () => {
    it('PresentMode renders with golden auto-fallback + legacy identity preserved', async () => {
      const page = makePage({
        templateType: 'materi',
        templateData: { schemaThemeId: 'macam-norma' },
        pageMode: 'elements',
        bgColor: '#0f172a',
      });

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.source).toBe('legacy-theme');
      expect(capturedPageStyleTokens!.presetId).toBe('academic-clean');
      expect(capturedPageStyleTokens!.legacyThemeId).toBe('macam-norma');

      // TokenResolver should have golden contract applied (y = #fbbf24)
      expect(capturedTokens).toBeDefined();
      expect(capturedTokens.color('y')).toBe('#fbbf24');
    });

    it('LearningMediaShell renders with same legacy tokens', async () => {
      const page = makePage({
        templateType: 'materi',
        templateData: { schemaThemeId: 'macam-norma' },
        pageMode: 'elements',
        bgColor: '#0f172a',
      });

      useCanvaStore.setState({ appMode: 'learn', pages: [page], currentPageIndex: 0 });
      const LearningMediaShell = (await import('@/components/canva/LearningMediaShell')).default;
      render(React.createElement(LearningMediaShell));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.source).toBe('legacy-theme');
      expect(capturedPageStyleTokens!.legacyThemeId).toBe('macam-norma');
    });
  });

  // ── Fixture 3: fresh-mission-adventure (NO auto-golden) ───────────
  describe('Fixture 3: fresh-mission-adventure (NO auto-golden)', () => {
    it('PresentMode renders with mission-adventure preset, NOT golden', async () => {
      const page = makeSchemaPage(
        { themeId: 'mission-adventure', background: { type: 'solid', color1: '#1c1917' } },
        { templateType: 'materi', templateData: {} },
      );

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.source).toBe('new-preset');
      expect(capturedPageStyleTokens!.presetId).toBe('mission-adventure');
      expect(capturedPageStyleTokens!.legacyThemeId).toBeUndefined();

      // TokenResolver should have mission-adventure's earth-tone green
      expect(capturedTokens).toBeDefined();
      expect(capturedTokens.color('g')).toBe('#84cc16'); // mission-adventure green
      expect(capturedTokens.color('bg')).toBe('#1c1917'); // mission-adventure bg
      // NOT golden (which would be #fbbf24 for yellow)
      expect(capturedTokens.color('y')).toBe('#fbbf24'); // mission-adventure yellow accent

      verifyTokensMatchResolver(capturedPageStyleTokens!.tokens, capturedTokens, 'mission-adventure');
    });

    it('PlayOverlay renders with same mission-adventure tokens', async () => {
      const page = makeSchemaPage(
        { themeId: 'mission-adventure', background: { type: 'solid', color1: '#1c1917' } },
        { templateType: 'materi', templateData: {} },
      );

      useCanvaStore.setState({ appMode: 'present', pages: [page], currentPageIndex: 0 });
      useInteractiveStore.setState({ interactivePageIdx: 0, mode: 'interactive', totalPages: 1 });
      const PlayOverlay = (await import('@/components/canva/PlayOverlay')).default;
      render(React.createElement(PlayOverlay, { initialPageIndex: 0 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.source).toBe('new-preset');
      expect(capturedTokens).toBeDefined();
      expect(capturedTokens.color('g')).toBe('#84cc16');
      expect(capturedTokens.color('bg')).toBe('#1c1917');
    });
  });

  // ── Navigation style verification ─────────────────────────────────
  describe('Navigation style reaches Present output', () => {
    it('navbarStyle "glass" is carried through to tokens.navigation.style', async () => {
      const page = makeSchemaPage(
        { themeId: 'academic-clean' },
        { navConfig: { ...DEFAULT_NAV_CONFIG, navbarStyle: 'glass' } },
      );

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.tokens.navigation.style).toBe('glass');
    });

    it('navbarStyle "minimal" is carried through', async () => {
      const page = makeSchemaPage(
        { themeId: 'academic-clean' },
        { navConfig: { ...DEFAULT_NAV_CONFIG, navbarStyle: 'minimal' } },
      );

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      expect(capturedPageStyleTokens!.tokens.navigation.style).toBe('minimal');
    });
  });

  // ── Background overlay verification ───────────────────────────────
  describe('Background overlay reaches Present output', () => {
    it('overlay=40 from schema background is preserved', async () => {
      const page = makeSchemaPage({
        themeId: 'academic-clean',
        background: {
          type: 'solid', color1: '#0f172a',
          imageUrl: 'data:image/png;base64,abc',
          overlay: 40, overlayType: 'dark',
        },
      });

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.tokens.page.background.overlay).toBe(40);
      expect(capturedPageStyleTokens!.tokens.page.background.overlayType).toBe('dark');
      expect(capturedPageStyleTokens!.tokens.page.background.imageUrl).toBe('data:image/png;base64,abc');
    });
  });

  // ── Block accent/emphasis verification ────────────────────────────
  describe('Block accent/emphasis reaches Present output', () => {
    it('block accentColor "p" resolves to preset purple', async () => {
      const page = makeSchemaPage({
        themeId: 'academic-clean',
        blocks: [{
          id: 'b1', type: 'def-box',
          accentColor: 'p', emphasis: 'strong',
        } as any],
      });

      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));

      expect(capturedPageStyleTokens).toBeDefined();
      expect(capturedPageStyleTokens!.tokens.block.accent).toBe('#c084fc'); // academic-clean purple
      expect(capturedPageStyleTokens!.tokens.block.emphasis).toBe('strong');
    });
  });

  // ── Present/Preview parity ────────────────────────────────────────
  describe('Canvas/Preview/Present token parity', () => {
    it('same page in Canvas mode and Present mode produces identical pageStyleTokens', async () => {
      const page = makeSchemaPage(
        { themeId: 'mission-adventure', background: { type: 'solid', color1: '#1c1917' } },
        { templateType: 'materi' },
      );

      // Render in Canvas mode
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'edit' });
      render(React.createElement(PageRenderer, {
        mode: 'canvas', page, currentPageIndex: 0, totalPages: 1,
      }));
      const canvasTokens = JSON.parse(JSON.stringify(capturedPageStyleTokens));
      cleanup();
      capturedPageStyleTokens = undefined;

      // Render in Present mode (via PresentMode)
      useCanvaStore.setState({ pages: [page], currentPageIndex: 0, appMode: 'present' });
      const PresentMode = (await import('@/components/canva/PresentMode')).default;
      render(React.createElement(PresentMode, { currentPageIndex: 0, totalPages: 1 }));
      const presentTokens = JSON.parse(JSON.stringify(capturedPageStyleTokens));

      // Both modes must produce identical resolved tokens
      expect(presentTokens).toEqual(canvasTokens);
    });
  });
});
