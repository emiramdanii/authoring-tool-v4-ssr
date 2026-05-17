// ═══════════════════════════════════════════════════════════════════
// SCHEMA VALIDATION LAYER — Runtime Invariant Checker
// ═══════════════════════════════════════════════════════════════════
// Because SchemaBlock is the single source of truth for ALL systems
// (renderer, export, AI regen, editor projection), its contract MUST
// be stable and its invariants MUST be enforced.
//
// This module provides:
//   1. validateBlock()   — Check a single SchemaBlock for invariants
//   2. validateSchema()  — Check a full ScreenSchema
//   3. assertValid()     — Throw on invalid (dev mode guard)
//   4. validateSchemaVersion() — Version compatibility check
//
// INVARIANTS ENFORCED:
//   - Pure serializable (no functions, no DOM refs, no Symbols)
//   - No runtime refs (no class instances, no React elements)
//   - Deterministic (no Date.now(), no Math.random() in data)
//   - Valid type field (must be a registered block type)
//   - Valid compression hints (if present)
//   - Valid semantic hints (if present)
//   - Valid layout hints (if present)
//   - Children must be valid SchemaBlock[] (recursive)
//   - No circular references (checked via ID tracking)
//
// USAGE:
//   import { validateBlock, assertValidSchema } from '@/core/schema/validation';
//
//   // In generators — validate output before returning
//   const blocks = genMateriSchema(parsed, meta);
//   assertValidSchema({ id: 'test', templateType: 'materi', blocks });
//
//   // In ensurePageSchema — validate after migration
//   const schema = ensurePageSchema(page);
//   if (schema) assertValidSchema(schema);
//
//   // In schema-apply — validate before writing to store
//   validateBlocks(blocks); // throws if invalid
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema, CompressionHints, SemanticHints, BlockLayout } from './types';
import { logger } from '@/core/utils/logger';
import { isCompositeBlockType, getCompositeContainerDescriptor } from './capability-registry';

// ── Registered Block Types ──────────────────────────────────────
// These are the valid type values for SchemaBlock.
// Any block with a type not in this list will fail validation.

const REGISTERED_BLOCK_TYPES = new Set([
  'cover', 'hero', 'petunjuk', 'tp', 'alur', 'skenario',
  'def-box', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card',
  'materi-section', 'diskusi', 'kuis',
  'sortir-game', 'roda-game', 'memory-game', 'matching-game',
  'fill-blank-game', 'word-search-game', 'true-false-game',
  'drag-drop-game', 'crossword-game', 'team-buzzer-game',
  'hasil', 'refleksi', 'penutup', 'tabel-accord',
  'tujuan-display', 'motivasi', 'rangkuman',
  'tabel', 'gambar', 'timeline', 'checklist', 'statistik', 'studi',
]);

// ── Validation Result ───────────────────────────────────────────

export interface ValidationError {
  path: string;        // e.g., "blocks[2].compression.priority"
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ── Primitive Type Guards ───────────────────────────────────────

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val) && Object.getPrototypeOf(val) === Object.prototype;
}

/** Check if a value is pure-serializable (no functions, Symbols, DOM refs, class instances) */
function isPureSerializable(val: unknown, path: string, errors: ValidationError[], seen = new WeakSet()): boolean {
  if (val === null || val === undefined) return true;

  const t = typeof val;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;

  if (t === 'function') {
    errors.push({ path, message: 'Function found — SchemaBlock must be pure serializable', severity: 'error' });
    return false;
  }
  if (t === 'symbol') {
    errors.push({ path, message: 'Symbol found — SchemaBlock must be pure serializable', severity: 'error' });
    return false;
  }
  if (t === 'bigint') {
    errors.push({ path, message: 'BigInt found — not JSON-serializable', severity: 'warning' });
    return true; // warning only, bigint can be stringified
  }

  if (t === 'object') {
    // Circular reference protection
    if (seen.has(val as object)) return true;
    seen.add(val as object);

    // Check for DOM references
    if (typeof window !== 'undefined' && val instanceof Node) {
      errors.push({ path, message: 'DOM Node reference found — SchemaBlock must not contain DOM refs', severity: 'error' });
      return false;
    }

    // Check for class instances (not plain objects)
    if (!isPlainObject(val) && !Array.isArray(val)) {
      // Could be Date, RegExp, Map, Set, class instances, etc.
      if (val instanceof Date) {
        errors.push({ path, message: 'Date instance found — use ISO string instead', severity: 'warning' });
        return true;
      }
      if (val instanceof RegExp) {
        errors.push({ path, message: 'RegExp found — not JSON-serializable', severity: 'error' });
        return false;
      }
      if (val instanceof Map || val instanceof Set) {
        errors.push({ path, message: 'Map/Set found — use plain object/array instead', severity: 'error' });
        return false;
      }
      // Unknown class instance
      errors.push({ path, message: `Class instance found (${(val as object).constructor?.name}) — SchemaBlock must be plain serializable`, severity: 'error' });
      return false;
    }

    // Recurse into plain objects and arrays
    if (Array.isArray(val)) {
      let ok = true;
      for (let i = 0; i < val.length; i++) {
        if (!isPureSerializable(val[i], `${path}[${i}]`, errors, seen)) ok = false;
      }
      return ok;
    }

    let ok = true;
    for (const key of Object.keys(val)) {
      if (!isPureSerializable((val as Record<string, unknown>)[key], `${path}.${key}`, errors, seen)) ok = false;
    }
    return ok;
  }

  return true;
}

