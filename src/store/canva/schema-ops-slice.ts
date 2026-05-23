// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Schema Block Operations (clipboard, nudge, align, batch)
// ═══════════════════════════════════════════════════════════════
// Extracted from ui-slice.ts for maintainability.
// Contains: clipboard (copy/paste), nudge, bulk delete, reorder,
//   schema block alignment/distribution, batch operations.
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import { produce, produceWithPatches } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { SchemaBlock } from '@/core/schema/types';
import { editBus } from '@/core/editor/edit-bus';
import { ensurePageSchema, generateBlockId } from '@/core/schema/ensure-schema';
import { findBlockById } from '@/core/schema/immutable';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '@/core/schema/capability-registry';
import { isCompositeBlock } from '@/core/layout/SchemaTraversal';
import { findBlockOwner, commitSchemaUpdate } from './schema-helpers';
import { removeCompressedHeight } from '@/core/schema/session-state';
import { removeMeasurement } from '@/core/layout/BlockMeasurer';
import { saveCrashCheckpoint } from '@/core/recovery';

export type SchemaOpsSlice = Pick<
  CanvaState,
  | '_schemaClipboard' | 'copySchemaBlock' | 'pasteSchemaBlock'
  | 'nudgeSchemaBlocks' | 'deleteSchemaBlocks' | 'reorderSchemaBlocks'
  | 'alignSchemaBlocks' | 'distributeSchemaBlocks'
  | 'batchSetVariant' | 'batchDuplicateBlocks' | 'batchMoveBlocks' | 'batchToggleCompression'
>;

