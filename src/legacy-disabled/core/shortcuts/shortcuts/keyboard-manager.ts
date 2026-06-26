// @ts-nocheck — BATCH-12-03: quarantined to src/legacy-disabled/, not type-checked
// ═══════════════════════════════════════════════════════════════════
// KEYBOARD MANAGER — Unified keyboard shortcut dispatch
// ═══════════════════════════════════════════════════════════════════
// Single global `keydown` listener on `window` that delegates to the
// ShortcutRegistry. Components register shortcuts via the registry
// and this manager ensures only ONE keydown listener exists for the
// entire app (replacing the 3+ separate listeners that existed before).
//
// Architecture:
//   keyboard-manager.ts  →  global keydown listener, calls registry.processEvent()
//   ShortcutRegistry.ts  →  scope-based matching, priority resolution
//   useKeyboardShortcuts →  React hook for registering/unregistering shortcuts
// ═══════════════════════════════════════════════════════════════════

import { shortcutRegistry } from './ShortcutRegistry';
import type { ShortcutScope } from './ShortcutRegistry';

class KeyboardManager {
  private activeContext: ShortcutScope = 'global';
  private attached = false;

  /** Attach the global keydown listener (idempotent). */
  attach(): void {
    if (this.attached) return;
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown);
    this.attached = true;
  }

  /** Detach the global keydown listener. */
  detach(): void {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    this.attached = false;
  }

  /** Set the active context — updates which scope shortcuts are active. */
  setContext(context: ShortcutScope): void {
    this.activeContext = context;
    // Derive active scopes from context:
    // - 'global' → only global shortcuts
    // - 'canvas' → canvas + global
    // - 'authoring' → authoring + global
    // - 'modal' → modal + global
    const scopes: ShortcutScope[] = ['global'];
    if (context !== 'global') {
      scopes.push(context);
    }
    shortcutRegistry.setActiveScopes(scopes);
  }

  /** Get the current active context. */
  getContext(): ShortcutScope {
    return this.activeContext;
  }

  /** The single global keydown handler. */
  private handleKeyDown = (e: KeyboardEvent): void => {
    // Delegate to the registry — it handles scope matching, priority,
    // input element detection, and preventDefault logic.
    shortcutRegistry.processEvent(e);
  };
}

// ── Singleton ──────────────────────────────────────────────────────
export const keyboardManager = new KeyboardManager();

// Auto-attach on first import (client-side only)
if (typeof window !== 'undefined') {
  keyboardManager.attach();
}
