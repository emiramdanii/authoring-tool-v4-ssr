// ═══════════════════════════════════════════════════════════════════
// DEBUG CONFIG — Mutable singleton for debug overlay configuration
// ═══════════════════════════════════════════════════════════════════
//
// FASE 2 — DEBUG MODE overlay system for the SILSE canvas rendering
// pipeline. Part of the stabilization roadmap.
//
// DESIGN PRINCIPLE: The debug overlay must NOT affect the rendering
// pipeline it's debugging. Therefore:
//   - Uses module-level mutable config, NOT React state or Zustand
//   - Toggle mutations don't trigger React re-renders upstream
//   - The overlay component reads this config on its own render cycle
//   - pointer-events: none ensures no click interference
//
// WHY NOT Zustand:
//   1. Adding debug flags to the store would affect selector equality
//   2. Debug state changes would trigger store subscribers
//   3. Performance middleware would log debug toggles as "actions"
//   4. Persistence middleware would try to save debug state
//   5. The canva store already has 15+ slices — debug doesn't belong there
//
// ARCHITECTURE:
//   debugConfig (mutable singleton) ← read by DebugOverlay on render
//   toggleDebugMode(key)           → mutates singleton in-place
//   isDebugMode()                  → quick check for early-return
//
// ═══════════════════════════════════════════════════════════════════

// ── Debug Mode Keys ────────────────────────────────────────────

/**
 * Debug visualization modes for the SILSE canvas rendering pipeline.
 *
 * Each mode overlays different diagnostic information on the scene:
 *
 *   SHOW_LAYOUT_BOXES  — Colored borders around resolved block positions
 *   SHOW_BLOCK_BOUNDS  — Block ID, type, dimensions, measurement status
 *   SHOW_MEASUREMENTS  — Full measurement pipeline status per block
 *   SHOW_SCENE_FLOW    — Scene split info, boundaries, overflow indicators
 */
export type DebugModeKey =
  | 'SHOW_LAYOUT_BOXES'
  | 'SHOW_BLOCK_BOUNDS'
  | 'SHOW_MEASUREMENTS'
  | 'SHOW_SCENE_FLOW'
  | 'SHOW_RERENDER';

// ── Debug Config Type ──────────────────────────────────────────

/**
 * Configuration object for debug overlay modes.
 *
 * Each flag enables a different visualization layer:
 *
 * SHOW_LAYOUT_BOXES:
 *   Draws colored borders around each block's layout box (the
 *   absolute-positioned div from resolveSceneLayout). Color-coded
 *   by overflow rule:
 *     clip=red, autoResize=green, internalScroll=blue, scaleDown=purple
 *
 * SHOW_BLOCK_BOUNDS:
 *   Shows block ID, type, and dimensions (w x h) as a small label
 *   in the top-left corner of each block. Also shows whether the
 *   block's height is measured (from BlockMeasurer) or estimated
 *   (from estimateBlockHeight).
 *
 * SHOW_MEASUREMENTS:
 *   Shows the full measurement pipeline status for each block:
 *     Estimated height (gray)  — from estimateBlockHeight()
 *     Measured height (green)  — from BlockMeasurer's ResizeObserver
 *     Compressed height (orange) — from session-state compressedHeightCache
 *     Pending indicator — when a measurable block hasn't been measured yet
 *
 * SHOW_SCENE_FLOW:
 *   Shows scene split info — which blocks belong to which scene,
 *   scene boundaries (dashed red lines), and overflow indicators.
 *   Useful for debugging SceneOverflowEngine's auto-split behavior.
 */
export interface DebugConfig {
  /** Show colored borders around each block's layout box */
  SHOW_LAYOUT_BOXES: boolean;
  /** Show block ID, type, dimensions, measurement status */
  SHOW_BLOCK_BOUNDS: boolean;
  /** Show measurement pipeline status (estimated/measured/compressed/pending) */
  SHOW_MEASUREMENTS: boolean;
  /** Show scene split info — boundaries, block-to-scene mapping */
  SHOW_SCENE_FLOW: boolean;
  /** Flash blocks on rerender — highlights unnecessary re-renders */
  SHOW_RERENDER: boolean;
}

// ── Mutable Singleton ──────────────────────────────────────────

/**
 * Mutable debug configuration singleton.
 *
 * IMPORTANT: This is a plain mutable object, NOT React state.
 * Mutations to this object do NOT trigger React re-renders in
 * parent components. The DebugOverlay component uses a local
 * force-update mechanism to re-read this config on toggle.
 *
 * To toggle: call toggleDebugMode(key) — do NOT assign directly.
 * To check:  call isDebugMode() — do NOT read properties directly
 *            (unless you're inside the DebugOverlay render cycle).
 */
export const debugConfig: DebugConfig = {
  SHOW_LAYOUT_BOXES: false,
  SHOW_BLOCK_BOUNDS: false,
  SHOW_MEASUREMENTS: false,
  SHOW_SCENE_FLOW: false,
  SHOW_RERENDER: false,
};

// ── Toggle Function ────────────────────────────────────────────

