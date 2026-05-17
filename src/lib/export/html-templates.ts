// ═══════════════════════════════════════════════════════════════════════
// HTML TEMPLATES — Page rendering and HTML shell generation
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';
import { escapeHtml, resolveColor } from './utils';
import { renderContentBlock, renderGenericBlock } from './block-renderers';
import { renderNavigationBlock } from './navigation-renderers';
import { renderQuizBlock } from './quiz-renderers';
import { renderGameBlock } from './game-renderers';

// ── Block → simplified HTML renderer ──────────────────────────────
// Composes all renderer modules into a single dispatch function.

export function renderBlockHtml(block: SchemaBlock): string {
  const b = block as unknown as Record<string, unknown>;
  const type = b.type as string;

  // Try each renderer module in order; fall back to generic
  return renderContentBlock(type, b, renderBlockHtml)
      ?? renderNavigationBlock(type, b, renderBlockHtml)
      ?? renderQuizBlock(type, b, renderBlockHtml)
      ?? renderGameBlock(type, b, renderBlockHtml)
      ?? renderGenericBlock(b);
}

// ── Page → HTML ───────────────────────────────────────────────────

export function renderPageHtml(page: CanvaPage, pageIdx: number, _totalPages: number): string {
  const schema = page.schema;
  const label = page.label || `Halaman ${pageIdx + 1}`;

  // Background style
  const bg = schema?.background;
  let bgStyle = 'background: linear-gradient(135deg, #ffffff, #f8fafc);';
  if (bg) {
    if (bg.type === 'gradient' && bg.color1) {
      bgStyle = `background: linear-gradient(135deg, ${bg.color1}, ${bg.color2 || bg.color1});`;
    } else if (bg.type === 'solid' && bg.color1) {
      bgStyle = `background: ${bg.color1};`;
    } else if (bg.type === 'radial' && bg.color1) {
      bgStyle = `background: radial-gradient(circle at 50% 40%, ${bg.color1}, ${bg.color2 || '#ffffff'});`;
    }
  } else if (page.bgColor) {
    bgStyle = `background: ${page.bgColor};`;
  }

  // Section label
  const sectionLabel = schema?.sectionLabel || '';
  const sectionColor = resolveColor(schema?.sectionColor, '#3ecfcf');

  // Render blocks
  let blocksHtml = '';
  if (schema?.blocks && schema.blocks.length > 0) {
    blocksHtml = schema.blocks.map(block => renderBlockHtml(block)).join('\n');
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

  return `
    <div class="page" data-page="${pageIdx}" style="${bgStyle}">
      ${sectionLabel ? `<div class="section-label" style="color:${sectionColor};border:1px solid ${sectionColor}44;background:${sectionColor}11;">${escapeHtml(sectionLabel)}</div>` : ''}
      <div class="page-content">
        ${blocksHtml}
      </div>
      <div class="page-label">${escapeHtml(label)}</div>
    </div>`;
}
