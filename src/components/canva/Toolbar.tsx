'use client';

import { useState, useRef, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useViteExport } from '@/lib/use-vite-export';
import { useExportActions } from '@/components/authoring/import-export/use-export-actions';
import { toast } from 'sonner';
import { patchHistory } from '@/core/editor/patch-history';
import { showUndoRedoToast, AutoSaveIndicator, SaveNowButton } from '@/components/shared/StatusToast';
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
  Loader2,
  MonitorPlay,
  Home,
  FileText,
  BookOpen,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Store,
  Printer,
  FileDown,
  Share2,
  PlusCircle,
  FileJson,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import TemplateMarketplace from '@/components/canva/TemplateMarketplace';

// ═══════════════════════════════════════════════════════════════
// Toolbar v4 — Redesigned for simplicity & teacher-friendliness
// ═══════════════════════════════════════════════════════════════
// Design principles:
// 1. Progressive disclosure — essential actions visible, advanced in dropdown
// 2. Grouping — related actions together with visual separators
// 3. Clear Indonesian labels — teachers understand "Bagikan" not "Export"
// 4. Less is more — reduced visual density, icon-only for less-used actions
//
// Layout (Left → Right):
//   GROUP 1: Navigation + Page Name + Save Status
//   GROUP 2: Play (primary) + Tambah + Template | Undo/Redo | Tools
//   GROUP 3: Ratio | Zoom Controls
//   GROUP 4: Panel Toggles
//   GROUP 5: Bagikan & Export (dropdown with sections)
//
// Key improvements over previous toolbar:
// - No more "Vite" vs "Client-Side" confusion → auto-pick best method
// - Export options organized into Preview / Download / Cetak / Lanjutan
// - Play button is more prominent (PRIMARY green)
// - "Tambah" button opens Add Block panel directly
// - Sound toggle & rarely-used actions in "Lanjutan" submenu
// - Keyboard shortcut hints in tooltips
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
    setLeftTab,
  } = useCanvaStore();

  // Reactive undo/redo — checks BOTH snapshot history AND patch history.
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
  const [navOpen, setNavOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef<HTMLDivElement>(null);

  const { previewHTML: vitePreviewHTML, exportWithFallback } = useViteExport();
  const { exportJSON } = useExportActions();

  const isInteractive = mode === 'interactive';
  const page = pages[currentPageIndex];
  const label = page?.label || 'Untitled';
  const soundOn = useAuthoringStore((s) => Object.values(s.suara).some(Boolean));

  // Close custom dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
      if (ratioRef.current && !ratioRef.current.contains(e.target as Node)) setRatioOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Export Handlers ──────────────────────────────────────

  /** Download HTML — auto-picks best method (Vite → client-side fallback) */
  const handleExportHTML = async () => {
    setExporting(true);
    try {
      await exportWithFallback();
    } finally {
      setExporting(false);
    }
  };

  /** Preview in new tab */
  const handlePreviewTab = async () => {
    try {
      await vitePreviewHTML();
    } catch (err) {
      toast.error('Gagal membuat preview');
    }
  };

  /** Download PDF — server-side generation via Puppeteer */
  const handleExportPdf = async () => {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[PDF Export] Error:', err);
      toast.error(`Gagal membuat PDF: ${message}`, { id: 'export-pdf' });
    } finally {
      setExporting(false);
    }
  };

  /** Clear all elements on current page */
  const handleClear = () => {
    if (confirm('Bersihkan semua elemen di halaman ini? Tindakan ini bisa di-undo.')) clearStage();
  };

  // ── Open Add Block panel ────────────────────────────────
  const openAddBlock = () => {
    const state = useCanvaStore.getState();
    if (!state.leftPanelOpen) {
      useCanvaStore.setState({ leftPanelOpen: true });
    }
    state.setLeftTab('tambah');
  };

  // ── Interactive mode toolbar (minimal) ──────────────────
  if (isInteractive) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
        <span className="text-xs font-semibold text-emerald-300 min-w-0 truncate max-w-[140px]">
          {label}
        </span>
        <div className="section-divider h-5 w-px mx-1" />
        <span className="text-[10px] text-emerald-400/60 ml-1">
          ← → navigasi • Esc tutup
        </span>
        <div className="flex-1" />
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

  // ── Design mode toolbar ─────────────────────────────────
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 glass-panel-strong select-none">

      {/* ═══════════════════════════════════════════════════════════
          GROUP 1: Navigation + Page Name + Save Status
          - Compact nav dropdown (icon-only trigger)
          - Page label (editable in future)
          - Auto-save indicator badge
          ═══════════════════════════════════════════════════════════ */}
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
            <div className="absolute top-full left-0 mt-1 w-56 rounded-xl glass-panel-strong border border-app-border shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
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

      <div className="section-divider h-5 w-px mx-1" />

      {/* ═══════════════════════════════════════════════════════════
          GROUP 2: Core Actions
          - Play (PRIMARY — green, prominent)
          - Tambah (opens Add Block panel)
          - Template (icon only → Marketplace)
          - Separator
          - Undo / Redo (icon only with tooltip)
          - Separator
          - Tool selector (Select / Text — compact)
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1">
        {/* ▶ Play — PRIMARY action, most prominent button */}
        <Button
          onClick={openPlay}
          title="Preview Interaktif — Preview dengan kuis, game, dan skor"
          className="focus-ring text-emerald-400 border-emerald-500/25 bg-emerald-500/15 hover:bg-emerald-500/25 hover:border-emerald-500/40 font-bold h-7 px-3 gap-1.5 shadow-sm shadow-emerald-500/10"
        >
          <Play size={14} fill="currentColor" />
          <span className="text-[11px]">Play</span>
        </Button>

        {/* + Tambah — opens Add Block panel */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              onClick={openAddBlock}
              className="focus-ring text-app-accent border-app-accent/20 bg-app-accent/8 hover:bg-app-accent/15 hover:border-app-accent/30 gap-1 h-7 px-2.5"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline text-[10px] font-semibold">Tambah</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Tambah block ke halaman
          </TooltipContent>
        </Tooltip>

        {/* Template Marketplace — icon only with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMarketplaceOpen(true)}
              className="focus-ring text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 h-7 w-7"
            >
              <Store size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Template Marketplace — Pilih template siap pakai
          </TooltipContent>
        </Tooltip>

        <div className="section-divider h-4 w-px mx-0.5" />

        {/* Undo / Redo — icon only */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { undo(); showUndoRedoToast('↩ Undo'); }}
              disabled={!canUndo}
              className={`focus-ring h-7 w-7 ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Undo2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Undo (Ctrl+Z)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { redo(); showUndoRedoToast('↪ Redo'); }}
              disabled={!canRedo}
              className={`focus-ring h-7 w-7 ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Redo2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Redo (Ctrl+Y)
          </TooltipContent>
        </Tooltip>

        <div className="section-divider h-4 w-px mx-0.5" />

        {/* Tool selector — compact icon-only buttons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTool('select')}
              className={`focus-ring h-7 w-7 ${tool === 'select' ? 'nav-active' : ''}`}
            >
              <MousePointer2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Select (V)
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTool('text')}
              className={`focus-ring h-7 w-7 ${tool === 'text' ? 'nav-active' : ''}`}
            >
              <Type size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Text (T)
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="section-divider h-5 w-px mx-1" />

      {/* ═══════════════════════════════════════════════════════════
          GROUP 3: View Controls
          - Ratio selector (badge dropdown)
          - Zoom controls (fit, −, %, +)
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-0.5">
        {/* Ratio badge — clickable dropdown */}
        <div className="relative" ref={ratioRef}>
          <button
            onClick={() => setRatioOpen(!ratioOpen)}
            className="px-2 py-0.5 rounded-md bg-app-elevated text-app-accent font-mono text-[10px] hover:bg-app-surface transition-colors flex items-center gap-0.5"
            title="Rasio canvas"
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
                  className={`w-full px-3 py-2 flex items-center justify-between hover:bg-app-accent/10 transition-colors ${
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

        {/* Zoom controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={zoomToFit} className="focus-ring h-7 w-7">
              <Maximize size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            Fit to screen (Ctrl+0)
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomDelta(-0.1)}
          className="focus-ring h-7 w-7"
          title="Zoom out (Ctrl+-)"
        >
          <Minus size={12} />
        </Button>
        <span
          className="text-[10px] font-mono text-app-secondary w-10 text-center select-none"
          title={storeZoom === -1 ? 'Auto-fit' : `${Math.round(storeZoom * 100)}% of native`}
        >
          {storeZoom === -1 ? 'Fit' : `${Math.round(storeZoom * 100)}%`}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomDelta(0.1)}
          className="focus-ring h-7 w-7"
          title="Zoom in (Ctrl++)"
        >
          <Plus size={12} />
        </Button>
      </div>

      {/* Spacer — pushes GROUP 4 & 5 to the right */}
      <div className="flex-1" />

      {/* ═══════════════════════════════════════════════════════════
          GROUP 4: Panel Toggles
          - Left panel toggle
          - Right panel toggle
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLeftPanel}
              className={`focus-ring h-7 w-7 ${leftPanelOpen ? 'text-app-accent' : ''}`}
            >
              <PanelLeft size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {leftPanelOpen ? 'Sembunyikan Panel Kiri' : 'Tampilkan Panel Kiri'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRightPanel}
              className={`focus-ring h-7 w-7 ${rightPanelOpen ? 'text-app-accent' : ''}`}
            >
              <PanelRight size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {rightPanelOpen ? 'Sembunyikan Panel Kanan' : 'Tampilkan Panel Kanan'}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="section-divider h-5 w-px mx-1" />

      {/* ═══════════════════════════════════════════════════════════
          GROUP 5: Bagikan & Export — Dropdown with sections
          ┌─────────────────────────────────┐
          │ 👁 Preview                       │
          │   Preview Tab Baru               │
          │   Live Preview                   │
          │ ─────────────────────────────── │
          │ 📥 Download                      │
          │   Download HTML  (auto best)     │
          │   Download PDF                   │
          │ ─────────────────────────────── │
          │ 🖨 Cetak                         │
          │   Cetak (Print)                  │
          │ ─────────────────────────────── │
          │ ⚙ Lanjutan →  ┌──────────────┐ │
          │                │ Template      │ │
          │                │ Bersihkan     │ │
          │                │ Export JSON   │ │
          │                │ ──────────── │ │
          │                │ Suara On/Off  │ │
          │                └──────────────┘ │
          └─────────────────────────────────┘
          ═══════════════════════════════════════════════════════════ */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            disabled={exporting}
            className={`focus-ring flex items-center gap-1 h-7 px-2 ${exporting ? 'opacity-50' : ''}`}
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
            <span className="hidden sm:inline text-[10px] font-semibold">Bagikan</span>
            <ChevronDown size={8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 glass-panel-strong border border-app-border shadow-xl rounded-xl p-0 overflow-hidden"
        >
          {/* ── Preview Section ── */}
          <DropdownMenuLabel className="px-3 py-1.5 bg-teal-500/10 border-b border-teal-500/20 text-[9px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1">
            <Eye size={11} /> Preview
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handlePreviewTab}
            className="px-3 py-2.5 gap-2.5 focus:bg-teal-500/10 cursor-pointer"
          >
            <Film size={14} className="text-teal-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-teal-300">Preview Tab Baru</div>
              <div className="text-[8px] text-app-muted">Lihat tampilan siswa di tab baru</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setActivePanel('preview')}
            className="px-3 py-2.5 gap-2.5 focus:bg-cyan-500/10 cursor-pointer"
          >
            <MonitorPlay size={14} className="text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-cyan-300">Live Preview</div>
              <div className="text-[8px] text-app-muted">Panel lengkap di samping canvas</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-app-border/30" />

          {/* ── Download Section ── */}
          <DropdownMenuLabel className="px-3 py-1.5 bg-emerald-500/10 border-y border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Download size={11} /> Download
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={handleExportHTML}
            disabled={exporting}
            className="px-3 py-2.5 gap-2.5 focus:bg-emerald-500/10 cursor-pointer"
          >
            {exporting
              ? <Loader2 size={14} className="animate-spin text-emerald-400 flex-shrink-0" />
              : <Download size={14} className="text-emerald-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-emerald-300">
                {exporting ? 'Mengunduh...' : 'Download HTML'}
              </div>
              <div className="text-[8px] text-app-muted">File HTML lengkap — siap dibagikan</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3 py-2.5 gap-2.5 focus:bg-violet-500/10 cursor-pointer"
          >
            {exporting
              ? <Loader2 size={14} className="animate-spin text-violet-400 flex-shrink-0" />
              : <FileDown size={14} className="text-violet-400 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-violet-300">
                {exporting ? 'Membuat PDF...' : 'Download PDF'}
              </div>
              <div className="text-[8px] text-app-muted">File PDF A4 dengan kunci jawaban</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-app-border/30" />

          {/* ── Cetak Section ── */}
          <DropdownMenuLabel className="px-3 py-1.5 bg-amber-500/10 border-y border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Printer size={11} /> Cetak
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => window.print()}
            className="px-3 py-2.5 gap-2.5 focus:bg-amber-500/10 cursor-pointer"
          >
            <Printer size={14} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-amber-300">Cetak (Print)</div>
              <div className="text-[8px] text-app-muted">Cetak halaman MPI via browser</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-app-border/30" />

          {/* ── Lanjutan (Advanced) Submenu ── */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="px-3 py-2 gap-2 text-[11px] font-semibold text-app-muted hover:text-app-secondary cursor-pointer">
              <Settings2 size={14} />
              <span>Lanjutan</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="glass-panel-strong border border-app-border shadow-xl rounded-xl p-1 min-w-[180px]">
              <DropdownMenuItem
                onClick={() => setMarketplaceOpen(true)}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                <Store size={14} className="text-amber-400" />
                <span className="text-[11px]">Template Marketplace</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleClear}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                <Trash2 size={14} className="text-red-400/60" />
                <span className="text-[11px] text-red-400/80">Bersihkan Canvas</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportJSON}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                <FileJson size={14} className="text-app-secondary" />
                <span className="text-[11px]">Export JSON</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-app-border/30" />
              <DropdownMenuItem
                onClick={() => useAuthoringStore.getState().toggleSuaraAll()}
                className="px-2.5 py-2 gap-2 cursor-pointer"
              >
                {soundOn
                  ? <Volume2 size={14} className="text-emerald-400" />
                  : <VolumeX size={14} className="text-app-muted" />
                }
                <span className="text-[11px]">{soundOn ? 'Matikan Suara' : 'Nyalakan Suara'}</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Template Marketplace Overlay ──────────────────────── */}
      <TemplateMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
      />
    </div>
  );
}
