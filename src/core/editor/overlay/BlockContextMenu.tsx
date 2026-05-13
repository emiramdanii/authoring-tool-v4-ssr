// ═══════════════════════════════════════════════════════════════════
// BLOCK CONTEXT MENU — Right-click context menu for schema blocks
// ═══════════════════════════════════════════════════════════════════
// Appears when a user right-clicks a selected block on the canvas.
// Provides common actions: edit, copy, paste, reorder, duplicate,
// move to page, variant switch, AI generate, and delete.
// Closes on click outside, Escape key, or after an action is performed.

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
// NOTE: Import from BlockDefinitionRegistry (NOT SceneRegistry) to break
// the circular dependency: SceneRegistry → renderers → SchemaRenderer → BlockSelectionOverlay → SceneRegistry
import { getBlockMeta } from '@/core/registry/BlockDefinitionRegistry';
import { createFocusTrap } from '@/lib/a11y';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface BlockContextMenuProps {
  blockId: string;
  blockType: string;
  x: number;
  y: number;
  onClose: () => void;
}

type MenuItem =
  | { type: 'header'; label: string }
  | { type: 'divider' }
  | { type: 'item'; label: string; shortcut?: string; danger?: boolean; accent?: boolean; action: () => void }
  | { type: 'submenu'; label: string; items: Array<{ label: string; action: () => void }> };

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function BlockContextMenu({ blockId, blockType, x, y, onClose }: BlockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });
  const focusTrapRef = useRef<ReturnType<typeof createFocusTrap> | null>(null);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

  const deleteBlock = useCanvaStore(s => s.deleteBlock);
  const duplicateBlock = useCanvaStore(s => s.duplicateBlock);
  const moveBlockUp = useCanvaStore(s => s.moveBlockUp);
  const moveBlockDown = useCanvaStore(s => s.moveBlockDown);
  const copySchemaBlock = useCanvaStore(s => s.copySchemaBlock);
  const pasteSchemaBlock = useCanvaStore(s => s.pasteSchemaBlock);
  const startEditing = useCanvaStore(s => s.startEditing);
  const stopEditing = useCanvaStore(s => s.stopEditing);
  const editingBlockId = useCanvaStore(s => s.editingBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const deleteSchemaBlocks = useCanvaStore(s => s.deleteSchemaBlocks);
  const moveBlockToPage = useCanvaStore(s => s.moveBlockToPage);
  const updateSchemaBlock = useCanvaStore(s => s.updateSchemaBlock);
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);

  const definition = getBlockMeta(blockType);
  const isEditing = editingBlockId === blockId;
  const isMultiSelect = selectedBlockIds.length > 1;

  // Pages to move to
  const otherPages = pages
    .map((p, i) => ({ label: p.label, index: i }))
    .filter(p => p.index !== currentPageIndex);

  // ── Viewport-aware positioning ────────────────────────────────
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (rect.right > vw) adjustedX = Math.max(0, x - rect.width);
    if (rect.bottom > vh) adjustedY = Math.max(0, y - rect.height);

    if (adjustedX !== x || adjustedY !== y) {
      setAdjustedPos({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // ── Focus trap: contain Tab within context menu while open ────
  useEffect(() => {
    if (!menuRef.current) return;
    const trap = createFocusTrap(menuRef.current);
    focusTrapRef.current = trap;
    trap.activate();
    return () => {
      trap.deactivate();
      focusTrapRef.current = null;
    };
  }, []);

  // ── Close on click outside or Escape ──────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // ── Action helper ─────────────────────────────────────────────
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  // ── Menu items ────────────────────────────────────────────────
  const items: MenuItem[] = [
    // Block info header
    { type: 'header', label: `${definition?.icon || '📦'} ${definition?.name || blockType}` },
    { type: 'divider' },
    // Edit actions
    ...(isEditing
      ? [{ type: 'item' as const, label: 'Selesai Edit', shortcut: 'Esc', action: () => handleAction(() => stopEditing()) }]
      : [{ type: 'item' as const, label: 'Edit Inline', shortcut: '⌨ 2x Klik', action: () => handleAction(() => startEditing(blockId)) }]
    ),
    { type: 'divider' },
    // Clipboard
    { type: 'item', label: 'Salin', shortcut: 'Ctrl+C', action: () => handleAction(() => copySchemaBlock(blockId)) },
    { type: 'item', label: 'Tempel', shortcut: 'Ctrl+V', action: () => handleAction(() => pasteSchemaBlock()) },
    { type: 'divider' },
    // Order
    { type: 'item', label: 'Pindah Atas', shortcut: 'Alt+↑', action: () => handleAction(() => moveBlockUp(blockId)) },
    { type: 'item', label: 'Pindah Bawah', shortcut: 'Alt+↓', action: () => handleAction(() => moveBlockDown(blockId)) },
    { type: 'item', label: 'Duplikat', shortcut: 'Ctrl+D', action: () => handleAction(() => duplicateBlock(blockId)) },
    { type: 'divider' },
    // Variant submenu — only show when block has > 1 variant (no point switching if only A)
    ...(definition && definition.capabilities.variants.length > 1
      ? [{
          type: 'submenu' as const,
          label: 'Ganti Varian',
          items: definition.capabilities.variants.map((v) => ({
            label: v === 'A' ? '🟢 Varian A — Default' : v === 'B' ? '🔵 Varian B — Compact' : '🟣 Varian C — Expanded',
            action: () => handleAction(() => updateSchemaBlock(blockId, { variant: v })),
          })),
        }]
      : []),
    // Move to page submenu
    ...(otherPages.length > 0
      ? [{
          type: 'submenu' as const,
          label: 'Pindah ke Halaman',
          items: otherPages.map(p => ({
            label: `${p.index + 1}. ${p.label}`,
            action: () => handleAction(() => moveBlockToPage(blockId, p.index)),
          })),
        }]
      : []),
    { type: 'divider' },
    // AI generate
    {
      type: 'item',
      label: '🤖 AI Generate Konten',
      accent: true,
      action: () => {
        useCanvaStore.getState().selectBlock(blockId, blockType);
        window.dispatchEvent(new CustomEvent('open-ai-assistant'));
        onClose();
      },
    },
    { type: 'divider' },
    // Delete — use bulk delete for multi-select
    {
      type: 'item',
      label: isMultiSelect ? `Hapus ${selectedBlockIds.length} Block` : 'Hapus Block',
      shortcut: 'Del',
      danger: true,
      action: () => handleAction(() => {
        if (isMultiSelect) {
          deleteSchemaBlocks(selectedBlockIds);
        } else {
          deleteBlock(blockId);
        }
      }),
    },
  ];

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Menu konteks: ${definition?.name || blockType}`}
      className="fixed z-[100] min-w-[220px] rounded-xl glass-panel-strong border border-app-border-strong shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      {items.map((item, i) => {
        if (item.type === 'header') {
          return (
            <div key={i} className="px-3 py-2 bg-blue-500/10 border-b border-blue-500/20">
              <span className="text-[10px] font-bold text-blue-300">{item.label}</span>
            </div>
          );
        }
        if (item.type === 'divider') {
          return <div key={i} className="h-px bg-app-elevated mx-2" />;
        }
        if (item.type === 'submenu') {
          const isExpanded = expandedSubmenu === item.label;
          return (
            <div key={i}>
              <button
                role="menuitem"
                onClick={() => setExpandedSubmenu(isExpanded ? null : item.label)}
                className="w-full px-3 py-2 flex items-center justify-between text-left text-app-secondary hover:bg-app-accent/10 transition-colors"
              >
                <span className="text-[11px] font-medium">{item.label}</span>
                <span className="text-[9px] text-app-muted">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="bg-app-elevated/30 pl-4">
                  {item.items.map((sub, j) => (
                    <button
                      key={j}
                      role="menuitem"
                      onClick={sub.action}
                      className="w-full px-3 py-1.5 text-left text-app-secondary hover:bg-app-accent/10 transition-colors"
                    >
                      <span className="text-[10px]">{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }
        // Regular item
        return (
          <button
            key={i}
            role="menuitem"
            onClick={item.action}
            className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${
              item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : item.accent
                  ? 'text-amber-300 hover:bg-amber-500/10'
                  : 'text-app-secondary hover:bg-app-accent/10'
            }`}
          >
            <span className="text-[11px] font-medium">{item.label}</span>
            {item.shortcut && (
              <span className="text-[9px] text-app-muted ml-4">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
