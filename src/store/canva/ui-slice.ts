// ═══════════════════════════════════════════════════════════════
// CANVA STORE — UI / Tool / Grid / Layout actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import { produce, produceWithPatches } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaElement } from '@/components/canva/types';
import { LAYOUT_PRESETS } from '@/components/canva/types';
import { deepMergeBlock, mergeBlockInArray } from '@/core/editor/deep-merge';
import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import { editBus } from '@/core/editor/edit-bus';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry';
// NOTE: Do NOT import from SceneRegistry here — it pulls in React renderers
// which import from @/store/canva-store, creating a circular dependency.
// Use the renderer-free BlockDefinitionRegistry instead.
import { ensurePageSchema, generateBlockId } from '@/core/schema/ensure-schema';
import { ZOOM_FIT, ZOOM_MIN, ZOOM_MAX, clampZoom } from '@/lib/canva-constants';

// ═══════════════════════════════════════════════════════════════
// NESTED BLOCK FINDER — Finds blocks inside composite blocks
// (ftab.tabs[].content[], materi-section.content[])
// Returns the path to the block so Immer can update it.
// ═══════════════════════════════════════════════════════════════

type BlockOwner =
  | { kind: 'top-level'; index: number }
  | { kind: 'ftab-tab'; blockIndex: number; tabIndex: number; childIndex: number }
  | { kind: 'materi-section'; blockIndex: number; childIndex: number }
  | { kind: 'children'; blockIndex: number; childIndex: number };

function findBlockOwner(blocks: SchemaBlock[], blockId: string): BlockOwner | null {
  // 1. Search top-level
  const idx = blocks.findIndex(b => b.id === blockId);
  if (idx !== -1) return { kind: 'top-level', index: idx };

  // 2. Search inside ftab.tabs[].content[]
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (block.type === 'ftab') {
      const ft = block as { tabs?: Array<{ content?: SchemaBlock[] }> };
      const tabs = ft.tabs || [];
      for (let ti = 0; ti < tabs.length; ti++) {
        const content = tabs[ti].content || [];
        const ci = content.findIndex(b => b.id === blockId);
        if (ci !== -1) return { kind: 'ftab-tab', blockIndex: bi, tabIndex: ti, childIndex: ci };
      }
    }
    // 3. Search inside materi-section.content[]
    if (block.type === 'materi-section') {
      const ms = block as { content?: SchemaBlock[] };
      const content = ms.content || [];
      const ci = content.findIndex(b => b.id === blockId);
      if (ci !== -1) return { kind: 'materi-section', blockIndex: bi, childIndex: ci };
    }
    // 4. Search inside generic BaseBlock.children[]
    // This is a fallback for any block type that uses the generic `children` field.
    // Without this, edits to blocks nested via `children` are silently dropped.
    if (block.children && Array.isArray(block.children)) {
      const ci = block.children.findIndex(b => b.id === blockId);
      if (ci !== -1) return { kind: 'children', blockIndex: bi, childIndex: ci };
    }
  }

  return null;
}

export type UISlice = Pick<
  CanvaState,
  | 'setTool' | 'setLeftTab' | 'toggleLeftPanel' | 'toggleRightPanel'
  | 'toggleGrid' | 'setGridSize' | 'toggleSnap' | 'snapValue'
  | 'applyLayoutPreset' | 'currentLayoutPreset'
  | 'setZoom' | 'setFitZoom' | 'zoomDelta' | 'zoomToFit' | 'setRatio' | 'nudgeSelected'
  | 'alignSelected' | 'distributeSelected'
  | 'clearStage' | 'selectBlock' | 'updateSchemaBlock'
  | 'hoverBlock' | 'startEditing' | 'stopEditing'
  | 'deleteBlock' | 'moveBlockUp' | 'moveBlockDown' | 'duplicateBlock'
  | 'addSchemaBlock'
  | '_schemaClipboard' | 'copySchemaBlock' | 'pasteSchemaBlock'
  | 'selectedBlockIds' | 'nudgeSchemaBlocks' | 'deleteSchemaBlocks' | 'reorderSchemaBlocks'
  | 'moveBlockToPage'
  | '_lastNudgeTime'
  | 'sceneIndex' | 'sceneTotal' | 'setSceneState' | 'navigateScene'
  | 'canvasPreview' | 'toggleCanvasPreview'
