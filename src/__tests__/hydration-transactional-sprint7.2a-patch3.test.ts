// ═══════════════════════════════════════════════════════════════════
// SPRINT 7.2A-PATCH-3 — TRANSACTIONAL HYDRATION INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════
// 5 mandatory tests that exercise the ACTUAL loadFromDB implementation
// to verify transactional hydration behavior:
//
//   1. Malformed schemaData → loadFromDB returns false → stores unchanged
//   2. pages: null → loadFromDB returns false (fail closed)
//   3. Malformed authoringData → entire load cancelled → canva unchanged
//   4. Successful load → canva + authoring both from Project B
//   5. Hydration depth always returns to entry value
//
// These tests mock the heavy dependencies (schema migration, recovery,
// etc.) but use the REAL loadFromDB function from the canva store,
// testing the actual parse-validate-commit pipeline.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useDirtyStore } from '@/store/dirty-store';

// ── Mock dirty-store require() inside loadFromDB ──
// loadFromDB uses require('@/store/dirty-store') which must resolve
// to the same store instance our tests use.
vi.mock('@/store/dirty-store', async () => {
  const actual = await vi.importActual<typeof import('@/store/dirty-store')>('@/store/dirty-store');
  return actual;
});

// ── Mock heavy dependencies before importing the canva store ──
// These are all called inside loadFromDB but don't affect the
// transactional logic we're testing.

vi.mock('@/core/recovery', () => ({
  hasCrashRecovery: vi.fn(() => false),
  loadCrashRecovery: vi.fn(),
  clearCrashRecovery: vi.fn(),
  safeBootFromStorage: vi.fn(() => ({ booted: false, repairs: [], safeMode: false })),
  repairSchema: vi.fn((s) => ({ schema: s })),
  validateAndRepairPages: vi.fn(() => ({ repairedPages: 0, corruptedPages: 0, totalPages: 0 })),
  computePagesHash: vi.fn(() => 'mock-hash'),
}));

vi.mock('@/core/schema/ensure-schema', () => ({
  migrateAllPages: vi.fn((pages) => pages), // identity — pass through
}));

vi.mock('@/core/schema/schema-migration', () => ({
  migrateAllSchemas: vi.fn((pages) => ({ pages, migratedCount: 0 })),
}));

vi.mock('@/core/schema/session-state', () => ({
  assertDocumentPurity: vi.fn(),
  clearCompressedHeightCache: vi.fn(),
}));

vi.mock('@/core/layout/BlockMeasurer', () => ({
  clearMeasurementCache: vi.fn(),
}));

vi.mock('@/core/utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Authoring store mock — we need to track setState calls.
// vi.hoisted() ensures the mock function is available when vi.mock runs.
const { mockAuthoringSetState } = vi.hoisted(() => ({
  mockAuthoringSetState: vi.fn(),
}));

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: {
    getState: vi.fn(() => ({
      cp: [], atp: [], tp: [], alur: [],
      skenario: [], kuis: [], modules: [], games: [],
      materi: [], petunjuk: [], diskusi: [], refleksi: [],
      penutup: [], suara: [],
      meta: { judulPertemuan: 'Project A', mapel: '', kelas: '' },
      dirty: true, // Start dirty for Project A
    })),
    setState: mockAuthoringSetState,
  },
}));

// ── Import the canva store AFTER mocks are set up ──
import { useCanvaStore } from '@/store/canva-store';
import type { DBProjectData } from '@/store/canva/types';

// ── Helpers ──────────────────────────────────────────────────────

function resetDirtyStore(projectId?: string | null) {
  useDirtyStore.setState({
    saveStatus: 'idle',
    editRevision: 0,
    lastSavedRevision: 0,
    savingRevision: null,
    lastError: null,
    dirty: false,
    currentProjectId: projectId ?? null,
    _hydrationDepth: 0,
  });
}

