// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Reset Canvas (nuclear reset)
// Rebuilds all pages from current authoring data.
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaPage } from '@/components/canva/types';
import type { CanvaState } from './types';
import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_TYPES, MATERI_RAKIT_TYPES } from '@/lib/canva-constants';
import { createTemplatePage } from './template-data';

export type ResetCanvasSlice = Pick<CanvaState, 'resetCanvas'>;

export const createResetCanvasSlice: StateCreator<CanvaState, [], [], ResetCanvasSlice> = (set, get) => ({
  /**
   * Reset Canvas — rebuild all pages from current authoring data.
   * Should always be called with user confirmation first.
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
    newPages.push(createTemplatePage('cover', newPages.length));

    // 2. Petunjuk page
    if (authStore.petunjuk.langkah.length > 0) {
      newPages.push(createTemplatePage('petunjuk', newPages.length));
    }

    // 3. Dokumen page (CP/TP/ATP)
    if (authStore.cp.capaianFase || authStore.tp.length > 0) {
      newPages.push(createTemplatePage('dokumen', newPages.length));
    }

    // 4. Skenario page
    if (authStore.skenario.length > 0) {
      newPages.push(createTemplatePage('skenario', newPages.length));
    }

    // 5. Diskusi page
    if (authStore.diskusi.pertanyaan.length > 0) {
      newPages.push(createTemplatePage('diskusi', newPages.length));
    }

    // 6. Materi pages
    if (materiModules.length > 0 || authStore.materi.blok.length > 0) {
      newPages.push(createTemplatePage('materi', newPages.length));
    }

    // 7. Kuis page
    if (kuis.length > 0) {
      newPages.push(createTemplatePage('kuis', newPages.length));
    }

    // 8. Game pages
    if (games.length > 0) {
      newPages.push(createTemplatePage('game', newPages.length));
    }

    // 9. Hasil page (always)
    newPages.push(createTemplatePage('hasil', newPages.length));

    // 10. Refleksi page
    if (authStore.refleksi.pertanyaan.length > 0) {
      newPages.push(createTemplatePage('refleksi', newPages.length));
    }

    // 11. Penutup page
    if (authStore.penutup.preview.length > 0) {
      newPages.push(createTemplatePage('penutup', newPages.length));
    }

    // If no pages were created (very unlikely), add at least one custom
    if (newPages.length === 0) {
      newPages.push(createTemplatePage('custom', 0));
    }

    get()._pushHistory();
    set({ pages: newPages, currentPageIndex: 0, selectedElId: null, selectedElIds: [] });
    toast.success(`${newPages.length} halaman dibuat dari data authoring`);
  },
});
