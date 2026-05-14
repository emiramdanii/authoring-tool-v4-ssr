'use client';

import { useState, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { patchHistory } from '@/core/editor/patch-history';
import { showUndoRedoToast } from '@/components/shared/StatusToast';
import {
  Play,
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  PlusCircle,
  Store,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import TemplateMarketplace from '@/components/canva/TemplateMarketplace';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR ACTIONS — Play, Tambah, Template, Undo/Redo, Tools
// ═══════════════════════════════════════════════════════════════════
// Core actions group. Handles the most frequently used actions:
// Play/Preview, Add Block, Template Marketplace, Undo/Redo,
// and the Select/Text tool selector.
// ═══════════════════════════════════════════════════════════════════

export function ToolbarActions() {
  const tool = useCanvaStore((s) => s.tool);
  const setTool = useCanvaStore((s) => s.setTool);
  const undo = useCanvaStore((s) => s.undo);
  const redo = useCanvaStore((s) => s.redo);

  // Reactive undo/redo — checks BOTH snapshot history AND patch history
  const snapshotCanUndo = useCanvaStore((s) => s._historyIdx > 0);
  const snapshotCanRedo = useCanvaStore((s) => s._historyIdx < s._history.length - 1);

  // Subscribe to PatchHistory state changes
  const [patchHistoryState, setPatchHistoryState] = useState(() => patchHistory.getState());
  useEffect(() => {
    return patchHistory.subscribe(() => setPatchHistoryState(patchHistory.getState()));
  }, []);

  const canUndo = snapshotCanUndo || patchHistoryState.canUndo;
  const canRedo = snapshotCanRedo || patchHistoryState.canRedo;

  const openPlay = useInteractiveStore((s) => s.openPlay);

  const canvasPreview = useCanvaStore((s) => s.canvasPreview);
  const toggleCanvasPreview = useCanvaStore((s) => s.toggleCanvasPreview);

  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  // Open Add Block panel
  const openAddBlock = () => {
    const state = useCanvaStore.getState();
    if (!state.leftPanelOpen) {
      useCanvaStore.setState({ leftPanelOpen: true });
    }
    state.setLeftTab('sisipkan');
  };

  return (
    <div className="flex items-center gap-1" data-tour="toolbar">
      {/* ▶ Play — PRIMARY action, most prominent button */}
      <Button
        onClick={openPlay}
        title="Preview Interaktif — Preview dengan kuis, game, dan skor"
        data-tour="play-button"
        className="focus-ring text-emerald-400 border-emerald-500/25 bg-emerald-500/15 hover:bg-emerald-500/25 hover:border-emerald-500/40 font-bold h-7 px-3 gap-1.5 shadow-sm shadow-emerald-500/10"
      >
        <Play size={14} fill="currentColor" />
        <span className="text-[11px]">Play</span>
      </Button>

      {/* 👁 Quick Preview — toggle canvas preview (no overlays, student view) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={toggleCanvasPreview}
            className={`focus-ring gap-1.5 h-7 px-2.5 transition-all ${
              canvasPreview
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-app-elevated text-app-secondary border-app-border/50 hover:bg-app-elevated/60'
            }`}
            title={canvasPreview ? 'Kembali ke Edit (Esc)' : 'Preview — Lihat tampilan siswa'}
          >
            {canvasPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span className="hidden sm:inline text-[10px] font-semibold">
              {canvasPreview ? 'Edit' : 'Preview'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          {canvasPreview ? 'Kembali ke mode edit' : 'Preview — tampilan siswa tanpa overlay'}
        </TooltipContent>
      </Tooltip>

      {/* ✨ AI — Open AI Content Assistant */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={() => {
              // Open right panel if closed, then expand AI section
              const state = useCanvaStore.getState();
              if (!state.rightPanelOpen) {
                useCanvaStore.setState({ rightPanelOpen: true });
              }
              window.dispatchEvent(new CustomEvent('open-ai-assistant'));
            }}
            className="focus-ring gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800 h-7 px-2.5"
            title="AI Content Assistant (Ctrl+I)"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[10px] font-semibold">AI</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          AI Content Assistant (Ctrl+I)
        </TooltipContent>
      </Tooltip>

      {/* + Tambah — opens Add Block panel */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={openAddBlock}
            className="focus-ring text-app-accent border-app-accent/20 bg-app-accent/8 hover:bg-app-accent/15 hover:border-app-accent/30 gap-1 h-7 px-2.5"
          >
            <PlusCircle size={14} />
            <span className="hidden sm:inline text-[10px] font-semibold">Tambah</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Tambah block ke halaman
        </TooltipContent>
      </Tooltip>

      {/* Template Marketplace — icon only with tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMarketplaceOpen(true)}
            className="focus-ring text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 h-7 w-7"
          >
            <Store size={13} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Template Marketplace — Pilih template siap pakai
        </TooltipContent>
      </Tooltip>

      <div className="section-divider h-4 w-px mx-0.5" />

      {/* Undo / Redo — icon only */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { undo(); showUndoRedoToast('↩ Undo'); }}
            disabled={!canUndo}
            className={`focus-ring h-7 w-7 ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Undo2 size={13} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Undo (Ctrl+Z)
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { redo(); showUndoRedoToast('↪ Redo'); }}
            disabled={!canRedo}
            className={`focus-ring h-7 w-7 ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Redo2 size={13} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Redo (Ctrl+Y)
        </TooltipContent>
      </Tooltip>

      <div className="section-divider h-4 w-px mx-0.5" />

      {/* Tool selector — compact icon-only buttons */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTool('select')}
            className={`focus-ring h-7 w-7 ${tool === 'select' ? 'nav-active' : ''}`}
          >
            <MousePointer2 size={13} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Select (V)
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTool('text')}
            className={`focus-ring h-7 w-7 ${tool === 'text' ? 'nav-active' : ''}`}
          >
            <Type size={13} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Text (T)
        </TooltipContent>
      </Tooltip>

      {/* Template Marketplace Overlay */}
      <TemplateMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
      />
    </div>
  );
}
