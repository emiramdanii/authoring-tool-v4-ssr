#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// V5-BLOCKER-FIX-01B — Export Template Freshness Guard
// ═══════════════════════════════════════════════════════════════
// Verifies export-output/index.html is fresh relative to source files.
// Used as a CI gate and manual check (`npm run guard:export-template-fresh`).
//
// Strategy:
//   1. Stat export-output/index.html (the built bundle)
//   2. Stat each source file in EXPORT_SOURCE_PATHS
//   3. If ANY source is newer than the bundle → FAIL (stale)
//   4. If bundle missing → FAIL (must build first)
//   5. If all sources older than bundle → PASS (fresh)
//
// Exit codes:
//   0 = PASS (bundle is fresh)
//   1 = FAIL (stale or missing — run `npm run export:build`)
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.resolve(PROJECT_ROOT, 'export-output', 'index.html');

// Must match EXPORT_SOURCE_PATHS in src/app/api/export/route.ts
const EXPORT_SOURCE_PATHS = [
  'src/export/entry-client.tsx',
  'src/export/ExportApp.tsx',
  'src/export/export.css',
  'vite.export.config.ts',
  'src/components/canva/page-renderer/PageRenderer.tsx',
  'src/components/canva/page-renderer/PageFrame.tsx',
  'src/components/canva/page-renderer/BlockRenderer.tsx',
  'src/core/renderer/SchemaRenderer.tsx',
  'src/core/scene/SceneLayoutEngine.ts',
  'src/store/canva-store.ts',
  'src/store/learning-media-store.ts',
  'src/store/interactive-store.ts',
];

function getMtime(p) {
  try {
    return fs.statSync(p).mtimeMs;
  } catch {
    return -1; // missing
  }
}

console.log('══════════════════════════════════════════════════════════════');
console.log('V5-BLOCKER-FIX-01B — Export Template Freshness Guard');
console.log('══════════════════════════════════════════════════════════════');
console.log(`Template: ${path.relative(PROJECT_ROOT, TEMPLATE_PATH)}`);
console.log(`Source files checked: ${EXPORT_SOURCE_PATHS.length}`);
console.log('');

// Step 1: Check template exists
const templateMtime = getMtime(TEMPLATE_PATH);
if (templateMtime < 0) {
  console.log('❌ FAIL — export template MISSING.');
  console.log(`   ${path.relative(PROJECT_ROOT, TEMPLATE_PATH)} does not exist.`);
  console.log('');
  console.log('   Run: npm run export:build');
  console.log('   Or:  npm run build (which includes export:build)');
  process.exit(1);
}

console.log(`Template mtime: ${new Date(templateMtime).toISOString()}`);
console.log('');

// Step 2: Check each source file
let staleFiles = [];
let missingFiles = [];
let freshFiles = [];

for (const rel of EXPORT_SOURCE_PATHS) {
  const full = path.resolve(PROJECT_ROOT, rel);
  const mtime = getMtime(full);
  if (mtime < 0) {
    missingFiles.push(rel);
    console.log(`  ⚠ MISSING: ${rel}`);
  } else if (mtime > templateMtime) {
    staleFiles.push({ rel, mtime, age: mtime - templateMtime });
    console.log(`  ❌ STALE:   ${rel} (newer by ${Math.round(staleFiles[staleFiles.length - 1].age / 1000)}s)`);
  } else {
    freshFiles.push(rel);
    console.log(`  ✓ fresh:   ${rel}`);
  }
}

console.log('');
console.log('─── Summary ───');
console.log(`Fresh:  ${freshFiles.length}`);
console.log(`Stale:  ${staleFiles.length}`);
console.log(`Missing: ${missingFiles.length}`);
console.log('');

if (staleFiles.length > 0) {
  console.log('❌ FAIL — export bundle is STALE.');
  console.log('');
  console.log('Source files newer than the export bundle:');
  staleFiles.forEach((f) => {
    console.log(`  - ${f.rel} (mtime: ${new Date(f.mtime).toISOString()})`);
  });
  console.log('');
  console.log('The export bundle must be rebuilt so that exported HTML files');
  console.log('render correctly. Run:');
  console.log('  npm run export:build');
  console.log('Or the full build:');
  console.log('  npm run build');
  process.exit(1);
}

if (missingFiles.length > 0) {
  console.log('⚠ WARN — some source files are missing (cannot check freshness):');
  missingFiles.forEach((f) => console.log(`  - ${f}`));
  console.log('');
  console.log('These may be legitimate (new file added to list but not yet');
  console.log('created). Continuing — freshness check on existing files PASSED.');
}

console.log('✅ PASS — export bundle is fresh.');
console.log('All source files are older than (or equal to) the export bundle.');
console.log('Exported HTML will render correctly with current source code.');
process.exit(0);
