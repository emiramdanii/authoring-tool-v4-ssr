#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// TypeScript Baseline Normalizer — CLI (Sprint 8.2S-2-Patch-4)
// ═══════════════════════════════════════════════════════════════════
// Usage:
//   node scripts/normalize-ts-errors.js            # prints normalized errors
//   node scripts/normalize-ts-errors.js --check    # exits 1 if new errors vs baseline
//
// This CLI imports ALL logic from ts-error-normalizer-core.cjs.
// Tests also import from the same core module — they cannot diverge.
//
// Sprint 8.2S-2-Patch-4 (P0-2 + P1-1 + P1-2):
//   - signal + null status fail-closed via classifyProcessResult (P0-2)
//   - process.execPath + typescript/bin/tsc cross-platform (P1-1)
//   - readBaseline throws on malformed/duplicate (P1-2)
//   - Multiset comparison via compareBaseline
// ═══════════════════════════════════════════════════════════════════

const { spawnSync } = require('child_process');
const path = require('path');
const core = require('./ts-error-normalizer-core.cjs');
const { normalizeTscOutput, readBaseline, compareBaseline, classifyProcessResult, TSC_ENTRY } = core;

const BASELINE_FILE = path.join(__dirname, 'ts-baseline.txt');

/**
 * Run tsc --noEmit via spawnSync.
 *
 * Sprint 8.2S-2-Patch-4 (P1-1): use process.execPath + typescript/bin/tsc
 * for cross-platform compatibility (no .cmd issues on Windows).
 */
function runTsc() {
  const result = spawnSync(
    process.execPath,  // Node binary — cross-platform
    [TSC_ENTRY, '--noEmit'],
    {
      encoding: 'utf-8',
      shell: false,
      cwd: path.join(__dirname, '..'),
    }
  );

  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  };
}

function main() {
  const checkMode = process.argv.includes('--check');

  console.log('Running tsc --noEmit (via spawnSync, fail-closed, cross-platform)...');
  const tscResult = runTsc();

  // P0-2: classify process result — fail-closed on signal/null/ENOENT
  const classification = classifyProcessResult(tscResult);
  if (!classification.ok) {
    console.error(`❌ ${classification.reason}`);
    console.error('   This may indicate: OOM, timeout, config error, or missing tsc.');
    console.error('');
    console.error('--- tsc stdout (last 500 chars) ---');
    console.error(tscResult.stdout.slice(-500));
    console.error('--- tsc stderr ---');
    console.error(tscResult.stderr);
    process.exit(1);
  }

  const tscOutput = `${tscResult.stdout}\n${tscResult.stderr}`;
  const currentErrors = normalizeTscOutput(tscOutput);

  // Fail-closed: tsc exited non-zero but no recognized diagnostics
  if (tscResult.status !== 0 && currentErrors.size === 0) {
    console.error(`❌ tsc exited with status ${tscResult.status} but no recognized diagnostics found.`);
    console.error('   This may indicate: tsconfig invalid, tsc crash, or output format changed.');
    console.error('');
    console.error('--- tsc stdout ---');
    console.error(tscResult.stdout);
    console.error('--- tsc stderr ---');
    console.error(tscResult.stderr);
    process.exit(1);
  }

  // Defensive: tsc exited 0 but diagnostics found
  if (tscResult.status === 0 && currentErrors.size > 0) {
    console.error('❌ tsc exited 0 but diagnostics were found. This is unexpected.');
    process.exit(1);
  }

  if (!checkMode) {
    const total = [...currentErrors.values()].reduce((a, b) => a + b, 0);
    console.log(`\nNormalized errors (${currentErrors.size} unique signatures, ${total} total occurrences):`);
    for (const [sig, count] of [...currentErrors.entries()].sort()) {
      console.log(`  ${count}|${sig}`);
    }
    return;
  }

  // Check mode: compare against baseline multiset
  let baseline;
  try {
    baseline = readBaseline(BASELINE_FILE);
  } catch (err) {
    console.error('❌ Baseline file is corrupted:');
    console.error('  ', err.message);
    console.error('');
    console.error('Fix scripts/ts-baseline.txt or regenerate with `node scripts/normalize-ts-errors.js`.');
    process.exit(1);
  }

  const { newErrors, fixedErrors } = compareBaseline(currentErrors, baseline);

  const currentTotal = [...currentErrors.values()].reduce((a, b) => a + b, 0);
  const baselineTotal = [...baseline.values()].reduce((a, b) => a + b, 0);

  console.log(`\nTypeScript error count: current=${currentTotal} (${currentErrors.size} signatures) baseline=${baselineTotal} (${baseline.size} signatures)`);
  console.log(`New errors (current > baseline): ${newErrors.length}`);
  console.log(`Fixed errors (current < baseline): ${fixedErrors.length}`);

  if (newErrors.length > 0) {
    console.log('\n❌ New TypeScript error(s) introduced:');
    for (const e of newErrors) {
      console.log(`  +${e.newCount}  ${e.signature}  (was ${e.baselineCount}, now ${e.currentCount})`);
    }
    console.log('\nFix these errors OR update scripts/ts-baseline.txt with justification.');
    process.exit(1);
  }

  if (fixedErrors.length > 0) {
    console.log('\n✅ Error(s) fixed since baseline — update scripts/ts-baseline.txt:');
    for (const e of fixedErrors) {
      console.log(`  -${e.fixedCount}  ${e.signature}  (was ${e.baselineCount}, now ${e.currentCount})`);
    }
    console.log('\n::warning::Baseline has stale entries. Update scripts/ts-baseline.txt to shrink the debt window.');
  } else {
    console.log('\n✅ No new TypeScript errors introduced');
  }
}

// Export for testing
module.exports = { runTsc, BASELINE_FILE };

// Run main only if invoked directly
if (require.main === module) {
  main();
}
