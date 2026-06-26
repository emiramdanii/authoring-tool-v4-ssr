// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.5B — Accessibility Smoke Tests
// ═══════════════════════════════════════════════════════════════════
// WCAG 2.1 AA baseline a11y smoke tests for:
//   1. SkipNavLink — keyboard-accessible skip-to-content link
//   2. A11yProvider — context provides reducedMotion / highContrast
//   3. useGameA11y hook — ARIA label, progressbar, live region, announce
//   4. RecoveryDialog — role=dialog, aria-modal, focus trap (cross-cover)
//   5. AuthoringTool shell landmarks — <aside role=navigation>, role=main
//   6. Root layout a11y plumbing — SkipNavLink + LiveAnnouncer wired
//
// These are SMOKE tests — they verify the basic a11y contract is
// present. They are NOT a substitute for full axe-core audits, which
// are out of scope for 8.5B (would require Playwright + axe integration).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────
// matchMedia polyfill — jsdom does not implement it by default.
// A11yProvider uses window.matchMedia('(prefers-reduced-motion: reduce)')
// and ('(prefers-contrast: more)') at mount time.
// ─────────────────────────────────────────────────────────────────

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Mocks (same shape as recovery-boot-bridge for RecoveryDialog tests)
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
    getState: () => ({ dirty: false }), setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

// ─────────────────────────────────────────────────────────────────
// Real imports
// ─────────────────────────────────────────────────────────────────

import { SkipNavLink } from '@/components/shared/SkipNavLink';
import { A11yProvider, useA11yPreferences } from '@/components/providers/A11yProvider';
import { useGameA11y } from '@/lib/use-game-a11y';
// BATCH-12-04: RecoveryDialog moved to legacy-disabled — import + tests removed

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeBootReport(overrides: Partial<BootReport> = {}): BootReport {
  return {
    needsRecovery: true, severity: 'moderate',
    safeMode: { initialized: true, safeBlockCount: 0, safeBlockIds: [] },
    transactionRecovery: {
      hasIncompleteTransaction: true,
      recoveryData: {
        transactionId: 'synthetic-txn-001', beganAt: Date.now(),
        preSnapshot: { id: 'schema-synthetic', templateType: 'materi', blocks: [] },
      } as never,
      autoRecovered: false,
    },
    integrity: { status: 'no-checksum', healed: false, healedCount: 0, healReport: [], integrityResult: null },
    schemaHealing: { neededHealing: false, totalBlocksExamined: 0, totalBlocksRepaired: 0, totalBlocksRemoved: 0, pageReports: [] },
    healedPages: [],
    durationMs: 5, bootTimestamp: Date.now(),
    summary: '[MODERATE] incomplete transaction from previous session',
    ...overrides,
  };
}

// Tiny harness that exposes useA11yPreferences value
function A11yProbe() {
  const prefs = useA11yPreferences();
  return <div data-testid="a11y-probe">{JSON.stringify(prefs)}</div>;
}

// Tiny harness that exposes useGameA11y return value
function GameA11yProbe({ score, maxScore, interactive }: { score: number; maxScore: number; interactive: boolean }) {
  const a11y = useGameA11y({
    gameType: 'Test Game',
    blockId: 'test-block',
    score,
    maxScore,
    interactive,
  });
  return (
    <div data-testid="game-a11y-probe">
      <span data-testid="aria-label">{a11y.ariaLabel}</span>
      <span data-testid="instruction-id">{a11y.instructionId}</span>
      <span data-testid="root-aria">{JSON.stringify(a11y.rootAria)}</span>
      <span data-testid="progress-aria">{JSON.stringify(a11y.progressAria('Skor', score, maxScore))}</span>
      <span data-testid="live-aria">{JSON.stringify(a11y.liveAria('polite'))}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.5B — Accessibility Smoke Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  // ── SkipNavLink ──────────────────────────────────────────────

  it('SkipNavLink renders with href="#main-content" and visible-on-focus text', () => {
    render(<SkipNavLink />);
    const link = screen.getByText('Langsung ke konten');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#main-content');
    // sr-only + focus:not-sr-only classes are present
    expect(link.className).toContain('sr-only');
    expect(link.className).toContain('focus:not-sr-only');
  });

  it('SkipNavLink is keyboard-focusable (anchor with href is focusable by default)', () => {
    render(<SkipNavLink />);
    const link = screen.getByText('Langsung ke konten') as HTMLAnchorElement;
    expect(link.getAttribute('tabindex')).not.toBe('-1');
    // Anchor with href is inherently focusable
    expect(link.href).toBeTruthy();
  });

  // ── A11yProvider ─────────────────────────────────────────────

  it('A11yProvider provides default context (reducedMotion=false, highContrast=false)', () => {
    render(<A11yProvider><A11yProbe /></A11yProvider>);
    const probe = screen.getByTestId('a11y-probe');
    const prefs = JSON.parse(probe.textContent || '{}');
    // Default state before any media query effects — should be false
    expect(prefs.reducedMotion).toBe(false);
    expect(prefs.highContrast).toBe(false);
  });

  // ── useGameA11y hook ─────────────────────────────────────────

  it('useGameA11y generates ariaLabel with score and maxScore', () => {
    render(
      <A11yProvider>
        <GameA11yProbe score={3} maxScore={5} interactive={true} />
      </A11yProvider>
    );
    const label = screen.getByTestId('aria-label').textContent;
    expect(label).toContain('Test Game');
    expect(label).toContain('3');
    expect(label).toContain('5');
  });

  it('useGameA11y generates progressAria with role=progressbar + aria-valuenow', () => {
    render(
      <A11yProvider>
        <GameA11yProbe score={2} maxScore={4} interactive={true} />
      </A11yProvider>
    );
    const progressAria = JSON.parse(screen.getByTestId('progress-aria').textContent || '{}');
    expect(progressAria.role).toBe('progressbar');
    expect(progressAria['aria-valuenow']).toBe('2');
    expect(progressAria['aria-valuemin']).toBe('0');
    expect(progressAria['aria-valuemax']).toBe('4');
    expect(progressAria['aria-label']).toBe('Skor');
  });

  it('useGameA11y generates liveAria with aria-live=polite', () => {
    render(
      <A11yProvider>
        <GameA11yProbe score={0} maxScore={0} interactive={true} />
      </A11yProvider>
    );
    const liveAria = JSON.parse(screen.getByTestId('live-aria').textContent || '{}');
    expect(liveAria['aria-live']).toBe('polite');
  });

  it('useGameA11y generates unique instructionId for screen reader instructions', () => {
    render(
      <A11yProvider>
        <GameA11yProbe score={0} maxScore={0} interactive={true} />
      </A11yProvider>
    );
    const instructionId = screen.getByTestId('instruction-id').textContent;
    expect(instructionId).toBeTruthy();
    expect(instructionId).toContain('test-block'); // blockId-based
  });

  it('useGameA11y ariaLabel omits score when maxScore=0', () => {
    render(
      <A11yProvider>
        <GameA11yProbe score={0} maxScore={0} interactive={true} />
      </A11yProvider>
    );
    const label = screen.getByTestId('aria-label').textContent;
    expect(label).toBe('Test Game');
    expect(label).not.toContain('Skor');
  });

  // BATCH-12-04: RecoveryDialog test cases removed (component quarantined to legacy-disabled)
});
