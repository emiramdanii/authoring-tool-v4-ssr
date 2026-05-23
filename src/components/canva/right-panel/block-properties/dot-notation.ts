/**
 * Dot-notation helpers — Support for nested property editing.
 *
 * Property schemas can use dot-notation keys like 'cta.label',
 * 'meta.durasi', 'sanksi.title', 'penugasan.judul', etc.
 *
 * Reading: getNestedValue(block, 'cta.label') → block.cta.label
 * Writing: buildNestedUpdate('cta.label', 'new') → { cta: { label: 'new' } }
 *
 * The writing side leverages updateSchemaBlock's deep merge (Immer),
 * so { cta: { label: 'new' } } correctly merges without losing
 * sibling properties like cta.action.
 */

/**
 * Get a nested value from an object using dot-notation path.
 * Examples: getNestedValue(obj, 'cta.label') → obj.cta.label
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Build a nested update object from a dot-notation key and value.
 * The resulting object can be passed to updateSchemaBlock() which
 * uses Immer deep merge, preserving sibling properties.
 *
 * Example: buildNestedUpdate('cta.label', 'Mulai') → { cta: { label: 'Mulai' } }
 */
export function buildNestedUpdate(path: string, value: unknown): Record<string, unknown> {
  const keys = path.split('.');
  if (keys.length === 1) {
    return { [keys[0]]: value };
  }
  // Build nested object from right to left
  let result: Record<string, unknown> = {};
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]!] = {};
    current = current[keys[i]!] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]!] = value;
  return result;
}
