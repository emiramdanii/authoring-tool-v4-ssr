// ═══════════════════════════════════════════════════════════════════════
// QUIZ XSS SECURITY AUDIT — Systematic XSS injection testing
// Tests renderQuizBlock for: kuis, true-false-game, fill-blank-game
// Also tests kuis-import validator for passthrough of raw strings
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { renderQuizBlock } from '@/lib/export/quiz-renderers';
import { parseKuisImportJSON, mapKuisImportToPatch } from '@/core/schema/kuis-import';

const noopRender = (() => '') as unknown as import('@/lib/export/utils').RenderBlockFn;

// ═══════════════════════════════════════════════════════════════════════
// XSS PAYLOADS — Covering script injection, event handlers, URL schemes,
// attribute breakout, SVG, iframe, and details/ontoggle
// ═══════════════════════════════════════════════════════════════════════
const XSS_PAYLOADS = [
  '<script>window.__xss = true</script>',
  '<img src=x onerror="window.__xss = true">',
  '</div><script>window.__xss = true</script>',
  '<strong onclick="window.__xss = true">Teks</strong>',
  '<a href="javascript:window.__xss = true">Klik</a>',
  '"><script>window.__xss = true</script>',
  "' onmouseover='window.__xss = true",
  '<svg onload="window.__xss = true">',
  '<iframe src="javascript:window.__xss = true"></iframe>',
  '<details open ontoggle="window.__xss = true">',
] as const;

// ── XSS Detection Helpers ───────────────────────────────────────────

/**
 * Parse the HTML string into a DOM Document and check for actual XSS
 * vulnerabilities by inspecting the DOM tree (not just string matching).
 *
 * This approach avoids false positives from HTML-entity-encoded text
 * content that merely contains substrings like "javascript:" or "onclick="
 * but are not actually dangerous DOM attributes/elements.
 */
function checkXssInDom(html: string): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Check for <script> elements in the body
  const scripts = doc.querySelectorAll('script');
  if (scripts.length > 0) {
    violations.push(`<script> element found in DOM (${scripts.length} instance(s))`);
  }

  // 2. Check for <iframe> elements
  const iframes = doc.querySelectorAll('iframe');
  if (iframes.length > 0) {
    violations.push(`<iframe> element found in DOM (${iframes.length} instance(s))`);
  }

  // 3. Check for <svg> elements (could contain onload)
  const svgs = doc.querySelectorAll('svg');
  if (svgs.length > 0) {
    violations.push(`<svg> element found in DOM (${svgs.length} instance(s))`);
  }

  // 4. Check for <img> elements with onerror (XSS vector)
  const imgs = doc.querySelectorAll('img[onerror]');
  if (imgs.length > 0) {
    violations.push(`<img onerror> found in DOM (${imgs.length} instance(s))`);
  }

  // 5. Check for <details> with ontoggle
  const details = doc.querySelectorAll('details[ontoggle]');
  if (details.length > 0) {
    violations.push(`<details ontoggle> found in DOM (${details.length} instance(s))`);
  }

  // 6. Check all elements for dangerous event handler attributes
  const dangerousHandlers = ['onclick', 'onerror', 'onload', 'ontoggle', 'onmouseover', 'onfocus', 'onblur'];
  const allElements = doc.querySelectorAll('*');
  for (const el of allElements) {
    for (const handler of dangerousHandlers) {
      // Skip template-intrinsic onclick handlers (checkAnswer, checkTrueFalse, etc.)
      const value = el.getAttribute(handler);
      if (value !== null) {
        // These are legitimate template handlers, not XSS
        const isTemplateHandler =
          value.startsWith('checkAnswer(') ||
          value.startsWith('checkTrueFalse(') ||
          value.startsWith('checkFillBlank(') ||
          value.startsWith('checkAllFillBlanks(') ||
          value.startsWith('nextKuisStep(') ||
          value.startsWith('nextTFStep(') ||
          value.startsWith('replayKuis(') ||
          value.startsWith('replayTF(') ||
          value.startsWith('replayFB(') ||
          value.startsWith('showKuisCompletion(') ||
          value.startsWith('if(event.key');

        if (!isTemplateHandler) {
          violations.push(`Dangerous ${handler}="${value}" found on <${el.tagName.toLowerCase()}> element`);
        }
      }
    }
  }

  // 7. Check for javascript: URLs in href or src attributes
  const linksWithHref = doc.querySelectorAll('[href]');
  for (const el of linksWithHref) {
    const href = el.getAttribute('href') || '';
    if (/javascript\s*:/i.test(href)) {
      violations.push(`javascript: URL found in href on <${el.tagName.toLowerCase()}>`);
    }
  }
  const elementsWithSrc = doc.querySelectorAll('[src]');
  for (const el of elementsWithSrc) {
    const src = el.getAttribute('src') || '';
    if (/javascript\s*:/i.test(src)) {
      violations.push(`javascript: URL found in src on <${el.tagName.toLowerCase()}>`);
    }
  }

  return { safe: violations.length === 0, violations };
}

