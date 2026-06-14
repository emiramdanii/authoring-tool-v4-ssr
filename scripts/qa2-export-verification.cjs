#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXPORT PRODUCTION VERIFICATION — Sprint 6.4-E1-QA2
 * ═══════════════════════════════════════════════════════════════════════
 * Generates production export HTML using the EXACT same code path as the
 * API route, then verifies it's safe. No dev server needed.
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');
const DOWNLOAD_DIR = path.resolve('/home/z/my-project/download/qa2-exports');

// Ensure output directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════
// EXACT SERIALIZATION — Same as route.ts
// ═══════════════════════════════════════════════════════════════════════

function serializeForScript(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f');
}

// ═══════════════════════════════════════════════════════════════════════
// BUILD EXPORT HTML — Same as the API route
// ═══════════════════════════════════════════════════════════════════════

function buildExportHtml(body) {
  const templateBuf = fs.readFileSync(TEMPLATE_PATH);
  const templateStr = templateBuf.toString('utf-8');

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

  const dataJson = serializeForScript(exportData);
  const dataScript = `<script>window.__EXPORT_DATA__=${dataJson};</script>\n`;

  const meta = body.meta || {};
  const title = `${meta.judulPertemuan || 'Media Pembelajaran Interaktif'} | ${meta.mapel || ''} ${meta.kelas || ''}`;
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const bodyCloseIdx = templateStr.lastIndexOf('</body>');
  let result;
  if (bodyCloseIdx !== -1) {
    const before = templateStr.substring(0, bodyCloseIdx).replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
    const after = templateStr.substring(bodyCloseIdx);
    result = before + dataScript + after;
  } else {
    result = templateStr.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`) + dataScript;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// XSS PAYLOADS — From Senior's specification
// ═══════════════════════════════════════════════════════════════════════

const XSS_PAYLOADS = {
  scriptTermination: [
    '</script><script>window.__quizXss = 101</script>',
    '</script><img src=x onerror="window.__quizXss = 102">',
    '<!--</script><script>window.__quizXss = 103</script>',
  ],
  specialChars: [
    { name: 'U+2028', value: 'before\u2028after' },
    { name: 'U+2029', value: 'before\u2029after' },
    { name: 'Backslash', value: '\\' },
    { name: 'DoubleQuote', value: '"' },
    { name: 'BareScriptClose', value: '</script>' },
    { name: 'Ampersand', value: '&' },
  ],
  combined: [
    '</script><script>window.__quizXss = 101</script>---' +
    '</script><img src=x onerror="window.__quizXss = 102">---' +
    '\u2028\u2029'
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// BUILD PAYLOAD WITH XSS IN EVERY FIELD
// ═══════════════════════════════════════════════════════════════════════

function buildPayloadWithXss(xssValue) {
  return {
    pages: [
      {
        id: 'page-cover', label: xssValue, templateType: 'cover',
        bgColor: '#1a1a2e', overlay: 0, elements: [],
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {},
        schema: { type: 'cover', title: xssValue, subtitle: xssValue },
      },
      {
        id: 'page-kuis', label: xssValue, templateType: 'kuis',
        bgColor: '#0f3460', overlay: 0, elements: [],
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {},
        schema: { type: 'kuis', kuisId: 'kuis-xss' },
      },
    ],
    ratioId: '16:9',
    meta: { judulPertemuan: xssValue, mapel: xssValue, kelas: '7', guru: xssValue, sekolah: xssValue },
    allKuis: [{
      id: 'kuis-xss', title: xssValue, variant: 'A',
      questions: [
        { id: 'q1', pertanyaan: xssValue, pilihan: [xssValue, 'B', 'C', 'D'], jawaban: 'A', penjelasan: xssValue },
        { id: 'q2', type: 'true-false', pertanyaan: xssValue, correct: true, penjelasan: xssValue },
        { id: 'q3', type: 'fill-blank', pertanyaan: xssValue, jawaban: xssValue, hint: xssValue },
      ],
    }],
    allModules: [], games: [],
    cp: {}, tp: [],
    atp: { namaBab: xssValue, jumlahPertemuan: 1, pertemuan: [{ judul: xssValue }] },
    alur: [], materi: { blok: [{ judul: xssValue, konten: xssValue }] },
    skenario: [],
    petunjuk: { title: xssValue, intro: xssValue, langkah: [xssValue] },
    diskusi: { title: xssValue, intro: xssValue, pertanyaan: [xssValue] },
    refleksi: { title: xssValue, intro: xssValue, pertanyaan: [xssValue] },
    penutup: { title: xssValue, subjudul: xssValue, preview: [xssValue] },
    suara: { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// VERIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function verifyExportHtml(html, payloadName, xssValue) {
  const results = { name: payloadName, passed: [], failed: [] };

  function check(name, condition, detail) {
    if (condition) {
      results.passed.push(name);
    } else {
      results.failed.push(`${name}: ${detail}`);
    }
  }

  // 1. Has __EXPORT_DATA__ script
  const scriptStart = html.indexOf('<script>window.__EXPORT_DATA__=');
  check('HAS_EXPORT_DATA_SCRIPT', scriptStart !== -1, 'Missing __EXPORT_DATA__ script tag');

  if (scriptStart !== -1) {
    const contentStart = scriptStart + '<script>'.length;
    const scriptEnd = html.indexOf('</script>', contentStart);
    check('HAS_CLOSING_SCRIPT_TAG', scriptEnd !== -1, 'Missing closing </script>');

    if (scriptEnd !== -1) {
      const scriptBody = html.substring(contentStart, scriptEnd);
      const jsonStr = scriptBody.substring('window.__EXPORT_DATA__='.length).replace(/;$/, '');

      // 2. JSON must not contain literal <
      check('JSON_NO_LITERAL_LT', !jsonStr.includes('<'), `Found literal < in JSON at position ${jsonStr.indexOf('<')}`);

      // 3. JSON must not contain literal >
      check('JSON_NO_LITERAL_GT', !jsonStr.includes('>'), `Found literal > in JSON at position ${jsonStr.indexOf('>')}`);

      // 4. JSON must not contain literal </script>
      check('JSON_NO_SCRIPT_CLOSE', !jsonStr.toLowerCase().includes('</script>'), 'Found literal </script> in JSON');

      // 5. JSON must not contain literal <script>
      check('JSON_NO_SCRIPT_OPEN', !jsonStr.toLowerCase().includes('<script>'), 'Found literal <script> in JSON');

      // 6. JSON must be parseable
      try {
        const parsed = JSON.parse(jsonStr);
        check('JSON_PARSEABLE', true, '');

        // 7. Round-trip: XSS value must be preserved
        if (parsed.meta?.judulPertemuan === xssValue) {
          check('ROUND_TRIP_PRESERVES_PAYLOAD', true, '');
        } else {
          check('ROUND_TRIP_PRESERVES_PAYLOAD', false,
            `Expected "${xssValue.slice(0, 30)}..." got "${String(parsed.meta?.judulPertemuan).slice(0, 30)}..."`);
        }
      } catch (e) {
        check('JSON_PARSEABLE', false, e.message);
      }
    }
  }

  // 8. Title must be HTML-entity encoded
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch) {
    const titleContent = titleMatch[1];
    check('TITLE_NO_LITERAL_LT', !titleContent.includes('<'), 'Title contains literal <');
    check('TITLE_HAS_ENTITY_ENCODING', titleContent.includes('&lt;') || !xssValue.includes('<'),
      'Title should have &lt; encoding for < characters');
  }

  // 9. Count script tags — no extra ones from payloads
  const allScriptMatches = html.match(/<script/gi);
  // The production template + our injected one should have a fixed count
  // We just verify no ADDITIONAL <script> tags appear from XSS payloads
  // by checking the data section specifically
  check('NO_PAYLOAD_SCRIPT_TAGS', !html.includes('window.__quizXss'), 'Payload code appears as executable in HTML');

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN — Run all verification tests
// ═══════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════');
console.log('EXPORT PRODUCTION SERIALIZATION VERIFICATION — E1-QA2');
console.log('══════════════════════════════════════════════════════════════════\n');

// Verify template exists
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('ERROR: Export template not found at', TEMPLATE_PATH);
  console.error('Run "npm run export:build" first.');
  process.exit(1);
}
console.log(`Template: ${TEMPLATE_PATH} (${(fs.statSync(TEMPLATE_PATH).size / 1024).toFixed(0)} KB)\n`);

let totalPassed = 0;
let totalFailed = 0;
const allResults = [];

// ── Test: Script-termination payloads ──────────────────────────────
console.log('── Script-termination payloads ──────────────────────────────\n');

for (const payload of XSS_PAYLOADS.scriptTermination) {
  const exportPayload = buildPayloadWithXss(payload);
  const html = buildExportHtml(exportPayload);
  const safeName = payload.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
  const filePath = path.join(DOWNLOAD_DIR, `script-term-${safeName}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');

  const result = verifyExportHtml(html, `Script-term: ${payload.slice(0, 40)}`, payload);
  allResults.push(result);
  totalPassed += result.passed.length;
  totalFailed += result.failed.length;

  const status = result.failed.length === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} — ${payload.slice(0, 50)}`);
  if (result.failed.length > 0) {
    for (const f of result.failed) console.log(`    ❌ ${f}`);
  }
}

// ── Test: Special character payloads ───────────────────────────────
console.log('\n── Special character payloads ────────────────────────────────\n');

for (const { name, value } of XSS_PAYLOADS.specialChars) {
  const exportPayload = buildPayloadWithXss(value);
  const html = buildExportHtml(exportPayload);
  const filePath = path.join(DOWNLOAD_DIR, `special-${name}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');

  const result = verifyExportHtml(html, `Special: ${name}`, value);
  allResults.push(result);
  totalPassed += result.passed.length;
  totalFailed += result.failed.length;

  const status = result.failed.length === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} — ${name}: "${value.replace(/\n/g, '\\n').slice(0, 20)}"`);
  if (result.failed.length > 0) {
    for (const f of result.failed) console.log(`    ❌ ${f}`);
  }
}

// ── Test: Combined payload ─────────────────────────────────────────
console.log('\n── Combined payload (all attack vectors) ─────────────────────\n');

for (const payload of XSS_PAYLOADS.combined) {
  const exportPayload = buildPayloadWithXss(payload);
  const html = buildExportHtml(exportPayload);
  const filePath = path.join(DOWNLOAD_DIR, 'combined-xss-payload.html');
  fs.writeFileSync(filePath, html, 'utf-8');

  const result = verifyExportHtml(html, 'Combined XSS', payload);
  allResults.push(result);
  totalPassed += result.passed.length;
  totalFailed += result.failed.length;

  const status = result.failed.length === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} — Combined payload (${payload.length} chars)`);
  if (result.failed.length > 0) {
    for (const f of result.failed) console.log(`    ❌ ${f}`);
  }
}

