'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard,
  FileEdit,
  FolderOpen,
  BarChart3,
  Settings,
  LifeBuoy,
  PlusCircle,
  ArrowLeft,
  Save,
  Download,
  Eye,
  Palette,
  MapPin,
  GraduationCap,
  ArrowLeftRight,
  Clock,
  Sparkles,
} from 'lucide-react';
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
const PerformanceMonitor = dynamic(() => import('@/components/shared/PerformanceMonitor'), { ssr: false });

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
const CanvaBuilder = dynamic(() => import('@/components/canva/CanvaBuilder'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});

// Lazy-load TemplateWizard
const TemplateWizard = dynamic(() => import('@/components/canva/TemplateWizard'), { ssr: false });

// ── Navigation items ─────────────────────────────────────────────
interface NavItem {
  id: PanelId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

// ═══ SILSE v4 Navigation — Unified nav (mode-aware labels) ════════
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'dokumen', icon: FileEdit, label: 'Workspace' },
  { id: 'konten', icon: FolderOpen, label: 'Assets' },
  { id: 'canva', icon: BarChart3, label: 'Analytics' },
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
  canva: () => import('@/components/canva/CanvaBuilder'),
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
  const activePanel = useAuthoringStore((s) => s.activePanel);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const dirty = useDirtyStore((s) => s.dirty);
  const meta = useAuthoringStore((s) => s.meta);
  const loadFromStorage = useAuthoringStore((s) => s.loadFromStorage);
  const { saveProject, currentProjectId, saving } = useProjectManager();
  const { isSederhana } = useTeacherMode();

  // Mode-aware panel titles
  const panelTitles = isSederhana ? PANEL_TITLES_SEDERHANA : PANEL_TITLES_LENGKAP;

  // Load from storage on mount (authoring + canva)
  useEffect(() => {
    loadFromStorage();
    useCanvaStore.getState().loadFromStorage();
    clearDirtyExitFlag();
  }, [loadFromStorage]);

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
    if (activePanel === 'canva' || activePanel === 'preview') return 'canva';
    return activePanel;
  };

  return (
    <div className="h-screen w-screen flex bg-silse-surface-bright text-silse-on-surface overflow-hidden">
      {/* ── SILSE v4 Sidebar — Fixed w-64, hidden in Canva mode ── */}
      {!isCanva && !isPreview && (
      <aside
        role="navigation"
        aria-label="Menu utama"
        className="w-64 flex-shrink-0 bg-silse-surface-bright border-r border-silse-outline-variant flex flex-col"
        style={{ minHeight: '100vh' }}
      >
        {/* ── Brand / Logo ── */}
        <div className="px-6 pt-6 pb-4">
          <div
            className="text-2xl font-bold text-silse-primary tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
          >
            Authoring Studio
          </div>
          <div className="text-sm font-bold text-silse-on-surface-variant mt-1">
            SMP Education Portal
          </div>
        </div>

        {/* ── New Project Button ── */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setWizardOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-silse-primary-container text-silse-on-primary-container font-bold border-b-2 border-silse-primary hover:scale-95 transition-transform"
          >
            <PlusCircle size={18} />
            New Project
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = getActiveNavId() === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setActivePanel(item.id)}
                onMouseEnter={() => handleNavHover(item.id)}
                className={`w-full flex items-center rounded-xl px-4 py-3 gap-3 text-sm font-medium transition-all focus-ring hover:translate-x-1 ${
                  isActive
                    ? 'bg-silse-primary-container text-silse-on-primary-container'
                    : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high'
                }`}
                title={item.label}
              >
                <Icon size={20} className={`flex-shrink-0 ${isActive ? '[fill:currentColor]' : ''}`} />
                <span style={{ fontFamily: 'var(--font-nunito), Nunito Sans, sans-serif' }}>{item.label}</span>
              </button>
            );
          })}

          {/* ── Secondary nav items ── */}
          <div className="section-divider my-3" />

          {[
            { id: 'autogen' as PanelId, icon: Sparkles, label: isSederhana ? 'Buat AI' : 'Auto-Generate' },
            { id: 'projects' as PanelId, icon: FolderOpen, label: isSederhana ? 'Proyek' : 'Projects' },
            { id: 'import' as PanelId, icon: ArrowLeftRight, label: isSederhana ? 'Impor/Ekspor' : 'Import/Export' },
            { id: 'preview' as PanelId, icon: Eye, label: isSederhana ? 'Pratinjau' : 'Preview' },
            { id: 'versions' as PanelId, icon: Clock, label: isSederhana ? 'Versi' : 'Versions' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activePanel === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setActivePanel(item.id)}
                onMouseEnter={() => handleNavHover(item.id)}
                className={`w-full flex items-center rounded-xl px-4 py-2.5 gap-3 text-[13px] transition-all focus-ring hover:translate-x-1 ${
                  isActive
                    ? 'bg-silse-primary-container text-silse-on-primary-container font-medium'
                    : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high'
                }`}
                title={item.label}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Bottom Section ── */}
        <div className="border-t border-silse-outline-variant px-3 py-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:translate-x-1 transition-all">
            <Settings size={18} className="flex-shrink-0" />
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:translate-x-1 transition-all">
            <LifeBuoy size={18} className="flex-shrink-0" />
            <span>Support</span>
          </button>

          {/* User profile */}
          <div className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-silse-primary-container flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} className="text-silse-on-primary-container" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-silse-on-surface truncate">Guru PPKn</div>
              <div className="text-[0.65rem] text-silse-on-surface-variant">Mode {isSederhana ? 'Sederhana' : 'Lengkap'}</div>
            </div>
          </div>
        </div>

        {/* ── Teacher Mode Toggle + Save/Export ── */}
        <div className="px-3 py-3 space-y-2 border-t border-silse-outline-variant">
          <TeacherModeToggle />
          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-silse-primary text-silse-on-primary hover:bg-silse-primary/90 w-full text-xs inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-colors disabled:opacity-50"
          >
            <Save size={14} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
          <button
            onClick={exportJSON}
            className="text-silse-on-surface-variant border border-silse-outline-variant hover:bg-silse-surface-container-high hover:text-silse-on-surface w-full text-xs inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-colors"
          >
            <Download size={14} />
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
            className="bg-silse-surface-container-lowest/90 border border-silse-outline-variant shadow-sm text-silse-on-surface-variant hover:text-silse-on-surface gap-1.5 backdrop-blur-sm"
          >
            <ArrowLeft size={14} />
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
            className="bg-silse-surface-container-lowest/90 border border-silse-outline-variant shadow-sm text-silse-on-surface-variant hover:text-silse-on-surface gap-1.5 backdrop-blur-sm"
          >
            <ArrowLeft size={14} />
            {isSederhana ? 'Beranda' : 'Dashboard'}
          </Button>
        </div>
      )}

      {/* ── Main Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ── Thin Header Bar (breadcrumb + actions) ── */}
        {!isCanva && !isPreview && (
          <header className="h-12 flex-shrink-0 bg-silse-surface-container-lowest border-b border-silse-outline-variant flex items-center gap-3 px-5">
            <div className="text-sm font-medium text-silse-on-surface">
              {panelTitles[activePanel]}
              <span className="text-silse-on-surface-variant font-normal ml-1">/ {meta.judulPertemuan || 'Proyek Baru'}</span>
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
                className="text-silse-primary border-silse-outline-variant hover:bg-silse-surface-container-high hover:text-silse-primary"
              >
                <Eye size={14} />
                {isSederhana ? 'Pratinjau' : 'Preview'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivePanel('canva')}
                className="text-silse-on-surface-variant hover:text-silse-on-surface"
              >
                <Palette size={14} />
                {isSederhana ? 'Desain' : 'Canva'}
              </Button>
              <Button
                size="sm"
                onClick={saveAll}
                disabled={saving}
                className="bg-silse-primary text-silse-on-primary hover:bg-silse-primary/90 disabled:opacity-50 font-medium"
              >
                <Save size={14} className={saving ? 'animate-spin' : ''} />
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
      <RecoveryDialog />

      {/* ── Guided Tour Overlay ────────────────────────────── */}
      {showTour && activePanel === 'dashboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-app-overlay backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm mx-4 page-transition">
            <div className="bg-silse-surface-container-lowest border border-silse-outline-variant/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-silse-primary-container/10 px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-silse-primary-container/20 flex items-center justify-center">
                    <MapPin size={20} className="text-silse-primary" />
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
