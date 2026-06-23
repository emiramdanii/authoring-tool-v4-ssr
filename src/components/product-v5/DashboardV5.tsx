'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — DashboardV5
// ═══════════════════════════════════════════════════════════════
// Minimal teacher-facing landing page. Two actions:
//   1. "Mulai dari Template" → TemplatePickerV5
//   2. "Lanjut Edit" → CleanEditorV5 (if project exists)
// No sidebar, no nav bar, no panels — just a clean welcome screen.
// ═══════════════════════════════════════════════════════════════

import React from 'react';

export interface DashboardV5Props {
  onPickTemplate: () => void;
  onResumeEdit: () => void;
  hasProject: boolean;
}

export function DashboardV5({ onPickTemplate, onResumeEdit, hasProject }: DashboardV5Props) {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center p-8"
      role="main"
      aria-label="Dashboard Guru"
      data-testid="dashboard-v5"
    >
      <div className="max-w-2xl w-full text-center">
        {/* Logo / Hero */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
          <span className="text-4xl" aria-hidden="true">📚</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Media Pembelajaran Interaktif
        </h1>
        <p className="text-base text-slate-500 mb-10 max-w-md mx-auto">
          Buat media pembelajaran cantik untuk siswa dalam beberapa menit. Pilih template,
          edit konten, pratinjau, lalu export ke HTML.
        </p>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <button
            onClick={onPickTemplate}
            type="button"
            className="group p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left"
            aria-label="Mulai dari template"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mb-3 transition-colors">
              <span className="material-symbols-outlined text-emerald-700" aria-hidden="true" style={{ fontSize: '24px' }}>auto_awesome</span>
            </div>
            <div className="text-base font-semibold text-slate-800 mb-1">Mulai dari Template</div>
            <div className="text-sm text-slate-500">Pilih dari template siap pakai</div>
          </button>

          <button
            onClick={onResumeEdit}
            type="button"
            disabled={!hasProject}
            className="group p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:shadow-none"
            aria-label="Lanjut edit proyek tersimpan"
            aria-disabled={!hasProject}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-200 group-disabled:bg-slate-100 flex items-center justify-center mb-3 transition-colors">
              <span className="material-symbols-outlined text-slate-700 group-disabled:text-slate-400" aria-hidden="true" style={{ fontSize: '24px' }}>edit_note</span>
            </div>
            <div className="text-base font-semibold text-slate-800 mb-1">Lanjut Edit</div>
            <div className="text-sm text-slate-500">
              {hasProject ? 'Buka proyek tersimpan' : 'Belum ada proyek'}
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-slate-400 mt-12">
          Authoring Tool v5 — Jalur produk resmi
        </p>
      </div>
    </main>
  );
}
