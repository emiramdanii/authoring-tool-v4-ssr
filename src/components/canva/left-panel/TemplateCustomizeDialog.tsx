'use client';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE CUSTOMIZE DIALOG — Pre-apply customization panel
// ═══════════════════════════════════════════════════════════════════
// Shows when a teacher clicks "Sesuaikan" on a template card.
// Allows:
//   - Toggle individual pages on/off
//   - Set number of quiz questions
//   - Choose variant (A/B/C)
//   - Preview final page count
//   - Inject guru/sekolah info into cover
//   - CHOOSE MODE: Replace all pages OR Insert into existing project
//
// TEACHER MODE: In 'sederhana' mode, simpler labels.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  ChevronRight,
  FileText,
  Settings2,
  Minus,
  Plus,
  Replace,
  Merge,
  Layers,
} from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import {
  type LessonTemplate,
  type TemplateCustomization,
  getDefaultCustomization,
  TEMPLATE_PATTERNS,
} from '@/core/template/template-gallery';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

// ── Page type icon mapping ──
const PAGE_TYPE_ICONS: Record<string, string> = {
  cover: '🏠',
  petunjuk: '📋',
  dokumen: '📄',
  tujuan: '🎯',
  motivasi: '💡',
  materi: '📖',
  skenario: '🎭',
  diskusi: '💬',
  kuis: '📝',
  game: '🎮',
  hasil: '🏆',
  refleksi: '🪞',
  rangkuman: '📌',
  penutup: '🎬',
  hero: '🦸',
  custom: '🔧',
};

// ── Apply mode ──
export type TemplateApplyMode = 'replace' | 'insert';

