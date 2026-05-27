// ═══════════════════════════════════════════════════════════════════
// BLOCK ERROR BOUNDARY — Per-block crash isolation
// ═══════════════════════════════════════════════════════════════════
// If a single block renderer crashes (e.g. bad data, missing field),
// this boundary catches the error and shows a graceful fallback.
// The rest of the page continues rendering normally.
//
// Usage: <BlockErrorBoundary blockType="kuis" blockId="blk-123">
//          <BlockComponent ... />
//        </BlockErrorBoundary>

'use client';

import React, { Component } from 'react';
import { logger } from '@/core/utils/logger';

interface BlockErrorBoundaryProps {
  blockType: string;
  blockId: string;
  children: React.ReactNode;
}

interface BlockErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  constructor(props: BlockErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<BlockErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console for debugging (not to user)
    logger.error(
      `BlockErrorBoundary:${this.props.blockType}:${this.props.blockId}`,
      error,
      errorInfo
    );
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { blockType, blockId } = this.props;
      const errorMessage = this.state.error?.message || 'Kesalahan tidak diketahui';

      // Check teacher mode from localStorage (store may be broken)
      let isSederhana = false;
      try {
        const raw = localStorage.getItem('at_state_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          isSederhana = parsed.teacherMode === true;
        }
      } catch { /* ignore */ }

      return (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 my-2"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  {isSederhana ? 'Ada Masalah' : 'Blok Error'}
                </span>
                {!isSederhana && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/80 font-mono">
                    {blockType}
                  </span>
                )}
              </div>
              <p className="text-xs text-red-300/80 mb-2 leading-relaxed">
                {isSederhana
                  ? 'Bagian ini tidak bisa ditampilkan. Bagian lain tetap normal.'
                  : 'Terjadi kesalahan saat menampilkan blok ini. Blok lain tidak terpengaruh.'
                }
              </p>
              {!isSederhana && (
                <details className="text-[11px] text-red-400/50 mb-3">
                  <summary className="cursor-pointer hover:text-red-400/70 transition-colors">
                    Detail teknis
                  </summary>
                  <pre className="mt-1 p-2 rounded bg-black/20 overflow-x-auto whitespace-pre-wrap break-all">
                    {errorMessage}
                  </pre>
                </details>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleRetry}
                  className="px-3 py-1 text-[11px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  Coba Lagi
                </button>
                {!isSederhana && (
                  <span className="text-[10px] text-red-400/40 font-mono">
                    id: {blockId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SAFE MODE BLOCK GATE — Disables complex blocks in safe mode
// ═══════════════════════════════════════════════════════════════════
// In safe mode, game blocks and other complex features are disabled
// to prevent further corruption or crashes. This component wraps
// block renderers and shows a fallback when the block is gated.
//
// Usage: <SafeModeBlockGate blockType="sortir-game">
//          <GameBlock ... />
//        </SafeModeBlockGate>
// ═══════════════════════════════════════════════════════════════════

import { isFeatureAllowed, type SafeModeFeature, SAFE_MODE_DISABLED_FEATURES } from '@/core/recovery';
import { useCanvaStore } from '@/store/canva-store';

/** Block types that are gated by specific safe mode features */
const BLOCK_TYPE_TO_FEATURE: Record<string, SafeModeFeature> = {
  'sortir-game': 'game-blocks',
  'roda-game': 'game-blocks',
  'memory-game': 'game-blocks',
  'matching-game': 'game-blocks',
  'fill-blank-game': 'game-blocks',
  'word-search-game': 'game-blocks',
  'true-false-game': 'game-blocks',
  'drag-drop-game': 'game-blocks',
  'crossword-game': 'game-blocks',
  'team-buzzer-game': 'game-blocks',
};

interface SafeModeBlockGateProps {
  blockType: string;
  children: React.ReactNode;
}

/**
 * Gate that prevents complex blocks from rendering in safe mode.
 * In safe mode, game blocks and other gated features show a
 * placeholder instead of the full block (preventing potential crashes).
 *
 * FASE 6: Now reads safeMode from the Zustand store (reactive)
 * instead of raw sessionStorage. This ensures the gate updates
 * immediately when safe mode is toggled, without stale reads.
 */
export function SafeModeBlockGate({ blockType, children }: SafeModeBlockGateProps) {
  // Read safeMode from Zustand store — reactive and in sync with UI
  const safeMode = useCanvaStore((s) => s.safeMode);

  if (!safeMode) return <>{children}</>;

  // Check if this block type is gated in safe mode
  const feature = BLOCK_TYPE_TO_FEATURE[blockType];
  if (!feature || isFeatureAllowed(feature, safeMode)) {
    return <>{children}</>;
  }

  // Block is gated — show safe mode placeholder
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 my-2 flex items-center gap-2">
      <span className="text-xs text-amber-400/80 flex-shrink-0">🛡️</span>
      <div className="text-xs text-amber-300/70">
        <span className="font-semibold">{blockType}</span>
        {' — ditonaktifkan di Mode Aman'}
      </div>
    </div>
  );
}
