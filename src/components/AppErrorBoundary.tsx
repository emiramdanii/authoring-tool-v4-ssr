'use client';

// ═══════════════════════════════════════════════════════════════
// APP ERROR BOUNDARY — Global crash recovery
// ═══════════════════════════════════════════════════════════════
// Catches any unhandled errors in the entire app that aren't
// already caught by CanvasErrorBoundary or BlockErrorBoundary.
// Shows a friendly error screen in Indonesian with recovery options.
//
// Usage: <AppErrorBoundary>{children}</AppErrorBoundary>
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { AlertTriangle, RefreshCw, Save, ChevronDown } from 'lucide-react';
import { logger } from '@/core/utils/logger';

// ── Storage key for emergency save before reload ──────────────
const EMERGENCY_SAVE_KEY = 'silse_app_error_recovery';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  saving: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      saving: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('AppErrorBoundary', error, info.componentStack);
    this.setState({ errorInfo: info });
  }

  // ── Save current canva state to localStorage before reloading ──
  handleSaveAndReload = async () => {
    this.setState({ saving: true });
    try {
      // Attempt to save the current canva store state before reloading.
      // We use a dynamic import to avoid pulling the store into the
      // error boundary bundle, and to gracefully handle the case where
      // the store itself is broken.
      const { useCanvaStore } = await import('@/store/canva-store');
      const store = useCanvaStore.getState();

      // Save current state as an emergency snapshot
      const emergencyData = {
        pages: store.pages,
        ratioId: store.ratioId,
        _emergencySavedAt: Date.now(),
        _source: 'AppErrorBoundary',
      };

      localStorage.setItem(EMERGENCY_SAVE_KEY, JSON.stringify(emergencyData));

      // Also trigger the normal save path if available
      if (typeof store.saveToStorage === 'function') {
        try {
          store.saveToStorage();
        } catch {
          // Normal save may fail — emergency save above is the fallback
        }
      }
    } catch (err) {
      logger.error('AppErrorBoundary:SaveAndReload', err);
    } finally {
      // Reload regardless of save success/failure
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails, saving } = this.state;
    const errorMessage = error?.message || 'Kesalahan tidak diketahui';
    const componentStack = errorInfo?.componentStack || '';

    // Mode-aware: check teacher mode from localStorage (store may be broken)
    let isSederhana = false;
    try {
      const raw = localStorage.getItem('at_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        isSederhana = parsed.teacherMode === true;
      }
    } catch { /* ignore */ }

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* ── Error card ──────────────────────────────────── */}
          <div className="rounded-xl border border-red-500/20 bg-card p-6 shadow-lg">
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground">
                  {isSederhana ? 'Ada Masalah' : 'Terjadi Kesalahan'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isSederhana
                    ? 'Aplikasi mengalami gangguan. Data Anda bisa disimpan dengan tombol di bawah.'
                    : 'Aplikasi mengalami kesalahan yang tidak terduga. Data Anda mungkin belum tersimpan. Gunakan tombol di bawah untuk memulihkan.'
                  }
                </p>
              </div>
            </div>

            {/* Error message preview — hide in sederhana */}
            {!isSederhana && (
              <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 mb-4">
                <p className="text-xs text-red-400 font-mono break-words leading-relaxed">
                  {errorMessage.length > 200
                    ? `${errorMessage.slice(0, 200)}...`
                    : errorMessage}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={this.handleSaveAndReload}
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" aria-hidden="true" />
                {saving ? 'Menyimpan...' : isSederhana ? 'Simpan & Muat Ulang' : 'Simpan & Muat Ulang'}
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Muat Ulang
              </button>
            </div>

            {/* Help text — mode-aware */}
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              {isSederhana
                ? <> <strong>Simpan & Muat Ulang</strong> akan menyimpan data Anda lalu memuat ulang halaman. </>
                : <> <strong>Simpan & Muat Ulang</strong> akan menyimpan data saat ini ke penyimpanan lokal sebelum memuat ulang halaman. Jika masalah berlanjut, coba muat ulang tanpa menyimpan. </>
              }
            </p>

            {/* Collapsible error details — only in lengkap mode */}
            {!isSederhana && (
              <div className="mt-4 border-t border-border pt-3">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={showDetails}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                  Detail Teknis (untuk debugging)
                </button>

                {showDetails && (
                  <div className="mt-2 space-y-2">
                    {/* Error name + message */}
                    <div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        Error
                      </div>
                      <pre className="text-[10px] text-red-400/80 bg-red-500/5 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                        {error?.stack || errorMessage}
                      </pre>
                    </div>

                    {/* Component stack */}
                    {componentStack && (
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Component Stack
                        </div>
                        <pre className="text-[10px] text-muted-foreground/60 bg-muted/50 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                          {componentStack}
                        </pre>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-[9px] text-muted-foreground/40 font-mono">
                      {new Date().toISOString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer branding */}
          <div className="text-center mt-4">
            <p className="text-[10px] text-muted-foreground/40">
              SILSE Authoring Tool v4 — Error Boundary
            </p>
          </div>
        </div>
      </div>
    );
  }
}
