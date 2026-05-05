'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import PageTemplate from './PageTemplate';
import QuizWidget from './QuizWidget';
import GameWidget from './GameWidget';
import InteractiveNav from './InteractiveNav';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';
import type { CanvaElement } from './types';
import { Gamepad2, Trophy, X, Grid3X3, Maximize2, Minimize2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// PLAY OVERLAY — Full-screen interactive preview overlay
// Phase 3 improvements:
// - Render overlay elements on template pages (bug fix)
// - Overview mode (thumbnail grid navigation)
// - Fullscreen toggle
// - Auto-hide nav on idle
// ═══════════════════════════════════════════════════════════════

export default function PlayOverlay() {
  const mode = useInteractiveStore((s) => s.mode);
  const isPlaying = mode === 'interactive';

  if (!isPlaying) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col select-none">
      {/* Top bar */}
      <PlayOverlayHeader />

      {/* Main canvas area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PlayCanvas />
      </div>

      {/* Navigation bar */}
      <InteractiveNav />
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────

function PlayOverlayHeader() {
  const closePlay = useInteractiveStore((s) => s.closePlay);
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);

  const page = pages[interactivePageIdx];
  const hasScore = totalMax() > 0;

  return (
    <div className="glass-panel-strong flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
      <div className="flex items-center gap-3">
        <Gamepad2 size={14} className="text-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">Mode Interaktif</span>
        <span className="text-[10px] text-slate-600">•</span>
        <span className="text-[10px] text-slate-200 font-semibold truncate max-w-[200px]">
          {page?.label || `Halaman ${interactivePageIdx + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Floating score badge in header */}
        {hasScore && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Trophy size={12} className="text-emerald-300" />
            <span className="text-xs font-black text-emerald-300">{totalScore()}/{totalMax()}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500">
          <span>← → navigasi</span>
          <span>F fullscreen</span>
          <span>O overview</span>
          <span>Esc tutup</span>
        </div>

        <button
          onClick={closePlay}
          className="btn-danger flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
        >
          <X size={14} />
          <span>Tutup</span>
        </button>
      </div>
    </div>
  );
}

// ── Play Canvas — Renders the current page scaled to fit ──────

function PlayCanvas() {
  const pages = useCanvaStore((s) => s.pages);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);
  const ratio = useCanvaStore((s) => s.currentRatio());

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

      // Don't intercept when editing text
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
        iStore.nextInteractivePage();
        const next = iStore.interactivePageIdx + 1;
        if (next < cStore.pages.length) cStore.goPage(next);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        iStore.prevInteractivePage();
        const prev = iStore.interactivePageIdx - 1;
        if (prev >= 0) cStore.goPage(prev);
        return;
      }
      // F = fullscreen toggle
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
      // O = overview toggle
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
        <div className="text-slate-500 text-sm">Tidak ada halaman</div>
      </div>
    );
  }

  const isTemplateMode = page.templateType && page.templateType !== 'custom';

  // ── Overview Mode: thumbnail grid of all pages ──
  if (overviewOpen) {
    return <OverviewGrid onClose={() => setOverviewOpen(false)} />;
  }

  return (
    <div ref={canvasRef} className="w-full h-full flex items-center justify-center relative">
      <div
        className="relative overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-slate-700/30"
        style={{
          width: ratio.w,
          height: ratio.h,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Background color */}
        <div
          className="absolute inset-0"
          style={{ background: page.bgColor || '#1a1a2e' }}
        />

        {/* Background image */}
        {page.bgDataUrl && (
          <img
            src={page.bgDataUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(14,28,47,${(page.overlay || 20) / 100})` }}
        />

        {/* Template Mode: Render full-page template with interactive prop */}
        {isTemplateMode && (
          <PageTemplate
            page={page}
            isSelected={false}
            onEditField={() => {}}
            interactive
          />
        )}

        {/* Phase 3 FIX: Render overlay elements on template pages in interactive mode */}
        {isTemplateMode && (page.overlayElements || []).length > 0 && (
          <div className="absolute inset-0" style={{ zIndex: 10 }}>
            {(page.overlayElements || []).filter(el => !el.hidden).map(el => (
              <PlayElement key={el.id} element={el} pageIndex={interactivePageIdx} />
            ))}
          </div>
        )}

        {/* Custom Mode: Render individual elements */}
        {!isTemplateMode && (
          <div className="absolute inset-0">
            {page.elements
              .filter((el) => !el.hidden)
              .map((el) => (
                <PlayElement key={el.id} element={el} pageIndex={interactivePageIdx} />
              ))}

            {/* Empty state */}
            {page.elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-slate-600 text-sm mb-2">Halaman kosong</div>
                <div className="text-slate-700 text-xs">Kembali ke mode desain untuk menambahkan konten</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom-right action buttons */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setOverviewOpen(true)}
          className="btn-ghost glass-panel-strong px-2 py-1.5 rounded-lg text-[10px] font-bold gap-1"
          title="Overview (O)"
        >
          <Grid3X3 size={12} />
          <span className="hidden sm:inline">Overview</span>
        </button>
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
              setIsFullscreen(true);
            } else {
              document.exitFullscreen().catch(() => {});
              setIsFullscreen(false);
            }
          }}
          className="btn-ghost glass-panel-strong px-2 py-1.5 rounded-lg text-[10px] font-bold gap-1"
          title="Fullscreen (F)"
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
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
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);
  const ratio = useCanvaStore((s) => s.currentRatio());

  const handleSelect = (idx: number) => {
    goInteractivePage(idx);
    goPage(idx);
    onClose();
  };

  const templateIcon: Record<string, string> = {
    cover: '🏠', dokumen: '📋', materi: '📝', kuis: '❓',
    game: '🎮', hasil: '🏆', hero: '🚀', skenario: '🎭', custom: '⬜',
  };

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="text-center mb-4">
        <div className="text-sm font-bold text-slate-200">Overview — {pages.length} Halaman</div>
        {totalMax() > 0 && (
          <div className="text-[10px] text-emerald-400/60 mt-1">
            Skor: {totalScore()}/{totalMax()} ({Math.round((totalScore() / totalMax()) * 100)}%)
          </div>
        )}
        <div className="text-[9px] text-slate-500 mt-1">Klik halaman untuk navigasi • Tekan O atau Esc untuk tutup</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
        {pages.map((p, i) => {
          const isActive = i === interactivePageIdx;
          const isComplete = isPageComplete(i);
          const bgStyle = p.bgDataUrl
            ? { backgroundImage: `url('${p.bgDataUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : p.bgColor?.includes('gradient')
              ? { background: p.bgColor }
              : { background: p.bgColor || '#1a1a2e' };
          return (
            <button
              key={p.id}
              onClick={() => handleSelect(i)}
              className={`relative rounded-xl overflow-hidden transition-all hover:scale-105 ${
                isActive
                  ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'ring-1 ring-slate-700/40 hover:ring-slate-500/60'
              }`}
              style={{ aspectRatio: `${ratio.w}/${ratio.h}` }}
            >
              <div className="absolute inset-0" style={bgStyle}>
                <div className="absolute inset-0 bg-black/30" />
              </div>
              {/* Page label */}
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-[9px] font-bold text-white truncate">
                  {templateIcon[p.templateType] || '📄'} {p.label}
                </div>
                <div className="text-[7px] text-white/50">
                  Halaman {i + 1}/{pages.length}
                </div>
              </div>
              {/* Completion badge */}
              {isComplete && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">✓</span>
                </div>
              )}
              {/* Active indicator */}
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

// ── Play Element — Interactive element renderer for overlay ────

function PlayElement({ element, pageIndex }: { element: CanvaElement; pageIndex: number }) {
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const modules = useAuthoringStore((s) => s.modules);

  const handleComplete = useCallback(
    (score: number, maxScore: number) => {
      reportScore({
        elementId: element.id,
        pageIndex,
        score,
        maxScore,
        completed: true,
      });
    },
    [element.id, pageIndex, reportScore]
  );

  const isInteractive = element.type === 'kuis' || element.type === 'game';

  return (
    <div
      className={`absolute ${isInteractive ? 'ring-2 ring-emerald-400/50 rounded' : ''}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.w}%`,
        height: `${element.h}%`,
        opacity: (element.opacity ?? 100) / 100,
      }}
    >
      {element.type === 'kuis' && (
        <QuizWidget
          dataIdx={element.dataIdx}
          compact={false}
          onComplete={handleComplete}
        />
      )}
      {element.type === 'game' && (
        <GameWidget
          dataIdx={element.dataIdx}
          compact={false}
          onComplete={handleComplete}
        />
      )}
      {element.type === 'materi' && (
        <ModuleElementInteractive dataIdx={element.dataIdx} layoutVariant={element.layoutVariant as LayoutVariant} />
      )}
      {element.type === 'modul' && (
        <ModuleElementInteractive dataIdx={element.dataIdx} layoutVariant={element.layoutVariant as LayoutVariant} />
      )}
      {element.type === 'teks' && (
        <div
          className="w-full h-full outline-none"
          style={{
            fontSize: `${element.fontSize || 20}px`,
            fontWeight: 700,
            color: element.textColor || '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,.5)',
            lineHeight: 1.4,
            padding: 8,
          }}
        >
          {element.text || ''}
        </div>
      )}
      {element.type === 'shape' && (
        <div
          className="w-full h-full"
          style={{
            background: element.color || 'rgba(255,255,255,.15)',
            borderRadius: element.radius || 8,
          }}
        />
      )}
    </div>
  );
}

// ── Module Element Interactive ────────────────────────────────

function ModuleElementInteractive({ dataIdx, layoutVariant }: { dataIdx?: number; layoutVariant?: LayoutVariant }) {
  const modules = useAuthoringStore((s) => s.modules);
  const mod = dataIdx != null && dataIdx >= 0 && dataIdx < modules.length ? modules[dataIdx] : null;

  if (!mod) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-emerald-500/10 rounded border border-emerald-500/20 p-2">
        <span className="text-2xl">🧩</span>
        <span className="text-[10px] font-bold text-emerald-300 mt-1">Modul</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-1">
      <PresetModuleCard
        mode="canvas"
        module={mod}
        layoutVariant={layoutVariant || (mod.layoutVariant as LayoutVariant) || 'A'}
      />
    </div>
  );
}
