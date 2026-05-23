// ═══════════════════════════════════════════════════════════════════════
// EXPORT INDEX — Main entry point for the client-side export pipeline
// ═══════════════════════════════════════════════════════════════════════
// Generates a self-contained HTML file that renders the MPI without
// any server dependency. All CSS, JS, and data are inlined.
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import { renderPageHtml } from './html-templates';
import { getCss } from './styles';
import { getJs } from './scripts';

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
  const pagesHtml = pages.map((page, i) => renderPageHtml(page, i, pages.length));

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

  const dataJson = JSON.stringify(exportData)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f');

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
      <button id="prev-btn" onclick="prevPage()" title="Halaman sebelumnya (←)">← Sebelumnya</button>
      <span id="page-counter">1/${pages.length}</span>
      <button id="next-btn" onclick="nextPage()" title="Halaman berikutnya (→)">Selanjutnya →</button>
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
