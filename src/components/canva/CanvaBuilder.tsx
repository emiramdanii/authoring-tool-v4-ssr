'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import LeftPanel from './LeftPanel';
import Stage from './Stage';
import RightPanel from './RightPanel';
import PlayOverlay from './PlayOverlay';

export default function CanvaBuilder() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);

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

  // ── Auto-save to localStorage on changes (debounced) ────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useCanvaStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        useCanvaStore.getState().saveToStorage();
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

  const handleMouseMove = useCallback((x: number, y: number) => {
    setMousePos({ x, y });
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
        store.zoomDelta(0.1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        store.zoomDelta(-0.1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        store.setZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-900 text-slate-200 focus-ring">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main builder row — always visible (design view) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ minHeight: 0 }}>
        <div className="border-r border-slate-800/60 shadow-[1px_0_8px_-2px_rgba(0,0,0,0.35)] flex-shrink-0">
          <LeftPanel />
        </div>

        {/* Stage Canvas Area — recessed with inner shadow */}
        <div className="flex-1 relative shadow-[inset_0_0_32px_-8px_rgba(0,0,0,0.3)] bg-slate-900/80">
          <Stage onMouseMove={handleMouseMove} />
        </div>

        {rightPanelOpen && (
          <div className="border-l border-slate-800/60 shadow-[-1px_0_8px_-2px_rgba(0,0,0,0.35)] flex-shrink-0">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar mousePos={mousePos} />

      {/* Play Preview Overlay — renders on top of everything */}
      <PlayOverlay />
    </div>
  );
}
