// ═════════════════════════════════════════════════════════════════════
// MODULE RESOLVER — Stable reference resolution for canva elements
// Replaces fragile dataIdx (array index) with moduleId/kuisId (UUID)
// ═════════════════════════════════════════════════════════════════════

import type { CanvaElement } from '@/components/canva/types';
import type { KuisItem, Module } from '@/store/authoring/types';
import { logger } from '@/core/utils/logger';

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
  allModules: Module[],
): Module | null {
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
 * Supports kuisIds (multiple, preferred for template pages), kuisId (single UUID),
 * and dataIdx (legacy fallback).
 * 
 * Priority: kuisIds (multi) > kuisId (single) > dataIdx > empty
 * 
 * @param el - The canva element with kuisId/kuisIds and/or dataIdx
 * @param allKuis - Flat array of kuis items from authoring store
 * @returns The resolved kuis data (scoped to referenced items only)
 */
export function resolveKuis(
  el: CanvaElement,
  allKuis: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  // Priority 0: kuisIds (multiple IDs) — for template pages with multiple questions
  if (el.kuisIds && el.kuisIds.length > 0) {
    const found = allKuis.filter(k => k._id && el.kuisIds!.includes(k._id as string));
    if (found.length > 0) return found;
  }

  // Priority 1: kuisId (stable reference) — find single kuis item by _id
  if (el.kuisId) {
    const found = allKuis.find(k => k._id === el.kuisId);
    if (found) return [found];
  }

  // Priority 2: dataIdx (legacy fallback)
  const dataIdx = el.dataIdx ?? -1;
  if (dataIdx >= 0 && dataIdx < allKuis.length) {
    return [allKuis[dataIdx]!];
  }

  // No reference found — return empty instead of ALL (was a scoping bug)
  if (typeof console !== 'undefined' && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    logger.warn('resolveKuis',
      'Quiz element has no kuisId/kuisIds or valid dataIdx. ' +
      'Returning empty array to avoid showing ALL questions.'
    );
  }
  return [];
}

/**
 * Generate a stable ID for a module.
 * This should be called when a module is created or when migrating existing modules.
 */
export function generateModuleId(): string {
  return 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Generate a stable ID for a kuis item.
 * This should be called when a kuis item is created or when migrating existing items.
 */
export function generateKuisId(): string {
  return 'kuis_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Ensure all modules have _id fields.
 * Migrates existing modules that don't have stable IDs yet.
 * Returns a new array with _id fields added where missing.
 */
export function ensureModuleIds(modules: Array<Record<string, unknown>>): Module[] {
  return modules.map(m => {
    if (m._id) return m as Module;
    return { ...m, _id: generateModuleId() } as Module;
  });
}

/**
 * Ensure all kuis items have _id fields.
 * Migrates existing items that don't have stable IDs yet.
 * Returns a new array with _id fields added where missing.
 */
export function ensureKuisIds(kuis: KuisItem[]): KuisItem[] {
  return kuis.map(k => {
    if (k._id) return k;
    return { ...k, _id: generateKuisId() };
  });
}
