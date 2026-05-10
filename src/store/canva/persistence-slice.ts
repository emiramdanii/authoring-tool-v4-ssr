// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Persistence & Export slice
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaPage, CanvaElement, LeftTab } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
// Export methods removed — now using Vite SSR Export pipeline
// See: src/lib/use-vite-export.ts and src/app/api/export/route.ts
import { CANVA_STORAGE_KEY } from './constants';

// ── Legacy tab name migration map ──────────────────────────────
const TAB_MIGRATION: Record<string, LeftTab> = {
  templates: 'tambah',
  elems: 'tambah',
  ratio: 'halaman',
  pages: 'halaman',
  layers: 'halaman',
  rakit: 'tambah',
  layer: 'halaman',
};

export type PersistenceSlice = Pick<
  CanvaState,
  | 'saveToStorage' | 'loadFromStorage'
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
          // v4: Migrate locked field — template pages without locked field default to locked
          locked: p.locked !== undefined ? p.locked : (p.templateType && p.templateType !== 'custom' ? true : undefined),
        }));
        // Migrate legacy leftTab names
        let leftTab: LeftTab = 'halaman';
        if (data.leftTab) {
          leftTab = TAB_MIGRATION[data.leftTab] || 'halaman';
        }
        set({
          pages,
          ratioId: data.ratioId || '9:16',
          currentPageIndex: 0,
          selectedElId: null,
          selectedElIds: [], // Phase 4: Reset multi-select on load
          selectedBlockIds: [], // Reset block multi-select on load
          leftPanelOpen: true,
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
  // Legacy export methods (exportPageHTML, exportSlideshowHTML, exportUnifiedHTML)
  // have been removed. All exports now go through the Vite SSR pipeline:
  //   → useViteExport() hook → /api/export → Vite-built template + data injection

});
