'use client';

import { useState, useEffect, useCallback } from 'react';
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

import Dashboard from './Dashboard';
import Dokumen from './Dokumen';
import Konten from './Konten';
import AutoGenerate from './auto-generate';
import Projects from './Projects';
import ImportExport from './import-export';
import Riwayat from './Riwayat';
import LivePreview from './LivePreview';

// Lazy-load CanvaBuilder (heavy component, SSR disabled)
const CanvaBuilder = dynamic(() => import('@/components/canva/CanvaBuilder'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Palette className="mx-auto mb-4 size-10 text-amber-400 animate-pulse" />
        <div className="text-slate-400 text-sm">Memuat Canva Editor...</div>
      </div>
    </div>
  ),
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

// ── Guided Tour Config ──────────────────────────────────────────
const TOUR_STEPS = [
  { title: 'Sidebar', desc: 'Gunakan sidebar untuk berpindah antar panel editor.' },
  { title: 'Dashboard', desc: 'Dashboard menampilkan kelengkapan dan quick actions.' },
  { title: 'Dokumen', desc: 'Isi Meta, CP, TP, ATP, dan Alur di panel Dokumen.' },
  { title: 'Import', desc: 'Import data dari Excel atau JSON di panel Import.' },
  { title: 'Auto-Generate', desc: 'Gunakan AI untuk generate konten otomatis.' },
  { title: 'Preview', desc: 'Preview media pembelajaran sebelum export.' },
];

// ── Main Component ──────────────────────────────────────────────
export default function AuthoringTool() {
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
  const saveToStorage = useAuthoringStore((s) => s.saveToStorage);
  const loadFromStorage = useAuthoringStore((s) => s.loadFromStorage);

  // Load from storage on mount (authoring + canva)
  useEffect(() => {
    loadFromStorage();
    // Also load canva state from localStorage on first app mount
    useCanvaStore.getState().loadFromStorage();
  }, [loadFromStorage]);

  // Auto-dismiss tour when user navigates away from dashboard (e.g. clicks preset)
  useEffect(() => {
    if (activePanel !== 'dashboard' && showTour) {
      dismissTour();
    }
  }, [activePanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save every 8s when dirty — delegates to store's saveToStorage()
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      const s = useAuthoringStore.getState();
      if (s.dirty) {
        s.saveToStorage(); // Uses store method (single source of truth, with toast)
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [dirty]);

  // ── Reactive sync: authoring data → canvas templateData ─────
  // NOTE: Auto-sync is now handled by sync-slice.ts startAutoSync() (100ms debounce).
  // Previously there was a duplicate 300ms subscription here causing double-renders.
  // That has been removed to avoid redundant sync calls.

  // Keyboard shortcut: Ctrl+S to save, Ctrl+P to toggle Live Preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToStorage();
      }
      // Ctrl+P → toggle Live Preview panel (only when not in text input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        const target = e.target as HTMLElement;
        if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        const current = useAuthoringStore.getState().activePanel;
        if (current === 'preview') {
          setActivePanel('canva');
        } else {
          setActivePanel('preview');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToStorage, setActivePanel]);

  const exportJSON = useCallback(() => {
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
    a.download = `authoring-tool-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const renderPanel = () => {
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
  };

  // For Canva panel, render full-bleed (no padding)
  const isCanva = activePanel === 'canva';
  // For Preview panel, render full-bleed (no header)
  const isPreview = activePanel === 'preview';

  // ── Tour: dismiss / advance ────────────────────────────────
  const dismissTour = useCallback(() => {
    setShowTour(false);
    localStorage.setItem('at_tour_done', '1');
  }, []);

  const nextTourStep = useCallback(() => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep((s) => s + 1);
    } else {
      dismissTour();
    }
  }, [tourStep, dismissTour]);

  return (
    <div className="h-screen w-screen flex bg-slate-900 text-slate-200 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-14'
        } flex-shrink-0 glass-panel-strong flex flex-col transition-all duration-300 ease-in-out`}
        style={{ minHeight: '100vh' }}
      >
        {/* Logo */}
        <div className="px-4 py-4">
          {sidebarOpen ? (
            <div>
              <div className="text-sm font-bold text-amber-400">Authoring Tool</div>
              <div className="text-[0.65rem] text-slate-500 mt-0.5">Media Pembelajaran Interaktif</div>
              <span className="inline-block mt-1.5 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold border border-amber-500/20">
                v6
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-amber-400 font-bold text-lg">Z</span>
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
                className={`w-full flex items-center rounded-xl px-3 py-2.5 gap-3 text-sm transition-colors focus-ring ${
                  activePanel === item.id
                    ? 'nav-active font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
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
                className={`w-full flex items-center rounded-xl px-3 py-2.5 gap-3 text-sm transition-colors focus-ring ${
                  activePanel === item.id
                    ? 'nav-active font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
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
              onClick={saveToStorage}
              className="btn-primary w-full text-xs"
            >
              <Save size={14} />
              Simpan Semua
            </button>
            <button
              onClick={exportJSON}
              className="btn-accent w-full text-xs"
            >
              <Download size={14} />
              Export JSON
            </button>
          </div>
        ) : (
          <div className="px-2 py-3 space-y-2 flex flex-col items-center">
            <div className="section-divider w-full mb-2" />
            <button
              onClick={saveToStorage}
              className="tooltip-trigger focus-ring"
              data-tip="Simpan"
            >
              <Save size={16} className="text-amber-400" />
            </button>
            <button
              onClick={exportJSON}
              className="tooltip-trigger focus-ring"
              data-tip="Export JSON"
            >
              <Download size={16} className="text-amber-300/70" />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Header ───────────────────────────────────────── */}
        {!isCanva && !isPreview && (
          <header className="h-12 flex-shrink-0 glass-panel-strong flex items-center gap-3 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost"
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>

            <div className="text-sm font-medium text-slate-200">
              {PANEL_TITLES[activePanel]}
              <span className="text-slate-500 font-normal"> / {meta.judulPertemuan || 'Proyek Baru'}</span>
            </div>

            {/* Dirty indicator */}
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 bg-amber-400 transition-opacity duration-300 ${
                dirty ? 'pulse-dot opacity-100' : 'opacity-0'
              }`}
              title="Perubahan belum disimpan"
            />

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setActivePanel('preview')}
                className="btn-success"
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                onClick={() => setActivePanel('canva')}
                className="btn-ghost"
              >
                <Palette size={14} />
                Canva
              </button>
              <button
                onClick={() => setActivePanel('import')}
                className="btn-ghost"
              >
                <ArrowLeftRight size={14} />
                Import
              </button>
              <button
                onClick={saveToStorage}
                className="btn-primary"
              >
                <Save size={14} />
                Simpan
              </button>
            </div>
          </header>
        )}

        {/* ── Content ──────────────────────────────────────── */}
        <main
          className={`flex-1 ${
            isCanva || isPreview ? 'overflow-hidden' : 'overflow-y-auto bg-slate-900'
          }`}
        >
          {renderPanel()}
        </main>
      </div>

      {/* ── Guided Tour Overlay ────────────────────────────── */}
      {showTour && activePanel === 'dashboard' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Tooltip Card */}
          <div className="relative z-10 w-full max-w-sm mx-4 page-transition">
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Step icon + badge */}
              <div className="bg-amber-500/10 px-5 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <MapPin size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-amber-400/70">
                      Langkah {tourStep + 1} dari {TOUR_STEPS.length}
                    </div>
                    <h3 className="text-base font-bold text-slate-100">
                      {TOUR_STEPS[tourStep].title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 py-4">
                <p className="text-sm text-slate-300 leading-relaxed">
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
                        ? 'w-5 bg-amber-500'
                        : 'w-1.5 bg-slate-600'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-3 flex items-center gap-3">
                <button
                  onClick={dismissTour}
                  className="btn-ghost px-4 py-2 text-xs font-medium"
                >
                  Lewati
                </button>
                <button
                  onClick={nextTourStep}
                  className="btn-primary flex-1"
                >
                  {tourStep < TOUR_STEPS.length - 1 ? 'Berikutnya →' : 'Mulai ✨'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
