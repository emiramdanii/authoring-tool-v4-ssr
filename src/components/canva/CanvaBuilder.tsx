'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { getCanvaShortcuts } from '@/core/shortcuts';
import { CanvaAutoSaveSync } from './CanvaAutoSaveSync';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import LeftPanel from './LeftPanel';
import Stage from './stage';
import RightPanel from './right-panel';
import PreviewMode from './PreviewMode';
import PresentMode from './PresentMode';
import { UndoRedoToast } from '@/components/shared/StatusToast';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';
import { useCommandPalette } from '@/components/shared/CommandPalette';
import dynamic from 'next/dynamic';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import CanvaTour from '@/components/shared/CanvaTour';
import { MobileGuard } from '@/components/shared/MobileGuard';
import { ExportSuccessDialog } from '@/components/shared/ExportSuccessDialog';
import { ProfilerWrapper } from '@/components/shared/PerformanceMonitor';

// ═══════════════════════════════════════════════════════════════
// LAZY-LOADED HEAVY COMPONENTS
// ═══════════════════════════════════════════════════════════════
// These components are only loaded when needed, reducing initial
// bundle size. Each has a lightweight fallback.

// PlayOverlay — only needed in interactive/preview mode (already was lazy)
const PlayOverlay = dynamic(() => import('./PlayOverlay'), {
  ssr: false,
  loading: () => null,
});

// CommandPalette — only visible when Cmd+K is pressed
const CommandPalette = dynamic(() => import('@/components/shared/CommandPalette').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// CANVA BUILDER v5 — Mode-aware 3-column layout
// ═══════════════════════════════════════════════════════════════
// Architecture:
//   appMode === 'present'  → PresentMode (fullscreen stage only)
//   appMode === 'preview'  → PreviewMode (stage + floating nav, no panels)
//   appMode === 'edit'     → Full 3-panel layout (ScenePanel | Stage | ContextPanel)
//
// The existing interactive mode (PlayOverlay) still works via
// the interactive store and overlays on top of everything.
// ═══════════════════════════════════════════════════════════════

export default function CanvaBuilder() {
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const leftPanelOpen = useCanvaStore((s) => s.leftPanelOpen);
  const appMode = useCanvaStore((s) => s.appMode);
  const commandPalette = useCommandPalette();

  // ── Export success dialog ───────────────────────────────────
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  useEffect(() => {
    const handler = () => setShowExportSuccess(true);
    window.addEventListener('silse-export-success', handler);
    return () => window.removeEventListener('silse-export-success', handler);
  }, []);

  // NOTE: loadFromStorage() removed from CanvaBuilder mount.
  // Persistence is now handled by:
  // 1. Unified auto-save via useAutoSave() hook (2 000 ms debounce)
  // 2. AuthoringTool initial load via loadFromStorage on first app mount

  // ── Unified auto-save ──────────────────────────────────────
  // Auto-save is now handled by CanvaAutoSaveSync component,
  // which connects the project context to the auto-save hook.

  // ── Sync interactive page total with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── Warn before unload if authoring data is dirty ────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const authDirty = useAuthoringStore.getState().dirty;
      if (authDirty) {
        e.preventDefault();
        e.returnValue = 'Perubahan belum tersimpan. Yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Unified keyboard shortcuts via registry ──────────────────
  // Shortcut definitions are extracted to src/core/shortcuts/canva-shortcuts.ts
  // for maintainability. Dependencies are injected here at registration time.
  useKeyboardShortcuts(
    getCanvaShortcuts({
      getCanvaState: useCanvaStore.getState,
      setCanvaState: useCanvaStore.setState,
      getInteractiveState: useInteractiveStore.getState,
      openAIAssistant: () => {
        const store = useCanvaStore.getState();
        if (!store.rightPanelOpen) {
          useCanvaStore.setState({ rightPanelOpen: true });
        }
        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
      },
    }),
    [],
  );

  // ── Present mode: fullscreen stage only ──────────────────────
  if (appMode === 'present') {
    return (
      <MobileGuard>
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-black text-app-primary">
          <UndoRedoToast />
          <CanvaAutoSaveSync />
          <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
          <PresentMode />
          <PlayOverlay />
          <OfflineIndicator />
        </div>
      </MobileGuard>
    );
  }

  // ── Preview mode: stage + floating nav, no panels ─────────────
  if (appMode === 'preview') {
    return (
      <MobileGuard>
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-app-bg text-app-primary">
          <UndoRedoToast />
          <CanvaAutoSaveSync />
          <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
          <Toolbar />
          <PreviewMode />
          <PlayOverlay />
          <OfflineIndicator />
          <CommandPalette open={commandPalette.open} onClose={commandPalette.closePalette} />
        </div>
      </MobileGuard>
    );
  }

  // ── EDIT mode: Full 3-panel layout ───────────────────────────
  return (
    <MobileGuard>
      <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-app-bg text-app-primary focus-ring" id="main-content">
        <UndoRedoToast />
        <CanvaAutoSaveSync />

        {/* Visually hidden live region for screen reader announcements */}
        <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

        {/* Top Toolbar */}
        <div data-tour="toolbar" role="toolbar" aria-label="Toolbar editor">
          <ProfilerWrapper id="Toolbar">
            <Toolbar />
          </ProfilerWrapper>
        </div>

        {/* Main builder row — 3-column Canva-style layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ minHeight: 0 }}>
          {/* Left Panel — Scene Panel (fixed 240px) */}
          <div
            className={`border-r border-app-border shadow-[1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
              leftPanelOpen ? 'w-[240px]' : 'w-0'
            }`}
            data-tour="left-panel"
            role="complementary"
            aria-label="Panel halaman dan block"
          >
            {leftPanelOpen && (
              <ProfilerWrapper id="LeftPanel">
                <LeftPanel />
              </ProfilerWrapper>
            )}
          </div>

          {/* Stage Canvas Area — flex-1 zoom-to-fit */}
          <div className="flex flex-col flex-1 min-w-0 relative overflow-hidden shadow-[inset_0_0_16px_-8px_rgba(0,0,0,0.2)] bg-app-bg" data-tour="canvas-stage" role="main" aria-label="Area kerja editor">
            <ProfilerWrapper id="Stage">
              <Stage />
            </ProfilerWrapper>
          </div>

          {/* Right Panel — Context Panel (fixed 280px) */}
          <div
            className={`border-l border-app-border shadow-[-1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
              rightPanelOpen ? 'w-[280px]' : 'w-0'
            }`}
            data-tour="right-panel"
            role="complementary"
            aria-label="Panel properti"
          >
            <CanvasErrorBoundary name="RightPanel">
              {rightPanelOpen && (
                <ProfilerWrapper id="RightPanel">
                  <RightPanel />
                </ProfilerWrapper>
              )}
            </CanvasErrorBoundary>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Play Preview Overlay — renders on top of everything */}
        <PlayOverlay />

        {/* Guided Tour — auto-starts on first visit, re-trigger via ? key */}
        <CanvaTour />

        {/* Command Palette (Cmd+K / Ctrl+K) — available from anywhere */}
        <CommandPalette open={commandPalette.open} onClose={commandPalette.closePalette} />

        {/* Offline Indicator — shows sync status in bottom-left */}
        <OfflineIndicator />

        {/* Export Success Dialog */}
        <ExportSuccessDialog open={showExportSuccess} onClose={() => setShowExportSuccess(false)} />
      </div>
    </MobileGuard>
  );
}
