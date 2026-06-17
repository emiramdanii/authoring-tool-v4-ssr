// ═══════════════════════════════════════════════════════════════════
// TypeScript Error Normalizer — Core Module (Sprint 8.2S-2-Patch-4)
// ═══════════════════════════════════════════════════════════════════
// This module exports the pure functions used by the CLI wrapper
// (normalize-ts-errors.js) AND by unit tests. Both import from HERE
// so tests can never diverge from production logic.
//
// Exports:
//   normalizeTscOutput(output) → Map<signature, count>
//   readBaseline(filePath) → Map<signature, count>
//   compareBaseline(current, baseline) → { newErrors, fixedErrors }
//   classifyProcessResult(result) → { ok, reason, exitCode }
//
// Sprint 8.2S-2-Patch-4 (P0-2 + P1-1 + P1-2):
//   - classifyProcessResult checks signal + null status (P0-2)
//   - readBaseline throws on malformed/duplicate (P1-2)
//   - TSC_ENTRY uses typescript/bin/tsc via process.execPath (P1-1)
// ═══════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// Sprint 8.2S-2-Patch-4 (P1-1): use TypeScript's JS entry point via
// process.execPath (Node binary) — cross-platform, no .cmd issues.
const TSC_ENTRY = path.join(
  __dirname, '..', 'node_modules', 'typescript', 'bin', 'tsc'
);

/**
 * Parse tsc output and normalize each error line.
 * Returns a Map<signature, count> (multiset).
 *
 * Signature format: "<file-path>|<TS-error-code>|<normalized-message>"
 * Line/col omitted so line shifts don't create false "new errors".
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
    message = message.replace(/\s+/g, ' ').trim();
    const signature = `${filepath}|${tscode}|${message}`;
    multiset.set(signature, (multiset.get(signature) ?? 0) + 1);
  }

  return multiset;
}

/**
 * Read baseline file. Format: <count>|<file-path>|<TS-code>|<message>
 *
 * Sprint 8.2S-2-Patch-4 (P1-2): fail-closed on malformed lines.
 * - Missing pipe → throw
 * - Non-integer count → throw
 * - Count < 1 → throw
 * - Duplicate signature → throw
 *
 * @param filePath — path to baseline file
 * @returns Map<signature, count>
 */
function readBaseline(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Baseline file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const multiset = new Map();

  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const firstPipe = trimmed.indexOf('|');
    if (firstPipe === -1) {
      throw new Error(`Invalid baseline line ${lineNumber}: missing pipe separator: "${trimmed}"`);
    }
    const countStr = trimmed.substring(0, firstPipe);
    const rest = trimmed.substring(firstPipe + 1);
    const count = parseInt(countStr, 10);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`Invalid baseline count at line ${lineNumber}: "${countStr}" (must be positive integer)`);
    }
    if (multiset.has(rest)) {
      throw new Error(`Duplicate baseline signature at line ${lineNumber}: "${rest}"`);
    }

    multiset.set(rest, count);
  }

  return multiset;
}

/**
 * Compare current errors against baseline multiset.
 *
 * - New errors (current count > baseline count) → fail
 * - Fixed errors (current count < baseline count) → warn
 *
 * @returns { newErrors: Array, fixedErrors: Array }
 */
function compareBaseline(currentErrors, baseline) {
  const newErrors = [];
  for (const [sig, currentCount] of currentErrors) {
    const baselineCount = baseline.get(sig) ?? 0;
    if (currentCount > baselineCount) {
      newErrors.push({
        signature: sig,
        baselineCount,
        currentCount,
        newCount: currentCount - baselineCount,
      });
    }
  }

  const fixedErrors = [];
  for (const [sig, baselineCount] of baseline) {
    const currentCount = currentErrors.get(sig) ?? 0;
    if (currentCount < baselineCount) {
      fixedErrors.push({
        signature: sig,
        baselineCount,
        currentCount,
        fixedCount: baselineCount - currentCount,
      });
    }
  }

  return { newErrors, fixedErrors };
}

/**
 * Classify a spawnSync result from running tsc.
 *
 * Sprint 8.2S-2-Patch-4 (P0-2): fail-closed on signal and null status.
 *
 * @param result — { status, signal, stdout, stderr, error }
 * @returns { ok: boolean, reason: string, exitCode: number|null }
 *   - ok=true: tsc ran normally (status is a number, even if non-zero)
 *   - ok=false: tsc failed abnormally (signal, null status, or ENOENT)
 */
function classifyProcessResult(result) {
  // ENOENT — executable not found
  if (result.error) {
    return { ok: false, reason: `tsc failed to start: ${result.error.message}`, exitCode: null };
  }

  // P0-2: signal kill (SIGTERM, SIGKILL from OOM/timeout)
  if (result.signal !== null && result.signal !== undefined) {
    return { ok: false, reason: `tsc terminated by signal: ${result.signal}`, exitCode: null };
  }

  // P0-2: null status (abnormal termination without signal)
  if (result.status === null) {
    return { ok: false, reason: 'tsc terminated abnormally: status=null, signal=null', exitCode: null };
  }

  // Normal exit (status is a number, even if non-zero)
  return { ok: true, reason: `tsc exited with status ${result.status}`, exitCode: result.status };
}

module.exports = {
  normalizeTscOutput,
  readBaseline,
  compareBaseline,
  classifyProcessResult,
  TSC_ENTRY,
};
