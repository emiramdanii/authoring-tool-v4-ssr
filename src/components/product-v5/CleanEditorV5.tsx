'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — CleanEditorV5
// ═══════════════════════════════════════════════════════════════
// Minimal editor shell. Reuses mpi-workspace-v2 components because
// they are already schema-canonical + use PageRenderer official:
//   - WorkspaceSceneList (page list with empty state)
//   - WorkspaceCanvasStage (PageRenderer canvas mode)
//   - WorkspaceInspector (schema-driven field editor)
//   - WorkspaceContentPalette (Tambah Halaman + Tambah Blok menus)
//   - WorkspaceStyleMenu (style preset picker — portal menu)
//
// Top bar is built inline (no WorkspaceTopBar) so we control the
// back/preview/export actions via ProductShell callbacks.
//
// No teacherMode toggle, no Advanced editor button, no panel switcher,
// no workflow wizard. Just: top bar + scene list + canvas + inspector
// + bottom palette. That's it.
// ═══════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { WorkspaceSceneList } from '@/components/canva/mpi-workspace-v2/WorkspaceTopBar';
import { WorkspaceCanvasStage } from '@/components/canva/mpi-workspace-v2/WorkspaceCanvasStage';
import { WorkspaceInspector } from '@/components/canva/mpi-workspace-v2/WorkspaceInspector';
import { WorkspaceContentPalette } from '@/components/canva/mpi-workspace-v2/WorkspaceContentPalette';
import { WorkspaceStyleMenu } from '@/components/canva/mpi-workspace-v2/WorkspaceStyleMenu';

export interface CleanEditorV5Props {
  onBack: () => void;
  onPreview: () => void;
  onExport: () => void;
}

export function CleanEditorV5({ onBack, onPreview, onExport }: CleanEditorV5Props) {
  const pages = useCanvaStore((s) => s.pages);
  const saveStatus = useCanvaStore((s) => s._saveStatus);
  const lastSavedAt = useCanvaStore((s) => s._lastSavedAt);
  const meta = useAuthoringStore((s) => s.meta) as { judulPertemuan?: string };
  const paketTitle = meta?.judulPertemuan || 'Media Pembelajaran';

  const handleBack = useCallback(() => {
    if (pages.length > 0) {
      try {
        useCanvaStore.getState().saveToStorage();
      } catch {
        // ignore — best effort
      }
    }
    onBack();
  }, [pages.length, onBack]);

  // V5-HARDENING-01 AUDIT-003: Export button in editor ONLY navigates
  // to ExportPanelV5. It does NOT call exportHtml() — that would cause
  // double export (one here + one when user clicks "Export Sekarang"
  // in ExportPanelV5). The actual export happens exclusively in
  // ExportPanelV5 when the user explicitly clicks "Export Sekarang".

  // V5-BLOCKER-FIX-01: Save status label + color.
  // The canva store's _saveStatus auto-reverts from 'saved' to 'unsaved'
  // after 3 seconds (HIDE_SAVED_MS in save-utils.ts). This is intentional
  // — the "saved" indicator shouldn't stay green forever. But the label
  // "Belum simpan" (unsaved) is misleading after data HAS been saved.
  //
  // Fix: when _saveStatus is 'unsaved' but _lastSavedAt > 0 (data was
  // previously saved), show "Tersimpan" instead of "Belum simpan".
  // Only show "Belum simpan" when _lastSavedAt === 0 (never saved).
  const statusLabel = (() => {
    switch (saveStatus) {
      case 'saved': return 'Tersimpan';
      case 'saving': return 'Menyimpan…';
      case 'error': return 'Gagal simpan';
      case 'unsaved': return lastSavedAt > 0 ? 'Tersimpan' : 'Belum simpan';
      default: return lastSavedAt > 0 ? 'Tersimpan' : 'Belum simpan';
    }
  })();

  const statusColor = saveStatus === 'saved' ? 'text-emerald-600'
    : saveStatus === 'saving' ? 'text-amber-600'
    : saveStatus === 'error' ? 'text-red-600'
    : lastSavedAt > 0 ? 'text-emerald-600'  // 'unsaved' but previously saved → green
    : 'text-slate-500';  // never saved → gray

  if (pages.length === 0) {
    return (
      <main
        className="flex-1 flex flex-col items-center justify-center p-8"
        role="main"
        aria-label="Editor kosong"
        data-testid="clean-editor-v5-empty"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '32px' }}>description</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Belum ada proyek</h2>
          <p className="text-sm text-slate-500 mb-6">
            Pilih template terlebih dahulu untuk mulai membuat media.
          </p>
          <button
            onClick={handleBack}
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      data-testid="clean-editor-v5"
    >
      {/* Top bar — V5 minimal: Back + Title + Save status + Style + Preview + Export */}
      <header
        className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200 shadow-sm"
        role="toolbar"
        aria-label="Toolbar Editor V5"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={handleBack}
            type="button"
            className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex-shrink-0"
            aria-label="Kembali ke dashboard"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>arrow_back</span>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={paketTitle}>
              {paketTitle}
            </div>
            <div className={`text-xs flex items-center gap-1 ${statusColor}`} aria-live="polite">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: saveStatus === 'saved' ? '#10b981'
                    : saveStatus === 'saving' ? '#f59e0b'
                    : saveStatus === 'error' ? '#ef4444'
                    : lastSavedAt > 0 ? '#10b981'  // 'unsaved' but previously saved → green
                    : '#94a3b8',  // never saved → gray
                }}
                aria-hidden="true"
              />
              <span className="truncate">{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <WorkspaceStyleMenu />
          <button
            onClick={onPreview}
            type="button"
            className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            aria-label="Pratinjau media"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>visibility</span>
            <span className="hidden sm:inline">Preview</span>
          </button>
          <button
            onClick={onExport}
            type="button"
            className="flex items-center gap-1 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            aria-label="Buka panel export"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>download</span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* 3-panel layout: scene list + canvas + inspector */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceSceneList />
        <WorkspaceCanvasStage />
        <WorkspaceInspector />
      </div>

      {/* Bottom palette: Tambah Halaman + Tambah Blok + Tambah Game */}
      <WorkspaceContentPalette />
    </div>
  );
}
