'use client';

// ═══════════════════════════════════════════════════════════════════
// BATCH ACTION BAR — Floating toolbar for multi-selected blocks
// ═══════════════════════════════════════════════════════════════════
// Appears when multiple schema blocks are selected on the canvas.
// Provides batch operations: delete, change variant, duplicate,
// move to page, toggle compression.
//
// The bar floats at the bottom of the canvas stage.
// Supports keyboard shortcut: Escape to deselect all.
//
// TEACHER MODE: In 'sederhana' mode, simpler labels and fewer options.
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import {
  Trash2,
  Copy,
  LayoutTemplate,
  ArrowRightLeft,
  Minimize2,
  Maximize2,
  X,
  CheckSquare,
  Layers,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';

export default function BatchActionBar() {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;

  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const deleteSchemaBlocks = useCanvaStore(s => s.deleteSchemaBlocks);
  const batchSetVariant = useCanvaStore(s => s.batchSetVariant);
  const batchDuplicateBlocks = useCanvaStore(s => s.batchDuplicateBlocks);
  const batchToggleCompression = useCanvaStore(s => s.batchToggleCompression);
  const selectBlock = useCanvaStore(s => s.selectBlock);

  const page = pages[currentPageIndex];

  // Don't render if no multi-selection
  if (!page || selectedBlockIds.length < 2) return null;

  // Get selected block info
  const selectedBlocks = useMemo(() => {
    const schema = ensurePageSchema(page);
    if (!schema) return [];
    return schema.blocks
      .filter(b => selectedBlockIds.includes(b.id || ''))
      .map(b => ({ id: b.id || '', type: b.type, name: getBlockDefinition(b.type)?.name || b.type }));
  }, [page, selectedBlockIds]);

  // ── Batch Delete ──────────────────────────────────────
  const handleBatchDelete = useCallback(() => {
    if (selectedBlockIds.length === 0) return;
    if (confirm(`Hapus ${selectedBlockIds.length} ${isSederhana ? 'konten' : 'block'} yang dipilih?`)) {
      deleteSchemaBlocks(selectedBlockIds);
    }
  }, [selectedBlockIds, deleteSchemaBlocks, isSederhana]);

  // ── Batch Set Variant ─────────────────────────────────
  const handleBatchVariant = useCallback((variant: 'A' | 'B' | 'C') => {
    batchSetVariant(selectedBlockIds, variant);
    toast.success(`${selectedBlockIds.length} ${isSederhana ? 'konten' : 'block'} diubah ke Variant ${variant}`);
  }, [selectedBlockIds, batchSetVariant, isSederhana]);

  // ── Batch Duplicate ───────────────────────────────────
  const handleBatchDuplicate = useCallback(() => {
    batchDuplicateBlocks(selectedBlockIds);
  }, [selectedBlockIds, batchDuplicateBlocks]);

  // ── Batch Toggle Compression ──────────────────────────
  const handleBatchToggleCompression = useCallback(() => {
    batchToggleCompression(selectedBlockIds, 'high');
    toast.success(`${selectedBlockIds.length} ${isSederhana ? 'konten' : 'block'} compression diatur ke high`);
  }, [selectedBlockIds, batchToggleCompression, isSederhana]);

  // ── Clear Selection ───────────────────────────────────
  const handleClearSelection = useCallback(() => {
    selectBlock(null, null, false);
  }, [selectBlock]);

  const blockLabel = isSederhana ? 'konten' : 'block';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-app-surface/95 backdrop-blur-sm border border-app-border shadow-2xl">
        {/* Selection count */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-app-border/30 mr-1">
          <CheckSquare size={12} className="text-app-accent" />
          <span className="text-[10px] font-bold text-app-accent">
            {selectedBlockIds.length}
          </span>
          <span className="text-[9px] text-app-muted">
            {blockLabel}
          </span>
        </div>

        {/* Batch actions */}
        <div className="flex items-center gap-1">
          {/* Variant buttons */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-app-border/20 mr-1">
            <span className="text-[7px] text-app-muted uppercase tracking-wider mr-0.5">Var</span>
            {(['A', 'B', 'C'] as const).map(v => (
              <button
                key={v}
                onClick={() => handleBatchVariant(v)}
                className="w-6 h-6 rounded-lg text-[9px] font-bold bg-app-elevated/60 border border-app-border/30 hover:border-app-accent/40 hover:text-app-accent transition-all active:scale-90"
                title={`Set Variant ${v}`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Duplicate */}
          <button
            onClick={handleBatchDuplicate}
            className="p-1.5 rounded-lg text-app-secondary hover:text-app-accent hover:bg-app-accent/10 transition-all active:scale-90"
            title={isSederhana ? 'Duplikat' : 'Duplicate Blocks'}
          >
            <Copy size={14} />
          </button>

          {/* Toggle Compression */}
          <button
            onClick={handleBatchToggleCompression}
            className="p-1.5 rounded-lg text-app-secondary hover:text-app-accent hover:bg-app-accent/10 transition-all active:scale-90"
            title="Toggle Compression"
          >
            <Minimize2 size={14} />
          </button>

          {/* Delete */}
          <button
            onClick={handleBatchDelete}
            className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
            title={isSederhana ? 'Hapus' : 'Delete Blocks'}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-app-border/30 mx-1" />

        {/* Clear selection */}
        <button
          onClick={handleClearSelection}
          className="p-1.5 rounded-lg text-app-muted hover:text-app-primary hover:bg-app-elevated/60 transition-all active:scale-90"
          title="Clear Selection"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
