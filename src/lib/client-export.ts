// ═══════════════════════════════════════════════════════════════════════
// CLIENT-SIDE EXPORT — Minimal client-side HTML export
// ═══════════════════════════════════════════════════════════════════════
// The original modular export/ directory was removed in R-1 cleanup.
// This file provides the essential client-side export functionality
// that the export pipeline depends on.
// ═══════════════════════════════════════════════════════════════════════

export interface ClientExportPayload {
  pages: unknown[];
  ratioId: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Escape HTML special characters */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Token-based color resolution */
export const TOKEN_COLORS: Record<string, string> = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  success: '#22c55e',
  danger: '#ef4444',
  bg: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  muted: '#94a3b8',
};

export function resolveColor(token: string): string {
  return TOKEN_COLORS[token] || token;
}

/** Render a single block to minimal HTML */
export function renderBlockHtml(block: Record<string, unknown>): string {
  const type = (block.type as string) || 'unknown';
  const title = escapeHtml(String(block.title || type));
  const content = escapeHtml(String(block.body || block.text || block.description || block.content || ''));

  return `<div class="block block-${type}"><h3>${title}</h3>${content ? `<p>${content}</p>` : ''}</div>`;
}

/** Generate a safe filename from metadata */
export function generateExportFilename(meta?: Record<string, unknown>): string {
  const raw = (meta?.judulPertemuan as string) || 'media-pembelajaran';
  return raw.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase().replace(/^-|-$/g, '') + '.html';
}

/** Generate a self-contained HTML file entirely in the browser */
export function generateClientExportHtml(payload: ClientExportPayload): string {
  const title = escapeHtml(String(payload.meta?.judulPertemuan || 'Media Pembelajaran Interaktif'));

  const pagesHtml = (payload.pages as Array<Record<string, unknown>>).map((page) => {
    const blocks = (page.schema as { blocks?: Array<Record<string, unknown>> })?.blocks || [];
    const blocksHtml = blocks.map(renderBlockHtml).join('\n');
    const label = escapeHtml(String(page.label || ''));
    const bgColor = String(page.bgColor || '#0f172a');

    return `<div class="page" style="background:${bgColor}">
      ${label ? `<h2>${label}</h2>` : ''}
      ${blocksHtml}
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #f8fafc; }
    .page { max-width: 960px; margin: 0 auto 24px; padding: 32px; border-radius: 12px; }
    .page h2 { font-size: 1.2em; margin-bottom: 16px; color: #94a3b8; }
    .block { margin: 16px 0; padding: 16px; border-radius: 8px; background: #1e293b; }
    .block h3 { font-size: 1.1em; margin-bottom: 8px; color: #3b82f6; }
    .block p { line-height: 1.6; color: #cbd5e1; }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}
