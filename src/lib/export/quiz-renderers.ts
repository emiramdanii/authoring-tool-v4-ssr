// ═══════════════════════════════════════════════════════════════════════
// QUIZ RENDERERS — Kuis, True/False, Fill-Blank block HTML rendering
// ═══════════════════════════════════════════════════════════════════════

import { escapeHtml, resolveColor, type RenderBlockFn } from './utils';

/**
 * Render a quiz block. Returns null if the block type is not handled here.
 */
export function renderQuizBlock(
  type: string,
  b: Record<string, unknown>,
  _renderBlock: RenderBlockFn,
): string | null {
  switch (type) {
    case 'kuis': return renderKuis(b);
    case 'true-false-game': return renderTrueFalseGame(b);
    case 'fill-blank-game': return renderFillBlankGame(b);
    default: return null;
  }
}

function renderKuis(b: Record<string, unknown>): string {
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

function renderTrueFalseGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Benar atau Salah';
  const questions = (b.questions as Array<{ text: string; correct: boolean; explanation?: string }>) || [];
  const tfId = `tf-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block true-false-block" data-game="${tfId}">
      <div class="block-header">
        <span class="block-icon">✅</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${questions.map((q, i) => `
        <div class="tf-question" id="tf-q-${tfId}-${i}">
          <p><strong>${i + 1}.</strong> ${escapeHtml(q.text)}</p>
          <div class="tf-buttons">
            <button class="tf-btn tf-true" data-correct="${q.correct}" data-idx="${i}" data-game="${tfId}" onclick="checkTrueFalse(this, true)">✅ Benar</button>
            <button class="tf-btn tf-false" data-correct="${q.correct}" data-idx="${i}" data-game="${tfId}" onclick="checkTrueFalse(this, false)">❌ Salah</button>
          </div>
          <div class="tf-feedback" id="tf-fb-${tfId}-${i}"></div>
        </div>`).join('')}
    </div>`;
}

function renderFillBlankGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Isian Singkat';
  const questions = (b.questions as Array<{ text: string; answer: string; hint?: string }>) || [];
  const fbId = `fb-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block fill-blank-game-block" data-game="${fbId}">
      <div class="block-header">
        <span class="block-icon">✏️</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${questions.map((q, i) => {
        // Replace ___ with input field
        const parts = q.text.split('___');
        const inputHtml = `<input type="text" class="fb-input" data-idx="${i}" data-game="${fbId}" data-answer="${escapeHtml(q.answer)}" placeholder="${q.hint ? escapeHtml(q.hint) : '...'}" onkeydown="if(event.key==='Enter')checkFillBlank(this)">`;
        const rendered = parts.length > 1
          ? parts.map((p, pi) => pi < parts.length - 1 ? escapeHtml(p) + inputHtml : escapeHtml(p)).join('')
          : escapeHtml(q.text);
        return `
          <div class="fb-question" id="fb-q-${fbId}-${i}">
            <p><strong>${i + 1}.</strong> ${rendered}</p>
            <div class="fb-feedback" id="fb-fb-${fbId}-${i}"></div>
          </div>`;
      }).join('')}
      <button class="game-check-btn" onclick="checkAllFillBlanks('${fbId}')">✅ Periksa Jawaban</button>
    </div>`;
}