// ── Test: Normal export (no XSS) — baseline ───────────────────────
console.log('\n── Baseline normal export ───────────────────────────────────\n');

const normalPayload = buildPayloadWithXss('Normal Title');
const normalHtml = buildExportHtml(normalPayload);
const normalPath = path.join(DOWNLOAD_DIR, 'baseline-normal.html');
fs.writeFileSync(normalPath, normalHtml, 'utf-8');

const normalResult = verifyExportHtml(normalHtml, 'Normal baseline', 'Normal Title');
allResults.push(normalResult);
totalPassed += normalResult.passed.length;
totalFailed += normalResult.failed.length;

const normalStatus = normalResult.failed.length === 0 ? '✅ PASS' : '❌ FAIL';
console.log(`  ${normalStatus} — Normal export`);

// ── Test: U+2028/U+2029 specific verification ─────────────────────
console.log('\n── U+2028/U+2029 JSON.stringify behavior ───────────────────\n');

const testU2028 = 'test\u2028value';
const testU2029 = 'test\u2029value';
const jsonU2028 = JSON.stringify({ t: testU2028 });
const jsonU2029 = JSON.stringify({ t: testU2029 });

const u2028HandledByJsonStringify = jsonU2028.includes('\\u2028');
const u2029HandledByJsonStringify = jsonU2029.includes('\\u2029');

