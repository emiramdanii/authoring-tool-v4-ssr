'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import IconRail from './IconRail';
import LeftPanel from './LeftPanel';
import Stage from './Stage';
import RightPanel from './RightPanel';
import InteractiveNav from './InteractiveNav';

export default function CanvaBuilder() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mode = useInteractiveStore((s) => s.mode);
  const isInteractive = mode === 'interactive';

  // ── Load state from localStorage on mount ────────────────────
  useEffect(() => {
    useCanvaStore.getState().loadFromStorage();
  }, []);

  // ── Sync interactive page index with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── When entering interactive mode, go to first page ─────────
  useEffect(() => {
    if (isInteractive) {
      const { goInteractivePage } = useInteractiveStore.getState();
      const { goPage } = useCanvaStore.getState();
      goInteractivePage(0);
      goPage(0);
    }
  }, [isInteractive]);

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

  const handleMouseMove = useCallback((x: number, y: number) => {
    setMousePos({ x, y });
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useCanvaStore.getState();
      const iStore = useInteractiveStore.getState();
      const target = e.target as HTMLElement;

      // Don't intercept when editing text
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // ── Interactive mode shortcuts ──────────────────────────
      if (iStore.mode === 'interactive') {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          iStore.nextInteractivePage();
          const next = iStore.interactivePageIdx + 1;
          if (next < store.pages.length) store.goPage(next);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          iStore.prevInteractivePage();
          const prev = iStore.interactivePageIdx - 1;
          if (prev >= 0) store.goPage(prev);
          return;
        }
        if (e.key === 'Escape') {
          iStore.setMode('design');
          return;
        }
        return; // Don't process design shortcuts in interactive mode
      }

      // ── Design mode shortcuts ──────────────────────────────
      // Delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedElId) {
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

      // Arrow keys: nudge selected element
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!store.selectedElId) return;
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
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${
      isInteractive ? 'bg-zinc-950 text-zinc-200' : 'bg-zinc-950 text-zinc-200'
    }`}>
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main builder row */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Design-mode only panels */}
        {!isInteractive && (
          <>
            <IconRail />
            <LeftPanel />
          </>
        )}

        {/* Stage Canvas Area */}
        <div className="flex-1 relative">
          <Stage onMouseMove={handleMouseMove} />
          {/* Interactive navigation overlay */}
          <InteractiveNav />
        </div>

        {/* Design-mode only right panel */}
        {!isInteractive && <RightPanel />}
      </div>

      {/* Status Bar (design mode only) */}
      {!isInteractive && <StatusBar mousePos={mousePos} />}
    </div>
  );
}
