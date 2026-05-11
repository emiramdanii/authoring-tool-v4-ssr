'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useViteExport } from '@/lib/use-vite-export';
import { toast } from 'sonner';
import { patchHistory } from '@/core/editor/patch-history';
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
  PanelLeft,
  X,
  ChevronDown,
  Save,
  CheckCircle2,
  Loader2,
  MonitorPlay,
  Home,
  FileText,
  BookOpen,
  ArrowLeft,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    currentPageIndex,
    pages,
    undo,
    redo,
    rightPanelOpen,
    toggleRightPanel,
    leftPanelOpen,
    toggleLeftPanel,
  } = useCanvaStore();

  // Reactive undo/redo — checks BOTH snapshot history AND patch history.
  // Previously only checked snapshot history, which meant the toolbar
  // buttons stayed disabled after schema block edits that only record
  // patches (not full snapshots). Now subscribes to PatchHistory changes
  // so the UI stays reactive.
  const snapshotCanUndo = useCanvaStore((s) => s._historyIdx > 0);
  const snapshotCanRedo = useCanvaStore((s) => s._historyIdx < s._history.length - 1);

  // Subscribe to PatchHistory state changes (patch-based undo/redo)
  const [patchHistoryState, setPatchHistoryState] = useState(() => patchHistory.getState());
  useEffect(() => {
    return patchHistory.subscribe(() => setPatchHistoryState(patchHistory.getState()));
  }, []);

  const canUndo = snapshotCanUndo || patchHistoryState.canUndo;
  const canRedo = snapshotCanRedo || patchHistoryState.canRedo;

  const mode = useInteractiveStore((s) => s.mode);
  const openPlay = useInteractiveStore((s) => s.openPlay);
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const setActivePanel = useAuthoringStore((s) => s.setActivePanel);

  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { exportHTML: viteExportHTML, previewHTML: vitePreviewHTML } = useViteExport();

  const isInteractive = mode === 'interactive';
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';
  const soundOn = useAuthoringStore((s) => Object.values(s.suara).some(Boolean));

  // ── Save indicator: subscribe to centralized save status ───
  // Auto-save is handled exclusively by CanvaBuilder's subscriber.
  // Toolbar only reads the status to display the indicator.
  const saveStatus = useCanvaStore((s) => s._saveStatus);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
      if (ratioRef.current && !ratioRef.current.contains(e.target as Node)) setRatioOpen(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Legacy export handlers removed — now using Vite SSR Export pipeline
  // See: handleExportUnified and handlePreviewUnified below

  const handleExportUnified = async () => {
    setExporting(true);
    try {
      await viteExportHTML();
    } finally {
      setExporting(false);
    }
    setExportOpen(false);
  };

  const handlePreviewUnified = async () => {
    try {
      await vitePreviewHTML();
    } catch (err) {
      toast.error('Gagal membuat preview');
    }
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
        <Button
          variant="destructive"
          size="sm"
          onClick={closePlay}
          className="focus-ring"
          title="Tutup mode interaktif (Esc)"
        >
          <X size={12} />
          <span className="hidden sm:inline">Tutup</span>
        </Button>
      </div>
    );
  }

  // ── Design mode toolbar ────────────────────────────────────
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">

      {/* ── Left group: Navigation Back + Page Label ─────────── */}
      <div className="flex items-center gap-1">
        {/* Navigation dropdown — go to Dashboard, Dokumen, Konten */}
        <div className="relative" ref={navRef}>
          <Button
            variant="ghost"
            onClick={() => setNavOpen(!navOpen)}
            className="focus-ring flex items-center gap-1 text-amber-400 hover:text-amber-300"
            title="Navigasi — Kembali ke panel lain"
          >
            <ArrowLeft size={14} />
            <span className="hidden md:inline text-[9px] font-semibold">Menu</span>
            <ChevronDown size={8} className={`transition-transform ${navOpen ? 'rotate-180' : ''}`} />
          </Button>
          {navOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-xl glass-panel-strong border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">🏠 Navigasi Utama</div>
              </div>
              <button
                onClick={() => { setActivePanel('dashboard'); setNavOpen(false); }}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-amber-500/10 transition-colors text-left"
              >
                <Home size={14} className="text-amber-400" />
                <div>
                  <div className="text-[11px] text-amber-300 font-semibold">Dashboard</div>
                  <div className="text-[8px] text-app-muted">Pilih preset, kelengkapan, quick actions</div>
                </div>
              </button>
              <button
                onClick={() => { setActivePanel('dokumen'); setNavOpen(false); }}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-elevated transition-colors text-left"
              >
                <FileText size={14} className="text-cyan-400" />
                <div>
                  <div className="text-[11px] text-app-primary font-semibold">Dokumen</div>
                  <div className="text-[8px] text-app-muted">Edit CP, TP, ATP, Alur Pembelajaran</div>
                </div>
              </button>
              <button
                onClick={() => { setActivePanel('konten'); setNavOpen(false); }}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-elevated transition-colors text-left"
              >
                <BookOpen size={14} className="text-emerald-400" />
                <div>
                  <div className="text-[11px] text-app-primary font-semibold">Konten</div>
                  <div className="text-[8px] text-app-muted">Edit Kuis, Game, Materi, Skenario</div>
                </div>
              </button>
              <div className="section-divider mx-3" />
              <button
                onClick={() => { setActivePanel('preview'); setNavOpen(false); }}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-elevated transition-colors text-left"
              >
                <MonitorPlay size={14} className="text-cyan-400" />
                <div>
                  <div className="text-[11px] text-app-primary font-semibold">Live Preview</div>
                  <div className="text-[8px] text-app-muted">Preview tampilan siswa lengkap</div>
                </div>
              </button>
              <button
                onClick={() => { setActivePanel('import'); setNavOpen(false); }}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-elevated transition-colors text-left"
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
        <span className="w-1 h-1 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold text-app-primary min-w-0 truncate max-w-[140px]">
          {label}
        </span>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Play Button (MAIN action) ────────────────────────── */}
      <Button
        variant="outline"
        onClick={openPlay}
        title="Play Preview — Preview interaktif dengan kuis, game, dan skor"
        className="focus-ring text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/18 hover:border-emerald-500/35"
      >
        <Play size={13} fill="currentColor" />
        <span>Play</span>
      </Button>

      {/* ── Preview dropdown (Preview + Live merged) ── */}
      <div className="relative" ref={exportRef}>
        <Button
          variant="ghost"
          onClick={() => setExportOpen(!exportOpen)}
          disabled={exporting}
          className={`focus-ring flex items-center gap-0.5 ${exporting ? 'opacity-50' : ''}`}
          title="Preview & Export"
        >
          <Eye size={14} />
          <span className="hidden md:inline text-[9px] font-semibold">Preview</span>
          <ChevronDown size={8} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
        </Button>
        {exportOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 rounded-xl glass-panel-strong border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
            {/* ── PREVIEW ── */}
            <div className="px-3 py-1.5 bg-teal-500/10 border-b border-teal-500/20">
              <div className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">▶ Preview</div>
            </div>
            <button
              onClick={handlePreviewUnified}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-teal-500/10 transition-colors text-left"
            >
              <Film size={14} className="text-teal-400" />
              <div>
                <div className="text-[11px] text-teal-300 font-semibold">Preview (Tab Baru)</div>
                <div className="text-[8px] text-teal-500/70">Lihat tampilan siswa di tab baru</div>
              </div>
            </button>
            <button
              onClick={() => { setActivePanel('preview'); setExportOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-cyan-500/10 transition-colors text-left"
            >
              <MonitorPlay size={14} className="text-cyan-400" />
              <div>
                <div className="text-[11px] text-cyan-300 font-semibold">Live Preview</div>
                <div className="text-[8px] text-cyan-500/70">Panel lengkap: tema, device frame, mode</div>
              </div>
            </button>

            {/* ── EXPORT ── */}
            <div className="px-3 py-1.5 bg-emerald-500/10 border-y border-emerald-500/20">
              <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">🚀 Export</div>
            </div>
            <button
              onClick={handleExportUnified}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-emerald-500/10 transition-colors text-left"
            >
              <Download size={14} className="text-emerald-400" />
              <div>
                <div className="text-[11px] text-emerald-300 font-semibold">⬇ Download HTML</div>
                <div className="text-[8px] text-emerald-500/70">Navbar + navigasi + game + skor — siap bagi ke siswa</div>
              </div>
            </button>

            <div className="px-3 py-1.5 bg-app-elevated border-y border-app-border">
              <div className="text-[9px] font-bold text-app-muted uppercase tracking-wider">Lainnya</div>
            </div>
            <button
              onClick={handleClear}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-red-500/10 transition-colors text-left"
            >
              <Trash2 size={14} className="text-red-400/60" />
              <div>
                <div className="text-[11px] text-red-400/70 font-semibold">Bersihkan Halaman</div>
                <div className="text-[8px] text-app-muted">Hapus semua elemen (bisa undo)</div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="section-divider h-5 w-px mx-1" />

      {/* ── History group: Undo / Redo ───────────────────────── */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`focus-ring ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Undo2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`focus-ring ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Redo2 size={14} />
        </Button>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Tool group: Select / Text ────────────────────────── */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTool('select')}
          className={`focus-ring rounded-lg p-1.5 transition-all ${
            tool === 'select'
              ? 'nav-active'
              : ''
          }`}
          title="Select (V)"
        >
          <MousePointer2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTool('text')}
          className={`focus-ring rounded-lg p-1.5 transition-all ${
            tool === 'text'
              ? 'nav-active'
              : ''
          }`}
          title="Text (T)"
        >
          <Type size={14} />
        </Button>
      </div>

      {/* ── Ratio badge (clickable dropdown) ────────────────── */}
      <div className="relative" ref={ratioRef}>
        <button
          onClick={() => setRatioOpen(!ratioOpen)}
          className="px-2 py-0.5 rounded-md bg-app-elevated text-amber-400 font-mono text-[10px] ml-1 hover:bg-app-surface transition-colors flex items-center gap-0.5"
        >
          {ratioId}
          <ChevronDown size={8} className={`transition-transform ${ratioOpen ? 'rotate-180' : ''}`} />
        </button>
        {ratioOpen && (
          <div className="absolute top-full left-0 mt-1 w-36 rounded-xl glass-panel-strong border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
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
                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-app-elevated transition-colors ${
                  ratioId === r.id ? 'text-amber-400 bg-amber-500/5' : 'text-app-secondary'
                }`}
              >
                <span className="text-[11px] font-mono font-bold">{r.name}</span>
                <span className="text-[8px] text-app-muted">{r.desc}</span>
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

      {/* ── Sound toggle ──────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => useAuthoringStore.getState().toggleSuaraAll()}
        title={soundOn ? 'Matikan suara' : 'Nyalakan suara'}
        className={`focus-ring ${soundOn ? 'text-emerald-400' : 'text-app-muted'}`}
      >
        {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </Button>

      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Right group: Zoom + Panel toggle ─────────────────── */}
      <div className="flex items-center gap-0.5 ml-auto">
        {/* Left panel toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftPanel}
          title={leftPanelOpen ? 'Sembunyikan Panel Kiri' : 'Tampilkan Panel Kiri'}
          className={`focus-ring ${leftPanelOpen ? 'text-amber-400' : ''}`}
        >
          <PanelLeft size={14} />
        </Button>
        {/* Right panel toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          title={rightPanelOpen ? 'Sembunyikan Panel Kanan' : 'Tampilkan Panel Kanan'}
          className={`focus-ring ${rightPanelOpen ? 'text-amber-400' : ''}`}
        >
          <PanelRight size={14} />
        </Button>

        <div className="section-divider h-5 w-px mx-1" />

        {/* Zoom controls */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomDelta(-0.1)}
          className="focus-ring"
          title="Zoom out"
        >
          <Minus size={13} />
        </Button>
        <span className="text-[11px] font-mono text-app-secondary w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomDelta(0.1)}
          className="focus-ring"
          title="Zoom in"
        >
          <Plus size={13} />
        </Button>
      </div>
    </div>
  );
}
