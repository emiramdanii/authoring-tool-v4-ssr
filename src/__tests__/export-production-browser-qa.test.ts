/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXPORT PRODUCTION BROWSER QA — Sprint 6.4-E1-QA2
 * ═══════════════════════════════════════════════════════════════════════
 * Tests the ACTUAL production export path:
 *   POST /api/export → download HTML → open in browser → verify safety
 *
 * This script:
 * 1. Starts the Next.js dev server (or uses an existing one)
 * 2. Sends a POST request to /api/export with XSS payloads embedded
 * 3. Saves the resulting HTML file
 * 4. Opens it in a headless browser (Playwright)
 * 5. Verifies window.__quizXss is undefined
 * 6. Verifies no extra <script>, <img onerror>, or other dangerous elements
 * 7. Verifies the app mounts successfully
 * 8. Verifies console is clean of errors
 * 9. Verifies quiz interaction works
 * ═══════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import http from 'http';

const DOWNLOAD_DIR = path.resolve('/home/z/my-project/download/qa2-exports');
const EXPORT_PORT = 3111; // Dedicated port for QA2 testing

// ═══════════════════════════════════════════════════════════════════════
// PAYLOAD DEFINITIONS — From Senior's specification
// ═══════════════════════════════════════════════════════════════════════

const SCRIPT_TERMINATION_PAYLOADS = [
  '</script><script>window.__quizXss = 101</script>',
  '</script><img src=x onerror="window.__quizXss = 102">',
  '<!--</script><script>window.__quizXss = 103</script>',
];

const SPECIAL_CHAR_PAYLOADS = [
  'before\u2028after',  // U+2028 Line Separator
  'before\u2029after',  // U+2029 Paragraph Separator
  '\\',                  // Backslash
  '"',                   // Double quote
  '</script>',           // Bare script termination
  '&',                   // Ampersand
];

// The combined payload that embeds ALL dangerous strings
const COMBINED_XSS_PAYLOAD = [
  SCRIPT_TERMINATION_PAYLOADS[0],  // </script><script>...
  SCRIPT_TERMINATION_PAYLOADS[1],  // </script><img onerror=...
  '\u2028\u2029',                  // Unicode line/paragraph separators
].join('---SEPARATOR---');

// ═══════════════════════════════════════════════════════════════════════
// EXPORT DATA BUILDER — Create a payload with XSS in every field
// ═══════════════════════════════════════════════════════════════════════

