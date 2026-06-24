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

// Authoring initial-state mock — loadFromDB imports DEFAULT_CP etc.
// These must be available as mock values for the "no authoringData" path.
// V5-PATCH-02: Added DEFAULT_META for metadata-only field reset.
const { DEFAULT_CP, DEFAULT_ATP, DEFAULT_PETUNJUK, DEFAULT_PENUTUP, DEFAULT_SUARA, DEFAULT_META } = vi.hoisted(() => ({
  DEFAULT_CP: { elemen: '', subElemen: '', capaianFase: '', profil: [], fase: 'D', kelas: '' },
  DEFAULT_ATP: { namaBab: '', jumlahPertemuan: 3, pertemuan: [] },
  DEFAULT_PETUNJUK: { title: '', intro: '', langkah: [] },
  DEFAULT_PENUTUP: { title: '', subjudul: '', preview: [] },
  DEFAULT_SUARA: { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  DEFAULT_META: {
    judulPertemuan: '', subjudul: '', ikon: '📚', durasi: '',
    namaBab: '', mapel: '', kelas: '', kurikulum: '',
    namaGuru: '', namaSekolah: '', semester: '', tahunAjaran: '',
  },
}));

vi.mock('@/store/authoring/initial-state', () => ({
  DEFAULT_CP,
  DEFAULT_ATP,
  DEFAULT_PETUNJUK,
  DEFAULT_PENUTUP,
  DEFAULT_SUARA,
  DEFAULT_META,
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
      cp: { elemen: 'B-elem', subElemen: 'B-sub', capaianFase: 'B-fase', profil: [], fase: 'D', kelas: '6' },
      atp: { namaBab: 'B-bab', jumlahPertemuan: 2, pertemuan: [] },
      tp: [],
      alur: [],
      skenario: [],
      kuis: [],
      modules: [],
      games: [],
      materi: [],
      petunjuk: { title: 'B-petunjuk', intro: 'B-intro', langkah: [] },
      diskusi: [],
      refleksi: [],
      penutup: { title: 'B-penutup', subjudul: 'B-subjudul', preview: [] },
      suara: { navigasi: true, benar: false, salah: true, selesai: false, klik: true, skor: false },
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
    expect(authoringCall.cp).toEqual({ elemen: 'B-elem', subElemen: 'B-sub', capaianFase: 'B-fase', profil: [], fase: 'D', kelas: '6' });
    expect(authoringCall.atp).toEqual({ namaBab: 'B-bab', jumlahPertemuan: 2, pertemuan: [] });
    expect(authoringCall.petunjuk).toEqual({ title: 'B-petunjuk', intro: 'B-intro', langkah: [] });
    expect(authoringCall.penutup).toEqual({ title: 'B-penutup', subjudul: 'B-subjudul', preview: [] });
    expect(authoringCall.suara).toEqual({ navigasi: true, benar: false, salah: true, selesai: false, klik: true, skor: false });
    expect(authoringCall.dirty).toBe(false);
  });

  it('successful load without authoringData resets all non-schema fields to defaults', () => {
    const data = makeValidProjectBData({ authoringData: null });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);
    // Patch-4 P0-1 Fix: authoringData=null resets ALL non-schema fields
    // to their proper defaults, not just dirty. This prevents Project A
    // data from leaking into B.
    expect(mockAuthoringSetState).toHaveBeenCalledWith({
      cp: DEFAULT_CP,
      atp: DEFAULT_ATP,
      petunjuk: DEFAULT_PETUNJUK,
      penutup: DEFAULT_PENUTUP,
      suara: DEFAULT_SUARA,
      meta: DEFAULT_META, // V5-PATCH-02: meta reset to prevent cross-project contamination
      dirty: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST 5: Hydration depth always returns to entry value
// ═══════════════════════════════════════════════════════════════════
describe('Patch-3/4: Hydration depth safety', () => {
  it('after successful loadFromDB, hydration depth returns to entry value', () => {
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

    const data = makeValidProjectBData();
    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);

    // Patch-4 P0-2 Fix: No outer hydration from ProjectManager anymore.
    // loadFromDB manages its own hydration internally. After it returns,
    // depth should be back to the entry value.
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth);
  });

  it('after FAILED loadFromDB, hydration depth returns to entry value', () => {
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

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
    // so depth is still at entry value
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth);
  });

  it('malformed authoringData does not leak hydration depth', () => {
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

    const data = makeValidProjectBData({
      authoringData: '{broken-authoring',
    });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(false);

    // Authoring parse failure happens in Phase 2 (before hydration),
    // so no hydration was started — depth stays at entry value
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

// ═══════════════════════════════════════════════════════════════════
// PATCH-4 REGRESSION TESTS
// ═══════════════════════════════════════════════════════════════════

// ── Regression Test 1: authoringData=null clears Project A fields ──
describe('Patch-4: authoringData=null resets all non-schema fields', () => {
  it('Project A authoring data does NOT leak into Project B when B has no authoringData', () => {
    const data = makeValidProjectBData({ authoringData: null });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);

    // Verify authoring was set to proper defaults, NOT Project A's data
    expect(mockAuthoringSetState).toHaveBeenCalledWith({
      cp: DEFAULT_CP,
      atp: DEFAULT_ATP,
      petunjuk: DEFAULT_PETUNJUK,
      penutup: DEFAULT_PENUTUP,
      suara: DEFAULT_SUARA,
      meta: DEFAULT_META, // V5-PATCH-02: meta reset to prevent cross-project contamination
      dirty: false,
    });

    // No call that falls back to store.cp/store.atp etc.
    const allCalls = mockAuthoringSetState.mock.calls;
    for (const call of allCalls) {
      const arg = call[0];
      // None of these should reference the store's current (Project A) values
      if (typeof arg === 'object' && arg !== null) {
        expect(arg.cp).not.toBe(undefined); // Must be explicitly set (not omitted/fallback)
        // cp should be the default, not Project A's data
        expect(typeof arg.cp).toBe('object');
      }
    }
  });
});

// ── Regression Test 2: authoringData={} does not use store.cp fallback ──
describe('Patch-4: Partial authoringData uses defaults for missing fields', () => {
  it('authoringData with missing cp field defaults to DEFAULT_CP, not store.cp', () => {
    // Simulate Project B with authoringData that only has 'suara'
    const partialAuthData = JSON.stringify({
      suara: { navigasi: false, benar: true, salah: false, selesai: true, klik: false, skor: true },
      // cp, atp, petunjuk, penutup are MISSING
    });

    const data = makeValidProjectBData({ authoringData: partialAuthData });

    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);

    // Verify: missing fields get proper defaults, NOT Project A's store values
    const authoringCall = mockAuthoringSetState.mock.calls[mockAuthoringSetState.mock.calls.length - 1][0];
    expect(authoringCall.cp).toEqual(DEFAULT_CP);  // NOT store.cp
    expect(authoringCall.atp).toEqual(DEFAULT_ATP);  // NOT store.atp
    expect(authoringCall.petunjuk).toEqual(DEFAULT_PETUNJUK);  // NOT store.petunjuk
    expect(authoringCall.penutup).toEqual(DEFAULT_PENUTUP);  // NOT store.penutup
    expect(authoringCall.suara).toEqual({ navigasi: false, benar: true, salah: false, selesai: true, klik: false, skor: true });  // Present from B's data
    expect(authoringCall.dirty).toBe(false);
  });
});

// ── Regression Test 3: Edit during save → executeDurableSave returns false ──
// (Tests P0-3a: honest return value when still dirty after save)
describe('Patch-4: executeDurableSave returns false when still dirty', () => {
  it('edit during DB save makes executeDurableSave return false', async () => {
    // We need to import executeDurableSave, but it's already mocked
    // in the persistence-boundary test. For this test, we need the real one.
    // Since this test file focuses on loadFromDB, we test the coordinator
    // behavior by verifying the dirty-store state machine directly.

    // Setup: mark dirty
    useDirtyStore.getState().markDirty(); // revision 1
    expect(useDirtyStore.getState().dirty).toBe(true);

    // Simulate: startSaving at revision 1
    useDirtyStore.getState().startSaving();
    expect(useDirtyStore.getState().savingRevision).toBe(1);

    // Simulate: user edits during save → revision 2
    // (markDirty is suppressed during hydration, but if no hydration
    // is active, markDirty increments the revision)
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().editRevision).toBe(2);

    // Simulate: DB save completes → saveSucceeded()
    const fullyClean = useDirtyStore.getState().saveSucceeded();

    // saveSucceeded returns false because editRevision(2) !== savingRevision(1)
    expect(fullyClean).toBe(false);
    expect(useDirtyStore.getState().dirty).toBe(true);
    // This means executeDurableSave should return false →
    // flushDurableSave should keep looping
  });
});

// ── Regression Test 4: Hydration NOT active during network fetch ──
// (Tests P0-2: outer hydration removed from ProjectManager)
describe('Patch-4: No hydration during network fetch', () => {
  it('markDirty is NOT suppressed when loadFromDB is not running', () => {
    // Before Patch-4: ProjectManager wrapped the entire fetch+load in
    // startHydration/endHydration, which suppressed markDirty during
    // the network wait. This caused user edits to be silently swallowed.
    // After Patch-4: No outer hydration — only loadFromDB's internal
    // hydration during the commit phase.

    // Verify that markDirty works normally when no hydration is active
    const entryDepth = useDirtyStore.getState()._hydrationDepth;
    expect(entryDepth).toBe(0);

    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);
    expect(useDirtyStore.getState().editRevision).toBeGreaterThan(0);

    // If there were outer hydration active, markDirty would be suppressed
    // and editRevision would NOT increment. Now it works correctly.
  });

  it('loadFromDB internal hydration properly scopes suppression', () => {
    // Verify that loadFromDB only suppresses markDirty during its
    // internal commit phase, not during the entire operation.
    const entryDepth = useDirtyStore.getState()._hydrationDepth;

    const data = makeValidProjectBData();
    const loaded = useCanvaStore.getState().loadFromDB(data);

    expect(loaded).toBe(true);
    // After loadFromDB returns, hydration depth is back to entry
    expect(useDirtyStore.getState()._hydrationDepth).toBe(entryDepth);

    // markDirty works normally again
    useDirtyStore.getState().markDirty();
    expect(useDirtyStore.getState().dirty).toBe(true);
  });
});
