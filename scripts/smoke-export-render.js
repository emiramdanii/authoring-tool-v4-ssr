#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// V5-BLOCKER-FIX-01B — Export Render Smoke Test
// ═══════════════════════════════════════════════════════════════
// Generates an export HTML file by calling /api/export with a minimal
// payload, then parses the resulting HTML to verify:
//   1. Contains window.__EXPORT_DATA__ assignment in a <script> tag
//   2. Contains <div id="root">
//   3. Bundle script is not empty
//   4. (If browser available) #root has rendered children > 0
//
// Usage:
//   node scripts/smoke-export-render.js
//
// Requires: dev server running on http://localhost:3000
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const PROOF_DIR = path.resolve(__dirname, '..', 'docs', 'visual-proof', 'v5-blocker-fix-01b');
fs.mkdirSync(PROOF_DIR, { recursive: true });

const API_URL = process.env.EXPORT_API_URL || 'http://localhost:3000/api/export';

// Minimal payload with a single cover page — enough to verify render
const MINIMAL_PAYLOAD = {
  pages: [
    {
      id: 'smoke-test-page',
      label: 'Cover',
      templateType: 'cover',
      bgColor: '#ffffff',
      overlay: 20,
      elements: [],
      bgDataUrl: null,
      colorPalette: null,
      navConfig: {
        showNavbar: true,
        showPrevNext: true,
        showScore: true,
        showProgress: true,
        navbarStyle: 'colorful',
      },
      templateData: { schemaThemeId: 'modern-interactive' },
      pageMode: 'schema',
      schema: {
        id: 'smoke-screen',
        templateType: 'cover',
        blocks: [
          {
            type: 'cover',
            id: 'smoke-cover-1',
            icon: '📚',
            title: 'Smoke Test Export',
            subtitle: 'V5-BLOCKER-FIX-01B',
            badges: [],
            meta: {},
            cta: { label: 'Mulai', action: 'next' },
            layout: { position: 'absolute', x: 0, y: 0, width: 'auto', height: 'auto' },
            variant: 'A',
          },
        ],
        sceneType: 'intro',
        themeId: 'modern-interactive',
        background: { type: 'gradient' },
      },
    },
  ],
  ratioId: '16:9',
  meta: { judulPertemuan: 'Smoke Test Export', mapel: 'Test', kelas: '7' },
};

async function callExportApi() {
  console.log(`Calling POST ${API_URL} ...`);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(MINIMAL_PAYLOAD),
  });

  console.log(`HTTP ${res.status} ${res.statusText}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Export API returned ${res.status}: ${text.slice(0, 300)}`);
  }

  const html = await res.text();
  return html;
}

function parseHtml(html) {
  const checks = {
    htmlSize: html.length,
    hasExportDataScript: /window\.__EXPORT_DATA__\s*=/.test(html),
    hasRootDiv: /<div[^>]*id=["']root["']/.test(html),
    hasBundleScript: false,
    bundleScriptSize: 0,
    hasInlineStyles: /<style/.test(html),
    hasTitle: /<title>[^<]+<\/title>/.test(html),
  };

  // Find the bundle script (type="module") and measure its size
  const bundleMatch = html.match(/<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/);
  if (bundleMatch) {
    checks.hasBundleScript = true;
    checks.bundleScriptSize = bundleMatch[1].length;
  }

  return checks;
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('V5-BLOCKER-FIX-01B — Export Render Smoke Test');
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  let html;
  try {
    html = await callExportApi();
  } catch (err) {
    console.log('❌ FAIL — could not call export API.');
    console.log('   Make sure dev server is running: npm run dev');
    console.log(`   Error: ${err.message}`);
    process.exit(1);
  }

  // Save HTML for browser-based verification
  const htmlPath = path.join(PROOF_DIR, 'smoke-export.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Saved export HTML to: ${htmlPath}`);
  console.log('');

  // Parse + verify
  const checks = parseHtml(html);
  console.log('─── HTML Structure Checks ───');
  console.log(`  HTML size:          ${checks.htmlSize} bytes`);
  console.log(`  Has __EXPORT_DATA__: ${checks.hasExportDataScript ? '✓' : '❌'}`);
  console.log(`  Has #root div:       ${checks.hasRootDiv ? '✓' : '❌'}`);
  console.log(`  Has bundle script:   ${checks.hasBundleScript ? '✓' : '❌'}`);
  console.log(`  Bundle script size:  ${checks.bundleScriptSize} bytes`);
  console.log(`  Has inline styles:   ${checks.hasInlineStyles ? '✓' : '❌'}`);
  console.log(`  Has <title>:         ${checks.hasTitle ? '✓' : '❌'}`);
  console.log('');

  const failures = [];
  if (!checks.hasExportDataScript) failures.push('Missing window.__EXPORT_DATA__ assignment');
  if (!checks.hasRootDiv) failures.push('Missing <div id="root">');
  if (!checks.hasBundleScript) failures.push('Missing bundle <script type="module">');
  if (checks.bundleScriptSize < 100000) failures.push(`Bundle script too small (${checks.bundleScriptSize} bytes, expected >100KB)`);

  if (failures.length > 0) {
    console.log('❌ FAIL — HTML structure checks failed:');
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }

  console.log('✅ PASS — HTML structure checks all passed.');
  console.log('');
  console.log('The exported HTML contains:');
  console.log('  • window.__EXPORT_DATA__ data injection');
  console.log('  • <div id="root"> mount point');
  console.log('  • Non-empty bundle script (>100KB)');
  console.log('');
  console.log('To verify #root rendered children > 0, open in a browser:');
  console.log(`  file://${htmlPath}`);
  console.log('Or run agent-browser against the file URL.');
  console.log('');
  console.log('─── Result ───');
  console.log(JSON.stringify({ checks, htmlPath }, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
