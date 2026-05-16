/**
 * SILSE — Sortable Canvas Component
 * Drag-and-drop canvas with @dnd-kit for block reordering.
 *
 * Task #6: DnD reordering with @dnd-kit.
 * Task #7: Enhanced block previews via BlockPreview component.
 * Task #8: Inline content editing on double-click.
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCanvaStore } from '../../../store/canva-store';
import type { SchemaBlock, ContainerRef } from '../../../core/schema/types';
import { SCENE_MAX_HEIGHT } from '../../../core/schema/transaction';
import { getBlockCapabilities } from '../../../core/schema/capability-registry';
import { BlockPreview } from './BlockPreview';
import { BlockEditor } from './BlockEditor';

// ─── Sortable Block ────────────────────────────────────────────────────
function SortableBlock({
  block,
  editingBlockId,
  onDoubleClick,
  onStopEdit,
  onContextMenu,
}: {
  block: SchemaBlock;
  editingBlockId: string | null;
  onDoubleClick: (blockId: string) => void;
  onStopEdit: () => void;
  onContextMenu?: (e: React.MouseEvent, block: SchemaBlock) => void;
}) {
  const { session, selectBlock } = useCanvaStore();
  const isSelected = session.selectedBlockId === block.id;
  const isEditing = editingBlockId === block.id;
  const caps = getBlockCapabilities(block.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { type: 'block', block },
    // Disable drag while editing
    disabled: isEditing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => { if (!isEditing) selectBlock(block.id); }}
      onDoubleClick={() => onDoubleClick(block.id)}
      onContextMenu={e => { e.preventDefault(); onContextMenu?.(e, block); }}
      className={`rounded-md cursor-pointer transition-all group relative ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:ring-1 hover:ring-slate-300'
      } ${isEditing ? 'ring-2 ring-indigo-400 ring-offset-1' : ''} ${isDragging ? 'shadow-lg' : ''}`}
      {...(isEditing ? {} : attributes)}
      {...(isEditing ? {} : listeners)}
    >
      {/* Drag handle indicator (hidden while editing) */}
      {!isEditing && (
        <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="flex items-center gap-0.5 bg-white/80 rounded px-1 py-0.5 shadow-sm border border-slate-200">
            <span className="text-[7px] text-slate-400 cursor-grab">⠿</span>
            {caps.isInteractive && <span className="text-[7px] text-indigo-500">✦</span>}
          </div>
        </div>
      )}

      {/* Type-specific preview (always visible) */}
      <BlockPreview block={block} />

      {/* Inline editor (visible when editing) */}
      <BlockEditor
        block={block}
        isEditing={isEditing}
        onStartEdit={onDoubleClick}
        onStopEdit={onStopEdit}
      />

      {/* Nested children (compact preview, also double-click to edit) */}
      {(block.children ?? block.items ?? block.tabs)?.map(child => (
        <div key={child.id} className="mx-2 mt-0.5">
          <NestedBlockPreview
            block={child}
            editingBlockId={editingBlockId}
            onDoubleClick={onDoubleClick}
            onStopEdit={onStopEdit}
            onContextMenu={onContextMenu}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Nested Block Preview ──────────────────────────────────────────────
function NestedBlockPreview({
  block,
  editingBlockId,
  onDoubleClick,
  onStopEdit,
  onContextMenu,
}: {
  block: SchemaBlock;
  editingBlockId: string | null;
  onDoubleClick: (blockId: string) => void;
  onStopEdit: () => void;
  onContextMenu?: (e: React.MouseEvent, block: SchemaBlock) => void;
}) {
  const { session, selectBlock } = useCanvaStore();
  const isSelected = session.selectedBlockId === block.id;
  const isEditing = editingBlockId === block.id;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); if (!isEditing) selectBlock(block.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(block.id); }}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu?.(e, block); }}
      className={`rounded border p-1 cursor-pointer transition-all text-[10px] ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:bg-white/60'
      } ${isEditing ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
    >
      <BlockPreview block={block} compact />
      <BlockEditor
        block={block}
        isEditing={isEditing}
        onStartEdit={onDoubleClick}
        onStopEdit={onStopEdit}
      />
    </div>
  );
}

// ─── Drag Overlay Block ────────────────────────────────────────────────
function DragOverlayBlock({ block }: { block: SchemaBlock }) {
  return (
    <div className="rounded-md shadow-xl ring-2 ring-indigo-400 overflow-hidden" style={{ minWidth: 240, opacity: 0.95 }}>
      <BlockPreview block={block} />
    </div>
  );
}

// ─── Sortable Scene Canvas ─────────────────────────────────────────────

export function SortableCanvas({
  onBlockContextMenu,
}: {
  onBlockContextMenu?: (e: React.MouseEvent, block: SchemaBlock) => void;
}) {
  const { pages, currentPageIndex, currentLayout, session, recomputeLayout, moveBlock } = useCanvaStore();
  const page = pages[currentPageIndex];

  // Inline editing state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  // DnD state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeBlock, setActiveBlock] = useState<SchemaBlock | null>(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Block IDs for SortableContext
  const blockIds = useMemo(() => {
    if (!page?.schema) return [];
    return page.schema.blocks.map(b => b.id);
  }, [page?.schema?.blocks]);

  // Find a block by ID
  const findBlock = useCallback((id: UniqueIdentifier): SchemaBlock | undefined => {
    if (!page?.schema) return undefined;
    return page.schema.blocks.find(b => b.id === id);
  }, [page?.schema]);

  // ─── Double-click to edit ──────────────────────────────────────────

  const handleDoubleClick = useCallback((blockId: string) => {
    setEditingBlockId(blockId);
  }, []);

  const handleStopEdit = useCallback(() => {
    setEditingBlockId(null);
  }, []);

  // ─── Drag Handlers ──────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    const block = findBlock(active.id);
    setActiveBlock(block ?? null);
  }, [findBlock]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveBlock(null);

    if (!over || active.id === over.id) return;
    if (!page?.schema) return;

    const oldIndex = page.schema.blocks.findIndex(b => b.id === active.id);
    const newIndex = page.schema.blocks.findIndex(b => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const from: ContainerRef = { type: 'root' };
    const to: ContainerRef = { type: 'root' };

    moveBlock(page.schema.blocks[oldIndex].id, from, to, newIndex);
  }, [page?.schema, moveBlock]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveBlock(null);
  }, []);

  // ─── Layout ─────────────────────────────────────────────────────────

  React.useEffect(() => {
    recomputeLayout();
  }, [currentPageIndex, pages, recomputeLayout]);

  // ─── Render ─────────────────────────────────────────────────────────

  if (!page?.schema) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">Tidak ada halaman</div>
      </div>
    );
  }

  const overflow = currentLayout?.overflow;
  const totalHeight = currentLayout?.totalHeight ?? 0;
  const usedPercent = Math.min(100, Math.round((totalHeight / SCENE_MAX_HEIGHT) * 100));

  return (
    <div className="flex-1 bg-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* Scene frame */}
      <div className="bg-white rounded-lg shadow-lg flex flex-col" style={{ width: 720 * 0.6, height: 405 * 0.6 }}>
        {/* Header bar */}
        <div className="h-2.5 bg-indigo-50 rounded-t-lg flex items-center justify-between px-2">
          <span className="text-[6px] text-indigo-400 font-medium">{page.schema.meta?.title ?? 'Untitled'}</span>
          <div className="flex items-center gap-1">
            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usedPercent > 90 ? 'bg-red-400' : usedPercent > 70 ? 'bg-amber-400' : 'bg-indigo-300'
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <span className="text-[5px] text-slate-300">{usedPercent}%</span>
          </div>
        </div>

        {/* Content area with DnD context */}
        <div className="flex-1 p-1.5 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {page.schema.blocks.map(block => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    editingBlockId={editingBlockId}
                    onDoubleClick={handleDoubleClick}
                    onStopEdit={handleStopEdit}
                    onContextMenu={onBlockContextMenu}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay dropAnimation={null}>
              {activeId && activeBlock ? (
                <DragOverlayBlock block={activeBlock} />
              ) : null}
            </DragOverlay>
          </DndContext>

          {page.schema.blocks.length === 0 && (
            <div className="h-full flex items-center justify-center border border-dashed border-slate-300 rounded-md">
              <span className="text-[10px] text-slate-400">+ Sisipkan block</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {overflow?.hasOverflow ? (
          <div className="h-4 bg-red-500/90 flex items-center justify-center text-[7px] text-white rounded-b-lg">
            Overflow! {totalHeight}px / {SCENE_MAX_HEIGHT}px
          </div>
        ) : (
          <div className="h-3 bg-slate-50 rounded-b-lg flex items-center justify-center">
            <span className="text-[6px] text-slate-300">{totalHeight} / {SCENE_MAX_HEIGHT}px</span>
          </div>
        )}
      </div>

      {/* Page counter */}
      <div className="absolute bottom-2 left-2 bg-white rounded px-2 py-0.5 border border-slate-200 text-[10px] text-slate-500">
        Hal {currentPageIndex + 1} / {pages.length}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 bg-white rounded px-2 py-0.5 border border-slate-200 text-[10px] text-slate-500">
        {Math.round(session.zoom * 100)}%
      </div>

      {/* Edit mode hint */}
      {editingBlockId && (
        <div className="absolute top-2 right-2 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1 text-[9px] text-indigo-600 shadow-sm">
          Edit mode — Tekan Esc atau klik &quot;Selesai&quot; untuk keluar
        </div>
      )}
    </div>
  );
}
