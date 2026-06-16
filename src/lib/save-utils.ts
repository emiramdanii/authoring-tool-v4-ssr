import type { CanvaPage } from '@/components/canva/types';
import { useDirtyStore } from '@/store/dirty-store';
import type { SaveStatus } from '@/store/dirty-store';
import { useCanvaStore } from '@/store/canva-store';

/**
 * Convert CanvaPage[] to the save API format.
 * Shared between useAutoSave and useProjectManager to avoid duplication.
 */
export function canvaPagesToSavePages(pages: CanvaPage[]) {
  return pages.map((page) => ({
    id: page.id,
    label: page.label,
    templateType: page.templateType,
    templateVariant: page.templateVariant,
    contractId: page.contractId,
    bgColor: page.bgColor,
    bgDataUrl: page.bgDataUrl,
    overlay: page.overlay,
    schema: page.schema || null,
    navConfig: page.navConfig,
    templateData: page.templateData,
    colorPalette: page.colorPalette,
    blocks: (page.schema?.blocks || []).map((block) => ({
      type: block.type,
      id: block.id,
      content: Object.fromEntries(
        Object.entries(block).filter(([k]) => !['type', 'id', 'layout', 'children'].includes(k))
      ),
      layout: block.layout,
      variant: block.variant,
      style: block.style,
      children: block.children,
    })),
    elements: page.elements.map((el) => ({
      type: el.type,
      id: el.id,
      content: Object.fromEntries(
        Object.entries(el).filter(([k]) => !['type', 'id'].includes(k))
      ),
    })),
  }));
}

// ═══════════════════════════════════════════════════════════════════
// UNIFIED DIRTY/SAVE HELPERS — Sprint 7.1: Revision-based
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.1: saveAllToStorage() no longer calls markClean().
// Cleanness is now derived from revision tracking:
//   dirty = (editRevision > lastSavedRevision)
// markClean should ONLY be called through saveSucceeded() after
// a durable save completes with a matching revision.
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if ANY part of the project has unsaved changes.
 * Uses revision-based dirty tracking from dirty-store.
 */
export function isAnyDirty(): boolean {
  return useDirtyStore.getState().dirty;
}

/**
 * Save both stores to their respective storage backends.
 * Sprint 7.1: NO LONGER clears dirty flag.
 * Dirty state is now managed by the revision-based state machine.
 */
export function saveAllToStorage(): void {
  useCanvaStore.getState().saveToStorage();
  // Do NOT call markClean() here — that's the bug we're fixing.
  // Cleanness only emerges from saveSucceeded() after durable save.
}

/**
 * Get a combined save status string for UI display.
 * Now reads from the revision-based state machine.
 */
export function getCombinedSaveStatus(): SaveStatus {
  return useDirtyStore.getState().saveStatus;
}

// ═══════════════════════════════════════════════════════════════════
// Sprint 7.2: Dirty coverage — notifyMutation() helper
// ═══════════════════════════════════════════════════════════════════
// Every Canva Store mutation that modifies project data MUST call
// this function to increment editRevision and set dirty=true.
// Without it, auto-save won't trigger and data exists only in memory.
//
// Usage: Call after every set({ pages: ... }) that represents a
// meaningful project data change (NOT UI-only changes like selection,
// zoom, or tool state).
// ═══════════════════════════════════════════════════════════════════

/**
 * Notify the dirty store that a project mutation occurred.
 * Increments editRevision and sets dirty=true, which triggers
 * auto-save scheduling via the useAutoSave subscription.
 *
 * SSR-safe: wrapped in try/catch for environments where the
 * store may not be initialized.
 */
export function notifyMutation(): void {
  try {
    useDirtyStore.getState().markDirty();
  } catch { /* SSR guard — store may not be initialized during SSR */ }
}
