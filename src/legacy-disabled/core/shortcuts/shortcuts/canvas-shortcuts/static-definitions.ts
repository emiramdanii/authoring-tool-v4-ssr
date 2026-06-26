// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// STATIC DEFINITIONS — Placeholder shortcut definitions
// ═══════════════════════════════════════════════════════════════════
// Static definitions with no-op handlers, used by the
// ShortcutHelpOverlay and other UI that needs shortcut metadata
// without binding real handlers. Real handlers are provided via
// getCanvaShortcuts() at registration time.
// ═══════════════════════════════════════════════════════════════════

import type { ShortcutDefinition } from '../ShortcutRegistry';

/**
 * Canvas-scoped shortcut metadata (no-op handlers).
 * Use getCanvaShortcuts() for the live version with real handlers.
 */
export const CANVAS_SHORTCUTS: ShortcutDefinition[] = [
  // ── History ────────────────────────────────────────────────────
  { id: 'canvas.undo', keys: 'ctrl+z', scope: 'canvas', priority: 10, handler: () => {}, description: 'Undo', category: 'History' },
  { id: 'canvas.redo', keys: 'ctrl+y', scope: 'canvas', priority: 10, handler: () => {}, description: 'Redo', category: 'History' },
  { id: 'canvas.redo-alt', keys: 'ctrl+shift+z', scope: 'canvas', priority: 10, handler: () => {}, description: 'Redo (alternative)', category: 'History' },

  // ── Block editing ──────────────────────────────────────────────
  { id: 'canvas.schema-delete', keys: 'delete', scope: 'canvas', priority: 15, handler: () => {}, description: 'Delete schema block', category: 'Block' },
  { id: 'canvas.schema-backspace-delete', keys: 'backspace', scope: 'canvas', priority: 15, handler: () => {}, description: 'Delete schema block (Backspace)', category: 'Block' },
  { id: 'canvas.schema-copy', keys: 'ctrl+c', scope: 'canvas', priority: 15, handler: () => {}, description: 'Copy schema block', category: 'Block' },
  { id: 'canvas.schema-cut', keys: 'ctrl+x', scope: 'canvas', priority: 15, handler: () => {}, description: 'Cut schema block', category: 'Block' },
  { id: 'canvas.schema-paste', keys: 'ctrl+v', scope: 'canvas', priority: 15, handler: () => {}, description: 'Paste schema block', category: 'Block' },
  { id: 'canvas.schema-duplicate', keys: 'ctrl+d', scope: 'canvas', priority: 15, handler: () => {}, description: 'Duplicate schema block', category: 'Block' },
  { id: 'canvas.schema-nudge-up', keys: 'arrowup', scope: 'canvas', priority: 15, handler: () => {}, description: 'Nudge schema block up (Shift: 5px)', category: 'Block' },
  { id: 'canvas.schema-nudge-down', keys: 'arrowdown', scope: 'canvas', priority: 15, handler: () => {}, description: 'Nudge schema block down (Shift: 5px)', category: 'Block' },
  { id: 'canvas.schema-nudge-left', keys: 'arrowleft', scope: 'canvas', priority: 15, handler: () => {}, description: 'Nudge schema block left (Shift: 5px)', category: 'Block' },
  { id: 'canvas.schema-nudge-right', keys: 'arrowright', scope: 'canvas', priority: 15, handler: () => {}, description: 'Nudge schema block right (Shift: 5px)', category: 'Block' },
  { id: 'canvas.schema-reorder-up', keys: 'alt+arrowup', scope: 'canvas', priority: 15, handler: () => {}, description: 'Move schema block up (reorder)', category: 'Block' },
  { id: 'canvas.schema-reorder-down', keys: 'alt+arrowdown', scope: 'canvas', priority: 15, handler: () => {}, description: 'Move schema block down (reorder)', category: 'Block' },
  { id: 'canvas.schema-select-all', keys: 'ctrl+a', scope: 'canvas', priority: 15, handler: () => {}, description: 'Select all schema blocks', category: 'Selection' },

  // ── Page operations ──────────────────────────────────────────
  { id: 'canvas.page-split', keys: 'ctrl+shift+s', scope: 'canvas', priority: 12, handler: () => {}, description: 'Pisah halaman di block terpilih', category: 'Page' },
  { id: 'canvas.page-merge-next', keys: 'ctrl+shift+m', scope: 'canvas', priority: 12, handler: () => {}, description: 'Gabung dengan halaman berikutnya', category: 'Page' },
  { id: 'canvas.page-rebalance', keys: 'ctrl+shift+r', scope: 'canvas', priority: 12, handler: () => {}, description: 'Optimalkan tata letak halaman', category: 'Page' },

  // ── Element editing ──────────────────────────────────────────────
  { id: 'canvas.delete-block', keys: 'delete', scope: 'canvas', priority: 8, handler: () => {}, description: 'Delete selected element', category: 'Element' },
  { id: 'canvas.backspace-delete', keys: 'backspace', scope: 'canvas', priority: 8, handler: () => {}, description: 'Delete selected element (Backspace)', category: 'Element' },
  { id: 'canvas.element-duplicate', keys: 'ctrl+d', scope: 'canvas', priority: 8, handler: () => {}, description: 'Duplicate selected element', category: 'Element' },
  { id: 'canvas.element-copy', keys: 'ctrl+c', scope: 'canvas', priority: 8, handler: () => {}, description: 'Copy selected element', category: 'Element' },
  { id: 'canvas.element-cut', keys: 'ctrl+x', scope: 'canvas', priority: 8, handler: () => {}, description: 'Cut selected element', category: 'Element' },
  { id: 'canvas.element-paste', keys: 'ctrl+v', scope: 'canvas', priority: 8, handler: () => {}, description: 'Paste element from clipboard', category: 'Element' },
  { id: 'canvas.element-select-all', keys: 'ctrl+a', scope: 'canvas', priority: 8, handler: () => {}, description: 'Select all elements', category: 'Element' },

  // ── Nudge (legacy) ──────────────────────────────────────────────
  { id: 'canvas.nudge-up', keys: 'arrowup', scope: 'canvas', priority: 5, handler: () => {}, description: 'Nudge element up (Shift: 5px)', category: 'Element' },
  { id: 'canvas.nudge-down', keys: 'arrowdown', scope: 'canvas', priority: 5, handler: () => {}, description: 'Nudge element down (Shift: 5px)', category: 'Element' },
  { id: 'canvas.nudge-left', keys: 'arrowleft', scope: 'canvas', priority: 5, handler: () => {}, description: 'Nudge element left (Shift: 5px)', category: 'Element' },
  { id: 'canvas.nudge-right', keys: 'arrowright', scope: 'canvas', priority: 5, handler: () => {}, description: 'Nudge element right (Shift: 5px)', category: 'Element' },

  // ── Selection ──────────────────────────────────────────────────
  { id: 'canvas.escape', keys: 'escape', scope: 'canvas', priority: 3, handler: () => {}, description: 'Deselect / Exit editing / Exit preview', category: 'Selection' },

  // ── Tools ──────────────────────────────────────────────────────
  { id: 'canvas.tool-select', keys: 'v', scope: 'canvas', priority: 2, handler: () => {}, description: 'Select tool', category: 'Tools' },
  { id: 'canvas.tool-text', keys: 't', scope: 'canvas', priority: 2, handler: () => {}, description: 'Text tool', category: 'Tools' },
  { id: 'canvas.ai-assistant', keys: 'ctrl+i', scope: 'canvas', priority: 10, handler: () => {}, description: 'Buka AI Assistant', category: 'Tools' },

  // ── View ──────────────────────────────────────────────────────
  { id: 'canvas.zoom-in', keys: 'ctrl+=', scope: 'canvas', priority: 10, handler: () => {}, description: 'Perbesar', category: 'Tampilan' },
  { id: 'canvas.zoom-out', keys: 'ctrl+-', scope: 'canvas', priority: 10, handler: () => {}, description: 'Perkecil', category: 'Tampilan' },
  { id: 'canvas.zoom-fit', keys: 'ctrl+0', scope: 'canvas', priority: 10, handler: () => {}, description: 'Sesuaikan layar', category: 'Tampilan' },

  // ── Navigation ──────────────────────────────────────────────────
  { id: 'canvas.scene-prev', keys: 'ctrl+arrowleft', scope: 'canvas', priority: 6, handler: () => {}, description: 'Scene sebelumnya (Ctrl+←)', category: 'Navigation' },
  { id: 'canvas.scene-next', keys: 'ctrl+arrowright', scope: 'canvas', priority: 6, handler: () => {}, description: 'Scene berikutnya (Ctrl+→)', category: 'Navigation' },
];

