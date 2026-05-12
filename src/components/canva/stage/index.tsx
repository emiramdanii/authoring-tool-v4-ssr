'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { RATIOS } from '../types';
import { PageRenderer } from '../page-renderer';
import { CanvasErrorBoundary } from '../CanvasErrorBoundary';
import { StageElement } from './StageElement';
import { Zap } from 'lucide-react';
import { useStageKeyboard } from './use-stage-keyboard';
import { useStageDrag } from './use-stage-drag';
import { Z } from './constants';
import {
  ZOOM_FIT,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_STEP,
  CANVAS_VIEWPORT_PADDING,
  calcFitZoom,
  clampZoom,
  resolveZoom,
} from '@/lib/canva-constants';
import { screenToPct } from '@/lib/virtual-canvas';

// ═══════════════════════════════════════════════════════════════
// STAGE — Virtual Canvas editing area with zoom + pan
//
// Architecture:
//   ┌─ canvasAreaRef (viewport, overflow: hidden) ────────────┐
//   │  ┌─ transformLayer (translate + scale) ──────────────┐  │
//   │  │  ┌─ stageWrapRef (1280×720) ────────────────────┐  │  │
//   │  │  │  PageRenderer + overlays + elements          │  │  │
//   │  │  └──────────────────────────────────────────────┘  │  │
//   │  └────────────────────────────────────────────────────┘  │
//   └──────────────────────────────────────────────────────────┘
//
// Zoom model:
//   - zoom = visual scale factor (1.0 = native 1280×720)
//   - zoom = ZOOM_FIT (-1) = auto-fit to viewport
//   - fitZoom = calculated scale that fits canvas in viewport
//
// Pan model:
//   - panX, panY = screen-pixel offset of transform origin
//   - When zoom <= fitZoom, canvas is auto-centered (no pan)
//   - When zoom > fitZoom, user can pan via Space+drag or middle-click
//
// Coordinate conversion:
//   - Screen → Canvas: account for pan, zoom, and canvas dimensions
//   - Uses getBoundingClientRect() for accuracy after transforms
// ═══════════════════════════════════════════════════════════════

