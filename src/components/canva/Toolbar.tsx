'use client';

import { useCanvaStore } from '@/store/canva-store';
import { toast } from 'sonner';

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

  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';

  const handlePreview = () => {
    const html = exportPageHTML();
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    toast.success('Preview dibuka di tab baru');
  };

  const handleExport = () => {
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
    toast.success('Halaman diekspor sebagai HTML');
  };

  const handleExportSlideshow = () => {
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
    toast.success('Slideshow diekspor (' + pages.length + ' halaman)');
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-700/50 text-xs select-none">
      {/* Logo + Title */}
      <span className="text-sm">🎨</span>
      <span className="font-bold text-zinc-100 min-w-0 truncate max-w-[140px]">{label}</span>
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={!canUndo()}
        title="Undo (Ctrl+Z)"
        className={`p-1 rounded transition-colors ${canUndo() ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        title="Redo (Ctrl+Y)"
        className={`p-1 rounded transition-colors ${canRedo() ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
      </button>
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Tool buttons */}
      <button
        onClick={() => setTool('select')}
        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
          tool === 'select'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Pilih (V)"
      >
        ↖ Pilih
      </button>
      <button
        onClick={() => setTool('text')}
        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
          tool === 'text'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
        title="Teks (T)"
      >
        T Teks
      </button>
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Action buttons — clearly labeled as Canva Design Preview */}
      <button
        onClick={handlePreview}
        title="Preview Desain Canva (buka di tab baru)"
        className="p-1.5 rounded hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 transition-colors border border-transparent hover:border-amber-500/30"
      >
        <span className="flex items-center gap-1">
          <span>🎨</span>
          <span className="hidden xl:inline text-[10px] font-semibold">Preview Desain</span>
        </span>
      </button>
      <button onClick={handleExport} title="Export Halaman HTML" className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">📤</button>
      <button onClick={handleExportSlideshow} title="Export Slideshow" className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">🎞</button>
      <button
        onClick={() => { if (confirm('Bersihkan semua elemen di halaman ini?')) clearStage(); }}
        title="Bersihkan"
        className="p-1.5 rounded hover:bg-zinc-800 text-red-400 hover:text-red-300 transition-colors"
      >
        🗑
      </button>

      {/* Ratio badge */}
      <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold text-[10px] ml-1">{ratioId}</span>

      {/* Tip: clearly label this as Canva Design tool */}
      <div className="hidden xl:flex items-center gap-1 ml-2 text-[9px] text-amber-500/60 bg-amber-500/5 rounded px-1.5 py-0.5 border border-amber-500/10">
        <span>🎨 Mode Desain Canva</span>
        <span>&middot;</span>
        <span>Preview di atas = desain slide</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 ml-2 text-[9px] text-zinc-600">
        <span>Del=hapus</span>
        <span>Arrow=nudge</span>
        <span>Ctrl+Z=undo</span>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1 ml-auto">
        {/* Right Panel toggle */}
        <button
          onClick={toggleRightPanel}
          title={rightPanelOpen ? 'Sembunyikan Panel Kanan' : 'Tampilkan Panel Kanan'}
          className={`p-1.5 rounded transition-colors ${rightPanelOpen ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200'}`}
        >
          ☰
        </button>
        <button onClick={() => zoomDelta(-0.1)} className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors" title="Zoom out">−</button>
        <span className="text-zinc-400 text-[11px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => zoomDelta(0.1)} className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors" title="Zoom in">+</button>
      </div>
    </div>
  );
}
