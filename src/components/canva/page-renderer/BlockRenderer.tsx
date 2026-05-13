'use client';

import React, { useCallback } from 'react';
import type { CanvaElement } from '../types';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { resolveModule } from '@/lib/module-resolver';
import QuizWidget from '../QuizWidget';
import GameWidget from '../GameWidget';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/preset-module-card';
import { COLORS } from '@/lib/color-palette';

// ═══════════════════════════════════════════════════════════════
// BLOCK RENDERER — Unified element renderer for all contexts
//
// Renders kuis, game, materi, modul, teks, shape blocks.
// Used by PageRenderer instead of duplicating element rendering
// in Stage, PlayOverlay, and ExportApp.
// ═══════════════════════════════════════════════════════════════

export type BlockRendererMode = 'canvas' | 'preview' | 'export';

export interface BlockRendererProps {
  /** The element to render */
  element: CanvaElement;
  /** Which render context */
  mode: BlockRendererMode;
  /** Page index for score reporting */
  pageIndex: number;
  /** Whether this block is interactive (playable) */
  interactive?: boolean;
  /** Whether to show compact mode (canvas preview) */
  compact?: boolean;
  /** Score completion callback */
  onScoreComplete?: (score: number, maxScore: number) => void;
  /** Optional className for the wrapper */
  className?: string;
  /** Optional style overrides for the wrapper */
  style?: React.CSSProperties;
}

export function BlockRenderer({
  element,
  mode,
  pageIndex,
  interactive = false,
  compact = false,
  onScoreComplete,
  className,
  style,
}: BlockRendererProps) {
  const reportScore = useInteractiveStore((s) => s.reportScore);

  const handleComplete = useCallback((score: number, maxScore: number) => {
    if (maxScore === 0) return; // Skip non-scored games
    // Report to interactive store
    reportScore({ elementId: element.id, pageIndex, score, maxScore, completed: true });
    // Also call the custom callback if provided
    onScoreComplete?.(score, maxScore);
  }, [element.id, pageIndex, reportScore, onScoreComplete]);

  const isInteractive = element.type === 'kuis' || element.type === 'game';

  const wrapperClass = `absolute ${isInteractive && interactive ? 'ring-2 ring-emerald-400/50 rounded' : ''} ${className || ''}`;

  const wrapperStyle: React.CSSProperties = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: `${element.w}%`,
    height: `${element.h}%`,
    opacity: (element.opacity ?? 100) / 100,
    ...style,
  };

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {element.type === 'kuis' && (
        <QuizWidget
          dataIdx={element.dataIdx}
          kuisId={element.kuisId}
          kuisIds={element.kuisIds}
          compact={compact}
          interactive={interactive}
          onComplete={interactive ? handleComplete : undefined}
        />
      )}
      {element.type === 'game' && (
        <GameWidget
          dataIdx={element.dataIdx}
          moduleId={element.moduleId}
          compact={compact}
          interactive={interactive}
          onComplete={interactive ? handleComplete : undefined}
        />
      )}
      {(element.type === 'materi' || element.type === 'modul') && (
        <ModuleBlock element={element} compact={compact} mode={mode} />
      )}
      {element.type === 'teks' && (
        <div
          className="w-full h-full outline-none"
          style={{
            fontSize: `${element.fontSize || 20}px`,
            fontWeight: element.fontWeight || 700,
            color: element.textColor || COLORS.textWhite,
            textAlign: element.textAlign || 'left',
            textShadow: '0 2px 8px rgba(0,0,0,.5)',
            lineHeight: 1.4,
            padding: 8,
          }}
        >
          {interactive ? (element.text || '') : (element.text || 'Ketik teks…')}
        </div>
      )}
      {element.type === 'shape' && (
        <div
          className="w-full h-full rounded-lg"
          style={{
            background: element.color || 'rgba(255,255,255,.15)',
            borderRadius: element.radius || 8,
          }}
        />
      )}
      {element.type === 'image' && (
        element.imageUrl ? (
          <img
            src={element.imageUrl}
            alt={element.label || 'Gambar'}
            className="w-full h-full rounded-lg"
            style={{ objectFit: element.imageFit || 'cover' }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-orange-500/10 rounded-lg border border-orange-500/20">
            <span className="text-2xl">🖼️</span>
            <span className="text-[9px] font-bold text-orange-300 mt-1">Gambar</span>
            <span className="text-[7px] text-orange-400/60">Pilih gambar di panel properti</span>
          </div>
        )
      )}
    </div>
  );
}

// ── Module Block — uses PresetModuleCard for visual fidelity ──

// Map BlockRendererMode to PresetModuleCardMode
function toModuleCardMode(mode: BlockRendererMode): 'canvas' | 'export' {
  // Both 'preview' and 'export' should render as 'export' mode
  // (full visual fidelity, no edit controls)
  return mode === 'canvas' ? 'canvas' : 'export';
}

function ModuleBlock({ element, compact, mode }: { element: CanvaElement; compact: boolean; mode: BlockRendererMode }) {
  const modules = useAuthoringStore((s) => s.modules);
  const mod = resolveModule(element, modules);

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
        mode={toModuleCardMode(mode)}
        module={mod}
        compact={compact}
        layoutVariant={(element.layoutVariant as LayoutVariant) || (mod.layoutVariant as LayoutVariant) || 'A'}
      />
    </div>
  );
}