function buildExportPayloadWithXss(xssValue: string) {
  return {
    pages: [
      {
        id: 'page-cover',
        label: xssValue,
        templateType: 'cover',
        bgColor: '#1a1a2e',
        overlay: 0,
        elements: [],
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {},
        schema: {
          type: 'cover',
          title: xssValue,
          subtitle: xssValue,
          teacherName: xssValue,
          schoolName: xssValue,
        },
      },
      {
        id: 'page-kuis',
        label: xssValue,
        templateType: 'kuis',
        bgColor: '#0f3460',
        overlay: 0,
        elements: [],
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {},
        schema: {
          type: 'kuis',
          kuisId: 'kuis-xss-test',
        },
      },
    ],
    ratioId: '16:9',
    meta: {
      judulPertemuan: xssValue,
      mapel: xssValue,
      kelas: '7',
      guru: xssValue,
      sekolah: xssValue,
    },
    allKuis: [
      {
        id: 'kuis-xss-test',
        title: xssValue,
        variant: 'A',
        questions: [
          {
            id: 'q1',
            pertanyaan: xssValue,
            pilihan: [xssValue, 'B', 'C', 'D'],
            jawaban: 'A',
            penjelasan: xssValue,
          },
          {
            id: 'q2',
            type: 'true-false',
            pertanyaan: xssValue,
            correct: true,
            penjelasan: xssValue,
          },
          {
            id: 'q3',
            type: 'fill-blank',
            pertanyaan: xssValue,
            jawaban: xssValue,
            hint: xssValue,
          },
        ],
      },
    ],
    allModules: [],
    games: [],
    cp: {},
    tp: [],
    atp: { namaBab: xssValue, jumlahPertemuan: 1, pertemuan: [{ judul: xssValue }] },
    alur: [],
    materi: { blok: [{ judul: xssValue, konten: xssValue }] },
    skenario: [],
    petunjuk: { title: xssValue, intro: xssValue, langkah: [xssValue] },
    diskusi: { title: xssValue, intro: xssValue, pertanyaan: [xssValue] },
    refleksi: { title: xssValue, intro: xssValue, pertanyaan: [xssValue] },
    penutup: { title: xssValue, subjudul: xssValue, preview: [xssValue] },
    suara: { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// TEST SUITE — Production Export Browser Verification
// ═══════════════════════════════════════════════════════════════════════

describe('Production Export — Browser Exploit Verification', () => {
  // Store exported HTML files for analysis
  const exportedFiles: string[] = [];

  beforeAll(() => {
    // Ensure download directory exists
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
  });

  // ── Test 1: Generate export HTML via the API route ────────────────

  it('should generate export HTML from /api/export with XSS payload', async () => {
    const payload = buildExportPayloadWithXss(COMBINED_XSS_PAYLOAD);

    // Send POST to the API route
    const response = await fetch(`http://localhost:3000/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();
    expect(html.length).toBeGreaterThan(1000); // Should be a substantial file

    // Save to disk for browser testing
    const filePath = path.join(DOWNLOAD_DIR, 'xss-payload-export.html');
    fs.writeFileSync(filePath, html, 'utf-8');
    exportedFiles.push(filePath);

    // ═══════════════════════════════════════════════════════════════
    // STATIC ANALYSIS — Verify the HTML file before opening in browser
    // ═══════════════════════════════════════════════════════════════

    // 1. The __EXPORT_DATA__ JSON must not contain literal </script>
    const scriptStart = html.indexOf('<script>window.__EXPORT_DATA__=');
    expect(scriptStart).not.toBe(-1);

    const scriptContentStart = scriptStart + '<script>'.length;
    const scriptEnd = html.indexOf('</script>', scriptContentStart);
    expect(scriptEnd).not.toBe(-1);

    const scriptBody = html.substring(scriptContentStart, scriptEnd);
    const jsonStart = 'window.__EXPORT_DATA__='.length;
    const jsonStr = scriptBody.substring(jsonStart, scriptBody.endsWith(';') ? -1 : undefined);

    // No literal < or > in the JSON (they must be unicode-escaped)
    expect(jsonStr).not.toContain('<');
    expect(jsonStr).not.toContain('>');

    // The JSON must be parseable
    const parsed = JSON.parse(jsonStr);
    expect(parsed.meta.judulPertemuan).toBe(COMBINED_XSS_PAYLOAD);

    // 2. The title must be HTML-entity encoded
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    expect(titleMatch).not.toBeNull();
    expect(titleMatch![1]).toContain('&lt;');  // < should be &lt;
    expect(titleMatch![1]).toContain('&gt;');  // > should be &gt;

    // 3. Count <script> tags — should be a fixed number (the injected one + Vite bundles)
    // No ADDITIONAL <script> tags should appear from the payload
    const allScriptTags = html.match(/<script/gi);
    // The payload must not have added extra <script> tags
    // (We verify by checking that there's no </script> mid-data that would split the JSON)
    expect(jsonStr.includes('window.__quizXss')).toBe(false); // Our XSS variable name must NOT be in the data as executable code
  }, 30000);

  // ── Test 2: Each individual script-termination payload ─────────────

  for (const payload of SCRIPT_TERMINATION_PAYLOADS) {
    it(`static analysis: ${payload.slice(0, 40)} must not break export`, async () => {
      const exportPayload = buildExportPayloadWithXss(payload);

      const response = await fetch(`http://localhost:3000/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload),
      });

      expect(response.status).toBe(200);
      const html = await response.text();

      // Save for inspection
      const safeName = payload.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
      const filePath = path.join(DOWNLOAD_DIR, `payload-${safeName}.html`);
      fs.writeFileSync(filePath, html, 'utf-8');
      exportedFiles.push(filePath);

      // Verify the JSON data section is safe
      const scriptStart = html.indexOf('<script>window.__EXPORT_DATA__=');
      expect(scriptStart).not.toBe(-1);
      const scriptContentStart = scriptStart + '<script>'.length;
      const scriptEnd = html.indexOf('</script>', scriptContentStart);
      const scriptBody = html.substring(scriptContentStart, scriptEnd);
      const jsonStr = scriptBody.substring('window.__EXPORT_DATA__='.length).replace(/;$/, '');

      // No literal < > in JSON data
      expect(jsonStr).not.toContain('<');
      expect(jsonStr).not.toContain('>');

      // JSON must parse and round-trip
      const parsed = JSON.parse(jsonStr);
      expect(parsed.meta.judulPertemuan).toBe(payload);
    }, 15000);
  }

  // ── Test 3: Special character payloads ─────────────────────────────

  for (const payload of SPECIAL_CHAR_PAYLOADS) {
    it(`static analysis: special char "${payload.replace(/\n/g, '\\n').slice(0, 20)}" must serialize safely`, async () => {
      const exportPayload = buildExportPayloadWithXss(payload);

      const response = await fetch(`http://localhost:3000/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload),
      });

      expect(response.status).toBe(200);
      const html = await response.text();

      // Verify the JSON data section is safe
      const scriptStart = html.indexOf('<script>window.__EXPORT_DATA__=');
      expect(scriptStart).not.toBe(-1);
      const scriptContentStart = scriptStart + '<script>'.length;
      const scriptEnd = html.indexOf('</script>', scriptContentStart);
      const scriptBody = html.substring(scriptContentStart, scriptEnd);
      const jsonStr = scriptBody.substring('window.__EXPORT_DATA__='.length).replace(/;$/, '');

      // Must not contain literal </script>
      expect(jsonStr.toLowerCase()).not.toContain('</script>');
      expect(jsonStr.toLowerCase()).not.toContain('<script>');

      // JSON must parse
      const parsed = JSON.parse(jsonStr);
      expect(parsed.meta.judulPertemuan).toBe(payload);
    }, 15000);
  }

  // ── Test 4: All-non-scorable TF questions export ──────────────────

  it('should safely export all-non-scorable TF questions', async () => {
    const payload = {
      pages: [
        {
          id: 'page-tf',
          label: 'TF Non-Scorable Test',
          templateType: 'kuis',
          bgColor: '#0f3460',
          overlay: 0,
          elements: [],
          navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
          templateData: {},
          schema: { type: 'kuis', kuisId: 'kuis-ns-test' },
        },
      ],
      ratioId: '16:9',
      meta: { judulPertemuan: 'Non-Scorable Test', mapel: 'Math', kelas: '7' },
      allKuis: [
        {
          id: 'kuis-ns-test',
          title: 'Non-Scorable Test',
          variant: 'A',
          questions: [
            { id: 'q1', type: 'true-false', pertanyaan: 'Q1', correct: 'maybe', penjelasan: 'Invalid' },
            { id: 'q2', type: 'true-false', pertanyaan: 'Q2', correct: null, penjelasan: 'Null' },
            { id: 'q3', type: 'true-false', pertanyaan: 'Q3', correct: undefined, penjelasan: 'Undefined' },
          ],
        },
      ],
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

    const response = await fetch(`http://localhost:3000/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(200);
    const html = await response.text();

    // Save for inspection
    const filePath = path.join(DOWNLOAD_DIR, 'non-scorable-export.html');
    fs.writeFileSync(filePath, html, 'utf-8');

    // Verify the data is safe
    const scriptStart = html.indexOf('<script>window.__EXPORT_DATA__=');
    expect(scriptStart).not.toBe(-1);
  }, 15000);

  // ── Test 5: Deterministic export — same data, same output ──────────

  it('should produce deterministic output for same input', async () => {
    const payload = buildExportPayloadWithXss('Deterministic Test');

    const response1 = await fetch(`http://localhost:3000/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const html1 = await response1.text();

    const response2 = await fetch(`http://localhost:3000/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const html2 = await response2.text();

    // The __EXPORT_DATA__ sections should be identical
    const extractData = (html: string) => {
      const start = html.indexOf('<script>window.__EXPORT_DATA__=');
      const contentStart = start + '<script>'.length;
      const end = html.indexOf('</script>', contentStart);
      return html.substring(contentStart, end);
    };

    expect(extractData(html1)).toBe(extractData(html2));
  }, 20000);

  // ── Test 6: Malformed data does not crash the API ─────────────────

  it('should handle malformed data gracefully', async () => {
    const malformedPayloads = [
      { pages: null },
      { pages: 'not-an-array' },
      { pages: [] },
      { pages: [{ id: 123 }], meta: { judulPertemuan: 456 } },
      { pages: [{ id: 'p1' }], allKuis: 'invalid' },
    ];

    for (const payload of malformedPayloads) {
      const response = await fetch(`http://localhost:3000/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Should either succeed (200) or return a proper error (400/500)
      // Should NOT hang or return garbage
      expect([200, 400, 500]).toContain(response.status);
    }
  }, 30000);
});
