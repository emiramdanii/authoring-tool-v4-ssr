// ═══════════════════════════════════════════════════════════════════════
// BLOCK RENDERERS — Content block HTML rendering for export
// ═══════════════════════════════════════════════════════════════════════
// Handles: cover, petunjuk, tp, def-box, nc-grid, nk-card,
//          flashcard-set, ftab, materi-section, tujuan-display,
//          motivasi, rangkuman, diskusi, hasil, refleksi,
//          penutup, tabel-accord, generic fallback
// ═══════════════════════════════════════════════════════════════════════

import type { SchemaBlock } from '@/core/schema/types';
import { escapeHtml, resolveColor, type RenderBlockFn } from './utils';

/**
 * Render a content block. Returns null if the block type is not handled here.
 */
export function renderContentBlock(
  type: string,
  b: Record<string, unknown>,
  renderBlock: RenderBlockFn,
): string | null {
  switch (type) {
    case 'cover': return renderCover(b);
    case 'petunjuk': return renderPetunjuk(b);
    case 'tp': return renderTp(b);
    case 'def-box': return renderDefBox(b);
    case 'nc-grid': return renderNcGrid(b);
    case 'nk-card': return renderNkCard(b);
    case 'flashcard-set': return renderFlashcardSet(b);
    case 'ftab': return renderFtab(b, renderBlock);
    case 'materi-section': return renderMateriSection(b, renderBlock);
    case 'tujuan-display': return renderTujuanDisplay(b);
    case 'motivasi': return renderMotivasi(b);
    case 'rangkuman': return renderRangkuman(b);
    case 'diskusi': return renderDiskusi(b);
    case 'hasil': return renderHasil(b);
    case 'refleksi': return renderRefleksi(b);
    case 'penutup': return renderPenutup(b);
    case 'tabel-accord': return renderTabelAccord(b);
    default: return null;
  }
}

/** Generic fallback renderer for unknown block types */
export function renderGenericBlock(b: Record<string, unknown>): string {
  const blockTitle = (b.title as string) || (b.type as string) || 'Block';
  const content = (b.content as string) || '';
  return `
    <div class="block generic-block">
      <div class="block-header">
        <span class="block-icon">📦</span>
        <h2>${escapeHtml(String(blockTitle))}</h2>
      </div>
      ${content ? `<p>${escapeHtml(content)}</p>` : '<p class="text-muted">Blok tidak didukung oleh export client-side.</p>'}
    </div>`;
}

// ── Individual renderers ────────────────────────────────────────────

function renderCover(b: Record<string, unknown>): string {
  const icon = b.icon as string || '📘';
  const title = b.title as string || '';
  const subtitle = b.subtitle as string || '';
  const badges = (b.badges as Array<{ icon?: string; text: string; color: string }>) || [];
  const accentColor = resolveColor(b.accentColor as string, '#fbbf24');
  const bg = b.background as { color1?: string; color2?: string } | undefined;
  const bgStyle = bg?.color1
    ? `background: linear-gradient(135deg, ${bg.color1}, ${bg.color2 || bg.color1});`
    : `background: linear-gradient(135deg, #0e1c2f, #13243a);`;

  return `
    <div class="block cover-block" style="${bgStyle}">
      <div class="cover-glow" style="background: radial-gradient(circle at 50% 40%, ${accentColor}33, transparent 60%);"></div>
      <div class="cover-icon">${icon}</div>
      <h1 class="cover-title">${escapeHtml(title)}</h1>
      <p class="cover-subtitle">${escapeHtml(subtitle)}</p>
      <div class="cover-badges">
        ${badges.map(bd => `<span class="badge" style="background:${resolveColor(bd.color, '#fbbf24')}22;color:${resolveColor(bd.color, '#fbbf24')};border:1px solid ${resolveColor(bd.color, '#fbbf24')}33;">${bd.icon || ''} ${escapeHtml(bd.text)}</span>`).join('')}
      </div>
    </div>`;
}

