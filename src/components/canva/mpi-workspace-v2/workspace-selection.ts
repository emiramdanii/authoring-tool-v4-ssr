// ═══════════════════════════════════════════════════════════════
// WORKSPACE SELECTION — Selection bridge for MPI Workspace V2
// ═══════════════════════════════════════════════════════════════
// V3-PHASE-1: Natural selection contract.
//
// Selection flows:
//   1. User clicks block on canvas → PageRenderer reports block click
//      → WorkspaceCanvasStage intercepts → calls selectBlock(blockId)
//      → store.selectedBlockId updated → WorkspaceInspector re-renders
//
//   2. User clicks empty canvas area → deselectBlock()
//      → store.selectedBlockId = null → Inspector shows page settings
//
//   3. User navigates pages → selection cleared (page change resets)
//
// This is NOT a separate store — it uses the existing useCanvaStore
// selectedBlockId/selectedBlockType. This file provides typed helpers
// that make the selection contract explicit.

import { useCanvaStore } from '@/store/canva-store';

export function selectBlock(blockId: string, blockType?: string) {
  useCanvaStore.setState({
    selectedBlockId: blockId,
    selectedBlockType: blockType ?? null,
    selectedBlockIds: blockId ? [blockId] : [],
  });
}

export function deselectBlock() {
  useCanvaStore.setState({
    selectedBlockId: null,
    selectedBlockType: null,
    selectedBlockIds: [],
  });
}

export function getSelectedBlockId(): string | null {
  return useCanvaStore.getState().selectedBlockId;
}

/**
 * Handle a click inside the canvas stage.
 * If the click target has a data-block-id attribute, select that block.
 * If not, deselect (click was on empty canvas).
 *
 * This is the NATURAL selection handler — no store hacks needed.
 * PageRenderer renders blocks with data-block-id attributes.
 */
export function handleCanvasClick(e: React.MouseEvent): void {
  const target = e.target as HTMLElement;
  const blockEl = target.closest('[data-block-id]') as HTMLElement | null;

  if (blockEl) {
    const blockId = blockEl.getAttribute('data-block-id');
    const blockType = blockEl.getAttribute('data-block-type');
    if (blockId) {
      selectBlock(blockId, blockType ?? undefined);
    }
  } else {
    // Click was on empty canvas (not inside any block)
    deselectBlock();
  }
}
