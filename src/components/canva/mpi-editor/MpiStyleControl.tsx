'use client';

// ═══════════════════════════════════════════════════════════════
// MPI STYLE CONTROL — Global style selector for MPI Studio
// ═══════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01: Style is GLOBAL — applies to all pages.
//
// Uses the 6 Style Contract presets from preset-registry:
//   - modern-interactive
//   - school-cheerful
//   - mission-adventure
//   - nusantara-nature
//   - academic-clean
//   - dark-elegant
//
// When a style is selected, it writes themeId to ALL pages' schema.themeId
// + templateData.schemaThemeId (via batch update). This differs from the
// legacy setSchemaThemeId() which only affects the current page.

import React, { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import {
  getAllStylePresets,
  type StylePresetDefinition,
} from '@/core/style/preset-registry';
import { toast } from 'sonner';

// Friendly Indonesian labels for the 6 presets
const STYLE_LABELS: Record<string, string> = {
  'modern-interactive': 'Modern Interaktif',
  'school-cheerful': 'Sekolah Ceria',
  'mission-adventure': 'Misi Petualangan',
  'nusantara-nature': 'Nusantara Alam',
  'academic-clean': 'Akademik Bersih',
  'dark-elegant': 'Gelap Elegan',
};

export function MpiStyleControl() {
  const pages = useCanvaStore((s) => s.pages);
  const [open, setOpen] = useState(false);

  // Get current global style (from first page that has themeId)
  // PATCH-2A: default is 'modern-interactive' (light background #F5F7FB)
  // NOT 'academic-clean' (dark navy #0f172a) — teachers need a light,
  // friendly default, not a dark academic theme.
  const currentThemeId = React.useMemo(() => {
    for (const page of pages) {
      const tid = page?.schema?.themeId || (page?.templateData?.schemaThemeId as string | undefined);
      if (tid) return tid;
    }
    return 'modern-interactive'; // light, friendly default for teachers
  }, [pages]);

  const currentLabel = STYLE_LABELS[currentThemeId] || 'Modern Interaktif';

  const presets = getAllStylePresets();

  const applyStyleGlobal = (presetId: string) => {
    const state = useCanvaStore.getState();
    state._pushHistory();

    // Apply themeId to ALL pages (global style)
    const newPages = state.pages.map((page) => {
      const updatedTemplateData = {
        ...(page.templateData || {}),
        schemaThemeId: presetId,
      };
      if (page.schema) {
        return {
          ...page,
          schema: {
            ...page.schema,
            themeId: presetId,
          },
          templateData: updatedTemplateData,
        };
      }
      return {
        ...page,
        templateData: updatedTemplateData,
      };
    });

    useCanvaStore.setState({ pages: newPages });
    setOpen(false);
    toast.success(`Style diterapkan: ${STYLE_LABELS[presetId] || presetId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        aria-label="Pilih style media"
        aria-expanded={open}
        aria-haspopup="menu"
        type="button"
      >
        <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '16px' }}>palette</span>
        <span className="hidden lg:inline">{currentLabel}</span>
        <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '14px' }}>expand_more</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            className="absolute top-full right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1"
            role="menu"
            aria-label="Pilih style media"
          >
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              Style Media
            </div>
            {presets.map((preset: StylePresetDefinition) => {
              const isActive = currentThemeId === preset.id;
              const label = STYLE_LABELS[preset.id] || preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyStyleGlobal(preset.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  role="menuitem"
                  type="button"
                >
                  {/* Color swatch */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    <div
                      className="w-3 h-3 rounded-full border border-slate-200"
                      style={{ background: preset.colors.accent }}
                      aria-hidden="true"
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-slate-200"
                      style={{ background: preset.semantic.accents.cyan }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="material-symbols-outlined text-emerald-600" aria-hidden="true" style={{ fontSize: '16px' }}>check</span>
                  )}
                </button>
              );
            })}
            <div className="px-3 py-1.5 text-xs text-slate-400 border-t border-slate-100 mt-1">
              Style berlaku untuk semua halaman
            </div>
          </div>
        </>
      )}
    </div>
  );
}
