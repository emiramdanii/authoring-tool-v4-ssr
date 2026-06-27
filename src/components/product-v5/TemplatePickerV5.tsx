'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — TemplatePickerV5
// ═══════════════════════════════════════════════════════════════
// BATCH-11C: Added SILSE Studio as the NEW primary template.
// Senior feedback: "bentuk content masih jelek, buat 1 set MPI yang
// bisa di-edit dari nol". SILSE Studio is minimal content + premium
// layout — every field is a short placeholder teachers can edit.
//
// Gallery now shows 3 options:
//   1. SILSE Studio (primary — minimal, premium layout, siap edit)
//   2. SILSE Fresh PPKn (secondary — pre-filled PPKn curriculum)
//   3. Mulai Kosong (separate button — 1 blank cover page)
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

// BATCH-11C: Two active templates + 1 blank option.
// SILSE Studio is the NEW primary (minimal, premium, siap edit).
// SILSE Fresh PPKn is secondary (pre-filled curriculum).
const STUDIO_TEMPLATE_ID = 'silse-studio';
const FRESH_TEMPLATE_ID = 'silse-fresh-ppkn';

export function TemplatePickerV5({ onBack, onTemplateApplied }: TemplatePickerV5Props) {
  const [applying, setApplying] = useState<string | null>(null);

  const studioTemplate = getCourseTemplate(STUDIO_TEMPLATE_ID);
  const freshTemplate = getCourseTemplate(FRESH_TEMPLATE_ID);

  const handlePick = async (templateId: string, template: CourseTemplate | undefined, defaultTitle: string) => {
    if (!template || applying) return;
    setApplying(templateId);
    try {
      const result = await applyTemplateToStore(templateId, {
        metadata: {
          title: defaultTitle,
          mapel: template.subject === '*' ? 'Umum' : template.subject,
          kelas: template.grade === '*' ? '7' : template.grade,
        },
        persist: 'localstorage',
        selectPrimaryTarget: false,
        navigateToWorkspace: false,
      });

      if (result.success) {
        toast.success(`Template "${template.name}" dimuat (${result.pageCount} halaman)`);
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

  const handlePickStudio = () => handlePick(STUDIO_TEMPLATE_ID, studioTemplate, 'Judul Media Pembelajaran');
  const handlePickFresh = () => handlePick(FRESH_TEMPLATE_ID, freshTemplate, 'Hidup Tertib dengan Norma');

  const handleStartBlank = async () => {
    if (applying) return;
    setApplying('blank');
    try {
      const blankPage = createPage('Cover', 'cover');
      blankPage.contractId = 'silse-fresh';
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

  const renderTemplateCard = (
    template: CourseTemplate | undefined,
    onPick: () => void,
    isPrimary: boolean,
  ) => {
    if (!template) return null;
    const pageCount = template.scenes?.length ?? 0;
    const templateIcon = template.metadata?.icon || 'auto_stories';
    const cardClass = isPrimary
      ? 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-400/20'
      : 'border-slate-200 bg-white';

    return (
      <button
        key={template.id}
        onClick={onPick}
        disabled={applying !== null}
        type="button"
        className={`group p-5 rounded-2xl border-2 ${cardClass} hover:border-emerald-500 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left disabled:opacity-60 disabled:cursor-wait`}
        aria-label={`Pilih template ${template.name}, ${pageCount} halaman`}
        data-testid={`template-card-${template.id}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isPrimary ? 'bg-emerald-200 group-hover:bg-emerald-300' : 'bg-emerald-100 group-hover:bg-emerald-200'}`}>
            <span className="text-2xl" aria-hidden="true">{templateIcon}</span>
          </div>
          {isPrimary && (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-wide">
              Direkomendasikan
            </span>
          )}
          {applying === template.id ? (
            <span className="text-xs text-emerald-600 font-medium animate-pulse">Memuat...</span>
          ) : (
            <span
              className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium"
              aria-label={`${pageCount} halaman`}
              data-testid={`template-page-count-${template.id}`}
            >
              {pageCount} hal
            </span>
          )}
        </div>
        <div className="text-base font-semibold text-slate-800 mb-1 line-clamp-2">{template.name}</div>
        <div className="text-xs text-slate-500 mb-3">
          {template.subject === '*' ? 'Semua Mapel' : template.subject}
          {' · '}
          {template.grade === '*' ? 'Semua Kelas' : `Kelas ${template.grade}`}
        </div>
        <p className="text-xs text-slate-500 line-clamp-3">{template.description}</p>
      </button>
    );
  };

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
            Pilih template untuk mulai membuat media. <strong>SILSE Studio</strong> direkomendasikan
            untuk guru yang ingin mengedit dari nol — layout premium, konten minimal, semua teks
            bisa di-klik untuk edit. Atau pilih template PPKn dengan konten kurikulum siap pakai.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* BATCH-11C: SILSE Studio — primary recommended */}
            {renderTemplateCard(studioTemplate, handlePickStudio, true)}

            {/* BATCH-11: SILSE Fresh PPKn — secondary */}
            {renderTemplateCard(freshTemplate, handlePickFresh, false)}

            {/* BATCH-11A: "Mulai Kosong" — separate button */}
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
