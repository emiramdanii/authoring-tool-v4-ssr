'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Hash,
  Play,
  Undo2,
  Redo2,
  Layout,
  Gamepad2,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize,
  PanelLeft,
  PanelRight,
  Trash2,
  Copy,
  Save,
  Home,
  FileText,
  MonitorPlay,
  Download,
  Printer,
  FileDown,
  Sparkles as AutoGenIcon,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { useInteractiveStore } from '@/store/interactive-store';
import { getAllBlockMeta, getBlockMeta } from '@/core/registry/BlockDefinitionRegistry';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: 'block' | 'game' | 'action' | 'navigation';
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY CONFIG
// ═══════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  block: {
    label: 'Block Konten',
    badge: 'Block',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  game: {
    label: 'Game Interaktif',
    badge: 'Game',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  action: {
    label: 'Aksi Editor',
    badge: 'Aksi',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  navigation: {
    label: 'Navigasi',
    badge: 'Navigasi',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
} as const;

type CommandCategory = keyof typeof CATEGORY_CONFIG;

// ═══════════════════════════════════════════════════════════════════
// ICON MAPPING FOR BLOCK TYPES
// ═══════════════════════════════════════════════════════════════════

function getBlockIcon(blockType: string, blockIcon: string): React.ReactNode {
  // Map known game types to Gamepad2 icon
  const gameTypes = [
    'sortir-game', 'roda-game', 'memory-game', 'matching-game',
    'fill-blank-game', 'word-search-game', 'true-false-game',
    'drag-drop-game', 'crossword-game', 'team-buzzer-game',
  ];
  if (gameTypes.includes(blockType)) {
    return <Gamepad2 size={16} className="text-emerald-400" />;
  }

  // Return emoji as text for known content blocks
  // The blockIcon is an emoji string, so render it directly
  return <span className="text-sm leading-none">{blockIcon}</span>;
}

// ═══════════════════════════════════════════════════════════════════
// FUZZY SEARCH
// ═══════════════════════════════════════════════════════════════════

function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact match gets highest score
  if (t === q) return 1000;

  // Starts with query gets high score
  if (t.startsWith(q)) return 500;

  // Contains query as substring
  const idx = t.indexOf(q);
  if (idx !== -1) return 300 - idx;

  // Fuzzy match — count how many chars matched in order
  let qi = 0;
  let lastMatchIdx = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      lastMatchIdx = ti;
    }
  }
  if (qi === q.length) return 100 - lastMatchIdx;

  return 0;
}

// ═══════════════════════════════════════════════════════════════════
// GLOBAL EVENT — allows any component to open the command palette
// ═══════════════════════════════════════════════════════════════════

const COMMAND_PALETTE_OPEN_EVENT = 'mpi:open-command-palette';

export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
  }
}

// ═══════════════════════════════════════════════════════════════════
// RECENTLY USED PERSISTENCE
// ═══════════════════════════════════════════════════════════════════

const RECENT_KEY = 'mpi-command-palette-recent';
const MAX_RECENT = 8;

