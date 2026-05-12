'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { PageRenderer } from './page-renderer';
import { RATIOS } from './types';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import { COLORS } from '@/lib/color-palette';
import { TEMPLATE_ICON_MAP } from '@/lib/canva-icon-maps';
import { Gamepad2, Trophy, X, Grid3X3, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ═══════════════════════════════════════════════════════════════
// PLAY OVERLAY — Full-screen interactive preview overlay
//
// Refactored: Uses PageRenderer for consistent rendering
// (navbar, background, template, elements) — identical to
// Stage and ExportApp. Only adds overlay-specific features:
// - Full-screen overlay with header
// - Overview mode (thumbnail grid)
// - Fullscreen toggle
// - Keyboard shortcuts
// ═══════════════════════════════════════════════════════════════

export default function PlayOverlay() {
  const mode = useInteractiveStore((s) => s.mode);
  const isPlaying = mode === 'interactive';

  if (!isPlaying) return null;

  return (
    <div className="fixed inset-0 bg-app-surface flex flex-col select-none" style={{ zIndex: 70 }}>
      {/* Top bar */}
      <PlayOverlayHeader />

      {/* Main canvas area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayCanvas />
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────

function PlayOverlayHeader() {
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const totalScoreVal = useInteractiveStore((s) => s.scores.reduce((sum: number, e: { score: number }) => sum + e.score, 0));
  const totalMaxVal = useInteractiveStore((s) => s.scores.reduce((sum: number, e: { maxScore: number }) => sum + e.maxScore, 0));

  const page = pages[interactivePageIdx];
  const hasScore = totalMaxVal > 0;

  return (
    <div className="glass-panel-strong flex items-center justify-between px-4 py-2 border-b border-app-border/50">
      <div className="flex items-center gap-3">
        <Gamepad2 size={14} className="text-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">Mode Interaktif</span>
        <span className="text-[10px] text-app-muted">•</span>
        <span className="text-[10px] text-app-primary font-semibold truncate max-w-[200px]">
          {page?.label || `Halaman ${interactivePageIdx + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {hasScore && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Trophy size={12} className="text-emerald-300" />
            <span className="text-xs font-black text-emerald-300">{totalScoreVal}/{totalMaxVal}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-app-muted">
          <span>← → navigasi</span>
          <span>F fullscreen</span>
          <span>O overview</span>
          <span>Esc tutup</span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={closePlay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
        >
          <X size={14} />
          <span>Tutup</span>
        </Button>
      </div>
    </div>
  );
}

// ── Play Canvas — Renders the current page scaled to fit ──────

function PlayCanvas() {
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const ratio = useCanvaStore((s) => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);

  const page = pages[interactivePageIdx];

  // ResizeObserver for responsive scaling
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const aW = (el.clientWidth || 800) - 60;
      const aH = (el.clientHeight || 500) - 60;
      const sW = aW / ratio.w;
      const sH = aH / ratio.h;
      setScale(Math.min(sW, sH, 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  // Keyboard shortcuts for overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const iStore = useInteractiveStore.getState();
      const cStore = useCanvaStore.getState();
      const target = e.target as HTMLElement;

      if (target.contentEditable === 'true' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (overviewOpen) { setOverviewOpen(false); return; }
        iStore.closePlay();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        const beforeIdx = iStore.interactivePageIdx;
        iStore.nextInteractivePage();
        const afterIdx = useInteractiveStore.getState().interactivePageIdx;
        if (afterIdx !== beforeIdx) cStore.goPage(afterIdx);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const beforeIdx = iStore.interactivePageIdx;
        iStore.prevInteractivePage();
        const afterIdx = useInteractiveStore.getState().interactivePageIdx;
        if (afterIdx !== beforeIdx) cStore.goPage(afterIdx);
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        } else {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
        return;
      }
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setOverviewOpen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [overviewOpen]);

  if (!page) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-app-muted text-sm">Tidak ada halaman</div>
      </div>
    );
  }

  // Overview Mode
  if (overviewOpen) {
    return <OverviewGrid onClose={() => setOverviewOpen(false)} />;
  }

  return (
    <div ref={canvasRef} className="w-full h-full flex items-center justify-center relative">
      <div
        className="relative overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-app-border/30"
        style={{
          width: ratio.w,
          height: ratio.h,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* ══ Use PageRenderer for consistent rendering ══════ */}
        <CanvasErrorBoundary name="PlayPreview">
          <PageRenderer
            mode="preview"
            page={page}
            currentPageIndex={interactivePageIdx}
            totalPages={pages.length}
          />
        </CanvasErrorBoundary>
      </div>

      {/* Bottom-right action buttons */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => setOverviewOpen(true)}
          className="glass-panel-strong px-2 py-1.5 rounded-lg text-[10px] font-bold gap-1"
          title="Overview (O)"
        >
          <Grid3X3 size={12} />
          <span className="hidden sm:inline">Overview</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
              setIsFullscreen(true);
            } else {
              document.exitFullscreen().catch(() => {});
              setIsFullscreen(false);
            }
          }}
          className="glass-panel-strong px-2 py-1.5 rounded-lg text-[10px] font-bold gap-1"
          title="Fullscreen (F)"
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </Button>
      </div>
    </div>
  );
}

