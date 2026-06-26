// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// CANVA SHORTCUT DEPS — Dependency injection interface
// ═══════════════════════════════════════════════════════════════════
// Dependencies required by canva keyboard shortcuts.
// Injected at registration time to keep shortcut definitions
// decoupled from store implementations and testable in isolation.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaState } from '@/store/canva-store';

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
