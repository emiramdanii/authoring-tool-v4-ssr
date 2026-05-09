// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Type definitions
// ═══════════════════════════════════════════════════════════════

import type {
  CanvaPage,
  CanvaElement,
  LeftTab,
  Tool,
  Ratio,
  PageTemplateType,
  ColorPalette,
  NavConfig,
  LayoutPreset,
} from '@/components/canva/types';
import type { PageTypeDefinition } from '@/store/page-types';

// ── Snapshot type for undo/redo ────────────────────────────────
export type Snapshot = {
  pages: CanvaPage[];
  currentPageIndex: number;
  ratioId: string;
};

// ── Full store interface ──────────────────────────────────────
export interface CanvaState {
  // ── Persisted state ──────────────────────────────────────────
  pages: CanvaPage[];
  currentPageIndex: number;
  ratioId: string;

  // ── UI state ─────────────────────────────────────────────────
  zoom: number;
  tool: Tool;
  leftTab: LeftTab;
  selectedElId: string | null;
  // Phase 4: Multi-select — array of selected element IDs
  selectedElIds: string[];
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  // Grid & Snap
  showGrid: boolean;
  gridSize: number; // percentage (e.g., 5 = 5% grid)
  snapEnabled: boolean;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnap: () => void;
  snapValue: (val: number) => number;

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
  addModuleElement: (dataIdx: number, moduleId?: string, layoutVariant?: 'A' | 'B' | 'C' | 'D') => void;
  selectElement: (elId: string | null) => void;
  // Phase 4: Multi-select actions
  toggleElementSelection: (elId: string) => void;
  selectAllElements: () => void;
  clearSelection: () => void;
  deleteSelectedElements: () => void;
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

  // ── Actions: Layout Presets ────────────────────────────────────
  applyLayoutPreset: (presetId: string) => void;
  currentLayoutPreset: () => LayoutPreset | undefined;

  // ── Actions: Stage ───────────────────────────────────────────
  clearStage: () => void;

  // ── Actions: Reset Canvas (nuclear reset — replaces old Auto Rakit) ──
  resetCanvas: () => void;

  // ── Actions: Unlock Page (convert locked template → unlocked custom-edit) ──
  /** Unlock a locked template page: freezes templateData, merges overlays → elements, enables free editing */
  unlockPage: () => void;
  /** Re-lock an unlocked template page: refreshes templateData from authoring, resets to locked template mode */
  relockPage: () => void;

  // ── Actions: Reactive Sync ────────────────────────────────────
  /** Sync template pages' templateData from authoring store (incremental, no rebuild) */
  syncTemplateData: () => void;

  // ── Actions: Auto Generate (Page Type) ──────────────────────
  generateFromPageType: (pageType: PageTypeDefinition, config: Record<string, number | string | boolean>) => void;

  // ── Actions: Persistence ─────────────────────────────────────
  saveToStorage: () => void;
  loadFromStorage: () => boolean;

  // ── Export ────────────────────────────────────────────────────
  // Legacy export methods removed — all exports now use Vite SSR pipeline
  // See: src/lib/use-vite-export.ts and src/app/api/export/route.ts
}
