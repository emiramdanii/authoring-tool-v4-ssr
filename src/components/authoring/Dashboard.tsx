'use client';

import React, { useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring/types';
import { useProjectManager } from '@/hooks/use-project-manager';
// All icons migrated to Material Symbols Outlined
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
// COLORS import removed — using silse-* tokens instead
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import dynamic from 'next/dynamic';

// ── Sidebar Nav Item Config ────────────────────────────────────
interface SidebarNavItem {
  id: string;
  label: string;
  icon: string; // Material Symbols Outlined icon name
  panelRequest: string; // maps to canva-store panelRequest
}

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', panelRequest: 'dashboard' },
  { id: 'workspace', label: 'Workspace', icon: 'edit_note', panelRequest: 'canva' },
  { id: 'assets', label: 'Assets', icon: 'folder_open', panelRequest: 'konten' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', panelRequest: 'preview' },
];

const SIDEBAR_SECONDARY_ITEMS: { id: string; label: string; icon: string; panelRequest: string | null }[] = [
  { id: 'settings', label: 'Settings', icon: 'settings', panelRequest: 'settings' },
  { id: 'support', label: 'Support', icon: 'help', panelRequest: null },
];

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
    return { step: 'Isi judul pertemuan di panel Dokumen', action: () => setActivePanel('dokumen'), icon: <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>description</span> };
  }
  if (tp.length === 0) {
    return { step: 'Tambahkan Tujuan Pembelajaran (TP)', action: () => setActivePanel('konten'), icon: <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>target</span> };
  }
  if (kuis.length === 0 && modules.length === 0 && games.length === 0) {
    return { step: 'Buat konten interaktif — kuis, game, atau modul', action: () => setActivePanel('konten'), icon: <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>sports_esports</span> };
  }
  if (pagesLength <= 1) {
    return { step: 'Tambahkan lebih banyak halaman di Canva', action: () => setActivePanel('canva'), icon: <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>layers</span> };
  }
  return { step: 'Preview media pembelajaran Anda!', action: () => setActivePanel('preview'), icon: <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>play_arrow</span> };
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
  const tp = useAuthoringStore((s) => s.tp);
  // Phase 5: Content data from schema (single source of truth)
  const kuis = useSchemaKuisProjection();
  const modules = useSchemaModulesProjection();
  const games = modules;
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

  // ── Sidebar: read activePanel to determine highlighted nav item ──
  const activePanel = useAuthoringStore((s) => s.activePanel);

  // Map activePanel to sidebar nav id for highlighting
  const activeNavId = React.useMemo(() => {
    if (activePanel === 'dashboard') return 'dashboard';
    if (activePanel === 'canva') return 'workspace';
    if (activePanel === 'konten') return 'assets';
    if (activePanel === 'preview') return 'analytics';
    if (activePanel === 'dokumen') return 'settings';
    // For any other active panel, default to dashboard
    return 'dashboard';
  }, [activePanel]);

  // Get canva pages length for adaptive guidance
  const pagesLength = useCanvaStore((s) => s.pages.length);

  const completeness = calcCompleteness();
  const isPresetMode = activePreset !== null;
  const hasData = meta.judulPertemuan || tp.length > 0 || kuis.length > 0 || materiBloks > 0;

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
    const canvaState = useCanvaStore.getState();
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
    { key: 'hakikat-norma', icon: 'groups', label: 'Hakikat Norma', sub: 'PPKn VII · Bab 3 P1', color: 'emerald' },
    { key: 'macam-norma', icon: 'scroll', label: 'Macam Norma', sub: 'PPKn VII · Bab 3 P2', color: 'emerald' },
    { key: 'perilaku-patuh', icon: 'balance', label: 'Perilaku Patuh', sub: 'PPKn VII · Bab 3 P3', color: 'emerald' },
    { key: 'nilai-pancasila', icon: 'menu_book', label: 'Nilai Pancasila', sub: 'PPKn VII · Bab 3 P4', color: 'amber' },
    { key: 'bhinneka-tunggal-ika', icon: 'groups', label: 'Bhinneka Tunggal Ika', sub: 'PPKn VII · Bab 3 P5', color: 'emerald' },
    { key: 'ham-hak-kewajiban', icon: 'balance', label: 'HAM & Kewajiban', sub: 'PPKn VII · Bab 3 P6', color: 'emerald' },
    { key: 'demokrasi-pancasila', icon: 'scroll', label: 'Demokrasi Pancasila', sub: 'PPKn VII · Bab 3 P7', color: 'amber' },
    { key: 'globalisasi', icon: 'school', label: 'Globalisasi', sub: 'PPKn VII · Bab 3 P8', color: 'emerald' },
    { key: 'misi-penjelajah-pancasila', icon: 'rocket_launch', label: 'Misi Penjelajah', sub: 'PPKn VII · Bab 3 P9', color: 'emerald' },
    // IPA
    { key: 'sistem-pernapasan', icon: 'menu_book', label: 'Sistem Pernapasan', sub: 'IPA VIII', color: 'emerald' },
    // MTK
    { key: 'persamaan-linear', icon: 'scroll', label: 'Persamaan Linear', sub: 'MTK VIII', color: 'amber' },
    // PJOK
    { key: 'gerak-dasar-lokomotor', icon: 'rocket_launch', label: 'Gerak Dasar Lokomotor', sub: 'PJOK VII', color: 'emerald' },
    { key: 'permainan-bola-besar', icon: 'school', label: 'Permainan Bola Besar', sub: 'PJOK VII', color: 'emerald' },
    { key: 'kebugaran-jasmani', icon: 'groups', label: 'Kebugaran Jasmani', sub: 'PJOK VII', color: 'amber' },
    // Blank
    { key: 'blank', icon: 'assignment', label: 'Proyek Kosong', sub: 'Isi semua manual', color: 'slate' },
  ];

  const colorMap: Record<string, string> = {
    amber: 'hover:border-silse-tertiary-container/30 hover:bg-silse-tertiary-container/5',
    emerald: 'hover:border-silse-primary-container/30 hover:bg-silse-primary-container/5',
    slate: 'hover:border-silse-outline-variant/40 hover:bg-silse-surface-container-high/5',
  };
  const activeColorMap: Record<string, string> = {
    amber: 'border-silse-tertiary-container/50 bg-silse-tertiary-container/10 ring-1 ring-silse-tertiary-container/20',
    emerald: 'border-silse-primary-container/50 bg-silse-primary-container/10 ring-1 ring-silse-primary-container/20',
    slate: 'border-silse-outline-variant/50 bg-silse-surface-container-high/10 ring-1 ring-silse-outline-variant/20',
  };
  const iconColorMap: Record<string, string> = {
    amber: 'text-silse-tertiary-container bg-silse-tertiary-container/10',
    emerald: 'text-silse-primary bg-silse-primary-container/10',
    slate: 'text-silse-on-surface-variant bg-silse-surface-container-high/30',
  };

  // ── Flow Steps (mode-aware labels) ──────────────────────────
  const flowSteps = [
    { num: 1, label: 'Pilih Template', icon: 'dashboard', active: true },
    { num: 2, label: isSederhana ? 'Isi RPP' : 'Isi Dokumen', icon: 'edit_note', active: completeness >= 10 },
    { num: 3, label: 'Tambah Materi', icon: 'extension', active: completeness >= 40 },
    { num: 4, label: isSederhana ? 'Desain Visual' : 'Desain Canva', icon: 'palette', active: completeness >= 60 },
    { num: 5, label: isSederhana ? 'Pratinjau' : 'Preview & Export', icon: 'play_arrow', active: completeness >= 80 },
  ];

  const currentStep = flowSteps.findIndex((s) => !s.active);

  // ── Compute greeting based on time ──
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="flex h-full page-transition" style={{ minHeight: 0 }}>
      {/* ══ SIDEBAR — SILSE v4 Fixed Navigation ══════════════════ */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 z-30 flex flex-col border-r border-silse-outline-variant bg-silse-surface-bright">
        {/* Logo Area */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-silse-primary-container/15 flex items-center justify-center border border-silse-primary-container/25">
              <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
            </div>
            <div>
              <span
                className="text-base font-extrabold text-silse-primary tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
              >
                SILSE
              </span>
              <p className="text-[0.6rem] text-silse-on-surface-variant leading-tight mt-0.5">Smart Interactive Learning</p>
            </div>
          </div>
        </div>

        {/* New Project Button */}
        <div className="px-4 pb-3">
          <button
            onClick={() => {
              if (hasData) {
                showConfirm('Buat Proyek Baru?', 'Data yang belum disimpan akan hilang.', () => newProject());
              } else {
                newProject();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-silse-primary-container text-silse-on-primary-container font-bold border-b-2 border-silse-primary hover:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
            Proyek Baru
          </button>
        </div>

        {/* Primary Nav Items — scrollable */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.panelRequest)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-silse-primary-container text-silse-on-primary-container'
                    : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:translate-x-1'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '20px',
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-3 h-px bg-silse-outline-variant/50" />

          {/* Secondary Nav Items */}
          {SIDEBAR_SECONDARY_ITEMS.map((item) => {
            const isActive = item.panelRequest !== null && activeNavId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.panelRequest) {
                    setActivePanel(item.panelRequest);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-silse-primary-container text-silse-on-primary-container'
                    : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:translate-x-1'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '20px',
                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Avatar + Teacher Name */}
        <div className="p-4 border-t border-silse-outline-variant/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-silse-primary-container/20 border border-silse-primary-container/40 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-silse-primary">G</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-silse-on-surface truncate">Guru</p>
              <p className="text-[0.6rem] text-silse-on-surface-variant truncate">Pengajar Aktif</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ══ MAIN CONTENT AREA — SILSE v4 Bento Grid ════════════ */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-silse-surface-bright custom-scrollbar ml-64">
        <div className="p-6 sm:p-8 space-y-16 max-w-5xl">

          {/* ══ WELCOME HEADER — SILSE v4 ═══════════════════════ */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1
                  className="text-[40px] font-bold text-silse-primary tracking-tight leading-tight"
                  style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
                >
                  {getGreeting()}, Guru! Siap buat materi seru hari ini?
                </h1>
                <p className="text-base text-silse-on-surface-variant mt-2" style={{ fontFamily: 'var(--font-nunito), Nunito Sans, sans-serif' }}>
                  {isSederhana
                    ? 'Buat media pembelajaran interaktif dengan mudah.'
                    : 'Kelola proyek media pembelajaran interaktif Anda.'}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* AI Content Button */}
                <button
                  onClick={() => setActivePanel('autogen')}
                  className="flex items-center gap-2 px-8 py-5 rounded-full bg-silse-primary-container text-silse-on-primary-container text-sm font-bold border-b-[3px] border-silse-primary shadow-sm hover:-translate-y-0.5 hover:shadow-sm transition-[transform,box-shadow]"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '18px' } }>auto_awesome</span>
                  Buat Konten Baru dengan AI
                </button>
                {isPresetMode && (
                  <button
                    onClick={() => {
                      if (currentProjectId) { saveProject(); } else { saveToStorage(); }
                      useAuthoringStore.setState({ activePreset: null });
                    }}
                    className="flex-shrink-0 px-3 py-2 bg-silse-primary/10 border border-silse-primary/20 text-silse-primary text-xs font-medium rounded-xl hover:bg-silse-primary/15 transition-colors"
                  >
                    Simpan Proyek
                  </button>
                )}
              </div>
            </div>

            {/* Curriculum Readiness Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-silse-primary-container/20 flex items-center justify-center border-2 border-silse-primary">
                <span className="text-sm font-bold text-silse-primary">{completeness}%</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-silse-surface-container border border-silse-outline-variant">
                <span className="material-symbols-outlined text-silse-primary" style={ { fontSize: '14px' } }>trending_up</span>
                <span className="text-xs font-semibold text-silse-on-surface">
                  Kesiapan Kurikulum Merdeka
                </span>
              </div>
            </div>
          </div>

          {/* ══ BENTO STATS GRID — SILSE v4 (3 columns) ════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* BSNP Compliance Card — 2-col span */}
            <div className="sm:col-span-2 glass-card rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-bold text-silse-on-surface-variant uppercase tracking-wider">Kelengkapan Standar BSNP</span>
                  <p className="text-[0.65rem] text-silse-on-surface-variant mt-0.5">
                    {hasData ? 'Standar BSNP compliance' : 'Mulai proyek untuk cek'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-silse-secondary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-silse-tertiary" style={{ fontSize: '28px' }}>verified</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-silse-on-surface" style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}>
                {completeness}%
              </div>
              <div className="mt-4 h-3 bg-silse-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full liquid-progress"
                  style={{
                    width: `${completeness}%`,
                    background: completeness === 100 ? 'var(--silse-primary)' : completeness >= 60 ? 'var(--silse-tertiary-container)' : 'var(--silse-primary)',
                  }}
                />
              </div>
              {/* Sub-stats row */}
              {hasData && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    { label: 'TP', val: tp.length },
                    { label: 'Kuis', val: kuis.length },
                    { label: 'Game', val: games.length },
                    { label: 'Materi', val: materiBloks },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-silse-surface-container rounded-xl py-2">
                      <div className="text-sm font-bold text-silse-on-surface">{s.val}</div>
                      <div className="text-[0.6rem] text-silse-on-surface-variant">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Views/Status Card — 1-col */}
            <div className="bg-silse-secondary-container rounded-[24px] p-6 text-silse-on-secondary-container flex flex-col items-center justify-center text-center shadow-lg">
              <span className="material-symbols-outlined text-5xl mb-4">visibility</span>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${isPresetMode ? 'bg-white/80' : hasData ? 'bg-white/80' : 'bg-white/40'}`} />
                <span className="text-sm font-semibold">
                  {isPresetMode ? 'Preset Aktif' : hasData ? 'Proyek Aktif' : 'Belum Ada'}
                </span>
              </div>
              <div className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}>
                {isPresetMode ? (presetLabels[activePreset || ''] || activePreset || '—') : hasData ? completeness + '%' : '—'}
              </div>
              <div className="text-xs opacity-80 mt-1">
                {isPresetMode ? 'Template aktif' : hasData ? 'Kelengkapan proyek' : 'Mulai proyek baru'}
              </div>
              {hasData && (
                <div className="mt-3 flex items-center gap-1 text-silse-primary-fixed-dim">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span className="text-sm font-bold">+{completeness}% minggu ini</span>
                </div>
              )}
            </div>
          </div>

          {/* ══ ADAPTIVE "LANGKAH SELANJUTNYA" CARD ═══════════ */}
          {hasData && (
            <div className="bg-silse-secondary-container/5 border border-silse-secondary-container/12 rounded-[24px] p-5 flex items-center gap-4 glass-card">
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-silse-secondary-container/10 flex items-center justify-center text-silse-secondary-container">
                {nextStep.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-silse-on-surface text-sm">Langkah Selanjutnya</p>
                <p className="text-xs text-silse-on-surface-variant truncate">{nextStep.step}</p>
              </div>
              <button
                onClick={nextStep.action}
                className="flex-shrink-0 flex items-center gap-1 px-4 py-2 bg-silse-secondary-container text-white text-xs font-semibold rounded-xl hover:bg-silse-secondary-container/90 transition-colors"
              >
                Mulai <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>arrow_forward</span>
              </button>
            </div>
          )}

          {/* ══ PROJECT CARDS / TEMPLATES SECTION ═══════════════ */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-lg font-bold text-silse-on-surface"
                  style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
                >
                  Proyek MPI Aktif
                </h2>
                <p className="text-xs text-silse-on-surface-variant mt-0.5">Pilih preset atau mulai dari proyek kosong.</p>
              </div>
              <button className="text-xs font-semibold text-silse-primary hover:text-silse-primary/80 transition-colors">
                Lihat Semua →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {templates.map((p) => {
                // icon is now a string
                const isCurrentPreset = isPresetMode && activePreset === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleTemplateClick(p.key)}
                    className={`glass-card rounded-[24px] p-4 text-center transition-all cursor-pointer hover:-translate-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${
                      isCurrentPreset
                        ? activeColorMap[p.color]
                        : `border border-silse-outline-variant bg-silse-surface-container-lowest ${colorMap[p.color]}`
                    }`}
                  >
                    {/* Cover image placeholder */}
                    <div className={`w-full h-20 rounded-2xl mb-3 flex items-center justify-center ${iconColorMap[p.color]}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{p.icon}</span>
                    </div>
                    <div className="text-xs font-semibold text-silse-on-surface">{p.label}</div>
                    <div className="text-[0.65rem] text-silse-on-surface-variant mt-0.5">{p.sub}</div>
                    {/* Progress bar for active preset */}
                    {isCurrentPreset && (
                      <div className="mt-2 h-1 bg-silse-surface-container rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-silse-primary liquid-progress" style={{ width: `${completeness}%` }} />
                      </div>
                    )}
                    {SCHEMA_DRIVEN_PRESETS.has(p.key) && !isCurrentPreset && (
                      <div className="text-[0.6rem] text-silse-primary/70 font-medium mt-1.5 flex items-center justify-center gap-0.5">
                        <span className="material-symbols-outlined" style={ { fontSize: '9px' } }>bolt</span> {isSederhana ? 'Siap Pakai' : 'Schema'}
                      </div>
                    )}
                    {isCurrentPreset && (
                      <div className="text-[0.6rem] text-silse-primary font-bold mt-1.5">AKTIF</div>
                    )}
                  </button>
                );
              })}
              {/* Mulai dari Template dashed card */}
              <button
                onClick={() => setWizardOpen(true)}
                className="rounded-[24px] p-4 text-center border-2 border-dashed border-silse-outline-variant bg-transparent hover:border-silse-primary/30 hover:bg-silse-primary/5 group transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full mb-3 mx-auto flex items-center justify-center bg-silse-primary/5 text-silse-primary group-hover:bg-silse-primary-container transition-colors">
                  <span className="material-symbols-outlined" style={ { fontSize: '28px' } }>add</span>
                </div>
                <div className="text-xs font-semibold text-silse-on-surface-variant">Mulai dari Template</div>
                <div className="text-[0.65rem] text-silse-on-surface-variant mt-0.5">Pilih & kustomisasi</div>
              </button>
            </div>
          </div>

          {/* ══ FLOW PROGRESS ═════════════════════════════════ */}
          <div className="glass-card rounded-[24px] p-6">
            <h2
              className="text-sm font-bold text-silse-on-surface mb-5"
              style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
            >
              {isSederhana ? 'Langkah-Langkah' : 'Alur Kerja'}
            </h2>
            <div className="flex items-start">
              {flowSteps.map((step, i) => {
                const isActive = step.active;
                const isCurrent = i === Math.max(0, currentStep);
                // step.icon is now a string
                return (
                  <div key={step.num} className="flex-1 flex flex-col items-center relative">
                    {i > 0 && (
                      <div className={`absolute top-4 right-1/2 left-[-50%] h-[1.5px] ${
                        step.active ? 'bg-silse-primary/30' : 'bg-silse-surface-container'
                      }`} />
                    )}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-silse-primary-container/15 text-silse-primary border border-silse-primary/30'
                        : 'bg-silse-surface-container text-silse-on-surface-variant border border-silse-outline-variant'
                    } ${isCurrent ? 'ring-2 ring-silse-primary/25 ring-offset-1 ring-offset-silse-surface-container-lowest' : ''}`}>
                      {isActive ? <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>check</span> : <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{step.icon}</span>}
                    </div>
                    <div className="mt-2.5 text-center">
                      <div className={`text-[0.7rem] font-medium ${isActive ? 'text-silse-on-surface' : 'text-silse-on-surface-variant'}`}>
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

          {/* ══ QUICK ACTIONS ════════════════════════════════════ */}
          <div>
            <h2
              className="text-sm font-bold text-silse-on-surface mb-3"
              style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
            >
              {isSederhana ? 'Mulai dari sini' : 'Aksi Cepat'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: isSederhana ? 'Isi RPP' : 'Isi Dokumen',
                  desc: isSederhana ? 'Identitas, Capaian, Tujuan' : 'CP, TP, ATP, Alur Pembelajaran',
                  icon: 'edit_note',
                  accentClass: 'bg-silse-primary-container/10 text-silse-primary',
                  action: () => setActivePanel('dokumen'),
                },
                {
                  label: isSederhana ? 'Tambah Materi' : 'Tambah Konten',
                  desc: isSederhana ? 'Materi, game, kuis' : 'Kuis, modul interaktif, materi',
                  icon: 'extension',
                  accentClass: 'bg-silse-secondary-container/10 text-silse-secondary-container',
                  action: () => setActivePanel('konten'),
                },
                {
                  label: isSederhana ? 'Lihat Hasil' : 'Preview Siswa',
                  desc: isSederhana ? 'Pratinjau tampilan siswa' : 'Lihat tampilan lengkap siswa',
                  icon: 'smartphone',
                  accentClass: 'bg-silse-primary/10 text-silse-primary',
                  action: () => setActivePanel('preview'),
                },
                ...(!isSederhana ? [{
                  label: 'Desain Canva',
                  desc: 'Layout & visual slide',
                  icon: 'palette',
                  accentClass: 'bg-silse-tertiary-container/10 text-silse-tertiary-container',
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
                // action.icon is now a string
                return (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex items-center gap-3.5 glass-card rounded-[24px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer text-left border border-silse-outline-variant"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${action.accentClass}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{action.icon}</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-silse-on-surface">{action.label}</div>
                      <div className="text-xs text-silse-on-surface-variant">{action.desc}</div>
                    </div>
                  </button>
                );
              })}
              {/* Schema Preview — only in preset mode */}
              {isPresetMode && (
                <button
                  onClick={() => setActivePanel('preview')}
                  className="flex items-center gap-3.5 bg-silse-tertiary-container/3 border border-silse-tertiary-container/12 rounded-[24px] p-4 hover:border-silse-tertiary-container/25 hover:bg-silse-tertiary-container/5 hover:-translate-y-1 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-2xl bg-silse-tertiary-container/10 flex items-center justify-center text-silse-tertiary-container flex-shrink-0">
                    <span className="material-symbols-outlined" style={ { fontSize: '16px' } }>bolt</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-silse-on-surface">{isSederhana ? 'Pratinjau Interaktif' : 'Schema Preview'}</div>
                    <div className="text-xs text-silse-on-surface-variant">{isSederhana ? 'Lihat tampilan media' : 'JSON-driven rendering + 7 tema'}</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ══ BOTTOM TOOLBAR ══════════════════════════════════ */}
          <div className="flex items-center gap-2 pt-4 border-t border-silse-outline-variant">
            <button
              onClick={() => setActivePanel('dokumen')}
              className="px-4 py-2 text-xs text-silse-on-primary bg-silse-primary hover:bg-silse-primary/90 rounded-xl font-semibold transition-colors flex items-center gap-1.5 border-b-2 border-silse-primary"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>add</span>
              {isSederhana ? 'Isi RPP' : 'Buat Baru'}
            </button>
            <button
              onClick={() => setActivePanel('autogen')}
              className="px-4 py-2 text-xs text-silse-primary hover:text-silse-primary/80 bg-silse-primary/5 hover:bg-silse-primary/10 rounded-xl border border-silse-primary/15 transition-colors flex items-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>auto_fix</span>
              {isSederhana ? 'Buat AI' : 'Auto-Generate'}
            </button>

            {!isSederhana && (
              <>
                <div className="w-px h-5 bg-silse-outline-variant mx-1" />
                <button
                  onClick={() => {
                    if (hasData) {
                      showConfirm('Buat Proyek Baru?', 'Data yang belum disimpan akan hilang.', () => newProject());
                    } else {
                      newProject();
                    }
                  }}
                  className="p-1.5 text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high rounded-lg transition-colors"
                  title="Proyek Baru"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '15px' } }>description</span>
                </button>
                <button
                  onClick={() => setActivePanel('projects')}
                  className="p-1.5 text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high rounded-lg transition-colors"
                  title="Buka Proyek"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '15px' } }>folder_open</span>
                </button>
                <button
                  onClick={() => setActivePanel('import')}
                  className="p-1.5 text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high rounded-lg transition-colors"
                  title="Import"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '15px' } }>upload</span>
                </button>
                <button
                  onClick={exportJSON}
                  className="p-1.5 text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high rounded-lg transition-colors"
                  title="Export JSON"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '15px' } }>download</span>
                </button>
              </>
            )}

            <div className="flex-1" />

            <button
              onClick={() => currentProjectId ? saveProject() : saveToStorage()}
              className="px-4 py-2 text-xs text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '13px' } }>save</span>
              Simpan
            </button>
          </div>
        </div>
      </main>

      {/* Template Wizard Modal */}
      <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Styled Confirm Dialog — replaces native confirm() */}
      <Dialog open={confirmState.open} onOpenChange={(v) => !v && setConfirmState(s => ({ ...s, open: false }))}>
        <DialogContent className="sm:max-w-sm bg-silse-surface-container-lowest border-silse-outline-variant rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-silse-on-surface">{confirmState.title}</DialogTitle>
            <DialogDescription className="text-silse-on-surface-variant">{confirmState.message}</DialogDescription>
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
              className="bg-silse-primary hover:bg-silse-primary/90 text-silse-on-primary text-xs"
            >
              Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
