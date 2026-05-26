/**
 * E2E Test: FASE 11A.3 — Composition Analyzer
 *
 * Tests the full composition analysis pipeline:
 *   1. analyzeBalance() — visual/text/interactive ratios + section-type-aware ideals
 *   2. analyzeDensity() — block count, variety, streaks, nesting
 *   3. analyzeIntents() — intent distribution, dilution, monoculture detection
 *   4. analyzeSequence() — required blocks, position violations
 *   5. analyzeComposition() — full report with diagnostics
 *   6. quickCompositionScore() — fast score for resolver
 *   7. Edge cases — empty screens, single blocks, overloaded sections
 */

import { resolveSectionPreset } from '../core/vcs/resolver';
import { resolveScreenRhythm } from '../core/vcs/TransitionRhythmEngine';
import {
  analyzeBalance,
  analyzeDensity,
  analyzeIntents,
  analyzeSequence,
  analyzeComposition,
  quickCompositionScore,
} from '../core/vcs/CompositionAnalyzer';

import type { ScreenSchema, SchemaBlock } from '../core/schema/types/schema';
import type { ResolvedSectionPreset } from '../core/vcs/types';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

/** Well-composed materi section — balanced mix of text + visual + interactive */
function makeBalancedMateriScreen(): ScreenSchema {
  return {
    id: 'screen-materi-balanced',
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

/** Text-heavy materi section — wall of text */
function makeTextHeavyMateriScreen(): ScreenSchema {
  return {
    id: 'screen-materi-textheavy',
    templateType: 'materi',
    sectionType: 'materi',
    blocks: [
      { type: 'materi-section', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
      { type: 'def-box', id: 'b2', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'tabel', id: 'b3', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'materi-blok', id: 'b4', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'tabel-accord', id: 'b5', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'checklist', id: 'b6', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'def-box', id: 'b7', visualIntent: 'secondary' } as SchemaBlock,
    ],
  };
}

/** Overloaded materi section — too many blocks */
function makeOverloadedMateriScreen(): ScreenSchema {
  const blocks: SchemaBlock[] = [];
  for (let i = 0; i < 15; i++) {
    blocks.push({
      type: i === 0 ? 'materi-section' : 'def-box',
      id: `b${i}`,
      visualIntent: 'secondary',
    } as SchemaBlock);
  }
  return {
    id: 'screen-materi-overloaded',
    templateType: 'materi',
    sectionType: 'materi',
    blocks,
  };
}

/** Highlight-diluted section — everything is highlight */
function makeHighlightDilutedScreen(): ScreenSchema {
  return {
    id: 'screen-highlight-diluted',
    templateType: 'materi',
    sectionType: 'materi',
    blocks: [
      { type: 'materi-section', id: 'b1', visualIntent: 'highlight' } as SchemaBlock,
      { type: 'def-box', id: 'b2', visualIntent: 'highlight' } as SchemaBlock,
      { type: 'nc-grid', id: 'b3', visualIntent: 'highlight' } as SchemaBlock,
      { type: 'gambar', id: 'b4', visualIntent: 'highlight' } as SchemaBlock,
      { type: 'flashcard-set', id: 'b5', visualIntent: 'highlight' } as SchemaBlock,
      { type: 'diskusi', id: 'b6', visualIntent: 'highlight' } as SchemaBlock,
    ],
  };
}

/** Cover section — should be visual-heavy (that's ideal) */
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

/** Game section — should be interactive-heavy */
function makeGameScreen(): ScreenSchema {
  return {
    id: 'screen-game',
    templateType: 'game',
    sectionType: 'game',
    blocks: [
      { type: 'kuis', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
      { type: 'sortir-game', id: 'b2', visualIntent: 'primary' } as SchemaBlock,
    ],
  };
}

/** Empty screen */
function makeEmptyScreen(): ScreenSchema {
  return {
    id: 'screen-empty',
    templateType: 'custom',
    sectionType: 'custom',
    blocks: [],
  };
}

/** Single block screen */
function makeSingleBlockScreen(): ScreenSchema {
  return {
    id: 'screen-single',
    templateType: 'custom',
    sectionType: 'custom',
    blocks: [
      { type: 'def-box', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
    ],
  };
}

/** Section with position violations */
function makePositionViolationScreen(): ScreenSchema {
  return {
    id: 'screen-refleksi-violation',
    templateType: 'refleksi',
    sectionType: 'refleksi',
    blocks: [
      // refleksi block is recommended at 'middle' but placed at 'start'
      { type: 'refleksi', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
      { type: 'diskusi', id: 'b2', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'flashcard-set', id: 'b3', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'penutup', id: 'b4', visualIntent: 'quiet' } as SchemaBlock,
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════

function setup(screen: ScreenSchema): { resolved: ResolvedSectionPreset; rhythm: ReturnType<typeof resolveScreenRhythm> } {
  const resolved = resolveSectionPreset(screen);
  const rhythm = resolveScreenRhythm(screen, resolved);
  return { resolved, rhythm };
}

function pass(label: string) { console.log(`  ✅ ${label}`); }
function fail(label: string, detail?: string) { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); }

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, label: string, detail?: string) {
  totalTests++;
  if (condition) { passedTests++; pass(label); }
  else { fail(label, detail); }
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  FASE 11A.3 — Composition Analyzer E2E Tests');
console.log('═══════════════════════════════════════════════════════════\n');

// ── Test 1: Balance Analysis ─────────────────────────────────
console.log('── 1. Balance Analysis ──────────────────────────────\n');

{
  const { resolved } = setup(makeBalancedMateriScreen());
  const balance = analyzeBalance(makeBalancedMateriScreen(), resolved);

  assert(balance.classification === 'balanced',
    `Balanced materi: classification = ${balance.classification}`,
    `Expected 'balanced'`);

  assert(balance.visualRatio > 0.1,
    `Balanced materi: visualRatio = ${balance.visualRatio} > 0.1`);

  assert(balance.textRatio > 0.1,
    `Balanced materi: textRatio = ${balance.textRatio} > 0.1`);

  assert(balance.balanceScore >= 60,
    `Balanced materi: balanceScore = ${balance.balanceScore} >= 60`,
    `Got ${balance.balanceScore}`);
}

{
  const { resolved } = setup(makeCoverScreen());
  const balance = analyzeBalance(makeCoverScreen(), resolved);

  assert(balance.classification === 'visual-heavy',
    `Cover section: classification = ${balance.classification}`,
    `Expected 'visual-heavy' or similar`);

  // Cover IDEAL is 80% visual, so a visual-heavy cover should score well
  assert(balance.balanceScore >= 60,
    `Cover section: balanceScore = ${balance.balanceScore} >= 60 (section-type-aware ideal)`);
}

{
  const { resolved } = setup(makeTextHeavyMateriScreen());
  const balance = analyzeBalance(makeTextHeavyMateriScreen(), resolved);

  assert(balance.textRatio > 0.6,
    `Text-heavy materi: textRatio = ${balance.textRatio} > 0.6`);

  // Text-heavy materi should score LOWER than balanced materi
  const { resolved: resolvedBalanced } = setup(makeBalancedMateriScreen());
  const balanceBalanced = analyzeBalance(makeBalancedMateriScreen(), resolvedBalanced);

  assert(balance.balanceScore < balanceBalanced.balanceScore,
    `Text-heavy (${balance.balanceScore}) < balanced (${balanceBalanced.balanceScore})`);
}

// ── Test 2: Density Analysis ─────────────────────────────────
console.log('\n── 2. Density Analysis ─────────────────────────────\n');

{
  const { resolved } = setup(makeBalancedMateriScreen());
  const density = analyzeDensity(makeBalancedMateriScreen(), resolved);

  assert(density.blockCount === 6,
    `Balanced materi: blockCount = ${density.blockCount}`,
    `Expected 6`);

  assert(!density.exceedsMax,
    `Balanced materi: exceedsMax = false (6 blocks, maxBlocks = ${resolved.density.maxBlocks})`);

  assert(density.classification === 'comfortable' || density.classification === 'dense',
    `Balanced materi: classification = ${density.classification}`);

  assert(density.densityScore >= 60,
    `Balanced materi: densityScore = ${density.densityScore} >= 60`);
}

{
  const { resolved } = setup(makeOverloadedMateriScreen());
  const density = analyzeDensity(makeOverloadedMateriScreen(), resolved);

  assert(density.exceedsMax,
    `Overloaded: exceedsMax = true (15 blocks, max = ${resolved.density.maxBlocks})`);

  assert(density.classification === 'overloaded',
    `Overloaded: classification = ${density.classification}`);

  assert(density.overflowAmount === 15 - resolved.density.maxBlocks,
    `Overloaded: overflowAmount = ${density.overflowAmount}`);
}

{
  const { resolved } = setup(makeEmptyScreen());
  const density = analyzeDensity(makeEmptyScreen(), resolved);

  assert(density.classification === 'empty',
    `Empty: classification = ${density.classification}`);

  assert(density.densityScore === 100,
    `Empty: densityScore = ${density.densityScore} (100 = perfect for empty)`);
}

{
  const { resolved } = setup(makeSingleBlockScreen());
  const density = analyzeDensity(makeSingleBlockScreen(), resolved);

  assert(density.classification === 'sparse',
    `Single block: classification = ${density.classification}`);

  assert(density.blockTypeVariety === 1,
    `Single block: blockTypeVariety = ${density.blockTypeVariety}`);
}

// ── Test 3: Intent Distribution ──────────────────────────────
console.log('\n── 3. Intent Distribution ──────────────────────────\n');

{
  const { resolved } = setup(makeBalancedMateriScreen());
  const intents = analyzeIntents(makeBalancedMateriScreen(), resolved);

  assert(!intents.highlightDiluted,
    `Balanced: highlightDiluted = false (1 highlight out of 6 blocks)`);

  assert(!intents.noEmphasis,
    `Balanced: noEmphasis = false (has highlight)`);

  assert(intents.intentScore >= 70,
    `Balanced: intentScore = ${intents.intentScore} >= 70`);

  assert((intents.counts.highlight ?? 0) === 1,
    `Balanced: highlight count = ${intents.counts.highlight}`);
}

{
  const { resolved } = setup(makeHighlightDilutedScreen());
  const intents = analyzeIntents(makeHighlightDilutedScreen(), resolved);

  assert(intents.highlightDiluted,
    `Diluted: highlightDiluted = true (6 highlights out of 6 blocks)`);

  assert(intents.intentScore < 70,
    `Diluted: intentScore = ${intents.intentScore} < 70`,
    `Got ${intents.intentScore}`);
}

{
  const { resolved } = setup(makeTextHeavyMateriScreen());
  const intents = analyzeIntents(makeTextHeavyMateriScreen(), resolved);

  // All blocks have secondary intent → monoculture
  const usedIntents = Object.keys(intents.counts).length;
  assert(usedIntents <= 2,
    `Text-heavy: intent variety = ${usedIntents} (mostly same intent)`);
}

// ── Test 4: Sequence Analysis ────────────────────────────────
console.log('\n── 4. Sequence Analysis ────────────────────────────\n');

{
  const { resolved } = setup(makeBalancedMateriScreen());
  const sequence = analyzeSequence(makeBalancedMateriScreen(), resolved);

  // materi-section is required and present at 'start'
  assert(sequence.requiredPresent,
    `Balanced materi: requiredPresent = true`);

  assert(sequence.adherenceScore >= 60,
    `Balanced materi: adherenceScore = ${sequence.adherenceScore} >= 60`);
}

{
  const { resolved } = setup(makePositionViolationScreen());
  const sequence = analyzeSequence(makePositionViolationScreen(), resolved);

  // refleksi is recommended at 'middle' but placed at 'start' (index 0)
  const hasViolation = sequence.positionViolations.length > 0;
  assert(hasViolation,
    `Position violation detected: ${sequence.positionViolations.length} violations`);

  if (sequence.positionViolations.length > 0) {
    const v = sequence.positionViolations[0];
    assert(v.blockType === 'refleksi',
      `Violation blockType = ${v.blockType}`);
    assert(v.expectedPosition === 'middle',
      `Expected position = ${v.expectedPosition}`);
    assert(v.actualPosition === 'start',
      `Actual position = ${v.actualPosition}`);
  }
}

{
  const { resolved } = setup(makeEmptyScreen());
  const sequence = analyzeSequence(makeEmptyScreen(), resolved);

  // Empty screen should have missing required blocks (if custom has any)
  assert(sequence.missingCount >= 0,
    `Empty: missingCount = ${sequence.missingCount}`);
}

// ── Test 5: Full Composition Report ──────────────────────────
console.log('\n── 5. Full Composition Report ─────────────────────\n');

{
  const screen = makeBalancedMateriScreen();
  const { resolved, rhythm } = setup(screen);
  const report = analyzeComposition(screen, resolved, rhythm);

  assert(report.screenId === 'screen-materi-balanced',
    `Report screenId = ${report.screenId}`);

  assert(report.sectionType === 'materi',
    `Report sectionType = ${report.sectionType}`);

  assert(report.compositionScore >= 60,
    `Balanced: compositionScore = ${report.compositionScore} >= 60`,
    `Got ${report.compositionScore}`);

  assert(report.cadenceScore > 0,
    `Report cadenceScore = ${report.cadenceScore} > 0`);

  assert(Array.isArray(report.diagnostics),
    `Report diagnostics is array`);

  assert(Array.isArray(report.rhythmDiagnostics),
    `Report rhythmDiagnostics is array`);

  console.log(`\n  📊 Balanced Materi Report:`);
  console.log(`     Composition Score: ${report.compositionScore}/100`);
  console.log(`     Cadence Score:     ${report.cadenceScore}/100`);
  console.log(`     Balance Score:     ${report.balance.balanceScore}/100 (${report.balance.classification})`);
  console.log(`     Density Score:     ${report.density.densityScore}/100 (${report.density.classification})`);
  console.log(`     Intent Score:      ${report.intents.intentScore}/100`);
  console.log(`     Sequence Score:    ${report.sequence.adherenceScore}/100`);
  console.log(`     Diagnostics:       ${report.diagnostics.length}`);
  console.log(`     Warnings:          ${report.warnings.length}`);
}

{
  const screen = makeOverloadedMateriScreen();
  const { resolved, rhythm } = setup(screen);
  const report = analyzeComposition(screen, resolved, rhythm);

  assert(report.compositionScore < 70,
    `Overloaded: compositionScore = ${report.compositionScore} < 70`);

  const hasDensityWarning = report.diagnostics.some(d => d.code === 'composition/density-overload');
  assert(hasDensityWarning,
    `Overloaded: has density-overload diagnostic`);

  console.log(`\n  📊 Overloaded Materi Report:`);
  console.log(`     Composition Score: ${report.compositionScore}/100`);
  console.log(`     Diagnostics: ${report.diagnostics.map(d => d.code).join(', ')}`);
}

{
  const screen = makeHighlightDilutedScreen();
  const { resolved, rhythm } = setup(screen);
  const report = analyzeComposition(screen, resolved, rhythm);

  const hasDilutionWarning = report.diagnostics.some(d => d.code === 'composition/highlight-diluted');
  assert(hasDilutionWarning,
    `Highlight-diluted: has highlight-diluted diagnostic`);

  console.log(`\n  📊 Highlight Diluted Report:`);
  console.log(`     Composition Score: ${report.compositionScore}/100`);
  console.log(`     Intent Score: ${report.intents.intentScore}/100`);
}

// ── Test 6: quickCompositionScore ────────────────────────────
console.log('\n── 6. Quick Composition Score ──────────────────────\n');

{
  const screen = makeBalancedMateriScreen();
  const { resolved, rhythm } = setup(screen);

  const quickScore = quickCompositionScore(screen, resolved, rhythm);
  const fullReport = analyzeComposition(screen, resolved, rhythm);

  assert(quickScore === fullReport.compositionScore,
    `Quick score (${quickScore}) === Full score (${fullReport.compositionScore})`);
}

// ── Test 7: Edge Cases ───────────────────────────────────────
console.log('\n── 7. Edge Cases ──────────────────────────────────\n');

{
  const { resolved, rhythm } = setup(makeEmptyScreen());
  const report = analyzeComposition(makeEmptyScreen(), resolved, rhythm);

  assert(report.balance.classification === 'empty',
    `Empty: balance.classification = empty`);

  assert(report.density.classification === 'empty',
    `Empty: density.classification = empty`);

  assert(report.compositionScore >= 0,
    `Empty: compositionScore = ${report.compositionScore} >= 0`);
}

{
  const { resolved, rhythm } = setup(makeGameScreen());
  const report = analyzeComposition(makeGameScreen(), resolved, rhythm);

  // Game section is expected to be interactive-heavy
  assert(report.balance.interactiveRatio > 0.5,
    `Game: interactiveRatio = ${report.balance.interactiveRatio} > 0.5`);

  // Game with interactive-heavy content should score well (section-type-aware)
  assert(report.balance.balanceScore >= 50,
    `Game: balanceScore = ${report.balance.balanceScore} >= 50 (section-type-aware)`);
}

{
  // Test that computeCompositionScore in resolver works
  const screen = makeBalancedMateriScreen();
  const { computeCompositionScore } = require('../core/vcs/resolver');
  const resolved = resolveSectionPreset(screen);
  const score = computeCompositionScore(screen, resolved);

  assert(typeof score === 'number' && score >= 0 && score <= 100,
    `resolver.computeCompositionScore() = ${score} (valid 0-100)`);
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
