'use client';

import { useCallback, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { CanvaAutoSaveSync } from './CanvaAutoSaveSync';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';
import LeftPanel from './LeftPanel';
import Stage from './stage';
import RightPanel from './right-panel';
import { UndoRedoToast } from '@/components/shared/StatusToast';
import CommandPalette, { useCommandPalette } from '@/components/shared/CommandPalette';
import dynamic from 'next/dynamic';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import CanvaTour from '@/components/shared/CanvaTour';
import { MobileGuard } from '@/components/shared/MobileGuard';
// connectHistoryToEditBus is called once in store.ts (canonical location).
// Removed duplicate call — was causing double-recording in PatchHistory.

// Lazy-loaded: PlayOverlay is only needed when user clicks "Play" — purely client-side
const PlayOverlay = dynamic(() => import('./PlayOverlay'), { ssr: false });

export default function CanvaBuilder() {
  const rightPanelOpen = useCanvaStore((s) => s.rightPanelOpen);
  const leftPanelOpen = useCanvaStore((s) => s.leftPanelOpen);
  const commandPalette = useCommandPalette();

  // NOTE: loadFromStorage() removed from CanvaBuilder mount.
  // It was causing a race condition: resetCanvas() creates fresh pages,
  // then CanvaBuilder mounts and loadFromStorage() overwrites them with
  // stale data from localStorage. Persistence is now handled by:
  // 1. Unified auto-save via useAutoSave() hook (2 000 ms debounce)
  // 2. AuthoringTool initial load via loadFromStorage on first app mount

  // ── Unified auto-save ──────────────────────────────────────
  // Auto-save is now handled by CanvaAutoSaveSync component,
  // which connects the project context to the auto-save hook.
  // When a project is loaded, it saves to DB; otherwise localStorage.
  // No other component should implement its own auto-save subscription.
  // NOTE: The CanvaAutoSaveSync component renders below.

  // ── Sync interactive page total with canva pages ─────────────
  useEffect(() => {
    useInteractiveStore.getState().setTotalPages(useCanvaStore.getState().pages.length);
  }, [useCanvaStore((s) => s.pages.length)]);

  // ── PatchHistory ↔ EditBus connection ──────────────────────
  // Removed: connectHistoryToEditBus() was already called in store.ts
  // (line 83). Having it here too caused every schema edit to be
  // recorded TWICE in PatchHistory, making undo/redo unreliable.

  // ── Warn before unload if authoring data is dirty ────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const authDirty = useAuthoringStore.getState().dirty;
      if (authDirty) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but legacy support
        e.returnValue = 'Perubahan belum tersimpan. Yakin ingin keluar?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Unified keyboard shortcuts via registry ──────────────────
  // Replaces the separate useEffect with window.addEventListener('keydown', ...)
  // These shortcuts are scoped to 'canvas' and only fire when the
  // keyboardManager's active context is 'canvas'.
  useKeyboardShortcuts([
    // ═══════════════════════════════════════════════════════════════
    // CONSOLIDATED KEYBOARD SHORTCUTS
    // ═══════════════════════════════════════════════════════════════
    // Architecture: Single ShortcutRegistry with priority-based routing.
    // Schema block handlers (priority 15) always win over legacy
    // element handlers (priority 5-8). This eliminates the dual
    // keydown listener problem where use-stage-keyboard.ts and
    // CanvaBuilder both listened on window, causing double-firing.
    //
    // Priority tiers:
    //   15  → Schema block operations (selectedBlockId is set)
    //   10  → App-level operations (undo/redo, zoom, copy/paste)
    //   8   → Legacy element operations (selectedElId is set)
    //   5   → Fallback nudge (no specific selection)
    //   3   → Escape/deselect
    //   2   → Tool shortcuts
    // ═══════════════════════════════════════════════════════════════

    // ── History ────────────────────────────────────────────────────
    {
      id: 'canvas.undo',
      keys: 'ctrl+z',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().undo();
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
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().redo();
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
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().redo();
      },
      description: 'Redo (alternative)',
      category: 'History',
    },

    // ── Schema Block: Delete (priority 15 — wins over element delete) ──
    {
      id: 'canvas.schema-delete',
      keys: 'delete',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return; // Fall through to element handler
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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

    // ── Schema Block: Copy / Cut / Paste / Duplicate (priority 15) ──
    {
      id: 'canvas.schema-copy',
      keys: 'ctrl+c',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return; // Fall through to element copy
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return; // Fall through to element cut
        e.preventDefault();
        // Cut = Copy + Delete
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        // Schema clipboard takes priority over element clipboard
        if (store._schemaClipboard) {
          e.preventDefault();
          store.pasteSchemaBlock();
        }
        // If no schema clipboard, fall through to element paste handler
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return; // Fall through to element duplicate
        e.preventDefault();
        store.duplicateBlock(store.selectedBlockId);
      },
      description: 'Duplicate schema block',
      category: 'Block',
    },

    // ── Schema Block: Nudge (priority 15 — wins over element nudge) ──
    {
      id: 'canvas.schema-nudge-up',
      keys: 'arrowup',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return; // Fall through to element nudge
        if (e.altKey) return; // Alt+Arrow = reorder, handled separately
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return;
        if (e.altKey) return; // Alt+Arrow = reorder
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.nudgeSchemaBlocks(e.shiftKey ? 5 : 1, 0);
      },
      description: 'Nudge schema block right (Shift: 5px)',
      category: 'Block',
    },

    // ── Schema Block: Reorder (Alt+Arrow, priority 15) ─────────────
    {
      id: 'canvas.schema-reorder-up',
      keys: 'alt+arrowup',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedBlockId) return;
        e.preventDefault();
        store.moveBlockDown(store.selectedBlockId);
      },
      description: 'Move schema block down (reorder)',
      category: 'Block',
    },

    // ── Schema Block: Select All (Ctrl+A, priority 15) ─────────────
    {
      id: 'canvas.schema-select-all',
      keys: 'ctrl+a',
      scope: 'canvas',
      priority: 15,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        // Check if current page has schema blocks
        const page = store.pages[store.currentPageIndex];
        if (page?.schema?.blocks?.length) {
          e.preventDefault();
          const allBlockIds = page.schema.blocks
            .map((b: { id?: string }) => b.id)
            .filter((id: string | undefined): id is string => id != null);
          if (allBlockIds.length > 0) {
            // Select the first block as primary, all as multi-select
            const firstBlock = page.schema.blocks[0];
            useCanvaStore.setState({
              selectedBlockId: firstBlock.id ?? null,
              selectedBlockType: firstBlock.type ?? null,
              selectedBlockIds: allBlockIds,
            });
          }
          return;
        }
        // Fall through to legacy element select-all
      },
      description: 'Select all schema blocks',
      category: 'Selection',
    },

    // ── Legacy Element: Delete (priority 8) ────────────────────────
    {
      id: 'canvas.delete-block',
      keys: 'delete',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (store.selectedElId || store.selectedElIds.length > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
      },
      description: 'Delete selected element (Backspace)',
      category: 'Element',
    },

    // ── Legacy Element: Copy/Paste/Duplicate (priority 10) ─────────
    {
      id: 'canvas.element-duplicate',
      keys: 'ctrl+d',
      scope: 'canvas',
      priority: 8,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        e.preventDefault();
        store.selectAllElements();
      },
      description: 'Select all elements',
      category: 'Element',
    },

    // ── Legacy Element: Nudge (priority 5) ─────────────────────────
    {
      id: 'canvas.nudge-up',
      keys: 'arrowup',
      scope: 'canvas',
      priority: 5,
      handler: (e) => {
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
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
        const store = useCanvaStore.getState();
        if (useInteractiveStore.getState().mode === 'interactive') return;
        if (!store.selectedElId && store.selectedElIds.length === 0) return;
        e.preventDefault();
        store.nudgeSelected(e.shiftKey ? 5 : 1, 0);
      },
      description: 'Nudge element right (Shift: 5px)',
      category: 'Element',
    },

    // ── Selection: Escape (priority 3) ──────────────────────────────
    {
      id: 'canvas.escape',
      keys: 'escape',
      scope: 'canvas',
      priority: 3,
      handler: () => {
        const store = useCanvaStore.getState();
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

    // ── Tool shortcuts (V=select, T=text) ─────────────────────────
    {
      id: 'canvas.tool-select',
      keys: 'v',
      scope: 'canvas',
      priority: 2,
      handler: () => {
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().setTool('select');
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
        if (useInteractiveStore.getState().mode === 'interactive') return;
        useCanvaStore.getState().setTool('text');
      },
      description: 'Text tool',
      category: 'Tools',
    },

    // ── Zoom shortcuts ─────────────────────────────────────────────
    {
      id: 'canvas.zoom-in',
      keys: 'ctrl+=',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
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
        const store = useCanvaStore.getState();
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
        useCanvaStore.getState().zoomToFit();
      },
      description: 'Fit to screen',
      category: 'View',
    },

    // ── AI Assistant ──────────────────────────────────────────────
    {
      id: 'canvas.ai-assistant',
      keys: 'ctrl+i',
      scope: 'canvas',
      priority: 10,
      handler: (e) => {
        e.preventDefault();
        const store = useCanvaStore.getState();
        if (!store.rightPanelOpen) {
          useCanvaStore.setState({ rightPanelOpen: true });
        }
        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
      },
      description: 'Buka AI Assistant',
      category: 'Tools',
    },

    // ── Scene Navigation (Ctrl+Arrow for multi-scene pages) ───────
    {
      id: 'canvas.scene-prev',
      keys: 'ctrl+arrowleft',
      scope: 'canvas',
      priority: 6,
      handler: (e) => {
        const store = useCanvaStore.getState();
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
        const store = useCanvaStore.getState();
        if (store.sceneTotal <= 1) return;
        e.preventDefault();
        if (store.sceneIndex < store.sceneTotal - 1) {
          store.setSceneState(store.sceneIndex + 1, store.sceneTotal);
        }
      },
      description: 'Scene berikutnya (Ctrl+→)',
      category: 'Navigation',
    },
  ], []);

  return (
    <MobileGuard>
      <div className="flex-1 w-full min-w-0 flex flex-col overflow-hidden bg-app-bg text-app-primary focus-ring" id="main-content">
        <UndoRedoToast />
        <CanvaAutoSaveSync />

        {/* Visually hidden live region for screen reader announcements */}
        <div id="a11y-live-region" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

        {/* Top Toolbar */}
        <div data-tour="toolbar" role="toolbar" aria-label="Toolbar editor">
          <Toolbar />
        </div>

        {/* Main builder row — always visible (design view) */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative" style={{ minHeight: 0 }}>
          <div className={`border-r border-app-border shadow-[1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            leftPanelOpen ? 'w-56 md:w-60 lg:w-[280px]' : 'w-0'
          }`} data-tour="left-panel" role="complementary" aria-label="Panel halaman dan block">
            {leftPanelOpen && <LeftPanel />}
          </div>

          {/* Stage Canvas Area — recessed with inner shadow */}
          {/* FIX: Added flex flex-col so Stage's flex-1 works and canvasAreaRef
              returns correct clientHeight (available viewport space, not content height) */}
          <div className="flex flex-col flex-1 min-w-0 relative overflow-hidden shadow-[inset_0_0_16px_-8px_rgba(0,0,0,0.2)] bg-app-bg" data-tour="canvas-stage" role="main" aria-label="Area kerja editor">
            <Stage />
          </div>

          <div className={`border-l border-app-border shadow-[-1px_0_4px_-2px_rgba(0,0,0,0.25)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
            rightPanelOpen ? 'w-56 md:w-60 lg:w-[280px]' : 'w-0'
          }`} data-tour="right-panel" role="complementary" aria-label="Panel properti">
            <CanvasErrorBoundary name="RightPanel">
              {rightPanelOpen && <RightPanel />}
            </CanvasErrorBoundary>
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Play Preview Overlay — renders on top of everything */}
        <PlayOverlay />

        {/* Guided Tour — auto-starts on first visit, re-trigger via ? key */}
        <CanvaTour />

        {/* Command Palette (Cmd+K / Ctrl+K) — available from anywhere */}
        <CommandPalette open={commandPalette.open} onClose={commandPalette.closePalette} />
      </div>
    </MobileGuard>
  );
}
