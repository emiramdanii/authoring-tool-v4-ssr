// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// VIEW AND NAV SHORTCUTS — View, navigation, element, and misc shortcuts
// ═══════════════════════════════════════════════════════════════════
// The remaining shortcut definitions from getCanvaShortcuts():
//   - Element delete/copy/paste/duplicate/nudge/select-all (legacy)
//   - Escape
//   - Tool shortcuts (v, t)
//   - Zoom shortcuts
//   - AI assistant
//   - Page operations (split, merge, rebalance)
//   - Navigation (scene prev/next)
// ═══════════════════════════════════════════════════════════════════

import type { ShortcutDefinition } from '../ShortcutRegistry';
import type { CanvaShortcutDeps } from './deps';

/**
 * Create view, navigation, element, and misc keyboard shortcuts
 * with injected dependencies.
 *
 * Includes:
 *   - Element delete/copy/paste/duplicate/nudge/select-all (legacy)
 *   - Escape
 *   - Tool shortcuts (v, t)
 *   - Zoom shortcuts
 *   - AI assistant
 *   - Page operations (split, merge, rebalance)
 *   - Navigation (scene prev/next)
 *
 * @param deps - Store accessors and side-effect callbacks
 * @returns Array of shortcut definitions for view, navigation, and element operations
 */
export function getViewAndNavShortcuts(deps: CanvaShortcutDeps): ShortcutDefinition[] {
  const { getCanvaState, getInteractiveState, openAIAssistant } = deps;

  /** Helper: check if the editor is currently in interactive (play) mode */
  const isInteractive = () => getInteractiveState().mode === 'interactive';

  return [
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
      description: 'Perbesar',
      category: 'Tampilan',
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
      description: 'Perkecil',
      category: 'Tampilan',
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
      description: 'Sesuaikan layar',
      category: 'Tampilan',
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

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION — Page prev/next (Alt+Arrow, priority 6)
    // ═══════════════════════════════════════════════════════════════
    // Previously, there was NO keyboard shortcut for page navigation
    // in edit mode. Users had to click the small toolbar buttons or
    // the SceneList, making page switching feel "difficult" especially
    // when many pages exist. Alt+Arrow now provides fast page switching.
    {
      id: 'canvas.page-prev',
      keys: 'alt+arrowleft',
      scope: 'canvas',
      priority: 6,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.currentPageIndex > 0) {
          e.preventDefault();
          store.goPage(store.currentPageIndex - 1);
        }
      },
      description: 'Halaman sebelumnya (Alt+←)',
      category: 'Navigation',
    },
    {
      id: 'canvas.page-next',
      keys: 'alt+arrowright',
      scope: 'canvas',
      priority: 6,
      handler: (e) => {
        const store = getCanvaState();
        if (isInteractive()) return;
        if (store.currentPageIndex < store.pages.length - 1) {
          e.preventDefault();
          store.goPage(store.currentPageIndex + 1);
        }
      },
      description: 'Halaman berikutnya (Alt+→)',
      category: 'Navigation',
    },
  ];
}
