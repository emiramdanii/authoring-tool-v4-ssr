// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Persistence & Export slice
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaPage, CanvaElement, LeftTab } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import { exportPageHTML as generatePageHTML } from '@/lib/canva-export-page';
import { exportSlideshowHTML as generateSlideshowHTML } from '@/lib/canva-export-slideshow';
import { exportUnifiedHTML as generateUnifiedHTML } from '@/lib/export-unified';
import { CANVA_STORAGE_KEY } from './constants';

// ── Legacy tab name migration map ──────────────────────────────
const TAB_MIGRATION: Record<string, LeftTab> = {
  templates: 'rakit',
  elems: 'rakit',
  ratio: 'halaman',
  pages: 'halaman',
  layers: 'layer',
};

export type PersistenceSlice = Pick<
  CanvaState,
  | 'saveToStorage' | 'loadFromStorage'
  | 'exportPageHTML' | 'exportSlideshowHTML' | 'exportUnifiedHTML'
>;

export const createPersistenceSlice: StateCreator<CanvaState, [], [], PersistenceSlice> = (set, get) => ({
  // ── Persistence ──────────────────────────────────────────────
  saveToStorage: () => {
    try {
      const { pages, ratioId } = get();
      localStorage.setItem(CANVA_STORAGE_KEY, JSON.stringify({ pages, ratioId }));
    } catch {
      // Storage full or unavailable
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(CANVA_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.pages && Array.isArray(data.pages)) {
        // Ensure all pages have new fields (backward compat)
        const pages = data.pages.map((p: CanvaPage) => ({
          ...p,
          templateType: p.templateType || 'custom',
          colorPalette: p.colorPalette || null,
          navConfig: p.navConfig || { ...DEFAULT_NAV_CONFIG },
          templateData: p.templateData || {},
          // Phase 1: Ensure overlayElements array exists
          overlayElements: (p.overlayElements || []).map((el: CanvaElement) => ({
            ...el,
            opacity: el.opacity ?? 100,
            hidden: el.hidden ?? false,
          })),
          // Ensure elements have valid positions
          elements: (p.elements || []).map((el: CanvaElement) => ({
            ...el,
            opacity: el.opacity ?? 100,
            hidden: el.hidden ?? false,
          })),
        }));
        // Migrate legacy leftTab names
        let leftTab: LeftTab = 'rakit';
        if (data.leftTab) {
          leftTab = TAB_MIGRATION[data.leftTab] || 'rakit';
        }
        set({
          pages,
          ratioId: data.ratioId || '16:9',
          currentPageIndex: 0,
          selectedElId: null,
          selectedElIds: [], // Phase 4: Reset multi-select on load
          rightPanelOpen: true,
          leftTab,
        });
        return true;
      }
      return false;
    } catch {
      // If data is corrupt, clear it
      try { localStorage.removeItem(CANVA_STORAGE_KEY); } catch {}
      return false;
    }
  },

  // ── Export ───────────────────────────────────────────────────
  exportPageHTML: (pageIdx) => {
    const { pages, ratioId } = get();
    const idx = pageIdx ?? get().currentPageIndex;
    const page = pages[idx];
    if (!page) return '';
    return generatePageHTML(page, idx, ratioId);
  },

  exportSlideshowHTML: () => {
    const { pages, ratioId } = get();
    return generateSlideshowHTML(pages, ratioId);
  },

  exportUnifiedHTML: () => {
    const { pages, ratioId } = get();
    return generateUnifiedHTML(pages, ratioId, 'canva');
  },
});
