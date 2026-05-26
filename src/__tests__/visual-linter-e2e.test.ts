/**
 * E2E Test: FASE 11A.5 — Visual Linter
 *
 * Tests that the Visual Linter correctly combines all VCS analysis
 * data into a UI-friendly result with:
 *   - Composition score + grade classification
 *   - Merged, deduplicated, priority-sorted diagnostics
 *   - Severity counts and fatal issue detection
 *   - Score-to-grade mapping
 *   - Grade-to-color/label mapping
 */

import { lintScreen, quickLint, scoreToGrade, gradeToColor, gradeToLabel } from '../core/vcs/VisualLinter';
import type { VisualLintResult, CompositionGrade } from '../core/vcs/types';

import type { ScreenSchema, SchemaBlock } from '../core/schema/types/schema';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

function makeBalancedMateriScreen(): ScreenSchema {
  return {
    id: 'screen-balanced',
    templateType: 'materi',
    sectionType: 'materi',
    blocks: [
      { type: 'materi-section', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
      { type: 'def-box', id: 'b2', visualIntent: 'highlight' } as SchemaBlock,
      { type: 'gambar', id: 'b3', visualIntent: 'primary' } as SchemaBlock,
      { type: 'nc-grid', id: 'b4', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'diskusi', id: 'b5', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'checklist', id: 'b6', visualIntent: 'quiet' } as SchemaBlock,
    ],
  };
}

function makeBadScreen(): ScreenSchema {
  return {
    id: 'screen-bad',
    templateType: 'materi',
    sectionType: 'materi',
    blocks: Array.from({ length: 15 }, (_, i) => ({
      type: 'def-box',
      id: `b${i}`,
      visualIntent: 'highlight',
      content: `Definition ${i} with some text content here to make it longer`,
    } as unknown as SchemaBlock)),
  };
}

function makeCoverScreen(): ScreenSchema {
  return {
    id: 'screen-cover',
    templateType: 'cover',
    sectionType: 'cover',
    blocks: [
      { type: 'cover', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
    ],
  };
}

function makeEmptyScreen(): ScreenSchema {
  return {
    id: 'screen-empty',
    templateType: 'custom',
    sectionType: 'custom',
    blocks: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, label: string, detail?: string) {
  totalTests++;
  if (condition) { passedTests++; console.log(`  ✅ ${label}`); }
  else { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); }
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  FASE 11A.5 — Visual Linter E2E Tests');
console.log('═══════════════════════════════════════════════════════════\n');

// ── Test 1: Score-to-Grade mapping ──────────────────────────
console.log('── 1. Score-to-Grade Mapping ──────────────────────\n');

{
  assert(scoreToGrade(95) === 'excellent', '95 → excellent');
  assert(scoreToGrade(90) === 'excellent', '90 → excellent');
  assert(scoreToGrade(89) === 'good', '89 → good');
  assert(scoreToGrade(70) === 'good', '70 → good');
  assert(scoreToGrade(69) === 'fair', '69 → fair');
  assert(scoreToGrade(50) === 'fair', '50 → fair');
  assert(scoreToGrade(49) === 'poor', '49 → poor');
  assert(scoreToGrade(30) === 'poor', '30 → poor');
  assert(scoreToGrade(29) === 'bad', '29 → bad');
  assert(scoreToGrade(0) === 'bad', '0 → bad');
}

// ── Test 2: Grade-to-Color mapping ──────────────────────────
console.log('\n── 2. Grade-to-Color Mapping ──────────────────────\n');

{
  const colors: Record<CompositionGrade, string> = {
    excellent: '#10b981',
    good: '#3b82f6',
    fair: '#f59e0b',
    poor: '#f97316',
    bad: '#ef4444',
  };
  for (const [grade, expected] of Object.entries(colors)) {
    assert(gradeToColor(grade as CompositionGrade) === expected,
      `${grade} → ${expected}`);
  }
}

// ── Test 3: Grade-to-Label mapping ──────────────────────────
console.log('\n── 3. Grade-to-Label Mapping ──────────────────────\n');

{
  assert(gradeToLabel('excellent') === 'Sangat Baik', 'excellent → Sangat Baik');
  assert(gradeToLabel('good') === 'Baik', 'good → Baik');
  assert(gradeToLabel('fair') === 'Cukup', 'fair → Cukup');
  assert(gradeToLabel('poor') === 'Kurang', 'poor → Kurang');
  assert(gradeToLabel('bad') === 'Perlu Perbaikan', 'bad → Perlu Perbaikan');
}

// ── Test 4: lintScreen — balanced materi ────────────────────
console.log('\n── 4. lintScreen — Balanced Materi ────────────────\n');

{
  const screen = makeBalancedMateriScreen();
  const result = lintScreen(screen);

  assert(result.screenId === 'screen-balanced', `screenId = ${result.screenId}`);
  assert(result.sectionType === 'materi', `sectionType = ${result.sectionType}`);
  assert(result.compositionScore >= 0 && result.compositionScore <= 100,
    `compositionScore = ${result.compositionScore} (0-100)`);
  assert(['excellent', 'good', 'fair', 'poor', 'bad'].includes(result.grade),
    `grade = ${result.grade} (valid)`);
  assert(result.cadenceScore >= 0, `cadenceScore = ${result.cadenceScore}`);
  assert(result.balanceScore >= 0, `balanceScore = ${result.balanceScore}`);
  assert(result.densityScore >= 0, `densityScore = ${result.densityScore}`);
  assert(result.intentScore >= 0, `intentScore = ${result.intentScore}`);
  assert(result.sequenceScore >= 0, `sequenceScore = ${result.sequenceScore}`);
  assert(Array.isArray(result.diagnostics), 'diagnostics is array');
  assert(typeof result.diagnosticCounts.info === 'number', 'info count is number');
  assert(typeof result.diagnosticCounts.suggestion === 'number', 'suggestion count is number');
  assert(typeof result.diagnosticCounts.warning === 'number', 'warning count is number');
  assert(typeof result.hasFatalIssue === 'boolean', `hasFatalIssue = ${result.hasFatalIssue}`);

  console.log(`\n  📊 Balanced Materi Lint Result:`);
  console.log(`     Score: ${result.compositionScore}/100 (${gradeToLabel(result.grade)})`);
  console.log(`     Grade: ${result.grade}`);
  console.log(`     Diagnostics: ${result.diagnostics.length} (${result.diagnosticCounts.warning}W, ${result.diagnosticCounts.suggestion}S, ${result.diagnosticCounts.info}I)`);
  console.log(`     Has fatal: ${result.hasFatalIssue}`);
}

// ── Test 5: lintScreen — bad screen ─────────────────────────
console.log('\n── 5. lintScreen — Bad Screen ──────────────────────\n');

{
  const screen = makeBadScreen();
  const result = lintScreen(screen);

  assert(result.compositionScore < 70,
    `Bad screen score = ${result.compositionScore} (< 70)`);
  assert(result.grade === 'poor' || result.grade === 'bad' || result.grade === 'fair',
    `Bad screen grade = ${result.grade} (not excellent/good)`);
  assert(result.diagnostics.length > 0,
    `Bad screen has ${result.diagnostics.length} diagnostics (> 0)`);
  assert(result.hasFatalIssue === true,
    `Bad screen hasFatalIssue = ${result.hasFatalIssue} (15 blocks > 12 max)`);
  assert(result.diagnosticCounts.warning > 0 || result.diagnosticCounts.suggestion > 0,
    `Bad screen has ${result.diagnosticCounts.warning} warnings, ${result.diagnosticCounts.suggestion} suggestions`);

  console.log(`\n  📊 Bad Screen Lint Result:`);
  console.log(`     Score: ${result.compositionScore}/100 (${gradeToLabel(result.grade)})`);
  console.log(`     Grade: ${result.grade}`);
  console.log(`     Diagnostics: ${result.diagnostics.length}`);
  console.log(`     Has fatal: ${result.hasFatalIssue}`);
  if (result.diagnostics.length > 0) {
    console.log(`     Top diagnostic: [${result.diagnostics[0].severity}] ${result.diagnostics[0].code}`);
  }
}

// ── Test 6: lintScreen — cover screen ───────────────────────
console.log('\n── 6. lintScreen — Cover Screen ─────────────────────\n');

{
  const screen = makeCoverScreen();
  const result = lintScreen(screen);

  assert(result.sectionType === 'cover', `sectionType = ${result.sectionType}`);
  assert(result.compositionScore >= 50,
    `Cover score = ${result.compositionScore} (>= 50, cover is naturally visual-heavy)`);
  assert(result.grade === 'excellent' || result.grade === 'good' || result.grade === 'fair',
    `Cover grade = ${result.grade} (cover should not be penalized)`);

  console.log(`\n  📊 Cover Lint Result:`);
  console.log(`     Score: ${result.compositionScore}/100 (${gradeToLabel(result.grade)})`);
}

// ── Test 7: lintScreen — empty screen ───────────────────────
console.log('\n── 7. lintScreen — Empty Screen ──────────────────────\n');

{
  const screen = makeEmptyScreen();
  const result = lintScreen(screen);

  assert(result.compositionScore >= 80,
    `Empty screen score = ${result.compositionScore} (>= 80, empty = no issues)`);
  assert(result.diagnostics.length === 0 || result.diagnostics.every(d => d.severity === 'info'),
    `Empty screen diagnostics are info-only`);

  console.log(`\n  📊 Empty Screen Lint Result:`);
  console.log(`     Score: ${result.compositionScore}/100 (${gradeToLabel(result.grade)})`);
}

// ── Test 8: Diagnostic priority sorting ─────────────────────
console.log('\n── 8. Diagnostic Priority Sorting ──────────────────\n');

{
  const screen = makeBadScreen();
  const result = lintScreen(screen);

  // Verify diagnostics are sorted by priority
  let prevPriority = -Infinity;
  let isSorted = true;
  for (const d of result.diagnostics) {
    if (d.priority < prevPriority) {
      isSorted = false;
      break;
    }
    prevPriority = d.priority;
  }
  assert(isSorted, 'Diagnostics are sorted by priority (ascending)');

  // First diagnostic should be the most important
  if (result.diagnostics.length > 0) {
    assert(result.diagnostics[0].priority <= 10,
      `First diagnostic priority = ${result.diagnostics[0].priority} (<= 10, most important)`);
    console.log(`     First: [${result.diagnostics[0].severity}] ${result.diagnostics[0].code} (priority ${result.diagnostics[0].priority})`);
  }
}

// ── Test 9: Diagnostic deduplication ────────────────────────
console.log('\n── 9. Diagnostic Deduplication ──────────────────────\n');

{
  const screen = makeBalancedMateriScreen();
  const result = lintScreen(screen);

  // Check no duplicate codes
  const codes = result.diagnostics.map(d => d.code);
  const uniqueCodes = new Set(codes);
  assert(codes.length === uniqueCodes.size,
    `No duplicate codes: ${codes.length} diagnostics, ${uniqueCodes.size} unique`);
}

// ── Test 10: Diagnostic source classification ───────────────
console.log('\n── 10. Diagnostic Source Classification ───────────\n');

{
  const screen = makeBadScreen();
  const result = lintScreen(screen);

  const sources = new Set(result.diagnostics.map(d => d.source));
  assert(sources.size >= 1, `Has ${sources.size} distinct sources`);
  for (const source of sources) {
    assert(['composition', 'rhythm', 'resolver'].includes(source),
      `Source "${source}" is valid`);
  }
}

// ── Test 11: quickLint ──────────────────────────────────────
console.log('\n── 11. quickLint ──────────────────────────────────\n');

{
  const screen = makeBalancedMateriScreen();
  const quick = quickLint(screen);
  const full = lintScreen(screen);

  assert(quick.compositionScore === full.compositionScore,
    `quickLint score (${quick.compositionScore}) === lintScreen score (${full.compositionScore})`);
  assert(quick.grade === full.grade,
    `quickLint grade (${quick.grade}) === lintScreen grade (${full.grade})`);
}

// ── Test 12: Actionable diagnostics ─────────────────────────
console.log('\n── 12. Actionable Diagnostics ──────────────────────\n');

{
  const screen = makeBadScreen();
  const result = lintScreen(screen);

  const actionableCount = result.diagnostics.filter(d => d.actionable).length;
  const nonActionableCount = result.diagnostics.filter(d => !d.actionable).length;
  assert(actionableCount > 0, `Has ${actionableCount} actionable diagnostics`);
  console.log(`     Actionable: ${actionableCount}, Non-actionable: ${nonActionableCount}`);
}

// ── Summary ──────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log(`  Results: ${passedTests}/${totalTests} tests passed`);
if (passedTests === totalTests) {
  console.log('  🎉 ALL TESTS PASSED!');
} else {
  console.log(`  ⚠️  ${totalTests - passedTests} test(s) failed`);
}
console.log('═══════════════════════════════════════════════════════════\n');

process.exit(passedTests === totalTests ? 0 : 1);
