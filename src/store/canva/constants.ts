// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Constants & factory functions
// ═══════════════════════════════════════════════════════════════

import type { CanvaPage, PageTemplateType } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import { generatePageId } from '@/core/schema/ensure-schema';

export const MAX_HISTORY = 50;
export const CANVA_STORAGE_KEY = 'canva_state_v2';

export function createPage(label: string, templateType: PageTemplateType = 'custom'): CanvaPage {
  // ═══ pageMode: Schema-driven for all pages ═══
  // Even custom/blank pages now support schema blocks.
  // When a user adds a "Halaman Kosong", they can immediately
  // add blocks to it via the AddBlockPanel.
  const pageId = generatePageId();
  return {
    id: pageId,
    label,
    bgDataUrl: null,
    bgColor: '#ffffff',
    overlay: 20,
    elements: [],
    templateType,
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
    pageMode: 'schema',
    // Blank pages get an empty schema so blocks can be added immediately
    schema: {
      id: pageId,
      version: 1,
      templateType,
      blocks: [],
      background: { type: 'solid', color1: 'bg' },
    },
    // v4: overlayElements removed — all elements in elements[]
  };
}

export function createElId(): string {
  return 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}
