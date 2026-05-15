'use client';

import { useState, useEffect, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { patchHistory } from '@/core/editor/patch-history';
import { showUndoRedoToast } from '@/components/shared/StatusToast';
import { AutoSaveIndicator, SaveNowButton } from '@/components/shared/StatusToast';
import {
  Play,
  Undo2,
  Redo2,
  PlusCircle,
  Minus,
  Maximize,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Monitor,
  Presentation,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddBlockPanel from './left-panel/AddBlockPanel';
import { ToolbarExport } from './toolbar/ToolbarExport';
import type { AppMode } from './types';

// ═══════════════════════════════════════════════════════════════
// TOOLBAR v5 — Minimal contextual toolbar with mode switching
// ═══════════════════════════════════════════════════════════════
// Layout (Left → Right):
//   [Logo] | [EDIT] [PREVIEW] [PRESENT] | [< Scene 3/12 >] |
//   [Undo] [Redo] | [Tambah Block] | [Zoom] | [AI] | [Export]
//
// In interactive (play) mode, shows minimal controls.
// In edit mode, shows full toolbar.
// ═══════════════════════════════════════════════════════════════

const RATIOS_LIST = [
  { id: '16:9', name: '16:9', desc: 'Landscape PPT' },
  { id: '9:16', name: '9:16', desc: 'Portrait HP' },
  { id: '1:1', name: '1:1', desc: 'Square Post' },
  { id: 'A4', name: 'A4', desc: 'Dokumen LKS' },
  { id: '4:3', name: '4:3', desc: 'Presentasi Lama' },
] as const;

export default function Toolbar() {
  const mode = useInteractiveStore((s) => s.mode);
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const pages = useCanvaStore((s) => s.pages);
  const appMode = useCanvaStore((s) => s.appMode);
  const setAppMode = useCanvaStore((s) => s.setAppMode);
  const sceneIndex = useCanvaStore((s) => s.sceneIndex);
  const sceneTotal = useCanvaStore((s) => s.sceneTotal);
  const navigateScene = useCanvaStore((s) => s.navigateScene);

  const isInteractive = mode === 'interactive';
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  // ── Interactive mode toolbar (minimal) ──────────────────
  if (isInteractive) {
    return (
      <div className="flex items-center gap-1 px-3 py-2 bg-app-surface border-b border-app-border select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
        <span className="text-xs font-semibold text-emerald-300 min-w-0 truncate max-w-[140px]">
          {label}
        </span>
        <div className="section-divider h-5 w-px mx-1" />
        <span className="text-[10px] text-emerald-400/60 ml-1">
          ← → navigasi • Esc tutup
        </span>
        <div className="flex-1" />
        <Button
          variant="destructive"
          size="sm"
          onClick={closePlay}
          className="focus-ring"
          title="Tutup mode interaktif (Esc)"
        >
          <ChevronLeft size={12} />
          <span className="hidden sm:inline">Tutup</span>
        </Button>
      </div>
    );
  }

  // ── Present mode — no toolbar ────────────────────────
  if (appMode === 'present') {
    return null;
  }

  // ── Preview mode — minimal toolbar ───────────────────────
  if (appMode === 'preview') {
    return (
      <div className="flex items-center gap-1 px-3 py-2 bg-app-surface border-b border-app-border select-none">
        <Button
          variant="ghost"
          onClick={() => setAppMode('edit')}
          className="focus-ring text-app-accent hover:text-app-accent/80 h-7 px-2 gap-1"
        >
          <Edit3 size={14} />
          <span className="text-[10px] font-semibold">Edit</span>
        </Button>
        <span className="text-xs font-semibold text-app-primary min-w-0 truncate max-w-[120px]">
          {label}
        </span>
        <span className="text-[10px] text-app-muted">
          {currentPageIndex + 1}/{pages.length}
        </span>
        <div className="flex-1" />
        <Eye size={12} className="text-cyan-400" />
        <span className="text-[10px] font-semibold text-cyan-400">Preview</span>
        <span className="text-[10px] text-app-muted ml-1">Esc → Edit</span>
      </div>
    );
  }

  // ── EDIT mode: Full toolbar ─────────────────────────────────
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-app-surface border-b border-app-border select-none">
      {/* GROUP 1: Logo + Mode Switch */}
      <div className="flex items-center gap-1">
        <ModeSwitch appMode={appMode} setAppMode={setAppMode} />
      </div>

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 2: Scene Navigation */}
      <SceneNav
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        sceneIndex={sceneIndex}
        sceneTotal={sceneTotal}
        navigateScene={navigateScene}
      />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 3: Undo/Redo */}
      <UndoRedoButtons />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 4: Tambah Block */}
      <TambahBlockButton />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 5: Zoom Controls */}
      <ZoomControls />

      <div className="flex-1" />

      {/* GROUP 6: Auto-save indicator */}
      <AutoSaveIndicator />
      <SaveNowButton />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 7: Export */}
      <ToolbarExport />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MODE SWITCH — [EDIT] [PREVIEW] [PRESENT] toggle buttons
   ══════════════════════════════════════════════════════════════════ */

