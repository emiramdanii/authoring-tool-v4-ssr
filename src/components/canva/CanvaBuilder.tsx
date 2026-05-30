'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useDirtyStore } from '@/store/dirty-store';
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
import { isEnabled } from '@/config/feature-flags';
import dynamic from 'next/dynamic';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import CanvaTour from '@/components/shared/CanvaTour';
import { MobileGuard } from '@/components/shared/MobileGuard';
import { ExportSuccessDialog } from '@/components/shared/ExportSuccessDialog';
import { ProfilerWrapper } from '@/components/shared/PerformanceMonitor';
import { CanvaOrientationTooltip } from '@/components/shared/CanvaOrientationTooltip';
import { useHealthMonitor } from '@/hooks/use-health-monitor';
import { SceneTabBar } from './toolbar/SceneTabBar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// ═══════════════════════════════════════════════════════════════
// LAZY-LOADED HEAVY COMPONENTS
// ═══════════════════════════════════════════════════════════════

const PlayOverlay = dynamic(() => import('./PlayOverlay'), {
  ssr: false,
  loading: () => null,
});

const LearningMediaShell = dynamic(() => import('./LearningMediaShell'), {
  ssr: false,
  loading: () => null,
});

const CommandPalette = dynamic(() => import('@/components/shared/CommandPalette').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => null,
});

const LearningMediaShell = dynamic(() => import('./LearningMediaShell'), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// CANVA BUILDER v8 — SILSE v4 Resizable Panel Layout
// ═══════════════════════════════════════════════════════════════
// Architecture:
//   appMode === 'learn'    → LearningMediaShell (student-facing, screen nav, score)
//   appMode === 'present'  → PresentMode (fullscreen stage only)
//   appMode === 'preview'  → PreviewMode (stage + floating nav, no panels)
//   appMode === 'edit'     → Fixed header (h-16) + resizable 3-panel
//     [Fixed Toolbar h-16]
//     [Resizable: Left 20% | Stage auto | Right 25%]
//     [SceneTabBar + StatusBar]
// Panel persistence: sizes stored in canva-store for session continuity
// ═══════════════════════════════════════════════════════════════

export default function CanvaBuilder() {
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const appMode = useCanvaStore((s) => s.appMode);
  const commandPalette = useCommandPalette();

  // ── Export success dialog ───────────────────────────────────
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  useEffect(() => {
    const handler = () => setShowExportSuccess(true);
    window.addEventListener('silse-export-success', handler);
    return () => window.removeEventListener('silse-export-success', handler);
  }, []);

  // ── FASE 8: Periodic health monitor ──────────────────────────
  useHealthMonitor();

  // ── Sync interactive page total with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── Warn before unload if unsaved changes exist ────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const authDirty = useDirtyStore.getState().dirty;
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
        if (!isEnabled('aiAssistant')) return;
        const store = useCanvaStore.getState();
        if (!store.rightPanelOpen) {
          useCanvaStore.setState({ rightPanelOpen: true });
        }
        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
      },
    }),
    [],
  );

  // ── Learn mode: student-facing interactive learning ──────────
  if (appMode === 'learn') {
    return (
      <MobileGuard>
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-slate-100 text-slate-800">
          <UndoRedoToast />
          <CanvaAutoSaveSync />
          <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
          <LearningMediaShell />
          <OfflineIndicator />
        </div>
      </MobileGuard>
    );
  }

  // ── Present mode: fullscreen stage only ──────────────────────
  if (appMode === 'present') {
    return (
      <MobileGuard>
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-black text-[#191c1e]">
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
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-silse-surface-bright text-silse-on-surface">
          <UndoRedoToast />
          <CanvaAutoSaveSync />
          <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
          <Toolbar />
          <PreviewMode />
          <PlayOverlay />
          <OfflineIndicator />
          {isEnabled('commandPalette') && <CommandPalette open={commandPalette.open} onClose={commandPalette.closePalette} />}
        </div>
      </MobileGuard>
    );
  }

  // ── EDIT mode: Fixed header + resizable 3-panel layout (SILSE v4) ──
  return (
    <MobileGuard>
      <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-silse-surface-bright text-silse-on-surface focus-ring pt-16" id="main-content" data-testid="canva-builder">
        <UndoRedoToast />
        <CanvaAutoSaveSync />

        <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

        {/* Fixed Top Toolbar — SILSE v4: h-16 fixed top-0 z-40 */}
        <div data-tour="toolbar" data-testid="toolbar" role="toolbar" aria-label="Toolbar editor">
          <ProfilerWrapper id="Toolbar">
            <Toolbar />
          </ProfilerWrapper>
        </div>

        {/* Main builder row — Resizable 3-panel layout */}
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0"
        >
          {/* Left Panel — Resizable, default 20%, min 220px */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            data-tour="left-panel"
            data-testid="left-panel"
            role="complementary"
            aria-label="Panel halaman dan block"
          >
            <ProfilerWrapper id="LeftPanel">
              <LeftPanel />
            </ProfilerWrapper>
          </ResizablePanel>

          {/* Resize handle between Left and Stage */}
          <ResizableHandle className="bg-silse-outline-variant/40 hover:bg-silse-primary/40 transition-colors w-px" />

          {/* Stage Canvas Area — auto flex, dot-grid background */}
          <ResizablePanel
            defaultSize={55}
            minSize={30}
          >
            <div className="flex flex-col h-full relative overflow-hidden bg-silse-surface-dim canvas-bg" data-tour="canvas-stage" data-testid="canvas-stage" role="main" aria-label="Area kerja editor">
              <ProfilerWrapper id="Stage">
                <Stage />
              </ProfilerWrapper>
            </div>
          </ResizablePanel>

          {/* Right Panel — Resizable, shows/hides with animation */}
          {rightPanelOpen && (
            <>
              <ResizableHandle className="bg-silse-outline-variant/40 hover:bg-silse-primary/40 transition-colors w-px" />
              <ResizablePanel
                defaultSize={25}
                minSize={18}
                maxSize={35}
                data-tour="right-panel"
                data-testid="right-panel"
                role="complementary"
                aria-label="Panel properti"
              >
                <CanvasErrorBoundary name="RightPanel">
                  <ProfilerWrapper id="RightPanel">
                    <RightPanel />
                  </ProfilerWrapper>
                </CanvasErrorBoundary>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        {/* Scene Tab Bar — between builder row and status bar */}
        <SceneTabBar isCompact={true} />

        {/* Status Bar */}
        <StatusBar />

        {/* Play Preview Overlay */}
        <PlayOverlay />

        {/* Guided Tour */}
        <CanvaTour />

        {/* Command Palette */}
        {isEnabled('commandPalette') && <CommandPalette open={commandPalette.open} onClose={commandPalette.closePalette} />}

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
