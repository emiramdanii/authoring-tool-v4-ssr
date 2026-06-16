// ═══════════════════════════════════════════════════════════════════════
// QUIZ RENDERERS — Kuis, True/False, Fill-Blank block HTML rendering
// Sprint 6.4-C: Step-reveal flow + completion screen + replay
// Sprint 6.4-D: Variant parity (A/Klasik, B/Kartu, C/Ringkas)
// Sprint 6.4-D0-Patch: Deterministic block IDs from schema
// Sprint 6.4-E1-Patch: Security/resilience — defensive guards, XSS-safe,
//   legacy answer normalization, deterministic ID fallback, duplicate ID
//   disambiguation, empty/malformed state handling
// Sprint 6.4-E1-Patch-2: Boolean contract (normalizeBoolean), export context
//   (ExportRenderContext replaces module-level mutable state)
// ═══════════════════════════════════════════════════════════════════════

import { escapeHtml, resolveColor, type RenderBlockFn } from './utils';

// ═══════════════════════════════════════════════════════════════════════
// DEFENSIVE HELPERS — Normalize data at the export boundary
// ═══════════════════════════════════════════════════════════════════════

/**
 * Coerce any value to a safe string for rendering.
 * Returns the string if already a string, fallback for null/undefined,
 * or String() coercion for other types (numbers, booleans).
 */
function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
}

/**
 * Coerce any value to an array. Returns the array if already one,
 * otherwise returns an empty array (never crashes on null/undefined).
 */
function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Normalize a quiz answer index from various legacy formats.
 *
 * Accepts:
 *   - Numeric: 0, 1, 2, 3 (0-based index)
 *   - Uppercase letter: "A"→0, "B"→1, "C"→2, "D"→3
 *   - Lowercase letter: "a"→0, "b"→1, "c"→2, "d"→3
 *   - Numeric string: "0"→0, "1"→1
 *
 * Returns null for invalid/unsafe values (negative, out of range,
 * unrecognized letters, objects, etc.). A null result means the
 * question is non-scorable — the renderer should mark it accordingly.
 */
function normalizeAnswerIndex(value: unknown, optionCount: number): number | null {
  if (optionCount <= 0) return null;

  // Numeric
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value >= 0 && value < optionCount ? value : null;
  }

  // String
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Numeric string: "0", "1"
    if (/^-?\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      return num >= 0 && num < optionCount ? num : null;
    }

    // Legacy letter format: "A"→0, "B"→1, "C"→2, "D"→3
    const upper = trimmed.toUpperCase();
    if (/^[A-Z]$/.test(upper)) {
      const idx = upper.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      return idx >= 0 && idx < optionCount ? idx : null;
    }
  }

  // Invalid type (null, undefined, object, boolean, etc.)
  return null;
}

/**
 * Normalize a value to boolean for true-false questions.
 *
 * IMPORTANT: Do NOT use Boolean() or !!value — "false" and "0" would
 * become true, which is semantically wrong for TF questions.
 *
 * Contract:
 *   true, "true", 1, "1"   → true
 *   false, "false", 0, "0" → false
 *   anything else          → null (non-scorable)
 *
 * When null is returned, the question should be treated as non-scorable
 * (no correct answer can be determined), NOT silently coerced to false.
 */
