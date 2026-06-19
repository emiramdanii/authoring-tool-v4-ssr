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
  AppMode,
} from '@/components/canva/types';
import type { PageTypeDefinition } from '@/store/page-types';
import type { SchemaBlock } from '@/core/schema/types';

// ── DB project data type for loadFromDB ────────────────────────
export interface DBPageData {
  id: string;
  pageIndex: number;
  label: string | null;
  templateType: string | null;
  variant: string | null;
  contractId: string | null;
  pageMode: string | null;
  bgColor: string | null;
  bgImage: string | null;
  bgOverlay: number | null;
  schemaData: string | null;
  navConfig: string | null;
  templateData: string | null;
  colorPalette: string | null;
  blocks: Array<{
    id: string;
    blockType: string;
    blockIndex: number;
    content: string;
    layout: string | null;
  }>;
}

export interface DBProjectData {
  id: string;
  title: string;
  description?: string | null;
  ratioId?: string | null;
  authoringData?: string | null;
  pages: DBPageData[];
}

// ── Snapshot type for undo/redo ────────────────────────────────
export type Snapshot = {
  pages: CanvaPage[];
  currentPageIndex: number;
  ratioId: string;
};

/** Options for updateSchemaBlock — aligns with applyGuidedSchemaPatch capabilities */
export interface UpdateSchemaBlockOptions {
  /** What to do if the patch causes content overflow. Default: 'none' */
  overflowPolicy?: 'none' | 'warn' | 'reject' | 'auto-split';
  /** Source of the edit — for edit bus tracking. Default: 'user' */
  source?: 'user' | 'ai' | 'system';
  /** Skip pushing history snapshot (caller manages history). Default: false */
  skipHistory?: boolean;
}

// ── Full store interface ──────────────────────────────────────
export interface CanvaState {
  // ── Persisted state ──────────────────────────────────────────
  pages: CanvaPage[];
  currentPageIndex: number;
  ratioId: string;

  // ── UI state ─────────────────────────────────────────────────
  zoom: number;
  /** Last calculated fitZoom from Stage's ResizeObserver. Used by zoomDelta to resolve ZOOM_FIT. */
  fitZoom: number;
  tool: Tool;
  leftTab: LeftTab;
  /** Ephemeral cross-panel navigation: SchemaBlockTree → Konten tab switch.
   *  Set by SchemaBlockTree pencil icon, consumed by Konten.tsx, then cleared.
   *  Moved here from useAuthoringStore.kontenTab (Phase 3 — eliminate authoring store reads). */
  kontenTabRequest: string | null;
  /** Phase 3: Ephemeral cross-panel navigation — SchemaBlockTree → switch to Konten panel.
   *  Set alongside kontenTabRequest, consumed by AuthoringTool.tsx, then cleared. */
  kontenPanelRequest: boolean;
  /** Phase 3: General cross-panel navigation request — set by any component,
   *  consumed by AuthoringTool.tsx which calls setActivePanel(), then cleared.
   *  Replaces direct useAuthoringStore.getState().setActivePanel() calls. */
  panelRequest: string | null;
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
  // Last successful save timestamp (epoch ms) — for UI display
  _lastSavedAt: number;
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
  timeTravel: (targetIndex: number) => void;

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

  // ── Tab Navigation (FASE 10) ──────────────────────────────────
  /** Currently active tab ID (ephemeral — not persisted) */
  activeTabId: string | null;
  /** Set the active tab ID */
  setActiveTabId: (tabId: string | null) => void;
  /** Add a new tab to the current page's schema */
  addSceneTab: (label: string, icon: string) => void;
  /** Remove a tab from the current page's schema */
  removeSceneTab: (tabId: string) => void;
  /** Rename a tab */
  renameSceneTab: (tabId: string, label: string) => void;
  /** Change a tab's icon */
  setSceneTabIcon: (tabId: string, icon: string) => void;
  /** Assign a block to a tab */
  assignBlockToTab: (tabId: string, blockId: string) => void;
  /** Remove a block from a tab */
  removeBlockFromTab: (tabId: string, blockId: string) => void;
  /** Auto-cluster blocks into tabs based on block type */
  autoClusterTabs: () => void;

