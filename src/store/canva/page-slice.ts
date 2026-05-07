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
} from '@/lib/canva-export-helpers';
import { createPage, createElId } from './constants';
import { getTemplateLabel, buildTemplateData, getTemplateExtraProps } from './template-data';

export type PageSlice = Pick<
  CanvaState,
  | 'goPage' | 'addPage' | 'addTemplatePage' | 'duplicatePage'
  | 'deletePage' | 'setPageLabel' | 'setTemplateType' | 'reorderPage'
>;

export const createPageSlice: StateCreator<CanvaState, [], [], PageSlice> = (set, get) => ({
  goPage: (idx) => {
    const pages = get().pages;
    if (idx < 0 || idx >= pages.length) return;
    set({ currentPageIndex: idx, selectedElId: null });
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
    Object.assign(newPage, getTemplateExtraProps(templateType));

    // Auto-fill elements for template (compatible with export)
    populateTemplateElements(newPage, createElId);

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

    // Populate templateData using centralized builder
    const newPage = { ...page, templateType, templateData: buildTemplateData(templateType) };
    Object.assign(newPage, getTemplateExtraProps(templateType));

    // Re-populate placeholder elements for export compat
    populateTemplateElements(newPage, createElId);

    newPages[currentPageIndex] = newPage;
    set({ pages: newPages, selectedElId: null });
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
});
