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
import { computePerBlockGaps } from '@/core/vcs/TransitionRhythmEngine';
import { findBlockOwner, commitSchemaUpdate } from './schema-helpers';
import { assertValidSchema } from '@/core/schema/validation';
import { assertDocumentPurity } from '@/core/schema/session-state';
import { saveCrashCheckpoint, transactionRollback } from '@/core/recovery';
import { isFullPageBlockType } from '@/core/schema/capability-registry';

export type PageOpsSlice = Pick<
  CanvaState,
  | 'moveBlockToPage' | 'splitPageAtBlock' | 'mergeWithNextPage' | '_performMergeUnchecked'
  | 'moveBlockToContainer'
  | 'rebalanceCurrentPage' | 'promoteSceneSplit' | 'mergeWithAdjacentPage'
  | 'splitMateriContent'
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
    const blockName = ((movedBlock as unknown) as Record<string, unknown>).title as string || movedBlock!.type || 'Block';
    const newSourceBlocks = sourceSchema.blocks.filter((_, i) => i !== blockIdx);
    const newTargetBlock = produce(movedBlock, (draft) => { draft!.id = generateBlockId(); });
    const newTargetBlocks = [...targetSchema.blocks, newTargetBlock];

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...sourcePage, schema: commitSchemaUpdate(sourceSchema, newSourceBlocks) };
    newPages[targetPageIndex] = { ...targetPage, schema: commitSchemaUpdate(targetSchema, newTargetBlocks) };

    // [UNDO-03] Emit as 'cross-page' event — no _immerPatches, snapshot undo handles this
    editBus.emit({
      type: 'cross-page',
      operation: 'moveBlockToPage',
      pageIndex: targetPageIndex,
      blockId: newTargetBlock!.id ?? blockId,
      blockType: movedBlock!.type,
      details: { _movedToPage: targetPageIndex },
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

    // [UNDO-03] Emit as 'cross-page' event — no _immerPatches, snapshot undo handles this
    editBus.emit({
      type: 'cross-page',
      operation: 'splitPageAtBlock',
      pageIndex: currentPageIndex,
      blockId,
      blockType: 'split',
      details: { _splitAt: blockId, newPageId },
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
    const sourceSchema = ensurePageSchema!(sourcePage);
    const targetSchema = ensurePageSchema!(targetPage);
    if (!sourceSchema || !targetSchema) { toast.warning('Tidak bisa merge — salah satu halaman tidak memiliki schema'); return; }

    // ── Phase 4: Pre-merge overflow check ──
    // Before merging, compute what the merged schema would look like
    // and check if it would overflow. If yes, warn the user with options.
    const mergedBlocks = [...sourceSchema.blocks, ...targetSchema.blocks];
    const mergedSchemaPreview: import('@/core/schema/types').ScreenSchema = {
      ...sourceSchema,
      blocks: mergedBlocks,
    };
    const sceneRes = getSceneResolution('16:9');
    const hasFullPageBlock = mergedBlocks.length === 1 &&
      isFullPageBlockType(mergedBlocks[0]!.type);
    const safeArea = hasFullPageBlock
      ? DEFAULT_SAFE_AREA
      : computeSafeArea({ showTopNav: false, showBottomNav: false, isCompact: true, pagePadding: 16 });
    const scenePlan = computeScenePlan(mergedSchemaPreview, sceneRes, safeArea, { isCompact: true });

    if (!scenePlan.isSingleScene) {
      // ── Overflow detected after merge ──
      // Lazy load contract to avoid circular dependency
      const { getContractOrGolden } = require('@/core/template/contract/TemplateThemeContract');
      const contract = getContractOrGolden(undefined);
      const pageLayout = sourcePage.templateType
        ? contract.pageLayouts[sourcePage.templateType]
        : undefined;
      const canSplit = pageLayout?.canSplit ?? true;
      const overflowBlockCount = scenePlan.scenes
        .slice(1)
        .reduce((acc, s) => acc + s.blockIds.length, 0);

      // Warn with options
      toast.warning(
        `Merge akan menyebabkan overflow (${scenePlan.totalScenes} halaman, ${overflowBlockCount} blok overflow).`,
        {
          duration: 8000,
          action: canSplit
            ? {
                label: 'Merge + Split',
                onClick: () => {
                  // Perform merge first, then auto-split
                  get()._performMergeUnchecked(currentPageIndex);
                  // After merge, promote scene split
                  get().promoteSceneSplit(1);
                },
              }
            : {
                label: 'Merge Saja',
                onClick: () => {
                  get()._performMergeUnchecked(currentPageIndex);
                },
              },
        }
      );
      return; // Don't auto-merge — wait for user decision
    }

    // No overflow — safe to merge
    get()._performMergeUnchecked(currentPageIndex);
  },

  // ── Internal: Perform merge without overflow check ────────────
  // Used by mergeWithNextPage after overflow guard passes,
  // or when user explicitly confirms merge despite overflow.
  _performMergeUnchecked: (pageIndex: number) => {
    const { pages } = get();
    const sourcePage = pages[pageIndex];
    const targetPage = pages[pageIndex + 1];
    if (!sourcePage || !targetPage) return;
    const sourceSchema = ensurePageSchema!(sourcePage);
    const targetSchema = ensurePageSchema!(targetPage);
    if (!sourceSchema || !targetSchema) return;

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
    newPages[pageIndex] = { ...sourcePage, schema: commitSchemaUpdate(sourceSchema, result.schema.blocks) };
    newPages.splice(pageIndex + 1, 1);
    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    // [UNDO-03] Emit as 'cross-page' event — no _immerPatches, snapshot undo handles this
    editBus.emit({
      type: 'cross-page',
      operation: 'mergeWithNextPage',
      pageIndex,
      blockId: 'merge',
      blockType: 'merge',
      details: { _mergedWith: pageIndex + 1 },
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

    // [UNDO-04] Emit as 'snapshot-op' event — no _immerPatches, snapshot undo handles this
    editBus.emit({
      type: 'snapshot-op',
      operation: 'moveBlockToContainer',
      pageIndex: currentPageIndex,
      blockId,
      blockType: block.type,
      details: { _movedToContainer: targetContainer },
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

    // FASE 11A.4 — Include VCS rhythm-based per-block gaps
    const vcsPerBlockGaps = computePerBlockGaps(page.schema.blocks, page.schema.templateType, page.schema.sectionType);
    const scenePlan = computeScenePlan(page.schema, sceneRes, safeArea, { isCompact: true, perBlockGaps: vcsPerBlockGaps });
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

  // ── Split Materi Content ──────────────────────────────────────
  // Splits a materi-section's content at a given index, creating a
  // new page with the overflow blocks. Current page keeps content[0..splitAfterIndex],
  // new page gets content[splitAfterIndex+1..end].
  splitMateriContent: (blockId: string, splitAfterIndex: number) => {
    const { pages, currentPageIndex } = get();
    const page = pages[currentPageIndex];
    if (!page?.schema) { toast.info('Halaman ini tidak memiliki schema'); return; }
    const schema = ensurePageSchema(page);
    if (!schema) return;

    // Find the materi-section block
    const blockIdx = schema.blocks.findIndex(b => b.id === blockId);
    if (blockIdx === -1) {
      toast.error('Block materi-section tidak ditemukan'); return;
    }
    const materiBlock = schema.blocks[blockIdx] as import('@/core/schema/types').MateriSectionBlock;
    if (materiBlock.type !== 'materi-section') {
      toast.error('Block bukan materi-section'); return;
    }

    // Determine which content array to split (tabs vs flat)
    const hasTabs = !!(materiBlock.tabs && materiBlock.tabs.length > 0);
    const activeTabIndex = 0; // Default to first tab for split
    let contentToSplit: import('@/core/schema/types').SchemaBlock[];
    let tabsToSplit: import('@/core/schema/types').MateriContentTab[] | undefined;

    if (hasTabs && materiBlock.tabs) {
      // Split the first tab's content (most common case)
      tabsToSplit = materiBlock.tabs.map((tab, i) => ({
        ...tab,
        content: i === activeTabIndex
          ? tab.content.slice(splitAfterIndex + 1)
          : [],
      }));
      contentToSplit = materiBlock.tabs[activeTabIndex]?.content ?? [];
    } else {
      contentToSplit = materiBlock.content || [];
    }

    if (splitAfterIndex < 0 || splitAfterIndex >= contentToSplit.length - 1) {
      toast.info('Tidak bisa split — tidak cukup blok untuk dibagi'); return;
    }

    get()._pushHistory();

    // ── FASE 6: Crash checkpoint before materi split ──
    saveCrashCheckpoint(get().pages, get().ratioId, 'split-materi');

    const keepContent = contentToSplit.slice(0, splitAfterIndex + 1);
    const overflowContent = contentToSplit.slice(splitAfterIndex + 1);

    if (overflowContent.length === 0) {
      toast.info('Tidak ada blok overflow untuk dipindahkan'); return;
    }

    // Update current materi-section: keep only the first half
    const updatedMateriBlock = {
      ...materiBlock,
      content: hasTabs ? materiBlock.content : keepContent,
      ...(hasTabs && materiBlock.tabs ? {
        tabs: materiBlock.tabs.map((tab, i) => ({
          ...tab,
          content: i === activeTabIndex ? keepContent : tab.content,
        })),
      } : {}),
      takeaways: undefined, // Remove takeaways from current (moved to next page)
      selfCheck: undefined,  // Remove selfCheck from current (moved to next page)
    };

    // Create new materi-section for the next page with overflow content
    const newMateriBlockId = generateBlockId();
    const newMateriBlock: import('@/core/schema/types').MateriSectionBlock = {
      ...materiBlock,
      id: newMateriBlockId,
      title: `${materiBlock.title} (lanjutan)`,
      content: hasTabs ? overflowContent : overflowContent,
      ...(hasTabs && tabsToSplit ? { tabs: tabsToSplit } : {}),
      takeaways: materiBlock.takeaways, // Move takeaways to continuation
      selfCheck: materiBlock.selfCheck,   // Move selfCheck to continuation
    };

    // Update current page schema
    const newBlocks = [...schema.blocks];
    newBlocks[blockIdx] = updatedMateriBlock;

    // Create new page with the overflow materi-section
    const newPageId = generatePageId();
    const currentPageLabel = page.label || `Halaman ${currentPageIndex + 1}`;
    const newPageSchema: import('@/core/schema/types').ScreenSchema = {
      id: newPageId,
      version: 1,
      templateType: page.schema?.templateType || 'custom',
      blocks: [newMateriBlock],
    };

    const newPage: typeof page = {
      ...page,
      id: newPageId,
      label: `${currentPageLabel} (lanjutan)`,
      schema: newPageSchema,
      elements: [],
      templateData: {},
    };

    const newPages = [...pages];
    newPages[currentPageIndex] = { ...page, schema: commitSchemaUpdate(schema, newBlocks) };
    newPages.splice(currentPageIndex + 1, 0, newPage);

    set({ pages: newPages, selectedBlockId: null, selectedBlockType: null, editingBlockId: null, selectedBlockIds: [] });

    editBus.emit({
      type: 'cross-page',
      operation: 'splitMateriContent',
      pageIndex: currentPageIndex,
      blockId,
      blockType: 'materi-section',
      details: { _splitAfterIndex: splitAfterIndex, newPageId, overflowCount: overflowContent.length },
    });

    toast.success(`${overflowContent.length} blok dipindahkan ke halaman baru`, {
      action: { label: 'Undo', onClick: () => { get().undo(); } },
      duration: 4000,
    });
  },
});
