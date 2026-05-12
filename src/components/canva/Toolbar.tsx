'use client';

import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolbarNav } from './toolbar/ToolbarNav';
import { ToolbarActions } from './toolbar/ToolbarActions';
import { ToolbarViewControls } from './toolbar/ToolbarViewControls';
import { ToolbarPanelToggles } from './toolbar/ToolbarPanelToggles';
import { ToolbarHelp } from './toolbar/ToolbarHelp';
import { ToolbarExport } from './toolbar/ToolbarExport';

// ═══════════════════════════════════════════════════════════════
// Toolbar v4 — Thin orchestrator composing focused sub-components
// ═══════════════════════════════════════════════════════════════
// Layout (Left → Right):
//   GROUP 1: Navigation + Page Name + Save Status  (ToolbarNav)
//   GROUP 2: Play + Tambah + Template | Undo/Redo | Tools  (ToolbarActions)
//   GROUP 3: Ratio | Zoom Controls  (ToolbarViewControls)
//   GROUP 4: Panel Toggles  (ToolbarPanelToggles)
//   GROUP 5: Help + Bagikan & Export  (ToolbarHelp + ToolbarExport)
// ═══════════════════════════════════════════════════════════════

export default function Toolbar() {
  const mode = useInteractiveStore((s) => s.mode);
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const pages = useCanvaStore((s) => s.pages);

  const isInteractive = mode === 'interactive';
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  // ── Interactive mode toolbar (minimal) ──────────────────
  if (isInteractive) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">
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
          <X size={12} />
          <span className="hidden sm:inline">Tutup</span>
        </Button>
      </div>
    );
  }

  // ── Design mode toolbar ─────────────────────────────────
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">
      <ToolbarNav />
      <div className="section-divider h-5 w-px mx-1" />
      <ToolbarActions />
      <div className="section-divider h-5 w-px mx-1" />
      <ToolbarViewControls />
      <div className="flex-1" />
      <ToolbarHelp />
      <ToolbarPanelToggles />
      <div className="section-divider h-5 w-px mx-1" />
      <ToolbarExport />
    </div>
  );
}
