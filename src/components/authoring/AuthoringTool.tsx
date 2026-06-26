'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuthoringStore } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { useDirtyStore } from '@/store/dirty-store';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { keyboardManager } from '@/core/shortcuts/keyboard-manager';
import { ProjectProvider, useProjectManager } from '@/hooks/use-project-manager';
import WorkflowStepIndicator from '@/components/shared/WorkflowStepIndicator';
import TeacherModeToggle from '@/components/shared/TeacherModeToggle';
import RecoveryDialog, { setDirtyExitFlag, clearDirtyExitFlag } from '@/components/shared/RecoveryDialog';
// Sprint 8.5A: Boot recovery orchestrator — runs once at app boot to detect
// incomplete transactions, integrity issues, and crash-prone blocks.
import { bootRecoveryOrchestrator, type BootReport } from '@/core/editor/boot-recovery';
// OPTIMIZE-LAST-01: PerformanceMonitor is dev-only. Gate the dynamic import
// itself so production builds don't download the chunk at all.
const IS_DEV = process.env.NODE_ENV === 'development';
const PerformanceMonitor = IS_DEV
  ? dynamic(() => import('@/components/shared/PerformanceMonitor'), { ssr: false })
  : () => null;

// Lazy-load panels — each panel is only loaded when first rendered
const Dashboard = React.lazy(() => import('./Dashboard'));
const Dokumen = React.lazy(() => import('./Dokumen'));
const Konten = React.lazy(() => import('./Konten'));
const AutoGenerate = React.lazy(() => import('./auto-generate'));
const Projects = React.lazy(() => import('./Projects'));
const ImportExport = React.lazy(() => import('./import-export'));
const Riwayat = React.lazy(() => import('./Riwayat'));
const LivePreview = React.lazy(() => import('./live-preview'));

// Lazy-load CanvaBuilder (heavy component, SSR disabled)
// BATCH-12-02: CanvaBuilder moved to src/legacy-disabled/. AuthoringTool
// is itself legacy (not in V5 runtime graph — page.tsx imports ProductShell,
// not AuthoringTool). The dynamic import is updated to point to the new
// location. Target files have @ts-nocheck pragma so no type errors propagate.
// This file is never executed in V5 runtime.
const CanvaBuilder = dynamic(() => import('@/legacy-disabled/components/canva/CanvaBuilder'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});

// Lazy-load TemplateWizard
const TemplateWizard = dynamic(() => import('@/components/canva/TemplateWizard'), { ssr: false });

// ── Navigation items ─────────────────────────────────────────────
interface NavItem {
  id: PanelId;
  icon: string; // Material Symbols Outlined icon name
  label: string;
}

// ═══ SILSE v4 Navigation — Unified nav (mode-aware labels) ════════
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { id: 'dokumen', icon: 'edit_note', label: 'RPP & Dokumen' },
  { id: 'konten', icon: 'folder_open', label: 'Assets' },
  { id: 'canva', icon: 'palette', label: 'Edit Media' },
];

// Panel titles — mode-aware
const PANEL_TITLES_SEDERHANA: Record<PanelId, string> = {
  dashboard: 'Beranda',
  dokumen: 'RPP & Dokumen',
  konten: 'Materi Pembelajaran',
  canva: 'Desain Visual',
  autogen: 'Buat dengan AI',
  projects: 'Kelola Proyek',
  import: 'Impor / Ekspor',
  preview: 'Pratinjau',
  versions: 'Versi',
};

const PANEL_TITLES_LENGKAP: Record<PanelId, string> = {
  dashboard: 'Dashboard',
  dokumen: 'Dokumen',
  konten: 'Konten Pembelajaran',
  canva: 'Canva Editor',
  autogen: 'Auto-Generate',
  projects: 'Kelola Proyek',
  import: 'Import / Export',
  preview: 'Live Preview',
  versions: 'Riwayat Versi',
};

