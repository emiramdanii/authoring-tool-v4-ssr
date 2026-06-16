// ═══════════════════════════════════════════════════════════════════════
// EXPORT SERIALIZATION BOUNDARY — Sprint 6.4-F Freeze
// ═══════════════════════════════════════════════════════════════════════
// Tests the JSON → HTML <script> injection boundary for the production
// export route. This is the canonical security regression suite.
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
//
// ⛔ INVARIANT: serializeForHtmlScript() is the canonical security
// boundary. Any change to this function MUST pass all tests in
// this file. No second serializer with different rules may be
// created. No route may use JSON.stringify() directly for HTML
// <script> injection.
// ═══════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { serializeForHtmlScript } from '@/lib/export/serialize-html-script';

// ═══════════════════════════════════════════════════════════════════════
// SECTION A: PAYLOAD DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

// Script-termination payloads — the primary attack: break out of <script> tag
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

// JavaScript/JSON special character payloads
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

// Full XSS payload set (from OWASP + Senior's spec)
const XSS_FULL_PAYLOADS = [
  // Script injection
  '<script>window.__quizXss = 301</script>',
  // Event handler injection
  '<img src=x onerror="window.__quizXss = 302">',
  '<svg onload="window.__quizXss = 303">',
  '<body onload="window.__quizXss = 304">',
  '<iframe src="javascript:window.__quizXss = 305">',
  // JavaScript protocol
  '<a href="javascript:window.__quizXss = 306">click</a>',
  // Data URI
  '<a href="data:text/html,<script>window.__quizXss=307</script>">click</a>',
  // SVG-based
  '<svg><script>window.__quizXss = 308</script></svg>',
  // CSS expression (IE legacy)
  '<div style="width:expression(window.__quizXss=309)">',
  // Event handler in various elements
  '<input onfocus="window.__quizXss = 310" autofocus>',
  '<marquee onstart="window.__quizXss = 311">',
  '<details ontoggle="window.__quizXss = 312" open>',
  // Encoded variations
  '&#60;script&#62;window.__quizXss = 313&#60;/script&#62;',
  '%3Cscript%3Ewindow.__quizXss = 314%3C/script%3E',
  // Template literal injection
  '${window.__quizXss = 315}',
  // Prototype pollution via __proto__
  '__proto__: { poisoned: true }',
  // Constructor injection
  'constructor: { prototype: { poisoned: true } }',
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

  it('& ampersand must be escaped', () => {
    const data = { text: 'a & b' };
    const serialized = serializeForHtmlScript(data);
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
  it('canonical serializer escapes <, >, /, &, U+2028, U+2029', () => {
    const payload = '</script><script>alert(1)</script>';
    const canonical = serializeForHtmlScript({ t: payload });

    // Must produce the OWASP-required Unicode escapes
    expect(canonical).toContain('\\u003c');
    expect(canonical).toContain('\\u003e');
    expect(canonical).toContain('\\u002f');

    // Must round-trip correctly
    expect(JSON.parse(canonical).t).toBe(payload);
  });

  it('canonical serializer escapes & (OWASP defense-in-depth)', () => {
    const payload = 'a & b < c';
    const canonical = serializeForHtmlScript({ t: payload });

    // & IS escaped by canonical serializer
    expect(canonical).not.toContain('&');
    expect(canonical).toContain('\\u0026');

    // Must round-trip
    expect(JSON.parse(canonical).t).toBe(payload);
  });

  it('canonical serializer escapes U+2028 and U+2029', () => {
    const payload = 'line1\u2028line2\u2029line3';
    const canonical = serializeForHtmlScript({ t: payload });

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
// SECTION 7: PRODUCTION API ROUTE — Simulate exact route behavior
// Uses serializeForHtmlScript() just like the real route
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

    // Exact serialization from route.ts — uses canonical serializer
    const dataJson = serializeForHtmlScript(exportData);

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
// SECTION 8: DETERMINISTIC VERIFICATION
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
// SECTION 9: EDGE CASES — Deeply nested, large, empty, null
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

// ═══════════════════════════════════════════════════════════════════════
// SECTION 10: SERIALIZER FREEZE GUARD
// These tests MUST pass after ANY change to serializeForHtmlScript.
// If they fail, the serializer has been modified unsafely.
// ═══════════════════════════════════════════════════════════════════════

describe('Serialization boundary — serializer freeze guard', () => {
  it('must escape < to \\u003c (not any other form)', () => {
    const serialized = serializeForHtmlScript({ t: '<' });
    expect(serialized).toContain('\\u003c');
    expect(serialized).not.toContain('<');
  });

  it('must escape > to \\u003e (not any other form)', () => {
    const serialized = serializeForHtmlScript({ t: '>' });
    expect(serialized).toContain('\\u003e');
    expect(serialized).not.toContain('>');
  });

  it('must escape / to \\u002f (not any other form)', () => {
    const serialized = serializeForHtmlScript({ t: '/' });
    expect(serialized).toContain('\\u002f');
    expect(serialized).not.toContain('/');
  });

  it('must escape & to \\u0026 (not any other form)', () => {
    const serialized = serializeForHtmlScript({ t: '&' });
    expect(serialized).toContain('\\u0026');
    expect(serialized).not.toContain('&');
  });

  it('must escape U+2028 to \\u2028', () => {
    const serialized = serializeForHtmlScript({ t: '\u2028' });
    expect(serialized).toContain('\\u2028');
    expect([...serialized].some(c => c.charCodeAt(0) === 0x2028)).toBe(false);
  });

  it('must escape U+2029 to \\u2029', () => {
    const serialized = serializeForHtmlScript({ t: '\u2029' });
    expect(serialized).toContain('\\u2029');
    expect([...serialized].some(c => c.charCodeAt(0) === 0x2029)).toBe(false);
  });

  it('the full OWASP escape set must be present (6 replacements)', () => {
    // This test verifies the complete escape chain exists.
    // If any replacement is removed, this test will fail.
    const data = '<>&/\u2028\u2029';
    const serialized = serializeForHtmlScript(data);

    // All 6 dangerous characters must be escaped
    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).not.toContain('&');
    expect(serialized).not.toContain('/');
    expect([...serialized].some(c => c.charCodeAt(0) === 0x2028)).toBe(false);
    expect([...serialized].some(c => c.charCodeAt(0) === 0x2029)).toBe(false);

    // All 6 escape sequences must be present
    expect(serialized).toContain('\\u003c');
    expect(serialized).toContain('\\u003e');
    expect(serialized).toContain('\\u0026');
    expect(serialized).toContain('\\u002f');
    expect(serialized).toContain('\\u2028');
    expect(serialized).toContain('\\u2029');

    // Must round-trip
    expect(JSON.parse(serialized)).toBe(data);
  });
});
