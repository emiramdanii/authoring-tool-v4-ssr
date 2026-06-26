// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

import { useEffect, useState } from 'react';
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
// BATCH-12: stage/ moved to src/legacy-disabled/. CanvaBuilder is itself
// legacy (not in V5 runtime graph — only imported by AuthoringTool which
// is also legacy). The Stage import is commented out because the module
// has been quarantined. CanvaBuilder is never executed in V5 runtime —
// if it were ever restored, Stage would need to be restored too.
// import Stage from './stage';  // BATCH-12: quarantined to src/legacy-disabled/
import RightPanel from './right-panel';
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
import { BottomPageStrip } from './BottomPageStrip';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
// EDITOR-RADICAL-RESET-01: MPI Studio shell for teacher mode
import { MpiEditorShell } from './mpi-editor';
// V3-PHASE-1: MPI Workspace V2 — rebuild with proper architecture
import { MpiWorkspaceV2 } from './mpi-workspace-v2';

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

const PreviewMode = dynamic(() => import('./PreviewMode'), {
  ssr: false,
  loading: () => null,
});

const PresentMode = dynamic(() => import('./PresentMode'), {
  ssr: false,
  loading: () => null,
});

const CommandPalette = dynamic(() => import('@/components/shared/CommandPalette').then(mod => ({ default: mod.default })), {
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
  const selectedBlockId = useCanvaStore((s) => s.selectedBlockId);
  const selectedElId = useCanvaStore((s) => s.selectedElId);
  const commandPalette = useCommandPalette();

  // ── Export success dialog ───────────────────────────────────
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // ── Auto-open right panel when a block or element is selected ──
  // If user selects something and the right panel is closed, open it
  // so they can see the properties panel immediately.
  useEffect(() => {
    if ((selectedBlockId || selectedElId) && !rightPanelOpen) {
      useCanvaStore.setState({ rightPanelOpen: true });
    }
  }, [selectedBlockId, selectedElId, rightPanelOpen]);

  // ── Sync interactive-store.mode with appMode ──
  // When switching modes, the interactive-store's internal mode must track
  // the appMode to prevent mode mixing (e.g., PlayOverlay appearing in edit mode).
  // edit → design (no interactive play), preview/present → interactive (play enabled)
  useEffect(() => {
    const iMode = useInteractiveStore.getState().mode;
    if (appMode === 'edit' && iMode !== 'design') {
      useInteractiveStore.getState().closePlay();
    } else if ((appMode === 'preview' || appMode === 'present') && iMode !== 'interactive') {
      useInteractiveStore.getState().setMode('interactive');
    }
  }, [appMode]);

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
      // AI Assistant shortcut removed — AI Generator is a parked area per CORE_SCOPE.md.
      // Sprint 8.6B: stub openAIAssistant to satisfy CanvaShortcutDeps contract
      // (the AI shortcut registration is dead code, so this is never invoked).
      openAIAssistant: () => { /* no-op — AI Generator is parked */ },
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

  // ── V3-PHASE-1B: Official editor route = MPI Workspace V2 ──
  // Route lock: `appMode === 'edit'` ALWAYS opens MpiWorkspaceV2.
  // teacherMode is NO LONGER a routing condition — it only toggles
  // terminology labels inside the workspace (sederhana/lengkap).
  //
  // V3 Workspace V2 provides:
  //   - Natural block selection (click canvas → select block)
  //   - Schema-driven inspector (registry, not hardcoded)
  //   - Portal-based style menu (no z-index issues)
  //   - Content palette with descriptions
  //
  // The old 3-panel editor below is reachable ONLY via explicit
  // dev-only flag NEXT_PUBLIC_ENABLE_LEGACY_EDITOR === 'true'.
  // It must NOT be reachable from any normal user route.
  if (appMode === 'edit') {
    return (
      <MobileGuard>
        <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-silse-surface-bright text-silse-on-surface" id="main-content" data-testid="mpi-workspace-v2-builder">
          <UndoRedoToast />
          <CanvaAutoSaveSync />
          <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
          <MpiWorkspaceV2 />
          <OfflineIndicator />
        </div>
      </MobileGuard>
    );
  }

  // ── V3-PHASE-1B: Dev-only legacy editor escape hatch ──
  // The old 3-panel editor below is kept ONLY for emergency dev
  // debugging. It is unreachable from any normal route because
  // `appMode === 'edit'` is intercepted above and always returns
  // MpiWorkspaceV2. The only way to reach the legacy code is to
  // temporarily comment out the V2 block above in a local dev fork.
  //
  // Do NOT add a settings toggle, env-flag branch, or runtime mode
  // that re-enables this legacy route. It stays here purely as a
  // reference snapshot until it is deleted in a future cleanup.

  // ═══════════════════════════════════════════════════════════════
  // LEGACY_EDITOR_QUARANTINED_NOT_USER_ROUTE
  // @QUARANTINE — PHASE-3A / V3-PHASE-1B
  // This is the old 3-panel editor (IconRail + Stage + RightPanel +
  // SceneTabBar + BottomPageStrip). It is NOT the official route.
  // V3-PHASE-1B: Route lock removed teacherMode gate — ALL edit mode
  // now goes to MpiWorkspaceV2. This old editor code is UNREACHABLE
  // from normal app flow. It exists only as dead code until cleanup.
  // Do NOT improve, test, or use as visual proof.
  // Reconnect plan: see RECONNECT-ORDER.md
  // ═══════════════════════════════════════════════════════════════
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
            defaultSize="20%"
            minSize="15%"
            maxSize="30%"
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
            defaultSize="55%"
            minSize="30%"
          >
            <div className="flex flex-col h-full relative overflow-hidden bg-silse-surface-dim canvas-bg" data-tour="canvas-stage" data-testid="canvas-stage" role="main" aria-label="Area kerja editor">
              <ProfilerWrapper id="Stage">
                {/* BATCH-12: <Stage /> quarantined to src/legacy-disabled/.
                    CanvaBuilder is legacy (not in V5 runtime). */}
                <></>
              </ProfilerWrapper>
            </div>
          </ResizablePanel>

          {/* Right Panel — Resizable, always mounted for stable layout */}
          <ResizableHandle className="bg-silse-outline-variant/40 hover:bg-silse-primary/40 transition-colors w-px" />
          <ResizablePanel
            defaultSize={rightPanelOpen ? "25%" : "0%"}
            minSize={rightPanelOpen ? "18%" : "0%"}
            maxSize={rightPanelOpen ? "35%" : "0%"}
            data-tour="right-panel"
            data-testid="right-panel"
            role="complementary"
            aria-label="Panel properti"
          >
            {rightPanelOpen && (
              <CanvasErrorBoundary name="RightPanel">
                <ProfilerWrapper id="RightPanel">
                  <RightPanel />
                </ProfilerWrapper>
              </CanvasErrorBoundary>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Bottom Page Strip — horizontal page navigator below canvas */}
        <BottomPageStrip />

        {/* Scene Tab Bar — intra-page schema tabs (block filter) */}
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
