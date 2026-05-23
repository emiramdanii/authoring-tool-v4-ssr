'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────
export interface DragState {
  /** Index of the item currently being dragged */
  dragIndex: number | null;
  /** Index where the dragged item would be dropped */
  overIndex: number | null;
  /** Whether a drag operation is active */
  isDragging: boolean;
}

export interface DragHandlers {
  /** Attaches to the drag handle's onPointerDown */
  onPointerDown: (e: React.PointerEvent, index: number) => void;
  /** The index this item should be highlighted as (drop target) */
  getIsOver: (index: number) => boolean;
  /** The index this item should be dimmed (being dragged) */
  getIsDragged: (index: number) => boolean;
}

// ── Hook ───────────────────────────────────────────────────────
export function useDragSort<T>(
  items: T[],
  onReorder: (newItems: T[]) => void,
) {
  const [dragState, setDragState] = useState<DragState>({
    dragIndex: null,
    overIndex: null,
    isDragging: false,
  });

  const dragIndexRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const itemElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Cleanup pointer capture on unmount
  useEffect(() => {
    return () => {
      if (dragIndexRef.current !== null) {
        setDragState({ dragIndex: null, overIndex: null, isDragging: false });
      }
    };
  }, []);

  const getOverIndex = useCallback(
    (clientY: number): number | null => {
      const dragIdx = dragIndexRef.current;
      if (dragIdx === null) return null;

      const elements = itemElementsRef.current;
      let closestIndex: number | null = null;
      let closestDist = Infinity;

      elements.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - midY);
        if (dist < closestDist && dist < rect.height) {
          closestDist = dist;
          closestIndex = idx;
        }
      });

      return closestIndex;
    },
    [],
  );

  const performReorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from === null || to === null) return;
      const newItems = [...items];
      const [moved] = newItems.splice(from, 1);
      newItems.splice(to, 0!, moved);
      onReorder(newItems);
    },
    [items, onReorder],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      if (e.button !== 0) return; // left click only

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragIndexRef.current = index;
      setDragState({ dragIndex: index, overIndex: index, isDragging: true });

      const handlePointerMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        const over = getOverIndex(moveEvent.clientY);
        if (over !== null) {
          setDragState((prev) => ({ ...prev, overIndex: over }));
        }
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        upEvent.preventDefault();
        (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);

        const fromIdx = dragIndexRef.current;
        const toIdx = getOverIndex(upEvent.clientY);

        if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx) {
          performReorder(fromIdx, toIdx);
        }

        dragIndexRef.current = null;
        setDragState({ dragIndex: null, overIndex: null, isDragging: false });

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [getOverIndex, performReorder],
  );

  const registerItem = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      itemElementsRef.current.set(index, el);
    } else {
      itemElementsRef.current.delete(index);
    }
  }, []);

  const getIsOver = useCallback(
    (index: number) => dragState.isDragging && dragState.overIndex === index && dragState.dragIndex !== index,
    [dragState],
  );

  const getIsDragged = useCallback(
    (index: number) => dragState.isDragging && dragState.dragIndex === index,
    [dragState],
  );

  return {
    dragState,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      getIsOver,
      getIsDragged,
    },
    registerItem,
  } as const;
}
