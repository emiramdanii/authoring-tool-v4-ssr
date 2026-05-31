'use client';

// ═══════════════════════════════════════════════════════════════════
// VALIDATION SECTION — Template Health Check + Quality Gate Panel
// ═══════════════════════════════════════════════════════════════════
// Template dibuat → health check → quality gate → repair → re-check
// → baru boleh tampil ke guru.
//
// Panel ini menampilkan:
//   - Skor kesehatan (0-100)
//   - Gate status (ready/needs-polish/broken/blocked)
//   - Ringkasan masalah utama (manusiawi, bukan daftar error mentah)
//   - Saran perbaikan
//   - Auto-repair tombol
//   - Daftar issue dengan quick fix
//   - Breakdown skor per area
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { validateTemplate } from '@/core/template/health-check/template-health-check';
import {
  type TemplateHealthIssue,
  type TemplateQuickFix,
  type HealthStatus,
  getHealthStatusLabel,
  getHealthStatusColor,
  FONT_MINIMUMS,
} from '@/core/template/health-check/types';
import {
  decideTemplateStatus,
  getGalleryVisibility,
  type TemplateGateResult,
  type AutoRepairType,
} from '@/core/template/health-check/quality-gate';
import {
  runRepairPipeline,
  runSingleRepair,
  type RepairPipelineResult,
  type RepairResult,
} from '@/core/template/health-check/auto-repair';
import { toast } from 'sonner';
import Section from './Section';
import { Shield, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, RefreshCw, Split, Type, Eraser, Palette, Navigation, Zap, Wrench, Play } from 'lucide-react';

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

