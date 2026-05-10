// ═══════════════════════════════════════════════════════════════
// CANVA STORE — UI / Tool / Grid / Layout actions slice
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { CanvaElement } from '@/components/canva/types';
import { LAYOUT_PRESETS } from '@/components/canva/types';
import { convertToSchema } from '@/core/engine/TemplateAdapter';
import { deepMergeBlock } from '@/core/editor/deep-merge';
import type { SchemaBlock } from '@/core/schema/types';
import { editBus } from '@/core/editor/edit-bus';
import { SCENE_REGISTRY } from '@/core/registry/SceneRegistry';

export type UISlice = Pick<
  CanvaState,
  | 'setTool' | 'setLeftTab' | 'toggleLeftPanel' | 'toggleRightPanel'
  | 'toggleGrid' | 'setGridSize' | 'toggleSnap' | 'snapValue'
  | 'applyLayoutPreset' | 'currentLayoutPreset'
  | 'setZoom' | 'zoomDelta' | 'setRatio' | 'nudgeSelected'
  | 'alignSelected' | 'distributeSelected'
  | 'clearStage' | 'selectBlock' | 'updateSchemaBlock'
  | 'hoverBlock' | 'startEditing' | 'stopEditing'
  | 'deleteBlock' | 'moveBlockUp' | 'moveBlockDown' | 'duplicateBlock'
  | 'addSchemaBlock'
  | '_schemaClipboard' | 'copySchemaBlock' | 'pasteSchemaBlock'
  | 'selectedBlockIds' | 'nudgeSchemaBlocks' | 'deleteSchemaBlocks'
>;

