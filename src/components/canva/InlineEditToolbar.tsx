'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import type { CanvaElement } from './types';
import { LAYOUT_VARIANTS, type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { ELEMENT_TYPE_COLORS } from '@/lib/canva-icon-maps';
import {
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════
// INLINE EDIT TOOLBAR — Floating toolbar above selected element
// Phase 3 feature: Quick actions for selected element
// Shows: label, layout variant (A/B/C/D), visibility, z-order, duplicate, delete
// ═══════════════════════════════════════════════════════════════

interface InlineEditToolbarProps {
  element: CanvaElement;
  scale: number;
}

export default function InlineEditToolbar({ element, scale }: InlineEditToolbarProps) {
  const {
    updateElement,
    deleteElement,
    toggleElementVisibility,
    moveElementZ,
    pages,
    currentPageIndex,
  } = useCanvaStore();

  const page = pages[currentPageIndex];
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [labelEdit, setLabelEdit] = useState(false);
  const [labelValue, setLabelValue] = useState(element.label || '');

  // Update local label when element changes
  useEffect(() => {
    setLabelValue(element.label || '');
  }, [element.label]);

  const isOverlay = (page?.overlayElements || []).some(oe => oe.id === element.id);
  const typeColor = ELEMENT_TYPE_COLORS[element.type] || '#888';

  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    const store = useCanvaStore.getState();
    const pages = store.pages;
    const page = pages[store.currentPageIndex];
    if (!page) return;
    const newEl: CanvaElement = {
      ...element,
      id: 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      x: element.x + 2,
      y: element.y + 2,
    };
    store._pushHistory();
    const newPages = [...pages];
    if (isOverlay) {
      newPages[store.currentPageIndex] = {
        ...page,
        overlayElements: [...(page.overlayElements || []), newEl],
      };
    } else {
      newPages[store.currentPageIndex] = {
        ...page,
        elements: [...page.elements, newEl],
      };
    }
    useCanvaStore.setState({ pages: newPages, selectedElId: newEl.id, selectedElIds: [newEl.id] });
    toast.success('Elemen diduplikasi');
  }, [element, isOverlay]);

  // Handle label save
  const handleLabelSave = useCallback(() => {
    if (labelValue.trim()) {
      updateElement(element.id, { label: labelValue.trim() });
    }
    setLabelEdit(false);
  }, [element.id, labelValue, updateElement]);

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 pointer-events-auto"
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        transform: `translate(0, calc(-100% - 8px)) scale(${1 / scale})`,
        transformOrigin: 'bottom left',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="glass-panel-strong rounded-xl border border-amber-500/20 shadow-xl shadow-black/40 overflow-hidden">
        {/* Main toolbar row */}
        <div className="flex items-center gap-0.5 px-1.5 py-1">
          {/* Type indicator dot */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-1"
            style={{ background: typeColor }}
            title={element.type}
          />

          {/* Label (click to edit) */}
          {labelEdit ? (
            <input
              type="text"
              value={labelValue}
              onChange={e => setLabelValue(e.target.value)}
              onBlur={handleLabelSave}
              onKeyDown={e => { if (e.key === 'Enter') handleLabelSave(); if (e.key === 'Escape') setLabelEdit(false); }}
              className="h-6 px-1.5 text-[10px] text-slate-200 bg-slate-800/80 border border-amber-500/30 rounded-md w-24 focus:outline-none focus-ring"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setLabelEdit(true)}
              className="text-[10px] font-semibold text-slate-200 hover:text-amber-300 transition-colors truncate max-w-[80px] px-1"
              title="Klik untuk edit label"
            >
              {element.icon} {element.label || element.type}
            </button>
          )}

          <div className="w-px h-4 bg-slate-700/50 mx-0.5" />

          {/* Layout variant (only for modul/materi) */}
          {(element.type === 'modul' || element.type === 'materi') && (
            <>
              <div className="flex gap-0.5">
                {LAYOUT_VARIANTS.map(v => {
                  const current = (element.layoutVariant as LayoutVariant) || 'A';
                  return (
                    <button
                      key={v.id}
                      onClick={() => updateElement(element.id, { layoutVariant: v.id })}
                      className={`w-5 h-5 rounded text-[8px] font-black transition-colors ${
                        current === v.id
                          ? 'bg-amber-500 text-slate-900'
                          : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                      }`}
                      title={`Variant ${v.label}: ${v.desc}`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
              <div className="w-px h-4 bg-slate-700/50 mx-0.5" />
            </>
          )}

          {/* Z-order buttons */}
          <div className="flex items-center gap-0">
            <button
              onClick={() => moveElementZ(element.id, 'up')}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
              title="Naik layer"
            >
              <ChevronUp size={10} />
            </button>
            <button
              onClick={() => moveElementZ(element.id, 'down')}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
              title="Turun layer"
            >
              <ChevronDown size={10} />
            </button>
          </div>

          <div className="w-px h-4 bg-slate-700/50 mx-0.5" />

          {/* Visibility toggle */}
          <button
            onClick={() => toggleElementVisibility(element.id)}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              element.hidden
                ? 'text-slate-700 hover:text-slate-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={element.hidden ? 'Tampilkan' : 'Sembunyikan'}
          >
            {element.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-amber-300 hover:bg-slate-800/40 transition-colors"
            title="Duplikat elemen"
          >
            <Copy size={10} />
          </button>

          {/* Delete */}
          <button
            onClick={() => deleteElement(element.id)}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Hapus elemen (Del)"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