>;

export const createUISlice: StateCreator<CanvaState, [], [], UISlice> = (set, get) => ({
  _schemaClipboard: null,
  selectedBlockIds: [],
  _lastNudgeTime: undefined,
  sceneIndex: 0,
  sceneTotal: 1,
  canvasPreview: false,

  setTool: (tool) => set({ tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),
  toggleLeftPanel: () => set(s => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),

  // ── Schema Block Selection ───────────────────────────────────
  // Central selection action — sets the editing context for a block.
  // Clears element selection when a block is selected (mutual exclusion).
  // Supports shift+click multi-select via addToSelection parameter.
  selectBlock: (blockId, blockType, addToSelection) => {
    editBus.emit({ type: 'select', blockId: blockId ?? null, blockType: blockType ?? null });

    if (!blockId) {
      // Clear all selection
      set({
        selectedBlockId: null,
        selectedBlockType: null,
        editingBlockId: null,
        selectedBlockIds: [],
        selectedElId: null,
        selectedElIds: [],
      });
      return;
    }

    if (addToSelection) {
      // Toggle in multi-select
      const current = get().selectedBlockIds;
      const isSelected = current.includes(blockId);

      if (isSelected) {
        // Deselect from multi-select
        const newIds = current.filter(id => id !== blockId);
        set({
          selectedBlockIds: newIds,
          selectedBlockId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
          selectedBlockType: blockType ?? null,
          editingBlockId: null,
        });
      } else {
        // Add to multi-select
        const newIds = [...current, blockId];
        set({
          selectedBlockIds: newIds,
          selectedBlockId: blockId,
          selectedBlockType: blockType ?? null,
          editingBlockId: null,
        });
      }
    } else {
      // Single select (replace)
      set({
        selectedBlockId: blockId,
        selectedBlockType: blockType ?? null,
        editingBlockId: null,
        selectedBlockIds: [blockId],
        // When selecting a block, clear element selection to avoid confusion
        selectedElId: null,
        selectedElIds: [],
      });
    }
  },

  // ── Schema Block Hover Context ────────────────────────────────
  // Tracks which block the cursor is over — for hover effects,
  // layer panel highlighting, and future multi-select support.
  hoverBlock: (blockId) => {
    editBus.emit({ type: 'hover', blockId: blockId ?? null });
    set({ hoveredBlockId: blockId ?? null });
  },

  // ── Inline Editing Context ────────────────────────────────────
  // Double-click a text block → enter inline editing mode.
  // The editing overlay reads editingBlockId to show a floating editor.
  startEditing: (blockId) => {
    const blockType = get().selectedBlockType;
    editBus.emit({ type: 'edit-start', blockId, blockType: blockType ?? 'unknown' });
    set({ editingBlockId: blockId });
  },
  stopEditing: () => {
    const prevId = get().editingBlockId;
    if (prevId) editBus.emit({ type: 'edit-end', blockId: prevId });
    set({ editingBlockId: null });
  },

  // ── Schema Block Content Editing (DEEP PATCH MERGE) ──────────
  // This is THE core editing mechanism for the Visual Editing Engine.
  //
  // Flow: UI editor → updateSchemaBlock(id, patch) → deep merge → page.schema → renderer → rerender
  //
  // FASE 1: Now edits page.schema directly (not templateData.schemaScreen).
  // ensurePageSchema() handles lazy migration from legacy pages automatically.
  // After first edit, page.schema is populated and becomes canonical.
  //
  // Key improvements:
  //   1. DEEP MERGE via Immer
  //   2. IMMUTABLE updates
  //   3. PATCH-BASED undo/redo via PatchHistory
  //   4. SCHEMA-FIRST: Edits go to page.schema, NOT templateData
  updateSchemaBlock: (blockId, updates) => {
    const { pages, currentPageIndex } = get();
    let page = pages[currentPageIndex];
    if (!page || !blockId) return;

    // ═══ SCHEMA-FIRST: Ensure page has schema ═════════════════
    // This lazily migrates legacy pages on first edit.
    // ensurePageSchema no longer mutates — we must set the migrated
    // schema immutably if it wasn't already on the page.
    let schema = ensurePageSchema(page);
    if (!schema) return; // Custom pages can't be edited this way

    // If page.schema was null (just migrated), immutably set it
    if (!page.schema && schema) {
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema };
      set({ pages: newPages });
      page = newPages[currentPageIndex];
    }

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    // ═══ Find block — supports nested blocks inside composites ═══
    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    // Push history BEFORE the edit (for snapshot-based undo fallback)
    get()._pushHistory();

    // ═══ DEEP PATCH MERGE via Immer (with patches) ═════════════
    if (owner.kind === 'top-level') {
      // Top-level block — use existing mergeBlockInArray
      const { blocks: newBlocks, patches: forwardPatches, inversePatches } =
        mergeBlockInArray(blocks, owner.index, updates);

      editBus.emit({
        type: 'patch',
        patch: {
          blockId,
          blockType: blocks[owner.index].type,
          pageIndex: currentPageIndex,
          patch: updates,
          timestamp: Date.now(),
          source: 'user',
          _immerPatches: {
            forward: forwardPatches,
            inverse: inversePatches,
            pageIndex: currentPageIndex,
          },
        },
      });

      const newSchema: ScreenSchema = { ...schema, blocks: newBlocks };
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: newSchema };
      set({ pages: newPages });
    } else {
      // Nested block (ftab tab content, materi-section content, or generic children) — use Immer produce with patches
      const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
        let target: SchemaBlock | undefined;
        if (owner.kind === 'ftab-tab') {
          const ft = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
          target = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
        } else if (owner.kind === 'materi-section') {
          const ms = draft[owner.blockIndex] as { content?: SchemaBlock[] };
          target = ms.content?.[owner.childIndex];
        } else if (owner.kind === 'children') {
          // Generic BaseBlock.children — fallback for any composite block type
          target = draft[owner.blockIndex].children?.[owner.childIndex];
        }
        if (target) {
          Object.assign(target, deepMergeBlock(target, updates));
        }
      });

      // Determine blockType for the editBus event
      let nestedBlockType = 'unknown';
      if (owner.kind === 'ftab-tab') {
        const ft = blocks[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
        nestedBlockType = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex]?.type || 'unknown';
      } else if (owner.kind === 'materi-section') {
        const ms = blocks[owner.blockIndex] as { content?: SchemaBlock[] };
        nestedBlockType = ms.content?.[owner.childIndex]?.type || 'unknown';
      } else if (owner.kind === 'children') {
        nestedBlockType = blocks[owner.blockIndex].children?.[owner.childIndex]?.type || 'unknown';
      }

      editBus.emit({
        type: 'patch',
        patch: {
          blockId,
          blockType: nestedBlockType,
          pageIndex: currentPageIndex,
          patch: updates,
          timestamp: Date.now(),
          source: 'user',
          // FIX: Include Immer patches for nested block edits so PatchHistory
          // can perform fine-grained undo/redo instead of full snapshot fallback.
          _immerPatches: {
            forward: forwardPatches,
            inverse: inversePatches,
            pageIndex: currentPageIndex,
          },
        },
      });

      const newSchema: ScreenSchema = { ...schema, blocks: newBlocks as SchemaBlock[] };
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: newSchema };
      set({ pages: newPages });
    }
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

  // ── Scene Navigation (multi-scene overflow) ──────────────────
  // SchemaRenderer updates these when the scene plan changes.
  // Keyboard shortcuts (Ctrl+Arrow) and SceneNavigator call navigateScene().
  setSceneState: (index, total) => set({ sceneIndex: index, sceneTotal: total }),
  navigateScene: (index) => {
    const { sceneTotal } = get();
    const clamped = Math.max(0, Math.min(index, sceneTotal - 1));
    set({ sceneIndex: clamped });
  },

  // ── Canvas Preview Mode ────────────────────────────────────
  // Quick toggle to switch between editing (canvas) and preview mode.
  // In preview mode: no selection overlays, no compression badges,
  // no editing handles — content shown as students will see it.
  toggleCanvasPreview: () => set(s => ({
    canvasPreview: !s.canvasPreview,
    // When entering preview, clear selection to avoid editing state lingering
    ...(s.canvasPreview ? {} : {
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
      selectedElId: null,
      selectedElIds: [],
    }),
  })),

  // ── Layout Presets ────────────────────────────────────────────
  applyLayoutPreset: (presetId) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (!preset || preset.slots.length === 0) return; // 'free' = no change
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
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
    if (!page || page.elements.length === 0) return LAYOUT_PRESETS[0]; // free
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
  },

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  /** Update the cached fitZoom from Stage's ResizeObserver */
  setFitZoom: (fitZoom) => set({ fitZoom }),
  zoomDelta: (delta) => {
    const { zoom, fitZoom } = get();
    // If currently in ZOOM_FIT mode, resolve to the actual fitZoom first,
    // then apply the delta from there.
    const base = zoom === ZOOM_FIT ? fitZoom : zoom;
    const next = base + delta;
    set({ zoom: clampZoom(next) });
  },
  /** Reset zoom to auto-fit mode (calculated by Stage) */
  zoomToFit: () => set({ zoom: ZOOM_FIT }),
  setRatio: (ratioId) => set({ ratioId, zoom: ZOOM_FIT }), // Reset to auto-fit when ratio changes

  // ── Stage ────────────────────────────────────────────────────
  clearStage: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (page.elements.length === 0) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, elements: [] };
    set({ pages: newPages, selectedElId: null, selectedElIds: [], selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
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
    const allEls = page.elements;
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
    const allEls = page.elements;
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
      };
      set({ pages: newPages });
    }
    toast.success(`Distribusi ${axis === 'horizontal' ? 'horizontal' : 'vertikal'} diterapkan`);
  },

  // ── Schema Block CRUD ───────────────────────────────────────────
  // deleteBlock: Remove a block from the schema by ID
  // FASE 1: Now operates on page.schema directly
  // Shows an undo toast so the user can restore the block.
  // FIX: Uses findBlockOwner so nested blocks (ftab, materi-section, children)
  // can be deleted instead of silently failing with top-level-only search.
  deleteBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    // Use findBlockOwner for consistent nested block search
    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    get()._pushHistory();

    let deletedBlock: SchemaBlock;
    let newBlocks: SchemaBlock[];

    if (owner.kind === 'top-level') {
      deletedBlock = blocks[owner.index];
      newBlocks = blocks.filter((_, i) => i !== owner.index);
    } else if (owner.kind === 'ftab-tab') {
      const ft = blocks[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
      const tab = ft.tabs?.[owner.tabIndex];
      deletedBlock = tab?.content?.[owner.childIndex] as SchemaBlock;
      // Remove from tab content
      newBlocks = produce(blocks, draft => {
        const dFt = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
        dFt.tabs?.[owner.tabIndex]?.content?.splice(owner.childIndex, 1);
      });
    } else if (owner.kind === 'materi-section') {
      const ms = blocks[owner.blockIndex] as { content?: SchemaBlock[] };
      deletedBlock = ms.content?.[owner.childIndex] as SchemaBlock;
      newBlocks = produce(blocks, draft => {
        const dMs = draft[owner.blockIndex] as { content?: SchemaBlock[] };
        dMs.content?.splice(owner.childIndex, 1);
      });
    } else {
      // children
      deletedBlock = blocks[owner.blockIndex].children?.[owner.childIndex] as SchemaBlock;
      newBlocks = produce(blocks, draft => {
        draft[owner.blockIndex].children?.splice(owner.childIndex, 1);
      });
    }

    const blockName = ((deletedBlock as unknown) as Record<string, unknown>).title as string || deletedBlock.type || 'Block';

    editBus.emit({ type: 'patch', patch: { blockId, blockType: deletedBlock.type, pageIndex: currentPageIndex, patch: { _deleted: true }, timestamp: Date.now(), source: 'user' } });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    // Undo toast: clicking "Undo" triggers the store's undo()
    toast.success(`Block "${blockName}" dihapus`, {
      action: {
        label: 'Undo',
        onClick: () => {
          get().undo();
        },
      },
      duration: 4000,
    });
  },

  // moveBlockUp: Move a block one position up in the flow order
  // FASE 1: Now operates on page.schema directly
  // FIX: Uses findBlockOwner to correctly locate nested blocks.
  // Nested blocks (ftab, materi-section, children) can be reordered
  // within their parent container.
  moveBlockUp: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    get()._pushHistory();

    if (owner.kind === 'top-level') {
      if (owner.index <= 0) { return; } // already at top
      const newBlocks = [...blocks];
      [newBlocks[owner.index - 1], newBlocks[owner.index]] = [newBlocks[owner.index], newBlocks[owner.index - 1]];
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    } else if (owner.kind === 'ftab-tab') {
      // Reorder within tab content
      const newBlocks = produce(blocks, draft => {
        const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
        if (content && owner.childIndex > 0) {
          [content[owner.childIndex - 1], content[owner.childIndex]] = [content[owner.childIndex], content[owner.childIndex - 1]];
        }
      });
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    } else if (owner.kind === 'materi-section') {
      const newBlocks = produce(blocks, draft => {
        const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
        if (content && owner.childIndex > 0) {
          [content[owner.childIndex - 1], content[owner.childIndex]] = [content[owner.childIndex], content[owner.childIndex - 1]];
        }
      });
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    } else if (owner.kind === 'children') {
      const newBlocks = produce(blocks, draft => {
        const children = draft[owner.blockIndex].children;
        if (children && owner.childIndex > 0) {
          [children[owner.childIndex - 1], children[owner.childIndex]] = [children[owner.childIndex], children[owner.childIndex - 1]];
        }
      });
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    }
  },

  // moveBlockDown: Move a block one position down in the flow order
  // FASE 1: Now operates on page.schema directly
  // FIX: Uses findBlockOwner to correctly locate nested blocks.
  moveBlockDown: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    get()._pushHistory();

    if (owner.kind === 'top-level') {
      if (owner.index >= blocks.length - 1) { return; } // already at bottom
      const newBlocks = [...blocks];
      [newBlocks[owner.index], newBlocks[owner.index + 1]] = [newBlocks[owner.index + 1], newBlocks[owner.index]];
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    } else if (owner.kind === 'ftab-tab') {
      const newBlocks = produce(blocks, draft => {
        const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
        if (content && owner.childIndex < content.length - 1) {
          [content[owner.childIndex], content[owner.childIndex + 1]] = [content[owner.childIndex + 1], content[owner.childIndex]];
        }
      });
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    } else if (owner.kind === 'materi-section') {
      const newBlocks = produce(blocks, draft => {
        const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
        if (content && owner.childIndex < content.length - 1) {
          [content[owner.childIndex], content[owner.childIndex + 1]] = [content[owner.childIndex + 1], content[owner.childIndex]];
        }
      });
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    } else if (owner.kind === 'children') {
      const newBlocks = produce(blocks, draft => {
        const children = draft[owner.blockIndex].children;
        if (children && owner.childIndex < children.length - 1) {
          [children[owner.childIndex], children[owner.childIndex + 1]] = [children[owner.childIndex + 1], children[owner.childIndex]];
        }
      });
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema: { ...schema, blocks: newBlocks } };
      set({ pages: newPages });
    }
  },

  // duplicateBlock: Clone a block and insert it after the original
  // FASE 1: Now operates on page.schema + uses nanoid for clone ID
  // FIX: Uses findBlockOwner so nested blocks can be duplicated.
  duplicateBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    get()._pushHistory();

    // Deep clone the block with a stable nanoid
    let original: SchemaBlock;
    if (owner.kind === 'top-level') {
      original = blocks[owner.index];
    } else if (owner.kind === 'ftab-tab') {
      const ft = blocks[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
      original = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex] as SchemaBlock;
    } else if (owner.kind === 'materi-section') {
      const ms = blocks[owner.blockIndex] as { content?: SchemaBlock[] };
      original = ms.content?.[owner.childIndex] as SchemaBlock;
    } else {
      original = blocks[owner.blockIndex].children?.[owner.childIndex] as SchemaBlock;
    }

    const clone = produce(original, (draft) => {
      draft.id = generateBlockId(); // ← Stable nanoid, not Date.now()
    });

    // Insert clone after original in the correct container
    let newBlocks: SchemaBlock[];
    if (owner.kind === 'top-level') {
      newBlocks = [...blocks];
      newBlocks.splice(owner.index + 1, 0, clone);
    } else {
      newBlocks = produce(blocks, draft => {
        if (owner.kind === 'ftab-tab') {
          const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
          content?.splice(owner.childIndex + 1, 0, clone);
        } else if (owner.kind === 'materi-section') {
          const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
          content?.splice(owner.childIndex + 1, 0, clone);
        } else {
          draft[owner.blockIndex].children?.splice(owner.childIndex + 1, 0, clone);
        }
      });
    }

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({ pages: newPages });
    // Select the cloned block
    get().selectBlock(clone.id ?? null, clone.type);
    toast.success('Block diduplikat');
  },

  // ── Add Schema Block from Registry ────────────────────────────
  // Adds a new block of the given type to the current page's schema.
  // FASE 1: Now operates on page.schema directly via ensurePageSchema().
  // Uses nanoid for stable block IDs (not Date.now()).
  // insertAfterIndex: If provided, insert after that index instead of appending.
  addSchemaBlock: (blockType, insertAfterIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    // ═══ SCHEMA-FIRST: Ensure page has schema ═════════════════
    const schema = ensurePageSchema(page);
    if (!schema) {
      toast.warning('Tidak dapat menambah block ke halaman ini');
      return;
    }

    const blocks = schema.blocks;

    // Get block definition from registry
    const definition = BLOCK_DEFINITIONS[blockType];
    if (!definition) {
      toast.error(`Block type "${blockType}" tidak ditemukan`);
      return;
    }

    get()._pushHistory();

    // Create default block — stable nanoid, data-driven from registry
    const newBlock: Record<string, unknown> = {
      id: generateBlockId(), // ← Stable nanoid, not Date.now()
      type: blockType,
      variant: 'A' as const,
      layout: {
        position: definition.defaultLayout.position,
        ...(definition.defaultLayout.defaultX != null ? { x: definition.defaultLayout.defaultX } : {}),
        ...(definition.defaultLayout.defaultY != null ? { y: definition.defaultLayout.defaultY } : {}),
        ...(definition.defaultLayout.defaultWidth != null ? { width: definition.defaultLayout.defaultWidth } : {}),
        ...(definition.defaultLayout.defaultHeight != null ? { height: definition.defaultLayout.defaultHeight } : {}),
      },
    };

    // Add default content from registry — data-driven, no switch needed
    const defaultContent = definition.createDefault?.() ?? { title: definition.name };
    Object.assign(newBlock, defaultContent);

    // Insert at specific position or append to end
    const newBlocks = [...blocks];
    const insertAt = insertAfterIndex != null ? insertAfterIndex + 1 : newBlocks.length;
    newBlocks.splice(insertAt, 0, newBlock as unknown as SchemaBlock);

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id as string,
        blockType,
        pageIndex: currentPageIndex,
        patch: { _added: true },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    // ═══ SCHEMA-FIRST: Update page.schema directly ════════════
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({ pages: newPages });

    // Select the new block
    get().selectBlock(newBlock.id as string, blockType);
    toast.success(`${definition.name} ditambahkan`);
  },

  // ── Schema Block Nudge (arrow keys) ────────────────────────────
  // FASE 1: Now operates on page.schema directly
  // FIX: Uses findBlockOwner so nested absolute-positioned blocks
  // can also be nudged. Previously only top-level blocks were checked.
  nudgeSchemaBlocks: (dxPct, dyPct) => {
    const { pages, currentPageIndex, selectedBlockIds, selectedBlockId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    const idsToNudge = selectedBlockIds.length > 1 ? selectedBlockIds : (selectedBlockId ? [selectedBlockId] : []);
    if (idsToNudge.length === 0) return;

    // Debounce history push (max once per 500ms of continuous nudging)
    const now = Date.now();
    const lastNudge = get()._lastNudgeTime;
    if (!lastNudge || now - lastNudge > 500) {
      get()._pushHistory();
    }
    set({ _lastNudgeTime: now });

    const nudgeBlock = (block: SchemaBlock): SchemaBlock => {
      const layout = block.layout || { position: 'flow' as const };
      if (layout.position !== 'absolute') return block; // Can't nudge flow blocks

      const toNum = (v: number | string | undefined, fallback: number): number =>
        typeof v === 'number' ? v : fallback;

      return {
        ...block,
        layout: {
          ...layout,
          x: Math.max(0, Math.min(90, toNum(layout.x, 0) + dxPct)),
          y: Math.max(0, Math.min(90, toNum(layout.y, 0) + dyPct)),
        },
      };
    };

    // Use Immer produce to handle both top-level and nested blocks
    const newBlocks = produce(blocks, draft => {
      for (const blockId of idsToNudge) {
        const owner = findBlockOwner(blocks as SchemaBlock[], blockId);
        if (!owner) continue;

        if (owner.kind === 'top-level') {
          const block = draft[owner.index];
          const nudged = nudgeBlock(block as SchemaBlock);
          if (nudged !== block) {
            Object.assign(draft[owner.index], nudged);
          }
        } else if (owner.kind === 'ftab-tab') {
          const ft = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
          const block = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
          if (block) {
            const nudged = nudgeBlock(block as SchemaBlock);
            if (nudged !== block) {
              Object.assign(ft.tabs![owner.tabIndex].content![owner.childIndex], nudged);
            }
          }
        } else if (owner.kind === 'materi-section') {
          const ms = draft[owner.blockIndex] as { content?: SchemaBlock[] };
          const block = ms.content?.[owner.childIndex];
          if (block) {
            const nudged = nudgeBlock(block as SchemaBlock);
            if (nudged !== block) {
              Object.assign(ms.content![owner.childIndex], nudged);
            }
          }
        } else if (owner.kind === 'children') {
          const block = draft[owner.blockIndex].children?.[owner.childIndex];
          if (block) {
            const nudged = nudgeBlock(block as SchemaBlock);
            if (nudged !== block) {
              Object.assign(draft[owner.blockIndex].children![owner.childIndex], nudged);
            }
          }
        }
      }
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({ pages: newPages });
  },

  // ── Schema Block Bulk Delete ────────────────────────────────────
  // FASE 1: Now operates on page.schema directly
  // FIX: Uses findBlockOwner so nested blocks (ftab, materi-section, children)
  // are also deleted. Previously only top-level blocks were removed —
  // nested blocks were silently skipped, leaving orphaned data.
  deleteSchemaBlocks: (blockIds) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    get()._pushHistory();

    // Separate top-level vs nested block IDs
    const topLevelIds = new Set<string>();
    const nestedOwners: BlockOwner[] = [];

    for (const blockId of blockIds) {
      const owner = findBlockOwner(blocks, blockId);
      if (!owner) continue;
      if (owner.kind === 'top-level') {
        topLevelIds.add(blockId);
      } else {
        nestedOwners.push(owner);
      }
    }

    // Remove top-level blocks + nested blocks via Immer produce
    const newBlocks = produce(blocks, draft => {
      // Remove top-level blocks (collect indices first, splice in reverse)
      const topLevelIndices = blockIds
        .map(id => draft.findIndex(b => b.id === id))
        .filter(i => i !== -1)
        .sort((a, b) => b - a); // reverse order for safe splice

      for (const idx of topLevelIndices) {
        draft.splice(idx, 1);
      }

      // Remove nested blocks (after top-level removals, re-find owners)
      // Note: we re-find because top-level removal shifted indices.
      // We use the original nestedOwners but need to be careful about
      // indices that may have shifted. So we do a second pass using
      // block IDs directly inside the Immer draft.
      for (const blockId of blockIds) {
        if (topLevelIds.has(blockId)) continue; // already removed
        // Search in ftab tabs
        for (const block of draft) {
          if (block.type === 'ftab') {
            const ft = block as { tabs?: Array<{ content?: SchemaBlock[] }> };
            for (const tab of (ft.tabs || [])) {
              const ci = (tab.content || []).findIndex(b => b.id === blockId);
              if (ci !== -1) { tab.content?.splice(ci, 1); break; }
            }
          }
          // Search in materi-section
          if (block.type === 'materi-section') {
            const ms = block as { content?: SchemaBlock[] };
            const ci = (ms.content || []).findIndex(b => b.id === blockId);
            if (ci !== -1) { ms.content?.splice(ci, 1); break; }
          }
          // Search in generic children
          if (block.children && Array.isArray(block.children)) {
            const ci = block.children.findIndex(b => b.id === blockId);
            if (ci !== -1) { block.children.splice(ci, 1); break; }
          }
        }
      }
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({
      pages: newPages,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });
    toast.success(`${blockIds.length} block dihapus`);
  },

  // ── Schema Block Reorder (drag-sort) ────────────────────────────
  // Moves a block from fromIndex to toIndex in the blocks array.
  // Used by LayerPanel drag-sort for intuitive block reordering.
  // FASE 1: Now operates on page.schema directly
  reorderSchemaBlocks: (fromIndex, toIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;
    if (fromIndex < 0 || fromIndex >= blocks.length) return;
    if (toIndex < 0 || toIndex >= blocks.length) return;
    if (fromIndex === toIndex) return;

    get()._pushHistory();

    // Remove block at fromIndex, insert at toIndex
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: moved.id || '',
        blockType: moved.type,
        pageIndex: currentPageIndex,
        patch: { _reordered: true, fromIndex, toIndex },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({ pages: newPages });
  },

  // ── Schema Block Copy/Paste ───────────────────────────────────
  // FASE 1: Now operates on page.schema directly + uses nanoid
  // FIX: Uses findBlockOwner so nested blocks can be copied.
  copySchemaBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;

    // Use findBlockOwner for consistent nested block search
    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    let block: SchemaBlock | undefined;
    if (owner.kind === 'top-level') {
      block = blocks[owner.index];
    } else if (owner.kind === 'ftab-tab') {
      const ft = blocks[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
      block = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
    } else if (owner.kind === 'materi-section') {
      const ms = blocks[owner.blockIndex] as { content?: SchemaBlock[] };
      block = ms.content?.[owner.childIndex];
    } else {
      block = blocks[owner.blockIndex].children?.[owner.childIndex];
    }

    if (!block) return;

    // Deep clone to clipboard
    const clone = produce(block, (draft) => {
      // Remove the ID so it gets a new one on paste
      draft.id = undefined;
    });
    set({ _schemaClipboard: clone as SchemaBlock });
    toast.success('Block disalin');
  },

  // Paste a schema block from the internal clipboard. Appends it to
  // the current page's schema with a fresh nanoid.
  pasteSchemaBlock: () => {
    const { pages, currentPageIndex } = get();
    const clipboard = get()._schemaClipboard;
    if (!clipboard) {
      toast.info('Tidak ada block di clipboard');
      return;
    }

    const page = pages[currentPageIndex];
    if (!page) return;

    const schema = ensurePageSchema(page);
    if (!schema) {
      toast.warning('Tidak dapat menambah block ke halaman ini');
      return;
    }

    const blocks = schema.blocks;

    get()._pushHistory();

    // Deep clone with stable nanoid
    const newBlock = produce(clipboard, (draft) => {
      draft.id = generateBlockId(); // ← Stable nanoid, not Date.now()
    });

    const newBlocks = [...blocks, newBlock];

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id!,
        blockType: clipboard.type,
        pageIndex: currentPageIndex,
        patch: { _pasted: true },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: { ...schema, blocks: newBlocks },
    };
    set({ pages: newPages });
    get().selectBlock(newBlock.id!, clipboard.type);
    toast.success('Block ditempel');
  },

  // ── Move Block to Another Page ──────────────────────────────────
  // Removes the block from the current page and appends it to the
  // target page. Used by context menu "Move to Page" action.
  moveBlockToPage: (blockId, targetPageIndex) => {
    const { pages, currentPageIndex } = get();
    if (targetPageIndex === currentPageIndex) return;
    if (targetPageIndex < 0 || targetPageIndex >= pages.length) return;

    const sourcePage = pages[currentPageIndex];
    const targetPage = pages[targetPageIndex];
    if (!sourcePage || !targetPage) return;

    const sourceSchema = ensurePageSchema(sourcePage);
    const targetSchema = ensurePageSchema(targetPage);
    if (!sourceSchema || !targetSchema) {
      toast.warning('Tidak dapat memindahkan block ke halaman ini');
      return;
    }

    const blockIdx = sourceSchema.blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) return;

    get()._pushHistory();

    // Remove from source page
    const movedBlock = sourceSchema.blocks[blockIdx];
    const newSourceBlocks = sourceSchema.blocks.filter((_, i) => i !== blockIdx);

    // Add to target page with fresh nanoid to prevent ID conflicts
    const newTargetBlock = produce(movedBlock, (draft) => {
      draft.id = generateBlockId();
    });
    const newTargetBlocks = [...targetSchema.blocks, newTargetBlock];

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...sourcePage,
      schema: { ...sourceSchema, blocks: newSourceBlocks },
    };
    newPages[targetPageIndex] = {
      ...targetPage,
      schema: { ...targetSchema, blocks: newTargetBlocks },
    };

    set({
      pages: newPages,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });

    toast.success(`Block dipindahkan ke ${targetPage.label}`);
  },
});
