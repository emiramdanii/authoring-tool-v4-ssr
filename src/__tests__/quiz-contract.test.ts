// ═══════════════════════════════════════════════════════════════════════
// QUIZ CONTRACT TESTS — Sprint 6.4-D0
// Verifies data contract, DOM contract, selector contract,
// accessibility contract, and CSS contract for the Kuis block
// across all variants (A/Klasik, B/Kartu, C/Ringkas)
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { renderQuizBlock } from '@/lib/export/quiz-renderers';
import { getCss } from '@/lib/export/styles';
import { getJs } from '@/lib/export/scripts';
import type { KuisBlock } from '@/core/schema/types/blocks';

const noopRender = (() => '') as unknown as import('@/lib/export/utils').RenderBlockFn;

// ── Test data ──────────────────────────────────────────────────────────
function makeKuisBlock(overrides: Partial<KuisBlock> = {}): Record<string, unknown> {
  return {
    type: 'kuis',
    title: 'Kuis Kontrak',
    variant: 'A',
    questions: [
      { q: 'Pertanyaan 1?', opts: ['A', 'B', 'C'], ans: 0, ex: 'Penjelasan 1' },
      { q: 'Pertanyaan 2?', opts: ['D', 'E', 'F'], ans: 1, ex: 'Penjelasan 2' },
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// A. DATA CONTRACT
// ═══════════════════════════════════════════════════════════════════════

describe('A. Data Contract', () => {
  it('A1: renders with all required fields (id, type, title, questions)', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    expect(html).toContain('kuis-block');
    expect(html).toContain('Kuis Kontrak');
    expect(html).toContain('Pertanyaan 1?');
    expect(html).toContain('Pertanyaan 2?');
  });

  it('A2: questions[].q renders correctly', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    expect(html).toContain('1.');
    expect(html).toContain('2.');
    expect(html).toContain('Pertanyaan 1?');
    expect(html).toContain('Pertanyaan 2?');
  });

  it('A3: questions[].opts renders as button options', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    expect(html).toContain('class="q-opt"');
    // Should have 6 options (3 per question × 2 questions)
    const optMatches = html.match(/class="q-opt"/g);
    expect(optMatches).toHaveLength(6);
  });

  it('A4: questions[].ans uses 0-based index', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    // First question: ans=0, second: ans=1
    expect(html).toMatch(/checkAnswer\(this,0,0,0\)/);
    expect(html).toMatch(/checkAnswer\(this,1,1,1\)/);
  });

  it('A5: questions[].ex renders as explanation div', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    expect(html).toContain('class="q-explanation"');
    expect(html).toContain('Penjelasan 1');
    expect(html).toContain('Penjelasan 2');
  });

  it('A6: variant field A produces quiz-variant-a root class', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: 'A' }), noopRender);
    expect(html).toContain('quiz-variant-a');
  });

  it('A7: variant field B produces quiz-variant-b root class', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: 'B' }), noopRender);
    expect(html).toContain('quiz-variant-b');
  });

  it('A8: variant field C produces quiz-variant-c root class', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: 'C' }), noopRender);
    expect(html).toContain('quiz-variant-c');
  });

  it('A9: empty/undefined variant falls back to A', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: undefined }), noopRender);
    expect(html).toContain('quiz-variant-a');
    expect(html).not.toContain('quiz-variant-b');
    expect(html).not.toContain('quiz-variant-c');
  });

  it('A10: invalid variant falls back to A', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: 'X' as any }), noopRender);
    expect(html).toContain('quiz-variant-a');
  });

  it('A11: variant data attribute matches variant class', () => {
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: 'B' }), noopRender);
    expect(html).toMatch(/data-variant="B"/);
    expect(html).toContain('quiz-variant-b');
  });

  it('A12: title defaults to "Kuis" when missing', () => {
    const html = renderQuizBlock('kuis', { ...makeKuisBlock(), title: '' }, noopRender);
    expect(html).toContain('Kuis');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// B. DOM CONTRACT — Required classes and attributes
// ═══════════════════════════════════════════════════════════════════════

describe('B. DOM Contract', () => {
  const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);

  it('B1: .kuis-block root class present', () => {
    expect(html).toContain('kuis-block');
  });

  it('B2: .kuis-step class present on each question', () => {
    expect(html).toContain('kuis-step');
    const stepMatches = html.match(/kuis-step/g);
    expect(stepMatches).toHaveLength(2);
  });

  it('B3: .q-opt class present on option buttons', () => {
    expect(html).toContain('q-opt');
  });

  it('B4: .q-feedback class present', () => {
    expect(html).toContain('q-feedback');
  });

  it('B5: .q-explanation class present', () => {
    expect(html).toContain('q-explanation');
  });

  it('B6: .q-next-btn class present', () => {
    expect(html).toContain('q-next-btn');
  });

  it('B7: .quiz-progress-bar class present', () => {
    expect(html).toContain('quiz-progress-bar');
  });

  it('B8: .quiz-completion class present', () => {
    expect(html).toContain('quiz-completion');
  });

  it('B9: data-block-id attribute present', () => {
    expect(html).toMatch(/data-block-id="kuis-[a-z0-9]+"/);
  });

  it('B10: data-idx attribute present on steps', () => {
    expect(html).toContain('data-idx="0"');
    expect(html).toContain('data-idx="1"');
  });

  it('B11: data-answered attribute present on steps', () => {
    expect(html).toContain('data-answered="false"');
  });

  it('B12: data-qi and data-oi attributes on options', () => {
    expect(html).toContain('data-qi="0"');
    expect(html).toContain('data-oi="0"');
  });

  it('B13: data-variant attribute on root', () => {
    expect(html).toMatch(/data-variant="A"/);
  });

  it('B14: variant class is on same element as kuis-block', () => {
    expect(html).toMatch(/class="block kuis-block quiz-variant-a"/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// C. SELECTOR CONTRACT
// ═══════════════════════════════════════════════════════════════════════

describe('C. Selector Contract', () => {
  const js = getJs();

  it('C1: all JS kuis selectors are scoped to blockId', () => {
    // checkAnswer uses btn.closest('.kuis-block') — verified by reading source
    // showKuisStep uses .kuis-block[data-block-id="..."]
    expect(js).toContain('.kuis-block[data-block-id="');
    expect(js).toContain('btn.closest(\'.kuis-block\')');
  });

  it('C2: no global querySelector that grabs first kuis', () => {
    // Should NOT have querySelector('.kuis-block') without data attribute
    const unscopedMatch = js.match(/querySelector\(['"]\.kuis-block['"]\)/g);
    // The only unscoped one is in init: querySelectorAll('.kuis-block') which is correct
    // querySelector (singular) with '.kuis-block' without data-block-id would be bad
    const badMatch = js.match(/querySelector\(['"]\.kuis-block['"]\)(?!\[)/g);
    expect(badMatch).toBeNull();
  });

  it('C3: variant class not used by state machine JS', () => {
    expect(js).not.toContain('quiz-variant-a');
    expect(js).not.toContain('quiz-variant-b');
    expect(js).not.toContain('quiz-variant-c');
  });

  it('C4: no duplicate checkAnswer function', () => {
    const matches = js.match(/function checkAnswer/g);
    expect(matches).toHaveLength(1);
  });

  it('C5: unique block IDs via Math.random', () => {
    const html1 = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    const html2 = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    const id1 = html1.match(/data-block-id="(kuis-[a-z0-9]+)"/)?.[1];
    const id2 = html2.match(/data-block-id="(kuis-[a-z0-9]+)"/)?.[1];
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    // IDs should differ (extremely unlikely to collide)
    expect(id1).not.toBe(id2);
  });

  it('C6: multi-block IDs do not collide (TF/FB use different prefixes)', () => {
    const kuisHtml = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
    const tfHtml = renderQuizBlock('true-false-game', {
      type: 'true-false-game',
      title: 'TF',
      questions: [{ text: 'T1', correct: true }],
    }, noopRender);
    const fbHtml = renderQuizBlock('fill-blank-game', {
      type: 'fill-blank-game',
      title: 'FB',
      questions: [{ text: '___', answer: 'X' }],
    }, noopRender);

    const kuisId = kuisHtml.match(/data-block-id="(kuis-[a-z0-9]+)"/)?.[1];
    const tfId = tfHtml.match(/data-game="(tf-[a-z0-9]+)"/)?.[1];
    const fbId = fbHtml.match(/data-game="(fb-[a-z0-9]+)"/)?.[1];
    expect(kuisId).toMatch(/^kuis-/);
    expect(tfId).toMatch(/^tf-/);
    expect(fbId).toMatch(/^fb-/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// D. STATE/LIFECYCLE CONTRACT
// ═══════════════════════════════════════════════════════════════════════

describe('D. State/Lifecycle Contract', () => {
  const js = getJs();

  it('D1: answer flow — checkAnswer exists', () => {
    expect(js).toContain('function checkAnswer');
  });

  it('D2: anti-double-score guard — data-answered check', () => {
    expect(js).toContain('question.dataset.answered === \'true\'');
  });

  it('D3: next step navigation — nextKuisStep exists', () => {
    expect(js).toContain('function nextKuisStep');
  });

  it('D4: completion screen — showKuisCompletion exists', () => {
    expect(js).toContain('function showKuisCompletion');
  });

  it('D5: replay function — replayKuis exists', () => {
    expect(js).toContain('function replayKuis');
  });

  it('D6: page revisit reset — resetPageQuizState exists', () => {
    expect(js).toContain('function resetPageQuizState');
  });

  it('D7: two-block isolation — quizState keyed by blockId', () => {
    expect(js).toContain('quizState[blockId]');
    expect(js).toContain('quizState = {}');
  });

  it('D8: fallback variant — normalizeKuisVariant in renderer', () => {
    // This is verified in A9/A10 above
    const html = renderQuizBlock('kuis', makeKuisBlock({ variant: undefined }), noopRender);
    expect(html).toContain('quiz-variant-a');
  });

  it('D9: completion uses totalSteps (not st.total) for percentage', () => {
    // st.totalSteps is set at init; st.total counts answered questions
    expect(js).toContain('st.totalSteps');
    expect(js).toMatch(/st\.totalSteps > 0.*Math\.round/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// E. ACCESSIBILITY CONTRACT
// ═══════════════════════════════════════════════════════════════════════

describe('E. Accessibility Contract', () => {
  const html = renderQuizBlock('kuis', makeKuisBlock(), noopRender);
  const css = getCss(1280, 720);

  it('E1: native button elements for options', () => {
    expect(html).toContain('<button class="q-opt"');
  });

  it('E2: tabindex="-1" on steps', () => {
    expect(html).toContain('tabindex="-1"');
  });

  it('E3: role="status" on feedback', () => {
    expect(html).toContain('role="status"');
  });

  it('E4: role="progressbar" on progress bar', () => {
    expect(html).toContain('role="progressbar"');
  });

  it('E5: aria-valuemin/valuemax/valuenow on progressbar', () => {
    expect(html).toContain('aria-valuemin="1"');
    expect(html).toContain('aria-valuemax="2"');
    expect(html).toContain('aria-valuenow="1"');
  });

  it('E6: aria-valuetext on progressbar', () => {
    expect(html).toContain('aria-valuetext=');
  });

  it('E7: role="region" on completion', () => {
    expect(html).toContain('role="region"');
  });

  it('E8: aria-live="polite" on completion', () => {
    expect(html).toContain('aria-live="polite"');
  });

  it('E9: focus indicator exists in CSS', () => {
    // :focus-visible on buttons
    expect(css).toContain(':focus-visible');
  });

  it('E10: tabindex="-1" on completion screen', () => {
    // The completion div has tabindex="-1"
    const completionMatch = html.match(/quiz-completion[^>]*tabindex="-1"/);
    expect(completionMatch).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// F. CSS CONTRACT
// ═══════════════════════════════════════════════════════════════════════

describe('F. CSS Contract', () => {
  const css = getCss(1280, 720);

  it('F1: all variant A CSS scoped to .kuis-block root', () => {
    const unscopedA = css.match(/\.quiz-variant-a\s+(?!\.kuis-block)/g);
    // All should be .kuis-block.quiz-variant-a, not just .quiz-variant-a
    const unscoped = css.match(/(?<!\.kuis-block)\.quiz-variant-a\s/g);
    // Allow the comment line
    const variantARules = css.match(/\.kuis-block\.quiz-variant-a/g);
    expect(variantARules).toBeTruthy();
    expect(variantARules!.length).toBeGreaterThanOrEqual(3);
  });

  it('F2: all variant B CSS scoped to .kuis-block root', () => {
    const variantBRules = css.match(/\.kuis-block\.quiz-variant-b/g);
    expect(variantBRules).toBeTruthy();
    expect(variantBRules!.length).toBeGreaterThanOrEqual(5);
  });

  it('F3: all variant C CSS scoped to .kuis-block root', () => {
    const variantCRules = css.match(/\.kuis-block\.quiz-variant-c/g);
    expect(variantCRules).toBeTruthy();
    expect(variantCRules!.length).toBeGreaterThanOrEqual(5);
  });

  it('F4: no unscoped variant selectors (without .kuis-block prefix)', () => {
    // Check that .quiz-variant-a/b/c selectors always appear after .kuis-block
    const lines = css.split('\n').filter(l => l.includes('.quiz-variant-'));
    for (const line of lines) {
      if (line.trim().startsWith('/*')) continue; // Skip comments
      if (line.includes('.kuis-block.quiz-variant-')) continue;
      // Allow in comment lines
      if (line.trim().startsWith('*') || line.trim().startsWith('//')) continue;
      // This would be an unscoped selector
      expect.fail(`Unscoped variant selector found: ${line.trim()}`);
    }
  });

  it('F5: light/dark variant override is also scoped', () => {
    // Check light mode variant B override
    const lightVariantB = css.match(/\.kuis-block\.quiz-variant-b.*\.kuis-step\.step-active/g);
    expect(lightVariantB).toBeTruthy();
  });

  it('F6: variant CSS does not target TF/FB elements', () => {
    const variantCss = css.split('\n').filter(l => l.includes('.quiz-variant-'));
    for (const line of variantCss) {
      expect(line).not.toContain('.tf-');
      expect(line).not.toContain('.fb-');
      expect(line).not.toContain('.true-false');
      expect(line).not.toContain('.fill-blank');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// G. CROSS-CONTRACT: Variant independence from state machine
// ═══════════════════════════════════════════════════════════════════════

describe('G. Variant Independence', () => {
  const js = getJs();

  it('G1: state machine does not reference variant class in any selector', () => {
    expect(js).not.toContain('quiz-variant-a');
    expect(js).not.toContain('quiz-variant-b');
    expect(js).not.toContain('quiz-variant-c');
  });

  it('G2: checkAnswer works regardless of variant — uses .kuis-question closest', () => {
    expect(js).toContain('btn.closest(\'.kuis-question\')');
    expect(js).toContain('btn.closest(\'.kuis-block\')');
  });

  it('G3: same DOM structure produced for all variants', () => {
    const htmlA = renderQuizBlock('kuis', makeKuisBlock({ variant: 'A' }), noopRender);
    const htmlB = renderQuizBlock('kuis', makeKuisBlock({ variant: 'B' }), noopRender);
    const htmlC = renderQuizBlock('kuis', makeKuisBlock({ variant: 'C' }), noopRender);

    // Strip variant-specific class, data-variant, and random IDs
    const normalize = (h: string) =>
      h.replace(/quiz-variant-[abc]/g, '')
       .replace(/data-variant="[ABC]"/g, '')
       .replace(/kuis-[a-z0-9]{6}/g, 'kuis-XXXXXX');

    expect(normalize(htmlA)).toBe(normalize(htmlB));
    expect(normalize(htmlA)).toBe(normalize(htmlC));
  });
});
