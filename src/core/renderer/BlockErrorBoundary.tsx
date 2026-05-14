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
      const errorMessage = this.state.error?.message || 'Unknown error';

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
                  Blok Error
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/80 font-mono">
                  {blockType}
                </span>
              </div>
              <p className="text-xs text-red-300/80 mb-2 leading-relaxed">
                Terjadi kesalahan saat menampilkan blok ini. Blok lain tidak terpengaruh.
              </p>
              <details className="text-[10px] text-red-400/50 mb-3">
                <summary className="cursor-pointer hover:text-red-400/70 transition-colors">
                  Detail teknis
                </summary>
                <pre className="mt-1 p-2 rounded bg-black/20 overflow-x-auto whitespace-pre-wrap break-all">
                  {errorMessage}
                </pre>
              </details>
              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleRetry}
                  className="px-3 py-1 text-[10px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  Coba Lagi
                </button>
                <span className="text-[9px] text-red-400/40 font-mono">
                  id: {blockId}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
