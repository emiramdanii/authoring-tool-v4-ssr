'use client';

// ═══════════════════════════════════════════════════════════════
// LAYER PANEL — Schema block layer list with selection sync
// ═══════════════════════════════════════════════════════════════
// Shows all blocks in the current screen's schema.
// Click to select → opens property panel.
// Hover highlights on canvas. Selection syncs both ways.

import { useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';
import { convertToSchema } from '@/core/engine/TemplateAdapter';
import type { ScreenSchema } from '@/core/schema/types';
import { MousePointer2 } from 'lucide-react';

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

      <div className="space-y-0.5">
        {schema.blocks.map((block, idx) => {
          const blockId = block.id || `${block.type}-${idx}`;
          const definition = getBlockDefinition(block.type);
          const isSelected = selectedBlockId === blockId;
          const isHovered = hoveredBlockId === blockId;
          const isEditing = editingBlockId === blockId;
          const layout = block.layout?.position === 'absolute' ? 'absolute' : 'flow';

          return (
            <button
              key={blockId}
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
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-blue-500/15 border border-blue-500/30 text-blue-200'
                  : isHovered
                    ? 'bg-slate-800/60 border border-slate-700/20 text-slate-300'
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-300'
              }`}
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

              {/* Quick actions (visible on hover/selected) */}
              {isSelected && (
                <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
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
            </button>
          );
        })}
      </div>

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
          Klik = select · Double-klik = inline edit
        </div>
      </div>
    </div>
  );
}
