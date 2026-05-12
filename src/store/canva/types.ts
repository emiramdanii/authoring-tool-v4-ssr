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
import type { SchemaBlock } from '@/core/schema/types';

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
  // Schema block selection — for editing overlay on schema-driven pages
  selectedBlockId: string | null;
  selectedBlockType: string | null;
  // Multi-select for schema blocks (shift+click)
  selectedBlockIds: string[];
  // Hover context — which block the cursor is over (for hover effects, layer panel)
  hoveredBlockId: string | null;
  // Editing context — which block is being inline-edited (double-click → edit mode)
  editingBlockId: string | null;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  // Save status — centralized indicator for auto-save
  _saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  // Nudge debounce: timestamp of last nudge to avoid history spam
  _lastNudgeTime?: number;
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
  setVariant: (variant: 'A' | 'B' | 'C') => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;

  // ── Actions: Background ──────────────────────────────────────
  setBgColor: (hex: string) => void;
  setBgImage: (dataUrl: string) => void;
  setOverlay: (val: number) => void;
  /** Update schema-driven page background (type, color1, color2, imageUrl, overlay) */
  updateScreenBackground: (updates: Partial<NonNullable<import('@/core/schema/types').ScreenSchema['background']>>) => void;
  /** Change the theme preset for the current page */
  setSchemaThemeId: (themeId: string) => void;

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
  // Clipboard: Copy / Paste
  _clipboard: CanvaElement[];
  copySelected: () => void;
  pasteElements: () => void;

  // ── Actions: Tool & UI ───────────────────────────────────────
  setTool: (tool: Tool) => void;
  setLeftTab: (tab: LeftTab) => void;
  setZoom: (zoom: number) => void;
  zoomDelta: (delta: number) => void;
  /** Reset zoom to auto-fit mode (calculated by Stage) */
  zoomToFit: () => void;
  setRatio: (ratioId: string) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  // Schema block selection — for editing overlay
  selectBlock: (blockId: string | null, blockType?: string | null, addToSelection?: boolean) => void;
  /** Update a schema block's content properties by block ID (deep patch merge) */
  updateSchemaBlock: (blockId: string, updates: Record<string, unknown>) => void;
  /** Set hover context for a block (for hover effects, layer panel) */
  hoverBlock: (blockId: string | null) => void;
  /** Enter inline editing mode for a block (double-click) */
  startEditing: (blockId: string) => void;
  /** Exit inline editing mode */
  stopEditing: () => void;
  /** Delete a schema block from the current screen by ID */
  deleteBlock: (blockId: string) => void;
  /** Move a schema block one position up in flow order */
  moveBlockUp: (blockId: string) => void;
  /** Move a schema block one position down in flow order */
  moveBlockDown: (blockId: string) => void;
  /** Duplicate a schema block and insert after the original */
  duplicateBlock: (blockId: string) => void;
  /** Add a new schema block from the registry to the current page. insertAfterIndex inserts after that position. */
  addSchemaBlock: (blockType: string, insertAfterIndex?: number) => void;
  /** Clipboard for schema block copy/paste */
  _schemaClipboard: SchemaBlock | null;
  /** Copy a schema block to the clipboard */
  copySchemaBlock: (blockId: string) => void;
  /** Paste a schema block from the clipboard */
  pasteSchemaBlock: () => void;
  /** Nudge selected schema block(s) by dx/dy percentage */
  nudgeSchemaBlocks: (dxPct: number, dyPct: number) => void;
  /** Delete multiple schema blocks by IDs */
  deleteSchemaBlocks: (blockIds: string[]) => void;
  /** Reorder schema blocks by moving a block from one index to another (drag-sort) */
  reorderSchemaBlocks: (fromIndex: number, toIndex: number) => void;
  /** Move a schema block to another page */
  moveBlockToPage: (blockId: string, targetPageIndex: number) => void;
  // Alignment & Distribution
  alignSelected: (direction: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;

  // ── Actions: Layout Presets ────────────────────────────────────
  applyLayoutPreset: (presetId: string) => void;
  currentLayoutPreset: () => LayoutPreset | undefined;

  // ── Actions: Stage ───────────────────────────────────────────
  clearStage: () => void;

  // ── Actions: Reset Canvas (nuclear reset — replaces old Auto Rakit) ──
  resetCanvas: () => void;

  // ── Actions: Reactive Sync ────────────────────────────────────
  /** Sync template pages' templateData from authoring store (incremental, no rebuild) */
  syncTemplateData: () => void;

  // ── Actions: Auto Generate (Page Type) ──────────────────────
  generateFromPageType: (pageType: PageTypeDefinition, config: Record<string, number | string | boolean>) => void;

  // ── Actions: Schema Preset Loading ───────────────────────────
  /** Load a schema preset (e.g. 'hakikat-norma') into the canvas, replacing all pages */
  loadSchemaPreset: (presetId: string) => Promise<void>;
  /** Load a custom LessonSchema into the canvas (used by Template Marketplace) */
  loadCustomSchema: (schema: import('@/core/schema/types').LessonSchema) => void;

  // ── Actions: Persistence ─────────────────────────────────────
  saveToStorage: () => void;
  loadFromStorage: () => boolean;

  // ── Export ────────────────────────────────────────────────────
  // Legacy export methods removed — all exports now use Vite SSR pipeline
  // See: src/lib/use-vite-export.ts and src/app/api/export/route.ts
}
