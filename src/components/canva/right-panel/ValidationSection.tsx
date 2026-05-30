'use client';

// ═══════════════════════════════════════════════════════════════════
// VALIDATION SECTION — Template Health Check Panel
// ═══════════════════════════════════════════════════════════════════
// Tampilkan hasil validasi di panel kanan bagian "Validasi".
// Beri tombol aksi: Pecah Halaman, Pilih Variasi Lain,
// Perbesar Font, Hapus Placeholder.
//
// Template tidak boleh dianggap siap jika masih ada issue error.
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { validateTemplate, validateSinglePage } from '@/core/template/health-check/template-health-check';
import {
  type TemplateHealthIssue,
  type TemplateQuickFix,
  type HealthStatus,
  getHealthStatusLabel,
  getHealthStatusColor,
  FONT_MINIMUMS,
} from '@/core/template/health-check/types';
import { toast } from 'sonner';
import Section from './Section';
import { Shield, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, RefreshCw, Split, Type, Eraser, Palette, Navigation, Zap } from 'lucide-react';

// ── Issue Type Icon Map ──────────────────────────────────────────

function getIssueIcon(type: TemplateHealthIssue['type']) {
  switch (type) {
    case 'overlap': return '⬜⬜';
    case 'overflow': return '↗️';
    case 'font-too-small': return '🔤';
    case 'too-many-blocks': return '📦';
    case 'too-many-colors': return '🎨';
    case 'missing-navigation': return '🧭';
    case 'broken-score': return '📊';
    case 'broken-completion': return '🔒';
    case 'placeholder-text': return '📝';
    case 'missing-feedback': return '💬';
    case 'export-mismatch': return '🔄';
    case 'empty-content': return '📭';
    case 'hardcoded-color': return '🎨';
    case 'narrative-incoherent': return '📖';
    default: return '⚠️';
  }
}

function getQuickFixLabel(fix: TemplateQuickFix): string {
  switch (fix) {
    case 'split-page': return 'Pecah Halaman';
    case 'enlarge-font': return 'Perbesar Font';
    case 'remove-placeholder': return 'Hapus Placeholder';
    case 'change-variant': return 'Pilih Variasi Lain';
    case 'fix-navigation': return 'Perbaiki Navigasi';
    case 'fix-colors': return 'Perbaiki Warna';
    case 'add-feedback': return 'Tambah Feedback';
    case 'fix-score-sync': return 'Sinkronkan Score';
  }
}

function getQuickFixIcon(fix: TemplateQuickFix) {
  switch (fix) {
    case 'split-page': return <Split size={12} />;
    case 'enlarge-font': return <Type size={12} />;
    case 'remove-placeholder': return <Eraser size={12} />;
    case 'change-variant': return <Palette size={12} />;
    case 'fix-navigation': return <Navigation size={12} />;
    case 'fix-colors': return <Palette size={12} />;
    case 'add-feedback': return <Zap size={12} />;
    case 'fix-score-sync': return <RefreshCw size={12} />;
  }
}

// ── Score Ring Component ─────────────────────────────────────────

function ScoreRing({ score, status }: { score: number; status: HealthStatus }) {
  const color = getHealthStatusColor(status);
  const label = getHealthStatusLabel(status);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-silse-surface-container-high" />
          <circle cx="32" cy="32" r={radius} fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-[stroke-dashoffset] duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold" style={{ color }}>{label}</div>
        <div className="text-[9px] text-silse-on-surface-variant">
          {score >= 90 ? 'Template siap dipakai' :
           score >= 75 ? 'Perlu beberapa perbaikan' :
           score >= 60 ? 'Ada masalah yang harus diperbaiki' :
           'Jangan dipakai — terlalu bermasalah'}
        </div>
      </div>
    </div>
  );
}

// ── Breakdown Bar ────────────────────────────────────────────────

