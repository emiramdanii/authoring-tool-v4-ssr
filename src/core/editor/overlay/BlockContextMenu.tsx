// ═══════════════════════════════════════════════════════════════════
// BLOCK CONTEXT MENU — Right-click context menu for schema blocks
// ═══════════════════════════════════════════════════════════════════
// Appears when a user right-clicks a selected block on the canvas.
// Provides common actions: edit, copy, paste, reorder, duplicate, delete.
// Closes on click outside, Escape key, or after an action is performed.

'use client';

import React, { useEffect, useRef } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';

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
  | { type: 'item'; label: string; shortcut?: string; danger?: boolean; action: () => void };

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function BlockContextMenu({ blockId, blockType, x, y, onClose }: BlockContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = React.useState({ x, y });

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

  const definition = getBlockDefinition(blockType);
  const isEditing = editingBlockId === blockId;
  const isMultiSelect = selectedBlockIds.length > 1;

  // ── Viewport-aware positioning ────────────────────────────────
  // Adjust menu position if it would overflow the viewport
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
    // Use setTimeout to avoid the current right-click from closing it
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
      className="fixed z-[100] min-w-[200px] rounded-xl glass-panel-strong border border-app-border-strong shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
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
        return (
          <button
            key={i}
            onClick={item.action}
            className={`w-full px-3 py-2 flex items-center justify-between text-left transition-colors ${
              item.danger
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-app-secondary hover:bg-app-elevated'
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
