'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';
import {
  STYLE_FAMILIES,
  applyStyleFamily,
  detectStyleFamily,
  type StyleFamily,
} from '@/lib/style-family-engine';

// ═══════════════════════════════════════════════════════════════
// BATCH-10: WorkspaceStyleMenu now uses StyleFamily engine.
//
// Previously: applyStyleGlobal() only patched schema.themeId.
// Now: applyStyleFamilyActive() patches themeId + navbarStyle +
//      scoreDisplayStyle — a coherent bundle of style fields.
//
// Content fields (title, body, questions, ans, ex, etc.) are NEVER
// touched. The applyStyleFamily() function is pure and tested to
// preserve all content.
// ═══════════════════════════════════════════════════════════════

export function WorkspaceStyleMenu() {
  const pages = useCanvaStore((s) => s.pages);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // V3-1A: Compute menu position from button rect — appears below button
  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 = 14rem = 224px
      const left = Math.max(8, rect.right - menuWidth);
      const top = rect.bottom + 8;
      setMenuPos({ top, left });
    }
  }, [open]);

  // BATCH-10: Detect current family from pages (reverse-maps themeId → family)
  const currentFamilyId = React.useMemo(() => detectStyleFamily(pages), [pages]);
  const currentFamily = STYLE_FAMILIES.find((f) => f.id === currentFamilyId);
  const currentLabel = currentFamily?.label ?? 'Modern Bersih';

  // BATCH-10: Apply style family — patches themeId + navbarStyle + scoreDisplayStyle
  // Does NOT touch content fields (verified by tests + verifyContentPreserved).
  const applyStyleFamilyActive = (family: StyleFamily) => {
    const state = useCanvaStore.getState();
    state._pushHistory();
    // Cast pages to Record<string, unknown>[] for the pure applyStyleFamily
    // function. The function only patches style fields (themeId, navbarStyle,
    // scoreDisplayStyle) and preserves all content fields. The cast is safe
    // because CanvaPage is a plain object with string keys.
    const pagesAsRecords = state.pages as unknown as Record<string, unknown>[];
    const newPages = applyStyleFamily(pagesAsRecords, family.id);
    useCanvaStore.setState({ pages: newPages as unknown as typeof state.pages });
    setOpen(false);
    toast.success(`Style diterapkan: ${family.label}`);
  };

  // V3-1A: Portal at document.body with position from buttonRef rect
  const dropdown = open ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-56"
        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
        role="menu"
        aria-label="Pilih style media"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">Style Media</div>
        {STYLE_FAMILIES.map((family) => {
          const isActive = currentFamilyId === family.id;
          return (
            <button
              key={family.id}
              onClick={() => applyStyleFamilyActive(family)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${isActive ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
              role="menuitem"
              type="button"
              aria-label={`Terapkan style ${family.label}`}
              data-testid={`style-family-btn-${family.id}`}
            >
              <div className="flex gap-0.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: family.accentColor }} aria-hidden="true" />
              </div>
              <span className="flex-1">{family.label}</span>
              {isActive && <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '16px' }}>check</span>}
            </button>
          );
        })}
        <div className="px-3 py-1.5 text-xs text-slate-400 border-t border-slate-100 mt-1">Style berlaku untuk semua halaman</div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <div className="flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Pilih style media"
        aria-expanded={open}
        type="button"
        data-testid="workspace-style-menu-btn"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '16px' }}>palette</span>
        <span className="hidden lg:inline">{currentLabel}</span>
        <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '14px' }}>expand_more</span>
      </button>
      {dropdown}
    </div>
  );
}
