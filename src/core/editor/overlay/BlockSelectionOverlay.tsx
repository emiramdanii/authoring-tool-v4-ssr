// ═══════════════════════════════════════════════════════════════════
// BLOCK SELECTION OVERLAY — Reusable editing overlay for schema blocks
// ═══════════════════════════════════════════════════════════════════
// Wraps any block renderer to add:
//   - Selection ring (blue for selected, light blue for hovered)
//   - Label badge (icon + name, positioned above)
//   - Editing indicator (green badge)
//   - Delete button (on the label badge)
//   - Reorder controls (move up/down for flow blocks)
//   - Transform handles (resize/move, driven by capabilities)
//
// This component is capability-driven: it reads BlockCapabilities from
// the registry and only shows controls that the block supports.
//
// Usage:
//   <BlockSelectionOverlay blockId="cover-0" blockType="cover" ...>
//     <CoverRenderer block={block} ... />
//   </BlockSelectionOverlay>

'use client';

import React, { useCallback, type ReactNode } from 'react';
import { getBlockDefinition, type BlockCapabilities } from '../../registry/SceneRegistry';
import { useCanvaStore } from '@/store/canva-store';
import type { SchemaBlock } from '../../schema/types';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface BlockSelectionOverlayProps {
  /** Block ID (stable, from schema) */
  blockId: string;
  /** Block type (for registry lookup) */
  blockType: string;
  /** Whether this block is currently selected */
  isSelected: boolean;
  /** Whether this block is currently hovered */
  isHovered: boolean;
  /** Whether this block is in inline editing mode */
  isEditing: boolean;
  /** Whether we're in canvas (compact) mode */
  isCompact: boolean;
  /** Callback: block clicked */
  onSelect: (blockId: string, blockType: string) => void;
  /** Callback: block hovered */
  onHover: (blockId: string | null) => void;
  /** Callback: block double-clicked (enter edit mode) */
  onEdit: (blockId: string, blockType: string) => void;
  /** Callback: delete this block */
  onDelete?: (blockId: string) => void;
  /** Callback: move block up in flow order */
  onMoveUp?: (blockId: string) => void;
  /** Callback: move block down in flow order */
  onMoveDown?: (blockId: string) => void;
  /** Callback: duplicate this block */
  onDuplicate?: (blockId: string) => void;
  /** The block content to render inside the overlay */
  children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function BlockSelectionOverlay({
  blockId,
  blockType,
  isSelected,
  isHovered,
  isEditing,
  isCompact,
  onSelect,
  onHover,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  children,
}: BlockSelectionOverlayProps) {
  // Look up block definition from registry for capabilities and metadata
  const definition = getBlockDefinition(blockType);
  const capabilities: BlockCapabilities = definition?.capabilities ?? {
    editable: true, resizable: false, movable: false,
    backgroundCustom: false, interactive: false, autoGeneratable: true,
    composite: false, variants: ['A'],
  };
  const blockName = definition?.name ?? blockType;
  const blockIcon = definition?.icon ?? '?';

  // ── Event Handlers ────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isCompact) return;
    e.stopPropagation();
    onSelect(blockId, blockType);
  }, [isCompact, onSelect, blockId, blockType]);

  const handleMouseEnter = useCallback(() => {
    if (!isCompact || !onHover) return;
    onHover(blockId);
  }, [isCompact, onHover, blockId]);

  const handleMouseLeave = useCallback(() => {
    if (!isCompact || !onHover) return;
    onHover(null);
  }, [isCompact, onHover]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!isCompact) return;
    e.stopPropagation();
    onEdit(blockId, blockType);
  }, [isCompact, onEdit, blockId, blockType]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(blockId);
  }, [onDelete, blockId]);

  const handleMoveUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMoveUp?.(blockId);
  }, [onMoveUp, blockId]);

  const handleMoveDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMoveDown?.(blockId);
  }, [onMoveDown, blockId]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDuplicate?.(blockId);
  }, [onDuplicate, blockId]);

  // ── Selection ring class ──────────────────────────────────────
  const ringClass = isSelected
    ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent rounded-lg'
    : isHovered
      ? 'ring-1 ring-blue-400/30 ring-offset-1 ring-offset-transparent rounded-lg'
      : '';

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      data-block-id={blockId}
      data-block-type={blockType}
      className={`relative group ${ringClass} ${isCompact ? 'cursor-pointer' : ''} ${isEditing ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent rounded-lg' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── Block content ──────────────────────────────────────── */}
      {children}

      {/* ── Selection label badge (canvas mode, selected) ──────── */}
      {isSelected && isCompact && (
        <div className="absolute -top-6 left-0 flex items-center gap-0.5 z-30 pointer-events-auto">
          {/* Block type badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-t-md bg-blue-500 text-[9px] font-bold text-white whitespace-nowrap">
            <span>{blockIcon}</span>
            <span>{blockName}</span>
          </div>
          {/* Reorder: Move Up */}
          {onMoveUp && (
            <button
              onClick={handleMoveUp}
              className="px-1.5 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold rounded-t-md transition-colors"
              title="Pindah atas"
            >
              ▲
            </button>
          )}
          {/* Reorder: Move Down */}
          {onMoveDown && (
            <button
              onClick={handleMoveDown}
              className="px-1.5 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold rounded-t-md transition-colors"
              title="Pindah bawah"
            >
              ▼
            </button>
          )}
          {/* Duplicate */}
          {onDuplicate && capabilities.autoGeneratable && (
            <button
              onClick={handleDuplicate}
              className="px-1.5 py-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold rounded-t-md transition-colors"
              title="Duplikat"
            >
              ⧉
            </button>
          )}
          {/* Delete */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-1.5 py-0.5 bg-blue-500 hover:bg-red-600 text-white text-[9px] font-bold rounded-t-md transition-colors"
              title="Hapus block"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Hover highlight (canvas mode, not selected) ────────── */}
      {!isSelected && isCompact && (
        <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-blue-400/30 pointer-events-none transition-all" />
      )}

      {/* ── Editing indicator (canvas mode, editing) ───────────── */}
      {isEditing && isCompact && (
        <div className="absolute -top-6 right-0 flex items-center gap-1 z-30 pointer-events-auto">
          <div className="px-2 py-0.5 rounded-t-md bg-emerald-500 text-[9px] font-bold text-white whitespace-nowrap">
            Editing
          </div>
          {/* Quick stop editing button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Exit editing mode by selecting (re-select clears editing)
              onSelect(blockId, blockType);
            }}
            className="px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold rounded-t-md transition-colors"
            title="Selesai edit"
          >
            ✓
          </button>
        </div>
      )}

      {/* ── Transform handles (only for resizable/movable blocks) ── */}
      {isSelected && isCompact && capabilities.resizable && (
        <TransformHandles blockId={blockId} capabilities={capabilities} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRANSFORM HANDLES — Resize/move handles for capable blocks
// ═══════════════════════════════════════════════════════════════════
// Shows 8-directional resize handles when a block is selected
// and has `resizable: true` capability. For future: drag-to-move
// when `movable: true`.

interface TransformHandlesProps {
  blockId: string;
  capabilities: BlockCapabilities;
}

const RESIZE_DIRS = [
  { dir: 'tl', style: { top: -5, left: -5 }, cursor: 'nwse-resize' },
  { dir: 'tr', style: { top: -5, right: -5 }, cursor: 'nesw-resize' },
  { dir: 'bl', style: { bottom: -5, left: -5 }, cursor: 'nesw-resize' },
  { dir: 'br', style: { bottom: -5, right: -5 }, cursor: 'nwse-resize' },
  { dir: 'tm', style: { top: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'bm', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'l',  style: { top: '50%', left: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { dir: 'r',  style: { top: '50%', right: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
] as const;

function TransformHandles({ blockId, capabilities }: TransformHandlesProps) {
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    // Get the current block's layout from the store
    const state = useCanvaStore.getState();
    const page = state.pages[state.currentPageIndex];
    if (!page) return;

    const schemaScreen = page.templateData?.schemaScreen as Record<string, unknown> | undefined;
    if (!schemaScreen) return;

    const blocks = schemaScreen.blocks as SchemaBlock[];
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const layout = block.layout || { position: 'flow' as const };
    const isAbsolute = layout.position === 'absolute';

    // Store initial layout values — coerce to number (treat 'auto' as fallback)
    const toNum = (v: number | string | undefined, fallback: number): number =>
      typeof v === 'number' ? v : fallback;

    const initialLayout = {
      x: toNum(layout.x, 0),
      y: toNum(layout.y, 0),
      width: toNum(layout.width, 100),
      height: toNum(layout.height, 50),
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      // Convert pixel delta to percentage (approximate — assumes canvas ~1280x720)
      const dxPct = dx / 12.8; // rough percentage conversion
      const dyPct = dy / 7.2;

      const newLayout: Record<string, unknown> = { position: layout.position };

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
