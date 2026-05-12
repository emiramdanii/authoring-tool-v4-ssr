// ═══════════════════════════════════════════════════════════════════
// CANVAS SHORTCUTS — All keyboard shortcuts for the Canva editor
// ═══════════════════════════════════════════════════════════════════
// These are the canonical definitions. The ShortcutRegistry processes
// them at runtime. The useStageKeyboard hook can be gradually
// migrated to use this registry instead of inline event handling.
//
// NOTE: This file is a DEFINITION layer. The actual binding happens
// in the Stage component or a future useShortcutRegistry hook.
// ═══════════════════════════════════════════════════════════════════

import type { ShortcutDefinition } from './ShortcutRegistry';

/**
 * Canvas-scoped shortcut definitions.
 * These are registered when the Canva editor is active.
 */
export const CANVAS_SHORTCUTS: ShortcutDefinition[] = [
  // ── History ────────────────────────────────────────────────────
  {
    id: 'canvas.undo',
    keys: 'ctrl+z',
    scope: 'canvas',
    priority: 10,
    handler: () => {}, // Bound at registration time
    description: 'Undo',
    category: 'History',
  },
  {
    id: 'canvas.redo',
    keys: 'ctrl+y',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Redo',
    category: 'History',
  },
  {
    id: 'canvas.redo-alt',
    keys: 'ctrl+shift+z',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Redo (alternative)',
    category: 'History',
  },

  // ── Block editing ──────────────────────────────────────────────
  {
    id: 'canvas.nudge-up',
    keys: 'arrowup',
    scope: 'canvas',
    priority: 5,
    handler: () => {},
    description: 'Nudge block up (Shift: 5px)',
    category: 'Block',
  },
  {
    id: 'canvas.nudge-down',
    keys: 'arrowdown',
    scope: 'canvas',
    priority: 5,
    handler: () => {},
    description: 'Nudge block down (Shift: 5px)',
    category: 'Block',
  },
  {
    id: 'canvas.nudge-left',
    keys: 'arrowleft',
    scope: 'canvas',
    priority: 5,
    handler: () => {},
    description: 'Nudge block left (Shift: 5px)',
    category: 'Block',
  },
  {
    id: 'canvas.nudge-right',
    keys: 'arrowright',
    scope: 'canvas',
    priority: 5,
    handler: () => {},
    description: 'Nudge block right (Shift: 5px)',
    category: 'Block',
  },
  {
    id: 'canvas.delete-block',
    keys: 'delete',
    scope: 'canvas',
    priority: 8,
    handler: () => {},
    description: 'Delete selected block',
    category: 'Block',
  },
  {
    id: 'canvas.duplicate-block',
    keys: 'ctrl+d',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Duplicate selected block',
    category: 'Block',
  },
  {
    id: 'canvas.copy-block',
    keys: 'ctrl+c',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Copy selected block',
    category: 'Block',
  },
  {
    id: 'canvas.paste-block',
    keys: 'ctrl+v',
    scope: 'canvas',
    priority: 10,
    handler: () => {},
    description: 'Paste block from clipboard',
    category: 'Block',
  },
  {
    id: 'canvas.move-block-up',
    keys: 'alt+arrowup',
    scope: 'canvas',
    priority: 8,
    handler: () => {},
    description: 'Move block up in order',
    category: 'Block',
  },
  {
    id: 'canvas.move-block-down',
    keys: 'alt+arrowdown',
    scope: 'canvas',
    priority: 8,
    handler: () => {},
    description: 'Move block down in order',
    category: 'Block',
  },

  // ── Selection ──────────────────────────────────────────────────
  {
    id: 'canvas.select-all',
    keys: 'ctrl+a',
    scope: 'canvas',
    priority: 5,
    handler: () => {},
    description: 'Select all elements',
    category: 'Selection',
  },
  {
    id: 'canvas.escape',
    keys: 'escape',
    scope: 'canvas',
    priority: 3,
    handler: () => {},
    description: 'Deselect / Exit editing',
    category: 'Selection',
  },
];

/**
 * Global shortcut definitions (always available regardless of scope).
 */
export const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
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
    scope: 'canvas', // Reuses canvas scope since play overlay uses it
    priority: 20, // Higher than canvas nudge
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
