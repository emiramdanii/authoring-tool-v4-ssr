'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useCanvaStore } from '@/store/canva-store';
import { getAllStylePresets, type StylePresetDefinition } from '@/core/style/preset-registry';
import { toast } from 'sonner';

const STYLE_LABELS: Record<string, string> = {
  'modern-interactive': 'Modern Interaktif',
  'school-cheerful': 'Sekolah Ceria',
  'mission-adventure': 'Misi Petualangan',
  'nusantara-nature': 'Nusantara Alam',
  'academic-clean': 'Akademik Bersih',
  'dark-elegant': 'Gelap Elegan',
};

export function WorkspaceStyleMenu() {
  const pages = useCanvaStore((s) => s.pages);
  const [open, setOpen] = useState(false);

  const currentThemeId = React.useMemo(() => {
    for (const page of pages) {
      const tid = page?.schema?.themeId || (page?.templateData?.schemaThemeId as string | undefined);
      if (tid) return tid;
    }
    return 'modern-interactive';
  }, [pages]);

  const currentLabel = STYLE_LABELS[currentThemeId] || 'Modern Interaktif';
  const presets = getAllStylePresets();

  const applyStyleGlobal = (presetId: string) => {
    const state = useCanvaStore.getState();
    state._pushHistory();
    const newPages = state.pages.map((page) => {
      const updatedTemplateData = { ...(page.templateData || {}), schemaThemeId: presetId };
      if (page.schema) {
        return { ...page, schema: { ...page.schema, themeId: presetId }, templateData: updatedTemplateData };
      }
      return { ...page, templateData: updatedTemplateData };
    });
    useCanvaStore.setState({ pages: newPages });
    setOpen(false);
    toast.success(`Style diterapkan: ${STYLE_LABELS[presetId] || presetId}`);
  };

  // V3: Use createPortal to render dropdown at document.body level.
  // This avoids z-index/overflow-hidden issues from parent containers.
  const dropdown = open ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-56"
        style={{
          // Position will be set by JS — for now, center it
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        role="menu"
        aria-label="Pilih style media"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">Style Media</div>
        {presets.map((preset: StylePresetDefinition) => {
          const isActive = currentThemeId === preset.id;
          const label = STYLE_LABELS[preset.id] || preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => applyStyleGlobal(preset.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${isActive ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
              role="menuitem"
              type="button"
            >
              <div className="flex gap-0.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: preset.colors.accent }} aria-hidden="true" />
                <div className="w-3 h-3 rounded-full border border-slate-200" style={{ background: preset.semantic.accents.cyan }} aria-hidden="true" />
              </div>
              <span className="flex-1">{label}</span>
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
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Pilih style media"
        aria-expanded={open}
        type="button"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '16px' }}>palette</span>
        <span className="hidden lg:inline">{currentLabel}</span>
        <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '14px' }}>expand_more</span>
      </button>
      {dropdown}
    </div>
  );
}
