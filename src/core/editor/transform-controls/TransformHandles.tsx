// ═══════════════════════════════════════════════════════════════════
// TRANSFORM CONTROLS — Resize/move handles for schema blocks
// ═══════════════════════════════════════════════════════════════════
// Extracted from BlockSelectionOverlay for modularity.
// Shows 8-directional resize handles when a block is selected
// and has `resizable: true` capability.
//
// Drag-to-move is handled in BlockSelectionOverlay for `movable: true`
// blocks. This module focuses on resize/transform handles.

'use client';

import React, { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import type { SchemaBlock } from '../../schema/types';
import type { BlockCapabilities } from '../../registry/SceneRegistry';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface TransformHandlesProps {
  /** Block ID (stable, from schema) */
  blockId: string;
  /** Block capabilities (determines which handles to show) */
  capabilities: BlockCapabilities;
}

type ResizeDir = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'l' | 'r';

interface ResizeDirDef {
  dir: ResizeDir;
  style: React.CSSProperties;
  cursor: string;
}

// ═══════════════════════════════════════════════════════════════════
// RESIZE DIRECTION DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

const RESIZE_DIRS: ResizeDirDef[] = [
  { dir: 'tl', style: { top: -5, left: -5 }, cursor: 'nwse-resize' },
  { dir: 'tr', style: { top: -5, right: -5 }, cursor: 'nesw-resize' },
  { dir: 'bl', style: { bottom: -5, left: -5 }, cursor: 'nesw-resize' },
  { dir: 'br', style: { bottom: -5, right: -5 }, cursor: 'nwse-resize' },
  { dir: 'tm', style: { top: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'bm', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'l',  style: { top: '50%', left: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { dir: 'r',  style: { top: '50%', right: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER: Get block layout from store
// ═══════════════════════════════════════════════════════════════════

function getBlockLayout(blockId: string): { layout: SchemaBlock['layout']; isAbsolute: boolean } {
  const state = useCanvaStore.getState();
  const page = state.pages[state.currentPageIndex];
  if (!page) return { layout: { position: 'flow' }, isAbsolute: false };

  const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
  if (!schemaScreen) return { layout: { position: 'flow' }, isAbsolute: false };

  const blocks = schemaScreen.blocks as SchemaBlock[];
  const block = blocks.find(b => b.id === blockId);
  const layout = block?.layout || { position: 'flow' as const };

  return { layout, isAbsolute: layout.position === 'absolute' };
}

function toNum(v: number | string | undefined, fallback: number): number {
  return typeof v === 'number' ? v : fallback;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT: TransformHandles
// ═══════════════════════════════════════════════════════════════════

export function TransformHandles({ blockId, capabilities }: TransformHandlesProps) {
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    const { layout, isAbsolute } = getBlockLayout(blockId);

    const initialLayout = {
      x: toNum(layout?.x, 0),
      y: toNum(layout?.y, 0),
      width: toNum(layout?.width, 100),
      height: toNum(layout?.height, 50),
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // Convert pixel delta to percentage (approximate — assumes canvas ~1280x720)
      const dxPct = dx / 12.8;
      const dyPct = dy / 7.2;

      const newLayout: Record<string, unknown> = { position: layout?.position ?? 'flow' };

      if (isAbsolute) {
        // Full resize for absolute blocks
        let newX = initialLayout.x;
        let newY = initialLayout.y;
        let newW = initialLayout.width;
        let newH = initialLayout.height;

        if (dir.includes('r')) newW = Math.max(10, initialLayout.width + dxPct);
        if (dir.includes('b')) newH = Math.max(8, initialLayout.height + dyPct);
        if (dir.includes('l')) {
          newX = Math.min(initialLayout.x + initialLayout.width - 10, initialLayout.x + dxPct);
          newW = Math.max(10, initialLayout.width - dxPct);
        }
        if (dir.includes('t')) {
          newY = Math.min(initialLayout.y + initialLayout.height - 8, initialLayout.y + dyPct);
          newH = Math.max(8, initialLayout.height - dyPct);
        }

        newLayout.x = Math.round(newX * 10) / 10;
        newLayout.y = Math.round(newY * 10) / 10;
        newLayout.width = Math.round(newW * 10) / 10;
        newLayout.height = Math.round(newH * 10) / 10;
      } else {
        // Flow blocks: width-only resize
        let newW = initialLayout.width;
        if (dir.includes('r') || dir.includes('l')) {
          newW = Math.max(30, Math.min(100, initialLayout.width + dxPct));
        }
        newLayout.width = Math.round(newW * 10) / 10;
      }

      updateSchemaBlock(blockId, { layout: newLayout });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [blockId, updateSchemaBlock]);

  if (!capabilities.resizable) return null;

  return (
    <>
      {RESIZE_DIRS.map(h => (
        <div
          key={h.dir}
          className="absolute w-3 h-3 bg-blue-400 border border-blue-600 rounded-sm z-30 hover:bg-blue-300 transition-colors"
          style={{ ...h.style, cursor: h.cursor }}
          onMouseDown={(e) => handleResizeStart(e, h.dir)}
        />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: useTransformDrag — Reusable drag-to-move hook for blocks
// ═══════════════════════════════════════════════════════════════════
// This hook provides drag-to-move functionality for absolute-positioned
// blocks with `movable: true` capability. It returns event handlers
// and a dragging state flag for cursor feedback.

export interface UseTransformDragOptions {
  blockId: string;
  isCompact: boolean;
  isSelected: boolean;
  isMovable: boolean;
}

export function useTransformDrag({ blockId, isCompact, isSelected, isMovable }: UseTransformDragOptions) {
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isCompact || !isSelected || !isMovable) return;

    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const { layout } = getBlockLayout(blockId);
    if (!layout || layout.position !== 'absolute') return;

    const startX = e.clientX;
    const startY = e.clientY;

    const initialX = toNum(layout.x, 0);
    const initialY = toNum(layout.y, 0);
    const DRAG_THRESHOLD = 3;
    let dragStarted = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragStarted && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

      if (!dragStarted) {
        dragStarted = true;
        setIsDragging(true);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      const dxPct = dx / 12.8;
      const dyPct = dy / 7.2;

      const newX = Math.max(0, Math.min(90, initialX + dxPct));
      const newY = Math.max(0, Math.min(90, initialY + dyPct));

      updateSchemaBlock(blockId, {
        layout: {
          position: 'absolute',
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        },
      });
    };

    const handleMouseUp = () => {
      if (dragStarted) {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isCompact, isSelected, isMovable, blockId, updateSchemaBlock]);

  return { isDragging, handleDragStart };
}
