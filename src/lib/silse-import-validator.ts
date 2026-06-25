// ═══════════════════════════════════════════════════════════════
// BATCH-08 — SILSE Import JSON Validator
// ═══════════════════════════════════════════════════════════════
// Validates a JSON document claimed to be a SILSE project import.
//
// Design goals (per senior audit scope):
//   1. Typed SilseImportJson (TypeScript type for the expected shape)
//   2. Validator with 6 check layers:
//        a. version — schemaVersion must be present, numeric, ≤ CURRENT
//        b. metadata — meta object with required fields (judulPertemuan,
//           mapel, kelas) and safe string values
//        c. learningFlow/pages — canva.pages must be a non-empty array
//           of valid page shapes
//        d. registered block types — every block.type must be in the
//           REGISTERED_BLOCK_TYPES set (re-uses validation.ts registry)
//        e. no raw HTML/CSS/JS liar — no <script>, <style>, on* event
//           handlers, javascript: URLs in any string field
//        f. no eval/Function — no eval(, new Function(, setTimeout(string),
//           setInterval(string) patterns
//   3. Sample valid JSON fixture
//   4. Sample invalid JSON fixtures (one per rejection reason)
//   5. Unit tests covering all valid + reject cases
//
// SECURITY-FIRST: This validator is the GATE between untrusted JSON
// (user upload, AI-generated, third-party) and the runtime. Any
// rejection here prevents the document from reaching the store.
//
// Fail-safe: when in doubt, REJECT. A false negative (rejecting a
// valid file) is recoverable (user fixes + retries). A false positive
// (accepting a malicious file) is a security incident.
// ═══════════════════════════════════════════════════════════════

import { CURRENT_PROJECT_SCHEMA_VERSION } from '@/core/schema/project-schema-versioning';
import { getRegisteredBlockTypes } from '@/core/schema/validation';

// ───────────────────────────────────────────────────────────────
// 1. Typed SilseImportJson
// ───────────────────────────────────────────────────────────────

/**
 * The expected shape of a SILSE project import JSON document.
 *
 * This is the CANONICAL shape — the validator checks that an incoming
 * JSON document matches this shape (with reasonable leniency for
 * optional fields). Documents that match can be safely loaded into
 * the runtime.
 *
 * Note: We use `unknown` for nested block content because each block
 * type has its own shape (see SchemaBlock union in src/core/schema/types).
 * The validator checks block.type against the registry, but does NOT
 * deep-validate per-type block content (that's done by validateSchema
 * after import).
 */
export interface SilseImportJson {
  /** Project schema version (must be ≤ CURRENT_PROJECT_SCHEMA_VERSION) */
  schemaVersion: number;

  /** Project metadata */
  meta: {
    judulPertemuan: string;
    mapel: string;
    kelas: string;
    namaGuru?: string;
    namaSekolah?: string;
    semester?: string | number;
    tahunAjaran?: string;
    [key: string]: unknown;
  };

  /** Canvas state — pages + ratio */
  canva: {
    pages: SilseImportPage[];
    ratioId?: string;
    currentPageIndex?: number;
    [key: string]: unknown;
  };

  /** Optional authoring data (kuis bank, modules, etc.) */
  kuis?: unknown[];
  modules?: unknown[];
  games?: unknown[];
  skenario?: unknown[];
  materi?: unknown;
  cp?: unknown;
  tp?: unknown[];
  atp?: unknown;
  alur?: unknown[];
  petunjuk?: unknown;
  diskusi?: unknown;
  refleksi?: unknown;
  penutup?: unknown;
  suara?: unknown;
}

/** A page in the SILSE import format. */
export interface SilseImportPage {
  id: string;
  label?: string;
  templateType: string;
  bgColor?: string;
  overlay?: number;
  elements?: unknown[];
  navConfig?: unknown;
  templateData?: unknown;
  pageMode?: string;
  schema?: {
    id?: string;
    version?: number;
    templateType?: string;
    themeId?: string;
    sceneType?: string;
    background?: unknown;
    blocks: SilseImportBlock[];
  };
  [key: string]: unknown;
}

/** A block in the SILSE import format. */
export interface SilseImportBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

// ───────────────────────────────────────────────────────────────
// 2. Validation Result
// ───────────────────────────────────────────────────────────────

