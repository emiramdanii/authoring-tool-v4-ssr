// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Background / Palette / NavConfig / TemplateData slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import { extractColorPalette } from '@/lib/color-palette';
import { compressImage } from '@/lib/compress-image';

export type BackgroundSlice = Pick<
  CanvaState,
  | 'setBgColor' | 'setBgImage' | 'setOverlay'
  | 'extractAndSetPalette' | 'setPaletteMapping'
  | 'updateNavConfig' | 'updateTemplateData'
  | 'updateScreenBackground' | 'setSchemaThemeId'
>;

export const createBackgroundSlice: StateCreator<CanvaState, [], [], BackgroundSlice> = (set, get) => ({
  // ── Background actions ───────────────────────────────────────
  setBgColor: (hex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    // P0 fix: If this is a schema page, redirect to updateScreenBackground.
    // Writing to page.bgColor on a schema page is a silent no-op
    // (SchemaScreenRenderer never reads it), which confuses teachers.
    if (page?.schema) {
      get().updateScreenBackground({ color1: hex, type: 'solid' });
      return;
    }
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], bgColor: hex };
    set({ pages: newPages });
  },

  setBgImage: (dataUrl) => {
    // D-P0E.1: Compress BEFORE routing to either schema or legacy path.
    // This ensures both paths receive the same compressed image,
    // preventing project bloat from raw data URLs on schema pages.
    compressImage(dataUrl).then((compressedUrl) => {
      const { pages, currentPageIndex } = get();
      const page = pages[currentPageIndex];
      // P0 fix: If this is a schema page, redirect to updateScreenBackground.
      // Writing to page.bgDataUrl on a schema page is a silent no-op
      // (SchemaScreenRenderer never reads it), which confuses teachers.
      if (page?.schema) {
        get().updateScreenBackground({ imageUrl: compressedUrl, overlay: page.schema.background?.overlay ?? 40 });
        return;
      }
      // Legacy path — write compressed image to bgDataUrl
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...newPages[currentPageIndex], bgDataUrl: compressedUrl };
      set({ pages: newPages });
      // Auto-extract color palette from image
      get().extractAndSetPalette(compressedUrl);
      toast.success('Background diterapkan');
    });
  },

  setOverlay: (val) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    // P0 fix: If this is a schema page, redirect to updateScreenBackground.
    // Writing to page.overlay on a schema page is a silent no-op
    // (SchemaScreenRenderer never reads it), which confuses teachers.
    if (page?.schema) {
      get().updateScreenBackground({ overlay: val });
      return;
    }
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], overlay: val };
    set({ pages: newPages });
  },

  // ── Color Palette actions ────────────────────────────────────
  extractAndSetPalette: async (dataUrl) => {
    const palette = await extractColorPalette(dataUrl);
    if (palette.colors.length === 0) return;
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], colorPalette: palette };
    set({ pages: newPages });
    toast.success('Palet warna diekstrak dari gambar');
  },

  setPaletteMapping: (key, colorIdx) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !page.colorPalette) return;
    const newPalette = { ...page.colorPalette };
    newPalette.mapping = { ...newPalette.mapping };
    if (colorIdx >= 0 && colorIdx < newPalette.colors.length) {
      newPalette.mapping[key] = newPalette.colors[colorIdx];
    }
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, colorPalette: newPalette };
    set({ pages: newPages });
  },

  // ── Nav Config actions ───────────────────────────────────────
  updateNavConfig: (updates) => {
    get()._pushHistory();
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      navConfig: { ...page.navConfig, ...updates },
    };
    set({ pages: newPages });
  },

  // ── Schema Background actions ────────────────────────────────
  // Update the screen.schema.background for schema-driven pages.
  // This is the canonical way to set background on schema pages.
  updateScreenBackground: (updates) => {
    get()._pushHistory();
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) return;
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: {
        ...page.schema,
        background: {
          ...page.schema.background,
          type: page.schema.background?.type || 'solid',
          ...updates,
        },
      },
    };
    set({ pages: newPages });
  },

  // ── Schema Theme ID action ────────────────────────────────
  // Changes the theme preset for the current page.
  // D-P0B.1 fix: Writes to BOTH schema.themeId AND templateData.schemaThemeId.
  // schema.themeId is the canonical source for schema pages.
  // templateData.schemaThemeId is kept as legacy bridge until full removal.
  setSchemaThemeId: (themeId: string) => {
    get()._pushHistory();
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    // Always write to templateData for legacy bridge compat
    const updatedTemplateData = {
      ...(page.templateData || {}),
      schemaThemeId: themeId,
    };
    if (page.schema) {
      // Schema page — write to BOTH schema.themeId AND templateData
      newPages[currentPageIndex] = {
        ...page,
        schema: {
          ...page.schema,
          themeId, // canonical source for TokenResolver
        },
        templateData: updatedTemplateData,
      };
    } else {
      // Legacy page (no schema) — only templateData
      newPages[currentPageIndex] = {
        ...page,
        templateData: updatedTemplateData,
      };
    }
    set({ pages: newPages });
  },

  // ── Template Data actions ────────────────────────────────────
  // @deprecated FASE 4: updateTemplateData is deprecated.
  // No active UI consumers remain (migrated in E-3).
  // Kept only for potential programmatic/legacy use cases.
  // New code should use updateSchemaBlock() or direct schema mutations.
  //
  // REMOVAL PREREQUISITES:
  //   1. ✅ PageSettingsSection.tsx — migrated away from updateTemplateData
  //   2. ⬜ setSchemaThemeId() — still writes schemaThemeId to templateData
  //   3. ⬜ ensure-schema.ts — still reads templateData.schemaScreen (Path 2)
  //   4. ⬜ persistence-slice.ts — still preserves templateData during load
  //   5. ⬜ TemplateAdapter.ts — still reads page.templateData in convertToSchema()
  //
  // When items 2-5 are resolved, this action and the templateData field
  // on CanvaPage can be removed entirely.
  updateTemplateData: (key, value) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];

    // FASE 3: If the page has a schema, write to schema instead
    if (page.schema) {
      // For known keys, map to schema fields
      if (key === 'navbar' || key === 'timer') {
        newPages[currentPageIndex] = {
          ...page,
          schema: {
            ...page.schema,
            nav: {
              ...page.schema.nav,
              [key]: value,
            },
          },
        };
      } else {
        // Unknown key — still write to templateData for legacy compat
        newPages[currentPageIndex] = {
          ...page,
          templateData: { ...page.templateData, [key]: value },
        };
      }
    } else {
      // No schema (custom page) — write to templateData
      newPages[currentPageIndex] = {
        ...page,
        templateData: { ...page.templateData, [key]: value },
      };
    }
    set({ pages: newPages });
  },
});
