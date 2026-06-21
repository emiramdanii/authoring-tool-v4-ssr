'use client';

// ═══════════════════════════════════════════════════════════════
// STORE INIT — Client-side store subscription initialization
// ═══════════════════════════════════════════════════════════════
// This component initializes the canva store on mount:
//   1. Restores previous session from localStorage (loadFromStorage)
//   2. Wires up subscriptions (auto-sync, auto-save, undo/redo, etc.)
//   3. Registers service worker (production only)
//   4. Initializes offline sync auto-flush
//   5. Defers non-critical warmup to idle callback (OPTIMIZE-LAST-01)
//
// It must be rendered inside the ThemeProvider (client component tree)
// so that all store modules have been loaded before initialization.
//
// [G.4] Added cleanup on unmount for all subscriptions and timers.
// [OPTIMIZE-LAST-01] BlockCapabilityRegistry warmup + preloadSounds
// deferred to requestIdleCallback so first paint isn't blocked.

import { useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { initCanvaStoreSubscriptions, cleanupCanvaStoreSubscriptions } from '@/store/canva/init';
import { preloadSounds } from '@/lib/sounds';
import { BlockCapabilityRegistry } from '@/core/schema/capability-registry';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { initAutoFlush } from '@/lib/offline-sync';

let _initCalled = false;

export function StoreInit() {
  // Register service worker (production only) and monitor online/offline
  useServiceWorker();

  useEffect(() => {
    if (_initCalled) return;
    _initCalled = true;

    // 1. Restore previous session from localStorage
    const restored = useCanvaStore.getState().loadFromStorage();
    if (restored) {
      useCanvaStore.setState({ _saveStatus: 'saved' });
    }

    // 2. Wire up subscriptions (auto-sync, auto-save, etc.)
    initCanvaStoreSubscriptions();

    // 3. Initialize offline sync auto-flush (replays queued saves when online)
    const cleanupAutoFlush = initAutoFlush();

    // 4. Defer non-critical warmup to idle callback — these don't block
    //    first paint but were previously running synchronously on boot.
    //    OPTIMIZE-LAST-01: moved out of the critical boot path.
    let idleHandle: ReturnType<typeof requestIdleCallback> | null = null;
    const scheduleIdleWarmup = () => {
      // requestIdleCallback may not exist in older browsers / SSR — fallback to setTimeout
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(() => {
          // Warm BlockCapabilityRegistry cache — eagerly load all block type
          // capabilities so first render doesn't pay the derivation cost.
          // Safe to defer: capabilities are derived lazily on first use anyway.
          try {
            BlockCapabilityRegistry.getAll();
          } catch { /* registry not ready yet — will derive on first use */ }

          // Preload sound effects so they play instantly on first interaction.
          // Already gated by isEnabled('soundEffects') which defaults to false,
          // so this is effectively a no-op in current config — but keep the
          // call for when sounds are re-enabled.
          try {
            preloadSounds();
          } catch { /* audio not available — silent fail */ }
        });
      } else {
        // Fallback: setTimeout with 1500ms delay (after first paint + interaction window)
        idleHandle = setTimeout(() => {
          try { BlockCapabilityRegistry.getAll(); } catch { /* noop */ }
          try { preloadSounds(); } catch { /* noop */ }
        }, 1500) as unknown as ReturnType<typeof requestIdleCallback>;
      }
    };
    scheduleIdleWarmup();

    // [G.4] Cleanup on unmount — unsubscribes all store subscriptions,
    // clears timers, and resets initialization state so the store
    // can be safely re-initialized if the component remounts.
    return () => {
      if (idleHandle !== null) {
        if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle as unknown as number);
        } else {
          clearTimeout(idleHandle as unknown as ReturnType<typeof setTimeout>);
        }
      }
      cleanupAutoFlush();
      cleanupCanvaStoreSubscriptions();
      _initCalled = false;
    };
  }, []);

  return null;
}
