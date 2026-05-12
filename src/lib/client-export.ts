// ═══════════════════════════════════════════════════════════════════════
// CLIENT-SIDE EXPORT — Pure browser HTML generator
// ═══════════════════════════════════════════════════════════════════════
// Generates a self-contained HTML file that renders the MPI without
// any server dependency. Falls back when the Vite SSR template is
// unavailable. All CSS, JS, and data are inlined.
// ═══════════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';

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

// ── Color token map (matches primitive-tokens.ts) ─────────────────
const TOKEN_COLORS: Record<string, string> = {
  y: '#fbbf24',
  c: '#3ecfcf',
  r: '#ff6b6b',
  p: '#a78bfa',
  g: '#34d399',
  o: '#fb923c',
  bg: '#0e1c2f',
  bg2: '#13243a',
  card: '#182d45',
  text: '#e8f2ff',
  muted: '#6e90b5',
  border: 'rgba(255,255,255,.09)',
  // Norma colors
  nagama: '#f9c12e',
  nkesusilaan: '#ff6b6b',
  nkesopanan: '#3ecfcf',
  nhukum: '#a78bfa',
};

function resolveColor(tokenOrHex: string | undefined, fallback: string): string {
  if (!tokenOrHex) return fallback;
  if (tokenOrHex.startsWith('#') || tokenOrHex.startsWith('rgb')) return tokenOrHex;
  return TOKEN_COLORS[tokenOrHex] || fallback;
}

