'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Home,
  FileText,
  BookOpen,
  Palette,
  Sparkles,
  FolderOpen,
  ArrowLeftRight,
  Clock,
  Save,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  MapPin,
} from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { PanelId } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { keyboardManager } from '@/core/shortcuts/keyboard-manager';
import { ProjectProvider, useProjectManager } from '@/hooks/use-project-manager';

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

// ── Navigation items ─────────────────────────────────────────────
interface NavItem {
  id: PanelId;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: Home, label: 'Dashboard' },
  { id: 'dokumen', icon: FileText, label: 'Dokumen' },
  { id: 'konten', icon: BookOpen, label: 'Konten' },
  { id: 'canva', icon: Palette, label: 'Canva' },
  { id: 'autogen', icon: Sparkles, label: 'Auto-Generate' },
];

const NAV_ITEMS_2: NavItem[] = [
  { id: 'projects', icon: FolderOpen, label: 'Proyek' },
  { id: 'import', icon: ArrowLeftRight, label: 'Import/Export' },
  { id: 'preview', icon: Eye, label: 'Live Preview' },
  { id: 'versions', icon: Clock, label: 'Riwayat' },
];

const PANEL_TITLES: Record<PanelId, string> = {
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-accent border-t-transparent" />
        <p className="text-sm text-app-muted">Memuat...</p>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTour, setShowTour] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('at_tour_done') === null;
  });
  const [tourStep, setTourStep] = useState(0);
  const activePanel = useAuthoringStore((s) => s.activePanel);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);
  const dirty = useAuthoringStore((s) => s.dirty);
  const meta = useAuthoringStore((s) => s.meta);
  const loadFromStorage = useAuthoringStore((s) => s.loadFromStorage);
  const { saveProject, currentProjectId, saving } = useProjectManager();

  // Load from storage on mount (authoring + canva)
  useEffect(() => {
    loadFromStorage();
    // Also load canva state from localStorage on first app mount
    useCanvaStore.getState().loadFromStorage();
  }, [loadFromStorage]);

  // ── Tour: dismiss / advance ────────────────────────────────
  const dismissTour = useCallback(() => {
    setShowTour(false);
    localStorage.setItem('at_tour_done', '1');
  }, []);

  // Auto-dismiss tour when user navigates away from dashboard (e.g. clicks preset)
  useEffect(() => {
    if (activePanel !== 'dashboard' && showTour) {
      dismissTour();
    }
  }, [activePanel, showTour, dismissTour]);

  // Unified save helper — saves to DB if project is loaded, else localStorage
  const saveAll = useCallback(() => {
    if (currentProjectId) {
      saveProject();
    } else {
      // Fallback: save to localStorage only
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();
    }
  }, [currentProjectId, saveProject]);

  // ── Unified keyboard shortcuts via registry ───────────────────
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

  // ── Context switching for keyboard shortcuts ───────────────────
  useEffect(() => {
    if (activePanel === 'canva') {
      keyboardManager.setContext('canvas');
    } else if (activePanel === 'preview') {
      keyboardManager.setContext('canvas');
    } else {
      keyboardManager.setContext('authoring');
    }
  }, [activePanel]);

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

  return (
    <div className="h-screen w-screen flex bg-app-surface text-app-primary overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        role="navigation"
        aria-label="Menu utama"
        className={`${
          sidebarOpen ? 'w-56' : 'w-14'
        } flex-shrink-0 glass-panel-strong flex flex-col transition-all duration-300 ease-in-out`}
        style={{ minHeight: '100vh' }}
      >
        {/* Logo */}
        <div className="px-4 py-4">
          {sidebarOpen ? (
            <div>
              <div className="text-sm font-bold text-app-accent">Authoring Tool</div>
              <div className="text-[0.65rem] text-app-muted mt-0.5">Media Pembelajaran Interaktif</div>
              <span className="inline-block mt-1.5 bg-app-accent/10 text-app-accent px-2 py-0.5 rounded-full text-[0.6rem] font-semibold border border-app-accent/20">
                v4.0
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-lg text-app-accent font-bold">Z</span>
            </div>
          )}
        </div>

        <div className="section-divider" />

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                onMouseEnter={() => handleNavHover(item.id)}
                className={`w-full flex items-center rounded-xl px-3 py-2.5 gap-3 text-sm transition-colors focus-ring ${
                  activePanel === item.id
                    ? 'nav-active font-semibold'
                    : 'text-app-secondary hover:bg-app-elevated/60 hover:text-app-primary'
                }`}
                title={item.label}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}

          {/* Divider */}
          <div className="section-divider my-2" />

          {NAV_ITEMS_2.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                onMouseEnter={() => handleNavHover(item.id)}
                className={`w-full flex items-center rounded-xl px-3 py-2.5 gap-3 text-sm transition-colors focus-ring ${
                  activePanel === item.id
                    ? 'nav-active font-semibold'
                    : 'text-app-secondary hover:bg-app-elevated/60 hover:text-app-primary'
                }`}
                title={item.label}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        {sidebarOpen ? (
          <div className="px-3 py-3 space-y-1.5">
            <div className="section-divider mb-2" />
            <button
              onClick={saveAll}
              disabled={saving}
              className="bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px w-full text-xs inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-bold transition-all disabled:opacity-60"
            >
              <Save size={14} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
            <button
              onClick={exportJSON}
              className="text-app-accent border-app-accent/20 bg-app-accent/10 hover:bg-app-accent/18 hover:border-app-accent/35 w-full text-xs inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-bold transition-all"
            >
              <Download size={14} />
              Export JSON
            </button>
          </div>
        ) : (
          <div className="px-2 py-3 space-y-2 flex flex-col items-center">
            <div className="section-divider w-full mb-2" />
            <button
              onClick={saveAll}
              disabled={saving}
              className="tooltip-trigger focus-ring"
              data-tip="Simpan"
            >
              <Save size={16} className={`text-app-accent ${saving ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportJSON}
              className="tooltip-trigger focus-ring"
              data-tip="Export JSON"
            >
              <Download size={16} className="text-app-accent/70" />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ── Header ───────────────────────────────────────── */}
        {!isCanva && !isPreview && (
          <header className="h-12 flex-shrink-0 glass-panel-strong flex items-center gap-3 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </Button>

            <div className="text-sm font-medium text-app-primary">
              {PANEL_TITLES[activePanel]}
              <span className="text-app-muted font-normal"> / {meta.judulPertemuan || 'Proyek Baru'}</span>
            </div>

            {/* Dirty indicator */}
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 bg-app-accent transition-opacity duration-300 ${
                dirty ? 'pulse-dot opacity-100' : 'opacity-0'
              }`}
              title="Perubahan belum disimpan"
            />

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setActivePanel('preview')}
                className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/18 hover:border-emerald-500/35"
              >
                <Eye size={14} />
                Preview
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActivePanel('canva')}
              >
                <Palette size={14} />
                Canva
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActivePanel('import')}
              >
                <ArrowLeftRight size={14} />
                Import
              </Button>
              <Button
                onClick={saveAll}
                disabled={saving}
                className="bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-60"
              >
                <Save size={14} className={saving ? 'animate-spin' : ''} />
                {saving ? '...' : 'Simpan'}
              </Button>
            </div>
          </header>
        )}

        {/* ── Content ──────────────────────────────────────── */}
        <main
          role="main"
          className={`flex-1 flex flex-col min-h-0 ${
            isCanva || isPreview ? 'overflow-hidden' : 'overflow-y-auto bg-app-surface'
          }`}
        >
          {renderPanel()}
        </main>
      </div>

      {/* ── Guided Tour Overlay ────────────────────────────── */}
      {showTour && activePanel === 'dashboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-app-overlay backdrop-blur-sm" />

          {/* Tooltip Card */}
          <div className="relative z-10 w-full max-w-sm mx-4 page-transition">
            <div className="bg-app-surface border border-app-border/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Step icon + badge */}
              <div className="bg-app-accent/10 px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-app-accent/20 flex items-center justify-center">
                    <MapPin size={20} className="text-app-accent" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-app-accent/70">
                      Langkah {tourStep + 1} dari {TOUR_STEPS.length}
                    </div>
                    <h3 className="text-base font-bold text-app-primary">
                      {TOUR_STEPS[tourStep].title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-4">
                <p className="text-sm text-app-secondary leading-relaxed">
                  {TOUR_STEPS[tourStep].desc}
                </p>
              </div>

              {/* Step dots */}
              <div className="px-5 pb-2 flex justify-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === tourStep
                        ? 'w-5 bg-app-accent'
                        : 'w-1.5 bg-app-elevated'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
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
                  className="flex-1 bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px"
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
