// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Reactive sync from authoring → canvas
// Updates page templateData when authoring data changes,
// WITHOUT rebuilding the entire page layout.
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import { buildTemplateData } from './template-data';

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
   */
  syncTemplateData: () => {
    const { pages } = get();
    let changed = false;

    const newPages = pages.map(page => {
      // Only sync template pages (not custom)
      if (!page.templateType || page.templateType === 'custom') return page;

      // Use canonical buildTemplateData — covers ALL 13 template types
      const freshData = buildTemplateData(page.templateType);

      // Check if data actually changed (shallow comparison of keys)
      const oldData = page.templateData || {};
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(freshData)]);
      let dataChanged = false;
      for (const key of allKeys) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(freshData[key])) {
          dataChanged = true;
          break;
        }
      }

      if (!dataChanged) return page;

      changed = true;
      return {
        ...page,
        templateData: freshData,
        // Also update label for cover pages if title changed
        ...(page.templateType === 'cover' && freshData.title
          ? { label: 'Cover - ' + freshData.title }
          : {}),
      };
    });

    if (changed) {
      set({ pages: newPages });
    }
  },
});