function getRepairLabel(repair: AutoRepairType): string {
  switch (repair) {
    case 'fix-font-size': return 'Perbesar Font';
    case 'fix-colors': return 'Normalisasi Warna';
    case 'add-default-feedback': return 'Tambah Feedback';
    case 'sync-scoring': return 'Sinkronkan Skor';
    case 'mark-placeholder': return 'Tandai Placeholder';
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

// ── Gate Badge ───────────────────────────────────────────────────

function GateBadge({ gate }: { gate: TemplateGateResult }) {
  const visibility = getGalleryVisibility(gate.gateStatus);
  const statusColors: Record<string, string> = {
    ready: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    'needs-polish': 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    broken: 'bg-red-500/15 text-red-700 border-red-500/30',
    blocked: 'bg-red-700/15 text-red-800 border-red-700/30',
  };
  const statusLabels: Record<string, string> = {
    ready: 'Siap Pakai',
    'needs-polish': 'Perlu Polish',
    broken: 'Bermasalah',
    blocked: 'Diblokir',
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[9px] font-bold ${statusColors[gate.gateStatus] || ''}`}>
      {gate.gateStatus === 'ready' ? <CheckCircle2 size={10} /> : gate.gateStatus === 'blocked' ? <XCircle size={10} /> : <AlertTriangle size={10} />}
      {statusLabels[gate.gateStatus]}
      {visibility.badgeText && gate.gateStatus !== 'ready' && (
        <span className="text-[7px] opacity-70 ml-0.5">({visibility.badgeText})</span>
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
  const [repairInProgress, setRepairInProgress] = useState(false);
  const [lastRepairResult, setLastRepairResult] = useState<RepairPipelineResult | null>(null);

  // ── Run validation ─────────────────────────────────────────
  const result = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey;
    return validateTemplate({ pages });
  }, [pages, refreshKey]);

  // ── Quality Gate ───────────────────────────────────────────
  const gate = useMemo(() => decideTemplateStatus(result), [result]);

  // ── Filter issues ──────────────────────────────────────────
  const displayedIssues = useMemo(() => {
    if (showCurrentPageOnly) {
      return result.issues.filter(i => i.pageIndex === currentPageIndex);
    }
    return result.issues;
  }, [result.issues, showCurrentPageOnly, currentPageIndex]);

  // ── Current page summary ───────────────────────────────────
  const currentPageSummary = result.pageSummaries[currentPageIndex];

  // ── Auto Repair Handler ────────────────────────────────────
  const handleAutoRepair = useCallback(() => {
    if (!gate.canAutoRepair) {
      toast.info('Tidak ada perbaikan otomatis yang tersedia');
      return;
    }

    setRepairInProgress(true);
    try {
      const repairResult = runRepairPipeline(pages, result);
      setLastRepairResult(repairResult);

      if (repairResult.totalChanges > 0) {
        // Apply the repaired pages to the store
        useCanvaStore.setState({ pages: repairResult.modifiedPages });
        toast.success(`Auto-repair selesai: ${repairResult.totalChanges} perbaikan diterapkan. Skor: ${repairResult.newScore}`);
        // Re-validate after a short delay
        setTimeout(() => setRefreshKey(k => k + 1), 300);
      } else {
        toast.info('Tidak ada perbaikan yang bisa diterapkan secara otomatis');
      }
    } catch (error) {
      toast.error('Gagal menjalankan auto-repair');
      console.error('Auto-repair error:', error);
    } finally {
      setRepairInProgress(false);
    }
  }, [pages, result, gate]);

  // ── Single Repair Handler ──────────────────────────────────
  const handleSingleRepair = useCallback((repairType: AutoRepairType) => {
    try {
      const repairResult = runSingleRepair(pages, repairType);
      if (repairResult.success && repairResult.modifiedPages) {
        useCanvaStore.setState({ pages: repairResult.modifiedPages });
        toast.success(repairResult.description);
        setTimeout(() => setRefreshKey(k => k + 1), 300);
      } else {
        toast.info(repairResult.description);
      }
    } catch (error) {
      toast.error('Gagal menjalankan perbaikan');
      console.error('Single repair error:', error);
    }
  }, [pages]);

  // ── Quick Fix Handlers ─────────────────────────────────────
  const handleQuickFix = useCallback((fix: TemplateQuickFix, issue: TemplateHealthIssue) => {
    const store = useCanvaStore.getState();

    switch (fix) {
      case 'split-page': {
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
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
        // Auto-repair: fix font sizes
        handleSingleRepair('fix-font-size');
        break;
      }

      case 'remove-placeholder': {
        // Auto-repair: mark placeholder text
        handleSingleRepair('mark-placeholder');
        if (issue.blockId) {
          store.selectBlock(issue.blockId);
          setTimeout(() => {
            try {
              const currentState = useCanvaStore.getState();
              if (currentState.startEditing) {
                currentState.startEditing(issue.blockId!);
              }
            } catch { /* ignore */ }
          }, 200);
        }
        if (issue.pageIndex !== store.currentPageIndex) {
          store.goPage(issue.pageIndex);
        }
        break;
      }

      case 'change-variant': {
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
        // Auto-repair: normalize colors
        handleSingleRepair('fix-colors');
        break;
      }

      case 'add-feedback': {
        // Auto-repair: add default feedback
        handleSingleRepair('add-default-feedback');
        break;
      }

      case 'fix-score-sync': {
        // Auto-repair: sync scoring
        handleSingleRepair('sync-scoring');
        break;
      }
    }

    setTimeout(() => setRefreshKey(k => k + 1), 500);
  }, [handleSingleRepair]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLastRepairResult(null);
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
      {/* ── Score & Gate Status ──────────────────────────────── */}
      <div className="mb-3">
        <ScoreRing score={result.score} status={result.status} />
      </div>

      {/* ── Gate Badge ───────────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-2">
        <GateBadge gate={gate} />
        {gate.canPublish && (
          <span className="text-[8px] text-emerald-600">Boleh tampil di galeri</span>
        )}
      </div>

      {/* ── Human Summary ────────────────────────────────────── */}
      {!gate.canPublish && (
        <div className="mb-3 p-2.5 rounded-xl bg-silse-surface-container-low/50 border border-silse-outline-variant/15">
          <div className="text-[8px] font-bold text-silse-on-surface-variant uppercase tracking-widest mb-1">Masalah Utama</div>
          <p className="text-[9px] text-silse-on-surface leading-relaxed">{gate.summary}</p>
          <div className="border-t border-silse-outline-variant/15 mt-2 pt-2">
            <div className="text-[8px] font-bold text-silse-primary uppercase tracking-widest mb-0.5">Saran</div>
            <p className="text-[8px] text-silse-on-surface-variant leading-relaxed">{gate.suggestedAction}</p>
          </div>
        </div>
      )}

      {/* ── Quick Stats ──────────────────────────────────────── */}
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

      {/* ── Auto Repair Button ───────────────────────────────── */}
      {gate.canAutoRepair && !gate.canPublish && (
        <div className="mb-3">
          <button
            onClick={handleAutoRepair}
            disabled={repairInProgress}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-[background-color,transform] duration-150 ${
              repairInProgress
                ? 'bg-silse-surface-container-high/50 text-silse-on-surface-variant cursor-wait'
                : 'bg-silse-primary/15 text-silse-primary hover:bg-silse-primary/25 active:scale-[0.97]'
            }`}
          >
            {repairInProgress ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                Memperbaiki...
              </>
            ) : (
              <>
                <Wrench size={12} />
                Auto-Repair ({gate.availableRepairs.length} perbaikan)
              </>
            )}
          </button>
          {/* Individual repair buttons */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {gate.availableRepairs.map(repair => (
              <button
                key={repair}
                onClick={() => handleSingleRepair(repair)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-silse-surface-container-low/50 border border-silse-outline-variant/15 text-[8px] font-bold text-silse-on-surface-variant hover:bg-silse-surface-container-high/50 hover:text-silse-on-surface transition-colors"
              >
                {repair === 'fix-font-size' && <Type size={8} />}
                {repair === 'fix-colors' && <Palette size={8} />}
                {repair === 'add-default-feedback' && <Zap size={8} />}
                {repair === 'sync-scoring' && <RefreshCw size={8} />}
                {repair === 'mark-placeholder' && <Eraser size={8} />}
                {getRepairLabel(repair)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Repair Result ────────────────────────────────────── */}
      {lastRepairResult && lastRepairResult.totalChanges > 0 && (
        <div className="mb-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="text-[9px] font-bold text-emerald-700 mb-0.5">Repair Selesai</div>
          <div className="text-[8px] text-silse-on-surface-variant">
            {lastRepairResult.totalChanges} perbaikan diterapkan. Skor baru: {lastRepairResult.newScore}.
            {lastRepairResult.nowPassesGate ? ' Template sekarang lolos gate!' : ' Masih perlu perbaikan manual.'}
          </div>
          {lastRepairResult.appliedRepairs.map((r, i) => (
            <div key={i} className="text-[7px] text-silse-on-surface-variant mt-0.5">
              - {r.description}
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Toggle ────────────────────────────────────── */}
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

      {/* ── Breakdown Bars ───────────────────────────────────── */}
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

      {/* ── Issues List ──────────────────────────────────────── */}
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

      {/* ── Page Health Summary ──────────────────────────────── */}
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

      {/* ── Template Not Ready Warning ───────────────────────── */}
      {errorCount > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-silse-error-container/10 border border-silse-error/20">
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle size={12} className="text-silse-error" />
            <span className="text-[10px] font-bold text-silse-error">Template Belum Siap</span>
          </div>
          <p className="text-[8px] text-silse-on-surface-variant leading-relaxed">
            Masih ada {errorCount} error yang harus diperbaiki sebelum template bisa dipakai.
            {gate.canAutoRepair
              ? ' Klik "Auto-Repair" untuk perbaikan otomatis, atau perbaiki manual.'
              : ' Perbaiki issue di atas atau pecah halaman yang terlalu padat.'}
          </p>
        </div>
      )}
    </Section>
  );
}
