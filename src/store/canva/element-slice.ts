// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Element actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaElement, PageTemplateType } from '@/components/canva/types';
import { ELEM_TYPES } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import { GAME_TYPES } from '@/lib/canva-export-helpers';
import { getModuleIcon, getGameIcon } from '@/lib/canva-icon-maps';
import { createElId } from './constants';
import { resolveModule, generateKuisId } from '@/lib/module-resolver';

export type ElementSlice = Pick<
  CanvaState,
  | 'addElement' | 'addKuisElement' | 'addGameElement' | 'selectElement'
  | 'toggleElementSelection' | 'selectAllElements' | 'clearSelection' | 'deleteSelectedElements'
  | 'updateElement' | 'deleteElement' | 'deleteSelected'
  | 'toggleElementVisibility' | 'saveTextContent' | 'moveElementZ'
>;

// ── Helper: determine if page is in template mode ──────────────
function isTemplatePage(templateType: PageTemplateType | undefined): boolean {
  return !!templateType && templateType !== 'custom';
}

export const createElementSlice: StateCreator<CanvaState, [], [], ElementSlice> = (set, get) => ({
  addElement: (type, x, y) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const typeInfo = ELEM_TYPES.find(t => t.id === type);
    const el: CanvaElement = {
      id: createElId(),
      type,
      icon: typeInfo?.icon || '',
      label: typeInfo?.name || type,
      x: x ?? 5,
      y: y ?? 10,
      w: 40,
      h: 30,
      opacity: 100,
    };
    if (type === 'teks') { el.text = 'Judul Halaman'; el.fontSize = 24; el.h = 15; }
    if (type === 'shape') { el.color = 'rgba(255,255,255,.1)'; el.radius = 8; el.h = 20; }
    if (type === 'kuis') {
      el.w = 55; el.h = 65;
      el.icon = '❓'; el.label = 'Kuis Interaktif';
    }
    if (type === 'game') {
      el.w = 45; el.h = 60;
      el.icon = '🎮';
      const modules = useAuthoringStore.getState().modules;
      const gameIdx = modules.findIndex((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string));
      if (gameIdx >= 0) {
        el.dataIdx = gameIdx;
        el.moduleId = (modules[gameIdx]._id as string) || undefined;
        el.label = 'Game: ' + (modules[gameIdx].title as string || modules[gameIdx].type as string);
      } else {
        el.label = 'Game Interaktif';
      }
    }
    const newPages = [...pages];
    // Phase 1: Template pages use overlayElements; custom pages use elements
    if (isTemplatePage(page.templateType)) {
      newPages[currentPageIndex] = {
        ...page,
        overlayElements: [...(page.overlayElements || []), el],
      };
    } else {
      newPages[currentPageIndex] = {
        ...page,
        elements: [...page.elements, el],
      };
    }
    get()._pushHistory();
    set({ pages: newPages, selectedElId: el.id, selectedElIds: [el.id] });
    toast.success(`${typeInfo?.name || type} ditambahkan`);
  },

  addKuisElement: (idx) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const kuis = useAuthoringStore.getState().kuis;
    const kuisItem = kuis[idx];
    // Generate stable kuisId if item doesn't have one
    const kid = (kuisItem?._id as string) || generateKuisId();
    const el: CanvaElement = {
      id: createElId(),
      type: 'kuis',
      icon: '❓',
      label: 'Kuis #' + (idx + 1),
      dataIdx: idx,
      kuisId: kid,
      x: 5, y: 5, w: 45, h: 40,
      opacity: 100,
    };
    const newPages = [...pages];
    if (isTemplatePage(page.templateType)) {
      newPages[currentPageIndex] = {
        ...page,
        overlayElements: [...(page.overlayElements || []), el],
      };
    } else {
      newPages[currentPageIndex] = {
        ...page,
        elements: [...page.elements, el],
      };
    }
    get()._pushHistory();
    set({ pages: newPages, selectedElId: el.id, selectedElIds: [el.id] });
  },

  addGameElement: (idx) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const modules = useAuthoringStore.getState().modules;
    const gameModules = modules.filter((m: Record<string, unknown>) => (GAME_TYPES as readonly string[]).includes(m.type as string));
    const gameMod = gameModules[idx];
    // Also find the actual index in modules[] (not gameModules[]) for dataIdx
    const actualIdx = gameMod ? modules.indexOf(gameMod) : -1;
    const el: CanvaElement = {
      id: createElId(),
      type: 'game',
      icon: '🎮',
      label: 'Game #' + (idx + 1),
      dataIdx: actualIdx >= 0 ? actualIdx : idx, // Index in modules[], not gameModules[]
      moduleId: (gameMod?._id as string) || undefined,
      x: 55, y: 5, w: 40, h: 40,
      opacity: 100,
    };
    const newPages = [...pages];
    if (isTemplatePage(page.templateType)) {
      newPages[currentPageIndex] = {
        ...page,
        overlayElements: [...(page.overlayElements || []), el],
      };
    } else {
      newPages[currentPageIndex] = {
        ...page,
        elements: [...page.elements, el],
      };
    }
    get()._pushHistory();
    set({ pages: newPages, selectedElId: el.id, selectedElIds: [el.id] });
  },

  selectElement: (elId) => set({ selectedElId: elId, selectedElIds: elId ? [elId] : [] }),

  // Phase 4: Multi-select — toggle element in/out of selection
  toggleElementSelection: (elId) => {
    const { selectedElIds, selectedElId } = get();
    if (selectedElIds.includes(elId)) {
      // Remove from selection
      const newIds = selectedElIds.filter(id => id !== elId);
      set({
        selectedElIds: newIds,
        selectedElId: newIds.length > 0 ? newIds[0] : null,
      });
    } else {
      // Add to selection
      const newIds = [...selectedElIds, elId];
      set({
        selectedElIds: newIds,
        selectedElId: elId, // Most recently clicked becomes primary
      });
    }
  },

  // Phase 4: Select all elements on current page
  selectAllElements: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const allIds = [
      ...page.elements.map(e => e.id),
      ...(page.overlayElements || []).map(e => e.id),
    ];
    set({ selectedElIds: allIds, selectedElId: allIds.length > 0 ? allIds[0] : null });
  },

  // Phase 4: Clear all selections
  clearSelection: () => set({ selectedElIds: [], selectedElId: null }),

  // Phase 4: Delete all selected elements
  deleteSelectedElements: () => {
    const { pages, currentPageIndex, selectedElIds } = get();
    const page = pages[currentPageIndex];
    if (!page || selectedElIds.length === 0) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.filter(e => !selectedElIds.includes(e.id)),
      overlayElements: (page.overlayElements || []).filter(e => !selectedElIds.includes(e.id)),
    };
    set({ pages: newPages, selectedElIds: [], selectedElId: null });
    toast.success(`${selectedElIds.length} elemen dihapus`);
  },

  updateElement: (elId, props) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    // Check if element is in overlayElements or regular elements
    const isInOverlay = (page.overlayElements || []).some(e => e.id === elId);
    if (isInOverlay) {
      newPages[currentPageIndex] = {
        ...page,
        overlayElements: (page.overlayElements || []).map(el =>
          el.id === elId ? { ...el, ...props } : el
        ),
      };
    } else {
      newPages[currentPageIndex] = {
        ...page,
        elements: page.elements.map(el =>
          el.id === elId ? { ...el, ...props } : el
        ),
      };
    }
    set({ pages: newPages });
  },

  deleteElement: (elId) => {
    const { pages, currentPageIndex, selectedElId, selectedElIds } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const newPages = [...pages];
    // Remove from both overlayElements and elements to be safe
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.filter(e => e.id !== elId),
      overlayElements: (page.overlayElements || []).filter(e => e.id !== elId),
    };
    // Phase 4: Also remove from multi-select
    const newSelectedIds = selectedElIds.filter(id => id !== elId);
    set({
      pages: newPages,
      selectedElId: selectedElId === elId ? (newSelectedIds.length > 0 ? newSelectedIds[0] : null) : selectedElId,
      selectedElIds: newSelectedIds,
    });
  },

  deleteSelected: () => {
    const { selectedElIds, deleteSelectedElements, selectedElId, deleteElement } = get();
    // Phase 4: If multi-select, use bulk delete
    if (selectedElIds.length > 1) {
      deleteSelectedElements();
    } else if (selectedElId) {
      deleteElement(selectedElId);
      toast.success('Elemen dihapus');
    }
  },

  moveElementZ: (elId, direction) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const isInOverlay = (page.overlayElements || []).some(e => e.id === elId);
    const elements = isInOverlay ? (page.overlayElements || []) : page.elements;
    const idx = elements.findIndex(e => e.id === elId);
    if (idx === -1) return;
    get()._pushHistory();
    const els = [...elements];
    const el = els[idx];
    els.splice(idx, 1);
    let newIdx = idx;
    if (direction === 'up') newIdx = Math.min(els.length, idx + 1);
    else if (direction === 'down') newIdx = Math.max(0, idx - 1);
    else if (direction === 'top') newIdx = els.length;
    else if (direction === 'bottom') newIdx = 0;
    els.splice(newIdx, 0, el);
    const newPages = [...pages];
    if (isInOverlay) {
      newPages[currentPageIndex] = { ...page, overlayElements: els };
    } else {
      newPages[currentPageIndex] = { ...page, elements: els };
    }
    set({ pages: newPages });
  },

  toggleElementVisibility: (elId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    const isInOverlay = (page.overlayElements || []).some(e => e.id === elId);
    if (isInOverlay) {
      newPages[currentPageIndex] = {
        ...page,
        overlayElements: (page.overlayElements || []).map(el =>
          el.id === elId ? { ...el, hidden: !el.hidden } : el
        ),
      };
    } else {
      newPages[currentPageIndex] = {
        ...page,
        elements: page.elements.map(el =>
          el.id === elId ? { ...el, hidden: !el.hidden } : el
        ),
      };
    }
    set({ pages: newPages });
  },

  saveTextContent: (elId, text) => {
    get().updateElement(elId, { text });
  },
});