function BreakdownBar({ label, score, max, issues }: { label: string; score: number; max: number; issues: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] text-silse-on-surface-variant w-20 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-silse-surface-container-high rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      <span className="text-[8px] font-bold w-6 text-right" style={{ color: barColor }}>{Math.round(score)}</span>
      {issues > 0 && (
        <span className="text-[7px] bg-silse-error-container/20 text-silse-error px-1 py-0.5 rounded-full font-bold">{issues}</span>
      )}
    </div>
  );
}

// ── Issue Item ───────────────────────────────────────────────────

function IssueItem({ issue, onQuickFix }: { issue: TemplateHealthIssue; onQuickFix: (fix: TemplateQuickFix, issue: TemplateHealthIssue) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isSevere = issue.severity === 'error';

  return (
    <div className={`rounded-lg border ${isSevere ? 'border-silse-error/20 bg-silse-error-container/5' : 'border-silse-outline-variant/20 bg-silse-surface-container-low/50'} mb-1.5 overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-2.5 py-2 flex items-start gap-2 text-left hover:bg-silse-surface-container-high/30 transition-colors"
      >
        <span className="text-[11px] flex-shrink-0 mt-0.5">{getIssueIcon(issue.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            {isSevere ? (
              <XCircle size={10} className="text-silse-error flex-shrink-0" />
            ) : (
              <AlertTriangle size={10} className="text-amber-500 flex-shrink-0" />
            )}
            <span className={`text-[10px] font-bold ${isSevere ? 'text-silse-error' : 'text-amber-600'}`}>
              {isSevere ? 'ERROR' : 'WARNING'}
            </span>
            <span className="text-[8px] text-silse-on-surface-variant ml-auto">Hal. {issue.pageIndex + 1}</span>
          </div>
          <p className="text-[9px] text-silse-on-surface leading-relaxed">{issue.message}</p>
        </div>
        {expanded ? <ChevronDown size={10} className="flex-shrink-0 text-silse-on-surface-variant" /> : <ChevronRight size={10} className="flex-shrink-0 text-silse-on-surface-variant" />}
      </button>

      {expanded && (
        <div className="px-2.5 pb-2 pt-0.5">
          {issue.detail && (
            <div className="text-[8px] text-silse-on-surface-variant bg-silse-surface-container-high/30 rounded-md px-2 py-1 mb-1.5 font-mono">
              {issue.detail}
            </div>
          )}
          {issue.quickFix && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickFix(issue.quickFix!, issue); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-silse-primary/10 text-silse-primary text-[9px] font-bold hover:bg-silse-primary/20 active:scale-[0.97] transition-[background-color,transform] duration-150"
            >
              {getQuickFixIcon(issue.quickFix)}
              {getQuickFixLabel(issue.quickFix)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: ValidationSection
// ═══════════════════════════════════════════════════════════════════

export default function ValidationSection() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const [collapsed, setCollapsed] = useState(false);
  const [showCurrentPageOnly, setShowCurrentPageOnly] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Run validation ─────────────────────────────────────────
  const result = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey; // Depend on refreshKey to trigger re-validation
    return validateTemplate({ pages });
  }, [pages, refreshKey]);

  // ── Filter issues ──────────────────────────────────────────
  const displayedIssues = useMemo(() => {
    if (showCurrentPageOnly) {
      return result.issues.filter(i => i.pageIndex === currentPageIndex);
    }
    return result.issues;
  }, [result.issues, showCurrentPageOnly, currentPageIndex]);

  // ── Current page summary ───────────────────────────────────
  const currentPageSummary = result.pageSummaries[currentPageIndex];

  // ── Quick Fix Handlers ─────────────────────────────────────
  const handleQuickFix = useCallback((fix: TemplateQuickFix, issue: TemplateHealthIssue) => {
    const store = useCanvaStore.getState();

    switch (fix) {
      case 'split-page': {
        // Navigate to the problematic page and suggest splitting
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        // If there's a specific block, split at that block
        if (issue.blockId) {
          try {
            store.splitPageAtBlock(issue.blockId);
            toast.success('Halaman berhasil dipecah');
          } catch {
            toast.error('Gagal memecah halaman — coba manual');
          }
        } else {
          toast.info('Pilih block yang ingin dipindah ke halaman baru, lalu gunakan "Pecah Halaman"');
        }
        break;
      }

      case 'enlarge-font': {
        // Select the problematic block and increase font size
        if (issue.blockId) {
          store.selectBlock(issue.blockId);
        }
        // Navigate to the page first
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        toast.info(`Font minimal untuk media siswa: Body ${FONT_MINIMUMS.body}px, Judul ${FONT_MINIMUMS.pageTitle}px, Cover ${FONT_MINIMUMS.coverTitle}px`);
        break;
      }

      case 'remove-placeholder': {
        // Select the block with placeholder text for editing
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        if (issue.blockId) {
          store.selectBlock(issue.blockId);
          // Start inline editing after a short delay (page might be changing)
          setTimeout(() => {
            try {
              const currentState = useCanvaStore.getState();
              if (currentState.startEditing) {
                currentState.startEditing(issue.blockId!);
              }
            } catch { /* ignore if block no longer exists */ }
          }, 200);
        }
        toast.info('Klik teks placeholder di canvas dan ganti dengan konten asli');
        break;
      }

      case 'change-variant': {
        // Navigate to page and suggest variant change
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        toast.info('Coba ganti varian tampilan di bagian "Pengaturan Halaman" → Varian Tampilan');
        break;
      }

      case 'fix-navigation': {
        toast.info('Periksa urutan halaman di panel kiri. Cover di awal, penutup di akhir.');
        break;
      }

      case 'fix-colors': {
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        toast.info('Gunakan palet warna di bagian "Palet Warna" untuk konsistensi');
        break;
      }

      case 'add-feedback': {
        if (issue.blockId) {
          store.selectBlock(issue.blockId);
        }
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        toast.info('Tambahkan feedback/jawaban benar di properti block kuis/game');
        break;
      }

      case 'fix-score-sync': {
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        toast.info('Periksa konfigurasi scoring dan navigation lock di properti halaman');
        break;
      }
    }

    // Re-validate after a short delay
    setTimeout(() => setRefreshKey(k => k + 1), 500);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    toast.success('Validasi diperbarui');
  }, []);

  // ── Error / warning counts ─────────────────────────────────
  const errorCount = displayedIssues.filter(i => i.severity === 'error').length;
  const warningCount = displayedIssues.filter(i => i.severity === 'warning').length;

  return (
    <Section
      icon={<Shield size={12} />}
      title="Validasi"
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
    >
      {/* ── Score & Status ────────────────────────────────────── */}
      <div className="mb-3">
        <ScoreRing score={result.score} status={result.status} />
      </div>

      {/* ── Quick Stats ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-silse-error-container/10">
          <XCircle size={10} className="text-silse-error" />
          <span className="text-[9px] font-bold text-silse-error">{errorCount} error</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10">
          <AlertTriangle size={10} className="text-amber-500" />
          <span className="text-[9px] font-bold text-amber-600">{warningCount} warning</span>
        </div>
        <button
          onClick={handleRefresh}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-silse-surface-container-high/50 transition-colors"
          title="Refresh validasi"
        >
          <RefreshCw size={10} className="text-silse-on-surface-variant" />
        </button>
      </div>

      {/* ── Filter Toggle ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setShowCurrentPageOnly(true)}
          className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg transition-colors ${
            showCurrentPageOnly
              ? 'bg-silse-primary/15 text-silse-primary'
              : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/50'
          }`}
        >
          Halaman Ini ({currentPageSummary?.errors ?? 0}E / {currentPageSummary?.warnings ?? 0}W)
        </button>
        <button
          onClick={() => setShowCurrentPageOnly(false)}
          className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg transition-colors ${
            !showCurrentPageOnly
              ? 'bg-silse-primary/15 text-silse-primary'
              : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/50'
          }`}
        >
          Semua ({result.issues.filter(i => i.severity === 'error').length}E)
        </button>
      </div>

      {/* ── Breakdown Bars ────────────────────────────────────── */}
      <div className="mb-3 p-2.5 rounded-xl bg-silse-surface-container-low/50 border border-silse-outline-variant/15">
        <div className="text-[8px] font-bold text-silse-on-surface-variant uppercase tracking-widest mb-2">Breakdown Skor</div>
        <BreakdownBar label="Tidak Overlap" {...result.breakdown.noOverlap} />
        <BreakdownBar label="Tidak Overflow" {...result.breakdown.noOverflow} />
        <BreakdownBar label="Font Terbaca" {...result.breakdown.fontReadable} />
        <BreakdownBar label="1 Fokus/Hal" {...result.breakdown.oneFocusPerPage} />
        <BreakdownBar label="Warna Konsisten" {...result.breakdown.colorConsistent} />
        <BreakdownBar label="Navigasi Jalan" {...result.breakdown.navigationWorking} />
        <BreakdownBar label="Interaksi Jalan" {...result.breakdown.interactionWorking} />
      </div>

      {/* ── Issues List ───────────────────────────────────────── */}
      {displayedIssues.length === 0 ? (
        <div className="text-center py-4">
          <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1.5" />
          <div className="text-[10px] font-bold text-emerald-600">
            {showCurrentPageOnly ? 'Halaman ini valid' : 'Semua halaman valid'}
          </div>
          <div className="text-[8px] text-silse-on-surface-variant mt-0.5">
            Tidak ada masalah ditemukan
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Show errors first, then warnings */}
          {displayedIssues
            .sort((a, b) => {
              if (a.severity === 'error' && b.severity !== 'error') return -1;
              if (a.severity !== 'error' && b.severity === 'error') return 1;
              return a.pageIndex - b.pageIndex;
            })
            .map((issue, idx) => (
              <IssueItem key={`${issue.type}-${issue.pageIndex}-${idx}`} issue={issue} onQuickFix={handleQuickFix} />
            ))}
        </div>
      )}

      {/* ── Page Health Summary (all pages view) ──────────────── */}
      {!showCurrentPageOnly && result.pageSummaries.length > 1 && (
        <div className="mt-3 border-t border-silse-outline-variant/20 pt-2.5">
          <div className="text-[8px] font-bold text-silse-on-surface-variant uppercase tracking-widest mb-2">Per Halaman</div>
          <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
            {result.pageSummaries.map((ps) => (
              <button
                key={ps.pageIndex}
                onClick={() => {
                  useCanvaStore.getState().goPage(ps.pageIndex);
                  setShowCurrentPageOnly(true);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-silse-surface-container-high/30 ${
                  ps.pageIndex === currentPageIndex ? 'bg-silse-primary/10' : ''
                }`}
              >
                {ps.passed ? (
                  <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle size={10} className="text-silse-error flex-shrink-0" />
                )}
                <span className="text-[9px] text-silse-on-surface truncate flex-1">
                  {ps.label}
                </span>
                {ps.errors > 0 && (
                  <span className="text-[7px] font-bold text-silse-error">{ps.errors}E</span>
                )}
                {ps.warnings > 0 && (
                  <span className="text-[7px] font-bold text-amber-500">{ps.warnings}W</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Template Not Ready Warning ────────────────────────── */}
      {errorCount > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-silse-error-container/10 border border-silse-error/20">
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle size={12} className="text-silse-error" />
            <span className="text-[10px] font-bold text-silse-error">Template Belum Siap</span>
          </div>
          <p className="text-[8px] text-silse-on-surface-variant leading-relaxed">
            Masih ada {errorCount} error yang harus diperbaiki sebelum template bisa dipakai.
            Perbaiki issue di atas atau pecah halaman yang terlalu padat.
          </p>
        </div>
      )}
    </Section>
  );
}
