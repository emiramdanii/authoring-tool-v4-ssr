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
  // For now, resize handles are visual indicators that the block supports resize.
  // Actual resize behavior requires the block to have `position: 'absolute'` layout
  // and a move/resize handler connected to the store.
  // Flow-positioned blocks show handles but resize differently (width only).

  if (!capabilities.resizable) return null;

  return (
    <>
      {RESIZE_DIRS.map(h => (
        <div
          key={h.dir}
          className="absolute w-3 h-3 bg-blue-400 border border-blue-600 rounded-sm z-30 hover:bg-blue-300 transition-colors"
          style={{ ...h.style, cursor: h.cursor }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Resize handle interaction — future: connect to store for absolute blocks
            // For flow blocks, width-only resize via updateSchemaBlock({ style: { width: '...' } })
          }}
        />
      ))}
    </>
  );
}
