'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { getCanvaShortcuts } from '@/core/shortcuts';
import { setDirtyExitFlag } from '@/components/shared/RecoveryDialog';
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
import { CanvaOrientationTooltip } from '@/components/shared/CanvaOrientationTooltip';

// ═══════════════════════════════════════════════════════════════
// LAZY-LOADED HEAVY COMPONENTS
// ═══════════════════════════════════════════════════════════════

const PlayOverlay = dynamic(() => import('./PlayOverlay'), {
  ssr: false,
  loading: () => null,
});

const CommandPalette = dynamic(() => import('@/components/shared/CommandPalette').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// CANVA BUILDER v6 — Modern & Clean 3-column layout
// ═══════════════════════════════════════════════════════════════
// Architecture:
//   appMode === 'present'  → PresentMode (fullscreen stage only)
//   appMode === 'preview'  → PreviewMode (stage + floating nav, no panels)
//   appMode === 'edit'     → Full 3-panel layout (ScenePanel | Stage | ContextPanel)
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

  // ── Sync interactive page total with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── Warn before unload if unsaved changes exist ────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const authDirty = useAuthoringStore.getState().dirty;
      const canvaUnsaved = useCanvaStore.getState()._saveStatus === 'unsaved';
      if (authDirty || canvaUnsaved) {
        setDirtyExitFlag(); // Set flag so RecoveryDialog can detect dirty exit
        e.preventDefault();
        e.returnValue = 'Perubahan belum tersimpan. Yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Unified keyboard shortcuts via registry ──────────────────
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
      <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-app-bg text-app-primary focus-ring" id="main-content" data-testid="canva-builder">
        <UndoRedoToast />
        <CanvaAutoSaveSync />

        <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

        {/* Top Toolbar */}
        <div data-tour="toolbar" data-testid="toolbar" role="toolbar" aria-label="Toolbar editor">
          <ProfilerWrapper id="Toolbar">
            <Toolbar />
          </ProfilerWrapper>
        </div>

        {/* Main builder row — 3-column Canva-style layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ minHeight: 0 }}>
          {/* Left Panel — Icon Rail + Expandable */}
          <div
            className="flex-shrink-0 overflow-hidden shadow-app-panel"
            style={{
              width: leftPanelOpen
                ? 'var(--semantic-panel-default)'
                : 'var(--semantic-panel-collapsed)',
            }}
            data-tour="left-panel"
            data-testid="left-panel"
            role="complementary"
            aria-label="Panel halaman dan block"
          >
            <ProfilerWrapper id="LeftPanel">
              <LeftPanel />
            </ProfilerWrapper>
          </div>

          {/* Stage Canvas Area — flex-1 zoom-to-fit */}
          <div className="flex flex-col flex-1 min-w-0 relative overflow-hidden bg-app-bg" data-tour="canvas-stage" data-testid="canvas-stage" role="main" aria-label="Area kerja editor">
            <ProfilerWrapper id="Stage">
              <Stage />
            </ProfilerWrapper>
          </div>

          {/* Right Panel — Context Panel */}
          <div
            className="flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out shadow-app-panel-left"
            style={{
              width: rightPanelOpen ? 'var(--semantic-panel-expanded)' : '0px',
            }}
            data-tour="right-panel"
            data-testid="right-panel"
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

        {/* Play Preview Overlay */}
        <PlayOverlay />

        {/* Guided Tour */}
        <CanvaTour />

        {/* Command Palette */}
        <CommandPalette open={commandPalette.open} onClose={commandPalette.closePalette} />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Teacher Orientation Tooltip */}
        <CanvaOrientationTooltip />

        {/* Export Success Dialog */}
        <ExportSuccessDialog open={showExportSuccess} onClose={() => setShowExportSuccess(false)} />
      </div>
    </MobileGuard>
  );
}
