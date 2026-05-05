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

// ═══════════════════════════════════════════════════════════════
// PLAY OVERLAY — Full-screen interactive preview overlay
// Renders pages from canva-store in interactive mode with
// navigation, scoring, and close button.
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
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-700/50">
      <div className="flex items-center gap-3">
        <span className="text-sm">🎮</span>
        <span className="text-xs font-bold text-emerald-400">Mode Interaktif</span>
        <span className="text-[10px] text-zinc-500">•</span>
        <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
          {page?.label || `Halaman ${interactivePageIdx + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Score badge in header */}
        {hasScore && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25">
            <span className="text-xs">🏆</span>
            <span className="text-xs font-black text-amber-300">{totalScore()}/{totalMax()}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-2 text-[9px] text-zinc-600">
          <span>← → navigasi</span>
          <span>Esc tutup</span>
        </div>

        <button
          onClick={closePlay}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors"
        >
          ✕ Tutup
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!page) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Tidak ada halaman</div>
      </div>
    );
  }

  const isTemplateMode = page.templateType && page.templateType !== 'custom';

  return (
    <div ref={canvasRef} className="w-full h-full flex items-center justify-center">
      <div
        className="relative overflow-hidden shadow-2xl shadow-black/50"
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
                <div className="text-zinc-600 text-sm mb-2">Halaman kosong</div>
                <div className="text-zinc-700 text-xs">Kembali ke mode desain untuk menambahkan konten</div>
              </div>
            )}
          </div>
        )}
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

  return (
    <div
      className="absolute"
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
