'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useViteExport } from '@/lib/use-vite-export';
import { toast } from 'sonner';
import { patchHistory } from '@/core/editor/patch-history';
import { showUndoRedoToast } from '@/components/shared/StatusToast';
import { AutoSaveIndicator } from '@/components/shared/StatusToast';
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
  Rocket,
  Maximize,
  Store,
  Printer,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplateMarketplace from '@/components/canva/TemplateMarketplace';
import { PdfExportButton } from '@/components/canva/toolbar/PdfExportButton';

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
    zoom: storeZoom,
    zoomDelta,
    zoomToFit,
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
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { exportHTML: viteExportHTML, previewHTML: vitePreviewHTML, exportClientSide, exportWithFallback } = useViteExport();

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

  const handleExportClientSide = async () => {
    setExporting(true);
    try {
      await exportClientSide();
    } finally {
      setExporting(false);
    }
    setExportOpen(false);
  };

  const handleExportWithFallback = async () => {
    setExporting(true);
    try {
      await exportWithFallback();
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
            className="focus-ring flex items-center gap-1 text-app-accent hover:text-app-accent/80"
            title="Navigasi — Kembali ke panel lain"
          >
            <ArrowLeft size={14} />
            <span className="hidden md:inline text-[9px] font-semibold">Menu</span>
            <ChevronDown size={8} className={`transition-transform ${navOpen ? 'rotate-180' : ''}`} />
          </Button>
          {navOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-xl glass-panel-strong border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 bg-app-accent/10 border-b border-app-accent/20">
                <div className="text-[9px] font-bold text-app-accent uppercase tracking-wider">🏠 Navigasi Utama</div>
              </div>
              <button
                onClick={() => { setActivePanel('dashboard'); setNavOpen(false); }}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-app-accent/10 transition-colors text-left"
              >
                <Home size={14} className="text-app-accent" />
                <div>
                  <div className="text-[11px] text-app-accent font-semibold">Dashboard</div>
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
        <span className="w-1 h-1 rounded-full bg-app-accent" />
        <span className="text-xs font-semibold text-app-primary min-w-0 truncate max-w-[140px]">
          {label}
        </span>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Template Marketplace Button ─────────────────────── */}
      <Button
        variant="outline"
        onClick={() => setMarketplaceOpen(true)}
        title="Template Marketplace — Pilih template siap pakai"
        className="focus-ring text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/18 hover:border-amber-500/35 gap-1"
      >
        <Store size={13} />
        <span className="hidden sm:inline">Template</span>
      </Button>

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
              <div className="text-[9px] font-bold text-teal-400 uppercase tracking-wider"><Play size={12} className="inline" /> Preview</div>
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
              <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider"><Rocket size={12} className="inline" /> Export</div>
            </div>
            <button
              onClick={handleExportUnified}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-emerald-500/10 transition-colors text-left"
            >
              <Download size={14} className="text-emerald-400" />
              <div>
                <div className="text-[11px] text-emerald-300 font-semibold">⬇ Download HTML (Vite)</div>
                <div className="text-[8px] text-emerald-500/70">Full export: navbar + navigasi + game + skor</div>
              </div>
            </button>
            <button
              onClick={handleExportClientSide}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-cyan-500/10 transition-colors text-left"
            >
              <Download size={14} className="text-cyan-400" />
              <div>
                <div className="text-[11px] text-cyan-300 font-semibold">⬇ Download HTML (Client-Side)</div>
                <div className="text-[8px] text-cyan-500/70">Fallback — selalu berfungsi tanpa Vite template</div>
              </div>
            </button>
            <button
              onClick={handleExportWithFallback}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-teal-500/10 transition-colors text-left"
            >
              <Rocket size={14} className="text-teal-400" />
              <div>
                <div className="text-[11px] text-teal-300 font-semibold">🔄 Auto-Fallback Export</div>
                <div className="text-[8px] text-teal-500/70">Coba Vite dulu, fallback ke client-side jika gagal</div>
              </div>
            </button>

            {/* ── PDF ── */}
            <div className="px-3 py-1.5 bg-violet-500/10 border-y border-violet-500/20">
              <div className='text-[9px] font-bold text-violet-400 uppercase tracking-wider'><FileDown size={12} className='inline' /> PDF</div>
            </div>
            <button
              onClick={async () => {
                setExportOpen(false);
                // Trigger PDF export via the dedicated component logic
                const { useCanvaStore } = await import('@/store/canva-store');
                const { useAuthoringStore } = await import('@/store/authoring-store');
                const canvaState = useCanvaStore.getState();
                const authState = useAuthoringStore.getState();

                setExporting(true);
                toast.loading(`Membuat PDF (${canvaState.pages.length} halaman)...`, { id: 'export-pdf' });

                try {
                  const payload = {
                    pages: canvaState.pages,
                    ratioId: canvaState.ratioId,
                    meta: authState.meta,
                    allKuis: authState.kuis,
                    allModules: authState.modules,
                    games: authState.games,
                    cp: authState.cp,
                    tp: authState.tp,
                    atp: authState.atp,
                    alur: authState.alur,
                    materi: authState.materi,
                    skenario: authState.skenario,
                    petunjuk: authState.petunjuk,
                    diskusi: authState.diskusi,
                    refleksi: authState.refleksi,
                    penutup: authState.penutup,
                    suara: authState.suara,
                    format: 'A4',
                    landscape: false,
                    includeAnswerKeys: true,
                  };

                  const response = await fetch('/api/export/pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });

                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || `PDF export failed with status ${response.status}`);
                  }

                  const blob = await response.blob();
                  const contentDisposition = response.headers.get('Content-Disposition');
                  let filename = 'mpi-export.pdf';
                  if (contentDisposition) {
                    const match = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (match) filename = match[1];
                  }

                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);

                  toast.success(`PDF berhasil dibuat (${canvaState.pages.length} halaman, ${(blob.size / 1024).toFixed(0)} KB)`, { id: 'export-pdf' });
                } catch (err: any) {
                  console.error('[PDF Export] Error:', err);
                  toast.error(`Gagal membuat PDF: ${err.message}`, { id: 'export-pdf' });
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-violet-500/10 transition-colors text-left disabled:opacity-50"
              aria-label="Export PDF dari halaman MPI"
            >
              {exporting ? <Loader2 size={14} className="text-violet-400 animate-spin" /> : <FileDown size={14} className="text-violet-400" />}
              <div>
                <div className="text-[11px] text-violet-300 font-semibold">{exporting ? 'Generating PDF...' : 'Export PDF'}</div>
                <div className="text-[8px] text-violet-500/70">Buat file PDF native — A4 dengan kunci jawaban</div>
              </div>
            </button>

            {/* ── PRINT ── */}
            <div className="px-3 py-1.5 bg-amber-500/10 border-y border-amber-500/20">
              <div className='text-[9px] font-bold text-amber-400 uppercase tracking-wider'><Printer size={12} className='inline' /> Cetak</div>
            </div>
            <button
              onClick={() => { window.print(); setExportOpen(false); }}
              className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-amber-500/10 transition-colors text-left"
              aria-label="Cetak halaman MPI"
            >
              <Printer size={14} className="text-amber-400" />
              <div>
                <div className="text-[11px] text-amber-300 font-semibold">Cetak (Print)</div>
                <div className="text-[8px] text-amber-500/70">Cetak halaman MPI untuk referensi guru</div>
              </div>
            </button>

            <div className="px-3 py-1.5 bg-app-elevated border-y border-app-border">
              <div className='text-[9px] font-bold text-app-muted uppercase tracking-wider'>Lainnya</div>
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
          onClick={() => { undo(); showUndoRedoToast('↩ Undo'); }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`focus-ring hover:scale-105 active:scale-95 transition-transform ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Undo2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { redo(); showUndoRedoToast('↪ Redo'); }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`focus-ring hover:scale-105 active:scale-95 transition-transform ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <Redo2 size={14} />
        </Button>
      </div>
      <div className="section-divider h-5 w-px mx-1" />

      {/* ── Auto-save status ────────────────────────────────── */}
      <AutoSaveIndicator />

      {/* ── Tool group: Select / Text ────────────────────────── */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTool('select')}
          className={`focus-ring rounded-lg p-1.5 transition-all hover:scale-105 active:scale-95 ${
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
          className={`focus-ring rounded-lg p-1.5 transition-all hover:scale-105 active:scale-95 ${
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
          className="px-2 py-0.5 rounded-md bg-app-elevated text-app-accent font-mono text-[10px] ml-1 hover:bg-app-surface transition-colors flex items-center gap-0.5"
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
                  ratioId === r.id ? 'text-app-accent bg-app-accent/5' : 'text-app-secondary'
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
            <Loader2 size={12} className="text-app-accent/60 animate-spin" />
            <span className="text-[9px] text-app-accent/60 hidden lg:inline">Menyimpan...</span>
          </>
        )}
      </div>

      {/* ── Sound toggle ──────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => useAuthoringStore.getState().toggleSuaraAll()}
        title={soundOn ? 'Matikan suara' : 'Nyalakan suara'}
        className={`focus-ring hover:scale-105 active:scale-95 transition-transform ${soundOn ? 'text-emerald-400' : 'text-app-muted'}`}
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
          className={`focus-ring hover:scale-105 active:scale-95 transition-transform ${leftPanelOpen ? 'text-app-accent' : ''}`}
        >
          <PanelLeft size={14} />
        </Button>
        {/* Right panel toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRightPanel}
          title={rightPanelOpen ? 'Sembunyikan Panel Kanan' : 'Tampilkan Panel Kanan'}
          className={`focus-ring hover:scale-105 active:scale-95 transition-transform ${rightPanelOpen ? 'text-app-accent' : ''}`}
        >
          <PanelRight size={14} />
        </Button>

        <div className="section-divider h-5 w-px mx-1" />

        {/* Zoom controls */}
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomToFit}
          className="focus-ring hover:scale-105 active:scale-95 transition-transform"
          title="Fit to screen (Ctrl+0)"
        >
          <Maximize size={13} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomDelta(-0.1)}
          className="focus-ring hover:scale-105 active:scale-95 transition-transform"
          title="Zoom out (Ctrl+-)"
        >
          <Minus size={13} />
        </Button>
        <span className="text-[11px] font-mono text-app-secondary w-12 text-center select-none" title={storeZoom === -1 ? 'Auto-fit' : `${Math.round(storeZoom * 100)}% of native`}>
          {storeZoom === -1 ? 'Fit' : `${Math.round(storeZoom * 100)}%`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomDelta(0.1)}
          className="focus-ring hover:scale-105 active:scale-95 transition-transform"
          title="Zoom in (Ctrl++)"
        >
          <Plus size={13} />
        </Button>
      </div>

      {/* ── Template Marketplace Overlay ─────────────────────── */}
      <TemplateMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
      />
    </div>
  );
}
