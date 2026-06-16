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
import { loadPreset, loadGoldenPreset, schemaToCanvaPages } from '@/core/engine/SchemaEngine.utils';
// NOTE: Do NOT import from SchemaEngine.tsx — it imports React renderers
// which create circular dependencies back to canva-store.
// Use the renderer-free .utils file for store modules.
import { generatePageId } from '@/core/schema/ensure-schema';
import type { LessonSchema } from '@/core/schema/types';
import { logger } from '@/core/utils/logger';
import { saveCrashCheckpoint, transactionRollback } from '@/core/recovery';
import { notifyMutation } from '@/lib/save-utils';

export type SchemaPresetSlice = Pick<CanvaState, 'loadSchemaPreset' | 'loadCustomSchema' | 'loadGoldenPreset'>;

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
      // Schema is the single source of truth. templateData is kept for legacy export compat.
      // STANDAR: contractId from schemaToCanvaPages for golden contract enforcement
      const pages: CanvaPage[] = rawPages.map((raw, i) => ({
        id: raw.id || generatePageId(),
        label: raw.label,
        bgDataUrl: null,
        bgColor: raw.bgColor || '#ffffff',
        overlay: 20,
        elements: [],
        templateType: (raw.templateType || 'custom') as CanvaPage['templateType'],
        colorPalette: null,
        navConfig: { ...DEFAULT_NAV_CONFIG },
        templateData: raw.templateData, // @deprecated — kept for legacy export compat
        // Schema-first: raw.schema is the canonical ScreenSchema from schemaToCanvaPages
        pageMode: 'schema' as const,
        schema: raw.schema,
        // STANDAR: Contract ID for TemplateThemeContract enforcement
        contractId: (raw as { contractId?: string }).contractId || 'golden-pertemuan',
      }));

      // Cover pages should hide the top navbar
      if (pages.length > 0 && pages[0]!.templateType === 'cover') {
        pages[0]!.navConfig = {
          ...pages[0]!.navConfig,
          showNavbar: true,
          showProgress: true,
        };
      }

      // ── FASE 6: Crash checkpoint + transaction before replacing all pages ──
      const { pages: currentPages, ratioId } = get();
      saveCrashCheckpoint(currentPages, ratioId, 'load-schema-preset');
      const txId = transactionRollback.checkpoint(currentPages, ratioId, 'load-schema-preset');

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

      // FASE 6: Commit transaction — preset load succeeded
      transactionRollback.commit(txId);

      notifyMutation();
      toast.success(`📦 Preset "${schema.title}" dimuat — ${pages.length} layar`);
    } catch (err) {
      logger.error('SchemaPreset', err);
      toast.error(`Gagal memuat preset "${presetId}"`);
    }
  },

  /**
   * Load a custom LessonSchema into the canvas.
   * Used by the Template Marketplace to apply marketplace templates.
   * Works the same as loadSchemaPreset but takes a schema object directly.
   */
  loadCustomSchema: (schema: LessonSchema) => {
    try {
      // Convert LessonSchema → CanvaPage[]
      const rawPages = schemaToCanvaPages(schema);

      // Wrap into full CanvaPage objects
      const pages: CanvaPage[] = rawPages.map((raw) => ({
        id: raw.id || generatePageId(),
        label: raw.label,
        bgDataUrl: null,
        bgColor: raw.bgColor || '#ffffff',
        overlay: 20,
        elements: [],
        templateType: (raw.templateType || 'custom') as CanvaPage['templateType'],
        colorPalette: null,
        navConfig: { ...DEFAULT_NAV_CONFIG },
        templateData: raw.templateData, // @deprecated — kept for legacy export compat
        // Schema-first: raw.schema is the canonical ScreenSchema from schemaToCanvaPages
        pageMode: 'schema' as const,
        schema: raw.schema,
        // STANDAR: Contract ID for TemplateThemeContract enforcement
        contractId: (raw as { contractId?: string }).contractId || 'golden-pertemuan',
      }));

      // Cover pages should show navbar + progress
      if (pages.length > 0 && pages[0]!.templateType === 'cover') {
        pages[0]!.navConfig = {
          ...pages[0]!.navConfig,
          showNavbar: true,
          showProgress: true,
        };
      }

      // ── FASE 6: Crash checkpoint + transaction before replacing all pages ──
      const { pages: currentPages, ratioId } = get();
      saveCrashCheckpoint(currentPages, ratioId, 'load-custom-schema');
      const txId = transactionRollback.checkpoint(currentPages, ratioId, 'load-custom-schema');

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

      // FASE 6: Commit transaction — custom schema load succeeded
      transactionRollback.commit(txId);

      notifyMutation();
      toast.success(`🏪 Template "${schema.title}" diterapkan — ${pages.length} layar`);
    } catch (err) {
      logger.error('CustomSchema', err);
      toast.error('Gagal menerapkan template');
    }
  },

  /**
   * Load a golden preset into the canvas.
   * Golden presets return CanvaPage[] directly (handcrafted content),
   * bypassing the LessonSchema → schemaToCanvaPages conversion.
   */
  loadGoldenPreset: async (presetId: string) => {
    try {
      const pages = await loadGoldenPreset(presetId);
      if (!pages || pages.length === 0) {
        toast.error(`Golden preset "${presetId}" tidak ditemukan`);
        return;
      }

      // Ensure every page has proper defaults
      const safePages: CanvaPage[] = pages.map((page) => ({
        ...page,
        contractId: page.contractId || 'golden-pertemuan',
        pageMode: (page.pageMode || 'schema') as CanvaPage['pageMode'],
      }));

      // Cover pages should show navbar + progress
      if (safePages.length > 0 && safePages[0]!.templateType === 'cover') {
        safePages[0]!.navConfig = {
          ...safePages[0]!.navConfig,
          showNavbar: true,
          showProgress: true,
        };
      }

      // ── FASE 6: Crash checkpoint + transaction before replacing all pages ──
      const { pages: currentPages, ratioId } = get();
      saveCrashCheckpoint(currentPages, ratioId, 'load-golden-preset');
      const txId = transactionRollback.checkpoint(currentPages, ratioId, 'load-golden-preset');

      get()._pushHistory();
      set({
        pages: safePages,
        currentPageIndex: 0,
        selectedElId: null,
        selectedElIds: [],
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
      });

      // FASE 6: Commit transaction — golden preset load succeeded
      transactionRollback.commit(txId);

      notifyMutation();
      toast.success(`✨ Golden preset "${presetId}" dimuat — ${safePages.length} layar`);
    } catch (err) {
      logger.error('GoldenPreset', err);
      toast.error(`Gagal memuat golden preset "${presetId}"`);
    }
  },
});
