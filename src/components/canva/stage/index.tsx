'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { PageTransition, type PageDirection } from '@/lib/transition';
import { useCanvaStore } from '@/store/canva-store';
import { RATIOS } from '../types';
import { PageRenderer } from '../page-renderer';
import { CanvasErrorBoundary } from '../CanvasErrorBoundary';
import { StageElement } from './StageElement';
import { Zap, Layout, Plus, Sparkles } from 'lucide-react';
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
import CanvasEmptyState from '../CanvasEmptyState';
import BatchOperationsBar from './BatchOperationsBar';
import { useAuthoringStore } from '@/store/authoring-store';

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



export default function Stage() {
  // ── Targeted selectors to avoid unnecessary re-renders ──────────
  // PERF: Subscribe to only the current page, not the full pages[] array
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const pagesLength = useCanvaStore(s => s.pages.length);
  const storeZoom = useCanvaStore(s => s.zoom);
  const tool = useCanvaStore(s => s.tool);
  const selectedElId = useCanvaStore(s => s.selectedElId);
  const selectedElIds = useCanvaStore(s => s.selectedElIds);
  const selectElement = useCanvaStore(s => s.selectElement);
  const toggleElementSelection = useCanvaStore(s => s.toggleElementSelection);
  const selectAllElements = useCanvaStore(s => s.selectAllElements);
  const clearSelection = useCanvaStore(s => s.clearSelection);
  const deleteSelectedElements = useCanvaStore(s => s.deleteSelectedElements);
  const addElement = useCanvaStore(s => s.addElement);
  const updateElement = useCanvaStore(s => s.updateElement);
  const showGrid = useCanvaStore(s => s.showGrid);
  const gridSize = useCanvaStore(s => s.gridSize);
  const snapEnabled = useCanvaStore(s => s.snapEnabled);
  const snapValue = useCanvaStore(s => s.snapValue);
  const _pushHistory = useCanvaStore(s => s._pushHistory);
  const selectBlock = useCanvaStore(s => s.selectBlock);
  const deleteBlock = useCanvaStore(s => s.deleteBlock);
  const duplicateBlock = useCanvaStore(s => s.duplicateBlock);
  const moveBlockUp = useCanvaStore(s => s.moveBlockUp);
  const moveBlockDown = useCanvaStore(s => s.moveBlockDown);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const copySchemaBlock = useCanvaStore(s => s.copySchemaBlock);
  const pasteSchemaBlock = useCanvaStore(s => s.pasteSchemaBlock);
  const nudgeSchemaBlocks = useCanvaStore(s => s.nudgeSchemaBlocks);
  const deleteSchemaBlocks = useCanvaStore(s => s.deleteSchemaBlocks);
  const canvasPreview = useCanvaStore(s => s.canvasPreview);
  const setZoom = useCanvaStore(s => s.setZoom);
  const storeSetFitZoom = useCanvaStore(s => s.setFitZoom);
  const zoomDelta = useCanvaStore(s => s.zoomDelta);
  const zoomToFit = useCanvaStore(s => s.zoomToFit);
  // NOTE: Removed unused `storeFitZoom` subscription — was causing unnecessary
  // re-renders. The local `fitZoom` state is used instead for `effectiveZoom`.

  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  // ── Page transition direction tracking ──────────────────────
  const prevPageRef = useRef(currentPageIndex);
  const [pageDirection, setPageDirection] = useState(0);

  useEffect(() => {
    if (currentPageIndex > prevPageRef.current) setPageDirection(1);
    else if (currentPageIndex < prevPageRef.current) setPageDirection(-1);
    prevPageRef.current = currentPageIndex;
  }, [currentPageIndex]);

  // ── Local state for zoom/pan ─────────────────────────────────
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(0.5); // local mirror of store.fitZoom
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isFitZoomReady, setIsFitZoomReady] = useState(false); // true after first ResizeObserver callback

  // ── Safety fallback: ensure canvas becomes visible after mount ────────
  // Even if the ResizeObserver / rAF path fails to set isFitZoomReady,
  // this timeout guarantees the canvas will be visible within 500ms.
  useEffect(() => {
    const safety = setTimeout(() => {
      if (!isFitZoomReady) setIsFitZoomReady(true);
    }, 500);
    return () => clearTimeout(safety);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Pan drag state
  const panDragRef = useRef<{ startX: number; startY: number; origPanX: number; origPanY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // ── Refs for values needed in event handlers without re-registration ──
  // These prevent stale closures and avoid re-registering handlers on every state change
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const fitZoomRef = useRef(fitZoom);
  panXRef.current = panX;
  panYRef.current = panY;
  fitZoomRef.current = fitZoom;

  // Resolve effective zoom
  const effectiveZoom = resolveZoom(storeZoom, fitZoom);

  // ── Keyboard shortcuts (contentEditable escape only) ──────────
  // All other shortcuts are now consolidated in CanvaBuilder's
  // ShortcutRegistry with priority-based routing (priority 15 for
  // schema blocks, 5-8 for legacy elements). This hook only handles
  // Escape from contentEditable, which the registry cannot intercept.
  useStageKeyboard();

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
  // This is the primary mechanism for computing the correct fitZoom.
  // We use requestAnimationFrame to ensure the DOM has layout before reading.
  // The fitZoom is synced to the store so zoomDelta can resolve ZOOM_FIT.
  //
  // FIX: Added retry mechanism — if clientWidth/Height is 0 (component not yet
  // laid out), retry after a short delay. This handles the case where the
  // flex layout hasn't settled yet on initial mount.
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const computeFit = () => {
      const aW = area.clientWidth;
      const aH = area.clientHeight;
      if (aW > 0 && aH > 0) {
        const newFitZoom = calcFitZoom(aW, aH, ratio.w, ratio.h);
        // FIX: Set isFitZoomReady FIRST, before any other state updates.
        // Zustand's storeSetFitZoom triggers synchronous re-renders via
        // useSyncExternalStore, which can flush React's batched updates
        // before setIsFitZoomReady(true) is applied if called after.
        setIsFitZoomReady(true);
        setFitZoom(newFitZoom);
        storeSetFitZoom(newFitZoom);
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      } else if (!retryTimer) {
        // Retry once after 100ms if dimensions are still 0
        retryTimer = setTimeout(() => {
          retryTimer = null;
          computeFit();
        }, 100);
      }
    };

    // Compute immediately (don't wait for first ResizeObserver callback)
    // Use rAF to ensure layout is complete
    const rafId = requestAnimationFrame(() => {
      computeFit();
    });

    const observer = new ResizeObserver(() => {
      computeFit();
    });
    observer.observe(area);
    return () => {
      cancelAnimationFrame(rafId);
      if (retryTimer) clearTimeout(retryTimer);
      observer.disconnect();
    };
  }, [ratio.w, ratio.h, storeSetFitZoom]);

  // ── Auto-center when zoom fits viewport ───────────────────────
  useEffect(() => {
    if (effectiveZoom <= fitZoom || !isFitZoomReady) {
      setPanX(0);
      setPanY(0);
    }
  }, [effectiveZoom, fitZoom, isFitZoomReady]);

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
  // FIX: Use refs for panX/panY/fitZoom instead of closure values.
  // This prevents stale state bugs and avoids re-registering the handler
  // on every pan change (which was causing unnecessary overhead).
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

      // Current zoom — read fitZoom from ref to avoid stale closure
      const currentFitZoom = fitZoomRef.current;
      const currentZoom = resolveZoom(useCanvaStore.getState().zoom, currentFitZoom);
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = clampZoom(currentZoom + delta);
      if (newZoom === currentZoom) return;

      // Adjust pan so the point under cursor stays in place
      // Formula: newPan = mousePos - (mousePos - oldPan) * (newZoom / oldZoom)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const currentPanX = panXRef.current;
      const currentPanY = panYRef.current;
      const scale = newZoom / currentZoom;
      const newPanX = mouseX - (mouseX - (centerX + currentPanX)) * scale - centerX;
      const newPanY = mouseY - (mouseY - (centerY + currentPanY)) * scale - centerY;

      setPanX(newPanX);
      setPanY(newPanY);
      setZoom(newZoom);
    };

    area.addEventListener('wheel', handleWheel, { passive: false });
    return () => area.removeEventListener('wheel', handleWheel);
  }, [setZoom]); // Only re-register when setZoom changes (never — it's stable)

  // ── Wrap handleAreaMouseMove (no longer passing onMouseMove — dead chain removed) ──
  const onAreaMouseMove = useCallback((e: React.MouseEvent) => {
    handleAreaMouseMove(e);
  }, [handleAreaMouseMove]);

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

  // ── Derived state ─────────────────────────────────────────────
  const isTemplateMode = page && page.templateType && page.templateType !== 'custom';
  const isSchemaDriven = !!page?.schema;
  const isMultiSelected = (elId: string) => selectedElIds.includes(elId) && selectedElIds.length > 1;

  // ── Empty state: no pages at all ──────────────────────────────────
  if (pagesLength === 0) return <CanvasEmptyState />;
  if (!page) return null;

  // Cursor style
  const cursorStyle = isPanning ? 'grabbing' : spaceHeld ? 'grab' : tool === 'text' ? 'text' : 'default';

  return (
    <div
      ref={canvasAreaRef}
      id="cm-canvas-area"
      className="flex-1 w-full bg-app-surface overflow-hidden flex items-center justify-center"
      style={{
        cursor: cursorStyle,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
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
      {/* Use opacity instead of visibility for smoother reveal + safety fallback */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${effectiveZoom})`,
          transformOrigin: 'center center',
          transition: panDragRef.current ? 'none' : 'transform 0.15s ease-out',
          opacity: isFitZoomReady ? 1 : 0,
          transitionProperty: 'transform, opacity',
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
            <PageTransition
              pageKey={`stage-page-${currentPageIndex}`}
              direction={pageDirection as PageDirection}
              duration={0.22}
            >
              <PageRenderer
                mode={canvasPreview ? 'preview' : 'canvas'}
                page={page}
                currentPageIndex={currentPageIndex}
                totalPages={pagesLength}
                isTemplateSelected={!canvasPreview}
              />
            </PageTransition>
          </CanvasErrorBoundary>

          {/* ══ Page Empty State — page exists but has no blocks ═════ */}
          {/* Professional empty state with action buttons + keyboard hints */}
          {!canvasPreview && !isTemplateMode && (
            (isSchemaDriven && page.schema && page.schema.blocks.length === 0) ||
            (!isSchemaDriven && page.elements.length === 0)
          ) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: Z.CANVAS_OVERLAY }}>
              <div className="bg-app-surface/90 backdrop-blur-sm border border-app-accent/20 rounded-2xl p-6 flex flex-col items-center gap-4 max-w-xs text-center shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center">
                  <Layout size={24} className="text-app-accent/60" />
                </div>
                <div>
                  <p className="text-sm font-bold text-app-primary/80 mb-1">
                    Halaman Kosong
                  </p>
                  <p className="text-xs text-app-muted/70">
                    Mulai tambahkan konten atau generate otomatis dengan AI
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => {
                      useCanvaStore.getState().setLeftTab('add-block');
                      if (!useCanvaStore.getState().leftPanelOpen) useCanvaStore.getState().toggleLeftPanel();
                    }}
                    className="flex-1 px-3 py-2.5 bg-app-accent/10 hover:bg-app-accent/20 border border-app-accent/25 text-app-accent text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-[0.97]"
                  >
                    <Plus size={13} /> Tambah Block
                  </button>
                  <button
                    onClick={() => useAuthoringStore.getState().setActivePanel('autogen')}
                    className="flex-1 px-3 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-[0.97]"
                  >
                    <Sparkles size={13} /> Auto-Generate
                  </button>
                </div>
                {/* Keyboard shortcuts hint */}
                <div className="w-full border-t border-app-border/20 pt-3 space-y-1">
                  <div className="flex items-center gap-2 text-[8px] text-app-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-app-elevated/60 border border-app-border/30 font-mono text-[7px] font-bold">Ctrl+Z</kbd>
                    <span>Undo</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-app-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-app-elevated/60 border border-app-border/30 font-mono text-[7px] font-bold">Del</kbd>
                    <span>Hapus block terpilih</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ Canvas-only overlays (hidden in preview mode) ═════ */}

          {/* Grid Overlay */}
          {showGrid && !canvasPreview && (
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

          {/* Render editable elements on top of PageRenderer — ONLY for non-schema pages, NOT in preview */}
          {/* Schema-driven pages use SchemaScreenRenderer exclusively; legacy elements[] must not overlap */}
          {!canvasPreview && !isSchemaDriven && page.elements.length > 0 && (
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

          {/* Template mode badge (hidden in preview) */}
          {isTemplateMode && !canvasPreview && (
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
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-app-accent/20 text-app-accent border border-app-accent/30 pointer-events-none" style={{ zIndex: Z.INFO_BADGE }}>
              {selectedElIds.length} elemen terpilih • Shift+klik untuk tambah • Del untuk hapus
            </div>
          )}

          {/* Batch operations bar (replaces old multi-select badge) */}
          {!canvasPreview && selectedBlockIds.length > 1 && (
            <BatchOperationsBar />
          )}
        </div>
      </div>
    </div>
  );
}