function ModeSwitch({ appMode, setAppMode }: { appMode: AppMode; setAppMode: (m: AppMode) => void }) {
  const openPlay = useInteractiveStore((s) => s.openPlay);

  const modes: { id: AppMode; label: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <Edit3 size={12} />,
      activeClass: 'bg-app-accent/10 text-app-accent border-app-accent/15',
    },
    {
      id: 'preview',
      label: 'Preview',
      icon: <Eye size={12} />,
      activeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15',
    },
    {
      id: 'present',
      label: 'Present',
      icon: <Presentation size={12} />,
      activeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
    },
  ];

  return (
    <div className="flex items-center gap-0.5">
      {modes.map(m => {
        const isActive = appMode === m.id;
        return (
          <Button
            key={m.id}
            variant="ghost"
            size="sm"
            onClick={() => {
              if (m.id === 'present') {
                // Present mode uses the interactive store's play overlay for interactive features
                // but also supports a simpler "just present" mode via appMode
                setAppMode('present');
              } else {
                setAppMode(m.id);
              }
            }}
            className={`h-7 px-2.5 gap-1 text-[10px] font-bold transition-all rounded-lg border ${
              isActive
                ? m.activeClass
                : 'text-app-muted hover:text-app-secondary border-transparent'
            }`}
          >
            {m.icon}
            <span className="hidden sm:inline">{m.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCENE NAV — [< Scene 3/12 >]
   ══════════════════════════════════════════════════════════════════ */

function SceneNav({
  currentPageIndex,
  totalPages,
  sceneIndex,
  sceneTotal,
  navigateScene,
}: {
  currentPageIndex: number;
  totalPages: number;
  sceneIndex: number;
  sceneTotal: number;
  navigateScene: (idx: number) => void;
}) {
  const goPage = useCanvaStore(s => s.goPage);
  const showSceneNav = sceneTotal > 1;

  return (
    <div className="flex items-center gap-1">
      {/* Page prev */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => currentPageIndex > 0 && goPage(currentPageIndex - 1)}
        disabled={currentPageIndex <= 0}
        className="h-7 w-7 disabled:opacity-30"
        title="Halaman sebelumnya"
      >
        <ChevronLeft size={13} />
      </Button>

      {/* Page counter */}
      <span className="text-[10px] font-bold text-app-primary whitespace-nowrap">
        {currentPageIndex + 1}/{totalPages}
      </span>

      {/* Scene sub-counter (if multi-scene page) */}
      {showSceneNav && (
        <>
          <span className="text-[8px] text-app-muted mx-0.5">•</span>
          <span className="text-[10px] text-emerald-400/70 font-medium">
            Scene {sceneIndex + 1}/{sceneTotal}
          </span>
        </>
      )}

      {/* Page next */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => currentPageIndex < totalPages - 1 && goPage(currentPageIndex + 1)}
        disabled={currentPageIndex >= totalPages - 1}
        className="h-7 w-7 disabled:opacity-30"
        title="Halaman berikutnya"
      >
        <ChevronRight size={13} />
      </Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   UNDO/REDO BUTTONS
   ══════════════════════════════════════════════════════════════════ */

function UndoRedoButtons() {
  const undo = useCanvaStore((s) => s.undo);
  const redo = useCanvaStore((s) => s.redo);

  const snapshotCanUndo = useCanvaStore((s) => s._historyIdx > 0);
  const snapshotCanRedo = useCanvaStore((s) => s._historyIdx < s._history.length - 1);

  const [patchHistoryState, setPatchHistoryState] = useState(() => patchHistory.getState());
  useEffect(() => {
    return patchHistory.subscribe(() => setPatchHistoryState(patchHistory.getState()));
  }, []);

  const canUndo = snapshotCanUndo || patchHistoryState.canUndo;
  const canRedo = snapshotCanRedo || patchHistoryState.canRedo;

  return (
    <div className="flex items-center gap-0.5">
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAMBAH BLOCK BUTTON — Opens a popover with AddBlockPanel content
   ══════════════════════════════════════════════════════════════════ */

function TambahBlockButton() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="focus-ring text-app-accent border-app-accent/20 bg-app-accent/8 hover:bg-app-accent/15 hover:border-app-accent/30 gap-1 h-7 px-2.5"
        >
          <PlusCircle size={14} />
          <span className="hidden sm:inline text-[10px] font-semibold">Tambah</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-72 bg-app-surface border border-app-border shadow-xl rounded-xl p-0 overflow-hidden max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="px-3 py-1.5 bg-teal-500/10 border-b border-teal-500/20 text-[9px] font-bold text-teal-400 uppercase tracking-wider">
          Tambah Block
        </DropdownMenuLabel>
        <div className="p-2">
          <AddBlockPanel />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ZOOM CONTROLS — Ratio badge + zoom in/out/fit
   ══════════════════════════════════════════════════════════════════ */

function ZoomControls() {
  const storeZoom = useCanvaStore((s) => s.zoom);
  const storeFitZoom = useCanvaStore((s) => s.fitZoom);
  const zoomDelta = useCanvaStore((s) => s.zoomDelta);
  const zoomToFit = useCanvaStore((s) => s.zoomToFit);
  const ratioId = useCanvaStore((s) => s.ratioId);
  const setRatio = useCanvaStore((s) => s.setRatio);

  const [ratioOpen, setRatioOpen] = useState(false);
  const ratioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ratioRef.current && !ratioRef.current.contains(e.target as Node)) setRatioOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-0.5">
      {/* Ratio badge — clickable dropdown */}
      <div className="relative" ref={ratioRef}>
        <button
          onClick={() => setRatioOpen(!ratioOpen)}
          className="px-2 py-0.5 rounded-md bg-app-elevated text-app-accent font-mono text-[10px] hover:bg-app-surface transition-colors flex items-center gap-0.5"
          title="Rasio canvas"
        >
          {ratioId}
          <ChevronDown size={8} className={`transition-transform ${ratioOpen ? 'rotate-180' : ''}`} />
        </button>
        {ratioOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 rounded-xl bg-app-surface border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            {RATIOS_LIST.map(r => (
              <button
                key={r.id}
                onClick={() => { setRatio(r.id); setRatioOpen(false); }}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-app-accent/10 transition-colors ${
                  ratioId === r.id ? 'text-app-accent bg-app-accent/5' : 'text-app-secondary'
                }`}
              >
                <span className="text-[11px] font-mono font-bold">{r.name}</span>
                <span className="text-[8px] text-app-muted">{r.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={zoomToFit} className="focus-ring h-7 w-7">
            <Maximize size={12} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px]">
          Fit to screen (Ctrl+0)
        </TooltipContent>
      </Tooltip>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomDelta(-0.1)}
        className="focus-ring h-7 w-7"
        title="Zoom out (Ctrl+-)"
      >
        <Minus size={12} />
      </Button>
      <span
        className="text-[10px] font-mono text-app-secondary w-12 text-center select-none"
        title={storeZoom === -1 ? `Auto-fit (${Math.round(storeFitZoom * 100)}%)` : `${Math.round(storeZoom * 100)}%`}
      >
        {storeZoom === -1 ? `Fit ${Math.round(storeFitZoom * 100)}%` : `${Math.round(storeZoom * 100)}%`}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => zoomDelta(0.1)}
        className="focus-ring h-7 w-7"
        title="Zoom in (Ctrl++)"
      >
        <PlusCircle size={12} />
      </Button>
    </div>
  );
}
