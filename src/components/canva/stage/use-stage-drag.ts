'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import type { CanvaPage, ResizeDir } from '../types';

interface DragState {
  type: 'move' | 'resize';
  elId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW?: number;
  origH?: number;
  dir?: ResizeDir;
}

interface UseStageDragParams {
  page: CanvaPage | undefined;
  baseScale: number;
  zoom: number;
  stageW: number;
  stageH: number;
  snapEnabled: boolean;
  snapValue: (v: number) => number;
  updateElement: (elId: string, updates: Partial<CanvaPage['elements'][0]>) => void;
  _pushHistory: () => void;
}

/**
 * Custom hook that manages drag/resize logic for Stage elements.
 * Handles snap line computation, mouse move, and mouse up events.
 */
export function useStageDrag({
  page,
  baseScale,
  zoom,
  stageW,
  stageH,
  snapEnabled,
  snapValue,
  updateElement,
  _pushHistory,
}: UseStageDragParams) {
  // Snap guide lines state
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);

  // Drag & resize state
  const dragState = useRef<DragState | null>(null);

  // Ref for the stage wrapper element — managed by the hook consumer
  const stageWrapRef = useRef<HTMLDivElement>(null);

  // Helper to compute snap lines during drag
  const computeSnapLines = useCallback((elId: string, newX: number, newY: number, newW?: number, newH?: number) => {
    if (!snapEnabled || !page) return [];
    const lines: { x?: number; y?: number }[] = [];
    const el = page.elements.find(e => e.id === elId) || page.overlayElements?.find(e => e.id === elId);
    if (!el) return [];

    const w = newW ?? el.w;
    const h = newH ?? el.h;
    const elCenterX = newX + w / 2;
    const elCenterY = newY + h / 2;
    const elRight = newX + w;
    const elBottom = newY + h;

    // Check alignment with other elements
    const allEls = [...page.elements, ...(page.overlayElements || [])].filter(e => e.id !== elId && !e.hidden);
    for (const other of allEls) {
      const oCenterX = other.x + other.w / 2;
      const oCenterY = other.y + other.h / 2;
      const oRight = other.x + other.w;
      const oBottom = other.y + other.h;

      if (Math.abs(newX - other.x) < 1) lines.push({ x: other.x });
      if (Math.abs(elRight - oRight) < 1) lines.push({ x: oRight });
      if (Math.abs(elCenterX - oCenterX) < 1) lines.push({ x: oCenterX });

      if (Math.abs(newY - other.y) < 1) lines.push({ y: other.y });
      if (Math.abs(elBottom - oBottom) < 1) lines.push({ y: oBottom });
      if (Math.abs(elCenterY - oCenterY) < 1) lines.push({ y: oCenterY });
    }

    // Check grid snap lines
    const snappedX = snapValue(newX);
    const snappedY = snapValue(newY);
    if (Math.abs(snappedX - newX) < 0.5) lines.push({ x: snappedX });
    if (Math.abs(snappedY - newY) < 0.5) lines.push({ y: snappedY });

    return lines;
  }, [snapEnabled, page, snapValue]);

  // Track mouse position + handle drag/resize
  const handleAreaMouseMove = useCallback((e: React.MouseEvent, onMouseMove?: (x: number, y: number) => void) => {
    if (!stageWrapRef.current) return;
    const rect = stageWrapRef.current.getBoundingClientRect();
    const scale = baseScale * zoom;
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    if (x >= 0 && y >= 0 && x <= stageW && y <= stageH) {
      onMouseMove?.(x, y);
    }

    if (!dragState.current || !stageWrapRef.current) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const dxPct = dx / scale / stageW * 100;
    const dyPct = dy / scale / stageH * 100;

    if (dragState.current.type === 'move') {
      const rawX = Math.max(0, Math.min(90, dragState.current.origX + dxPct));
      const rawY = Math.max(0, Math.min(90, dragState.current.origY + dyPct));
      const newX = snapEnabled ? snapValue(rawX) : rawX;
      const newY = snapEnabled ? snapValue(rawY) : rawY;
      updateElement(dragState.current.elId, { x: newX, y: newY });

      if (snapEnabled) {
        const lines = computeSnapLines(dragState.current.elId, newX, newY);
        setSnapLines(lines);
      }
    } else if (dragState.current.type === 'resize') {
      const dir = dragState.current.dir!;
      const orig = {
        x: dragState.current.origX,
        y: dragState.current.origY,
        w: dragState.current.origW!,
        h: dragState.current.origH!,
      };

      let newX = orig.x, newY = orig.y, newW = orig.w, newH = orig.h;

      if (dir.includes('r')) newW = Math.max(10, orig.w + dxPct);
      if (dir.includes('b')) newH = Math.max(8, orig.h + dyPct);
      if (dir.includes('l')) {
        newX = Math.min(orig.x + orig.w - 10, orig.x + dxPct);
        newW = Math.max(10, orig.w - dxPct);
      }
      if (dir.includes('t')) {
        newY = Math.min(orig.y + orig.h - 8, orig.y + dyPct);
        newH = Math.max(8, orig.h - dyPct);
      }

      if (snapEnabled) {
        newX = snapValue(newX);
        newY = snapValue(newY);
        newW = snapValue(newW);
        newH = snapValue(newH);
        newW = Math.max(10, newW);
        newH = Math.max(8, newH);
      }

      updateElement(dragState.current.elId, { x: newX, y: newY, w: newW, h: newH });

      if (snapEnabled) {
        const lines = computeSnapLines(dragState.current.elId, newX, newY, newW, newH);
        setSnapLines(lines);
      }
    }
  }, [baseScale, zoom, stageW, stageH, updateElement, snapEnabled, snapValue, computeSnapLines]);

  const handleMouseUp = useCallback(() => {
    dragState.current = null;
    setSnapLines([]);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Drag-start helpers
  const startMoveDrag = useCallback((elId: string, startX: number, startY: number, origX: number, origY: number) => {
    _pushHistory();
    dragState.current = { type: 'move', elId, startX, startY, origX, origY };
  }, [_pushHistory]);

  const startResizeDrag = useCallback((elId: string, dir: ResizeDir, startX: number, startY: number, origX: number, origY: number, origW: number, origH: number) => {
    _pushHistory();
    dragState.current = { type: 'resize', elId, startX, startY, origX, origY, origW, origH, dir };
  }, [_pushHistory]);

  return {
    stageWrapRef,
    snapLines,
    handleAreaMouseMove,
    handleMouseUp,
    startMoveDrag,
    startResizeDrag,
  };
}
