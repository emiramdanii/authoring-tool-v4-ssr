// ═══════════════════════════════════════════════════════════════════
// IMMUTABLE CORE — deepFreeze, deepClone, produce
// ═══════════════════════════════════════════════════════════════════
// Foundational immutable primitives used by all schema operations.
// These are the building blocks for the "write-once" schema pipeline.
// ═══════════════════════════════════════════════════════════════════

// ── Deep Freeze ─────────────────────────────────────────────────

/**
 * Deep-freeze an object in dev mode.
 * In production, returns the object as-is (no performance cost).
 *
 * Use this to catch accidental mutations:
 *   const frozen = deepFreeze(schema);
 *   frozen.blocks[0].type = 'x'; // TypeError in dev mode!
 */
export function deepFreeze<T>(obj: T, seen = new WeakSet()): T {
  if (process.env.NODE_ENV === 'production') return obj;
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return obj;  // circular ref protection
  seen.add(obj);

  if (Array.isArray(obj)) {
    for (const item of obj) deepFreeze(item, seen);
  } else {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(val, seen);
    }
  }

  return Object.freeze(obj);
}

/**
 * Check if an object is deeply frozen (dev mode only).
 * Useful for invariant checks.
 */
export function isDeepFrozen(obj: unknown, seen = new WeakSet()): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (obj === null || obj === undefined || typeof obj !== 'object') return true;
  if (!Object.isFrozen(obj)) return false;
  if (seen.has(obj)) return true; // circular ref protection
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.every(item => isDeepFrozen(item, seen));
  }

  return Object.values(obj as Record<string, unknown>).every(val => isDeepFrozen(val, seen));
}

// ── Deep Clone ──────────────────────────────────────────────────

/**
 * Deep-clone a value using structured clone (or JSON fallback).
 * Used internally by all immutable operations.
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

// ── Immutable Produce ───────────────────────────────────────────

/**
 * Immer-style immutable update: apply a recipe function to a draft
 * clone, returning a new object. The original is never mutated.
 *
 * Unlike Immer, this uses simple deep-clone + mutation for zero deps.
 * Performance is fine for SILSE's schema sizes (< 100 blocks typically).
 *
 * Example:
 *   const newSchema = produce(schema, draft => {
 *     draft.blocks[0].content = 'updated';
 *   });
 */
export function produce<T>(base: T, recipe: (draft: T) => void): T {
  const draft = deepClone(base);
  recipe(draft);
  return draft;
}