export const createSchemaOpsSlice: StateCreator<CanvaState, [], [], SchemaOpsSlice> = (set, get) => ({
  _schemaClipboard: null,

  // ── Copy Schema Block ────────────────────────────────────────
  copySchemaBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    const blocks = schema.blocks;

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
      block = blocks[owner.blockIndex]!.children?.[owner.childIndex];
    }
    if (!block) return;

    const clone = produce(block, (draft) => { draft.id = undefined; });
    set({ _schemaClipboard: clone as SchemaBlock });
    toast.success('Block disalin');
  },

  // ── Paste Schema Block ───────────────────────────────────────
  pasteSchemaBlock: () => {
    const { pages, currentPageIndex } = get();
    const clipboard = get()._schemaClipboard;
    if (!clipboard) { toast.info('Tidak ada block di clipboard'); return; }
    const page = pages[currentPageIndex];
    if (!page) return;
    const schema = ensurePageSchema(page);
    if (!schema) { toast.warning('Tidak dapat menambah block ke halaman ini'); return; }
    const blocks = schema.blocks;

    get()._pushHistory();

    const newBlock = produce(clipboard, (draft) => { draft.id = generateBlockId(); });
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      draft.push(newBlock as SchemaBlock);
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id!, blockType: clipboard.type, pageIndex: currentPageIndex,
        patch: { _pasted: true }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
    get().selectBlock(newBlock.id!, clipboard.type);
    toast.success('Block ditempel', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Schema Block Nudge ───────────────────────────────────────
  nudgeSchemaBlocks: (dxPct, dyPct) => {
    const { pages, currentPageIndex, selectedBlockIds, selectedBlockId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    const blocks = schema.blocks;
    const idsToNudge = selectedBlockIds.length > 1 ? selectedBlockIds : (selectedBlockId ? [selectedBlockId] : []);
    if (idsToNudge.length === 0) return;

    const now = Date.now();
    const lastNudge = get()._lastNudgeTime;
    if (!lastNudge || now - lastNudge > 500) { get()._pushHistory(); }
    set({ _lastNudgeTime: now });

    const nudgeBlock = (block: SchemaBlock): SchemaBlock => {
      const layout = block.layout || { position: 'flow' as const };
      if (layout.position !== 'absolute') return block;
      const toNum = (v: number | string | undefined, fallback: number): number =>
        typeof v === 'number' ? v : fallback;
      return { ...block, layout: { ...layout, x: Math.max(0, Math.min(90, toNum(layout.x, 0) + dxPct)), y: Math.max(0, Math.min(90, toNum(layout.y, 0) + dyPct)) } };
    };

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      for (const bid of idsToNudge) {
        const owner = findBlockOwner(blocks as SchemaBlock[], bid);
        if (!owner) continue;
        if (owner.kind === 'top-level') {
          const block = draft[owner.index];
          const nudged = nudgeBlock(block as SchemaBlock);
          if (nudged !== block) Object.assign(draft[owner.index], nudged);
        } else if (owner.kind === 'ftab-tab') {
          const ft = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
          const block = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
          if (block) { const nudged = nudgeBlock(block as SchemaBlock); if (nudged !== block) Object.assign(ft.tabs![owner.tabIndex]!.content![owner.childIndex], nudged); }
        } else if (owner.kind === 'materi-section') {
          const ms = draft[owner.blockIndex] as { content?: SchemaBlock[] };
          const block = ms.content?.[owner.childIndex];
          if (block) { const nudged = nudgeBlock(block as SchemaBlock); if (nudged !== block) Object.assign(ms.content![owner.childIndex], nudged); }
        } else if (owner.kind === 'children') {
          const block = draft[owner.blockIndex]!.children?.[owner.childIndex];
          if (block) { const nudged = nudgeBlock(block as SchemaBlock); if (nudged !== block) Object.assign(draft[owner.blockIndex]!.children![owner.childIndex], nudged); }
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: idsToNudge[0], blockType: 'nudge', pageIndex: currentPageIndex,
        patch: { _nudged: true, dxPct, dyPct, count: idsToNudge.length },
        timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };
    set({ pages: newPages });
  },

  // ── Schema Block Bulk Delete ─────────────────────────────────
  deleteSchemaBlocks: (blockIds) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    const blocks = schema.blocks;

    // ── FASE 6: Crash checkpoint before bulk delete ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'bulk-delete-blocks');

    get()._pushHistory();

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      const topLevelIndices = blockIds.map(id => draft.findIndex(b => b.id === id)).filter(i => i !== -1).sort((a, b) => b - a);
      for (const idx of topLevelIndices) draft.splice(idx, 1);

      for (const blockId of blockIds) {
        for (const block of draft) {
          if (!isCompositeBlock(block)) continue;
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
        blockId: blockIds[0], blockType: 'bulk-delete', pageIndex: currentPageIndex,
        patch: { _bulkDeleted: true, count: blockIds.length }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    for (const deletedId of blockIds) {
      removeCompressedHeight(deletedId);
      removeMeasurement(deletedId);
    }
    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    toast.success(`${blockIds.length} block dihapus`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Reorder Schema Blocks (drag-sort) ────────────────────────
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

    // ── FASE 6: Crash checkpoint before reorder ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'reorder-blocks');

    get()._pushHistory();

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      const [moved] = draft.splice(fromIndex, 1);
      draft.splice(toIndex, 0!, moved);
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlocks[toIndex]?.id || '', blockType: newBlocks[toIndex]?.type || 'unknown',
        pageIndex: currentPageIndex, patch: { _reordered: true, fromIndex, toIndex },
        timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
  },

  // ── Schema Block Alignment ───────────────────────────────────
  alignSchemaBlocks: (direction) => {
    const { pages, currentPageIndex, selectedBlockIds, selectedBlockId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    const blocks = schema.blocks;
    const ids = selectedBlockIds.length >= 2 ? selectedBlockIds : (selectedBlockId ? [selectedBlockId] : []);
    if (ids.length < 2) { toast.info('Pilih minimal 2 block absolute untuk alignment'); return; }

    const absoluteBlocks = ids.map(id => ({ id, block: findBlockById(blocks, id) }))
      .filter(({ block }) => block && block.layout?.position === 'absolute')
      .map(({ id, block }) => ({ id, block: block! }));
    if (absoluteBlocks.length < 2) { toast.info('Alignment hanya untuk block dengan posisi absolute'); return; }

    get()._pushHistory();
    const toNum = (v: number | string | undefined, fallback: number): number => typeof v === 'number' ? v : fallback;

    let alignValue: number;
    switch (direction) {
      case 'left': alignValue = Math.min(...absoluteBlocks.map(b => toNum(b.block.layout!.x, 0))); break;
      case 'centerH': alignValue = absoluteBlocks.reduce((s, b) => s + toNum(b.block.layout!.x, 0) + toNum(b.block.layout!.width, 100) / 2, 0) / absoluteBlocks.length; break;
      case 'right': alignValue = Math.max(...absoluteBlocks.map(b => toNum(b.block.layout!.x, 0) + toNum(b.block.layout!.width, 100))); break;
      case 'top': alignValue = Math.min(...absoluteBlocks.map(b => toNum(b.block.layout!.y, 0))); break;
      case 'centerV': alignValue = absoluteBlocks.reduce((s, b) => s + toNum(b.block.layout!.y, 0) + toNum(b.block.layout!.height, 100) / 2, 0) / absoluteBlocks.length; break;
      case 'bottom': alignValue = Math.max(...absoluteBlocks.map(b => toNum(b.block.layout!.y, 0) + toNum(b.block.layout!.height, 100))); break;
      default: return;
    }

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      for (const { id } of absoluteBlocks) {
        const block = draft.find(b => b.id === id);
        if (!block?.layout || block.layout.position !== 'absolute') continue;
        switch (direction) {
          case 'left': block.layout.x = alignValue; break;
          case 'centerH': block.layout.x = alignValue - toNum(block.layout.width, 100) / 2; break;
          case 'right': block.layout.x = alignValue - toNum(block.layout.width, 100); break;
          case 'top': block.layout.y = alignValue; break;
          case 'centerV': block.layout.y = alignValue - toNum(block.layout.height, 100) / 2; break;
          case 'bottom': block.layout.y = alignValue - toNum(block.layout.height, 100); break;
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: ids[0], blockType: 'align', pageIndex: currentPageIndex,
        patch: { _aligned: true, direction }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
    toast.success(`Block align ${direction} diterapkan`);
  },

  // ── Schema Block Distribution ────────────────────────────────
  distributeSchemaBlocks: (axis) => {
    const { pages, currentPageIndex, selectedBlockIds, selectedBlockId } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    const blocks = schema.blocks;
    const ids = selectedBlockIds.length >= 3 ? selectedBlockIds : (selectedBlockId ? [selectedBlockId] : []);
    if (ids.length < 3) { toast.info('Pilih minimal 3 block absolute untuk distribusi'); return; }

    const absoluteBlocks = ids.map(id => ({ id, block: findBlockById(blocks, id) }))
      .filter(({ block }) => block && block.layout?.position === 'absolute')
      .map(({ id, block }) => ({ id, block: block! }));
    if (absoluteBlocks.length < 3) { toast.info('Distribusi hanya untuk block dengan posisi absolute'); return; }

    get()._pushHistory();
    const toNum = (v: number | string | undefined, fallback: number): number => typeof v === 'number' ? v : fallback;

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      if (axis === 'horizontal') {
        const sorted = [...absoluteBlocks].sort((a, b) => toNum(a.block.layout!.x, 0) - toNum(b.block.layout!.x, 0));
        const min = toNum(sorted[0]!.block.layout!.x, 0);
        const max = toNum(sorted[sorted.length - 1]!.block.layout!.x, 0) + toNum(sorted[sorted.length - 1]!.block.layout!.width, 100);
        const totalW = sorted.reduce((s, b) => s + toNum(b.block.layout!.width, 100), 0);
        const gap = (max - min - totalW) / (sorted.length - 1);
        let current = min;
        for (const { id } of sorted) {
          const block = draft.find(b => b.id === id);
          if (block?.layout) block.layout.x = current;
          current += toNum(sorted.find(s => s.id === id)!.block.layout!.width, 100) + gap;
        }
      } else {
        const sorted = [...absoluteBlocks].sort((a, b) => toNum(a.block.layout!.y, 0) - toNum(b.block.layout!.y, 0));
        const min = toNum(sorted[0]!.block.layout!.y, 0);
        const max = toNum(sorted[sorted.length - 1]!.block.layout!.y, 0) + toNum(sorted[sorted.length - 1]!.block.layout!.height, 100);
        const totalH = sorted.reduce((s, b) => s + toNum(b.block.layout!.height, 100), 0);
        const gap = (max - min - totalH) / (sorted.length - 1);
        let current = min;
        for (const { id } of sorted) {
          const block = draft.find(b => b.id === id);
          if (block?.layout) block.layout.y = current;
          current += toNum(sorted.find(s => s.id === id)!.block.layout!.height, 100) + gap;
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: ids[0], blockType: 'distribute', pageIndex: currentPageIndex,
        patch: { _distributed: true, axis }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
    toast.success(`Block distribusi ${axis === 'horizontal' ? 'horizontal' : 'vertikal'} diterapkan`);
  },

  // ── Batch Set Variant ────────────────────────────────────────
  batchSetVariant: (blockIds, variant) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    get()._pushHistory();

    const newBlocks = schema.blocks.map(block => {
      if (block.id && blockIds.includes(block.id)) return { ...block, variant };
      return block;
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };
    set({ pages: newPages });
    toast.success(`${blockIds.length} block diubah ke Variant ${variant}`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Batch Duplicate Blocks ───────────────────────────────────
  batchDuplicateBlocks: async (blockIds) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;

    // ── FASE 6: Crash checkpoint before batch duplicate ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'batch-duplicate-blocks');

    get()._pushHistory();

    const { generateBlockId } = await import('@/core/schema/ensure-schema');
    const newBlocks = [...schema.blocks];
    const indices = blockIds.map(id => newBlocks.findIndex(b => b.id === id)).filter(i => i !== -1).sort((a, b) => b - a);

    for (const idx of indices) {
      const original = newBlocks[idx];
      const clone = JSON.parse(JSON.stringify(original)) as SchemaBlock;
      clone.id = generateBlockId();
      if ('title' in clone && typeof (clone as Record<string, unknown>).title === 'string') {
        (clone as Record<string, unknown>).title = `${(clone as Record<string, unknown>).title} (salinan)`;
      }
      newBlocks.splice(idx + 1, 0, clone);
    }

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };

    const lastOriginalIdx = indices[indices.length - 1];
    if (lastOriginalIdx !== undefined) {
      const duplicatedBlock = newBlocks[lastOriginalIdx + 1];
      if (duplicatedBlock) {
        set({ pages: newPages, selectedBlockId: duplicatedBlock.id || null, selectedBlockType: duplicatedBlock.type });
      }
    } else {
      set({ pages: newPages });
    }

    toast.success(`${blockIds.length} block diduplikasi`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Batch Move Blocks ────────────────────────────────────────
  batchMoveBlocks: (blockIds, delta) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    get()._pushHistory();

    const blocks = [...schema.blocks];
    const indices = blockIds.map(id => blocks.findIndex(b => b.id === id)).filter(i => i !== -1).sort((a, b) => delta === -1 ? a - b : b - a);

    for (const idx of indices) {
      const newIdx = idx + delta;
      if (newIdx < 0 || newIdx >= blocks.length) continue;
      if (blockIds.includes(blocks[newIdx]!.id || '')) continue;
      const temp = blocks[idx]!; blocks[idx] = blocks[newIdx]!; blocks[newIdx] = temp;
    }

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, blocks) };
    set({ pages: newPages });
    toast.success(`${blockIds.length} block dipindah ke ${delta === -1 ? 'atas' : 'bawah'}`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Batch Toggle Compression ─────────────────────────────────
  batchToggleCompression: (blockIds, priority) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || blockIds.length === 0) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    get()._pushHistory();

    const newBlocks = schema.blocks.map(block => {
      if (block.id && blockIds.includes(block.id)) {
        const existingCompression = block.compression || { strategy: 'none' as const, priority: 'medium' as const };
        return { ...block, compression: { strategy: existingCompression.strategy || 'none' as const, splittable: existingCompression.splittable, minFragmentHeight: existingCompression.minFragmentHeight, priority } };
      }
      return block;
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
    const priorityLabel = priority === 'high' ? 'Tinggi' : priority === 'medium' ? 'Sedang' : 'Rendah';
    toast.success(`${blockIds.length} block: prioritas kompresi = ${priorityLabel}`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },
});
