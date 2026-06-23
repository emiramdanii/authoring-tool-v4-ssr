'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, Component, ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════════
// BootLoadingFallback — loading screen with 8s timeout + recovery
// V3-PHASE-1B: Prevents infinite loading if chunk import hangs
// ═══════════════════════════════════════════════════════════════

function BootLoadingFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleReload = () => location.reload();
  const handleResetCache = () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    location.reload();
  };

  if (timedOut) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-slate-800 text-base font-semibold mb-2">Aplikasi lama memuat</h2>
          <p className="text-slate-500 text-sm mb-6">
            Jika halaman tidak muncul dalam beberapa detik, coba muat ulang atau reset cache lokal.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={handleReload} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Coba Muat Ulang</button>
            <button onClick={handleResetCache} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Reset Cache Lokal</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
          <span className="text-2xl">📚</span>
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

// ═══════════════════════════════════════════════════════════════
// AppBootErrorBoundary — catch runtime errors after chunk loads
// V3-PHASE-1B: Prevents stuck loading if AuthoringTool crashes
// ═══════════════════════════════════════════════════════════════

class AppBootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[APP_BOOT] Runtime error caught:', error, errorInfo);
  }

  handleReload = () => location.reload();
  handleResetCache = () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message ?? 'Unknown error';
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md px-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-slate-800 text-base font-semibold mb-2">Aplikasi Gagal Dimuat</h2>
            <p className="text-slate-500 text-xs mb-2 font-mono bg-slate-100 rounded-lg p-3 break-all">{errMsg}</p>
            <p className="text-slate-400 text-xs mb-6">Coba reset cache lokal atau muat ulang.</p>
            <div className="flex flex-col gap-2">
              <button onClick={this.handleReload} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Muat Ulang</button>
              <button onClick={this.handleResetCache} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Reset Cache Lokal</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════════
// Dynamic import with error catch
// ═══════════════════════════════════════════════════════════════

const AuthoringTool = dynamic(() =>
  import('@/components/authoring/AuthoringTool').catch((err) => {
    console.error('[APP_BOOT] Failed to load AuthoringTool chunk:', err);
    throw err;
  }),
  { ssr: false, loading: () => <BootLoadingFallback /> },
);

export default function Home() {
  return (
    <AppBootErrorBoundary>
      <AuthoringTool />
    </AppBootErrorBoundary>
  );
}
