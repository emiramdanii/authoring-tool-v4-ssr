// ═══════════════════════════════════════════════════════════════════
// DIRTY STORE — Standalone dirty flag for unsaved changes tracking
// ═══════════════════════════════════════════════════════════════════
// Phase 5: Extracted from useAuthoringStore to break the coupling
// between UI state and content data.
//
// Previously, `dirty` was inside AuthoringStore's system-slice,
// bundled with content writes like:
//   setState({ dirty: true, kuis: newKuis })
//
// Now it's a standalone store so that:
//   1. UI components (StatusBar, StatusToast, etc.) don't need to
//      import AuthoringStore just to check dirty state
//   2. CanvaStore and AuthoringStore both mark dirty without
//      cross-store dependencies
//   3. save-utils.ts has a single source for dirty status
//
// Migration path:
//   OLD: useAuthoringStore(s => s.dirty)
//   NEW: useDirtyStore(s => s.dirty)
//
//   OLD: useAuthoringStore.setState({ dirty: true, ...content })
//   NEW: useDirtyStore.getState().markDirty();
//        useAuthoringStore.setState({ ...content })  // dirty separated
// ═══════════════════════════════════════════════════════════════════

import { create } from 'zustand';

interface DirtyState {
  /** Whether the project has unsaved changes */
  dirty: boolean;
  /** Mark the project as having unsaved changes */
  markDirty: () => void;
  /** Mark the project as saved (no unsaved changes) */
  markClean: () => void;
}

export const useDirtyStore = create<DirtyState>((set) => ({
  dirty: false,

  markDirty: () => set({ dirty: true }),

  markClean: () => set({ dirty: false }),
}));
