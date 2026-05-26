// ═══════════════════════════════════════════════════════════════════
// CANVA SHORTCUTS — Keyboard shortcut definitions for the Canva editor
// ═══════════════════════════════════════════════════════════════════
// All shortcut definitions with their handlers are defined here.
// The handlers receive store access through a dependency injection
// pattern (CanvaShortcutDeps), keeping this file decoupled from
// specific store implementations.
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
//   10  → App-level operations (undo/redo, zoom, copy/paste)
//   8   → Legacy element operations (selectedElId is set)
//   6   → Scene navigation
//   5   → Fallback nudge (no specific selection)
//   3   → Escape/deselect
//   2   → Tool shortcuts
// ═══════════════════════════════════════════════════════════════════

import type { ShortcutDefinition } from './ShortcutRegistry';
import type { CanvaState } from '@/store/canva-store';

// ── Dependency Injection Interface ────────────────────────────────

/**
 * Dependencies required by canva keyboard shortcuts.
 * Injected at registration time to keep shortcut definitions
 * decoupled from store implementations and testable in isolation.
 */
export interface CanvaShortcutDeps {
  /** Read the current canva store state */
  getCanvaState: () => CanvaState;
  /** Partially update canva store state (Zustand-style setState) */
  setCanvaState: (partial: Partial<CanvaState>) => void;
  /** Read the current interactive store state */
  getInteractiveState: () => { mode: string };
  /** Open the AI Assistant panel (dispatches custom event + ensures right panel open) */
  openAIAssistant: () => void;
}

// ── Factory Function ──────────────────────────────────────────────

/**
 * Create canva keyboard shortcuts with injected dependencies.
 *
 * @param deps - Store accessors and side-effect callbacks
 * @returns Array of shortcut definitions ready for useKeyboardShortcuts()
 */
