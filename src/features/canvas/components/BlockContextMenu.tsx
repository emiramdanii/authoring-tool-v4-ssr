/**
 * SILSE — Block Context Menu
 * Right-click context menu for schema blocks.
 * Provides UI triggers for: duplicate, delete, change variant, move.
 *
 * Task #4: UI-triggered schema operations.
 */

'use client';

import React, { useCallback } from 'react';
import type { SchemaBlock, BlockVariant } from '../../../core/schema/types';
import { estimateBlockHeight } from '../../../core/schema/transaction';
import { useCanvaStore } from '../../../store/canva-store';

interface BlockContextMenuProps {
  block: SchemaBlock;
  position: { x: number; y: number };
  onClose: () => void;
}

export function BlockContextMenu({ block, position, onClose }: BlockContextMenuProps) {
  const { deleteBlock, duplicateBlock, batchSetVariant } = useCanvaStore();
  const blockId = block.id ?? '';

  const handleDuplicate = useCallback(() => {
    if (blockId) duplicateBlock(blockId);
    onClose();
  }, [blockId, duplicateBlock, onClose]);

  const handleDelete = useCallback(() => {
    if (blockId) deleteBlock(blockId);
    onClose();
  }, [blockId, deleteBlock, onClose]);

  const handleVariant = useCallback((variant: BlockVariant) => {
    if (blockId) batchSetVariant([blockId], variant);
    onClose();
  }, [blockId, batchSetVariant, onClose]);

  const variantOptions: Array<{ value: BlockVariant; label: string; height: number }> = [
    { value: 'A', label: 'Normal', height: estimateBlockHeight({ ...block, variant: 'A' }) },
    { value: 'B', label: 'Compact', height: estimateBlockHeight({ ...block, variant: 'B' }) },
    { value: 'C', label: 'Minimal', height: estimateBlockHeight({ ...block, variant: 'C' }) },
  ];

  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[200] min-w-[160px]"
      style={{ left: position.x, top: position.y }}
    >
      {/* Variant submenu */}
      <div className="px-3 py-1 text-[9px] text-slate-400 uppercase tracking-wide font-medium">
        Varian
      </div>
      {variantOptions.map(opt => (
        <button
          key={opt.value}
          onClick={() => handleVariant(opt.value)}
          className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center justify-between hover:bg-slate-50 bg-transparent border-none cursor-pointer ${
            block.variant === opt.value ? 'text-indigo-600 font-medium' : 'text-slate-600'
          }`}
        >
          <span>
            {opt.value} — {opt.label}
          </span>
          <span className="text-[9px] text-slate-400">{opt.height}px</span>
        </button>
      ))}

      <div className="h-px bg-slate-100 my-1" />

      {/* Duplicate */}
      <button
        onClick={handleDuplicate}
        className="w-full text-left px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 bg-transparent border-none cursor-pointer"
      >
        Duplikat block
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="w-full text-left px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50 bg-transparent border-none cursor-pointer"
      >
        Hapus block
      </button>
    </div>
  );
}
