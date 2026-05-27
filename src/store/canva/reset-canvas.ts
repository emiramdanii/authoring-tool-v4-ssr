// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Reset Canvas (nuclear reset)
// Rebuilds all pages from current authoring data.
// FASE 3: Schema-native — all pages get page.schema from creation.
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaPage } from '@/components/canva/types';
import type { CanvaState } from './types';
import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_TYPES, MATERI_RAKIT_TYPES } from '@/lib/canva-constants';
// FASE 3: Schema-native page creation — no more buildTemplateData()
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import { clearCompressedHeightCache } from '@/core/schema/session-state';

export type ResetCanvasSlice = Pick<CanvaState, 'resetCanvas'>;

export const createResetCanvasSlice: StateCreator<CanvaState, [], [], ResetCanvasSlice> = (set, get) => ({
  /**
   * Reset Canvas — rebuild all pages from current authoring data.
   * Should always be called with user confirmation first.
   *
   * FASE 3: All pages are now schema-native from creation.
   * One-way data flow: Authoring → deriveSchema() → page.schema → Renderer
   */
  resetCanvas: () => {
    const authStore = useAuthoringStore.getState();
    const kuis = authStore.kuis.filter((k: { q: string }) => k.q.trim());
    const games = authStore.modules.filter((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string));
    const materiModules = authStore.modules.filter((m: Record<string, unknown>) =>
      (MATERI_RAKIT_TYPES as readonly string[]).includes(m.type as string)
    );

    const newPages: CanvaPage[] = [];

    // 1. Cover page (always)
    newPages.push(createPageFromPreset('cover', newPages.length));

    // 2. Petunjuk page
    if (authStore.petunjuk.langkah.length > 0) {
      newPages.push(createPageFromPreset('petunjuk', newPages.length));
    }

    // 3. Dokumen page (CP/TP/ATP)
    if (authStore.cp.capaianFase || authStore.tp.length > 0) {
      newPages.push(createPageFromPreset('dokumen', newPages.length));
    }

    // 4. Skenario page
    if (authStore.skenario.length > 0) {
      newPages.push(createPageFromPreset('skenario', newPages.length));
    }

    // 5. Diskusi page
    if (authStore.diskusi.pertanyaan.length > 0) {
      newPages.push(createPageFromPreset('diskusi', newPages.length));
    }

    // 6. Materi pages
    if (materiModules.length > 0 || authStore.materi.blok.length > 0) {
      newPages.push(createPageFromPreset('materi', newPages.length));
    }

    // 7. Kuis page
    if (kuis.length > 0) {
      newPages.push(createPageFromPreset('kuis', newPages.length));
    }

    // 8. Game pages
    if (games.length > 0) {
      newPages.push(createPageFromPreset('game', newPages.length));
    }

    // 9. Hasil page (always)
    newPages.push(createPageFromPreset('hasil', newPages.length));

    // 10. Refleksi page
    if (authStore.refleksi.pertanyaan.length > 0) {
      newPages.push(createPageFromPreset('refleksi', newPages.length));
    }

    // 11. Penutup page
    if (authStore.penutup.preview.length > 0) {
      newPages.push(createPageFromPreset('penutup', newPages.length));
    }

    // If no pages were created (very unlikely), add at least one custom
    if (newPages.length === 0) {
      newPages.push(createPageFromPreset('custom', 0));
    }

    get()._pushHistory();

    // Clear runtime caches — compressed heights belong to the old pages,
    // they're stale for the new pages that will be measured fresh.
    clearCompressedHeightCache();

    set({ pages: newPages, currentPageIndex: 0, kontenTabRequest: null, kontenPanelRequest: false, panelRequest: null, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    // Save new pages to localStorage immediately so loadFromStorage()
    // on next mount will get the fresh pages, not stale data.
    get().saveToStorage();

    toast.success(`${newPages.length} halaman dibuat dari data authoring`);
  },
});
