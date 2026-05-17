'use client';

import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import type { AppMode } from '@/components/canva/types';
import { ToolbarNav } from './toolbar/ToolbarNav';
import { ModeSwitch } from './toolbar/ModeSwitch';
import { PageNavigation } from './toolbar/PageNavigation';
import { ZoomControls } from './toolbar/ZoomControls';
import { QuickActions } from './toolbar/QuickActions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit3, Eye } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TOOLBAR v6 — Decomposed Modern & Clean toolbar
// ═══════════════════════════════════════════════════════════════
// Layout (Left → Right):
//   [← Back] Project Name │ [EDIT] [PREVIEW] [PRESENT] │ ◄ ► 1/5 │
//   ─ │ 🔍75% │ 💾 ⬇ ⌘K
// ═══════════════════════════════════════════════════════════════

export default function Toolbar() {
  const mode = useInteractiveStore((s) => s.mode);
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const label = useCanvaStore((s) => s.pages[s.currentPageIndex]?.label || 'Untitled');
  const pagesLength = useCanvaStore((s) => s.pages.length);
  const appMode = useCanvaStore((s) => s.appMode);
  const setAppMode = useCanvaStore((s) => s.setAppMode);

  const isInteractive = mode === 'interactive';

  // ── Interactive mode toolbar (minimal) ──────────────────
  if (isInteractive) {
    return (
      <div
        className="flex items-center gap-1 px-3 bg-app-surface border-b border-app-border select-none"
        style={{ height: 'var(--semantic-toolbar-height)' }}
      >
        <span className="w-2 h-2 rounded-full bg-app-success pulse-dot" />
        <span className="text-xs font-semibold text-app-success min-w-0 truncate max-w-[140px]">
          {label}
        </span>
        <div className="section-divider h-5 w-px mx-1" />
        <span className="text-[10px] text-app-muted ml-1">
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
      <div
        className="flex items-center gap-1 px-3 bg-app-surface border-b border-app-border select-none"
        style={{ height: 'var(--semantic-toolbar-height)' }}
      >
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
          {currentPageIndex + 1}/{pagesLength}
        </span>
        <div className="flex-1" />
        <Eye size={12} className="text-app-info" />
        <span className="text-[10px] font-semibold text-app-info">Preview</span>
        <span className="text-[10px] text-app-muted ml-1">Esc → Edit</span>
      </div>
    );
  }

  // ── EDIT mode: Full toolbar ─────────────────────────────────
  return (
    <div
      className="flex items-center gap-1 px-3 bg-app-surface border-b border-app-border select-none"
      style={{ height: 'var(--semantic-toolbar-height)' }}
    >
      {/* GROUP 1: Project name + Back */}
      <ToolbarNav />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 2: Mode Switch — Pill toggle */}
      <ModeSwitch appMode={appMode} setAppMode={setAppMode} />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 3: Page Navigation */}
      <PageNavigation />

      <div className="section-divider h-5 w-px mx-1" />

      {/* GROUP 4: Zoom Controls */}
      <ZoomControls />

      <div className="flex-1" />

      {/* GROUP 5: Save, Export, Command palette */}
      <QuickActions />
    </div>
  );
}