/** Build a valid DBProjectData for testing */
function makeValidProjectBData(overrides?: Partial<DBProjectData>): DBProjectData {
  return {
    id: 'project-B',
    title: 'Project B',
    description: null,
    ratioId: '16:9',
    authoringData: JSON.stringify({
      cp: [{ id: 'cp-b' }],
      atp: [{ id: 'atp-b' }],
      tp: [],
      alur: [],
      skenario: [],
      kuis: [],
      modules: [],
      games: [],
      materi: [],
      petunjuk: [{ id: 'petunjuk-b' }],
      diskusi: [],
      refleksi: [],
      penutup: [{ id: 'penutup-b' }],
      suara: [{ id: 'suara-b' }],
    }),
    pages: [
      {
        id: 'page-b-1',
        pageIndex: 0,
        label: 'Halaman 1',
        templateType: 'custom',
        variant: null,
        contractId: null,
        bgColor: '#ffffff',
        bgImage: null,
        bgOverlay: null,
        schemaData: JSON.stringify({ id: 'page-b-1', templateType: 'custom', blocks: [] }),
        navConfig: null,
        templateData: null,
        colorPalette: null,
        blocks: [],
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetDirtyStore('project-A');
  mockAuthoringSetState.mockClear();

  // Reset canva store to a clean Project A state
  useCanvaStore.setState({
    pages: [{
      id: 'page-a-1',
      label: 'Project A Page',
      bgDataUrl: null,
      bgColor: '#ffffff',
      overlay: 20,
      elements: [],
      templateType: 'custom',
      colorPalette: null,
      navConfig: { navbarStyle: 'default' },
      templateData: {},
      schema: { id: 'page-a-1', templateType: 'custom', blocks: [] },
    }],
    currentPageIndex: 0,
    ratioId: '16:9',
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 1: Malformed schemaData → loadFromDB returns false,
//         stores unchanged, Project A state preserved
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3: Malformed schemaData preserves Project A', () => {
  it('loadFromDB returns false when schemaData has invalid JSON', () => {
    const beforePages = useCanvaStore.getState().pages;
    const beforeRev = useDirtyStore.getState().editRevision;
    const beforeProjectId = useDirtyStore.getState().currentProjectId;

    // Mark Project A as dirty
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);
    const dirtyRev = useDirtyStore.getState().editRevision;

    const data = makeValidProjectBData({
      pages: [{
        id: 'page-b-1',
        pageIndex: 0,
        label: 'Broken Page',
        templateType: 'custom',
        variant: null,
        contractId: null,
        bgColor: '#ffffff',
        bgImage: null,
        bgOverlay: null,
        schemaData: '{invalid-json', // This will throw on JSON.parse
        navConfig: null,
        templateData: null,
        colorPalette: null,
        blocks: [],
      }],
    });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    // loadFromDB returns false
    expect(loaded).toBe(false);

    // Canva store pages are STILL Project A
    expect(useCanvaStore.getState().pages).toEqual(beforePages);

    // Dirty store state is STILL Project A
    expect(useDirtyStore.getState().editRevision).toBe(dirtyRev);
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().currentProjectId).toBe(beforeProjectId);

    // Authoring store was NOT modified
    expect(mockAuthoringSetState).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 2: pages: null → loadFromDB returns false (fail closed)
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3: Null/missing pages fails closed', () => {
  it('loadFromDB returns false when pages is null', () => {
    const beforePages = useCanvaStore.getState().pages;

    // Cast to bypass TypeScript — runtime can receive null from API
    const data = makeValidProjectBData({ pages: null as unknown as DBProjectData['pages'] });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(false);
    // Stores unchanged
    expect(useCanvaStore.getState().pages).toEqual(beforePages);
    expect(mockAuthoringSetState).not.toHaveBeenCalled();
  });

  it('loadFromDB returns false when pages is undefined', () => {
    const beforePages = useCanvaStore.getState().pages;

    const data = makeValidProjectBData({ pages: undefined as unknown as DBProjectData['pages'] });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(false);
    expect(useCanvaStore.getState().pages).toEqual(beforePages);
    expect(mockAuthoringSetState).not.toHaveBeenCalled();
  });

  it('loadFromDB returns false when pages is a string (wrong type)', () => {
    const beforePages = useCanvaStore.getState().pages;

    const data = makeValidProjectBData({ pages: 'not-an-array' as unknown as DBProjectData['pages'] });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(false);
    expect(useCanvaStore.getState().pages).toEqual(beforePages);
    expect(mockAuthoringSetState).not.toHaveBeenCalled();
  });

  it('loadFromDB returns true when pages is an empty array (valid blank project)', () => {
    const data = makeValidProjectBData({ pages: [] });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    // Empty array IS valid
    expect(loaded).toBe(true);
    expect(useCanvaStore.getState().pages).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 3: Malformed authoringData → entire load cancelled,
//         canva store NOT mutated (atomic hydration)
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3: Malformed authoringData cancels entire load', () => {
  it('canva store is NOT mutated when authoringData is invalid JSON', () => {
    const beforePages = useCanvaStore.getState().pages;

    useDirtyStore.getState().markDirty();

    const data = makeValidProjectBData({
      authoringData: '{broken-authoring-json', // Invalid JSON
    });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    // loadFromDB returns false — authoring parse failure aborts the load
    expect(loaded).toBe(false);

    // Canva store still has Project A pages
    expect(useCanvaStore.getState().pages).toEqual(beforePages);

    // Authoring store was NOT touched
    expect(mockAuthoringSetState).not.toHaveBeenCalled();

    // Project A is still dirty
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().currentProjectId).toBe('project-A');
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 4: Successful load → canva AND authoring both from Project B
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3: Successful load commits both stores atomically', () => {
  it('after successful loadFromDB, canva has Project B pages and authoring has B data', () => {
    const data = makeValidProjectBData();

    const loaded = useCanvaStore.getState().loadFromDB(data);

    // Load succeeded
    expect(loaded).toBe(true);

    // Canva store has Project B pages
    const pages = useCanvaStore.getState().pages;
    expect(pages.length).toBe(1);
    expect(pages[0].id).toBe('page-b-1');

    // Authoring store was committed with Project B data
    expect(mockAuthoringSetState).toHaveBeenCalled();
    const authoringCall = mockAuthoringSetState.mock.calls[0][0];
    // cp should have Project B data
    expect(authoringCall.cp).toEqual([{ id: 'cp-b' }]);
    expect(authoringCall.atp).toEqual([{ id: 'atp-b' }]);
    expect(authoringCall.petunjuk).toEqual([{ id: 'petunjuk-b' }]);
    expect(authoringCall.penutup).toEqual([{ id: 'penutup-b' }]);
    expect(authoringCall.suara).toEqual([{ id: 'suara-b' }]);
    expect(authoringCall.dirty).toBe(false);
  });

  it('successful load without authoringData clears authoring dirty', () => {
    const data = makeValidProjectBData({ authoringData: null });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);
    // Authoring dirty should be cleared even without authoringData
    expect(mockAuthoringSetState).toHaveBeenCalledWith({ dirty: false });
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 5: Hydration depth always returns to entry value
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3: Hydration depth safety', () => {
  it('after successful loadFromDB, hydration depth returns to entry value', () => {
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

    // Simulate outer hydration from ProjectManager
    useDirtyStore.getState().startHydration();
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth + 1);

    const data = makeValidProjectBData();
    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);

    // loadFromDB's inner hydration should have ended
    // (depth is still +1 from the outer hydration)
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth + 1);

    // ProjectManager ends its outer hydration
    useDirtyStore.getState().endHydration();
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth);
  });

  it('after FAILED loadFromDB, hydration depth returns to entry value', () => {
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

    // Simulate outer hydration from ProjectManager
    useDirtyStore.getState().startHydration();
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth + 1);

    // Load with corrupted data
    const data = makeValidProjectBData({
      pages: [{
        id: 'page-b-1',
        pageIndex: 0,
        label: 'Broken',
        templateType: 'custom',
        variant: null,
        contractId: null,
        bgColor: '#ffffff',
        bgImage: null,
        bgOverlay: null,
        schemaData: '{invalid-json',
        navConfig: null,
        templateData: null,
        colorPalette: null,
        blocks: [],
      }],
    });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(false);

    // Patch-3: loadFromDB no longer starts hydration if parse fails,
    // so depth is still just the outer +1
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth + 1);

    // ProjectManager ends its outer hydration in finally block
    useDirtyStore.getState().endHydration();
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth);
  });

  it('malformed authoringData does not leak hydration depth', () => {
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

    useDirtyStore.getState().startHydration();

    const data = makeValidProjectBData({
      authoringData: '{broken-authoring',
    });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(false);

    // Authoring parse failure happens in Phase 2 (before hydration),
    // so no hydration was started — depth is just outer +1
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth + 1);

    useDirtyStore.getState().endHydration();
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth);
  });
});