export default function Stage({ onMouseMove }: { onMouseMove: (x: number, y: number) => void }) {
  const {
    pages,
    currentPageIndex,
    zoom: storeZoom,
    tool,
    selectedElId,
    selectedElIds,
    selectElement,
    toggleElementSelection,
    selectAllElements,
    clearSelection,
    deleteSelectedElements,
    addElement,
    updateElement,
    updateTemplateData,
    showGrid,
    gridSize,
    snapEnabled,
    snapValue,
    _pushHistory,
    selectBlock,
    deleteBlock,
    duplicateBlock,
    moveBlockUp,
    moveBlockDown,
    selectedBlockId,
    selectedBlockIds,
    stopEditing,
    editingBlockId,
    copySchemaBlock,
    pasteSchemaBlock,
    nudgeSchemaBlocks,
    deleteSchemaBlocks,
    undo,
    redo,
    setZoom,
    zoomDelta,
    zoomToFit,
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  // ── Local state for zoom/pan ─────────────────────────────────
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(0.5); // calculated by ResizeObserver
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  // Pan drag state
  const panDragRef = useRef<{ startX: number; startY: number; origPanX: number; origPanY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Resolve effective zoom
  const effectiveZoom = resolveZoom(storeZoom, fitZoom);

  // ── Keyboard shortcuts (editing) ──────────────────────────────
  useStageKeyboard({
    selectedElIds,
    selectedBlockId,
    selectedBlockIds,
    editingBlockId,
    selectAllElements,
    deleteSelectedElements,
    clearSelection,
    selectBlock,
    deleteBlock,
    duplicateBlock,
    moveBlockUp,
    moveBlockDown,
    stopEditing,
    copySchemaBlock,
    pasteSchemaBlock,
    nudgeSchemaBlocks,
    deleteSchemaBlocks,
    undo,
    redo,
  });

  // ── Drag/resize logic ─────────────────────────────────────────
  const {
    stageWrapRef,
    snapLines,
    handleAreaMouseMove,
    startMoveDrag,
    startResizeDrag,
  } = useStageDrag({
    page,
    effectiveZoom,
    stageW: ratio.w,
    stageH: ratio.h,
    snapEnabled,
    snapValue,
    updateElement,
    _pushHistory,
  });

  // ── ResizeObserver: calculate fitZoom ─────────────────────────
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const observer = new ResizeObserver(() => {
      const aW = area.clientWidth || 800;
      const aH = area.clientHeight || 500;
      const newFitZoom = calcFitZoom(aW, aH, ratio.w, ratio.h);
      setFitZoom(newFitZoom);
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [ratio.w, ratio.h]);

  // ── Auto-center when zoom fits viewport ───────────────────────
  useEffect(() => {
    if (effectiveZoom <= fitZoom) {
      setPanX(0);
      setPanY(0);
    }
  }, [effectiveZoom, fitZoom]);

  // ── Space key tracking for pan mode ───────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Scroll wheel zoom (Ctrl+scroll) ───────────────────────────
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom with Ctrl or Meta key (or pinch on trackpad)
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = area.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Current zoom
      const currentZoom = resolveZoom(useCanvaStore.getState().zoom, fitZoom);
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = clampZoom(currentZoom + delta);
      if (newZoom === currentZoom) return;

      // Adjust pan so the point under cursor stays in place
      // Formula: newPan = mousePos - (mousePos - oldPan) * (newZoom / oldZoom)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const scale = newZoom / currentZoom;
      const newPanX = mouseX - (mouseX - (centerX + panX)) * scale - centerX;
      const newPanY = mouseY - (mouseY - (centerY + panY)) * scale - centerY;

      setPanX(newPanX);
      setPanY(newPanY);
      setZoom(newZoom);
    };

    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, [fitZoom, panX, panY, setZoom]);

  // ── Wrap handleAreaMouseMove to pass onMouseMove callback ─────
  const onAreaMouseMove = useCallback((e: React.MouseEvent) => {
    handleAreaMouseMove(e, onMouseMove);
  }, [handleAreaMouseMove, onMouseMove]);

  // ── Pan drag handlers ─────────────────────────────────────────
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (!spaceHeld && e.button !== 1) return; // Space held or middle-click
    e.preventDefault();
    panDragRef.current = { startX: e.clientX, startY: e.clientY, origPanX: panX, origPanY: panY };
    setIsPanning(true);
  }, [spaceHeld, panX, panY]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!panDragRef.current) return;
    const dx = e.clientX - panDragRef.current.startX;
    const dy = e.clientY - panDragRef.current.startY;
    setPanX(panDragRef.current.origPanX + dx);
    setPanY(panDragRef.current.origPanY + dy);
  }, []);

  const handlePanEnd = useCallback(() => {
    panDragRef.current = null;
    setIsPanning(false);
  }, []);

  // ── Drop from element panel ───────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const elType = e.dataTransfer.getData('elemType');
    if (!elType) return;
    // Use centralized coordinate utility for accurate conversion
    const { xPct, yPct } = screenToPct(e.clientX, e.clientY);
    const x = Math.max(2, Math.min(80, xPct));
    const y = Math.max(2, Math.min(85, yPct));
    addElement(elType, parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
  }, [addElement]);

  // ── Click on stage background ─────────────────────────────────
  const handleStageBgClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id !== 'cm-stage-wrap' && target.id !== 'cm-stage-bg' && target.id !== 'cm-canvas-area' && target.id !== 'cm-stage-bg-overlay' && !target.closest('[data-snap-line]')) return;

    if (tool === 'text') {
      // Use centralized coordinate utility for accurate conversion
      const { xPct, yPct } = screenToPct(e.clientX, e.clientY);
      const x = Math.max(2, Math.min(80, xPct));
      const y = Math.max(2, Math.min(85, yPct));
      addElement('teks', parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
      useCanvaStore.getState().setTool('select');
      return;
    }

    selectElement(null);
    selectBlock(null);
  };

  // ── Template field edit handler ───────────────────────────────
  const handleTemplateEdit = useCallback((key: string, value: string) => {
    updateTemplateData(key, value);
  }, [updateTemplateData]);

  // ── Derived state ─────────────────────────────────────────────
  const isTemplateMode = page && page.templateType && page.templateType !== 'custom';
  const isSchemaDriven = !!page?.schema;
  const isMultiSelected = (elId: string) => selectedElIds.includes(elId) && selectedElIds.length > 1;

  if (!page) return null;

  // Cursor style
  const cursorStyle = isPanning ? 'grabbing' : spaceHeld ? 'grab' : tool === 'text' ? 'text' : 'default';

  return (
    <div
      ref={canvasAreaRef}
      id="cm-canvas-area"
      className="flex-1 bg-app-surface overflow-hidden flex items-center justify-center"
      style={{ cursor: cursorStyle }}
      onMouseMove={(e) => {
        onAreaMouseMove(e);
        handlePanMove(e);
      }}
      onMouseUp={handlePanEnd}
      onMouseDown={handlePanStart}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
    >
      {/* ══ Transform layer: translate + scale ════════════════════ */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${effectiveZoom})`,
          transformOrigin: 'center center',
          transition: panDragRef.current ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <div
          ref={stageWrapRef}
          id="cm-stage-wrap"
          className="relative overflow-hidden shadow-2xl shadow-black/50"
          style={{
            width: ratio.w,
            height: ratio.h,
          }}
          onMouseDown={handleStageBgClick}
        >
          {/* ══ Use PageRenderer for consistent rendering ══════ */}
          <CanvasErrorBoundary name="PageRenderer">
            <PageRenderer
              mode="canvas"
              page={page}
              currentPageIndex={currentPageIndex}
              totalPages={pages.length}
              isTemplateSelected={true}
              onEditField={handleTemplateEdit}
            />
          </CanvasErrorBoundary>

          {/* ══ Canvas-only overlays ═══════════════════════════ */}

          {/* Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)`,
              backgroundSize: `${gridSize}% ${gridSize}%`,
            }} />
          )}

          {/* Snap Guide Lines */}
          {snapLines.length > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z.CANVAS_OVERLAY }}>
              {snapLines.map((line, i) => (
                <div key={i}>
                  {line.x != null && (
                    <div
                      data-snap-line
                      className="absolute top-0 bottom-0"
                      style={{
                        left: `${line.x}%`,
                        width: 1,
                        borderLeft: '1px dashed rgba(56,217,217,0.6)',
                        boxShadow: '0 0 4px rgba(56,217,217,0.3)',
                      }}
                    />
                  )}
                  {line.y != null && (
                    <div
                      data-snap-line
                      className="absolute left-0 right-0"
                      style={{
                        top: `${line.y}%`,
                        height: 1,
                        borderTop: '1px dashed rgba(56,217,217,0.6)',
                        boxShadow: '0 0 4px rgba(56,217,217,0.3)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Render editable elements on top of PageRenderer */}
          {page.elements.length > 0 && (
            <div className="absolute inset-0" style={{ zIndex: Z.CANVAS_ELEMENT }}>
              {page.elements.map(el => (
                <StageElement
                  key={el.id}
                  element={el}
                  isSelected={el.id === selectedElId || isMultiSelected(el.id)}
                  isMultiSelected={isMultiSelected(el.id)}
                  onSelect={(shiftKey) => {
                    if (shiftKey) toggleElementSelection(el.id);
                    else selectElement(el.id);
                  }}
                  onStartDrag={(startX, startY) => startMoveDrag(el.id, startX, startY, el.x, el.y)}
                  onStartResize={(dir, startX, startY) => startResizeDrag(el.id, dir, startX, startY, el.x, el.y, el.w, el.h)}
                />
              ))}
            </div>
          )}

          {/* Template mode badge */}
          {isTemplateMode && (
            <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[9px] font-bold border pointer-events-none flex items-center gap-1 ${
              isSchemaDriven
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-app-accent/20 text-app-accent border-app-accent/30'
            }`} style={{ zIndex: Z.INFO_BADGE }}>
              <Zap size={10} /> {isSchemaDriven ? 'SCHEMA' : page.templateType}
            </div>
          )}

          {/* Multi-select info badge (elements) */}
          {selectedElIds.length > 1 && !selectedBlockId && (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 pointer-events-none" style={{ zIndex: Z.INFO_BADGE }}>
              {selectedElIds.length} elemen terpilih • Shift+klik untuk tambah • Del untuk hapus
            </div>
          )}

          {/* Multi-select info badge (schema blocks) */}
          {selectedBlockIds.length > 1 && (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 pointer-events-none" style={{ zIndex: Z.INFO_BADGE }}>
              {selectedBlockIds.length} block terpilih • Shift+klik untuk tambah • Del untuk hapus
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