  // ── Actions: Tool & UI ───────────────────────────────────────
  setTool: (tool: Tool) => void;
  setLeftTab: (tab: LeftTab) => void;
  setZoom: (zoom: number) => void;
  zoomDelta: (delta: number) => void;
  /** Update the cached fitZoom value (called by Stage's ResizeObserver) */
  setFitZoom: (fitZoom: number) => void;
  /** Reset zoom to auto-fit mode (calculated by Stage) */
  zoomToFit: () => void;
  setRatio: (ratioId: string) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  // Schema block selection — for editing overlay
  selectBlock: (blockId: string | null, blockType?: string | null, addToSelection?: boolean) => void;
  /** Update a schema block's content properties by block ID (deep patch merge) */
  updateSchemaBlock: (blockId: string, updates: Record<string, unknown>, options?: UpdateSchemaBlockOptions) => void;
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
  /** Split the current page's schema at a block boundary, creating a new page */
  splitPageAtBlock: (blockId: string) => void;
  /** Merge the current page's schema with the next page's schema (with overflow guard) */
  mergeWithNextPage: () => void;
  /** Internal: Perform merge without overflow check (used after user confirms) */
  _performMergeUnchecked: (pageIndex: number) => void;
  /** Move a schema block to a container (root, materi-section, ftab tab, or children) */
  moveBlockToContainer: (blockId: string, targetContainer: import('@/core/schema/immutable').ContainerRef, toIndex?: number) => void;
  /** Add a new schema block into a container (root, materi-section, ftab tab, or children) */
  addSchemaBlockToContainer: (blockType: string, container: import('@/core/schema/immutable').ContainerRef, toIndex?: number) => void;
  /** Batch set variant on multiple blocks */
  batchSetVariant: (blockIds: string[], variant: 'A' | 'B' | 'C') => void;
  /** Batch duplicate multiple blocks by IDs — clones each and inserts after original */
  batchDuplicateBlocks: (blockIds: string[]) => void;
  /** Batch move blocks up/down by delta positions */
  batchMoveBlocks: (blockIds: string[], delta: 1 | -1) => void;
  /** Batch toggle compression priority (high ↔ low) on selected blocks */
  batchToggleCompression: (blockIds: string[], priority: 'high' | 'medium' | 'low') => void;

  // ── Scene Transaction Actions ──────────────────────────────────
  /** Rebalance the current page's compression/layout using transaction */
  rebalanceCurrentPage: () => void;
  /** Promote a scene split into an actual page split via transaction */
  promoteSceneSplit: (sceneIndex?: number) => void;
  /** Merge current page with adjacent page via transaction */
  mergeWithAdjacentPage: (direction?: 'next' | 'prev') => void;
  /** Split a materi-section's content at a given block index, creating a new page with overflow content */
  splitMateriContent: (blockId: string, splitAfterIndex: number) => void;

