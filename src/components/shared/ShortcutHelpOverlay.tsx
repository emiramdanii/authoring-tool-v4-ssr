'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { shortcutRegistry } from '@/core/shortcuts/ShortcutRegistry';
import type { ShortcutDefinition } from '@/core/shortcuts/ShortcutRegistry';
import { Keyboard, X } from 'lucide-react';

/**
 * ShortcutHelpOverlay — Shows all registered keyboard shortcuts.
 * Toggle with Ctrl+/ (or Cmd+/).
 * Displays shortcuts grouped by category with key badges.
 */
export function ShortcutHelpOverlay() {
  const [open, setOpen] = useState(false);
  // Derive shortcuts from registry when overlay opens
  const shortcuts = useMemo(() => {
    if (!open) return [];
    return shortcutRegistry.getAll();
  }, [open]);

  // Toggle with Ctrl+/
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      setOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  // Group by category
  const groups = new Map<string, ShortcutDefinition[]>();
  for (const s of shortcuts) {
    const cat = s.category || s.scope;
    const existing = groups.get(cat) || [];
    existing.push(s);
    groups.set(cat, existing);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-app-overlay backdrop-blur-sm" style={{ zIndex: 9999 }}
      onClick={() => setOpen(false)}
    >
      <div
        className="glass-panel-strong rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-app-accent" />
            <h2 className="text-sm font-bold text-app-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-app-elevated text-app-muted hover:text-app-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {Array.from(groups.entries()).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {items.map(shortcut => (
                  <div key={shortcut.id} className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-app-secondary">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.split('+').map((key, i) => (
                        <span key={i}>
                          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-app-elevated text-app-primary border border-app-border">
                            {key === 'ctrl' ? '⌘' : key === 'shift' ? '⇧' : key === 'alt' ? '⌥' : key === 'arrowup' ? '↑' : key === 'arrowdown' ? '↓' : key === 'arrowleft' ? '←' : key === 'arrowright' ? '→' : key === 'escape' ? 'Esc' : key === 'delete' ? 'Del' : key.toUpperCase()}
                          </kbd>
                          {i < shortcut.keys.split('+').length - 1 && (
                            <span className="text-[8px] text-app-muted mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-app-border">
          <p className="text-[9px] text-app-muted text-center">
            Press <kbd className="px-1 py-0.5 rounded text-[8px] font-mono bg-app-elevated border border-app-border">Ctrl+/</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