function normalizeBoolean(value: unknown): boolean | null {
  if (value === true || value === 1 || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 0 || value === 'false' || value === '0') {
    return false;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════
// ID GENERATION — Deterministic, collision-safe
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// EXPORT RENDER CONTEXT — Per-export state (replaces module-level mutables)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Render context scoped to a single export run.
 *
 * One export = one context = no global reset needed.
 * Each context carries its own ID registry and ordinal counter,
 * so concurrent or sequential exports never interfere.
 *
 * Previously, usedBlockIds and _blockOrdinal were module-level state
 * that required resetBlockIdRegistry() before each export — fragile.
 * Now, the context is created fresh per export and threaded through
 * the render chain, making all quiz renderers pure w.r.t. context.
 */
export interface ExportRenderContext {
  usedBlockIds: Set<string>;
  blockOrdinal: number;
}

/** Create a fresh render context for a new export run */
export function createExportRenderContext(): ExportRenderContext {
  return {
    usedBlockIds: new Set(),
    blockOrdinal: 0,
  };
}

/**
 * @deprecated Use createExportRenderContext() + thread context instead.
 * This function is kept only for backward compatibility with tests
 * that call renderQuizBlock without a context. It resets a shared
 * module-level context used as fallback.
 */
const _legacyContext: ExportRenderContext = createExportRenderContext();

export function resetBlockIdRegistry(): void {
  _legacyContext.usedBlockIds.clear();
  _legacyContext.blockOrdinal = 0;
}

/**
 * Produce a stable, DOM-safe, collision-free ID for a quiz/game block.
 *
 * Priority:
 *   1. block.id from schema (sanitized, disambiguated on collision)
 *   2. Deterministic ordinal fallback (based on context counter)
 *
 * The result is always prefixed and sanitized for safe use in HTML id attributes.
 * No Math.random() — fully deterministic for same input + same context.
 */
function stableBlockId(
  prefix: 'kuis' | 'tf' | 'fb',
  block: Record<string, unknown>,
  ctx: ExportRenderContext,
): string {
  const rawId = block.id;

  // Coerce block.id to string (handles numbers, etc.)
  if (rawId != null && rawId !== '') {
    const rawStr = String(rawId);
    // Sanitize: keep only alphanumeric, hyphens, underscores
    const safe = rawStr.replace(/[^a-zA-Z0-9_-]/g, '');
    // Ensure ID doesn't start with a digit (invalid HTML id)
    const candidate = /^[0-9]/.test(safe) ? `${prefix}-${safe}` : `${prefix}-${safe}`;

    // Check for collision — disambiguate deterministically
    if (!ctx.usedBlockIds.has(candidate)) {
      ctx.usedBlockIds.add(candidate);
      return candidate;
    }
    // Collision: append -2, -3, -4, ...
    let seq = 2;
    while (ctx.usedBlockIds.has(`${candidate}-${seq}`)) seq++;
    const disambiguated = `${candidate}-${seq}`;
    ctx.usedBlockIds.add(disambiguated);
    return disambiguated;
  }

  // Fallback: deterministic ordinal-based ID
  // Same context → same ordinal → same ID
  ctx.blockOrdinal++;
  const ordinalId = `${prefix}-p0-b${ctx.blockOrdinal}`;
  ctx.usedBlockIds.add(ordinalId);
  return ordinalId;
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Render a quiz block. Returns null if the block type is not handled here.
 *
 * @param ctx Export render context — provides ID registry for the current export.
 *   If omitted, falls back to the legacy module-level context (for backward
 *   compatibility with existing tests). New callers should always pass ctx.
 */
export function renderQuizBlock(
  type: string,
  b: Record<string, unknown>,
  _renderBlock: RenderBlockFn,
  ctx?: ExportRenderContext,
): string | null {
  const renderCtx = ctx || _legacyContext;
  switch (type) {
    case 'kuis': return renderKuis(b, renderCtx);
    case 'true-false-game': return renderTrueFalseGame(b, renderCtx);
    case 'fill-blank-game': return renderFillBlankGame(b, renderCtx);
    default: return null;
  }
}

// Sprint 6.4-D: Normalize variant, fallback to A for empty/invalid values
function normalizeKuisVariant(raw: string | undefined): 'A' | 'B' | 'C' {
  const v = (raw || '').toUpperCase();
  return v === 'B' || v === 'C' ? v : 'A';
}

// ═══════════════════════════════════════════════════════════════════════
// KUIS RENDERER
// ═══════════════════════════════════════════════════════════════════════

function renderKuis(b: Record<string, unknown>, ctx: ExportRenderContext): string {
  const title = asText(b.title, 'Kuis');
  const rawQuestions = asArray<Record<string, unknown>>(b.questions);
  const kuisId = stableBlockId('kuis', b, ctx);
  const variant = normalizeKuisVariant(b.variant as string | undefined);
  const variantClass = `quiz-variant-${variant.toLowerCase()}`;

  // Normalize questions — filter nulls, guard all fields
  const questions = rawQuestions
    .filter(q => q != null && typeof q === 'object')
    .map(q => {
      const opts = asArray<unknown>(q.opts)
        .map(o => asText(o))
        .filter(o => o !== '');  // Remove empty options
      const rawAns = q.ans;
      const ansIndex = normalizeAnswerIndex(rawAns, opts.length);
      return {
        q: asText(q.q),
        opts,
        ans: ansIndex,
        ex: asText(q.ex),
      };
    });

  const total = questions.length;

  // Empty state: no valid questions after normalization
  if (total === 0) {
    return `
    <div class="block kuis-block ${variantClass}" data-block-id="${kuisId}" data-total="0" data-variant="${variant}">
      <div class="block-header">
        <span class="block-icon">❓</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-empty-state" style="padding:24px;text-align:center;color:#6e90b5;">
        <p>Belum ada soal.</p>
      </div>
    </div>`;
  }

  return `
    <div class="block kuis-block ${variantClass}" data-block-id="${kuisId}" data-total="${total}" data-variant="${variant}">
      <div class="block-header">
        <span class="block-icon">❓</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-progress" id="kuis-progress-${kuisId}">
        <div class="quiz-progress-bar" role="progressbar" aria-label="Kemajuan kuis" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="1" aria-valuetext="Soal 1 dari ${total}" id="kuis-pbar-${kuisId}"><div class="quiz-progress-fill" id="kuis-pfill-${kuisId}" style="width:0%"></div></div>
        <span class="quiz-progress-text" id="kuis-ptext-${kuisId}">Soal 1 dari ${total}</span>
      </div>
      ${questions.map((q, qi) => {
        // If ans is null (invalid/legacy), mark question as non-scorable
        const isScorable = q.ans !== null;
        const ansAttr = isScorable ? q.ans : -1;
        const nonScorableClass = isScorable ? '' : ' non-scorable';
        return `
        <div class="kuis-question kuis-step${qi === 0 ? ' step-active' : ''}${nonScorableClass}" data-ans="${ansAttr}" data-idx="${qi}" data-answered="false" tabindex="-1">
          <p class="q-text"><strong>${qi + 1}.</strong> ${escapeHtml(q.q)}</p>
          <div class="q-options">
            ${q.opts.map((opt, oi) => `
              <button class="q-opt" data-qi="${qi}" data-oi="${oi}" onclick="checkAnswer(this,${qi},${oi},${ansAttr})">
                <span class="q-letter">${String.fromCharCode(65 + oi)}</span>
                ${escapeHtml(opt)}
              </button>`).join('')}
          </div>
          ${q.ex ? `<div class="q-explanation" style="display:none;">${escapeHtml(q.ex)}</div>` : ''}
          <div class="q-feedback" id="qfb-${kuisId}-${qi}" role="status"></div>
          <button class="q-next-btn" style="display:none;" onclick="nextKuisStep('${kuisId}',${qi})">Lanjut →</button>
        </div>`;
      }).join('')}
      <div class="quiz-completion" id="kuis-done-${kuisId}" style="display:none;" role="region" aria-live="polite" tabindex="-1">
        <div class="quiz-completion-icon" id="kuis-done-icon-${kuisId}"></div>
        <h3 class="quiz-completion-title" id="kuis-done-title-${kuisId}"></h3>
        <p class="quiz-completion-score" id="kuis-done-score-${kuisId}"></p>
        <p class="quiz-completion-msg" id="kuis-done-msg-${kuisId}"></p>
        <button class="quiz-replay-btn" onclick="replayKuis('${kuisId}')">🔄 Ulangi</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// TRUE/FALSE RENDERER
// ═══════════════════════════════════════════════════════════════════════

function renderTrueFalseGame(b: Record<string, unknown>, ctx: ExportRenderContext): string {
  const title = asText(b.title, 'Benar atau Salah');
  const rawQuestions = asArray<Record<string, unknown>>(b.questions);
  const tfId = stableBlockId('tf', b, ctx);

  // Normalize questions — filter nulls, guard all fields
  // Use normalizeBoolean: invalid correct values become null → non-scorable
  const questions = rawQuestions
    .filter(q => q != null && typeof q === 'object')
    .map(q => ({
      text: asText(q.text),
      correct: normalizeBoolean(q.correct),  // boolean | null
      explanation: asText(q.explanation),
    }));

  const total = questions.length;

  // Empty state
  if (total === 0) {
    return `
    <div class="block true-false-block" data-game="${tfId}" data-total="0">
      <div class="block-header">
        <span class="block-icon">✅</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-empty-state" style="padding:24px;text-align:center;color:#6e90b5;">
        <p>Belum ada soal.</p>
      </div>
    </div>`;
  }

  return `
    <div class="block true-false-block" data-game="${tfId}" data-total="${total}">
      <div class="block-header">
        <span class="block-icon">✅</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-progress" id="tf-progress-${tfId}">
        <div class="quiz-progress-bar" role="progressbar" aria-label="Kemajuan kuis" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="1" aria-valuetext="Soal 1 dari ${total}" id="tf-pbar-${tfId}"><div class="quiz-progress-fill" id="tf-pfill-${tfId}" style="width:0%"></div></div>
        <span class="quiz-progress-text" id="tf-ptext-${tfId}">Soal 1 dari ${total}</span>
      </div>
      ${questions.map((q, i) => {
        // If correct is null (invalid boolean), mark as non-scorable
        const isScorable = q.correct !== null;
        const correctAttr = isScorable ? String(q.correct) : '';
        const nonScorableClass = isScorable ? '' : ' non-scorable';
        return `
        <div class="tf-question tf-step${i === 0 ? ' step-active' : ''}${nonScorableClass}" id="tf-q-${tfId}-${i}" data-answered="false" data-idx="${i}" data-scorable="${isScorable}" data-correct="${correctAttr}" tabindex="-1">
          <p><strong>${i + 1}.</strong> ${escapeHtml(q.text)}</p>
          <div class="tf-buttons">
            <button class="tf-btn tf-true" data-correct="${correctAttr}" data-idx="${i}" data-game="${tfId}" data-scorable="${isScorable}" onclick="checkTrueFalse(this, true)">✅ Benar</button>
            <button class="tf-btn tf-false" data-correct="${correctAttr}" data-idx="${i}" data-game="${tfId}" data-scorable="${isScorable}" onclick="checkTrueFalse(this, false)">❌ Salah</button>
          </div>
          ${q.explanation ? `<div class="tf-explanation" style="display:none;">${escapeHtml(q.explanation)}</div>` : ''}
          <div class="tf-feedback" id="tf-fb-${tfId}-${i}" role="status"></div>
          <button class="q-next-btn tf-next-btn" style="display:none;" onclick="nextTFStep('${tfId}',${i})">Lanjut →</button>
        </div>`;
      }).join('')}
      <div class="quiz-completion" id="tf-done-${tfId}" style="display:none;" role="region" aria-live="polite" tabindex="-1">
        <div class="quiz-completion-icon" id="tf-done-icon-${tfId}"></div>
        <h3 class="quiz-completion-title" id="tf-done-title-${tfId}"></h3>
        <p class="quiz-completion-score" id="tf-done-score-${tfId}"></p>
        <p class="quiz-completion-msg" id="tf-done-msg-${tfId}"></p>
        <button class="quiz-replay-btn" onclick="replayTF('${tfId}')">🔄 Ulangi</button>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// FILL-BLANK RENDERER
// ═══════════════════════════════════════════════════════════════════════

function renderFillBlankGame(b: Record<string, unknown>, ctx: ExportRenderContext): string {
  const title = asText(b.title, 'Isian Singkat');
  const rawQuestions = asArray<Record<string, unknown>>(b.questions);
  const fbId = stableBlockId('fb', b, ctx);

  // Normalize questions — filter nulls, guard all fields
  const questions = rawQuestions
    .filter(q => q != null && typeof q === 'object')
    .map(q => ({
      text: asText(q.text),
      answer: asText(q.answer),
      hint: asText(q.hint),
    }));

  const total = questions.length;

  // Empty state
  if (total === 0) {
    return `
    <div class="block fill-blank-game-block" data-game="${fbId}" data-checked="false" data-total="0">
      <div class="block-header">
        <span class="block-icon">✏️</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="quiz-empty-state" style="padding:24px;text-align:center;color:#6e90b5;">
        <p>Belum ada soal.</p>
      </div>
    </div>`;
  }

  return `
    <div class="block fill-blank-game-block" data-game="${fbId}" data-checked="false" data-total="${total}">
      <div class="block-header">
        <span class="block-icon">✏️</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${questions.map((q, i) => {
        // Replace ___ with input field
        const text = q.text || '___';
        const parts = text.split('___');
        const answer = q.answer || '';
        const hint = q.hint || '...';
        const inputHtml = `<input type="text" class="fb-input" data-idx="${i}" data-game="${fbId}" data-answer="${escapeHtml(answer)}" placeholder="${escapeHtml(hint)}" onkeydown="if(event.key==='Enter')checkFillBlank(this)">`;
        const rendered = parts.length > 1
          ? parts.map((p, pi) => pi < parts.length - 1 ? escapeHtml(p) + inputHtml : escapeHtml(p)).join('')
          : escapeHtml(text);
        return `
          <div class="fb-question" id="fb-q-${fbId}-${i}">
            <p><strong>${i + 1}.</strong> ${rendered}</p>
            <div class="fb-feedback" id="fb-fb-${fbId}-${i}" role="status"></div>
          </div>`;
      }).join('')}
      <button class="game-check-btn" onclick="checkAllFillBlanks('${fbId}')">✅ Periksa Jawaban</button>
      <div class="quiz-completion" id="fb-done-${fbId}" style="display:none;" role="region" aria-live="polite" tabindex="-1">
        <div class="quiz-completion-icon" id="fb-done-icon-${fbId}"></div>
        <h3 class="quiz-completion-title" id="fb-done-title-${fbId}"></h3>
        <p class="quiz-completion-score" id="fb-done-score-${fbId}"></p>
        <p class="quiz-completion-msg" id="fb-done-msg-${fbId}"></p>
        <button class="quiz-replay-btn" onclick="replayFB('${fbId}')">🔄 Ulangi</button>
      </div>
    </div>`;
}