function renderPetunjuk(b: Record<string, unknown>): string {
  const title = b.title as string || 'Petunjuk';
  const titleHighlight = b.titleHighlight as string || '';
  const items = (b.items as Array<{ icon: string; title: string; body: string }>) || [];
  const tips = b.tips as string | undefined;
  return `
    <div class="block petunjuk-block">
      <div class="block-header">
        <span class="block-icon">📋</span>
        <h2>${escapeHtml(title)} <span class="highlight">${escapeHtml(titleHighlight)}</span></h2>
      </div>
      <div class="step-grid">
        ${items.map((it, i) => `
          <div class="step-card">
            <div class="step-num">${i + 1}</div>
            <div class="step-icon">${it.icon}</div>
            <div class="step-content">
              <h3>${escapeHtml(it.title)}</h3>
              <p>${escapeHtml(it.body)}</p>
            </div>
          </div>`).join('')}
      </div>
      ${tips ? `<div class="tips-box">💡 ${escapeHtml(tips)}</div>` : ''}
    </div>`;
}

function renderTp(b: Record<string, unknown>): string {
  const title = b.title as string || 'Tujuan Pembelajaran';
  const titleHighlight = b.titleHighlight as string || '';
  const items = (b.items as Array<{ num: number; verb: string; desc: string; color: string }>) || [];
  return `
    <div class="block tp-block">
      <div class="block-header">
        <span class="block-icon">🎯</span>
        <h2>${escapeHtml(title)} <span class="highlight">${escapeHtml(titleHighlight)}</span></h2>
      </div>
      <div class="tp-list">
        ${items.map(it => `
          <div class="tp-item">
            <span class="tp-num" style="background:${resolveColor(it.color, '#fbbf24')};">${it.num}</span>
            <span class="tp-verb" style="color:${resolveColor(it.color, '#fbbf24')};">${escapeHtml(it.verb)}</span>
            <span class="tp-desc">${escapeHtml(it.desc)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderDefBox(b: Record<string, unknown>): string {
  const content = b.content as string || '';
  const borderColor = resolveColor(b.borderColor as string, '#fbbf24');
  return `
    <div class="block def-box" style="border-left: 4px solid ${borderColor};">
      <div class="def-icon" style="color:${borderColor};">📖</div>
      <p>${escapeHtml(content)}</p>
    </div>`;
}

function renderNcGrid(b: Record<string, unknown>): string {
  const cards = (b.cards as Array<{ icon: string; title: string; body: string; color: string }>) || [];
  return `
    <div class="block nc-grid-block">
      <div class="nc-grid">
        ${cards.map(c => `
          <div class="nc-card" style="border-top: 3px solid ${resolveColor(c.color, '#3ecfcf')};">
            <div class="nc-icon">${c.icon}</div>
            <h3 style="color:${resolveColor(c.color, '#3ecfcf')};">${escapeHtml(c.title)}</h3>
            <p>${escapeHtml(c.body)}</p>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderNkCard(b: Record<string, unknown>): string {
  const icon = b.icon as string || '📜';
  const title = b.title as string || '';
  const label = b.label as string || '';
  const definition = b.definition as string || '';
  const characteristics = (b.characteristics as Array<{ label: string; value: string }>) || [];
  const sanksi = b.sanksi as { title: string; items: Array<{ dot: string; text: string }> } | undefined;
  const contoh = b.contoh as string || '';
  return `
    <div class="block nk-card-block">
      <div class="nk-header">
        <span class="nk-icon">${icon}</span>
        <div>
          <span class="nk-label">${escapeHtml(label)}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
      </div>
      <p class="nk-def">${escapeHtml(definition)}</p>
      ${characteristics.length > 0 ? `
        <div class="nk-chars">
          ${characteristics.map(ch => `<div class="nk-char"><strong>${escapeHtml(ch.label)}:</strong> ${escapeHtml(ch.value)}</div>`).join('')}
        </div>` : ''}
      ${sanksi ? `
        <div class="nk-sanksi">
          <h4>${escapeHtml(sanksi.title)}</h4>
          ${sanksi.items.map(si => `<div class="nk-sanksi-item"><span style="color:${resolveColor(si.dot, '#ff6b6b')};">●</span> ${escapeHtml(si.text)}</div>`).join('')}
        </div>` : ''}
      ${contoh ? `<div class="nk-contoh">💡 Contoh: ${escapeHtml(contoh)}</div>` : ''}
    </div>`;
}

function renderFlashcardSet(b: Record<string, unknown>): string {
  const cards = (b.cards as Array<{ q: string; a: string }>) || [];
  return `
    <div class="block flashcard-block">
      <div class="block-header">
        <span class="block-icon">🃏</span>
        <h2>Flashcard</h2>
      </div>
      <div class="flashcard-grid">
        ${cards.map((c, i) => `
          <div class="flashcard" onclick="this.classList.toggle('flipped')">
            <div class="flashcard-inner">
              <div class="flashcard-front">
                <span class="flashcard-num">${i + 1}</span>
                <p>${escapeHtml(c.q)}</p>
              </div>
              <div class="flashcard-back">
                <p>${escapeHtml(c.a)}</p>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderFtab(b: Record<string, unknown>, renderBlock: RenderBlockFn): string {
  const tabs = (b.tabs as Array<{ icon: string; label: string; content: SchemaBlock[] }>) || [];
  const tabId = `ftab-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block ftab-block">
      <div class="ftab-tabs" id="${tabId}">
        ${tabs.map((t, i) => `
          <button class="ftab-btn${i === 0 ? ' active' : ''}" onclick="switchFtab('${tabId}',${i})">${t.icon} ${escapeHtml(t.label)}</button>`).join('')}
      </div>
      ${tabs.map((t, i) => `
        <div class="ftab-panel${i === 0 ? ' active' : ''}" data-ftab="${tabId}" data-idx="${i}">
          ${t.content?.map(cb => renderBlock(cb)).join('') || ''}
        </div>`).join('')}
    </div>`;
}

function renderMateriSection(b: Record<string, unknown>, renderBlock: RenderBlockFn): string {
  const title = b.title as string || 'Materi';
  const subtitle = b.subtitle as string || '';
  const icon = b.icon as string || '📖';
  const accentColor = resolveColor(b.accentColor as string, '#a78bfa');
  const content = (b.content as SchemaBlock[]) || [];
  const takeaways = (b.takeaways as string[]) || [];
  const selfCheck = b.selfCheck as string | undefined;
  const bsnpRequired = b.bsnpRequired as boolean;
  return `
    <div class="block materi-section-block" style="border-left: 4px solid ${accentColor};">
      <div class="materi-section-header">
        <span class="materi-section-icon">${icon}</span>
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${subtitle ? `<p class="materi-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        ${bsnpRequired ? '<span class="bsnp-badge">WAJIB BSNP</span>' : ''}
      </div>
      <div class="materi-content">
        ${content.map(cb => renderBlock(cb)).join('')}
      </div>
      ${takeaways.length > 0 ? `
        <div class="takeaways">
          <h3>⭐ Poin Penting</h3>
          ${takeaways.map(t => `<div class="takeaway-item">✓ ${escapeHtml(t)}</div>`).join('')}
        </div>` : ''}
      ${selfCheck ? `
        <div class="self-check">
          <h3>🧠 Apa yang sudah kamu pelajari?</h3>
          <p>${escapeHtml(selfCheck)}</p>
        </div>` : ''}
    </div>`;
}

function renderTujuanDisplay(b: Record<string, unknown>): string {
  const title = b.title as string || 'Tujuan Pembelajaran';
  const subtitle = b.subtitle as string || '';
  const objectives = (b.objectives as Array<{ icon: string; text: string; color: string }>) || [];
  const profil = b.profil as string | undefined;
  const profilColor = resolveColor(b.profilColor as string, '#34d399');
  const bsnpRequired = b.bsnpRequired as boolean;
  return `
    <div class="block tujuan-display-block" style="border-left: 4px solid var(--color-y, #f9c12e);">
      <div class="block-header">
        <span class="block-icon">🎯</span>
        <h2>${escapeHtml(title)}</h2>
        ${bsnpRequired ? '<span class="bsnp-badge">WAJIB</span>' : ''}
      </div>
      ${subtitle ? `<p class="block-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      <div class="tujuan-list">
        ${objectives.map((o, i) => `
          <div class="tujuan-item" style="border-left: 3px solid ${resolveColor(o.color, '#f9c12e')};">
            <span class="tujuan-num">${i + 1}</span>
            <span class="tujuan-icon">${o.icon}</span>
            <span class="tujuan-text">${escapeHtml(o.text)}</span>
          </div>`).join('')}
      </div>
      ${profil ? `
        <div class="profil-box" style="border-left: 3px solid ${profilColor};">
          <strong style="color: ${profilColor};">Profil Pelajar Pancasila:</strong> ${escapeHtml(profil)}
        </div>` : ''}
    </div>`;
}

function renderMotivasi(b: Record<string, unknown>): string {
  const title = b.title as string || 'Apersepsi';
  const hookQuestion = b.hookQuestion as string || '';
  const visual = b.visual as { emoji: string; bgGradient?: [string, string] } | undefined;
  const connections = (b.connections as Array<{ icon: string; label: string; description: string; color: string }>) || [];
  const transition = b.transition as string | undefined;
  const bsnpRequired = b.bsnpRequired as boolean;
  const gradFrom = resolveColor(visual?.bgGradient?.[0], '#f9c12e');
  const gradTo = resolveColor(visual?.bgGradient?.[1], '#3ecfcf');
  return `
    <div class="block motivasi-block" style="border-left: 4px solid ${gradFrom};">
      <div class="block-header">
        <span class="block-icon">💡</span>
        <h2>${escapeHtml(title)}</h2>
        ${bsnpRequired ? '<span class="bsnp-badge">WAJIB</span>' : ''}
      </div>
      <div class="hook-question" style="background: linear-gradient(135deg, ${gradFrom}1a, ${gradTo}0d); border: 2px solid ${gradFrom}40; border-radius: 12px; padding: 16px;">
        ${visual?.emoji ? `<span class="hook-emoji" style="font-size: 28px;">${visual.emoji}</span>` : ''}
        <div>
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: ${gradFrom}; margin-bottom: 6px;">Pertanyaan Pemicu</div>
          <div style="font-size: 15px; font-weight: 700; color: #f1f5f9;">${escapeHtml(hookQuestion)}</div>
        </div>
      </div>
      ${connections.length > 0 ? `
        <div class="connections">
          <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 8px;">💡 Koneksi Pengetahuan</div>
          ${connections.map(c => `
            <div class="connection-card" style="border-left: 3px solid ${resolveColor(c.color, '#3ecfcf')};">
              <span>${c.icon}</span>
              <div>
                <strong style="color: ${resolveColor(c.color, '#3ecfcf')};">${escapeHtml(c.label)}</strong>
                <p>${escapeHtml(c.description)}</p>
              </div>
            </div>`).join('')}
        </div>` : ''}
      ${transition ? `
        <div class="transition-box" style="border-left: 3px solid ${gradTo};">
          → <em>${escapeHtml(transition)}</em>
        </div>` : ''}
    </div>`;
}

function renderRangkuman(b: Record<string, unknown>): string {
  const title = b.title as string || 'Rangkuman';
  const concepts = (b.concepts as Array<{ icon: string; title: string; body: string; color: string }>) || [];
  const closingStatement = b.closingStatement as string | undefined;
  const accentColor = resolveColor(b.accentColor as string, '#a78bfa');
  const bsnpRequired = b.bsnpRequired as boolean;
  return `
    <div class="block rangkuman-block" style="border-left: 4px solid ${accentColor};">
      <div class="block-header">
        <span class="block-icon">📝</span>
        <h2>${escapeHtml(title)}</h2>
        ${bsnpRequired ? '<span class="bsnp-badge">WAJIB</span>' : ''}
      </div>
      <div class="rangkuman-grid" style="display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        ${concepts.map((c, i) => `
          <div class="rangkuman-card" style="border-left: 3px solid ${resolveColor(c.color, accentColor)}; background: ${resolveColor(c.color, accentColor)}0d; border: 1px solid ${resolveColor(c.color, accentColor)}20; border-radius: 10px; padding: 10px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              ${c.icon ? `<span>${c.icon}</span>` : ''}
              <strong style="color: ${resolveColor(c.color, accentColor)}; font-size: 12px;">${escapeHtml(c.title)}</strong>
            </div>
            <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">${escapeHtml(c.body)}</p>
            <div style="border-top: 1px solid ${resolveColor(c.color, accentColor)}1a; margin-top: 8px; padding-top: 6px; font-size: 8px; color: ${resolveColor(c.color, accentColor)}80; font-weight: 700;">Konsep ${i + 1}</div>
          </div>`).join('')}
      </div>
      ${closingStatement ? `
        <div class="closing-statement" style="border-left: 4px solid ${accentColor}; background: ${accentColor}1a; border-radius: 10px; padding: 12px; margin-top: 10px;">
          <p style="font-size: 12px; color: #f1f5f9; font-style: italic;"><em>${escapeHtml(closingStatement)}</em></p>
        </div>` : ''}
    </div>`;
}

function renderDiskusi(b: Record<string, unknown>): string {
  const title = b.title as string || 'Diskusi';
  const intro = b.intro as string || '';
  const questions = (b.questions as Array<{ label: string; icon: string; teks: string; petunjuk: string; color?: string }>) || [];
  return `
    <div class="block diskusi-block">
      <div class="block-header">
        <span class="block-icon">💬</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${intro ? `<p class="block-intro">${escapeHtml(intro)}</p>` : ''}
      ${questions.map(q => `
        <div class="diskusi-card" style="border-left: 3px solid ${resolveColor(q.color, '#3ecfcf')};">
          <div class="diskusi-label">${q.icon} ${escapeHtml(q.label)}</div>
          <p class="diskusi-teks">${escapeHtml(q.teks)}</p>
          <p class="diskusi-petunjuk">💡 ${escapeHtml(q.petunjuk)}</p>
        </div>`).join('')}
    </div>`;
}

function renderHasil(b: Record<string, unknown>): string {
  const title = b.title as string || 'Hasil';
  const subtitle = b.subtitle as string || '';
  return `
    <div class="block hasil-block">
      <div class="hasil-icon">🏆</div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(subtitle)}</p>
    </div>`;
}

function renderRefleksi(b: Record<string, unknown>): string {
  const title = b.title as string || 'Refleksi';
  const intro = b.intro as string || '';
  const questions = (b.questions as Array<{ teks: string; petunjuk: string; warna?: string; icon?: string }>) || [];
  return `
    <div class="block refleksi-block">
      <div class="block-header">
        <span class="block-icon">🪞</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${intro ? `<p class="block-intro">${escapeHtml(intro)}</p>` : ''}
      ${questions.map(q => `
        <div class="refleksi-card" style="border-left: 3px solid ${resolveColor(q.warna, '#a78bfa')};">
          <p>${q.icon || '💭'} ${escapeHtml(q.teks)}</p>
          <p class="refleksi-petunjuk">💡 ${escapeHtml(q.petunjuk)}</p>
        </div>`).join('')}
    </div>`;
}

function renderPenutup(b: Record<string, unknown>): string {
  const title = b.title as string || 'Penutup';
  const subtitle = b.subtitle as string || '';
  const preview = (b.preview as Array<{ icon: string; judul: string; isi: string; warna: string }>) || [];
  return `
    <div class="block penutup-block">
      <div class="block-header">
        <span class="block-icon">🎓</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <p class="block-intro">${escapeHtml(subtitle)}</p>
      <div class="penutup-preview">
        ${preview.map(p => `
          <div class="penutup-item" style="border-top: 2px solid ${resolveColor(p.warna, '#34d399')};">
            <span>${p.icon}</span>
            <strong>${escapeHtml(p.judul)}</strong>
            <p>${escapeHtml(p.isi)}</p>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderTabelAccord(b: Record<string, unknown>): string {
  const rows = (b.rows as Array<{ icon: string; title: string; color: string; details: Array<{ label: string; value: string }> }>) || [];
  return `
    <div class="block tabel-accord-block">
      ${rows.map(r => `
        <div class="accord-row" onclick="this.classList.toggle('open')">
          <div class="accord-header" style="border-left: 3px solid ${resolveColor(r.color, '#3ecfcf')};">
            <span>${r.icon}</span>
            <strong>${escapeHtml(r.title)}</strong>
            <span class="accord-arrow">▾</span>
          </div>
          <div class="accord-body">
            ${r.details.map(d => `<div class="accord-detail"><strong>${escapeHtml(d.label)}:</strong> ${escapeHtml(d.value)}</div>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}
