// ═══════════════════════════════════════════════════════════════════
// MUTATION NOTIFIER — Lightweight dirty store notification
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.2A: Extracted from save-utils.ts to keep it importable
// in test environments where heavy dependencies (sonner, offline-sync)
// are not available.
//
// Every Canva Store mutation that modifies project data MUST call
// this function to increment editRevision and set dirty=true.
// Without it, auto-save won't trigger and data exists only in memory.
// ═══════════════════════════════════════════════════════════════════

import { useDirtyStore } from '@/store/dirty-store';

/**
 * Notify the dirty store that a project mutation occurred.
 * Increments editRevision and sets dirty=true, which triggers
 * auto-save scheduling via the useAutoSave subscription.
 *
 * SSR-safe: wrapped in try/catch for environments where the
 * store may not be initialized.
 */
export function notifyMutation(): void {
  try {
    useDirtyStore.getState().markDirty();
  } catch { /* SSR guard — store may not be initialized during SSR */ }
}
