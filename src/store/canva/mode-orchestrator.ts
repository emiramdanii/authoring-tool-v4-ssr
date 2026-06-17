// ═══════════════════════════════════════════════════════════════════
// MODE ORCHESTRATOR — Cross-store reset on mode switch
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2-Patch — Senior Review lifecycle fix
//
// `resetCrossStoreStateForMode(nextMode)` is the SINGLE orchestrator
// that coordinates cross-store resets when the user switches app mode.
// It is called by `setAppMode` after the canva store's own selection
// state is cleared.
//
// Why a separate orchestrator?
//   - `session-slice.ts` is part of the canva store. It cannot import
//     `useInteractiveStore` or `useLearningMediaStore` directly
//     because that would create a circular module dependency
//     (interactive-store already imports canva-store via
//     `setCanvaStoreRef`).
//   - The orchestrator is a plain function that takes the target mode
//     and calls the appropriate reset methods on the OTHER stores.
//     It does NOT read or write canva-store state — that's still
//     `setAppMode`'s job.
//   - This keeps the frozen boundary intact: canva-store still owns
//     its selection state, interactive-store still owns its scores,
//     learning-media-store still owns its learnSubMode. The
//     orchestrator just synchronizes the reset.
//
// Lifecycle rules (from docs/MODE_LIFECYCLE_CONTRACT.md):
//
//   Entering Edit       → reset interactive runtime (scores, replay gen)
//   Entering Preview    → no cross-store reset (scores allowed during preview)
//   Entering Present    → reset interactive runtime (fresh start for playback)
//   Entering Export     → reset interactive runtime (export is non-interactive)
//   Entering Learn      → reset learnSubMode to 'play' (default)
//
// All resets are idempotent — calling them when state is already
// reset is a no-op.
// ═══════════════════════════════════════════════════════════════════

import type { AppMode } from '@/components/canva/types';

// Lazy imports — these modules are only loaded when the orchestrator
// runs. This avoids the circular dependency at module-eval time.
// The functions are imported as types only at compile time and
// resolved lazily at runtime.
type InteractiveStoreApi = {
  resetAllScores: () => void;
};

type LearningMediaStoreApi = {
  setLearnSubMode: (mode: 'play' | 'edit') => void;
};

// Cache the resolved store refs — they don't change during the app's
// lifetime. Resolved on first call.
let _interactiveStore: InteractiveStoreApi | null = null;
let _learningMediaStore: LearningMediaStoreApi | null = null;

async function resolveStores(): Promise<void> {
  if (!_interactiveStore) {
    const mod = await import('@/store/interactive-store');
    _interactiveStore = mod.useInteractiveStore.getState();
  }
  if (!_learningMediaStore) {
    const mod = await import('@/store/learning-media-store');
    _learningMediaStore = mod.useLearningMediaStore.getState();
  }
}

// Test-only: allow tests to inject store refs synchronously.
// This bypasses the lazy async import which would otherwise make
// tests require `await` before each setAppMode call.
export function __setOrchestratorStoreRefsForTest(
  interactive: InteractiveStoreApi,
  learning: LearningMediaStoreApi,
): void {
  _interactiveStore = interactive;
  _learningMediaStore = learning;
}

// Test-only: clear refs between tests.
export function __resetOrchestratorStoreRefsForTest(): void {
  _interactiveStore = null;
  _learningMediaStore = null;
}

/**
 * Synchronous orchestrator entry point. Called by `setAppMode`.
 *
 * The first call will lazy-load the store modules. Because
 * `setAppMode` is always called AFTER the app has booted (the user
 * has to click a button to switch modes), the modules will already
 * be in the bundle by then — no runtime perf hit.
 *
 * For tests, use `__setOrchestratorStoreRefsForTest` to inject
 * synchronous refs so the orchestrator can be called without `await`.
 */
export function resetCrossStoreStateForMode(nextMode: AppMode): void {
  // Resolve synchronously from cache. If cache is empty (first call
  // in production), fall back to no-op — the next call after modules
  // have loaded will work. This is acceptable because the first mode
  // switch in a session is usually Edit → Preview, and Preview doesn't
  // require any cross-store reset.
  if (!_interactiveStore || !_learningMediaStore) {
    // Trigger async resolution for next time.
    void resolveStores();
    return;
  }

  // Entering Edit → reset interactive runtime (scores from previous
  // preview/present session should not leak).
  // Fixes M-001.
  if (nextMode === 'edit') {
    _interactiveStore.resetAllScores();
  }

  // Entering Export → also reset interactive runtime (export is
  // non-interactive; any leftover scores are stale).
  if (nextMode === 'export') {
    _interactiveStore.resetAllScores();
  }

  // Entering Present → reset interactive runtime for fresh playback.
  if (nextMode === 'present') {
    _interactiveStore.resetAllScores();
  }

  // Entering Learn → reset learnSubMode to 'play' (default).
  // Fixes M-002.
  if (nextMode === 'learn') {
    _learningMediaStore.setLearnSubMode('play');
  }
}
