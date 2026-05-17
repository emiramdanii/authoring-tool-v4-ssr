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
//
// [G.4] All subscriptions are now tracked via SubscriptionManager
// to prevent memory leaks from unclosed subscriptions.

import { useCanvaStore } from './store';
import { startAutoSync, stopAutoSync } from './sync-slice';
import { connectHistoryToEditBus } from '@/core/editor/patch-history';
import { setCanvaStoreRef, startInteractiveCanvaSync, stopInteractiveCanvaSync } from '@/store/interactive-store';
import { subscriptionManager } from './subscription-manager';
import { deriveProjectionFromPages } from '@/core/schema/schema-projection';
import { useAuthoringStore } from '@/store/authoring-store';

let _initialized = false;

// ── Auto-save debounce state ──────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DELAY = 1000; // 1 second debounce

// ── Projection sync debounce state ────────────────────────────
let projectionTimer: ReturnType<typeof setTimeout> | null = null;
const PROJECTION_SYNC_DELAY = 300; // 300ms debounce — faster than save
let _projectionSyncing = false; // Guard against sync loops

/**
 * Start debounced auto-save to localStorage.
 * [G.4] Subscription tracked via SubscriptionManager.
 *
 * Subscribes to `pages` and `ratioId` changes only (NOT `_saveStatus`)
 * to prevent infinite loops. When a change is detected:
 *   1. Sets `_saveStatus` to `'saving'` immediately (UI feedback)
 *   2. Debounces for 1 second, then calls `saveToStorage()`
 *   3. Sets `_saveStatus` to `'saved'` after successful save
 */
function startAutoSave() {
  const unsub = useCanvaStore.subscribe(
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

  // [G.4] Track subscription for cleanup
  subscriptionManager.registerSubscription('auto-save-pages', unsub);
}

/**
 * Start reactive Schema → Projection sync.
 *
 * When page schemas change (user edits in canvas), this debounced
 * subscription re-derives the projection and pushes it to the
 * authoring store. This keeps the Konten panel in sync with
 * schema edits made via the canvas.
 *
 * Debounced at 300ms to coalesce rapid edits (e.g., typing) while
 * still being fast enough to feel responsive in the Konten panel.
 */
function startProjectionSync() {
  const unsub = useCanvaStore.subscribe(
    (state) => ({ pages: state.pages }),
    () => {
      // Debounced projection derivation — coalesces rapid schema edits
      if (projectionTimer) clearTimeout(projectionTimer);
      projectionTimer = setTimeout(() => {
        // Guard: prevent sync loop (projection → authoring → autoSync → pages → projection)
        if (_projectionSyncing) {
          projectionTimer = null;
          return;
        }
        _projectionSyncing = true;
        try {
          const pages = useCanvaStore.getState().pages;
          const projection = deriveProjectionFromPages(pages);
          // Only update fields that have values in the projection
          // This preserves authoring-only fields (CP, ATP, petunjuk, etc.)
          const updates: Record<string, unknown> = {};
          if (projection.meta) updates.meta = projection.meta;
          if (projection.tp) updates.tp = projection.tp;
          if (projection.alur) updates.alur = projection.alur;
          if (projection.kuis) updates.kuis = projection.kuis;
          if (projection.materi) updates.materi = projection.materi;
          if (projection.diskusi) updates.diskusi = projection.diskusi;
          if (projection.refleksi) updates.refleksi = projection.refleksi;
          if (projection.skenario) updates.skenario = projection.skenario;
          if (projection.motivasi) updates.motivasi = projection.motivasi;
          if (projection.rangkuman) updates.rangkuman = projection.rangkuman;

          if (Object.keys(updates).length > 0) {
            useAuthoringStore.setState(updates);
          }
        } catch (err) {
          console.warn('[ProjectionSync] Failed to derive projection:', err);
        }
        _projectionSyncing = false;
        projectionTimer = null;
      }, PROJECTION_SYNC_DELAY);
    },
    { equalityFn: (a, b) => a.pages === b.pages }
  );

  subscriptionManager.registerSubscription('projection-sync', unsub);
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
 *   6. Canva store pages → Schema→Projection sync (keeps Konten panel live)
 */
export function initCanvaStoreSubscriptions() {
  if (_initialized) return;
  if (typeof window === 'undefined') return;
  _initialized = true;

  // Inject canva store reference into interactive store
  // This breaks the circular import between the two modules
  setCanvaStoreRef(useCanvaStore);

  // Auto-sync: when authoring data changes, sync canva templateData
  // [G.4] Track the auto-sync subscription
  startAutoSync(() => useCanvaStore.getState().syncTemplateData());
  // Note: startAutoSync manages its own _unsubscribe; we track
  // the cleanup via stopAutoSync() in cleanupCanvaStoreSubscriptions

  // Patch-based undo/redo: record immer patches from editBus
  // [G.4] Track the editBus subscription
  const editBusUnsub = connectHistoryToEditBus();
  subscriptionManager.registerSubscription('editbus-patch-history', editBusUnsub);

  // Sync canva page count → interactive store totalPages
  // [G.4] Track interactive canva sync
  startInteractiveCanvaSync();

  // Auto-save: debounce pages/ratioId changes → localStorage
  startAutoSave();

  // Schema → Projection sync: keeps Konten panel in sync with canvas edits
  startProjectionSync();
}

/**
 * [G.4] Cleanup all canva store subscriptions.
 * Call this on component unmount or page navigation to prevent
 * memory leaks from unclosed subscriptions.
 */
export function cleanupCanvaStoreSubscriptions() {
  // Clean up managed subscriptions via SubscriptionManager
  subscriptionManager.cleanupAll();

  // Clean up auto-sync subscription (managed by sync-slice module)
  stopAutoSync();

  // Clean up interactive store canva sync subscription
  stopInteractiveCanvaSync();

  // Clear any pending save timer
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  // Clear any pending projection sync timer
  if (projectionTimer) {
    clearTimeout(projectionTimer);
    projectionTimer = null;
  }

  _initialized = false;
}