/**
 * Toggle a debug mode on or off.
 *
 * This mutates the singleton in-place — it does NOT create a new
 * object. This is intentional: we don't want React to see a new
 * reference and trigger re-renders in the parent component.
 *
 * The DebugOverlay component listens for config changes via its
 * own local force-update mechanism (useState counter). The toggle
 * button calls this function and then increments the counter.
 *
 * @param key - Which debug mode to toggle
 * @returns The new value of the toggled mode
 *
 * @example
 *   // Toggle layout box visualization
 *   toggleDebugMode('SHOW_LAYOUT_BOXES'); // → true
 *   toggleDebugMode('SHOW_LAYOUT_BOXES'); // → false
 */
export function toggleDebugMode(key: DebugModeKey): boolean {
  debugConfig[key] = !debugConfig[key];
  return debugConfig[key];
}

// ── Query Function ─────────────────────────────────────────────

/**
 * Check if ANY debug mode is currently active.
 *
 * Used by DebugOverlay for early-return optimization:
 * if no mode is active and the panel is closed, the overlay
 * returns null (zero cost — no DOM, no computation).
 *
 * @returns true if at least one debug mode is enabled
 *
 * @example
 *   // In component render:
 *   if (!isDebugMode() && !panelOpen) return null;
 */
export function isDebugMode(): boolean {
  return (
    debugConfig.SHOW_LAYOUT_BOXES ||
    debugConfig.SHOW_BLOCK_BOUNDS ||
    debugConfig.SHOW_MEASUREMENTS ||
    debugConfig.SHOW_SCENE_FLOW ||
    debugConfig.SHOW_RERENDER
  );
}

// ── Reset Function ─────────────────────────────────────────────

/**
 * Disable all debug modes.
 *
 * Useful for programmatically resetting the debug state,
 * e.g., when switching projects or entering preview mode.
 */
export function disableAllDebugModes(): void {
  debugConfig.SHOW_LAYOUT_BOXES = false;
  debugConfig.SHOW_BLOCK_BOUNDS = false;
  debugConfig.SHOW_MEASUREMENTS = false;
  debugConfig.SHOW_SCENE_FLOW = false;
  debugConfig.SHOW_RERENDER = false;
}

// ═══ window.__SILSE_DEBUG__ Bridge ═══════════════════════════════
// Exposes debug config to browser console for rapid iteration.
// Usage in DevTools:
//   __SILSE_DEBUG__.layout = true    → enables SHOW_LAYOUT_BOXES
//   __SILSE_DEBUG__.measurement = true → enables SHOW_MEASUREMENTS
//   __SILSE_DEBUG__.bounds = true     → enables SHOW_BLOCK_BOUNDS
//   __SILSE_DEBUG__.rerender = true   → enables SHOW_RERENDER
//   __SILSE_DEBUG__.all()             → enables everything
//   __SILSE_DEBUG__.none()            → disables everything
//   __SILSE_DEBUG__.status()          → prints current config

interface SilseDebugBridge {
  layout: boolean;
  measurement: boolean;
  bounds: boolean;
  rerender: boolean;
  scene: boolean;
  all: () => void;
  none: () => void;
  status: () => void;
}

if (typeof window !== 'undefined') {
  const bridge: SilseDebugBridge = {
    get layout() { return debugConfig.SHOW_LAYOUT_BOXES; },
    set layout(v: boolean) { debugConfig.SHOW_LAYOUT_BOXES = v; },
    get measurement() { return debugConfig.SHOW_MEASUREMENTS; },
    set measurement(v: boolean) { debugConfig.SHOW_MEASUREMENTS = v; },
    get bounds() { return debugConfig.SHOW_BLOCK_BOUNDS; },
    set bounds(v: boolean) { debugConfig.SHOW_BLOCK_BOUNDS = v; },
    get rerender() { return debugConfig.SHOW_RERENDER; },
    set rerender(v: boolean) { debugConfig.SHOW_RERENDER = v; },
    get scene() { return debugConfig.SHOW_SCENE_FLOW; },
    set scene(v: boolean) { debugConfig.SHOW_SCENE_FLOW = v; },
    all() {
      debugConfig.SHOW_LAYOUT_BOXES = true;
      debugConfig.SHOW_BLOCK_BOUNDS = true;
      debugConfig.SHOW_MEASUREMENTS = true;
      debugConfig.SHOW_SCENE_FLOW = true;
      debugConfig.SHOW_RERENDER = true;
      console.log('[SILSE DEBUG] All modes enabled');
    },
    none() {
      disableAllDebugModes();
      console.log('[SILSE DEBUG] All modes disabled');
    },
    status() {
      console.table({
        SHOW_LAYOUT_BOXES: debugConfig.SHOW_LAYOUT_BOXES,
        SHOW_BLOCK_BOUNDS: debugConfig.SHOW_BLOCK_BOUNDS,
        SHOW_MEASUREMENTS: debugConfig.SHOW_MEASUREMENTS,
        SHOW_SCENE_FLOW: debugConfig.SHOW_SCENE_FLOW,
        SHOW_RERENDER: debugConfig.SHOW_RERENDER,
      });
    },
  };
  (window as unknown as Record<string, unknown>).__SILSE_DEBUG__ = bridge;
}