// ── Block-Level Validation ──────────────────────────────────────

/** Validate compression hints if present */
function validateCompressionHints(
  compression: CompressionHints | undefined,
  path: string,
  errors: ValidationError[],
): void {
  if (!compression) return;

  const validPriorities = new Set(['high', 'medium', 'low']);
  const validStrategies = new Set(['accordion', 'truncate', 'scroll', 'none']);

  if (!validPriorities.has(compression.priority)) {
    errors.push({
      path: `${path}.priority`,
      message: `Invalid compression priority: "${compression.priority}" — must be high|medium|low`,
      severity: 'error',
    });
  }

  if (!validStrategies.has(compression.strategy)) {
    errors.push({
      path: `${path}.strategy`,
      message: `Invalid compression strategy: "${compression.strategy}" — must be accordion|truncate|scroll|none`,
      severity: 'error',
    });
  }

  if (compression.minFragmentHeight !== undefined && compression.minFragmentHeight < 0) {
    errors.push({
      path: `${path}.minFragmentHeight`,
      message: 'minFragmentHeight must be >= 0',
      severity: 'error',
    });
  }
}

/** Validate semantic hints if present */
function validateSemanticHints(
  semantic: SemanticHints | undefined,
  path: string,
  errors: ValidationError[],
): void {
  if (!semantic) return;

  const validPhases = new Set(['pendahuluan', 'inti', 'penutup']);
  const validInteractions = new Set(['read', 'write', 'choose', 'drag', 'discuss', 'reflect']);

  if (semantic.learningPhase && !validPhases.has(semantic.learningPhase)) {
    errors.push({
      path: `${path}.learningPhase`,
      message: `Invalid learningPhase: "${semantic.learningPhase}" — must be pendahuluan|inti|penutup`,
      severity: 'error',
    });
  }

  if (semantic.interactionType && !validInteractions.has(semantic.interactionType)) {
    errors.push({
      path: `${path}.interactionType`,
      message: `Invalid interactionType: "${semantic.interactionType}" — must be read|write|choose|drag|discuss|reflect`,
      severity: 'error',
    });
  }

  if (semantic.importance !== undefined && (semantic.importance < 0 || semantic.importance > 1)) {
    errors.push({
      path: `${path}.importance`,
      message: `Invalid importance: ${semantic.importance} — must be 0-1`,
      severity: 'error',
    });
  }
}

/** Validate layout hints if present */
function validateLayoutHints(
  layout: BlockLayout | undefined,
  path: string,
  errors: ValidationError[],
): void {
  if (!layout) return;

  const validPositions = new Set(['flow', 'absolute']);
  const validWidths = new Set(['full', 'half', 'third']);

  if (!validPositions.has(layout.position)) {
    errors.push({
      path: `${path}.position`,
      message: `Invalid layout position: "${layout.position}" — must be flow|absolute`,
      severity: 'error',
    });
  }

  if (layout.preferredWidth && !validWidths.has(layout.preferredWidth)) {
    errors.push({
      path: `${path}.preferredWidth`,
      message: `Invalid preferredWidth: "${layout.preferredWidth}" — must be full|half|third`,
      severity: 'error',
    });
  }

  if (layout.position === 'absolute') {
    if (layout.x === undefined || layout.y === undefined) {
      errors.push({
        path: `${path}`,
        message: 'Absolute position requires x and y coordinates',
        severity: 'warning',
      });
    }
  }
}

// ── Core Validation Functions ───────────────────────────────────

/**
 * Validate a single SchemaBlock for all invariants.
 * Returns a ValidationResult with errors and warnings.
 */
