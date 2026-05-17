'use client';

import { memo, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import type { CanvaElement, ResizeDir } from '../types';
import { RESIZE_HANDLES } from './constants';
import { CanvasElementPreview } from './CanvasElementPreview';
import { COLORS } from '@/lib/color-palette';
import { isInteractiveElementType, isCanvaElementPreviewable } from '@/core/schema/capability-registry';

interface StageElementProps {
  element: CanvaElement;
  isSelected: boolean;
  isMultiSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onStartDrag: (startX: number, startY: number) => void;
  onStartResize: (dir: ResizeDir, startX: number, startY: number) => void;
  isOverlay?: boolean;
}

/* ── Stage Element (Canvas editing — drag, resize, select) ─── */
export const StageElement = memo(function StageElement({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onStartDrag,
  onStartResize,
  isOverlay = false,
}: StageElementProps) {
  const { deleteElement, saveTextContent } = useCanvaStore();
  const interactiveMode = useInteractiveStore((s) => s.mode);
  const textRef = useRef<HTMLDivElement>(null);
  const isInteractive = isInteractiveElementType(element.type);
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
    ? 'ring-2 ring-amber-400/70 ring-offset-0 z-10'
    : isSelected && !isInteractiveMode
      ? 'ring-2 ring-app-accent ring-offset-0 z-10 selection-glow'
      : 'z-0';

  return (
    <div
      className={`absolute group ${ringClass} ${element.hidden ? 'hidden' : ''} ${isOverlay ? 'pointer-events-auto' : ''} transition-[box-shadow,transform] duration-150`}
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
              ? '-top-5 bg-amber-400/90 text-amber-950'
              : '-top-5 bg-app-accent/90 text-app-inverse'
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
              color: element.textColor || COLORS.textWhite,
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
        {/* Previewable elements (kuis/game/materi/modul) — show compact label in canvas mode */}
        {isCanvaElementPreviewable(element.type) && (
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
              className="absolute w-4 h-4 bg-app-accent border border-app-accent rounded-sm z-30 hover:bg-app-accent/80 transition-colors"
              style={{ ...h.style, cursor: h.cursor }}
            />
          ))}
        </>
      )}
    </div>
  );
});
