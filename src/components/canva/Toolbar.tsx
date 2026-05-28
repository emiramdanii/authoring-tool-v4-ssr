'use client';

import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import { ToolbarNav } from './toolbar/ToolbarNav';
import { useExportActions } from './toolbar/use-export-actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit3, Eye } from 'lucide-react';
import { triggerCanvaTour } from '@/components/shared/CanvaTour';
import { triggerCanvaOrientation } from '@/components/shared/CanvaOrientationTooltip';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

// ═══════════════════════════════════════════════════════════════
// TOOLBAR v7 — SILSE v4 TopAppBar Design
// ═══════════════════════════════════════════════════════════════
// Layout (Left → Right):
//   [← SILSE Authoring | Project Name] | [Dashboard] [Workspace] [Analytics] | [Cloud] [Help] [Preview] [Publish]
// ═══════════════════════════════════════════════════════════════

// ── Navigation Tabs ──────────────────────────────────────────

type NavTab = 'dashboard' | 'workspace' | 'analytics';

function NavTabs() {
  const panelRequest = useCanvaStore((s) => s.panelRequest);

  // Determine active tab from current state
  const activeTab: NavTab = panelRequest === 'dashboard'
    ? 'dashboard'
    : panelRequest === 'analytics'
      ? 'analytics'
      : 'workspace'; // default

  const handleTabClick = (tab: NavTab) => {
    if (tab === 'dashboard') {
      useCanvaStore.setState({ panelRequest: 'dashboard' });
    } else if (tab === 'analytics') {
      useCanvaStore.setState({ panelRequest: 'analytics' });
    } else {
      // Workspace = stay in editor view
      useCanvaStore.setState({ panelRequest: null });
    }
  };

  const tabs: { id: NavTab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <nav className="hidden md:flex gap-8 items-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`text-sm transition-colors ${
            activeTab === tab.id
              ? 'text-silse-primary border-b-2 border-silse-primary pb-1 font-bold'
              : 'text-silse-on-surface-variant hover:text-silse-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

// ── Right Actions ────────────────────────────────────────────

function RightActions() {
  const setAppMode = useCanvaStore((s) => s.setAppMode);
  const { exportHtml, isExporting } = useExportActions();
  const { isSederhana } = useTeacherMode();

  return (
    <div className="flex items-center gap-4">
      {/* Cloud save indicator — green when saved */}
      <button
        className="flex items-center justify-center h-8 w-8 rounded-lg text-silse-on-surface-variant hover:text-silse-primary transition-colors"
        title="Tersimpan di cloud"
      >
        <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: '20px' }}>cloud_done</span>
      </button>

      {/* Help button */}
      <button
        onClick={() => {
          if (isSederhana) {
            triggerCanvaOrientation();
          } else {
            triggerCanvaTour();
          }
        }}
        className="flex items-center justify-center h-8 w-8 rounded-lg text-silse-on-surface-variant hover:text-silse-primary transition-colors"
        title={isSederhana ? 'Bantuan — tampilkan panduan' : 'Help — restart tour'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help_outline</span>
      </button>

      {/* Preview + Publish buttons */}
      <div className="flex gap-2 ml-2">
        <button
          onClick={() => setAppMode('preview')}
          className="px-6 py-2 rounded-full border border-silse-outline-variant text-silse-primary text-sm font-bold hover:bg-silse-surface-container-high transition-colors"
        >
          Preview
        </button>
        <button
          onClick={exportHtml}
          disabled={isExporting}
          className="px-6 py-2 rounded-full bg-silse-primary-container text-silse-on-primary-container text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {/* Teacher Profile Avatar — SILSE v4 reference */}
      <div className="w-8 h-8 rounded-full bg-silse-primary-container border border-silse-outline-variant flex items-center justify-center ml-2">
        <span className="material-symbols-outlined text-silse-on-primary-container" style={{ fontSize: '16px' }}>school</span>
      </div>
    </div>
  );
}

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
    <header
      className="flex items-center justify-between px-6 bg-silse-surface-container-lowest border-b border-silse-outline-variant select-none"
      style={{ height: '64px' }}
    >
      {/* LEFT: Brand + Project */}
      <ToolbarNav />

      {/* CENTER: Navigation Tabs */}
      <NavTabs />

      {/* RIGHT: Cloud + Help + Preview + Publish */}
      <RightActions />
    </header>
  );
}
