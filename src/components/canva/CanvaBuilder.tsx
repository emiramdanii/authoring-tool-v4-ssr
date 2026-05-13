'use client';

import { useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { CanvaAutoSaveSync } from './CanvaAutoSaveSync';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import LeftPanel from './LeftPanel';
import Stage from './stage';
import RightPanel from './right-panel';
import { UndoRedoToast } from '@/components/shared/StatusToast';
import CommandPalette, { useCommandPalette } from '@/components/shared/CommandPalette';
import dynamic from 'next/dynamic';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import CanvaTour from '@/components/shared/CanvaTour';
import { MobileGuard } from '@/components/shared/MobileGuard';
// connectHistoryToEditBus is called once in store.ts (canonical location).
// Removed duplicate call — was causing double-recording in PatchHistory.

// Lazy-loaded: PlayOverlay is only needed when user clicks "Play" — purely client-side
const PlayOverlay = dynamic(() => import('./PlayOverlay'), { ssr: false });

export default function CanvaBuilder() {
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const leftPanelOpen = useCanvaStore((s) => s.leftPanelOpen);
  const commandPalette = useCommandPalette();

  // NOTE: loadFromStorage() removed from CanvaBuilder mount.
  // It was causing a race condition: resetCanvas() creates fresh pages,
  // then CanvaBuilder mounts and loadFromStorage() overwrites them with
  // stale data from localStorage. Persistence is now handled by:
  // 1. Unified auto-save via useAutoSave() hook (2 000 ms debounce)
  // 2. AuthoringTool initial load via loadFromStorage on first app mount

  // ── Unified auto-save ──────────────────────────────────────
  // Auto-save is now handled by CanvaAutoSaveSync component,
  // which connects the project context to the auto-save hook.
  // When a project is loaded, it saves to DB; otherwise localStorage.
  // No other component should implement its own auto-save subscription.
  // NOTE: The CanvaAutoSaveSync component renders below.

  // ── Sync interactive page total with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── PatchHistory ↔ EditBus connection ──────────────────────
  // Removed: connectHistoryToEditBus() was already called in store.ts
  // (line 83). Having it here too caused every schema edit to be
  // recorded TWICE in PatchHistory, making undo/redo unreliable.

  // ── Warn before unload if authoring data is dirty ────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const authDirty = useAuthoringStore.getState().dirty;
      if (authDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but legacy support
        e.returnValue = 'Perubahan belum tersimpan. Yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleMouseMove = useCallback((_x: number, _y: number) => {
    // Mouse position no longer tracked — was only used by StatusBar
  }, []);

  // ── Unified keyboard shortcuts via registry ──────────────────
  // Replaces the separate useEffect with window.addEventListener('keydown', ...)
  // These shortcuts are scoped to 'canvas' and only fire when the
  // keyboardManager's active context is 'canvas'.
  useKeyboardShortcuts([
    // ── History ────────────────────────────────────────────────────
    {
      id: 'canvas.undo',
      keys: 'ctrl+z',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        store.undo();
      },
      description: 'Undo',
      category: 'History',
    },
    {
      id: 'canvas.redo',
      keys: 'ctrl+y',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        store.redo();
      },
      description: 'Redo',
      category: 'History',
    },
    {
      id: 'canvas.redo-alt',
      keys: 'ctrl+shift+z',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        store.redo();
      },
      description: 'Redo (alternative)',
      category: 'History',
    },

    // ── Block editing ──────────────────────────────────────────────
    {
      id: 'canvas.delete-block',
      keys: 'delete',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
      },
      description: 'Delete selected element',
      category: 'Block',
    },
    {
      id: 'canvas.backspace-delete',
      keys: 'backspace', // Note: 'backspace' maps to Backspace key
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
      },
      description: 'Delete selected element (Backspace)',
      category: 'Block',
    },
    {
      id: 'canvas.duplicate-block',
      keys: 'ctrl+d',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
          store.pasteElements();
        }
      },
      description: 'Duplicate selected block',
      category: 'Block',
    },
    {
      id: 'canvas.copy-block',
      keys: 'ctrl+c',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
        }
      },
      description: 'Copy selected block',
      category: 'Block',
    },
    {
      id: 'canvas.paste-block',
      keys: 'ctrl+v',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (store._clipboard.length > 0) {
          e.preventDefault();
          store.pasteElements();
        }
      },
      description: 'Paste block from clipboard',
      category: 'Block',
    },

    // ── Arrow keys: nudge selected elements ────────────────────────
    {
      id: 'canvas.nudge-up',
      keys: 'arrowup',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(0, e.shiftKey ? -5 : -1);
      },
      description: 'Nudge up (Shift: 5px)',
      category: 'Block',
    },
    {
      id: 'canvas.nudge-down',
      keys: 'arrowdown',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(0, e.shiftKey ? 5 : 1);
      },
      description: 'Nudge down (Shift: 5px)',
      category: 'Block',
    },
    {
      id: 'canvas.nudge-left',
      keys: 'arrowleft',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(e.shiftKey ? -5 : -1, 0);
      },
      description: 'Nudge left (Shift: 5px)',
      category: 'Block',
    },
    {
      id: 'canvas.nudge-right',
      keys: 'arrowright',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(e.shiftKey ? 5 : 1, 0);
      },
      description: 'Nudge right (Shift: 5px)',
      category: 'Block',
    },

    // ── Selection ──────────────────────────────────────────────────
    {
      id: 'canvas.escape',
      keys: 'escape',
      scope: 'canvas',
      priority: 3,
      handler: () => {
        useCanvaStore.getState().selectElement(null);
      },
      description: 'Deselect / Exit editing',
      category: 'Selection',
    },

    // ── Tool shortcuts (V=select, T=text) ─────────────────────────
    {
      id: 'canvas.tool-select',
      keys: 'v',
      scope: 'canvas',
      priority: 2,
      handler: () => {
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().setTool('select');
      },
      description: 'Select tool',
      category: 'Tools',
    },
    {
      id: 'canvas.tool-text',
      keys: 't',
      scope: 'canvas',
      priority: 2,
      handler: () => {
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().setTool('text');
      },
      description: 'Text tool',
      category: 'Tools',
    },

    // ── Zoom shortcuts ─────────────────────────────────────────────
    {
      id: 'canvas.zoom-in',
      keys: 'ctrl+=',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (store.zoom === -1) store.setZoom(1);
        else store.zoomDelta(0.1);
      },
      description: 'Zoom in',
      category: 'View',
    },
    {
      id: 'canvas.zoom-out',
      keys: 'ctrl+-',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (store.zoom === -1) store.setZoom(0.8);
        else store.zoomDelta(-0.1);
      },
      description: 'Zoom out',
      category: 'View',
    },
    {
      id: 'canvas.zoom-fit',
      keys: 'ctrl+0',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        useCanvaStore.getState().zoomToFit();
      },
      description: 'Fit to screen',
      category: 'View',
    },

    // ── AI Assistant ──────────────────────────────────────────────
    {
      id: 'canvas.ai-assistant',
      keys: 'ctrl+i',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (!store.rightPanelOpen) {
          useCanvaStore.setState({ rightPanelOpen: true });
        }
        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
      },
      description: 'Buka AI Assistant',
      category: 'Tools',
    },
  ], []);

  return (
    <MobileGuard>
      <div className="h-full w-full min-w-0 flex flex-col overflow-hidden bg-app-bg text-app-primary focus-ring" id="main-content">
        <UndoRedoToast />
        <CanvaAutoSaveSync />

        {/* Visually hidden live region for screen reader announcements */}
        <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

        {/* Top Toolbar */}
        <div data-tour="toolbar" role="toolbar" aria-label="Toolbar editor">
          <Toolbar />
        </div>

        {/* Main builder row — always visible (design view) */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ minHeight: 0 }}>
          <div className={`border-r border-app-border shadow-[1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            leftPanelOpen ? 'w-56 md:w-60 lg:w-[280px]' : 'w-0'
          }`} data-tour="left-panel" role="complementary" aria-label="Panel halaman dan block">
            {leftPanelOpen && <LeftPanel />}
          </div>

          {/* Stage Canvas Area — recessed with inner shadow */}
          <div className="flex-1 min-w-0 relative overflow-hidden shadow-[inset_0_0_16px_-8px_rgba(0,0,0,0.2)] bg-app-bg" data-tour="canvas-stage" role="main" aria-label="Area kerja editor">
            <Stage onMouseMove={handleMouseMove} />
          </div>

          <div className={`border-l border-app-border shadow-[-1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            rightPanelOpen ? 'w-56 md:w-60 lg:w-[280px]' : 'w-0'
          }`} data-tour="right-panel" role="complementary" aria-label="Panel properti">
            <CanvasErrorBoundary name="RightPanel">
              {rightPanelOpen && <RightPanel />}
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
      </div>
    </MobileGuard>
  );
}
