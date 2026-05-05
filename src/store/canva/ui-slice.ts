// ═══════════════════════════════════════════════════════════════
// CANVA STORE — UI / Tool / Grid / Layout actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import { LAYOUT_PRESETS } from '@/components/canva/types';

export type UISlice = Pick<
  CanvaState,
  | 'setTool' | 'setLeftTab' | 'toggleRightPanel'
  | 'toggleGrid' | 'setGridSize' | 'toggleSnap' | 'snapValue'
  | 'applyLayoutPreset' | 'currentLayoutPreset'
  | 'setZoom' | 'zoomDelta' | 'setRatio' | 'nudgeSelected'
  | 'clearStage'
>;

export const createUISlice: StateCreator<CanvaState, [], [], UISlice> = (set, get) => ({
  setTool: (tool) => set({ tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),

  // ── Grid & Snap ──────────────────────────────────────────────
  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  setGridSize: (size) => set({ gridSize: Math.max(2, Math.min(20, size)) }),
  toggleSnap: () => set(s => ({ snapEnabled: !s.snapEnabled })),
  snapValue: (val) => {
    const { snapEnabled, gridSize } = get();
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  },

  // ── Layout Presets ────────────────────────────────────────────
  applyLayoutPreset: (presetId) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (!preset || preset.slots.length === 0) return; // 'free' = no change
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || page.templateType !== 'custom') {
      toast.warning('Layout preset hanya untuk halaman Kosong');
      return;
    }
    get()._pushHistory();
    const elements = [...page.elements];
    if (elements.length === 0) {
      toast.info('Tambahkan elemen dulu, lalu pilih layout');
      return;
    }
    // Map elements to slots in order; if more elements than slots, stack in last slot
    const updated = elements.map((el, i) => {
      const slotIdx = Math.min(i, preset.slots.length - 1);
      const slot = preset.slots[slotIdx];
      // If multiple elements share a slot, offset them slightly
      const sharedCount = Math.max(0, i - slotIdx);
      const offset = sharedCount * 2;
      return {
        ...el,
        x: slot.x + offset,
        y: slot.y + offset,
        w: slot.w,
        h: slot.h,
      };
    });
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, elements: updated };
    set({ pages: newPages });
    toast.success(`Layout "${preset.name}" diterapkan`);
  },

  currentLayoutPreset: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || page.templateType !== 'custom' || page.elements.length === 0) return LAYOUT_PRESETS[0]; // free
    // Try to match current element positions to a preset
    const els = page.elements;
    for (const preset of LAYOUT_PRESETS) {
      if (preset.slots.length === 0) continue;
      if (preset.slots.length !== els.length) continue;
      let match = true;
      for (let i = 0; i < els.length; i++) {
        const s = preset.slots[i];
        const e = els[i];
        if (Math.abs(e.x - s.x) > 3 || Math.abs(e.y - s.y) > 3 ||
            Math.abs(e.w - s.w) > 3 || Math.abs(e.h - s.h) > 3) {
          match = false;
          break;
        }
      }
      if (match) return preset;
    }
    return LAYOUT_PRESETS[0]; // free = no matching preset
  },

  nudgeSelected: (dx, dy) => {
    const { selectedElId, pages, currentPageIndex } = get();
    if (!selectedElId) return;
    const page = pages[currentPageIndex];
    if (!page) return;
    const el = page.elements.find(e => e.id === selectedElId);
    if (!el) return;
    get()._pushHistory();
    const newX = Math.max(0, Math.min(95, el.x + dx));
    const newY = Math.max(0, Math.min(95, el.y + dy));
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(e => e.id === selectedElId ? { ...e, x: newX, y: newY } : e),
    };
    set({ pages: newPages });
  },

  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.25, zoom)) }),
  zoomDelta: (delta) => {
    const current = get().zoom;
    set({ zoom: Math.min(2, Math.max(0.25, current + delta)) });
  },
  setRatio: (ratioId) => set({ ratioId }),

  // ── Stage ────────────────────────────────────────────────────
  clearStage: () => {
    const { pages, currentPageIndex } = get();
    if (pages[currentPageIndex].elements.length === 0) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], elements: [] };
    set({ pages: newPages, selectedElId: null });
    toast.success('Stage dibersihkan');
  },
});
