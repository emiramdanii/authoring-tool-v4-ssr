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
import { ensurePageSchema } from '@/core/schema/ensure-schema';

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
      localStorage.setItem(CANVA_STORAGE_KEY, JSON.stringify({
        pages,
        ratioId,
        _lastSavedAt: Date.now(),
      }));
      set({ _saveStatus: 'saved' });
    } catch (err) {
      // Storage full or unavailable
      console.warn('[CanvaStore] Failed to save to localStorage:', err);
      set({ _saveStatus: 'error' });
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(CANVA_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.pages && Array.isArray(data.pages)) {
        // Ensure all pages have new fields (backward compat)
        // FASE 1: Auto-migrate legacy pages on load — ensurePageSchema()
        // proactively migrates all template pages so page.schema is
        // populated BEFORE first render. This means:
        //   - Legacy pages (no schema field) → migrated via TemplateAdapter
        //   - Pages with schemaScreen in templateData → promoted to page.schema
        //   - Already-native schema pages → preserved as-is
        // After this, every template page has page.schema set.
        // The TemplateAdapter is never called again for these pages.
        const pages = data.pages.map((p: CanvaPage) => {
          // Step 1: Basic field migration (backward compat)
          const migrated: CanvaPage = {
            ...p,
            templateType: p.templateType || 'custom',
            colorPalette: p.colorPalette || null,
            navConfig: p.navConfig || { ...DEFAULT_NAV_CONFIG },
            templateData: p.templateData || {},
            // v4: locked field removed — schema is always owned by the user
            // Merge any overlayElements into elements[] for backward compat
            elements: [
              ...(p.elements || []).map((el: CanvaElement) => ({
                ...el,
                opacity: el.opacity ?? 100,
                hidden: el.hidden ?? false,
              })),
              ...(p.overlayElements || []).map((el: CanvaElement) => ({
                ...el,
                opacity: el.opacity ?? 100,
                hidden: el.hidden ?? false,
              })),
            ],
            overlayElements: [], // Cleared — all merged into elements[]
            // FASE 1: Preserve page.schema if already migrated
            schema: p.schema || undefined,
          };

          // Step 2: Proactively migrate to native schema
          // This populates page.schema for all template pages that
          // don't have it yet. After load+save, legacy pages become
          // native schema pages permanently.
          if (!migrated.schema && migrated.templateType && migrated.templateType !== 'custom') {
            ensurePageSchema(migrated);
            // ensurePageSchema mutates migrated.schema in-place — intentional
          }

          return migrated;
        });
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
