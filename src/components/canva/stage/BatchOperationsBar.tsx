'use client';

// ═══════════════════════════════════════════════════════════════════
// BATCH OPERATIONS BAR — Appears when multiple blocks are selected
// ═══════════════════════════════════════════════════════════════════
// Shows at the top of the canvas when selectedBlockIds.length > 1.
// Provides quick batch actions:
//   - Delete all selected blocks
//   - Change variant (A/B/C) for all selected
//   - Clear selection
//
// TEACHER MODE: Uses simplified terminology.
// ═══════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { Trash2, X, Palette, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BatchOperationsBar() {
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const deleteSchemaBlocks = useCanvaStore(s => s.deleteSchemaBlocks);
  const batchSetVariant = useCanvaStore(s => s.batchSetVariant);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';

  const count = selectedBlockIds.length;

  const handleDeleteAll = useCallback(() => {
    if (count === 0) return;
    deleteSchemaBlocks(selectedBlockIds);
  }, [count, selectedBlockIds, deleteSchemaBlocks]);

  const handleSetVariant = useCallback((variant: 'A' | 'B' | 'C') => {
    if (count === 0) return;
    batchSetVariant(selectedBlockIds, variant);
  }, [count, selectedBlockIds, batchSetVariant]);

  const handleClearSelection = useCallback(() => {
    selectBlock(null);
  }, [selectBlock]);

  // Don't render if less than 2 blocks selected
  if (count < 2) return null;

  const blockLabel = isSederhana ? 'konten' : 'block';

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 backdrop-blur-md shadow-lg shadow-amber-500/5">
      {/* Selection count */}
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={12} className="text-amber-400" />
        <span className="text-[10px] font-bold text-amber-300">
          {count} {blockLabel} dipilih
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-amber-500/20" />

      {/* Variant buttons */}
      <div className="flex items-center gap-1">
        <Palette size={10} className="text-app-muted" />
        {(['A', 'B', 'C'] as const).map(v => (
          <button
            key={v}
            onClick={() => handleSetVariant(v)}
            className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-app-border/30 bg-app-elevated/40 text-app-secondary hover:text-app-accent hover:border-app-accent/30 transition-all"
          >
            V{v}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-amber-500/20" />

      {/* Delete button */}
      <button
        onClick={handleDeleteAll}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all"
      >
        <Trash2 size={10} />
        Hapus
      </button>

      {/* Clear selection button */}
      <button
        onClick={handleClearSelection}
        className="flex items-center justify-center p-1 rounded-md text-app-muted hover:text-app-primary hover:bg-app-elevated/60 transition-colors"
        title="Batal pilih"
      >
        <X size={12} />
      </button>
    </div>
  );
}
