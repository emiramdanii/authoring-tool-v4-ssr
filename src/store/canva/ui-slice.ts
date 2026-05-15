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
import { ensurePageSchema, generateBlockId, generatePageId } from '@/core/schema/ensure-schema';
import { bumpVersion, splitScene, mergeScene, duplicateBlock as duplicateBlockImmutable, findBlockById, moveBlockNested, insertBlockNested, type ContainerRef } from '@/core/schema/immutable';
import { createTransaction } from '@/core/schema/scene-transaction';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '@/core/schema/capability-registry';
import { isCompositeBlock } from '@/core/layout/SchemaTraversal';
import { rebalanceFromScenePlan, promoteSceneSplitToPage, mergePagesTransaction } from '@/core/schema/schema-apply';
import { computeScenePlan } from '@/core/layout/SceneOverflowEngine';
import { getSceneResolution, computeSafeArea, DEFAULT_SAFE_AREA } from '@/core/scene/SceneLayoutEngine';
import { ZOOM_FIT, ZOOM_MIN, ZOOM_MAX, clampZoom } from '@/lib/canva-constants';
import { findBlockOwner, commitSchemaUpdate, type BlockOwner } from './schema-helpers';

export type UISlice = Pick<
  CanvaState,
  | 'setTool' | 'setLeftTab'
  | 'toggleGrid' | 'setGridSize' | 'toggleSnap' | 'snapValue'
  | 'applyLayoutPreset' | 'currentLayoutPreset'
  | 'setZoom' | 'setFitZoom' | 'zoomDelta' | 'zoomToFit' | 'setRatio' | 'nudgeSelected'
  | 'alignSelected' | 'distributeSelected'
  | 'clearStage' | 'updateSchemaBlock'
  | 'deleteBlock' | 'moveBlockUp' | 'moveBlockDown' | 'duplicateBlock'
  | 'addSchemaBlock'
  | '_schemaClipboard' | 'copySchemaBlock' | 'pasteSchemaBlock'
  | 'nudgeSchemaBlocks' | 'deleteSchemaBlocks' | 'reorderSchemaBlocks'
  | 'moveBlockToPage' | 'splitPageAtBlock' | 'mergeWithNextPage'
  | 'moveBlockToContainer' | 'addSchemaBlockToContainer'
  | 'rebalanceCurrentPage' | 'promoteSceneSplit' | 'mergeWithAdjacentPage'
>;