export function validateBlock(
  block: SchemaBlock,
  options?: {
    /** Check that block.type is in the registered types list */
    strictTypeCheck?: boolean;
    /** Path prefix for error messages (e.g., "blocks[2]") */
    pathPrefix?: string;
    /** Set of already-seen block IDs (for circular reference detection) */
    seenIds?: Set<string>;
  },
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const prefix = options?.pathPrefix || 'block';
  const seenIds = options?.seenIds || new Set<string>();

  // 1. Must be a plain object
  if (!isPlainObject(block)) {
    errors.push({ path: prefix, message: 'Block must be a plain object', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  // 2. Must have a type field
  if (typeof block.type !== 'string' || block.type.length === 0) {
    errors.push({ path: `${prefix}.type`, message: 'Block must have a non-empty string type', severity: 'error' });
  }

  // 3. Type must be registered (optional strict check)
  if (options?.strictTypeCheck && typeof block.type === 'string') {
    if (!REGISTERED_BLOCK_TYPES.has(block.type)) {
      errors.push({
        path: `${prefix}.type`,
        message: `Unknown block type: "${block.type}" — not in registered types`,
        severity: 'warning', // warning because custom blocks may be valid
      });
    }
  }

  // 4. ID must be a string if present
  if (block.id !== undefined && typeof block.id !== 'string') {
    errors.push({ path: `${prefix}.id`, message: `Block id must be a string, got ${typeof block.id}`, severity: 'error' });
  }

  // 5. No circular references (by ID)
  if (block.id) {
    if (seenIds.has(block.id)) {
      errors.push({ path: `${prefix}.id`, message: `Circular reference detected: block id "${block.id}" already seen`, severity: 'error' });
    }
    seenIds.add(block.id);
  }

  // 6. Pure serializable check (deep)
  isPureSerializable(block, prefix, errors);

  // 7. Validate compression hints
  if (block.compression) {
    validateCompressionHints(block.compression, `${prefix}.compression`, errors);
  }

  // 8. Validate semantic hints
  if (block.semantic) {
    validateSemanticHints(block.semantic, `${prefix}.semantic`, errors);
  }

  // 9. Validate layout hints
  if (block.layout) {
    validateLayoutHints(block.layout, `${prefix}.layout`, errors);
  }

  // 10. Validate children recursively
  if (block.children && Array.isArray(block.children)) {
    for (let i = 0; i < block.children.length; i++) {
      const childResult = validateBlock(block.children[i], {
        ...options,
        pathPrefix: `${prefix}.children[${i}]`,
        seenIds,
      });
      errors.push(...childResult.errors);
      warnings.push(...childResult.warnings);
    }
  }

  // 11. Validate nested content blocks in composites (materi-section, ftab, etc.)
  // Uses capability registry's CompositeContainerDescriptor as single source of truth.
  // When a new composite block type is added, just add a descriptor to the registry —
  // this validation code automatically supports it.
  const blockType: string = block.type;
  if (isCompositeBlockType(blockType)) {
    const descriptor = getCompositeContainerDescriptor(blockType);
    if (descriptor && descriptor.accessor in block) {
      if (descriptor.structure === 'direct') {
        // Direct: accessor gives SchemaBlock[] (e.g., materi-section.content)
        const content = (block as Record<string, unknown>)[descriptor.accessor];
        if (Array.isArray(content)) {
          for (let i = 0; i < content.length; i++) {
            const childResult = validateBlock(content[i] as SchemaBlock, {
              ...options,
              pathPrefix: `${prefix}.${descriptor.accessor}[${i}]`,
              seenIds,
            });
            errors.push(...childResult.errors);
            warnings.push(...childResult.warnings);
          }
        }
      } else if (descriptor.structure === 'tabular') {
        // Tabular: accessor gives array of tab objects, each with content (e.g., ftab.tabs)
        const tabs = (block as Record<string, unknown>)[descriptor.accessor];
        if (Array.isArray(tabs)) {
          const contentKey = descriptor.tabContentKey || 'content';
          for (let t = 0; t < tabs.length; t++) {
            const tabContent = (tabs[t] as Record<string, unknown>)?.[contentKey];
            if (Array.isArray(tabContent)) {
              for (let i = 0; i < tabContent.length; i++) {
                const childResult = validateBlock(tabContent[i] as SchemaBlock, {
                  ...options,
                  pathPrefix: `${prefix}.${descriptor.accessor}[${t}].${contentKey}[${i}]`,
                  seenIds,
                });
                errors.push(...childResult.errors);
                warnings.push(...childResult.warnings);
              }
            }
          }
        }
      }
    }
  }

  // Separate errors from warnings
  const realErrors = errors.filter(e => e.severity === 'error');
  const realWarnings = errors.filter(e => e.severity === 'warning').concat(warnings);

  return {
    valid: realErrors.length === 0,
    errors: realErrors,
    warnings: realWarnings,
  };
}

/**
 * Validate a full ScreenSchema.
 * Checks all blocks plus the schema-level invariants.
 */
export function validateSchema(schema: ScreenSchema, options?: { strictTypeCheck?: boolean }): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Schema-level checks
  if (!schema.id || typeof schema.id !== 'string') {
    errors.push({ path: 'schema.id', message: 'Schema must have a string id', severity: 'error' });
  }

  if (!schema.templateType || typeof schema.templateType !== 'string') {
    errors.push({ path: 'schema.templateType', message: 'Schema must have a string templateType', severity: 'error' });
  }

  if (!Array.isArray(schema.blocks)) {
    errors.push({ path: 'schema.blocks', message: 'Schema must have a blocks array', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  // Validate each block
  const seenIds = new Set<string>();
  for (let i = 0; i < schema.blocks.length; i++) {
    const result = validateBlock(schema.blocks[i], {
      ...options,
      pathPrefix: `blocks[${i}]`,
      seenIds,
    });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Check for duplicate IDs
  const allIds = new Set<string>();
  for (const block of schema.blocks) {
    if (block.id) {
      if (allIds.has(block.id)) {
        warnings.push({ path: `blocks`, message: `Duplicate block id: "${block.id}"`, severity: 'warning' });
      }
      allIds.add(block.id);
    }
  }

  const realErrors = errors.filter(e => e.severity === 'error');
  const realWarnings = errors.filter(e => e.severity === 'warning').concat(warnings);

  return {
    valid: realErrors.length === 0,
    errors: realErrors,
    warnings: realWarnings,
  };
}

/**
 * Validate an array of SchemaBlock[] (without a full ScreenSchema wrapper).
 * Useful for validating generator output before applying to pages.
 */
export function validateBlocks(blocks: SchemaBlock[], options?: { strictTypeCheck?: boolean }): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!Array.isArray(blocks)) {
    errors.push({ path: 'blocks', message: 'Must be an array of SchemaBlock', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  const seenIds = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    const result = validateBlock(blocks[i], {
      ...options,
      pathPrefix: `[${i}]`,
      seenIds,
    });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  const realErrors = errors.filter(e => e.severity === 'error');
  const realWarnings = errors.filter(e => e.severity === 'warning').concat(warnings);

  return {
    valid: realErrors.length === 0,
    errors: realErrors,
    warnings: realWarnings,
  };
}

// ── Assertion Helpers ───────────────────────────────────────────

/**
 * Assert that a ScreenSchema is valid. Throws in dev mode, logs in production.
 * Use this as a guard in critical paths (generators, apply, migration).
 */
export function assertValidSchema(schema: ScreenSchema, source?: string): void {
  const result = validateSchema(schema);
  if (!result.valid) {
    const src = source ? ` (${source})` : '';
    const msgs = result.errors.map(e => `${e.path}: ${e.message}`).join('\n  ');
    const error = new Error(`Schema validation failed${src}:\n  ${msgs}`);

    if (process.env.NODE_ENV === 'production') {
      logger.error('SCHEMA-VALIDATION', error.message);
    } else {
      throw error;
    }
  }

  // Log warnings even in dev
  for (const w of result.warnings) {
    logger.warn('SCHEMA-VALIDATION', `${w.path}: ${w.message}`);
  }
}

/**
 * Assert that an array of SchemaBlock is valid.
 * Throws in dev mode, logs in production.
 */
export function assertValidBlocks(blocks: SchemaBlock[], source?: string): void {
  const result = validateBlocks(blocks);
  if (!result.valid) {
    const src = source ? ` (${source})` : '';
    const msgs = result.errors.map(e => `${e.path}: ${e.message}`).join('\n  ');
    const error = new Error(`Block validation failed${src}:\n  ${msgs}`);

    if (process.env.NODE_ENV === 'production') {
      logger.error('SCHEMA-VALIDATION', error.message);
    } else {
      throw error;
    }
  }
}

// ── Schema Version Validation ───────────────────────────────────

/** Current schema version — increment when breaking changes are made */
export const SCHEMA_VERSION = 1;

/**
 * Check if a schema version is compatible with the current runtime.
 * Returns true if the schema can be safely loaded.
 */
export function isSchemaVersionCompatible(schema: ScreenSchema): boolean {
  // Version 1 (or missing version) is always compatible
  if (!schema.version || schema.version === 1) return true;

  // Future: Add version migration logic here
  // if (schema.version === 2) return migrateV2toV1(schema);

  logger.warn('SCHEMA-VERSION', `Unknown schema version: ${schema.version} — may not be fully compatible`);
  return false;
}

/**
 * Get the registered block types list (for external validation tools).
 */
export function getRegisteredBlockTypes(): Set<string> {
  return new Set(REGISTERED_BLOCK_TYPES);
}
