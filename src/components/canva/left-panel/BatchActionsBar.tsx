'use client';

// ═══════════════════════════════════════════════════════════════════
// BATCH ACTIONS BAR — Multi-select batch operations for schema blocks
// ═══════════════════════════════════════════════════════════════════
// Appears when multiple blocks are selected (selectedBlockIds.length > 1).
// Provides batch operations:
//   - Delete selected blocks
//   - Duplicate selected blocks
//   - Set variant (A/B/C) for all selected blocks
//   - Clear selection
//
// Phase F.3: Batch operations UI
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useState } from 'react';
import {
  Trash2,
  Copy,
  Palette,
  X,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';

export default function BatchActionsBar() {
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const deleteSchemaBlocks = useCanvaStore(s => s.deleteSchemaBlocks);
  const batchDuplicateBlocks = useCanvaStore(s => s.batchDuplicateBlocks);
  const batchSetVariant = useCanvaStore(s => s.batchSetVariant);
  const _pushHistory = useCanvaStore(s => s._pushHistory);
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';

  const [showVariantPicker, setShowVariantPicker] = useState(false);

  // Count must be derived before any early return
  const count = selectedBlockIds?.length ?? 0;

  // ── Batch delete ── (ALL hooks must be declared before any early returns)
  const handleBatchDelete = useCallback(() => {
    _pushHistory();
    deleteSchemaBlocks(selectedBlockIds);
    selectBlock(null);
    toast.success(`${count} ${isSederhana ? 'konten' : 'block'} dihapus`);
  }, [selectedBlockIds, deleteSchemaBlocks, selectBlock, _pushHistory, count, isSederhana]);

  // ── Batch duplicate ──
  const handleBatchDuplicate = useCallback(() => {
    _pushHistory();
    batchDuplicateBlocks(selectedBlockIds);
    selectBlock(null);
    toast.success(`${count} ${isSederhana ? 'konten' : 'block'} diduplikat`);
  }, [selectedBlockIds, batchDuplicateBlocks, selectBlock, _pushHistory, count, isSederhana]);

  // ── Batch set variant ──
  const handleSetVariant = useCallback((variant: 'A' | 'B' | 'C') => {
    _pushHistory();
    batchSetVariant(selectedBlockIds, variant);
    setShowVariantPicker(false);
    toast.success(`Variant ${variant} diterapkan ke ${count} ${isSederhana ? 'konten' : 'block'}`);
  }, [selectedBlockIds, batchSetVariant, _pushHistory, count, isSederhana]);

  // ── Clear selection ──
  const handleClearSelection = useCallback(() => {
    selectBlock(null);
    setShowVariantPicker(false);
  }, [selectBlock]);

  // Don't show bar unless multiple blocks selected (AFTER all hooks)
  if (!selectedBlockIds || selectedBlockIds.length <= 1) return null;

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <CheckSquare size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold text-blue-300">
            {count} {isSederhana ? 'konten' : 'block'} dipilih
          </span>
        </div>
        <button
          onClick={handleClearSelection}
          className="p-0.5 rounded hover:bg-blue-500/20 text-blue-400/60 hover:text-blue-300 transition-colors"
          aria-label="Batal pilih semua"
        >
          <X size={12} />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 px-2 pb-2">
        {/* Duplicate */}
        <button
          onClick={handleBatchDuplicate}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-bold bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:text-app-accent hover:border-app-accent/30 transition-[transform,box-shadow,background-color] active:scale-95"
          title="Duplikat semua yang dipilih"
        >
          <Copy size={10} />
          {isSederhana ? 'Gandakan' : 'Duplikat'}
        </button>

        {/* Variant picker */}
        <div className="relative">
          <button
            onClick={() => setShowVariantPicker(!showVariantPicker)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-bold bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:text-app-accent hover:border-app-accent/30 transition-[transform,box-shadow,background-color] active:scale-95"
            title="Atur tampilan variant"
          >
            <Palette size={10} />
            {isSederhana ? 'Tampilan' : 'Variant'}
          </button>

          {showVariantPicker && (
            <div className="absolute bottom-full left-0 mb-1 bg-app-surface border border-app-border/30 rounded-lg shadow-md p-1.5 flex gap-1 z-10">
              {(['A', 'B', 'C'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => handleSetVariant(v)}
                  className="px-2 py-1 rounded-md text-[9px] font-bold bg-app-elevated/40 border border-app-border/20 text-app-secondary hover:text-app-accent hover:border-app-accent/30 transition-[background-color,border-color,color]"
                >
                  {isSederhana
                    ? v === 'A' ? 'Standar' : v === 'B' ? 'Kompak' : 'Lebar'
                    : `V${v}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete (destructive) */}
        <button
          onClick={handleBatchDelete}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-[transform,box-shadow,background-color] active:scale-95"
          title="Hapus semua yang dipilih"
        >
          <Trash2 size={10} />
          Hapus
        </button>
      </div>

      {/* Hint */}
      <div className="px-3 pb-1.5 text-[7px] text-blue-400/40">
        Shift+klik di layer untuk menambah/pindahkan pilihan
      </div>
    </div>
  );
}
