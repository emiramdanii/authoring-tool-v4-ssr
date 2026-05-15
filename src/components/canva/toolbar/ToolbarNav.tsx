'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { AutoSaveIndicator, SaveNowButton } from '@/components/shared/StatusToast';
import { ArrowLeft, ChevronDown, Home, FileText, BookOpen, MonitorPlay, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════════
// TOOLBAR NAV — Navigation dropdown + Page label + Auto-save
// ═══════════════════════════════════════════════════════════════════
// Leftmost group in the toolbar. Provides quick navigation to
// other panels (Dashboard, Dokumen, Konten, etc.) and displays
// the current page label with save status.
// ═══════════════════════════════════════════════════════════════════

export function ToolbarNav() {
  const currentPageIndex = useCanvaStore((s) => s.currentPageIndex);
  const pages = useCanvaStore((s) => s.pages);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);

  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {/* Navigation dropdown */}
      <div className="relative" ref={navRef}>
        <Button
          variant="ghost"
          onClick={() => setNavOpen(!navOpen)}
          className="focus-ring flex items-center gap-0.5 text-app-accent hover:text-app-accent/80 h-7 px-1.5"
          title="Navigasi — Kembali ke panel lain"
        >
          <ArrowLeft size={14} />
          <ChevronDown size={8} className={`transition-transform ${navOpen ? 'rotate-180' : ''}`} />
        </Button>
        {navOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 rounded-xl bg-app-surface border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            <div className="px-3 py-1.5 bg-app-accent/10 border-b border-app-accent/20">
              <div className="text-[9px] font-bold text-app-accent uppercase tracking-wider">Navigasi</div>
            </div>
            <button
              onClick={() => { setActivePanel('dashboard'); setNavOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-accent/10 transition-colors text-left"
            >
              <Home size={14} className="text-app-accent" />
              <div>
                <div className="text-[11px] text-app-accent font-semibold">Dashboard</div>
                <div className="text-[8px] text-app-muted">Preset, kelengkapan, quick actions</div>
              </div>
            </button>
            <button
              onClick={() => { setActivePanel('dokumen'); setNavOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-accent/10 transition-colors text-left"
            >
              <FileText size={14} className="text-cyan-400" />
              <div>
                <div className="text-[11px] text-app-primary font-semibold">Dokumen</div>
                <div className="text-[8px] text-app-muted">CP, TP, ATP, Alur Pembelajaran</div>
              </div>
            </button>
            <button
              onClick={() => { setActivePanel('konten'); setNavOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-accent/10 transition-colors text-left"
            >
              <BookOpen size={14} className="text-emerald-400" />
              <div>
                <div className="text-[11px] text-app-primary font-semibold">Konten</div>
                <div className="text-[8px] text-app-muted">Kuis, Game, Materi, Skenario</div>
              </div>
            </button>
            <div className="section-divider mx-3" />
            <button
              onClick={() => { setActivePanel('preview'); setNavOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-accent/10 transition-colors text-left"
            >
              <MonitorPlay size={14} className="text-cyan-400" />
              <div>
                <div className="text-[11px] text-app-primary font-semibold">Live Preview</div>
                <div className="text-[8px] text-app-muted">Preview tampilan siswa</div>
              </div>
            </button>
            <button
              onClick={() => { setActivePanel('import'); setNavOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-accent/10 transition-colors text-left"
            >
              <Download size={14} className="text-app-secondary" />
              <div>
                <div className="text-[11px] text-app-primary font-semibold">Import / Export</div>
                <div className="text-[8px] text-app-muted">Import Excel/JSON, Export HTML</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Page label */}
      <span className="text-xs font-semibold text-app-primary min-w-0 truncate max-w-[120px]" title={label}>
        {label}
      </span>

      {/* Auto-save indicator badge */}
      <AutoSaveIndicator />

      {/* Save Now button */}
      <SaveNowButton />
    </div>
  );
}
