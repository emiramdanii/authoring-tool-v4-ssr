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
// Sprint 8.6A: project-level schemaVersion gate for export/import JSON
import { CURRENT_PROJECT_SCHEMA_VERSION } from '@/core/schema/project-schema-versioning';
// COLORS import removed — using silse-* tokens instead
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import dynamic from 'next/dynamic';
import {
  getCourseTemplatesFiltered,
  type CourseTemplate as RegistryCourseTemplate,
  type ProjectMetadata,
} from '@/core/template/CourseTemplateRegistry';
import { applyTemplateToStore } from '@/core/template/apply-template-to-store';
import { useDirtyStore } from '@/store/dirty-store';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

// ── Sidebar Nav Item Config ────────────────────────────────────
interface SidebarNavItem {
  id: string;
  label: string;
  icon: string; // Material Symbols Outlined icon name
  panelRequest: string; // maps to canva-store panelRequest
}

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'space_dashboard', panelRequest: 'dashboard' },
  { id: 'workspace', label: 'Edit Media', icon: 'palette', panelRequest: 'canva' },
  { id: 'assets', label: 'Assets', icon: 'folder_open', panelRequest: 'konten' },
  { id: 'preview', label: 'Pratinjau', icon: 'visibility', panelRequest: 'preview' },
];

const SIDEBAR_SECONDARY_ITEMS: { id: string; label: string; icon: string; panelRequest: string | null }[] = [
  { id: 'settings', label: 'Settings', icon: 'settings', panelRequest: 'settings' },
  { id: 'support', label: 'Support', icon: 'help', panelRequest: null },
];

// Lazy-load TemplateWizard — it's a modal that's not always visible
const TemplateWizard = dynamic(() => import('@/components/canva/TemplateWizard'), { ssr: false });