interface TemplateCustomizeDialogProps {
  template: LessonTemplate;
  onApply: (template: LessonTemplate, config: TemplateCustomization, mode: TemplateApplyMode) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function TemplateCustomizeDialog({
  template,
  onApply,
  onClose,
  isLoading = false,
}: TemplateCustomizeDialogProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;
  const meta = useAuthoringStore(s => s.meta);
  const existingPageCount = useCanvaStore(s => s.pages.length);

  const [config, setConfig] = useState<TemplateCustomization>(() => ({
    ...getDefaultCustomization(template),
    guru: '',
    sekolah: '',
  }));

  // ── Apply mode: replace or insert ──
  const [applyMode, setApplyMode] = useState<TemplateApplyMode>(
    existingPageCount === 0 ? 'replace' : 'insert',
  );

  // Count enabled pages
  const enabledCount = useMemo(
    () => config.enabledPages.filter(Boolean).length,
    [config.enabledPages],
  );

  // Toggle a page on/off
  const togglePage = useCallback((index: number) => {
    setConfig((prev: TemplateCustomization) => {
      const next = [...prev.enabledPages];
      // Cover and penutup cannot be disabled
      if (template.pageTypes[index] === 'cover' || template.pageTypes[index] === 'penutup') {
        return prev;
      }
      next[index] = !next[index];
      return { ...prev, enabledPages: next };
    });
  }, [template.pageTypes]);

  // Update jumlah kuis
  const adjustJumlahKuis = useCallback((delta: number) => {
    setConfig((prev: TemplateCustomization) => ({
      ...prev,
      jumlahKuis: Math.max(3, Math.min(20, prev.jumlahKuis + delta)),
    }));
  }, []);

  // Set variant
  const setVariant = useCallback((v: 'A' | 'B' | 'C') => {
    setConfig((prev: TemplateCustomization) => ({ ...prev, variant: v }));
  }, []);

  // Update guru/sekolah
  const setGuru = useCallback((v: string) => {
    setConfig((prev: TemplateCustomization) => ({ ...prev, guru: v || undefined }));
  }, []);
  const setSekolah = useCallback((v: string) => {
    setConfig((prev: TemplateCustomization) => ({ ...prev, sekolah: v || undefined }));
  }, []);

  // Apply
  const handleApply = useCallback(() => {
    onApply(template, config, applyMode);
  }, [template, config, applyMode, onApply]);

  const patternConfig = TEMPLATE_PATTERNS[template.pattern];

  // Summary text depends on mode
  const summaryText = applyMode === 'replace'
    ? `${enabledCount} halaman akan menggantikan ${existingPageCount} halaman yang ada`
    : `${enabledCount} halaman baru ditambahkan (total: ${existingPageCount + enabledCount})`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[calc(100vw-2rem)] sm:w-[380px] max-h-[85vh] bg-app-surface border border-app-border rounded-2xl shadow-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-app-border/30">
          <div className="flex items-center gap-2">
            <Settings2 size={14} className="text-app-accent" />
            <span className="text-[11px] font-bold text-app-primary">
              {isSederhana ? 'Atur Template' : 'Customize Template'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-app-elevated/60 text-app-muted hover:text-app-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Template info bar */}
        <div className="px-4 py-2.5 bg-app-elevated/30 border-b border-app-border/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">{template.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-app-primary truncate">{template.title}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] px-1.5 py-0 rounded bg-app-accent/10 text-app-accent border border-app-accent/20 font-bold">
                  {patternConfig.icon} {patternConfig.label}
                </span>
                <span className="text-[8px] text-app-muted">
                  {enabledCount} halaman
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-4">
          {/* ── Apply Mode Section ── */}
          <div>
            <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers size={10} />
              {isSederhana ? 'Cara Penerapan' : 'Apply Mode'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setApplyMode('replace')}
                className={`px-2.5 py-2.5 rounded-lg border text-left transition-[transform,background-color,border-color] ${
                  applyMode === 'replace'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-app-elevated/40 border-app-border/20 text-app-secondary hover:border-app-border-strong'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Replace size={10} className={applyMode === 'replace' ? 'text-amber-400' : 'text-app-muted'} />
                  <span className="text-[10px] font-bold">
                    {isSederhana ? 'Ganti Semua' : 'Replace All'}
                  </span>
                </div>
                <div className="text-[7px] text-app-muted leading-relaxed">
                  {existingPageCount > 0
                    ? `Hapus ${existingPageCount} halaman yang ada, ganti dengan template baru`
                    : 'Buat project baru dari template ini'}
                </div>
              </button>
              <button
                onClick={() => setApplyMode('insert')}
                disabled={existingPageCount === 0}
                className={`px-2.5 py-2.5 rounded-lg border text-left transition-[transform,background-color,border-color] ${
                  applyMode === 'insert'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-app-elevated/40 border-app-border/20 text-app-secondary hover:border-app-border-strong'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Merge size={10} className={applyMode === 'insert' ? 'text-emerald-400' : 'text-app-muted'} />
                  <span className="text-[10px] font-bold">
                    {isSederhana ? 'Tambahkan' : 'Insert'}
                  </span>
                </div>
                <div className="text-[7px] text-app-muted leading-relaxed">
                  {existingPageCount > 0
                    ? `Tambahkan halaman template ke project yang sudah ada (total: ${existingPageCount + enabledCount})`
                    : 'Tidak ada halaman yang bisa ditambahkan'}
                </div>
              </button>
            </div>
          </div>

          {/* ── Page Toggle Section ── */}
          <div>
            <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText size={10} />
              {isSederhana ? 'Halaman' : 'Page Selection'}
            </div>
            <div className="space-y-1">
              {template.pagePreview.map((page, i) => {
                const isEnabled = config.enabledPages[i];
                const isRequired = template.pageTypes[i] === 'cover' || template.pageTypes[i] === 'penutup';
                const icon = PAGE_TYPE_ICONS[page.type] || '📄';

                return (
                  <button
                    key={i}
                    onClick={() => togglePage(i)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-[background-color,border-color] text-left ${
                      isEnabled
                        ? 'bg-app-elevated/40 border-app-border/30 hover:border-app-accent/30'
                        : 'bg-app-elevated/10 border-app-border/10 opacity-50'
                    } ${isRequired ? 'cursor-default' : 'cursor-pointer'}`}
                    disabled={isRequired}
                  >
                    <span className="text-sm flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold truncate ${isEnabled ? 'text-app-primary' : 'text-app-muted line-through'}`}>
                        {page.title}
                      </div>
                      <div className="text-[8px] text-app-muted truncate">
                        {page.description}
                      </div>
                    </div>
                    {isRequired ? (
                      <span className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex-shrink-0">
                        Wajib
                      </span>
                    ) : isEnabled ? (
                      <Eye size={12} className="text-app-accent flex-shrink-0" />
                    ) : (
                      <EyeOff size={12} className="text-app-muted flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Quiz Count Section ── */}
          <div>
            <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              📝 Jumlah Soal Kuis
            </div>
            <div className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-app-elevated/40 border border-app-border/30">
              <button
                onClick={() => adjustJumlahKuis(-1)}
                disabled={config.jumlahKuis <= 3}
                className="p-1 rounded-lg hover:bg-app-elevated/80 text-app-muted hover:text-app-primary transition-colors disabled:opacity-30"
              >
                <Minus size={12} />
              </button>
              <span className="text-[14px] font-bold text-app-primary flex-1 text-center">
                {config.jumlahKuis}
              </span>
              <button
                onClick={() => adjustJumlahKuis(1)}
                disabled={config.jumlahKuis >= 20}
                className="p-1 rounded-lg hover:bg-app-elevated/80 text-app-muted hover:text-app-primary transition-colors disabled:opacity-30"
              >
                <Plus size={12} />
              </button>
              <span className="text-[8px] text-app-muted">soal</span>
            </div>
          </div>

          {/* ── Variant Section ── */}
          <div>
            <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              🎨 {isSederhana ? 'Tampilan' : 'Variant'}
            </div>
            <div className="flex gap-2">
              {(['A', 'B', 'C'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-[background-color,border-color,color] ${
                    config.variant === v
                      ? 'bg-app-accent/15 border-app-accent/30 text-app-accent'
                      : 'bg-app-elevated/40 border-app-border/20 text-app-muted hover:border-app-border-strong'
                  }`}
                >
                  {isSederhana
                    ? v === 'A' ? 'Standar' : v === 'B' ? 'Kompak' : 'Lebar'
                    : `Variant ${v}`}
                </button>
              ))}
            </div>
          </div>

          {/* ── Teacher Info Section ── */}
          <div>
            <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              👤 Info Guru
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={config.guru || ''}
                onChange={e => setGuru(e.target.value)}
                placeholder="Nama guru (opsional)"
                className="w-full h-7 px-2.5 text-[10px] bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none placeholder:text-app-muted"
              />
              <input
                type="text"
                value={config.sekolah || ''}
                onChange={e => setSekolah(e.target.value)}
                placeholder="Nama sekolah (opsional)"
                className="w-full h-7 px-2.5 text-[10px] bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none placeholder:text-app-muted"
              />
            </div>
          </div>
        </div>

        {/* Footer with apply button */}
        <div className="px-4 py-3 border-t border-app-border/30 space-y-2">
          {/* Summary */}
          <div className="flex items-center justify-between text-[9px]">
            <span className={applyMode === 'replace' && existingPageCount > 0 ? 'text-amber-400' : 'text-app-muted'}>
              {summaryText}
            </span>
            <span className="text-app-muted">
              {config.jumlahKuis} soal kuis • Variant {config.variant}
            </span>
          </div>

          {/* Warning for replace mode */}
          {applyMode === 'replace' && existingPageCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px]">⚠️</span>
              <span className="text-[8px] text-amber-300">
                {existingPageCount} halaman yang ada akan dihapus dan diganti dengan template ini
              </span>
            </div>
          )}

          {/* Apply button */}
          <button
            onClick={handleApply}
            disabled={isLoading || enabledCount < 2}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-[transform,box-shadow,background-color] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${
              applyMode === 'insert'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-app-accent/15 border border-app-accent/30 text-app-accent hover:bg-app-accent/25'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                {applyMode === 'insert' ? <Merge size={12} /> : <Sparkles size={12} />}
                {applyMode === 'insert'
                  ? (isSederhana ? 'Tambahkan ke Project' : 'Insert into Project')
                  : (isSederhana ? 'Buat Materi' : 'Apply Template')}
                <ChevronRight size={12} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