  // Alignment & Distribution
  alignSelected: (direction: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;
  /** Align selected schema blocks (absolute-positioned only) */
  alignSchemaBlocks: (direction: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => void;
  /** Distribute selected schema blocks (absolute-positioned only) */
  distributeSchemaBlocks: (axis: 'horizontal' | 'vertical') => void;

  // ── Actions: Layout Presets ────────────────────────────────────
  applyLayoutPreset: (presetId: string) => void;
  currentLayoutPreset: () => LayoutPreset | undefined;

  // ── Scene Navigation (multi-scene overflow) ────────────────────
  /** Current scene index for the current page (0-based, updated by SchemaRenderer) */
  sceneIndex: number;
  /** Total scenes for the current page (updated by SchemaRenderer) */
  sceneTotal: number;
  /** Update scene state (called by SchemaRenderer when scene plan changes) */
  setSceneState: (index: number, total: number) => void;
  /** Navigate to a specific scene (used by keyboard shortcuts and SceneNavigator) */
  navigateScene: (index: number) => void;
  /** Whether canvas is in quick-preview mode (hides overlays, shows content as students see it) */
  canvasPreview: boolean;
  /** Toggle canvas preview mode */
  toggleCanvasPreview: () => void;
  /** Current application mode — controls UI chrome, overlays, and interaction model */
  appMode: AppMode;
  /** Set the application mode — clears selections when entering preview/present */
  setAppMode: (mode: AppMode) => void;
  /** Preview viewport mode — desktop or mobile simulation */
  previewViewport: 'desktop' | 'mobile';
  /** Set the preview viewport mode */
  setPreviewViewport: (v: 'desktop' | 'mobile') => void;
  /** Educational display mode — controls font sizes, backgrounds for different viewing contexts */
  displayMode: import('@/core/edu/education-typography').EduDisplayMode;
  /** Set the educational display mode (classroom/projector/print/student) */
  setDisplayMode: (mode: import('@/core/edu/education-typography').EduDisplayMode) => void;

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
  /** Load a golden preset (e.g. 'norma-golden') into the canvas — returns CanvaPage[] directly */
  loadGoldenPreset: (presetId: string) => Promise<void>;

  // ── Actions: Persistence ─────────────────────────────────────
  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  loadFromDB: (data: DBProjectData) => boolean;
  /** Factory reset — clear all localStorage and reset to default state.
   *  Use when corrupted data causes stack overflow or rendering failures. */
  factoryReset: () => void;

  // ── Teacher Mode ─────────────────────────────────────────────
  /** true = simple/teacher mode (default), false = advanced/technical mode */
  teacherMode: boolean;
  /** Toggle between teacher and advanced mode */
  toggleTeacherMode: () => void;
  /** Set teacher mode explicitly */
  setTeacherMode: (mode: boolean) => void;

  // ── Recovery (FASE 6) ──────────────────────────────────────────
  /** Whether the app is in safe mode (degraded features due to corruption) */
  safeMode: boolean;
  /** Enter safe mode — disables complex features to prevent further corruption */
  enterSafeMode: (reason?: string) => void;
  /** Exit safe mode — re-enables all features after user confirms data is OK */
  exitSafeMode: () => void;
  /** Active transaction ID (null = no active transaction) */
  _activeTransactionId: string | null;
  /** Begin a recoverable transaction — saves checkpoint before operation */
  beginTransaction: (description: string) => string;
  /** Commit a transaction — clears its checkpoint (operation succeeded) */
  commitTransaction: (transactionId: string) => void;
  /** Rollback a transaction — restores pages to pre-transaction state */
  rollbackTransaction: (transactionId: string) => void;
  /** Last integrity check result (null = never checked) */
  _lastIntegrityResult: import('@/core/recovery').PageValidationResult | null;
  /** Run integrity check on all pages now */
  runIntegrityCheckNow: () => import('@/core/recovery').PageValidationResult;
  /** Hash of pages at last save (for corruption detection) */
  _pagesHashAtSave: string;

  // ── Educational Viewing Mode ────────────────────────────────
  /** Current educational viewing mode — affects colors, contrast, spacing, text sizes */
  eduViewingMode: import('@/core/themes/education-colors').EduViewingMode;
  /** Set the educational viewing mode explicitly */
  setEduViewingMode: (mode: import('@/core/themes/education-colors').EduViewingMode) => void;
  /** Cycle through viewing modes: classroom → projector → print → student-screen */
  cycleEduViewingMode: () => void;

  // ── Export ────────────────────────────────────────────────────
  // Legacy export methods removed — all exports now use Vite SSR pipeline
  // See: src/lib/use-vite-export.ts and src/app/api/export/route.ts
}
