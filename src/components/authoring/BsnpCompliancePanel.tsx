'use client';

import { useEffect, useState, useCallback } from 'react';
import { isEnabled } from '@/config/feature-flags';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { COLORS } from '@/lib/color-palette';
import {
  Shield,
  BookOpen,
  Target,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Lightbulb,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  FileCheck,
} from 'lucide-react';
import type { PanelId } from '@/store/authoring/types';
import { isGameBlockType, isBlockTypeInteractive } from '@/core/schema/capability-registry';

// ═══════════════════════════════════════════════════════════════════
// BSNP COMPLIANCE PANEL — Enhanced with sub-checks & auto-fix
// ═══════════════════════════════════════════════════════════════════
// Phase 4+ Enhancement:
//   - 8 BSNP components (was 5) — added Tujuan, Motivasi, Rangkuman
//   - Sub-checks per component for granular compliance tracking
//   - Expandable detail cards with actionable fix suggestions
//   - Overall progress bar with animated fill
//   - Quick-fix actions for common missing items
// ═══════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────
type ComplianceStatus = 'complete' | 'partial' | 'missing';

interface SubCheck {
  key: string;
  label: string;
  status: ComplianceStatus;
  fixHint?: string;
  fixAction?: PanelId;
}

interface BsnpComponent {
  key: string;
  name: string;
  description: string;
  missingHint: string;
  status: ComplianceStatus;
  targetPanel: PanelId;
  icon: React.ReactNode;
  subChecks: SubCheck[];
}

// ── Compliance Ring ────────────────────────────────────────────────
function ComplianceRing({ percentage, status }: { percentage: number; status: ComplianceStatus }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percentage), 80);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = 52;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;

  const ringColor =
    status === 'complete'
      ? COLORS.success
      : status === 'partial'
        ? COLORS.warning
        : COLORS.error;

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg
        width={radius * 2}
        height={radius * 2}
        className="transform -rotate-90"
        style={{ margin: 'auto', position: 'absolute', inset: 0 }}
      >
        <circle
          stroke="currentColor"
          className="text-app-elevated/50"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: ringColor, transition: 'color 0.5s ease' }}
        >
          {Math.round(animatedPercent)}%
        </span>
        <span className="text-[0.55rem] text-app-muted mt-0.5">Kepatuhan BSNP</span>
      </div>
    </div>
  );
}

// ── Status Icon ────────────────────────────────────────────────────
function StatusIcon({ status, size = 16 }: { status: ComplianceStatus; size?: number }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 size={size} className="text-emerald-400 flex-shrink-0" />;
    case 'partial':
      return <AlertTriangle size={size} className="text-amber-400 flex-shrink-0" />;
    case 'missing':
      return <XCircle size={size} className="text-red-400 flex-shrink-0" />;
  }
}

function statusLabel(status: ComplianceStatus): string {
  switch (status) {
    case 'complete':
      return 'Lengkap';
    case 'partial':
      return 'Sebagian';
    case 'missing':
      return 'Belum Ada';
  }
}

function statusBadgeClasses(status: ComplianceStatus): string {
  switch (status) {
    case 'complete':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'partial':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'missing':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
  }
}

function cardBorderClasses(status: ComplianceStatus): string {
  switch (status) {
    case 'complete':
      return 'border-emerald-500/20 hover:border-emerald-500/40';
    case 'partial':
      return 'border-amber-500/20 hover:border-amber-500/40';
    case 'missing':
      return 'border-red-500/20 hover:border-red-500/40';
  }
}