/**
 * Verify that the raw payload string does NOT appear in the HTML source.
 * This catches cases where the payload was not escaped at all.
 */
function checkRawPayload(html: string, payload: string): { escaped: boolean; details: string } {
  // For payloads that contain < or >, they MUST be escaped
  if (payload.includes('<') || payload.includes('>')) {
    if (html.includes(payload)) {
      return { escaped: false, details: `Raw payload with angle brackets found unescaped in HTML source` };
    }
  }
  // For payloads with ", they must be escaped inside attributes
  if (payload.includes('"')) {
    // Check if the raw " appears inside an attribute context
    // This is trickier — we check via DOM parsing above
  }
  // For payloads without any HTML-special chars (like the onmouseover one),
  // it's OK for them to appear as-is in text content since they're harmless there
  return { escaped: true, details: 'Payload properly escaped or harmless in text content' };
}

// ═══════════════════════════════════════════════════════════════════════
// 1. KUIS BLOCK XSS TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Kuis block — XSS injection audit', () => {
  function makeKuisBlock(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: 'kuis-xss-test',
      title: 'Safe Title',
      variant: 'A',
      questions: [
        { q: 'Safe question?', opts: ['Opt A', 'Opt B', 'Opt C', 'Opt D'], ans: 0, ex: 'Safe explanation' },
      ],
      ...overrides,
    };
  }

  // ── title field ──
  describe('title field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in title: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeKuisBlock({ title: payload });
        const html = renderQuizBlock('kuis', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  // ── questions[0].q field ──
  describe('questions[0].q field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in question text: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeKuisBlock({
          questions: [{ q: payload, opts: ['A', 'B', 'C', 'D'], ans: 0, ex: 'safe' }],
        });
        const html = renderQuizBlock('kuis', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  // ── questions[0].opts[0] field ──
  describe('questions[0].opts[0] field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in option text: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeKuisBlock({
          questions: [{ q: 'safe?', opts: [payload, 'B', 'C', 'D'], ans: 0, ex: 'safe' }],
        });
        const html = renderQuizBlock('kuis', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  // ── questions[0].ex field ──
  describe('questions[0].ex field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in explanation: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeKuisBlock({
          questions: [{ q: 'safe?', opts: ['A', 'B', 'C', 'D'], ans: 0, ex: payload }],
        });
        const html = renderQuizBlock('kuis', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  // ── All fields simultaneously ──
  describe('all fields simultaneously', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS when all fields have payload: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeKuisBlock({
          title: payload,
          questions: [{ q: payload, opts: [payload, 'B', 'C', 'D'], ans: 0, ex: payload }],
        });
        const html = renderQuizBlock('kuis', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. TRUE-FALSE GAME XSS TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('True-False game — XSS injection audit', () => {
  function makeTFBlock(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: 'tf-xss-test',
      title: 'Safe Title',
      questions: [
        { text: 'Safe question text', correct: true, explanation: 'Safe explanation' },
      ],
      ...overrides,
    };
  }

  describe('title field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in title: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeTFBlock({ title: payload });
        const html = renderQuizBlock('true-false-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  describe('questions[0].text field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in question text: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeTFBlock({
          questions: [{ text: payload, correct: true, explanation: 'safe' }],
        });
        const html = renderQuizBlock('true-false-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  describe('questions[0].explanation field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in explanation: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeTFBlock({
          questions: [{ text: 'safe?', correct: true, explanation: payload }],
        });
        const html = renderQuizBlock('true-false-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  describe('all fields simultaneously', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS when all fields have payload: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeTFBlock({
          title: payload,
          questions: [{ text: payload, correct: true, explanation: payload }],
        });
        const html = renderQuizBlock('true-false-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. FILL-BLANK GAME XSS TESTS
// ═══════════════════════════════════════════════════════════════════════
describe('Fill-Blank game — XSS injection audit', () => {
  function makeFBBlock(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: 'fb-xss-test',
      title: 'Safe Title',
      questions: [
        { text: 'Ibukota Indonesia adalah ___', answer: 'Jakarta', hint: 'Kota besar di Jawa' },
      ],
      ...overrides,
    };
  }

  describe('title field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in title: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeFBBlock({ title: payload });
        const html = renderQuizBlock('fill-blank-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  describe('questions[0].text field', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in question text: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeFBBlock({
          questions: [{ text: `${payload} ___`, answer: 'Jakarta', hint: 'hint' }],
        });
        const html = renderQuizBlock('fill-blank-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
        const rawCheck = checkRawPayload(html, payload);
        expect(rawCheck.escaped, rawCheck.details).toBe(true);
      });
    }
  });

  describe('questions[0].answer field (data-answer attribute)', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in answer/data-answer: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeFBBlock({
          questions: [{ text: 'The answer is ___', answer: payload, hint: 'hint' }],
        });
        const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

        // Step 1: DOM-level check — no dangerous elements in the DOM
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);

        // Step 2: Verify the HTML SOURCE string has escaped entities in data-answer
        // We must check the raw HTML string, NOT getAttribute(), because
        // getAttribute() auto-decodes HTML entities (&lt; → <)
        const dataAnswerMatch = html.match(/data-answer="([^"]*)"/);
        expect(dataAnswerMatch, 'data-answer attribute should exist in HTML source').not.toBeNull();
        const dataAnswerInSource = dataAnswerMatch![1];

        // The HTML source should have escaped entities
        if (payload.includes('<')) {
          expect(dataAnswerInSource, `data-answer in HTML source should contain &lt; for "<"`).toContain('&lt;');
        }
        if (payload.includes('>')) {
          expect(dataAnswerInSource, `data-answer in HTML source should contain &gt; for ">"`).toContain('&gt;');
        }
        if (payload.includes('"')) {
          expect(dataAnswerInSource, `data-answer in HTML source should contain &quot; for '"'`).toContain('&quot;');
        }
        if (payload.includes('&')) {
          expect(dataAnswerInSource, `data-answer in HTML source should contain &amp; for "&"`).toContain('&amp;');
        }

        // Step 3: IMPORTANT — Document the DOM auto-decoding vulnerability
        // When read via getAttribute() or dataset.answer, HTML entities are decoded.
        // The runtime JS reads input.dataset.answer and inserts into innerHTML,
        // which means the decoded (raw) XSS payload gets inserted into the DOM.
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const input = doc.querySelector('input.fb-input');
        const dataAnswerDecoded = input!.getAttribute('data-answer')!;

        // The decoded value equals the original payload — this is the vulnerability
        // (documented in detail in section 4: CRITICAL innerHTML vulnerability)
        expect(dataAnswerDecoded, 'DOM auto-decodes data-answer attribute back to raw payload').toBe(payload);
      });
    }
  });

  describe('questions[0].hint field (placeholder attribute)', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS in hint/placeholder: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeFBBlock({
          questions: [{ text: 'The answer is ___', answer: 'safe', hint: payload }],
        });
        const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

        // Step 1: DOM-level check — no dangerous elements in the DOM
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);

        // Step 2: Verify the HTML SOURCE string has escaped entities in placeholder
        const placeholderMatch = html.match(/placeholder="([^"]*)"/);
        expect(placeholderMatch, 'placeholder attribute should exist in HTML source').not.toBeNull();
        const placeholderInSource = placeholderMatch![1];

        // The HTML source should have escaped entities
        if (payload.includes('<')) {
          expect(placeholderInSource, `placeholder in HTML source should contain &lt; for "<"`).toContain('&lt;');
        }
        if (payload.includes('>')) {
          expect(placeholderInSource, `placeholder in HTML source should contain &gt; for ">"`).toContain('&gt;');
        }
        if (payload.includes('"')) {
          expect(placeholderInSource, `placeholder in HTML source should contain &quot; for '"'`).toContain('&quot;');
        }

        // Step 3: DOM auto-decodes — same vulnerability pattern as data-answer
        // Note: The placeholder attribute is not read and inserted into innerHTML
        // by the runtime JS, so it's less dangerous than data-answer.
        // But the decoded value is still accessible via getAttribute.
      });
    }
  });

  describe('all fields simultaneously', () => {
    for (const payload of XSS_PAYLOADS) {
      it(`should escape XSS when all fields have payload: "${payload.slice(0, 50)}${payload.length > 50 ? '...' : ''}"`, () => {
        const block = makeFBBlock({
          title: payload,
          questions: [{ text: `${payload} ___`, answer: payload, hint: payload }],
        });
        const html = renderQuizBlock('fill-blank-game', block, noopRender)!;
        const result = checkXssInDom(html);
        expect(result.safe, `XSS violations: ${result.violations.join('; ')}`).toBe(true);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. CRITICAL: FILL-BLANK innerHTML DOM DECODING VULNERABILITY
// ═══════════════════════════════════════════════════════════════════════
describe('Fill-Blank — CRITICAL innerHTML DOM decoding vulnerability', () => {
  it('data-answer is escaped in HTML source but will be decoded by DOM dataset API', () => {
    const xssAnswer = '<script>window.__xss = true</script>';
    const block = {
      id: 'fb-critical-test',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: xssAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    // STEP 1: The HTML source should have the escaped version
    expect(html, 'HTML source should contain &lt;script&gt; (escaped)').toContain('&lt;script&gt;');
    expect(html, 'HTML source should NOT contain raw <script> tag').not.toMatch(/<script[\s>]/i);

    // STEP 2: DOMParser should NOT find <script> elements
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `DOM should be safe: ${domResult.violations.join('; ')}`).toBe(true);

    // STEP 3: Verify the data-answer attribute value via DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const dataAnswer = input!.getAttribute('data-answer')!;

    // When read via getAttribute(), HTML entities are decoded
    // So dataAnswer will be: <script>window.__xss = true</script>
    // This is because getAttribute() returns the decoded value
    expect(dataAnswer, 'getAttribute decodes HTML entities in data-answer').toBe(xssAnswer);

    // STEP 4: DOCUMENT THE VULNERABILITY
    // The runtime JS (scripts.ts line 479) does:
    //   fb.innerHTML = '<span>...Jawaban: ' + input.dataset.answer + '</span>';
    // dataset.answer also returns the decoded value.
    // When this decoded <script> tag is inserted into innerHTML,
    // the browser will NOT execute it (innerHTML script tags don't execute),
    // BUT other vectors like <img onerror>, <svg onload> WILL execute.
    // This is a STORED XSS vulnerability via the DOM decoding path.
  });

  it('data-answer with <img onerror> will execute via innerHTML at runtime', () => {
    const xssAnswer = '<img src=x onerror="window.__xss = true">';
    const block = {
      id: 'fb-critical-img',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: xssAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    // HTML source is properly escaped — no <img> in DOM
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `DOM should be safe: ${domResult.violations.join('; ')}`).toBe(true);

    // But the data-answer attribute, when read via DOM, contains the decoded XSS payload
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const dataAnswer = input!.getAttribute('data-answer')!;
    expect(dataAnswer, 'getAttribute returns decoded XSS payload').toBe(xssAnswer);

    // When the runtime JS inserts this into innerHTML:
    //   fb.innerHTML = '...Jawaban: ' + input.dataset.answer + '</span>';
    // The <img onerror> WILL execute because innerHTML parses and executes
    // event handlers on elements it creates (unlike <script> tags).
  });

  it('data-answer with <svg onload> will execute via innerHTML at runtime', () => {
    const xssAnswer = '<svg onload="window.__xss = true">';
    const block = {
      id: 'fb-critical-svg',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: xssAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const dataAnswer = input!.getAttribute('data-answer')!;
    expect(dataAnswer, 'getAttribute returns decoded <svg onload> payload').toBe(xssAnswer);
  });

  it('data-answer attribute breakout with " character — breakout prevented', () => {
    const xssAnswer = '"><script>window.__xss = true</script>';
    const block = {
      id: 'fb-critical-breakout',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: xssAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    // Verify via DOM that the attribute breakout is prevented
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');

    // The " is escaped to &quot; in the HTML source, preventing attribute breakout
    // When read via getAttribute, it returns the decoded value including the "
    const dataAnswer = input!.getAttribute('data-answer')!;
    expect(dataAnswer, 'getAttribute returns decoded value with "').toBe(xssAnswer);

    // Verify no <script> elements in the DOM (breakout was prevented)
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `DOM should be safe (breakout prevented): ${domResult.violations.join('; ')}`).toBe(true);

    // Check that input only has the expected attributes (no injected ones)
    const inputAttrs = Array.from(input!.attributes).map(a => a.name);
    expect(inputAttrs, 'Should not have injected onclick attribute').not.toContain('onclick');
    // data-foo would be an injected attribute from the payload — verify it's not present
    // as a REAL attribute (not just as text inside data-answer value)
  });

  it('data-answer with single-quote attribute breakout attempt — breakout prevented', () => {
    const xssAnswer = "' onmouseover='window.__xss = true";
    const block = {
      id: 'fb-critical-single',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: xssAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    // The data-answer uses double-quoted attribute, so single quotes are safe
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `DOM should be safe: ${domResult.violations.join('; ')}`).toBe(true);

    // Verify no onmouseover attribute was injected
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const inputAttrs = Array.from(input!.attributes).map(a => a.name);
    expect(inputAttrs, 'Should not have injected onmouseover attribute').not.toContain('onmouseover');
  });

  it('data-answer with double-quote breakout attempt — no real attributes injected', () => {
    const xssAnswer = 'test" onclick="alert(1)" data-foo="bar';
    const block = {
      id: 'fb-critical-dblquote',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: xssAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    // DOM-level check: no injected attributes should exist
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `DOM should be safe (no real injected attrs): ${domResult.violations.join('; ')}`).toBe(true);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const inputAttrs = Array.from(input!.attributes).map(a => a.name);
    expect(inputAttrs, 'Should not have injected onclick attribute').not.toContain('onclick');
    expect(inputAttrs, 'Should not have injected data-foo attribute').not.toContain('data-foo');
  });

  it('placeholder with double-quote breakout attempt — no real attributes injected', () => {
    const xssHint = 'test" onfocus="alert(1)" data-evil="yes';
    const block = {
      id: 'fb-hint-dblquote',
      title: 'Critical Test',
      questions: [{ text: 'Fill in: ___', answer: 'safe', hint: xssHint }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    const domResult = checkXssInDom(html);
    expect(domResult.safe, `DOM should be safe: ${domResult.violations.join('; ')}`).toBe(true);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const inputAttrs = Array.from(input!.attributes).map(a => a.name);
    expect(inputAttrs, 'Should not have injected onfocus attribute').not.toContain('onfocus');
    expect(inputAttrs, 'Should not have injected data-evil attribute').not.toContain('data-evil');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. KUIS IMPORT VALIDATOR — XSS passthrough audit
// ═══════════════════════════════════════════════════════════════════════
describe('Kuis Import — XSS passthrough audit (validator should NOT strip HTML)', () => {
  it('parseKuisImportJSON passes through XSS in title field', () => {
    const payload = '<script>window.__xss = true</script>';
    const json = JSON.stringify({
      title: payload,
      questions: [{ q: 'safe?', opts: ['A', 'B'], ans: 0 }],
    });
    const { data, error } = parseKuisImportJSON(json);
    expect(error, 'Parse should succeed').toBeNull();
    expect(data!.title, 'Title XSS payload should pass through unstripped').toBe(payload);
  });

  it('parseKuisImportJSON passes through XSS in question q field', () => {
    const payload = '<img src=x onerror="window.__xss = true">';
    const json = JSON.stringify({
      questions: [{ q: payload, opts: ['A', 'B'], ans: 0 }],
    });
    const { data, error } = parseKuisImportJSON(json);
    expect(error, 'Parse should succeed').toBeNull();
    expect(data!.questions[0].q, 'Question q XSS payload should pass through').toBe(payload);
  });

  it('parseKuisImportJSON passes through XSS in opts field', () => {
    const payload = '<svg onload="window.__xss = true">';
    const json = JSON.stringify({
      questions: [{ q: 'safe?', opts: [payload, 'B'], ans: 0 }],
    });
    const { data, error } = parseKuisImportJSON(json);
    expect(error, 'Parse should succeed').toBeNull();
    expect(data!.questions[0].opts[0], 'Opts XSS payload should pass through').toBe(payload);
  });

  it('parseKuisImportJSON passes through XSS in ex field', () => {
    const payload = '<a href="javascript:window.__xss = true">Klik</a>';
    const json = JSON.stringify({
      questions: [{ q: 'safe?', opts: ['A', 'B'], ans: 0, ex: payload }],
    });
    const { data, error } = parseKuisImportJSON(json);
    expect(error, 'Parse should succeed').toBeNull();
    expect(data!.questions[0].ex, 'Explanation XSS payload should pass through').toBe(payload);
  });

  it('mapKuisImportToPatch preserves XSS payloads (for renderer to escape)', () => {
    const payload = '<script>window.__xss = true</script>';
    const data = {
      title: payload,
      questions: [{ q: payload, opts: [payload, 'B'], ans: 0, ex: payload }],
    };
    const patch = mapKuisImportToPatch(data);
    expect(patch.title, 'Patch title should contain XSS payload').toBe(payload);
    expect(patch.questions[0].q, 'Patch q should contain XSS payload').toBe(payload);
    expect(patch.questions[0].opts[0], 'Patch opts[0] should contain XSS payload').toBe(payload);
    expect(patch.questions[0].ex, 'Patch ex should contain XSS payload').toBe(payload);
  });

  it('XSS payloads survive the full pipeline: import → patch → render → escaped', () => {
    const payload = '<script>window.__xss = true</script>';
    const json = JSON.stringify({
      title: payload,
      questions: [{ q: payload, opts: [payload, 'B', 'C', 'D'], ans: 0, ex: payload }],
    });

    // Step 1: Parse
    const { data, error } = parseKuisImportJSON(json);
    expect(error).toBeNull();

    // Step 2: Map to patch
    const patch = mapKuisImportToPatch(data!);

    // Step 3: Render
    const html = renderQuizBlock('kuis', { id: 'pipeline-test', ...patch }, noopRender)!;

    // Step 4: Verify the rendered HTML is safe via DOM parsing
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `Full pipeline should produce safe HTML: ${domResult.violations.join('; ')}`).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. ESCAPE HTML — Verify the escapeHtml function behavior
// ═══════════════════════════════════════════════════════════════════════
describe('escapeHtml — character escaping verification', () => {
  it('< is escaped to &lt;', () => {
    const block = {
      id: 'esc-test-lt',
      title: 'a<b',
      questions: [{ q: 'q?', opts: ['A', 'B'], ans: 0, ex: '' }],
    };
    const html = renderQuizBlock('kuis', block, noopRender)!;
    expect(html).toContain('&lt;');
    // In the DOM, the < should be rendered as text, not as a tag
    const domResult = checkXssInDom(html);
    expect(domResult.safe, `Should be safe: ${domResult.violations.join('; ')}`).toBe(true);
  });

  it('> is escaped to &gt;', () => {
    const block = {
      id: 'esc-test-gt',
      title: 'a>b',
      questions: [{ q: 'q?', opts: ['A', 'B'], ans: 0, ex: '' }],
    };
    const html = renderQuizBlock('kuis', block, noopRender)!;
    expect(html).toContain('&gt;');
  });

  it('" is escaped to &quot;', () => {
    const block = {
      id: 'esc-test-quot',
      title: 'a"b',
      questions: [{ q: 'q?', opts: ['A', 'B'], ans: 0, ex: '' }],
    };
    const html = renderQuizBlock('kuis', block, noopRender)!;
    expect(html).toContain('&quot;');
  });

  it('& is escaped to &amp;', () => {
    const block = {
      id: 'esc-test-amp',
      title: 'a&b',
      questions: [{ q: 'q?', opts: ['A', 'B'], ans: 0, ex: '' }],
    };
    const html = renderQuizBlock('kuis', block, noopRender)!;
    expect(html).toContain('&amp;');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. ADDITIONAL SECURITY CONCERNS
// ═══════════════════════════════════════════════════════════════════════
describe('Additional security concerns', () => {
  it('kuis data-ans attribute is a number, not user-controlled string', () => {
    const block = {
      id: 'kuis-ans-test',
      title: 'Test',
      questions: [{ q: 'q?', opts: ['A', 'B'], ans: 0, ex: '' }],
    };
    const html = renderQuizBlock('kuis', block, noopRender)!;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const qEl = doc.querySelector('[data-ans]');
    expect(qEl, 'Should have data-ans element').not.toBeNull();
    const dataAns = qEl!.getAttribute('data-ans');
    expect(dataAns, 'data-ans should be "0"').toBe('0');
  });

  it('kuis onclick handlers use numeric parameters only (not user strings)', () => {
    const block = {
      id: 'kuis-onclick-test',
      title: 'Test',
      questions: [{ q: 'q?', opts: ['A', 'B'], ans: 0, ex: '' }],
    };
    const html = renderQuizBlock('kuis', block, noopRender)!;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const buttons = doc.querySelectorAll('button.q-opt');
    for (const btn of buttons) {
      const onclick = btn.getAttribute('onclick');
      expect(onclick, 'onclick should match checkAnswer pattern').toMatch(/^checkAnswer\(this,\d+,\d+,\d+\)$/);
    }
  });

  it('true-false data-correct attribute is a boolean, not user-controlled', () => {
    const block = {
      id: 'tf-correct-test',
      title: 'Test',
      questions: [{ text: 'q?', correct: true, explanation: '' }],
    };
    const html = renderQuizBlock('true-false-game', block, noopRender)!;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const btns = doc.querySelectorAll('[data-correct]');
    for (const btn of btns) {
      const val = btn.getAttribute('data-correct');
      expect(['true', 'false'], `data-correct should be boolean, got "${val}"`).toContain(val);
    }
  });

  it('fill-blank data-answer attribute breakout — no real DOM attributes injected', () => {
    const maliciousAnswer = 'test" onclick="alert(1)" data-foo="bar';
    const block = {
      id: 'fb-breakout-test',
      title: 'Test',
      questions: [{ text: '___ is the answer', answer: maliciousAnswer, hint: 'hint' }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    // Verify via DOM that no extra attributes were actually created
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    expect(input, 'fb-input should exist').not.toBeNull();
    const attrNames = Array.from(input!.attributes).map(a => a.name);
    expect(attrNames, 'Should not have real onclick attribute').not.toContain('onclick');
    expect(attrNames, 'Should not have real data-foo attribute').not.toContain('data-foo');
  });

  it('fill-blank hint attribute breakout — no real DOM attributes injected', () => {
    const maliciousHint = 'test" onfocus="alert(1)" data-evil="yes';
    const block = {
      id: 'fb-hint-breakout',
      title: 'Test',
      questions: [{ text: '___ is the answer', answer: 'safe', hint: maliciousHint }],
    };
    const html = renderQuizBlock('fill-blank-game', block, noopRender)!;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const input = doc.querySelector('input.fb-input');
    const attrNames = Array.from(input!.attributes).map(a => a.name);
    expect(attrNames, 'Should not have real onfocus attribute').not.toContain('onfocus');
    expect(attrNames, 'Should not have real data-evil attribute').not.toContain('data-evil');
  });
});
