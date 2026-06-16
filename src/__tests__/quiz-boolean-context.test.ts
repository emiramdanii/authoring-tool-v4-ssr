// ═══════════════════════════════════════════════════════════════════════
// Sprint 6.4-E1-Patch-2 — Boolean Contract & Export Context Tests
//
// Two critical contracts verified here:
//
// 1. normalizeBoolean() — strict boolean normalization for TF questions.
//    Must not use Boolean() or !! — "false" must produce false, not true.
//    Invalid values must return null (non-scorable), not silently coerce.
//
// 2. ExportRenderContext — per-export state replaces module-level mutables.
//    One export = one context = no global reset needed.
//    Sequential/concurrent exports produce identical output for same input.
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderQuizBlock,
  resetBlockIdRegistry,
  createExportRenderContext,
  type ExportRenderContext,
} from '@/lib/export/quiz-renderers';

// ═══════════════════════════════════════════════════════════════════════
// HELPER: Extract data-correct and data-scorable from rendered TF HTML
// ═══════════════════════════════════════════════════════════════════════

function extractTfAttrs(html: string, questionIndex = 0): {
  correct: string;
  scorable: string;
  hasNonScorableClass: boolean;
} {
  // Match the tf-question div for the given index
  const qPattern = new RegExp(
    `class="tf-question[^"]*?data-correct="([^"]*)"[^>]*?data-scorable="([^"]*)"`,
  );
  const match = html.match(qPattern);
  if (!match) {
    // Try alternate attribute order
    const qPattern2 = new RegExp(
      `data-scorable="([^"]*)"[^>]*?data-correct="([^"]*)"`,
    );
    const match2 = html.match(qPattern2);
    if (!match2) {
      return { correct: 'NOT_FOUND', scorable: 'NOT_FOUND', hasNonScorableClass: false };
    }
    return {
      correct: match2[2],
      scorable: match2[1],
      hasNonScorableClass: html.includes('non-scorable'),
    };
  }
  return {
    correct: match[1],
    scorable: match[2],
    hasNonScorableClass: html.includes('non-scorable'),
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 1. BOOLEAN CONTRACT TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('normalizeBoolean contract (via TF renderer)', () => {
  beforeEach(() => resetBlockIdRegistry());

  const trueValues: [string, unknown][] = [
    ['true (boolean)', true],
    ['"true" (string)', 'true'],
    ['1 (number)', 1],
    ['"1" (string)', '1'],
  ];

  const falseValues: [string, unknown][] = [
    ['false (boolean)', false],
    ['"false" (string)', 'false'],
    ['0 (number)', 0],
    ['"0" (string)', '0'],
  ];

  const nullValues: [string, unknown][] = [
    ['"yes"', 'yes'],
    ['"no"', 'no'],
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['"TRUE" (uppercase)', 'TRUE'],   // should be null — only lowercase 'true' accepted
    ['"FALSE" (uppercase)', 'FALSE'],  // should be null — only lowercase 'false' accepted
    ['2 (number)', 2],
    ['-1 (number)', -1],
    ['{}  (object)', {}],
    ['[]  (array)', []],
    ['"on"', 'on'],
    ['"off"', 'off'],
    ['NaN', NaN],
  ];

  describe.each(trueValues)('true-like input: %s', (_label, value) => {
    it(`renders data-correct="true" and data-scorable="true"`, () => {
      const html = renderQuizBlock(
        'true-false-game',
        { questions: [{ text: 'Q1', correct: value }] },
        () => '',
      )!;
      const attrs = extractTfAttrs(html);
      expect(attrs.correct).toBe('true');
      expect(attrs.scorable).toBe('true');
      expect(attrs.hasNonScorableClass).toBe(false);
    });
  });

  describe.each(falseValues)('false-like input: %s', (_label, value) => {
    it(`renders data-correct="false" and data-scorable="true"`, () => {
      const html = renderQuizBlock(
        'true-false-game',
        { questions: [{ text: 'Q1', correct: value }] },
        () => '',
      )!;
      const attrs = extractTfAttrs(html);
      expect(attrs.correct).toBe('false');
      expect(attrs.scorable).toBe('true');
      expect(attrs.hasNonScorableClass).toBe(false);
    });
  });

  describe.each(nullValues)('null-producing input: %s', (_label, value) => {
    it(`renders data-correct="" and data-scorable="false" (non-scorable)`, () => {
      const html = renderQuizBlock(
        'true-false-game',
        { questions: [{ text: 'Q1', correct: value }] },
        () => '',
      )!;
      const attrs = extractTfAttrs(html);
      // When correct is null, the correct attribute should be empty
      expect(attrs.correct).toBe('');
      // Non-scorable
      expect(attrs.scorable).toBe('false');
      expect(attrs.hasNonScorableClass).toBe(true);
    });
  });

  it('"false" string does NOT become true (the Boolean() trap)', () => {
    // This is the critical safety test:
    // Boolean("false") === true (WRONG!)
    // normalizeBoolean("false") === false (CORRECT)
    const html = renderQuizBlock(
      'true-false-game',
      { questions: [{ text: 'Q1', correct: 'false' }] },
      () => '',
    )!;
    const attrs = extractTfAttrs(html);
    expect(attrs.correct).toBe('false'); // NOT 'true'
    expect(attrs.scorable).toBe('true');
  });

  it('"0" string does NOT become true (the Boolean() trap)', () => {
    // Boolean("0") === true (WRONG!)
    // normalizeBoolean("0") === false (CORRECT)
    const html = renderQuizBlock(
      'true-false-game',
      { questions: [{ text: 'Q1', correct: '0' }] },
      () => '',
    )!;
    const attrs = extractTfAttrs(html);
    expect(attrs.correct).toBe('false'); // NOT 'true'
    expect(attrs.scorable).toBe('true');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. EXPORT CONTEXT TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('ExportRenderContext', () => {
  it('createExportRenderContext() produces fresh, empty context', () => {
    const ctx = createExportRenderContext();
    expect(ctx.usedBlockIds).toBeInstanceOf(Set);
    expect(ctx.usedBlockIds.size).toBe(0);
    expect(ctx.blockOrdinal).toBe(0);
  });

  it('two contexts are independent — no shared state', () => {
    const ctx1 = createExportRenderContext();
    const ctx2 = createExportRenderContext();

    ctx1.usedBlockIds.add('kuis-test');
    ctx1.blockOrdinal = 5;

    expect(ctx2.usedBlockIds.has('kuis-test')).toBe(false);
    expect(ctx2.blockOrdinal).toBe(0);
  });

  it('export project A twice → same HTML IDs', () => {
    const block = {
      type: 'kuis',
      id: 'quiz-alpha',
      title: 'Kuis Alpha',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };

    const ctx1 = createExportRenderContext();
    const html1 = renderQuizBlock('kuis', block, () => '', ctx1)!;

    const ctx2 = createExportRenderContext();
    const html2 = renderQuizBlock('kuis', block, () => '', ctx2)!;

    // Extract block IDs from both renders
    const id1 = html1.match(/data-block-id="([^"]+)"/)?.[1];
    const id2 = html2.match(/data-block-id="([^"]+)"/)?.[1];

    expect(id1).toBe(id2);
    expect(id1).toBe('kuis-quiz-alpha');
  });

  it('export project A then B then A → A still gets same IDs', () => {
    const blockA = {
      type: 'kuis',
      id: 'quiz-alpha',
      title: 'Kuis Alpha',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const blockB = {
      type: 'kuis',
      id: 'quiz-beta',
      title: 'Kuis Beta',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 1 }],
    };

    // First export of A
    const ctx1 = createExportRenderContext();
    const htmlA1 = renderQuizBlock('kuis', blockA, () => '', ctx1)!;

    // Export B
    const ctx2 = createExportRenderContext();
    renderQuizBlock('kuis', blockB, () => '', ctx2);

    // Second export of A
    const ctx3 = createExportRenderContext();
    const htmlA2 = renderQuizBlock('kuis', blockA, () => '', ctx3)!;

    const idA1 = htmlA1.match(/data-block-id="([^"]+)"/)?.[1];
    const idA2 = htmlA2.match(/data-block-id="([^"]+)"/)?.[1];

    expect(idA1).toBe(idA2);
  });

  it('duplicate block IDs get deterministic suffix', () => {
    const block1 = {
      type: 'kuis',
      id: 'same-id',
      title: 'Kuis 1',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const block2 = {
      type: 'kuis',
      id: 'same-id',
      title: 'Kuis 2',
      questions: [{ q: 'Q2', opts: ['A', 'B'], ans: 1 }],
    };

    const ctx = createExportRenderContext();
    const html1 = renderQuizBlock('kuis', block1, () => '', ctx)!;
    const html2 = renderQuizBlock('kuis', block2, () => '', ctx)!;

    const id1 = html1.match(/data-block-id="([^"]+)"/)?.[1];
    const id2 = html2.match(/data-block-id="([^"]+)"/)?.[1];

    // First gets the base ID, second gets disambiguated with -2
    expect(id1).toBe('kuis-same-id');
    expect(id2).toBe('kuis-same-id-2');
  });

  it('missing block ID gets stable ordinal within context', () => {
    const block1 = {
      type: 'kuis',
      // No id
      title: 'Kuis 1',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const block2 = {
      type: 'kuis',
      // No id
      title: 'Kuis 2',
      questions: [{ q: 'Q2', opts: ['A', 'B'], ans: 1 }],
    };

    const ctx = createExportRenderContext();
    const html1 = renderQuizBlock('kuis', block1, () => '', ctx)!;
    const html2 = renderQuizBlock('kuis', block2, () => '', ctx)!;

    const id1 = html1.match(/data-block-id="([^"]+)"/)?.[1];
    const id2 = html2.match(/data-block-id="([^"]+)"/)?.[1];

    // Ordinal-based IDs are deterministic
    expect(id1).toBe('kuis-p0-b1');
    expect(id2).toBe('kuis-p0-b2');
  });

  it('failed render does not pollute next export', () => {
    // Simulate a partial render that adds IDs to context
    const ctx = createExportRenderContext();
    ctx.usedBlockIds.add('kuis-polluted');
    ctx.blockOrdinal = 99;

    // A new context should be clean
    const freshCtx = createExportRenderContext();
    expect(freshCtx.usedBlockIds.has('kuis-polluted')).toBe(false);
    expect(freshCtx.blockOrdinal).toBe(0);

    // The fresh context produces correct IDs
    const block = {
      type: 'kuis',
      id: 'clean-quiz',
      title: 'Clean',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const html = renderQuizBlock('kuis', block, () => '', freshCtx)!;
    const id = html.match(/data-block-id="([^"]+)"/)?.[1];
    expect(id).toBe('kuis-clean-quiz');
  });

  it('no global reset needed between exports', () => {
    const block = {
      type: 'kuis',
      id: 'test-quiz',
      title: 'Test',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };

    // Export multiple times with separate contexts — no resetBlockIdRegistry call
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const ctx = createExportRenderContext();
      const html = renderQuizBlock('kuis', block, () => '', ctx)!;
      const id = html.match(/data-block-id="([^"]+)"/)?.[1];
      results.push(id!);
    }

    // All exports produce the same ID
    expect(results.every(id => id === 'kuis-test-quiz')).toBe(true);
  });

  it('legacy resetBlockIdRegistry still works for backward compat', () => {
    // Tests that call renderQuizBlock without context should still work
    resetBlockIdRegistry();
    const block = {
      type: 'kuis',
      id: 'legacy-quiz',
      title: 'Legacy',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const html = renderQuizBlock('kuis', block, () => '')!;
    const id = html.match(/data-block-id="([^"]+)"/)?.[1];
    expect(id).toBe('kuis-legacy-quiz');
  });

  it('different block types (kuis, tf, fb) share same context', () => {
    const kuisBlock = {
      type: 'kuis',
      id: 'same-id',
      title: 'Kuis',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const tfBlock = {
      type: 'true-false-game',
      id: 'same-id',
      title: 'TF',
      questions: [{ text: 'Q1', correct: true }],
    };
    const fbBlock = {
      type: 'fill-blank-game',
      id: 'same-id',
      title: 'FB',
      questions: [{ text: 'Q1 ___', answer: 'test' }],
    };

    const ctx = createExportRenderContext();
    const htmlKuis = renderQuizBlock('kuis', kuisBlock, () => '', ctx)!;
    const htmlTF = renderQuizBlock('true-false-game', tfBlock, () => '', ctx)!;
    const htmlFB = renderQuizBlock('fill-blank-game', fbBlock, () => '', ctx)!;

    // All three get different prefixes but share the same ID registry
    const idKuis = htmlKuis.match(/data-block-id="([^"]+)"/)?.[1];
    const idTF = htmlTF.match(/data-game="([^"]+)"/)?.[1];
    const idFB = htmlFB.match(/data-game="([^"]+)"/)?.[1];

    // kuis gets the base ID, tf and fb get disambiguated
    // (all have same block.id "same-id" but different prefixes)
    expect(idKuis).toBe('kuis-same-id');
    // tf uses "tf-" prefix, so it doesn't collide with kuis
    expect(idTF).toBe('tf-same-id');
    // fb uses "fb-" prefix, so it doesn't collide either
    expect(idFB).toBe('fb-same-id');
  });

  it('same prefix + same ID gets disambiguated across blocks', () => {
    const block1 = {
      type: 'kuis',
      id: 'dup',
      title: 'Kuis 1',
      questions: [{ q: 'Q1', opts: ['A', 'B'], ans: 0 }],
    };
    const block2 = {
      type: 'kuis',
      id: 'dup',
      title: 'Kuis 2',
      questions: [{ q: 'Q2', opts: ['A', 'B'], ans: 1 }],
    };

    const ctx = createExportRenderContext();
    const html1 = renderQuizBlock('kuis', block1, () => '', ctx)!;
    const html2 = renderQuizBlock('kuis', block2, () => '', ctx)!;

    const id1 = html1.match(/data-block-id="([^"]+)"/)?.[1];
    const id2 = html2.match(/data-block-id="([^"]+)"/)?.[1];

    expect(id1).toBe('kuis-dup');
    expect(id2).toBe('kuis-dup-2');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. NON-SCORABLE TF QUESTION RENDER TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('Non-scorable TF question rendering', () => {
  beforeEach(() => resetBlockIdRegistry());

  it('invalid correct value renders non-scorable class', () => {
    const html = renderQuizBlock(
      'true-false-game',
      { questions: [{ text: 'Q1', correct: 'maybe' }] },
      () => '',
    )!;
    expect(html).toContain('non-scorable');
    expect(html).toContain('data-scorable="false"');
    expect(html).toContain('data-correct=""');
  });

  it('null correct value renders non-scorable', () => {
    const html = renderQuizBlock(
      'true-false-game',
      { questions: [{ text: 'Q1', correct: null }] },
      () => '',
    )!;
    expect(html).toContain('non-scorable');
    expect(html).toContain('data-scorable="false"');
  });

  it('undefined correct value renders non-scorable', () => {
    const html = renderQuizBlock(
      'true-false-game',
      { questions: [{ text: 'Q1' }] },  // no correct field at all
      () => '',
    )!;
    expect(html).toContain('non-scorable');
    expect(html).toContain('data-scorable="false"');
  });

  it('valid boolean correct value does NOT render non-scorable', () => {
    const html = renderQuizBlock(
      'true-false-game',
      { questions: [{ text: 'Q1', correct: true }] },
      () => '',
    )!;
    expect(html).not.toContain('non-scorable');
    expect(html).toContain('data-scorable="true"');
    expect(html).toContain('data-correct="true"');
  });

  it('mixed scorable and non-scorable questions in same block', () => {
    const html = renderQuizBlock(
      'true-false-game',
      {
        questions: [
          { text: 'Valid Q', correct: true },
          { text: 'Invalid Q', correct: 'maybe' },
          { text: 'Another valid', correct: false },
        ],
      },
      () => '',
    )!;
    // Should have both scorable and non-scorable questions
    expect(html).toContain('data-scorable="true"');
    expect(html).toContain('data-scorable="false"');
  });
});
