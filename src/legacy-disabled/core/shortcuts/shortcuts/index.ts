// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// SHORTCUTS — Public API
// ═══════════════════════════════════════════════════════════════════

export { shortcutRegistry, useShortcutRegistration } from './ShortcutRegistry';
export type { ShortcutDefinition, ShortcutScope, KeyModifier } from './ShortcutRegistry';
export { getCanvaShortcuts, CANVAS_SHORTCUTS, GLOBAL_SHORTCUTS, INTERACTIVE_SHORTCUTS } from './canvas-shortcuts';
export type { CanvaShortcutDeps } from './canvas-shortcuts';
export { keyboardManager } from './keyboard-manager';