// ── Panel loading skeleton ──────────────────────────────────────────
function PanelSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-silse-primary border-t-transparent" />
        <p className="text-sm text-silse-on-surface-variant">Memuat...</p>
      </div>
    </div>
  );
}

// ── Preload map — triggers import on hover ─────────────────────────
const PRELOAD_MAP: Record<string, () => Promise<unknown>> = {
  dashboard: () => import('./Dashboard'),
  dokumen: () => import('./Dokumen'),
  konten: () => import('./Konten'),
  canva: () => import('@/legacy-disabled/components/canva/CanvaBuilder'),
  autogen: () => import('./auto-generate'),
  projects: () => import('./Projects'),
  import: () => import('./import-export'),
  preview: () => import('./live-preview'),
  versions: () => import('./Riwayat'),
};

function handleNavHover(panel: string) {
  PRELOAD_MAP[panel]?.();
}

// ── Guided Tour Config ──────────────────────────────────────────
const TOUR_STEPS = [
  { title: 'Sidebar', desc: 'Gunakan sidebar untuk berpindah antar panel editor.' },
  { title: 'Dashboard', desc: 'Dashboard menampilkan kelengkapan dan quick actions.' },
  { title: 'Dokumen', desc: 'Isi Meta, CP, TP, ATP, dan Alur di panel Dokumen.' },
  { title: 'Import', desc: 'Import data dari Excel atau JSON di panel Import.' },
  { title: 'Auto-Generate', desc: 'Gunakan AI untuk generate konten otomatis.' },
  { title: 'Preview', desc: 'Preview media pembelajaran sebelum export.' },
];

