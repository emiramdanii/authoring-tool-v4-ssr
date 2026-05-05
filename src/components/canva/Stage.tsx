'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { CanvaElement, ResizeDir } from './types';
import QuizWidget from './QuizWidget';
import GameWidget from './GameWidget';
import PageTemplate from './PageTemplate';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';

export default function Stage({ onMouseMove }: { onMouseMove: (x: number, y: number) => void }) {
  const {
    pages,
    currentPageIndex,
    ratioId,
    zoom,
    tool,
    selectedElId,
    selectElement,
    addElement,
    updateElement,
    updateTemplateData,
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  const ratio = useCanvaStore(s => s.currentRatio());

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(0.5);
  const [stageW, setStageW] = useState(ratio.w);
  const [stageH, setStageH] = useState(ratio.h);

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
      const newX = Math.max(0, Math.min(90, dragState.current.origX + dxPct));
      const newY = Math.max(0, Math.min(90, dragState.current.origY + dyPct));
      updateElement(dragState.current.elId, { x: newX, y: newY });
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

      updateElement(dragState.current.elId, { x: newX, y: newY, w: newW, h: newH });
    }
  }, [baseScale, zoom, stageW, stageH, updateElement, onMouseMove]);

  const handleMouseUp = useCallback(() => {
    dragState.current = null;
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
      const aW = (area.clientWidth || 800) - 60;
      const aH = (area.clientHeight || 500) - 60;
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
    if (target.id !== 'cm-stage-wrap' && target.id !== 'cm-stage-bg' && target.id !== 'cm-canvas-area' && target.id !== 'cm-stage-bg-overlay') return;

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

  if (!page) return null;

  return (
    <div
      ref={canvasAreaRef}
      className="flex-1 bg-zinc-950 overflow-auto flex items-center justify-center"
      style={{ cursor: tool === 'text' ? 'text' : 'default' }}
      onMouseMove={handleAreaMouseMove}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
    >
      {/* Checkerboard pattern behind stage */}
      <div className="relative">
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
          {/* Background color */}
          <div
            id="cm-stage-bg"
            className="absolute inset-0"
            style={{ background: page.bgColor || '#1a1a2e' }}
          />

          {/* Background image */}
          {page.bgDataUrl && (
            <img
              src={page.bgDataUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Overlay */}
          <div
            id="cm-stage-bg-overlay"
            className="absolute inset-0 pointer-events-none"
            style={{ background: `rgba(14,28,47,${(page.overlay || 20) / 100})` }}
          />

          {/* Template Mode: Render full-page template */}
          {isTemplateMode && (
            <PageTemplate
              page={page}
              isSelected={true}
              onEditField={handleTemplateEdit}
            />
          )}

          {/* Custom Mode: Render individual elements */}
          {!isTemplateMode && (
            <div className="absolute inset-0">
              {page.elements.map(el => (
                <StageElement
                  key={el.id}
                  element={el}
                  isSelected={el.id === selectedElId}
                  onSelect={() => selectElement(el.id)}
                  onStartDrag={(startX, startY) => {
                    dragState.current = {
                      type: 'move',
                      elId: el.id,
                      startX,
                      startY,
                      origX: el.x,
                      origY: el.y,
                    };
                  }}
                  onStartResize={(dir, startX, startY) => {
                    dragState.current = {
                      type: 'resize',
                      elId: el.id,
                      startX,
                      startY,
                      origX: el.x,
                      origY: el.y,
                      origW: el.w,
                      origH: el.h,
                      dir,
                    };
                  }}
                />
              ))}
            </div>
          )}

          {/* Drop hint (visible when no elements and custom mode) */}
          {!isTemplateMode && page.elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-zinc-600 text-sm mb-2">⬇ Seret elemen ke sini</div>
              <div className="text-zinc-700 text-xs">atau pilih Template dari panel kiri</div>
            </div>
          )}

          {/* Template mode badge */}
          {isTemplateMode && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 pointer-events-none">
              Template: {page.templateType}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Stage Element (Custom Mode) ────────────────────────────── */

function StageElement({
  element,
  isSelected,
  onSelect,
  onStartDrag,
  onStartResize,
}: {
  element: CanvaElement;
  isSelected: boolean;
  onSelect: () => void;
  onStartDrag: (startX: number, startY: number) => void;
  onStartResize: (dir: ResizeDir, startX: number, startY: number) => void;
}) {
  const { updateElement, deleteElement, saveTextContent } = useCanvaStore();
  const textRef = useRef<HTMLDivElement>(null);
  const isInteractive = element.type === 'kuis' || element.type === 'game';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (!isInteractive || !isSelected) {
      onStartDrag(e.clientX, e.clientY);
    }
  };

  const handleBarMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isSelected) onSelect();
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

  // 8-direction resize handles
  const resizeHandles: { dir: ResizeDir; style: React.CSSProperties; cursor: string }[] = [
    { dir: 'tl', style: { top: -5, left: -5 }, cursor: 'nwse-resize' },
    { dir: 'tr', style: { top: -5, right: -5 }, cursor: 'nesw-resize' },
    { dir: 'bl', style: { bottom: -5, left: -5 }, cursor: 'nesw-resize' },
    { dir: 'br', style: { bottom: -5, right: -5 }, cursor: 'nwse-resize' },
    { dir: 'tm', style: { top: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { dir: 'bm', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { dir: 'l', style: { top: '50%', left: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
    { dir: 'r', style: { top: '50%', right: -5, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  ];

  return (
    <div
      className={`absolute group ${isSelected ? 'ring-2 ring-amber-400 ring-offset-0 z-10' : 'z-0'} ${element.hidden ? 'hidden' : ''}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.w}%`,
        height: `${element.h}%`,
        opacity: (element.opacity ?? 100) / 100,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Handle bar — always draggable */}
      <div
        className={`absolute left-0 right-0 flex items-center justify-between px-1 rounded-t text-[9px] font-bold z-20 transition-all ${
          isSelected
            ? '-top-5 bg-amber-500/90 text-amber-950'
            : '-top-4 bg-black/60 text-white/80 opacity-0 group-hover:opacity-100'
        }`}
        onMouseDown={handleBarMouseDown}
      >
        <span className="truncate cursor-grab">{element.icon} {element.label || element.type}</span>
        {isSelected && (
          <button
            onClick={e => { e.stopPropagation(); deleteElement(element.id); }}
            className="ml-1 hover:text-red-700 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div className="w-full h-full overflow-hidden rounded-sm">
        {element.type === 'kuis' && (
          <QuizWidget dataIdx={element.dataIdx} compact />
        )}
        {element.type === 'game' && (
          <GameWidget dataIdx={element.dataIdx} compact />
        )}
        {element.type === 'materi' && (
          <ModuleElementPreview dataIdx={element.dataIdx} layoutVariant={element.layoutVariant as LayoutVariant} />
        )}
        {element.type === 'modul' && (
          <ModuleElementPreview dataIdx={element.dataIdx} layoutVariant={element.layoutVariant as LayoutVariant} />
        )}
        {element.type === 'teks' && (
          <div
            ref={textRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTextBlur}
            className="w-full h-full outline-none text-shadow-lg"
            style={{
              fontSize: `${element.fontSize || 20}px`,
              fontWeight: 700,
              color: element.textColor || '#ffffff',
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
      </div>

      {/* Resize handles (8-direction) */}
      {isSelected && (
        <>
          {resizeHandles.map(h => (
            <div
              key={h.dir}
              onMouseDown={e => handleResizeMouseDown(e, h.dir)}
              className={`absolute w-2.5 h-2.5 bg-amber-400 border border-amber-600 rounded-sm z-30 cursor-${h.cursor}`}
              style={h.style}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ── Module Element Preview (uses PresetModuleCard) ──────────── */

function ModuleElementPreview({ dataIdx, layoutVariant }: { dataIdx?: number; layoutVariant?: LayoutVariant }) {
  const modules = useAuthoringStore((s) => s.modules);
  const mod = dataIdx != null && dataIdx >= 0 && dataIdx < modules.length ? modules[dataIdx] : null;

  if (!mod) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-emerald-500/10 rounded border border-emerald-500/20 p-2">
        <span className="text-2xl">🧩</span>
        <span className="text-[10px] font-bold text-emerald-300 mt-1">Modul</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-1">
      <PresetModuleCard
        mode="canvas"
        module={mod}
        compact
        layoutVariant={layoutVariant || (mod.layoutVariant as LayoutVariant) || 'A'}
      />
    </div>
  );
}
