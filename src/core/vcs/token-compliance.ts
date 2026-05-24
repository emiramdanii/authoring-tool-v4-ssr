/**
 * RC Stabilization — Token Compliance Checker
 *
 * Build-time / test-time checker for iOS Visual Contract compliance.
 * Scans source code (not runtime output) for token violations in renderer files.
 *
 * This complements the VisualLinter which operates on ScreenSchema.
 * The token compliance checker catches violations that the schema-level
 * linter cannot see — CSS patterns hardcoded in renderer components.
 *
 * Usage:
 *   import { checkTokenCompliance, TokenComplianceResult } from './token-compliance';
 *   const result = checkTokenCompliance(rendererSource);
 *
 * Violation codes:
 *   TOKEN_TRANSITION_ALL       — transition-all in renderer blocks
 *   TOKEN_HOVER_SCALE_EXCEEDED — hover:scale-105+ in renderer blocks
 *   TOKEN_DURATION_EXCEEDED    — duration-500+ or inline duration > 300ms
 *   TOKEN_SHADOW_LEVEL_INVALID — shadow-xl or shadow-2xl in renderer blocks
 *   TOKEN_INLINE_SLOW_TRANSITION — inline transition > 300ms in style objects
 */

export interface TokenViolation {
  /** Violation code */
  code: 'TOKEN_TRANSITION_ALL' | 'TOKEN_HOVER_SCALE_EXCEEDED' | 'TOKEN_DURATION_EXCEEDED' | 'TOKEN_SHADOW_LEVEL_INVALID' | 'TOKEN_INLINE_SLOW_TRANSITION';
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  /** Line number in the source file (1-based) */
  line: number;
  /** The offending code snippet */
  snippet: string;
  /** Suggested fix */
  suggestion: string;
}

export interface TokenComplianceResult {
  /** Total violations found */
  total: number;
  /** Violations by code */
  byCode: Record<string, number>;
  /** Individual violations sorted by line */
  violations: TokenViolation[];
  /** Whether the file passes (0 errors) */
  pass: boolean;
  /** Score: 100 - (errors * 10 + warnings * 3 + info * 1) */
  score: number;
}

/**
 * Check a source file's content for token compliance violations.
 * Designed for renderer block files (src/core/renderer/blocks/*.tsx).
 */
export function checkTokenCompliance(source: string): TokenComplianceResult {
  const lines = source.split('\n');
  const violations: TokenViolation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    // ── TOKEN_TRANSITION_ALL ──
    if (/\btransition-all\b/.test(line)) {
      violations.push({
        code: 'TOKEN_TRANSITION_ALL',
        severity: 'error',
        line: lineNum,
        snippet: line.trim(),
        suggestion: 'Use transition-[property1,property2] or tokens.iosTransitionStyle() instead',
      });
    }

    // ── TOKEN_HOVER_SCALE_EXCEEDED ──
    const scaleMatch = line.match(/hover:scale-(10[5-9]|1[1-9]\d|[2-9]\d\d)/);
    if (scaleMatch) {
      violations.push({
        code: 'TOKEN_HOVER_SCALE_EXCEEDED',
        severity: 'error',
        line: lineNum,
        snippet: line.trim(),
        suggestion: 'Use hover:scale-[1.02] or hover:scale-[1.03] (iOS Interaction max)',
      });
    }

    // ── TOKEN_DURATION_EXCEEDED ──
    const durMatch = line.match(/duration-([5-9]\d\d|[1-9]\d{3,})/);
    if (durMatch) {
      violations.push({
        code: 'TOKEN_DURATION_EXCEEDED',
        severity: 'warning',
        line: lineNum,
        snippet: line.trim(),
        suggestion: 'Use duration-300 or less (iOS Interaction max: 300ms)',
      });
    }

    // ── TOKEN_SHADOW_LEVEL_INVALID ──
    if (/\bshadow-(xl|2xl)\b/.test(line)) {
      violations.push({
        code: 'TOKEN_SHADOW_LEVEL_INVALID',
        severity: 'error',
        line: lineNum,
        snippet: line.trim(),
        suggestion: 'Use shadow-sm, shadow-md, or tokens.iosShadow(level)',
      });
    }

    // ── TOKEN_INLINE_SLOW_TRANSITION ──
    // Match inline transition strings with duration >= 0.4s
    // Pattern: '0.4s', '0.5s', '0.6s' etc. or '1s', '2s' etc. (no decimal prefix)
    const inlineTransitionMatch = line.match(/transition:\s*['"`][^'"]*?(?<!\d\.)(0\.[4-9]\d*|[1-9]\d*)s/);
    if (inlineTransitionMatch) {
      violations.push({
        code: 'TOKEN_INLINE_SLOW_TRANSITION',
        severity: 'warning',
        line: lineNum,
        snippet: line.trim(),
        suggestion: 'Use tokens.iosTransitionStyle() — max 300ms per iOS Interaction contract',
      });
    }
  }

  // Compute summary
  const byCode: Record<string, number> = {};
  for (const v of violations) {
    byCode[v.code] = (byCode[v.code] || 0) + 1;
  }

  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const infoCount = violations.filter(v => v.severity === 'info').length;
  const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5 - infoCount);

  return {
    total: violations.length,
    byCode,
    violations: violations.sort((a, b) => a.line - b.line),
    pass: errorCount === 0,
    score,
  };
}

/**
 * Check multiple source files and return aggregate result.
 */
export function checkTokenComplianceBatch(
  files: Array<{ path: string; source: string }>,
): {
  totalViolations: number;
  passCount: number;
  failCount: number;
  averageScore: number;
  results: Array<{ path: string } & TokenComplianceResult>;
} {
  const results = files.map(f => ({
    path: f.path,
    ...checkTokenCompliance(f.source),
  }));

  const totalViolations = results.reduce((sum, r) => sum + r.total, 0);
  const passCount = results.filter(r => r.pass).length;
  const failCount = results.filter(r => !r.pass).length;
  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 100;

  return { totalViolations, passCount, failCount, averageScore, results };
}
