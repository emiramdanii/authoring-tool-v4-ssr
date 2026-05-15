// ═══════════════════════════════════════════════════════════════
// CANVA CONSTANTS — Shared constants and helpers for canva store
// Renamed from canva-export-helpers.ts
// Legacy export HTML generation removed — now using Vite SSR Export
// ═══════════════════════════════════════════════════════════════

import type { CanvaPage, CanvaElement, Ratio } from '@/components/canva/types';
import { isBlockTypeInteractive } from '@/core/schema/capability-registry';

// ═══════════════════════════════════════════════════════════════
// VIRTUAL CANVAS — Fixed coordinate space for WYSIWYG editing
//
// The virtual canvas is the canonical editing space. All content
// is designed within this fixed pixel space, then scaled/panned
// to fit the available screen area.
//
// Zoom semantics:
//   - zoom = 1.0  → canvas at native size (1280×720 for 16:9)
//   - zoom = 0.5  → canvas at half size (640×360 visual)
//   - zoom = -1   → auto-fit (calculated by Stage on mount)
//   - "Fit" = zoom level that makes canvas fit the viewport
//
// Pan semantics:
//   - panX, panY = offset in screen pixels from the viewport center
//   - When zoom <= fitZoom, pan is auto-centered (no pan needed)
//   - When zoom > fitZoom, user can pan to navigate the zoomed canvas
// ═══════════════════════════════════════════════════════════════

/** Minimum zoom level (10% of native size) */
export const ZOOM_MIN = 0.1;
/** Maximum zoom level (300% of native size) */
export const ZOOM_MAX = 3.0;
/** Zoom step for keyboard/scroll wheel */
export const ZOOM_STEP = 0.1;
/** Sentinel value meaning "auto-fit to viewport" */
export const ZOOM_FIT = -1;

/** Padding around the canvas in the viewport (px) */
export const CANVAS_VIEWPORT_PADDING = 24;

/**
 * Calculate the zoom level that fits the canvas into the viewport.
 * The canvas is scaled uniformly to fit within the viewport with padding.
 */
export function calcFitZoom(
  viewportW: number,
  viewportH: number,
  canvasW: number,
  canvasH: number,
  padding = CANVAS_VIEWPORT_PADDING,
): number {
  const availW = viewportW - padding * 2;
  const availH = viewportH - padding * 2;
  if (availW <= 0 || availH <= 0) return 0.5; // fallback
  return Math.min(availW / canvasW, availH / canvasH);
}

/**
 * Clamp zoom to valid range.
 */
export function clampZoom(zoom: number): number {
  if (zoom === ZOOM_FIT) return ZOOM_FIT;
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

/**
 * Get the effective zoom value, resolving ZOOM_FIT to the actual fit scale.
 */
export function resolveZoom(zoom: number, fitZoom: number): number {
  return zoom === ZOOM_FIT ? fitZoom : clampZoom(zoom);
}

// ── Shared constants (used by canva-store + components) ────────
export const GAME_TYPES = ['truefalse','memory','matching','roda','sorting','spinwheel','teambuzzer','wordsearch','flashcard','crossword','fillblank','dragdrop'] as const;
export const MATERI_MODULE_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline'] as const;
export const MATERI_RAKIT_TYPES = ['materi','infografis','accordion','tab-icons','icon-explore','timeline','hero','kutipan','langkah','statistik','petunjuk','diskusi','review','refleksi','skenario','debat','studi-kasus','comparison','card-showcase','hotspot-image','polling','embed','video','flashcard'] as const;

// ── Helper: Get hero data from authoring store ─────────────────

export function getHeroData(authStore: { modules: Array<Record<string, unknown>>; meta: { judulPertemuan?: string; subjudul?: string; ikon?: string } }) {
  const heroModules = authStore.modules.filter((m: Record<string, unknown>) => m.type === 'hero');
  const heroData = heroModules[0] as Record<string, unknown> | undefined;
  return {
    title: (heroData?.title as string) || authStore.meta.judulPertemuan || 'Hero Banner',
    subtitle: (heroData?.subjudul as string) || authStore.meta.subjudul || '',
    icon: (heroData?.icon as string) || authStore.meta.ikon || '🚀',
    gradient: (heroData?.gradient as string) || 'sunset',
    cta: (heroData?.cta as string) || '',
  };
}

// ── Helper: Populate template elements for backward compat ────
// FASE 4: Now reads from page.schema first, falls back to templateData.
// This ensures schema-native pages still get placeholder elements
// for the export pipeline even without templateData.

export function populateTemplateElements(page: CanvaPage, createElId: () => string): CanvaElement[] {
  if (page.templateType === 'custom') return [];

  // FASE 4: Try to extract module/kuis IDs from page.schema blocks first
  // Schema-native pages may not have templateData populated
  const schema = page.schema;
  let moduleId: string | undefined;
  let kuisId: string | undefined;
  let kuisIds: string[] | undefined;

  if (schema?.blocks) {
    // Scan schema blocks for interactive block types that reference authoring modules
    // Uses capability registry as single source of truth
    for (const block of schema.blocks) {
      if (isBlockTypeInteractive(block.type)) {
        // These blocks reference kuis/game data — extract ID if available
        const blockId = block.id;
        if (block.type === 'kuis' && blockId) {
          kuisId = blockId; // Schema block ID serves as reference
        }
      }
    }
  }

  // Fallback to templateData for legacy pages
  const td = page.templateData || {};
  if (!moduleId || !kuisId) {
    if (page.templateType === 'kuis') {
      const kuisArr = td.kuis as Array<Record<string, unknown>> | undefined;
      if (kuisArr && kuisArr.length > 0) {
        if (!kuisId) kuisId = (kuisArr[0]._id as string) || undefined;
        kuisIds = kuisArr.map(k => k._id as string).filter(Boolean);
      }
    }

    if (page.templateType === 'game') {
      const gamesArr = td.games as Array<Record<string, unknown>> | undefined;
      if (gamesArr && gamesArr.length > 0 && gamesArr[0]._id) {
        if (!moduleId) moduleId = gamesArr[0]._id as string;
      }
    }

    if (page.templateType === 'materi') {
      const modulesArr = td.modules as Array<Record<string, unknown>> | undefined;
      if (modulesArr && modulesArr.length > 0 && modulesArr[0]._id) {
        if (!moduleId) moduleId = modulesArr[0]._id as string;
      }
    }
  }

  return [{
    id: createElId(),
    type: page.templateType === 'kuis' ? 'kuis' : page.templateType === 'game' ? 'game' : 'modul',
    icon: page.templateType === 'kuis' ? '❓' : page.templateType === 'game' ? '🎮' : '🧩',
    label: page.label,
    x: 0, y: 0, w: 100, h: 100,
    opacity: 100,
    dataIdx: -1,
    // isPlaceholder removed — all elements render uniformly in v4
    ...(moduleId ? { moduleId } : {}),
    ...(kuisId ? { kuisId } : {}),
    ...(kuisIds && kuisIds.length > 0 ? { kuisIds } : {}),
  }];
}
