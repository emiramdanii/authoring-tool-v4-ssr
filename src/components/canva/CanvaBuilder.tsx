'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import IconRail from './IconRail';
import LeftPanel from './LeftPanel';
import Stage from './Stage';
import RightPanel from './RightPanel';

export default function CanvaBuilder() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ── Load state from localStorage on mount ────────────────────
  useEffect(() => {
    useCanvaStore.getState().loadFromStorage();
  }, []);

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
      const target = e.target as HTMLElement;

      // Don't intercept when editing text
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

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
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main builder row */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Icon Rail */}
        <IconRail />

        {/* Left Panel */}
        <LeftPanel />

        {/* Stage Canvas Area */}
        <Stage onMouseMove={handleMouseMove} />

        {/* Right Panel */}
        <RightPanel />
      </div>

      {/* Status Bar */}
      <StatusBar mousePos={mousePos} />
    </div>
  );
}