// ── Block → simplified HTML renderer ──────────────────────────────
// Each block type gets a simple but readable HTML representation.

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlockHtml(block: SchemaBlock): string {
  const b = block as Record<string, unknown>;
  const type = b.type as string;

  switch (type) {
    case 'cover': {
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

    case 'petunjuk': {
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

    case 'tp': {
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

    case 'alur': {
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

    case 'skenario': {
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

    case 'def-box': {
      const content = b.content as string || '';
      const borderColor = resolveColor(b.borderColor as string, '#fbbf24');
      return `
        <div class="block def-box" style="border-left: 4px solid ${borderColor};">
          <div class="def-icon" style="color:${borderColor};">📖</div>
          <p>${escapeHtml(content)}</p>
        </div>`;
    }

    case 'nc-grid': {
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

    case 'nk-card': {
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

    case 'flashcard-set': {
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

    case 'ftab': {
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
              ${t.content?.map(cb => renderBlockHtml(cb)).join('') || ''}
            </div>`).join('')}
        </div>`;
    }

    case 'materi-section': {
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
            ${content.map(cb => renderBlockHtml(cb)).join('')}
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

    case 'tujuan-display': {
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

    case 'motivasi': {
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

    case 'rangkuman': {
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

    case 'diskusi': {
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

    case 'kuis': {
      const title = b.title as string || 'Kuis';
      const questions = (b.questions as Array<{ q: string; opts: string[]; ans: number; ex: string }>) || [];
      return `
        <div class="block kuis-block">
          <div class="block-header">
            <span class="block-icon">❓</span>
            <h2>${escapeHtml(title)}</h2>
          </div>
          ${questions.map((q, qi) => `
            <div class="kuis-question" data-ans="${q.ans}" data-idx="${qi}">
              <p class="q-text"><strong>${qi + 1}.</strong> ${escapeHtml(q.q)}</p>
              <div class="q-options">
                ${q.opts.map((opt, oi) => `
                  <button class="q-opt" data-qi="${qi}" data-oi="${oi}" onclick="checkAnswer(this,${qi},${oi},${q.ans})">
                    <span class="q-letter">${String.fromCharCode(65 + oi)}</span>
                    ${escapeHtml(opt)}
                  </button>`).join('')}
              </div>
              <div class="q-feedback" id="qfb-${qi}"></div>
            </div>`).join('')}
        </div>`;
    }

    case 'sortir-game': {
      const title = b.title as string || 'Game Sortir';
      const pool = (b.pool as Array<{ id: string; text: string; category: string }>) || [];
      const kolom = (b.kolom as Array<{ id: string; label: string; color: string }>) || [];
      return `
        <div class="block sortir-block">
          <div class="block-header">
            <span class="block-icon">🔄</span>
            <h2>${escapeHtml(title)}</h2>
          </div>
          <div class="sortir-pool">
            ${pool.map(p => `<span class="sortir-item" draggable="true" data-cat="${escapeHtml(p.category)}">${escapeHtml(p.text)}</span>`).join('')}
          </div>
          <div class="sortir-kolom">
            ${kolom.map(k => `
              <div class="sortir-kolom-box" style="border: 2px dashed ${resolveColor(k.color, '#3ecfcf')}44;">
                <h4 style="color:${resolveColor(k.color, '#3ecfcf')};">${escapeHtml(k.label)}</h4>
              </div>`).join('')}
          </div>
        </div>`;
    }

    case 'roda-game': {
      const title = b.title as string || 'Game Roda';
      const questions = (b.questions as Array<{ q: string; opts: Array<{ text: string; correct: boolean }>; feedbackCorrect?: string; feedbackWrong?: string }>) || [];
      return `
        <div class="block roda-block">
          <div class="block-header">
            <span class="block-icon">🎡</span>
            <h2>${escapeHtml(title)}</h2>
          </div>
          ${questions.map((q, qi) => `
            <div class="roda-question">
              <p><strong>${qi + 1}.</strong> ${escapeHtml(q.q)}</p>
              <div class="q-options">
                ${q.opts.map((opt, oi) => `
                  <button class="q-opt" onclick="checkAnswer(this,${qi},${oi},${q.opts.findIndex(o => o.correct)})">
                    <span class="q-letter">${String.fromCharCode(65 + oi)}</span>
                    ${escapeHtml(opt.text)}
                  </button>`).join('')}
              </div>
            </div>`).join('')}
        </div>`;
    }

    case 'hasil': {
      const title = b.title as string || 'Hasil';
      const subtitle = b.subtitle as string || '';
      return `
        <div class="block hasil-block">
          <div class="hasil-icon">🏆</div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>`;
    }

    case 'refleksi': {
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

    case 'penutup': {
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

    case 'tabel-accord': {
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

    default: {
      // Fallback: render any block as a simple card with its type label
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
  }
}

// ── Page → HTML ───────────────────────────────────────────────────

function renderPageHtml(page: CanvaPage, pageIdx: number, totalPages: number): string {
  const schema = page.schema;
  const label = page.label || `Halaman ${pageIdx + 1}`;
  const templateType = page.templateType || 'custom';

  // Background style
  const bg = schema?.background;
  let bgStyle = 'background: linear-gradient(135deg, #0e1c2f, #13243a);';
  if (bg) {
    if (bg.type === 'gradient' && bg.color1) {
      bgStyle = `background: linear-gradient(135deg, ${bg.color1}, ${bg.color2 || bg.color1});`;
    } else if (bg.type === 'solid' && bg.color1) {
      bgStyle = `background: ${bg.color1};`;
    } else if (bg.type === 'radial' && bg.color1) {
      bgStyle = `background: radial-gradient(circle at 50% 40%, ${bg.color1}, ${bg.color2 || '#0e1c2f'});`;
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

// ── CSS ───────────────────────────────────────────────────────────

function getCss(ratioW: number, ratioH: number): string {
  return `
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; -webkit-text-size-adjust: 100%; }
    body {
      font-family: 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #070d18;
      color: #e8f2ff;
      overflow: hidden;
      min-height: 100vh;
      user-select: none;
      -webkit-user-select: none;
    }
    button { font-family: inherit; cursor: pointer; border: none; outline: none; }
    button:focus-visible { outline: 2px solid #fbbf24; outline-offset: 2px; }

    /* ── App layout ── */
    #app { height: 100vh; display: flex; flex-direction: column; }

    /* ── Canvas container ── */
    #canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }
    #canvas {
      position: relative;
      width: ${ratioW}px;
      height: ${ratioH}px;
      transform-origin: center center;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
      border-radius: 4px;
    }

    /* ── Page ── */
    .page {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      transition: opacity 0.35s ease, transform 0.35s ease;
      padding: 5%;
    }
    .page.active { opacity: 1; transform: translateX(0); }
    .page.exit-left { opacity: 0; transform: translateX(-30px); pointer-events: none; }
    .page.exit-right { opacity: 0; transform: translateX(30px); pointer-events: none; }
    .page.enter-left { opacity: 0; transform: translateX(-30px); }
    .page.enter-right { opacity: 0; transform: translateX(30px); }
    .page-content { flex: 1; }
    .page-label {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.65rem;
      color: rgba(255,255,255,0.25);
      font-weight: 600;
      white-space: nowrap;
    }
    .section-label {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .empty-page {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(255,255,255,0.3);
      font-size: 0.85rem;
    }

    /* ── Block base ── */
    .block {
      background: rgba(255,255,255,0.04);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid rgba(255,255,255,0.06);
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .block-icon { font-size: 1.2rem; }
    .block-header h2 { font-size: 1rem; font-weight: 700; }
    .block-intro { color: #6e90b5; font-size: 0.82rem; margin-bottom: 10px; }
    .highlight { color: #fbbf24; }

    /* ── Cover ── */
    .cover-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 80%;
      position: relative;
      overflow: hidden;
      background: transparent !important;
      border: none;
    }
    .cover-glow {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .cover-icon { font-size: 3rem; margin-bottom: 12px; }
    .cover-title {
      font-size: 1.6rem;
      font-weight: 900;
      line-height: 1.2;
      margin-bottom: 6px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    .cover-subtitle {
      font-size: 0.9rem;
      color: #6e90b5;
      margin-bottom: 16px;
    }
    .cover-badges { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    /* ── Step grid ── */
    .step-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 480px) { .step-grid { grid-template-columns: 1fr; } }
    .step-card {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .step-num {
      min-width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: #3ecfcf22;
      color: #3ecfcf;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .step-icon { font-size: 1.1rem; }
    .step-content h3 { font-size: 0.8rem; font-weight: 700; margin-bottom: 2px; }
    .step-content p { font-size: 0.72rem; color: #6e90b5; line-height: 1.4; }
    .tips-box {
      margin-top: 10px;
      padding: 10px 14px;
      background: #fbbf2411;
      border: 1px solid #fbbf2433;
      border-radius: 10px;
      font-size: 0.78rem;
      color: #fbbf24;
    }

    /* ── TP ── */
    .tp-list { display: flex; flex-direction: column; gap: 8px; }
    .tp-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .tp-num {
      min-width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      font-size: 0.7rem;
      font-weight: 800;
      color: #0e1c2f;
    }
    .tp-verb { font-weight: 700; font-size: 0.82rem; }
    .tp-desc { font-size: 0.78rem; color: #6e90b5; }

    /* ── Timeline ── */
    .timeline { position: relative; padding-left: 20px; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 6px; top: 0; bottom: 0;
      width: 2px;
      background: rgba(255,255,255,0.1);
    }
    .timeline-step { position: relative; margin-bottom: 14px; }
    .timeline-dot {
      position: absolute;
      left: -18px; top: 4px;
      width: 10px; height: 10px;
      border-radius: 50%;
    }
    .timeline-content {
      padding: 8px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
    }
    .timeline-durasi { font-size: 0.68rem; font-weight: 600; color: #6e90b5; margin-bottom: 2px; }
    .timeline-content h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 2px; }
    .timeline-content p { font-size: 0.74rem; color: #6e90b5; }

    /* ── Skenario ── */
    .skenario-chapter {
      padding: 12px;
      margin-bottom: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    .skenario-char { font-size: 2rem; margin-bottom: 4px; }
    .skenario-chapter h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 8px; }
    .dialog { font-size: 0.78rem; margin-bottom: 4px; color: #94a3b8; }
    .choice-card {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      margin: 4px 0;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
      font-size: 0.78rem;
    }
    .choice-icon { font-size: 1rem; }
    .choice-detail { color: #6e90b5; font-size: 0.7rem; }

    /* ── Def-box ── */
    .def-box { display: flex; align-items: flex-start; gap: 10px; }
    .def-icon { font-size: 1.2rem; }
    .def-box p { font-size: 0.82rem; line-height: 1.5; }

    /* ── NC Grid ── */
    .nc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 480px) { .nc-grid { grid-template-columns: 1fr; } }
    .nc-card {
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .nc-icon { font-size: 1.4rem; margin-bottom: 4px; }
    .nc-card h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; }
    .nc-card p { font-size: 0.74rem; color: #6e90b5; line-height: 1.4; }

    /* ── NK Card ── */
    .nk-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .nk-icon { font-size: 1.8rem; }
    .nk-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6e90b5; }
    .nk-header h3 { font-size: 1rem; font-weight: 800; }
    .nk-def { font-size: 0.82rem; line-height: 1.5; margin-bottom: 8px; }
    .nk-chars { margin-bottom: 8px; }
    .nk-char { font-size: 0.78rem; margin-bottom: 3px; }
    .nk-sanksi h4 { font-size: 0.78rem; font-weight: 700; margin-bottom: 4px; color: #ff6b6b; }
    .nk-sanksi-item { font-size: 0.74rem; margin-bottom: 2px; padding-left: 8px; }
    .nk-contoh {
      margin-top: 8px; padding: 8px 12px;
      background: #34d39911; border-radius: 8px;
      font-size: 0.78rem; color: #34d399;
    }

    /* ── Flashcard ── */
    .flashcard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 480px) { .flashcard-grid { grid-template-columns: 1fr; } }
    .flashcard {
      perspective: 600px;
      height: 120px;
      cursor: pointer;
    }
    .flashcard-inner {
      position: relative;
      width: 100%; height: 100%;
      transition: transform 0.5s ease;
      transform-style: preserve-3d;
    }
    .flashcard.flipped .flashcard-inner { transform: rotateY(180deg); }
    .flashcard-front, .flashcard-back {
      position: absolute; inset: 0;
      backface-visibility: hidden;
      border-radius: 10px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 12px;
      text-align: center;
    }
    .flashcard-front { background: #182d45; border: 1px solid rgba(255,255,255,0.08); }
    .flashcard-back {
      background: #34d39922;
      border: 1px solid #34d39944;
      transform: rotateY(180deg);
    }
    .flashcard-num {
      position: absolute; top: 6px; left: 8px;
      font-size: 0.65rem; font-weight: 700; color: #6e90b5;
    }
    .flashcard-front p, .flashcard-back p { font-size: 0.78rem; line-height: 1.3; }

    /* ── Ftab ── */
    .ftab-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
    .ftab-btn {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255,255,255,0.05);
      color: #6e90b5;
      transition: all 0.2s ease;
    }
    .ftab-btn.active { background: #3ecfcf22; color: #3ecfcf; border-color: #3ecfcf44; }
    .ftab-btn:hover { background: rgba(255,255,255,0.08); }
    .ftab-panel { display: none; }
    .ftab-panel.active { display: block; }

    /* ── Materi Section ── */
    .materi-section-block { border-radius: 14px; }
    .materi-section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
    .materi-section-icon { font-size: 1.5rem; }
    .materi-section-header h2 { font-size: 1.1rem; font-weight: 800; }
    .materi-subtitle { font-size: 0.78rem; color: #6e90b5; }
    .materi-content { margin-bottom: 10px; }
    .bsnp-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.6rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #0e1c2f;
      letter-spacing: 0.05em;
    }
    .takeaways {
      margin-top: 10px;
      padding: 12px;
      background: rgba(251,191,36,0.06);
      border-radius: 10px;
      border: 1px solid rgba(251,191,36,0.15);
    }
    .takeaways h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 6px; color: #fbbf24; }
    .takeaway-item { font-size: 0.78rem; margin-bottom: 3px; color: #e8f2ff; }
    .self-check {
      margin-top: 10px;
      padding: 12px;
      background: rgba(167,139,250,0.08);
      border-radius: 10px;
      border: 1px solid rgba(167,139,250,0.15);
    }
    .self-check h3 { font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; color: #a78bfa; }
    .self-check p { font-size: 0.78rem; color: #94a3b8; }

    /* ── Kuis ── */
    .kuis-question { margin-bottom: 14px; }
    .q-text { font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }
    .q-options { display: flex; flex-direction: column; gap: 5px; }
    .q-opt {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      font-size: 0.78rem;
      color: #e8f2ff;
      transition: all 0.2s ease;
      text-align: left;
    }
    .q-opt:hover { background: rgba(255,255,255,0.08); }
    .q-opt.correct { background: #34d39922 !important; border-color: #34d39955 !important; color: #34d399 !important; }
    .q-opt.wrong { background: #ff6b6b22 !important; border-color: #ff6b6b55 !important; color: #ff6b6b !important; }
    .q-opt.disabled { pointer-events: none; opacity: 0.6; }
    .q-letter {
      min-width: 22px; height: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      font-size: 0.68rem;
      font-weight: 700;
    }
    .q-feedback {
      margin-top: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      min-height: 1em;
    }

    /* ── Diskusi ── */
    .diskusi-card {
      padding: 10px 14px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .diskusi-label { font-size: 0.72rem; font-weight: 700; margin-bottom: 4px; }
    .diskusi-teks { font-size: 0.82rem; margin-bottom: 4px; }
    .diskusi-petunjuk { font-size: 0.72rem; color: #6e90b5; }

    /* ── Refleksi ── */
    .refleksi-card {
      padding: 10px 14px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .refleksi-card p { font-size: 0.82rem; margin-bottom: 3px; }
    .refleksi-petunjuk { font-size: 0.72rem; color: #6e90b5; }

    /* ── Penutup ── */
    .penutup-preview { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 480px) { .penutup-preview { grid-template-columns: 1fr; } }
    .penutup-item {
      padding: 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
    }
    .penutup-item span { font-size: 1.4rem; display: block; margin-bottom: 4px; }
    .penutup-item strong { font-size: 0.82rem; display: block; margin-bottom: 2px; }
    .penutup-item p { font-size: 0.72rem; color: #6e90b5; }

    /* ── Accordion ── */
    .accord-row { margin-bottom: 6px; border-radius: 10px; overflow: hidden; }
    .accord-header {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      cursor: pointer;
      font-size: 0.82rem;
    }
    .accord-arrow { margin-left: auto; transition: transform 0.2s ease; font-size: 0.7rem; color: #6e90b5; }
    .accord-row.open .accord-arrow { transform: rotate(180deg); }
    .accord-body {
      display: none;
      padding: 10px 14px;
      background: rgba(255,255,255,0.02);
      font-size: 0.78rem;
    }
    .accord-row.open .accord-body { display: block; }
    .accord-detail { margin-bottom: 3px; }

    /* ── Sortir ── */
    .sortir-pool { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .sortir-item {
      padding: 5px 12px;
      background: rgba(255,255,255,0.06);
      border-radius: 20px;
      font-size: 0.75rem;
      cursor: grab;
    }
    .sortir-kolom { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sortir-kolom-box { padding: 12px; border-radius: 10px; min-height: 60px; }
    .sortir-kolom-box h4 { font-size: 0.78rem; font-weight: 700; margin-bottom: 4px; }

    /* ── Roda ── */
    .roda-question { margin-bottom: 14px; }
    .roda-question p { font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }

    /* ── Hasil ── */
    .hasil-block {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
      min-height: 50%;
      background: transparent;
      border: none;
    }
    .hasil-icon { font-size: 3rem; margin-bottom: 10px; }
    .hasil-block h2 { font-size: 1.4rem; font-weight: 900; margin-bottom: 6px; }
    .hasil-block p { color: #6e90b5; }

    /* ── Generic fallback ── */
    .generic-block { font-size: 0.82rem; }
    .text-muted { color: #6e90b5; font-style: italic; }

    /* ── Navigation bar ── */
    #nav-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 16px;
      background: rgba(14,28,47,0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    #nav-bar button {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #e8f2ff;
      transition: all 0.15s ease;
    }
    #prev-btn { background: rgba(255,255,255,0.08); }
    #prev-btn:hover { background: rgba(255,255,255,0.15); }
    #next-btn { background: #3ecfcf33; color: #3ecfcf; }
    #next-btn:hover { background: #3ecfcf55; }
    #fullscreen-btn {
      padding: 6px 10px;
      background: rgba(255,255,255,0.06);
      font-size: 0.9rem;
    }
    #fullscreen-btn:hover { background: rgba(255,255,255,0.12); }
    #page-counter {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6e90b5;
      min-width: 40px;
      text-align: center;
    }

    /* ── Scrollbar ── */
    .page::-webkit-scrollbar { width: 4px; }
    .page::-webkit-scrollbar-track { background: transparent; }
    .page::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

    /* ── Confetti ── */
    .confetti-piece {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      animation: confettiFall 2s ease-in forwards;
    }
    @keyframes confettiFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  `;
}

// ── JavaScript ────────────────────────────────────────────────────

function getJs(): string {
  return `
    // ── State ──
    let currentPage = 0;
    let totalPages = 0;

    // ── Init ──
    (function init() {
      const data = window.__EXPORT_DATA__;
      if (!data || !data.pages) { document.getElementById('canvas').innerHTML = '<div class="empty-page"><p>Data export tidak ditemukan.</p></div>'; return; }

      totalPages = data.pages.length;
      const ratioW = data.ratioW || 1280;
      const ratioH = data.ratioH || 720;

      // Render all pages
      const canvas = document.getElementById('canvas');
      canvas.style.width = ratioW + 'px';
      canvas.style.height = ratioH + 'px';
      canvas.innerHTML = data.pagesHtml.map((html, i) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const page = div.firstElementChild;
        if (page) {
          page.classList.toggle('active', i === 0);
        }
        return div.innerHTML;
      }).join('');

      updateCounter();
      scaleCanvas();
      window.addEventListener('resize', scaleCanvas);
    })();

    // ── Navigation ──
    function goPage(idx) {
      if (idx < 0 || idx >= totalPages || idx === currentPage) return;
      const pages = document.querySelectorAll('.page');
      const direction = idx > currentPage ? 1 : -1;

      // Exit current
      pages[currentPage]?.classList.remove('active');
      pages[currentPage]?.classList.add(direction > 0 ? 'exit-left' : 'exit-right');

      // Enter new
      currentPage = idx;
      pages[currentPage]?.classList.remove('exit-left', 'exit-right', 'enter-left', 'enter-right');
      pages[currentPage]?.classList.add(direction > 0 ? 'enter-right' : 'enter-left');

      // Trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pages[currentPage]?.classList.remove('enter-left', 'enter-right');
          pages[currentPage]?.classList.add('active');
          // Clean up old page after transition
          setTimeout(() => {
            pages.forEach((p, i) => {
              if (i !== currentPage) {
                p.classList.remove('exit-left', 'exit-right', 'active');
              }
            });
          }, 400);
        });
      });

      updateCounter();

      // Confetti on last page
      if (currentPage === totalPages - 1) {
        launchConfetti();
      }
    }

    function nextPage() { goPage(currentPage + 1); }
    function prevPage() { goPage(currentPage - 1); }

    function updateCounter() {
      const counter = document.getElementById('page-counter');
      if (counter) counter.textContent = (currentPage + 1) + '/' + totalPages;
    }

    // ── Scale canvas to fit viewport ──
    function scaleCanvas() {
      const container = document.getElementById('canvas-container');
      const canvas = document.getElementById('canvas');
      if (!container || !canvas) return;

      const aW = (container.clientWidth || 800) - 40;
      const aH = (container.clientHeight || 500) - 40;
      const cW = parseInt(canvas.style.width) || 1280;
      const cH = parseInt(canvas.style.height) || 720;
      const scale = Math.min(aW / cW, aH / cH, 1);

      canvas.style.transform = 'scale(' + scale + ')';
    }

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextPage(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
      if (e.key === 'Escape') { if (document.fullscreenElement) document.exitFullscreen(); }
    });

    // ── Touch/swipe ──
    let touchStartX = 0;
    document.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    document.addEventListener('touchend', function(e) {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) nextPage();
        else prevPage();
      }
    }, { passive: true });

    // ── Fullscreen ──
    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen().catch(function() {});
      }
    }

    // ── Kuis answer check ──
    function checkAnswer(btn, qi, oi, ans) {
      const question = btn.closest('.kuis-question') || btn.closest('.roda-question');
      if (!question) return;

      const allBtns = question.querySelectorAll('.q-opt');
      // Disable all
      allBtns.forEach(function(b) { b.classList.add('disabled'); });

      // Mark correct/wrong
      if (oi === ans) {
        btn.classList.add('correct');
        const fb = document.getElementById('qfb-' + qi);
        if (fb) fb.innerHTML = '<span style="color:#34d399;">✓ Benar!</span>';
      } else {
        btn.classList.add('wrong');
        allBtns[ans]?.classList.add('correct');
        const fb = document.getElementById('qfb-' + qi);
        if (fb) fb.innerHTML = '<span style="color:#ff6b6b;">✗ Salah. Jawaban benar: ' + String.fromCharCode(65 + ans) + '</span>';
      }
    }

    // ── Ftab switcher ──
    function switchFtab(tabId, idx) {
      var btns = document.querySelectorAll('#' + tabId + ' .ftab-btn');
      btns.forEach(function(b, i) { b.classList.toggle('active', i === idx); });

      var panels = document.querySelectorAll('[data-ftab="' + tabId + '"]');
      panels.forEach(function(p) { p.classList.toggle('active', parseInt(p.dataset.idx) === idx); });
    }

    // ── Confetti ──
    function launchConfetti() {
      var colors = ['#fbbf24', '#3ecfcf', '#34d399', '#a78bfa', '#ff6b6b', '#fb923c'];
      for (var i = 0; i < 40; i++) {
        var piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = 'left:' + (Math.random() * 100) + '%;top:-10px;width:' + (4 + Math.random() * 6) + 'px;height:' + (4 + Math.random() * 6) + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';animation-duration:' + (1.5 + Math.random() * 2) + 's;animation-delay:' + (Math.random() * 0.5) + 's;';
        document.body.appendChild(piece);
        setTimeout(function(p) { p.remove(); }.bind(null, piece), 3500);
      }
    }
  `;
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
    <div id="nav-bar">
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
