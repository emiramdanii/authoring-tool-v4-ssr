// ═══════════════════════════════════════════════════════════════
// VIRTUAL CANVAS — Fixed coordinate space for WYSIWYG editing
//
// All content is designed within a fixed virtual pixel space,
// then scaled/panned to fit the available screen area.
//
// Architecture:
//   ┌─ canvasAreaRef (viewport, overflow: hidden) ────────────┐
//   │  ┌─ transformLayer (translate + scale) ──────────────┐  │
//   │  │  ┌─ stageWrapRef (ratio.w × ratio.h) ───────────┐  │  │
//   │  │  │  PageRenderer + overlays + elements          │  │  │
//   │  │  └──────────────────────────────────────────────┘  │  │
//   │  └────────────────────────────────────────────────────┘  │
//   └──────────────────────────────────────────────────────────┘
//
// Coordinate systems:
//   1. SCREEN coords — mouse clientX/clientY (screen pixels)
//   2. VIRTUAL coords — position in the virtual canvas (0..ratio.w, 0..ratio.h)
//   3. PERCENTAGE coords — position as % of canvas (0..100, used in schema)
//
// The percentage system is the CANONICAL storage format for block positions.
// This utility provides safe conversions between these systems.
// ═══════════════════════════════════════════════════════════════

import { RATIOS } from '@/components/canva/types';
import type { Ratio } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Default virtual canvas width (16:9 landscape) */
export const VIRTUAL_CANVAS_W = 1280;
/** Default virtual canvas height (16:9 landscape) */
export const VIRTUAL_CANVAS_H = 720;

/** DOM ID for the stage wrapper element */
export const STAGE_WRAP_ID = 'cm-stage-wrap';

/** DOM ID for the canvas area (viewport) */
export const CANVAS_AREA_ID = 'cm-canvas-area';

// ═══════════════════════════════════════════════════════════════
// RATIO HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the current Ratio object from the store's ratioId.
 * Falls back to 16:9 (1280×720) if not found.
 */
export function getRatioById(ratioId: string): Ratio {
  return RATIOS.find(r => r.id === ratioId)! || RATIOS[0];
}

/** Get the default ratio (16:9) */
export function getDefaultRatio(): Ratio {
  return RATIOS[0]; // 16:9 = 1280×720
}

// ═══════════════════════════════════════════════════════════════
// COORDINATE CONVERSION — Screen ↔ Virtual ↔ Percentage
// ═══════════════════════════════════════════════════════════════

/**
 * Convert screen pixel delta to percentage delta.
 *
 * Uses getBoundingClientRect() on the stage wrap element for accuracy
 * after CSS transforms (zoom + pan). This is the CORRECT way to convert
 * mouse deltas to percentage deltas — it automatically accounts for:
 *   - Current zoom level
 *   - Pan offset
 *   - Any ratio size
 *
 * IMPORTANT: Do NOT use hardcoded divisors like /12.8 or /7.2 —
 * those only work for 1280×720 at zoom=1.0.
 *
 * @param dx - Horizontal pixel delta (screen coords)
 * @param dy - Vertical pixel delta (screen coords)
 * @returns Percentage delta { dxPct, dyPct }
 */
export function screenDeltaToPct(dx: number, dy: number): { dxPct: number; dyPct: number } {
  const rect = getStageWrapRect();
  if (!rect) {
    // Fallback: use default 1280×720 at zoom=1.0
    // This should rarely happen — only if stage is not mounted yet
    return { dxPct: (dx / VIRTUAL_CANVAS_W) * 100, dyPct: (dy / VIRTUAL_CANVAS_H) * 100 };
  }
  return {
    dxPct: (dx / rect.width) * 100,
    dyPct: (dy / rect.height) * 100,
  };
}

/**
 * Convert screen pixel delta to percentage delta using a known rect.
 * Same as screenDeltaToPct but accepts a pre-fetched rect for efficiency
 * when doing multiple conversions in the same frame.
 */
export function screenDeltaToPctWithRect(
  dx: number,
  dy: number,
  rect: DOMRect,
): { dxPct: number; dyPct: number } {
  return {
    dxPct: (dx / rect.width) * 100,
    dyPct: (dy / rect.height) * 100,
  };
}

/**
 * Convert screen position to virtual canvas position (in pixels).
 *
 * @param clientX - Mouse X in screen coords
 * @param clientY - Mouse Y in screen coords
 * @param canvasW - Virtual canvas width (e.g., 1280)
 * @param canvasH - Virtual canvas height (e.g., 720)
 * @returns Virtual canvas position { vx, vy }
 */