export function getCanvaShortcuts(deps: CanvaShortcutDeps): ShortcutDefinition[] {
  const { getCanvaState, setCanvaState, getInteractiveState, openAIAssistant } = deps;

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
              selectedBlockId: firstBlock.id ?? null,
              selectedBlockType: firstBlock.type ?? null,
              selectedBlockIds: allBlockIds,
            });
          }
          return;
        }
      },
      description: 'Select all schema blocks',
      category: 'Selection',
    },

    // ═══════════════════════════════════════════════════════════════
    // LEGACY ELEMENT — Delete (priority 8)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.delete-block',
      keys: 'delete',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
      },
      description: 'Delete selected element',
      category: 'Element',
    },
    {
      id: 'canvas.backspace-delete',
      keys: 'backspace',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
      },
      description: 'Delete selected element (Backspace)',
      category: 'Element',
    },

    // ═══════════════════════════════════════════════════════════════
    // LEGACY ELEMENT — Copy / Paste / Duplicate (priority 8)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.element-duplicate',
      keys: 'ctrl+d',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
          store.pasteElements();
        }
      },
      description: 'Duplicate selected element',
      category: 'Element',
    },
    {
      id: 'canvas.element-copy',
      keys: 'ctrl+c',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
        }
      },
      description: 'Copy selected element',
      category: 'Element',
    },
    {
      id: 'canvas.element-cut',
      keys: 'ctrl+x',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.copySelected();
          store.deleteSelected();
        }
      },
      description: 'Cut selected element',
      category: 'Element',
    },
    {
      id: 'canvas.element-paste',
      keys: 'ctrl+v',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store._clipboard.length > 0) {
          e.preventDefault();
          store.pasteElements();
        }
      },
      description: 'Paste element from clipboard',
      category: 'Element',
    },
    {
      id: 'canvas.element-select-all',
      keys: 'ctrl+a',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        e.preventDefault();
        store.selectAllElements();
      },
      description: 'Select all elements',
      category: 'Element',
    },

    // ═══════════════════════════════════════════════════════════════
    // LEGACY ELEMENT — Nudge (priority 5)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.nudge-up',
      keys: 'arrowup',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(0, e.shiftKey ? -5 : -1);
      },
      description: 'Nudge element up (Shift: 5px)',
      category: 'Element',
    },
    {
      id: 'canvas.nudge-down',
      keys: 'arrowdown',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(0, e.shiftKey ? 5 : 1);
      },
      description: 'Nudge element down (Shift: 5px)',
      category: 'Element',
    },
    {
      id: 'canvas.nudge-left',
      keys: 'arrowleft',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(e.shiftKey ? -5 : -1, 0);
      },
      description: 'Nudge element left (Shift: 5px)',
      category: 'Element',
    },
    {
      id: 'canvas.nudge-right',
      keys: 'arrowright',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(e.shiftKey ? 5 : 1, 0);
      },
      description: 'Nudge element right (Shift: 5px)',
      category: 'Element',
    },

    // ═══════════════════════════════════════════════════════════════
    // SELECTION — Escape (priority 3)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.escape',
      keys: 'escape',
      scope: 'canvas',
      priority: 3,
      handler: () => {
        const store = getCanvaState();
        // If in app preview/present mode, exit to edit first
        if (store.appMode === 'preview' || store.appMode === 'present') {
          store.setAppMode('edit');
          return;
        }
        // If in canvas preview mode, exit preview first
        if (store.canvasPreview) {
          store.toggleCanvasPreview();
          return;
        }
        // If editing a block inline, stop editing first
        if (store.editingBlockId) {
          store.stopEditing();
          return;
        }
        // Clear all selection types
        store.selectElement(null);
        store.selectBlock(null);
      },
      description: 'Deselect / Exit editing / Exit preview',
      category: 'Selection',
    },

    // ═══════════════════════════════════════════════════════════════
    // TOOLS — V=select, T=text (priority 2)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.tool-select',
      keys: 'v',
      scope: 'canvas',
      priority: 2,
      handler: () => {
        if (isInteractive()) return;
        getCanvaState().setTool('select');
      },
      description: 'Select tool',
      category: 'Tools',
    },
    {
      id: 'canvas.tool-text',
      keys: 't',
      scope: 'canvas',
      priority: 2,
      handler: () => {
        if (isInteractive()) return;
        getCanvaState().setTool('text');
      },
      description: 'Text tool',
      category: 'Tools',
    },

    // ═══════════════════════════════════════════════════════════════
    // VIEW — Zoom (priority 10)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.zoom-in',
      keys: 'ctrl+=',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = getCanvaState();
        if (store.zoom === -1) store.setZoom(1);
        else store.zoomDelta(0.1);
      },
      description: 'Zoom in',
      category: 'View',
    },
    {
      id: 'canvas.zoom-out',
      keys: 'ctrl+-',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = getCanvaState();
        if (store.zoom === -1) store.setZoom(0.8);
        else store.zoomDelta(-0.1);
      },
      description: 'Zoom out',
      category: 'View',
    },
    {
      id: 'canvas.zoom-fit',
      keys: 'ctrl+0',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        getCanvaState().zoomToFit();
      },
      description: 'Fit to screen',
      category: 'View',
    },

    // ═══════════════════════════════════════════════════════════════
    // AI ASSISTANT (Ctrl+I, priority 10)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.ai-assistant',
      keys: 'ctrl+i',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        openAIAssistant();
      },
      description: 'Buka AI Assistant',
      category: 'Tools',
    },

    // ═══════════════════════════════════════════════════════════════
    // PAGE OPERATIONS — Split / Merge / Rebalance (Ctrl+Shift, priority 12)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.page-split',
      keys: 'ctrl+shift+s',
      scope: 'canvas',
      priority: 12,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.splitPageAtBlock(store.selectedBlockId);
      },
      description: 'Pisah halaman di block terpilih',
      category: 'Page',
    },
    {
      id: 'canvas.page-merge-next',
      keys: 'ctrl+shift+m',
      scope: 'canvas',
      priority: 12,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        e.preventDefault();
        store.mergeWithAdjacentPage('next');
      },
      description: 'Gabung dengan halaman berikutnya',
      category: 'Page',
    },
    {
      id: 'canvas.page-rebalance',
      keys: 'ctrl+shift+r',
      scope: 'canvas',
      priority: 12,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        e.preventDefault();
        store.rebalanceCurrentPage();
      },
      description: 'Optimalkan tata letak halaman',
      category: 'Page',
    },

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION — Scene prev/next (Ctrl+Arrow, priority 6)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'canvas.scene-prev',
      keys: 'ctrl+arrowleft',
      scope: 'canvas',
      priority: 6,
      handler: (e) => {
        const store = getCanvaState();
        if (store.sceneTotal <= 1) return;
        e.preventDefault();
        if (store.sceneIndex > 0) {
          store.setSceneState(store.sceneIndex - 1, store.sceneTotal);
        }
      },
      description: 'Scene sebelumnya (Ctrl+←)',
      category: 'Navigation',
    },
    {
      id: 'canvas.scene-next',
      keys: 'ctrl+arrowright',
      scope: 'canvas',
      priority: 6,
      handler: (e) => {
        const store = getCanvaState();
        if (store.sceneTotal <= 1) return;
        e.preventDefault();
        if (store.sceneIndex < store.sceneTotal - 1) {
          store.setSceneState(store.sceneIndex + 1, store.sceneTotal);
        }
      },
      description: 'Scene berikutnya (Ctrl+→)',
      category: 'Navigation',
    },
  ];
}

// ── Placeholder Definitions ──────────────────────────────────────
// These are static definitions with no-op handlers, used by the
// ShortcutHelpOverlay and other UI that needs shortcut metadata
// without binding real handlers. Real handlers are provided via
// getCanvaShortcuts() at registration time.

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
  { id: 'canvas.zoom-in', keys: 'ctrl+=', scope: 'canvas', priority: 10, handler: () => {}, description: 'Zoom in', category: 'View' },
  { id: 'canvas.zoom-out', keys: 'ctrl+-', scope: 'canvas', priority: 10, handler: () => {}, description: 'Zoom out', category: 'View' },
  { id: 'canvas.zoom-fit', keys: 'ctrl+0', scope: 'canvas', priority: 10, handler: () => {}, description: 'Fit to screen', category: 'View' },

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
