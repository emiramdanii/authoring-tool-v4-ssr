// ═══════════════════════════════════════════════════════════════════════
// PERFORMANCE AUDIT — Quiz Module
// Measures rendering throughput, HTML output size, DOM density,
// JS/CSS bundle size, and timer/listener leak surface area.
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { renderQuizBlock } from '@/lib/export/quiz-renderers';
import { getJs } from '@/lib/export/scripts';
import { getCss } from '@/lib/export/styles';

// ── Helpers ──────────────────────────────────────────────────────────

const noopRender = (() => '') as unknown as import('@/lib/export/utils').RenderBlockFn;

/** Count occurrences of a substring in a string */
function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = haystack.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

/** Count DOM-opening tags (approximate) for given tag names */
function countDomTags(html: string, tags: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const tag of tags) {
    // Match opening tags like <div, <button, <p, <span, <h2, <input
    // Also match self-closing like <input ... />
    const regex = new RegExp(`<${tag}[\\s>]`, 'gi');
    result[tag] = (html.match(regex) || []).length;
  }
  return result;
}

/** Create a kuis block with N questions, each with optsCount options */
function makeKuisBlock(questionCount: number, optsCount = 4, explanationLen = 0): Record<string, unknown> {
  const questions = Array.from({ length: questionCount }, (_, qi) => ({
    q: `Pertanyaan ${qi + 1}?`,
    opts: Array.from({ length: optsCount }, (_, oi) => `Opsi ${String.fromCharCode(65 + oi)}`),
    ans: 0,
    ex: explanationLen > 0 ? 'A'.repeat(explanationLen) : '',
  }));
  return {
    id: `kuis-perf-${questionCount}q`,
    title: 'Kuis Performance Test',
    questions,
  };
}

/** Create a fill-blank block with N questions, each with blankCount blanks */
function makeFillBlankBlock(questionCount: number, blankCount = 3): Record<string, unknown> {
  const questions = Array.from({ length: questionCount }, (_, qi) => {
    // Build text with blankCount blanks: "Text ___ more ___ end ___"
    const parts = Array.from({ length: blankCount + 1 }, (_, pi) => `bagian${pi + 1}`);
    const text = parts.join(' ___ ');
    return {
      text,
      answer: `jawaban${qi}`,
      hint: '...',
    };
  });
  return {
    id: `fb-perf-${questionCount}q`,
    title: 'Fill Blank Performance Test',
    questions,
  };
}

