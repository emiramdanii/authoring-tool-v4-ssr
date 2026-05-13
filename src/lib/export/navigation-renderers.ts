// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION RENDERERS — Alur, Skenario block HTML rendering
// ═══════════════════════════════════════════════════════════════════════

import { escapeHtml, resolveColor, type RenderBlockFn } from './utils';

/**
 * Render a navigation block. Returns null if the block type is not handled here.
 */
export function renderNavigationBlock(
  type: string,
  b: Record<string, unknown>,
  _renderBlock: RenderBlockFn,
): string | null {
  switch (type) {
    case 'alur': return renderAlur(b);
    case 'skenario': return renderSkenario(b);
    default: return null;
  }
}

function renderAlur(b: Record<string, unknown>): string {
  const title = b.title as string || 'Alur Pembelajaran';
  const steps = (b.steps as Array<{ dot: string; durasi: string; judul: string; deskripsi: string }>) || [];
  return `
    <div class="block alur-block">
      <div class="block-header">
        <span class="block-icon">📊</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="timeline">
        ${steps.map(s => `
          <div class="timeline-step">
            <div class="timeline-dot" style="background:${resolveColor(s.dot, '#3ecfcf')};"></div>
            <div class="timeline-content">
              <div class="timeline-durasi">${escapeHtml(s.durasi)}</div>
              <h3>${escapeHtml(s.judul)}</h3>
              <p>${escapeHtml(s.deskripsi)}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderSkenario(b: Record<string, unknown>): string {
  const title = b.title as string || 'Skenario';
  const chapters = (b.chapters as Array<Record<string, unknown>>) || [];
  return `
    <div class="block skenario-block">
      <div class="block-header">
        <span class="block-icon">🎭</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${chapters.map((ch, ci) => {
        const chTitle = (ch.title as string) || `Bab ${ci + 1}`;
        const charEmoji = (ch.charEmoji as string) || '👤';
        const setup = (ch.setup as Array<{ speaker: string; text: string }>) || [];
        const choices = (ch.choices as Array<Record<string, unknown>>) || [];
        return `
          <div class="skenario-chapter">
            <div class="skenario-char">${charEmoji}</div>
            <h3>${escapeHtml(chTitle)}</h3>
            ${setup.map(s => `<div class="dialog"><strong>${escapeHtml(s.speaker)}:</strong> ${escapeHtml(s.text)}</div>`).join('')}
            ${choices.map(c => `
              <div class="choice-card">
                <span class="choice-icon">${c.icon as string || '🔹'}</span>
                <span class="choice-label">${escapeHtml((c.label as string) || '')}</span>
                ${c.detail ? `<span class="choice-detail">${escapeHtml(c.detail as string)}</span>` : ''}
              </div>`).join('')}
          </div>`;
      }).join('')}
    </div>`;
}
