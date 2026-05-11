'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { RATIOS } from '../types';
import { PageRenderer } from '../page-renderer';
import { CanvasErrorBoundary } from '../CanvasErrorBoundary';
import { StageElement } from './StageElement';
import { Zap, Lock, Unlock } from 'lucide-react';
import { useStageKeyboard } from './use-stage-keyboard';
import { useStageDrag } from './use-stage-drag';
import { Z } from './constants';

// ═══════════════════════════════════════════════════════════════
// STAGE — Canvas editing area with snap feedback & multi-select
//
// Modular architecture:
//   - useStageKeyboard → keyboard shortcut handling
//   - useStageDrag → drag/resize/snap logic
//   - StageElement → individual element with handles
//   - constants → resize handles, icon/color maps
// ═══════════════════════════════════════════════════════════════

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
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(0.5);
  const [stageW, setStageW] = useState(ratio.w);
  const [stageH, setStageH] = useState(ratio.h);

  // ── Keyboard shortcuts ────────────────────────────────────────
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
    baseScale,
    zoom,
    stageW,
    stageH,
    snapEnabled,
    snapValue,
    updateElement,
    _pushHistory,
  });

  // Wrap handleAreaMouseMove to pass onMouseMove callback
  const onAreaMouseMove = useCallback((e: React.MouseEvent) => {
    handleAreaMouseMove(e, onMouseMove);
  }, [handleAreaMouseMove, onMouseMove]);

  // ── ResizeObserver for responsive scaling ─────────────────────
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

  // ── Drop from element panel ───────────────────────────────────
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
  }, [baseScale, zoom, stageW, stageH, addElement, stageWrapRef]);

  // ── Click on stage background ─────────────────────────────────
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
    selectBlock(null);
  };

  // ── Template field edit handler ───────────────────────────────
  const handleTemplateEdit = useCallback((key: string, value: string) => {
    updateTemplateData(key, value);
  }, [updateTemplateData]);

  // ── Derived state ─────────────────────────────────────────────
  const scale = baseScale * zoom;
  const isTemplateMode = page && page.templateType && page.templateType !== 'custom';
  const isLocked = page?.locked !== false;
  const isUnlockedTemplate = !!isTemplateMode && !isLocked;
  const isSchemaDriven = !!page?.schema;
  const isMultiSelected = (elId: string) => selectedElIds.includes(elId) && selectedElIds.length > 1;

  if (!page) return null;

  return (
    <div
      ref={canvasAreaRef}
      id="cm-canvas-area"
      className="flex-1 bg-app-surface overflow-hidden flex items-center justify-center"
      style={{ cursor: tool === 'text' ? 'text' : 'default' }}
      onMouseMove={onAreaMouseMove}
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

          {/* Overlay elements on LOCKED template pages — editable in canvas */}
          {isTemplateMode && isLocked && (page.overlayElements || []).length > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z.CANVAS_ELEMENT }}>
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
                  onStartDrag={(startX, startY) => startMoveDrag(el.id, startX, startY, el.x, el.y)}
                  onStartResize={(dir, startX, startY) => startResizeDrag(el.id, dir, startX, startY, el.x, el.y, el.w, el.h)}
                />
              ))}
            </div>
          )}

          {/* Custom Mode + Unlocked Template: Render editable elements on top of PageRenderer */}
          {(!isTemplateMode || isUnlockedTemplate) && (
            <div className="absolute inset-0" style={isUnlockedTemplate ? { zIndex: Z.CANVAS_LABEL } : undefined}>
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
                : isLocked
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`} style={{ zIndex: Z.INFO_BADGE }}>
              {isSchemaDriven ? <Zap size={10} /> : isLocked ? <Lock size={10} /> : <Unlock size={10} />} {isSchemaDriven ? 'SCHEMA' : page.templateType}
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
