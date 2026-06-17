// ═══════════════════════════════════════════════════════════════════
// TypeScript Normalizer Unit Tests  (Sprint 8.2S-2-Patch-4)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2S-2-Patch-4 — Senior Review P0-2 + P1-1 + P1-2
//
// These tests import from the PRODUCTION core module
// (scripts/ts-error-normalizer-core.cjs) — NOT inline copies.
// This ensures tests can never diverge from production logic.
//
// Coverage:
//   - normalizeTscOutput: parsing + multiset counting + whitespace normalization
//   - readBaseline: fail-closed on malformed lines, invalid counts, duplicates
//   - classifyProcessResult: signal kill, null status, ENOENT, normal exit
//   - compareBaseline: new errors, fixed errors, multiset comparison
//   - TSC_ENTRY: cross-platform binary path exists
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Import from PRODUCTION core module — tests verify real production code.
const core = require('../../scripts/ts-error-normalizer-core.cjs');
const { normalizeTscOutput, readBaseline, compareBaseline, classifyProcessResult, TSC_ENTRY } = core;

// ═══════════════════════════════════════════════════════════════════
// normalizeTscOutput tests
// ═══════════════════════════════════════════════════════════════════

describe('normalizeTscOutput', () => {
  it('parses a normal error line', () => {
    const output = "src/foo.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.";
    const result = normalizeTscOutput(output);
    expect(result.size).toBe(1);
    const [sig, count] = [...result.entries()][0];
    expect(sig).toBe("src/foo.ts|TS2322|Type 'string' is not assignable to type 'number'.");
    expect(count).toBe(1);
  });

  it('skips non-error lines', () => {
    const output = `
src/foo.ts(10,5): error TS2322: Type error here.
Some random log line.
src/bar.ts(20,10): error TS2307: Cannot find module.
    `;
    const result = normalizeTscOutput(output);
    expect(result.size).toBe(2);
  });

  it('counts duplicate signatures (multiset)', () => {
    const output = `
src/foo.ts(10,5): error TS1117: An object literal cannot have multiple properties with the same name.
src/foo.ts(20,5): error TS1117: An object literal cannot have multiple properties with the same name.
src/foo.ts(30,5): error TS1117: An object literal cannot have multiple properties with the same name.
    `;
    const result = normalizeTscOutput(output);
    expect(result.size).toBe(1);
    expect([...result.values()][0]).toBe(3);
  });

  it('normalizes whitespace in messages', () => {
    const output = "src/foo.ts(1,1): error TS9999: Message   with    multiple spaces.";
    const result = normalizeTscOutput(output);
    const [sig] = [...result.entries()][0];
    expect(sig).toContain('Message with multiple spaces.');
  });

  it('returns empty map for empty output', () => {
    expect(normalizeTscOutput('').size).toBe(0);
    expect(normalizeTscOutput('\n\n\n').size).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// readBaseline fail-closed tests (P1-2)
// ═══════════════════════════════════════════════════════════════════

describe('readBaseline (P1-2 fail-closed)', () => {
  let tmpDir: string;
  let tmpBaseline: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-baseline-test-'));
    tmpBaseline = path.join(tmpDir, 'ts-baseline.txt');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('parses a valid baseline', () => {
    fs.writeFileSync(tmpBaseline, [
      '# comment',
      '',
      '1|src/foo.ts|TS2322|Type error',
      '2|src/bar.ts|TS2307|Cannot find module',
      '',
    ].join('\n'));
    const result = readBaseline(tmpBaseline);
    expect(result.size).toBe(2);
    expect(result.get('src/foo.ts|TS2322|Type error')).toBe(1);
    expect(result.get('src/bar.ts|TS2307|Cannot find module')).toBe(2);
  });

  it('throws on missing pipe separator (P1-2)', () => {
    fs.writeFileSync(tmpBaseline, 'this line has no pipe\n');
    expect(() => readBaseline(tmpBaseline)).toThrow(/missing pipe separator/);
  });

  it('throws on non-integer count (P1-2)', () => {
    fs.writeFileSync(tmpBaseline, 'abc|src/foo.ts|TS2322|error\n');
    expect(() => readBaseline(tmpBaseline)).toThrow(/Invalid baseline count/);
  });

  it('throws on count < 1 (P1-2)', () => {
    fs.writeFileSync(tmpBaseline, '0|src/foo.ts|TS2322|error\n');
    expect(() => readBaseline(tmpBaseline)).toThrow(/Invalid baseline count/);
  });

  it('throws on negative count (P1-2)', () => {
    fs.writeFileSync(tmpBaseline, '-1|src/foo.ts|TS2322|error\n');
    expect(() => readBaseline(tmpBaseline)).toThrow(/Invalid baseline count/);
  });

  it('throws on duplicate signature (P1-2)', () => {
    fs.writeFileSync(tmpBaseline, [
      '1|src/foo.ts|TS2322|error',
      '1|src/foo.ts|TS2322|error',
    ].join('\n'));
    expect(() => readBaseline(tmpBaseline)).toThrow(/Duplicate baseline signature/);
  });

  it('throws when baseline file is missing', () => {
    const missingPath = path.join(tmpDir, 'nonexistent.txt');
    expect(() => readBaseline(missingPath)).toThrow(/Baseline file not found/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// classifyProcessResult tests (P0-2)
// ═══════════════════════════════════════════════════════════════════

describe('classifyProcessResult (P0-2 signal + null status)', () => {
  it('returns ok=false on SIGKILL (OOM kill)', () => {
    const result = classifyProcessResult({
      status: null, signal: 'SIGKILL', stdout: '', stderr: '', error: undefined,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('SIGKILL');
  });

  it('returns ok=false on SIGTERM (timeout kill)', () => {
    const result = classifyProcessResult({
      status: null, signal: 'SIGTERM', stdout: '', stderr: '', error: undefined,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('SIGTERM');
  });

  it('returns ok=false on null status without signal (abnormal)', () => {
    const result = classifyProcessResult({
      status: null, signal: null, stdout: '', stderr: '', error: undefined,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('abnormally');
  });

  it('returns ok=false on ENOENT error (executable not found)', () => {
    const result = classifyProcessResult({
      status: null, signal: null, stdout: '', stderr: '',
      error: new Error('spawn tsc ENOENT'),
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('failed to start');
  });

  it('returns ok=true on normal exit status 1 (errors found)', () => {
    const result = classifyProcessResult({
      status: 1, signal: null, stdout: 'errors here', stderr: '', error: undefined,
    });
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(1);
  });

  it('returns ok=true on clean exit status 0 (no errors)', () => {
    const result = classifyProcessResult({
      status: 0, signal: null, stdout: '', stderr: '', error: undefined,
    });
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// compareBaseline tests (multiset)
// ═══════════════════════════════════════════════════════════════════

describe('compareBaseline (multiset comparison)', () => {
  it('detects new errors (current count > baseline)', () => {
    const current = new Map([['a|TS1|msg', 3], ['b|TS2|msg', 1]]);
    const baseline = new Map([['a|TS1|msg', 1]]);
    const { newErrors, fixedErrors } = compareBaseline(current, baseline);
    expect(newErrors.length).toBe(2); // a (3>1) + b (1>0)
    expect(fixedErrors.length).toBe(0);
  });

  it('detects fixed errors (current count < baseline)', () => {
    const current = new Map([['a|TS1|msg', 1]]);
    const baseline = new Map([['a|TS1|msg', 3], ['b|TS2|msg', 1]]);
    const { newErrors, fixedErrors } = compareBaseline(current, baseline);
    expect(newErrors.length).toBe(0);
    expect(fixedErrors.length).toBe(2);
  });

  it('detects completely new signatures not in baseline', () => {
    const current = new Map([['new|TS1|msg', 1]]);
    const baseline = new Map([['old|TS2|msg', 1]]);
    const { newErrors, fixedErrors } = compareBaseline(current, baseline);
    expect(newErrors.length).toBe(1);
    expect(fixedErrors.length).toBe(1);
  });

  it('returns empty arrays when counts match exactly', () => {
    const current = new Map([['a|TS1|msg', 2]]);
    const baseline = new Map([['a|TS1|msg', 2]]);
    const { newErrors, fixedErrors } = compareBaseline(current, baseline);
    expect(newErrors.length).toBe(0);
    expect(fixedErrors.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// TSC_ENTRY cross-platform tests (P1-1)
// ═══════════════════════════════════════════════════════════════════

describe('TSC_ENTRY (P1-1 cross-platform)', () => {
  it('points to typescript/bin/tsc (JS entry, not .cmd)', () => {
    expect(TSC_ENTRY).toContain('typescript');
    expect(TSC_ENTRY).toContain('bin');
    expect(TSC_ENTRY).toContain('tsc');
    // Must NOT use .bin/tsc or .cmd
    expect(TSC_ENTRY).not.toContain('.bin');
    expect(TSC_ENTRY).not.toContain('.cmd');
  });

  it('file exists if typescript is installed', () => {
    const tsPkgDir = path.join(__dirname, '..', '..', 'node_modules', 'typescript');
    if (fs.existsSync(tsPkgDir)) {
      expect(fs.existsSync(TSC_ENTRY)).toBe(true);
    }
  });
});
