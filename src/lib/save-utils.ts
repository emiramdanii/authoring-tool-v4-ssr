import type { CanvaPage } from '@/components/canva/types';

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
