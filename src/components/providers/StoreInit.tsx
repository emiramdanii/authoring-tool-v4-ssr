'use client';

// ═══════════════════════════════════════════════════════════════
// STORE INIT — Client-side store subscription initialization
// ═══════════════════════════════════════════════════════════════
// This component initializes the canva store on mount:
//   1. Restores previous session from localStorage (loadFromStorage)
//   2. Wires up subscriptions (auto-sync, auto-save, undo/redo, etc.)
//
// It must be rendered inside the ThemeProvider (client component tree)
// so that all store modules have been loaded before initialization.

import { useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { initCanvaStoreSubscriptions } from '@/store/canva/init';
import { preloadSounds } from '@/lib/sounds';
import { BlockCapabilityRegistry } from '@/core/schema/capability-registry';

let _initCalled = false;

export function StoreInit() {
  useEffect(() => {
    if (!_initCalled) {
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
    }
  }, []);

  return null;
}
