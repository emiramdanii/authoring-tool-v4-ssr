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
// All icons migrated to Material Symbols Outlined
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
  const isSederhana = teacherMode;

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
          <span className="material-symbols-outlined text-amber-400" style={{ fontSize: '12px' }}>check_circle</span>
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
            className="p-1 rounded-md text-silse-on-surface-variant hover:text-silse-primary hover:bg-silse-surface-container-low/60 transition-colors"
            title="Pindah atas"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_less</span>
          </button>
          <button
            onClick={handleMoveDown}
            className="p-1 rounded-md text-silse-on-surface-variant hover:text-silse-primary hover:bg-silse-surface-container-low/60 transition-colors"
            title="Pindah bawah"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>expand_more</span>
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
          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>content_copy</span>
          Duplikat
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-amber-500/20" />

        {/* Variant buttons */}
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-silse-on-surface-variant" style={{ fontSize: '10px' }}>palette</span>
          {(['A', 'B', 'C'] as const).map(v => (
            <button
              key={v}
              onClick={() => handleSetVariant(v)}
              className="px-2 py-0.5 rounded-md text-[9px] font-bold border border-silse-outline-variant/30 bg-silse-surface-container-low/40 text-silse-on-surface-variant hover:text-silse-primary hover:border-silse-primary/30 transition-[background-color,border-color]"
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
          className={`p-1 rounded-md transition-colors ${showMore ? 'text-amber-400 bg-amber-500/10' : 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-low/60'}`}
          title="Tindakan lainnya"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>layers</span>
        </button>

        {/* Delete button */}
        <button
          onClick={handleDeleteAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-[background-color,border-color]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>delete</span>
          Hapus
        </button>

        {/* Clear selection button */}
        <button
          onClick={handleClearSelection}
          className="flex items-center justify-center p-1 rounded-md text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-low/60 transition-colors"
          title="Batal pilih"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
        </button>
      </div>

      {/* Expanded actions row */}
      {showMore && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/15 backdrop-blur-md shadow-lg shadow-amber-500/5">
          {/* Compression priority */}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-silse-on-surface-variant" style={{ fontSize: '10px' }}>close_fullscreen</span>
            <span className="text-[8px] text-silse-on-surface-variant font-semibold">Prioritas:</span>
            <button
              onClick={() => handleSetCompression('high')}
              className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border border-amber-500/20 bg-amber-500/5 text-amber-300 hover:bg-amber-500/15 transition-[background-color,border-color]"
            >
              <span className="material-symbols-outlined inline mr-0.5" style={{ fontSize: '8px' }}>open_in_full</span>
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
              <span className="material-symbols-outlined inline mr-0.5" style={{ fontSize: '8px' }}>close_fullscreen</span>
              Rendah
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-amber-500/15" />

          {/* Hint */}
          <span className="text-[7px] text-silse-on-surface-variant">
            Prioritas kompresi mengatur block mana yang dipangkas saat halaman penuh
          </span>
        </div>
      )}
    </div>
  );
}
