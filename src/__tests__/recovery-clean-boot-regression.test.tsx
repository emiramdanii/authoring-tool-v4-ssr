// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5A-Patch-1 — Clean Boot Regression Tests
// ═══════════════════════════════════════════════════════════════════
// Senior Review 8.5A flagged a P0 false-positive bug:
//
//   buildSchemaHealingResult() compared originalPages vs healedPages by
//   reference (orig.schema !== healed.schema), which is ALWAYS true
//   after deepClonePages() produces fresh objects. This made
//   needsRecovery=true on every clean boot, causing RecoveryDialog to
//   appear for normal users.
//
// Patch-1 fix:
//   - Removed buildSchemaHealingResult()
//   - Use the actual healResult / proactiveHealResult from step 4
//     (neededHealing is true ONLY when SchemaHealer actually repairs
//     or removes blocks)
//
// Regression tests in this file:
//   1. Clean valid page → orchestrator.run() returns needsRecovery=false
//   2. RecoveryDialog does NOT render on clean boot
//   3. RecoveryDialog DOES render on real incomplete transaction
//   4. Multiple clean pages → still needsRecovery=false
//   5. needsRecovery=false even when pages have non-trivial blocks
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────
// Mocks — same shape as recovery-boot-bridge.test.tsx
// ─────────────────────────────────────────────────────────────────

vi.mock('@/store/authoring-store', () => {
  const fakeState: Record<string, unknown> = {
    activePreset: null,
    meta: {},
    cp: { capaianFase: '' },
    tp: [],
    atp: {},
    alur: {},
    suara: {},
    petunjuk: { langkah: [] },
    penutup: { preview: [] },
    motivasi: {},
    rangkuman: {},
    modules: [],
    kuis: [],
    games: [],
    diskusi: { pertanyaan: [] },
    refleksi: { pertanyaan: [] },
    skenario: [],
    materi: { blok: [] },
    tpList: [],
    moduleList: [],
    kuisList: [],
    activityList: [],
    templateList: [],
    activePanel: 'dashboard',
    teacherMode: false,
    saveToStorage: () => {},
    loadFromStorage: () => {},
    newProject: () => {},
    setActivePanel: () => {},
    setMeta: () => {},
  };
  const useAuthoringStore = Object.assign(
    (selector?: (s: Record<string, unknown>) => unknown) =>
      selector ? selector(fakeState) : fakeState,
    {
      getState: () => fakeState,
      setState: () => {},
    }
  );
  return { useAuthoringStore };
});

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({ dirty: false }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: {
    filterByCapability: () => [],
  },
}));

// ─────────────────────────────────────────────────────────────────
// Real imports
// ─────────────────────────────────────────────────────────────────

import RecoveryDialog from '@/components/shared/RecoveryDialog';
import { bootRecoveryOrchestrator } from '@/core/editor/boot-recovery';
import { useCanvaStore } from '@/store/canva-store';
import type { CanvaPage, ScreenSchema } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ─────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────

function makePage(id: string): CanvaPage {
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
  };
}

function makePageWithBlocks(id: string): CanvaPage {
  const schema: ScreenSchema = {
    id: `schema-${id}`,
    templateType: 'materi',
    blocks: [
      {
        id: `block-${id}-1`,
        type: 'materi-section',
        variant: 'A',
        layout: { position: 'flow' },
        title: 'Section 1',
        body: 'Body content',
      },
      {
        id: `block-${id}-2`,
        type: 'materi-section',
        variant: 'B',
        layout: { position: 'flow' },
        title: 'Section 2',
        body: 'Body content 2',
      },
    ],
  };
  return {
    ...makePage(id),
    schema,
  };
}

const CRASH_RECOVERY_KEY = 'silse_incomplete_transaction';
function seedCrashRecovery(): void {
  const recoveryData = {
    transactionId: 'test-txn-001',
    beganAt: Date.now(),
    preSnapshot: { id: 'schema-test', templateType: 'materi', blocks: [] },
  };
  sessionStorage.setItem(CRASH_RECOVERY_KEY, JSON.stringify(recoveryData));
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5A-Patch-1 — Clean Boot Regression (no false-positive recovery)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useCanvaStore.setState({
      appMode: 'edit',
      currentPageIndex: 0,
      pages: [makePage('p1')],
      selectedBlockId: null,
      selectedBlockIds: [],
      selectedBlockType: null,
      hoveredBlockId: null,
      editingBlockId: null,
      selectedElId: null,
      selectedElIds: [],
      panelRequest: null,
    } as never);
  });

  afterEach(() => {
    cleanup();
  });

  // ── P0 regression: clean valid boot → needsRecovery=false ────

  it('orchestrator.run() with a clean valid page returns needsRecovery=false', () => {
    const page = makePage('p1');
    const report = bootRecoveryOrchestrator.run([page]);
    expect(report.needsRecovery).toBe(false);
    expect(report.severity).toBe('clean');
    expect(report.schemaHealing.neededHealing).toBe(false);
    expect(report.transactionRecovery.hasIncompleteTransaction).toBe(false);
    expect(report.integrity.status).not.toBe('corrupted');
    expect(report.safeMode.safeBlockCount).toBe(0);
  });

  it('orchestrator.run() with multiple clean pages returns needsRecovery=false', () => {
    const pages = [makePage('p1'), makePage('p2'), makePage('p3')];
    const report = bootRecoveryOrchestrator.run(pages);
    expect(report.needsRecovery).toBe(false);
    expect(report.severity).toBe('clean');
    // healedPages should be the same count as input
    expect(report.healedPages.length).toBe(3);
  });

  it('orchestrator.run() with pages that have non-trivial blocks returns needsRecovery=false', () => {
    const pages = [makePageWithBlocks('p1'), makePageWithBlocks('p2')];
    const report = bootRecoveryOrchestrator.run(pages);
    expect(report.needsRecovery).toBe(false);
    expect(report.severity).toBe('clean');
    expect(report.schemaHealing.neededHealing).toBe(false);
  });

  // ── P0 regression: RecoveryDialog does NOT render on clean boot

  it('RecoveryDialog does NOT render on clean boot (no bootReport, no localStorage data)', () => {
    const { container } = render(<RecoveryDialog />);
    expect(container.firstChild).toBeNull();
  });

  it('RecoveryDialog does NOT render when bootReport.needsRecovery=false (real orchestrator)', () => {
    const page = makePage('p1');
    const report = bootRecoveryOrchestrator.run([page]);
    expect(report.needsRecovery).toBe(false); // sanity check

    const { container } = render(<RecoveryDialog bootReport={report} />);
    expect(container.firstChild).toBeNull();
  });

  // ── Positive case: real incomplete transaction still triggers dialog

  it('RecoveryDialog DOES render when bootReport has real incomplete transaction', async () => {
    seedCrashRecovery();
    const page = makePage('p1');
    const report = bootRecoveryOrchestrator.run([page]);
    expect(report.needsRecovery).toBe(true);
    expect(report.transactionRecovery.hasIncompleteTransaction).toBe(true);

    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush effects */ });

    expect(screen.queryByText('Pemulihan Boot Aman')).not.toBeNull();
  });

  it('orchestrator.run() with crash recovery data returns needsRecovery=true', () => {
    seedCrashRecovery();
    const page = makePage('p1');
    const report = bootRecoveryOrchestrator.run([page]);
    expect(report.needsRecovery).toBe(true);
    expect(report.transactionRecovery.hasIncompleteTransaction).toBe(true);
    expect(report.severity).not.toBe('clean');
  });
});
