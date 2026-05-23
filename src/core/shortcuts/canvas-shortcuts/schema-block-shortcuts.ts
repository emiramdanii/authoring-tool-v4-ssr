// ═══════════════════════════════════════════════════════════════════
// SCHEMA BLOCK SHORTCUTS — Schema block shortcut definitions
// ═══════════════════════════════════════════════════════════════════
// Shortcut definitions from getCanvaShortcuts() that relate to
// schema blocks: history, delete, copy/cut/paste/duplicate,
// nudge, reorder, and select-all.
// ═══════════════════════════════════════════════════════════════════

import type { ShortcutDefinition } from '../ShortcutRegistry';
import type { CanvaShortcutDeps } from './deps';

/**
 * Create schema block keyboard shortcuts with injected dependencies.
 *
 * Includes:
 *   - History shortcuts (undo, redo, redo-alt)
 *   - Schema block delete (delete, backspace)
 *   - Schema block copy/cut/paste/duplicate (ctrl+c, ctrl+x, ctrl+v, ctrl+d)
 *   - Schema block nudge (arrow keys)
 *   - Schema block reorder (alt+arrow)
 *   - Schema block select-all (ctrl+a)
 *
 * @param deps - Store accessors and side-effect callbacks
 * @returns Array of shortcut definitions for schema block operations
 */
export function getSchemaBlockShortcuts(deps: CanvaShortcutDeps): ShortcutDefinition[] {
  const { getCanvaState, setCanvaState, getInteractiveState } = deps;

  /** Helper: check if the editor is currently in interactive (play) mode */
  const isInteractive = () => getInteractiveState().mode === 'interactive';

  return [
    // ═══════════════════════════════════════════════════════════════
    // HISTORY — Undo / Redo
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.undo',
      keys: 'ctrl+z',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        if (isInteractive()) return;
        getCanvaState().undo();
      },
      description: 'Undo',
      category: 'History',
    },
    {
      id: 'canvas.redo',
      keys: 'ctrl+y',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        if (isInteractive()) return;
        getCanvaState().redo();
      },
      description: 'Redo',
      category: 'History',
    },
    {
      id: 'canvas.redo-alt',
      keys: 'ctrl+shift+z',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        if (isInteractive()) return;
        getCanvaState().redo();
      },
      description: 'Redo (alternative)',
      category: 'History',
    },

    // ═══════════════════════════════════════════════════════════════
    // SCHEMA BLOCK — Delete (priority 15, wins over element delete)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.schema-delete',
      keys: 'delete',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        if (store.selectedBlockIds.length > 1) {
          store.deleteSchemaBlocks(store.selectedBlockIds);
        } else {
          store.deleteBlock(store.selectedBlockId);
        }
      },
      description: 'Delete schema block',
      category: 'Block',
    },
    {
      id: 'canvas.schema-backspace-delete',
      keys: 'backspace',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        if (store.selectedBlockIds.length > 1) {
          store.deleteSchemaBlocks(store.selectedBlockIds);
        } else {
          store.deleteBlock(store.selectedBlockId);
        }
      },
      description: 'Delete schema block (Backspace)',
      category: 'Block',
    },

    // ═══════════════════════════════════════════════════════════════
    // SCHEMA BLOCK — Copy / Cut / Paste / Duplicate (priority 15)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.schema-copy',
      keys: 'ctrl+c',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.copySchemaBlock(store.selectedBlockId);
      },
      description: 'Copy schema block',
      category: 'Block',
    },
    {
      id: 'canvas.schema-cut',
      keys: 'ctrl+x',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.copySchemaBlock(store.selectedBlockId);
        store.deleteBlock(store.selectedBlockId);
      },
      description: 'Cut schema block',
      category: 'Block',
    },
    {
      id: 'canvas.schema-paste',
      keys: 'ctrl+v',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store._schemaClipboard) {
          e.preventDefault();
          store.pasteSchemaBlock();
        }
      },
      description: 'Paste schema block',
      category: 'Block',
    },
    {
      id: 'canvas.schema-duplicate',
      keys: 'ctrl+d',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.duplicateBlock(store.selectedBlockId);
      },
      description: 'Duplicate schema block',
      category: 'Block',
    },

    // ═══════════════════════════════════════════════════════════════
    // SCHEMA BLOCK — Nudge (priority 15, wins over element nudge)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.schema-nudge-up',
      keys: 'arrowup',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        if (e.altKey) return;
        e.preventDefault();
        store.nudgeSchemaBlocks(0, e.shiftKey ? -5 : -1);
      },
      description: 'Nudge schema block up (Shift: 5px)',
      category: 'Block',
    },
    {
      id: 'canvas.schema-nudge-down',
      keys: 'arrowdown',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        if (e.altKey) return;
        e.preventDefault();
        store.nudgeSchemaBlocks(0, e.shiftKey ? 5 : 1);
      },
      description: 'Nudge schema block down (Shift: 5px)',
      category: 'Block',
    },
    {
      id: 'canvas.schema-nudge-left',
      keys: 'arrowleft',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.nudgeSchemaBlocks(e.shiftKey ? -5 : -1, 0);
      },
      description: 'Nudge schema block left (Shift: 5px)',
      category: 'Block',
    },
    {
      id: 'canvas.schema-nudge-right',
      keys: 'arrowright',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.nudgeSchemaBlocks(e.shiftKey ? 5 : 1, 0);
      },
      description: 'Nudge schema block right (Shift: 5px)',
      category: 'Block',
    },

    // ═══════════════════════════════════════════════════════════════
    // SCHEMA BLOCK — Reorder (Alt+Arrow, priority 15)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.schema-reorder-up',
      keys: 'alt+arrowup',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.moveBlockUp(store.selectedBlockId);
      },
      description: 'Move schema block up (reorder)',
      category: 'Block',
    },
    {
      id: 'canvas.schema-reorder-down',
      keys: 'alt+arrowdown',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.moveBlockDown(store.selectedBlockId);
      },
      description: 'Move schema block down (reorder)',
      category: 'Block',
    },

    // ═══════════════════════════════════════════════════════════════
    // SCHEMA BLOCK — Select All (Ctrl+A, priority 15)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.schema-select-all',
      keys: 'ctrl+a',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        const page = store.pages[store.currentPageIndex];
        if (page?.schema?.blocks?.length) {
          e.preventDefault();
          const allBlockIds = page.schema.blocks
            .map((b: { id?: string }) => b.id)
            .filter((id: string | undefined): id is string => id != null);
          if (allBlockIds.length > 0) {
            const firstBlock = page.schema.blocks[0];
            setCanvaState({
              selectedBlockId: firstBlock!.id ?? null,
              selectedBlockType: firstBlock!.type ?? null,
              selectedBlockIds: allBlockIds,
            });
          }
          return;
        }
      },
      description: 'Select all schema blocks',
      category: 'Selection',
    },
  ];
}
