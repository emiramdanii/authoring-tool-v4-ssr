// ═══════════════════════════════════════════════════════════════════════
// CLIENT-SIDE EXPORT — Minimal client-side HTML export
// ═══════════════════════════════════════════════════════════════════════
// The original modular export/ directory was removed in R-1 cleanup.
// This file provides the essential client-side export functionality
// that the export pipeline depends on.
//
// Sprint 1G P0: Added background image + overlay support for
// visual parity with the editor/preview. Pages with background
// images now render the full 5-layer stack in export HTML.
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

// ═══════════════════════════════════════════════════════════════════
// Sprint 1G P0: Background layer helpers for fallback client export
// ═══════════════════════════════════════════════════════════════════

type BgProps = {
  type?: string;
  color1?: string;
  color2?: string;
  imageUrl?: string;
  overlay?: number;
  imageFit?: string;
  imageOpacity?: number;
  imageBlur?: number;
  overlayType?: string;
};

/** Render background image layer HTML for fallback export */
function renderBgImageLayer(bg: BgProps | undefined): string {
  if (!bg?.imageUrl) return '';
  const fit = bg.imageFit || 'cover';
  const opacity = (bg.imageOpacity ?? 100) / 100;
  const blur = bg.imageBlur ?? 0;
  let style = `position:absolute;inset:0;width:100%;height:100%;z-index:0;object-fit:${fit};opacity:${opacity};`;
  if (blur > 0) style += `filter:blur(${blur}px);transform:scale(1.05);`;
  return `<img src="${escapeHtml(bg.imageUrl)}" alt="" role="presentation" style="${style}" />`;
}

/** Render overlay/scrim layer HTML for fallback export */
function renderBgOverlayLayer(bg: BgProps | undefined): string {
  if (!bg?.imageUrl) return '';
  const overlayType = bg.overlayType || 'dark';
  const op = (bg.overlay ?? 40) / 100;
  let overlayBg: string;
  switch (overlayType) {
    case 'light': overlayBg = `rgba(255,255,255,${op})`; break;
    case 'gradient': overlayBg = `linear-gradient(to top,rgba(0,0,0,${op}),rgba(0,0,0,${op * 0.3}) 40%,transparent 70%)`; break;
    default: overlayBg = `rgba(0,0,0,${op})`; break;
  }
  return `<div style="position:absolute;inset:0;z-index:0;pointer-events:none;background:${overlayBg};"></div>`;
}

/** Determine text color for fallback export based on overlay type */
function getFallbackTextColor(bg: BgProps | undefined): string {
  if (!bg?.imageUrl) return '#f8fafc';
  const overlayType = bg.overlayType || 'dark';
  return overlayType === 'light' ? '#1C1C1E' : '#FFFFFF';
}

/** Generate a self-contained HTML file entirely in the browser */
export function generateClientExportHtml(payload: ClientExportPayload): string {
  const title = escapeHtml(String(payload.meta?.judulPertemuan || 'Media Pembelajaran Interaktif'));

  const pagesHtml = (payload.pages as Array<Record<string, unknown>>).map((page) => {
    const schema = page.schema as { blocks?: Array<Record<string, unknown>>; background?: BgProps } | undefined;
    const blocks = schema?.blocks || [];
    const blocksHtml = blocks.map(renderBlockHtml).join('\n');
    const label = escapeHtml(String(page.label || ''));
    const bgColor = String(page.bgColor || '#0f172a');
    const bg = schema?.background;

    // Sprint 1G P0: Full 5-layer background stack
    const hasBgImage = !!bg?.imageUrl;
    const bgImageHtml = renderBgImageLayer(bg);
    const overlayHtml = renderBgOverlayLayer(bg);
    const textColor = getFallbackTextColor(bg);

    return `<div class="page${hasBgImage ? ' page-has-bg-image' : ''}" style="background:${bgColor};color:${textColor};position:relative;overflow:hidden;">
      ${bgImageHtml}
      ${overlayHtml}
      ${label ? `<h2 style="position:relative;z-index:1;">${label}</h2>` : ''}
      <div style="position:relative;z-index:1;">
        ${blocksHtml}
      </div>
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
    /* Sprint 1G P0: Opaque cards on background images for readability */
    .page-has-bg-image .block { background: rgba(255,255,255,0.92); border: 1px solid rgba(0,0,0,0.08); }
    .page-has-bg-image .block h3 { color: #1e293b; }
    .page-has-bg-image .block p { color: #334155; }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}