export type SilseImportRejectReason =
  | 'invalid-json'
  | 'not-object'
  | 'missing-schemaversion'
  | 'invalid-schemaversion'
  | 'future-schemaversion'
  | 'missing-meta'
  | 'invalid-meta'
  | 'missing-meta-judul'
  | 'missing-meta-mapel'
  | 'missing-meta-kelas'
  | 'missing-canva'
  | 'invalid-canva'
  | 'missing-pages'
  | 'empty-pages'
  | 'invalid-page-shape'
  | 'page-missing-schema'
  | 'page-missing-blocks'
  | 'unregistered-block-type'
  | 'block-missing-type'
  | 'block-missing-id'
  | 'dangerous-html-script'
  | 'dangerous-html-style'
  | 'dangerous-event-handler'
  | 'dangerous-javascript-url'
  | 'dangerous-eval'
  | 'dangerous-function-constructor'
  | 'dangerous-settimeout-string'
  | 'non-serializable-value';

export interface SilseImportValidationResult {
  /** True if the document is safe to import */
  valid: boolean;
  /** Single rejection reason (when valid=false) */
  reason?: SilseImportRejectReason;
  /** Human-readable error message (Indonesian, for user-facing display) */
  message: string;
  /** Path to the first failing field (e.g., "canva.pages[2].schema.blocks[0].type") */
  path?: string;
  /** The validated document (only present when valid=true) */
  document?: SilseImportJson;
  /** All errors found (when valid=false, may have multiple) */
  errors?: Array<{ path: string; reason: SilseImportRejectReason; message: string }>;
}

// ───────────────────────────────────────────────────────────────
// 3. Helpers
// ───────────────────────────────────────────────────────────────

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

// ───────────────────────────────────────────────────────────────
// 4. Dangerous Content Detectors
// ───────────────────────────────────────────────────────────────

/**
 * Patterns that indicate raw HTML/CSS/JS injection attempts.
 * The validator REJECTS any string field containing these patterns.
 *
 * Rationale: even though React escapes HTML by default, exported
 * HTML uses dangerouslySetInnerHTML in some renderers (RichText,
 * def-box content). A malicious string like "<script>alert(1)</script>"
 * in a block.content field could execute when exported HTML is opened
 * by a teacher or student.
 *
 * False positives: a legitimate lesson about HTML would have its
 * <script> examples rejected. This is acceptable — teachers should
 * use code blocks (which escape content) not raw HTML fields.
 */
