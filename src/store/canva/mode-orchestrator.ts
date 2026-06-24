// ═══════════════════════════════════════════════════════════════════
// MODE ORCHESTRATOR — Cross-store reset on mode switch
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2-Patch-2 — Senior Review P0-1 fix
//
// `resetCrossStoreStateForMode(nextMode)` is the SINGLE orchestrator
// that coordinates cross-store resets when the user switches app mode.
// It is called by `setAppMode` after the canva store's own selection
// state is cleared.
//
// ═══════════════════════════════════════════════════════════════════
// PATCH-2 COLD-START FIX
// ═══════════════════════════════════════════════════════════════════
// Previous implementation (8.2S-2-Patch) used lazy dynamic import:
//
//   if (!_interactiveStore || !_learningMediaStore) {
//     void resolveStores();  // async, fire-and-forget
//     return;                // silent no-op on first call
//   }
//
// This was a P0 production bug (Senior Review 8.2S-2-Patch P0-1).
// On a fresh app launch, if the user immediately entered Present or
// Learn, the orchestrator refs were still null (dynamic import hadn't
// resolved yet), so the cross-store reset was silently skipped.
//
// The 19 acceptance tests passed only because they injected refs
// synchronously via `__setOrchestratorStoreRefsForTest` — masking
// the production cold-start failure.
//
// PATCH-2 FIX:
//   1. Replace lazy dynamic import with EXPLICIT bootstrap registration.
//      `configureModeOrchestrator({ interactive, learning })` must be
//      called once during app initialization (same place as
//      `setCanvaStoreRef`). See `init.ts`.
//   2. If `resetCrossStoreStateForMode` is called before configuration,
//      it throws (production) or logs error + skip (test). It NEVER
//      silently no-ops.
//   3. New cold-start tests verify production behavior without using
//      the test-only injection helper.
//
// Lifecycle rules (from docs/MODE_LIFECYCLE_CONTRACT.md):
//
//   Entering Edit       → reset interactive runtime (scores)
//   Entering Preview    → no cross-store reset (scores allowed during preview)
//   Entering Present    → reset interactive runtime (fresh playback)
//   Entering Export     → reset interactive runtime (non-interactive)
//   Entering Learn      → reset learnSubMode to 'play' (default)
// ═══════════════════════════════════════════════════════════════════

import type { AppMode } from '@/components/canva/types';

// ─────────────────────────────────────────────────────────────────
// Store API types (only the methods we need)
// ─────────────────────────────────────────────────────────────────

export interface InteractiveStoreApi {
  resetAllScores: () => void;
}

export interface LearningMediaStoreApi {
  setLearnSubMode: (mode: 'play' | 'edit') => void;
}

export interface ModeOrchestratorConfig {
  interactive: InteractiveStoreApi;
  learning: LearningMediaStoreApi;
}

// ─────────────────────────────────────────────────────────────────
// Module-level state (singletons — set once at bootstrap)
// ─────────────────────────────────────────────────────────────────

let _interactiveStore: InteractiveStoreApi | null = null;
let _learningMediaStore: LearningMediaStoreApi | null = null;
let _configured = false;

/**
 * Configure the mode orchestrator with the production store instances.
 *
 * MUST be called once during app initialization, in the same place
 * that `setCanvaStoreRef(useCanvaStore)` is called. See
 * `src/store/canva/init.ts` `initCanvaStoreSubscriptions()`.
 *
 * After this call, `resetCrossStoreStateForMode()` will synchronously
 * reset cross-store state on every mode switch. No lazy imports, no
 * silent no-ops.
 *
 * Idempotent: calling again with the same refs is a no-op. Calling
 * with different refs replaces the previous ones (useful for tests
 * that need to swap stores between cases).
 */
export function configureModeOrchestrator(config: ModeOrchestratorConfig): void {
  _interactiveStore = config.interactive;
  _learningMediaStore = config.learning;
  _configured = true;
}

/**
 * Returns true if `configureModeOrchestrator` has been called.
 * Useful for tests that need to verify the unconfigured state.
 */
export function isModeOrchestratorConfigured(): boolean {
  return _configured;
}

/**
 * Reset the orchestrator to the unconfigured state.
 *
 * TEST-ONLY: used by cold-start tests to verify the throw-on-unconfigured
 * behavior. Production code should NEVER call this — once configured,
 * the orchestrator stays configured for the app's lifetime.
 */
export function __resetModeOrchestratorForTest(): void {
  _interactiveStore = null;
  _learningMediaStore = null;
  _configured = false;
}

/**
 * Synchronous orchestrator entry point. Called by `setAppMode`.
 *
 * BEHAVIOR:
 *   - If configured: synchronously reset cross-store state per the
 *     lifecycle rules below.
 *   - If NOT configured: throw an Error. This is a programming error
 *     — `configureModeOrchestrator` should have been called at app
 *     bootstrap. Failing loudly prevents the silent cold-start bug
 *     from recurring.
 *
 * Lifecycle rules:
 *   - Edit/Export/Present → reset interactive scores (fresh start)
 *   - Learn → reset learnSubMode to 'play' (default)
 *
 * Why throw instead of fail-safe log?
 *   The Senior Review explicitly said: "jangan diam-diam skip reset".
 *   A throw in production would surface as an uncaught error in the
 *   browser console — visible to developers, not silent. If we want
 *   fail-safe behavior in production, the caller (`setAppMode`) can
 *   wrap this in try/catch and log. But the orchestrator itself
 *   must NOT silently skip.
 */
export function resetCrossStoreStateForMode(nextMode: AppMode): void {
  if (!_configured || !_interactiveStore || !_learningMediaStore) {
    throw new Error(
      '[mode-orchestrator] resetCrossStoreStateForMode called before configureModeOrchestrator(). ' +
      'This is a bootstrap bug — configureModeOrchestrator must be called during app init, ' +
      'in the same place as setCanvaStoreRef. See src/store/canva/init.ts.'
    );
  }

  // Entering Edit → reset interactive runtime (scores from previous
  // preview/present session should not leak).
  // Fixes M-001.
  if (nextMode === 'edit' || nextMode === 'export' || nextMode === 'present') {
    _interactiveStore.resetAllScores();
  }

  // Entering Learn → reset learnSubMode to 'play' (default).
  // Fixes M-002.
  if (nextMode === 'learn') {
    _learningMediaStore.setLearnSubMode('play');
  }
}
