'use client';

import React, { useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring/types';
import { useProjectManager } from '@/hooks/use-project-manager';
import {
  Target, Calendar, ClipboardList, HelpCircle, Puzzle, Gamepad2, FileEdit, Zap,
  Rocket, FileText, Sparkles, Pencil, Play, Layers, ArrowRight, Plus,
  Users, ScrollText, Scale, Smartphone, Palette, Monitor, Layout, BarChart3,
  BookOpen, GraduationCap, Download, FolderOpen, Upload, Wand2, Save, Check,
  LayoutDashboard, PieChart, Settings, LifeBuoy, ChevronLeft,
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
import { useSchemaKuisProjection, useSchemaModulesProjection } from '@/hooks/use-schema-projection';
import { deriveExportPayloadFromSchema } from '@/core/schema/export-projection';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  // Phase 5: Content data from schema (single source of truth)
  const kuis = useSchemaKuisProjection();
  const modules = useSchemaModulesProjection();
  const games = modules; // Game = Module (same type, filtered elsewhere)
  // materi completeness derived from schema pages
  const pages = useCanvaStore((s) => s.pages);
  const materiBloks = React.useMemo(() => {
    let count = 0;
    for (const page of pages) {
      if (page.schema?.blocks) {
        for (const block of page.schema.blocks) {
          if (block.type === 'materi-section') {
            const content = (block as any).content || [];
            count += content.filter((b: any) => b.type === 'materi-blok').length;
          }
        }
      }
    }
    return count;
  }, [pages]);
  const activePreset = useAuthoringStore((s) => s.activePreset);
  const calcCompleteness = useAuthoringStore((s) => s.calcCompleteness);
  const applyFullPreset = useAuthoringStore((s) => s.applyFullPreset);
  // Phase 3: setActivePanel migrated → panelRequest
  const setActivePanel = (_panel: string) => useCanvaStore.setState({ panelRequest: _panel });
  const newProject = useAuthoringStore((s) => s.newProject);
  const saveToStorage = useAuthoringStore((s) => s.saveToStorage);
  const { saveProject, currentProjectId } = useProjectManager();
  const { isSederhana } = useTeacherMode();

  // Get canva pages length for adaptive guidance
  const pagesLength = useCanvaStore((s) => s.pages.length);

  const completeness = calcCompleteness(); // Phase 5: still uses authoring store internally — will be migrated later
  const isPresetMode = activePreset !== null;
  const hasData = meta.judulPertemuan || tp.length > 0 || kuis.length > 0 || materiBloks > 0;

  // Compute next step for adaptive guidance
  const nextStep = React.useMemo(
    () => getNextStep(meta, tp, kuis, modules, games, pagesLength, setActivePanel),
    [meta, tp, kuis, modules, games, pagesLength, setActivePanel],
  );

  // ── Active sidebar nav ──
  const [activeNav, setActiveNav] = useState('dashboard');

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
    const canvaState = useCanvaStore.getState();
    // Phase 5: Content data derived from schema (single source of truth)
    const schemaPayload = deriveExportPayloadFromSchema(canvaState.pages);
    const data = {
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      ...schemaPayload,
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
    { key: 'hakikat-norma', icon: Users, label: 'Hakikat Norma', sub: 'PPKn VII · Bab 3 P1', color: 'emerald' },
    { key: 'macam-norma', icon: ScrollText, label: 'Macam Norma', sub: 'PPKn VII · Bab 3 P2', color: 'blue' },
    { key: 'perilaku-patuh', icon: Scale, label: 'Perilaku Patuh', sub: 'PPKn VII · Bab 3 P3', color: 'emerald' },
    { key: 'nilai-pancasila', icon: BookOpen, label: 'Nilai Pancasila', sub: 'PPKn VII · Bab 3 P4', color: 'amber' },
    { key: 'bhinneka-tunggal-ika', icon: Users, label: 'Bhinneka Tunggal Ika', sub: 'PPKn VII · Bab 3 P5', color: 'blue' },
    { key: 'ham-hak-kewajiban', icon: Scale, label: 'HAM & Kewajiban', sub: 'PPKn VII · Bab 3 P6', color: 'emerald' },
    { key: 'demokrasi-pancasila', icon: ScrollText, label: 'Demokrasi Pancasila', sub: 'PPKn VII · Bab 3 P7', color: 'amber' },
    { key: 'globalisasi', icon: GraduationCap, label: 'Globalisasi', sub: 'PPKn VII · Bab 3 P8', color: 'blue' },
    { key: 'misi-penjelajah-pancasila', icon: Rocket, label: 'Misi Penjelajah', sub: 'PPKn VII · Bab 3 P9', color: 'emerald' },
    // IPA
    { key: 'sistem-pernapasan', icon: BookOpen, label: 'Sistem Pernapasan', sub: 'IPA VIII', color: 'blue' },
    // MTK
    { key: 'persamaan-linear', icon: ScrollText, label: 'Persamaan Linear', sub: 'MTK VIII', color: 'amber' },
    // PJOK
    { key: 'gerak-dasar-lokomotor', icon: Rocket, label: 'Gerak Dasar Lokomotor', sub: 'PJOK VII', color: 'emerald' },
    { key: 'permainan-bola-besar', icon: GraduationCap, label: 'Permainan Bola Besar', sub: 'PJOK VII', color: 'blue' },
    { key: 'kebugaran-jasmani', icon: Users, label: 'Kebugaran Jasmani', sub: 'PJOK VII', color: 'amber' },
    // Blank
    { key: 'blank', icon: ClipboardList, label: 'Proyek Kosong', sub: 'Isi semua manual', color: 'slate' },
  ];

  const colorMap: Record<string, string> = {
    amber: 'hover:border-[#e29100]/30 hover:bg-[#e29100]/5',
    blue: 'hover:border-[#0058be]/30 hover:bg-[#0058be]/5',
    emerald: 'hover:border-[#006c49]/30 hover:bg-[#006c49]/5',
    slate: 'hover:border-app-border/40 hover:bg-app-elevated/5',
  };
  const activeColorMap: Record<string, string> = {
    amber: 'border-[#e29100]/50 bg-[#e29100]/10 ring-1 ring-[#e29100]/20',
    blue: 'border-[#0058be]/50 bg-[#0058be]/10 ring-1 ring-[#0058be]/20',
    emerald: 'border-[#006c49]/50 bg-[#006c49]/10 ring-1 ring-[#006c49]/20',
    slate: 'border-app-border/50 bg-app-elevated/10 ring-1 ring-app-border/20',
  };
  const iconColorMap: Record<string, string> = {
    amber: 'text-[#e29100] bg-[#e29100]/10',
    blue: 'text-[#0058be] bg-[#0058be]/10',
    emerald: 'text-[#006c49] bg-[#006c49]/10',
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

  // ── Sidebar navigation items ──
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, panel: null as PanelId | null },
    { id: 'workspace', label: 'Workspace', icon: FileEdit, panel: 'dokumen' as PanelId },
    { id: 'assets', label: 'Konten', icon: Puzzle, panel: 'konten' as PanelId },
    { id: 'analytics', label: 'Canva', icon: Palette, panel: 'canva' as PanelId },
  ];

  return (
    <div className="flex h-full page-transition" style={{ minHeight: 0 }}>
      {/* ══ SIDEBAR — Modern Educator design ══════════════════════ */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-white border-r border-[#e0e3e5] transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[#e0e3e5]">
          <div className="w-8 h-8 rounded-xl bg-[#006c49] flex items-center justify-center flex-shrink-0">
            <BookOpen size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold text-[#191c1e] truncate" style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}>
                SILSE Studio
              </div>
              <div className="text-[0.6rem] text-[#6c7a71]">Authoring Tool v2.1</div>
            </div>
          )}
        </div>

        {/* New Project Button */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={() => setWizardOpen(true)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#006c49] text-white text-sm font-semibold border-b-2 border-[#005236] hover:bg-[#005236] transition-colors ${
              sidebarCollapsed ? 'px-0' : 'px-4'
            }`}
          >
            <Plus size={16} />
            {!sidebarCollapsed && 'Proyek Baru'}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.panel) setActivePanel(item.panel);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[rgba(0,108,73,0.08)] text-[#006c49] border-l-[3px] border-[#006c49]'
                    : 'text-[#3c4a42] hover:bg-[#f2f4f6] border-l-[3px] border-transparent'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 border-t border-[#e0e3e5] space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#6c7a71] hover:bg-[#f2f4f6] transition-colors">
            <Settings size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Pengaturan</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#6c7a71] hover:bg-[#f2f4f6] transition-colors">
            <LifeBuoy size={16} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>Bantuan</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
              <div className="w-8 h-8 rounded-full bg-[#006c49]/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={16} className="text-[#006c49]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#191c1e] truncate">Guru PPKn</div>
                <div className="text-[0.6rem] text-[#6c7a71]">Mode {isSederhana ? 'Sederhana' : 'Lengkap'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center py-2 border-t border-[#e0e3e5] text-[#6c7a71] hover:bg-[#f2f4f6] transition-colors"
        >
          <ChevronLeft size={14} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* ══ MAIN CONTENT AREA ════════════════════════════════════ */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#f7f9fb] custom-scrollbar">
        <div className="p-6 sm:p-8 space-y-8 max-w-5xl">
          {/* ══ WELCOME HEADER ══════════════════════════════════════ */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold text-[#191c1e] tracking-tight"
                style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
              >
                {isSederhana ? 'Selamat Datang, Guru!' : 'Dashboard Guru'}
              </h1>
              <p className="text-sm text-[#3c4a42] mt-1">
                {isSederhana
                  ? 'Buat media pembelajaran interaktif dengan mudah.'
                  : 'Kelola proyek media pembelajaran interaktif Anda.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePanel('autogen')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006c49] text-white text-sm font-semibold border-b-2 border-[#005236] hover:bg-[#005236] transition-colors"
              >
                <Sparkles size={14} />
                Buat dengan AI
              </button>
              {isPresetMode && (
                <button
                  onClick={() => {
                    if (currentProjectId) { saveProject(); } else { saveToStorage(); }
                    useAuthoringStore.setState({ activePreset: null });
                  }}
                  className="flex-shrink-0 px-3 py-2 bg-[#10b981]/10 border border-[#10b981]/20 text-[#006c49] text-xs font-medium rounded-xl hover:bg-[#10b981]/15 transition-colors"
                >
                  Simpan Proyek
                </button>
              )}
            </div>
          </div>

          {/* ══ BENTO STATS GRID ═══════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Completeness Card */}
            <div className="bg-white rounded-[24px] border border-[#e0e3e5] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6c7a71] uppercase tracking-wider">Kelengkapan</span>
                <div className="w-8 h-8 rounded-xl bg-[#006c49]/10 flex items-center justify-center">
                  <PieChart size={16} className="text-[#006c49]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}>
                {completeness}%
              </div>
              <div className="mt-3 h-2 bg-[#eceef0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${completeness}%`,
                    background: completeness === 100 ? '#10b981' : completeness >= 60 ? '#e29100' : '#006c49',
                  }}
                />
              </div>
            </div>

            {/* BSNP Compliance */}
            <div className="bg-white rounded-[24px] border border-[#e0e3e5] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6c7a71] uppercase tracking-wider">BSNP</span>
                <div className="w-8 h-8 rounded-xl bg-[#0058be]/10 flex items-center justify-center">
                  <Check size={16} className="text-[#0058be]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}>
                {hasData ? (completeness >= 80 ? 'Sesuai' : 'Proses') : '—'}
              </div>
              <div className="mt-3 text-xs text-[#6c7a71]">
                {hasData ? 'Standar BSNP compliance' : 'Mulai proyek untuk cek'}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-[24px] border border-[#e0e3e5] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6c7a71] uppercase tracking-wider">Status</span>
                <div className="w-8 h-8 rounded-xl bg-[#e29100]/10 flex items-center justify-center">
                  <BarChart3 size={16} className="text-[#e29100]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPresetMode ? 'bg-[#006c49]' : hasData ? 'bg-[#10b981]' : 'bg-[#6c7a71]'}`} />
                <span className="text-sm font-medium text-[#191c1e]">
                  {isPresetMode ? `Preset: ${presetLabels[activePreset || ''] || activePreset}` : hasData ? 'Proyek Aktif' : 'Belum Ada Proyek'}
                </span>
              </div>
              {hasData && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'TP', val: tp.length },
                    { label: 'Kuis', val: kuis.length },
                    { label: 'Game', val: games.length },
                    { label: 'Materi', val: materiBloks },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-[#f2f4f6] rounded-lg py-1.5">
                      <div className="text-sm font-bold text-[#191c1e]">{s.val}</div>
                      <div className="text-[0.6rem] text-[#6c7a71]">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ══ ADAPTIVE "LANGKAH SELANJUTNYA" CARD ═════════════════ */}
          {hasData && (
            <div className="bg-[#0058be]/5 border border-[#0058be]/12 rounded-[24px] p-5 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#0058be]/10 flex items-center justify-center text-[#0058be]">
                {nextStep.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#191c1e] text-sm">Langkah Selanjutnya</p>
                <p className="text-xs text-[#3c4a42] truncate">{nextStep.step}</p>
              </div>
              <button
                onClick={nextStep.action}
                className="flex-shrink-0 flex items-center gap-1 px-4 py-2 bg-[#0058be] text-white text-xs font-semibold rounded-xl hover:bg-[#0047a0] transition-colors"
              >
                Mulai <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* ══ TEMPLATE SELECTION ══════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-bold text-[#191c1e]"
                  style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
                >
                  Template Pembelajaran
                </h2>
                <p className="text-xs text-[#6c7a71] mt-0.5">Pilih preset atau mulai dari proyek kosong.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {templates.map((p) => {
                const Icon = p.icon;
                const isCurrentPreset = isPresetMode && activePreset === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleTemplateClick(p.key)}
                    className={`rounded-[20px] p-4 text-center transition-all cursor-pointer border shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${
                      isCurrentPreset
                        ? activeColorMap[p.color]
                        : `border-[#e0e3e5] bg-white ${colorMap[p.color]}`
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl mx-auto mb-2.5 flex items-center justify-center ${iconColorMap[p.color]}`}>
                      <Icon size={18} />
                    </div>
                    <div className="text-xs font-semibold text-[#191c1e]">{p.label}</div>
                    <div className="text-[0.65rem] text-[#6c7a71] mt-0.5">{p.sub}</div>
                    {SCHEMA_DRIVEN_PRESETS.has(p.key) && (
                      <div className="text-[0.6rem] text-[#006c49]/70 font-medium mt-1.5 flex items-center justify-center gap-0.5">
                        <Zap size={9} /> {isSederhana ? 'Siap Pakai' : 'Schema'}
                      </div>
                    )}
                    {isCurrentPreset && (
                      <div className="text-[0.6rem] text-[#006c49] font-bold mt-1.5">AKTIF</div>
                    )}
                  </button>
                );
              })}
              {/* Mulai dari Template dashed card */}
              <button
                onClick={() => setWizardOpen(true)}
                className="rounded-[20px] p-4 text-center border-2 border-dashed border-[#e0e3e5] bg-transparent hover:border-[#006c49]/30 hover:bg-[#006c49]/3 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl mx-auto mb-2.5 flex items-center justify-center bg-[#006c49]/5 text-[#006c49]">
                  <Plus size={18} />
                </div>
                <div className="text-xs font-semibold text-[#3c4a42]">Mulai dari Template</div>
                <div className="text-[0.65rem] text-[#6c7a71] mt-0.5">Pilih & kustomisasi</div>
              </button>
            </div>
          </div>

          {/* ══ FLOW PROGRESS ═════════════════════════════════════ */}
          <div className="bg-white rounded-[24px] border border-[#e0e3e5] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2
              className="text-sm font-bold text-[#191c1e] mb-5"
              style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
            >
              {isSederhana ? 'Langkah-Langkah' : 'Alur Kerja'}
            </h2>
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
                        step.active ? 'bg-[#006c49]/30' : 'bg-[#eceef0]'
                      }`} />
                    )}
                    {/* Step circle */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#006c49]/15 text-[#006c49] border border-[#006c49]/30'
                        : 'bg-[#f2f4f6] text-[#6c7a71] border border-[#e0e3e5]'
                    } ${isCurrent ? 'ring-2 ring-[#006c49]/25 ring-offset-1 ring-offset-white' : ''}`}>
                      {isActive ? <Check size={14} strokeWidth={2.5} /> : <StepIcon size={14} />}
                    </div>
                    {/* Label */}
                    <div className="mt-2.5 text-center">
                      <div className={`text-[0.7rem] font-medium ${isActive ? 'text-[#191c1e]' : 'text-[#6c7a71]'}`}>
                        {step.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══ BSNP COMPLIANCE — only in lengkap mode ══ */}
          {!isSederhana && <BsnpCompliancePanel />}

          {/* ══ QUICK ACTIONS ══════════════════════════════════════ */}
          <div>
            <h2
              className="text-sm font-bold text-[#191c1e] mb-3"
              style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
            >
              {isSederhana ? 'Mulai dari sini' : 'Aksi Cepat'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: isSederhana ? 'Isi RPP' : 'Isi Dokumen',
                  desc: isSederhana ? 'Identitas, Capaian, Tujuan' : 'CP, TP, ATP, Alur Pembelajaran',
                  icon: FileEdit,
                  accentColor: '#006c49',
                  action: () => setActivePanel('dokumen'),
                },
                {
                  label: isSederhana ? 'Tambah Materi' : 'Tambah Konten',
                  desc: isSederhana ? 'Materi, game, kuis' : 'Kuis, modul interaktif, materi',
                  icon: Puzzle,
                  accentColor: '#0058be',
                  action: () => setActivePanel('konten'),
                },
                {
                  label: isSederhana ? 'Lihat Hasil' : 'Preview Siswa',
                  desc: isSederhana ? 'Pratinjau tampilan siswa' : 'Lihat tampilan lengkap siswa',
                  icon: Smartphone,
                  accentColor: '#10b981',
                  action: () => setActivePanel('preview'),
                },
                ...(!isSederhana ? [{
                  label: 'Desain Canva',
                  desc: 'Layout & visual slide',
                  icon: Palette,
                  accentColor: '#e29100',
                  action: () => {
                    const currentPreset = useAuthoringStore.getState().activePreset;
                    if (SCHEMA_DRIVEN_PRESETS.has(currentPreset || '')) {
                      setActivePanel('canva');
                    } else {
                      useCanvaStore.getState().resetCanvas();
                      setActivePanel('canva');
                    }
                  },
                }] : []),
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex items-center gap-3.5 bg-white border border-[#e0e3e5] rounded-[20px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${action.accentColor}10`, color: action.accentColor }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#191c1e]">{action.label}</div>
                      <div className="text-xs text-[#6c7a71]">{action.desc}</div>
                    </div>
                  </button>
                );
              })}
              {/* Schema Preview — only in preset mode */}
              {isPresetMode && (
                <button
                  onClick={() => setActivePanel('preview')}
                  className="flex items-center gap-3.5 bg-[#7c3aed]/3 border border-[#7c3aed]/12 rounded-[20px] p-4 hover:border-[#7c3aed]/25 hover:bg-[#7c3aed]/5 hover:-translate-y-0.5 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed] flex-shrink-0">
                    <Zap size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#191c1e]">{isSederhana ? 'Pratinjau Interaktif' : 'Schema Preview'}</div>
                    <div className="text-xs text-[#6c7a71]">{isSederhana ? 'Lihat tampilan media' : 'JSON-driven rendering + 7 tema'}</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ══ BOTTOM TOOLBAR ════════════════════════════════════ */}
          <div className="flex items-center gap-2 pt-4 border-t border-[#e0e3e5]">
            <button
              onClick={() => setActivePanel('dokumen')}
              className="px-4 py-2 text-xs text-white bg-[#006c49] hover:bg-[#005236] rounded-xl font-semibold transition-colors flex items-center gap-1.5 border-b-2 border-[#005236]"
            >
              <Plus size={12} />
              {isSederhana ? 'Isi RPP' : 'Buat Baru'}
            </button>
            <button
              onClick={() => setActivePanel('autogen')}
              className="px-4 py-2 text-xs text-[#006c49] hover:text-[#005236] bg-[#006c49]/5 hover:bg-[#006c49]/10 rounded-xl border border-[#006c49]/15 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Wand2 size={12} />
              {isSederhana ? 'Buat AI' : 'Auto-Generate'}
            </button>

            {!isSederhana && (
              <>
                <div className="w-px h-5 bg-[#e0e3e5] mx-1" />
                <button
                  onClick={() => {
                    if (hasData) {
                      showConfirm('Buat Proyek Baru?', 'Data yang belum disimpan akan hilang.', () => newProject());
                    } else {
                      newProject();
                    }
                  }}
                  className="p-1.5 text-[#6c7a71] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg transition-colors"
                  title="Proyek Baru"
                >
                  <FileText size={15} />
                </button>
                <button
                  onClick={() => setActivePanel('projects')}
                  className="p-1.5 text-[#6c7a71] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg transition-colors"
                  title="Buka Proyek"
                >
                  <FolderOpen size={15} />
                </button>
                <button
                  onClick={() => setActivePanel('import')}
                  className="p-1.5 text-[#6c7a71] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg transition-colors"
                  title="Import"
                >
                  <Upload size={15} />
                </button>
                <button
                  onClick={exportJSON}
                  className="p-1.5 text-[#6c7a71] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-lg transition-colors"
                  title="Export JSON"
                >
                  <Download size={15} />
                </button>
              </>
            )}

            <div className="flex-1" />

            <button
              onClick={() => currentProjectId ? saveProject() : saveToStorage()}
              className="px-4 py-2 text-xs text-[#3c4a42] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Save size={13} />
              Simpan
            </button>
          </div>
        </div>
      </main>

      {/* Template Wizard Modal */}
      <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Styled Confirm Dialog — replaces native confirm() */}
      <Dialog open={confirmState.open} onOpenChange={(v) => !v && setConfirmState(s => ({ ...s, open: false }))}>
        <DialogContent className="sm:max-w-sm bg-white border-[#e0e3e5] rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-[#191c1e]">{confirmState.title}</DialogTitle>
            <DialogDescription className="text-[#3c4a42]">{confirmState.message}</DialogDescription>
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
              className="bg-[#006c49] hover:bg-[#005236] text-white text-xs"
            >
              Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