const DANGEROUS_PATTERNS: Array<{
  pattern: RegExp;
  reason: SilseImportRejectReason;
  label: string;
}> = [
  // <script> tags — any form (open, close, self-closing, mixed case)
  { pattern: /<\s*script\b/i, reason: 'dangerous-html-script', label: '<script> tag' },
  // </script> close tag (catches split injection attempts)
  { pattern: /<\s*\/\s*script\s*>/i, reason: 'dangerous-html-script', label: '</script> tag' },
  // <style> tags — can be used for CSS-based attacks (data exfiltration, UI redressing)
  { pattern: /<\s*style\b/i, reason: 'dangerous-html-style', label: '<style> tag' },
  // on* event handlers: onclick=, onload=, onerror=, onmouseover=, etc.
  // Matches on<word>=  (e.g., onclick=, onload=, ONERROR=)
  { pattern: /\bon\w+\s*=/i, reason: 'dangerous-event-handler', label: 'on*= event handler' },
  // javascript: URLs — in href, src, or any string context
  { pattern: /javascript\s*:/i, reason: 'dangerous-javascript-url', label: 'javascript: URL' },
  // eval() — direct eval
  { pattern: /\beval\s*\(/, reason: 'dangerous-eval', label: 'eval() call' },
  // new Function() — indirect eval
  { pattern: /\bnew\s+Function\s*\(/, reason: 'dangerous-function-constructor', label: 'new Function()' },
  // setTimeout(string, ...) / setInterval(string, ...) — string-as-code
  { pattern: /\bsetTimeout\s*\(\s*['"]/, reason: 'dangerous-settimeout-string', label: 'setTimeout(string)' },
  { pattern: /\bsetInterval\s*\(\s*['"]/, reason: 'dangerous-settimeout-string', label: 'setInterval(string)' },
];

/**
 * Scan a string value for dangerous patterns.
 * Returns the first match (if any) with its reason + label.
 */
function scanStringForDangerousContent(
  value: string,
): { reason: SilseImportRejectReason; label: string; match: string } | null {
  for (const { pattern, reason, label } of DANGEROUS_PATTERNS) {
    const match = value.match(pattern);
    if (match) {
      return { reason, label, match: match[0] };
    }
  }
  return null;
}

/**
 * Recursively walk an object/array/primitive tree and scan all string
 * values for dangerous content. Stops at the first match.
 *
 * Returns the path + reason of the first dangerous string found.
 */
function scanTreeForDangerousContent(
  value: unknown,
  path: string,
): { path: string; reason: SilseImportRejectReason; label: string; match: string } | null {
  if (typeof value === 'string') {
    const danger = scanStringForDangerousContent(value);
    if (danger) {
      return { path, ...danger };
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const result = scanTreeForDangerousContent(value[i], `${path}[${i}]`);
      if (result) return result;
    }
    return null;
  }

  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      const result = scanTreeForDangerousContent(value[key], path ? `${path}.${key}` : key);
      if (result) return result;
    }
    return null;
  }

  // number, boolean, null, undefined — safe
  return null;
}

// ───────────────────────────────────────────────────────────────
// 5. Main Validator
// ───────────────────────────────────────────────────────────────

/**
 * Validate a JSON document as a SILSE import.
 *
 * @param raw The parsed JSON value (caller handles JSON.parse)
 * @returns SilseImportValidationResult — check `.valid` first
 */
export function validateSilseImport(raw: unknown): SilseImportValidationResult {
  const errors: Array<{ path: string; reason: SilseImportRejectReason; message: string }> = [];

  // ── Layer 0: Must be a plain object ───────────────────────────
  if (!isPlainObject(raw)) {
    return {
      valid: false,
      reason: 'not-object',
      message: 'Dokumen harus berupa objek JSON.',
      errors: [{ path: '', reason: 'not-object', message: 'Document root must be a plain object' }],
    };
  }

  const doc = raw as Record<string, unknown>;

  // ── Layer 1: schemaVersion ────────────────────────────────────
  // Must be present, numeric, finite, positive, ≤ CURRENT.
  // Missing/null → legacy (acceptable, will be migrated to CURRENT).
  // Future version (> CURRENT) → REJECT (cannot migrate down).
  // Non-numeric / NaN / negative → REJECT (malformed).
  const sv = doc.schemaVersion;
  if (sv === undefined || sv === null) {
    // Legacy document — accept but warn (migration will set it to CURRENT)
    // We don't reject here; downstream migration handles it.
  } else {
    if (typeof sv !== 'number' || !Number.isFinite(sv) || sv < 0) {
      errors.push({
        path: 'schemaVersion',
        reason: 'invalid-schemaversion',
        message: `schemaVersion tidak valid: ${JSON.stringify(sv)}. Harus berupa angka positif.`,
      });
    } else if (sv > CURRENT_PROJECT_SCHEMA_VERSION) {
      errors.push({
        path: 'schemaVersion',
        reason: 'future-schemaversion',
        message: `schemaVersion ${sv} lebih baru dari versi yang didukung (${CURRENT_PROJECT_SCHEMA_VERSION}). Update aplikasi atau gunakan file yang lebih lama.`,
      });
    }
  }

  // ── Layer 2: metadata (meta) ─────────────────────────────────
  // Must be a plain object with at least judulPertemuan, mapel, kelas
  // as non-empty strings.
  const meta = doc.meta;
  if (!isPlainObject(meta)) {
    errors.push({
      path: 'meta',
      reason: 'missing-meta',
      message: 'Field "meta" tidak ditemukan atau bukan objek.',
    });
  } else {
    if (!isNonEmptyString(meta.judulPertemuan)) {
      errors.push({
        path: 'meta.judulPertemuan',
        reason: 'missing-meta-judul',
        message: 'meta.judulPertemuan wajib diisi (string tidak kosong).',
      });
    }
    if (!isNonEmptyString(meta.mapel)) {
      errors.push({
        path: 'meta.mapel',
        reason: 'missing-meta-mapel',
        message: 'meta.mapel wajib diisi (string tidak kosong).',
      });
    }
    if (!isNonEmptyString(meta.kelas)) {
      errors.push({
        path: 'meta.kelas',
        reason: 'missing-meta-kelas',
        message: 'meta.kelas wajib diisi (string tidak kosong).',
      });
    }
  }

  // ── Layer 3: canva + pages ───────────────────────────────────
  // canva must be a plain object with pages: non-empty array.
  const canva = doc.canva;
  if (!isPlainObject(canva)) {
    errors.push({
      path: 'canva',
      reason: 'missing-canva',
      message: 'Field "canva" tidak ditemukan atau bukan objek.',
    });
  } else {
    const pages = canva.pages;
    if (!Array.isArray(pages)) {
      errors.push({
        path: 'canva.pages',
        reason: 'missing-pages',
        message: 'canva.pages harus berupa array.',
      });
    } else if (pages.length === 0) {
      errors.push({
        path: 'canva.pages',
        reason: 'empty-pages',
        message: 'canva.pages tidak boleh kosong (minimal 1 halaman).',
      });
    } else {
      // ── Layer 3a: Validate each page shape ──────────────────
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pagePath = `canva.pages[${i}]`;

        if (!isPlainObject(page)) {
          errors.push({
            path: pagePath,
            reason: 'invalid-page-shape',
            message: `Halaman ${i} bukan objek yang valid.`,
          });
          continue;
        }

        // Page must have a schema with blocks array
        const schema = (page as Record<string, unknown>).schema;
        if (!isPlainObject(schema)) {
          errors.push({
            path: `${pagePath}.schema`,
            reason: 'page-missing-schema',
            message: `Halaman ${i} tidak memiliki field "schema".`,
          });
          continue;
        }

        const blocks = (schema as Record<string, unknown>).blocks;
        if (!Array.isArray(blocks)) {
          errors.push({
            path: `${pagePath}.schema.blocks`,
            reason: 'page-missing-blocks',
            message: `Halaman ${i}: schema.blocks harus berupa array.`,
          });
          continue;
        }

        // ── Layer 4: Validate each block type against registry ──
        const registeredTypes = getRegisteredBlockTypes();
        for (let j = 0; j < blocks.length; j++) {
          const block = blocks[j];
          const blockPath = `${pagePath}.schema.blocks[${j}]`;

          if (!isPlainObject(block)) {
            errors.push({
              path: blockPath,
              reason: 'invalid-page-shape',
              message: `Block ${j} pada halaman ${i} bukan objek yang valid.`,
            });
            continue;
          }

          // Block must have a `type` field
          const blockType = (block as Record<string, unknown>).type;
          if (!isNonEmptyString(blockType)) {
            errors.push({
              path: `${blockPath}.type`,
              reason: 'block-missing-type',
              message: `Block ${j} pada halaman ${i} tidak memiliki field "type" yang valid.`,
            });
            continue;
          }

          // Block type must be registered
          if (!registeredTypes.has(blockType)) {
            errors.push({
              path: `${blockPath}.type`,
              reason: 'unregistered-block-type',
              message: `Block type "${blockType}" tidak terdaftar. Block ini tidak akan dirender.`,
            });
            // Continue scanning — we report all unregistered types, not just the first
          }

          // Block must have an `id` field (for selection, updates, etc.)
          const blockId = (block as Record<string, unknown>).id;
          if (!isNonEmptyString(blockId)) {
            errors.push({
              path: `${blockPath}.id`,
              reason: 'block-missing-id',
              message: `Block ${j} pada halaman ${i} tidak memiliki field "id" yang valid.`,
            });
          }
        }
      }
    }
  }

  // ── Layer 5+6: Dangerous content scan (HTML/JS/event handlers) ──
  // Scan the ENTIRE document tree (not just blocks) for dangerous patterns.
  // This catches malicious content in any string field — meta fields,
  // block content, navConfig labels, etc.
  const danger = scanTreeForDangerousContent(doc, '');
  if (danger) {
    errors.push({
      path: danger.path,
      reason: danger.reason,
      message: `Konten berbahaya terdeteksi: ${danger.label} di "${danger.path}". Hapus atau gunakan format lain.`,
    });
  }

  // ── Final decision ────────────────────────────────────────────
  if (errors.length > 0) {
    const first = errors[0]!;
    return {
      valid: false,
      reason: first.reason,
      message: first.message,
      path: first.path,
      errors,
    };
  }

  // All checks passed — return the validated document (typed)
  return {
    valid: true,
    message: 'Dokumen valid dan aman untuk diimpor.',
    document: doc as unknown as SilseImportJson,
  };
}

/**
 * Convenience: validate a JSON string (parses + validates in one call).
 * Returns invalid-json reason if the string cannot be parsed.
 */
export function validateSilseImportJsonString(jsonString: string): SilseImportValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      valid: false,
      reason: 'invalid-json',
      message: `JSON tidak dapat diparse: ${err instanceof Error ? err.message : String(err)}`,
      errors: [{ path: '', reason: 'invalid-json', message: 'JSON parse error' }],
    };
  }
  return validateSilseImport(parsed);
}

// ───────────────────────────────────────────────────────────────
// 6. Test-only exports (for unit tests)
// ───────────────────────────────────────────────────────────────

export const __TEST__ = {
  DANGEROUS_PATTERNS,
  scanStringForDangerousContent,
  scanTreeForDangerousContent,
  isPlainObject,
  isNonEmptyString,
};
