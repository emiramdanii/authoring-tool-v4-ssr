// ═══════════════════════════════════════════════════════════════════════
// QUIZ RESILIENCE AUDIT — Systematic edge-case / malformed-data testing
// Tests renderQuizBlock for: kuis, true-false-game, fill-blank-game
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import { renderQuizBlock, resetBlockIdRegistry } from '@/lib/export/quiz-renderers';

// Noop render function matching the RenderBlockFn signature
const noopRender = (() => '') as unknown as import('@/lib/export/utils').RenderBlockFn;

// ── Helpers ──────────────────────────────────────────────────────────
const LONG_TEXT = 'X'.repeat(600);
const SPECIAL_TEXT = 'Hello 🌍\nLine2\t"quotes" & <tags> \u00E9\u00E8\u00EA \u2603 \u{1F600}';

/**
 * Safely call renderQuizBlock and return { result, error }.
 * Does NOT use expect().not.toThrow so we can capture both outcomes.
 */
function safeRender(type: string, block: Record<string, unknown>) {
  try {
    const result = renderQuizBlock(type, block, noopRender);
    return { result, error: null as Error | null };
  } catch (e) {
    return { result: null as string | null, error: e as Error };
  }
}

// Reset ID registry before each test to ensure deterministic ordinal IDs
beforeEach(() => resetBlockIdRegistry());

