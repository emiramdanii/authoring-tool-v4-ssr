'use client';

// ═══════════════════════════════════════════════════════════════
// STORE INIT — Client-side store subscription initialization
// ═══════════════════════════════════════════════════════════════
// This component initializes the canva store on mount:
//   1. Restores previous session from localStorage (loadFromStorage)
//   2. Wires up subscriptions (auto-sync, auto-save, undo/redo, etc.)
//   3. Registers service worker (production only)
//   4. Initializes offline sync auto-flush
//
// It must be rendered inside the ThemeProvider (client component tree)
// so that all store modules have been loaded before initialization.
//
// [G.4] Added cleanup on unmount for all subscriptions and timers.

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

    // 3. Warm BlockCapabilityRegistry cache — eagerly load all block type
    //    capabilities so first render doesn't pay the derivation cost.
    BlockCapabilityRegistry.getAll();

    // 4. Preload sound effects so they play instantly on first interaction
    preloadSounds();

    // 5. Initialize offline sync auto-flush (replays queued saves when online)
    const cleanupAutoFlush = initAutoFlush();

    // [G.4] Cleanup on unmount — unsubscribes all store subscriptions,
    // clears timers, and resets initialization state so the store
    // can be safely re-initialized if the component remounts.
    return () => {
      cleanupAutoFlush();
      cleanupCanvaStoreSubscriptions();
      _initCalled = false;
    };
  }, []);

  return null;
}
