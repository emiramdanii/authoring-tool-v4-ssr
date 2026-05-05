'use client';

import { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
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
} from 'lucide-react';

export default function Toolbar() {
  const {
    tool,
    setTool,
    zoom,
    zoomDelta,
    ratioId,
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

  const [exporting, setExporting] = useState(false);
  const isInteractive = mode === 'interactive';
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  const handlePreview = () => {
    const html = exportPageHTML();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    toast.success('Preview dibuka di tab baru');
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

      {/* ── Action group: Preview, Export, Slideshow, Clear ──── */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handlePreview}
          title="Preview Desain Canva (buka di tab baru)"
          className="btn-ghost focus-ring"
        >
          <Eye size={14} />
          <span className="hidden xl:inline text-[9px] text-slate-600 ml-0.5">Preview</span>
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          title="Export Halaman HTML"
          className={`btn-ghost focus-ring ${exporting ? 'opacity-50 cursor-wait' : ''}`}
        >
          <Download size={14} />
        </button>
        <button
          onClick={handleExportSlideshow}
          disabled={exporting}
          title="Export Slideshow Interaktif"
          className={`btn-ghost focus-ring ${exporting ? 'opacity-50 cursor-wait' : ''}`}
        >
          <Film size={14} />
        </button>
        <button
          onClick={() => { if (confirm('Bersihkan semua elemen di halaman ini?')) clearStage(); }}
          title="Bersihkan"
          className="btn-danger focus-ring !p-1.5 !gap-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* ── Ratio badge ──────────────────────────────────────── */}
      <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-amber-400 font-mono text-[10px] ml-1">
        {ratioId}
      </span>

      {/* ── Keyboard hints (very subtle, xl only) ────────────── */}
      <div className="hidden xl:flex items-center gap-2 ml-2 text-[9px] text-slate-600">
        <span>Del=hapus</span>
        <span>Arrow=nudge</span>
        <span>Ctrl+Z=undo</span>
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