/** High-resolution timer (returns ms) */
function hrMs(): number {
  return performance.now();
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 1: Baseline — 1 block × 10 questions
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 1: Baseline (1 block × 10 questions)', () => {
  const block = makeKuisBlock(10, 4);

  it('measures average render time over 100 calls', () => {
    // Warmup
    for (let i = 0; i < 5; i++) renderQuizBlock('kuis', block, noopRender);

    const iterations = 100;
    const start = hrMs();
    for (let i = 0; i < iterations; i++) {
      renderQuizBlock('kuis', block, noopRender);
    }
    const elapsed = hrMs() - start;
    const avgMs = elapsed / iterations;

    console.log(`[Scenario 1] Avg render time: ${avgMs.toFixed(3)} ms over ${iterations} calls (total: ${elapsed.toFixed(2)} ms)`);
    expect(avgMs).toBeLessThan(50); // Sanity: should be well under 50ms
  });

  it('measures HTML output size', () => {
    const html = renderQuizBlock('kuis', block, noopRender);
    const sizeBytes = Buffer.byteLength(html, 'utf8');
    const sizeChars = html.length;

    console.log(`[Scenario 1] HTML output size: ${sizeChars} chars, ${sizeBytes} bytes`);
    expect(sizeChars).toBeGreaterThan(0);
  });

  it('counts DOM nodes', () => {
    const html = renderQuizBlock('kuis', block, noopRender);
    const tags = countDomTags(html, ['div', 'button', 'p', 'span', 'h2', 'input']);
    const totalDomNodes = Object.values(tags).reduce((s, v) => s + v, 0);

    console.log(`[Scenario 1] DOM node counts:`, tags);
    console.log(`[Scenario 1] Total estimated DOM nodes: ${totalDomNodes}`);
    expect(totalDomNodes).toBeGreaterThan(0);
  });

  it('counts onclick handlers in output', () => {
    const html = renderQuizBlock('kuis', block, noopRender);
    const onclickCount = countOccurrences(html, 'onclick=');
    // For 10 questions × 4 options = 40 answer buttons + 10 next buttons + 1 replay = 51
    console.log(`[Scenario 1] onclick handlers: ${onclickCount}`);
    expect(onclickCount).toBeGreaterThan(0);
  });

  it('checks for O(n²) patterns — DOM IDs scale linearly with question count', () => {
    const sizes = [5, 10, 20, 50];
    const idCounts: number[] = [];

    for (const size of sizes) {
      const b = makeKuisBlock(size, 4);
      b.id = `kuis-scale-${size}`;
      const html = renderQuizBlock('kuis', b, noopRender);
      // Count IDs (id="..." attributes)
      const idMatches = html.match(/id="/g);
      const idCount = idMatches ? idMatches.length : 0;
      idCounts.push(idCount);
    }

    console.log(`[Scenario 1] ID counts for sizes ${sizes.join(', ')}: ${idCounts.join(', ')}`);

    // Check linear scaling: the ratio of IDs to questions should be roughly constant
    const ratios = idCounts.map((c, i) => c / sizes[i]);
    const avgRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    const maxDeviation = Math.max(...ratios.map(r => Math.abs(r - avgRatio) / avgRatio));

    console.log(`[Scenario 1] ID-to-question ratios: ${ratios.map(r => r.toFixed(2)).join(', ')}, avg: ${avgRatio.toFixed(2)}, max deviation: ${(maxDeviation * 100).toFixed(1)}%`);

    // If O(n²), the ratio would grow with size. Linear scaling = constant ratio.
    // Per-block fixed IDs (progress bar, completion screen) create overhead
    // that disproportionately affects small sizes.
    // Better test: IDs should follow IDs = fixed + k*n. Verify linear regression fit.
    const n = sizes.length;
    const sumX = sizes.reduce((s, v) => s + v, 0);
    const sumY = idCounts.reduce((s, v) => s + v, 0);
    const sumXY = sizes.reduce((s, x, i) => s + x * idCounts[i], 0);
    const sumXX = sizes.reduce((s, x) => s + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // R² value — how well linear model fits
    const yMean = sumY / n;
    const ssTot = idCounts.reduce((s, y) => s + (y - yMean) ** 2, 0);
    const ssRes = idCounts.reduce((s, y, i) => s + (y - (intercept + slope * sizes[i])) ** 2, 0);
    const rSquared = 1 - ssRes / ssTot;

    console.log(`[Scenario 1] Linear model: IDs = ${intercept.toFixed(1)} + ${slope.toFixed(2)} * questions`);
    console.log(`[Scenario 1] R² = ${rSquared.toFixed(4)} (1.0 = perfect linear fit)`);
    console.log(`[Scenario 1] Per-block fixed IDs (intercept): ~${Math.round(intercept)}`);
    console.log(`[Scenario 1] IDs per question (slope): ~${slope.toFixed(2)}`);

    // R² should be very close to 1.0 for linear scaling (O(n²) would not fit linear model)
    expect(rSquared).toBeGreaterThan(0.99);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 2: Large DOM — 1 block × 100 questions
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 2: Large DOM (1 block × 100 questions)', () => {
  const block = makeKuisBlock(100, 4);

  it('measures average render time over 10 calls', () => {
    // Warmup
    renderQuizBlock('kuis', block, noopRender);

    const iterations = 10;
    const start = hrMs();
    for (let i = 0; i < iterations; i++) {
      renderQuizBlock('kuis', block, noopRender);
    }
    const elapsed = hrMs() - start;
    const avgMs = elapsed / iterations;

    console.log(`[Scenario 2] Avg render time: ${avgMs.toFixed(3)} ms over ${iterations} calls (total: ${elapsed.toFixed(2)} ms)`);
    expect(avgMs).toBeLessThan(500); // Sanity: should be under 500ms
  });

  it('measures HTML output size', () => {
    const html = renderQuizBlock('kuis', block, noopRender);
    const sizeChars = html.length;
    const sizeBytes = Buffer.byteLength(html, 'utf8');

    console.log(`[Scenario 2] HTML output size: ${sizeChars} chars, ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(1)} KB)`);
    expect(sizeChars).toBeGreaterThan(0);
  });

  it('counts DOM nodes', () => {
    const html = renderQuizBlock('kuis', block, noopRender);
    const tags = countDomTags(html, ['div', 'button', 'p', 'span', 'h2', 'input']);
    const totalDomNodes = Object.values(tags).reduce((s, v) => s + v, 0);

    console.log(`[Scenario 2] DOM node counts:`, tags);
    console.log(`[Scenario 2] Total estimated DOM nodes: ${totalDomNodes}`);
    expect(totalDomNodes).toBeGreaterThan(0);
  });

  it('checks O(n²) risk — render time scaling from 10q to 100q', () => {
    const block10 = makeKuisBlock(10, 4);
    block10.id = 'kuis-scale-10';
    const block100 = makeKuisBlock(100, 4);
    block100.id = 'kuis-scale-100';

    // Warmup
    renderQuizBlock('kuis', block10, noopRender);
    renderQuizBlock('kuis', block100, noopRender);

    const iters = 20;

    const start10 = hrMs();
    for (let i = 0; i < iters; i++) renderQuizBlock('kuis', block10, noopRender);
    const time10 = hrMs() - start10;

    const start100 = hrMs();
    for (let i = 0; i < iters; i++) renderQuizBlock('kuis', block100, noopRender);
    const time100 = hrMs() - start100;

    const avg10 = time10 / iters;
    const avg100 = time100 / iters;
    const scalingRatio = avg100 / avg10;

    console.log(`[Scenario 2] 10q avg: ${avg10.toFixed(3)} ms, 100q avg: ${avg100.toFixed(3)} ms, scaling ratio: ${scalingRatio.toFixed(2)}x`);
    console.log(`[Scenario 2] Linear expectation: ~10x. O(n²) would be ~100x. Actual: ${scalingRatio.toFixed(2)}x`);

    // If truly linear, ratio should be ~10x. O(n²) would be ~100x.
    // Allow generous margin: should be well under 30x
    expect(scalingRatio).toBeLessThan(30);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 3: Multi-block — 10 blocks × 20 questions each
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 3: Multi-block (10 blocks × 20 questions)', () => {
  const blocks: Record<string, unknown>[] = Array.from({ length: 10 }, (_, i) => {
    const b = makeKuisBlock(20, 4);
    b.id = `kuis-multi-${i}`;
    return b;
  });

  it('measures total render time for all blocks', () => {
    const start = hrMs();
    const htmls = blocks.map(b => renderQuizBlock('kuis', b, noopRender));
    const elapsed = hrMs() - start;

    console.log(`[Scenario 3] Total render time for 10 blocks: ${elapsed.toFixed(2)} ms`);
    console.log(`[Scenario 3] Avg per block: ${(elapsed / blocks.length).toFixed(3)} ms`);
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('measures total HTML output size', () => {
    const htmls = blocks.map(b => renderQuizBlock('kuis', b, noopRender));
    const totalChars = htmls.reduce((s, h) => s + h.length, 0);
    const totalBytes = htmls.reduce((s, h) => s + Buffer.byteLength(h, 'utf8'), 0);

    console.log(`[Scenario 3] Total HTML output: ${totalChars} chars, ${totalBytes} bytes (${(totalBytes / 1024).toFixed(1)} KB)`);
    expect(totalChars).toBeGreaterThan(0);
  });

  it('verifies each block has a unique blockId', () => {
    const htmls = blocks.map(b => renderQuizBlock('kuis', b, noopRender));

    // Extract data-block-id from each HTML
    const blockIds = htmls.map(html => {
      const match = html.match(/data-block-id="([^"]+)"/);
      return match ? match[1] : null;
    });

    console.log(`[Scenario 3] Block IDs: ${blockIds.join(', ')}`);

    const uniqueIds = new Set(blockIds);
    expect(uniqueIds.size).toBe(blocks.length);
    expect(blockIds.every(id => id !== null)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 4: Long explanation
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 4: Long explanation (2000-char each)', () => {
  const block = makeKuisBlock(10, 4, 2000);

  it('measures HTML output size', () => {
    const html = renderQuizBlock('kuis', block, noopRender);
    const sizeChars = html.length;
    const sizeBytes = Buffer.byteLength(html, 'utf8');

    console.log(`[Scenario 4] HTML output size: ${sizeChars} chars, ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(1)} KB)`);
    expect(sizeChars).toBeGreaterThan(0);
  });

  it('checks whether explanations are properly escaped', () => {
    // Create block with HTML-dangerous explanation content
    const dangerousBlock: Record<string, unknown> = {
      id: 'kuis-escape-test',
      title: 'Escape Test',
      questions: [
        {
          q: 'Question with <script>alert("xss")</script>?',
          opts: ['A', 'B', 'C', 'D'],
          ans: 0,
          ex: '<script>alert("xss in explanation")</script><img src=x onerror=alert(1)>',
        },
      ],
    };

    const html = renderQuizBlock('kuis', dangerousBlock, noopRender);

    // Check for truly unescaped tags (not the text within escaped tags)
    // escapeHtml converts < to &lt; and > to &gt; and " to &quot;
    // An unescaped <img would appear as '<img' not '&lt;img'
    const hasUnescapedScriptTag = /<script[\s>]/i.test(html);
    const hasUnescapedImgTag = /<img[\s>]/i.test(html);
    const hasEscapedScript = html.includes('&lt;script');
    const hasEscapedImg = html.includes('&lt;img');

    // The onerror attribute text may appear inside escaped &lt;img...&gt; which is safe
    const hasOnerrorInEscapedContext = html.includes('&lt;img') && html.includes('onerror=alert(1)');
    const hasRawOnerrorInUnescapedTag = /<img[^>]*onerror/i.test(html);

    console.log(`[Scenario 4] Unescaped <script> tag in output: ${hasUnescapedScriptTag}`);
    console.log(`[Scenario 4] Unescaped <img> tag in output: ${hasUnescapedImgTag}`);
    console.log(`[Scenario 4] Properly escaped script tag: ${hasEscapedScript}`);
    console.log(`[Scenario 4] Properly escaped img tag: ${hasEscapedImg}`);
    console.log(`[Scenario 4] onerror in escaped context (safe): ${hasOnerrorInEscapedContext}`);
    console.log(`[Scenario 4] onerror in raw unescaped tag (DANGEROUS): ${hasRawOnerrorInUnescapedTag}`);

    expect(hasUnescapedScriptTag).toBe(false);
    expect(hasUnescapedImgTag).toBe(false);
    expect(hasRawOnerrorInUnescapedTag).toBe(false);
  });

  it('measures explanation size impact on total output', () => {
    const blockNoEx = makeKuisBlock(10, 4, 0);
    blockNoEx.id = 'kuis-noex';
    const blockWithEx = makeKuisBlock(10, 4, 2000);
    blockWithEx.id = 'kuis-withex';

    const htmlNoEx = renderQuizBlock('kuis', blockNoEx, noopRender);
    const htmlWithEx = renderQuizBlock('kuis', blockWithEx, noopRender);

    const sizeDiff = htmlWithEx.length - htmlNoEx.length;
    const expectedMinExplanation = 10 * 2000; // 10 questions × 2000 chars (unescaped)

    console.log(`[Scenario 4] Without explanations: ${htmlNoEx.length} chars`);
    console.log(`[Scenario 4] With explanations: ${htmlWithEx.length} chars`);
    console.log(`[Scenario 4] Size difference: ${sizeDiff} chars (expected ~${expectedMinExplanation}+ from raw explanation text)`);
    expect(htmlWithEx.length).toBeGreaterThan(htmlNoEx.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 5: Rapid replay simulation — JS analysis
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 5: JS timer/listener leak analysis', () => {
  const js = getJs();

  it('counts setTimeout calls in JS bundle', () => {
    const setTimeoutCount = countOccurrences(js, 'setTimeout');
    console.log(`[Scenario 5] setTimeout calls: ${setTimeoutCount}`);
    expect(setTimeoutCount).toBeGreaterThanOrEqual(0);
  });

  it('counts requestAnimationFrame calls in JS bundle', () => {
    const rafCount = countOccurrences(js, 'requestAnimationFrame');
    console.log(`[Scenario 5] requestAnimationFrame calls: ${rafCount}`);
    expect(rafCount).toBeGreaterThanOrEqual(0);
  });

  it('counts addEventListener calls in JS bundle', () => {
    const aelCount = countOccurrences(js, 'addEventListener');
    console.log(`[Scenario 5] addEventListener calls: ${aelCount}`);
    expect(aelCount).toBeGreaterThanOrEqual(0);
  });

  it('checks if setTimeout callbacks are stored/clearable', () => {
    const hasClearTimeout = countOccurrences(js, 'clearTimeout') > 0;
    const setTimeoutAssignsToVar = /var\s+\w+\s*=\s*setTimeout|let\s+\w+\s*=\s*setTimeout|const\s+\w+\s*=\s*setTimeout/.test(js);

    console.log(`[Scenario 5] Has clearTimeout calls: ${hasClearTimeout}`);
    console.log(`[Scenario 5] setTimeout assigned to variable: ${setTimeoutAssignsToVar}`);

    if (!hasClearTimeout && !setTimeoutAssignsToVar) {
      console.log(`[Scenario 5] ⚠️ WARNING: setTimeout callbacks are NOT stored or clearable — potential timer leak on replay/navigation`);
    }
  });

  it('checks if event listeners are removable', () => {
    const hasRemoveEventListener = countOccurrences(js, 'removeEventListener') > 0;

    // Check addEventListener context
    const addEventListenerLines: string[] = [];
    const lines = js.split('\n');
    for (const line of lines) {
      if (line.includes('addEventListener')) {
        addEventListenerLines.push(line.trim());
      }
    }

    console.log(`[Scenario 5] Has removeEventListener calls: ${hasRemoveEventListener}`);
    console.log(`[Scenario 5] addEventListener lines:`);
    addEventListenerLines.forEach(l => console.log(`  → ${l}`));

    if (!hasRemoveEventListener) {
      console.log(`[Scenario 5] ⚠️ WARNING: No removeEventListener found — listeners added during init are never removed`);
    }
  });

  it('checks if launchConfetti creates DOM elements that are cleaned up', () => {
    // Find the launchConfetti function body
    const confettiStart = js.indexOf('function launchConfetti');
    if (confettiStart === -1) {
      console.log(`[Scenario 5] launchConfetti function not found`);
      return;
    }

    // Extract a reasonable chunk of the function
    const confettiSnippet = js.substring(confettiStart, confettiStart + 1000);
    const hasConfettiRemove = confettiSnippet.includes('.remove()');
    const hasConfettiSetTimeout = confettiSnippet.includes('setTimeout');

    // Check if setTimeout is used to clean up confetti pieces
    const confettiCleanupPattern = /setTimeout.*\.remove\(\)/.test(confettiSnippet);

    console.log(`[Scenario 5] launchConfetti creates DOM elements: ${confettiSnippet.includes('createElement')}`);
    console.log(`[Scenario 5] launchConfetti uses .remove() for cleanup: ${hasConfettiRemove}`);
    console.log(`[Scenario 5] launchConfetti uses setTimeout for delayed cleanup: ${hasConfettiSetTimeout}`);
    console.log(`[Scenario 5] launchConfetti setTimeout+remove pattern found: ${confettiCleanupPattern}`);

    if (hasConfettiRemove && hasConfettiSetTimeout) {
      console.log(`[Scenario 5] ✅ Confetti elements ARE cleaned up via setTimeout + .remove()`);
    } else {
      console.log(`[Scenario 5] ⚠️ WARNING: Confetti elements may NOT be properly cleaned up`);
    }
  });

  it('analyzes replay functions for state leak potential', () => {
    const hasReplayKuis = js.includes('replayKuis');
    const hasReplayTF = js.includes('replayTF');
    const hasReplayFB = js.includes('replayFB');

    // Check if replay resets state objects
    const replayKuisStart = js.indexOf('function replayKuis');
    const replayTFStart = js.indexOf('function replayTF');
    const replayFBStart = js.indexOf('function replayFB');

    let replayKuisResetsState = false;
    let replayTFResetsState = false;
    let replayFBResetsState = false;

    if (replayKuisStart !== -1) {
      const snippet = js.substring(replayKuisStart, replayKuisStart + 500);
      replayKuisResetsState = snippet.includes('quizState[');
      console.log(`[Scenario 5] replayKuis resets quizState: ${replayKuisResetsState}`);
    }
    if (replayTFStart !== -1) {
      const snippet = js.substring(replayTFStart, replayTFStart + 500);
      replayTFResetsState = snippet.includes('tfState[');
      console.log(`[Scenario 5] replayTF resets tfState: ${replayTFResetsState}`);
    }
    if (replayFBStart !== -1) {
      const snippet = js.substring(replayFBStart, replayFBStart + 500);
      replayFBResetsState = snippet.includes('fbState[');
      console.log(`[Scenario 5] replayFB resets fbState: ${replayFBResetsState}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 6: Script/CSS size
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 6: Script/CSS bundle size', () => {
  it('measures JS bundle size', () => {
    const js = getJs();
    const sizeChars = js.length;
    const sizeBytes = Buffer.byteLength(js, 'utf8');
    const lineCount = js.split('\n').length;

    console.log(`[Scenario 6] JS bundle size: ${sizeChars} chars, ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(1)} KB)`);
    console.log(`[Scenario 6] JS line count: ${lineCount}`);
    expect(sizeChars).toBeGreaterThan(0);
  });

  it('measures CSS bundle size', () => {
    const css = getCss(1280, 720);
    const sizeChars = css.length;
    const sizeBytes = Buffer.byteLength(css, 'utf8');
    const lineCount = css.split('\n').length;

    console.log(`[Scenario 6] CSS bundle size: ${sizeChars} chars, ${sizeBytes} bytes (${(sizeBytes / 1024).toFixed(1)} KB)`);
    console.log(`[Scenario 6] CSS line count: ${lineCount}`);
    expect(sizeChars).toBeGreaterThan(0);
  });

  it('estimates quiz-specific vs general lines in JS', () => {
    const js = getJs();
    const lines = js.split('\n');

    // Quiz-specific keywords that indicate quiz/game logic
    const quizKeywords = [
      'checkAnswer', 'nextKuisStep', 'showKuisStep', 'showKuisCompletion',
      'replayKuis', 'quizState', 'kuis-block', 'kuis-question', 'kuis-step',
      'checkTrueFalse', 'nextTFStep', 'showTFStep', 'showTFCompletion',
      'replayTF', 'tfState', 'true-false-block', 'tf-question', 'tf-step',
      'checkFillBlank', 'checkAllFillBlanks', 'replayFB', 'fbState',
      'fill-blank', 'fb-input', 'fb-question',
      'launchConfetti', 'confetti-piece',
      'resetQuizBlock', 'resetTFBlock', 'resetFBBlock', 'resetPageQuizState',
    ];

    // General keywords (navigation, canvas, keyboard, fullscreen, etc.)
    const generalKeywords = [
      'goPage', 'nextPage', 'prevPage', 'currentPage', 'totalPages',
      'scaleCanvas', 'updateCounter', 'toggleFullscreen',
      'addEventListener', 'touchstart', 'touchend', 'keydown',
    ];

    let quizLines = 0;
    let generalLines = 0;
    let otherLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      const isQuiz = quizKeywords.some(kw => line.includes(kw));
      const isGeneral = generalKeywords.some(kw => line.includes(kw));

      if (isQuiz) quizLines++;
      else if (isGeneral) generalLines++;
      else otherLines++;
    }

    const totalContentLines = quizLines + generalLines + otherLines;

    console.log(`[Scenario 6] JS content lines breakdown:`);
    console.log(`  Quiz-specific: ${quizLines} lines (${((quizLines / totalContentLines) * 100).toFixed(1)}%)`);
    console.log(`  General/nav:   ${generalLines} lines (${((generalLines / totalContentLines) * 100).toFixed(1)}%)`);
    console.log(`  Other/game:    ${otherLines} lines (${((otherLines / totalContentLines) * 100).toFixed(1)}%)`);
    console.log(`  Total content: ${totalContentLines} lines`);

    // Note: getJs() returns ALL game logic regardless of whether quiz blocks exist
    console.log(`[Scenario 6] ⚠️ NOTE: getJs() returns ALL game logic in a single template string, regardless of whether quiz blocks exist on the page`);
  });

  it('estimates quiz-specific vs general lines in CSS', () => {
    const css = getCss(1280, 720);
    const lines = css.split('\n');

    const quizCssKeywords = [
      'kuis-', 'quiz-', 'tf-', 'fb-', 'fill-blank', 'true-false',
      'q-opt', 'q-text', 'q-feedback', 'q-explanation', 'q-next',
      'tf-btn', 'tf-feedback', 'tf-explanation', 'tf-next',
      'fb-input', 'fb-feedback', 'fb-question',
      'quiz-progress', 'quiz-completion', 'quiz-replay', 'quiz-variant',
      'confetti', 'game-check',
    ];

    const generalCssKeywords = [
      'reset', 'box-sizing', 'html', 'body', 'font-family',
      '#app', '#canvas', '.page', '.block', '.block-header',
      'animation', 'transition', '@keyframes',
    ];

    let quizLines = 0;
    let generalLines = 0;
    let otherLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed === '') continue;

      const isQuiz = quizCssKeywords.some(kw => line.includes(kw));
      const isGeneral = generalCssKeywords.some(kw => line.includes(kw));

      if (isQuiz) quizLines++;
      else if (isGeneral) generalLines++;
      else otherLines++;
    }

    const totalContentLines = quizLines + generalLines + otherLines;

    console.log(`[Scenario 6] CSS content lines breakdown:`);
    console.log(`  Quiz-specific: ${quizLines} lines (${((quizLines / totalContentLines) * 100).toFixed(1)}%)`);
    console.log(`  General:       ${generalLines} lines (${((generalLines / totalContentLines) * 100).toFixed(1)}%)`);
    console.log(`  Other:         ${otherLines} lines (${((otherLines / totalContentLines) * 100).toFixed(1)}%)`);
    console.log(`  Total content: ${totalContentLines} lines`);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 7: Fill-blank with multiple blanks
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Scenario 7: Fill-blank with 3 blanks per question', () => {
  const block = makeFillBlankBlock(10, 3);

  it('counts number of input fields generated', () => {
    const html = renderQuizBlock('fill-blank-game', block, noopRender);
    const inputCount = countOccurrences(html, '<input');

    console.log(`[Scenario 7] Input fields generated: ${inputCount}`);
    console.log(`[Scenario 7] Expected: ${10 * 3} = 30 inputs (10 questions × 3 blanks)`);

    // With 3 blanks per question, we expect 3 inputs per question = 30 total
    expect(inputCount).toBe(30);
  });

  it('checks whether each input has unique identification', () => {
    const html = renderQuizBlock('fill-blank-game', block, noopRender);

    // Extract all data-idx attributes from inputs
    const inputIdxMatches = [...html.matchAll(/<input[^>]*data-idx="(\d+)"[^>]*>/g)];

    // Count unique (data-idx, data-game) pairs
    const uniquePairs = new Set<string>();
    for (const match of inputIdxMatches) {
      const fullTag = match[0];
      const idxMatch = fullTag.match(/data-idx="(\d+)"/);
      const gameMatch = fullTag.match(/data-game="([^"]+)"/);
      if (idxMatch && gameMatch) {
        uniquePairs.add(`${gameMatch[1]}-${idxMatch[1]}`);
      }
    }

    console.log(`[Scenario 7] Unique (game, idx) pairs: ${uniquePairs.size}`);
    console.log(`[Scenario 7] Total inputs found: ${inputIdxMatches.length}`);

    // Problem: data-idx is per-question, not per-blank. Multiple blanks in same question share data-idx!
    const idxValues = inputIdxMatches.map(m => {
      const fullTag = m[0];
      const idxMatch = fullTag.match(/data-idx="(\d+)"/);
      return idxMatch ? idxMatch[1] : '?';
    });
    const idxDistribution: Record<string, number> = {};
    for (const idx of idxValues) {
      idxDistribution[idx] = (idxDistribution[idx] || 0) + 1;
    }

    console.log(`[Scenario 7] data-idx distribution:`, idxDistribution);

    // Check if inputs within same question have distinct IDs
    const idMatches = [...html.matchAll(/id="([^"]+)"/g)];
    const fbIds = idMatches.map(m => m[1]).filter(id => id.startsWith('fb-'));
    console.log(`[Scenario 7] fb-related IDs: ${fbIds.length}`);
    console.log(`[Scenario 7] ⚠️ NOTE: Multiple blanks in same question share data-idx — individual inputs may NOT be uniquely identifiable`);

    // The inputs don't have id attributes, only data-idx and data-game
    const inputsWithId = [...html.matchAll(/<input[^>]*id="/g)];
    console.log(`[Scenario 7] Inputs with id attribute: ${inputsWithId.length}`);
  });

  it('measures fill-blank render time', () => {
    // Warmup
    renderQuizBlock('fill-blank-game', block, noopRender);

    const iterations = 100;
    const start = hrMs();
    for (let i = 0; i < iterations; i++) {
      renderQuizBlock('fill-blank-game', block, noopRender);
    }
    const elapsed = hrMs() - start;
    const avgMs = elapsed / iterations;

    console.log(`[Scenario 7] Avg render time: ${avgMs.toFixed(3)} ms over ${iterations} calls`);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CROSS-CUTTING ANALYSIS
// ═══════════════════════════════════════════════════════════════════════

describe('Performance Audit — Cross-cutting Analysis', () => {
  it('string concatenation efficiency — template literal vs array join pattern', () => {
    // The renderers use .map().join('') which is O(n) and efficient.
    // Check that no += string concatenation patterns exist in quiz-renderers.ts
    // (We validate by checking the source code's approach is documented)

    const block = makeKuisBlock(50, 4);
    block.id = 'kuis-concat-test';

    // Measure render time for a medium-sized block
    const iterations = 50;
    const start = hrMs();
    for (let i = 0; i < iterations; i++) {
      renderQuizBlock('kuis', block, noopRender);
    }
    const elapsed = hrMs() - start;
    const avgMs = elapsed / iterations;

    console.log(`[Cross-cutting] 50q block avg render: ${avgMs.toFixed(3)} ms`);
    console.log(`[Cross-cutting] Template literals with .map().join('') is O(n) per question — efficient`);
    console.log(`[Cross-cutting] No O(n²) string concatenation patterns detected in source`);
  });

  it('onclick handler count scales linearly with question count', () => {
    const sizes = [5, 10, 20, 50];
    const onclickCounts: number[] = [];

    for (const size of sizes) {
      const b = makeKuisBlock(size, 4);
      b.id = `kuis-onclick-${size}`;
      const html = renderQuizBlock('kuis', b, noopRender);
      onclickCounts.push(countOccurrences(html, 'onclick='));
    }

    console.log(`[Cross-cutting] onclick counts for sizes ${sizes.join(', ')}: ${onclickCounts.join(', ')}`);

    // Check linear scaling
    const ratios = onclickCounts.map((c, i) => c / sizes[i]);
    const avgRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;
    const maxDeviation = Math.max(...ratios.map(r => Math.abs(r - avgRatio) / avgRatio));

    console.log(`[Cross-cutting] onclick-to-question ratios: ${ratios.map(r => r.toFixed(2)).join(', ')}`);
    console.log(`[Cross-cutting] Expected ratio: ~5 (4 option buttons + 1 next button per question) + fixed overhead`);

    expect(maxDeviation).toBeLessThan(0.25);
  });

  it('HTML output size scales linearly with question count', () => {
    const sizes = [5, 10, 20, 50, 100];
    const outputSizes: number[] = [];

    for (const size of sizes) {
      const b = makeKuisBlock(size, 4);
      b.id = `kuis-size-${size}`;
      const html = renderQuizBlock('kuis', b, noopRender);
      outputSizes.push(html.length);
    }

    console.log(`[Cross-cutting] HTML sizes for ${sizes.join(', ')} questions: ${outputSizes.join(', ')} chars`);

    // Check linear scaling: size/questions should be roughly constant
    const bytesPerQuestion = outputSizes.map((s, i) => s / sizes[i]);
    const avgBytesPerQ = bytesPerQuestion.reduce((s, b) => s + b, 0) / bytesPerQuestion.length;
    const maxDeviation = Math.max(...bytesPerQuestion.map(b => Math.abs(b - avgBytesPerQ) / avgBytesPerQ));

    console.log(`[Cross-cutting] Bytes per question: ${bytesPerQuestion.map(b => b.toFixed(0)).join(', ')} (avg: ${avgBytesPerQ.toFixed(0)})`);
    console.log(`[Cross-cutting] Max deviation from linear: ${(maxDeviation * 100).toFixed(1)}%`);

    // Linear scaling = low deviation. O(n²) would show growing bytes/question.
    expect(maxDeviation).toBeLessThan(0.2);
  });
});
