// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Page Operations (cross-page, containers, scene transactions)
// ═══════════════════════════════════════════════════════════════
// Extracted from ui-slice.ts for maintainability.
// Contains: cross-page move, split/merge, nested container move,
//   scene transaction actions (rebalance, promote split, merge).
// ═══════════════════════════════════════════════════════════════

import { toast } from 'sonner';
import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import { editBus } from '@/core/editor/edit-bus';
import { ensurePageSchema, generateBlockId, generatePageId } from '@/core/schema/ensure-schema';
import { splitScene, mergeScene, findBlockById, moveBlockNested, type ContainerRef } from '@/core/schema/immutable';
import { createTransaction } from '@/core/schema/scene-transaction';
import { rebalanceFromScenePlan, promoteSceneSplitToPage, mergePagesTransaction } from '@/core/schema/schema-apply';
import { computeScenePlan } from '@/core/layout/SceneOverflowEngine';
import { getSceneResolution, computeSafeArea, DEFAULT_SAFE_AREA } from '@/core/scene/SceneLayoutEngine';
import { findBlockOwner, commitSchemaUpdate } from './schema-helpers';
import { assertValidSchema } from '@/core/schema/validation';
import { assertDocumentPurity } from '@/core/schema/session-state';
import { saveCrashCheckpoint, transactionRollback } from '@/core/recovery';

export type PageOpsSlice = Pick<
  CanvaState,
  | 'moveBlockToPage' | 'splitPageAtBlock' | 'mergeWithNextPage'
  | 'moveBlockToContainer'
  | 'rebalanceCurrentPage' | 'promoteSceneSplit' | 'mergeWithAdjacentPage'
>;

