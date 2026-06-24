// ═══════════════════════════════════════════════════════════════════
// PROJECT SCHEMA VERSIONING — Sprint 8.6A
// ═══════════════════════════════════════════════════════════════════
// Project-level schema version gate for export/import JSON.
//
// SEPARATE FROM ScreenSchema.version:
//   - ScreenSchema.version (in validation.ts, currently = 2) is the
//     per-page schema version. migrateSchema() upgrades individual
//     page schemas to the latest version.
//   - CURRENT_PROJECT_SCHEMA_VERSION (this module) is the WHOLE-PROJECT
//     document version. It governs the top-level JSON shape exported
//     by use-export-actions.ts and imported by use-excel-import.ts.
//
// Why a separate version?
//   - Project-level changes (e.g., adding a new top-level field like
//     `canva`, changing the meta shape, etc.) need their own version
//     independent of per-page schema changes.
//   - The import path needs a single gate: "is this JSON document as
//     a whole compatible with the current runtime?"
//
// Compatibility semantics (fail-safe):
//   - missing schemaVersion → legacy → accept + migrate to current
//   - v0 → legacy → accept + migrate to current
//   - v1 (current) → accept as-is
//   - future v > current → REJECT (cannot migrate down)
//   - malformed (non-number, NaN, negative) → REJECT
//
// Migration preserves ALL existing fields (canva.pages, ratioId,
// contractId, pageMode, schema.themeId, templateData.*, navConfig,
// bgColor, bgDataUrl, overlay, schema.background, schema.blocks, etc.)
// ═══════════════════════════════════════════════════════════════════

import { logger } from '@/core/utils/logger';

// ── Constants ────────────────────────────────────────────────────────

/**
 * Current project schema version.
 *
 * Increment when making breaking changes to the project JSON shape
 * (top-level fields, canva structure, meta shape, etc.).
 *
 * History:
 *   - v0 / missing: legacy format (pre-Sprint 8.6A). Treated as
 *     migratable to v1.
 *   - v1: Sprint 8.6A — first explicit project schema version. Adds
 *     `schemaVersion` field to export JSON. Import path now gates on
 *     this field.
 */
export const CURRENT_PROJECT_SCHEMA_VERSION = 1;

// ── Types ────────────────────────────────────────────────────────────

/**
 * A project document as it appears in export/import JSON.
 * Loose-typed (mostly unknown) because legacy/future versions may
 * have different shapes — we only assert the fields we need.
 */
export interface ProjectDocumentInput {
  schemaVersion?: unknown;
  meta?: unknown;
  cp?: unknown;
  tp?: unknown;
  atp?: unknown;
  alur?: unknown;
  skenario?: unknown;
  kuis?: unknown;
  modules?: unknown;
  materi?: unknown;
  canva?: unknown;
  pages?: unknown; // legacy top-level pages (pre-8.4 format)
  [key: string]: unknown;
}

export interface ProjectDocumentOutput {
  schemaVersion: number;
  meta?: unknown;
  cp?: unknown;
  tp?: unknown;
  atp?: unknown;
  alur?: unknown;
  skenario?: unknown;
  kuis?: unknown;
  modules?: unknown;
  materi?: unknown;
  canva?: unknown;
  pages?: unknown;
  [key: string]: unknown;
}

export type ProjectSchemaMigrationResult =
  | { ok: true; document: ProjectDocumentOutput }
  | { ok: false; reason: 'future-version' | 'malformed-version' | 'invalid-shape'; message: string };

// ── Public API ───────────────────────────────────────────────────────

/**
 * Returns the current project schema version.
 * (Function form for future extensibility — e.g., reading from env.)
 */
export function getCurrentProjectSchemaVersion(): number {
  return CURRENT_PROJECT_SCHEMA_VERSION;
}

/**
 * Normalize raw input (could be missing, null, or any JSON value)
 * to a numeric version or `null` if missing/legacy.
 *
 *   - undefined / null → null (legacy, treated as v0)
 *   - number → that number (NaN/negative → null-malformed sentinel)
 *   - numeric string → parsed number
 *   - anything else → null (will be treated as malformed downstream)
 */
export function normalizeProjectSchemaVersion(input: unknown): number | null {
  if (input === undefined || input === null) {
    return null; // legacy / missing
  }
  if (typeof input === 'number') {
    if (Number.isNaN(input) || input < 0) return null;
    return input;
  }
  if (typeof input === 'string') {
    // Empty string → Number('') returns 0 in JS, but semantically should be
    // treated as malformed (not a numeric string). Reject explicitly.
    if (input.trim() === '') return null;
    const parsed = Number(input);
    if (!Number.isNaN(parsed) && parsed >= 0 && Number.isInteger(parsed)) {
      return parsed;
    }
    return null;
  }
  return null;
}

/**
 * Check if a numeric version is supported by the current runtime.
 *
 *   - null (missing/legacy) → true (can be migrated)
 *   - 0 → true (legacy, can be migrated)
 *   - 1..CURRENT → true (current or migratable to current)
 *   - > CURRENT → false (future version, cannot migrate down)
 *   - malformed (non-number, NaN, negative) → false (fail-safe)
 */
