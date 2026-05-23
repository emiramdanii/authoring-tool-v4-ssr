// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Reactive sync from authoring → canvas (FASE 3)
// ═══════════════════════════════════════════════════════════════
// ONE-WAY DATA FLOW:
//   Authoring Store → deriveSchema() → page.schema → Renderer → Canvas
//
// This replaces the old dual-path sync that used buildTemplateData().
// Now, when authoring data changes:
//   - Schema pages: page.schema is re-derived via deriveSchemaForPage()
//   - Unlocked pages: schema is frozen, only orphan cleanup runs
//   - Custom pages: only Layer 2/3 cleanup (no schema)
//
// Layers:
//   Layer 1: Schema re-derivation (deriveSchema) — ONE-WAY
//   Layer 2: Orphan cleanup (remove elements referencing deleted data)
//   Layer 3: Element ID re-sync (update moduleId/kuisId on elements)
//   Layer 4: Auto-subscription wiring (authoring store → syncSchema)
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaPage, CanvaElement } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_TYPES } from '@/lib/canva-constants';
import { isInteractiveElementType } from '@/core/schema/capability-registry';

export type SyncSlice = Pick<CanvaState, 'syncTemplateData'>;

export const createSyncSlice: StateCreator<CanvaState, [], [], SyncSlice> = (set, get) => ({
  /**
   * Sync canvas pages from the authoring store.
   *
   * FASE 3: Now uses deriveSchema() for one-way data flow:
   *   Authoring → deriveSchema() → page.schema → Renderer
   *
   * For schema-driven pages (page.schema exists), this re-derives
   * the schema from the current authoring state, preserving block IDs.
   * For legacy pages (no schema), falls back to buildTemplateData().
   * For unlocked pages, schema is frozen — only cleanup runs.
   */
  syncTemplateData: () => {
    const { pages } = get();
    const authStore = useAuthoringStore.getState();
    const allModuleIds = new Set(authStore.modules.map((m: { _id?: string }) => m._id).filter(Boolean));
    const allKuisIds = new Set(authStore.kuis.map((k: { _id?: string }) => k._id).filter(Boolean));
    let changed = false;

    const newPages = pages.map(page => {
      // ── Layer 1: Schema is now "owned" by the user ──
      // No more auto-sync overwrites. Schema edits persist until the user
      // explicitly refreshes via "Refresh Data dari Authoring" button.
      // The old locked/unlocked model is removed — schema is always canonical.

      // ── Layer 2: Orphan cleanup ───────────────────────────
      // Remove elements that reference deleted modules or kuis
      // (overlayElements is always empty at runtime — merged into elements on load)
      const cleanedElements = page.elements.filter(el => {
        if (el.moduleId && !allModuleIds.has(el.moduleId)) return false;
        if (el.kuisId && !allKuisIds.has(el.kuisId)) return false;
        return true;
      });

      const elementsChanged = cleanedElements.length !== page.elements.length;

      // ── Layer 3: Element ID re-sync ───────────────────────
      const syncElementIds = (els: CanvaElement[]): { result: CanvaElement[]; changed: boolean } => {
        let changed = false;
        const result = els.map(el => {
          // Use capability registry as single source of truth for interactive element detection.
          // Previously: hardcoded `el.type === 'game'` / `el.type === 'kuis'` checks.
          // Now: isInteractiveElementType() covers all interactive types, with
          // specific handling for game→moduleId and kuis→kuisId re-sync.
          if (isInteractiveElementType(el.type) && el.dataIdx != null && el.dataIdx >= 0) {
            // Game elements need moduleId re-sync
            if (el.type === 'game' && !el.moduleId) {
              const gameModules = authStore.modules.filter((m: Record<string, unknown>) =>
                (GAME_TYPES as readonly string[]).includes(m.type as string)
              );
              if (el.dataIdx < gameModules.length && gameModules[el.dataIdx]!._id) {
                changed = true;
                return { ...el, moduleId: gameModules[el.dataIdx]!._id as string };
              }
            }
            // Kuis elements need kuisId re-sync
            if (el.type === 'kuis' && !el.kuisId) {
              if (el.dataIdx < authStore.kuis.length && authStore.kuis[el.dataIdx]!._id) {
                changed = true;
                return { ...el, kuisId: authStore.kuis[el.dataIdx]!._id as string };
              }
            }
          }
          return el;
        });
        return { result, changed };
      };

      const syncedElements = syncElementIds(cleanedElements);
      const idsSynced = syncedElements.changed;

      if (!elementsChanged && !idsSynced) return page;

      changed = true;
      const result: CanvaPage = {
        ...page,
        elements: (elementsChanged || idsSynced) ? syncedElements.result : page.elements,
      };

      return result;
    });

    if (changed) {
      // Sync is auto-triggered, not a user action.
      // Update the current history snapshot so undo goes back
      // to the user's last manual action, not a stale pre-sync state.
      const { _history, _historyIdx } = get();
      if (_history.length > 0 && _historyIdx >= 0) {
        const updatedHistory = [..._history];
        updatedHistory[_historyIdx] = {
          ...updatedHistory[_historyIdx],
          // FIX: structuredClone with JSON fallback
          pages: (() => { try { return structuredClone(newPages); } catch { return JSON.parse(JSON.stringify(newPages)); } })(),
        };
        set({ pages: newPages, _history: updatedHistory });
      } else {
        set({ pages: newPages });
      }
    }
  },
});

// ═══════════════════════════════════════════════════════════════
// Layer 4: Auto-subscription wiring
// Subscribes to authoring store changes and triggers syncSchema
// automatically. This ensures canvas always reflects authoring data.
// ═══════════════════════════════════════════════════════════════

let _unsubscribe: (() => void) | null = null;
let _lastSyncHash = '';
let _syncTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Start auto-sync from authoring store to canva store.
 * Call this once when the canva store is initialized.
 */
export function startAutoSync(syncFn: () => void) {
  if (_unsubscribe) return; // Already subscribed

  _unsubscribe = useAuthoringStore.subscribe((state) => {
    // Only sync when relevant data changes (modules, kuis, meta, materi, cp, tp, etc.)
    const hash = JSON.stringify({
      m: state.modules,
      k: state.kuis,
      mt: state.meta,
      ma: state.materi,
      cp: state.cp,
      tp: state.tp,
      atp: state.atp,
      pet: state.petunjuk,
      disk: state.diskusi,
      ref: state.refleksi,
      pen: state.penutup,
      sk: state.skenario,
      al: state.alur,
    });

    if (hash !== _lastSyncHash) {
      _lastSyncHash = hash;
      // Debounce: wait 100ms before syncing to avoid firing on every keystroke
      if (_syncTimer) clearTimeout(_syncTimer);
      _syncTimer = setTimeout(() => {
        syncFn();
        _syncTimer = null;
      }, 100);
    }
  });
}

/**
 * Stop auto-sync. Call when the canva store is destroyed.
 */
export function stopAutoSync() {
  if (_syncTimer) {
    clearTimeout(_syncTimer);
    _syncTimer = null;
  }
  if (_unsubscribe) {
    _unsubscribe();
    _unsubscribe = null;
  }
}