export const createPageOpsSlice: StateCreator<CanvaState, [], [], PageOpsSlice> = (set, get) => ({

  // ── Move Block to Another Page ───────────────────────────────
  moveBlockToPage: (blockId, targetPageIndex) => {
    const { pages, currentPageIndex } = get();
    if (targetPageIndex === currentPageIndex) return;
    if (targetPageIndex < 0 || targetPageIndex >= pages.length) return;
    const sourcePage = pages[currentPageIndex];
    const targetPage = pages[targetPageIndex];
    if (!sourcePage || !targetPage) return;

    const sourceSchema = ensurePageSchema(sourcePage);
    const targetSchema = ensurePageSchema(targetPage);
    if (!sourceSchema || !targetSchema) { toast.warning('Tidak dapat memindahkan block ke halaman ini'); return; }

    const blockIdx = sourceSchema.blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) {
      const owner = findBlockOwner(sourceSchema.blocks, blockId);
      if (owner && owner.kind !== 'top-level') { toast.warning('Block bersarang tidak dapat dipindahkan ke halaman lain'); }
      return;
    }

    // ── FASE 6: Crash checkpoint before cross-page move ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'move-block-to-page');

    get()._pushHistory();

    const movedBlock = sourceSchema.blocks[blockIdx];
    const blockName = ((movedBlock as unknown) as Record<string, unknown>).title as string || movedBlock.type || 'Block';
    const newSourceBlocks = sourceSchema.blocks.filter((_, i) => i !== blockIdx);
    const newTargetBlock = produce(movedBlock, (draft) => { draft.id = generateBlockId(); });
    const newTargetBlocks = [...targetSchema.blocks, newTargetBlock];

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...sourcePage, schema: commitSchemaUpdate(sourceSchema, newSourceBlocks) };
    newPages[targetPageIndex] = { ...targetPage, schema: commitSchemaUpdate(targetSchema, newTargetBlocks) };

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: newTargetBlock.id ?? blockId, blockType: movedBlock.type,
        pageIndex: targetPageIndex, patch: { _movedToPage: targetPageIndex },
        timestamp: Date.now(), source: 'user',
      },
    });

    set({ pages: newPages, currentPageIndex: targetPageIndex, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });
    const targetLabel = targetPage.label || `Halaman ${targetPageIndex + 1}`;
    toast.success(`"${blockName}" dipindahkan ke ${targetLabel}`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Split Page at Block ──────────────────────────────────────
  splitPageAtBlock: (blockId) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;

    const blockIndex = schema.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1 || blockIndex === schema.blocks.length - 1) {
      toast.info('Tidak bisa split — block terakhir atau tidak ditemukan'); return;
    }

    get()._pushHistory();

       // ── FASE 6: Crash checkpoint before split ────────────────
    saveCrashCheckpoint(pages, get().ratioId, 'split-page');
    const txId = transactionRollback.checkpoint(pages, get().ratioId, 'split-page');

    const tx = createTransaction(schema);
    tx.splitAt(blockId);
    const result = tx.commit();

    if (!result.success || !result.schema) {
      toast.error('Split gagal: ' + (result.error || 'Kesalahan tidak diketahui')); return;
    }

    const splitResult = splitScene(schema, blockId);
    if (!splitResult) { toast.error('Split gagal: tidak bisa membagi scene'); return; }
    const [, secondSchema] = splitResult;

    try {
      assertValidSchema(secondSchema, 'splitPageAtBlock (second half)');
      assertDocumentPurity(secondSchema, 'splitPageAtBlock (second half)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Split gagal (validasi halaman baru): ' + msg); return;
    }

    const newPageId = generatePageId();
    const currentPageLabel = page.label || `Halaman ${currentPageIndex + 1}`;
    const newPage: typeof page = {
      ...page, id: newPageId, label: `${currentPageLabel} (lanjutan)`,
      schema: secondSchema, elements: [], templateData: {},
    };

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, result.schema.blocks) };
    newPages.splice(currentPageIndex + 1, 0, newPage);

    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId, blockType: 'split', pageIndex: currentPageIndex,
        patch: { _splitAt: blockId, newPageId }, timestamp: Date.now(), source: 'user',
      },
    });

    toast.success('Halaman berhasil di-split', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
    // FASE 6: Commit transaction checkpoint — split succeeded
    transactionRollback.commit(txId);
  },

  // ── Merge with Next Page ─────────────────────────────────────
  mergeWithNextPage: () => {
    const { pages, currentPageIndex } = get();
    if (currentPageIndex >= pages.length - 1) {
      toast.info('Tidak ada halaman berikutnya untuk di-merge'); return;
    }
    const sourcePage = pages[currentPageIndex];
    const targetPage = pages[currentPageIndex + 1];
    const sourceSchema = ensurePageSchema(sourcePage);
    const targetSchema = ensurePageSchema(targetPage);
    if (!sourceSchema || !targetSchema) { toast.warning('Tidak bisa merge — salah satu halaman tidak memiliki schema'); return; }

    get()._pushHistory();

       // ── FASE 6: Crash checkpoint before merge ────────────────
    saveCrashCheckpoint(pages, get().ratioId, 'merge-page');
    const txId = transactionRollback.checkpoint(pages, get().ratioId, 'merge-page');

    const tx = createTransaction(sourceSchema);
    tx.custom('merge', (schema) => mergeScene(schema, targetSchema));
    const result = tx.commit();

    if (!result.success || !result.schema) {
      toast.error('Merge gagal: ' + (result.error || 'Kesalahan tidak diketahui')); return;
    }

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...sourcePage, schema: commitSchemaUpdate(sourceSchema, result.schema.blocks) };
    newPages.splice(currentPageIndex + 1, 1);
    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId: 'merge', blockType: 'merge', pageIndex: currentPageIndex,
        patch: { _mergedWith: currentPageIndex + 1 }, timestamp: Date.now(), source: 'user',
      },
    });

    // FASE 6: Commit transaction checkpoint — merge succeeded
    transactionRollback.commit(txId);

    toast.success('Halaman berhasil digabung', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Move Block to Container ──────────────────────────────────
  moveBlockToContainer: (blockId, targetContainer, toIndex) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page || !blockId) return;
    const schema = ensurePageSchema(page);
    if (!schema) return;
    const blocks = schema.blocks;
    if (!Array.isArray(blocks)) return;

    const block = findBlockById(blocks, blockId);
    if (!block) return;

    // ── FASE 6: Crash checkpoint before container move ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'move-block-to-container');

    get()._pushHistory();

    const newBlocks = moveBlockNested(blocks, { blockId, targetContainer, toIndex });

    editBus.emit({
      type: 'patch',
      patch: {
        blockId, blockType: block.type, pageIndex: currentPageIndex,
        patch: { _movedToContainer: targetContainer }, timestamp: Date.now(), source: 'user',
      },
    });

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };
    set({ pages: newPages });
    toast.success(`Block dipindah ke ${targetContainer.type === 'root' ? 'root' : targetContainer.type}`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Rebalance Current Page ───────────────────────────────────
  rebalanceCurrentPage: () => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) { toast.info('Halaman ini tidak memiliki schema'); return; }

    get()._pushHistory();

    // ── FASE 6: Crash checkpoint before rebalance ────────────
    saveCrashCheckpoint(get().pages, get().ratioId, 'rebalance');

    const result = rebalanceFromScenePlan(page.id, { isCompact: true, compressionFirst: true });
    if (!result.success) { toast.error('Rebalance gagal: ' + (result.error || 'Kesalahan tidak diketahui')); return; }
    if (!result.pageUpdated) {
      if (result.scenePlan?.isSingleScene) { toast.info('Konten sudah pas — tidak perlu rebalance'); }
      return;
    }

    toast.success('Layout halaman dioptimalkan', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Promote Scene Split ──────────────────────────────────────
  promoteSceneSplit: (sceneIndex = 1) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) { toast.info('Halaman ini tidak memiliki schema'); return; }

    const sceneRes = getSceneResolution('16:9');
    const hasCoverBlock = page.schema.blocks.length === 1 &&
      page.schema.blocks.some(b => b.type === 'cover' || b.type === 'hero');
    const safeArea = hasCoverBlock ? DEFAULT_SAFE_AREA
      : computeSafeArea({ showTopNav: false, showBottomNav: false, isCompact: true, pagePadding: 16 });

    const scenePlan = computeScenePlan(page.schema, sceneRes, safeArea, { isCompact: true });
    if (scenePlan.isSingleScene) { toast.info('Konten sudah pas dalam satu scene — tidak perlu split'); return; }
    if (sceneIndex < 1 || sceneIndex >= scenePlan.totalScenes) {
      toast.error(`Scene index ${sceneIndex} tidak valid (total: ${scenePlan.totalScenes} scenes)`); return;
    }

    get()._pushHistory();

    // ── FASE 6: Crash checkpoint before promote scene split ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'promote-scene-split');

    const result = promoteSceneSplitToPage(page.id, scenePlan, sceneIndex);
    if (!result.success) { toast.error('Split gagal: ' + (result.error || 'Kesalahan tidak diketahui')); return; }

    toast.success('Scene dipisah menjadi halaman baru', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },

  // ── Merge with Adjacent Page ─────────────────────────────────
  mergeWithAdjacentPage: (direction: 'next' | 'prev' = 'next') => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) { toast.info('Halaman ini tidak memiliki schema'); return; }

    const adjacentIndex = direction === 'next' ? currentPageIndex + 1 : currentPageIndex - 1;
    if (adjacentIndex < 0 || adjacentIndex >= pages.length) {
      toast.info(direction === 'next' ? 'Tidak ada halaman setelah ini' : 'Tidak ada halaman sebelum ini'); return;
    }
    const adjacentPage = pages[adjacentIndex];
    if (!adjacentPage?.schema) { toast.info('Halaman sebelah tidak memiliki schema'); return; }

    get()._pushHistory();

    // ── FASE 6: Crash checkpoint before adjacent merge ───────
    saveCrashCheckpoint(get().pages, get().ratioId, 'merge-adjacent');

    const targetId = direction === 'next' ? page.id : adjacentPage.id;
    const sourceId = direction === 'next' ? adjacentPage.id : page.id;
    const result = mergePagesTransaction(targetId, sourceId);

    if (!result.success) { toast.error('Merge gagal: ' + (result.error || 'Kesalahan tidak diketahui')); return; }

    toast.success('Halaman berhasil digabung', {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },
});
