/**
 * SILSE — Overflow Dialog
 * Shown when adding a block would exceed the scene's height capacity.
 * Offers three options: compact variant, split to new page, or add anyway.
 *
 * Task #4: UI-triggered schema operations.
 */

'use client';

import React, { useMemo } from 'react';
import { useCanvaStore } from '../../../store/canva-store';
import type { OverflowCheckResult } from '../../../core/schema/transaction';
import { estimateBlockHeight } from '../../../core/schema/transaction';

interface OverflowDialogProps {
  overflow: OverflowCheckResult;
  /** The block type that caused the overflow */
  pendingBlockType?: string;
  /** Estimated height of the pending block */
  pendingBlockHeight?: number;
  onClose: () => void;
}

export function OverflowDialog({
  overflow,
  pendingBlockType,
  pendingBlockHeight,
  onClose,
}: OverflowDialogProps) {
  const { batchSetVariant, splitPageAtBlock, pages, currentPageIndex } = useCanvaStore();

  const currentPage = pages[currentPageIndex];
  const schema = currentPage?.schema;

  // Find blocks that can be compacted
  const compactableBlocks = useMemo(() => {
    if (!schema) return [];
    return schema.blocks
      .filter(b => b.variant === 'A' || b.variant === 'B')
      .map(b => ({
        id: b.id ?? '',
        type: b.type,
        currentVariant: b.variant ?? 'A',
        currentHeight: estimateBlockHeight(b),
        compactHeight: estimateBlockHeight({ ...b, variant: (b.variant === 'A' ? 'B' : 'C') as 'A' | 'B' | 'C' }),
        savings: estimateBlockHeight(b) - estimateBlockHeight({ ...b, variant: (b.variant === 'A' ? 'B' : 'C') as 'A' | 'B' | 'C' }),
      }))
      .sort((a, b) => b.savings - a.savings);
  }, [schema]);

  // Find the best split point
  const splitIndex = useMemo(() => {
    if (!schema) return -1;
    let cumulativeHeight = 0;
    for (let i = 0; i < schema.blocks.length; i++) {
      cumulativeHeight += estimateBlockHeight(schema.blocks[i]);
      if (cumulativeHeight > overflow.maxHeight / 2) {
        return i + 1; // Split after this block
      }
    }
    return -1;
  }, [schema, overflow]);

  const handleCompact = () => {
    if (!schema) return;
    // Compact the block with the most savings
    const best = compactableBlocks[0];
    if (best) {
      const newVariant = best.currentVariant === 'A' ? 'B' as const : 'C' as const;
      batchSetVariant([best.id], newVariant);
    }
    onClose();
  };

  const handleSplit = () => {
    if (splitIndex > 0 && schema) {
      // Find the block at the split index and split after it
      const splitBlockId = schema.blocks[splitIndex - 1]?.id;
      if (splitBlockId) {
        splitPageAtBlock(splitBlockId);
      }
    }
    onClose();
  };

  const handleAddAnyway = () => {
    // Just close — the block was already added by the transaction
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-[400px] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Halaman hampir penuh</h3>
          <p className="text-xs text-slate-500 mt-1">
            {pendingBlockType
              ? `Menambah "${pendingBlockType}" (${pendingBlockHeight}px) melebihi sisa ruang (${Math.abs(overflow.remainingSpace)}px over).`
              : `Konten melebihi kapasitas halaman (${overflow.totalHeight}px / ${overflow.maxHeight}px).`
            }
          </p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {/* Option 1: Compact */}
          {compactableBlocks.length > 0 && (
            <button
              onClick={handleCompact}
              className="w-full text-left p-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <div className="text-xs font-medium text-indigo-700 flex items-center gap-1.5">
                <span>⬇</span> Pakai Variant Compact
              </div>
              <div className="text-[10px] text-indigo-600/70 mt-0.5">
                Hemat ~{compactableBlocks[0].savings}px dari &quot;{compactableBlocks[0].type}&quot;
                ({compactableBlocks[0].currentVariant} → {compactableBlocks[0].currentVariant === 'A' ? 'B' : 'C'})
              </div>
            </button>
          )}

          {/* Option 2: Split */}
          {splitIndex > 0 && (
            <button
              onClick={handleSplit}
              className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <span>📄</span> Buat halaman baru & pindah block
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Split setelah block ke-{splitIndex}. Halaman baru dibuat otomatis.
              </div>
            </button>
          )}

          {/* Option 3: Add anyway */}
          <button
            onClick={handleAddAnyway}
            className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="text-xs text-slate-500">Tetap tambah (konten mungkin terpotong)</div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