/**
 * Global shortcut definitions (always available regardless of scope).
 */
export const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'global.command-palette',
    keys: 'ctrl+k',
    scope: 'global',
    priority: 30,
    handler: () => {},
    description: 'Buka Command Palette',
    category: 'App',
  },
  {
    id: 'global.theme-toggle',
    keys: 'ctrl+shift+t',
    scope: 'global',
    priority: 10,
    handler: () => {},
    description: 'Toggle dark/light mode',
    category: 'App',
  },
  {
    id: 'global.shortcut-help',
    keys: 'ctrl+/',
    scope: 'global',
    priority: 20,
    handler: () => {},
    description: 'Tampilkan bantuan shortcut',
    category: 'App',
  },
];

/**
 * Interactive mode shortcut definitions.
 * Active when the PlayOverlay is shown.
 */
export const INTERACTIVE_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'interactive.next-page',
    keys: 'arrowright',
    scope: 'canvas',
    priority: 20,
    handler: () => {},
    description: 'Halaman berikutnya',
    category: 'Navigasi Interaktif',
  },
  {
    id: 'interactive.prev-page',
    keys: 'arrowleft',
    scope: 'canvas',
    priority: 20,
    handler: () => {},
    description: 'Halaman sebelumnya',
    category: 'Navigasi Interaktif',
  },
  {
    id: 'interactive.next-page-space',
    keys: 'space',
    scope: 'canvas',
    priority: 15,
    handler: () => {},
    description: 'Halaman berikutnya (Space)',
    category: 'Navigasi Interaktif',
  },
  {
    id: 'interactive.close',
    keys: 'escape',
    scope: 'canvas',
    priority: 25,
    handler: () => {},
    description: 'Tutup mode interaktif',
    category: 'Navigasi Interaktif',
  },
  {
    id: 'interactive.fullscreen',
    keys: 'f',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Toggle fullscreen',
    category: 'Navigasi Interaktif',
  },
  {
    id: 'interactive.overview',
    keys: 'o',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Toggle overview grid',
    category: 'Navigasi Interaktif',
  },
];
