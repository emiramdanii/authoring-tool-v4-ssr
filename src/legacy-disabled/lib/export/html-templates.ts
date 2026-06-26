// @ts-nocheck — BATCH-12-05: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════════
// @LEGACY_EXPORT_PATH — PHASE-3A
// This is the STATIC HTML export renderer. It is NOT the official
// export route. The official export route is:
//   /api/export → Vite SSR template → ExportApp → PageRenderer mode=export
// This static path (renderPageHtml/renderBlockHtml) uses hardcoded
// TOKEN_COLORS (dark) and does NOT read schema.themeId.
// Do NOT use this as source of truth for export visuals.
// Do NOT improve this — fix export visuals in ExportApp/PageRenderer.
// Deprecation plan: see OFFICIAL-ROUTE-PROPOSAL.md
// ═══════════════════════════════════════════════════════════════════════
// HTML TEMPLATES — Page rendering and HTML shell generation
// ═══════════════════════════════════════════════════════════════════════
//
// Sprint 1G P0 fix: Export HTML now renders the same 5-layer background
// stack as SchemaScreenRenderer:
//   Layer 0: Canvas base (page background color)
//   Layer 1: Background style (solid/gradient/radial from schema)
//   Layer 2: Background media (image with fit/opacity/blur)
//   Layer 3: Overlay/scrim (dark/light/gradient for readability)
//   Layer 4: Content (blocks, section labels)
//
// This ensures export HTML has visual parity with the editor/preview.
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';
import { escapeHtml, resolveColor } from './utils';
import { renderContentBlock, renderGenericBlock } from './block-renderers';
import { renderNavigationBlock } from './navigation-renderers';
import { renderQuizBlock, type ExportRenderContext } from './quiz-renderers';
import { renderGameBlock } from './game-renderers';

// ── Block → simplified HTML renderer ──────────────────────────────
// Composes all renderer modules into a single dispatch function.

export function renderBlockHtml(block: SchemaBlock, ctx?: ExportRenderContext): string {
  const b = block as unknown as Record<string, unknown>;
  const type = b.type as string;

  // Try each renderer module in order; fall back to generic
  return renderContentBlock(type, b, renderBlockHtml)
      ?? renderNavigationBlock(type, b, renderBlockHtml)
      ?? renderQuizBlock(type, b, renderBlockHtml, ctx)
      ?? renderGameBlock(type, b, renderBlockHtml)
      ?? renderGenericBlock(b);
}

// ═══════════════════════════════════════════════════════════════════
// Sprint 1G P0: Background layer helpers for export HTML
// ═══════════════════════════════════════════════════════════════════
// These mirror the SchemaScreenRenderer layer logic so export HTML
// has visual parity with the editor/preview.
//
// IMPORTANT: These helpers generate STATIC HTML — no React, no runtime.
// All styles are inline for self-contained export files.

/** Schema background type (subset used by export) */
type SchemaBg = {
  type: 'solid' | 'gradient' | 'radial';
  color1?: string;
  color2?: string;
  imageUrl?: string;
  overlay?: number;
  imageFit?: 'cover' | 'contain';
  imageOpacity?: number;
  imageBlur?: number;
  overlayType?: 'dark' | 'light' | 'gradient';
};

/**
 * Layer 1: Render background base color/gradient/radial as inline CSS.
 * Mirrors SchemaScreenRenderer.bgStyle logic.
 */
function renderBackgroundBaseStyle(bg: SchemaBg | undefined, fallbackBg: string): string {
  if (!bg) return `background:${fallbackBg};`;

  if (bg.type === 'gradient' && bg.color1) {
    const c1 = resolveColor(bg.color1, bg.color1);
    const c2 = resolveColor(bg.color2 || bg.color1, bg.color2 || bg.color1);
    return `background:linear-gradient(180deg,${c1},${c2});`;
  }
  if (bg.type === 'radial' && bg.color1) {
    const c1 = resolveColor(bg.color1, bg.color1);
    const c2 = resolveColor(bg.color2 || '#ffffff', bg.color2 || '#ffffff');
    return `background:radial-gradient(ellipse 90% 60% at 50% 0%,${c1}30,transparent 60%),linear-gradient(180deg,${c1},${c2});`;
  }
  if (bg.type === 'solid' && bg.color1) {
    const c1 = resolveColor(bg.color1, bg.color1);
    return `background:${c1};`;
  }

  return `background:${fallbackBg};`;
}

/**
 * Layer 2: Render background image layer as HTML string.
 * Returns empty string if no imageUrl.
 * Mirrors SchemaScreenRenderer.bgMediaStyle logic.
 */
function renderBackgroundImageLayer(bg: SchemaBg | undefined): string {
  if (!bg?.imageUrl) return '';

  const fit = bg.imageFit ?? 'cover';
  const opacity = (bg.imageOpacity ?? 100) / 100;
  const blur = bg.imageBlur ?? 0;

  let imgStyle = `position:absolute;inset:0;width:100%;height:100%;z-index:0;object-fit:${fit};opacity:${opacity};`;
  if (blur > 0) {
    imgStyle += `filter:blur(${blur}px);transform:scale(1.05);`;
  }

  // alt="" role="presentation" — decorative image, not content
  return `<img src="${escapeHtml(bg.imageUrl)}" alt="" role="presentation" style="${imgStyle}" />`;
}

/**
 * Layer 3: Render overlay/scrim layer as HTML string.
 * Returns empty string if no imageUrl (overlay only makes sense over images).
 * Mirrors SchemaScreenRenderer.overlayStyle logic.
 */
