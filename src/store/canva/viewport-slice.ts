// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Viewport / Tool / Zoom / Grid / Layout actions
// ═══════════════════════════════════════════════════════════════
// Extracted from ui-slice.ts for maintainability.
// Contains: tool selection, zoom, grid/snap, layout presets,
//           stage clear, legacy element nudge/alignment.
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaElement } from '@/components/canva/types';
import { LAYOUT_PRESETS } from '@/components/canva/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { ZOOM_FIT, clampZoom } from '@/lib/canva-constants';
import { commitSchemaUpdate } from './schema-helpers';
import { notifyMutation } from '@/lib/save-utils';

export type ViewportSlice = Pick<
  CanvaState,
  | 'setTool' | 'setLeftTab'
  | 'toggleGrid' | 'setGridSize' | 'toggleSnap' | 'snapValue'
  | 'setZoom' | 'setFitZoom' | 'zoomDelta' | 'zoomToFit' | 'setRatio'
  | 'nudgeSelected'
  | 'applyLayoutPreset' | 'currentLayoutPreset'
  | 'clearStage'
  | 'alignSelected' | 'distributeSelected'
>;

export const createViewportSlice: StateCreator<CanvaState, [], [], ViewportSlice> = (set, get) => ({
  // ── Tool & Tab ───────────────────────────────────────────────
  setTool: (tool) => set({ tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),

  // ── Zoom ─────────────────────────────────────────────────────
  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  setFitZoom: (fitZoom) => set({ fitZoom }),
  zoomDelta: (delta) => {
    const { zoom, fitZoom } = get();
    const base = zoom === ZOOM_FIT ? fitZoom : zoom;
    set({ zoom: clampZoom(base + delta) });
  },
  zoomToFit: () => set({ zoom: ZOOM_FIT }),
  setRatio: (ratioId) => {
    set({ ratioId, zoom: ZOOM_FIT });
    notifyMutation();
  },

  // ── Grid & Snap ──────────────────────────────────────────────
  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  setGridSize: (size) => set({ gridSize: Math.max(2, Math.min(20, size)) }),
  toggleSnap: () => set(s => ({ snapEnabled: !s.snapEnabled })),
  snapValue: (val) => {
    const { snapEnabled, gridSize } = get();
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  },

  // ── Layout Presets (legacy elements) ─────────────────────────
  applyLayoutPreset: (presetId) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (!preset || preset.slots.length === 0) return;
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const elements = [...page.elements];
    if (elements.length === 0) {
      toast.info('Tambahkan elemen dulu, lalu pilih layout');
      return;
    }
    const updated = elements.map((el, i) => {
      const slotIdx = Math.min(i, preset.slots.length - 1);
      const slot = preset.slots[slotIdx];
      const sharedCount = Math.max(0, i - slotIdx);
      const offset = sharedCount * 2;
      return { ...el, x: slot!.x + offset, y: slot!.y + offset, w: slot!.w, h: slot!.h };
    });
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, elements: updated };
    set({ pages: newPages });
    notifyMutation();
    toast.success(`Layout "${preset.name}" diterapkan`);
  },

  currentLayoutPreset: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || page.elements.length === 0) return LAYOUT_PRESETS[0];
    const els = page.elements;
    for (const preset of LAYOUT_PRESETS) {
      if (preset.slots.length === 0) continue;
      if (preset.slots.length !== els.length) continue;
      let match = true;
      for (let i = 0; i < els.length; i++) {
        const s = preset.slots[i];
        const e = els[i];
        if (Math.abs(e!.x - s!.x) > 3 || Math.abs(e!.y - s!.y) > 3 ||
            Math.abs(e!.w - s!.w) > 3 || Math.abs(e!.h - s!.h) > 3) {
          match = false; break;
        }
      }
      if (match) return preset;
    }
    return LAYOUT_PRESETS[0];
  },

  // ── Stage ────────────────────────────────────────────────────
  clearStage: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    const hasLegacyElements = page.elements && page.elements.length > 0;
    const hasSchemaBlocks = page.schema?.blocks && page.schema.blocks.length > 0;
    if (!hasLegacyElements && !hasSchemaBlocks) return;

    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: [],
      ...(hasSchemaBlocks ? {
        schema: {
          ...page.schema!,
          blocks: [],
          version: (page.schema!.version || 1) + 1,
        },
      } : {}),
    };
    set({ pages: newPages, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    notifyMutation();
    toast.success('Stage dibersihkan');
  },

  // ── Legacy Element Nudge ─────────────────────────────────────
  nudgeSelected: (dx, dy) => {
    const { selectedElIds, pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const idsToNudge = selectedElIds.length > 0 ? selectedElIds : (get().selectedElId ? [get().selectedElId!] : []);
    if (idsToNudge.length === 0) return;
    const now = Date.now();
    const lastNudge = get()._lastNudgeTime;
    if (!lastNudge || now - lastNudge > 500) {
      get()._pushHistory();
    }
    set({ _lastNudgeTime: now });
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(e => {
        if (!idsToNudge.includes(e.id)) return e;
        return { ...e, x: Math.max(0, Math.min(95, e.x + dx)), y: Math.max(0, Math.min(95, e.y + dy)) };
      }),
    };
    set({ pages: newPages });
    notifyMutation();
  },

  // ── Legacy Element Alignment ─────────────────────────────────
  alignSelected: (direction) => {
    const { pages, currentPageIndex, selectedElIds, selectedElId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const ids = selectedElIds.length > 0 ? selectedElIds : (selectedElId ? [selectedElId] : []);
    if (ids.length < 2) { toast.info('Pilih minimal 2 elemen untuk alignment'); return; }
    get()._pushHistory();
    const allEls = page.elements;
    const targets = ids.map(id => allEls.find(e => e.id === id)).filter(Boolean) as CanvaElement[];
    if (targets.length < 2) return;

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
    };
    set({ pages: newPages });
    notifyMutation();
    toast.success(`Align ${direction} diterapkan`);
  },

  distributeSelected: (axis) => {
    const { pages, currentPageIndex, selectedElIds, selectedElId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const ids = selectedElIds.length > 0 ? selectedElIds : (selectedElId ? [selectedElId] : []);
    if (ids.length < 3) { toast.info('Pilih minimal 3 elemen untuk distribusi'); return; }
    get()._pushHistory();
    const allEls = page.elements;
    const targets = ids.map(id => allEls.find(e => e.id === id)).filter(Boolean) as CanvaElement[];
    if (targets.length < 3) return;

    if (axis === 'horizontal') {
      const sorted = [...targets].sort((a, b) => a.x - b.x);
      const min = sorted[0]!.x;
      const max = sorted[sorted.length - 1]!.x + sorted[sorted.length - 1]!.w;
      const totalW = sorted.reduce((s, e) => s + e.w, 0);
      const gap = (max - min - totalW) / (sorted.length - 1);
      let current = min;
      const updates = new Map<string, number>();
      for (const el of sorted) { updates.set(el.id, current); current += el.w + gap; }
      const newPages = [...pages];
      newPages[currentPageIndex] = {
        ...page,
        elements: page.elements.map(e => updates.has(e.id) ? { ...e, x: updates.get(e.id)! } : e),
      };
      set({ pages: newPages });
      notifyMutation();
    } else {
      const sorted = [...targets].sort((a, b) => a.y - b.y);
      const min = sorted[0]!.y;
      const max = sorted[sorted.length - 1]!.y + sorted[sorted.length - 1]!.h;
      const totalH = sorted.reduce((s, e) => s + e.h, 0);
      const gap = (max - min - totalH) / (sorted.length - 1);
      let current = min;
      const updates = new Map<string, number>();
      for (const el of sorted) { updates.set(el.id, current); current += el.h + gap; }
      const newPages = [...pages];
      newPages[currentPageIndex] = {
        ...page,
        elements: page.elements.map(e => updates.has(e.id) ? { ...e, y: updates.get(e.id)! } : e),
      };
      set({ pages: newPages });
      notifyMutation();
    }
    toast.success(`Distribusi ${axis === 'horizontal' ? 'horizontal' : 'vertikal'} diterapkan`);
  },
});
