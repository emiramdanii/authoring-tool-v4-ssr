// ═══════════════════════════════════════════════════════════════════════
// EXPORT SERIALIZATION BOUNDARY — Sprint 6.4-E1-QA2
// ═══════════════════════════════════════════════════════════════════════
// Tests the JSON → HTML <script> injection boundary for ALL export routes.
//
// The production export path injects project data as:
//   <script>window.__EXPORT_DATA__=${dataJson};</script>
//
// This boundary is the most critical security checkpoint:
// if JSON.stringify + escaping is insufficient, a payload can
// terminate the </script> tag and inject arbitrary HTML/JS.
//
// OWASP Reference: XSS Prevention Cheat Sheet — Rule #3
// "Escape the following characters with HTML encoding"
// in the context of HTML script content:
//   < → \u003c    > → \u003e    / → \u002f
//   & → \u0026    U+2028 → \u2028    U+2029 → \u2029
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { generateClientExportHtml } from '@/lib/export';
import type { ClientExportPayload } from '@/lib/export';
import { serializeForHtmlScript } from '@/lib/export/serialize-html-script';

// ═══════════════════════════════════════════════════════════════════════
// SECTION A: SERIALIZATION FUNCTION — Test the canonical serializer
// ═══════════════════════════════════════════════════════════════════════

/**
 * Legacy serialization (what was used before QA2).
 * Kept for comparison — should behave identically to the canonical
 * serializer for <, >, / escaping, but is MISSING & and U+2028/U+2029.
 */
function serializeForScriptLegacy(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f');
}

// ═══════════════════════════════════════════════════════════════════════
// SECTION B: SCRIPT-TERMINATION PAYLOADS
// The primary attack: break out of <script> tag
// ═══════════════════════════════════════════════════════════════════════

const SCRIPT_TERMINATION_PAYLOADS = [
  // Classic script termination — the #1 attack vector
  '</script><script>window.__quizXss = 101</script>',
  // Script termination + img onerror
  '</script><img src=x onerror="window.__quizXss = 102">',
  // HTML comment trick
  '<!--</script><script>window.__quizXss = 103</script>-->',
  // Double-terminated
  '</script></script><script>window.__quizXss = 104</script>',
  // Script termination with whitespace
  '</script >\n<script>window.__quizXss = 105</script>',
  // Script termination with uppercase
  '</SCRIPT><SCRIPT>window.__quizXss = 106</SCRIPT>',
  // Script termination inside attribute value
  '"</script><script>window.__quizXss = 107</script>',
  // Mixed case </ScRiPt>
  '</ScRiPt><sCrIpT>window.__quizXss = 108</ScRiPt>',
  // Null byte injection (some parsers stop at null)
  '</scr\0ipt><script>window.__quizXss = 109</script>',
  // Backtick variation
  '</script>`<script>window.__quizXss = 110</script>`',
] as const;

// ═══════════════════════════════════════════════════════════════════════
// SECTION C: JAVASCRIPT/JSON SPECIAL CHARACTER PAYLOADS
// ═══════════════════════════════════════════════════════════════════════

const SPECIAL_CHAR_PAYLOADS = [
  // Unicode line terminators (U+2028, U+2029)
  { payload: 'before\u2028after', name: 'U+2028 Line Separator' },
  { payload: 'before\u2029after', name: 'U+2029 Paragraph Separator' },
  // Backslash variations
  { payload: '\\', name: 'Backslash' },
  // Double quote
  { payload: '"', name: 'Double Quote' },
  // Literal </script> in isolation
  { payload: '</script>', name: 'Bare </script>' },
  // HTML entities
  { payload: '&lt;script&gt;', name: 'HTML entity script tags' },
  // Ampersand
  { payload: '&', name: 'Ampersand' },
  // Combined: U+2028 + script termination
  { payload: '\u2028</script><script>window.__quizXss = 201</script>', name: 'U+2028 + script termination' },
  // Combined: U+2029 + script termination
  { payload: '\u2029</script><script>window.__quizXss = 202</script>', name: 'U+2029 + script termination' },
] as const;

// ═══════════════════════════════════════════════════════════════════════
// SECTION D: FULL XSS PAYLOAD SET (from Senior's spec + OWASP)
// ═══════════════════════════════════════════════════════════════════════

