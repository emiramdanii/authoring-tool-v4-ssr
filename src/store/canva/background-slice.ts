// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Background / Palette / NavConfig / TemplateData slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import { extractColorPalette } from '@/lib/color-palette';

export type BackgroundSlice = Pick<
  CanvaState,
  | 'setBgColor' | 'setBgImage' | 'setOverlay'
  | 'extractAndSetPalette' | 'setPaletteMapping'
  | 'updateNavConfig' | 'updateTemplateData'
>;

export const createBackgroundSlice: StateCreator<CanvaState, [], [], BackgroundSlice> = (set, get) => ({
  // ── Background actions ───────────────────────────────────────
  setBgColor: (hex) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], bgColor: hex };
    set({ pages: newPages });
  },

  setBgImage: (dataUrl) => {
    const { pages, currentPageIndex } = get();
    // Compress image if it's too large — resize to max 1200px width, JPEG 80% quality
    // This prevents export HTML from bloating to 20-50+ MB with uncompressed backgrounds
    const compressImage = (url: string): Promise<string> => {
      return new Promise((resolve) => {
        if (!url.startsWith('data:image/')) { resolve(url); return; }
        const img = new Image();
        img.onload = () => {
          const MAX_W = 1200;
          if (img.width <= MAX_W) { resolve(url); return; }
          const scale = MAX_W / img.width;
          const canvas = document.createElement('canvas');
          canvas.width = MAX_W;
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(url); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
    };

    compressImage(dataUrl).then((compressedUrl) => {
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

  // ── Template Data actions ────────────────────────────────────
  updateTemplateData: (key, value) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: { ...page.templateData, [key]: value },
    };
    set({ pages: newPages });
  },
});
