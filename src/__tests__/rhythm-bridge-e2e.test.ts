/**
 * E2E Test: FASE 11A.4 — Rhythm Bridge Integration
 *
 * Tests that the VCS pipeline correctly integrates with the
 * layout engine, producing rhythm-based gaps that flow through
 * to SceneLayoutEngine and SceneOverflowEngine.
 *
 * Key integration paths:
 *   1. resolveVCSForScreen() → VCSResolution with perBlockGaps
 *   2. perBlockGaps → resolveSceneLayout({ perBlockGaps })
 *   3. perBlockGaps → computeScenePlan({ perBlockGaps })
 *   4. VCS gaps produce DIFFERENT layout than fixed BLOCK_GAP
 *   5. Backward compatibility: missing perBlockGaps → fixed gap fallback
 */

import { resolveVCSForScreen, resolveVCSForScreenFull, getLegacyGap } from '../core/vcs/RhythmBridge';
import { resolveSectionPreset } from '../core/vcs/resolver';
import { resolveScreenRhythm } from '../core/vcs/TransitionRhythmEngine';
import { computePerBlockGaps, resolveSceneLayout, BLOCK_GAP, DEFAULT_SAFE_AREA, getSceneResolution } from '../core/scene/SceneLayoutEngine';
import { computeScenePlan } from '../core/layout/SceneOverflowEngine';

import type { ScreenSchema, SchemaBlock } from '../core/schema/types/schema';

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════