// D-P0D.2: SCHEMA_DRIVEN_PRESETS removed — all templates now use
// applyTemplateToStore() via CourseTemplateRegistry. No more preset-key
// branching needed.

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
  // ── Template preview & curation state ──
  const [previewTemplate, setPreviewTemplate] = useState<RegistryCourseTemplate | null>(null);
  const [showLegacyTemplates, setShowLegacyTemplates] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
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
            const content = (block as { content?: import('@/core/schema/types').SchemaBlock[] }).content || [];
            count += content.filter(b => b.type === 'materi-blok').length;
          }
        }
      }
    }
    return count;
  }, [pages]);
  const activePreset = useAuthoringStore((s) => s.activePreset);
  const calcCompleteness = useAuthoringStore((s) => s.calcCompleteness);
  // Phase 3: setActivePanel migrated → panelRequest
  const setActivePanel = (_panel: string) => useCanvaStore.setState({ panelRequest: _panel });
  const saveToStorage = useAuthoringStore((s) => s.saveToStorage);
  const { saveProject, currentProjectId } = useProjectManager();
  const { isSederhana } = useTeacherMode();

  // ── Curated templates from CourseTemplateRegistry ──
  const curatedTemplates = React.useMemo(
    () => getCourseTemplatesFiltered(undefined, undefined, false).filter(t => t.id !== 'template-kosong'),
    [],
  );
  const legacyTemplates = React.useMemo(
    () => getCourseTemplatesFiltered(undefined, undefined, true).filter(t => t.status === 'legacy'),
    [],
  );

  // ── Sidebar: read activePanel to determine highlighted nav item ──
  const activePanel = useAuthoringStore((s) => s.activePanel);

  // Map activePanel to sidebar nav id for highlighting
  const activeNavId = React.useMemo(() => {
    if (activePanel === 'dashboard') return 'dashboard';
    if (activePanel === 'canva') return 'workspace';
    if (activePanel === 'konten') return 'assets';
    if (activePanel === 'preview') return 'preview';
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
      // Sprint 8.6A: project-level schemaVersion — import path gates on this
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      ...schemaPayload,
      // Sprint 8.4: include full canva state with all style authority fields
      canva: {
        pages: canvaState.pages,
        ratioId: canvaState.ratioId,
        currentPageIndex: canvaState.currentPageIndex,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-pembelajaran-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Apply template via shared helper (D-P0D.1 + D-P0D.2) ──────
  // ALL template application in Dashboard goes through this single path.
  // No more legacy applyTemplate/handleTemplateClick/newProject paths.
  const _applyTemplate = async (templateId: string, metadata?: ProjectMetadata) => {
    setIsApplyingTemplate(true);
    try {
      const result = await applyTemplateToStore(templateId, {
        metadata: metadata || { title: 'Proyek Kosong' },
        persist: 'localstorage',
      });

      if (result.success) {
        toast.success(`Template "${result.templateName}" berhasil diterapkan!`);
        setPreviewTemplate(null);
      } else {
        toast.error('Gagal menerapkan template. Silakan coba lagi.');
        logger.error('Dashboard', 'applyTemplateToStore failed: ' + (result.error || 'unknown'));
      }
    } catch (err) {
      toast.error('Gagal menerapkan template. Silakan coba lagi.');
      logger.error('Dashboard', '_applyTemplate error: ' + String(err));
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Unified confirmation + apply flow for all Dashboard template triggers
  const handleApplyTemplate = async (templateId: string, metadata?: ProjectMetadata) => {
    if (hasData) {
      showConfirm(
        'Timpa Data?',
        'Template akan menimpa data saat ini. Lanjutkan?',
        () => _applyTemplate(templateId, metadata),
      );
      return;
    }
    _applyTemplate(templateId, metadata);
  };

  // Preview dialog → Gunakan Template
  const handleUseTemplate = async (template: RegistryCourseTemplate) => {
    handleApplyTemplate(template.id, {
      title: template.name,
      mapel: template.subject !== '*' ? template.subject : undefined,
      kelas: template.grade !== '*' ? template.grade : undefined,
    });
  };

  // D-P0D.2: Dead code removed — templates[], colorMap, activeColorMap,
  // iconColorMap were for the old hardcoded template grid that was never
  // rendered in JSX. Template cards now come from CourseTemplateRegistry.

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
            onClick={() => handleApplyTemplate('template-kosong')}
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

          {/* ══ MULAI DARI TEMPLATE — HERO SECTION ════════════ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-bold text-silse-on-surface"
                  style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
                >
                  Mulai dari Template
                </h2>
                <p className="text-xs text-silse-on-surface-variant mt-0.5">Pilih template siap pakai, coba dulu, lalu edit.</p>
              </div>
              <button
                onClick={() => setWizardOpen(true)}
                className="text-xs font-semibold text-silse-primary hover:text-silse-primary/80 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>tune</span>
                Filter & Kustomisasi
              </button>
            </div>

            {/* Curated template grid — active templates from CourseTemplateRegistry */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {curatedTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setPreviewTemplate(tmpl)}
                  className="glass-card rounded-[24px] p-4 text-left transition-all cursor-pointer hover:-translate-y-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-silse-outline-variant bg-silse-surface-container-lowest hover:border-silse-primary-container/30 hover:bg-silse-primary-container/5"
                >
                  {/* Icon + badge row */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-silse-primary-container/10 flex items-center justify-center text-lg flex-shrink-0">
                      {tmpl.metadata.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-silse-on-surface truncate">{tmpl.name}</div>
                      <div className="text-[0.6rem] text-silse-on-surface-variant">
                        {tmpl.subject === '*' ? 'Semua Mapel' : tmpl.subject} · {tmpl.scenes.length} halaman
                      </div>
                    </div>
                  </div>
                  {/* Description */}
                  <p className="text-[0.65rem] text-silse-on-surface-variant line-clamp-2 mb-2">{tmpl.description}</p>
                  {/* Scene flow pills */}
                  <div className="flex flex-wrap gap-1">
                    {tmpl.scenes.slice(0, 4).map((scene, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-silse-surface-container text-silse-on-surface-variant font-medium border border-silse-outline-variant/50">
                        {scene.label}
                      </span>
                    ))}
                    {tmpl.scenes.length > 4 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-silse-primary-container/10 text-silse-primary font-medium">
                        +{tmpl.scenes.length - 4}
                      </span>
                    )}
                  </div>
                  {/* Coba Template action */}
                  <div className="mt-2.5 flex items-center gap-1 text-silse-primary text-[0.65rem] font-semibold">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>visibility</span>
                    Coba Template
                  </div>
                </button>
              ))}

              {/* Proyek Kosong card — direct action */}
              <button
                onClick={() => handleApplyTemplate('template-kosong')}
                className="rounded-[24px] p-4 text-center border-2 border-dashed border-silse-outline-variant bg-transparent hover:border-silse-primary/30 hover:bg-silse-primary/5 group transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full mb-2 mx-auto flex items-center justify-center bg-silse-primary/5 text-silse-primary group-hover:bg-silse-primary-container transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
                </div>
                <div className="text-xs font-semibold text-silse-on-surface-variant">Proyek Kosong</div>
                <div className="text-[0.65rem] text-silse-on-surface-variant mt-0.5">Mulai dari nol</div>
              </button>
            </div>

            {/* Toggle for legacy templates */}
            {legacyTemplates.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowLegacyTemplates(!showLegacyTemplates)}
                  className="flex items-center gap-2 text-[0.7rem] text-silse-on-surface-variant hover:text-silse-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {showLegacyTemplates ? 'expand_less' : 'expand_more'}
                  </span>
                  Tampilkan Template Lama ({legacyTemplates.length})
                </button>

                {/* Legacy template grid */}
                {showLegacyTemplates && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                    {legacyTemplates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => setPreviewTemplate(tmpl)}
                        className="rounded-[20px] p-3 text-left transition-all cursor-pointer hover:-translate-y-0.5 border border-silse-outline-variant/50 bg-silse-surface-container-lowest/50 hover:border-silse-outline-variant opacity-70 hover:opacity-100"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{tmpl.metadata.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[0.7rem] font-semibold text-silse-on-surface-variant truncate">{tmpl.name}</div>
                            <div className="text-[0.6rem] text-silse-on-surface-variant/70">
                              {tmpl.subject} · {tmpl.scenes.length} hal
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-silse-on-surface-variant/70 text-[0.6rem]">
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>visibility</span>
                          Coba Template
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                    // D-P0D.2: All pages are now schema-driven (pageMode:'schema').
                    // No need for SCHEMA_DRIVEN_PRESETS branching — just navigate.
                    setActivePanel('canva');
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
                  onClick={() => handleApplyTemplate('template-kosong')}
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

      {/* ══ TEMPLATE PREVIEW DIALOG ═════════════════════════════ */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}>
        <DialogContent className="bg-silse-surface border border-silse-outline-variant max-w-xl w-[95vw]">
          {previewTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-silse-primary-container/10 flex items-center justify-center text-2xl flex-shrink-0">
                    {previewTemplate.metadata.icon}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-silse-on-surface">{previewTemplate.name}</DialogTitle>
                    <DialogDescription className="text-xs text-silse-on-surface-variant mt-0.5">
                      {previewTemplate.subject === '*' ? 'Semua Mata Pelajaran' : previewTemplate.subject} · Kelas {previewTemplate.grade === '*' ? 'Semua' : previewTemplate.grade} · {previewTemplate.scenes.length} halaman
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Description */}
              <p className="text-sm text-silse-on-surface-variant">{previewTemplate.description}</p>

              {/* Scene flow */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-silse-on-surface-variant uppercase tracking-wider">Alur Halaman</span>
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar">
                  {previewTemplate.scenes.map((scene, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-silse-surface-container border border-silse-outline-variant/50">
                      <div className="w-6 h-6 rounded-lg bg-silse-primary-container/15 flex items-center justify-center text-[0.65rem] font-bold text-silse-primary flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-silse-on-surface">{scene.label}</span>
                      </div>
                      <span className="text-[0.6rem] text-silse-on-surface-variant bg-silse-surface-container-high px-1.5 py-0.5 rounded font-mono">{scene.templateType}</span>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  onClick={() => setPreviewTemplate(null)}
                  className="text-silse-on-surface-variant"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => handleUseTemplate(previewTemplate)}
                  disabled={isApplyingTemplate}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isApplyingTemplate ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      Menerapkan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                      Gunakan Template
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

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