export function isSupportedProjectSchemaVersion(input: unknown): boolean {
  const v = normalizeProjectSchemaVersion(input);

  // Missing/legacy → supported (will be migrated to current)
  if (v === null) {
    // But we need to distinguish "missing" from "malformed".
    // If input was undefined/null → legacy → supported.
    // If input was a malformed value (non-number string, object, etc.) → not supported.
    if (input === undefined || input === null) {
      return true; // legacy
    }
    return false; // malformed
  }

  // v0 → legacy, migratable
  if (v === 0) return true;

  // v1..CURRENT → supported
  if (v >= 1 && v <= CURRENT_PROJECT_SCHEMA_VERSION) return true;

  // Future version → not supported (fail-safe)
  return false;
}

/**
 * Validate that the input is a parseable project document shape.
 * Returns true if it's a plain object (not null, not array, not primitive).
 * Does NOT validate field-level correctness — that's the migration step's job.
 */
export function validateProjectSchemaVersion(input: unknown): boolean {
  if (input === null || typeof input !== 'object') return false;
  if (Array.isArray(input)) return false;
  return true;
}

/**
 * Migrate a project document to the current schema version.
 *
 * Behavior:
 *   - If input is not a plain object → REJECT (invalid-shape)
 *   - If schemaVersion is malformed (non-number, NaN, negative, non-numeric string) → REJECT
 *   - If schemaVersion > CURRENT → REJECT (future-version, cannot migrate down)
 *   - If schemaVersion is missing/null/0 → legacy, accept + upgrade to CURRENT
 *   - If schemaVersion is 1..CURRENT → accept as-is + bump to CURRENT
 *
 * ALL existing fields are preserved (we only add/set schemaVersion).
 * Canva pages, schema, style authority fields, etc. are NOT touched.
 *
 * @returns ProjectSchemaMigrationResult
 *   - { ok: true, document } on success — document has schemaVersion = CURRENT
 *   - { ok: false, reason, message } on failure — caller must NOT mutate stores
 */
export function migrateProjectDocument(input: unknown): ProjectSchemaMigrationResult {
  // ── Shape validation ─────────────────────────────────────────
  if (!validateProjectSchemaVersion(input)) {
    return {
      ok: false,
      reason: 'invalid-shape',
      message: 'Dokumen project tidak valid: bukan object JSON.',
    };
  }

  const doc = input as ProjectDocumentInput;
  const rawVersion = doc.schemaVersion;

  // ── Malformed version detection ──────────────────────────────
  // Distinguish "missing" (legacy) from "malformed" (reject).
  if (rawVersion !== undefined && rawVersion !== null) {
    if (typeof rawVersion !== 'number' && typeof rawVersion !== 'string') {
      return {
        ok: false,
        reason: 'malformed-version',
        message: `schemaVersion malformed: ${typeof rawVersion} (harus number atau numeric string).`,
      };
    }
    if (typeof rawVersion === 'number') {
      if (Number.isNaN(rawVersion) || rawVersion < 0) {
        return {
          ok: false,
          reason: 'malformed-version',
          message: `schemaVersion malformed: ${rawVersion} (harus integer >= 0).`,
        };
      }
    }
    if (typeof rawVersion === 'string') {
      const parsed = Number(rawVersion);
      if (Number.isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        return {
          ok: false,
          reason: 'malformed-version',
          message: `schemaVersion malformed: "${rawVersion}" (harus numeric string).`,
        };
      }
    }
  }

  // ── Normalize version ────────────────────────────────────────
  const normalized = normalizeProjectSchemaVersion(rawVersion);

  // ── Future version rejection ─────────────────────────────────
  if (normalized !== null && normalized > CURRENT_PROJECT_SCHEMA_VERSION) {
    logger.warn(
      'PROJECT-SCHEMA',
      `Future project schemaVersion ${normalized} > runtime ${CURRENT_PROJECT_SCHEMA_VERSION} — rejected (fail-safe)`
    );
    return {
      ok: false,
      reason: 'future-version',
      message: `schemaVersion ${normalized} lebih baru dari runtime ${CURRENT_PROJECT_SCHEMA_VERSION}. ` +
        `Tidak dapat melakukan migrasi turun. Silakan update aplikasi.`,
    };
  }

  // ── Migration: preserve all fields, set schemaVersion = CURRENT ──
  // We do NOT touch canva.pages, schema, style authority fields, etc.
  // The only change is adding/bumping schemaVersion to CURRENT.
  const migrated: ProjectDocumentOutput = {
    ...doc,
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
  };

  if (normalized === null) {
    logger.info(
      'PROJECT-SCHEMA',
      `Legacy project document (no schemaVersion) — migrated to v${CURRENT_PROJECT_SCHEMA_VERSION}`
    );
  } else if (normalized < CURRENT_PROJECT_SCHEMA_VERSION) {
    logger.info(
      'PROJECT-SCHEMA',
      `Project document v${normalized} → migrated to v${CURRENT_PROJECT_SCHEMA_VERSION}`
    );
  }

  return { ok: true, document: migrated };
}
