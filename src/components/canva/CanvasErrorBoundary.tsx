'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Canvas Error Boundary — prevents a single component crash
// from taking down the entire canvas editor.
//
// Usage: <CanvasErrorBoundary name="PageRenderer">
//          <PageRenderer ... />
//        </CanvasErrorBoundary>
// ═══════════════════════════════════════════════════════════════

interface Props {
  children: React.ReactNode;
  name?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CanvasErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[CanvasErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/20 rounded-lg p-4 text-center">
          <AlertTriangle size={24} className="mb-2" />
          <div className="text-xs text-red-400 font-semibold mb-1">
            {this.props.name ? `${this.props.name} error` : 'Component error'}
          </div>
          <div className="text-[10px] text-red-400/60 max-w-[200px] break-words">
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1 rounded bg-red-500/20 text-red-300 text-[10px] hover:bg-red-500/30 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