function getRecentItems(): string[] {
  try {
    const data = localStorage.getItem(RECENT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function addRecentItem(id: string) {
  try {
    const recent = getRecentItems().filter(r => r !== id);
    recent.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // Ignore storage errors
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMMAND PALETTE COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Build command items ────────────────────────────────────
  const allCommands = useMemo(() => {
    const commands: CommandItem[] = [];
    const blockMetas = getAllBlockMeta();
    const store = useCanvaStore.getState();
    const authStore = useAuthoringStore.getState();

    // ── Block commands (content blocks) ──────────────────────
    const gameTypes = new Set([
      'sortir-game', 'roda-game', 'memory-game', 'matching-game',
      'fill-blank-game', 'word-search-game', 'true-false-game',
      'drag-drop-game', 'crossword-game', 'team-buzzer-game',
    ]);

    // Compute insertion context from selected block
    const selectedBlockId = store.selectedBlockId;
    let insertAfterIndex: number | undefined;
    let selectedBlockName: string | null = null;
    if (selectedBlockId) {
      const currentPage = store.pages[store.currentPageIndex];
      if (currentPage) {
        const schema = ensurePageSchema(currentPage);
        if (schema) {
          const idx = schema.blocks.findIndex(b => b.id === selectedBlockId);
          if (idx !== -1) {
            insertAfterIndex = idx;
            const meta = getBlockMeta(schema.blocks[idx].type);
            selectedBlockName = meta?.name || schema.blocks[idx].type;
          }
        }
      }
    }

    for (const meta of blockMetas) {
      const isGame = gameTypes.has(meta.type) || meta.category === 'interactive';
      const category: CommandCategory = isGame ? 'game' : 'block';

      // Add insertion hint to description when a block is selected
      const descSuffix = selectedBlockName
        ? ` (sisipkan setelah ${selectedBlockName})`
        : '';

      commands.push({
        id: `add-block-${meta.type}`,
        label: meta.name,
        description: meta.description + descSuffix,
        icon: getBlockIcon(meta.type, meta.icon),
        category,
        action: () => {
          useCanvaStore.getState().addSchemaBlock(meta.type, insertAfterIndex);
        },
      });
    }

    // ── Editor action commands ───────────────────────────────
    commands.push(
      {
        id: 'action-undo',
        label: 'Undo',
        description: 'Batalkan aksi terakhir',
        icon: <Undo2 size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl+Z',
        action: () => useCanvaStore.getState().undo(),
      },
      {
        id: 'action-redo',
        label: 'Redo',
        description: 'Ulangi aksi yang dibatalkan',
        icon: <Redo2 size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl+Y',
        action: () => useCanvaStore.getState().redo(),
      },
      {
        id: 'action-delete-block',
        label: 'Hapus Block Terpilih',
        description: 'Hapus block yang sedang dipilih',
        icon: <Trash2 size={16} className="text-red-400" />,
        category: 'action',
        shortcut: 'Delete',
        action: () => {
          const s = useCanvaStore.getState();
          if (s.selectedBlockId) s.deleteBlock(s.selectedBlockId);
          else if (s.selectedElId) s.deleteSelected();
        },
      },
      {
        id: 'action-duplicate-block',
        label: 'Duplikat Block Terpilih',
        description: 'Gandakan block yang sedang dipilih',
        icon: <Copy size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl+D',
        action: () => {
          const s = useCanvaStore.getState();
          if (s.selectedBlockId) s.duplicateBlock(s.selectedBlockId);
          else if (s.selectedElId) { s.copySelected(); s.pasteElements(); }
        },
      },
      {
        id: 'action-toggle-left-panel',
        label: 'Toggle Panel Kiri',
        description: 'Buka/tutup panel kiri',
        icon: <PanelLeft size={16} className="text-amber-400" />,
        category: 'action',
        action: () => useCanvaStore.getState().toggleLeftPanel(),
      },
      {
        id: 'action-toggle-right-panel',
        label: 'Toggle Panel Kanan',
        description: 'Buka/tutup panel kanan',
        icon: <PanelRight size={16} className="text-amber-400" />,
        category: 'action',
        action: () => useCanvaStore.getState().toggleRightPanel(),
      },
      {
        id: 'action-zoom-in',
        label: 'Zoom In',
        description: 'Perbesar tampilan canvas',
        icon: <ZoomIn size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl++',
        action: () => {
          const s = useCanvaStore.getState();
          if (s.zoom === -1) s.setZoom(1);
          else s.zoomDelta(0.1);
        },
      },
      {
        id: 'action-zoom-out',
        label: 'Zoom Out',
        description: 'Perkecil tampilan canvas',
        icon: <ZoomOut size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl+-',
        action: () => {
          const s = useCanvaStore.getState();
          if (s.zoom === -1) s.setZoom(0.8);
          else s.zoomDelta(-0.1);
        },
      },
      {
        id: 'action-zoom-reset',
        label: 'Zoom Fit ke Layar',
        description: 'Sesuaikan zoom agar muat di layar',
        icon: <Maximize size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl+0',
        action: () => useCanvaStore.getState().zoomToFit(),
      },
      {
        id: 'action-play-preview',
        label: 'Play Preview',
        description: 'Jalankan preview interaktif',
        icon: <Play size={16} className="text-emerald-400" />,
        category: 'action',
        action: () => useInteractiveStore.getState().openPlay(),
      },
      {
        id: 'action-export-html',
        label: 'Export HTML',
        description: 'Download file HTML interaktif',
        icon: <FileDown size={16} className="text-amber-400" />,
        category: 'action',
        action: () => {
          // Trigger export via dynamic import
          import('@/lib/use-vite-export').then(({ useViteExport }) => {
            // This is a hook, can't call dynamically — use alternative
          }).catch(() => {});
          toast.info('Gunakan tombol Export di toolbar untuk export HTML');
        },
      },
      {
        id: 'action-print',
        label: 'Cetak / Print',
        description: 'Cetak halaman MPI',
        icon: <Printer size={16} className="text-amber-400" />,
        category: 'action',
        action: () => window.print(),
      },
      {
        id: 'action-save-now',
        label: 'Simpan Sekarang',
        description: 'Simpan ke penyimpanan lokal',
        icon: <Save size={16} className="text-amber-400" />,
        category: 'action',
        shortcut: 'Ctrl+S',
        action: () => {
          useCanvaStore.getState().saveToStorage();
          useAuthoringStore.getState().saveToStorage();
          toast.success('Tersimpan');
        },
      },
    );

    // ── Navigation commands ──────────────────────────────────
    const pages = useCanvaStore.getState().pages;

    commands.push(
      {
        id: 'nav-dashboard',
        label: 'Buka Dashboard',
        description: 'Pilih preset, kelengkapan, quick actions',
        icon: <Home size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('dashboard'),
      },
      {
        id: 'nav-dokumen',
        label: 'Buka Dokumen',
        description: 'Edit CP, TP, ATP, Alur Pembelajaran',
        icon: <FileText size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('dokumen'),
      },
      {
        id: 'nav-konten',
        label: 'Buka Konten',
        description: 'Edit Kuis, Game, Materi, Skenario',
        icon: <BookOpen size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('konten'),
      },
      {
        id: 'nav-canva',
        label: 'Buka Canva Editor',
        description: 'Kembali ke editor visual',
        icon: <Layout size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('canva'),
      },
      {
        id: 'nav-autogen',
        label: 'Buka Auto-Generate',
        description: 'Generate konten otomatis dengan AI',
        icon: <AutoGenIcon size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('autogen'),
      },
      {
        id: 'nav-preview',
        label: 'Buka Live Preview',
        description: 'Preview tampilan siswa lengkap',
        icon: <MonitorPlay size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('preview'),
      },
      {
        id: 'nav-import',
        label: 'Buka Import/Export',
        description: 'Import Excel/JSON, Export HTML',
        icon: <Download size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useAuthoringStore.getState().setActivePanel('import'),
      },
    );

    // Dynamic page navigation
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      commands.push({
        id: `nav-page-${i}`,
        label: `Ke ${page.label || `Halaman ${i + 1}`}`,
        description: `Pergi ke halaman ${i + 1}`,
        icon: <Hash size={16} className="text-purple-400" />,
        category: 'navigation',
        action: () => useCanvaStore.getState().goPage(i),
      });
    }

    return commands;
  }, [open]); // Rebuild when palette opens to get fresh state

  // ── Filter and sort commands ───────────────────────────────
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;

    const results = allCommands
      .map(cmd => ({
        cmd,
        score: Math.max(
          fuzzyScore(query, cmd.label),
          cmd.description ? fuzzyScore(query, cmd.description) * 0.5 : 0,
        ),
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.cmd);

    return results;
  }, [query, allCommands]);

  // ── Group commands by category ─────────────────────────────
  const groupedCommands = useMemo(() => {
    // Show recently used at top when no query
    const recentIds = query.trim() ? [] : getRecentItems();
    const recentItems = recentIds
      .map(id => allCommands.find(c => c.id === id))
      .filter(Boolean) as CommandItem[];

    // Group by category in display order
    const categoryOrder: CommandCategory[] = ['block', 'game', 'action', 'navigation'];
    const groups: { category: CommandCategory | 'recent'; items: CommandItem[] }[] = [];

    // Add recent group if any
    if (recentItems.length > 0) {
      groups.push({ category: 'recent', items: recentItems });
    }

    for (const cat of categoryOrder) {
      const items = filteredCommands.filter(c => c.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }

    return groups;
  }, [filteredCommands, allCommands, query]);

  // ── Flat list for keyboard navigation ──────────────────────
  const flatItems = useMemo(() => {
    return groupedCommands.flatMap(g => g.items);
  }, [groupedCommands]);

  // ── Reset on open ──────────────────────────────────────────
  // When the palette opens, reset search and selection state.
  // Using requestAnimationFrame to avoid the set-state-in-effect lint rule
  // while still ensuring the reset happens before the user interacts.
  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [open]);

  // ── Clamp selected index (derived, no effect) ───────────────
  const clampedSelectedIndex = selectedIndex >= flatItems.length
    ? Math.max(0, flatItems.length - 1)
    : selectedIndex;

  // ── Scroll selected item into view ─────────────────────────
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-command-index="${clampedSelectedIndex}"]`);
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [clampedSelectedIndex]);

  // ── Execute command ────────────────────────────────────────
  const executeCommand = useCallback((cmd: CommandItem) => {
    addRecentItem(cmd.id);
    cmd.action();
    onClose();
  }, [onClose]);

  // ── Keyboard handler ───────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % Math.max(1, flatItems.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + flatItems.length) % Math.max(1, flatItems.length));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[clampedSelectedIndex]) {
          executeCommand(flatItems[clampedSelectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatItems, clampedSelectedIndex, executeCommand, onClose]);

  // ── Don't render if not open ───────────────────────────────
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className={cn(
          'relative w-full max-w-[520px] rounded-xl border border-app-border shadow-2xl overflow-hidden',
          'bg-app-surface/95 backdrop-blur-md',
          'animate-in fade-in zoom-in-95 duration-150',
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-app-border">
          <Search size={18} className="text-app-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Cari block, aksi, atau navigasi..."
            className="flex-1 bg-transparent text-sm text-app-primary placeholder:text-app-muted outline-none"
            aria-label="Cari perintah"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-app-muted bg-app-elevated rounded border border-app-border">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[420px] overflow-y-auto overscroll-contain py-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}
        >
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-app-muted">
              <Search size={24} className="mx-auto mb-2 opacity-30" />
              Tidak ditemukan untuk &ldquo;{query}&rdquo;
            </div>
          ) : (
            groupedCommands.map((group, groupIdx) => {
              // Find the starting index for this group in the flat list
              let startIdx = 0;
              for (let g = 0; g < groupIdx; g++) {
                startIdx += groupedCommands[g].items.length;
              }

              return (
                <div key={group.category} role="group" aria-label={group.category === 'recent' ? 'Terakhir Digunakan' : CATEGORY_CONFIG[group.category]?.label}>
                  {/* Group heading */}
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">
                      {group.category === 'recent' ? '⏱ Terakhir Digunakan' : CATEGORY_CONFIG[group.category]?.label}
                    </span>
                    {group.category !== 'recent' && (
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold border',
                        CATEGORY_CONFIG[group.category].badgeClass,
                      )}>
                        {CATEGORY_CONFIG[group.category].badge}
                      </span>
                    )}
                    <div className="flex-1 h-px bg-app-border/50" />
                  </div>

                  {/* Group items */}
                  {group.items.map((cmd, itemIdx) => {
                    const flatIdx = startIdx + itemIdx;
                    const isSelected = flatIdx === clampedSelectedIndex;

                    return (
                      <div
                        key={cmd.id}
                        data-command-index={flatIdx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(flatIdx)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-app-accent/15 text-app-accent'
                            : 'text-app-primary hover:bg-app-elevated',
                        )}
                      >
                        {/* Icon */}
                        <span className={cn(
                          'flex items-center justify-center w-7 h-7 rounded-md shrink-0',
                          isSelected ? 'bg-app-accent/20' : 'bg-app-elevated',
                        )}>
                          {cmd.icon}
                        </span>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className={cn(
                              'text-[10px] truncate',
                              isSelected ? 'text-app-accent/60' : 'text-app-muted',
                            )}>
                              {cmd.description}
                            </div>
                          )}
                        </div>

                        {/* Shortcut */}
                        {cmd.shortcut && (
                          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-app-muted bg-app-elevated rounded border border-app-border/50">
                            {cmd.shortcut}
                          </kbd>
                        )}

                        {/* Category badge (small, for visual distinction) */}
                        {group.category !== 'recent' && (
                          <span className={cn(
                            'shrink-0 inline-flex items-center px-1 py-0 rounded text-[8px] font-semibold border',
                            CATEGORY_CONFIG[cmd.category].badgeClass,
                          )}>
                            {CATEGORY_CONFIG[cmd.category].badge}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-app-border/50 text-[9px] text-app-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-app-elevated rounded border border-app-border/50 font-mono">↑↓</kbd>
            navigasi
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-app-elevated rounded border border-app-border/50 font-mono">↵</kbd>
            pilih
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-app-elevated rounded border border-app-border/50 font-mono">Esc</kbd>
            tutup
          </span>
          <span className="ml-auto opacity-60">
            {flatItems.length} perintah
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOOK: useCommandPalette
// ═══════════════════════════════════════════════════════════════════
// Manages the open/close state and Cmd+K keyboard shortcut.

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen(v => !v), []);
  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  // Register Cmd+K / Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to intercept before CanvaBuilder
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [toggle]);

  // Listen for custom open event (from Toolbar or other components)
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
  }, []);

  return { open, setOpen, toggle, openPalette, closePalette };
}
