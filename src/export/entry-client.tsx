// ═══════════════════════════════════════════════════════════════════════
// EXPORT ENTRY CLIENT — Client-side entry point for exported HTML
// Pre-populates Zustand stores from window.__EXPORT_DATA__,
// then hydrates the React app using the SAME components as preview.
// ═══════════════════════════════════════════════════════════════════════

import React from 'react';
import { createRoot } from 'react-dom/client';
import ExportApp from './ExportApp';
import './export.css';

// ── Import stores for pre-population ─────────────────────────────
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';

// ── Get export data injected by the build/API pipeline ───────────
const exportData = (window as any).__EXPORT_DATA__;

if (exportData) {
  // 1. Pre-populate authoring store with quiz, modules, meta data
  //    This makes QuizWidget, GameWidget, and all template components
  //    work exactly as they do in preview mode.
  const authPartial: Record<string, unknown> = {};

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
    useAuthoringStore.setState(authPartial as any);
  }

  // 2. Pre-populate canva store with pages + ratio
  //    This is needed for interactiveStore sync and any component
  //    that reads from canvaStore.
  const canvaPartial: Record<string, unknown> = {};
  if (exportData.pages) canvaPartial.pages = exportData.pages;
  if (exportData.ratioId != null) canvaPartial.ratioId = exportData.ratioId;
  canvaPartial.currentPageIndex = 0;

  if (Object.keys(canvaPartial).length > 0) {
    useCanvaStore.setState(canvaPartial as any);
  }

  // 3. Set interactive store to interactive mode
  //    This enables score tracking, navigation, and the interactive UI
  useInteractiveStore.setState({
    mode: 'interactive',
    interactivePageIdx: 0,
    totalPages: exportData.pages?.length || 0,
    scores: [],
  });
}

// ── Render the Export App ────────────────────────────────────────
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ExportApp />
    </React.StrictMode>
  );
}
