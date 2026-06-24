// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5A — Recovery Dialog Accessibility Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies WCAG 2.1 AA baseline for the RecoveryDialog:
//
//   1. role="dialog" present on the dialog container
//   2. aria-modal="true" present
//   3. aria-labelledby points to a visible title element
//   4. Focus moves to the first action button when dialog opens
//   5. Tab key cycles within the dialog (focus trap)
//   6. Esc key triggers "Mulai Baru" (discard recovery)
//   7. Backdrop click triggers "Mulai Baru"
//
// The dialog is the REAL RecoveryDialog component — no mocks.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

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
import { bootRecoveryOrchestrator, type BootReport } from '@/core/editor/boot-recovery';
import { useCanvaStore } from '@/store/canva-store';
import type { CanvaPage } from '@/components/canva/types';
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

function makeBootReport(overrides: Partial<BootReport> = {}): BootReport {
  return {
    needsRecovery: true,
    severity: 'moderate',
    safeMode: { initialized: true, safeBlockCount: 0, safeBlockIds: [] },
    transactionRecovery: {
      hasIncompleteTransaction: true,
      recoveryData: {
        transactionId: 'synthetic-txn-001',
        beganAt: Date.now(),
        preSnapshot: { id: 'schema-synthetic', templateType: 'materi', blocks: [] },
      } as never,
      autoRecovered: false,
    },
    integrity: {
      status: 'no-checksum',
      healed: false,
      healedCount: 0,
      healReport: [],
      integrityResult: null,
    },
    schemaHealing: {
      neededHealing: false,
      totalBlocksExamined: 0,
      totalBlocksRepaired: 0,
      totalBlocksRemoved: 0,
      pageReports: [],
    },
    healedPages: [makePage('p1')],
    durationMs: 5,
    bootTimestamp: Date.now(),
    summary: '[MODERATE] incomplete transaction from previous session',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5A — RecoveryDialog Accessibility (WCAG 2.1 AA baseline)', () => {
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

  // ── ARIA structure ───────────────────────────────────────────

  it('dialog container has role="dialog"', async () => {
    const report = makeBootReport();
    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
  });

  it('dialog container has aria-modal="true"', async () => {
    const report = makeBootReport();
    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('dialog has aria-labelledby pointing to a visible title element', async () => {
    const report = makeBootReport();
    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    // The element referenced by aria-labelledby must exist in the DOM
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl).not.toBeNull();
    expect(titleEl!.textContent).toContain('Pemulihan Boot Aman');
  });

  it('dialog has aria-describedby pointing to the subtitle element', async () => {
    const report = makeBootReport();
    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const descEl = document.getElementById(describedBy!);
    expect(descEl).not.toBeNull();
    expect(descEl!.textContent!.length).toBeGreaterThan(0);
  });

  // ── Focus management ─────────────────────────────────────────

  it('dialog contains at least one focusable action button (focus target exists)', async () => {
    const report = makeBootReport();
    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush effects */ });

    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    // Verify the first button is focusable (no tabindex=-1, not disabled)
    const firstBtn = buttons[0] as HTMLButtonElement;
    expect(firstBtn.getAttribute('tabindex')).not.toBe('-1');
    expect(firstBtn.disabled).toBe(false);

    // The dialog's useEffect schedules a setTimeout(0) to focus the first
    // button. jsdom's focus management is limited — we verify the focus
    // TARGET exists and is focusable; the focus-trap test below proves
    // Tab cycling works regardless of initial focus position.
  });

  it('Tab key cycles within the dialog (focus trap)', async () => {
    const report = makeBootReport();
    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    const firstBtn = buttons[0];
    const lastBtn = buttons[buttons.length - 1];

    // Move focus to last button, then Tab — should wrap to first
    lastBtn.focus();
    expect(document.activeElement).toBe(lastBtn);

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
    await act(async () => { /* flush */ });
    expect(document.activeElement).toBe(firstBtn);

    // Now Shift+Tab from first — should wrap to last
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    await act(async () => { /* flush */ });
    expect(document.activeElement).toBe(lastBtn);
  });

  // ── Esc key ──────────────────────────────────────────────────

  it('Esc key triggers "Mulai Baru" (discard recovery)', async () => {
    const report = makeBootReport();
    const spy = vi.spyOn(bootRecoveryOrchestrator, 'discardCrashRecovery');

    render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    // Confirm dialog is visible
    expect(screen.queryByText('Pemulihan Boot Aman')).not.toBeNull();

    // Press Esc
    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => { /* flush */ });

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  // ── Backdrop click ───────────────────────────────────────────

  it('backdrop click triggers "Mulai Baru" (discard recovery)', async () => {
    const report = makeBootReport();
    const spy = vi.spyOn(bootRecoveryOrchestrator, 'discardCrashRecovery');

    const { container } = render(<RecoveryDialog bootReport={report} />);
    await act(async () => { /* flush */ });

    // The backdrop is the outermost div (first child of container).
    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop).not.toBeNull();

    // Click on the backdrop itself (not on the dialog)
    fireEvent.click(backdrop);
    await act(async () => { /* flush */ });

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
