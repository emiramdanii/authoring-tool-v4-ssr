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
import { useInteractiveStore } from '@/store/interactive-store';
import { useLearningMediaStore } from '@/store/learning-media-store';
// Sprint 8.2S-2-Patch-2 — configure mode orchestrator at bootstrap
// so resetCrossStoreStateForMode is synchronous (no lazy import, no
// cold-start silent no-op). See mode-orchestrator.ts P0-1 fix.
import { configureModeOrchestrator } from './mode-orchestrator';
import { logger } from '@/core/utils/logger';

let _initialized = false;

// ── Projection sync debounce state ────────────────────────────
// NOTE: Legacy auto-save timer (startAutoSave) removed in Sprint 6.1.
// Modern useAutoSave hook in use-auto-save.ts now handles ALL save logic
// (localStorage + DB + offline queue) with proper debounce.
let projectionTimer: ReturnType<typeof setTimeout> | null = null;
const PROJECTION_SYNC_DELAY = 300; // 300ms debounce — faster than save
let _projectionSyncing = false; // Guard against sync loops

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
          // Phase 5 P2: Game blocks → modules projection sync
          if (projection.modules) updates.modules = projection.modules;

          if (Object.keys(updates).length > 0) {
            useAuthoringStore.setState(updates);
          }
        } catch (err) {
          logger.warn('ProjectionSync', 'Failed to derive projection: ' + String(err));
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
 *   5. (REMOVED Sprint 6.1) Legacy auto-save timer — now handled by useAutoSave()
 *   6. Canva store pages → Schema→Projection sync (keeps Konten panel live)
 */
export function initCanvaStoreSubscriptions() {
  if (_initialized) return;
  if (typeof window === 'undefined') return;
  _initialized = true;

  // Inject canva store reference into interactive store
  // This breaks the circular import between the two modules
  setCanvaStoreRef(useCanvaStore);

  // Sprint 8.2S-2-Patch-2: Configure mode orchestrator synchronously
  // at bootstrap. This ensures resetCrossStoreStateForMode (called by
  // setAppMode) has the interactive + learning-media store refs ready
  // BEFORE the user can switch modes. Previous lazy-import approach
  // could silently skip reset on cold-start (Senior Review P0-1).
  configureModeOrchestrator({
    interactive: useInteractiveStore.getState(),
    learning: useLearningMediaStore.getState(),
  });

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

  // NOTE (Sprint 6.1): Legacy startAutoSave() REMOVED.
  // Modern useAutoSave() hook in CanvaAutoSaveSync.tsx handles all save:
  //   - localStorage (canva + authoring)
  //   - DB save (if projectId provided)
  //   - Offline queue
  //   - 2s debounce with 30s max-wait
  // The legacy 1s timer was redundant and caused dual-write race conditions.

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

  // Clear any pending projection sync timer
  if (projectionTimer) {
    clearTimeout(projectionTimer);
    projectionTimer = null;
  }

  _initialized = false;
}