export const createUISlice: StateCreator<CanvaState, [], [], UISlice> = (set, get) => ({
  _schemaClipboard: null,
  selectedBlockIds: [],

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
  // Flow: UI editor → updateSchemaBlock(id, patch) → deep merge → schema store → renderer → rerender
  //
  // Key improvements over the old shallow merge:
  //   1. DEEP MERGE: { style: { color: '#fff' } } only updates style.color, not the entire style object
  //   2. IMMUTABLE: Uses Immer for safe immutable updates with mutable draft API
  //   3. UNDO-FRIENDLY: Patches can be reversed (future: store patches, not full snapshots)
  //   4. COLLAB-READY: Partial updates make collaboration possible (merge patches from multiple users)
  //
  // For pages without an existing schemaScreen (legacy adapted pages),
  // this "freezes" the adapted schema into templateData on first edit.
  updateSchemaBlock: (blockId, updates) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    // Freeze adapted schema on first edit of legacy page
    if (!page.templateData?.schemaScreen) {
      const adapted = convertToSchema(page);
      if (!adapted) return; // custom pages can't be edited this way
      // Assign stable IDs to blocks that don't have one
      const stabilized = produce(adapted, (draft) => {
        draft.blocks.forEach((block, idx) => {
          if (!block.id) {
            block.id = `${block.type}-${idx}`;
          }
        });
      });
      const frozenPages = [...pages];
      frozenPages[currentPageIndex] = {
        ...page,
        templateData: {
          ...page.templateData,
          schemaScreen: stabilized as unknown as Record<string, unknown>,
        },
      };
      set({ pages: frozenPages });
      // Re-read the page after freeze
      return get().updateSchemaBlock(blockId, updates);
    }

    const schemaScreen = page.templateData.schemaScreen as Record<string, unknown>;
    const blocks = schemaScreen.blocks as SchemaBlock[];
    if (!Array.isArray(blocks)) return;

    const blockIdx = blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) return;

    // Push history BEFORE the edit (for undo)
    get()._pushHistory();

    // ═══ DEEP PATCH MERGE via Immer ═══════════════════════════
    // Instead of shallow merge: { ...block, ...updates }
    // We use deepMergeBlock which recursively merges nested objects
    // while preserving unmodified properties at every level.
    const mergedBlock = deepMergeBlock(blocks[blockIdx], updates);
    const newBlocks = [...blocks];
    newBlocks[blockIdx] = mergedBlock;

    // Emit patch event for edit pipeline
    editBus.emit({
      type: 'patch',
      patch: {
        blockId,
        blockType: blocks[blockIdx].type,
        pageIndex: currentPageIndex,
        patch: updates,
        timestamp: Date.now(),
        source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });
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
    if (!page || (page.templateType !== 'custom' && page.locked !== false)) {
      toast.warning('Layout preset hanya untuk halaman Kosong atau template terbuka');
      return;
    }
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
    if (!page || (page.templateType !== 'custom' && page.locked !== false) || page.elements.length === 0) return LAYOUT_PRESETS[0]; // free
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
    set({ _lastNudgeTime: now } as any);
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      elements: page.elements.map(e => {
        if (!idsToNudge.includes(e.id)) return e;
        return { ...e, x: Math.max(0, Math.min(95, e.x + dx)), y: Math.max(0, Math.min(95, e.y + dy)) };
      }),
      overlayElements: (page.overlayElements || []).map(e => {
        if (!idsToNudge.includes(e.id)) return e;
        return { ...e, x: Math.max(0, Math.min(95, e.x + dx)), y: Math.max(0, Math.min(95, e.y + dy)) };
      }),
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
    const page = pages[currentPageIndex];
    if (page.elements.length === 0 && (page.overlayElements || []).length === 0) return;
    get()._pushHistory();
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, elements: [], overlayElements: [] };
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
    const allEls = [...page.elements, ...(page.overlayElements || [])];
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
      overlayElements: (page.overlayElements || []).map(e => ids.includes(e.id) ? updateEl(e) : e),
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
    const allEls = [...page.elements, ...(page.overlayElements || [])];
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
        overlayElements: (page.overlayElements || []).map(e => updates.has(e.id) ? { ...e, x: updates.get(e.id)! } : e),
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
        overlayElements: (page.overlayElements || []).map(e => updates.has(e.id) ? { ...e, y: updates.get(e.id)! } : e),
      };
      set({ pages: newPages });
    }
    toast.success(`Distribusi ${axis === 'horizontal' ? 'horizontal' : 'vertikal'} diterapkan`);
  },

  // ── Schema Block CRUD ───────────────────────────────────────────
  // deleteBlock: Remove a block from the schema screen by ID
  deleteBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    // Must have schema screen
    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    if (!Array.isArray(blocks)) return;

    const blockIdx = blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) return;

    get()._pushHistory();
    editBus.emit({ type: 'patch', patch: { blockId, blockType: blocks[blockIdx].type, pageIndex: currentPageIndex, patch: { _deleted: true }, timestamp: Date.now(), source: 'user' } });

    const newBlocks = blocks.filter((_, i) => i !== blockIdx);
    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    toast.success('Block dihapus');
  },

  // moveBlockUp: Move a block one position up in the flow order
  moveBlockUp: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    if (!Array.isArray(blocks)) return;

    const blockIdx = blocks.findIndex(b => b.id === blockId);
    if (blockIdx <= 0) return; // already at top

    get()._pushHistory();
    const newBlocks = [...blocks];
    [newBlocks[blockIdx - 1], newBlocks[blockIdx]] = [newBlocks[blockIdx], newBlocks[blockIdx - 1]];

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });
  },

  // moveBlockDown: Move a block one position down in the flow order
  moveBlockDown: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    if (!Array.isArray(blocks)) return;

    const blockIdx = blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1 || blockIdx >= blocks.length - 1) return; // already at bottom

    get()._pushHistory();
    const newBlocks = [...blocks];
    [newBlocks[blockIdx], newBlocks[blockIdx + 1]] = [newBlocks[blockIdx + 1], newBlocks[blockIdx]];

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });
  },

  // duplicateBlock: Clone a block and insert it after the original
  duplicateBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    if (!Array.isArray(blocks)) return;

    const blockIdx = blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) return;

    get()._pushHistory();

    // Deep clone the block with a new ID
    const original = blocks[blockIdx];
    const clone = produce(original, (draft) => {
      draft.id = `${original.type}-${Date.now()}`;
    });

    // Insert clone after original
    const newBlocks = [...blocks];
    newBlocks.splice(blockIdx + 1, 0, clone);

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });
    // Select the cloned block
    get().selectBlock(clone.id ?? null, clone.type);
    toast.success('Block diduplikat');
  },

  // ── Add Schema Block from Registry ────────────────────────────
  // Adds a new block of the given type to the current page's schema.
  // If the page doesn't have a schemaScreen yet, it first "freezes" the
  // adapted schema (same as updateSchemaBlock's first-edit flow).
  addSchemaBlock: (blockType) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    // Must have schema screen — freeze if needed
    if (!page.templateData?.schemaScreen) {
      const adapted = convertToSchema(page);
      if (!adapted) {
        toast.warning('Tidak dapat menambah block ke halaman ini');
        return;
      }
      // Assign stable IDs
      const stabilized = produce(adapted, (draft) => {
        draft.blocks.forEach((block, idx) => {
          if (!block.id) {
            block.id = `${block.type}-${idx}`;
          }
        });
      });
      const frozenPages = [...pages];
      frozenPages[currentPageIndex] = {
        ...page,
        templateData: {
          ...page.templateData,
          schemaScreen: stabilized as unknown as Record<string, unknown>,
        },
      };
      set({ pages: frozenPages });
      // Re-read after freeze
      return get().addSchemaBlock(blockType);
    }

    const schemaScreen = page.templateData.schemaScreen as Record<string, unknown>;
    const blocks = schemaScreen.blocks as SchemaBlock[];

    // Get block definition from registry
    const definition = SCENE_REGISTRY[blockType];
    if (!definition) {
      toast.error(`Block type "${blockType}" tidak ditemukan`);
      return;
    }

    get()._pushHistory();

    // Create default block based on type
    const newBlock: Record<string, unknown> = {
      id: `${blockType}-${Date.now()}`,
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

    // Add default content based on block type
    switch (blockType) {
      case 'cover':
        newBlock.icon = '📄';
        newBlock.title = 'Judul Baru';
        newBlock.subtitle = 'Subtitle';
        newBlock.badges = [];
        newBlock.cta = { label: 'Mulai →', action: 'next' };
        break;
      case 'petunjuk':
        newBlock.title = 'Petunjuk';
        newBlock.titleHighlight = 'Penggunaan';
        newBlock.items = [{ icon: '📌', title: 'Item 1', body: 'Deskripsi item' }];
        break;
      case 'tp':
        newBlock.title = 'Tujuan Pembelajaran';
        newBlock.titleHighlight = '';
        newBlock.items = [{ num: 1, verb: 'Memahami', desc: 'Deskripsi tujuan', color: 'y' }];
        break;
      case 'alur':
        newBlock.title = 'Alur Kegiatan';
        newBlock.steps = [{ dot: 'y', durasi: '5 menit', judul: 'Langkah 1', deskripsi: 'Deskripsi langkah' }];
        break;
      case 'skenario':
        newBlock.title = 'Skenario';
        newBlock.chapters = [{ id: 'ch1', charEmoji: '🎭', title: 'Bab 1', choices: [] }];
        break;
      case 'def-box':
        newBlock.content = 'Definisi baru';
        newBlock.borderColor = 'y';
        break;
      case 'nc-grid':
        newBlock.cards = [{ icon: '📋', title: 'Kartu 1', body: 'Deskripsi kartu', color: 'y' }];
        break;
      case 'flashcard-set':
        newBlock.cards = [{ q: 'Pertanyaan?', a: 'Jawaban' }];
        break;
      case 'ftab':
        newBlock.tabs = [{ icon: '📑', label: 'Tab 1', content: [] }];
        break;
      case 'nk-card':
        newBlock.normaType = '';
        newBlock.icon = '📜';
        newBlock.title = 'Kartu Norma';
        newBlock.label = '';
        newBlock.definition = '';
        newBlock.characteristics = [];
        newBlock.sanksi = { title: 'Sanksi', items: [] };
        newBlock.contoh = '';
        break;
      case 'diskusi':
        newBlock.title = 'Diskusi';
        newBlock.questions = [{ label: '1', icon: '💬', teks: 'Pertanyaan diskusi?', petunjuk: 'Petunjuk jawaban' }];
        break;
      case 'kuis':
        newBlock.title = 'Kuis';
        newBlock.questions = [{ q: 'Pertanyaan?', opts: ['A', 'B', 'C'], ans: 0, ex: 'Penjelasan' }];
        break;
      case 'sortir-game':
        newBlock.title = 'Game Sortir';
        newBlock.pool = [];
        newBlock.kolom = [];
        break;
      case 'roda-game':
        newBlock.title = 'Game Roda';
        newBlock.questions = [];
        break;
      case 'hasil':
        newBlock.title = 'Hasil';
        newBlock.subtitle = 'Subtitle hasil';
        break;
      case 'refleksi':
        newBlock.title = 'Refleksi';
        newBlock.questions = [{ teks: 'Pertanyaan refleksi?', petunjuk: 'Petunjuk refleksi' }];
        break;
      case 'penutup':
        newBlock.title = 'Penutup';
        newBlock.subtitle = 'Terima kasih';
        newBlock.preview = [];
        break;
      case 'tabel-accord':
        newBlock.rows = [{ icon: '📊', title: 'Baris 1', color: 'y', details: [] }];
        break;
      default:
        newBlock.title = definition.name;
        break;
    }

    const newBlocks = [...blocks, newBlock as unknown as SchemaBlock];

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

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });

    // Select the new block
    get().selectBlock(newBlock.id as string, blockType);
    toast.success(`${definition.name} ditambahkan`);
  },

  // ── Schema Block Nudge (arrow keys) ────────────────────────────
  nudgeSchemaBlocks: (dxPct, dyPct) => {
    const { pages, currentPageIndex, selectedBlockIds, selectedBlockId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    const idsToNudge = selectedBlockIds.length > 1 ? selectedBlockIds : (selectedBlockId ? [selectedBlockId] : []);
    if (idsToNudge.length === 0) return;

    // Debounce history push (max once per 500ms of continuous nudging)
    const now = Date.now();
    const lastNudge = get()._lastNudgeTime;
    if (!lastNudge || now - lastNudge > 500) {
      get()._pushHistory();
    }
    set({ _lastNudgeTime: now } as any);

    const newBlocks = blocks.map(block => {
      if (!idsToNudge.includes(block.id || '')) return block;

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
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });
  },

  // ── Schema Block Bulk Delete ────────────────────────────────────
  deleteSchemaBlocks: (blockIds) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    get()._pushHistory();

    const newBlocks = blocks.filter(b => !blockIds.includes(b.id || ''));

    const newPages = [...pages];
    newPages[currentPageIndex] = {
      ...page,
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
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

  // ── Schema Block Copy/Paste ───────────────────────────────────
  // Copy a schema block to the internal clipboard (removes ID so a
  // fresh one is assigned on paste). Deep-cloned via Immer `produce`.
  copySchemaBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Deep clone to clipboard
    const clone = produce(block, (draft) => {
      // Remove the ID so it gets a new one on paste
      draft.id = undefined as any;
    });
    set({ _schemaClipboard: clone as SchemaBlock });
    toast.success('Block disalin');
  },

  // Paste a schema block from the internal clipboard. Appends it to
  // the current page's schema screen with a fresh ID.
  pasteSchemaBlock: () => {
    const { pages, currentPageIndex } = get();
    const clipboard = get()._schemaClipboard;
    if (!clipboard) {
      toast.info('Tidak ada block di clipboard');
      return;
    }

    const page = pages[currentPageIndex];
    if (!page) return;

    // Must have schema screen
    if (!page.templateData?.schemaScreen) {
      toast.warning('Tidak dapat menambah block ke halaman ini');
      return;
    }

    const schemaScreen = page.templateData.schemaScreen as Record<string, unknown>;
    const blocks = schemaScreen.blocks as SchemaBlock[];

    get()._pushHistory();

    // Deep clone with new ID
    const newBlock = produce(clipboard, (draft) => {
      draft.id = `${clipboard.type}-${Date.now()}`;
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
      templateData: {
        ...page.templateData,
        schemaScreen: { ...schemaScreen, blocks: newBlocks },
      },
    };
    set({ pages: newPages });
    get().selectBlock(newBlock.id!, clipboard.type);
    toast.success('Block ditempel');
  },
});
