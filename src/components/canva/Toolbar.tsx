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
        className="flex items-center gap-1 px-4 bg-silse-surface-container-lowest border-b border-silse-outline-variant select-none"
        style={{ height: '48px' }}
      >
        <span className="w-2 h-2 rounded-full bg-app-success pulse-dot" />
        <span className="text-xs font-semibold text-app-success min-w-0 truncate max-w-[140px]">
          {label}
        </span>
        <div className="h-5 w-px bg-silse-outline-variant mx-1" />
        <span className="text-[10px] text-silse-on-surface-variant ml-1">
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
        className="flex items-center gap-1 px-4 bg-silse-surface-container-lowest border-b border-silse-outline-variant select-none"
        style={{ height: '48px' }}
      >
        <Button
          variant="ghost"
          onClick={() => setAppMode('edit')}
          className="focus-ring text-silse-primary hover:text-silse-primary/80 h-7 px-2 gap-1"
        >
          <Edit3 size={14} />
          <span className="text-[10px] font-semibold">Edit</span>
        </Button>
        <span className="text-xs font-semibold text-silse-on-surface min-w-0 truncate max-w-[120px]">
          {label}
        </span>
        <span className="text-[10px] text-silse-on-surface-variant">
          {currentPageIndex + 1}/{pagesLength}
        </span>
        <div className="flex-1" />
        <Eye size={12} className="text-silse-secondary" />
        <span className="text-[10px] font-semibold text-silse-secondary">Preview</span>
        <span className="text-[10px] text-silse-on-surface-variant ml-1">Esc → Edit</span>
      </div>
    );
  }

  // ── EDIT mode: Full toolbar — SILSE v4 TopAppBar ───────────
  return (
    <div
      className="flex items-center justify-between px-6 bg-silse-surface-container-lowest border-b border-silse-outline-variant select-none"
      style={{ height: '64px' }}
    >
      {/* LEFT: Brand + Project */}
      <div className="flex items-center gap-4">
        <ToolbarNav />
      </div>

      {/* CENTER: Mode Switch */}
      <div className="flex items-center gap-3">
        <ModeSwitch appMode={appMode} setAppMode={setAppMode} />
        <div className="h-5 w-px bg-silse-outline-variant" />
        <PageNavigation />
        <div className="h-5 w-px bg-silse-outline-variant" />
        <ZoomControls />
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-3">
        <QuickActions />
      </div>
    </div>
  );
}