// ═══════════════════════════════════════════════════════════════════
// ADDENDUM: Cross-project contamination prevention
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3: Cross-project contamination prevention', () => {
  it('after failed load, resetOnLoad is never called — Project A retains revision state', () => {
    // Set up Project A with some edits
    useDirtyStore.getState().markDirty();
    useDirtyStore.getState().markDirty();
    const projAEditRev = useDirtyStore.getState().editRevision;
    expect(projAEditRev).toBeGreaterThan(0);

    // Try to load Project B with corrupted data
    const data = makeValidProjectBData({
      pages: null as unknown as DBProjectData['pages'],
    });

    const loaded = useCanvaStore.getState().loadFromDB(data);
    expect(loaded).toBe(false);

    // Project A's revision state is UNTOUCHED — loadFromDB did NOT
    // call resetOnLoad() (that's ProjectManager's job, only on success)
    expect(useDirtyStore.getState().editRevision).toBe(projAEditRev);
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().currentProjectId).toBe('project-A');
    expect(useDirtyStore.getState().lastSavedRevision).toBe(0);
  });

  it('after successful load, Project Manager calls resetOnLoad with B id', () => {
    const data = makeValidProjectBData();

    const loaded = useCanvaStore.getState().loadFromDB(data);
    expect(loaded).toBe(true);

    // Simulate what ProjectManager does after loadFromDB returns true:
    useDirtyStore.getState().resetOnLoad('project-B');

    // Now dirty store is reset for Project B
    expect(useDirtyStore.getState().currentProjectId).toBe('project-B');
    expect(useDirtyStore.getState().editRevision).toBe(0);
    expect(useDirtyStore.getState().dirty).toBe(false);
  });
});
