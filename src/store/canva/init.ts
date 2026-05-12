// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Initialization (deferred subscriptions)
// ═══════════════════════════════════════════════════════════════
// This module is separated from store.ts and interactive-store.ts
// to break circular dependencies. The store modules export their
// stores without any side effects; this module wires up the
// subscriptions that reference the stores *after* all modules
// have been fully evaluated.
//
// Call initCanvaStoreSubscriptions() once from the app entry
// point (layout.tsx or a top-level client component).

import { useCanvaStore } from './store';
import { startAutoSync } from './sync-slice';
import { connectHistoryToEditBus } from '@/core/editor/patch-history';
import { setCanvaStoreRef, startInteractiveCanvaSync } from '@/store/interactive-store';

let _initialized = false;

/**
 * Initialize canva store subscriptions.
 * Must be called once after the app mounts (client-side only).
 *
 * Wires:
 *   1. Authoring store → canva store auto-sync
 *   2. EditBus → PatchHistory for undo/redo
 *   3. Canva store ref → interactive store (breaks circular dep)
 *   4. Canva store pages → interactive store totalPages sync
 */
export function initCanvaStoreSubscriptions() {
  if (_initialized) return;
  if (typeof window === 'undefined') return;
  _initialized = true;

  // Inject canva store reference into interactive store
  // This breaks the circular import between the two modules
  setCanvaStoreRef(useCanvaStore);

  // Auto-sync: when authoring data changes, sync canva templateData
  startAutoSync(() => useCanvaStore.getState().syncTemplateData());

  // Patch-based undo/redo: record immer patches from editBus
  connectHistoryToEditBus();

  // Sync canva page count → interactive store totalPages
  startInteractiveCanvaSync();
}
