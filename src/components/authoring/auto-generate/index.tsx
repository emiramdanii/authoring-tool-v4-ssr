'use client';

import { useState } from 'react';
import { GEN_BUTTONS } from './constants';
import { Spinner } from './Spinner';
import {
  Zap,
  Search,
  Trash2,
  CheckCircle2,
  FileEdit,
  ClipboardList,
  Settings2,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';
import { renderPreviewContent } from './previews';
import { useAutoGenerate } from './use-auto-generate';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { ShowTransition } from '@/lib/transition';

// ═══════════════════════════════════════════════════════════════════
// Step Wizard Indicator
// ═══════════════════════════════════════════════════════════════════

const STEPS = [
  { id: 1, label: 'Paste Materi', icon: ClipboardList },
  { id: 2, label: 'Pengaturan', icon: Settings2 },
  { id: 3, label: 'Generate', icon: Sparkles },
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`
                  relative flex items-center justify-center rounded-full transition-all duration-300
                  ${
                    isCompleted
                      ? 'w-9 h-9 bg-app-accent text-app-inverse shadow-sm'
                      : isActive
                        ? 'w-9 h-9 bg-app-accent/15 text-app-accent ring-2 ring-app-accent/30 ring-offset-2 ring-offset-app-surface'
                        : 'w-9 h-9 bg-app-elevated text-app-muted border border-app-border'
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <span
                className={`text-[0.65rem] font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-app-accent'
                    : isCompleted
                      ? 'text-app-primary'
                      : 'text-app-muted'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {idx < STEPS.length - 1 && (
              <div className="relative flex items-center w-16 sm:w-24 mx-1.5 -mt-4">
                <div className="w-full h-px bg-app-border" />
                <div
                  className={`absolute top-0 left-0 h-px transition-all duration-500 ${
                    isCompleted ? 'w-full bg-app-accent' : 'w-0 bg-app-accent'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component — UI only, logic in useAutoGenerate hook
// ═══════════════════════════════════════════════════════════════════

export default function AutoGenerate() {
  const {
    text,
    setText,
    parsed,
    settings,
    setSettings,
    loading,
    previews,
    activePreview,
    setActivePreview,
    handleParse,
    handleGenerate,
    handleApply,
    handleGenerateAll,
    handleApplyAll,
    handleGenerateFullLesson,
    handleGeneratePertemuan,
    fullLessonLoading,
    parsedStats,
    appliedCount,
  } = useAutoGenerate();

  // Track applying state for button loading indicators
  const [applying, setApplying] = useState(false);

  // Determine current step for the wizard indicator
  const currentStep = parsed ? 3 : text.trim().length >= 50 ? 2 : 1;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
            <Zap size={18} className="text-app-accent" /> Auto-Generate
          </h2>
          <p className="text-sm text-app-secondary mt-1">
            Paste teks materi → Generate Full Lesson BSNP dalam 1 klik.
          </p>
        </div>
      </div>

      {/* ── Step Indicator ──────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl px-4 py-3">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* ── Step 1: Text Input ──────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2.5">
            <span
              className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors ${
                currentStep >= 1
                  ? 'bg-app-accent/15 text-app-accent'
                  : 'bg-app-elevated text-app-muted'
              }`}
            >
              1
            </span>
            Paste Materi
          </h3>
          <span className="text-xs text-app-muted">
            {text.length > 0 ? `${text.split(/\s+/).filter(Boolean).length} kata` : 'Belum ada teks'}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Paste teks materi PPKn di sini...\n\nContoh:\nNorma adalah aturan atau pedoman tingkah laku dalam kehidupan bermasyarakat. Norma berfungsi untuk menciptakan ketertiban dan ketenteraman dalam masyarakat. Norma terdiri dari empat jenis, yaitu norma agama, norma kesusilaan, norma kesopanan, dan norma hukum. Norma agama bersumber dari keyakinan tentang perintah dan larangan Tuhan. Norma hukum memiliki sanksi yang paling tegas karena diberlakukan oleh negara.`}
          rows={8}
          className="w-full bg-app-elevated border border-app-border rounded-lg px-4 py-3 text-sm text-app-primary placeholder:text-app-muted/60 focus:outline-none focus:ring-2 focus:ring-app-accent/40 focus:border-app-accent/50 transition-all duration-200 resize-y min-h-[160px]"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleParse}
            disabled={text.trim().length < 50}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:bg-app-elevated disabled:text-app-muted text-app-inverse font-semibold text-sm rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:shadow-none"
          >
            <Search size={14} /> Parse Teks
          </button>
          <button
            onClick={() => setText('')}
            className="px-3 py-2 bg-app-elevated hover:bg-app-elevated/80 text-app-secondary text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 border border-transparent hover:border-app-border"
          >
            <Trash2 size={13} /> Bersihkan
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-app-muted">
            {text.trim().length < 50 && text.length > 0 && (
              <span className="text-app-warning/80">Minimal 50 karakter (saat ini: {text.trim().length})</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Step 2: Settings ────────────────────────────────── */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2.5">
          <span
            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors ${
              currentStep >= 2
                ? 'bg-app-accent/15 text-app-accent'
                : 'bg-app-elevated text-app-muted'
            }`}
          >
            2
          </span>
          Pengaturan Generate
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Jumlah Kuis */}
          <div className="space-y-1.5">
            <label className="text-xs text-app-secondary font-medium">Jumlah Soal Kuis</label>
            <select
              value={settings.jumlahKuis}
              onChange={(e) => setSettings((s) => ({ ...s, jumlahKuis: parseInt(e.target.value) }))}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/40 focus:border-app-accent/50 transition-all duration-200"
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>{n} soal</option>
              ))}
            </select>
          </div>
          {/* Pertemuan */}
          <div className="space-y-1.5">
            <label className="text-xs text-app-secondary font-medium">Jumlah Pertemuan</label>
            <select
              value={settings.pertemuan}
              onChange={(e) => setSettings((s) => ({ ...s, pertemuan: parseInt(e.target.value) }))}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/40 focus:border-app-accent/50 transition-all duration-200"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n} pertemuan</option>
              ))}
            </select>
          </div>
          {/* Bloom Level */}
          <div className="space-y-1.5">
            <label className="text-xs text-app-secondary font-medium">Level Bloom Maksimal</label>
            <select
              value={settings.bloomMax}
              onChange={(e) => setSettings((s) => ({ ...s, bloomMax: parseInt(e.target.value) }))}
              className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/40 focus:border-app-accent/50 transition-all duration-200"
            >
              <option value={1}>C1 – Mengingat</option>
              <option value={2}>C2 – Memahami</option>
              <option value={3}>C3 – Menerapkan</option>
              <option value={4}>C4 – Menganalisis</option>
              <option value={5}>C5 – Mengevaluasi</option>
              <option value={6}>C6 – Menciptakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Parsed Stats ────────────────────────────────────── */}
      {parsedStats && parsed && (
        <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2">
              <CheckCircle2 size={15} className="text-app-success" />
              Hasil Parse
            </h3>
          </div>

          <div className="px-5 pb-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {parsedStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-app-elevated/60 border border-app-border/40 rounded-lg p-2.5 text-center"
                >
                  <div className="text-base mb-0.5">{stat.icon}</div>
                  <div className="text-lg font-bold text-app-primary leading-tight">{stat.value}</div>
                  <div className="text-[0.6rem] text-app-muted mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Top words */}
            {parsed.topWords.length > 0 && (
              <div>
                <p className="text-xs text-app-muted mb-2">Kata kunci terdeteksi:</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.topWords.slice(0, 15).map((w, i) => (
                    <span
                      key={w + i}
                      className="px-2 py-0.5 bg-app-accent/8 border border-app-accent/15 rounded-md text-xs text-app-accent font-medium"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Definitions preview */}
            {parsed.definitions.length > 0 && (
              <div>
                <p className="text-xs text-app-muted mb-2">Definisi terdeteksi:</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {parsed.definitions.map((d, i) => (
                    <div key={i} className="text-xs text-app-secondary bg-app-elevated/50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-app-accent">{d.term}</span>
                      {' → '}
                      <span className="text-app-secondary">{d.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider before generate section */}
          <div className="border-t border-app-border/60" />
        </div>
      )}

      {/* ── FULL LESSON GENERATE — Primary CTA ──────────────── */}
      {parsed && (
        <div className="bg-gradient-to-br from-app-accent/8 via-app-accent/4 to-transparent border-2 border-app-accent/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-app-accent flex items-center gap-2">
                <Zap size={16} className="flex-shrink-0" />
                Generate Full Lesson BSNP
              </h3>
              <p className="text-xs text-app-secondary mt-1">
                Cover → Petunjuk → TP → Motivasi → Materi → Diskusi → Kuis → Refleksi → Rangkuman → Penutup
              </p>
            </div>
            <button
              onClick={handleGenerateFullLesson}
              disabled={fullLessonLoading || loading.size > 0}
              className="flex-shrink-0 px-5 py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:bg-app-elevated disabled:text-app-muted text-app-inverse font-bold text-sm rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {fullLessonLoading ? <Spinner /> : <Sparkles size={16} />}
              {fullLessonLoading ? 'Generating...' : '⚡ Generate Full Lesson'}
            </button>
          </div>
          <div className="flex items-center gap-4 text-[0.65rem] text-app-muted">
            <span className="flex items-center gap-1">{settings.pertemuan} pertemuan</span>
            <span className="flex items-center gap-1">{settings.jumlahKuis} soal kuis</span>
            <span className="flex items-center gap-1">Bloom C1-C{settings.bloomMax}</span>
          </div>
          {/* Per-Pertemuan quick generate buttons */}
          {settings.pertemuan > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[0.65rem] text-app-muted">Generate per pertemuan:</span>
              {Array.from({ length: settings.pertemuan }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => handleGeneratePertemuan(n)}
                  disabled={fullLessonLoading || loading.size > 0}
                  className="px-3 py-1 bg-app-accent/15 hover:bg-app-accent/25 text-app-accent text-xs font-semibold rounded-lg transition-all duration-200 border border-app-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Pertemuan {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Generate Buttons ────────────────────────── */}
      {parsed && (
        <div className="bg-app-surface border border-app-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-app-primary flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors ${
                  currentStep >= 3
                    ? 'bg-app-accent/15 text-app-accent'
                    : 'bg-app-elevated text-app-muted'
                }`}
              >
                3
              </span>
              Generate Konten
            </h3>
            <button
              onClick={handleGenerateAll}
              disabled={loading.size > 0}
              className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:bg-app-elevated disabled:text-app-muted text-app-inverse font-semibold text-sm rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:shadow-none"
            >
              {loading.size > 0 ? <Spinner /> : <Sparkles size={14} />}
              {loading.size > 0 ? `Generating ${loading.size}...` : 'Generate Semua'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {GEN_BUTTONS.map((btn) => {
              const isLoading = loading.has(btn.type);
              const preview = previews.find((p) => p.type === btn.type);
              const isActive = activePreview?.type === btn.type;

              return (
                <button
                  key={btn.type}
                  onClick={() => {
                    if (!preview) {
                      handleGenerate(btn.type);
                    } else {
                      setActivePreview(preview);
                    }
                  }}
                  disabled={isLoading}
                  className={`
                    relative bg-app-elevated/70 border rounded-xl p-3.5 text-left transition-all duration-200
                    hover:border-app-border hover:bg-app-elevated hover:shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent/40
                    ${
                      isActive
                        ? 'border-app-accent/40 ring-1 ring-app-accent/25 bg-app-accent/5'
                        : 'border-app-border/40'
                    }
                    ${preview ? 'border-app-success/25' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-lg leading-none">{btn.icon}</span>
                    {preview && (
                      <span className="text-[0.6rem] bg-app-success/15 text-app-success px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                        <Check size={8} strokeWidth={3} /> {preview.count}
                      </span>
                    )}
                    {isLoading && <Spinner />}
                  </div>
                  <p className="text-xs font-medium text-app-primary leading-snug">
                    {btn.label}
                  </p>
                  {!preview && !isLoading && (
                    <p className="text-[0.6rem] text-app-muted mt-1">Klik untuk generate</p>
                  )}
                  {preview && !isLoading && (
                    <p className="text-[0.6rem] text-app-success/80 mt-1">Klik untuk lihat preview</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview Panel ───────────────────────────────────── */}
      {activePreview && (
        <div className="bg-app-surface border border-app-border rounded-xl overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">{activePreview.icon}</span>
              <h3 className="text-sm font-semibold text-app-primary truncate">
                Preview: {activePreview.label}
              </h3>
              <span className="text-xs text-app-muted font-normal flex-shrink-0">
                ({activePreview.count} item)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setApplying(true);
                  // Brief delay for visual feedback before navigation
                  setTimeout(() => {
                    handleApply(activePreview);
                    setApplying(false);
                  }, 150);
                }}
                disabled={applying}
                className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover disabled:bg-app-accent/60 text-app-inverse font-semibold text-sm rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow disabled:shadow-none"
              >
                {applying ? <Spinner /> : <CheckCircle2 size={14} />}
                {applying ? 'Menerapkan...' : 'Terapkan ke Proyek'}
              </button>
              {previews.length > 1 && (
                <button
                  onClick={() => {
                    setApplying(true);
                    setTimeout(() => {
                      handleApplyAll();
                      setApplying(false);
                    }, 150);
                  }}
                  disabled={applying}
                  className="px-3 py-2 bg-app-elevated hover:bg-app-elevated/80 disabled:bg-app-elevated/40 text-app-primary text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 border border-transparent hover:border-app-border disabled:cursor-not-allowed"
                >
                  {applying ? <Spinner /> : <Zap size={13} />}
                  {applying ? '...' : `Terapkan Semua (${previews.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Preview tabs */}
          {previews.length > 1 && (
            <div className="px-5 pb-2 flex gap-1.5 overflow-x-auto custom-scrollbar">
              {previews.map((p) => (
                <button
                  key={p.type}
                  onClick={() => setActivePreview(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-150 ${
                    activePreview.type === p.type
                      ? 'bg-app-accent/15 text-app-accent font-semibold shadow-sm'
                      : 'bg-app-elevated/60 text-app-secondary hover:bg-app-elevated hover:text-app-primary'
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Preview content */}
          <div className="px-5 pb-5 pt-2">
            <div className="max-h-[480px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {renderPreviewContent(activePreview)}
            </div>
          </div>
        </div>
      )}

      {/* ── Next Step Banner (after apply) ────────────────── */}
      {appliedCount > 0 && (
        <div
          className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 anim-enter-slide-up"
          style={{ animationDuration: '0.3s' }}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <ArrowRight size={18} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-300">
                  Konten sudah diterapkan! Langkah berikutnya:
                </p>
                <p className="text-xs text-emerald-400/60 mt-0.5">
                  Atau lanjut generate konten lainnya
                </p>
              </div>
            </div>
            <button
              onClick={() => useCanvaStore.setState({ panelRequest: 'canva' })}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
            >
              Buka Canva untuk Edit <ArrowRight size={14} />
            </button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!parsed && (
        <div className="bg-app-surface border border-app-border rounded-xl p-8 sm:p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-app-elevated/80 flex items-center justify-center mb-4">
            <FileEdit size={24} className="text-app-muted" />
          </div>
          <h3 className="text-lg font-semibold text-app-primary mb-2">Paste materi untuk memulai</h3>
          <p className="text-sm text-app-secondary max-w-lg mx-auto leading-relaxed">
            Salin teks materi PPKn dari buku atau sumber lain, lalu paste di kolom di atas.
            Sistem akan otomatis mem-parsing dan meng-generate berbagai jenis konten pembelajaran.
          </p>
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-app-muted">
            <span className="inline-flex items-center gap-1.5 bg-app-elevated/80 border border-app-border/40 px-2.5 py-1 rounded-lg">
              <FileEdit size={12} /> Paste
            </span>
            <span className="text-app-muted/60">→</span>
            <span className="inline-flex items-center gap-1.5 bg-app-elevated/80 border border-app-border/40 px-2.5 py-1 rounded-lg">
              <Search size={12} /> Parse
            </span>
            <span className="text-app-muted/60">→</span>
            <span className="inline-flex items-center gap-1.5 bg-app-elevated/80 border border-app-border/40 px-2.5 py-1 rounded-lg">
              <Zap size={12} /> Generate
            </span>
            <span className="text-app-muted/60">→</span>
            <span className="inline-flex items-center gap-1.5 bg-app-elevated/80 border border-app-border/40 px-2.5 py-1 rounded-lg">
              <CheckCircle2 size={12} /> Terapkan
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
