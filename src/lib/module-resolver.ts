// ═══════════════════════════════════════════════════════════════════
// MODULE RESOLVER — Stable reference resolution for canva elements
// Replaces fragile dataIdx (array index) with moduleId (UUID)
// ═══════════════════════════════════════════════════════════════════

import type { CanvaElement } from '@/components/canva/types';

/**
 * Resolve a canva element's data reference to actual module data.
 * Supports both moduleId (stable UUID) and dataIdx (legacy array index).
 * 
 * Priority: moduleId > dataIdx
 * 
 * @param el - The canva element with moduleId and/or dataIdx
 * @param allModules - Flat array of all modules from authoring store
 * @returns The resolved module data, or null if not found
 */
export function resolveModule(
  el: CanvaElement,
  allModules: Array<Record<string, unknown>>,
): Record<string, unknown> | null {
  // Priority 1: moduleId (stable reference)
  if (el.moduleId) {
    const found = allModules.find(m => m._id === el.moduleId);
    if (found) return found;
  }
  
  // Priority 2: dataIdx (legacy fallback)
  if (el.dataIdx != null && el.dataIdx >= 0 && el.dataIdx < allModules.length) {
    return allModules[el.dataIdx];
  }
  
  return null;
}

/**
 * Resolve a quiz element to its quiz data.
 * For quiz elements, the reference might be to the kuis array, not modules.
 * 
 * @param el - The canva element with moduleId and/or dataIdx
 * @param allKuis - Flat array of kuis items from authoring store
 * @returns The resolved kuis data (single item or full array)
 */
export function resolveKuis(
  el: CanvaElement,
  allKuis: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  // For kuis, dataIdx refers to a specific quiz item
  const dataIdx = el.dataIdx ?? -1;
  const kuisSource = dataIdx >= 0 && dataIdx < allKuis.length
    ? [allKuis[dataIdx]]
    : allKuis;
  return kuisSource;
}

/**
 * Generate a stable ID for a module.
 * This should be called when a module is created or when migrating existing modules.
 */
export function generateModuleId(): string {
  return 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Ensure all modules have _id fields.
 * Migrates existing modules that don't have stable IDs yet.
 * Returns a new array with _id fields added where missing.
 */
export function ensureModuleIds(modules: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return modules.map(m => {
    if (m._id) return m;
    return { ...m, _id: generateModuleId() };
  });
}