export function screenToVirtual(
  clientX: number,
  clientY: number,
  canvasW: number,
  canvasH: number,
): { vx: number; vy: number } {
  const rect = getStageWrapRect();
  if (!rect) return { vx: 0, vy: 0 };

  return {
    vx: Math.round(((clientX - rect.left) / rect.width) * canvasW),
    vy: Math.round(((clientY - rect.top) / rect.height) * canvasH),
  };
}

/**
 * Convert screen position to percentage (0..100).
 *
 * @param clientX - Mouse X in screen coords
 * @param clientY - Mouse Y in screen coords
 * @returns Percentage position { xPct, yPct }
 */
export function screenToPct(
  clientX: number,
  clientY: number,
): { xPct: number; yPct: number } {
  const rect = getStageWrapRect();
  if (!rect) return { xPct: 0, yPct: 0 };

  return {
    xPct: ((clientX - rect.left) / rect.width) * 100,
    yPct: ((clientY - rect.top) / rect.height) * 100,
  };
}

/**
 * Convert virtual canvas pixels to percentage.
 *
 * @param vx - Virtual canvas X in pixels
 * @param vy - Virtual canvas Y in pixels
 * @param canvasW - Virtual canvas width
 * @param canvasH - Virtual canvas height
 */
export function virtualToPct(
  vx: number,
  vy: number,
  canvasW: number,
  canvasH: number,
): { xPct: number; yPct: number } {
  return {
    xPct: (vx / canvasW) * 100,
    yPct: (vy / canvasH) * 100,
  };
}

/**
 * Convert percentage to virtual canvas pixels.
 */
export function pctToVirtual(
  xPct: number,
  yPct: number,
  canvasW: number,
  canvasH: number,
): { vx: number; vy: number } {
  return {
    vx: (xPct / 100) * canvasW,
    vy: (yPct / 100) * canvasH,
  };
}

// ═══════════════════════════════════════════════════════════════
// DOM HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the bounding rect of the stage wrapper element.
 * This rect reflects the POST-TRANSFORM dimensions (after zoom + pan),
 * making it accurate for coordinate conversions.
 *
 * Returns null if the element is not mounted.
 */
export function getStageWrapRect(): DOMRect | null {
  const el = document.getElementById(STAGE_WRAP_ID);
  if (!el) return null;
  return el.getBoundingClientRect();
}

/**
 * Get the bounding rect of the canvas area (viewport).
 */
export function getCanvasAreaRect(): DOMRect | null {
  const el = document.getElementById(CANVAS_AREA_ID);
  if (!el) return null;
  return el.getBoundingClientRect();
}

// ═══════════════════════════════════════════════════════════════
// PROPORTIONAL SIZING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate a proportional size based on the virtual canvas dimensions.
 * Useful for converting hardcoded pixel values to ratio-aware values.
 *
 * Example: proportionalSize(860, 1280) → 67.1875
 * Meaning: 860px is 67.19% of a 1280px canvas
 *
 * @param px - The pixel value to convert
 * @param canvasDim - The canvas dimension (width or height)
 * @returns Percentage of the canvas dimension
 */
export function proportionalPct(px: number, canvasDim: number): number {
  return (px / canvasDim) * 100;
}

/**
 * Calculate the flow content max-width as a percentage of the canvas.
 * The default flow max-width is 860px on a 1280px canvas ≈ 67%.
 * This percentage scales correctly for any canvas size.
 *
 * For 1280px canvas: 67% = 858px ≈ 860px (original)
 * For 720px canvas: 67% = 482px (reasonable portrait width)
 */
export function getFlowMaxWidthPct(canvasW: number = VIRTUAL_CANVAS_W): string {
  return `${Math.round(proportionalPct(860, canvasW))}%`;
}

/**
 * Calculate proportional navbar height for canvas mode.
 * The original values were 36px (top) and 48px (bottom) on a 720px canvas.
 * These scale proportionally for other canvas heights.
 */
export function getProportionalNavHeight(
  basePx: number,
  canvasH: number = VIRTUAL_CANVAS_H,
): number {
  const baseRatio = basePx / VIRTUAL_CANVAS_H;
  return Math.round(baseRatio * canvasH);
}

// ═══════════════════════════════════════════════════════════════
// NUDGE AMOUNTS — Ratio-aware nudge in percentage
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a nudge in virtual pixels to percentage.
 * Default nudge: ~12px on 1280px canvas = ~0.94%
 * Large nudge (Shift): ~60px on 1280px canvas = ~4.69%
 *
 * @param vpx - Virtual pixels to nudge
 * @param canvasDim - Canvas dimension (width or height)
 */
export function nudgePct(vpx: number, canvasDim: number): number {
  return (vpx / canvasDim) * 100;
}

/** Default nudge percentage for arrow keys (≈1% on 16:9) */
export const NUDGE_PCT = 1;
/** Large nudge percentage for Shift+arrow (≈5%) */
export const NUDGE_PCT_LARGE = 5;
