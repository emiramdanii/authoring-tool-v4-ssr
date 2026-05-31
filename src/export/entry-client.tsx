// ═══════════════════════════════════════════════════════════════════════
// EXPORT ENTRY CLIENT — Client-side entry point for exported HTML
// Pre-populates Zustand stores from window.__EXPORT_DATA__,
// then hydrates the React app using the SAME components as preview.
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { createRoot } from 'react-dom/client';
import ExportApp from './ExportApp';
import './export.css';
import { logger } from '@/core/utils/logger';

// ── Import stores for pre-population ─────────────────────────────
import { useAuthoringStore } from '@/store/authoring-store';
import type { AuthoringState } from '@/store/authoring/types';
import { useCanvaStore } from '@/store/canva-store';
import type { CanvaState } from '@/store/canva/types';
import { useInteractiveStore, setCanvaStoreRef } from '@/store/interactive-store';

// ── Error Boundary for export mode ────────────────────────────────
// Catches render errors in any template component and shows a
// user-friendly fallback instead of a blank white screen.
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ExportErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('Export', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#ffffff',
          color: '#e8f2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: "'Nunito', sans-serif",
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <span className="material-symbols-outlined text-amber-400" style={ { fontSize: '48px' } }>warning</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Terjadi Kesalahan
            </div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Komponen gagal ditampilkan. Coba muat ulang halaman.
            </div>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: 8,
                background: '#f9c82e',
                color: '#1e293b',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Muat Ulang
            </button>
            <details style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
              <summary>Detail Teknis</summary>
              <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.message || 'Kesalahan tidak diketahui'}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Get export data injected by the build/API pipeline ───────────
const exportData = window.__EXPORT_DATA__;

if (exportData) {
  // Validate essential structure
  if (!exportData.pages || !Array.isArray(exportData.pages)) {
    logger.error('Export', '__EXPORT_DATA__.pages is missing or not an array.');
  }

  // 1. Pre-populate authoring store with quiz, modules, meta data
  const authPartial: Partial<AuthoringState> = {};

  if (exportData.allKuis) authPartial.kuis = exportData.allKuis;
  if (exportData.allModules) authPartial.modules = exportData.allModules;
  if (exportData.games) authPartial.games = exportData.games;
  if (exportData.meta) authPartial.meta = exportData.meta;
  if (exportData.cp) authPartial.cp = exportData.cp;
  if (exportData.tp) authPartial.tp = exportData.tp;
  if (exportData.materi) authPartial.materi = exportData.materi;
  if (exportData.skenario) authPartial.skenario = exportData.skenario;
  if (exportData.petunjuk) authPartial.petunjuk = exportData.petunjuk;
  if (exportData.diskusi) authPartial.diskusi = exportData.diskusi;
  if (exportData.refleksi) authPartial.refleksi = exportData.refleksi;
  if (exportData.penutup) authPartial.penutup = exportData.penutup;

  if (exportData.atp) authPartial.atp = exportData.atp;
  if (exportData.alur) authPartial.alur = exportData.alur;
  if (exportData.suara) authPartial.suara = exportData.suara;

  if (Object.keys(authPartial).length > 0) {
    useAuthoringStore.setState(authPartial);
  }

  // 2. Pre-populate canva store with pages + ratio
  //    MUST be set before interactive store so the auto-sync reads correct data.
  const canvaPartial: Partial<CanvaState> = {};
  if (exportData.pages) canvaPartial.pages = exportData.pages;
  if (exportData.ratioId != null) canvaPartial.ratioId = exportData.ratioId;
  canvaPartial.currentPageIndex = 0;

  if (Object.keys(canvaPartial).length > 0) {
    useCanvaStore.setState(canvaPartial);
  }

  // 3. Set interactive store canva ref — breaks circular dependency
  //    This is essential for interactive-store's syncTotalPages() to work,
  //    which is called by navigation methods (goInteractivePage, etc.).
  //    Without this, those methods would throw errors.
  setCanvaStoreRef(useCanvaStore);

  // 4. Set interactive store to interactive mode with fresh state
  //    Clear scores and reset so each export session starts clean.
  useInteractiveStore.setState({
    mode: 'interactive',
    interactivePageIdx: 0,
    totalPages: exportData.pages?.length || 0,
    scores: [],
    replayGeneration: 0,
  });
} else {
  logger.error('Export', 'window.__EXPORT_DATA__ is missing. Export data was not injected by the API route.');
}

// ── Render the Export App with Error Boundary ────────────────────
// Note: No React.StrictMode — unnecessary in standalone export HTML
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <ExportErrorBoundary>
      <ExportApp />
    </ExportErrorBoundary>
  );
}