// ── Inner Component (needs ProjectProvider context) ─────────────
function AuthoringToolInner() {
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('at_tour_done') === null;
  });
  const [tourStep, setTourStep] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  // Sprint 8.5A: Boot report from bootRecoveryOrchestrator.run().
  // Initialized to null — populated by the boot effect after canva store loads.
  const [bootReport, setBootReport] = useState<BootReport | null>(null);
  const activePanel = useAuthoringStore((s) => s.activePanel);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const dirty = useDirtyStore((s) => s.dirty);
  const meta = useAuthoringStore((s) => s.meta);
  const loadFromStorage = useAuthoringStore((s) => s.loadFromStorage);
  const { saveProject, currentProjectId, saving } = useProjectManager();
  const { isSederhana } = useTeacherMode();

  // Mode-aware panel titles
  const panelTitles = isSederhana ? PANEL_TITLES_SEDERHANA : PANEL_TITLES_LENGKAP;

  // Load from storage on mount (authoring only — canva is loaded by StoreInit)
  // Phase 5-F: Removed duplicate CanvaStore.loadFromStorage() call.
  // StoreInit.tsx (sibling component) already calls CanvaStore.loadFromStorage()
  // which derives projection from schema and writes to AuthoringStore.
  // Calling it here would cause a double-load race condition.
  useEffect(() => {
    console.info('[APP_BOOT] AuthoringToolInner mounted');
    console.info('[APP_BOOT] loadFromStorage start, activePanel:', activePanel);
    loadFromStorage();
    clearDirtyExitFlag();
    console.info('[APP_BOOT] loadFromStorage done');
  }, [loadFromStorage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sprint 8.5A: Run boot recovery orchestrator once after stores load.
  // The orchestrator is fault-tolerant (never throws, never returns null)
  // and produces a BootReport that may surface transaction/integrity/safe-mode
  // issues. We defer the run by one tick so StoreInit has a chance to populate
  // the canva store first; otherwise pages would be empty.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const pages = useCanvaStore.getState().pages;
        const report = bootRecoveryOrchestrator.run(pages);
        if (!cancelled && report.needsRecovery) {
          setBootReport(report);
        }
      } catch {
        // Orchestrator is supposed to never throw, but if it does we
        // silently skip — RecoveryDialog will still work on localStorage
        // detection alone.
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  // ── Dirty exit flag + browser confirmation ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isDirty = useDirtyStore.getState().dirty || useCanvaStore.getState()._saveStatus === 'unsaved';
      if (isDirty) {
        setDirtyExitFlag();
        e.preventDefault();
        e.returnValue = 'Perubahan belum tersimpan. Yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Tour: dismiss / advance ──
  const dismissTour = useCallback(() => {
    setShowTour(false);
    localStorage.setItem('at_tour_done', '1');
  }, []);

  // Auto-dismiss tour when navigating away from dashboard
  if (activePanel !== 'dashboard' && showTour) {
    dismissTour();
  }

  // Unified save helper
  const saveAll = useCallback(() => {
    if (currentProjectId) {
      saveProject();
    } else {
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();
    }
  }, [currentProjectId, saveProject]);

  // ── Unified keyboard shortcuts via registry ──
  useKeyboardShortcuts([
    {
      id: 'global.save',
      keys: 'ctrl+s',
      scope: 'global',
      priority: 20,
      handler: (e) => { e.preventDefault(); saveAll(); },
      description: 'Simpan',
      category: 'App',
    },
    {
      id: 'global.toggle-preview',
      keys: 'ctrl+p',
      scope: 'global',
      priority: 15,
      handler: (e) => {
        e.preventDefault();
        const current = useAuthoringStore.getState().activePanel;
        if (current === 'preview') {
          useAuthoringStore.getState().setActivePanel('canva');
        } else {
          useAuthoringStore.getState().setActivePanel('preview');
        }
      },
      description: 'Toggle Live Preview',
      category: 'App',
    },
  ], [saveAll]);

  // ── Context switching for keyboard shortcuts ──
  useEffect(() => {
    if (activePanel === 'canva') {
      keyboardManager.setContext('canvas');
    } else if (activePanel === 'preview') {
      keyboardManager.setContext('canvas');
    } else {
      keyboardManager.setContext('authoring');
    }
  }, [activePanel]);

  // ── Cross-panel navigation from SchemaBlockTree → Konten panel ──
  useEffect(() => {
    const unsub = useCanvaStore.subscribe(
      (s) => s.kontenPanelRequest,
      (requested) => {
        if (requested) {
          setActivePanel('konten');
          useCanvaStore.setState({ kontenPanelRequest: false });
        }
      }
    );
    return unsub;
  }, [setActivePanel]);

  // ── General cross-panel navigation request ──
  useEffect(() => {
    const unsub = useCanvaStore.subscribe(
      (s) => s.panelRequest,
      (requested) => {
        if (requested) {
          setActivePanel(requested as any);
          useCanvaStore.setState({ panelRequest: null });
        }
      }
    );
    return unsub;
  }, [setActivePanel]);

  const exportJSON = useCallback(() => {
    const s = useAuthoringStore.getState();
    const c = useCanvaStore.getState();
    const data = {
      meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
      skenario: s.skenario, kuis: s.kuis, modules: s.modules,
      games: s.games, materi: s.materi,
      canva: {
        pages: c.pages,
        ratioId: c.ratioId,
        currentPageIndex: c.currentPageIndex,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authoring-tool-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const renderPanel = () => {
    const panel = (() => {
      switch (activePanel) {
        case 'dashboard': return <Dashboard />;
        case 'dokumen': return <Dokumen />;
        case 'konten': return <Konten />;
        case 'canva': return <CanvaBuilder />;
        case 'autogen': return <AutoGenerate />;
        case 'projects': return <Projects />;
        case 'import': return <ImportExport />;
        case 'preview': return <LivePreview />;
        case 'versions': return <Riwayat />;
        default: return <Dashboard />;
      }
    })();
    return (
      <Suspense fallback={<PanelSkeleton />}>
        {panel}
      </Suspense>
    );
  };

  const isCanva = activePanel === 'canva';
  const isPreview = activePanel === 'preview';

  const nextTourStep = useCallback(() => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep((s) => s + 1);
    } else {
      dismissTour();
    }
  }, [tourStep, dismissTour]);

  // ── Map active panel to sidebar nav id for highlight ──
  const getActiveNavId = (): string => {
    if (activePanel === 'dashboard') return 'dashboard';
    if (activePanel === 'dokumen') return 'dokumen';
    if (activePanel === 'konten' || activePanel === 'autogen') return 'konten';
    if (activePanel === 'canva') return 'canva';
    return activePanel;
  };

  return (
    <div className="h-screen w-screen flex bg-silse-surface-bright text-silse-on-surface overflow-hidden">
      {/* ── SILSE v4 Sidebar — MD3 Navigation Drawer, hidden in Canva/Preview mode ── */}
      {!isCanva && !isPreview && (
      <aside
        role="navigation"
        aria-label="Menu utama"
        className="w-[272px] flex-shrink-0 bg-silse-surface-container-lowest border-r border-silse-outline-variant/60 flex flex-col"
      >
        {/* ── Brand Header — SILSE v4 identity ── */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-silse-primary-container/20 flex items-center justify-center border border-silse-primary-container/30">
              <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}>school</span>
            </div>
            <div>
              <div
                className="text-lg font-bold text-silse-on-surface tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
              >
                SILSE Studio
              </div>
              <div className="text-[11px] font-medium text-silse-on-surface-variant">
                Media Pembelajaran Interaktif
              </div>
            </div>
          </div>
        </div>

        {/* ── New Project CTA — MD3 FAB-style ── */}
        <div className="px-4 pb-3">
          <button
            onClick={() => setWizardOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-silse-primary-container text-silse-on-primary-container font-bold text-sm border-b-2 border-silse-primary/40 hover:bg-silse-primary-container/90 active:scale-[0.97] transition-[transform,background-color]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
            Proyek Baru
          </button>
        </div>

        {/* ── Primary Navigation — MD3 Navigation Drawer spec ── */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto custom-scrollbar">
          {/* Section label */}
          <div className="px-3 pt-2 pb-1.5">
            <span className="text-[10px] font-bold text-silse-outline uppercase tracking-widest">Workspace</span>
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = getActiveNavId() === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setActivePanel(item.id)}
                onMouseEnter={() => handleNavHover(item.id)}
                className={`w-full flex items-center rounded-xl px-3 py-2.5 gap-3 text-[13px] font-medium transition-[background-color,color] duration-150 focus-ring ${
                  isActive
                    ? 'bg-silse-primary-container/25 text-silse-primary'
                    : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/60 hover:text-silse-on-surface'
                }`}
                title={item.label}
              >
                {/* MD3 Active indicator — left pill bar */}
                {isActive && (
                  <span className="absolute left-0 w-[3px] h-5 rounded-r-full bg-silse-primary" />
                )}
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px', fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}>{item.icon}</span>
                <span style={{ fontFamily: 'var(--font-nunito), Nunito Sans, sans-serif' }}>{item.label}</span>
              </button>
            );
          })}

          {/* ── Secondary section ── */}
          <div className="px-3 pt-4 pb-1.5">
            <span className="text-[10px] font-bold text-silse-outline uppercase tracking-widest">Alat</span>
          </div>

          {[
            { id: 'autogen' as PanelId, icon: 'auto_awesome', label: isSederhana ? 'Buat AI' : 'Auto-Generate' },
            { id: 'projects' as PanelId, icon: 'folder_open', label: isSederhana ? 'Proyek' : 'Projects' },
            { id: 'import' as PanelId, icon: 'swap_horiz', label: isSederhana ? 'Impor/Ekspor' : 'Import/Export' },
            { id: 'preview' as PanelId, icon: 'visibility', label: isSederhana ? 'Pratinjau' : 'Preview' },
            { id: 'versions' as PanelId, icon: 'schedule', label: isSederhana ? 'Versi' : 'Versions' },
          ].map((item) => {
            const isActive = activePanel === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setActivePanel(item.id)}
                onMouseEnter={() => handleNavHover(item.id)}
                className={`w-full flex items-center rounded-xl px-3 py-2 gap-3 text-[12px] transition-[background-color,color] duration-150 focus-ring ${
                  isActive
                    ? 'bg-silse-primary-container/25 text-silse-primary font-semibold'
                    : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/60 hover:text-silse-on-surface'
                }`}
                title={item.label}
              >
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px', fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Bottom Actions — Settings, Support ── */}
        <div className="px-2.5 py-2 space-y-0.5 border-t border-silse-outline-variant/40">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-silse-on-surface-variant hover:bg-silse-surface-container-high/60 hover:text-silse-on-surface transition-[background-color,color] duration-150">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>settings</span>
            <span>Pengaturan</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] text-silse-on-surface-variant hover:bg-silse-surface-container-high/60 hover:text-silse-on-surface transition-[background-color,color] duration-150">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>contact_support</span>
            <span>Bantuan</span>
          </button>
        </div>

        {/* ── User Profile + Save ── */}
        <div className="px-3 py-3 space-y-2.5 border-t border-silse-outline-variant/40 bg-silse-surface-container-lowest">
          {/* User profile card */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-silse-surface-container-high/40 transition-colors">
            <div className="w-9 h-9 rounded-full bg-silse-primary-container/20 flex items-center justify-center flex-shrink-0 border border-silse-primary-container/30">
              <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '18px' }}>school</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-silse-on-surface truncate">Guru PPKn</div>
              <div className="text-[10px] text-silse-on-surface-variant">Mode {isSederhana ? 'Sederhana' : 'Lengkap'}</div>
            </div>
            <TeacherModeToggle />
          </div>

          {/* Save + Export buttons */}
          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-silse-primary text-silse-on-primary hover:bg-silse-primary/90 w-full text-[12px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-[background-color,transform] active:scale-[0.97] disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: saving ? 'spin 1s linear infinite' : 'none' }}>save</span>
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
          <button
            onClick={exportJSON}
            className="text-silse-on-surface-variant border border-silse-outline-variant/60 hover:bg-silse-surface-container-high/60 hover:text-silse-on-surface w-full text-[12px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium transition-[background-color,color] active:scale-[0.97]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export JSON
          </button>
        </div>
      </aside>
      )}

      {/* ── Canva mode: Floating back-to-dashboard button ──── */}
      {isCanva && (
        <div className="fixed top-3 left-3 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePanel('dashboard')}
            className="bg-silse-surface-container-lowest/95 border border-silse-outline-variant/60 shadow-md text-silse-on-surface-variant hover:text-silse-on-surface gap-1.5 backdrop-blur-md rounded-xl px-3 py-1.5 text-[12px] font-semibold"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            {isSederhana ? 'Beranda' : 'Dashboard'}
          </Button>
        </div>
      )}

      {/* ── Preview mode: Floating back button ──── */}
      {isPreview && (
        <div className="fixed top-3 left-3 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActivePanel('dashboard')}
            className="bg-silse-surface-container-lowest/95 border border-silse-outline-variant/60 shadow-md text-silse-on-surface-variant hover:text-silse-on-surface gap-1.5 backdrop-blur-md rounded-xl px-3 py-1.5 text-[12px] font-semibold"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
            {isSederhana ? 'Beranda' : 'Dashboard'}
          </Button>
        </div>
      )}

      {/* ── Main Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ── Header Bar — SILSE v4 breadcrumb + actions ── */}
        {!isCanva && !isPreview && (
          <header className="h-12 flex-shrink-0 bg-silse-surface-container-lowest border-b border-silse-outline-variant/60 flex items-center gap-3 px-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-silse-on-surface-variant" style={{ fontSize: '16px' }}>{
                activePanel === 'dashboard' ? 'space_dashboard' :
                activePanel === 'dokumen' ? 'edit_note' :
                activePanel === 'konten' ? 'folder_open' :
                activePanel === 'autogen' ? 'auto_awesome' :
                activePanel === 'projects' ? 'folder_open' :
                activePanel === 'import' ? 'swap_horiz' :
                activePanel === 'versions' ? 'schedule' :
                'space_dashboard'
              }</span>
              <span className="text-[13px] font-semibold text-silse-on-surface">
                {panelTitles[activePanel]}
              </span>
              <span className="text-silse-outline-variant mx-0.5">/</span>
              <span className="text-[12px] text-silse-on-surface-variant">{meta.judulPertemuan || 'Proyek Baru'}</span>
            </div>

            {/* Dirty indicator */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 transition-opacity duration-300 ${
                  dirty ? 'bg-silse-primary pulse-dot opacity-100' : 'bg-silse-primary/50 opacity-0'
                }`}
                title={dirty ? 'Perubahan belum disimpan' : 'Tersimpan'}
              />
              {dirty && (
                <span className="text-[9px] text-silse-on-surface-variant font-medium">Belum simpan</span>
              )}
            </div>

            {/* Workflow step indicator */}
            <WorkflowStepIndicator />

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePanel('preview')}
                className="text-silse-primary border-silse-outline-variant/60 hover:bg-silse-primary/5 hover:text-silse-primary rounded-xl text-[12px] font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>visibility</span>
                {isSederhana ? 'Pratinjau' : 'Preview'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel('canva')}
                className="text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high/60 rounded-xl text-[12px] font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>palette</span>
                {isSederhana ? 'Desain' : 'Canva'}
              </Button>
              <Button
                size="sm"
                onClick={saveAll}
                disabled={saving}
                className="bg-silse-primary text-silse-on-primary hover:bg-silse-primary/90 disabled:opacity-50 font-semibold rounded-xl text-[12px] gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', animation: saving ? 'spin 1s linear infinite' : 'none' }}>save</span>
                {saving ? '...' : 'Simpan'}
              </Button>
            </div>
          </header>
        )}

        {/* ── Content ──────────────────────────────────────── */}
        <div
          key={activePanel}
          role="main"
          className={`flex-1 flex flex-col min-h-0 anim-enter-fade ${
            isCanva || isPreview ? 'overflow-hidden' : 'overflow-y-auto bg-silse-surface-bright'
          }`}
        >
          {renderPanel()}
        </div>
      </div>

      {/* ── Template Wizard Modal ── */}
      <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* ── Dev Performance Monitor (only in development) ── */}
      <PerformanceMonitor />

      {/* ── Unified Recovery Dialog ─────────────────────────── */}
      <RecoveryDialog bootReport={bootReport} />

      {/* ── Guided Tour Overlay ────────────────────────────── */}
      {showTour && activePanel === 'dashboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-silse-on-surface/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm mx-4 page-transition">
            <div className="bg-silse-surface-container-lowest border border-silse-outline-variant/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-silse-primary-container/10 px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-silse-primary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '20px' }}>location_on</span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-silse-primary/70">
                      Langkah {tourStep + 1} dari {TOUR_STEPS.length}
                    </div>
                    <h3 className="text-base font-bold text-silse-on-surface">
                      {TOUR_STEPS[tourStep]!.title}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-silse-on-surface-variant leading-relaxed">
                  {TOUR_STEPS[tourStep]!.desc}
                </p>
              </div>
              <div className="px-5 pb-2 flex justify-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === tourStep
                        ? 'w-5 bg-silse-primary'
                        : 'w-1.5 bg-silse-surface-container-high'
                    }`}
                  />
                ))}
              </div>
              <div className="px-5 pb-5 pt-3 flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={dismissTour}
                  className="px-4 py-2 text-xs font-medium"
                >
                  Lewati
                </Button>
                <Button
                  onClick={nextTourStep}
                  className="flex-1 bg-silse-primary text-silse-on-primary hover:bg-silse-primary/90 shadow-sm hover:shadow-md hover:-translate-y-px"
                >
                  {tourStep < TOUR_STEPS.length - 1 ? 'Berikutnya →' : 'Mulai ✨'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component (wraps with ProjectProvider) ────────────────
export default function AuthoringTool() {
  return (
    <ProjectProvider>
      <AuthoringToolInner />
    </ProjectProvider>
  );
}
