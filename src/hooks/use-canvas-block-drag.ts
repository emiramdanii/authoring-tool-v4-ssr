'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════
// CANVAS BLOCK DRAG REORDER — Hook for drag-to-reorder on canvas
// ═══════════════════════════════════════════════════════════════════
// Manages the drag state for reordering top-level schema blocks
// directly on the canvas via a drag grip handle on the selection overlay.
//
// Key behaviors:
//   - Pointer capture for reliable cross-element tracking
//   - Drop target computed from cursor Y vs block midpoints
//   - Auto-scroll when dragging near scene edges
//   - Drop indicator line between blocks
//   - Ghost badge follows cursor during drag
//   - Only top-level flow blocks are reorderable

export interface CanvasDragState {
  /** Index of the block being dragged (in schema.blocks) */
  dragIndex: number | null;
  /** Index where the block would be dropped (null = no valid target) */
  dropIndex: number | null;
  /** Whether a drag operation is active */
  isDragging: boolean;
  /** Current cursor Y relative to scene (for ghost positioning) */
  cursorY: number | null;
  /** Current cursor X relative to scene (for ghost positioning) */
  cursorX: number | null;
}

export interface CanvasDragHandlers {
  /** Call when the drag grip handle receives pointerdown */
  onDragStart: (e: React.PointerEvent, blockIndex: number) => void;
  /** Whether a specific block index is being dragged */
  isBlockDragged: (index: number) => boolean;
  /** Get the drop indicator position (after which block index) */
  getDropAfterIndex: () => number | null;
  /** Register a scene container ref for coordinate calculations */
  setSceneRef: (el: HTMLElement | null) => void;
  /** Register a block element ref for position tracking */
  registerBlockRef: (index: number, el: HTMLElement | null) => void;
}