function renderBackgroundOverlayLayer(bg: SchemaBg | undefined): string {
  if (!bg?.imageUrl) return '';

  const overlayType = bg.overlayType ?? 'dark';
  const overlayOpacity = (bg.overlay ?? 40) / 100;

  let overlayBg: string;
  switch (overlayType) {
    case 'light':
      overlayBg = `rgba(255,255,255,${overlayOpacity})`;
      break;
    case 'gradient':
      overlayBg = `linear-gradient(to top,rgba(0,0,0,${overlayOpacity}),rgba(0,0,0,${overlayOpacity * 0.3}) 40%,transparent 70%)`;
      break;
    case 'dark':
    default:
      overlayBg = `rgba(0,0,0,${overlayOpacity})`;
      break;
  }

  // pointer-events:none ensures overlay doesn't block quiz/game/button interactions
  return `<div style="position:absolute;inset:0;z-index:0;pointer-events:none;background:${overlayBg};"></div>`;
}

/**
 * Determine text color for export page based on overlay type.
 * Mirrors SchemaScreenRenderer text color adaptation logic.
 * When background image is active, text color adapts to overlay type:
 *   - dark overlay → white text
 *   - gradient overlay → white text
 *   - light overlay → dark text
 *   - no image → dark text (export default is dark theme, so use token color)
 */
function getExportTextColor(bg: SchemaBg | undefined): string {
  if (!bg?.imageUrl) return '#e8f2ff'; // default export text color
  const overlayType = bg.overlayType ?? 'dark';
  if (overlayType === 'light') return '#1C1C1E';
  return '#FFFFFF'; // dark or gradient overlay
}

/**
 * Determine section label style for export based on background image.
 * Mirrors SchemaScreenRenderer section label adaptation.
 */
function getExportSectionLabelStyle(
  bg: SchemaBg | undefined,
  sectionColor: string,
): { color: string; background: string } {
  if (!bg?.imageUrl) {
    return {
      color: sectionColor,
      background: `${sectionColor}11`, // 6.7% opacity
    };
  }
  const overlayType = bg.overlayType ?? 'dark';
  if (overlayType === 'light') {
    return {
      color: '#1C1C1E',
      background: `${sectionColor}D9`, // 85% opacity
    };
  }
  return {
    color: '#FFFFFF',
    background: `${sectionColor}D9`, // 85% opacity
  };
}

// ── Page → HTML ───────────────────────────────────────────────────

export function renderPageHtml(page: CanvaPage, pageIdx: number, _totalPages: number, ctx?: ExportRenderContext): string {
  const schema = page.schema;
  const label = page.label || `Halaman ${pageIdx + 1}`;

  // Background style — Layer 0+1: canvas base + background color/gradient
  const bg = schema?.background as SchemaBg | undefined;
  const fallbackBg = page.bgColor || '#0f172a';
  const bgStyle = renderBackgroundBaseStyle(bg, fallbackBg);

  // Sprint 1G P0: Determine if background image is active
  const hasBgImage = !!bg?.imageUrl;

  // Layer 2: Background image (if any)
  const bgImageHtml = renderBackgroundImageLayer(bg);

  // Layer 3: Overlay/scrim (only when bg image is active)
  const overlayHtml = renderBackgroundOverlayLayer(bg);

  // Text color adapts to overlay type for readability
  const textColor = getExportTextColor(bg);

  // Section label
  const sectionLabel = schema?.sectionLabel || '';
  const sectionColor = resolveColor(schema?.sectionColor, '#3ecfcf');
  const sectionStyle = getExportSectionLabelStyle(bg, sectionColor);

  // Render blocks (Layer 4: content)
  let blocksHtml = '';
  if (schema?.blocks && schema.blocks.length > 0) {
    blocksHtml = schema.blocks.map(block => renderBlockHtml(block, ctx)).join('\n');
  } else if (page.elements && page.elements.length > 0) {
    // Legacy element-based pages: render text elements
    const textElements = page.elements.filter(el => el.type === 'teks' && el.text);
    if (textElements.length > 0) {
      blocksHtml = textElements.map(el => `
        <div class="block generic-block" style="left:${el.x}%;top:${el.y}%;width:${el.w}%;">
          <p style="font-size:${el.fontSize || 14}px;color:${el.textColor || '#e8f2ff'};">${escapeHtml(el.text || '')}</p>
        </div>`).join('\n');
    } else {
      blocksHtml = `<div class="empty-page"><p>📭 Halaman "${escapeHtml(label)}" — ${page.elements.length} elemen (tidak ditampilkan di export client-side)</p></div>`;
    }
  } else {
    blocksHtml = `<div class="empty-page"><p>📭 Halaman kosong</p></div>`;
  }

  // ═══ Assemble the page with full 5-layer stack ═══
  // Layer 0+1: page div background style (canvas base + bg color)
  // Layer 2: background image (absolute positioned, decorative)
  // Layer 3: overlay/scrim (absolute positioned, pointer-events:none)
  // Layer 4: content (section label + blocks + page label)
  //
  // The page div uses position:relative so the absolute layers
  // (image, overlay) are contained within it.
  return `
    <div class="page${hasBgImage ? ' page-has-bg-image' : ''}" data-page="${pageIdx}" style="${bgStyle}color:${textColor};">
      ${bgImageHtml}
      ${overlayHtml}
      ${sectionLabel ? `<div class="section-label" style="color:${sectionStyle.color};border:1px solid ${sectionColor}44;background:${sectionStyle.background};position:relative;z-index:1;">${escapeHtml(sectionLabel)}</div>` : ''}
      <div class="page-content">
        ${blocksHtml}
      </div>
      <div class="page-label">${escapeHtml(label)}</div>
    </div>`;
}
