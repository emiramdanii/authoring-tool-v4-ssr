'use client';

// ═══════════════════════════════════════════════════════════════
// STORE INIT — Client-side store subscription initialization
// ═══════════════════════════════════════════════════════════════
// This component calls initCanvaStoreSubscriptions() once on mount.
// It must be rendered inside the ThemeProvider (client component tree)
// so that all store modules have been loaded before initialization.

import { useEffect } from 'react';
import { initCanvaStoreSubscriptions } from '@/store/canva/init';

let _initCalled = false;

export function StoreInit() {
  useEffect(() => {
    if (!_initCalled) {
      _initCalled = true;
      initCanvaStoreSubscriptions();
    }
  }, []);

  return null;
}
