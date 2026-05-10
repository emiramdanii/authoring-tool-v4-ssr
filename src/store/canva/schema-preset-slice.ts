// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Schema Preset Loading Slice
// ═══════════════════════════════════════════════════════════════
// Loads a LessonSchema preset (e.g. 'hakikat-norma', 'macam-norma')
// into the canvas, converting schema screens → canva pages with
// schemaScreen data in templateData.
//
// When PageRenderer detects schemaScreen in templateData,
// it uses SchemaScreenRenderer instead of the legacy PageTemplate,
// giving beautiful token-driven rendering that matches the original
// preset HTML files.

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import { loadPreset, schemaToCanvaPages } from '@/core/engine/SchemaEngine';

export type SchemaPresetSlice = Pick<CanvaState, 'loadSchemaPreset'>;

export const createSchemaPresetSlice: StateCreator<CanvaState, [], [], SchemaPresetSlice> = (set, get) => ({
  /**
   * Load a schema preset into the canvas.
   * Replaces all pages with the preset's screens, each rendered
   * via SchemaScreenRenderer (not legacy PageTemplate).
   */
  loadSchemaPreset: async (presetId: string) => {
    try {
      const schema = await loadPreset(presetId);
      if (!schema) {
        toast.error(`Preset "${presetId}" tidak ditemukan`);
        return;
      }

      // Convert LessonSchema → CanvaPage[]
      const rawPages = schemaToCanvaPages(schema);

      // Wrap into full CanvaPage objects (schemaToCanvaPages returns partial)
      const pages: CanvaPage[] = rawPages.map((raw, i) => ({
        id: raw.id || `p_${Date.now()}_${i}`,
        label: raw.label,
        bgDataUrl: null,
        bgColor: raw.bgColor || '#0e1c2f',
        overlay: 20,
        elements: [],
        templateType: (raw.templateType || 'custom') as CanvaPage['templateType'],
        colorPalette: null,
        navConfig: { ...DEFAULT_NAV_CONFIG },
        templateData: raw.templateData,
        overlayElements: [],
        // Schema-driven pages are locked (content from schema, not authoring store)
        locked: true,
      }));

      // Cover pages should hide the top navbar
      if (pages.length > 0 && pages[0].templateType === 'cover') {
        pages[0].navConfig = {
          ...pages[0].navConfig,
          showNavbar: true,
          showProgress: true,
        };
      }

      get()._pushHistory();
      set({
        pages,
        currentPageIndex: 0,
        selectedElId: null,
        selectedElIds: [],
      });

      toast.success(`📦 Preset "${schema.title}" dimuat — ${pages.length} layar`);
    } catch (err) {
      console.error('Failed to load schema preset:', err);
      toast.error(`Gagal memuat preset "${presetId}"`);
    }
  },
});