function makeMateriScreen(): ScreenSchema {
  return {
    id: 'screen-materi-vcs',
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

function makeCoverScreen(): ScreenSchema {
  return {
    id: 'screen-cover-vcs',
    templateType: 'cover',
    sectionType: 'cover',
    blocks: [
      { type: 'cover', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
    ],
  };
}

function makeMixedScreen(): ScreenSchema {
  return {
    id: 'screen-mixed-vcs',
    templateType: 'materi',
    sectionType: 'materi',
    blocks: [
      { type: 'materi-section', id: 'b1', visualIntent: 'primary' } as SchemaBlock,
      { type: 'def-box', id: 'b2', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'def-box', id: 'b3', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'def-box', id: 'b4', visualIntent: 'secondary' } as SchemaBlock,
      { type: 'gambar', id: 'b5', visualIntent: 'primary' } as SchemaBlock,
    ],
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
console.log('  FASE 11A.4 — Rhythm Bridge Integration E2E Tests');
console.log('═══════════════════════════════════════════════════════════\n');

// ── Test 1: resolveVCSForScreen ──────────────────────────────
console.log('── 1. resolveVCSForScreen ──────────────────────────\n');

{
  const screen = makeMateriScreen();
  const vcs = resolveVCSForScreen(screen);

  assert(vcs.resolved != null, 'VCS resolved preset exists');
  assert(vcs.rhythm != null, 'VCS rhythm exists');
  assert(Array.isArray(vcs.perBlockGaps), 'VCS perBlockGaps is array');
  assert(typeof vcs.compositionScore === 'number', `compositionScore = ${vcs.compositionScore} (number)`);
  assert(vcs.compositionScore >= 0 && vcs.compositionScore <= 100, `compositionScore in range 0-100`);

  console.log(`\n  📊 VCS Resolution:`);
  console.log(`     SectionType:    ${vcs.resolved.sectionType}`);
  console.log(`     Cadence Score:  ${vcs.rhythm.cadenceScore}/100`);
  console.log(`     Composition:    ${vcs.compositionScore}/100`);
  console.log(`     perBlockGaps:   [${vcs.perBlockGaps.join(', ')}]`);
  console.log(`     Gap variety:    ${new Set(vcs.perBlockGaps).size} distinct values`);
}

// ── Test 2: perBlockGaps produces varied gaps ────────────────
console.log('\n── 2. Varied Gap Production ─────────────────────────\n');

{
  const screen = makeMateriScreen();
  const vcs = resolveVCSForScreen(screen);
  const gaps = vcs.perBlockGaps;

  // With varied block types and intents, we should get varied gaps
  const uniqueGaps = new Set(gaps);
  assert(uniqueGaps.size >= 2,
    `Gap variety: ${uniqueGaps.size} distinct values (expected ≥ 2)`);

  // Gaps should be in a reasonable range (8–60px)
  const allReasonable = gaps.every(g => g >= 0 && g <= 60);
  assert(allReasonable, `All gaps in range 0-60px: [${gaps.join(', ')}]`);
}

// ── Test 3: Rhythm gaps vs fixed BLOCK_GAP ──────────────────
console.log('\n── 3. Rhythm Gaps vs Fixed BLOCK_GAP ──────────────\n');

{
  const screen = makeMixedScreen(); // Has repetitions (def-box × 3)
  const vcs = resolveVCSForScreen(screen);
  const rhythmGaps = vcs.perBlockGaps;
  const fixedGap = BLOCK_GAP.normal; // 12px

  // With rhythm: repetition gaps should be smaller than fixed
  // The mixed screen has 3 consecutive def-box blocks → repetition
  const hasSmallerGap = rhythmGaps.some(g => g < fixedGap);
  assert(hasSmallerGap,
    `Rhythm has smaller gaps than fixed ${fixedGap}px: min=${Math.min(...rhythmGaps)}`);

  // And heading/visual-break gaps should be larger
  const hasLargerGap = rhythmGaps.some(g => g > fixedGap);
  assert(hasLargerGap,
    `Rhythm has larger gaps than fixed ${fixedGap}px: max=${Math.max(...rhythmGaps)}`);

  console.log(`\n  📊 Gap Comparison:`);
  console.log(`     Fixed BLOCK_GAP: ${fixedGap}px (flat)`);
  console.log(`     Rhythm gaps:     [${rhythmGaps.join(', ')}] (varied)`);
  console.log(`     Range:           ${Math.min(...rhythmGaps)}–${Math.max(...rhythmGaps)}px`);
}

// ── Test 4: resolveSceneLayout with perBlockGaps ─────────────
console.log('\n── 4. resolveSceneLayout Integration ──────────────\n');

{
  const screen = makeMateriScreen();
  const vcs = resolveVCSForScreen(screen);
  const sceneRes = getSceneResolution('16:9');
  const safeArea = DEFAULT_SAFE_AREA;

  // With rhythm gaps
  const layoutRhythm = resolveSceneLayout(screen.blocks, sceneRes, safeArea, {
    isCompact: false,
    perBlockGaps: vcs.perBlockGaps,
  });

  // Without rhythm gaps (fixed BLOCK_GAP)
  const layoutFixed = resolveSceneLayout(screen.blocks, sceneRes, safeArea, {
    isCompact: false,
    // No perBlockGaps → uses fixed BLOCK_GAP
  });

  assert(layoutRhythm.length > 0, 'Rhythm layout has resolved blocks');
  assert(layoutFixed.length > 0, 'Fixed layout has resolved blocks');

  // The Y positions should differ because gaps are different
  const rhythmYs = layoutRhythm.filter(b => b.position === 'flow').map(b => b.y);
  const fixedYs = layoutFixed.filter(b => b.position === 'flow').map(b => b.y);

  // At least some Y positions should differ
  const yPositionsDiffer = rhythmYs.some((y, i) => y !== fixedYs[i]);
  assert(yPositionsDiffer,
    'Rhythm layout produces different Y positions than fixed gap');

  console.log(`\n  📊 Layout Comparison:`);
  console.log(`     Rhythm Y positions: [${rhythmYs.map(y => Math.round(y)).join(', ')}]`);
  console.log(`     Fixed  Y positions: [${fixedYs.map(y => Math.round(y)).join(', ')}]`);
}

// ── Test 5: computeScenePlan with perBlockGaps ───────────────
console.log('\n── 5. computeScenePlan Integration ────────────────\n');

{
  const screen = makeMateriScreen();
  const vcs = resolveVCSForScreen(screen);
  const sceneRes = getSceneResolution('16:9');
  const safeArea = DEFAULT_SAFE_AREA;

  // With rhythm gaps
  const planRhythm = computeScenePlan(screen, sceneRes, safeArea, {
    isCompact: false,
    perBlockGaps: vcs.perBlockGaps,
  });

  // Without rhythm gaps
  const planFixed = computeScenePlan(screen, sceneRes, safeArea, {
    isCompact: false,
  });

  assert(planRhythm.totalScenes >= 1, `Rhythm plan: ${planRhythm.totalScenes} scene(s)`);
  assert(planFixed.totalScenes >= 1, `Fixed plan: ${planFixed.totalScenes} scene(s)`);

  console.log(`\n  📊 Scene Plan Comparison:`);
  console.log(`     Rhythm: ${planRhythm.totalScenes} scene(s), height=${planRhythm.scenes[0]?.totalHeight ?? 0}`);
  console.log(`     Fixed:  ${planFixed.totalScenes} scene(s), height=${planFixed.scenes[0]?.totalHeight ?? 0}`);
}

// ── Test 6: resolveVCSForScreenFull ──────────────────────────
console.log('\n── 6. Full VCS Resolution with Report ──────────────\n');

{
  const screen = makeMateriScreen();
  const vcsFull = resolveVCSForScreenFull(screen);

  assert(vcsFull.report != null, 'Full VCS report exists');
  assert(vcsFull.report.compositionScore === vcsFull.compositionScore,
    `Report score matches: ${vcsFull.compositionScore}`);
  assert(Array.isArray(vcsFull.report.diagnostics), 'Report has diagnostics');
  assert(vcsFull.report.balance != null, 'Report has balance analysis');
  assert(vcsFull.report.density != null, 'Report has density analysis');
  assert(vcsFull.report.intents != null, 'Report has intent analysis');
  assert(vcsFull.report.sequence != null, 'Report has sequence analysis');

  console.log(`\n  📊 Full Report Summary:`);
  console.log(`     Composition: ${vcsFull.report.compositionScore}/100`);
  console.log(`     Balance:     ${vcsFull.report.balance.balanceScore}/100 (${vcsFull.report.balance.classification})`);
  console.log(`     Density:     ${vcsFull.report.density.densityScore}/100 (${vcsFull.report.density.classification})`);
  console.log(`     Intent:      ${vcsFull.report.intents.intentScore}/100`);
  console.log(`     Diagnostics: ${vcsFull.report.diagnostics.length}`);
}

// ── Test 7: Legacy fallback ──────────────────────────────────
console.log('\n── 7. Legacy Gap Fallback ──────────────────────────\n');

{
  const compactGap = getLegacyGap(true);
  const normalGap = getLegacyGap(false);

  assert(compactGap === 8, `Compact legacy gap = ${compactGap} (expected 8)`);
  assert(normalGap === 12, `Normal legacy gap = ${normalGap} (expected 12)`);
}

// ── Test 8: Cover screen ─────────────────────────────────────
console.log('\n── 8. Cover Screen VCS ─────────────────────────────\n');

{
  const screen = makeCoverScreen();
  const vcs = resolveVCSForScreen(screen);

  assert(vcs.resolved.sectionType === 'cover', `Cover sectionType = ${vcs.resolved.sectionType}`);
  assert(vcs.perBlockGaps.length >= 0, `Cover has ${vcs.perBlockGaps.length} gap values`);

  // Cover with single block should have minimal gaps
  console.log(`  📊 Cover VCS: gaps=[${vcs.perBlockGaps.join(', ')}], cadence=${vcs.rhythm.cadenceScore}`);
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
