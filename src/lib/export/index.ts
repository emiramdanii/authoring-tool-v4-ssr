// ═══════════════════════════════════════════════════════════════════════
// EXPORT INDEX — ⛔ DEPRECATED client-side export pipeline
// ═══════════════════════════════════════════════════════════════════════
// ⛔ DEPRECATED: This folder contains the legacy vanilla JS export
// pipeline. It produces DEGRADED output — no navigation locks, no
// contract-aware rendering, no premium effects, basic quiz layout.
//
// The ONLY production export is Path A: Vite SSR via /api/export.
// If Path A fails, the user gets a clear error message — NOT a
// silent fallback to this degraded pipeline.
//
// D-P0F: src/lib/client-export.ts has been deleted (0 imports).
// exportClientSide/previewClientSide are deprecated and should not
// be used in production. This folder will be removed in a future sprint.
//
// This code is kept ONLY for:
//   - Dev/debug use (exportClientSide in use-vite-export.ts) — DEPRECATED
//   - Test files (export-pipeline.test.ts, rc-stabilization.test.ts)
//
// Do NOT use this for the teacher export flow.
// Do NOT add new features here — add them to the Vite SSR pipeline.
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import { renderPageHtml } from './html-templates';
import { getCss } from './styles';
import { getJs } from './scripts';
import { renderQuizBlock, createExportRenderContext, type ExportRenderContext, resetBlockIdRegistry } from './quiz-renderers';
import { serializeForHtmlScript } from './serialize-html-script';

// ── Export Data shape (mirrors the API route payload) ────────────────
export interface ClientExportPayload {
  pages: CanvaPage[];
  ratioId: string;
  meta: Record<string, unknown>;
  allKuis: unknown[];
  allModules: unknown[];
  games: unknown[];
  cp: Record<string, unknown>;
  tp: unknown[];
  atp: Record<string, unknown>;
  alur: unknown[];
  materi: Record<string, unknown>;
  skenario: unknown[];
  petunjuk: Record<string, unknown>;
  diskusi: Record<string, unknown>;
  refleksi: Record<string, unknown>;
  penutup: Record<string, unknown>;
  suara: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN: Generate the complete self-contained HTML
// ═══════════════════════════════════════════════════════════════════

export function generateClientExportHtml(payload: ClientExportPayload): string {
  const { pages, ratioId, meta } = payload;

  // Create a fresh render context for this export run.
  // One export = one context = no global reset needed.
  // This replaces the old resetBlockIdRegistry() pattern.
  const ctx = createExportRenderContext();

  // Determine aspect ratio
  const ratioMap: Record<string, [number, number]> = {
    '16:9': [1280, 720],
    '9:16': [720, 1280],
    '1:1': [800, 800],
    'A4': [794, 1123],
    '4:3': [1024, 768],
  };
  const [ratioW, ratioH] = ratioMap[ratioId] || [1280, 720];

  // Title
  const metaObj = meta as Record<string, string>;
  const title = `${metaObj?.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${metaObj?.mapel || ''} ${metaObj?.kelas || ''}`;

  // Render pages as HTML strings
  const pagesHtml = pages.map((page, i) => renderPageHtml(page, i, pages.length, ctx));

  // Build export data for the JS runtime
  const exportData = {
    pages: pages.map(p => ({
      id: p.id,
      label: p.label,
      templateType: p.templateType,
      schema: p.schema,
    })),
    ratioW,
    ratioH,
    ratioId,
    meta,
    pagesHtml,
    totalPages: pages.length,
  };

  const dataJson = serializeForHtmlScript(exportData);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>${getCss(ratioW, ratioH)}</style>
</head>
<body>
  <div id="app">
    <div id="canvas-container">
      <div id="canvas"></div>
    </div>
    <div id="a11y-live" class="sr-only" aria-live="polite" role="status" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"></div>
    <div id="nav-bar" role="navigation" aria-label="Navigasi halaman">
      <button id="prev-btn" onclick="prevPage()" title="Halaman sebelumnya (←)" aria-label="Halaman sebelumnya">← Sebelumnya</button>
      <span id="page-counter">1/${pages.length}</span>
      <button id="next-btn" onclick="nextPage()" title="Halaman berikutnya (→)" aria-label="Halaman berikutnya">Selanjutnya →</button>
      <button id="fullscreen-btn" onclick="toggleFullscreen()" title="Layar penuh (F)">⛶</button>
    </div>
  </div>
  <script>window.__EXPORT_DATA__=${dataJson};</script>
  <script>${getJs()}</script>
</body>
</html>`;
}

/**
 * Generate a filename from metadata
 */
export function generateExportFilename(meta: Record<string, unknown>): string {
  const judul = ((meta.judulPertemuan as string) || 'media-pembelajaran')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
  return `${judul || 'media-pembelajaran'}-client-export.html`;
}

// Re-export utilities for convenience
export { escapeHtml, resolveColor, TOKEN_COLORS } from './utils';
export { renderBlockHtml } from './html-templates';
export { createExportRenderContext, type ExportRenderContext } from './quiz-renderers';
