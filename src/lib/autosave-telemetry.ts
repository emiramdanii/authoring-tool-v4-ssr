// ═══════════════════════════════════════════════════════════════════
// AUTOSAVE TELEMETRY — Sprint 9.0B
// ═══════════════════════════════════════════════════════════════════
// Minimal internal telemetry for autosave failures. No external
// dependencies, no analytics service — just an observable state
// that tests can verify.
//
// Usage:
//   import { recordAutosaveFailure, getAutosaveTelemetry, clearAutosaveTelemetry } from '@/lib/autosave-telemetry';
//
//   // On save failure:
//   recordAutosaveFailure('quota-exceeded', new Error('QuotaExceededError'));
//
//   // In tests:
//   const telemetry = getAutosaveTelemetry();
//   expect(telemetry.lastError).not.toBeNull();
//   expect(telemetry.errorCount).toBe(1);
//
//   // On successful save after failure:
//   clearAutosaveTelemetry();
// ═══════════════════════════════════════════════════════════════════

import { logger } from '@/core/utils/logger';

export type AutosaveFailureReason =
  | 'quota-exceeded'
  | 'serialization-error'
  | 'storage-unavailable'
  | 'stack-overflow'
  | 'unknown';

export interface AutosaveTelemetry {
  /** Last error message (null if no error) */
  lastError: string | null;
  /** Last failure reason (null if no error) */
  lastReason: AutosaveFailureReason | null;
  /** Total number of autosave failures since last clear */
  errorCount: number;
  /** Timestamp of last failure (null if no error) */
  lastFailureAt: number | null;
  /** Timestamp of last successful clear (null if never cleared after error) */
  lastClearedAt: number | null;
}

let _telemetry: AutosaveTelemetry = {
  lastError: null,
  lastReason: null,
  errorCount: 0,
  lastFailureAt: null,
  lastClearedAt: null,
};

/**
 * Record an autosave failure. Increments errorCount, sets lastError.
 * Also logs to console via logger.warn for dev visibility.
 */
export function recordAutosaveFailure(
  reason: AutosaveFailureReason,
  error: unknown,
): void {
  const message = error instanceof Error ? error.message : String(error);
  _telemetry = {
    lastError: message,
    lastReason: reason,
    errorCount: _telemetry.errorCount + 1,
    lastFailureAt: Date.now(),
    lastClearedAt: _telemetry.lastClearedAt,
  };
  logger.warn('AUTOSAVE-TELEMETRY', `Autosave failure (${reason}): ${message}`);
}

/**
 * Get current autosave telemetry state. Read-only — does not modify.
 */
export function getAutosaveTelemetry(): Readonly<AutosaveTelemetry> {
  return { ..._telemetry };
}

/**
 * Clear autosave telemetry after a successful save.
 * Resets errorCount to 0, clears lastError, sets lastClearedAt.
 */
export function clearAutosaveTelemetry(): void {
  if (_telemetry.errorCount > 0 || _telemetry.lastError !== null) {
    _telemetry = {
      lastError: null,
      lastReason: null,
      errorCount: 0,
      lastFailureAt: null,
      lastClearedAt: Date.now(),
    };
  }
}

/**
 * Reset telemetry to initial state (for tests).
 * Clears everything including lastClearedAt.
 */
export function _resetAutosaveTelemetry(): void {
  _telemetry = {
    lastError: null,
    lastReason: null,
    errorCount: 0,
    lastFailureAt: null,
    lastClearedAt: null,
  };
}
