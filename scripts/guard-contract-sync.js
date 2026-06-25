#!/usr/bin/env node
// BATCH-03: Guard — contract block types match runtime registry
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Extract block types from code
const blocksFile = fs.readFileSync(
  path.resolve(PROJECT_ROOT, 'src/core/schema/types/blocks.ts'), 'utf-8');
const codeTypes = [];
const typeRegex = /type:\s*'([^']+)'/g;
let m;
while ((m = typeRegex.exec(blocksFile)) !== null) {
  codeTypes.push(m[1]);
}

// Extract block types from contract
const contractFile = fs.readFileSync(
  path.resolve(PROJECT_ROOT, 'SILSE_IMPORT_JSON_CONTRACT.md'), 'utf-8');
const contractTypes = [];
const tableRegex = /\|\s*`([^`]+)`\s*\|/g;
while ((m = tableRegex.exec(contractFile)) !== null) {
  const t = m[1];
  if (t.includes('-game') || t.includes('-display') || t.includes('-section') || 
      t.includes('-accord') || t.includes('-set') || t === 'cover' || t === 'petunjuk' ||
      t === 'motivasi' || t === 'skenario' || t === 'def-box' || t === 'materi-blok' ||
      t === 'nc-grid' || t === 'diskusi' || t === 'kuis' || t === 'refleksi' ||
      t === 'rangkuman' || t === 'penutup' || t === 'hasil' || t === 'ftab' ||
      t === 'flashcard-set' || t === 'norma-kartu' || t === 'tp-display' ||
      t === 'sortir-game' || t === 'roda-game' || t === 'memory-game' ||
      t === 'matching-game' || t === 'fill-blank-game' || t === 'word-search-game' ||
      t === 'true-false-game' || t === 'drag-drop-game' || t === 'crossword-game' ||
      t === 'team-buzzer-game') {
    contractTypes.push(t);
  }
}

const missingInCode = contractTypes.filter(t => !codeTypes.includes(t));
const missingInContract = codeTypes.filter(t => !contractTypes.includes(t));

console.log('══════════════════════════════════════════════════════════════');
console.log('BATCH-03: Contract Sync Guard');
console.log('══════════════════════════════════════════════════════════════');
console.log(`Code block types: ${codeTypes.length}`);
console.log(`Contract block types: ${contractTypes.length}`);
console.log('');

if (missingInCode.length > 0) {
  console.log(`❌ FAIL — Contract has types not in code:`);
  missingInCode.forEach(t => console.log(`  - ${t}`));
  process.exit(1);
}
if (missingInContract.length > 0) {
  console.log(`⚠ WARN — Code has types not in contract:`);
  missingInContract.forEach(t => console.log(`  - ${t}`));
}
if (missingInCode.length === 0) {
  console.log('✅ PASS — All contract block types exist in code.');
  process.exit(0);
}
