// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT REGISTRY — Centralized shortcut management
// ═══════════════════════════════════════════════════════════════════
// Provides a single source of truth for all keyboard shortcuts
// across the app. Supports:
//
//   - Scoped shortcuts (canvas, authoring, global)
//   - Priority-based conflict resolution
//   - Runtime registration/deregistration
//   - Metadata for help overlay / shortcut cheatsheet
//   - Type-safe key combinations
//
// Usage:
//   const registry = ShortcutRegistry.getInstance();
//   registry.register({
//     id: 'canvas.undo',
//     keys: 'ctrl+z',
//     scope: 'canvas',
//     priority: 10,
//     handler: () => undo(),
//     description: 'Undo',
//   });
// ═══════════════════════════════════════════════════════════════════

export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta';
export type ShortcutScope = 'global' | 'canvas' | 'authoring' | 'modal';

export interface ShortcutDefinition {
  /** Unique identifier (e.g. 'canvas.undo', 'global.save') */
  id: string;
  /** Key combination (e.g. 'ctrl+z', 'shift+arrowup', 'escape') */
  keys: string;
  /** Scope where this shortcut is active */
  scope: ShortcutScope;
  /** Higher priority wins when shortcuts conflict (default: 0) */
  priority?: number;
  /** The action to execute */
  handler: (e: KeyboardEvent) => void;
  /** Human-readable description for help overlay */
  description: string;
  /** Category for grouping in help overlay */
  category?: string;
  /** Whether this shortcut is currently enabled */
  enabled?: boolean;
}

interface ParsedKeys {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

// ── Key Parser ────────────────────────────────────────────────────

function parseKeys(keys: string): ParsedKeys {
  const parts = keys.toLowerCase().split('+').map(p => p.trim());
  return {
    key: parts.find(p => !['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(p)) || '',
    ctrl: parts.includes('ctrl') || parts.includes('cmd'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
}

function eventMatchesKeys(e: KeyboardEvent, parsed: ParsedKeys): boolean {
  const eventKey = e.key.toLowerCase();
  const targetKey = parsed.key.toLowerCase();

  // Handle special key names
  const keyMap: Record<string, string[]> = {
    'escape': ['escape', 'esc'],
    'delete': ['delete', 'del'],
    'backspace': ['backspace'],
    'arrowup': ['arrowup'],
    'arrowdown': ['arrowdown'],
    'arrowleft': ['arrowleft'],
    'arrowright': ['arrowright'],
    'enter': ['enter'],
    'space': [' ', 'space'],
    'tab': ['tab'],
  };

  const matches = keyMap[targetKey]?.includes(eventKey) ?? eventKey === targetKey;

  return (
    matches &&
    e.ctrlKey === parsed.ctrl &&
    e.shiftKey === parsed.shift &&
    e.altKey === parsed.alt &&
    e.metaKey === parsed.meta
  );
}

// ── Registry Class ────────────────────────────────────────────────

class ShortcutRegistry {
  private static instance: ShortcutRegistry;
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private activeScopes: Set<ShortcutScope> = new Set(['global']);

  private constructor() {}

  static getInstance(): ShortcutRegistry {
    if (!ShortcutRegistry.instance) {
      ShortcutRegistry.instance = new ShortcutRegistry();
    }
    return ShortcutRegistry.instance;
  }

  /** Register a shortcut. Overwrites if ID already exists. */
  register(definition: ShortcutDefinition): void {
    this.shortcuts.set(definition.id, {
      ...definition,
      priority: definition.priority ?? 0,
      enabled: definition.enabled ?? true,
    });
  }

  /** Unregister a shortcut by ID. */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /** Update a shortcut's handler or enabled state. */
  update(id: string, updates: Partial<Pick<ShortcutDefinition, 'handler' | 'enabled' | 'description'>>): void {
    const existing = this.shortcuts.get(id);
    if (existing) {
      this.shortcuts.set(id, { ...existing, ...updates });
    }
  }

  /** Set which scopes are currently active. */
  setActiveScopes(scopes: ShortcutScope[]): void {
    this.activeScopes = new Set(scopes);
    // 'global' is always active
    this.activeScopes.add('global');
  }

  /** Get all registered shortcuts (for help overlay). */
  getAll(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  /** Get shortcuts filtered by scope. */
  getByScope(scope: ShortcutScope): ShortcutDefinition[] {
    return this.getAll().filter(s => s.scope === scope);
  }

  /** Get shortcuts grouped by category. */
  getByCategory(): Map<string, ShortcutDefinition[]> {
    const groups = new Map<string, ShortcutDefinition[]>();
    for (const shortcut of this.shortcuts.values()) {
      const cat = shortcut.category || shortcut.scope;
      const existing = groups.get(cat) || [];
      existing.push(shortcut);
      groups.set(cat, existing);
    }
    return groups;
  }

  /**
   * Process a keyboard event against registered shortcuts.
   * Returns true if a shortcut was executed (to prevent default).
   */
  processEvent(e: KeyboardEvent): boolean {
    // Don't intercept when typing in inputs (unless it's Escape)
    const target = e.target as HTMLElement;
    const isInputFocused = target.contentEditable === 'true' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA';

    // Collect matching shortcuts
    const matches: ShortcutDefinition[] = [];

    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue;
      if (!this.activeScopes.has(shortcut.scope)) continue;

      const parsed = parseKeys(shortcut.keys);

      // Allow Escape even in inputs
      if (isInputFocused && parsed.key !== 'escape') continue;

      if (eventMatchesKeys(e, parsed)) {
        matches.push(shortcut);
      }
    }

    if (matches.length === 0) return false;

    // Sort by priority (highest first) and execute the top match
    matches.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    matches[0].handler(e);
    return true;
  }

  /** Clear all registered shortcuts (useful for testing). */
  clear(): void {
    this.shortcuts.clear();
  }
}

// ── Singleton export ──────────────────────────────────────────────

export const shortcutRegistry = ShortcutRegistry.getInstance();

// ── React hook for registering shortcuts ──────────────────────────

/**
 * Hook to register keyboard shortcuts that auto-cleanup on unmount.
 *
 * Usage:
 *   useShortcut({
 *     id: 'canvas.undo',
 *     keys: 'ctrl+z',
 *     scope: 'canvas',
 *     handler: () => undo(),
 *     description: 'Undo last action',
 *     category: 'History',
 *   });
 */
export function useShortcutRegistration(shortcuts: ShortcutDefinition[]): void {
  // Note: This is designed to be called in a useEffect or at component level
  // The actual React hook wrapper would need 'use client' and useEffect
  // For now, we export the registration function for use in useEffect
  for (const def of shortcuts) {
    shortcutRegistry.register(def);
  }
}
