'use client';

// ═══════════════════════════════════════════════════════════════
// LAYER PANEL — Schema block layer list with drag-sort reorder
// ═══════════════════════════════════════════════════════════════
// Shows all blocks in the current screen's schema.
// Click to select → opens property panel.
// Drag grip handle to reorder → intuitive block ordering.
// Hover highlights on canvas. Selection syncs both ways.

import { useMemo, useCallback, useRef, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';
import { convertToSchema } from '@/core/engine/TemplateAdapter';
import type { ScreenSchema } from '@/core/schema/types';
import { MousePointer2, GripVertical } from 'lucide-react';

export default function LayerPanel() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
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

  const page = pages[currentPageIndex];

  // Resolve the schema for the current page
  const schema = useMemo<ScreenSchema | null>(() => {
    if (!page) return null;

    // Priority 1: schemaScreen in templateData (preset / edited pages)
    const storedSchema = page.templateData?.schemaScreen as ScreenSchema | undefined;
    if (storedSchema) return storedSchema;

    // Priority 2: Convert legacy template page via TemplateAdapter
    const isTemplate = page.templateType && page.templateType !== 'custom';
    if (isTemplate) {
      return convertToSchema(page);
    }

    return null;
  }, [page]);

  if (!schema) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="text-2xl mb-2 opacity-40">📦</div>
        <div className="text-[10px] text-slate-500">Tidak ada schema block</div>
        <div className="text-[8px] text-slate-600 mt-1">
          Layer panel hanya tersedia untuk halaman template/schema
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <MousePointer2 size={10} />
        Block Layer
        <span className="text-slate-600">({schema.blocks.length})</span>
      </div>

      <LayerList
        schema={schema}
        selectedBlockId={selectedBlockId}
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
      />

      {/* Screen info */}
      <div className="mt-3 pt-2 border-t border-slate-700/20">
        <div className="text-[8px] text-slate-600">
          {schema.sectionLabel && (
            <span className="text-slate-500">{schema.sectionLabel}</span>
          )}
          {schema.templateType && (
            <span className="ml-1">· {schema.templateType}</span>
          )}
        </div>
        <div className="text-[8px] text-slate-600 mt-0.5">
          Klik = select · Double-klik = edit · Drag = reorder
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYER LIST — Contains the drag-sort logic
// ═══════════════════════════════════════════════════════════════

function LayerList({
  schema,
  selectedBlockId,
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
}: {
  schema: ScreenSchema;
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  editingBlockId: string | null;
  selectBlock: (id: string, type: string) => void;
  hoverBlock: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  duplicateBlock: (id: string) => void;
  reorderSchemaBlocks: (fromIndex: number, toIndex: number) => void;
}) {
  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dragIndexRef = useRef<number | null>(null);

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
    if (e.button !== 0) return; // left click only
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
      }

      dragIndexRef.current = null;
      setDragIndex(null);
      setOverIndex(null);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [getOverIndex, reorderSchemaBlocks]);

  return (
    <div className="space-y-0.5">
      {schema.blocks.map((block, idx) => {
        const blockId = block.id || `${block.type}-${idx}`;
        const definition = getBlockDefinition(block.type);
        const isSelected = selectedBlockId === blockId;
        const isHovered = hoveredBlockId === blockId;
        const isEditing = editingBlockId === blockId;
        const layout = block.layout?.position === 'absolute' ? 'absolute' : 'flow';
        const isDragging = dragIndex === idx;
        const isDragOver = overIndex === idx && dragIndex !== null && dragIndex !== idx;

        return (
          <div
            key={blockId}
            ref={(el) => registerRef(idx, el)}
            className={`w-full flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-left transition-all ${
              isDragging
                ? 'opacity-40 bg-blue-500/10 border border-blue-500/20'
                : isDragOver
                  ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-400/40'
                  : isSelected
                    ? 'bg-blue-500/15 border border-blue-500/30 text-blue-200'
                    : isHovered
                      ? 'bg-slate-800/60 border border-slate-700/20 text-slate-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
            }`}
          >
            {/* Drag handle */}
            <button
              onPointerDown={(e) => handleDragStart(e, idx)}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors p-0.5"
              title="Drag untuk reorder"
            >
              <GripVertical size={12} />
            </button>

            {/* Main clickable area */}
            <button
              className="flex-1 flex items-center gap-2 min-w-0 text-left bg-transparent border-none p-0"
              onClick={() => selectBlock(blockId, block.type)}
              onDoubleClick={() => {
                if (isEditing) {
                  stopEditing();
                } else {
                  startEditing(blockId);
                }
              }}
              onMouseEnter={() => hoverBlock(blockId)}
              onMouseLeave={() => hoverBlock(null)}
            >
              {/* Block icon */}
              <span className="text-sm flex-shrink-0">{definition?.icon || '📦'}</span>

              {/* Block info */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate flex items-center gap-1">
                  {definition?.name || block.type}
                  {isEditing && (
                    <span className="text-[7px] font-black px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      EDIT
                    </span>
                  )}
                </div>
                <div className="text-[8px] text-slate-500 flex items-center gap-1">
                  <span className={`px-1 py-0 rounded text-[7px] font-bold ${
                    layout === 'flow'
                      ? 'bg-emerald-500/10 text-emerald-400/60'
                      : 'bg-amber-500/10 text-amber-400/60'
                  }`}>
                    {layout}
                  </span>
                  {block.variant && (
                    <span className="text-[7px] text-slate-600">V{block.variant}</span>
                  )}
                </div>
              </div>

              {/* Block type badge */}
              <span className="text-[7px] text-slate-600 font-mono truncate max-w-[60px]">
                {block.type}
              </span>
            </button>

            {/* Quick actions (visible on selected, hidden during drag) */}
            {isSelected && dragIndex === null && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); moveBlockUp(blockId); }}
                  className="p-0.5 rounded hover:bg-slate-600/50 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Pindah atas"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 1L7 5H1Z"/></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveBlockDown(blockId); }}
                  className="p-0.5 rounded hover:bg-slate-600/50 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Pindah bawah"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M4 7L1 3H7Z"/></svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateBlock(blockId); }}
                  className="p-0.5 rounded hover:bg-slate-600/50 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Duplikat"
                >
                  ⧉
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteBlock(blockId); }}
                  className="p-0.5 rounded hover:bg-red-500/30 text-slate-500 hover:text-red-400 transition-colors"
                  title="Hapus"
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
