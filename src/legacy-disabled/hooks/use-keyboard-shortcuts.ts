// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// USE KEYBOARD SHORTCUTS — React hook for registering shortcuts
// ═══════════════════════════════════════════════════════════════════
// Registers shortcuts with the ShortcutRegistry on mount and
// unregisters them on unmount. Ensures the global KeyboardManager
// listener is attached.
//
// Usage:
//   useKeyboardShortcuts([
//     {
//       id: 'canvas.undo',
//       keys: 'ctrl+z',
//       scope: 'canvas',
//       priority: 10,
//       handler: () => undo(),
//       description: 'Undo',
//       category: 'History',
//     },
//   ]);
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';
import { shortcutRegistry } from '@/core/shortcuts/ShortcutRegistry';
import { keyboardManager } from '@/core/shortcuts/keyboard-manager';
import type { ShortcutDefinition } from '@/core/shortcuts/ShortcutRegistry';

/**
 * Register keyboard shortcuts that auto-cleanup on unmount.
 *
 * @param shortcuts - Array of shortcut definitions to register
 * @param deps - Optional dependency array (like useEffect). When deps change,
 *               shortcuts are re-registered. Pass an empty array to register once.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutDefinition[],
  deps?: React.DependencyList,
): void {
  // Use a ref to track registered IDs for cleanup
  const registeredIds = useRef<string[]>([]);

  useEffect(() => {
    // Ensure the global keyboard manager is attached
    keyboardManager.attach();

    // Register all shortcuts
    const ids: string[] = [];
    for (const def of shortcuts) {
      shortcutRegistry.register(def);
      ids.push(def.id);
    }
    registeredIds.current = ids;

    // Cleanup: unregister all shortcuts registered in this effect
    return () => {
      for (const id of ids) {
        shortcutRegistry.unregister(id);
      }
    };
  }, deps ?? []); // eslint-disable-line react-hooks/exhaustive-deps
}
