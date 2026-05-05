// ═══════════════════════════════════════════════════════════════
// CANVA STORE — Constants & factory functions
// ═══════════════════════════════════════════════════════════════

import type { CanvaPage, PageTemplateType } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';

export const MAX_HISTORY = 50;
export const CANVA_STORAGE_KEY = 'canva_state_v2';

export function createPage(label: string, templateType: PageTemplateType = 'custom'): CanvaPage {
  return {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    label,
    bgDataUrl: null,
    bgColor: templateType === 'custom' ? '#1a1a2e' : '#0f172a',
    overlay: 20,
    elements: [],
    templateType,
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
  };
}

export function createElId(): string {
  return 'el_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}
