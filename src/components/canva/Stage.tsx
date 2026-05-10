'use client';

import { useCallback, useRef, useState, useEffect, memo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CanvaElement, ResizeDir } from './types';
import { RATIOS } from './types';
import { PageRenderer } from './page-renderer';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

// ═══════════════════════════════════════════════════════════════
// STAGE — Canvas editing area with snap feedback & multi-select
//
// Refactored: Uses PageRenderer for consistent page rendering
// (navbar, background, template, elements) — identical to
// PlayOverlay and ExportApp. Only adds canvas-specific features:
// - Drag, resize, snap for elements
// - Grid overlay
// - Multi-select
// - Element handle bars & resize handles
// ═══════════════════════════════════════════════════════════════

// ── Module-level constants (avoid re-creation on every render) ──
const RESIZE_HANDLES: { dir: ResizeDir; style: React.CSSProperties; cursor: string }[] = [
  { dir: 'tl', style: { top: -7, left: -7 }, cursor: 'nwse-resize' },
  { dir: 'tr', style: { top: -7, right: -7 }, cursor: 'nesw-resize' },
  { dir: 'bl', style: { bottom: -7, left: -7 }, cursor: 'nesw-resize' },
  { dir: 'br', style: { bottom: -7, right: -7 }, cursor: 'nwse-resize' },
  { dir: 'tm', style: { top: -7, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'bm', style: { bottom: -7, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
  { dir: 'l', style: { top: '50%', left: -7, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  { dir: 'r', style: { top: '50%', right: -7, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
];

const ELEMENT_ICON_MAP: Record<string, string> = {
  kuis: '❓', game: '🎮', materi: '📝', modul: '🧩', image: '🖼️',
};
const ELEMENT_COLOR_MAP: Record<string, string> = {
  kuis: 'rgba(245,200,66,.3)', game: 'rgba(56,217,217,.3)',
  materi: 'rgba(167,139,250,.3)', modul: 'rgba(52,211,153,.3)', image: 'rgba(249,115,22,.3)',
};
const ELEMENT_TEXT_COLOR_MAP: Record<string, string> = {
  kuis: '#f5c842', game: '#3ecfcf', materi: '#a78bfa', modul: '#34d399', image: '#f97316',
};

export default function Stage({ onMouseMove }: { onMouseMove: (x: number, y: number) => void }) {
  const {
    pages,
    currentPageIndex,
    zoom,
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
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(0.5);
  const [stageW, setStageW] = useState(ratio.w);
  const [stageH, setStageH] = useState(ratio.h);

  // Phase 4: Snap guide lines state
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);

  // Drag & resize state
  const dragState = useRef<{
    type: 'move' | 'resize';
    elId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW?: number;
    origH?: number;
    dir?: ResizeDir;
  } | null>(null);

  // Phase 4: Keyboard shortcuts for multi-select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Ctrl+A / Cmd+A — select all elements
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllElements();
        return;
      }
      // Delete / Backspace — delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElIds.length > 1) {
          e.preventDefault();
          deleteSelectedElements();
          return;
        }
      }
      // Escape — clear selection
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElIds, selectAllElements, deleteSelectedElements, clearSelection]);

  // Phase 4: Helper to compute snap lines during drag
  const computeSnapLines = useCallback((elId: string, newX: number, newY: number, newW?: number, newH?: number) => {
    if (!snapEnabled || !page) return [];
    const lines: { x?: number; y?: number }[] = [];
    const el = page.elements.find(e => e.id === elId) || page.overlayElements?.find(e => e.id === elId);
    if (!el) return [];

    const w = newW ?? el.w;
    const h = newH ?? el.h;
    const elCenterX = newX + w / 2;
    const elCenterY = newY + h / 2;
    const elRight = newX + w;
    const elBottom = newY + h;

    // Check alignment with other elements
    const allEls = [...page.elements, ...(page.overlayElements || [])].filter(e => e.id !== elId && !e.hidden);
    for (const other of allEls) {
      const oCenterX = other.x + other.w / 2;
      const oCenterY = other.y + other.h / 2;
      const oRight = other.x + other.w;
      const oBottom = other.y + other.h;

      if (Math.abs(newX - other.x) < 1) lines.push({ x: other.x });
      if (Math.abs(elRight - oRight) < 1) lines.push({ x: oRight });
      if (Math.abs(elCenterX - oCenterX) < 1) lines.push({ x: oCenterX });

      if (Math.abs(newY - other.y) < 1) lines.push({ y: other.y });
      if (Math.abs(elBottom - oBottom) < 1) lines.push({ y: oBottom });
      if (Math.abs(elCenterY - oCenterY) < 1) lines.push({ y: oCenterY });
    }

    // Check grid snap lines
    const snappedX = snapValue(newX);
    const snappedY = snapValue(newY);
    if (Math.abs(snappedX - newX) < 0.5) lines.push({ x: snappedX });
    if (Math.abs(snappedY - newY) < 0.5) lines.push({ y: snappedY });

    return lines;
  }, [snapEnabled, page, snapValue]);

  // Track mouse position
  const handleAreaMouseMove = useCallback((e: React.MouseEvent) => {
    if (!stageWrapRef.current) return;
    const rect = stageWrapRef.current.getBoundingClientRect();
    const scale = baseScale * zoom;
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    if (x >= 0 && y >= 0 && x <= stageW && y <= stageH) {
      onMouseMove(x, y);
    }

    if (!dragState.current || !canvasAreaRef.current) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const dxPct = dx / scale / stageW * 100;
    const dyPct = dy / scale / stageH * 100;

    if (dragState.current.type === 'move') {
      const rawX = Math.max(0, Math.min(90, dragState.current.origX + dxPct));
      const rawY = Math.max(0, Math.min(90, dragState.current.origY + dyPct));
      const newX = snapEnabled ? snapValue(rawX) : rawX;
      const newY = snapEnabled ? snapValue(rawY) : rawY;
      updateElement(dragState.current.elId, { x: newX, y: newY });

      if (snapEnabled) {
        const lines = computeSnapLines(dragState.current.elId, newX, newY);
        setSnapLines(lines);
      }
    } else if (dragState.current.type === 'resize') {
      const dir = dragState.current.dir!;
      const orig = {
        x: dragState.current.origX,
        y: dragState.current.origY,
        w: dragState.current.origW!,
        h: dragState.current.origH!,
      };

      let newX = orig.x, newY = orig.y, newW = orig.w, newH = orig.h;

      if (dir.includes('r')) newW = Math.max(10, orig.w + dxPct);
      if (dir.includes('b')) newH = Math.max(8, orig.h + dyPct);
      if (dir.includes('l')) {
        newX = Math.min(orig.x + orig.w - 10, orig.x + dxPct);
        newW = Math.max(10, orig.w - dxPct);
      }
      if (dir.includes('t')) {
        newY = Math.min(orig.y + orig.h - 8, orig.y + dyPct);
        newH = Math.max(8, orig.h - dyPct);
      }

      if (snapEnabled) {
        newX = snapValue(newX);
        newY = snapValue(newY);
        newW = snapValue(newW);
        newH = snapValue(newH);
        newW = Math.max(10, newW);
        newH = Math.max(8, newH);
      }

      updateElement(dragState.current.elId, { x: newX, y: newY, w: newW, h: newH });

      if (snapEnabled) {
        const lines = computeSnapLines(dragState.current.elId, newX, newY, newW, newH);
        setSnapLines(lines);
      }
    }
  }, [baseScale, zoom, stageW, stageH, updateElement, onMouseMove, snapEnabled, snapValue, computeSnapLines]);

  const handleMouseUp = useCallback(() => {
    dragState.current = null;
    setSnapLines([]);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const observer = new ResizeObserver(() => {
      const aW = (area.clientWidth || 800) - 20;
      const aH = (area.clientHeight || 500) - 20;
      const scaleW = aW / ratio.w;
      const scaleH = aH / ratio.h;
      setBaseScale(Math.min(scaleW, scaleH, 1));
      setStageW(ratio.w);
      setStageH(ratio.h);
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [ratio]);

  // Handle drop from element panel
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const elType = e.dataTransfer.getData('elemType');
    if (!elType) return;
    const rect = stageWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = baseScale * zoom;
    const x = Math.max(2, Math.min(80, (e.clientX - rect.left) / scale / stageW * 100));
    const y = Math.max(2, Math.min(85, (e.clientY - rect.top) / scale / stageH * 100));
    addElement(elType, parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
  }, [baseScale, zoom, stageW, stageH, addElement]);

  // Handle click on stage background
  const handleStageBgClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id !== 'cm-stage-wrap' && target.id !== 'cm-stage-bg' && target.id !== 'cm-canvas-area' && target.id !== 'cm-stage-bg-overlay' && !target.closest('[data-snap-line]')) return;

    if (tool === 'text') {
      const rect = stageWrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scale = baseScale * zoom;
      const x = Math.max(2, Math.min(80, (e.clientX - rect.left) / scale / stageW * 100));
      const y = Math.max(2, Math.min(85, (e.clientY - rect.top) / scale / stageH * 100));
      addElement('teks', parseFloat(x.toFixed(1)), parseFloat(y.toFixed(1)));
      useCanvaStore.getState().setTool('select');
      return;
    }

    selectElement(null);
  };

  // Handle template field edit
  const handleTemplateEdit = useCallback((key: string, value: string) => {
    updateTemplateData(key, value);
  }, [updateTemplateData]);

  const scale = baseScale * zoom;
  const isTemplateMode = page && page.templateType && page.templateType !== 'custom';
  const isLocked = page?.locked !== false;
  const isUnlockedTemplate = !!isTemplateMode && !isLocked;
  // Schema-driven pages: content comes from SchemaScreenRenderer, not overlay elements
  const isSchemaDriven = !!(page?.templateData?.schemaScreen);

  // Phase 4: Check if an element is in multi-select
  const isMultiSelected = (elId: string) => selectedElIds.includes(elId) && selectedElIds.length > 1;

  if (!page) return null;

  return (
    <div
      ref={canvasAreaRef}
      id="cm-canvas-area"
      className="flex-1 bg-slate-800 overflow-hidden flex items-center justify-center"
      style={{ cursor: tool === 'text' ? 'text' : 'default' }}
      onMouseMove={handleAreaMouseMove}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
    >
      <div className="relative" style={{ padding: '10px', maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }}>
        <div
          ref={stageWrapRef}
          id="cm-stage-wrap"
          className="relative overflow-hidden shadow-2xl shadow-black/50"
          style={{
            width: stageW,
            height: stageH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
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

          {/* Grid Overlay (custom mode + unlocked templates) */}
          {(!isTemplateMode || isUnlockedTemplate) && showGrid && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)`,
              backgroundSize: `${gridSize}% ${gridSize}%`,
            }} />
          )}

          {/* Snap Guide Lines */}
          {snapLines.length > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
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

          {/* Overlay elements on LOCKED template pages — editable in canvas */}
          {isTemplateMode && isLocked && (page.overlayElements || []).length > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
              {(page.overlayElements || []).map(el => (
                <StageElement
                  key={el.id}
                  element={el}
                  isSelected={el.id === selectedElId || isMultiSelected(el.id)}
                  isMultiSelected={isMultiSelected(el.id)}
                  isOverlay={true}
                  onSelect={(shiftKey) => {
                    if (shiftKey) toggleElementSelection(el.id);
                    else selectElement(el.id);
                  }}
                  onStartDrag={(startX, startY) => {
                    _pushHistory();
                    dragState.current = { type: 'move', elId: el.id, startX, startY, origX: el.x, origY: el.y };
                  }}
                  onStartResize={(dir, startX, startY) => {
                    _pushHistory();
                    dragState.current = { type: 'resize', elId: el.id, startX, startY, origX: el.x, origY: el.y, origW: el.w, origH: el.h, dir };
                  }}
                />
              ))}
            </div>
          )}

          {/* Custom Mode + Unlocked Template: Render editable elements on top of PageRenderer */}
          {(!isTemplateMode || isUnlockedTemplate) && (
            <div className="absolute inset-0" style={isUnlockedTemplate ? { zIndex: 20 } : undefined}>
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
                  onStartDrag={(startX, startY) => {
                    _pushHistory();
                    dragState.current = { type: 'move', elId: el.id, startX, startY, origX: el.x, origY: el.y };
                  }}
                  onStartResize={(dir, startX, startY) => {
                    _pushHistory();
                    dragState.current = { type: 'resize', elId: el.id, startX, startY, origX: el.x, origY: el.y, origW: el.w, origH: el.h, dir };
                  }}
                />
              ))}
            </div>
          )}

          {/* Template mode badge */}
          {isTemplateMode && (
            <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[9px] font-bold border pointer-events-none flex items-center gap-1 z-[60] ${
              isSchemaDriven
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : isLocked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isSchemaDriven ? '⚡' : isLocked ? '🔒' : '🔓'} {isSchemaDriven ? 'SCHEMA' : page.templateType}
            </div>
          )}

          {/* Multi-select info badge */}
          {selectedElIds.length > 1 && (
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 pointer-events-none z-50">
              {selectedElIds.length} elemen terpilih • Shift+klik untuk tambah • Del untuk hapus
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Stage Element (Canvas editing — drag, resize, select) ─── */

const StageElement = memo(function StageElement({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onStartDrag,
  onStartResize,
  isOverlay = false,
}: {
  element: CanvaElement;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onStartDrag: (startX: number, startY: number) => void;
  onStartResize: (dir: ResizeDir, startX: number, startY: number) => void;
  isOverlay?: boolean;
}) {
  const { deleteElement, saveTextContent } = useCanvaStore();
  const interactiveMode = useInteractiveStore((s) => s.mode);
  const textRef = useRef<HTMLDivElement>(null);
  const isInteractive = element.type === 'kuis' || element.type === 'game';
  const isInteractiveMode = interactiveMode === 'interactive';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(e.shiftKey);
    if (isInteractiveMode) return;
    if (!isInteractive || !isSelected) {
      onStartDrag(e.clientX, e.clientY);
    }
  };

  const handleBarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSelected) onSelect(e.shiftKey);
    onStartDrag(e.clientX, e.clientY);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDir) => {
    e.stopPropagation();
    e.preventDefault();
    onStartResize(dir, e.clientX, e.clientY);
  };

  const handleTextBlur = () => {
    if (textRef.current) {
      saveTextContent(element.id, textRef.current.textContent || '');
    }
  };

  const resizeHandles = RESIZE_HANDLES;

  const ringClass = isMultiSelected
    ? 'ring-2 ring-blue-400 ring-offset-0 z-10'
    : isSelected && !isInteractiveMode
      ? 'ring-2 ring-amber-400 ring-offset-0 z-10'
      : 'z-0';

  return (
    <div
      className={`absolute group ${ringClass} ${element.hidden ? 'hidden' : ''} ${isOverlay ? 'pointer-events-auto' : ''}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.w}%`,
        height: `${element.h}%`,
        opacity: (element.opacity ?? 100) / 100,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Handle bar */}
      {!isInteractiveMode && (
      <div
        className={`absolute left-0 right-0 flex items-center justify-between px-1 rounded-t text-[9px] font-bold z-20 transition-all ${
          isSelected
            ? isMultiSelected
              ? '-top-5 bg-blue-500/90 text-blue-950'
              : '-top-5 bg-amber-500/90 text-amber-950'
            : '-top-4 bg-black/60 text-white/80 opacity-0 group-hover:opacity-100'
        }`}
        onMouseDown={handleBarMouseDown}
      >
        <span className="truncate cursor-grab">{element.icon} {element.label || element.type}</span>
        {isSelected && !isMultiSelected && (
          <button
            onClick={e => { e.stopPropagation(); deleteElement(element.id); }}
            className="ml-1 hover:text-red-700 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      )}

      {/* Body — simplified, just visual preview in canvas */}
      <div className="w-full h-full overflow-hidden rounded-sm">
        {element.type === 'teks' && (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTextBlur}
            className="w-full h-full outline-none"
            style={{
              fontSize: `${element.fontSize || 20}px`,
              fontWeight: element.fontWeight || 700,
              color: element.textColor || '#ffffff',
              textAlign: element.textAlign || 'left',
              textShadow: '0 2px 8px rgba(0,0,0,.5)',
              lineHeight: 1.4,
              padding: 8,
            }}
          >
            {element.text || 'Ketik teks…'}
          </div>
        )}
        {element.type === 'shape' && (
          <div
            className="w-full h-full rounded-lg"
            style={{
              background: element.color || 'rgba(255,255,255,.15)',
              borderRadius: element.radius || 8,
            }}
          />
        )}
        {/* For kuis/game/materi/modul — show compact label in canvas mode */}
        {(element.type === 'kuis' || element.type === 'game' || element.type === 'materi' || element.type === 'modul') && (
          <CanvasElementPreview element={element} />
        )}
        {element.type === 'image' && (
          element.imageUrl ? (
            <img
              src={element.imageUrl}
              alt={element.label || 'Gambar'}
              className="w-full h-full rounded-sm"
              style={{ objectFit: element.imageFit || 'cover' }}
              draggable={false}
            />
          ) : (
            <CanvasElementPreview element={element} />
          )
        )}
      </div>

      {/* Resize handles */}
      {isSelected && !isInteractiveMode && !isMultiSelected && (
        <>
          {resizeHandles.map(h => (
            <div
              key={h.dir}
              onMouseDown={e => handleResizeMouseDown(e, h.dir)}
              className="absolute w-4 h-4 bg-amber-400 border border-amber-600 rounded-sm z-30 hover:bg-amber-300 transition-colors"
              style={{ ...h.style, cursor: h.cursor }}
            />
          ))}
        </>
      )}
    </div>
  );
});

/* ── Compact element preview for canvas editing mode ────────── */

function CanvasElementPreview({ element }: { element: CanvaElement }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center rounded-sm"
      style={{ background: ELEMENT_COLOR_MAP[element.type] || 'rgba(255,255,255,.1)' }}>
      <span className="text-2xl">{ELEMENT_ICON_MAP[element.type] || '📦'}</span>
      <span className="text-[9px] font-bold mt-1" style={{ color: ELEMENT_TEXT_COLOR_MAP[element.type] || '#fff' }}>
        {element.label || element.type}
      </span>
    </div>
  );
}
