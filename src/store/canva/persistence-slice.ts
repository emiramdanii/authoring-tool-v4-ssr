// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Persistence & Export slice
// ═══════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { DBProjectData } from './types';
import type { CanvaPage, CanvaElement, LeftTab, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
// Export methods removed — now using Vite SSR Export pipeline
// See: src/lib/use-vite-export.ts and src/app/api/export/route.ts
import { CANVA_STORAGE_KEY } from './constants';
import { ensurePageSchema } from '@/core/schema/ensure-schema';

// ── Legacy tab name migration map ──────────────────────────────
const TAB_MIGRATION: Record<string, LeftTab> = {
  templates: 'sisipkan',
  elems: 'sisipkan',
  ratio: 'halaman',
  pages: 'halaman',
  layers: 'halaman',
  rakit: 'sisipkan',
  layer: 'halaman',
  tambah: 'sisipkan', // 8.3: Old 'tambah' tab split into 'sisipkan' + 'halamanBaru'
};

export type PersistenceSlice = Pick<
  CanvaState,
  | 'saveToStorage' | 'loadFromStorage' | 'loadFromDB'
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
            navConfig: {
              ...DEFAULT_NAV_CONFIG,
              ...(p.navConfig || {}),
              // Ensure navbarStyle is always present (legacy pages may lack this field)
              navbarStyle: p.navConfig?.navbarStyle || DEFAULT_NAV_CONFIG.navbarStyle,
            },
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

  // ── Load from Database ──────────────────────────────────────────
  loadFromDB: (data: DBProjectData) => {
    try {
      if (data.pages && Array.isArray(data.pages)) {
        const pages: CanvaPage[] = data.pages.map((p) => {
          // Map DB Page → CanvaPage
          const schema = p.schemaData ? JSON.parse(p.schemaData) : undefined;
          const parsedNavConfig = p.navConfig ? JSON.parse(p.navConfig) : {};
          const navConfig: NavConfig = {
            ...DEFAULT_NAV_CONFIG,
            ...parsedNavConfig,
            navbarStyle: parsedNavConfig.navbarStyle || DEFAULT_NAV_CONFIG.navbarStyle,
          };
          const templateData = p.templateData ? JSON.parse(p.templateData) : {};
          const colorPalette = p.colorPalette ? JSON.parse(p.colorPalette) : null;

          // Map DB blocks → schema blocks
          const schemaBlocks = (p.blocks || []).map((b) => {
            const content = b.content ? JSON.parse(b.content) : {};
            const layout = b.layout ? JSON.parse(b.layout) : undefined;
            return {
              type: b.blockType,
              ...content,
              ...(layout ? { layout } : {}),
            };
          });

          const migrated: CanvaPage = {
            id: p.id,
            label: p.label || `Halaman ${p.pageIndex + 1}`,
            bgDataUrl: p.bgImage || null,
            bgColor: p.bgColor || '#0f172a',
            overlay: p.bgOverlay !== null ? Math.round(p.bgOverlay * 100) : 20,
            elements: [],
            templateType: (p.templateType as CanvaPage['templateType']) || 'custom',
            colorPalette,
            navConfig,
            templateData,
            templateVariant: (p.variant as 'A' | 'B' | 'C') || undefined,
            schema: schema || (schemaBlocks.length > 0 ? { id: p.id, templateType: p.templateType || 'custom', blocks: schemaBlocks } : undefined),
          };

          // Proactively migrate to native schema if needed
          if (!migrated.schema && migrated.templateType && migrated.templateType !== 'custom') {
            ensurePageSchema(migrated);
          }

          return migrated;
        });

        set({
          pages,
          ratioId: data.ratioId || '16:9',
          currentPageIndex: 0,
          selectedElId: null,
          selectedElIds: [],
          selectedBlockIds: [],
          leftPanelOpen: true,
          rightPanelOpen: true,
          leftTab: 'halaman',
        });
      }
    } catch (err) {
      console.warn('[CanvaStore] Failed to load from DB:', err);
    }
  },

  // ── Export ───────────────────────────────────────────────────
  // Legacy export methods (exportPageHTML, exportSlideshowHTML, exportUnifiedHTML)
  // have been removed. All exports now go through the Vite SSR pipeline:
  //   → useViteExport() hook → /api/export → Vite-built template + data injection

});
