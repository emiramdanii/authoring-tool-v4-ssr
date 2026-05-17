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
//   - Drag-to-move (absolute-positioned, movable blocks)
//
// This component is capability-driven: it reads BlockCapabilities from
// the registry and only shows controls that the block supports.
//
// Usage:
//   <BlockSelectionOverlay blockId="cover-0" blockType="cover" ...>
//     <CoverRenderer block={block} ... />
//   </BlockSelectionOverlay>

'use client';

import React, { useCallback, useState, type ReactNode } from 'react';
// NOTE: Import from BlockDefinitionRegistry (NOT SceneRegistry) to break
// the circular dependency: SceneRegistry → renderers → SchemaRenderer → BlockSelectionOverlay → SceneRegistry
import { getBlockMeta, type BlockCapabilities } from '../../registry/BlockDefinitionRegistry';
import type { SchemaBlock } from '../../schema/types';
import { BlockContextMenu } from './BlockContextMenu';
import { TransformHandles, useTransformDrag } from '../transform-controls/TransformHandles';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface BlockSelectionOverlayProps {
  /** Block ID (stable, from schema) */
  blockId: string;
  /** Block type (for registry lookup) */
  blockType: string;
  /** Block index in schema.blocks (for drag-reorder) */
  blockIndex?: number;
  /** Whether this block is currently selected */
  isSelected: boolean;
  /** Whether this block is in multi-select but not the primary selection */
  isMultiSelected?: boolean;
  /** Whether this block is currently hovered */
  isHovered: boolean;
  /** Whether this block is in inline editing mode */
  isEditing: boolean;
  /** Whether we're in canvas (compact) mode */
  isCompact: boolean;
  /** Whether this block is currently being drag-reordered on canvas */
  isBeingDragged?: boolean;
  /** Callback: block clicked */
  onSelect: (blockId: string, blockType: string, addToSelection?: boolean) => void;
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
  /** Callback: drag grip handle pointerdown (initiates canvas drag-reorder) */
  onDragHandleDown?: (e: React.PointerEvent, blockIndex: number) => void;
  /** The block content to render inside the overlay */
  children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const BlockSelectionOverlay = React.memo(function BlockSelectionOverlay({
  blockId,
  blockType,
  blockIndex,
  isSelected,
  isMultiSelected,
  isHovered,
  isEditing,
  isCompact,
  isBeingDragged,
  onSelect,
  onHover,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDragHandleDown,
  children,
}: BlockSelectionOverlayProps) {
  // Look up block definition from registry for capabilities and metadata
  const definition = getBlockMeta(blockType);
  const capabilities: BlockCapabilities = definition?.capabilities ?? {
    editable: true, resizable: false, movable: false,
    backgroundCustom: false, interactive: false, autoGeneratable: true,
    composite: false, variants: ['A'], handlesCompression: false,
  };
  const blockName = definition?.name ?? blockType;
  const blockIcon = definition?.icon ?? '?';

  // ── Drag-to-move hook (from transform-controls submodule) ─────
  const { isDragging, handleDragStart } = useTransformDrag({
    blockId,
    isCompact,
    isSelected,
    isMovable: capabilities.movable,
  });

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // ── Event Handlers ────────────────────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isCompact) return;
    e.stopPropagation();
    onSelect(blockId, blockType, e.shiftKey);
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

  const handleDragGripDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // left click only
    e.stopPropagation();
    e.preventDefault();
    if (blockIndex !== undefined && onDragHandleDown) {
      onDragHandleDown(e, blockIndex);
    }
  }, [blockIndex, onDragHandleDown]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isCompact || !isSelected) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [isCompact, isSelected]);

  // ── Selection ring class ──────────────────────────────────────
  // Uses amber accent to match app design language (not generic blue)
  // Selected: prominent ring + pulse glow animation
  // Multi-selected: lighter ring variant
  // Hovered: subtle accent ring for discoverability
  const ringClass = isSelected && isMultiSelected
    ? 'ring-2 ring-amber-400/70 ring-offset-1 ring-offset-transparent rounded-lg'
    : isSelected
      ? 'ring-2 ring-app-accent ring-offset-2 ring-offset-transparent rounded-lg selection-glow'
      : isHovered
        ? 'ring-1 ring-app-accent/30 ring-offset-1 ring-offset-transparent rounded-lg'
        : '';

  // ── Render ────────────────────────────────────────────────────
  const isBeingDraggedClass = isBeingDragged ? 'opacity-40 pointer-events-none' : '';

  return (
    <div
      data-block-id={blockId}
      data-block-type={blockType}
      className={`relative group ${ringClass} ${isBeingDraggedClass} ${isCompact ? (isDragging ? 'cursor-grabbing' : isSelected && capabilities.movable ? 'cursor-grab' : 'cursor-pointer') : ''} ${isEditing ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent rounded-lg editing-glow' : ''}`}
      onClick={handleClick}
      onMouseDown={handleDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Perf: React.memo — only re-renders when props actually change */}
      {/* ── Block content ──────────────────────────────────────── */}
      {children}

      {/* ── Selection label badge (canvas mode, selected) ──────── */}
      {isSelected && isCompact && (
        <div className="absolute -top-6 left-0 flex items-center gap-0.5 z-30 pointer-events-auto">
          {/* Block type badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-t-md bg-app-accent text-[9px] font-bold text-black whitespace-nowrap">
            <span>{blockIcon}</span>
            <span>{blockName}</span>
          </div>
          {/* Drag grip handle (canvas drag-reorder) */}
          {onDragHandleDown && blockIndex !== undefined && (
            <button
              onPointerDown={handleDragGripDown}
              className="px-1 py-0.5 bg-app-accent hover:bg-amber-600 text-black text-[9px] font-bold rounded-t-md cursor-grab active:cursor-grabbing transition-colors select-none"
              title="Drag untuk reorder"
              aria-label="Pegang untuk menggeser urutan block"
            >
              ⠿
            </button>
          )}
          {/* Reorder: Move Up */}
          {onMoveUp && (
            <button
              onClick={handleMoveUp}
              className="px-1.5 py-0.5 bg-app-accent hover:bg-amber-600 text-black text-[9px] font-bold rounded-t-md transition-colors"
              title="Pindah atas"
            >
              ▲
            </button>
          )}
          {/* Reorder: Move Down */}
          {onMoveDown && (
            <button
              onClick={handleMoveDown}
              className="px-1.5 py-0.5 bg-app-accent hover:bg-amber-600 text-black text-[9px] font-bold rounded-t-md transition-colors"
              title="Pindah bawah"
            >
              ▼
            </button>
          )}
          {/* Duplicate */}
          {onDuplicate && capabilities.autoGeneratable && (
            <button
              onClick={handleDuplicate}
              className="px-1.5 py-0.5 bg-app-accent hover:bg-amber-600 text-black text-[9px] font-bold rounded-t-md transition-colors"
              title="Duplikat"
            >
              ⧉
            </button>
          )}
          {/* Delete */}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-1.5 py-0.5 bg-app-accent hover:bg-red-500 text-black hover:text-white text-[9px] font-bold rounded-t-md transition-colors"
              title="Hapus block"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Hover highlight (canvas mode, not selected) ────────── */}
      {!isSelected && isCompact && (
        <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-app-accent/30 pointer-events-none transition-all" />
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

      {/* ── Context menu (right-click on selected block) ── */}
      {contextMenu && (
        <BlockContextMenu
          blockId={blockId}
          blockType={blockType}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});
