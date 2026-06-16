// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Schema Block CRUD + Deep Editing
// ═══════════════════════════════════════════════════════════════
// Extracted from ui-slice.ts for maintainability.
// Contains: block editing (deep patch merge), block CRUD
//   (delete, move, duplicate, add), and nested container add.
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import { produceWithPatches } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState, UpdateSchemaBlockOptions } from './types';
import type { SchemaBlock, ScreenSchema } from '@/core/schema/types';
import { deepMergeBlock, mergeBlockInArray } from '@/core/editor/deep-merge';
import { editBus } from '@/core/editor/edit-bus';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry';
import { ensurePageSchema, generateBlockId } from '@/core/schema/ensure-schema';
import { duplicateBlock as duplicateBlockImmutable, findBlockById, insertBlockNested, type ContainerRef } from '@/core/schema/immutable';
import { findBlockOwner, commitSchemaUpdate, type BlockOwner } from './schema-helpers';
import { removeCompressedHeight } from '@/core/schema/session-state';
import { removeMeasurement } from '@/core/layout/BlockMeasurer';
import { saveCrashCheckpoint } from '@/core/recovery';
import { notifyMutation } from '@/lib/save-utils';

export type SchemaCRDSlice = Pick<
  CanvaState,
  | 'updateSchemaBlock'
  | 'deleteBlock' | 'moveBlockUp' | 'moveBlockDown' | 'duplicateBlock'
  | 'addSchemaBlock'
  | 'addSchemaBlockToContainer'
>;

