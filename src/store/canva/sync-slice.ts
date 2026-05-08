// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Reactive sync from authoring → canvas
// Updates page templateData when authoring data changes,
// WITHOUT rebuilding the entire page layout.
//
// Layers:
//   Layer 1: templateData re-binding (buildTemplateData)
//   Layer 2: Orphan cleanup (remove elements referencing deleted data)
//   Layer 3: Element ID re-sync (update moduleId/kuisId on elements)
//   Layer 4: Auto-subscription wiring (authoring store → syncTemplateData)
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaElement } from '@/components/canva/types';
import { buildTemplateData } from './template-data';
import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_TYPES } from '@/lib/canva-export-helpers';

export type SyncSlice = Pick<CanvaState, 'syncTemplateData'>;

export const createSyncSlice: StateCreator<CanvaState, [], [], SyncSlice> = (set, get) => ({
  /**
   * Sync all template pages' templateData from the authoring store.
   * This preserves page layout, overlay elements, and custom elements —
   * only the templateData binding is updated.
   *
   * Called automatically when authoring data changes (via useAuthoringStore.subscribe).
   * Now uses the canonical buildTemplateData() from template-data.ts
   * to eliminate the previous DRY violation.
   *
   * Also performs:
   *   Layer 2: Orphan cleanup — removes elements referencing deleted modules/kuis
   *   Layer 3: Element ID re-sync — updates moduleId/kuisId on elements
   */
  syncTemplateData: () => {
    const { pages } = get();
    const authStore = useAuthoringStore.getState();
    const allModuleIds = new Set(authStore.modules.map((m: { _id?: string }) => m._id).filter(Boolean));
    const allKuisIds = new Set(authStore.kuis.map((k: { _id?: string }) => k._id).filter(Boolean));
    let changed = false;

    const newPages = pages.map(page => {
      // ── Layer 1: templateData re-binding (template pages only) ──
      // Custom pages don't have templateData, but they still need Layer 2 & 3
      let freshData: Record<string, unknown> | null = null;
      let dataChanged = false;

      if (page.templateType && page.templateType !== 'custom') {
        freshData = buildTemplateData(page.templateType);

        // Check if data actually changed (shallow comparison of keys)
        const oldData = page.templateData || {};
        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(freshData)]);
        for (const key of allKeys) {
          if (JSON.stringify(oldData[key]) !== JSON.stringify(freshData[key])) {
            dataChanged = true;
            break;
          }
        }
      }

      // ── Layer 2: Orphan cleanup ───────────────────────────
      // Remove overlay elements that reference deleted modules or kuis
      const cleanedOverlays = (page.overlayElements || []).filter(el => {
        if (el.moduleId && !allModuleIds.has(el.moduleId)) return false;
        if (el.kuisId && !allKuisIds.has(el.kuisId)) return false;
        return true;
      });

      // Clean regular elements too
      const cleanedElements = page.elements.filter(el => {
        if (el.moduleId && !allModuleIds.has(el.moduleId)) return false;
        if (el.kuisId && !allKuisIds.has(el.kuisId)) return false;
        return true;
      });

      const overlaysChanged = cleanedOverlays.length !== (page.overlayElements || []).length;
      const elementsChanged = cleanedElements.length !== page.elements.length;

      // ── Layer 3: Element ID re-sync ───────────────────────
      // For game/kuis elements that still use dataIdx only, try to resolve
      // their stable moduleId/kuisId from the authoring store
      const syncElementIds = (els: CanvaElement[]): CanvaElement[] => {
        return els.map(el => {
          if (el.type === 'game' && !el.moduleId && el.dataIdx != null && el.dataIdx >= 0) {
            const gameModules = authStore.modules.filter((m: Record<string, unknown>) =>
              (GAME_TYPES as readonly string[]).includes(m.type as string)
            );
            if (el.dataIdx < gameModules.length && gameModules[el.dataIdx]._id) {
              return { ...el, moduleId: gameModules[el.dataIdx]._id as string };
            }
          }
          if (el.type === 'kuis' && !el.kuisId && el.dataIdx != null && el.dataIdx >= 0) {
            if (el.dataIdx < authStore.kuis.length && authStore.kuis[el.dataIdx]._id) {
              return { ...el, kuisId: authStore.kuis[el.dataIdx]._id as string };
            }
          }
          return el;
        });
      };

      const syncedOverlays = syncElementIds(cleanedOverlays);
      const syncedElements = syncElementIds(cleanedElements);

      const idsSynced = syncedOverlays !== cleanedOverlays || syncedElements !== cleanedElements;

      if (!dataChanged && !overlaysChanged && !elementsChanged && !idsSynced) return page;

      changed = true;
      return {
        ...page,
        templateData: dataChanged && freshData ? freshData : page.templateData,
        // Also update label for cover pages if title changed
        ...(page.templateType === 'cover' && freshData?.title
          ? { label: 'Cover - ' + freshData.title }
          : {}),
        overlayElements: (overlaysChanged || idsSynced) ? syncedOverlays : page.overlayElements,
        elements: (elementsChanged || idsSynced) ? syncedElements : page.elements,
      };
    });

    if (changed) {
      set({ pages: newPages });
    }
  },
});

// ═══════════════════════════════════════════════════════════════
// Layer 4: Auto-subscription wiring
// Subscribes to authoring store changes and triggers syncTemplateData
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
