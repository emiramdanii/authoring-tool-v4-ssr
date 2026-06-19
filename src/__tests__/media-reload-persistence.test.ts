// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5C — Media Reload / Persistence Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies that media (image background data) survives save → reload
// roundtrip in the canva store. Closes the Closure Matrix "Image/audio"
// row from PASS_SOURCE_ONLY to PASS_CI for the reload path.
//
// Coverage:
//   1. bgDataUrl base64 (small, ~100 bytes) survives save → load roundtrip
//   2. bgDataUrl base64 (>1MB simulated) survives save → load roundtrip
//   3. Image URL pattern (data:image/png;base64,...) preserved exactly
//   4. bgDataUrl=null survives (page without background image)
//   5. Fixture image-background-large.json still has bgDataUrl after parse
//   6. bgDataUrl + overlay + navConfig all survive together
//
// Approach: use the REAL canva store (no mocks). Use a localStorage
// polyfill set BEFORE module imports (vi.hoisted) so the store's
// persist middleware can read/write it. Simulate save → clear → reload
// by calling saveToStorage() then loadFromStorage() and comparing
// field equality.
//
// NOTE: Uses @vitest-environment node for large buffer manipulation.
// jsdom's localStorage has size limits that break >1MB tests.
// ═══════════════════════════════════════════════════════════════════

// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────────
// localStorage polyfill — MUST be hoisted so it's set BEFORE any
// module that imports the canva store (which captures localStorage
// at module-eval time via zustand persist).
// ─────────────────────────────────────────────────────────────────

const localStorageStore = vi.hoisted(() => {
  const store = new Map<string, string>();
  const ls: Storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  return { store, ls };
});

// Install localStorage on globalThis BEFORE imports
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageStore.ls,
    writable: true,
    configurable: true,
  });
}

// ─────────────────────────────────────────────────────────────────
// Mocks — canva store transitively imports authoring-store
// ─────────────────────────────────────────────────────────────────

