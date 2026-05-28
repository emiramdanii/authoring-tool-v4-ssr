import type { CanvaPage } from '@/components/canva/types';
import { useDirtyStore } from '@/store/dirty-store';
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
// UNIFIED DIRTY/SAVE HELPERS — Phase 5B
// ═══════════════════════════════════════════════════════════════════
// The authoring store tracks `dirty` for project metadata
// (meta, cp, tp, atp, alur, suara), while the canva store tracks
// `_saveStatus` for page/schema content. Both need to be checked
// to determine if the project has unsaved changes.
//
// These helpers eliminate the dual-read pattern across consumers.
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if ANY part of the project has unsaved changes.
 * Combines dirty-store and canva-store save status.
 */
export function isAnyDirty(): boolean {
  return (
    useDirtyStore.getState().dirty ||
    useCanvaStore.getState()._saveStatus === 'unsaved'
  );
}

/**
 * Save both stores to their respective storage backends.
 * Also clears the dirty flag.
 */
export function saveAllToStorage(): void {
  // Save to both storage backends then clear dirty flag
  useCanvaStore.getState().saveToStorage();
  useDirtyStore.getState().markClean();
}

/**
 * Get a combined save status string for UI display.
 */
export function getCombinedSaveStatus(): 'saved' | 'saving' | 'unsaved' | 'error' {
  const canvaStatus = useCanvaStore.getState()._saveStatus;
  const dirty = useDirtyStore.getState().dirty;

  if (canvaStatus === 'saving') return 'saving';
  if (canvaStatus === 'error') return 'error';
  if (dirty || canvaStatus === 'unsaved') return 'unsaved';
  return 'saved';
}
