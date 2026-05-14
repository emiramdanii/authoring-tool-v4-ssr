'use client';

import { useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';

/**
 * Minimal keyboard handler for the Stage component.
 *
 * ARCHITECTURE NOTE:
 *   All keyboard shortcuts have been CONSOLIDATED into CanvaBuilder's
 *   ShortcutRegistry (priority-based routing). This hook only handles
 *   the ONE case the registry cannot: Escape from contentEditable
 *   inline editing (the registry skips contentEditable inputs).
 *
 *   Previously, this hook was a full parallel keyboard system that
 *   duplicated many shortcuts already in the registry, causing
 *   double-firing bugs. All those handlers have been migrated to
 *   CanvaBuilder.tsx with priority-based routing:
 *     - Schema block shortcuts: priority 15 (highest)
 *     - Legacy element shortcuts: priority 5-8 (fallback)
 *
 *   If you need to add a keyboard shortcut, add it to CanvaBuilder's
 *   useKeyboardShortcuts() hook — NOT here.
 */
export function useStageKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Escape from contentEditable inline editing.
      // The ShortcutRegistry skips contentEditable elements (except Escape),
      // so we need to handle the blur + stopEditing here.
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (target.contentEditable === 'true') {
          e.preventDefault();
          const store = useCanvaStore.getState();
          store.stopEditing();
          target.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
