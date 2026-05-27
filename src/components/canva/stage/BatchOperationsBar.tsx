'use client';

// ═══════════════════════════════════════════════════════════════════
// BATCH OPERATIONS BAR — Appears when multiple blocks are selected
// ═══════════════════════════════════════════════════════════════════
// Shows at the top of the canvas when selectedBlockIds.length > 1.
// Provides quick batch actions:
//   - Move up / Move down
//   - Duplicate all selected
//   - Change variant (A/B/C) for all selected
//   - Set compression priority (high/medium/low)
//   - Delete all selected blocks
//   - Clear selection
//
// ENHANCED (Phase F.3): Added move, duplicate, compression priority.
// TEACHER MODE: Uses simplified terminology.
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import {
  Trash2,
  X,
  Palette,
  CheckCircle2,
  Copy,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BatchOperationsBar() {
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const deleteSchemaBlocks = useCanvaStore(s => s.deleteSchemaBlocks);
  const batchSetVariant = useCanvaStore(s => s.batchSetVariant);
  const batchDuplicateBlocks = useCanvaStore(s => s.batchDuplicateBlocks);
  const batchMoveBlocks = useCanvaStore(s => s.batchMoveBlocks);
  const batchToggleCompression = useCanvaStore(s => s.batchToggleCompression);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';

  const [showMore, setShowMore] = useState(false);

  const count = selectedBlockIds.length;

  const handleDeleteAll = useCallback(() => {
    if (count === 0) return;
    deleteSchemaBlocks(selectedBlockIds);
  }, [count, selectedBlockIds, deleteSchemaBlocks]);

  const handleDuplicate = useCallback(() => {
    if (count === 0) return;
    batchDuplicateBlocks(selectedBlockIds);
  }, [count, selectedBlockIds, batchDuplicateBlocks]);

  const handleMoveUp = useCallback(() => {
    if (count === 0) return;
    batchMoveBlocks(selectedBlockIds, -1);
  }, [count, selectedBlockIds, batchMoveBlocks]);

  const handleMoveDown = useCallback(() => {
    if (count === 0) return;
    batchMoveBlocks(selectedBlockIds, 1);
  }, [count, selectedBlockIds, batchMoveBlocks]);

  const handleSetVariant = useCallback((variant: 'A' | 'B' | 'C') => {
    if (count === 0) return;
    batchSetVariant(selectedBlockIds, variant);
  }, [count, selectedBlockIds, batchSetVariant]);

  const handleSetCompression = useCallback((priority: 'high' | 'medium' | 'low') => {
    if (count === 0) return;
    batchToggleCompression(selectedBlockIds, priority);
  }, [count, selectedBlockIds, batchToggleCompression]);

  const handleClearSelection = useCallback(() => {
    selectBlock(null);
  }, [selectBlock]);

  // Don't render if less than 2 blocks selected
  if (count < 2) return null;

  const blockLabel = isSederhana ? 'konten' : 'block';

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1">
      {/* Main bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 backdrop-blur-md shadow-lg shadow-amber-500/5">
        {/* Selection count */}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-300">
            {count} {blockLabel} dipilih
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-amber-500/20" />

        {/* Move up/down */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleMoveUp}
            className="p-1 rounded-md text-app-muted hover:text-app-accent hover:bg-app-elevated/60 transition-colors"
            title="Pindah atas"
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={handleMoveDown}
            className="p-1 rounded-md text-app-muted hover:text-app-accent hover:bg-app-elevated/60 transition-colors"
            title="Pindah bawah"
          >
            <ChevronDown size={12} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-amber-500/20" />

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-[background-color,border-color]"
          title="Duplikasi semua yang dipilih"
        >
          <Copy size={10} />
          Duplikat
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-amber-500/20" />

        {/* Variant buttons */}
        <div className="flex items-center gap-1">
          <Palette size={10} className="text-app-muted" />
          {(['A', 'B', 'C'] as const).map(v => (
            <button
              key={v}
              onClick={() => handleSetVariant(v)}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-app-border/30 bg-app-elevated/40 text-app-secondary hover:text-app-accent hover:border-app-accent/30 transition-[background-color,border-color]"
            >
              V{v}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-amber-500/20" />

        {/* More actions toggle */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`p-1 rounded-md transition-colors ${showMore ? 'text-amber-400 bg-amber-500/10' : 'text-app-muted hover:text-app-primary hover:bg-app-elevated/60'}`}
          title="Tindakan lainnya"
        >
          <Layers size={12} />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDeleteAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-[background-color,border-color]"
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

      {/* Expanded actions row */}
      {showMore && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/15 backdrop-blur-md shadow-lg shadow-amber-500/5">
          {/* Compression priority */}
          <div className="flex items-center gap-1">
            <Minimize2 size={10} className="text-app-muted" />
            <span className="text-[8px] text-app-muted font-semibold">Prioritas:</span>
            <button
              onClick={() => handleSetCompression('high')}
              className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-amber-500/20 bg-amber-500/5 text-amber-300 hover:bg-amber-500/15 transition-[background-color,border-color]"
            >
              <Maximize2 size={8} className="inline mr-0.5" />
              Tinggi
            </button>
            <button
              onClick={() => handleSetCompression('medium')}
              className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-sky-500/20 bg-sky-500/5 text-sky-300 hover:bg-sky-500/15 transition-[background-color,border-color]"
            >
              Sedang
            </button>
            <button
              onClick={() => handleSetCompression('low')}
              className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/15 transition-[background-color,border-color]"
            >
              <Minimize2 size={8} className="inline mr-0.5" />
              Rendah
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-amber-500/15" />

          {/* Hint */}
          <span className="text-[7px] text-app-muted">
            Prioritas kompresi mengatur block mana yang dipangkas saat halaman penuh
          </span>
        </div>
      )}
    </div>
  );
}