const XSS_FULL_PAYLOADS = [
  // Script injection
  '<script>window.__quizXss = 301</script>',
  // Event handler injection
  '<img src=x onerror="window.__quizXss = 302">',
  // SVG onload
  '<svg onload="window.__quizXss = 303">',
  // Attribute breakout
  "'><script>window.__quizXss = 304</script>",
  '"><img src=x onerror="window.__quizXss = 305">',
  // JavaScript URL
  '<a href="javascript:window.__quizXss = 306">click</a>',
  // iframe injection
  '<iframe src="javascript:window.__quizXss = 307"></iframe>',
  // details/ontoggle
  '<details open ontoggle="window.__quizXss = 308">',
  // body onload
  '<body onload="window.__quizXss = 309">',
  // input onfocus
  '<input onfocus="window.__quizXss = 310" autofocus>',
  // marquee onstart
  '<marquee onstart="window.__quizXss = 311">',
  // math + xlink (XML-based)
  '<math><mtext><table><mglyph><style><!--</style><img src=x onerror="window.__quizXss = 312">',
] as const;

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: SERIALIZATION FUNCTION — Script-termination payloads
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — script-termination payloads', () => {
  for (const payload of SCRIPT_TERMINATION_PAYLOADS) {
    it(`must not produce literal </script> from: ${payload.slice(0, 50)}`, () => {
      const data = { text: payload };
      const serialized = serializeForHtmlScript(data);

      // The serialized output must NOT contain the literal string </script>
      // (case-insensitive, because HTML parsers are case-insensitive)
      expect(serialized.toLowerCase()).not.toContain('</script>');
      expect(serialized.toLowerCase()).not.toContain('</script >');

      // Must not contain <script> either (opening tag)
      expect(serialized.toLowerCase()).not.toContain('<script>');

      // The < character must be escaped
      expect(serialized).not.toContain('<');
      // The > character must be escaped
      expect(serialized).not.toContain('>');
    });

    it(`must round-trip correctly: ${payload.slice(0, 50)}`, () => {
      const data = { text: payload };
      const serialized = serializeForHtmlScript(data);
      // When the browser parses the escape sequences, it should get back the original
      const roundTripped = JSON.parse(serialized);
      expect(roundTripped.text).toBe(payload);
    });
  }

  it('must escape ALL < characters (not just some)', () => {
    const data = { a: '<', b: '<<', c: '<<<', d: 'a<b<c' };
    const serialized = serializeForHtmlScript(data);
    expect(serialized).not.toContain('<');
    // But should contain \u003c
    expect(serialized).toContain('\\u003c');
    // Round-trip must work
    expect(JSON.parse(serialized)).toEqual(data);
  });

  it('must escape ALL > characters', () => {
    const data = { a: '>', b: '>>', c: '>>>', d: 'a>b>c' };
    const serialized = serializeForHtmlScript(data);
    expect(serialized).not.toContain('>');
    expect(serialized).toContain('\\u003e');
    expect(JSON.parse(serialized)).toEqual(data);
  });

  it('must escape ALL / characters', () => {
    const data = { a: '/', b: '//', c: '</script>' };
    const serialized = serializeForHtmlScript(data);
    expect(serialized).not.toContain('/');
    // The / in </script> should be escaped too
    expect(serialized).toContain('\\u002f');
    expect(JSON.parse(serialized)).toEqual(data);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: SERIALIZATION — Special character payloads
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — special characters', () => {
  for (const { payload, name } of SPECIAL_CHAR_PAYLOADS) {
    it(`${name}: must not produce literal </script> and must round-trip`, () => {
      const data = { text: payload };
      const serialized = serializeForHtmlScript(data);

      // Must never produce literal </script>
      expect(serialized.toLowerCase()).not.toContain('</script>');
      expect(serialized.toLowerCase()).not.toContain('<script>');

      // Must round-trip correctly
      const roundTripped = JSON.parse(serialized);
      expect(roundTripped.text).toBe(payload);
    });
  }

  it('U+2028 Line Separator must be safely encoded', () => {
    const payload = 'line1\u2028line2';
    const serialized = serializeForHtmlScript({ text: payload });

    // JSON.stringify in Node v24 does NOT escape U+2028
    // Our canonical serializer MUST explicitly escape it
    expect([...serialized].some(c => c.charCodeAt(0) === 0x2028)).toBe(false);
    // Must contain the escaped version
    expect(serialized).toContain('\\u2028');
    // Must round-trip
    expect(JSON.parse(serialized).text).toBe(payload);
  });

  it('U+2029 Paragraph Separator must be safely encoded', () => {
    const payload = 'para1\u2029para2';
    const serialized = serializeForHtmlScript({ text: payload });

    // JSON.stringify in Node v24 does NOT escape U+2029
    // Our canonical serializer MUST explicitly escape it
    expect([...serialized].some(c => c.charCodeAt(0) === 0x2029)).toBe(false);
    expect(serialized).toContain('\\u2029');
    expect(JSON.parse(serialized).text).toBe(payload);
  });

  it('& ampersand is now escaped by canonical serializer', () => {
    const data = { text: 'a & b' };
    const serialized = serializeForHtmlScript(data);
    // Canonical function NOW escapes &
    expect(serialized).not.toContain('&');
    expect(serialized).toContain('\\u0026');
    // Must round-trip
    expect(JSON.parse(serialized).text).toBe('a & b');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: SERIALIZATION — Full XSS payloads in all data fields
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — XSS payloads in export data fields', () => {
  // Simulate the full export data structure with payloads in every field
  const xssValue = '</script><script>window.__quizXss = 999</script>';

  it('payloads in project title must not produce literal </script>', () => {
    const data = {
      meta: { judulPertemuan: xssValue, mapel: xssValue, kelas: xssValue },
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized.toLowerCase()).not.toContain('<script>');
    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
  });

  it('payloads in page data must not produce literal </script>', () => {
    const data = {
      pages: [
        { id: xssValue, label: xssValue, templateType: 'custom' },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
  });

  it('payloads in quiz data must not produce literal </script>', () => {
    const data = {
      allKuis: [
        {
          id: xssValue,
          pertanyaan: xssValue,
          pilihan: [xssValue, xssValue, xssValue, xssValue],
          jawaban: xssValue,
          penjelasan: xssValue,
        },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
  });

  it('payloads in TF data must not produce literal </script>', () => {
    const data = {
      allKuis: [
        {
          id: xssValue,
          type: 'true-false',
          pertanyaan: xssValue,
          correct: xssValue,
          penjelasan: xssValue,
        },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
  });

  it('payloads in fill-blank data must not produce literal </script>', () => {
    const data = {
      allKuis: [
        {
          id: xssValue,
          type: 'fill-blank',
          pertanyaan: xssValue,
          jawaban: xssValue,
          hint: xssValue,
        },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
  });

  it('payloads in game data must not produce literal </script>', () => {
    const data = {
      games: [
        { id: xssValue, type: 'sortir', title: xssValue, items: [xssValue] },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
  });

  it('payloads in block content must not produce literal </script>', () => {
    const data = {
      pages: [
        {
          elements: [
            { type: 'tp', content: xssValue },
            { type: 'def-box', content: xssValue },
            { type: 'materi', content: xssValue },
          ],
        },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
  });

  it('ALL XSS payloads must be safely serialized', () => {
    for (const payload of XSS_FULL_PAYLOADS) {
      const data = { text: payload };
      const serialized = serializeForHtmlScript(data);
      expect(serialized.toLowerCase()).not.toContain('</script>');
      expect(serialized.toLowerCase()).not.toContain('<script>');
      expect(serialized).not.toContain('<');
      expect(serialized).not.toContain('>');
    }
  });

  it('combined: U+2028/U+2029 + script termination in all fields', () => {
    const payload = '\u2028</script><script>window.__quizXss = 500</script>\u2029';
    const data = {
      meta: { judulPertemuan: payload },
      pages: [{ id: payload, label: payload }],
      allKuis: [{ pertanyaan: payload, penjelasan: payload }],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(serialized).not.toContain('<');
    // Round-trip must work
    const roundTripped = JSON.parse(serialized);
    expect(roundTripped.meta.judulPertemuan).toBe(payload);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: INJECTION CONTEXT VERIFICATION
// Verify that the injected <script> tag is well-formed
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — injection context verification', () => {
  it('produced script tag must be parseable as valid JavaScript', () => {
    const payload = '</script><script>window.__quizXss = 999</script>';
    const data = { test: payload, number: 42 };
    const serialized = serializeForHtmlScript(data);
    const scriptTag = `window.__EXPORT_DATA__=${serialized};`;

    // This must be valid JavaScript — if it throws, the serialization broke
    expect(() => {
      // Use Function constructor to test if it's parseable JS
      // (we can't use eval in strict mode tests, but Function works)
      new Function(scriptTag);
    }).not.toThrow();
  });

  it('produced script tag must round-trip data correctly', () => {
    const payload = '</script><script>window.__quizXss = 999</script>';
    const originalData = {
      test: payload,
      nested: { deep: { value: payload } },
      array: [payload, 1, true, null],
    };
    const serialized = serializeForHtmlScript(originalData);

    // Extract value as if we were the browser
    const scriptContent = `window.__EXPORT_DATA__=${serialized};`;
    // Simulate what the browser does: parse the JS, then read the variable
    const extracted = new Function(scriptContent + ' return window.__EXPORT_DATA__;')();
    expect(extracted).toEqual(originalData);
  });

  it('must not create new HTML elements when inserted into DOM', () => {
    const payload = '</script><img src=x onerror="window.__quizXss=1"><script>window.__quizXss=2</script>';
    const data = { evil: payload };
    const serialized = serializeForHtmlScript(data);
    const scriptTag = `<script>window.__EXPORT_DATA__=${serialized};</script>`;

    // Parse as HTML and check no dangerous elements were created
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<html><body>${scriptTag}</body></html>`,
      'text/html'
    );

    // Should NOT have extra <script> elements beyond our injected one
    const scripts = doc.querySelectorAll('script');
    // Only 1 script tag (our injected one)
    expect(scripts.length).toBe(1);

    // Should NOT have img elements from payload
    const imgs = doc.querySelectorAll('img[onerror]');
    expect(imgs.length).toBe(0);

    // Should NOT have any element with onerror
    const onerrorEls = doc.querySelectorAll('[onerror]');
    expect(onerrorEls.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5: TITLE INJECTION VERIFICATION
// The <title> replacement is a separate injection boundary
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — <title> injection', () => {
  it('title with script-termination payload must be HTML-entity encoded', () => {
    const title = '</script><script>window.__quizXss = 600</script>';
    // This is what the route does: replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    expect(safeTitle).not.toContain('<');
    expect(safeTitle).not.toContain('>');
    expect(safeTitle).toContain('&lt;');
    expect(safeTitle).toContain('&gt;');
  });

  it('title with XSS payload must not create executable content in DOM', () => {
    const title = '<script>window.__quizXss = 601</script><img src=x onerror=alert(1)>';
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const html = `<html><head><title>${safeTitle}</title></head><body></body></html>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Title element should have the escaped content as text, not as HTML
    expect(doc.querySelector('title')?.textContent).toBe(title);
    // No script elements should exist in the document
    expect(doc.querySelectorAll('script').length).toBe(0);
    // No img elements should exist
    expect(doc.querySelectorAll('img').length).toBe(0);
  });

  it('title with double-quote must not break out of HTML attribute', () => {
    const title = 'Test" onclick="alert(1)" data-foo="';
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // When used in <title>${safeTitle}</title>, double quotes are not an issue
    // (title is an element, not an attribute)
    // But the route also uses filename with Content-Disposition header
    expect(safeTitle).not.toContain('"');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6: CANONICAL SERIALIZER — serializeForHtmlScript
// Verify the canonical serializer covers ALL OWASP-required characters
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — canonical serializeForHtmlScript', () => {
  it('canonical serializer escapes <, >, / (same as legacy)', () => {
    const payload = '</script><script>alert(1)</script>';
    const canonical = serializeForHtmlScript({ t: payload });
    const legacy = serializeForScriptLegacy({ t: payload });

    // Both should produce the same <, >, / escaping
    expect(canonical).toContain('\\u003c');
    expect(canonical).toContain('\\u003e');
    expect(canonical).toContain('\\u002f');

    // Legacy also handles these (but not & or U+2028/U+2029)
    expect(legacy).toContain('\\u003c');
    expect(legacy).toContain('\\u003e');
    expect(legacy).toContain('\\u002f');

    // Both should round-trip correctly
    expect(JSON.parse(canonical)).toEqual(JSON.parse(legacy));
  });

  it('canonical serializer additionally escapes & (legacy does NOT)', () => {
    const payload = 'a & b < c';
    const canonical = serializeForHtmlScript({ t: payload });
    const legacy = serializeForScriptLegacy({ t: payload });

    // Legacy: & is NOT escaped
    expect(legacy).toContain('&');
    // Canonical: & IS escaped
    expect(canonical).not.toContain('&');
    expect(canonical).toContain('\\u0026');

    // Both must round-trip to the same value
    expect(JSON.parse(canonical)).toEqual(JSON.parse(legacy));
  });

  it('canonical serializer additionally escapes U+2028 and U+2029', () => {
    const payload = 'line1\u2028line2\u2029line3';
    const canonical = serializeForHtmlScript({ t: payload });
    const legacy = serializeForScriptLegacy({ t: payload });

    // Legacy: U+2028/U+2029 are NOT escaped (passes through as literal chars)
    expect([...legacy].some(c => c.charCodeAt(0) === 0x2028)).toBe(true);
    expect([...legacy].some(c => c.charCodeAt(0) === 0x2029)).toBe(true);

    // Canonical: MUST NOT contain literal U+2028 or U+2029
    expect([...canonical].some(c => c.charCodeAt(0) === 0x2028)).toBe(false);
    expect([...canonical].some(c => c.charCodeAt(0) === 0x2029)).toBe(false);
    // Must contain the escaped versions
    expect(canonical).toContain('\\u2028');
    expect(canonical).toContain('\\u2029');

    // Must round-trip correctly
    expect(JSON.parse(canonical).t).toBe(payload);
  });

  it('canonical serializer handles all payload types combined', () => {
    const payload = '</script>\u2028\u2029&<>"\'';
    const canonical = serializeForHtmlScript({ t: payload });

    // No dangerous characters should remain unescaped
    expect(canonical).not.toContain('<');
    expect(canonical).not.toContain('>');
    expect(canonical).not.toContain('/');
    expect(canonical).not.toContain('&');
    expect([...canonical].some(c => c.charCodeAt(0) === 0x2028)).toBe(false);
    expect([...canonical].some(c => c.charCodeAt(0) === 0x2029)).toBe(false);

    // Must round-trip
    expect(JSON.parse(canonical).t).toBe(payload);
  });

  it('canonical serializer output is valid JavaScript', () => {
    const payload = '</script>\u2028\u2029&<>"\'';
    const canonical = serializeForHtmlScript({ t: payload });
    const scriptTag = `window.__EXPORT_DATA__=${canonical};`;

    // Must be parseable as valid JavaScript
    expect(() => { new Function(scriptTag); }).not.toThrow();
  });

  it('canonical serializer output round-trips via Function constructor', () => {
    const payload = '</script>\u2028\u2029&<>"\'';
    const originalData = { t: payload, nested: { v: payload }, arr: [payload] };
    const canonical = serializeForHtmlScript(originalData);
    const scriptTag = `window.__EXPORT_DATA__=${canonical};`;
    const extracted = new Function(scriptTag + ' return window.__EXPORT_DATA__;')();
    expect(extracted).toEqual(originalData);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7: LEGACY EXPORT PATH — generateClientExportHtml
// Verify the legacy path uses the same serialization
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — legacy generateClientExportHtml', () => {
  const xssPayload = '</script><script>window.__quizXss = 701</script>';

  it('legacy export must not produce literal </script> in output HTML', () => {
    const payload: ClientExportPayload = {
      pages: [
        {
          id: 'page-1',
          label: xssPayload,
          templateType: 'custom',
          bgColor: '#ffffff',
          overlay: 0,
          elements: [],
          navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
          templateData: {},
        },
      ],
      ratioId: '16:9',
      meta: { judulPertemuan: xssPayload, mapel: xssPayload, kelas: xssPayload },
      allKuis: [],
      allModules: [],
      games: [],
      cp: {},
      tp: [],
      atp: { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: [],
      materi: { blok: [] },
      skenario: [],
      petunjuk: { title: '', intro: '', langkah: [] },
      diskusi: { title: '', intro: '', pertanyaan: [] },
      refleksi: { title: '', intro: '', pertanyaan: [] },
      penutup: { title: '', subjudul: '', preview: [] },
      suara: { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    const html = generateClientExportHtml(payload);

    // The generated HTML must NOT contain literal </script> from the payload
    // that would break the __EXPORT_DATA__ script tag.
    // Strategy: find the __EXPORT_DATA__ script content and verify it's safe.
    // We extract between the opening <script> and the closing </script> that
    // wraps __EXPORT_DATA__.
    const scriptStart = html.indexOf('<script>window.__EXPORT_DATA__=');
    expect(scriptStart).not.toBe(-1);
    const scriptContentStart = scriptStart + '<script>'.length; // after <script>
    const scriptEnd = html.indexOf('</script>', scriptContentStart);
    expect(scriptEnd).not.toBe(-1);
    const scriptBody = html.substring(scriptContentStart, scriptEnd);

    // Extract the JSON part: window.__EXPORT_DATA__={...};
    const jsonStart = 'window.__EXPORT_DATA__='.length;
    const jsonStr = scriptBody.substring(jsonStart);
    // Remove trailing semicolon if present
    const jsonClean = jsonStr.endsWith(';') ? jsonStr.slice(0, -1) : jsonStr;

    // The JSON content must not contain literal < or > (they should be escaped)
    expect(jsonClean).not.toContain('<');
    expect(jsonClean).not.toContain('>');

    // But the data must round-trip correctly
    const parsed = JSON.parse(jsonClean);
    expect(parsed.meta.judulPertemuan).toBe(xssPayload);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 8: PRODUCTION API ROUTE — Simulate exact route behavior
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — production API route simulation', () => {
  // Simulate the exact code path from route.ts
  function simulateApiExport(body: Record<string, unknown>): string {
    const exportData = {
      pages: body.pages || [],
      ratioId: body.ratioId || '16:9',
      meta: body.meta || {},
      allKuis: body.allKuis || [],
      allModules: body.allModules || [],
      games: body.games || [],
      cp: body.cp || {},
      tp: body.tp || [],
      atp: body.atp || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
      alur: body.alur || [],
      materi: body.materi || { blok: [] },
      skenario: body.skenario || [],
      petunjuk: body.petunjuk || { title: '', intro: '', langkah: [] },
      diskusi: body.diskusi || { title: '', intro: '', pertanyaan: [] },
      refleksi: body.refleksi || { title: '', intro: '', pertanyaan: [] },
      penutup: body.penutup || { title: '', subjudul: '', preview: [] },
      suara: body.suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
    };

    // Exact serialization from route.ts
    const dataJson = JSON.stringify(exportData)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\//g, '\\u002f');

    // Title handling from route.ts
    const meta = body.meta as Record<string, string> | undefined;
    const title = `${meta?.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta?.mapel || ''} ${meta?.kelas || ''}`;
    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Template simulation (simplified)
    const templateStr = '<!DOCTYPE html><html><head><title>PLACEHOLDER</title></head><body><div id="root"></div></body></html>';
    const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;
    const bodyCloseIdx = templateStr.lastIndexOf('</body>');
    const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
    const after = templateStr.substring(bodyCloseIdx);
    return before + dataScript + after;
  }

  const xssPayload = '</script><script>window.__quizXss = 801</script>';

  it('production output must have exactly one <script> for __EXPORT_DATA__', () => {
    const html = simulateApiExport({
      pages: [{ id: 'p1', label: xssPayload }],
      meta: { judulPertemuan: xssPayload },
    });

    // Count all <script> tags — should be exactly 1 (our injected one)
    const scriptMatches = html.match(/<script>/gi);
    expect(scriptMatches?.length).toBe(1);
  });

  it('production output must not have <img onerror> from payload', () => {
    const imgPayload = '</script><img src=x onerror="window.__quizXss = 802">';
    const html = simulateApiExport({
      pages: [{ id: 'p1', label: imgPayload }],
      meta: { judulPertemuan: imgPayload },
    });

    // The <img onerror> from the payload must NOT be a real DOM element.
    // The word 'onerror' may appear in the title (HTML-encoded text) or in
    // the JSON data (unicode-escaped), but it must not be an actual attribute.
    // Verify by parsing the DOM.
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // No <img> elements should exist in the document (the payload's img is just text)
    expect(doc.querySelectorAll('img').length).toBe(0);
    // No elements should have onerror attributes
    expect(doc.querySelectorAll('[onerror]').length).toBe(0);
  });

  it('production output data must round-trip correctly', () => {
    const originalData = {
      pages: [{ id: 'p1', label: xssPayload }],
      meta: { judulPertemuan: xssPayload, mapel: 'Math', kelas: '7' },
      allKuis: [{ pertanyaan: xssPayload, penjelasan: xssPayload }],
    };
    const html = simulateApiExport(originalData);

    // Extract the __EXPORT_DATA__ and verify it round-trips
    const dataMatch = html.match(/window\.__EXPORT_DATA__=([^;]+);/);
    expect(dataMatch).not.toBeNull();
    const parsed = JSON.parse(dataMatch![1]);

    expect(parsed.meta.judulPertemuan).toBe(xssPayload);
    expect(parsed.allKuis[0].pertanyaan).toBe(xssPayload);
  });

  it('production title must be HTML-entity encoded', () => {
    const html = simulateApiExport({
      meta: { judulPertemuan: '<script>alert(1)</script>' },
    });

    // Title should have &lt; not <
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    expect(titleMatch).not.toBeNull();
    expect(titleMatch![1]).toContain('&lt;');
    expect(titleMatch![1]).not.toContain('<script>');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 9: DETERMINISTIC VERIFICATION
// Same data → same serialized output (no randomness in escaping)
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — deterministic output', () => {
  it('same data produces identical serialized output', () => {
    const data = {
      text: '</script><script>alert(1)</script>',
      nested: { value: 'test & more < less > slash /' },
    };
    const serialized1 = serializeForHtmlScript(data);
    const serialized2 = serializeForHtmlScript(data);
    expect(serialized1).toBe(serialized2);
  });

  it('different data produces different serialized output', () => {
    const data1 = { text: 'payload A' };
    const data2 = { text: 'payload B' };
    expect(serializeForHtmlScript(data1)).not.toBe(serializeForHtmlScript(data2));
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 10: EDGE CASES — Deeply nested, large, empty, null
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — edge cases', () => {
  it('deeply nested payloads must be safely serialized', () => {
    const data = {
      level1: {
        level2: {
          level3: {
            level4: {
              payload: '</script><script>window.__quizXss = 901</script>',
            },
          },
        },
      },
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(JSON.parse(serialized).level1.level2.level3.level4.payload).toContain('</script>');
  });

  it('null and undefined fields must serialize safely', () => {
    const data = { a: null, b: undefined, c: '' };
    const serialized = serializeForHtmlScript(data);
    // undefined becomes omitted by JSON.stringify
    const parsed = JSON.parse(serialized);
    expect(parsed.a).toBeNull();
    expect(parsed.b).toBeUndefined();
    expect(parsed.c).toBe('');
  });

  it('empty string must serialize safely', () => {
    const data = { text: '' };
    const serialized = serializeForHtmlScript(data);
    expect(JSON.parse(serialized).text).toBe('');
  });

  it('very long payload string must not cause performance issues', () => {
    const longPayload = '</script>'.repeat(1000);
    const data = { text: longPayload };
    const start = performance.now();
    const serialized = serializeForHtmlScript(data);
    const elapsed = performance.now() - start;
    // Should complete in under 100ms even for long strings
    expect(elapsed).toBeLessThan(100);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    expect(JSON.parse(serialized).text).toBe(longPayload);
  });

  it('payload in array elements must be safely serialized', () => {
    const data = {
      items: [
        '</script><script>window.__quizXss = 910</script>',
        'normal text',
        42,
        true,
        null,
        { nested: '</script><script>window.__quizXss = 911</script>' },
      ],
    };
    const serialized = serializeForHtmlScript(data);
    expect(serialized.toLowerCase()).not.toContain('</script>');
    const parsed = JSON.parse(serialized);
    expect(parsed.items[0]).toContain('</script>');
    expect(parsed.items[5].nested).toContain('</script>');
  });

  it('unicode escape sequences in payload must not interfere with our escaping', () => {
    const data = { text: '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e' };
    const serialized = serializeForHtmlScript(data);
    // This is a JavaScript string containing literal backslash-u sequences
    // Our escaping should handle the real < > / characters, not the \u sequences
    expect(JSON.parse(serialized).text).toBe('\\u003cscript\\u003ealert(1)\\u003c/script\\u003e');
  });
});
