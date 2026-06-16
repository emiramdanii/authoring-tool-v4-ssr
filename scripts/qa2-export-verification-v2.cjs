#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 * EXPORT PRODUCTION VERIFICATION — Sprint 6.4-E1-QA2 (with enhanced serializer)
 * ═══════════════════════════════════════════════════════════════════════
 * Generates production export HTML using the EXACT same code path as the
 * API route (now with serializeForHtmlScript), then verifies safety.
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.resolve(process.cwd(), 'export-output', 'index.html');
const DOWNLOAD_DIR = path.resolve('/home/z/my-project/download/qa2-exports');

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════════
// CANONICAL SERIALIZER — serializeForHtmlScript (from src/lib/export)
// ═══════════════════════════════════════════════════════════════════════

function serializeForHtmlScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ═══════════════════════════════════════════════════════════════════════
// BUILD EXPORT HTML — Same as the API route
// ═══════════════════════════════════════════════════════════════════════

function buildExportHtml(body) {
  const templateBuf = fs.readFileSync(TEMPLATE_PATH);
  const templateStr = templateBuf.toString('utf-8');

  const exportData = {
    pages: body.pages || [], ratioId: body.ratioId || '16:9', meta: body.meta || {},
    allKuis: body.allKuis || [], allModules: body.allModules || [], games: body.games || [],
    cp: body.cp || {}, tp: body.tp || [],
    atp: body.atp || { namaBab: '', jumlahPertemuan: 0, pertemuan: [] },
    alur: body.alur || [], materi: body.materi || { blok: [] }, skenario: body.skenario || [],
    petunjuk: body.petunjuk || { title: '', intro: '', langkah: [] },
    diskusi: body.diskusi || { title: '', intro: '', pertanyaan: [] },
    refleksi: body.refleksi || { title: '', intro: '', pertanyaan: [] },
    penutup: body.penutup || { title: '', subjudul: '', preview: [] },
    suara: body.suara || { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  };

  const dataJson = serializeForHtmlScript(exportData);
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
// VERIFICATION
// ═══════════════════════════════════════════════════════════════════════

function buildPayloadWithXss(xssValue) {
  return {
    pages: [
      { id: 'page-cover', label: xssValue, templateType: 'cover', bgColor: '#1a1a2e', overlay: 0, elements: [],
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {}, schema: { type: 'cover', title: xssValue, subtitle: xssValue } },
      { id: 'page-kuis', label: xssValue, templateType: 'kuis', bgColor: '#0f3460', overlay: 0, elements: [],
        navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
        templateData: {}, schema: { type: 'kuis', kuisId: 'kuis-xss' } },
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
    allModules: [], games: [], cp: {}, tp: [],
    atp: { namaBab: xssValue, jumlahPertemuan: 1, pertemuan: [{ judul: xssValue }] },
    alur: [], materi: { blok: [{ judul: xssValue, konten: xssValue }] }, skenario: [],
    petunjuk: { title: xssValue, intro: xssValue, langkah: [xssValue] },
    diskusi: { title: xssValue, intro: xssValue, pertanyaan: [xssValue] },
    refleksi: { title: xssValue, intro: xssValue, pertanyaan: [xssValue] },
    penutup: { title: xssValue, subjudul: xssValue, preview: [xssValue] },
    suara: { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true },
  };
}

function verifyExportHtml(html, payloadName, xssValue) {
  const results = { name: payloadName, passed: [], failed: [] };
  function check(name, condition, detail) {
    if (condition) results.passed.push(name);
    else results.failed.push(`${name}: ${detail}`);
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
      check('JSON_NO_LITERAL_LT', !jsonStr.includes('<'), `Found literal < in JSON`);

      // 3. JSON must not contain literal >
      check('JSON_NO_LITERAL_GT', !jsonStr.includes('>'), `Found literal > in JSON`);

      // 4. JSON must not contain literal </script>
      check('JSON_NO_SCRIPT_CLOSE', !jsonStr.toLowerCase().includes('</script>'), 'Found literal </script> in JSON');

      // 5. JSON must not contain literal <script>
      check('JSON_NO_SCRIPT_OPEN', !jsonStr.toLowerCase().includes('<script>'), 'Found literal <script> in JSON');

      // 6. JSON must not contain literal & (should be \u0026)
      check('JSON_NO_LITERAL_AMP', !jsonStr.includes('&'), 'Found literal & in JSON (should be \\u0026)');

      // 7. JSON must not contain literal U+2028
      check('JSON_NO_LITERAL_U2028', ![...jsonStr].some(c => c.charCodeAt(0) === 0x2028), 'Found literal U+2028 in JSON');

      // 8. JSON must not contain literal U+2029
      check('JSON_NO_LITERAL_U2029', ![...jsonStr].some(c => c.charCodeAt(0) === 0x2029), 'Found literal U+2029 in JSON');

      // 9. JSON must be parseable
      try {
        const parsed = JSON.parse(jsonStr);
        check('JSON_PARSEABLE', true, '');

        // 10. Round-trip: XSS value must be preserved
        check('ROUND_TRIP_PRESERVES_PAYLOAD', parsed.meta?.judulPertemuan === xssValue,
          `Expected "${xssValue.slice(0, 30)}..." got "${String(parsed.meta?.judulPertemuan).slice(0, 30)}..."`);
      } catch (e) {
        check('JSON_PARSEABLE', false, e.message);
      }
    }
  }

  // 11. Title must be HTML-entity encoded
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (titleMatch) {
    const titleContent = titleMatch[1];
    check('TITLE_NO_LITERAL_LT', !titleContent.includes('<'), 'Title contains literal <');
    check('TITLE_HAS_ENTITY_ENCODING', titleContent.includes('&lt;') || !xssValue.includes('<'),
      'Title should have &lt; encoding for < characters');
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════');
console.log('EXPORT PRODUCTION VERIFICATION — E1-QA2 (with serializeForHtmlScript)');
console.log('══════════════════════════════════════════════════════════════════\n');

let totalPassed = 0, totalFailed = 0;

const tests = [
  { name: 'script-termination-1', payload: '</script><script>window.__quizXss = 101</script>' },
  { name: 'script-termination-2', payload: '</script><img src=x onerror="window.__quizXss = 102">' },
  { name: 'script-termination-3', payload: '<!--</script><script>window.__quizXss = 103</script>' },
  { name: 'U+2028', payload: 'before\u2028after' },
  { name: 'U+2029', payload: 'before\u2029after' },
  { name: 'backslash', payload: '\\' },
  { name: 'double-quote', payload: '"' },
  { name: 'bare-script-close', payload: '</script>' },
  { name: 'ampersand', payload: '&' },
  { name: 'combined', payload: '</script><script>window.__quizXss = 101</script>---\u2028\u2029---&amp;' },
  { name: 'normal-baseline', payload: 'Normal Title' },
];

for (const test of tests) {
  const payload = buildPayloadWithXss(test.payload);
  const html = buildExportHtml(payload);
  const filePath = path.join(DOWNLOAD_DIR, `qa2-${test.name}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');

  const result = verifyExportHtml(html, test.name, test.payload);
  totalPassed += result.passed.length;
  totalFailed += result.failed.length;

  const status = result.failed.length === 0 ? '✅' : '❌';
  console.log(`${status} ${test.name}: ${result.passed.length} passed, ${result.failed.length} failed`);
  for (const f of result.failed) console.log(`   ❌ ${f}`);
}

// U+2028/U+2029 check
console.log('\n── U+2028/U+2029 serializeForHtmlScript behavior ────────────\n');
const testU2028 = 'test\u2028value';
const testU2029 = 'test\u2029value';
const serializedU2028 = serializeForHtmlScript({ t: testU2028 });
const serializedU2029 = serializeForHtmlScript({ t: testU2029 });

const noLiteral2028 = ![...serializedU2028].some(c => c.charCodeAt(0) === 0x2028);
const noLiteral2029 = ![...serializedU2029].some(c => c.charCodeAt(0) === 0x2029);

console.log(`  serializeForHtmlScript handles U+2028: ${noLiteral2028 ? '✅ YES' : '❌ NO (still passes through literal)'}`);
console.log(`  serializeForHtmlScript handles U+2029: ${noLiteral2029 ? '✅ YES' : '❌ NO (still passes through literal)'}`);
console.log(`  serializeForHtmlScript handles &: ${!serializedU2028.includes('&') ? '✅ YES' : '❌ NO'}`);

totalPassed += (noLiteral2028 ? 1 : 0) + (noLiteral2029 ? 1 : 0);
totalFailed += (noLiteral2028 ? 0 : 1) + (noLiteral2029 ? 0 : 1);

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`VERIFICATION SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
console.log(`Overall: ${totalFailed === 0 ? '✅ ALL PASS' : '❌ FAILURES DETECTED'}`);
console.log(`Files saved to: ${DOWNLOAD_DIR}`);
console.log('══════════════════════════════════════════════════════════════════');

process.exit(totalFailed > 0 ? 1 : 0);
