'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — DashboardV5
// ═══════════════════════════════════════════════════════════════
// Teacher-facing landing page.
//
// BATCH-06 TEACHER-WORKFLOW-UX-01:
//   When hasProject=true, show a "Lanjutkan Proyek" resume card with
//   project metadata (judul, mapel, kelas, page count) so the teacher
//   knows what they're resuming before clicking. Below the resume
//   card, a smaller "Mulai dari Template" link lets them start fresh.
//
//   When hasProject=false, keep the original single-button layout
//   (centered "Mulai dari Template" CTA).
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { useAuthoringStore } from '@/store/authoring-store';

export interface DashboardV5Props {
  onPickTemplate: () => void;
  onResumeEdit: () => void;
  hasProject: boolean;
  /** Page count (passed from ProductShell which already reads canvaStore) */
  pageCount?: number;
}

export function DashboardV5({ onPickTemplate, onResumeEdit, hasProject, pageCount = 0 }: DashboardV5Props) {
  // BATCH-06: Read metadata from authoring store to populate resume card.
  // We read once at render — DashboardV5 only re-renders on view switch,
  // so this is cheap. No subscriptions needed.
  const meta = useAuthoringStore((s) => s.meta);

  // Derive display values with safe fallbacks
  const judul = meta?.judulPertemuan?.trim() || 'Tanpa Judul';
  const mapel = meta?.mapel?.trim() || '—';
  const kelas = meta?.kelas?.trim() || '—';
  const namaGuru = meta?.namaGuru?.trim() || '';
  const namaSekolah = meta?.namaSekolah?.trim() || '';

  return (
    <main
      className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto"
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
        <p className="text-base text-slate-500 mb-6 max-w-md mx-auto">
          Buat media pembelajaran cantik untuk siswa dalam beberapa menit. Pilih template,
          edit konten, pratinjau, lalu export ke HTML.
        </p>

        {/* BATCH-06B: Workflow guidance 5 langkah */}
        <nav
          aria-label="Alur kerja"
          className="mb-10 max-w-xl mx-auto"
          data-testid="dashboard-workflow-guidance"
        >
          <ol className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <li className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center" aria-hidden="true">1</span>
              <span>Info</span>
            </li>
            <span aria-hidden="true" className="text-slate-300">→</span>
            <li className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center" aria-hidden="true">2</span>
              <span>Edit Isi</span>
            </li>
            <span aria-hidden="true" className="text-slate-300">→</span>
            <li className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center" aria-hidden="true">3</span>
              <span>Style</span>
            </li>
            <span aria-hidden="true" className="text-slate-300">→</span>
            <li className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center" aria-hidden="true">4</span>
              <span>Preview</span>
            </li>
            <span aria-hidden="true" className="text-slate-300">→</span>
            <li className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center" aria-hidden="true">5</span>
              <span>Export</span>
            </li>
          </ol>
        </nav>

        {hasProject ? (
          // ── BATCH-06: Resume Card ────────────────────────────────
          // Teacher has a saved project — show them what they're resuming
          // so they don't blindly click "Lanjut Edit" and end up in a
          // project they didn't expect.
          <section
            className="max-w-lg mx-auto"
            aria-label="Proyek tersimpan"
            data-testid="dashboard-resume-section"
          >
            <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-sm overflow-hidden text-left">
              {/* Header strip */}
              <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700" aria-hidden="true" style={{ fontSize: '20px' }}>history</span>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    Proyek Tersimpan
                  </span>
                </div>
                <span className="text-xs text-emerald-700 font-medium" data-testid="resume-page-count">
                  {pageCount} halaman
                </span>
              </div>

              {/* Body — project metadata */}
              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2" data-testid="resume-judul">
                  {judul}
                </h2>
                <div className="text-sm text-slate-500 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '14px' }}>menu_book</span>
                    {mapel}
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '14px' }}>grade</span>
                    Kelas {kelas}
                  </span>
                  {namaGuru && (
                    <>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-slate-400" aria-hidden="true" style={{ fontSize: '14px' }}>person</span>
                        {namaGuru}
                      </span>
                    </>
                  )}
                </div>

                {/* Primary action: Lanjutkan */}
                <button
                  onClick={onResumeEdit}
                  type="button"
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 mb-2 flex items-center justify-center gap-2"
                  aria-label={`Lanjutkan proyek ${judul}`}
                  data-testid="resume-continue-btn"
                >
                  <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>play_arrow</span>
                  Lanjutkan Edit
                </button>

                {/* Secondary action: Mulai Baru */}
                <button
                  onClick={onPickTemplate}
                  type="button"
                  className="w-full px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl font-medium text-sm border border-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                  aria-label="Mulai proyek baru dari template"
                  data-testid="resume-new-btn"
                >
                  Mulai dari Template Lain
                </button>

                {namaSekolah && (
                  <p className="text-xs text-slate-400 mt-3 text-center">
                    {namaSekolah}
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : (
          // ── Empty state — first-time user ────────────────────────
          <div className="grid sm:grid-cols-1 gap-4 max-w-lg mx-auto">
            <button
              onClick={onPickTemplate}
              type="button"
              className="group p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left"
              aria-label="Mulai dari template"
              data-testid="dashboard-start-template-btn"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center mb-3 transition-colors">
                <span className="material-symbols-outlined text-emerald-700" aria-hidden="true" style={{ fontSize: '24px' }}>auto_awesome</span>
              </div>
              <div className="text-base font-semibold text-slate-800 mb-1">Mulai dari Template</div>
              <div className="text-sm text-slate-500">Pilih dari template siap pakai</div>
            </button>
          </div>
        )}

        {/* Footer hint */}
        <p className="text-xs text-slate-400 mt-12">
          Authoring Tool v5 — Jalur produk resmi
        </p>
      </div>
    </main>
  );
}
