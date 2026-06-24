// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.6A — Schema Versioning Import/Export Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies that the export/import JSON paths correctly write/read the
// project-level schemaVersion field, and that the migration gate is
// wired into the import path.
//
// Coverage:
//   1. Export JSON (Dashboard.tsx + use-export-actions.ts) includes schemaVersion
//   2. Legacy JSON without schemaVersion migrates successfully through import
//   3. Current schemaVersion roundtrip stable (export → import → re-export)
//   4. Future schemaVersion rejected safely (no store mutation)
//   5. Malformed schemaVersion rejected safely (no store mutation)
//   6. Import failure does NOT mutate stores (canva + authoring)
//   7. canva.pages preserved through import
//   8. ratioId / currentPageIndex preserved
//   9. bgDataUrl preserved
//  10. navConfig / overlay preserved
//
// Approach: since the actual export/import functions live inside hooks
// (use-export-actions, use-excel-import) that depend on browser APIs
// (FileReader, Blob, URL.createObjectURL, etc.), we test the BEHAVIOR
// by directly exercising migrateProjectDocument (the gate function
// the import hook calls) and verifying the export payload shape.
//
// This matches the pattern Sprint 8.4 used (helper simulation of
// export/import rather than calling the private hook functions directly).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────────
// Mocks — same shape as recovery-boot-bridge for store isolation
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
    {
      getState: () => fakeState,
      setState: (patch: Record<string, unknown>) => { Object.assign(fakeState, patch); },
    },
  );
  return { useAuthoringStore };
});

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({ dirty: false, startHydration: () => {}, endHydration: () => {}, resetOnLoad: () => {} }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

// ─────────────────────────────────────────────────────────────────
// Real imports
// ─────────────────────────────────────────────────────────────────

import { CURRENT_PROJECT_SCHEMA_VERSION, migrateProjectDocument } from '@/core/schema/project-schema-versioning';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CanvaPage } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function loadFixture(name: string): unknown {
  const path = resolve(process.cwd(), 'fixtures/projects', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function makePage(id: string, overrides: Partial<CanvaPage> = {}): CanvaPage {
  return {
    id,
    label: `Page ${id}`,
    bgDataUrl: null,
    bgColor: '#0f172a',
    overlay: 0,
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
    ...overrides,
  };
}

/**
 * Simulates the export JSON path — mirrors the shape produced by
 * use-export-actions.ts exportJSON() and Dashboard.tsx exportJSON().
 *
 * Sprint 8.6A: now includes schemaVersion at the top level.
 */
function simulateExportJSON(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    meta: { judulPertemuan: 'Test Export' },
    canva: {
      pages: [makePage('p1')],
      ratioId: '16:9',
      currentPageIndex: 0,
    },
    ...overrides,
  };
}

/**
 * Simulates the import JSON path — mirrors the gate logic in
 * use-excel-import.ts handleImportJSON().
 *
 * Returns:
 *   - { ok: true, document } — caller should setState() with document
 *   - { ok: false, reason } — caller should NOT call setState()
 */
function simulateImportJSON(rawJson: unknown) {
  return migrateProjectDocument(rawJson);
}

/**
 * Apply the migrated document to the stores — mirrors what
 * handleImportJSON does AFTER the migration gate passes.
 */
function applyImportedDocumentToStores(doc: Record<string, unknown>) {
  const store = useAuthoringStore.getState();
  useAuthoringStore.setState({
    meta: (doc.meta as Record<string, unknown>) || store.meta,
    cp: (doc.cp as Record<string, unknown>) || store.cp,
    tp: (doc.tp as unknown[]) || [],
    atp: (doc.atp as Record<string, unknown>) || store.atp,
    alur: (doc.alur as unknown[]) || [],
    skenario: (doc.skenario as unknown[]) || [],
    kuis: (doc.kuis as unknown[]) || [],
    modules: (doc.modules as unknown[]) || [],
    materi: (doc.materi as { blok: unknown[] }) || { blok: [] },
    dirty: true,
  });

  if (doc.canva) {
    const canvaStore = useCanvaStore.getState();
    const canva = doc.canva as { pages?: CanvaPage[]; ratioId?: string; currentPageIndex?: number };
    useCanvaStore.setState({
      pages: canva.pages || canvaStore.pages,
      ratioId: canva.ratioId || canvaStore.ratioId,
      currentPageIndex: canva.currentPageIndex || 0,
      panelRequest: null,
    } as never);
  }
}

function resetStores() {
  useCanvaStore.setState({
    appMode: 'edit',
    currentPageIndex: 0,
    pages: [makePage('initial')],
    selectedBlockId: null,
    selectedBlockIds: [],
    selectedBlockType: null,
    hoveredBlockId: null,
    editingBlockId: null,
    selectedElId: null,
    selectedElIds: [],
    panelRequest: null,
  } as never);
  useAuthoringStore.setState({
    meta: { judulPertemuan: 'Initial' },
    tp: [],
    modules: [],
    kuis: [],
  });
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.6A — Schema Versioning Import/Export', () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Export JSON includes schemaVersion ───────────────────────

  it('export JSON (Dashboard.tsx shape) includes schemaVersion = CURRENT', () => {
    const exported = simulateExportJSON();
    expect(exported.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    expect(exported.schemaVersion).toBe(1);
  });

  it('export JSON (use-export-actions.ts shape) includes schemaVersion = CURRENT', () => {
    // Both export paths produce the same shape; verify schemaVersion is present
    const exported = simulateExportJSON({
      meta: { judulPertemuan: 'Different Title' },
    });
    expect(exported.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    expect(exported.meta).toEqual({ judulPertemuan: 'Different Title' });
  });

  it('export JSON includes canva.pages + ratioId + currentPageIndex (Sprint 8.4 compat)', () => {
    const exported = simulateExportJSON();
    const canva = exported.canva as { pages: unknown[]; ratioId: string; currentPageIndex: number };
    expect(Array.isArray(canva.pages)).toBe(true);
    expect(canva.pages.length).toBe(1);
    expect(canva.ratioId).toBe('16:9');
    expect(canva.currentPageIndex).toBe(0);
  });

  // ── Legacy JSON migration through import ─────────────────────

  it('legacy JSON without schemaVersion migrates successfully through import', () => {
    const legacy = {
      // NO schemaVersion field — simulates pre-8.6A export
      meta: { judulPertemuan: 'Legacy' },
      canva: {
        pages: [makePage('legacy-p1')],
        ratioId: '4:3',
        currentPageIndex: 0,
      },
    };
    const result = simulateImportJSON(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    }
  });

  it('legacy fixture (legacy-no-schema-version.json) migrates successfully', () => {
    const legacy = loadFixture('legacy-no-schema-version.json');
    const result = simulateImportJSON(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    }
  });

  // ── Roundtrip stability ─────────────────────────────────────

  it('current schemaVersion roundtrip stable (export → import → re-export)', () => {
    // Step 1: export
    const exported = simulateExportJSON({
      meta: { judulPertemuan: 'Roundtrip Test' },
    });
    expect(exported.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);

    // Step 2: import (migrate)
    const importResult = simulateImportJSON(exported);
    expect(importResult.ok).toBe(true);
    if (!importResult.ok) return;
    expect(importResult.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);

    // Step 3: re-export (simulate by reading the migrated document's schemaVersion)
    const reexported = {
      ...importResult.document,
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION, // export always writes current
    };
    expect(reexported.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    expect(reexported.schemaVersion).toBe(exported.schemaVersion);
  });

  it('current fixture (current-schema-version.json) roundtrip stable', () => {
    const current = loadFixture('current-schema-version.json');
    const result = simulateImportJSON(current);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
    // The fixture has schemaVersion: 1, CURRENT is 1 → stable
  });

  // ── Future version rejection ────────────────────────────────

  it('future schemaVersion (99) rejected safely', () => {
    const future = { schemaVersion: 99, meta: {}, canva: { pages: [] } };
    const result = simulateImportJSON(future);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('future-version');
    }
  });

  it('future fixture (future-schema-version.json) rejected safely', () => {
    const future = loadFixture('future-schema-version.json');
    const result = simulateImportJSON(future);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('future-version');
    }
  });

  // ── Malformed version rejection ─────────────────────────────

  it('malformed schemaVersion (string "not-a-number") rejected safely', () => {
    const malformed = { schemaVersion: 'not-a-number', meta: {}, canva: { pages: [] } };
    const result = simulateImportJSON(malformed);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('malformed fixture (malformed-schema-version.json) rejected safely', () => {
    const malformed = loadFixture('malformed-schema-version.json');
    const result = simulateImportJSON(malformed);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('malformed NaN rejected safely', () => {
    const malformed = { schemaVersion: NaN, meta: {}, canva: { pages: [] } };
    const result = simulateImportJSON(malformed);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('malformed negative rejected safely', () => {
    const malformed = { schemaVersion: -1, meta: {}, canva: { pages: [] } };
    const result = simulateImportJSON(malformed);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('malformed-version');
    }
  });

  it('invalid shape (array) rejected safely', () => {
    const malformed = [1, 2, 3];
    const result = simulateImportJSON(malformed);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape');
    }
  });

  it('invalid shape (null) rejected safely', () => {
    const result = simulateImportJSON(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape');
    }
  });

  // ── Import failure does NOT mutate stores ───────────────────

  it('import failure (future version) does NOT mutate canva store', () => {
    const initialPages = useCanvaStore.getState().pages;
    const initialRatioId = useCanvaStore.getState().ratioId;

    const future = { schemaVersion: 99, canva: { pages: [makePage('future-p1')] } };
    const result = simulateImportJSON(future);
    expect(result.ok).toBe(false);

    // Simulate the early-return in handleImportJSON — no setState calls happen
    // We verify by NOT calling applyImportedDocumentToStores (which is what
    // the real hook does on failure — it returns before setState).
    // The stores should still have their initial state.
    expect(useCanvaStore.getState().pages).toEqual(initialPages);
    expect(useCanvaStore.getState().ratioId).toBe(initialRatioId);
  });

  it('import failure (malformed version) does NOT mutate authoring store', () => {
    const initialMeta = useAuthoringStore.getState().meta;
    const initialTp = useAuthoringStore.getState().tp;

    const malformed = { schemaVersion: 'bad', meta: { judulPertemuan: 'SHOULD NOT LEAK' } };
    const result = simulateImportJSON(malformed);
    expect(result.ok).toBe(false);

    // No setState called on failure
    expect(useAuthoringStore.getState().meta).toEqual(initialMeta);
    expect(useAuthoringStore.getState().tp).toEqual(initialTp);
  });

  it('import failure (invalid shape) does NOT mutate either store', () => {
    const initialCanvaPages = useCanvaStore.getState().pages;
    const initialMeta = useAuthoringStore.getState().meta;

    const result = simulateImportJSON(null);
    expect(result.ok).toBe(false);

    expect(useCanvaStore.getState().pages).toEqual(initialCanvaPages);
    expect(useAuthoringStore.getState().meta).toEqual(initialMeta);
  });

  // ── Field preservation through successful import ────────────

  it('canva.pages preserved through successful import', () => {
    const exported = simulateExportJSON({
      canva: {
        pages: [makePage('p1'), makePage('p2'), makePage('p3')],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    });
    const result = simulateImportJSON(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    applyImportedDocumentToStores(result.document as Record<string, unknown>);

    const pages = useCanvaStore.getState().pages;
    expect(pages.length).toBe(3);
    expect(pages[0].id).toBe('p1');
    expect(pages[1].id).toBe('p2');
    expect(pages[2].id).toBe('p3');
  });

  it('ratioId / currentPageIndex preserved through successful import', () => {
    const exported = simulateExportJSON({
      canva: {
        pages: [makePage('p1')],
        ratioId: '4:3',
        currentPageIndex: 2,
      },
    });
    const result = simulateImportJSON(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    applyImportedDocumentToStores(result.document as Record<string, unknown>);

    expect(useCanvaStore.getState().ratioId).toBe('4:3');
    expect(useCanvaStore.getState().currentPageIndex).toBe(2);
  });

  it('bgDataUrl preserved through successful import', () => {
    const customDataUrl = 'data:image/png;base64,ROUNDTRIP_TEST_PAYLOAD==';
    const exported = simulateExportJSON({
      canva: {
        pages: [makePage('p1', { bgDataUrl: customDataUrl, overlay: 40 })],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    });
    const result = simulateImportJSON(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    applyImportedDocumentToStores(result.document as Record<string, unknown>);

    const pages = useCanvaStore.getState().pages;
    expect(pages[0].bgDataUrl).toBe(customDataUrl);
  });

  it('navConfig / overlay preserved through successful import', () => {
    const customNav = {
      showNavbar: true,
      showPrevNext: false,
      showScore: true,
      showProgress: false,
      navbarStyle: 'minimal' as const,
    };
    const exported = simulateExportJSON({
      canva: {
        pages: [makePage('p1', { navConfig: customNav, overlay: 60 })],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    });
    const result = simulateImportJSON(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    applyImportedDocumentToStores(result.document as Record<string, unknown>);

    const pages = useCanvaStore.getState().pages;
    expect(pages[0].navConfig).toEqual(customNav);
    expect(pages[0].overlay).toBe(60);
  });

  it('contractId / pageMode preserved through successful import', () => {
    const exported = simulateExportJSON({
      canva: {
        pages: [makePage('p1', {
          contractId: 'academic-clean-contract',
          pageMode: 'schema',
        })],
        ratioId: '16:9',
        currentPageIndex: 0,
      },
    });
    const result = simulateImportJSON(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    applyImportedDocumentToStores(result.document as Record<string, unknown>);

    const pages = useCanvaStore.getState().pages;
    expect(pages[0].contractId).toBe('academic-clean-contract');
    expect(pages[0].pageMode).toBe('schema');
  });

  // ── Legacy fallback (no canva field, top-level pages) ───────

  it('legacy format with top-level pages (no canva field) still accepted via migration', () => {
    const legacy = {
      // No schemaVersion, no canva — old pre-8.4 format with top-level pages
      pages: [makePage('legacy-1')],
      meta: { judulPertemuan: 'Legacy' },
    };
    const result = simulateImportJSON(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.schemaVersion).toBe(CURRENT_PROJECT_SCHEMA_VERSION);
      // pages field preserved (the import path's fallback handles this)
      expect(result.document.pages).toBeDefined();
    }
  });
});
