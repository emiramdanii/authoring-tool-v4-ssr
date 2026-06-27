'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — TemplatePickerV5
// ═══════════════════════════════════════════════════════════════
// BATCH-11A: Purge active default templates.
// The gallery now shows ONLY the fresh SILSE template + a separate
// "Mulai Kosong" button. All generic/legacy templates are hidden
// from the gallery — they're still callable for backward compat
// via createProjectFromTemplate(), but they cannot be picked from
// the UI as a starting point.
//
// This enforces the senior decision: V5 fresh path must NOT mix
// with old template defaults.
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { getCourseTemplate, type CourseTemplate } from '@/core/template/CourseTemplateRegistry';
import { applyTemplateToStore } from '@/core/template/apply-template-to-store';
import { useCanvaStore } from '@/store/canva-store';
import { createPage } from '@/store/canva/constants';
import { toast } from 'sonner';

export interface TemplatePickerV5Props {
  onBack: () => void;
  onTemplateApplied: () => void;
}

// BATCH-11A: Only silse-fresh-ppkn is shown in the gallery as the
// active fresh default. Legacy templates (materi-kuis, materi-aktivitas,
// skenario-diskusi, game-sortir-kuis, pertemuan-lengkap, macam-norma,
// misi-penjelajah, modul-ppkn-vii, template-kosong) are all
// status='legacy' and not shown here.
//
// "Mulai Kosong" is a SEPARATE button (not a template card) that
// creates a fresh blank project with one empty cover page — using
// the silse-fresh contract (NOT legacy contract).
const FRESH_TEMPLATE_ID = 'silse-fresh-ppkn';

export function TemplatePickerV5({ onBack, onTemplateApplied }: TemplatePickerV5Props) {
  const [applying, setApplying] = useState<string | null>(null);

  const freshTemplate = getCourseTemplate(FRESH_TEMPLATE_ID);

  const handlePickFresh = async () => {
    if (!freshTemplate || applying) return;
    setApplying(FRESH_TEMPLATE_ID);
    try {
      // BATCH-11B-FIX: Pass the real PPKn cover title, NOT the
      // template display name. The template display name is for UI
      // (gallery card) — the cover title is the actual lesson title
      // shown on the cover page. Using freshTemplate.name here was
      // causing the cover title to show "SILSE Fresh — Hidup Tertib
      // dengan Norma" (template name) instead of just "Hidup Tertib
      // dengan Norma" (the real lesson title).
      const result = await applyTemplateToStore(FRESH_TEMPLATE_ID, {
        metadata: {
          title: 'Hidup Tertib dengan Norma',  // real PPKn cover title
          mapel: freshTemplate.subject === '*' ? 'Umum' : freshTemplate.subject,
          kelas: freshTemplate.grade === '*' ? '7' : freshTemplate.grade,
        },
        persist: 'localstorage',
        selectPrimaryTarget: false,
        navigateToWorkspace: false,
      });

      if (result.success) {
        toast.success(`Template "${freshTemplate.name}" dimuat (${result.pageCount} halaman)`);
        onTemplateApplied();
      } else {
        toast.error(`Gagal memuat template: ${result.error ?? 'unknown error'}`);
      }
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplying(null);
    }
  };

  const handleStartBlank = async () => {
    if (applying) return;
    setApplying('blank');
    try {
      // BATCH-11A: "Mulai Kosong" creates a single fresh blank cover
      // page with silse-fresh contract — NOT legacy modern-educator.
      const blankPage = createPage('Cover', 'cover');
      blankPage.contractId = 'silse-fresh';  // fresh contract, NOT legacy
      blankPage.pageMode = 'schema';
      blankPage.elements = [];
      blankPage.schema = {
        id: `screen-blank-${Date.now()}`,
        templateType: 'cover',
        blocks: [],
        sceneType: 'intro',
        sectionLabel: 'Cover',
        sectionColor: 't',
      };

      useCanvaStore.setState({
        pages: [blankPage],
        currentPageIndex: 0,
        ratioId: '16:9',
      });

      toast.success('Proyek kosong dibuat (1 halaman cover)');
      onTemplateApplied();
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplying(null);
    }
  };

  const pageCount = freshTemplate?.scenes?.length ?? 0;
  const templateIcon = freshTemplate?.metadata?.icon || '🌱';

  return (
    <main
      className="flex-1 flex flex-col overflow-hidden"
      role="main"
      aria-label="Pilih template"
      data-testid="template-picker-v5"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          aria-label="Kembali ke dashboard"
        >
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '18px' }}>arrow_back</span>
          Dashboard
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Pilih Template</h1>
        <div className="w-20" />
      </header>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-slate-500 mb-6">
            Pilih template SILSE Fresh untuk mulai dengan alur pembelajaran lengkap (8 halaman:
            cover, petunjuk, tujuan, materi, game, kuis, refleksi, penutup). Atau mulai dari
            halaman kosong jika ingin menyusun sendiri.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* BATCH-11A: Only the fresh template is shown as a card */}
            {freshTemplate && (
              <button
                key={freshTemplate.id}
                onClick={handlePickFresh}
                disabled={applying !== null}
                type="button"
                className="group p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left disabled:opacity-60 disabled:cursor-wait"
                aria-label={`Pilih template ${freshTemplate.name}, ${pageCount} halaman`}
                data-testid={`template-card-${freshTemplate.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                    <span className="text-2xl" aria-hidden="true">{templateIcon}</span>
                  </div>
                  {applying === freshTemplate.id ? (
                    <span className="text-xs text-emerald-600 font-medium animate-pulse">Memuat...</span>
                  ) : (
                    <span
                      className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium"
                      aria-label={`${pageCount} halaman`}
                      data-testid={`template-page-count-${freshTemplate.id}`}
                    >
                      {pageCount} hal
                    </span>
                  )}
                </div>
                <div className="text-base font-semibold text-slate-800 mb-1 line-clamp-2">{freshTemplate.name}</div>
                <div className="text-xs text-slate-500 mb-3">
                  {freshTemplate.subject === '*' ? 'Semua Mapel' : freshTemplate.subject}
                  {' · '}
                  {freshTemplate.grade === '*' ? 'Semua Kelas' : `Kelas ${freshTemplate.grade}`}
                </div>
                <p className="text-xs text-slate-500 line-clamp-3">{freshTemplate.description}</p>
              </button>
            )}

            {/* BATCH-11A: "Mulai Kosong" — separate button, NOT a template card */}
            <button
              onClick={handleStartBlank}
              disabled={applying !== null}
              type="button"
              className="group p-5 bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left disabled:opacity-60 disabled:cursor-wait"
              aria-label="Mulai dari halaman kosong"
              data-testid="template-card-blank"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-slate-600" aria-hidden="true" style={{ fontSize: '20px' }}>add</span>
                </div>
                {applying === 'blank' ? (
                  <span className="text-xs text-emerald-600 font-medium animate-pulse">Memuat...</span>
                ) : (
                  <span
                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium"
                    aria-label="1 halaman kosong"
                    data-testid="template-page-count-blank"
                  >
                    1 hal
                  </span>
                )}
              </div>
              <div className="text-base font-semibold text-slate-800 mb-1">Mulai Kosong</div>
              <div className="text-xs text-slate-500 mb-3">
                Semua Mapel · Semua Kelas
              </div>
              <p className="text-xs text-slate-500 line-clamp-3">
                Mulai dari halaman kosong. Tambahkan halaman sendiri sesuai kebutuhan.
                Menggunakan kontrak silse-fresh (light cream + deep teal).
              </p>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
