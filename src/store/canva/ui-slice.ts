// ═══════════════════════════════════════════════════════════════
// CANVA STORE — UI / Tool / Grid / Layout actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaElement } from '@/components/canva/types';
import { LAYOUT_PRESETS } from '@/components/canva/types';

export type UISlice = Pick<
  CanvaState,
  | 'setTool' | 'setLeftTab' | 'toggleLeftPanel' | 'toggleRightPanel'
  | 'toggleGrid' | 'setGridSize' | 'toggleSnap' | 'snapValue'
  | 'applyLayoutPreset' | 'currentLayoutPreset'
  | 'setZoom' | 'zoomDelta' | 'setRatio' | 'nudgeSelected'
  | 'alignSelected' | 'distributeSelected'
  | 'clearStage'
>;

export const createUISlice: StateCreator<CanvaState, [], [], UISlice> = (set, get) => ({
  setTool: (tool) => set({ tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  toggleLeftPanel: () => set(s => ({ leftPanelOpen: !s.leftPanelOpen })),
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
    if (!page || (page.templateType !== 'custom' && page.locked !== false)) {
      toast.warning('Layout preset hanya untuk halaman Kosong atau template terbuka');
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
    if (!page || (page.templateType !== 'custom' && page.locked !== false) || page.elements.length === 0) return LAYOUT_PRESETS[0]; // free
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
    const { selectedElIds, pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    // Phase 4: Support multi-select nudge
    const idsToNudge = selectedElIds.length > 0 ? selectedElIds : (get().selectedElId ? [get().selectedElId!] : []);
    if (idsToNudge.length === 0) return;
    // Only push history if this is the first nudge in a sequence
    // (debounce: push history max once per 500ms of continuous nudging)
    const now = Date.now();
    const lastNudge = get()._lastNudgeTime;
    if (!lastNudge || now - lastNudge > 500) {
      get()._pushHistory();
    }
    set({ _lastNudgeTime: now } as any);
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(e => {
        if (!idsToNudge.includes(e.id)) return e;
        return { ...e, x: Math.max(0, Math.min(95, e.x + dx)), y: Math.max(0, Math.min(95, e.y + dy)) };
      }),
      overlayElements: (page.overlayElements || []).map(e => {
        if (!idsToNudge.includes(e.id)) return e;
        return { ...e, x: Math.max(0, Math.min(95, e.x + dx)), y: Math.max(0, Math.min(95, e.y + dy)) };
      }),
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
    const page = pages[currentPageIndex];
    if (page.elements.length === 0 && (page.overlayElements || []).length === 0) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, elements: [], overlayElements: [] };
    set({ pages: newPages, selectedElId: null, selectedElIds: [] });
    toast.success('Stage dibersihkan');
  },

  // ── Alignment ────────────────────────────────────────────────
  alignSelected: (direction) => {
    const { pages, currentPageIndex, selectedElIds, selectedElId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const ids = selectedElIds.length > 0 ? selectedElIds : (selectedElId ? [selectedElId] : []);
    if (ids.length < 2) {
      toast.info('Pilih minimal 2 elemen untuk alignment');
      return;
    }
    get()._pushHistory();
    const allEls = [...page.elements, ...(page.overlayElements || [])];
    const targets = ids.map(id => allEls.find(e => e.id === id)).filter(Boolean) as CanvaElement[];
    if (targets.length < 2) return;

    // Compute alignment value based on direction
    let alignValue: number;
    switch (direction) {
      case 'left': alignValue = Math.min(...targets.map(e => e.x)); break;
      case 'centerH': alignValue = targets.reduce((s, e) => s + e.x + e.w / 2, 0) / targets.length; break;
      case 'right': alignValue = Math.max(...targets.map(e => e.x + e.w)); break;
      case 'top': alignValue = Math.min(...targets.map(e => e.y)); break;
      case 'centerV': alignValue = targets.reduce((s, e) => s + e.y + e.h / 2, 0) / targets.length; break;
      case 'bottom': alignValue = Math.max(...targets.map(e => e.y + e.h)); break;
      default: return;
    }

    const updateEl = (el: CanvaElement): CanvaElement => {
      switch (direction) {
        case 'left': return { ...el, x: alignValue };
        case 'centerH': return { ...el, x: alignValue - el.w / 2 };
        case 'right': return { ...el, x: alignValue - el.w };
        case 'top': return { ...el, y: alignValue };
        case 'centerV': return { ...el, y: alignValue - el.h / 2 };
        case 'bottom': return { ...el, y: alignValue - el.h };
        default: return el;
      }
    };

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(e => ids.includes(e.id) ? updateEl(e) : e),
      overlayElements: (page.overlayElements || []).map(e => ids.includes(e.id) ? updateEl(e) : e),
    };
    set({ pages: newPages });
    toast.success(`Align ${direction} diterapkan`);
  },

  distributeSelected: (axis) => {
    const { pages, currentPageIndex, selectedElIds, selectedElId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const ids = selectedElIds.length > 0 ? selectedElIds : (selectedElId ? [selectedElId] : []);
    if (ids.length < 3) {
      toast.info('Pilih minimal 3 elemen untuk distribusi');
      return;
    }
    get()._pushHistory();
    const allEls = [...page.elements, ...(page.overlayElements || [])];
    const targets = ids.map(id => allEls.find(e => e.id === id)).filter(Boolean) as CanvaElement[];
    if (targets.length < 3) return;

    if (axis === 'horizontal') {
      // Sort by x, distribute evenly between leftmost and rightmost edges
      const sorted = [...targets].sort((a, b) => a.x - b.x);
      const min = sorted[0].x;
      const max = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w;
      const totalW = sorted.reduce((s, e) => s + e.w, 0);
      const gap = (max - min - totalW) / (sorted.length - 1);
      let current = min;
      const updates = new Map<string, number>();
      for (const el of sorted) {
        updates.set(el.id, current);
        current += el.w + gap;
      }
      const newPages = [...pages];
      newPages[currentPageIndex] = {
        ...page,
        elements: page.elements.map(e => updates.has(e.id) ? { ...e, x: updates.get(e.id)! } : e),
        overlayElements: (page.overlayElements || []).map(e => updates.has(e.id) ? { ...e, x: updates.get(e.id)! } : e),
      };
      set({ pages: newPages });
    } else {
      // Sort by y, distribute evenly
      const sorted = [...targets].sort((a, b) => a.y - b.y);
      const min = sorted[0].y;
      const max = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h;
      const totalH = sorted.reduce((s, e) => s + e.h, 0);
      const gap = (max - min - totalH) / (sorted.length - 1);
      let current = min;
      const updates = new Map<string, number>();
      for (const el of sorted) {
        updates.set(el.id, current);
        current += el.h + gap;
      }
      const newPages = [...pages];
      newPages[currentPageIndex] = {
        ...page,
        elements: page.elements.map(e => updates.has(e.id) ? { ...e, y: updates.get(e.id)! } : e),
        overlayElements: (page.overlayElements || []).map(e => updates.has(e.id) ? { ...e, y: updates.get(e.id)! } : e),
      };
      set({ pages: newPages });
    }
    toast.success(`Distribusi ${axis === 'horizontal' ? 'horizontal' : 'vertikal'} diterapkan`);
  },
});