// ── Overview Grid: Thumbnail navigation ────────────────────────

function OverviewGrid({ onClose }: { onClose: () => void }) {
  const pages = useCanvaStore((s) => s.pages);
  const goPage = useCanvaStore((s) => s.goPage);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const goInteractivePage = useInteractiveStore((s) => s.goInteractivePage);
  const isPageComplete = useInteractiveStore((s) => s.isPageComplete);
  const totalScoreVal = useInteractiveStore((s) => s.scores.reduce((sum: number, e: { score: number }) => sum + e.score, 0));
  const totalMaxVal = useInteractiveStore((s) => s.scores.reduce((sum: number, e: { maxScore: number }) => sum + e.maxScore, 0));
  const ratio = useCanvaStore((s) => {
    const r = RATIOS.find(r => r.id === s.ratioId);
    return r || RATIOS[0];
  });

  const handleSelect = (idx: number) => {
    goInteractivePage(idx);
    goPage(idx);
    onClose();
  };

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="text-center mb-4">
        <div className="text-sm font-bold text-app-primary">Overview — {pages.length} Halaman</div>
        {totalMaxVal > 0 && (
          <div className="text-[10px] text-emerald-400/60 mt-1">
            Skor: {totalScoreVal}/{totalMaxVal} ({totalMaxVal > 0 ? Math.round((totalScoreVal / totalMaxVal) * 100) : 0}%)
          </div>
        )}
        <div className="text-[9px] text-app-muted mt-1">Klik halaman untuk navigasi • Tekan O atau Esc untuk tutup</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
        {pages.map((p, i) => {
          const isActive = i === interactivePageIdx;
          const isComplete = isPageComplete(i);
          const bgStyle = p.bgDataUrl
            ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : p.bgColor?.includes('gradient')
              ? { background: p.bgColor }
              : { background: p.bgColor || COLORS.bgDark };
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(i)}
              className={`relative rounded-xl overflow-hidden transition-all hover:scale-105 ${
                isActive
                  ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'ring-1 ring-app-border/40 hover:ring-app-border/60'
              }`}
              style={{ aspectRatio: `${ratio.w}/${ratio.h}` }}
            >
              <div className="absolute inset-0" style={bgStyle}>
                <div className="absolute inset-0 bg-black/30" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-[9px] font-bold text-white truncate flex items-center gap-0.5">
                  {TEMPLATE_ICON_MAP[p.templateType] || '📄'} {p.label}
                </div>
                <div className="text-[7px] text-white/50">
                  Halaman {i + 1}/{pages.length}
                </div>
              </div>
              {isComplete && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">✓</span>
                </div>
              )}
              {isActive && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/90 text-[7px] font-bold text-white">
                  AKTIF
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
