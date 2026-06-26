// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// CANVA SHORTCUTS — Barrel export + factory
// ═══════════════════════════════════════════════════════════════════
// Re-exports everything from the split modules and provides the
// combined getCanvaShortcuts() factory that merges schema-block
// + view-and-nav shortcuts.
//
// Usage (in CanvaBuilder or equivalent):
//   const shortcuts = getCanvaShortcuts({
//     getCanvaState: useCanvaStore.getState,
//     setCanvaState: useCanvaStore.setState,
//     getInteractiveState: useInteractiveStore.getState,
//     openAIAssistant: () => window.dispatchEvent(new CustomEvent('open-ai-assistant')),
//   });
//   useKeyboardShortcuts(shortcuts, []);
//
// Priority tiers:
//   15  → Schema block operations (selectedBlockId is set)
//   12  → Page operations (split, merge, rebalance)
//   10  → App-level operations (undo/redo, zoom, copy/paste)
//   8   → Legacy element operations (selectedElId is set)
//   6   → Scene navigation
//   5   → Fallback nudge (no specific selection)
//   3   → Escape/deselect
//   2   → Tool shortcuts
// ═══════════════════════════════════════════════════════════════════

// ── Re-exports ─────────────────────────────────────────────────────
export type { CanvaShortcutDeps } from './deps';
export { getSchemaBlockShortcuts } from './schema-block-shortcuts';
export { getViewAndNavShortcuts } from './view-and-nav-shortcuts';
export { CANVAS_SHORTCUTS, GLOBAL_SHORTCUTS, INTERACTIVE_SHORTCUTS } from './static-definitions';

// ── Imports for factory ────────────────────────────────────────────
import type { ShortcutDefinition } from '../ShortcutRegistry';
import type { CanvaShortcutDeps } from './deps';
import { getSchemaBlockShortcuts } from './schema-block-shortcuts';
import { getViewAndNavShortcuts } from './view-and-nav-shortcuts';

// ── Factory Function ──────────────────────────────────────────────

/**
 * Create canva keyboard shortcuts with injected dependencies.
 *
 * Merges schema block shortcuts + view/navigation shortcuts into
 * a single array, preserving the exact same order and behavior
 * as the original monolithic implementation.
 *
 * @param deps - Store accessors and side-effect callbacks
 * @returns Array of shortcut definitions ready for useKeyboardShortcuts()
 */
export function getCanvaShortcuts(deps: CanvaShortcutDeps): ShortcutDefinition[] {
  return [
    ...getSchemaBlockShortcuts(deps),
    ...getViewAndNavShortcuts(deps),
  ];
}
