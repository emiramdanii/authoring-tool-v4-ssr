#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// TypeScript Baseline Normalizer (Sprint 8.2S-2-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Usage:
//   node scripts/normalize-ts-errors.js            # prints normalized errors
//   node scripts/normalize-ts-errors.js --check    # exits 1 if new errors vs baseline
//
// Normalization rules (per Senior Review 8.2S-2-Patch-2 P1-2):
//   1. Parse tsc output lines: "src/path/file.ts(LINE,COL): error TSCODE: message"
//   2. Extract: file path | TS error code | normalized message
//   3. Normalize message: collapse whitespace, strip line/col refs
//   4. Sort + dedupe (multiple errors in same file with same code+msg = 1 entry)
//   5. Compare against baseline (scripts/ts-baseline.txt) using SET diff:
//      - New errors (in current, not in baseline) → FAIL
//      - Fixed errors (in baseline, not in current) → WARNING (update baseline)
//
// Why no line/col? Line shifts from code edits would create false
// "new errors" even though the actual error is unchanged. The
// (file + TS code + message) tuple is the stable identity.
// ═══════════════════════════════════════════════════════════════════

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, 'ts-baseline.txt');

/**
 * Run tsc --noEmit and capture output.
 */
function runTsc() {
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
    return ''; // tsc exited 0 — no errors
  } catch (err) {
    // tsc exits 1 if there are errors — that's expected.
    return err.stdout || err.stderr || '';
  }
}

/**
 * Parse tsc output and normalize each error line.
 * Returns a Set of "filepath|TSCODE|normalized_message" strings.
 */
function normalizeTscOutput(output) {
  const lines = output.split('\n');
  const pattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
  const normalized = new Set();

  for (const line of lines) {
    const m = line.match(pattern);
    if (!m) continue;
    const filepath = m[1];
    const tscode = m[4];
    let message = m[5];
    // Normalize whitespace
    message = message.replace(/\s+/g, ' ').trim();
    normalized.add(`${filepath}|${tscode}|${message}`);
  }

  return normalized;
}

/**
 * Read baseline file, skip comment lines, return Set of entries.
 */
function readBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    throw new Error(`Baseline file not found: ${BASELINE_FILE}`);
  }
  const content = fs.readFileSync(BASELINE_FILE, 'utf-8');
  const lines = content.split('\n');
  const entries = new Set();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    entries.add(trimmed);
  }
  return entries;
}

/**
 * Main entry point.
 */
function main() {
  const checkMode = process.argv.includes('--check');

  console.log('Running tsc --noEmit...');
  const tscOutput = runTsc();
  const currentErrors = normalizeTscOutput(tscOutput);

  if (!checkMode) {
    // Just print normalized errors
    console.log(`\nNormalized errors (${currentErrors.size}):`);
    for (const e of [...currentErrors].sort()) {
      console.log(e);
    }
    return;
  }

  // Check mode: compare against baseline
  const baseline = readBaseline();

  const newErrors = [...currentErrors].filter(e => !baseline.has(e));
  const fixedErrors = [...baseline].filter(e => !currentErrors.has(e));

  console.log(`\nTypeScript error count: current=${currentErrors.size} baseline=${baseline.size}`);
  console.log(`New errors (not in baseline): ${newErrors.length}`);
  console.log(`Fixed errors (in baseline, not in current): ${fixedErrors.length}`);

  if (newErrors.length > 0) {
    console.log('\n❌ New TypeScript error(s) introduced:');
    for (const e of newErrors) {
      console.log(`  ${e}`);
    }
    console.log('\nFix these errors OR add them to scripts/ts-baseline.txt with justification.');
    process.exit(1);
  }

  if (fixedErrors.length > 0) {
    console.log('\n✅ Error(s) fixed since baseline — update scripts/ts-baseline.txt:');
    for (const e of fixedErrors) {
      console.log(`  ${e}`);
    }
    console.log('\n::warning::Baseline has stale entries. Update scripts/ts-baseline.txt to shrink the debt window.');
  } else {
    console.log('\n✅ No new TypeScript errors introduced');
  }
}

main();