export const createUISlice: StateCreator<CanvaState, [], [], UISlice> = (set, get) => ({
  _schemaClipboard: null,

  setTool: (tool) => set({ tool }),
  setLeftTab: (tab) => set({ leftTab: tab }),

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

      const newSchema: ScreenSchema = commitSchemaUpdate(schema, newBlocks);
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

      const newSchema: ScreenSchema = commitSchemaUpdate(schema, newBlocks as SchemaBlock[]);
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

    // ═══ PATCH-BASED DELETE via produceWithPatches ══════════════
    // Convert to produceWithPatches so PatchHistory gets fine-grained
    // inverse patches (re-insert the block) for precise undo.
    let deletedBlock: SchemaBlock;
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      if (owner.kind === 'top-level') {
        deletedBlock = draft[owner.index] as SchemaBlock;
        draft.splice(owner.index, 1);
      } else if (owner.kind === 'ftab-tab') {
        const ft = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
        deletedBlock = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex] as SchemaBlock;
        ft.tabs?.[owner.tabIndex]?.content?.splice(owner.childIndex, 1);
      } else if (owner.kind === 'materi-section') {
        const ms = draft[owner.blockIndex] as { content?: SchemaBlock[] };
        deletedBlock = ms.content?.[owner.childIndex] as SchemaBlock;
        ms.content?.splice(owner.childIndex, 1);
      } else {
        // children
        deletedBlock = draft[owner.blockIndex].children?.[owner.childIndex] as SchemaBlock;
        draft[owner.blockIndex].children?.splice(owner.childIndex, 1);
      }
    });

    const blockName = ((deletedBlock! as unknown) as Record<string, unknown>).title as string || deletedBlock!.type || 'Block';

    editBus.emit({
      type: 'patch',
      patch: {
        blockId,
        blockType: deletedBlock!.type,
        pageIndex: currentPageIndex,
        patch: { _deleted: true },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]),
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

    // ═══ PATCH-BASED REORDER via produceWithPatches ════════════
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      if (owner.kind === 'top-level') {
        if (owner.index <= 0) return; // already at top
        [draft[owner.index - 1], draft[owner.index]] = [draft[owner.index], draft[owner.index - 1]];
      } else if (owner.kind === 'ftab-tab') {
        const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
        if (content && owner.childIndex > 0) {
          [content[owner.childIndex - 1], content[owner.childIndex]] = [content[owner.childIndex], content[owner.childIndex - 1]];
        }
      } else if (owner.kind === 'materi-section') {
        const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
        if (content && owner.childIndex > 0) {
          [content[owner.childIndex - 1], content[owner.childIndex]] = [content[owner.childIndex], content[owner.childIndex - 1]];
        }
      } else if (owner.kind === 'children') {
        const children = draft[owner.blockIndex].children;
        if (children && owner.childIndex > 0) {
          [children[owner.childIndex - 1], children[owner.childIndex]] = [children[owner.childIndex], children[owner.childIndex - 1]];
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId,
        blockType: owner.kind === 'top-level' ? blocks[owner.index].type : 'unknown',
        pageIndex: currentPageIndex,
        patch: { _movedUp: true },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
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

    // ═══ PATCH-BASED REORDER via produceWithPatches ════════════
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      if (owner.kind === 'top-level') {
        if (owner.index >= blocks.length - 1) return; // already at bottom
        [draft[owner.index], draft[owner.index + 1]] = [draft[owner.index + 1], draft[owner.index]];
      } else if (owner.kind === 'ftab-tab') {
        const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
        if (content && owner.childIndex < content.length - 1) {
          [content[owner.childIndex], content[owner.childIndex + 1]] = [content[owner.childIndex + 1], content[owner.childIndex]];
        }
      } else if (owner.kind === 'materi-section') {
        const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
        if (content && owner.childIndex < content.length - 1) {
          [content[owner.childIndex], content[owner.childIndex + 1]] = [content[owner.childIndex + 1], content[owner.childIndex]];
        }
      } else if (owner.kind === 'children') {
        const children = draft[owner.blockIndex].children;
        if (children && owner.childIndex < children.length - 1) {
          [children[owner.childIndex], children[owner.childIndex + 1]] = [children[owner.childIndex + 1], children[owner.childIndex]];
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId,
        blockType: owner.kind === 'top-level' ? blocks[owner.index].type : 'unknown',
        pageIndex: currentPageIndex,
        patch: { _movedDown: true },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
  },

  // duplicateBlock: Clone a block and insert it after the original
  // Uses immutable.duplicateBlock() which deep-clones AND regenerates
  // nested child IDs (ftab tabs, materi-section content, children).
  // This is more robust than the previous manual clone which only
  // changed the top-level ID, leaving nested children with duplicate IDs.
  duplicateBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    // Verify block exists
    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    get()._pushHistory();

    // Use the immutable duplicateBlock — deep clone + regenerate nested IDs
    const { clonedBlock, newBlocks } = duplicateBlockImmutable(blocks, blockId);

    // Determine original block type for editBus
    const originalBlock = findBlockById(blocks, blockId);
    const blockType = originalBlock?.type || 'unknown';

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: clonedBlock.id ?? blockId,
        blockType,
        pageIndex: currentPageIndex,
        patch: { _duplicated: true },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks),
    };
    set({ pages: newPages });
    // Select the cloned block
    get().selectBlock(clonedBlock.id ?? null, clonedBlock.type);
    toast.success('Block diduplikat', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
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

    // ═══ PATCH-BASED ADD via produceWithPatches ══════════════
    const insertAt = insertAfterIndex != null ? insertAfterIndex + 1 : blocks.length;
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      draft.splice(insertAt, 0, newBlock as unknown as SchemaBlock);
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id as string,
        blockType,
        pageIndex: currentPageIndex,
        patch: { _added: true },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    // ═══ SCHEMA-FIRST: Update page.schema directly ════════════
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]),
    };
    set({ pages: newPages });

    // Select the new block
    get().selectBlock(newBlock.id as string, blockType);
    toast.success(`${definition.name} ditambahkan`, {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
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

    // Use Immer produceWithPatches so PatchHistory gets fine-grained
    // inverse patches for precise undo (instead of snapshot fallback).
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
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

    // Emit patches for PatchHistory fine-grained undo
    editBus.emit({
      type: 'patch',
      patch: {
        blockId: idsToNudge[0],
        blockType: 'nudge',
        pageIndex: currentPageIndex,
        patch: { _nudged: true, dxPct, dyPct, count: idsToNudge.length },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks),
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

    // ═══ PATCH-BASED BULK DELETE via produceWithPatches ══════════════
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      // Remove top-level blocks (collect indices first, splice in reverse)
      const topLevelIndices = blockIds
        .map(id => draft.findIndex(b => b.id === id))
        .filter(i => i !== -1)
        .sort((a, b) => b - a); // reverse order for safe splice

      for (const idx of topLevelIndices) {
        draft.splice(idx, 1);
      }

      // Remove nested blocks using descriptor-driven composite detection
      for (const blockId of blockIds) {
        for (const block of draft) {
          if (!isCompositeBlock(block)) continue;

          // Use descriptor-driven access for known composite types
          const descriptor = getCompositeContainerDescriptor(block.type);
          if (descriptor) {
            if (descriptor.structure === 'direct') {
              const children = (block as Record<string, unknown>)[descriptor.accessor] as SchemaBlock[] | undefined;
              const ci = (children || []).findIndex(b => b.id === blockId);
              if (ci !== -1) { (children || []).splice(ci, 1); break; }
            }
            if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
              const tabs = (block as Record<string, unknown>)[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
              for (const tab of (tabs || [])) {
                const content = tab[descriptor.tabContentKey!] as SchemaBlock[] | undefined;
                const ci = (content || []).findIndex(b => b.id === blockId);
                if (ci !== -1) { (content || []).splice(ci, 1); break; }
              }
            }
            continue;
          }

          // Generic children
          if (block.children && Array.isArray(block.children)) {
            const ci = block.children.findIndex(b => b.id === blockId);
            if (ci !== -1) { block.children.splice(ci, 1); break; }
          }
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: blockIds[0],
        blockType: 'bulk-delete',
        pageIndex: currentPageIndex,
        patch: { _bulkDeleted: true, count: blockIds.length },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]),
    };
    set({
      pages: newPages,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });
    toast.success(`${blockIds.length} block dihapus`, {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
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

    // ═══ PATCH-BASED REORDER via produceWithPatches ══════════════
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      const [moved] = draft.splice(fromIndex, 1);
      draft.splice(toIndex, 0, moved);
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlocks[toIndex]?.id || '',
        blockType: newBlocks[toIndex]?.type || 'unknown',
        pageIndex: currentPageIndex,
        patch: { _reordered: true, fromIndex, toIndex },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]),
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

    // ═══ PATCH-BASED PASTE via produceWithPatches ══════════════
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      draft.push(newBlock as SchemaBlock);
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id!,
        blockType: clipboard.type,
        pageIndex: currentPageIndex,
        patch: { _pasted: true },
        timestamp: Date.now(),
        source: 'user',
        _immerPatches: {
          forward: forwardPatches,
          inverse: inversePatches,
          pageIndex: currentPageIndex,
        },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]),
    };
    set({ pages: newPages });
    get().selectBlock(newBlock.id!, clipboard.type);
    toast.success('Block ditempel', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  // ── Move Block to Another Page ─────────────────────────────────
  // Removes a top-level block from the current page and appends it
  // to the target page. Only top-level blocks can be moved (nested
  // blocks belong to their parent composite). After the move, the
  // editor navigates to the target page so the user can see the result.
  // Uses snapshot-based undo via _pushHistory (modifies two pages).
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

    // Only allow top-level blocks (not nested inside composites)
    const blockIdx = sourceSchema.blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) {
      // Block might be nested — check with findBlockOwner
      const owner = findBlockOwner(sourceSchema.blocks, blockId);
      if (owner && owner.kind !== 'top-level') {
        toast.warning('Block bersarang tidak dapat dipindahkan ke halaman lain');
      }
      return;
    }

    get()._pushHistory();

    // Remove from source page
    const movedBlock = sourceSchema.blocks[blockIdx];
    const blockName = ((movedBlock as unknown) as Record<string, unknown>).title as string || movedBlock.type || 'Block';
    const newSourceBlocks = sourceSchema.blocks.filter((_, i) => i !== blockIdx);

    // Add to target page with fresh nanoid to prevent ID conflicts
    const newTargetBlock = produce(movedBlock, (draft) => {
      draft.id = generateBlockId();
    });
    const newTargetBlocks = [...targetSchema.blocks, newTargetBlock];

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...sourcePage,
      schema: commitSchemaUpdate(sourceSchema, newSourceBlocks),
    };
    newPages[targetPageIndex] = {
      ...targetPage,
      schema: commitSchemaUpdate(targetSchema, newTargetBlocks),
    };

    // Emit editBus event for cross-page move
    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newTargetBlock.id ?? blockId,
        blockType: movedBlock.type,
        pageIndex: targetPageIndex,
        patch: { _movedToPage: targetPageIndex },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    // Navigate to target page so user can see the moved block
    // Clear selection (the block has a new ID on the target page)
    set({
      pages: newPages,
      currentPageIndex: targetPageIndex,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });

    const targetLabel = targetPage.label || `Halaman ${targetPageIndex + 1}`;
    toast.success(`"${blockName}" dipindahkan ke ${targetLabel}`, {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  // ── Scene Transaction: Split Page at Block ──────────────────────
  // Uses SceneTransaction for atomic split — measure → split → commit.
  // If split fails (e.g., block is the last one), the schema is unchanged.
  splitPageAtBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    // Find the block index — only top-level blocks can be split points
    const blockIndex = schema.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1 || blockIndex === schema.blocks.length - 1) {
      toast.info('Tidak bisa split — block terakhir atau tidak ditemukan');
      return;
    }

    get()._pushHistory();

    // Use SceneTransaction for atomic split
    const tx = createTransaction(schema);
    tx.splitAt(blockId);
    const result = tx.commit();

    if (!result.success || !result.schema) {
      toast.error('Split gagal: ' + (result.error || 'Unknown error'));
      return;
    }

    // The transaction gives us the first half. We need the second half too.
    const splitResult = splitScene(schema, blockId);
    if (!splitResult) {
      toast.error('Split gagal: tidak bisa membagi scene');
      return;
    }

    const [firstSchema, secondSchema] = splitResult;

    // Create a new page for the second half
    const newPageId = generatePageId();
    const currentPageLabel = page.label || `Halaman ${currentPageIndex + 1}`;
    const newPage: typeof page = {
      ...page,
      id: newPageId,
      label: `${currentPageLabel} (lanjutan)`,
      schema: secondSchema,
      elements: [], // Schema-driven, no elements
      templateData: {},
    };

    // Update current page with first half
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, firstSchema.blocks),
    };
    // Insert new page after current
    newPages.splice(currentPageIndex + 1, 0, newPage);

    set({
      pages: newPages,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId,
        blockType: 'split',
        pageIndex: currentPageIndex,
        patch: { _splitAt: blockId, newPageId },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    toast.success('Halaman berhasil di-split', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  // ── Scene Transaction: Merge with Next Page ─────────────────────
  // Uses SceneTransaction for atomic merge — merge → validate → commit.
  // If merge fails (e.g., duplicate IDs), the schemas are unchanged.
  mergeWithNextPage: () => {
    const { pages, currentPageIndex } = get();
    if (currentPageIndex >= pages.length - 1) {
      toast.info('Tidak ada halaman berikutnya untuk di-merge');
      return;
    }

    const sourcePage = pages[currentPageIndex];
    const targetPage = pages[currentPageIndex + 1];

    const sourceSchema = ensurePageSchema(sourcePage);
    const targetSchema = ensurePageSchema(targetPage);
    if (!sourceSchema || !targetSchema) {
      toast.warning('Tidak bisa merge — salah satu halaman tidak memiliki schema');
      return;
    }

    get()._pushHistory();

    // Use SceneTransaction for atomic merge
    const tx = createTransaction(sourceSchema);
    tx.custom('merge', (schema) => mergeScene(schema, targetSchema));
    const result = tx.commit();

    if (!result.success || !result.schema) {
      toast.error('Merge gagal: ' + (result.error || 'Unknown error'));
      return;
    }

    // Update current page with merged schema
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...sourcePage,
      schema: commitSchemaUpdate(sourceSchema, result.schema.blocks),
    };
    // Remove the next page (it's been merged into current)
    newPages.splice(currentPageIndex + 1, 1);

    set({
      pages: newPages,
      selectedBlockId: null,
      selectedBlockType: null,
      editingBlockId: null,
      selectedBlockIds: [],
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: 'merge',
        blockType: 'merge',
        pageIndex: currentPageIndex,
        patch: { _mergedWith: currentPageIndex + 1 },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    toast.success('Halaman berhasil digabung', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  // ── Move Block to Container (nested move) ──────────────────────
  // Uses moveBlockNested() from immutable.ts — tree-aware move
  // between root, materi-section.content, ftab.tabs[].content, or children.
  // Example: move a def-box from root INTO a materi-section.
  moveBlockToContainer: (blockId, targetContainer, toIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    // Verify block exists
    const block = findBlockById(blocks, blockId);
    if (!block) return;

    get()._pushHistory();

    // Use the immutable moveBlockNested — handles extraction + insertion
    const newBlocks = moveBlockNested(blocks, {
      blockId,
      targetContainer,
      toIndex,
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId,
        blockType: block.type,
        pageIndex: currentPageIndex,
        patch: { _movedToContainer: targetContainer },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks),
    };
    set({ pages: newPages });

    const containerLabel = targetContainer.type === 'root' ? 'root' : targetContainer.type;
    toast.success(`Block dipindah ke ${containerLabel}`, {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  // ── Add Schema Block to Container ─────────────────────────────────
  // Uses insertBlockNested() from immutable.ts — tree-aware insertion
  // into composite containers (materi-section.content, ftab.tabs[].content, etc.)
  // Example: add a def-box INSIDE a materi-section.
  addSchemaBlockToContainer: (blockType, container, toIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    const schema = ensurePageSchema(page);
    if (!schema) {
      toast.warning('Tidak dapat menambah block ke halaman ini');
      return;
    }

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    // Get block definition from registry
    const definition = BLOCK_DEFINITIONS[blockType];
    if (!definition) {
      toast.error(`Block type "${blockType}" tidak ditemukan`);
      return;
    }

    get()._pushHistory();

    // Create default block
    const newBlock: Record<string, unknown> = {
      id: generateBlockId(),
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

    // Add default content from registry
    const defaultContent = definition.createDefault?.() ?? { title: definition.name };
    Object.assign(newBlock, defaultContent);

    // Use insertBlockNested — handles root + all container types
    const newBlocks = insertBlockNested(blocks, newBlock as unknown as SchemaBlock, container, toIndex);

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id as string,
        blockType,
        pageIndex: currentPageIndex,
        patch: { _addedToContainer: true, container: container.type },
        timestamp: Date.now(),
        source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      schema: commitSchemaUpdate(schema, newBlocks),
    };
    set({ pages: newPages });

    // Select the new block
    get().selectBlock(newBlock.id as string, blockType);

    const containerLabel = container.type;
    toast.success(`${definition.name} ditambahkan ke ${containerLabel}`, {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  // ── Scene Transaction Actions ────────────────────────────────────
  // These actions use the SceneTransaction system for atomic layout
  // mutations. They bridge the SceneOverflowEngine's derived plans
  // with the store, ensuring multi-step operations are all-or-nothing.

  /**
   * Rebalance the current page's layout using transaction.
   *
   * This is the user-facing action that:
   *   1. Computes a fresh ScenePlan from measurements
   *   2. If blocks overflow, applies compression via transaction
   *   3. Commits atomically — if validation fails, no changes
   *
   * Strategy: compression-first. If compression isn't enough,
   * the user can call promoteSceneSplit() to create a new page.
   */
  rebalanceCurrentPage: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) {
      toast.info('Halaman ini tidak memiliki schema');
      return;
    }

    get()._pushHistory();

    const result = rebalanceFromScenePlan(page.id, {
      isCompact: true,
      compressionFirst: true,
    });

    if (!result.success) {
      toast.error('Rebalance gagal: ' + (result.error || 'Unknown error'));
      return;
    }

    if (!result.pageUpdated) {
      if (result.scenePlan?.isSingleScene) {
        toast.info('Konten sudah pas — tidak perlu rebalance');
      }
      return;
    }

    toast.success('Layout halaman dioptimalkan', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  /**
   * Promote a scene split into an actual page split.
   *
   * When the SceneOverflowEngine determines that content needs to be
   * split across multiple scenes, this action converts the derived
   * plan into an actual page split:
   *   - The original page keeps scene 0 blocks
   *   - A new page is created for scene 1+ blocks
   *   - The transaction ensures atomicity
   *
   * @param sceneIndex - Which scene to promote (1+ = new page)
   */
  promoteSceneSplit: (sceneIndex = 1) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) {
      toast.info('Halaman ini tidak memiliki schema');
      return;
    }

    // Compute a real ScenePlan from current schema + measurements.
    // Previously this passed a dummy ScenePlan which would always fail.
    const sceneRes = getSceneResolution('16:9');
    const hasCoverBlock = page.schema.blocks.length === 1 &&
      page.schema.blocks.some(b => b.type === 'cover' || b.type === 'hero');
    const safeArea = hasCoverBlock
      ? DEFAULT_SAFE_AREA
      : computeSafeArea({
          showTopNav: false,
          showBottomNav: false,
          isCompact: true,
          pagePadding: 16,
        });

    const scenePlan = computeScenePlan(page.schema, sceneRes, safeArea, { isCompact: true });

    if (scenePlan.isSingleScene) {
      toast.info('Konten sudah pas dalam satu scene — tidak perlu split');
      return;
    }

    if (sceneIndex < 1 || sceneIndex >= scenePlan.totalScenes) {
      toast.error(`Scene index ${sceneIndex} tidak valid (total: ${scenePlan.totalScenes} scenes)`);
      return;
    }

    get()._pushHistory();

    const result = promoteSceneSplitToPage(page.id, scenePlan, sceneIndex);

    if (!result.success) {
      toast.error('Split gagal: ' + (result.error || 'Unknown error'));
      return;
    }

    toast.success('Scene dipisah menjadi halaman baru', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },

  /**
   * Merge current page with an adjacent page using transaction.
   *
   * This is the inverse of promoteSceneSplit(). It combines two
   * adjacent pages into one, using mergePagesTransaction() for
   * atomicity — if validation fails, no changes are applied.
   *
   * @param direction - 'next' to merge with the page after, 'prev' to merge with the page before
   */
  mergeWithAdjacentPage: (direction: 'next' | 'prev' = 'next') => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) {
      toast.info('Halaman ini tidak memiliki schema');
      return;
    }

    const adjacentIndex = direction === 'next'
      ? currentPageIndex + 1
      : currentPageIndex - 1;

    if (adjacentIndex < 0 || adjacentIndex >= pages.length) {
      toast.info(direction === 'next' ? 'Tidak ada halaman setelah ini' : 'Tidak ada halaman sebelum ini');
      return;
    }

    const adjacentPage = pages[adjacentIndex];
    if (!adjacentPage?.schema) {
      toast.info('Halaman sebelah tidak memiliki schema');
      return;
    }

    get()._pushHistory();

    const targetId = direction === 'next' ? page.id : adjacentPage.id;
    const sourceId = direction === 'next' ? adjacentPage.id : page.id;

    const result = mergePagesTransaction(targetId, sourceId);

    if (!result.success) {
      toast.error('Merge gagal: ' + (result.error || 'Unknown error'));
      return;
    }

    toast.success('Halaman berhasil digabung', {
      action: {
        label: 'Undo',
        onClick: () => { get().undo(); },
      },
      duration: 4000,
    });
  },
});