// ── Hook ───────────────────────────────────────────────────────
export function useCanvasBlockDrag(
  onReorder: (fromIndex: number, toIndex: number) => void,
  blockCount: number,
) {
  const [dragState, setDragState] = useState<CanvasDragState>({
    dragIndex: null,
    dropIndex: null,
    isDragging: false,
    cursorY: null,
    cursorX: null,
  });

  const dragIndexRef = useRef<number | null>(null);
  const sceneRef = useRef<HTMLElement | null>(null);
  const blockRefs = useRef<Map<number, HTMLElement>>(new Map());
  const autoScrollRaf = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoScrollRaf.current) {
        cancelAnimationFrame(autoScrollRaf.current);
      }
    };
  }, []);

  const setSceneRef = useCallback((el: HTMLElement | null) => {
    sceneRef.current = el;
  }, []);

  const registerBlockRef = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      blockRefs.current.set(index, el);
    } else {
      blockRefs.current.delete(index);
    }
  }, []);

  // Calculate drop index based on cursor Y position relative to blocks
  const computeDropIndex = useCallback((clientY: number): number | null => {
    const dragIdx = dragIndexRef.current;
    if (dragIdx === null) return null;

    const scene = sceneRef.current;
    if (!scene) return null;

    const sceneRect = scene.getBoundingClientRect();

    // Convert clientY to scene-relative Y
    const relativeY = clientY - sceneRect.top;

    // Collect block midpoints (only top-level flow blocks)
    const midpoints: Array<{ index: number; midY: number; top: number; bottom: number }> = [];

    blockRefs.current.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const blockRelTop = rect.top - sceneRect.top;
      const blockRelBottom = rect.bottom - sceneRect.top;
      const midY = blockRelTop + rect.height / 2;
      midpoints.push({ index: idx, midY, top: blockRelTop, bottom: blockRelBottom });
    });

    // Sort by Y position
    midpoints.sort((a, b) => a.midY - b.midY);

    if (midpoints.length === 0) return null;

    // Determine drop position: find which gap the cursor is in
    // The drop position is "after which index" the block will be placed
    let dropAfterIndex = -1; // Before the first block

    for (let i = 0; i < midpoints.length; i++) {
      if (relativeY >= midpoints[i]!.midY) {
        dropAfterIndex = midpoints[i]!.index;
      } else {
        break;
      }
    }

    // Convert "dropAfterIndex" to actual target index
    // If dropping after index -1, target is 0 (before first)
    // If dropping after index N, target is N+1 (but may need adjustment for the moved item)
    let targetIndex: number;
    if (dropAfterIndex === -1) {
      targetIndex = 0;
    } else {
      targetIndex = dropAfterIndex + 1;
    }

    // Adjust for the dragged item's position
    // When the dragged item is removed, indices shift
    if (dragIdx < targetIndex) {
      targetIndex -= 1;
    }

    // Clamp
    targetIndex = Math.max(0, Math.min(blockCount - 1, targetIndex));

    // Don't show indicator if target is same as source
    if (targetIndex === dragIdx) return dragIdx;

    return targetIndex;
  }, [blockCount]);

  // Auto-scroll when dragging near edges of the scene
  const startAutoScroll = useCallback((clientY: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const sceneRect = scene.getBoundingClientRect();
    const edgeZone = 40; // px from edge to trigger scroll

    const scrollSpeed = () => {
      const distFromTop = clientY - sceneRect.top;
      const distFromBottom = sceneRect.bottom - clientY;

      if (distFromTop < edgeZone && distFromTop >= 0) {
        return -Math.max(1, (edgeZone - distFromTop) / 4);
      }
      if (distFromBottom < edgeZone && distFromBottom >= 0) {
        return Math.max(1, (edgeZone - distFromBottom) / 4);
      }
      return 0;
    };

    const doScroll = () => {
      const speed = scrollSpeed();
      if (speed !== 0 && scene.scrollTop !== undefined) {
        scene.scrollTop += speed;
      }
      if (dragIndexRef.current !== null) {
        autoScrollRaf.current = requestAnimationFrame(doScroll);
      }
    };

    if (autoScrollRaf.current) {
      cancelAnimationFrame(autoScrollRaf.current);
    }
    autoScrollRaf.current = requestAnimationFrame(doScroll);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRaf.current) {
      cancelAnimationFrame(autoScrollRaf.current);
      autoScrollRaf.current = null;
    }
  }, []);

  // Drag start handler — called from grip handle pointerdown
  const onDragStart = useCallback((e: React.PointerEvent, blockIndex: number) => {
    if (e.button !== 0) return; // left click only
    e.preventDefault();
    e.stopPropagation();

    // Capture pointer on the grip element for reliable tracking
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragIndexRef.current = blockIndex;

    const scene = sceneRef.current;
    let cursorX: number | null = null;
    let cursorY: number | null = null;
    if (scene) {
      const sceneRect = scene.getBoundingClientRect();
      cursorX = e.clientX - sceneRect.left;
      cursorY = e.clientY - sceneRect.top;
    }

    setDragState({
      dragIndex: blockIndex,
      dropIndex: blockIndex,
      isDragging: true,
      cursorY,
      cursorX,
    });

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();

      const dropIdx = computeDropIndex(moveEvent.clientY);

      let newCursorX: number | null = null;
      let newCursorY: number | null = null;
      if (scene) {
        const sceneRect = scene.getBoundingClientRect();
        newCursorX = moveEvent.clientX - sceneRect.left;
        newCursorY = moveEvent.clientY - sceneRect.top;
      }

      setDragState(prev => ({
        ...prev,
        dropIndex: dropIdx,
        cursorY: newCursorY,
        cursorX: newCursorX,
      }));

      // Auto-scroll near edges
      startAutoScroll(moveEvent.clientY);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // Pointer capture may already be released
      }

      const fromIdx = dragIndexRef.current;
      const toIdx = computeDropIndex(upEvent.clientY);

      if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx) {
        onReorder(fromIdx, toIdx);
      }

      dragIndexRef.current = null;
      setDragState({
        dragIndex: null,
        dropIndex: null,
        isDragging: false,
        cursorY: null,
        cursorX: null,
      });

      stopAutoScroll();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [computeDropIndex, onReorder, startAutoScroll, stopAutoScroll]);

  const isBlockDragged = useCallback(
    (index: number) => dragState.isDragging && dragState.dragIndex === index,
    [dragState],
  );

  const getDropAfterIndex = useCallback((): number | null => {
    if (!dragState.isDragging || dragState.dragIndex === null || dragState.dropIndex === null) {
      return null;
    }
    return dragState.dropIndex;
  }, [dragState]);

  return {
    dragState,
    dragHandlers: {
      onDragStart,
      isBlockDragged,
      getDropAfterIndex,
      setSceneRef,
      registerBlockRef,
    } as CanvasDragHandlers,
  };
}
