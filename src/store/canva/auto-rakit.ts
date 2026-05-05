// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Auto Rakit logic
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaPage } from '@/components/canva/types';
import type { CanvaState } from './types';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  GAME_TYPES,
  MATERI_RAKIT_TYPES,
  populateTemplateElements,
} from '@/lib/canva-export-helpers';
import { createPage, createElId } from './constants';

export type AutoRakitSlice = Pick<CanvaState, 'autoRakit'>;

export const createAutoRakitSlice: StateCreator<CanvaState, [], [], AutoRakitSlice> = (set, get) => ({
  autoRakit: () => {
    const authStore = useAuthoringStore.getState();
    const meta = authStore.meta;
    const kuis = authStore.kuis.filter((k: { q: string }) => k.q.trim());
    const games = authStore.modules.filter((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string));
    const materiModules = authStore.modules.filter((m: Record<string, unknown>) =>
      (MATERI_RAKIT_TYPES as readonly string[]).includes(m.type as string)
    );

    const newPages: CanvaPage[] = [];

    // 1. Cover page
    newPages.push(createPage('Cover - ' + (meta.judulPertemuan || 'Judul'), 'cover'));
    newPages[newPages.length - 1].templateData = {
      title: meta.judulPertemuan || 'Judul Pertemuan',
      subtitle: meta.subjudul || 'Subjudul',
      icon: meta.ikon || '📚',
      mapel: meta.mapel || '',
      kelas: meta.kelas || '',
      namaBab: meta.namaBab || '',
    };
    newPages[newPages.length - 1].bgColor = '#0f172a';
    populateTemplateElements(newPages[newPages.length - 1], createElId);

    // 2. Dokumen page (if CP/TP data exists)
    if (authStore.cp.capaianFase || authStore.tp.length > 0) {
      newPages.push(createPage('Dokumen CP/TP/ATP', 'dokumen'));
      newPages[newPages.length - 1].templateData = {
        cp: authStore.cp,
        tp: authStore.tp,
        atp: authStore.atp,
      };
      populateTemplateElements(newPages[newPages.length - 1], createElId);
    }

    // 3. Skenario page (if skenario data exists)
    if (authStore.skenario.length > 0) {
      newPages.push(createPage('Skenario Interaktif', 'skenario'));
      newPages[newPages.length - 1].templateData = { skenario: authStore.skenario };
      populateTemplateElements(newPages[newPages.length - 1], createElId);
    }

    // 4. Materi pages
    if (materiModules.length > 0 || authStore.materi.blok.length > 0) {
      newPages.push(createPage('Materi Pembelajaran', 'materi'));
      newPages[newPages.length - 1].templateData = {
        blok: authStore.materi.blok,
        modules: materiModules,
      };
      populateTemplateElements(newPages[newPages.length - 1], createElId);
    }

    // 5. Kuis page
    if (kuis.length > 0) {
      newPages.push(createPage('Kuis Interaktif', 'kuis'));
      newPages[newPages.length - 1].templateData = { kuis };
      populateTemplateElements(newPages[newPages.length - 1], createElId);
    }

    // 6. Game pages
    if (games.length > 0) {
      newPages.push(createPage('Game Interaktif', 'game'));
      newPages[newPages.length - 1].templateData = { games };
      populateTemplateElements(newPages[newPages.length - 1], createElId);
    }

    // 7. Hasil page
    newPages.push(createPage('Hasil & Apresiasi', 'hasil'));
    newPages[newPages.length - 1].templateData = {
      totalKuis: kuis.length,
      namaBab: meta.namaBab || '',
    };
    populateTemplateElements(newPages[newPages.length - 1], createElId);

    // If no pages were created (very unlikely), add at least one custom
    if (newPages.length === 0) {
      newPages.push(createPage('Halaman 1', 'custom'));
    }

    get()._pushHistory();
    set({ pages: newPages, currentPageIndex: 0, selectedElId: null });
    toast.success(`Auto Rakit: ${newPages.length} halaman dibuat dari data authoring`);
  },
});
