'use client';

// ═══════════════════════════════════════════════════════════════
// V5 — TemplatePickerV5
// ═══════════════════════════════════════════════════════════════
// Shows top 6 stable templates from CourseTemplateRegistry.
// Click → applyTemplateToStore() → onTemplateApplied() (jumps to editor)
// No wizard, no metadata form, no project type selection.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  getCourseTemplatesFiltered,
  type CourseTemplate,
} from '@/core/template/CourseTemplateRegistry';
import { applyTemplateToStore } from '@/core/template/apply-template-to-store';
import { toast } from 'sonner';

export interface TemplatePickerV5Props {
  onBack: () => void;
  onTemplateApplied: () => void;
}

// Curated short list — only show top stable templates.
// BATCH-11: 'silse-fresh-ppkn' is the NEW active default.
// 'modul-ppkn-vii' (legacy) is removed from this list — it is now
// status='legacy' and hidden from the gallery. Existing projects
// that reference it still work via createProjectFromTemplate().
const V5_TEMPLATE_IDS = [
  'silse-fresh-ppkn',  // BATCH-11: NEW active default
  'materi-kuis',
  'materi-aktivitas',
  'skenario-diskusi',
  'game-sortir-kuis',
  'pertemuan-lengkap',
];

export function TemplatePickerV5({ onBack, onTemplateApplied }: TemplatePickerV5Props) {
  const [applying, setApplying] = useState<string | null>(null);

  const templates = useMemo<CourseTemplate[]>(() => {
    const all = getCourseTemplatesFiltered(undefined, undefined, false);
    return V5_TEMPLATE_IDS.map((id) => all.find((t) => t.id === id))
      .filter((t): t is CourseTemplate => !!t);
  }, []);

  const handlePick = async (template: CourseTemplate) => {
    if (applying) return;
    setApplying(template.id);
    try {
      const result = await applyTemplateToStore(template.id, {
        metadata: {
          title: template.name,
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
            Pilih template untuk mulai membuat media. Setiap template sudah berisi alur
            pembelajaran lengkap — kuis dan game sudah dalam satu halaman, tinggal edit kontennya.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => {
              // BATCH-06: Show page count + template-specific icon
              const pageCount = t.scenes?.length ?? 0;
              const templateIcon = t.metadata?.icon || 'auto_stories';
              return (
                <button
                  key={t.id}
                  onClick={() => handlePick(t)}
                  disabled={applying !== null}
                  type="button"
                  className="group p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-left disabled:opacity-60 disabled:cursor-wait"
                  aria-label={`Pilih template ${t.name}, ${pageCount} halaman`}
                  data-testid={`template-card-${t.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-emerald-700" aria-hidden="true" style={{ fontSize: '20px' }}>{templateIcon}</span>
                    </div>
                    {applying === t.id ? (
                      <span className="text-xs text-emerald-600 font-medium animate-pulse">Memuat...</span>
                    ) : (
                      <span
                        className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium"
                        aria-label={`${pageCount} halaman`}
                        data-testid={`template-page-count-${t.id}`}
                      >
                        {pageCount} hal
                      </span>
                    )}
                  </div>
                  <div className="text-base font-semibold text-slate-800 mb-1 line-clamp-2">{t.name}</div>
                  <div className="text-xs text-slate-500 mb-3">
                    {t.subject === '*' ? 'Semua Mapel' : t.subject}
                    {' · '}
                    {t.grade === '*' ? 'Semua Kelas' : `Kelas ${t.grade}`}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
