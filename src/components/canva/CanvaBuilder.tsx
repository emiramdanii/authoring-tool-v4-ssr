'use client';

import { useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import LeftPanel from './LeftPanel';
import Stage from './Stage';
import RightPanel from './RightPanel';
import { UndoRedoToast } from '@/components/shared/StatusToast';
import dynamic from 'next/dynamic';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
// connectHistoryToEditBus is called once in store.ts (canonical location).
// Removed duplicate call — was causing double-recording in PatchHistory.

// Lazy-loaded: PlayOverlay is only needed when user clicks "Play" — purely client-side
const PlayOverlay = dynamic(() => import('./PlayOverlay'), { ssr: false });

export default function CanvaBuilder() {
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const leftPanelOpen = useCanvaStore((s) => s.leftPanelOpen);

  // NOTE: loadFromStorage() removed from CanvaBuilder mount.
  // It was causing a race condition: resetCanvas() creates fresh pages,
  // then CanvaBuilder mounts and loadFromStorage() overwrites them with
  // stale data from localStorage. Persistence is now handled by:
  // 1. Auto-save (subscribe + 1500ms debounce) below
  // 2. AuthoringTool initial load via loadFromStorage on first app mount

  // ── Sync interactive page total with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── PatchHistory ↔ EditBus connection ──────────────────────
  // Removed: connectHistoryToEditBus() was already called in store.ts
  // (line 83). Having it here too caused every schema edit to be
  // recorded TWICE in PatchHistory, making undo/redo unreliable.

  // ── Auto-save to localStorage on changes (debounced) ────────
  // This is the ONLY auto-save in the app. Toolbar and StatusBar
  // read _saveStatus from the store instead of implementing their own.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useCanvaStore.subscribe(() => {
      // Mark as "saving" immediately so UI responds
      useCanvaStore.setState({ _saveStatus: 'saving' });
      clearTimeout(timer);
      timer = setTimeout(() => {
        useCanvaStore.getState().saveToStorage();
        useCanvaStore.setState({ _saveStatus: 'saved' });
      }, 1500);
    });
    return () => { clearTimeout(timer); unsub(); };
  }, []);

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

  // ── Keyboard shortcuts (design mode only) ──────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when the interactive Play overlay is active.
      // The Play overlay has its own keyboard handler for navigation.
      const iMode = useInteractiveStore.getState().mode;
      if (iMode === 'interactive') return;

      // Only handle shortcuts when Canva panel is active
      const activePanel = useAuthoringStore.getState().activePanel;
      if (activePanel !== 'canva') return;

      const store = useCanvaStore.getState();
      const target = e.target as HTMLElement;

      // Don't intercept when editing text
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Delete selected element(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        store.redo();
        return;
      }

      // Copy / Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (store._clipboard.length > 0) {
          e.preventDefault();
          store.pasteElements();
        }
        return;
      }
      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
          store.pasteElements();
        }
        return;
      }

      // Arrow keys: nudge selected element(s)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        switch (e.key) {
          case 'ArrowUp': store.nudgeSelected(0, -step); break;
          case 'ArrowDown': store.nudgeSelected(0, step); break;
          case 'ArrowLeft': store.nudgeSelected(-step, 0); break;
          case 'ArrowRight': store.nudgeSelected(step, 0); break;
        }
        return;
      }

      // Escape: deselect
      if (e.key === 'Escape') {
        store.selectElement(null);
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') store.setTool('select');
      if (e.key === 't' || e.key === 'T') store.setTool('text');

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        if (store.zoom === -1) store.setZoom(1); // Exit auto-fit, go to 100%
        else store.zoomDelta(0.1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        if (store.zoom === -1) store.setZoom(0.8); // Exit auto-fit, start from 80%
        else store.zoomDelta(-0.1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        store.zoomToFit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full w-full min-w-0 flex flex-col overflow-hidden bg-app-bg text-app-primary focus-ring" id="main-content">
      <UndoRedoToast />
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main builder row — always visible (design view) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ minHeight: 0 }}>
        <div className={`border-r border-app-border shadow-[1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          leftPanelOpen ? 'w-56 md:w-60 lg:w-[280px]' : 'w-0'
        }`}>
          {leftPanelOpen && <LeftPanel />}
        </div>

        {/* Stage Canvas Area — recessed with inner shadow */}
        <div className="flex-1 min-w-0 relative overflow-hidden shadow-[inset_0_0_16px_-8px_rgba(0,0,0,0.2)] bg-app-bg">
          <Stage onMouseMove={handleMouseMove} />
        </div>

        <div className={`border-l border-app-border shadow-[-1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          rightPanelOpen ? 'w-56 md:w-60 lg:w-[280px]' : 'w-0'
        }`}>
          <CanvasErrorBoundary name="RightPanel">
            {rightPanelOpen && <RightPanel />}
          </CanvasErrorBoundary>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Play Preview Overlay — renders on top of everything */}
      <PlayOverlay />
    </div>
  );
}