export const createSchemaCRDSlice: StateCreator<CanvaState, [], [], SchemaCRDSlice> = (set, get) => ({

  // ── Schema Block Content Editing (DEEP PATCH MERGE) ──────────
  // Flow: UI editor → updateSchemaBlock(id, patch, options?) → deep merge → page.schema → renderer → rerender
  // D2 Fix: Now supports dirty tracking + optional overflow check to align with applyGuidedSchemaPatch.
  updateSchemaBlock: (blockId, updates, options?: UpdateSchemaBlockOptions) => {
    const { pages, currentPageIndex } = get();
    let page = pages[currentPageIndex];
    if (!page || !blockId) return;

    let schema = ensurePageSchema(page);
    if (!schema) return;

    if (!page.schema && schema) {
      const newPages = [...pages];
      newPages[currentPageIndex] = { ...page, schema };
      set({ pages: newPages });
      page = newPages[currentPageIndex];
    }

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    // D2: Resolve options with defaults
    const overflowPolicy = options?.overflowPolicy ?? 'none';
    const source = options?.source ?? 'user';

    if (!options?.skipHistory) get()._pushHistory();

    let newSchema: ScreenSchema;
    let blockType: string;

    if (owner.kind === 'top-level') {
      const { blocks: newBlocks, patches: forwardPatches, inversePatches } =
        mergeBlockInArray(blocks, owner.index, updates);

      blockType = blocks[owner.index]!.type;

      editBus.emit({
        type: 'patch',
        patch: {
          blockId,
          blockType,
          pageIndex: currentPageIndex,
          patch: updates,
          timestamp: Date.now(),
          source,
          _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
        },
      });

      newSchema = commitSchemaUpdate(schema, newBlocks);
    } else {
      const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
        let target: SchemaBlock | undefined;
        if (owner.kind === 'ftab-tab') {
          const ft = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
          target = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
        } else if (owner.kind === 'materi-section') {
          const ms = draft[owner.blockIndex] as { content?: SchemaBlock[] };
          target = ms.content?.[owner.childIndex];
        } else if (owner.kind === 'children') {
          target = draft[owner.blockIndex]!.children?.[owner.childIndex];
        }
        if (target) {
          Object.assign(target, deepMergeBlock(target, updates));
        }
      });

      if (owner.kind === 'ftab-tab') {
        const ft = blocks[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
        blockType = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex]?.type || 'unknown';
      } else if (owner.kind === 'materi-section') {
        const ms = blocks[owner.blockIndex] as { content?: SchemaBlock[] };
        blockType = ms.content?.[owner.childIndex]?.type || 'unknown';
      } else {
        blockType = blocks[owner.blockIndex]!.children?.[owner.childIndex]?.type || 'unknown';
      }

      editBus.emit({
        type: 'patch',
        patch: {
          blockId,
          blockType,
          pageIndex: currentPageIndex,
          patch: updates,
          timestamp: Date.now(),
          source,
          _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
        },
      });

      newSchema = commitSchemaUpdate(schema, newBlocks as SchemaBlock[]);
    }

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: newSchema };
    set({ pages: newPages });

    // D2: Dirty tracking — mark project as having unsaved changes
    notifyMutation();

    // D2: Optional overflow check — same engine as applyGuidedSchemaPatch
    if (overflowPolicy !== 'none') {
      try {
        const { checkOverflowRich } = require('@/core/schema/guided-patch');
        const check = checkOverflowRich(newSchema, page.templateType);
        if (check.overflowDetected) {
          try {
            const { useOverflowWarningStore } = require('@/store/overflow-warning-store');
            useOverflowWarningStore.getState().setWarning({
              pageId: page.id,
              blockId,
              source,
              details: check,
              timestamp: Date.now(),
            });
          } catch { /* overflow store not available */ }
          if (overflowPolicy === 'warn') {
            console.warn(
              `[updateSchemaBlock] Overflow detected on page "${page.id}" after patching block "${blockId}". ${check.summary}`
            );
          }
        } else {
          // Auto-clear stale overflow status when content fits
          try {
            const { useOverflowWarningStore } = require('@/store/overflow-warning-store');
            const overflowStore = useOverflowWarningStore.getState();
            const currentStatus = overflowStore.pageOverflowStatus[page.id];
            if (currentStatus?.hasOverflow) {
              overflowStore.clearPageOverflowStatus(page.id);
            }
            const currentWarning = overflowStore.lastWarning;
            if (currentWarning?.pageId === page.id) {
              overflowStore.clearWarning();
            }
          } catch { /* overflow store not available */ }
        }
      } catch {
        // checkOverflowRich not available (circular dependency guard) — skip overflow check silently
        // This is acceptable: overflow check is optional, not critical path.
      }
    }
  },

  // ── Delete Block ─────────────────────────────────────────────
  deleteBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;

    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const owner = findBlockOwner(blocks, blockId);
    if (!owner) return;

    // ── FASE 6: Crash checkpoint before destructive delete ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'delete-block');

    get()._pushHistory();

    let deletedBlock: SchemaBlock | undefined;
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
        deletedBlock = draft[owner.blockIndex]!.children?.[owner.childIndex] as SchemaBlock;
        draft[owner.blockIndex]!.children?.splice(owner.childIndex, 1);
      }
    });

    // Safety guard: deletedBlock may be undefined if produceWithPatches didn't execute
    // the matching branch (should never happen, but prevents runtime crash)
    const safeDeletedBlock = deletedBlock ?? { type: 'unknown', id: blockId } as SchemaBlock;
    const blockName = ((safeDeletedBlock as unknown) as Record<string, unknown>).title as string || safeDeletedBlock.type || 'Block';

    editBus.emit({
      type: 'patch',
      patch: {
        blockId, blockType: safeDeletedBlock.type, pageIndex: currentPageIndex,
        patch: { _deleted: true }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    removeCompressedHeight(blockId);
    removeMeasurement(blockId);
    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    notifyMutation();
    toast.success(`Block "${blockName}" dihapus`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Move Block Up ────────────────────────────────────────────
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

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      if (owner.kind === 'top-level') {
        if (owner.index <= 0) return;
        [draft[owner.index - 1]!, draft[owner.index]!] = [draft[owner.index]!, draft[owner.index - 1]];
      } else if (owner.kind === 'ftab-tab') {
        const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
        if (content && owner.childIndex > 0) {
          [content[owner.childIndex - 1]!, content[owner.childIndex]!] = [content[owner.childIndex]!, content[owner.childIndex - 1]];
        }
      } else if (owner.kind === 'materi-section') {
        const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
        if (content && owner.childIndex > 0) {
          [content[owner.childIndex - 1]!, content[owner.childIndex]!] = [content[owner.childIndex]!, content[owner.childIndex - 1]];
        }
      } else if (owner.kind === 'children') {
        const children = draft[owner.blockIndex]!.children;
        if (children && owner.childIndex > 0) {
          [children[owner.childIndex - 1]!, children[owner.childIndex]!] = [children[owner.childIndex]!, children[owner.childIndex - 1]];
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId, blockType: owner.kind === 'top-level' ? blocks[owner.index]!.type : 'unknown',
        pageIndex: currentPageIndex, patch: { _movedUp: true }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
    notifyMutation();
  },

  // ── Move Block Down ──────────────────────────────────────────
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

    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      if (owner.kind === 'top-level') {
        if (owner.index >= blocks.length - 1) return;
        [draft[owner.index]!, draft[owner.index + 1]!] = [draft[owner.index + 1]!, draft[owner.index]];
      } else if (owner.kind === 'ftab-tab') {
        const content = (draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> }).tabs?.[owner.tabIndex]?.content;
        if (content && owner.childIndex < content.length - 1) {
          [content[owner.childIndex]!, content[owner.childIndex + 1]!] = [content[owner.childIndex + 1], content[owner.childIndex]];
        }
      } else if (owner.kind === 'materi-section') {
        const content = (draft[owner.blockIndex] as { content?: SchemaBlock[] }).content;
        if (content && owner.childIndex < content.length - 1) {
          [content[owner.childIndex]!, content[owner.childIndex + 1]!] = [content[owner.childIndex + 1], content[owner.childIndex]];
        }
      } else if (owner.kind === 'children') {
        const children = draft[owner.blockIndex]!.children;
        if (children && owner.childIndex < children.length - 1) {
          [children[owner.childIndex]!, children[owner.childIndex + 1]!] = [children[owner.childIndex + 1], children[owner.childIndex]];
        }
      }
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId, blockType: owner.kind === 'top-level' ? blocks[owner.index]!.type : 'unknown',
        pageIndex: currentPageIndex, patch: { _movedDown: true }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks as SchemaBlock[]) };
    set({ pages: newPages });
    notifyMutation();
  },

  // ── Duplicate Block ──────────────────────────────────────────
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

    const { clonedBlock, newBlocks } = duplicateBlockImmutable(blocks, blockId);
    const originalBlock = findBlockById(blocks, blockId);
    const blockType = originalBlock?.type || 'unknown';

    // [UNDO-04] Emit as 'snapshot-op' event — no _immerPatches, snapshot undo handles this
    editBus.emit({
      type: 'snapshot-op',
      operation: 'duplicateBlock',
      pageIndex: currentPageIndex,
      blockId: clonedBlock.id ?? blockId,
      blockType,
      details: { _duplicated: true },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };
    set({ pages: newPages });
    notifyMutation();
    get().selectBlock(clonedBlock.id ?? null, clonedBlock.type);
    toast.success('Block diduplikat', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Add Schema Block from Registry ───────────────────────────
  addSchemaBlock: (blockType, insertAfterIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;

    let schema = ensurePageSchema(page);
    let needsSchemaInit = false;
    if (!schema) {
      schema = { id: page.id, version: 1, templateType: 'custom', blocks: [] };
      needsSchemaInit = true;
    }

    const blocks = schema.blocks;
    const definition = BLOCK_DEFINITIONS[blockType];
    if (!definition) { toast.error(`Block type "${blockType}" tidak ditemukan`); return; }

    get()._pushHistory();

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
    const defaultContent = definition.createDefault?.() ?? { title: definition.name };
    Object.assign(newBlock, defaultContent);

    const insertAt = insertAfterIndex != null ? insertAfterIndex + 1 : blocks.length;
    const [newBlocks, forwardPatches, inversePatches] = produceWithPatches(blocks, draft => {
      draft.splice(insertAt, 0, newBlock as unknown as SchemaBlock);
    });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newBlock.id as string, blockType, pageIndex: currentPageIndex,
        patch: { _added: true }, timestamp: Date.now(), source: 'user',
        _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex: currentPageIndex },
      },
    });

    const newPages = [...pages];
    const updatedSchema = commitSchemaUpdate(schema, newBlocks as SchemaBlock[]);
    newPages[currentPageIndex] = {
      ...page, schema: updatedSchema, pageMode: 'schema',
      ...(needsSchemaInit ? { elements: [] } : {}),
    };
    set({ pages: newPages });
    notifyMutation();
    get().selectBlock(newBlock.id as string, blockType);
    toast.success(`${definition.name} ditambahkan`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Add Schema Block to Container ────────────────────────────
  addSchemaBlockToContainer: (blockType, container, toIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page) return;
    const schema = ensurePageSchema(page);
    if (!schema) { toast.warning('Tidak dapat menambah block ke halaman ini'); return; }
    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const definition = BLOCK_DEFINITIONS[blockType];
    if (!definition) { toast.error(`Block type "${blockType}" tidak ditemukan`); return; }

    get()._pushHistory();

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
    const defaultContent = definition.createDefault?.() ?? { title: definition.name };
    Object.assign(newBlock, defaultContent);

    const newBlocks = insertBlockNested(blocks, newBlock as unknown as SchemaBlock, container, toIndex);

    // [UNDO-04] Emit as 'snapshot-op' event — no _immerPatches, snapshot undo handles this
    editBus.emit({
      type: 'snapshot-op',
      operation: 'addSchemaBlockToContainer',
      pageIndex: currentPageIndex,
      blockId: newBlock.id as string,
      blockType,
      details: { _addedToContainer: true, container: container.type },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };
    set({ pages: newPages });
    notifyMutation();
    get().selectBlock(newBlock.id as string, blockType);
    toast.success(`${definition.name} ditambahkan ke ${container.type}`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },
});
