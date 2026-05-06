'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import {
  Play,
  Undo2,
  Redo2,
  MousePointer2,
  Type,
  Eye,
  Download,
  Film,
  Trash2,
  Minus,
  Plus,
  PanelRight,
  X,
  ChevronDown,
  Save,
  CheckCircle2,
  Loader2,
  MonitorPlay,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Phase 2: Toolbar cleanup
// - Export → dropdown (Preview + Export Page + Export Slideshow)
// - Save indicator ("Tersimpan" / "Menyimpan...")
// - Clear moved inside Export dropdown (safer, less accidental clicks)
// - Ratio badge clickable → dropdown for ratio selection
// ═══════════════════════════════════════════════════════════════

export default function Toolbar() {
  const {
    tool,
    setTool,
    zoom,
    zoomDelta,
    ratioId,
    setRatio,
    clearStage,
    exportPageHTML,
    exportSlideshowHTML,
    currentPageIndex,
    pages,
    undo,
    redo,
    canUndo,
    canRedo,
    rightPanelOpen,
    toggleRightPanel,
  } = useCanvaStore();

  const mode = useInteractiveStore((s) => s.mode);
  const openPlay = useInteractiveStore((s) => s.openPlay);
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);

  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef<HTMLDivElement>(null);

  const isInteractive = mode === 'interactive';
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  // ── Save indicator state ────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Auto-save: watch for page changes
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      useCanvaStore.getState().saveToStorage();
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(timer);
  }, [pages, ratioId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (ratioRef.current && !ratioRef.current.contains(e.target as Node)) setRatioOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePreview = () => {
    const html = exportPageHTML();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    toast.success('Preview halaman dibuka di tab baru');
    setExportOpen(false);
  };

  const handlePreviewSlideshow = () => {
    requestAnimationFrame(() => {
      try {
        const html = exportSlideshowHTML();
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
        toast.success(`Slideshow preview dibuka (${pages.length} halaman)`);
      } catch (err) {
        toast.error('Gagal membuat preview slideshow');
      }
    });
    setExportOpen(false);
  };

  const handleExport = () => {
    setExporting(true);
    toast.loading('Mengekspor halaman...', { id: 'export-page' });
    requestAnimationFrame(() => {
      try {
        const html = exportPageHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canva-page-${currentPageIndex + 1}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success('Halaman diekspor sebagai HTML', { id: 'export-page' });
      } catch (err) {
        toast.error('Gagal mengekspor halaman', { id: 'export-page' });
      } finally {
        setExporting(false);
      }
    });
    setExportOpen(false);
  };

  const handleExportSlideshow = () => {
    setExporting(true);
    toast.loading(`Mengekspor ${pages.length} halaman...`, { id: 'export-slideshow' });
    requestAnimationFrame(() => {
      try {
        const html = exportSlideshowHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canva-slideshow.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(`Slideshow diekspor (${pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB)`, { id: 'export-slideshow' });
      } catch (err) {
        toast.error('Gagal mengekspor slideshow', { id: 'export-slideshow' });
      } finally {
        setExporting(false);
      }
    });
    setExportOpen(false);
  };

  const handleClear = () => {
    if (confirm('Bersihkan semua elemen di halaman ini? Tindakan ini bisa di-undo.')) clearStage();
    setExportOpen(false);
  };

  // ── Interactive mode toolbar (minimal) ─────────────────────
  if (isInteractive) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">
        {/* Green dot indicator */}
        <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
        {/* Page label */}
        <span className="text-xs font-semibold text-emerald-300 min-w-0 truncate max-w-[140px]">
          {label}
        </span>
        <div className="section-divider h-5 w-px mx-1" />
        {/* Navigation hint */}
        <span className="text-[10px] text-emerald-400/60 ml-1">
          ← → navigasi • Esc tutup
        </span>
        <div className="flex-1" />
        {/* Close button */}
        <button
          onClick={closePlay}
          className="btn-danger focus-ring"
          title="Tutup mode interaktif (Esc)"
        >
          <X size={12} />
          <span className="hidden sm:inline">Tutup</span>
        </button>
      </div>
    );
  }

  // ── Design mode toolbar ────────────────────────────────────
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">

      {/* ── Left group: Logo/Brand ────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold text-slate-200 min-w-0 truncate max-w-[140px]">
          {label}
        </span>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Play Button (MAIN action) ────────────────────────── */}
      <button
        onClick={openPlay}
        title="Play Preview — Preview interaktif dengan kuis, game, dan skor"
        className="btn-success focus-ring"
      >
        <Play size={13} fill="currentColor" />
        <span>Play</span>
      </button>

      {/* ── Slideshow Preview Button (opens in new tab) ── */}
      <button
        onClick={handlePreviewSlideshow}
        title="Preview Slideshow — Buka preview interaktif semua halaman di tab baru"
        className="btn-ghost focus-ring flex items-center gap-0.5 !text-teal-400 hover:!text-teal-300"
      >
        <Film size={14} />
        <span className="hidden md:inline text-[9px] font-semibold">Slideshow</span>
      </button>

      {/* ── Live Preview Button → Navigate to Preview Panel ── */}
      <button
        onClick={() => setActivePanel('preview')}
        title="Live Preview — Buka panel Live Preview dengan mode Canvas/Template/Legacy, tema, dan device frame"
        className="btn-ghost focus-ring flex items-center gap-0.5 !text-cyan-400 hover:!text-cyan-300"
      >
        <MonitorPlay size={14} />
        <span className="hidden md:inline text-[9px] font-semibold">Live</span>
      </button>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── History group: Undo / Redo ───────────────────────── */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
          className={`btn-ghost focus-ring ${!canUndo() ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
          className={`btn-ghost focus-ring ${!canRedo() ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Redo2 size={14} />
        </button>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Tool group: Select / Text ────────────────────────── */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setTool('select')}
          className={`focus-ring rounded-lg p-1.5 transition-all ${
            tool === 'select'
              ? 'nav-active'
              : 'btn-ghost'
          }`}
          title="Select (V)"
        >
          <MousePointer2 size={14} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`focus-ring rounded-lg p-1.5 transition-all ${
            tool === 'text'
              ? 'nav-active'
              : 'btn-ghost'
          }`}
          title="Text (T)"
        >
          <Type size={14} />
        </button>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Export Dropdown (merged Preview + Export Page + Export Slideshow + Clear) ── */}
      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen(!exportOpen)}
          disabled={exporting}
          className={`btn-ghost focus-ring flex items-center gap-0.5 ${exporting ? 'opacity-50' : ''}`}
          title="Export & Aksi"
        >
          <Download size={14} />
          <span className="hidden md:inline text-[9px]">Export</span>
          <ChevronDown size={10} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
        </button>
        {exportOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 rounded-xl glass-panel-strong border border-slate-700/40 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            <button
              onClick={handlePreviewSlideshow}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-slate-800/50 transition-colors text-left"
            >
              <MonitorPlay size={14} className="text-cyan-400" />
              <div>
                <div className="text-[11px] text-slate-200 font-semibold">▶ Preview Slideshow di Tab Baru</div>
                <div className="text-[8px] text-slate-500">{pages.length} halaman interaktif lengkap</div>
              </div>
            </button>
            <button
              onClick={handlePreview}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-slate-800/50 transition-colors text-left"
            >
              <Eye size={14} className="text-slate-400" />
              <div>
                <div className="text-[11px] text-slate-200 font-semibold">Preview Halaman di Tab Baru</div>
                <div className="text-[8px] text-slate-500">Hanya halaman saat ini</div>
              </div>
            </button>
            <button
              onClick={handleExport}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-slate-800/50 transition-colors text-left"
            >
              <Download size={14} className="text-amber-400" />
              <div>
                <div className="text-[11px] text-slate-200 font-semibold">Export Halaman HTML</div>
                <div className="text-[8px] text-slate-500">Download halaman saat ini</div>
              </div>
            </button>
            <button
              onClick={handleExportSlideshow}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-slate-800/50 transition-colors text-left"
            >
              <Film size={14} className="text-teal-400" />
              <div>
                <div className="text-[11px] text-slate-200 font-semibold">Export Slideshow Interaktif</div>
                <div className="text-[8px] text-slate-500">{pages.length} halaman dengan skor & kuis</div>
              </div>
            </button>
            <div className="section-divider mx-3" />
            <button
              onClick={handleClear}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 size={14} className="text-red-400/60" />
              <div>
                <div className="text-[11px] text-red-400/70 font-semibold">Bersihkan Halaman</div>
                <div className="text-[8px] text-slate-500">Hapus semua elemen (bisa undo)</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ── Ratio badge (clickable dropdown) ────────────────── */}
      <div className="relative" ref={ratioRef}>
        <button
          onClick={() => setRatioOpen(!ratioOpen)}
          className="px-2 py-0.5 rounded-md bg-slate-800/60 text-amber-400 font-mono text-[10px] ml-1 hover:bg-slate-700/60 transition-colors flex items-center gap-0.5"
        >
          {ratioId}
          <ChevronDown size={8} className={`transition-transform ${ratioOpen ? 'rotate-180' : ''}`} />
        </button>
        {ratioOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 rounded-xl glass-panel-strong border border-slate-700/40 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            {[
              { id: '16:9', name: '16:9', desc: 'Landscape PPT' },
              { id: '9:16', name: '9:16', desc: 'Portrait HP' },
              { id: '1:1', name: '1:1', desc: 'Square Post' },
              { id: 'A4', name: 'A4', desc: 'Dokumen LKS' },
              { id: '4:3', name: '4:3', desc: 'Presentasi Lama' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => { setRatio(r.id); setRatioOpen(false); }}
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors ${
                  ratioId === r.id ? 'text-amber-400 bg-amber-500/5' : 'text-slate-300'
                }`}
              >
                <span className="text-[11px] font-mono font-bold">{r.name}</span>
                <span className="text-[8px] text-slate-500">{r.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Save indicator ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 ml-2">
        {saveStatus === 'saved' ? (
          <>
            <CheckCircle2 size={12} className="text-emerald-500/60" />
            <span className="text-[9px] text-emerald-500/60 hidden lg:inline">Tersimpan</span>
          </>
        ) : (
          <>
            <Loader2 size={12} className="text-amber-400/60 animate-spin" />
            <span className="text-[9px] text-amber-400/60 hidden lg:inline">Menyimpan...</span>
          </>
        )}
      </div>

      {/* ── Right group: Zoom + Panel toggle ─────────────────── */}
      <div className="flex items-center gap-0.5 ml-auto">
        {/* Right panel toggle */}
        <button
          onClick={toggleRightPanel}
          title={rightPanelOpen ? 'Sembunyikan Panel Kanan' : 'Tampilkan Panel Kanan'}
          className={`btn-ghost focus-ring ${rightPanelOpen ? '!text-amber-400' : ''}`}
        >
          <PanelRight size={14} />
        </button>

        <div className="section-divider h-5 w-px mx-1" />

        {/* Zoom controls */}
        <button
          onClick={() => zoomDelta(-0.1)}
          className="btn-ghost focus-ring"
          title="Zoom out"
        >
          <Minus size={13} />
        </button>
        <span className="text-[11px] font-mono text-slate-400 w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => zoomDelta(0.1)}
          className="btn-ghost focus-ring"
          title="Zoom in"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
