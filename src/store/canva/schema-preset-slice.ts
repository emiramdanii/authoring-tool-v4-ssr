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
import { loadPreset, schemaToCanvaPages } from '@/core/engine/SchemaEngine.utils';
// NOTE: Do NOT import from SchemaEngine.tsx — it imports React renderers
// which create circular dependencies back to canva-store.
// Use the renderer-free .utils file for store modules.
import { generatePageId } from '@/core/schema/ensure-schema';

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
      // FASE 3: Set page.schema directly — no templateData.schemaScreen promotion needed
      // Schema is the single source of truth. templateData is deprecated legacy.
      const pages: CanvaPage[] = rawPages.map((raw, i) => ({
        id: raw.id || generatePageId(),
        label: raw.label,
        bgDataUrl: null,
        bgColor: raw.bgColor || '#0e1c2f',
        overlay: 20,
        elements: [],
        templateType: (raw.templateType || 'custom') as CanvaPage['templateType'],
        colorPalette: null,
        navConfig: { ...DEFAULT_NAV_CONFIG },
        templateData: raw.templateData, // @deprecated — kept for legacy export compat
        // FASE 3: Schema-first — set page.schema directly from schemaScreen
        // No need to store in templateData and promote on read
        schema: (raw.templateData?.schemaScreen as CanvaPage['schema']) || undefined,
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
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
      });

      toast.success(`📦 Preset "${schema.title}" dimuat — ${pages.length} layar`);
    } catch (err) {
      console.error('Failed to load schema preset:', err);
      toast.error(`Gagal memuat preset "${presetId}"`);
    }
  },
});
