'use client';

// ═══════════════════════════════════════════════════════════════
// LAYER PANEL — Schema block layer list with drag-sort reorder
// ═══════════════════════════════════════════════════════════════
// Shows all blocks in the current screen's schema.
// Click to select → opens property panel.
// Shift+Click for multi-select → BatchActionsBar appears.
// Drag grip handle to reorder → intuitive block ordering.
// Alt+↑/Alt+↓ keyboard reorder for accessibility.
// Hover highlights on canvas. Selection syncs both ways.

import { useMemo, useCallback, useRef, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type { ScreenSchema } from '@/core/schema/types';
import { isSpatialLayout } from '@/core/schema/types';
// All icons migrated to Material Symbols Outlined
import { announceToScreenReader } from '@/lib/a11y';
import BatchActionsBar from './BatchActionsBar';

export default function LayerPanel() {
  // PERF: Subscribe to only the current page, not the full pages[] array
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const hoveredBlockId = useCanvaStore(s => s.hoveredBlockId);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const hoverBlock = useCanvaStore(s => s.hoverBlock);
  const startEditing = useCanvaStore(s => s.startEditing);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const deleteBlock = useCanvaStore(s => s.deleteBlock);
  const moveBlockUp = useCanvaStore(s => s.moveBlockUp);
  const moveBlockDown = useCanvaStore(s => s.moveBlockDown);
  const duplicateBlock = useCanvaStore(s => s.duplicateBlock);
  const reorderSchemaBlocks = useCanvaStore(s => s.reorderSchemaBlocks);

  // Resolve the schema for the current page — schema-first
  const schema = useMemo<ScreenSchema | null>(() => {
    if (!page) return null;
    return ensurePageSchema(page);
  }, [page]);

  if (!schema) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="text-2xl mb-2 opacity-40">📦</div>
        <div className="text-[10px] text-app-muted">Tidak ada schema block</div>
        <div className="text-[8px] text-app-muted mt-1">
          Layer panel hanya tersedia untuk halaman template/schema
        </div>
      </div>
    );
  }

  const isMultiSelect = selectedBlockIds && selectedBlockIds.length > 1;

  return (
    <div className="space-y-1">
      <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>arrow_selector_tool</span>
        Block Layer
        <span className="text-app-muted">({schema.blocks.length})</span>
      </div>

      {/* Batch actions bar — shows when multi-select active */}
      <BatchActionsBar />

      <LayerList
        schema={schema}
        selectedBlockId={selectedBlockId}
        selectedBlockIds={selectedBlockIds}
        hoveredBlockId={hoveredBlockId}
        editingBlockId={editingBlockId}
        selectBlock={selectBlock}
        hoverBlock={hoverBlock}
        startEditing={startEditing}
        stopEditing={stopEditing}
        deleteBlock={deleteBlock}
        moveBlockUp={moveBlockUp}
        moveBlockDown={moveBlockDown}
        duplicateBlock={duplicateBlock}
        reorderSchemaBlocks={reorderSchemaBlocks}
        isMultiSelect={isMultiSelect}
      />

      {/* Screen info */}
      <div className="mt-3 pt-2 border-t border-app-border/20">
        <div className="text-[8px] text-app-muted">
          {schema.sectionLabel && (
            <span className="text-app-muted">{schema.sectionLabel}</span>
          )}
          {schema.templateType && (
            <span className="ml-1">· {schema.templateType}</span>
          )}
        </div>
        <div className="text-[8px] text-app-muted mt-0.5">
          Klik = select · Shift+klik = pilih banyak · Drag = reorder · Alt+↑↓ = pindah
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYER LIST — Contains the drag-sort logic + multi-select
// ═══════════════════════════════════════════════════════════════

function LayerList({
  schema,
  selectedBlockId,
  selectedBlockIds,
  hoveredBlockId,
  editingBlockId,
  selectBlock,
  hoverBlock,
  startEditing,
  stopEditing,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  duplicateBlock,
  reorderSchemaBlocks,
  isMultiSelect,
}: {
  schema: ScreenSchema;
  selectedBlockId: string | null;
  selectedBlockIds: string[];
  hoveredBlockId: string | null;
  editingBlockId: string | null;
  selectBlock: (id: string | null, type?: string | null, addToSelection?: boolean) => void;
  hoverBlock: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  duplicateBlock: (id: string) => void;
  reorderSchemaBlocks: (fromIndex: number, toIndex: number) => void;
  isMultiSelect: boolean;
}) {
  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dragIndexRef = useRef<number | null>(null);

  // ── Keyboard reorder: Alt+ArrowUp / Alt+ArrowDown ──────────────
  const handleLayerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedBlockId) return;

    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveBlockUp(selectedBlockId);
      const blockIdx = schema.blocks.findIndex(
        (b, i) => (b.id || `${b.type}-${i}`) === selectedBlockId
      );
      if (blockIdx > 0) {
        const definition = getBlockDefinition(schema.blocks[blockIdx]!.type);
        const blockName = definition?.name || schema.blocks[blockIdx]!.type;
        announceToScreenReader(`Block ${blockName} dipindahkan ke posisi ${blockIdx}`);
      }
    } else if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveBlockDown(selectedBlockId);
      const blockIdx = schema.blocks.findIndex(
        (b, i) => (b.id || `${b.type}-${i}`) === selectedBlockId
      );
      if (blockIdx >= 0 && blockIdx < schema.blocks.length - 1) {
        const definition = getBlockDefinition(schema.blocks[blockIdx]!.type);
        const blockName = definition?.name || schema.blocks[blockIdx]!.type;
        announceToScreenReader(`Block ${blockName} dipindahkan ke posisi ${blockIdx + 2}`);
      }
    }
  }, [selectedBlockId, moveBlockUp, moveBlockDown, schema.blocks]);

  // Register item ref for drag position calculation
  const registerRef = useCallback((idx: number, el: HTMLElement | null) => {
    if (el) {
      itemRefs.current.set(idx, el);
    } else {
      itemRefs.current.delete(idx);
    }
  }, []);

  // Calculate which item the cursor is over during drag
  const getOverIndex = useCallback((clientY: number): number | null => {
    let closestIndex: number | null = null;
    let closestDist = Infinity;

    itemRefs.current.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - midY);
      if (dist < closestDist && dist < rect.height) {
        closestDist = dist;
        closestIndex = idx;
      }
    });

    return closestIndex;
  }, []);

  // Drag start handler (on the grip handle)
  const handleDragStart = useCallback((e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragIndexRef.current = index;
    setDragIndex(index);
    setOverIndex(index);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const over = getOverIndex(moveEvent.clientY);
      if (over !== null) {
        setOverIndex(over);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      (upEvent.target as HTMLElement).releasePointerCapture(upEvent.pointerId);

      const fromIdx = dragIndexRef.current;
      const toIdx = getOverIndex(upEvent.clientY);

      if (fromIdx !== null && toIdx !== null && fromIdx !== toIdx) {
        reorderSchemaBlocks(fromIdx, toIdx);
        const block = schema.blocks[fromIdx];
        const definition = getBlockDefinition(block!.type);
        const blockName = definition?.name || block!.type;
        announceToScreenReader(`Block ${blockName} dipindahkan ke posisi ${toIdx + 1}`);
      }

      dragIndexRef.current = null;
      setDragIndex(null);
      setOverIndex(null);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [getOverIndex, reorderSchemaBlocks, schema.blocks]);

  return (
    <div
      className="space-y-0.5"
      role="listbox"
      aria-label="Daftar block layer"
      onKeyDown={handleLayerKeyDown}
    >
      {schema.blocks.map((block, idx) => {
        const blockId = block.id || `${block.type}-${idx}`;
        const definition = getBlockDefinition(block.type);
        const isSelected = selectedBlockId === blockId;
        const isInMultiSelect = selectedBlockIds?.includes(blockId) ?? false;
        const isHovered = hoveredBlockId === blockId;
        const isEditing = editingBlockId === blockId;
        const layout = (block.layout && isSpatialLayout(block.layout) && block.layout.position === 'absolute') ? 'absolute' : 'flow';
        const isDragging = dragIndex === idx;
        const isDragOver = overIndex === idx && dragIndex !== null && dragIndex !== idx;
        const blockName = definition?.name || block.type;

        return (
          <div
            key={blockId}
            ref={(el) => registerRef(idx, el)}
            role="option"
            aria-selected={isSelected || isInMultiSelect}
            aria-label={`Block ${blockName}, posisi ${idx + 1} dari ${schema.blocks.length}`}
            tabIndex={isSelected ? 0 : -1}
            className={`w-full flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-left transition-[background-color,border-color] ${
              isDragging
                ? 'opacity-40 bg-blue-500/10 border border-blue-500/20'
                : isDragOver
                  ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-400/40'
                  : isInMultiSelect
                    ? 'bg-blue-500/10 border border-blue-500/25 text-blue-200'
                    : isSelected
                      ? 'bg-blue-500/15 border border-blue-500/30 text-blue-200'
                      : isHovered
                        ? 'bg-app-elevated/60 border border-app-border/20 text-app-secondary'
                        : 'border border-transparent text-app-secondary hover:bg-app-elevated/40 hover:text-app-secondary'
            }`}
          >
            {/* Multi-select checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectBlock(blockId, block.type, true);
              }}
              className="flex-shrink-0 p-0.5 rounded hover:bg-app-elevated/50 transition-colors"
              title={isInMultiSelect ? 'Hapus dari pilihan' : 'Tambah ke pilihan (Shift+klik)'}
              aria-label={isInMultiSelect ? 'Hapus dari pilihan' : 'Tambah ke pilihan'}
            >
              {isInMultiSelect ? (
                <span className="material-symbols-outlined text-blue-400" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>check_box</span>
              ) : (
                <span className="material-symbols-outlined text-app-muted/40 hover:text-app-muted" style={{ fontSize: '12px' }}>check_box_outline_blank</span>
              )}
            </button>

            {/* Drag handle */}
            <button
              onPointerDown={(e) => handleDragStart(e, idx)}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-app-muted hover:text-app-secondary transition-colors p-0.5"
              title="Drag untuk reorder"
              aria-label="Pegang untuk menggeser urutan block"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>drag_indicator</span>
            </button>

            {/* Main clickable area */}
            <button
              className="flex-1 flex items-center gap-2 min-w-0 text-left bg-transparent border-none p-0"
              onClick={(e) => {
                if (e.shiftKey) {
                  // Shift+click → toggle multi-select
                  selectBlock(blockId, block.type, true);
                } else {
                  // Normal click → single select
                  selectBlock(blockId, block.type);
                }
              }}
              onDoubleClick={() => {
                if (isEditing) {
                  stopEditing();
                } else {
                  startEditing(blockId);
                }
              }}
              onMouseEnter={() => hoverBlock(blockId)}
              onMouseLeave={() => hoverBlock(null)}
              aria-label={`${blockName}${isEditing ? ' (sedang diedit)' : ''}`}
            >
              {/* Block icon */}
              <span className="text-sm flex-shrink-0" aria-hidden="true">{definition?.icon || '📦'}</span>

              {/* Block info */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate flex items-center gap-1">
                  {blockName}
                  {isEditing && (
                    <span className="text-[7px] font-black px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      EDIT
                    </span>
                  )}
                </div>
                <div className="text-[8px] text-app-muted flex items-center gap-1">
                  <span className={`px-1 py-0 rounded text-[7px] font-bold ${
                    layout === 'flow'
                      ? 'bg-emerald-500/10 text-emerald-400/60'
                      : 'bg-app-accent/10 text-app-accent/60'
                  }`}>
                    {layout}
                  </span>
                  {block.variant && (
                    <span className="text-[7px] text-app-muted">V{block.variant}</span>
                  )}
                </div>
              </div>

              {/* Block type badge */}
              <span className="text-[7px] text-app-muted font-mono truncate max-w-[60px]" aria-hidden="true">
                {block.type}
              </span>
            </button>

            {/* Quick actions (visible on selected, hidden during drag, hidden during multi-select) */}
            {isSelected && dragIndex === null && !isMultiSelect && (
              <div className="flex items-center gap-0.5 flex-shrink-0" role="group" aria-label="Aksi block">
                <button
                  onClick={(e) => { e.stopPropagation(); moveBlockUp(blockId); }}
                  className="p-0.5 rounded hover:bg-app-elevated/50 text-app-muted hover:text-app-secondary transition-colors"
                  title="Pindah atas (Alt+↑)"
                  aria-label="Pindah block ke atas"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_less</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveBlockDown(blockId); }}
                  className="p-0.5 rounded hover:bg-app-elevated/50 text-app-muted hover:text-app-secondary transition-colors"
                  title="Pindah bawah (Alt+↓)"
                  aria-label="Pindah block ke bawah"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_more</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateBlock(blockId); }}
                  className="p-0.5 rounded hover:bg-app-elevated/50 text-app-muted hover:text-app-secondary transition-colors"
                  title="Duplikat"
                  aria-label="Duplikat block"
                >
                  ⧉
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    announceToScreenReader(`Block ${blockName} dihapus`);
                    deleteBlock(blockId);
                  }}
                  className="p-0.5 rounded hover:bg-red-500/30 text-app-muted hover:text-red-400 transition-colors"
                  title="Hapus"
                  aria-label="Hapus block"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
