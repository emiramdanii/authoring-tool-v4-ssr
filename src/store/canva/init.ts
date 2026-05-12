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

// ── Auto-save debounce state ──────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

/**
 * Start debounced auto-save to localStorage.
 *
 * Subscribes to `pages` and `ratioId` changes only (NOT `_saveStatus`)
 * to prevent infinite loops. When a change is detected:
 *   1. Sets `_saveStatus` to `'saving'` immediately (UI feedback)
 *   2. Debounces for 1 second, then calls `saveToStorage()`
 *   3. Sets `_saveStatus` to `'saved'` after successful save
 */
function startAutoSave() {
  useCanvaStore.subscribe(
    (state) => ({ pages: state.pages, ratioId: state.ratioId }),
    () => {
      // Set saving status immediately for UI feedback
      useCanvaStore.setState({ _saveStatus: 'saving' });

      // Debounced save — coalesces rapid changes into one write
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        useCanvaStore.getState().saveToStorage();
        // saveToStorage() sets _saveStatus: 'saved' internally on
        // both success and failure, so no need to set it here.
        saveTimer = null;
      }, AUTO_SAVE_DELAY);
    },
    { equalityFn: (a, b) => a.pages === b.pages && a.ratioId === b.ratioId }
  );
}

/**
 * Initialize canva store subscriptions.
 * Must be called once after the app mounts (client-side only).
 *
 * Wires:
 *   1. Authoring store → canva store auto-sync
 *   2. EditBus → PatchHistory for undo/redo
 *   3. Canva store ref → interactive store (breaks circular dep)
 *   4. Canva store pages → interactive store totalPages sync
 *   5. Canva store pages/ratioId → debounced auto-save to localStorage
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

  // Auto-save: debounce pages/ratioId changes → localStorage
  startAutoSave();
}
