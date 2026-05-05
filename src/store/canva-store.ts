// ═══════════════════════════════════════════════════════════════
// ZUSTAND STORE — Canva Mode State Management (Page Assembler v2)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { toast } from 'sonner';
import { renderModuleToStyledHTML } from '@/lib/render-module-html';
import type { LayoutVariant } from '@/components/shared/PresetModuleCard';
import {
  type CanvaPage,
  type CanvaElement,
  type LeftTab,
  type Tool,
  type Ratio,
  type PageTemplateType,
  type ColorPalette,
  type NavConfig,
  RATIOS,
  ELEM_TYPES,
  DEFAULT_NAV_CONFIG,
} from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
import { extractColorPalette } from '@/lib/color-palette';

function createPage(label: string, templateType: PageTemplateType = 'custom'): CanvaPage {
  return {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    label,
    bgDataUrl: null,
    bgColor: templateType === 'custom' ? '#1a1a2e' : '#0f172a',
    overlay: 20,
    elements: [],
    templateType,
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
  };
}

function createElId(): string {
  return 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// ── Snapshot type for undo/redo ────────────────────────────────
type Snapshot = {
  pages: CanvaPage[];
  currentPageIndex: number;
  ratioId: string;
};

const MAX_HISTORY = 50;
const CANVA_STORAGE_KEY = 'canva_state_v2';

interface CanvaState {
  // ── Persisted state ──────────────────────────────────────────
  pages: CanvaPage[];
  currentPageIndex: number;
  ratioId: string;

  // ── UI state ─────────────────────────────────────────────────
  zoom: number;
  tool: Tool;
  leftTab: LeftTab;
  selectedElId: string | null;
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;

  // ── History (undo/redo) ─────────────────────────────────────
  _history: Snapshot[];
  _historyIdx: number;
  _skipHistory: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  _pushHistory: () => void;

  // ── Computed helpers ─────────────────────────────────────────
  currentPage: () => CanvaPage | undefined;
  currentRatio: () => Ratio;
  selectedElement: () => CanvaElement | undefined;

  // ── Actions: Page ────────────────────────────────────────────
  goPage: (idx: number) => void;
  addPage: () => void;
  addTemplatePage: (templateType: PageTemplateType) => void;
  duplicatePage: () => void;
  deletePage: () => void;
  setPageLabel: (label: string) => void;
  setTemplateType: (templateType: PageTemplateType) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;

  // ── Actions: Background ──────────────────────────────────────
  setBgColor: (hex: string) => void;
  setBgImage: (dataUrl: string) => void;
  setOverlay: (val: number) => void;

  // ── Actions: Color Palette ───────────────────────────────────
  extractAndSetPalette: (dataUrl: string) => void;
  setPaletteMapping: (key: string, colorIdx: number) => void;

  // ── Actions: Nav Config ──────────────────────────────────────
  updateNavConfig: (updates: Partial<NavConfig>) => void;

  // ── Actions: Template Data ───────────────────────────────────
  updateTemplateData: (key: string, value: unknown) => void;

  // ── Actions: Element ─────────────────────────────────────────
  addElement: (type: string, x?: number, y?: number) => void;
  addKuisElement: (idx: number) => void;
  addGameElement: (idx: number) => void;
  selectElement: (elId: string | null) => void;
  updateElement: (elId: string, props: Partial<CanvaElement>) => void;
  deleteElement: (elId: string) => void;
  deleteSelected: () => void;
  toggleElementVisibility: (elId: string) => void;
  saveTextContent: (elId: string, text: string) => void;
  moveElementZ: (elId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;

  // ── Actions: Tool & UI ───────────────────────────────────────
  setTool: (tool: Tool) => void;
  setLeftTab: (tab: LeftTab) => void;
  setZoom: (zoom: number) => void;
  zoomDelta: (delta: number) => void;
  setRatio: (ratioId: string) => void;
  nudgeSelected: (dx: number, dy: number) => void;

  // ── Actions: Stage ───────────────────────────────────────────
  clearStage: () => void;

  // ── Actions: Auto Rakit ──────────────────────────────────────
  autoRakit: () => void;

  // ── Actions: Persistence ─────────────────────────────────────
  saveToStorage: () => void;
  loadFromStorage: () => boolean;

  // ── Export helpers ───────────────────────────────────────────
  exportPageHTML: (pageIdx?: number) => string;
  exportSlideshowHTML: () => string;
}

export const useCanvaStore = create<CanvaState>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────
  pages: [createPage('Halaman 1', 'custom')],
  currentPageIndex: 0,
  ratioId: '16:9',
  zoom: 1.0,
  tool: 'select',
  leftTab: 'templates',
  selectedElId: null,
  rightPanelOpen: true,

  // ── History ──────────────────────────────────────────────────
  _history: [],
  _historyIdx: -1,
  _skipHistory: false,

  _pushHistory: () => {
    const { pages, currentPageIndex, ratioId, _history, _historyIdx, _skipHistory } = get();
    if (_skipHistory) return;
    const snapshot: Snapshot = { pages: JSON.parse(JSON.stringify(pages)), currentPageIndex, ratioId };
    const newHistory = _history.slice(0, _historyIdx + 1);
    newHistory.push(snapshot);
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ _history: newHistory, _historyIdx: newHistory.length - 1 });
  },

  undo: () => {
    const { _history, _historyIdx } = get();
    if (_historyIdx <= 0) return;
    const prev = _history[_historyIdx - 1];
    if (!prev) return;
    set({
      ...JSON.parse(JSON.stringify(prev)),
      _historyIdx: _historyIdx - 1,
      _skipHistory: true,
      selectedElId: null,
    });
    set({ _skipHistory: false });
    toast.info('Undo');
  },

  redo: () => {
    const { _history, _historyIdx } = get();
    if (_historyIdx >= _history.length - 1) return;
    const next = _history[_historyIdx + 1];
    if (!next) return;
    set({
      ...JSON.parse(JSON.stringify(next)),
      _historyIdx: _historyIdx + 1,
      _skipHistory: true,
      selectedElId: null,
    });
    set({ _skipHistory: false });
    toast.info('Redo');
  },

  canUndo: () => get()._historyIdx > 0,
  canRedo: () => get()._historyIdx < get()._history.length - 1,

  // ── Computed ─────────────────────────────────────────────────
  currentPage: () => get().pages[get().currentPageIndex],
  currentRatio: () => RATIOS.find(r => r.id === get().ratioId) || RATIOS[0],
  selectedElement: () => {
    const page = get().pages[get().currentPageIndex];
    if (!page) return undefined;
    return page.elements.find(e => e.id === get().selectedElId);
  },

  // ── Page actions ─────────────────────────────────────────────
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
    const authStore = useAuthoringStore.getState();
    const meta = authStore.meta;

    // Generate page label based on template type
    const labelMap: Record<string, string> = {
      cover: 'Cover - ' + (meta.judulPertemuan || 'Halaman Judul'),
      dokumen: 'Dokumen CP/TP/ATP',
      materi: 'Materi Pembelajaran',
      kuis: 'Kuis Interaktif',
      game: 'Game Interaktif',
      hasil: 'Hasil & Apresiasi',
      hero: 'Hero Banner',
      skenario: 'Skenario Interaktif',
      custom: 'Halaman ' + (pages.length + 1),
    };

    const newPage = createPage(labelMap[templateType] || 'Halaman ' + (pages.length + 1), templateType);

    // Pre-fill template data from authoring store
    switch (templateType) {
      case 'cover':
        newPage.templateData = {
          title: meta.judulPertemuan || 'Judul Pertemuan',
          subtitle: meta.subjudul || 'Subjudul',
          icon: meta.ikon || '📚',
          mapel: meta.mapel || '',
          kelas: meta.kelas || '',
          namaBab: meta.namaBab || '',
        };
        newPage.bgColor = '#0f172a';
        break;

      case 'dokumen':
        newPage.templateData = {
          cp: authStore.cp,
          tp: authStore.tp,
          atp: authStore.atp,
        };
        break;

      case 'materi':
        newPage.templateData = {
          blok: authStore.materi.blok,
          modules: authStore.modules.filter((m: Record<string, unknown>) =>
            ['materi', 'infografis', 'accordion', 'tab-icons', 'icon-explore', 'timeline'].includes(m.type as string)
          ),
        };
        break;

      case 'kuis':
        newPage.templateData = {
          kuis: authStore.kuis.filter(k => k.q.trim()),
        };
        break;

      case 'game': {
        const GAME_TYPES = ['truefalse', 'memory', 'matching', 'roda', 'sorting', 'spinwheel', 'teambuzzer', 'wordsearch', 'flashcard'];
        newPage.templateData = {
          games: authStore.modules.filter((m: Record<string, unknown>) =>
            GAME_TYPES.includes(m.type as string)
          ),
        };
        break;
      }

      case 'hasil':
        newPage.templateData = {
          totalKuis: authStore.kuis.filter(k => k.q.trim()).length,
          namaBab: meta.namaBab || '',
        };
        break;

      case 'skenario':
        newPage.templateData = {
          skenario: authStore.skenario,
        };
        break;

      case 'hero': {
        const heroModules = authStore.modules.filter((m: Record<string, unknown>) => m.type === 'hero');
        const heroData = heroModules[0] as Record<string, unknown> | undefined;
        newPage.templateData = {
          title: (heroData?.title as string) || meta.judulPertemuan || 'Hero Banner',
          subtitle: (heroData?.subjudul as string) || meta.subjudul || '',
          icon: (heroData?.icon as string) || meta.ikon || '🚀',
          gradient: (heroData?.gradient as string) || 'sunset',
          cta: (heroData?.cta as string) || '',
        };
        break;
      }
    }

    // Auto-fill elements for template (compatible with export)
    populateTemplateElements(newPage);

    get()._pushHistory();
    set({ pages: [...pages, newPage], currentPageIndex: pages.length, selectedElId: null });
    toast.success(`${labelMap[templateType] || 'Halaman'} ditambahkan`);
  },

  duplicatePage: () => {
    const { pages, currentPageIndex } = get();
    const orig = pages[currentPageIndex];
    const clone: CanvaPage = JSON.parse(JSON.stringify(orig));
    clone.id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    clone.label = orig.label + ' (Salinan)';
    clone.elements.forEach((el: CanvaElement) => {
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

    // Populate templateData when switching to a template type
    const authStore = useAuthoringStore.getState();
    const meta = authStore.meta;
    const newPage = { ...page, templateType, templateData: page.templateData || {} };

    switch (templateType) {
      case 'cover':
        newPage.templateData = {
          title: meta.judulPertemuan || 'Judul Pertemuan',
          subtitle: meta.subjudul || 'Subjudul',
          icon: meta.ikon || '📚',
          mapel: meta.mapel || '',
          kelas: meta.kelas || '',
          namaBab: meta.namaBab || '',
        };
        newPage.bgColor = '#0f172a';
        break;
      case 'dokumen':
        newPage.templateData = { cp: authStore.cp, tp: authStore.tp, atp: authStore.atp };
        break;
      case 'materi':
        newPage.templateData = {
          blok: authStore.materi.blok,
          modules: authStore.modules.filter((m: Record<string, unknown>) =>
            ['materi', 'infografis', 'accordion', 'tab-icons', 'icon-explore', 'timeline'].includes(m.type as string)
          ),
        };
        break;
      case 'kuis':
        newPage.templateData = { kuis: authStore.kuis.filter(k => k.q.trim()) };
        break;
      case 'game': {
        const GAME_TYPES = ['truefalse', 'memory', 'matching', 'roda', 'sorting', 'spinwheel', 'teambuzzer', 'wordsearch', 'flashcard'];
        newPage.templateData = {
          games: authStore.modules.filter((m: Record<string, unknown>) => GAME_TYPES.includes(m.type as string)),
        };
        break;
      }
      case 'hasil':
        newPage.templateData = { totalKuis: authStore.kuis.filter(k => k.q.trim()).length, namaBab: meta.namaBab || '' };
        break;
      case 'skenario':
        newPage.templateData = { skenario: authStore.skenario };
        break;
      case 'hero': {
        const heroModules = authStore.modules.filter((m: Record<string, unknown>) => m.type === 'hero');
        const heroData = heroModules[0] as Record<string, unknown> | undefined;
        newPage.templateData = {
          title: (heroData?.title as string) || meta.judulPertemuan || 'Hero Banner',
          subtitle: (heroData?.subjudul as string) || meta.subjudul || '',
          icon: (heroData?.icon as string) || meta.ikon || '🚀',
          gradient: (heroData?.gradient as string) || 'sunset',
          cta: (heroData?.cta as string) || '',
        };
        break;
      }
      case 'custom':
        newPage.templateData = {};
        break;
    }

    // Re-populate placeholder elements for export compat
    populateTemplateElements(newPage);

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

  // ── Background actions ───────────────────────────────────────
  setBgColor: (hex) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], bgColor: hex };
    set({ pages: newPages });
  },

  setBgImage: (dataUrl) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], bgDataUrl: dataUrl };
    set({ pages: newPages });
    // Auto-extract color palette from image
    get().extractAndSetPalette(dataUrl);
    toast.success('Background diterapkan');
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

  // ── Element actions ──────────────────────────────────────────
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
      const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard'];
      const modules = useAuthoringStore.getState().modules;
      const gameIdx = modules.findIndex((m: Record<string, unknown>) => GAME_TYPES.includes(m.type as string));
      if (gameIdx >= 0) {
        el.dataIdx = gameIdx;
        el.label = 'Game: ' + (modules[gameIdx].title as string || modules[gameIdx].type as string);
      } else {
        el.label = 'Game Interaktif';
      }
    }
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: [...page.elements, el],
    };
    get()._pushHistory();
    set({ pages: newPages, selectedElId: el.id });
    toast.success(`${typeInfo?.name || type} ditambahkan`);
  },

  addKuisElement: (idx) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const el: CanvaElement = {
      id: createElId(),
      type: 'kuis',
      icon: '❓',
      label: 'Kuis #' + (idx + 1),
      dataIdx: idx,
      x: 5, y: 5, w: 45, h: 40,
      opacity: 100,
    };
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: [...page.elements, el],
    };
    set({ pages: newPages, selectedElId: el.id });
  },

  addGameElement: (idx) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const el: CanvaElement = {
      id: createElId(),
      type: 'game',
      icon: '🎮',
      label: 'Game #' + (idx + 1),
      dataIdx: idx,
      x: 55, y: 5, w: 40, h: 40,
      opacity: 100,
    };
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: [...page.elements, el],
    };
    set({ pages: newPages, selectedElId: el.id });
  },

  selectElement: (elId) => set({ selectedElId: elId }),

  updateElement: (elId, props) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(el =>
        el.id === elId ? { ...el, ...props } : el
      ),
    };
    set({ pages: newPages });
  },

  deleteElement: (elId) => {
    const { pages, currentPageIndex, selectedElId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.filter(e => e.id !== elId),
    };
    set({
      pages: newPages,
      selectedElId: selectedElId === elId ? null : selectedElId,
    });
  },

  deleteSelected: () => {
    const { selectedElId, deleteElement } = get();
    if (selectedElId) {
      deleteElement(selectedElId);
      toast.success('Elemen dihapus');
    }
  },

  moveElementZ: (elId, direction) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const idx = page.elements.findIndex(e => e.id === elId);
    if (idx === -1) return;
    get()._pushHistory();
    const els = [...page.elements];
    const el = els[idx];
    els.splice(idx, 1);
    let newIdx = idx;
    if (direction === 'up') newIdx = Math.min(els.length, idx + 1);
    else if (direction === 'down') newIdx = Math.max(0, idx - 1);
    else if (direction === 'top') newIdx = els.length;
    else if (direction === 'bottom') newIdx = 0;
    els.splice(newIdx, 0, el);
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, elements: els };
    set({ pages: newPages });
  },

  toggleElementVisibility: (elId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(el =>
        el.id === elId ? { ...el, hidden: !el.hidden } : el
      ),
    };
    set({ pages: newPages });
  },

  saveTextContent: (elId, text) => {
    get().updateElement(elId, { text });
  },

  // ── Tool & UI ────────────────────────────────────────────────
  setTool: (tool) => set({ tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),

  nudgeSelected: (dx, dy) => {
    const { selectedElId, pages, currentPageIndex } = get();
    if (!selectedElId) return;
    const page = pages[currentPageIndex];
    if (!page) return;
    const el = page.elements.find(e => e.id === selectedElId);
    if (!el) return;
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

  // ── Auto Rakit ───────────────────────────────────────────────
  autoRakit: () => {
    const authStore = useAuthoringStore.getState();
    const meta = authStore.meta;
    const kuis = authStore.kuis.filter(k => k.q.trim());
    const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard'];
    const games = authStore.modules.filter((m: Record<string, unknown>) => GAME_TYPES.includes(m.type as string));
    const materiModules = authStore.modules.filter((m: Record<string, unknown>) =>
      ['materi', 'infografis', 'accordion', 'tab-icons', 'icon-explore', 'timeline', 'hero', 'kutipan', 'langkah', 'statistik'].includes(m.type as string)
    );

    const newPages: CanvaPage[] = [];

    // 1. Cover page
    newPages.push(createPage('Cover - ' + (meta.judulPertemuan || 'Judul'), 'cover'));
    newPages[newPages.length - 1].templateData = {
      title: meta.judulPertemuan || 'Judul Pertemuan',
      subtitle: meta.subjudul || 'Subjudul',
      icon: meta.ikon || '📚',
      mapel: meta.mapel || '',
      kelas: meta.kelas || '',
      namaBab: meta.namaBab || '',
    };
    newPages[newPages.length - 1].bgColor = '#0f172a';
    populateTemplateElements(newPages[newPages.length - 1]);

    // 2. Dokumen page (if CP/TP data exists)
    if (authStore.cp.capaianFase || authStore.tp.length > 0) {
      newPages.push(createPage('Dokumen CP/TP/ATP', 'dokumen'));
      newPages[newPages.length - 1].templateData = {
        cp: authStore.cp,
        tp: authStore.tp,
        atp: authStore.atp,
      };
      populateTemplateElements(newPages[newPages.length - 1]);
    }

    // 3. Skenario page (if skenario data exists)
    if (authStore.skenario.length > 0) {
      newPages.push(createPage('Skenario Interaktif', 'skenario'));
      newPages[newPages.length - 1].templateData = { skenario: authStore.skenario };
      populateTemplateElements(newPages[newPages.length - 1]);
    }

    // 4. Materi pages
    if (materiModules.length > 0 || authStore.materi.blok.length > 0) {
      newPages.push(createPage('Materi Pembelajaran', 'materi'));
      newPages[newPages.length - 1].templateData = {
        blok: authStore.materi.blok,
        modules: materiModules,
      };
      populateTemplateElements(newPages[newPages.length - 1]);
    }

    // 5. Kuis page
    if (kuis.length > 0) {
      newPages.push(createPage('Kuis Interaktif', 'kuis'));
      newPages[newPages.length - 1].templateData = { kuis };
      populateTemplateElements(newPages[newPages.length - 1]);
    }

    // 6. Game pages
    if (games.length > 0) {
      newPages.push(createPage('Game Interaktif', 'game'));
      newPages[newPages.length - 1].templateData = { games };
      populateTemplateElements(newPages[newPages.length - 1]);
    }

    // 7. Hasil page
    newPages.push(createPage('Hasil & Apresiasi', 'hasil'));
    newPages[newPages.length - 1].templateData = {
      totalKuis: kuis.length,
      namaBab: meta.namaBab || '',
    };
    populateTemplateElements(newPages[newPages.length - 1]);

    // If no pages were created (very unlikely), add at least one custom
    if (newPages.length === 0) {
      newPages.push(createPage('Halaman 1', 'custom'));
    }

    get()._pushHistory();
    set({ pages: newPages, currentPageIndex: 0, selectedElId: null });
    toast.success(`Auto Rakit: ${newPages.length} halaman dibuat dari data authoring`);
  },

  // ── Persistence ──────────────────────────────────────────────
  saveToStorage: () => {
    try {
      const { pages, ratioId } = get();
      localStorage.setItem(CANVA_STORAGE_KEY, JSON.stringify({ pages, ratioId }));
    } catch {
      // Storage full or unavailable
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(CANVA_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.pages && Array.isArray(data.pages)) {
        // Ensure all pages have new fields (backward compat)
        const pages = data.pages.map((p: CanvaPage) => ({
          ...p,
          templateType: p.templateType || 'custom',
          colorPalette: p.colorPalette || null,
          navConfig: p.navConfig || { ...DEFAULT_NAV_CONFIG },
          templateData: p.templateData || {},
          // Ensure elements have valid positions
          elements: (p.elements || []).map((el: CanvaElement) => ({
            ...el,
            opacity: el.opacity ?? 100,
            hidden: el.hidden ?? false,
          })),
        }));
        set({
          pages,
          ratioId: data.ratioId || '16:9',
          currentPageIndex: 0,
          selectedElId: null,
          rightPanelOpen: true,
        });
        return true;
      }
      return false;
    } catch {
      // If data is corrupt, clear it
      try { localStorage.removeItem(CANVA_STORAGE_KEY); } catch {}
      return false;
    }
  },

  // ── Export ───────────────────────────────────────────────────
  exportPageHTML: (pageIdx) => {
    const { pages, ratioId } = get();
    const idx = pageIdx ?? get().currentPageIndex;
    const page = pages[idx];
    if (!page) return '';
    const ratio = RATIOS.find(r => r.id === ratioId) || RATIOS[0];

    const bgStyle = page.bgDataUrl
      ? `background-image:url('${page.bgDataUrl}');background-size:cover;background-position:center`
      : `background:${page.bgColor || '#1a1a2e'}`;

    // Overlay for background images
    const overlayPct = page.bgDataUrl ? (page.overlay ?? 20) : 0;
    const overlayDiv = overlayPct > 0 ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,${overlayPct / 100});pointer-events:none;z-index:0"></div>` : '';

    // CSS variables from color palette
    const paletteCSS = page.colorPalette?.mapping
      ? Object.entries(page.colorPalette.mapping).map(([k, v]) => `${k}:${v}`).join(';')
      : '';

    // Get quiz data from authoring store for interactive export
    const allKuis = useAuthoringStore.getState().kuis.filter(k => k.q.trim());
    const allModules = useAuthoringStore.getState().modules;
    const kuisJSON = JSON.stringify(allKuis).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const modulesJSON = JSON.stringify(allModules).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    // Template-specific HTML
    const templateBody = renderTemplateExportHTML(page);

    const elementsHTML = templateBody || (page.elements || [])
      .filter(el => !el.hidden)
      .map((el, i) => {
        const style = `position:absolute;left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%;opacity:${(el.opacity || 100) / 100}`;
        if (el.type === 'teks') {
          return `<div style="${style}"><div style="font-size:${el.fontSize || 20}px;font-weight:700;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);padding:8px;line-height:1.4">${el.text || ''}</div></div>`;
        }
        if (el.type === 'shape') {
          return `<div style="${style}"><div style="width:100%;height:100%;background:${el.color || 'rgba(255,255,255,.15)'};border-radius:${el.radius || 8}px"></div></div>`;
        }
        if (el.type === 'kuis') {
          const elId = 'quiz_' + i;
          return `<div id="${elId}" style="${style};background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.2);border-radius:8px;padding:10px;overflow:hidden;display:flex;flex-direction:column"></div>`;
        }
        if (el.type === 'game') {
          const elId = 'game_' + i;
          const gameIdx = el.dataIdx;
          return `<div id="${elId}" data-game-idx="${gameIdx}" style="${style};background:rgba(56,217,217,.08);border:1px solid rgba(56,217,217,.2);border-radius:8px;overflow:hidden;display:flex;flex-direction:column"></div>`;
        }
        if (el.type === 'modul' || el.type === 'materi') {
          const allMods = useAuthoringStore.getState().modules;
          const modIdx = el.dataIdx;
          const mod = (modIdx != null && modIdx >= 0 && modIdx < allMods.length) ? allMods[modIdx] : null;
          const variant = (el.layoutVariant as LayoutVariant) || (mod?.layoutVariant as LayoutVariant) || 'A';
          if (mod) {
            return `<div style="${style};overflow-y:auto;padding:8px">${renderModuleToStyledHTML(mod, variant)}</div>`;
          }
          return `<div style="${style};display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:8px"><div style="font-size:1.5rem">🧩</div><div style="font-size:10px;color:rgba(167,139,250,.6);margin-top:4px">Modul</div></div>`;
        }
        return `<div style="${style};display:flex;align-items:center;justify-content:center"><div style="font-size:1.5rem">${el.icon || ''}</div></div>`;
      })
      .join('\n    ');

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${page.label}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0e0c15;font-family:'Nunito',sans-serif}
.slide{position:relative;width:${ratio.w}px;height:${ratio.h}px;overflow:hidden;${bgStyle}${paletteCSS ? ';' + paletteCSS : ''}}
.qbar{height:3px;background:rgba(245,200,66,.2);border-radius:2px;overflow:hidden;margin-bottom:6px}.qbar-fill{height:100%;background:#f5c842;transition:width .4s ease}
.qhead{display:flex;justify-content:space-between;font-size:10px;color:#f5c842;margin-bottom:4px}
.qq{font-size:13px;font-weight:700;color:#f5c842;margin-bottom:6px;line-height:1.3}
.qopt{display:block;width:100%;text-align:left;padding:6px 8px;margin:2px 0;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(245,200,66,.9);font-size:11px;cursor:pointer;transition:all .2s}
.qopt:hover{background:rgba(255,255,255,.1)}.qopt.correct{background:rgba(52,211,153,.2);border-color:rgba(52,211,153,.4);color:#6ee7b7}
.qopt.wrong{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4);color:#fca5a5}.qopt.disabled{opacity:.3;cursor:default}
.qex{font-size:10px;color:#60a5fa;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:6px;padding:4px 8px;margin-top:4px}
.qresult{text-align:center;padding:12px}.qresult .score{font-size:28px;font-weight:900}.qresult .level{font-size:11px;margin-top:2px}
.qresult button{margin-top:8px;padding:6px 16px;border:1px solid rgba(245,200,66,.3);border-radius:8px;background:rgba(245,200,66,.2);color:#f5c842;font-size:11px;font-weight:700;cursor:pointer}
.qresult button:hover{background:rgba(245,200,66,.4)}
</style></head>
<body><div class="slide">${overlayDiv}${elementsHTML}</div>
<script>
const KUIS_DATA=${kuisJSON};
const MODULES_DATA=${modulesJSON};
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
document.querySelectorAll('[id^=quiz_]').forEach(function(el){
  var soal=KUIS_DATA.filter(function(k){return k.q.trim()});
  if(!soal.length){el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(245,200,66,.5);font-size:12px">❓ Belum ada soal</div>';return}
  var cur=0,score=0,answered=false,selected=-1;
  var letters=['A','B','C','D'];
  function render(){
    if(cur>=soal.length){
      var pct=Math.round(score/soal.length*100);
      var lvl=pct>=85?'Sangat Baik':pct>=70?'Baik':'Perlu Latihan';
      var col=pct>=85?'#34d399':pct>=70?'#f5c842':'#f87171';
      el.innerHTML='<div class="qresult"><div class="score" style="color:'+col+'">'+pct+'%</div><div class="level" style="color:'+col+'">'+lvl+'</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Skor: '+score+' dari '+soal.length+'</div><button onclick="this.parentNode.parentNode.__restart()">Ulangi Kuis</button></div>';
      return;
    }
    var q=soal[cur];
    var h='<div class="qbar"><div class="qbar-fill" style="width:'+((cur+1)/soal.length*100)+'%"></div></div>';
    h+='<div class="qhead"><span style="font-weight:700">Soal '+(cur+1)+'/'+soal.length+'</span><span>Skor: '+score+'</span></div>';
    h+='<div class="qq">'+esc(q.q)+'</div>';
    q.opts.forEach(function(o,oi){
      if(!o.trim())return;
      var cls='qopt';
      if(answered){
        if(oi===q.ans)cls+=' correct';
        else if(oi===selected)cls+=' wrong';
        else cls+=' disabled';
      }
      h+='<button class="'+cls+'" '+(answered?'disabled':'')+' data-oi="'+oi+'"><b style="color:rgba(245,200,66,.8);margin-right:4px">'+letters[oi]+'.</b>'+esc(o)+(answered&&oi===q.ans?' ✅':'')+(answered&&oi===selected&&oi!==q.ans?' ❌':'')+'</button>';
    });
    if(answered&&q.ex)h+='<div class="qex">💡 '+esc(q.ex)+'</div>';
    el.innerHTML=h;
    el.querySelectorAll('.qopt:not(.disabled)').forEach(function(btn){
      btn.addEventListener('click',function(){
        if(answered)return;
        selected=parseInt(this.getAttribute('data-oi'));
        answered=true;
        if(selected===q.ans)score++;
        render();
        setTimeout(function(){cur++;answered=false;selected=-1;render()},1500);
      });
    });
  }
  el.__restart=function(){cur=0;score=0;answered=false;selected=-1;render()};
  render();
});
document.querySelectorAll('[id^=game_]').forEach(function(el){
  var gi=parseInt(el.getAttribute('data-game-idx'));
  var mod=(!isNaN(gi)&&gi>=0&&gi<MODULES_DATA.length)?MODULES_DATA[gi]:null;
  if(!mod){el.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:rgba(56,217,217,.5);font-size:12px"><span style="font-size:28px">🎮</span><span style="margin-top:4px">Belum ada game</span></div>';return}
  var t=mod.type;
  var title=mod.title||t;
  if(t==='truefalse'){
    var soal=(mod.soal||[]).filter(function(s){return s.teks});
    var ci=0,sc=0,ans=false,sel=null;
    function render(){
      if(ci>=soal.length){var p=Math.round(sc/soal.length*100);el.innerHTML='<div class="qresult"><div class="score" style="color:#3ecfcf">'+p+'%</div><div class="level" style="color:#3ecfcf">'+sc+'/'+soal.length+' benar</div><button onclick="this.parentNode.parentNode.__rs()">Ulangi</button></div>';return}
      var q=soal[ci];var h='<div class="qhead"><span style="font-weight:700;color:#3ecfcf">Soal '+(ci+1)+'/'+soal.length+'</span><span style="color:#3ecfcf">Skor: '+sc+'</span></div>';
      h+='<div class="qq" style="color:#e0f2fe">'+esc(q.teks)+'</div>';
      h+='<div style="display:flex;gap:8px;margin-top:8px">';
      h+='<button style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(52,211,153,.3);background:rgba(52,211,153,.15);color:#6ee7b7;font-size:13px;font-weight:700;cursor:pointer;'+(ans?(q.benar?'':'opacity:.3'):'')+'" '+(ans?'disabled':'')+' data-v="true">✅ Benar</button>';
      h+='<button style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(239,68,68,.3);background:rgba(239,68,68,.15);color:#fca5a5;font-size:13px;font-weight:700;cursor:pointer;'+(ans?(!q.benar?'':'opacity:.3'):'')+'" '+(ans?'disabled':'')+' data-v="false">❌ Salah</button></div>';
      el.innerHTML=h;
      el.querySelectorAll('button[data-v]').forEach(function(b){b.addEventListener('click',function(){if(ans)return;sel=this.getAttribute('data-v')==='true';ans=true;if(sel===(q.benar===true))sc++;render();setTimeout(function(){ci++;ans=false;sel=null;render()},1200)})});
    }
    el.__rs=function(){ci=0;sc=0;ans=false;sel=null;render()};render();
  } else {
    var icons={roda:'🎡',memory:'🧠',matching:'🔀',sorting:'🔢',spinwheel:'🎡',teambuzzer:'🏆',wordsearch:'🔍',flashcard:'🃏'};
    var labels={roda:'Roda Putar',memory:'Memory Match',matching:'Pasangkan',sorting:'Klasifikasi',spinwheel:'Roda Pertanyaan',teambuzzer:'Kuis Tim',wordsearch:'Teka-Teki Kata',flashcard:'Flashcard'};
    el.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%"><span style="font-size:28px">'+(icons[t]||'🎮')+'</span><div style="font-size:13px;font-weight:700;color:#3ecfcf;margin-top:4px">'+(labels[t]||title)+'</div><div style="font-size:10px;color:rgba(56,217,217,.5);margin-top:2px">'+(title||'Game Interaktif')+'</div></div>';
  }
});
<\/script></body></html>`;
  },

  exportSlideshowHTML: () => {
    const { pages } = get();
    const ratio = RATIOS.find(r => r.id === get().ratioId) || RATIOS[0];
    const slidesHtml = pages.map((p, i) => {
      const pageBg = p.bgDataUrl
        ? `background-image:url('${p.bgDataUrl}');background-size:cover;background-position:center`
        : `background:${p.bgColor || '#1a1a2e'}`;
      const pageOverlay = p.bgDataUrl ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,${(p.overlay ?? 20) / 100});pointer-events:none;z-index:0"></div>` : '';
      return get().exportPageHTML(i)
        .replace(/.*<body>/s, '')
        .replace(/<\/body>.*/s, '')
        .replace(/<div class="slide">/, `<div class="slide" data-slide="${i}" data-template="${p.templateType || 'custom'}" style="display:${i === 0 ? 'block' : 'none'};${pageBg}">${pageOverlay}`);
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Interactive Slideshow</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0e1c2f;font-family:'Nunito',sans-serif;flex-direction:column;padding:0 0 64px 0}
.slide{position:relative;width:${ratio.w}px;height:${ratio.h}px;overflow:hidden;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5)}
#progress-wrap{position:fixed;top:0;left:0;right:0;height:4px;background:rgba(255,255,255,.06);z-index:1001}
#progress-fill{height:100%;background:linear-gradient(90deg,#f9c12e,#3ecfcf);transition:width .3s ease;border-radius:0 2px 2px 0}
#nav-bar{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 20px;background:rgba(14,28,47,.96);backdrop-filter:blur(14px);border-top:1px solid rgba(255,255,255,.06);z-index:1001}
.nav-btn{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.nav-btn:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.22)}
.nav-btn:disabled{opacity:.25;cursor:default}
#dots{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:nowrap}
.dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .3s;border:none;padding:0}
.dot.active{background:#f9c12e;transform:scale(1.4);box-shadow:0 0 8px rgba(249,193,46,.4)}
.dot.scored{box-shadow:0 0 0 2px rgba(52,211,153,.5);background:rgba(52,211,153,.35)}
.dot.scored.active{background:#34d399;box-shadow:0 0 8px rgba(52,211,153,.5)}
#score-badge{display:flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.25);color:#34d399;font-size:12px;font-weight:800;white-space:nowrap;flex-shrink:0}
#page-label{position:fixed;top:12px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.35);font-size:11px;z-index:1001;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.qbar{height:3px;background:rgba(245,200,66,.2);border-radius:2px;overflow:hidden;margin-bottom:6px}.qbar-fill{height:100%;background:#f5c842;transition:width .4s ease}
.qhead{display:flex;justify-content:space-between;font-size:10px;color:#f5c842;margin-bottom:4px}
.qq{font-size:13px;font-weight:700;color:#f5c842;margin-bottom:6px;line-height:1.3}
.qopt{display:block;width:100%;text-align:left;padding:6px 8px;margin:2px 0;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(245,200,66,.9);font-size:11px;cursor:pointer;transition:all .2s}
.qopt:hover{background:rgba(255,255,255,.1)}.qopt.correct{background:rgba(52,211,153,.2);border-color:rgba(52,211,153,.4);color:#6ee7b7}
.qopt.wrong{background:rgba(239,68,68,.2);border-color:rgba(239,68,68,.4);color:#fca5a5}.qopt.disabled{opacity:.3;cursor:default}
.qex{font-size:10px;color:#60a5fa;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:6px;padding:4px 8px;margin-top:4px}
.qresult{text-align:center;padding:12px}.qresult .score{font-size:28px;font-weight:900}.qresult .level{font-size:11px;margin-top:2px}
.qresult button{margin-top:8px;padding:6px 16px;border:1px solid rgba(245,200,66,.3);border-radius:8px;background:rgba(245,200,66,.2);color:#f5c842;font-size:11px;font-weight:700;cursor:pointer}
.qresult button:hover{background:rgba(245,200,66,.4)}
</style></head>
<body>
<div id="progress-wrap"><div id="progress-fill" style="width:0%"></div></div>
<div id="page-label"></div>
${slidesHtml}
<div id="nav-bar">
<button class="nav-btn" id="btn-prev" onclick="prevSlide()">&#9664;</button>
<div id="dots"></div>
<button class="nav-btn" id="btn-next" onclick="nextSlide()">&#9654;</button>
<div id="score-badge">&#11088; <span id="score-val">&mdash;</span></div>
</div>
<script>
var cur=0;
var total=${pages.length};
var SCORE={};
var slides=document.querySelectorAll('.slide');

function showSlide(n){
  cur=n;
  slides.forEach(function(s,i){s.style.display=i===n?'block':'none'});
  updateDots();
  updateProgress();
  updateNavButtons();
  updatePageLabel();
}
function nextSlide(){if(cur<total-1)showSlide(cur+1)}
function prevSlide(){if(cur>0)showSlide(cur-1)}

function reportScore(pageIdx,score,max){
  SCORE[pageIdx]={score:score,max:max,pct:max>0?Math.round(score/max*100):0};
  updateScoreBadge();
  updateHasil();
  updateDots();
}

function updateScoreBadge(){
  var ts=0,tm=0;
  Object.keys(SCORE).forEach(function(k){ts+=SCORE[k].score;tm+=SCORE[k].max});
  var el=document.getElementById('score-val');
  if(el)el.textContent=tm>0?Math.round(ts/tm*100)+'%':'\\u2014';
}

function updateHasil(){
  var ts=0,tm=0;
  Object.keys(SCORE).forEach(function(k){ts+=SCORE[k].score;tm+=SCORE[k].max});
  var pctEl=document.getElementById('hasil-score-pct');
  var detailEl=document.getElementById('hasil-score-detail');
  if(pctEl){
    var pct=tm>0?Math.round(ts/tm*100):0;
    pctEl.textContent=pct+'%';
    pctEl.style.color=pct>=85?'#34d399':pct>=70?'#f9c12e':'#f87171';
    var circle=pctEl.parentElement;
    if(circle){
      circle.style.borderColor=pct>=85?'rgba(52,211,153,.5)':pct>=70?'rgba(249,193,46,.5)':'rgba(248,113,113,.5)';
      circle.style.background=pct>=85?'rgba(52,211,153,.08)':pct>=70?'rgba(249,193,46,.08)':'rgba(248,113,113,.08)';
    }
  }
  if(detailEl){
    detailEl.textContent=tm>0?ts+' dari '+tm+' jawaban benar':'Kerjakan kuis untuk melihat skor';
  }
}

function updateDots(){
  var dotsContainer=document.getElementById('dots');
  if(!dotsContainer)return;
  var dots=dotsContainer.querySelectorAll('.dot');
  dots.forEach(function(d,i){
    d.className='dot';
    if(i===cur)d.classList.add('active');
    if(SCORE[i])d.classList.add('scored');
  });
}

function updateProgress(){
  var fill=document.getElementById('progress-fill');
  if(fill)fill.style.width=((cur+1)/total*100)+'%';
}

function updateNavButtons(){
  var prev=document.getElementById('btn-prev');
  var next=document.getElementById('btn-next');
  if(prev)prev.disabled=cur===0;
  if(next)next.disabled=cur===total-1;
}

function updatePageLabel(){
  var el=document.getElementById('page-label');
  if(!el)return;
  var tmpl=slides[cur]?slides[cur].getAttribute('data-template'):'';
  var labels={cover:'Cover',materi:'Materi',kuis:'Kuis',game:'Game',hasil:'Hasil',dokumen:'Dokumen',hero:'Hero',skenario:'Skenario',custom:'Custom'};
  el.textContent=(labels[tmpl]||tmpl||'Slide')+' \\u2022 '+(cur+1)+'/'+total;
}

function buildDots(){
  var c=document.getElementById('dots');
  if(!c)return;
  c.innerHTML='';
  for(var i=0;i<total;i++){
    var d=document.createElement('button');
    d.className='dot'+(i===0?' active':'');
    d.setAttribute('aria-label','Slide '+(i+1));
    d.addEventListener('click',(function(idx){return function(){showSlide(idx)}})(i));
    c.appendChild(d);
  }
}

function initScoreBridge(){
  var observer=new MutationObserver(function(mutations){
    mutations.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node.nodeType!==1)return;
        var results=node.classList&&node.classList.contains('qresult')?[node]:[];
        if(!results.length&&node.querySelectorAll){
          var found=node.querySelectorAll('.qresult');
          if(found.length)results=Array.prototype.slice.call(found);
        }
        results.forEach(function(result){
          var quizEl=result.parentElement;
          if(!quizEl)return;
          var slide=quizEl.closest?quizEl.closest('.slide'):null;
          if(!slide)return;
          var slideIdx=parseInt(slide.getAttribute('data-slide'));
          if(isNaN(slideIdx))return;
          var text=result.textContent||'';
          var m1=text.match(/Skor:\\s*(\\d+)\\s*dari\\s*(\\d+)/);
          var m2=text.match(/(\\d+)\\/(\\d+)\\s*benar/);
          if(m1)reportScore(slideIdx,parseInt(m1[1]),parseInt(m1[2]));
          else if(m2)reportScore(slideIdx,parseInt(m2[1]),parseInt(m2[2]));
        });
      });
    });
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

buildDots();
initScoreBridge();
showSlide(0);

document.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight')nextSlide();
  if(e.key==='ArrowLeft')prevSlide();
});
<\/script></body></html>`;
  },
}));

// ── Helper: Populate template elements for backward compat ────

function populateTemplateElements(page: CanvaPage) {
  // For template pages, we don't add individual elements —
  // the template rendering in Stage.tsx handles it.
  // But we keep elements empty for custom pages or add
  // placeholder elements for backward export compatibility.
  if (page.templateType === 'custom') return;

  // Add a single large placeholder element for export compat
  page.elements = [{
    id: createElId(),
    type: page.templateType === 'kuis' ? 'kuis' : page.templateType === 'game' ? 'game' : 'modul',
    icon: page.templateType === 'kuis' ? '❓' : page.templateType === 'game' ? '🎮' : '🧩',
    label: page.label,
    x: 0, y: 0, w: 100, h: 100,
    opacity: 100,
    dataIdx: -1,
  }];
}

// ── Helper: Render template-specific HTML for export ──────────

function renderTemplateExportHTML(page: CanvaPage): string | null {
  const td = page.templateData;
  const esc = (s: unknown) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  switch (page.templateType) {
    case 'cover': {
      const title = esc(td.title);
      const subtitle = esc(td.subtitle);
      const icon = td.icon || '📚';
      const mapel = esc(td.mapel);
      const kelas = esc(td.kelas);
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px">
        <div style="font-size:64px;margin-bottom:16px">${icon}</div>
        <div style="font-size:32px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px">${title}</div>
        <div style="font-size:16px;color:rgba(255,255,255,.7);margin-bottom:20px">${subtitle}</div>
        ${mapel ? `<div style="display:inline-block;padding:6px 16px;border-radius:20px;background:rgba(249,200,46,.2);border:1px solid rgba(249,200,46,.3);color:#f9c82e;font-size:13px;font-weight:700">${mapel} ${kelas ? '• Kelas ' + kelas : ''}</div>` : ''}
      </div>`;
    }

    case 'materi': {
      const modules = (td.modules as Array<Record<string, unknown>>) || [];
      const modulesHTML = modules.map(mod =>
        renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')
      ).join('');
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="font-size:18px;font-weight:900;color:#e8f2ff;margin-bottom:16px">📝 Materi Pembelajaran</div>
        ${modulesHTML || '<div style="text-align:center;padding:40px;color:#6e90b5">Belum ada modul materi.</div>'}
      </div>`;
    }

    case 'game': {
      const games = (td.games as Array<Record<string, unknown>>) || [];
      const gamesHTML = games.map(mod =>
        renderModuleToStyledHTML(mod, (mod.layoutVariant as LayoutVariant) || 'A')
      ).join('');
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="font-size:18px;font-weight:900;color:#3ecfcf;margin-bottom:16px">🎮 Game Interaktif</div>
        ${gamesHTML || '<div style="text-align:center;padding:40px;color:#6e90b5">Belum ada game.</div>'}
      </div>`;
    }

    case 'hasil': {
      const totalKuis = (td.totalKuis as number) || 0;
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px">
        <div style="font-size:56px;margin-bottom:12px">🏆</div>
        <div style="font-size:28px;font-weight:900;color:#34d399;margin-bottom:6px">Hasil Belajar</div>
        <div style="font-size:13px;color:rgba(255,255,255,.5);margin-bottom:24px" id="hasil-score-detail">${totalKuis > 0 ? totalKuis + ' soal kuis telah diselesaikan' : 'Kerjakan kuis untuk melihat skor'}</div>
        <div style="width:140px;height:140px;border-radius:50%;border:5px solid rgba(52,211,153,.3);display:flex;align-items:center;justify-content:center;margin-bottom:20px;background:rgba(52,211,153,.06)">
          <div style="font-size:42px;font-weight:900;color:#34d399" id="hasil-score-pct">0%</div>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,.35)">Skor diperbarui secara langsung</div>
      </div>`;
    }

    case 'dokumen': {
      const cp = td.cp as Record<string, unknown> | undefined;
      const tpItems = (td.tp as Array<Record<string, unknown>>) || [];
      const cpHTML = cp?.capaianFase
        ? `<div style="padding:12px;border-radius:8px;background:rgba(249,200,46,.06);border:1px solid rgba(249,200,46,.15);margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;color:#f9c82e;margin-bottom:4px">Capaian Pembelajaran</div>
            <div style="font-size:10px;color:rgba(255,255,255,.7);line-height:1.5">${esc(cp.capaianFase)}</div>
          </div>`
        : '';
      const tpHTML = tpItems.length > 0
        ? `<div style="font-size:11px;font-weight:700;color:#3ecfcf;margin-bottom:6px">Tujuan Pembelajaran</div>
            ${tpItems.map((tp, i) => `<div style="display:flex;align-items:flex-start;gap:6px;padding:4px 8px;border-radius:4px;background:rgba(255,255,255,.03);margin-bottom:4px">
              <div style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;background:${String(tp.color || '#3ecfcf')}30;color:${String(tp.color || '#3ecfcf')};flex-shrink:0">${i + 1}</div>
              <div><span style="font-size:9px;font-weight:700;color:${String(tp.color || '#3ecfcf')}">${esc(tp.verb)}</span><span style="font-size:9px;color:rgba(255,255,255,.6);margin-left:4px">${esc(tp.desc)}</span></div>
            </div>`).join('')}`
        : '';
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(249,200,46,.12)">📋</div>
          <div><div style="font-size:14px;font-weight:900;color:#fff">Dokumen Kurikulum</div><div style="font-size:9px;color:rgba(255,255,255,.4)">Capaian Pembelajaran • Tujuan Pembelajaran</div></div>
        </div>
        ${cpHTML}${tpHTML}
        ${!cp?.capaianFase && tpItems.length === 0 ? '<div style="text-align:center;padding:40px;color:#6e90b5">Isi data CP & TP di panel Dokumen</div>' : ''}
      </div>`;
    }

    case 'hero': {
      const heroTitle = esc(td.title);
      const heroSub = esc(td.subtitle);
      const heroIcon = td.icon || '🚀';
      const heroCta = esc(td.cta);
      return `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;background:linear-gradient(135deg,#0f172a,#1e293b,#0f172a)">
        <div style="font-size:48px;margin-bottom:12px">${heroIcon}</div>
        <div style="font-size:28px;font-weight:900;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5);margin-bottom:8px">${heroTitle}</div>
        <div style="font-size:14px;color:rgba(255,255,255,.6);margin-bottom:20px">${heroSub}</div>
        ${heroCta ? `<div style="padding:10px 24px;border-radius:12px;font-weight:700;font-size:14px;background:#f9c82e;color:#000">${heroCta}</div>` : ''}
      </div>`;
    }

    case 'skenario': {
      const skenario = (td.skenario as Array<Record<string, unknown>>) || [];
      const chaptersHTML = skenario.map((ch, i) => {
        const choices = (ch.choices as Array<Record<string, unknown>>) || [];
        const choicesHTML = choices.map((c, j) =>
          `<div style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;background:${c.good ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)'};color:${c.good ? '#34d399' : '#f87171'}">${String(c.icon || '🤔')} ${esc(c.label || 'Pilihan ' + (j + 1))}</div>`
        ).join(' ');
        return `<div style="padding:8px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:14px">${String(ch.charEmoji || '🧑')}</span>
            <span style="font-size:10px;font-weight:700;color:#fff">Babak ${i + 1}</span>
            ${ch.title ? `<span style="font-size:8px;color:rgba(255,255,255,.4)">${esc(ch.title)}</span>` : ''}
          </div>
          ${ch.choicePrompt ? `<div style="font-size:8px;color:rgba(255,255,255,.5);font-style:italic;margin-bottom:4px">${esc(ch.choicePrompt)}</div>` : ''}
          ${choicesHTML ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${choicesHTML}</div>` : ''}
        </div>`;
      }).join('');
      return `<div style="position:absolute;inset:0;padding:20px;overflow-y:auto">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:rgba(244,114,182,.12)">🎭</div>
          <div><div style="font-size:14px;font-weight:900;color:#f472b6">Skenario Interaktif</div><div style="font-size:9px;color:rgba(255,255,255,.4)">${skenario.length} babak</div></div>
        </div>
        ${chaptersHTML || '<div style="text-align:center;padding:40px;color:#6e90b5">Tambah skenario di panel Konten</div>'}
      </div>`;
    }

    default:
      return null; // Fall back to element-based rendering
  }
}
