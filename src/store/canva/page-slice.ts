// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Page actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaPage, CanvaElement, PageTemplateType } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import {
  populateTemplateElements,
} from '@/lib/canva-constants';
import { createPage, createElId } from './constants';
import { getTemplateLabel, buildTemplateData, getTemplateExtraProps } from './template-data';

export type PageSlice = Pick<
  CanvaState,
  | 'goPage' | 'addPage' | 'addTemplatePage' | 'duplicatePage'
  | 'deletePage' | 'setPageLabel' | 'setTemplateType' | 'setVariant' | 'reorderPage'
  | 'unlockPage' | 'relockPage'
>;

export const createPageSlice: StateCreator<CanvaState, [], [], PageSlice> = (set, get) => ({
  goPage: (idx) => {
    const pages = get().pages;
    if (idx < 0 || idx >= pages.length) return;
    set({ currentPageIndex: idx, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
  },

  addPage: () => {
    const pages = get().pages;
    const newPage = createPage('Halaman ' + (pages.length + 1), 'custom');
    get()._pushHistory();
    set({ pages: [...pages, newPage], currentPageIndex: pages.length, selectedElId: null });
    toast.success('Halaman baru ditambahkan');
  },

  addTemplatePage: (templateType) => {
    const pages = get().pages;
    const label = getTemplateLabel(templateType, pages.length);
    const newPage = createPage(label, templateType);
    newPage.templateData = buildTemplateData(templateType);
    newPage.locked = true; // Template pages always start locked (auto-sync from authoring)
    Object.assign(newPage, getTemplateExtraProps(templateType));

    // Auto-fill elements for template (compatible with export)
    newPage.elements = populateTemplateElements(newPage, createElId);

    get()._pushHistory();
    set({ pages: [...pages, newPage], currentPageIndex: pages.length, selectedElId: null });
    toast.success(`${label} ditambahkan`);
  },

  duplicatePage: () => {
    const { pages, currentPageIndex } = get();
    const orig = pages[currentPageIndex];
    const clone: CanvaPage = structuredClone(orig);
    clone.id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    clone.label = orig.label + ' (Salinan)';
    clone.elements.forEach((el: CanvaElement) => {
      el.id = createElId();
    });
    (clone.overlayElements || []).forEach((el: CanvaElement) => {
      el.id = createElId();
    });
    const newPages = [...pages];
    newPages.splice(currentPageIndex + 1, 0, clone);
    get()._pushHistory();
    set({ pages: newPages, currentPageIndex: currentPageIndex + 1, selectedElId: null });
    toast.success('Halaman diduplikat');
  },

  deletePage: () => {
    const { pages, currentPageIndex } = get();
    if (pages.length <= 1) { toast.warning('Minimal 1 halaman'); return; }
    get()._pushHistory();
    const newPages = pages.filter((_, i) => i !== currentPageIndex);
    set({
      pages: newPages,
      currentPageIndex: Math.max(0, currentPageIndex - 1),
      selectedElId: null,
    });
    toast.success('Halaman dihapus');
  },

  setPageLabel: (label) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], label };
    set({ pages: newPages });
  },

  setTemplateType: (templateType) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const newPages = [...pages];

    const isTemplate = templateType !== 'custom';
    // Populate templateData using centralized builder
    const newPage = { ...page, templateType, templateVariant: 'A' as const, templateData: buildTemplateData(templateType) };
    Object.assign(newPage, getTemplateExtraProps(templateType));

    // Re-populate placeholder elements for export compat
    newPage.elements = populateTemplateElements(newPage, createElId);

    // Reset lock state: template pages always start locked,
    // custom pages don't have the lock concept
    if (isTemplate) {
      newPage.locked = true;
      newPage.overlayElements = [];
    } else {
      newPage.locked = undefined;
    }

    newPages[currentPageIndex] = newPage;
    set({ pages: newPages, selectedElId: null });
  },

  setVariant: (variant) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, templateVariant: variant };
    set({ pages: newPages });
  },

  reorderPage: (fromIndex, toIndex) => {
    const { pages, currentPageIndex } = get();
    if (fromIndex === toIndex) return;
    get()._pushHistory();
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    // Adjust currentPageIndex if needed
    let newCurrentIdx = currentPageIndex;
    if (currentPageIndex === fromIndex) newCurrentIdx = toIndex;
    else if (fromIndex < currentPageIndex && toIndex >= currentPageIndex) newCurrentIdx = currentPageIndex - 1;
    else if (fromIndex > currentPageIndex && toIndex <= currentPageIndex) newCurrentIdx = currentPageIndex + 1;
    set({ pages: newPages, currentPageIndex: newCurrentIdx, selectedElId: null });
  },

  unlockPage: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    // Only template pages can be unlocked
    const isTemplate = page.templateType && page.templateType !== 'custom';
    if (!isTemplate) {
      toast.warning('Halaman ini sudah bebas edit');
      return;
    }
    // Already unlocked
    if (page.locked === false) {
      toast.info('Halaman ini sudah terbuka kuncinya');
      return;
    }

    get()._pushHistory();
    const newPages = [...pages];
    // Filter out placeholder elements (isPlaceholder: true — set by populateTemplateElements)
    // These are full-page elements only for export compat and should NOT
    // become visible draggable boxes after unlock.
    const realElements = page.elements.filter(el => !el.isPlaceholder);
    // Merge real elements + overlay elements so all are draggable
    const mergedElements = [...realElements, ...(page.overlayElements || [])];
    newPages[currentPageIndex] = {
      ...page,
      locked: false,
      elements: mergedElements,
      overlayElements: [], // No more overlay concept for unlocked pages
    };
    set({ pages: newPages, selectedElId: null });
    toast.success(`🔒→🔓 ${page.label} dibuka kuncinya — template beku, semua elemen bisa diedit`);
  },

  relockPage: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    // Only unlocked template pages can be re-locked
    const isTemplate = page.templateType && page.templateType !== 'custom';
    if (!isTemplate) {
      toast.warning('Halaman ini bukan template');
      return;
    }
    if (page.locked !== false) {
      toast.info('Halaman ini sudah terkunci');
      return;
    }

    get()._pushHistory();
    const newPages = [...pages];
    // Re-lock: refresh templateData from authoring, reset to locked template mode
    const freshTemplateData = buildTemplateData(page.templateType);
    // Populate fresh placeholder elements for the template
    const freshElements = populateTemplateElements({ ...page, templateData: freshTemplateData }, createElId);

    // Filter user elements: keep only non-placeholder elements that are
    // NOT full-page (x:0,y:0,w:100,h:100) — those were the original
    // template placeholder elements that got converted during unlock.
    // Full-page elements that match placeholder positions are likely
    // remnants of the old template, not user-placed content.
    const userElements = page.elements.filter(el => {
      if (el.isPlaceholder) return false; // Skip placeholders
      // Skip elements that look like converted placeholders:
      // full-page size with type modul/materi/kuis/game
      const isFullPage = el.x <= 2 && el.y <= 2 && el.w >= 96 && el.h >= 96;
      const isTemplateType = ['modul', 'materi', 'kuis', 'game'].includes(el.type);
      if (isFullPage && isTemplateType) return false;
      return true;
    });

    const newPage: CanvaPage = {
      ...page,
      locked: true,
      templateData: freshTemplateData,
      overlayElements: userElements, // Preserve genuine user elements as overlays
      elements: freshElements,
    };
    Object.assign(newPage, getTemplateExtraProps(page.templateType));
    newPages[currentPageIndex] = newPage;
    set({ pages: newPages, selectedElId: null });
    toast.success(`🔓→🔒 ${page.label} dikunci kembali — auto-sync aktif, data diperbarui dari authoring`);
  },
});