// ── Expandable Component Card ──────────────────────────────────────
function ComponentCard({ comp, onNavigate }: { comp: BsnpComponent; onNavigate: (panel: PanelId) => void }) {
  const [expanded, setExpanded] = useState(false);

  // Auto-expand missing/partial items
  const shouldHighlight = comp.status !== 'complete';

  return (
    <div
      className={`bg-app-elevated/30 border ${cardBorderClasses(comp.status)} rounded-lg overflow-hidden transition-all`}
    >
      {/* Main row — clickable to expand/navigate */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 transition-all cursor-pointer text-left group"
      >
        <span className={`flex-shrink-0 ${
          comp.status === 'complete'
            ? 'text-emerald-400'
            : comp.status === 'partial'
              ? 'text-amber-400'
              : 'text-red-400/60'
        }`}>
          {comp.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-app-primary truncate">
              {comp.name}
            </span>
            <span className={`text-[0.5rem] px-1.5 py-0.5 rounded-full border font-semibold flex-shrink-0 ${statusBadgeClasses(comp.status)}`}>
              {statusLabel(comp.status)}
            </span>
            {/* Sub-check progress */}
            {comp.subChecks.length > 0 && (
              <span className="text-[0.5rem] text-app-muted flex-shrink-0">
                {comp.subChecks.filter(sc => sc.status === 'complete').length}/{comp.subChecks.length}
              </span>
            )}
          </div>
          <span className="text-[0.55rem] text-app-muted block truncate">
            {comp.status === 'missing' ? comp.missingHint : comp.description}
          </span>
        </div>
        <StatusIcon status={comp.status} />
        {expanded ? <ChevronUp size={12} className="text-app-muted" /> : <ChevronDown size={12} className="text-app-muted" />}
      </button>

      {/* Expanded sub-checks */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-app-border/20">
          {comp.subChecks.map((sc) => (
            <div
              key={sc.key}
              className="flex items-start gap-2 py-1"
            >
              <StatusIcon status={sc.status} size={12} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[0.6rem] font-medium ${sc.status === 'complete' ? 'text-app-primary/80' : 'text-app-muted'}`}>
                    {sc.label}
                  </span>
                </div>
                {sc.status !== 'complete' && sc.fixHint && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[0.5rem] text-amber-400/60">{sc.fixHint}</span>
                    {sc.fixAction && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onNavigate(sc.fixAction!); }}
                        className="text-[0.5rem] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5 transition-colors"
                      >
                        Perbaiki <ArrowRight size={8} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick navigate button */}
          <button
            onClick={() => onNavigate(comp.targetPanel)}
            className="mt-2 w-full text-[0.6rem] text-app-muted hover:text-app-primary font-medium flex items-center justify-center gap-1 py-1.5 rounded-md bg-app-elevated/20 hover:bg-app-elevated/40 transition-all"
          >
            Buka Panel <ArrowRight size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function BsnpCompliancePanel() {
  const petunjuk = useAuthoringStore((s) => s.petunjuk);
  const cp = useAuthoringStore((s) => s.cp);
  const tp = useAuthoringStore((s) => s.tp);
  const materi = useAuthoringStore((s) => s.materi);
  const modules = useAuthoringStore((s) => s.modules);
  const kuis = useAuthoringStore((s) => s.kuis);
  const games = useAuthoringStore((s) => s.games);
  const alur = useAuthoringStore((s) => s.alur);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);

  // Get pages from canva store to check for schema blocks
  const pages = useCanvaStore((s) => s.pages);

  // ── Schema block type detection ──────────────────────────────────
  const schemaBlockTypes = new Set<string>();
  for (const page of pages) {
    if (page.schema?.blocks) {
      for (const block of page.schema.blocks) {
        schemaBlockTypes.add(block.type);
      }
    }
  }

  const hasTujuanDisplay = schemaBlockTypes.has('tujuan-display') || tp.length > 0;
  const hasMotivasi = schemaBlockTypes.has('motivasi');
  const hasRangkuman = schemaBlockTypes.has('rangkuman');
  const hasMateriSection = schemaBlockTypes.has('materi-section');

  // ── Evaluasi block detection (Phase 6 enhanced) ────────────────
  // Uses capability registry as single source of truth for game detection,
  // plus BSNP-specific evaluasi types (kuis, skenario) that are
  // assessment-oriented but not "game" blocks per the registry.
  const schemaGameCount = [...schemaBlockTypes].filter(t =>
    isGameBlockType(t) || t === 'kuis' || t === 'skenario'
  ).length;

  // ── Compliance Logic with sub-checks ─────────────────────────────
  const petunjukStatus: ComplianceStatus =
    petunjuk.langkah.length > 0 ? 'complete' : 'missing';

  const kdtpStatus: ComplianceStatus =
    tp.length > 0
      ? 'complete'
      : cp.capaianFase
        ? 'partial'
        : 'missing';

  const materiStatus: ComplianceStatus =
    materi.blok.length > 0 || modules.length > 0
      ? 'complete'
      : 'missing';

  const evaluasiCount = kuis.length + games.length + schemaGameCount;
  const evaluasiStatus: ComplianceStatus =
    evaluasiCount >= 3
      ? 'complete'
      : evaluasiCount >= 1
        ? 'partial'
        : 'missing';

  const profilStatus: ComplianceStatus =
    cp.profil.length > 0 ? 'complete' : 'missing';

  const tujuanDisplayStatus: ComplianceStatus =
    hasTujuanDisplay ? 'complete' : 'missing';

  const motivasiStatus: ComplianceStatus =
    hasMotivasi ? 'complete' : 'missing';

  const rangkumanStatus: ComplianceStatus =
    hasRangkuman ? 'complete' : 'missing';

  // ── Component list (8 BSNP components) ───────────────────────────
  const components: BsnpComponent[] = [
    {
      key: 'petunjuk',
      name: 'Petunjuk',
      description: 'Langkah-langkah penggunaan media',
      missingHint: 'Tambahkan langkah petunjuk penggunaan',
      status: petunjukStatus,
      targetPanel: 'konten',
      icon: <BookOpen size={16} />,
      subChecks: [
        { key: 'pet-langkah', label: 'Langkah penggunaan', status: petunjuk.langkah.length > 0 ? 'complete' : 'missing', fixHint: 'Tambahkan minimal 3 langkah', fixAction: 'konten' },
        { key: 'pet-nav', label: 'Info navigasi', status: (petunjuk.navigation?.length ?? 0) > 0 ? 'complete' : 'partial', fixHint: 'Tambahkan info navigasi', fixAction: 'konten' },
      ],
    },
    {
      key: 'tujuan',
      name: 'Tujuan Pembelajaran',
      description: 'TP yang ditampilkan ke siswa',
      missingHint: 'Tambahkan Tujuan Pembelajaran',
      status: tujuanDisplayStatus,
      targetPanel: 'dokumen',
      icon: <Target size={16} />,
      subChecks: [
        { key: 'tp-items', label: 'Tujuan Pembelajaran (TP)', status: tp.length > 0 ? 'complete' : 'missing', fixHint: 'Tambahkan TP di panel Dokumen', fixAction: 'dokumen' },
        { key: 'tp-display', label: 'Block Tujuan Display', status: hasTujuanDisplay ? 'complete' : 'missing', fixHint: 'Tambahkan block "Tujuan (Tampilan)" di canvas', fixAction: 'konten' },
        { key: 'tp-profil', label: 'Profil Pelajar Pancasila', status: cp.profil.length > 0 ? 'complete' : 'missing', fixHint: 'Pilih dimensi Profil', fixAction: 'dokumen' },
      ],
    },
    {
      key: 'motivasi',
      name: 'Motivasi / Apersepsi',
      description: 'Pertanyaan pemicu & koneksi pengetahuan',
      missingHint: 'Tambahkan block Motivasi/Apersepsi',
      status: motivasiStatus,
      targetPanel: 'konten',
      icon: <Lightbulb size={16} />,
      subChecks: [
        { key: 'mot-block', label: 'Block Motivasi', status: hasMotivasi ? 'complete' : 'missing', fixHint: 'Tambahkan block "Motivasi / Apersepsi" di canvas', fixAction: 'konten' },
        { key: 'mot-hook', label: 'Pertanyaan pemicu', status: hasMotivasi ? 'complete' : 'missing', fixHint: 'Isi pertanyaan pemicu yang menarik', fixAction: 'konten' },
      ],
    },
    {
      key: 'materi',
      name: 'Materi',
      description: 'Konten & bahan ajar interaktif',
      missingHint: 'Tambahkan materi blok atau modul',
      status: materiStatus,
      targetPanel: 'konten',
      icon: <FileText size={16} />,
      subChecks: [
        { key: 'mat-blok', label: 'Blok materi', status: materi.blok.length > 0 ? 'complete' : 'missing', fixHint: 'Tambahkan blok materi', fixAction: 'konten' },
        { key: 'mat-modules', label: 'Modul interaktif', status: modules.length > 0 ? 'complete' : 'partial', fixHint: 'Tambahkan modul (game, kuis)', fixAction: 'konten' },
        { key: 'mat-section', label: 'Materi Section (BSNP)', status: hasMateriSection ? 'complete' : 'partial', fixHint: 'Gunakan block "Bagian Materi" untuk struktur BSNP', fixAction: 'konten' },
      ],
    },
    {
      key: 'rangkuman',
      name: 'Rangkuman / Penguatan',
      description: 'Ringkasan konsep di akhir materi',
      missingHint: 'Tambahkan block Rangkuman',
      status: rangkumanStatus,
      targetPanel: 'konten',
      icon: <BookMarked size={16} />,
      subChecks: [
        { key: 'rang-block', label: 'Block Rangkuman', status: hasRangkuman ? 'complete' : 'missing', fixHint: 'Tambahkan block "Rangkuman" di canvas', fixAction: 'konten' },
        { key: 'rang-concepts', label: 'Konsep kunci', status: hasRangkuman ? 'complete' : 'missing', fixHint: 'Isi konsep kunci yang telah dipelajari', fixAction: 'konten' },
      ],
    },
    {
      key: 'evaluasi',
      name: 'Evaluasi',
      description: `Kuis (${kuis.length}) · Game Authoring (${games.length}) · Game Schema (${schemaGameCount})`,
      missingHint: evaluasiCount === 0 ? 'Tambahkan kuis atau game' : 'Tambahkan lebih banyak evaluasi',
      status: evaluasiStatus,
      targetPanel: 'konten',
      icon: <Shield size={16} />,
      subChecks: [
        { key: 'eval-kuis', label: `Kuis (${kuis.length})`, status: kuis.length > 0 || schemaBlockTypes.has('kuis') ? 'complete' : 'missing', fixHint: 'Tambahkan minimal 1 kuis', fixAction: 'konten' },
        { key: 'eval-game', label: `Game interaktif (${games.length + schemaGameCount})`, status: games.length + schemaGameCount > 0 ? 'complete' : 'missing', fixHint: 'Tambahkan game (Memory, Pasangkan, Isian, dll.)', fixAction: 'konten' },
        { key: 'eval-min', label: 'Minimal 3 evaluasi', status: evaluasiCount >= 3 ? 'complete' : evaluasiCount >= 1 ? 'partial' : 'missing', fixHint: `Butuh ${Math.max(0, 3 - evaluasiCount)} lagi`, fixAction: 'konten' },
      ],
    },
    {
      key: 'kdtp',
      name: 'KD / Capaian Pembelajaran',
      description: 'Kompetensi Dasar & Capaian Fase',
      missingHint: 'Isi Capaian Pembelajaran',
      status: kdtpStatus,
      targetPanel: 'dokumen',
      icon: <Zap size={16} />,
      subChecks: [
        { key: 'kd-cp', label: 'Capaian Fase', status: cp.capaianFase ? 'complete' : 'missing', fixHint: 'Isi Capaian Fase di panel Dokumen', fixAction: 'dokumen' },
        { key: 'kd-tp', label: 'Tujuan Pembelajaran', status: tp.length > 0 ? 'complete' : 'missing', fixHint: 'Tambahkan TP', fixAction: 'dokumen' },
      ],
    },
    {
      key: 'profil',
      name: 'Profil Pelajar Pancasila',
      description: `${cp.profil.length} dimensi terisi`,
      missingHint: 'Pilih dimensi Profil Pelajar Pancasila',
      status: profilStatus,
      targetPanel: 'dokumen',
      icon: <Users size={16} />,
      subChecks: [
        { key: 'pp-dimensi', label: `${cp.profil.length} dimensi`, status: cp.profil.length > 0 ? 'complete' : 'missing', fixHint: 'Pilih minimal 1 dimensi', fixAction: 'dokumen' },
      ],
    },
  ];

  // ── Overall compliance ──────────────────────────────────────────
  const statusScore: Record<ComplianceStatus, number> = {
    complete: 100,
    partial: 50,
    missing: 0,
  };

  const overallPercent = Math.round(
    components.reduce((sum, c) => sum + statusScore[c.status], 0) / components.length
  );

  const overallStatus: ComplianceStatus =
    overallPercent === 100
      ? 'complete'
      : overallPercent > 0
        ? 'partial'
        : 'missing';

  // ── Sub-check totals ────────────────────────────────────────────
  const totalSubChecks = components.reduce((sum, c) => sum + c.subChecks.length, 0);
  const passedSubChecks = components.reduce(
    (sum, c) => sum + c.subChecks.filter(sc => sc.status === 'complete').length, 0
  );
  const missingSubChecks = components.reduce(
    (sum, c) => sum + c.subChecks.filter(sc => sc.status === 'missing').length, 0
  );

  const handleNavigate = useCallback((panel: PanelId) => {
    setActivePanel(panel);
  }, [setActivePanel]);

  // Feature flag guard — after all hooks, before JSX
  if (!isEnabled('bsnpCompliance')) return null;

  // ── Check if completely empty (no content entered at all) ──────
  const hasAnyContent =
    cp.capaianFase ||
    tp.length > 0 ||
    materi.blok.length > 0 ||
    modules.length > 0 ||
    kuis.length > 0 ||
    games.length > 0 ||
    alur.length > 0 ||
    pages.length > 0;

  return (
    <div className="bg-app-surface/60 border border-app-border/60 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-app-accent" />
        <h2 className="text-xs font-semibold text-app-secondary">Kepatuhan BSNP</h2>
        <span className="text-[0.55rem] text-app-muted ml-auto">
          8 komponen wajib MPI
        </span>
      </div>

      {/* Empty state — show when no content exists */}
      {!hasAnyContent ? (
        <div className="text-center py-8 px-4 bg-app-elevated/20 border border-dashed border-app-border/50 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-app-accent/10 flex items-center justify-center mx-auto mb-3">
            <FileCheck size={24} className="text-app-accent/70" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Isi dokumen terlebih dahulu</p>
          <p className="text-xs text-app-muted mb-4">Isi dokumen terlebih dahulu untuk melihat kepatuhan BSNP.</p>
          <button
            onClick={() => setActivePanel('dokumen')}
            className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
          >
            Mulai Isi Dokumen
          </button>
        </div>
      ) : (
        <>

      {/* Overall Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.6rem] text-app-muted">
            {passedSubChecks}/{totalSubChecks} pemeriksaan lulus
          </span>
          <span className="text-[0.6rem] font-bold" style={{ color: overallStatus === 'complete' ? COLORS.success : overallStatus === 'partial' ? COLORS.warning : COLORS.error }}>
            {overallPercent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-app-elevated/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${overallPercent}%`,
              background: `linear-gradient(90deg, ${COLORS.success}, ${COLORS.amber})`,
              boxShadow: overallPercent > 0 ? `0 0 8px ${COLORS.success}40` : 'none',
            }}
          />
        </div>
      </div>

      {/* Ring + Quick Stats */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ComplianceRing percentage={overallPercent} status={overallStatus} />

        <div className="flex-1 grid grid-cols-3 gap-2 w-full text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
            <div className="text-lg font-bold text-emerald-400">{passedSubChecks}</div>
            <div className="text-[0.5rem] text-emerald-400/60 font-medium">LULUS</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
            <div className="text-lg font-bold text-amber-400">{totalSubChecks - passedSubChecks - missingSubChecks}</div>
            <div className="text-[0.5rem] text-amber-400/60 font-medium">SEBAGIAN</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <div className="text-lg font-bold text-red-400">{missingSubChecks}</div>
            <div className="text-[0.5rem] text-red-400/60 font-medium">BELUM</div>
          </div>
        </div>
      </div>

      {/* Component Cards */}
      <div className="space-y-1.5">
        {components.map((comp) => (
          <ComponentCard key={comp.key} comp={comp} onNavigate={handleNavigate} />
        ))}
      </div>

      {/* Footer */}
      {overallPercent < 100 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
          <p className="text-[0.55rem] text-amber-400/80">
            Lengkapi semua komponen untuk memenuhi standar BSNP. Klik komponen untuk detail dan saran perbaikan.
          </p>
        </div>
      )}
      {overallPercent === 100 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
          <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
          <p className="text-[0.55rem] text-emerald-400/80 font-medium">
            Semua komponen BSNP telah lengkap! Media Pembelajaran Interaktif siap digunakan.
          </p>
        </div>
      )}
      </>
      )}
    </div>
  );
}
