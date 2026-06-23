'use client';

// ═══════════════════════════════════════════════════════════════
// V3-PHASE-3 — App Boot Guard
// ═══════════════════════════════════════════════════════════════
// Three-layer boot guard for the home route:
//
//   1. BootLoadingFallback — spinner with an 8-second timeout. If the
//      AuthoringTool chunk takes longer than 8s to load (e.g. stuck
//      network, slow CDN, dev server cold start), we switch to a
//      recovery screen with "Coba Lagi" + "Reset Cache Lokal".
//
//   2. AppBootErrorBoundary — class component that catches runtime
//      errors from the dynamically imported AuthoringTool (hydration
//      mismatches, schema corruption, store init errors). Renders a
//      recovery screen with the error message + retry options.
//
//   3. Dynamic import catch — when the chunk itself fails to load
//      (network error, 5xx from static host), the error propagates
//      through React.lazy / next/dynamic and is caught by the same
//      AppBootErrorBoundary.
//
// The "Reset Cache Lokal" button clears all mpi*/canva*/authoring*/zustand*
// localStorage keys then reloads — useful when stale persisted state
// is preventing the app from booting cleanly.
// ═══════════════════════════════════════════════════════════════

import dynamic from 'next/dynamic';
import React, { Component, useState, useEffect, useCallback } from 'react';

// ── Cache reset helper ───────────────────────────────────────
function resetLocalCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const APP_KEY_PREFIXES = ['mpi', 'canva', 'authoring', 'zustand', 'persisted'];
    keys.forEach((k) => {
      if (APP_KEY_PREFIXES.some((p) => k.toLowerCase().startsWith(p))) {
        localStorage.removeItem(k);
      }
    });
    // Best-effort: clear sessionStorage too.
    const sKeys = Object.keys(sessionStorage);
    sKeys.forEach((k) => {
      if (APP_KEY_PREFIXES.some((p) => k.toLowerCase().startsWith(p))) {
        sessionStorage.removeItem(k);
      }
    });
  } catch {
    // localStorage may be unavailable in some sandbox modes; ignore.
  }
}

// ── 1. BootLoadingFallback ───────────────────────────────────
// Spinner with 8s timeout → recovery screen.
function BootLoadingFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleResetCache = useCallback(() => {
    resetLocalCache();
    window.location.reload();
  }, []);

  if (timedOut) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-600" aria-hidden="true" style={{ fontSize: '28px' }}>hourglass_disabled</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Memuat terlalu lama</h1>
          <p className="text-sm text-slate-500 mb-6">
            Aplikasi gagal dimuat dalam 8 detik. Mungkin cache lokal bermasalah atau koneksi tidak stabil.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleRetry}
              type="button"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              Coba Lagi
            </button>
            <button
              onClick={handleResetCache}
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              Reset Cache Lokal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
          <span className="text-2xl" aria-hidden="true">📚</span>
        </div>
        <div className="text-slate-800 text-sm font-semibold">Authoring Tool v4</div>
        <div className="text-slate-500 text-xs mt-1">Memuat Media Pembelajaran Interaktif...</div>
        <div className="mt-4 w-32 h-1 mx-auto bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

// ── 2. AppBootErrorBoundary ──────────────────────────────────
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class AppBootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[APP_BOOT] Runtime error caught by boundary:', error, info);
    this.setState({ errorInfo: info });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetCache = (): void => {
    resetLocalCache();
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isChunkError =
      this.state.error?.name === 'ChunkLoadError' ||
      /Loading chunk|Failed to fetch dynamically imported module|Loading CSS chunk/i.test(
        this.state.error?.message ?? '',
      );

    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-600" aria-hidden="true" style={{ fontSize: '28px' }}>
              {isChunkError ? 'cloud_off' : 'error'}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-2">
            {isChunkError ? 'Gagal memuat berkas aplikasi' : 'Aplikasi gagal dimuat'}
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            {isChunkError
              ? 'Berkas JavaScript tidak dapat dimuat. Biasanya karena koneksi terputus atau versi cache sudah kedaluwarsa.'
              : 'Terjadi kesalahan tak terduga saat memuat Authoring Tool. Coba reset cache lokal jika masalah berulang.'}
          </p>

          {this.state.error?.message && (
            <details className="text-xs text-slate-500 mb-4 bg-slate-100 rounded-lg p-3 text-left max-h-40 overflow-y-auto">
              <summary className="cursor-pointer font-medium text-slate-600">Detail error</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all font-mono">
                {this.state.error.message}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={this.handleRetry}
              type="button"
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              Coba Lagi
            </button>
            <button
              onClick={this.handleReload}
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={this.handleResetCache}
              type="button"
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              Reset Cache Lokal
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// ── 3. Dynamic import with chunk-load error path ─────────────
// next/dynamic propagates chunk-load failures through React's render
// path, so the AppBootErrorBoundary above will catch them. We add a
// thin wrapper around the import to also log the failure for debug.
const AuthoringTool = dynamic(
  () =>
    import('@/components/authoring/AuthoringTool').catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[APP_BOOT] AuthoringTool chunk load failed:', err);
      // Re-throw so the error boundary can render the recovery screen.
      throw err;
    }),
  {
    ssr: false,
    loading: () => <BootLoadingFallback />,
  },
);

// ── Home (default export) ────────────────────────────────────
export default function Home() {
  // resetKey lets us force-remount AuthoringTool when the user clicks
  // "Coba Lagi" inside the error boundary (without a full page reload).
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  return (
    <AppBootErrorBoundary onReset={handleReset}>
      <AuthoringTool key={resetKey} />
    </AppBootErrorBoundary>
  );
}
