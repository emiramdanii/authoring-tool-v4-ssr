'use client';

import React, { useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring/types';
import { useProjectManager } from '@/hooks/use-project-manager';
import {
  ChevronDown, Target, Calendar, ClipboardList, HelpCircle, Puzzle, Gamepad2, FileEdit, Zap,
  Rocket, FileText, Sparkles, Pencil, Play, Layers, ArrowRight, Plus,
  Users, ScrollText, Scale, Smartphone, Palette, Monitor, Layout, BarChart3,
  BookOpen, GraduationCap, Download, FolderOpen, Upload, Wand2, Save, Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import BsnpCompliancePanel from './BsnpCompliancePanel';
import { useCanvaStore } from '@/store/canva-store';
import { COLORS } from '@/lib/color-palette';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import dynamic from 'next/dynamic';

// Lazy-load TemplateWizard — it's a modal that's not always visible
const TemplateWizard = dynamic(() => import('@/components/canva/TemplateWizard'), { ssr: false });

// Schema-driven presets use this path for beautiful rendering
const SCHEMA_DRIVEN_PRESETS = new Set([
  'hakikat-norma', 'macam-norma', 'perilaku-patuh', 'nilai-pancasila',
  'bhinneka-tunggal-ika', 'ham-hak-kewajiban', 'demokrasi-pancasila',
  'globalisasi', 'misi-penjelajah-pancasila',
  'sistem-pernapasan', 'persamaan-linear',
  'gerak-dasar-lokomotor', 'permainan-bola-besar', 'kebugaran-jasmani',
]);

// ── Adaptive "Langkah Selanjutnya" logic ─────────────────────────
interface NextStep {
  step: string;
  action: () => void;
  icon: React.ReactNode;
}

function getNextStep(
  meta: { judulPertemuan: string },
  tp: unknown[],
  kuis: unknown[],
  modules: unknown[],
  games: unknown[],
  pagesLength: number,
  setActivePanel: (panel: PanelId) => void,
): NextStep {
  if (!meta.judulPertemuan) {
    return { step: 'Isi judul pertemuan di panel Dokumen', action: () => setActivePanel('dokumen'), icon: <FileText size={16} /> };
  }
  if (tp.length === 0) {
    return { step: 'Tambahkan Tujuan Pembelajaran (TP)', action: () => setActivePanel('konten'), icon: <Target size={16} /> };
  }
  if (kuis.length === 0 && modules.length === 0 && games.length === 0) {
    return { step: 'Buat konten interaktif — kuis, game, atau modul', action: () => setActivePanel('konten'), icon: <Gamepad2 size={16} /> };
  }
  if (pagesLength <= 1) {
    return { step: 'Tambahkan lebih banyak halaman di Canva', action: () => setActivePanel('canva'), icon: <Layers size={16} /> };
  }
  return { step: 'Preview media pembelajaran Anda!', action: () => setActivePanel('preview'), icon: <Play size={16} /> };
}

export default function Dashboard() {
  const [wizardOpen, setWizardOpen] = useState(false);
  // ── Styled confirm dialog state ──
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, onConfirm });
  };
  const meta = useAuthoringStore((s) => s.meta);
  const cp = useAuthoringStore((s) => s.cp);
  const tp = useAuthoringStore((s) => s.tp);
  const atp = useAuthoringStore((s) => s.atp);
  const alur = useAuthoringStore((s) => s.alur);
  const kuis = useAuthoringStore((s) => s.kuis);
  const modules = useAuthoringStore((s) => s.modules);
  const games = useAuthoringStore((s) => s.games);
  const materi = useAuthoringStore((s) => s.materi);
  const activePreset = useAuthoringStore((s) => s.activePreset);
  const calcCompleteness = useAuthoringStore((s) => s.calcCompleteness);
  const applyFullPreset = useAuthoringStore((s) => s.applyFullPreset);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const newProject = useAuthoringStore((s) => s.newProject);
  const saveToStorage = useAuthoringStore((s) => s.saveToStorage);
  const { saveProject, currentProjectId } = useProjectManager();
  const { isSederhana } = useTeacherMode();

  // Get canva pages length for adaptive guidance
  const pagesLength = useCanvaStore((s) => s.pages.length);

  const completeness = calcCompleteness();
  const isPresetMode = activePreset !== null;
  const hasData = meta.judulPertemuan || tp.length > 0 || kuis.length > 0;

  // Compute next step for adaptive guidance
  const nextStep = React.useMemo(
    () => getNextStep(meta, tp, kuis, modules, games, pagesLength, setActivePanel),
    [meta, tp, kuis, modules, games, pagesLength, setActivePanel],
  );

  const presetLabels: Record<string, string> = {
    'hakikat-norma': 'Bab 3 P1: Hakikat Norma',
    'macam-norma': 'Bab 3 P2: Macam Norma',
    'perilaku-patuh': 'Bab 3 P3: Perilaku Patuh',
    'nilai-pancasila': 'Bab 3 P4: Nilai Pancasila',
    'bhinneka-tunggal-ika': 'Bab 3 P5: Bhinneka Tunggal Ika',
    'ham-hak-kewajiban': 'Bab 3 P6: HAM & Kewajiban',
    'demokrasi-pancasila': 'Bab 3 P7: Demokrasi Pancasila',
    'globalisasi': 'Bab 3 P8: Globalisasi',
    'misi-penjelajah-pancasila': 'Bab 3 P9: Misi Penjelajah',
    'sistem-pernapasan': 'IPA: Sistem Pernapasan',
    'persamaan-linear': 'MTK: Persamaan Linear',
    'gerak-dasar-lokomotor': 'PJOK: Gerak Dasar Lokomotor',
    'permainan-bola-besar': 'PJOK: Permainan Bola Besar',
    'kebugaran-jasmani': 'PJOK: Kebugaran Jasmani',
  };

  // ── Export JSON ────────────────────────────────────────────────
  const exportJSON = () => {
    const s = useAuthoringStore.getState();
    const data = {
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      skenario: s.skenario, kuis: s.kuis, modules: s.modules,
      games: s.games, materi: s.materi,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-pembelajaran-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Template click handler ─────────────────────────────────────
  const applyTemplate = (pKey: string) => {
    if (SCHEMA_DRIVEN_PRESETS.has(pKey)) {
      applyFullPreset(pKey);
      setTimeout(async () => {
        await useCanvaStore.getState().loadSchemaPreset(pKey);
        setActivePanel('canva');
      }, 100);
    } else if (pKey === 'blank') {
      useAuthoringStore.getState().newProject();
      setTimeout(() => {
        useCanvaStore.getState().resetCanvas();
        setActivePanel('canva');
      }, 100);
    } else {
      applyFullPreset(pKey);
      setTimeout(() => {
        useCanvaStore.getState().resetCanvas();
        setActivePanel('canva');
      }, 300);
    }
  };

  const handleTemplateClick = (pKey: string) => {
    if (hasData) {
      showConfirm(
        'Timpa Data?',
        'Template akan menimpa data saat ini. Lanjutkan?',
        () => applyTemplate(pKey),
      );
      return;
    }
    applyTemplate(pKey);
  };

  // ── Template data with lucide icons ────────────────────────────
  const templates = [
    // PPKn
    { key: 'hakikat-norma', icon: Users, label: 'Hakikat Norma', sub: 'PPKn VII · Bab 3 P1', color: 'amber' },
    { key: 'macam-norma', icon: ScrollText, label: 'Macam Norma', sub: 'PPKn VII · Bab 3 P2', color: 'cyan' },
    { key: 'perilaku-patuh', icon: Scale, label: 'Perilaku Patuh', sub: 'PPKn VII · Bab 3 P3', color: 'emerald' },
    { key: 'nilai-pancasila', icon: BookOpen, label: 'Nilai Pancasila', sub: 'PPKn VII · Bab 3 P4', color: 'amber' },
    { key: 'bhinneka-tunggal-ika', icon: Users, label: 'Bhinneka Tunggal Ika', sub: 'PPKn VII · Bab 3 P5', color: 'cyan' },
    { key: 'ham-hak-kewajiban', icon: Scale, label: 'HAM & Kewajiban', sub: 'PPKn VII · Bab 3 P6', color: 'emerald' },
    { key: 'demokrasi-pancasila', icon: ScrollText, label: 'Demokrasi Pancasila', sub: 'PPKn VII · Bab 3 P7', color: 'amber' },
    { key: 'globalisasi', icon: GraduationCap, label: 'Globalisasi', sub: 'PPKn VII · Bab 3 P8', color: 'cyan' },
    { key: 'misi-penjelajah-pancasila', icon: Rocket, label: 'Misi Penjelajah', sub: 'PPKn VII · Bab 3 P9', color: 'emerald' },
    // IPA
    { key: 'sistem-pernapasan', icon: BookOpen, label: 'Sistem Pernapasan', sub: 'IPA VIII', color: 'cyan' },
    // MTK
    { key: 'persamaan-linear', icon: ScrollText, label: 'Persamaan Linear', sub: 'MTK VIII', color: 'amber' },
    // PJOK
    { key: 'gerak-dasar-lokomotor', icon: Rocket, label: 'Gerak Dasar Lokomotor', sub: 'PJOK VII', color: 'emerald' },
    { key: 'permainan-bola-besar', icon: GraduationCap, label: 'Permainan Bola Besar', sub: 'PJOK VII', color: 'cyan' },
    { key: 'kebugaran-jasmani', icon: Users, label: 'Kebugaran Jasmani', sub: 'PJOK VII', color: 'amber' },
    // Blank
    { key: 'blank', icon: ClipboardList, label: 'Proyek Kosong', sub: 'Isi semua manual', color: 'slate' },
  ];

  const colorMap: Record<string, string> = {
    amber: 'hover:border-app-accent/40 hover:bg-app-accent/5',
    cyan: 'hover:border-cyan-500/40 hover:bg-cyan-500/5',
    emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
    slate: 'hover:border-app-border/40 hover:bg-app-elevated/5',
  };
  const activeColorMap: Record<string, string> = {
    amber: 'border-app-accent/50 bg-app-accent/10 ring-1 ring-app-accent/20',
    cyan: 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20',
    emerald: 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20',
    slate: 'border-app-border/50 bg-app-elevated/10 ring-1 ring-app-border/20',
  };
  const iconColorMap: Record<string, string> = {
    amber: 'text-app-accent bg-app-accent/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    slate: 'text-app-muted bg-app-elevated/30',
  };

  // ── Flow Steps (mode-aware labels) ──────────────────────────
  const flowSteps = [
    { num: 1, label: 'Pilih Template', icon: Layout, active: true },
    { num: 2, label: isSederhana ? 'Isi RPP' : 'Isi Dokumen', icon: FileEdit, active: completeness >= 10 },
    { num: 3, label: 'Tambah Materi', icon: Puzzle, active: completeness >= 40 },
    { num: 4, label: isSederhana ? 'Desain Visual' : 'Desain Canva', icon: Palette, active: completeness >= 60 },
    { num: 5, label: isSederhana ? 'Pratinjau' : 'Preview & Export', icon: Play, active: completeness >= 80 },
  ];

  const currentStep = flowSteps.findIndex((s) => !s.active);

  // ── Quick actions data ─────────────────────────────────────────
  const quickActions = isSederhana
    ? [
        // Sederhana: only 3 most essential actions
        {
          label: 'Isi RPP',
          desc: 'Identitas, Capaian, Tujuan Pembelajaran',
          icon: FileEdit,
          color: 'app-accent',
          action: () => setActivePanel('dokumen'),
        },
        {
          label: 'Tambah Materi',
          desc: 'Materi, game, kuis',
          icon: Puzzle,
          color: 'cyan-500',
          action: () => setActivePanel('konten'),
        },
        {
          label: 'Lihat Hasil',
          desc: 'Pratinjau tampilan siswa',
          icon: Smartphone,
          color: 'emerald-500',
          action: () => setActivePanel('preview'),
        },
      ]
    : [
        // Lengkap: full set of quick actions
        {
          label: 'Isi Dokumen',
          desc: 'CP, TP, ATP, Alur Pembelajaran',
          icon: FileEdit,
          color: 'app-accent',
          action: () => setActivePanel('dokumen'),
        },
        {
          label: 'Tambah Konten',
          desc: 'Kuis, modul interaktif, materi',
          icon: Puzzle,
          color: 'cyan-500',
          action: () => setActivePanel('konten'),
        },
        {
          label: 'Preview Siswa',
          desc: 'Lihat tampilan lengkap siswa',
          icon: Smartphone,
          color: 'emerald-500',
          action: () => setActivePanel('preview'),
        },
        {
          label: 'Desain Canva',
          desc: 'Layout & visual slide',
          icon: Palette,
          color: 'purple-500',
          action: () => {
            const currentPreset = useAuthoringStore.getState().activePreset;
            if (SCHEMA_DRIVEN_PRESETS.has(currentPreset || '')) {
              setActivePanel('canva');
            } else {
              useCanvaStore.getState().resetCanvas();
              setActivePanel('canva');
            }
          },
        },
      ];

  // ── Helper for quick action color classes ──────────────────────
  const getActionColorClasses = (color: string) => {
    const map: Record<string, { icon: string; hoverBorder: string; hoverBg: string }> = {
      'app-accent': {
        icon: 'text-app-accent bg-app-accent/10',
        hoverBorder: 'hover:border-app-accent/20',
        hoverBg: 'hover:bg-app-elevated/30',
      },
      'cyan-500': {
        icon: 'text-cyan-400 bg-cyan-500/10',
        hoverBorder: 'hover:border-cyan-500/20',
        hoverBg: 'hover:bg-app-elevated/30',
      },
      'emerald-500': {
        icon: 'text-emerald-400 bg-emerald-500/10',
        hoverBorder: 'hover:border-emerald-500/20',
        hoverBg: 'hover:bg-app-elevated/30',
      },
      'purple-500': {
        icon: 'text-purple-400 bg-purple-500/10',
        hoverBorder: 'hover:border-purple-500/20',
        hoverBg: 'hover:bg-app-elevated/30',
      },
    };
    return map[color] || map['app-accent'];
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl page-transition">
      {/* ══ HEADER ════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-app-primary tracking-tight">{isSederhana ? 'Beranda' : 'Dashboard'}</h1>
          <p className="text-sm text-app-secondary mt-1">Buat media pembelajaran interaktif dalam 5 langkah.</p>
        </div>
        {isPresetMode && (
          <button
            onClick={() => {
              if (currentProjectId) { saveProject(); } else { saveToStorage(); }
              useAuthoringStore.setState({ activePreset: null });
            }}
            className="flex-shrink-0 px-3 py-1.5 bg-app-success/10 border border-app-success/20 text-app-success text-xs font-medium rounded-lg hover:bg-app-success/15 transition-colors"
          >
            Simpan sebagai Proyek
          </button>
        )}
      </div>

      {/* ══ STATUS BAR ════════════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
          isPresetMode
            ? 'bg-app-accent/10 border border-app-accent/15 text-app-accent'
            : hasData
              ? 'bg-app-success/10 border border-app-success/15 text-app-success'
              : 'bg-app-elevated/30 border border-app-border text-app-muted'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isPresetMode ? `Preset: ${presetLabels[activePreset || ''] || activePreset}` : hasData ? 'Proyek Aktif' : 'Belum Ada Proyek'}
        </div>
        {hasData && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-1.5 bg-app-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completeness}%`,
                  background: completeness === 100 ? COLORS.success : completeness >= 60 ? COLORS.warning : COLORS.error,
                }}
              />
            </div>
            <span className="text-[0.7rem] text-app-muted tabular-nums">{completeness}%</span>
          </div>
        )}
      </div>

      {/* ══ EMPTY STATE HERO (consolidated with template selection) ══ */}
      {!hasData && (
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden">
          {/* Hero top — mode-aware messaging */}
          <div className="text-center pt-10 pb-8 px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-app-accent/10 mb-5">
              <Rocket className="h-7 w-7 text-app-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-1.5 text-app-primary">
              {isSederhana ? 'Buat Media Pembelajaran' : 'Mulai dari mana?'}
            </h2>
            <p className="text-sm text-app-secondary max-w-md mx-auto">
              {isSederhana
                ? 'Pilih template siap pakai atau buat dari nol. Semua langkah mudah!'
                : 'Pilih template siap pakai, generate otomatis, atau buat manual dari nol.'
              }
            </p>
          </div>

          {/* Quick-start buttons row — sederhana: 2 options, lengkap: 3 options */}
          <div className={`grid gap-3 px-6 pb-6 ${isSederhana ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <button
              onClick={() => setWizardOpen(true)}
              className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-app-border bg-app-elevated/30 hover:border-app-accent/30 hover:bg-app-accent/5 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-app-accent/10 flex items-center justify-center group-hover:bg-app-accent/15 transition-colors">
                <FileText className="h-5 w-5 text-app-accent" />
              </div>
              <span className="text-sm font-medium text-app-primary">{isSederhana ? 'Template Siap Pakai' : 'Dari Template'}</span>
              <span className="text-xs text-app-muted">{isSederhana ? 'Pilih & langsung edit' : 'Template siap pakai'}</span>
            </button>
            <button
              onClick={() => setActivePanel('autogen')}
              className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-app-border bg-app-elevated/30 hover:border-purple-500/30 hover:bg-purple-500/5 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/15 transition-colors">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-app-primary">{isSederhana ? 'Buat dengan AI' : 'Auto-Generate'}</span>
              <span className="text-xs text-app-muted">AI buatkan untuk Anda</span>
            </button>
            {!isSederhana && (
              <button
                onClick={() => {
                  useCanvaStore.getState().resetCanvas();
                  setActivePanel('canva');
                }}
                className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-app-border bg-app-elevated/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/15 transition-colors">
                  <Pencil className="h-5 w-5 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-app-primary">Manual</span>
                <span className="text-xs text-app-muted">Buat dari nol</span>
              </button>
            )}
          </div>

          {/* Template cards (inline in hero for empty state) */}
          <div className="border-t border-app-border px-6 py-5">
            <h3 className="text-xs font-semibold text-app-secondary uppercase tracking-wider mb-3">Template Pembelajaran</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {templates.map((p) => {
                const Icon = p.icon;
                const isCurrentPreset = isPresetMode && activePreset === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleTemplateClick(p.key)}
                    className={`rounded-xl p-4 text-center transition-colors cursor-pointer border ${
                      isCurrentPreset
                        ? activeColorMap[p.color]
                        : `border-app-border bg-app-elevated/20 ${colorMap[p.color]}`
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg mx-auto mb-2.5 flex items-center justify-center ${iconColorMap[p.color]}`}>
                      <Icon size={18} />
                    </div>
                    <div className="text-xs font-medium text-app-primary">{p.label}</div>
                    <div className="text-[0.65rem] text-app-muted mt-0.5">{p.sub}</div>
                    {SCHEMA_DRIVEN_PRESETS.has(p.key) && !isSederhana && (
                      <div className="text-[0.6rem] text-app-accent/70 font-medium mt-1.5 flex items-center justify-center gap-0.5"><Zap size={9} /> Schema</div>
                    )}
                    {SCHEMA_DRIVEN_PRESETS.has(p.key) && isSederhana && (
                      <div className="text-[0.6rem] text-app-accent/70 font-medium mt-1.5 flex items-center justify-center gap-0.5"><Zap size={9} /> Siap Pakai</div>
                    )}
                    {isCurrentPreset && (
                      <div className="text-[0.6rem] text-app-accent font-medium mt-1.5">AKTIF</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ ADAPTIVE "LANGKAH SELANJUTNYA" CARD ═════════════════ */}
      {hasData && (
        <div className="bg-app-info/5 border border-app-info/15 rounded-xl p-4 flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-app-info/10 flex items-center justify-center text-app-info">
            {nextStep.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-app-primary text-sm">Langkah Selanjutnya</p>
            <p className="text-xs text-app-secondary truncate">{nextStep.step}</p>
          </div>
          <button
            onClick={nextStep.action}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-app-info text-white text-xs font-medium rounded-lg hover:bg-app-info/90 transition-colors"
          >
            Mulai <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* ══ TEMPLATE SELECTION (when hasData) ════════════════════ */}
      {hasData && (
        <div id="template-section">
          <h2 className="text-sm font-medium text-app-primary mb-1">Template</h2>
          <p className="text-xs text-app-muted mb-3">Pilih preset atau mulai dari proyek kosong.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {templates.map((p) => {
              const Icon = p.icon;
              const isCurrentPreset = isPresetMode && activePreset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => handleTemplateClick(p.key)}
                  className={`rounded-xl p-4 text-center transition-colors cursor-pointer border ${
                    isCurrentPreset
                      ? activeColorMap[p.color]
                      : `border-app-border bg-app-elevated/20 ${colorMap[p.color]}`
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg mx-auto mb-2.5 flex items-center justify-center ${iconColorMap[p.color]}`}>
                    <Icon size={18} />
                  </div>
                  <div className="text-xs font-medium text-app-primary">{p.label}</div>
                  <div className="text-[0.65rem] text-app-muted mt-0.5">{p.sub}</div>
                  {SCHEMA_DRIVEN_PRESETS.has(p.key) && !isSederhana && (
                    <div className="text-[0.6rem] text-app-accent/70 font-medium mt-1.5 flex items-center justify-center gap-0.5"><Zap size={9} /> Schema</div>
                  )}
                  {SCHEMA_DRIVEN_PRESETS.has(p.key) && isSederhana && (
                    <div className="text-[0.6rem] text-app-accent/70 font-medium mt-1.5 flex items-center justify-center gap-0.5"><Zap size={9} /> Siap Pakai</div>
                  )}
                  {isCurrentPreset && (
                    <div className="text-[0.6rem] text-app-accent font-medium mt-1.5">AKTIF</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ FLOW PROGRESS — Clean horizontal stepper (sederhana: simpler labels) ═════════════ */}
      <div className="bg-app-surface border border-app-border rounded-xl p-5">
        <h2 className="text-sm font-medium text-app-primary mb-5">{isSederhana ? 'Langkah-Langkah' : 'Alur Kerja'}</h2>
        <div className="flex items-start">
          {flowSteps.map((step, i) => {
            const isActive = step.active;
            const isCurrent = i === Math.max(0, currentStep);
            const StepIcon = step.icon;
            return (
              <div key={step.num} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {i > 0 && (
                  <div className={`absolute top-4 right-1/2 left-[-50%] h-[1.5px] ${
                    step.active ? 'bg-app-accent/30' : 'bg-app-elevated/40'
                  }`} />
                )}
                {/* Step circle */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-app-accent/15 text-app-accent border border-app-accent/30'
                    : 'bg-app-elevated/50 text-app-muted border border-app-border/40'
                } ${isCurrent ? 'ring-2 ring-app-accent/25 ring-offset-1 ring-offset-app-surface' : ''}`}>
                  {isActive ? <Check size={14} strokeWidth={2.5} /> : <StepIcon size={14} />}
                </div>
                {/* Label */}
                <div className="mt-2.5 text-center">
                  <div className={`text-[0.7rem] font-medium ${isActive ? 'text-app-primary' : 'text-app-muted'}`}>
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ BSNP COMPLIANCE — only in lengkap (advanced) mode ══ */}
      {!isSederhana && <BsnpCompliancePanel />}

      {/* ══ QUICK ACTIONS ════════════════════════════════════════ */}
      <div>
        <h2 className="text-sm font-medium text-app-primary mb-3">{isSederhana ? 'Mulai dari sini' : 'Aksi Cepat'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const colorClasses = getActionColorClasses(action.color);
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.action}
                className={`flex items-center gap-3.5 bg-app-surface border border-app-border rounded-xl p-3.5 ${colorClasses!.hoverBorder} ${colorClasses!.hoverBg} transition-colors cursor-pointer text-left`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses!.icon}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-app-primary">{action.label}</div>
                  <div className="text-xs text-app-muted">{action.desc}</div>
                </div>
              </button>
            );
          })}
          {/* Schema Preview — only in preset mode */}
          {isPresetMode && (
            <button
              onClick={() => setActivePanel('preview')}
              className="flex items-center gap-3.5 bg-fuchsia-500/5 border border-fuchsia-500/15 rounded-xl p-3.5 hover:border-fuchsia-500/25 hover:bg-fuchsia-500/8 transition-colors cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 flex-shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-app-primary">{isSederhana ? 'Pratinjau Interaktif' : 'Schema Preview'}</div>
                <div className="text-xs text-app-muted">{isSederhana ? 'Lihat tampilan media pembelajaran' : 'JSON-driven rendering + 7 tema'}</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ══ Kelenkapan (collapsible — compact stats) — only in lengkap mode ══ */}
      {hasData && !isSederhana && (
        <details className="group bg-app-surface border border-app-border rounded-xl">
          <summary className="px-4 py-2.5 cursor-pointer flex items-center justify-between text-sm font-medium text-app-secondary hover:text-app-primary transition-colors">
            <span>Statistik Proyek</span>
            <span className="text-app-muted group-open:rotate-180 transition-transform"><ChevronDown size={14} /></span>
          </summary>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                { label: 'TP', val: tp.length, icon: <Target size={13} />, color: 'text-app-accent' },
                { label: 'ATP', val: atp.pertemuan.length, icon: <Calendar size={13} />, color: 'text-cyan-400' },
                { label: 'Alur', val: alur.length, icon: <ClipboardList size={13} />, color: 'text-purple-400' },
                { label: 'Kuis', val: kuis.length, icon: <HelpCircle size={13} />, color: 'text-emerald-400' },
                { label: 'Modul', val: modules.length, icon: <Puzzle size={13} />, color: 'text-purple-400' },
                { label: 'Game', val: games.length, icon: <Gamepad2 size={13} />, color: 'text-orange-400' },
                { label: 'Materi', val: materi.blok.length, icon: <FileEdit size={13} />, color: 'text-sky-400' },
              ].map((s) => (
                <div key={s.label} className="bg-app-elevated/20 rounded-lg p-2.5 text-center">
                  <div className={`mb-1 flex justify-center ${s.color}`}>{s.icon}</div>
                  <div className={`text-sm font-semibold ${s.color}`}>{s.val}</div>
                  <div className="text-[0.6rem] text-app-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* ══ BOTTOM TOOLBAR — Sederhana: only 2 primary actions; Lengkap: full toolbar ══ */}
      <div className="flex items-center gap-2 pt-4 border-t border-app-border">
        {/* Primary actions */}
        <button
          onClick={() => setActivePanel('dokumen')}
          className="px-3 py-1.5 text-xs text-white bg-app-success hover:bg-app-success/90 rounded-lg font-medium transition-colors flex items-center gap-1.5"
        >
          <Plus size={12} />
          {isSederhana ? 'Isi RPP' : 'Buat Baru'}
        </button>
        <button
          onClick={() => setActivePanel('autogen')}
          className="px-3 py-1.5 text-xs text-app-accent hover:text-app-accent/80 bg-app-accent/5 hover:bg-app-accent/10 rounded-lg border border-app-accent/15 transition-colors flex items-center gap-1.5"
        >
          <Wand2 size={12} />
          {isSederhana ? 'Buat AI' : 'Auto-Generate'}
        </button>

        {/* Secondary — only in lengkap mode */}
        {!isSederhana && (
          <>
            <div className="w-px h-5 bg-app-border mx-1" />

            <button
              onClick={() => {
                if (hasData) {
                  showConfirm(
                    'Buat Proyek Baru?',
                    'Data yang belum disimpan akan hilang.',
                    () => newProject(),
                  );
                } else {
                  newProject();
                }
              }}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-elevated/50 rounded-lg transition-colors"
              title="Proyek Baru"
            >
              <FileText size={15} />
            </button>
            <button
              onClick={() => setActivePanel('projects')}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-elevated/50 rounded-lg transition-colors"
              title="Buka Proyek"
            >
              <FolderOpen size={15} />
            </button>
            <button
              onClick={() => setActivePanel('import')}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-elevated/50 rounded-lg transition-colors"
              title="Import"
            >
              <Upload size={15} />
            </button>
            <button
              onClick={exportJSON}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-elevated/50 rounded-lg transition-colors"
              title="Export JSON"
            >
              <Download size={15} />
            </button>
          </>
        )}

        <div className="flex-1" />

        {/* Save — always visible */}
        <button
          onClick={() => currentProjectId ? saveProject() : saveToStorage()}
          className="px-3 py-1.5 text-xs text-app-secondary hover:text-app-primary hover:bg-app-elevated/50 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Save size={13} />
          Simpan
        </button>
      </div>

      {/* Template Wizard Modal */}
      <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Styled Confirm Dialog — replaces native confirm() */}
      <Dialog open={confirmState.open} onOpenChange={(v) => !v && setConfirmState(s => ({ ...s, open: false }))}>
        <DialogContent className="sm:max-w-sm bg-app-surface border-app-border">
          <DialogHeader>
            <DialogTitle className="text-app-primary">{confirmState.title}</DialogTitle>
            <DialogDescription className="text-app-secondary">{confirmState.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmState(s => ({ ...s, open: false }))}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                confirmState.onConfirm();
                setConfirmState({ open: false, title: '', message: '', onConfirm: () => {} });
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
            >
              Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
