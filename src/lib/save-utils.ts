import type { CanvaPage } from '@/components/canva/types';
import { useAuthoringStore } from '@/store/authoring-store';
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
 * Combines both stores' dirty indicators.
 */
export function isAnyDirty(): boolean {
  return (
    useAuthoringStore.getState().dirty ||
    useCanvaStore.getState()._saveStatus === 'unsaved'
  );
}

/**
 * Save both stores to their respective storage backends.
 */
export function saveAllToStorage(): void {
  useAuthoringStore.getState().saveToStorage();
  useCanvaStore.getState().saveToStorage();
}

/**
 * Get a combined save status string for UI display.
 */
export function getCombinedSaveStatus(): 'saved' | 'saving' | 'unsaved' | 'error' {
  const canvaStatus = useCanvaStore.getState()._saveStatus;
  const authoringDirty = useAuthoringStore.getState().dirty;

  if (canvaStatus === 'saving') return 'saving';
  if (canvaStatus === 'error') return 'error';
  if (authoringDirty || canvaStatus === 'unsaved') return 'unsaved';
  return 'saved';
}