console.log(`  JSON.stringify handles U+2028: ${u2028HandledByJsonStringify ? '✅ YES (escapes to \\u2028)' : '⚠️ NO (passes through literal)'}`);
console.log(`  JSON.stringify handles U+2029: ${u2029HandledByJsonStringify ? '✅ YES (escapes to \\u2029)' : '⚠️ NO (passes through literal)'}`);

if (u2028HandledByJsonStringify && u2029HandledByJsonStringify) {
  console.log('  → Current Node.js runtime safely handles U+2028/U+2029 via JSON.stringify.');
  console.log('  → GAPS: & (ampersand) is not escaped by current serializeForScript().');
  console.log('  → RECOMMENDATION: Add & → \\u0026 for OWASP completeness (defense in depth).');
  totalPassed += 2;
} else {
  console.log('  → WARNING: JSON.stringify does NOT escape U+2028/U+2029 in this runtime!');
  console.log('  → MUST add explicit replacement to serializeForScript().');
  totalFailed += 2;
}

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('VERIFICATION SUMMARY');
console.log('══════════════════════════════════════════════════════════════════');
console.log(`Total checks passed: ${totalPassed}`);
console.log(`Total checks failed: ${totalFailed}`);
console.log(`Overall: ${totalFailed === 0 ? '✅ ALL PASS' : '❌ FAILURES DETECTED'}`);
console.log(`\nExported files saved to: ${DOWNLOAD_DIR}`);
console.log('══════════════════════════════════════════════════════════════════');

// List all exported files
const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.html'));
for (const f of files) {
  const size = fs.statSync(path.join(DOWNLOAD_DIR, f)).size;
  console.log(`  ${f} (${(size / 1024).toFixed(0)} KB)`);
}

process.exit(totalFailed > 0 ? 1 : 0);
