#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// TypeScript Baseline Normalizer (Sprint 8.2S-2-Patch-3 — hardened)
// ═══════════════════════════════════════════════════════════════════
// Usage:
//   node scripts/normalize-ts-errors.js            # prints normalized errors
//   node scripts/normalize-ts-errors.js --check    # exits 1 if new errors vs baseline
//
// Sprint 8.2S-2-Patch-3 changes (Senior Review P0-3 + P1-1):
//
// P0-3 — Fail-closed on tsc failure:
//   Previous version used execSync + try/catch, which silently swallowed
//   tsc failures (OOM, config error, internal crash). If tsc failed
//   without producing recognized diagnostics, the script would see an
//   empty error set and exit 0 (false green).
//
//   Fix: use spawnSync directly, capture exit status + stderr.
//   - If tsc fails to start (ENOENT) → exit 1
//   - If tsc exits non-zero BUT no recognized diagnostics → exit 1
//     (this catches OOM, config errors, internal crashes)
//   - If tsc exits 0 BUT diagnostics found → exit 1 (shouldn't happen,
//     but defensive)
//   - Use node_modules/.bin/tsc directly (not npx) to avoid resolution
//     ambiguity and network calls.
//
// P1-1 — Multiset baseline comparison:
//   Previous version used Set dedupe. If a file already had
//   `file.ts|TS1117|duplicate property` and a developer added another
//   duplicate property with identical message, the Set wouldn't detect
//   the new error (same signature).
//
//   Fix: use Map<signature, count> (multiset). Baseline format becomes:
//     <count>|<file-path>|<TS-error-code>|<normalized-message>
//   Gate fails if current count for any signature > baseline count.
//   Gate warns if current count < baseline count (errors fixed — update
//   baseline).
//
// Normalization rules (unchanged from Patch-2):
//   1. Parse tsc output: "src/path/file.ts(LINE,COL): error TSCODE: message"
//   2. Extract: file path | TS error code | normalized message
//   3. Normalize message: collapse whitespace, strip line/col refs
//   4. Count occurrences per signature (multiset)
//   5. Compare against baseline multiset
// ═══════════════════════════════════════════════════════════════════

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, 'ts-baseline.txt');
const TSC_BIN = path.join(__dirname, '..', 'node_modules', '.bin', 'tsc');

/**
 * Run tsc --noEmit via spawnSync. Returns { status, stdout, stderr, error }.
 *
 * Sprint 8.2S-2-Patch-3: use spawnSync directly (not execSync) so we
 * can distinguish:
 *   - process failed to start (ENOENT) → result.error set
 *   - process started but exited non-zero → result.status set
 *   - process started and exited zero → result.status === 0
 */
function runTsc() {
  const result = spawnSync(
    process.platform === 'win32' ? TSC_BIN + '.cmd' : TSC_BIN,
    ['--noEmit'],
    {
      encoding: 'utf-8',
      shell: false,
      cwd: path.join(__dirname, '..'),
    }
  );

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error,
  };
}

/**
 * Parse tsc output and normalize each error line.
 * Returns a Map<signature, count> (multiset).
 *
 * Signature format: "<file-path>|<TS-error-code>|<normalized-message>"
 */
function normalizeTscOutput(output) {
  const lines = output.split('\n');
  const pattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
  const multiset = new Map();

  for (const line of lines) {
    const m = line.match(pattern);
    if (!m) continue;
    const filepath = m[1];
    const tscode = m[4];
    let message = m[5];
    // Normalize whitespace
    message = message.replace(/\s+/g, ' ').trim();
    const signature = `${filepath}|${tscode}|${message}`;
    multiset.set(signature, (multiset.get(signature) ?? 0) + 1);
  }

  return multiset;
}

/**
 * Read baseline file. Format (Patch-3 multiset):
 *   <count>|<file-path>|<TS-error-code>|<normalized-message>
 *
 * Lines starting with # are comments. Blank lines skipped.
 * Returns Map<signature, count>.
 */
function readBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    throw new Error(`Baseline file not found: ${BASELINE_FILE}`);
  }
  const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
  const lines = content.split('\n');
  const multiset = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse: <count>|<file-path>|<TS-code>|<message>
    // count is everything before the first |
    const firstPipe = trimmed.indexOf('|');
    if (firstPipe === -1) continue;
    const countStr = trimmed.substring(0, firstPipe);
    const rest = trimmed.substring(firstPipe + 1);
    const count = parseInt(countStr, 10);
    if (!Number.isFinite(count)) continue;

    multiset.set(rest, count);
  }

  return multiset;
}

/**
 * Main entry point.
 */
function main() {
  const checkMode = process.argv.includes('--check');

  console.log('Running tsc --noEmit (via spawnSync, fail-closed)...');
  const tscResult = runTsc();

  // P0-3: fail-closed on tsc failure to start
  if (tscResult.error) {
    console.error('❌ tsc failed to start:', tscResult.error.message);
    console.error('   This usually means node_modules/.bin/tsc is missing.');
    console.error('   Run `npm install` to fix.');
    process.exit(1);
  }

  const tscOutput = `${tscResult.stdout}\n${tscResult.stderr}`;
  const currentErrors = normalizeTscOutput(tscOutput);

  // P0-3: fail-closed on tsc non-zero exit with no recognized diagnostics
  // This catches OOM, config errors, internal crashes.
  if (tscResult.status !== 0 && currentErrors.size === 0) {
    console.error('❌ tsc exited with status', tscResult.status, 'but no recognized diagnostics found.');
    console.error('   This may indicate:');
    console.error('   - tsc ran out of memory (OOM)');
    console.error('   - tsconfig.json is invalid');
    console.error('   - tsc internal compiler crash');
    console.error('   - tsc output format changed (baseline script needs update)');
    console.error('');
    console.error('--- tsc stdout ---');
    console.error(tscResult.stdout);
    console.error('--- tsc stderr ---');
    console.error(tscResult.stderr);
    process.exit(1);
  }

  // P0-3: defensive — tsc exited 0 but we found diagnostics?
  // This shouldn't happen but if it does, fail-closed.
  if (tscResult.status === 0 && currentErrors.size > 0) {
    console.error('❌ tsc exited 0 but diagnostics were found. This is unexpected.');
    console.error('   The baseline script may need updating.');
    process.exit(1);
  }

  if (!checkMode) {
    // Just print normalized errors
    console.log(`\nNormalized errors (${currentErrors.size} unique signatures, ${[...currentErrors.values()].reduce((a, b) => a + b, 0)} total occurrences):`);
    for (const [sig, count] of [...currentErrors.entries()].sort()) {
      console.log(`  ${count}|${sig}`);
    }
    return;
  }

  // Check mode: compare against baseline multiset
  const baseline = readBaseline();

  // Find signatures where current count > baseline count (new errors)
  const newErrors = [];
  for (const [sig, currentCount] of currentErrors) {
    const baselineCount = baseline.get(sig) ?? 0;
    if (currentCount > baselineCount) {
      newErrors.push({ signature: sig, baselineCount, currentCount, newCount: currentCount - baselineCount });
    }
  }

  // Find signatures where current count < baseline count (fixed errors)
  const fixedErrors = [];
  for (const [sig, baselineCount] of baseline) {
    const currentCount = currentErrors.get(sig) ?? 0;
    if (currentCount < baselineCount) {
      fixedErrors.push({ signature: sig, baselineCount, currentCount, fixedCount: baselineCount - currentCount });
    }
  }

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

main();
