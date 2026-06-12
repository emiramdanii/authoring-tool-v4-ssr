// ═══════════════════════════════════════════════════════════════════════
// QUIZ RENDERERS — Kuis, True/False, Fill-Blank block HTML rendering
// Sprint 6.4-C: Step-reveal flow + completion screen + replay
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
  const total = questions.length;
  const kuisId = `kuis-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block kuis-block" data-block-id="${kuisId}" data-total="${total}">
      <div class="block-header">
        <span class="block-icon">❓</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-progress" id="kuis-progress-${kuisId}">
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" id="kuis-pfill-${kuisId}" style="width:0%"></div></div>
        <span class="quiz-progress-text" id="kuis-ptext-${kuisId}">Soal 1 dari ${total}</span>
      </div>
      ${questions.map((q, qi) => `
        <div class="kuis-question kuis-step${qi === 0 ? ' step-active' : ''}" data-ans="${q.ans}" data-idx="${qi}" data-answered="false">
          <p class="q-text"><strong>${qi + 1}.</strong> ${escapeHtml(q.q)}</p>
          <div class="q-options">
            ${q.opts.map((opt, oi) => `
              <button class="q-opt" data-qi="${qi}" data-oi="${oi}" onclick="checkAnswer(this,${qi},${oi},${q.ans})">
                <span class="q-letter">${String.fromCharCode(65 + oi)}</span>
                ${escapeHtml(opt)}
              </button>`).join('')}
          </div>
          ${q.ex ? `<div class="q-explanation" style="display:none;">${escapeHtml(q.ex)}</div>` : ''}
          <div class="q-feedback" id="qfb-${kuisId}-${qi}"></div>
          <button class="q-next-btn" style="display:none;" onclick="nextKuisStep('${kuisId}',${qi})">Lanjut →</button>
        </div>`).join('')}
      <div class="quiz-completion" id="kuis-done-${kuisId}" style="display:none;">
        <div class="quiz-completion-icon" id="kuis-done-icon-${kuisId}"></div>
        <h3 class="quiz-completion-title" id="kuis-done-title-${kuisId}"></h3>
        <p class="quiz-completion-score" id="kuis-done-score-${kuisId}"></p>
        <p class="quiz-completion-msg" id="kuis-done-msg-${kuisId}"></p>
        <button class="quiz-replay-btn" onclick="replayKuis('${kuisId}')">🔄 Ulangi</button>
      </div>
    </div>`;
}

function renderTrueFalseGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Benar atau Salah';
  const questions = (b.questions as Array<{ text: string; correct: boolean; explanation?: string }>) || [];
  const total = questions.length;
  const tfId = `tf-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block true-false-block" data-game="${tfId}" data-total="${total}">
      <div class="block-header">
        <span class="block-icon">✅</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-progress" id="tf-progress-${tfId}">
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" id="tf-pfill-${tfId}" style="width:0%"></div></div>
        <span class="quiz-progress-text" id="tf-ptext-${tfId}">Soal 1 dari ${total}</span>
      </div>
      ${questions.map((q, i) => `
        <div class="tf-question tf-step${i === 0 ? ' step-active' : ''}" id="tf-q-${tfId}-${i}" data-answered="false" data-idx="${i}">
          <p><strong>${i + 1}.</strong> ${escapeHtml(q.text)}</p>
          <div class="tf-buttons">
            <button class="tf-btn tf-true" data-correct="${q.correct}" data-idx="${i}" data-game="${tfId}" onclick="checkTrueFalse(this, true)">✅ Benar</button>
            <button class="tf-btn tf-false" data-correct="${q.correct}" data-idx="${i}" data-game="${tfId}" onclick="checkTrueFalse(this, false)">❌ Salah</button>
          </div>
          ${q.explanation ? `<div class="tf-explanation" style="display:none;">${escapeHtml(q.explanation)}</div>` : ''}
          <div class="tf-feedback" id="tf-fb-${tfId}-${i}"></div>
          <button class="q-next-btn tf-next-btn" style="display:none;" onclick="nextTFStep('${tfId}',${i})">Lanjut →</button>
        </div>`).join('')}
      <div class="quiz-completion" id="tf-done-${tfId}" style="display:none;">
        <div class="quiz-completion-icon" id="tf-done-icon-${tfId}"></div>
        <h3 class="quiz-completion-title" id="tf-done-title-${tfId}"></h3>
        <p class="quiz-completion-score" id="tf-done-score-${tfId}"></p>
        <p class="quiz-completion-msg" id="tf-done-msg-${tfId}"></p>
        <button class="quiz-replay-btn" onclick="replayTF('${tfId}')">🔄 Ulangi</button>
      </div>
    </div>`;
}

function renderFillBlankGame(b: Record<string, unknown>): string {
  const title = b.title as string || 'Isian Singkat';
  const questions = (b.questions as Array<{ text: string; answer: string; hint?: string }>) || [];
  const total = questions.length;
  const fbId = `fb-${Math.random().toString(36).slice(2, 8)}`;
  return `
    <div class="block fill-blank-game-block" data-game="${fbId}" data-checked="false" data-total="${total}">
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
      <div class="quiz-completion" id="fb-done-${fbId}" style="display:none;">
        <div class="quiz-completion-icon" id="fb-done-icon-${fbId}"></div>
        <h3 class="quiz-completion-title" id="fb-done-title-${fbId}"></h3>
        <p class="quiz-completion-score" id="fb-done-score-${fbId}"></p>
        <p class="quiz-completion-msg" id="fb-done-msg-${fbId}"></p>
        <button class="quiz-replay-btn" onclick="replayFB('${fbId}')">🔄 Ulangi</button>
      </div>
    </div>`;
}