// ═══════════════════════════════════════════════════════════════════════
// 1. KUIS BLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Kuis block resilience', () => {
  const baseBlock = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    id: 'kuis-test-1',
    title: 'Test Kuis',
    variant: 'A',
    questions: [
      { q: 'What is 1+1?', opts: ['1', '2', '3', '4'], ans: 1, ex: '1+1=2' },
      { q: 'Capital of France?', opts: ['London', 'Paris', 'Berlin', 'Madrid'], ans: 1, ex: 'Paris is the capital' },
    ],
    ...overrides,
  });

  // 1. block.id missing
  it('1. block.id missing — should not crash, produces deterministic ordinal ID', () => {
    const block = baseBlock();
    delete (block as Record<string, unknown>).id;
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Deterministic ordinal fallback like kuis-p0-b1
    expect(result).toContain('kuis-p0-b1');
  });

  // 2. duplicate block.id
  it('2. duplicate block.id — second block gets disambiguated ID with -2 suffix', () => {
    const block1 = baseBlock({ id: 'dup-id' });
    const block2 = baseBlock({ id: 'dup-id' });
    const r1 = safeRender('kuis', block1);
    const r2 = safeRender('kuis', block2);
    expect(r1.error).toBeNull();
    expect(r2.error).toBeNull();
    const idExtract = (html: string) => {
      const m = html.match(/data-block-id="([^"]+)"/);
      return m ? m[1] : null;
    };
    const id1 = idExtract(r1.result!);
    const id2 = idExtract(r2.result!);
    // First gets kuis-dup-id, second gets kuis-dup-id-2
    expect(id1).toBe('kuis-dup-id');
    expect(id2).toBe('kuis-dup-id-2');
    expect(id1).not.toBe(id2);
  });

  // 3. questions empty array
  it('3. questions empty array — should render empty quiz shell', () => {
    const block = baseBlock({ questions: [] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('kuis-block');
    expect(result).toContain('data-total="0"');
    // No question divs
    expect(result).not.toContain('kuis-question');
  });

  // 4. questions with one item
  it('4. questions with one item — should render single question', () => {
    const block = baseBlock({ questions: [{ q: 'Solo?', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-total="1"');
    expect(result).toContain('Solo?');
  });

  // 5. question null/undefined in array
  it('5. questions with null/undefined in array — null entries are filtered, no crash', () => {
    const block = baseBlock({ questions: [null, undefined] as unknown as unknown[] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Null entries are filtered out, leaving 0 valid questions → empty state
    expect(result).toContain('data-total="0"');
    expect(result).toContain('Belum ada soal.');
  });

  // 6. options empty
  it('6. options empty (opts: []) — should render question with no option buttons', () => {
    const block = baseBlock({ questions: [{ q: 'No opts?', opts: [], ans: 0, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('No opts?');
    // No q-opt button elements (container div q-options still exists)
    expect(result).not.toContain('class="q-opt"');
  });

  // 7. options fewer than 4
  it('7. options fewer than 4 (opts: ["A"]) — should render single option', () => {
    const block = baseBlock({ questions: [{ q: 'Few opts?', opts: ['Only A'], ans: 0, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('Only A');
    // Only one letter button
    expect(result).toContain('q-letter">A</span>');
  });

  // 8. options more than 4
  it('8. options more than 4 (6 opts) — should render all 6', () => {
    const block = baseBlock({ questions: [{ q: 'Many opts?', opts: ['A', 'B', 'C', 'D', 'E', 'F'], ans: 4, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('q-letter">F</span>');
    // All 6 should appear
    for (const letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
      expect(result).toContain(`q-letter">${letter}</span>`);
    }
  });

  // 9. answer out of range
  it('9. answer out of range (ans: 99) — normalized to null, data-ans="-1", class non-scorable', () => {
    const block = baseBlock({ questions: [{ q: 'Range?', opts: ['A', 'B', 'C', 'D'], ans: 99, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-ans="-1"');
    expect(result).toContain('non-scorable');
  });

  it('9b. answer negative (ans: -1) — should not crash', () => {
    const block = baseBlock({ questions: [{ q: 'Neg?', opts: ['A', 'B', 'C', 'D'], ans: -1, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-ans="-1"');
    console.log('AUDIT: ans=-1 rendered as data-ans="-1" — negative, no validation');
  });

  // 10. answer as string (legacy A/B/C/D)
  it('10. answer as string "A" instead of number — resilience check', () => {
    const block = baseBlock({ questions: [{ q: 'Legacy ans?', opts: ['A', 'B', 'C', 'D'], ans: 'A' as unknown as number, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    if (error) {
      console.error('CRASH: ans as string "A" →', error.message);
    }
    // ans is used in: data-ans="${q.ans}" and checkAnswer(this,${qi},${oi},${q.ans})
    // If ans is "A", it produces: data-ans="A" and checkAnswer(this,0,0,A) — invalid JS!
    if (!error) {
      expect(typeof result).toBe('string');
      if (result!.includes('checkAnswer(this,0,0,A)')) {
        console.log('AUDIT: ans="A" produces invalid JS: checkAnswer(this,0,0,A) — A is undefined variable');
      }
    }
  });

  // 11. explanation empty
  it('11. explanation empty (ex: "") — should not render explanation div', () => {
    const block = baseBlock({ questions: [{ q: 'No ex?', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).not.toContain('q-explanation');
  });

  // 12. variant undefined
  it('12. variant undefined — should fallback to A', () => {
    const block = baseBlock();
    delete (block as Record<string, unknown>).variant;
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('quiz-variant-a');
    expect(result).toContain('data-variant="A"');
  });

  // 13. variant invalid
  it('13. variant invalid ("X") — should fallback to A', () => {
    const block = baseBlock({ variant: 'X' });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('quiz-variant-a');
    expect(result).toContain('data-variant="A"');
  });

  // 14. very long text
  it('14. very long text (500+ chars) — should render without crash', () => {
    const block = baseBlock({
      title: LONG_TEXT,
      questions: [{ q: LONG_TEXT, opts: [LONG_TEXT, LONG_TEXT, LONG_TEXT, LONG_TEXT], ans: 0, ex: LONG_TEXT }],
    });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Long text should be present (escaped)
    expect(result!.length).toBeGreaterThan(500);
  });

  // 15. special characters in text
  it('15. special characters (unicode, emoji, newlines) — should be escaped in HTML', () => {
    const block = baseBlock({
      title: SPECIAL_TEXT,
      questions: [{ q: SPECIAL_TEXT, opts: [SPECIAL_TEXT, 'B', 'C', 'D'], ans: 0, ex: SPECIAL_TEXT }],
    });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // HTML entities should be present
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    // Emoji should pass through
    expect(result).toContain('\u{1F600}');
  });

  // ── Kuis-specific extra tests ──

  it('K1. ans out of range with opts (ans: 5 with 3 opts) — normalized to null, non-scorable', () => {
    const block = baseBlock({ questions: [{ q: 'Mismatch?', opts: ['A', 'B', 'C'], ans: 5, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-ans="-1"');
    expect(result).toContain('non-scorable');
  });

  it('K2. question with q field missing — resilience check', () => {
    const block = baseBlock({ questions: [{ opts: ['A', 'B', 'C', 'D'], ans: 0, ex: '' } as unknown as { q: string; opts: string[]; ans: number; ex: string }] });
    const { result, error } = safeRender('kuis', block);
    if (error) {
      console.error('CRASH: q field missing →', error.message);
    }
    // q.q is undefined → escapeHtml(undefined) → likely crashes
    // because escapeHtml does str.replace(...) and undefined has no replace
  });

  it('K3. opts contains non-string values — resilience check', () => {
    const block = baseBlock({ questions: [{ q: 'Non-string opts?', opts: [42, null, undefined, true] as unknown as string[], ans: 0, ex: '' }] });
    const { result, error } = safeRender('kuis', block);
    if (error) {
      console.error('CRASH: non-string opts →', error.message);
    }
    // escapeHtml(42) → 42.replace is not a function → likely crashes
    // escapeHtml(null) → null.replace is not a function → likely crashes
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. TRUE-FALSE-GAME BLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('True-False-Game block resilience', () => {
  const baseBlock = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    id: 'tf-test-1',
    title: 'Benar atau Salah',
    questions: [
      { text: 'The sky is blue', correct: true, explanation: 'Yes it is' },
      { text: 'Fish can fly', correct: false, explanation: 'No they cannot' },
    ],
    ...overrides,
  });

  // 1. block.id missing
  it('1. block.id missing — should not crash, produces deterministic ordinal ID', () => {
    const block = baseBlock();
    delete (block as Record<string, unknown>).id;
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Deterministic ordinal fallback like tf-p0-b1
    expect(result).toContain('tf-p0-b1');
  });

  // 2. duplicate block.id
  it('2. duplicate block.id — second block gets disambiguated ID with -2 suffix', () => {
    const block1 = baseBlock({ id: 'tf-dup' });
    const block2 = baseBlock({ id: 'tf-dup' });
    const r1 = safeRender('true-false-game', block1);
    const r2 = safeRender('true-false-game', block2);
    expect(r1.error).toBeNull();
    expect(r2.error).toBeNull();
    const idExtract = (html: string) => {
      const m = html.match(/data-game="([^"]+)"/);
      return m ? m[1] : null;
    };
    const id1 = idExtract(r1.result!);
    const id2 = idExtract(r2.result!);
    // First gets tf-tf-dup, second gets tf-tf-dup-2
    expect(id1).toBe('tf-tf-dup');
    expect(id2).toBe('tf-tf-dup-2');
    expect(id1).not.toBe(id2);
  });

  // 3. questions empty array
  it('3. questions empty array — should render empty game shell', () => {
    const block = baseBlock({ questions: [] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('true-false-block');
    expect(result).toContain('data-total="0"');
  });

  // 4. questions with one item
  it('4. questions with one item — should render single question', () => {
    const block = baseBlock({ questions: [{ text: 'One question', correct: true }] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-total="1"');
    expect(result).toContain('One question');
  });

  // 5. question null/undefined in array
  it('5. questions with null/undefined in array — null entries are filtered, no crash', () => {
    const block = baseBlock({ questions: [null, undefined] as unknown as unknown[] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Null entries are filtered out, leaving 0 valid questions → empty state
    expect(result).toContain('data-total="0"');
    expect(result).toContain('Belum ada soal.');
  });

  // 6. options empty — N/A for true-false (no opts field), but test with missing structure
  it('6. N/A for true-false (no opts field) — verify rendering without optional fields', () => {
    const block = baseBlock({ questions: [{ text: 'Just text', correct: true }] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
  });

  // 7. options fewer than 4 — N/A, true-false always has 2 buttons
  it('7. N/A for true-false — always 2 buttons', () => {
    const block = baseBlock();
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(result).toContain('tf-true');
    expect(result).toContain('tf-false');
  });

  // 8. options more than 4 — N/A
  it('8. N/A for true-false — always 2 buttons', () => {
    // Already covered in test 7
  });

  // 9. answer out of range — N/A (boolean), but test with unexpected value
  it('9. correct as unexpected number (0/1) — coerced to boolean', () => {
    const block = baseBlock({ questions: [{ text: 'Numeric correct', correct: 1 as unknown as boolean }] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // asBoolean(1) → true, so data-correct should be "true"
    expect(result).toContain('data-correct="true"');
  });

  // 10. answer as string (legacy)
  it('10. correct as string "true" instead of boolean — resilience', () => {
    const block = baseBlock({ questions: [{ text: 'String correct', correct: 'true' as unknown as boolean }] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-correct="true"');
    console.log('AUDIT: correct="true" (string) rendered as data-correct="true" — string "true" is truthy but !== boolean true');
  });

  // 11. explanation empty
  it('11. explanation empty — should not render explanation div', () => {
    const block = baseBlock({ questions: [{ text: 'No ex', correct: true, explanation: '' }] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).not.toContain('tf-explanation');
  });

  // 12. variant undefined — N/A for true-false (no variant field)
  it('12. N/A for true-false (no variant field)', () => {
    const block = baseBlock();
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
  });

  // 13. variant invalid — N/A for true-false
  it('13. N/A for true-false (no variant field)', () => {
    // Covered by test 12
  });

  // 14. very long text
  it('14. very long text (500+ chars) — should render without crash', () => {
    const block = baseBlock({
      title: LONG_TEXT,
      questions: [{ text: LONG_TEXT, correct: true, explanation: LONG_TEXT }],
    });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result!.length).toBeGreaterThan(500);
  });

  // 15. special characters in text
  it('15. special characters (unicode, emoji, newlines) — should be escaped', () => {
    const block = baseBlock({
      title: SPECIAL_TEXT,
      questions: [{ text: SPECIAL_TEXT, correct: true, explanation: SPECIAL_TEXT }],
    });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
  });

  // ── True-False specific extra tests ──

  it('TF1. correct field missing — resilience check', () => {
    const block = baseBlock({ questions: [{ text: 'Missing correct' } as unknown as { text: string; correct: boolean; explanation?: string }] });
    const { result, error } = safeRender('true-false-game', block);
    if (error) {
      console.error('CRASH: correct field missing →', error.message);
    }
    if (!error) {
      expect(typeof result).toBe('string');
      // q.correct is undefined → data-correct="undefined"
      if (result!.includes('data-correct="undefined"')) {
        console.log('AUDIT: missing correct field renders data-correct="undefined" — broken data attribute');
      }
    }
  });

  it('TF2. correct as string "true" instead of boolean — produces string in data-correct', () => {
    const block = baseBlock({ questions: [{ text: 'String true', correct: 'true' as unknown as boolean, explanation: '' }] });
    const { result, error } = safeRender('true-false-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // String "true" in data-correct
    const match = result!.match(/data-correct="([^"]*)"/);
    expect(match).not.toBeNull();
    console.log('AUDIT: correct="true" (string) → data-correct="' + match![1] + '"');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. FILL-BLANK-GAME BLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Fill-Blank-Game block resilience', () => {
  const baseBlock = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    id: 'fb-test-1',
    title: 'Isian Singkat',
    questions: [
      { text: 'The capital of France is ___.', answer: 'Paris', hint: 'European city' },
      { text: '2 + 2 = ___.', answer: '4', hint: 'A number' },
    ],
    ...overrides,
  });

  // 1. block.id missing
  it('1. block.id missing — should not crash, produces deterministic ordinal ID', () => {
    const block = baseBlock();
    delete (block as Record<string, unknown>).id;
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Deterministic ordinal fallback like fb-p0-b1
    expect(result).toContain('fb-p0-b1');
  });

  // 2. duplicate block.id
  it('2. duplicate block.id — second block gets disambiguated ID with -2 suffix', () => {
    const block1 = baseBlock({ id: 'fb-dup' });
    const block2 = baseBlock({ id: 'fb-dup' });
    const r1 = safeRender('fill-blank-game', block1);
    const r2 = safeRender('fill-blank-game', block2);
    expect(r1.error).toBeNull();
    expect(r2.error).toBeNull();
    const idExtract = (html: string) => {
      const m = html.match(/data-game="([^"]+)"/);
      return m ? m[1] : null;
    };
    const id1 = idExtract(r1.result!);
    const id2 = idExtract(r2.result!);
    // First gets fb-fb-dup, second gets fb-fb-dup-2
    expect(id1).toBe('fb-fb-dup');
    expect(id2).toBe('fb-fb-dup-2');
    expect(id1).not.toBe(id2);
  });

  // 3. questions empty array
  it('3. questions empty array — should render empty game shell', () => {
    const block = baseBlock({ questions: [] });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('fill-blank-game-block');
    expect(result).toContain('data-total="0"');
  });

  // 4. questions with one item
  it('4. questions with one item — should render single question', () => {
    const block = baseBlock({ questions: [{ text: 'One ___ question', answer: 'fill', hint: 'hint' }] });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-total="1"');
    expect(result).toContain('fb-input');
  });

  // 5. question null/undefined in array
  it('5. questions with null/undefined in array — null entries are filtered, no crash', () => {
    const block = baseBlock({ questions: [null, undefined] as unknown as unknown[] });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Null entries are filtered out, leaving 0 valid questions → empty state
    expect(result).toContain('data-total="0"');
    expect(result).toContain('Belum ada soal.');
  });

  // 6. options empty — N/A for fill-blank
  it('6. N/A for fill-blank (no opts field)', () => {
    const block = baseBlock();
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
  });

  // 7-8. N/A for fill-blank
  it('7-8. N/A for fill-blank (no opts field)', () => {
    // Covered by test 6
  });

  // 9. answer out of range — N/A (string answer)
  it('9. N/A for fill-blank (string answer)', () => {
    // Fill-blank uses string answers, not numeric indices
  });

  // 10. answer as string — that's the normal case for fill-blank
  it('10. answer as string — normal for fill-blank', () => {
    const block = baseBlock({ questions: [{ text: 'Test ___', answer: 'ABC', hint: '' }] });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('data-answer="ABC"');
  });

  // 11. explanation empty — N/A (fill-blank uses hint, not explanation)
  it('11. hint empty — should use default placeholder', () => {
    const block = baseBlock({ questions: [{ text: 'Test ___', answer: 'X', hint: '' }] });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('placeholder="..."');
  });

  // 12. variant undefined — N/A for fill-blank
  it('12. N/A for fill-blank (no variant field)', () => {
    const block = baseBlock();
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
  });

  // 13. variant invalid — N/A for fill-blank
  it('13. N/A for fill-blank (no variant field)', () => {
    // Covered by test 12
  });

  // 14. very long text
  it('14. very long text (500+ chars) — should render without crash', () => {
    const block = baseBlock({
      title: LONG_TEXT,
      questions: [{ text: LONG_TEXT + '___', answer: LONG_TEXT, hint: LONG_TEXT }],
    });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result!.length).toBeGreaterThan(500);
  });

  // 15. special characters in text
  it('15. special characters (unicode, emoji, newlines) — should be escaped', () => {
    const block = baseBlock({
      title: SPECIAL_TEXT,
      questions: [{ text: SPECIAL_TEXT + '___', answer: SPECIAL_TEXT, hint: SPECIAL_TEXT }],
    });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
  });

  // ── Fill-Blank specific extra tests ──

  it('FB1. answer field missing — resilience check', () => {
    const block = baseBlock({ questions: [{ text: 'No answer ___', hint: 'hint' } as unknown as { text: string; answer: string; hint?: string }] });
    const { result, error } = safeRender('fill-blank-game', block);
    if (error) {
      console.error('CRASH: answer field missing →', error.message);
    }
    // q.answer is undefined → escapeHtml(undefined) → crash because .replace is not a function
  });

  it('FB2. text field missing (no ___ placeholder) — resilience check', () => {
    const block = baseBlock({ questions: [{ answer: 'Paris', hint: 'hint' } as unknown as { text: string; answer: string; hint?: string }] });
    const { result, error } = safeRender('fill-blank-game', block);
    if (error) {
      console.error('CRASH: text field missing →', error.message);
    }
    // q.text is undefined → q.text.split('___') → crash
  });

  it('FB3. multiple ___ in one question — should produce multiple input fields', () => {
    const block = baseBlock({ questions: [{ text: '___ is the capital of ___.', answer: 'Paris', hint: 'Fill both' }] });
    const { result, error } = safeRender('fill-blank-game', block);
    expect(error).toBeNull();
    expect(typeof result).toBe('string');
    // Count fb-input occurrences
    const inputCount = (result!.match(/class="fb-input"/g) || []).length;
    expect(inputCount).toBe(2);
    console.log('AUDIT: Multiple ___ produces ' + inputCount + ' inputs, but data-answer is the same for both — only one answer shared');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. CROSS-CUTTING / UNKNOWN TYPE
// ═══════════════════════════════════════════════════════════════════════
describe('Cross-cutting resilience', () => {
  it('unknown block type returns null', () => {
    const result = renderQuizBlock('unknown-type', { id: 'x' }, noopRender);
    expect(result).toBeNull();
  });

  it('empty object block — resilience check for each type', () => {
    for (const type of ['kuis', 'true-false-game', 'fill-blank-game']) {
      const { result, error } = safeRender(type, {});
      if (error) {
        console.error(`CRASH: empty object for type "${type}" →`, error.message);
      }
      // May or may not crash depending on whether questions defaults to []
    }
  });

  it('block with all fields as wrong types — resilience check', () => {
    const badBlock: Record<string, unknown> = {
      id: 12345, // number instead of string
      title: null, // null instead of string
      questions: 'not an array', // string instead of array
      variant: 42, // number instead of string
    };
    for (const type of ['kuis', 'true-false-game', 'fill-blank-game']) {
      const { result, error } = safeRender(type, badBlock);
      if (error) {
        console.error(`CRASH: wrong-type fields for "${type}" →`, error.message);
      }
    }
  });
});
