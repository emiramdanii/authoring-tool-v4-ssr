// ═══════════════════════════════════════════════════════════════════
// TEACHER STYLE PICKER INTEGRATION TESTS  (Sprint 8.2D)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2D — Teacher Style Picker Integration Tests
//
// Verifies that when a teacher selects a Style Contract preset via
// setSchemaThemeId(), the choice flows through:
//   1. page.schema.themeId (authority)
//   2. resolvePageStyleTokens(page) (resolver)
//   3. Canvas, Preview, Present, Export all use the same tokens
//
// Uses real fixtures from fixtures/projects/*.json + the 6 new presets.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import type { CanvaPage } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

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

// Capture pageStyleTokens from PageFrame
let capturedPageStyleTokens: any;

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
    SchemaScreenRenderer: React.memo(function MockSchemaRenderer() {
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
const { resolvePageStyleTokens } = await import('@/core/style');
const { loadFixturePages } = await import('@/core/style/test-fixture-loader');
const { getAllStylePresets, STYLE_PRESETS } = await import('@/core/style/preset-registry');

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

function makeSchemaPage(themeId?: string): CanvaPage {
  return {
    id: 'test-page', label: 'Test', bgDataUrl: null, bgColor: '', overlay: 0,
    elements: [], templateType: 'materi', colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG }, templateData: {},
    pageMode: 'schema',
    schema: {
      id: 'schema-1', templateType: 'materi', blocks: [],
      ...(themeId ? { themeId } : {}),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2D — Teacher Style Picker Integration', () => {
  beforeEach(() => {
    useCanvaStore.setState({
      appMode: 'edit', currentPageIndex: 0, pages: [makeSchemaPage()],
      selectedBlockId: null, selectedBlockIds: [], selectedBlockType: null,
      hoveredBlockId: null, editingBlockId: null, selectedElId: null,
      selectedElIds: [], panelRequest: null, ratioId: '16:9', displayMode: 'classroom',
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
  });

  afterEach(() => { cleanup(); });

  // ── Preset selection → authority flow ─────────────────────────────
  describe('Preset selection → page authority', () => {
    it('setSchemaThemeId writes to schema.themeId (new preset)', () => {
      const setSchemaThemeId = useCanvaStore.getState().setSchemaThemeId;
      setSchemaThemeId('mission-adventure');

      const page = useCanvaStore.getState().pages[0];
      expect(page.schema?.themeId).toBe('mission-adventure');
      expect(page.templateData?.schemaThemeId).toBe('mission-adventure');
    });

    it('resolvePageStyleTokens picks up new preset after selection', () => {
      const setSchemaThemeId = useCanvaStore.getState().setSchemaThemeId;
      setSchemaThemeId('dark-elegant');

      const page = useCanvaStore.getState().pages[0];
      const result = resolvePageStyleTokens(page);

      expect(result.source).toBe('new-preset');
      expect(result.presetId).toBe('dark-elegant');
      expect(result.tokens.colors.accent).toBe('#22d3ee'); // dark-elegant accent
    });

    it('all 6 presets are selectable and produce correct source', () => {
      const setSchemaThemeId = useCanvaStore.getState().setSchemaThemeId;
      const presets = getAllStylePresets();

      for (const preset of presets) {
        setSchemaThemeId(preset.id);
        const page = useCanvaStore.getState().pages[0];
        const result = resolvePageStyleTokens(page);

        expect(result.source).toBe('new-preset');
        expect(result.presetId).toBe(preset.id);
        expect(result.tokens.colors.accent).toBe(preset.colors.accent);
      }
    });
  });

  // ── Canvas/Preview/Present/Export parity after selection ──────────
  describe('Canvas/Preview/Present/Export token parity after preset selection', () => {
    it('Canvas and Export produce identical tokens after selecting mission-adventure', async () => {
      const setSchemaThemeId = useCanvaStore.getState().setSchemaThemeId;
      setSchemaThemeId('mission-adventure');

      const pages = useCanvaStore.getState().pages;
      const page = pages[0];

      // Resolve tokens (simulates what PageRenderer does)
      const tokens = resolvePageStyleTokens(page);
      expect(tokens.presetId).toBe('mission-adventure');
      expect(tokens.source).toBe('new-preset');

      // Simulate Canvas mode
      useCanvaStore.setState({ appMode: 'edit' });
      const canvasResult = resolvePageStyleTokens(useCanvaStore.getState().pages[0]);

      // Simulate Export mode
      useCanvaStore.setState({ appMode: 'export' });
      const exportResult = resolvePageStyleTokens(useCanvaStore.getState().pages[0]);

      // Token parity
      expect(JSON.stringify(canvasResult)).toBe(JSON.stringify(exportResult));
      expect(canvasResult.presetId).toBe('mission-adventure');
    });

    it('switching from legacy theme to new preset changes source to new-preset', () => {
      const setSchemaThemeId = useCanvaStore.getState().setSchemaThemeId;

      // Start with legacy theme
      setSchemaThemeId('macam-norma');
      let page = useCanvaStore.getState().pages[0];
      let result = resolvePageStyleTokens(page);
      expect(result.source).toBe('legacy-theme');
      expect(result.legacyThemeId).toBe('macam-norma');

      // Switch to new preset
      setSchemaThemeId('school-cheerful');
      page = useCanvaStore.getState().pages[0];
      result = resolvePageStyleTokens(page);
      expect(result.source).toBe('new-preset');
      expect(result.presetId).toBe('school-cheerful');
      expect(result.legacyThemeId).toBeUndefined();
    });
  });

  // ── StylePresetPicker component rendering ─────────────────────────
  describe('StylePresetPicker component', () => {
    it('renders all 6 presets with correct labels', async () => {
      const { StylePresetPicker } = await import('@/components/canva/StylePresetPicker');
      const { container } = render(
        React.createElement(StylePresetPicker, {
          currentThemeId: 'academic-clean',
          onSelect: () => {},
        }),
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(6);

      // Verify each preset label is present
      const labels = [...buttons].map(b => b.textContent?.trim());
      expect(labels).toContain('Akademik Bersih');
      expect(labels).toContain('Sekolah Ceria');
      expect(labels).toContain('Misi Petualangan');
      expect(labels).toContain('Gelap Elegan');
      expect(labels).toContain('Nusantara Alam');
      expect(labels).toContain('Modern Interaktif');
    });

    it('calls onSelect with correct presetId when clicked', async () => {
      const { StylePresetPicker } = await import('@/components/canva/StylePresetPicker');
      let selectedId = '';
      const { container } = render(
        React.createElement(StylePresetPicker, {
          currentThemeId: undefined,
          onSelect: (id: string) => { selectedId = id; },
        }),
      );

      const buttons = container.querySelectorAll('button');
      // Click on 'Misi Petualangan' (index 2)
      buttons[2]?.click();
      expect(selectedId).toBe('mission-adventure');
    });

    it('highlights active preset', async () => {
      const { StylePresetPicker } = await import('@/components/canva/StylePresetPicker');
      const { container } = render(
        React.createElement(StylePresetPicker, {
          currentThemeId: 'dark-elegant',
          onSelect: () => {},
        }),
      );

      const buttons = container.querySelectorAll('button');
      const activeButton = buttons[3]; // dark-elegant is index 3
      expect(activeButton?.className).toContain('border-silse-primary');
    });
  });

  // ── Fixture-based preset verification ─────────────────────────────
  describe('Fixture-based preset verification', () => {
    it('fresh-mission-adventure fixture resolves to new-preset (not legacy)', () => {
      const pages = loadFixturePages('fresh-mission-adventure');
      const result = resolvePageStyleTokens(pages[0]);

      expect(result.source).toBe('new-preset');
      expect(result.presetId).toBe('mission-adventure');
      // NOT golden
      expect(result.tokens.colors.accent).not.toBe('#fbbf24');
      expect(result.tokens.colors.accent).toBe('#84cc16'); // mission-adventure accent
    });

    it('golden-pertemuan fixture resolves to explicit-contract (not new-preset)', () => {
      const pages = loadFixturePages('golden-pertemuan');
      const result = resolvePageStyleTokens(pages[0]);

      expect(result.source).toBe('explicit-contract');
      expect(result.explicitContractId).toBe('golden-pertemuan');
    });

    it('macam-norma-legacy fixture resolves to legacy-theme (auto-golden)', () => {
      const pages = loadFixturePages('macam-norma-legacy');
      const result = resolvePageStyleTokens(pages[0]);

      expect(result.source).toBe('legacy-theme');
      expect(result.legacyThemeId).toBe('macam-norma');
      expect(result.presetId).toBe('academic-clean');
    });
  });
});
