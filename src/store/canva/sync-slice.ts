// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Reactive sync from authoring → canvas
// Updates page templateData when authoring data changes,
// WITHOUT rebuilding the entire page layout.
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  GAME_TYPES,
  MATERI_MODULE_TYPES,
  getHeroData,
} from '@/lib/canva-export-helpers';

export type SyncSlice = Pick<CanvaState, 'syncTemplateData'>;

/**
 * Build fresh templateData for a given template type from current authoring state.
 * This is the same logic as buildTemplateData() in template-data.ts,
 * but called dynamically to update existing pages.
 */
function buildFreshTemplateData(templateType: string): Record<string, unknown> {
  const authStore = useAuthoringStore.getState();
  const meta = authStore.meta;

  switch (templateType) {
    case 'cover':
      return {
        title: meta.judulPertemuan || 'Judul Pertemuan',
        subtitle: meta.subjudul || 'Subjudul',
        icon: meta.ikon || '📚',
        mapel: meta.mapel || '',
        kelas: meta.kelas || '',
        namaBab: meta.namaBab || '',
      };

    case 'dokumen':
      return {
        cp: authStore.cp,
        tp: authStore.tp,
        atp: authStore.atp,
      };

    case 'materi':
      return {
        blok: authStore.materi.blok,
        modules: authStore.modules.filter((m: Record<string, unknown>) =>
          (MATERI_MODULE_TYPES as readonly string[]).includes(m.type as string)
        ),
      };

    case 'kuis':
      return {
        kuis: authStore.kuis.filter(k => k.q.trim()),
      };

    case 'game':
      return {
        games: authStore.modules.filter((m: Record<string, unknown>) =>
          (GAME_TYPES as readonly string[]).includes(m.type as string)
        ),
      };

    case 'hasil':
      return {
        totalKuis: authStore.kuis.filter(k => k.q.trim()).length,
        namaBab: meta.namaBab || '',
      };

    case 'skenario':
      return {
        skenario: authStore.skenario,
      };

    case 'hero':
      return getHeroData(authStore);

    default:
      return {};
  }
}

export const createSyncSlice: StateCreator<CanvaState, [], [], SyncSlice> = (set, get) => ({
  /**
   * Sync all template pages' templateData from the authoring store.
   * This preserves page layout, overlay elements, and custom elements —
   * only the templateData binding is updated.
   *
   * Called automatically when authoring data changes (via useAuthoringStore.subscribe).
   */
  syncTemplateData: () => {
    const { pages } = get();
    let changed = false;

    const newPages = pages.map(page => {
      // Only sync template pages (not custom)
      if (!page.templateType || page.templateType === 'custom') return page;

      const freshData = buildFreshTemplateData(page.templateType);

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