vi.mock('@/store/authoring-store', () => {
  const fakeState: Record<string, unknown> = {
    activePreset: null, meta: {}, cp: { capaianFase: '' }, tp: [], atp: {}, alur: {},
    suara: {}, petunjuk: { langkah: [] }, penutup: { preview: [] }, motivasi: {},
    rangkuman: {}, modules: [], kuis: [], games: [], diskusi: { pertanyaan: [] },
    refleksi: { pertanyaan: [] }, skenario: [], materi: { blok: [] },
    tpList: [], moduleList: [], kuisList: [], activityList: [], templateList: [],
    activePanel: 'dashboard', teacherMode: false,
    saveToStorage: () => {}, loadFromStorage: () => {}, newProject: () => {},
    setActivePanel: () => {}, setMeta: () => {},
  };
  const useAuthoringStore = Object.assign(
    (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(fakeState) : fakeState,
    { getState: () => fakeState, setState: () => {} },
  );
  return { useAuthoringStore };
});

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({
      dirty: false,
      startHydration: () => {},
      endHydration: () => {},
      resetOnLoad: () => {},
    }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

// ─────────────────────────────────────────────────────────────────
// Real imports
// ─────────────────────────────────────────────────────────────────

import { useCanvaStore } from '@/store/canva-store';
import type { CanvaPage } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

// 1x1 transparent PNG (~100 bytes base64)
const SMALL_PNG_DATAURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Generate a >1MB PNG data URL (simulated — uses repeated base64 payload)
function makeLargePngDataUrl(targetBytes: number): string {
  // Base64 of 1 byte = ~1.33 chars. So targetBytes → ~targetBytes * 1.33 chars.
  // We build a long base64 string of 'A' chars (encodes 0x00 bytes).
  const b64Chars = Math.ceil((targetBytes * 4) / 3);
  const b64 = 'A'.repeat(b64Chars);
  return `data:image/png;base64,${b64}`;
}

function makePageWithBgImage(id: string, bgDataUrl: string, overlay = 40): CanvaPage {
  return {
    id,
    label: `Page ${id}`,
    bgDataUrl,
    bgColor: '#0f172a',
    overlay,
    elements: [],
    templateType: 'materi',
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
    pageMode: 'schema',
    schema: {
      id: `schema-${id}`,
      templateType: 'materi',
      blocks: [],
    },
  };
}

function resetCanvaStore(pages: CanvaPage[]) {
  useCanvaStore.setState({
    appMode: 'edit',
    currentPageIndex: 0,
    pages,
    selectedBlockId: null,
    selectedBlockIds: [],
    selectedBlockType: null,
    hoveredBlockId: null,
    editingBlockId: null,
    selectedElId: null,
    selectedElIds: [],
    panelRequest: null,
  } as never);
}

// ─────────────────────────────────────────────────────────────────
// Tests — large bgDataUrl roundtrip (node env)
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5C — Media Reload/Persistence (large bgDataUrl)', () => {
  beforeEach(() => {
    // Clear the hoisted localStorage store before each test
    localStorageStore.store.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('>1MB bgDataUrl survives save → clear → load roundtrip (byte-for-byte)', () => {
    const largeDataUrl = makeLargePngDataUrl(1.2 * 1024 * 1024); // 1.2 MB
    expect(largeDataUrl.length).toBeGreaterThan(1024 * 1024);

    const page = makePageWithBgImage('p1', largeDataUrl, 40);
    resetCanvaStore([page]);

    // Save to localStorage
    useCanvaStore.getState().saveToStorage();

    // Verify it was written
    const stored = localStorage.getItem('canva_state_v2');
    expect(stored).not.toBeNull();
    expect(stored!.length).toBeGreaterThan(1024 * 1024);

    // Clear store state (simulate page reload — store starts empty)
    useCanvaStore.setState({ pages: [] } as never);
    expect(useCanvaStore.getState().pages.length).toBe(0);

    // Load from localStorage
    useCanvaStore.getState().loadFromStorage();

    // Verify bgDataUrl preserved exactly
    const loadedPages = useCanvaStore.getState().pages;
    expect(loadedPages.length).toBe(1);
    expect(loadedPages[0].bgDataUrl).toBe(largeDataUrl);
    expect(loadedPages[0].overlay).toBe(40);
  });

  it('Multiple pages each with large bgDataUrl survive roundtrip', () => {
    const largeUrl1 = makeLargePngDataUrl(800 * 1024); // 800 KB each
    const largeUrl2 = makeLargePngDataUrl(900 * 1024);
    const largeUrl3 = makeLargePngDataUrl(700 * 1024);

    const pages = [
      makePageWithBgImage('p1', largeUrl1, 20),
      makePageWithBgImage('p2', largeUrl2, 40),
      makePageWithBgImage('p3', largeUrl3, 60),
    ];
    resetCanvaStore(pages);

    useCanvaStore.getState().saveToStorage();
    useCanvaStore.setState({ pages: [] } as never);
    useCanvaStore.getState().loadFromStorage();

    const loaded = useCanvaStore.getState().pages;
    expect(loaded.length).toBe(3);
    expect(loaded[0].bgDataUrl).toBe(largeUrl1);
    expect(loaded[0].overlay).toBe(20);
    expect(loaded[1].bgDataUrl).toBe(largeUrl2);
    expect(loaded[1].overlay).toBe(40);
    expect(loaded[2].bgDataUrl).toBe(largeUrl3);
    expect(loaded[2].overlay).toBe(60);
  });

  it('Small bgDataUrl (~100 bytes) survives roundtrip (regression)', () => {
    const page = makePageWithBgImage('p1', SMALL_PNG_DATAURL, 0);
    resetCanvaStore([page]);

    useCanvaStore.getState().saveToStorage();
    useCanvaStore.setState({ pages: [] } as never);
    useCanvaStore.getState().loadFromStorage();

    const loaded = useCanvaStore.getState().pages;
    expect(loaded.length).toBe(1);
    expect(loaded[0].bgDataUrl).toBe(SMALL_PNG_DATAURL);
    expect(loaded[0].overlay).toBe(0);
  });

  it('bgDataUrl=null survives roundtrip (page without background image)', () => {
    const page = makePageWithBgImage('p1', null, 0);
    resetCanvaStore([page]);

    useCanvaStore.getState().saveToStorage();
    useCanvaStore.setState({ pages: [] } as never);
    useCanvaStore.getState().loadFromStorage();

    const loaded = useCanvaStore.getState().pages;
    expect(loaded.length).toBe(1);
    expect(loaded[0].bgDataUrl).toBeNull();
  });

  it('image-background-large.json fixture still has bgDataUrl + overlay=40 after parse', () => {
    // Verify the fixture file is intact and parseable
    const fixturePath = resolve(process.cwd(), 'fixtures/projects/image-background-large.json');
    const raw = readFileSync(fixturePath, 'utf-8');
    const data = JSON.parse(raw);

    // Fixture uses canvaState.pages (not top-level pages)
    const pages = data.canvaState?.pages ?? data.pages;
    expect(pages).toBeDefined();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(0);

    const page = pages[0];
    expect(page.bgDataUrl).toBeTruthy();
    expect(page.bgDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(page.overlay).toBe(40); // Patch-2 invariant
  });

  it('bgDataUrl URL pattern (data:image/png;base64,...) preserved exactly after roundtrip', () => {
    const customDataUrl = 'data:image/png;base64,CUSTOM123payload==';
    const page = makePageWithBgImage('p1', customDataUrl, 30);
    resetCanvaStore([page]);

    useCanvaStore.getState().saveToStorage();
    useCanvaStore.setState({ pages: [] } as never);
    useCanvaStore.getState().loadFromStorage();

    const loaded = useCanvaStore.getState().pages;
    expect(loaded[0].bgDataUrl).toBe(customDataUrl);
    // Verify prefix intact
    expect(loaded[0].bgDataUrl!.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('Reload preserves all Patch-2 invariant fields together (bgDataUrl + overlay + navConfig)', () => {
    const navConfig = {
      showNavbar: true,
      showPrevNext: false,
      showScore: true,
      showProgress: false,
      navbarStyle: 'minimal' as const,
    };
    const page: CanvaPage = {
      ...makePageWithBgImage('p1', SMALL_PNG_DATAURL, 40),
      navConfig,
    };
    resetCanvaStore([page]);

    useCanvaStore.getState().saveToStorage();
    useCanvaStore.setState({ pages: [] } as never);
    useCanvaStore.getState().loadFromStorage();

    const loaded = useCanvaStore.getState().pages[0];
    expect(loaded.bgDataUrl).toBe(SMALL_PNG_DATAURL);
    expect(loaded.overlay).toBe(40);
    expect(loaded.navConfig).toEqual(navConfig);
  });
});
