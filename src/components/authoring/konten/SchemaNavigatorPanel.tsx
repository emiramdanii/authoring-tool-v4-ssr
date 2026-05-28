'use client';

// ═══════════════════════════════════════════════════════════════════
// SCHEMA NAVIGATOR PANEL — Enhanced tree view with inline editing
// ═══════════════════════════════════════════════════════════════════
// Phase 3 centerpiece: Shows a unified, cross-page tree of all schema
// blocks across all pages, enabling:
//
//   1. NAVIGATION: Click block → navigate to Konten tab + canvas page
//   2. INLINE EDITING: Double-click title → inline edit via applyGuidedSchemaPatch
//   3. QUICK ACTIONS: Delete, duplicate, move up/down per block
//   4. CATEGORY GROUPING: Toggle between page-grouped and category-grouped views
//   5. SEARCH: Filter blocks by title, type, or page label
//
// Architecture:
//   READ:  CanvaStore.pages[].schema.blocks → flat + nested tree
//   NAV:   kontenTabRequest + panelRequest + goPage() + selectBlock()
//   WRITE: applyGuidedSchemaPatch() for title edits
//          useCanvaStore.deleteBlock/duplicateBlock/moveBlockUp/moveBlockDown
//   NO useAuthoringStore — pure canva store for all operations
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractionStore } from '@/store/canva/interaction-store';
import { getPageBlocks } from '@/core/schema/ensure-schema';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '@/core/schema/capability-registry';
import { applyGuidedSchemaPatch } from '@/core/schema/guided-patch';
import { getKontenTabForBlockType } from '@/hooks/use-schema-navigator';
import type { SchemaBlock } from '@/core/schema/types';
import {
  ChevronRight,
  Zap,
  Layers,
  BookOpen,
  Search,
  FileText,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Pencil,
  LayoutGrid,
  List,
  Check,
  X,
} from 'lucide-react';

// ── Block Type Display Map ──────────────────────────────────────
// Same map as SchemaBlockTree — single source of truth for icons/labels/colors

const BLOCK_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  'cover':             { icon: '🏠', label: 'Cover',             color: '#f9c82e' },
  'hero':              { icon: '🚀', label: 'Hero',              color: '#fb923c' },
  'petunjuk':          { icon: '📌', label: 'Petunjuk',          color: '#3ecfcf' },
  'tp':                { icon: '🎯', label: 'Tujuan Pembelajaran', color: '#3ecfcf' },
  'alur':              { icon: '🗺️', label: 'Alur Pembelajaran', color: '#a78bfa' },
  'skenario':          { icon: '🎭', label: 'Skenario',          color: '#f472b6' },
  'materi-section':    { icon: '📚', label: 'Materi',           color: '#a78bfa' },
  'materi-blok':       { icon: '📝', label: 'Blok Materi',      color: '#a78bfa' },
  'def-box':           { icon: '📌', label: 'Definisi',          color: '#f9c82e' },
  'nc-grid':           { icon: '📊', label: 'Grid Konten',      color: '#3ecfcf' },
  'flashcard-set':     { icon: '🃏', label: 'Flashcard',        color: '#a78bfa' },
  'ftab':              { icon: '📑', label: 'Tab',              color: '#3ecfcf' },
  'nk-card':           { icon: '📖', label: 'Kartu',            color: '#a78bfa' },
  'diskusi':           { icon: '💬', label: 'Diskusi',           color: '#34d399' },
  'kuis':              { icon: '❓', label: 'Kuis',             color: '#f5c842' },
  'motivasi':          { icon: '💡', label: 'Motivasi',         color: '#fb923c' },
  'refleksi':          { icon: '🪞', label: 'Refleksi',         color: '#a78bfa' },
  'rangkuman':         { icon: '📋', label: 'Rangkuman',        color: '#3ecfcf' },
  'penutup':           { icon: '🎓', label: 'Penutup',          color: '#fb923c' },
  'hasil':             { icon: '🏆', label: 'Hasil',            color: '#34d399' },
  'tabel':             { icon: '📊', label: 'Tabel',            color: '#a78bfa' },
  'timeline':          { icon: '📅', label: 'Timeline',         color: '#3ecfcf' },
  'compare':           { icon: '⚖️', label: 'Perbandingan',     color: '#a78bfa' },
  'gambar':            { icon: '🖼️', label: 'Gambar',           color: '#fb923c' },
  'reveal':            { icon: '✨', label: 'Reveal',           color: '#f9c82e' },
  'checklist':         { icon: '✅', label: 'Checklist',        color: '#34d399' },
  'statistik':         { icon: '📈', label: 'Statistik',        color: '#fb923c' },
  'studi':             { icon: '📖', label: 'Studi Kasus',      color: '#f87171' },
  'tabel-accord':      { icon: '🗂️', label: 'Accordion',       color: '#a78bfa' },
  'tujuan-display':    { icon: '🎯', label: 'Tujuan',           color: '#3ecfcf' },
  'sortir-game':       { icon: '🔢', label: 'Game Sortir',      color: '#3ecfcf' },
  'roda-game':         { icon: '🎡', label: 'Roda Putar',       color: '#fb923c' },
  'memory-game':       { icon: '🧠', label: 'Memory',           color: '#a78bfa' },
  'matching-game':     { icon: '🔀', label: 'Pasangkan',        color: '#f9c82e' },
  'fill-blank-game':   { icon: '✏️', label: 'Isian',            color: '#34d399' },
  'word-search-game':  { icon: '🔍', label: 'Teka-Teki Kata',   color: '#60a5fa' },
  'true-false-game':   { icon: '✅', label: 'Benar/Salah',      color: '#34d399' },
  'drag-drop-game':    { icon: '🖐️', label: 'Seret & Letakkan', color: '#fb923c' },
  'crossword-game':    { icon: '🔤', label: 'Teka Silang',      color: '#a78bfa' },
  'team-buzzer-game':  { icon: '🏆', label: 'Kuis Tim',         color: '#f9c82e' },
};

function getBlockDisplay(type: string): { icon: string; label: string; color: string } {
  return BLOCK_DISPLAY[type] || { icon: '📦', label: type, color: '#71717a' };
}

// ── Get block title/label ──────────────────────────────────────

function getBlockTitle(block: SchemaBlock): string {
  const b = block as Record<string, unknown>;
  if (typeof b.title === 'string' && b.title) return b.title;
  if (typeof b.label === 'string' && b.label) return b.label;
  return getBlockDisplay(block.type).label;
}

// ── Get child blocks from a composite block ────────────────────

function getChildBlocks(block: SchemaBlock): SchemaBlock[] {
  const children: SchemaBlock[] = [];

  if (isCompositeBlockType(block.type)) {
    const descriptor = getCompositeContainerDescriptor(block.type);
    if (descriptor) {
      const b = block as Record<string, unknown>;
      if (descriptor.structure === 'direct') {
        const content = b[descriptor.accessor] as SchemaBlock[] | undefined;
        if (content) children.push(...content);
      }
      if (descriptor.structure === 'tabular' && descriptor.tabContentKey) {
        const tabs = b[descriptor.accessor] as Array<Record<string, unknown>> | undefined;
        for (const tab of (tabs || [])) {
          const content = tab[descriptor.tabContentKey!] as SchemaBlock[] | undefined;
          if (content) children.push(...content);
        }
      }
    }
  }

  if (block.children && Array.isArray(block.children)) {
    children.push(...block.children);
  }

  return children;
}

// ── Content category classification ────────────────────────────

type ContentCategory = 'struktur' | 'materi' | 'interaktif' | 'evaluasi' | 'refleksi';

function getContentCategory(blockType: string): ContentCategory {
  if (['cover', 'hero', 'petunjuk', 'tp', 'alur', 'tujuan-display'].includes(blockType)) return 'struktur';
  if (['materi-section', 'materi-blok', 'def-box', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card', 'tabel', 'timeline', 'compare', 'gambar', 'reveal', 'checklist', 'statistik', 'studi', 'tabel-accord'].includes(blockType)) return 'materi';
  if (['skenario', 'sortir-game', 'roda-game', 'memory-game', 'matching-game', 'fill-blank-game', 'word-search-game', 'true-false-game', 'drag-drop-game', 'crossword-game', 'team-buzzer-game'].includes(blockType)) return 'interaktif';
  if (['kuis'].includes(blockType)) return 'evaluasi';
  if (['diskusi', 'motivasi', 'refleksi', 'rangkuman', 'penutup', 'hasil'].includes(blockType)) return 'refleksi';
  return 'materi';
}

const CATEGORY_META: Record<ContentCategory, { icon: string; label: string; color: string }> = {
  'struktur':   { icon: '🏗️', label: 'Struktur',    color: '#3ecfcf' },
  'materi':     { icon: '📚', label: 'Materi',       color: '#a78bfa' },
  'interaktif': { icon: '🎮', label: 'Interaktif',   color: '#f9c82e' },
  'evaluasi':   { icon: '❓', label: 'Evaluasi',     color: '#f5c842' },
  'refleksi':   { icon: '🪞', label: 'Refleksi',     color: '#34d399' },
};

// ── View mode ──────────────────────────────────────────────────

type ViewMode = 'by-page' | 'by-category';

// ── Page Block Data ────────────────────────────────────────────

interface PageBlockData {
  pageId: string;
  pageIndex: number;
  pageLabel: string;
  templateType: string;
  blocks: SchemaBlock[];
}

// ── Category Group ─────────────────────────────────────────────

interface CategoryGroupData {
  category: ContentCategory;
  meta: typeof CATEGORY_META[ContentCategory];
  blocks: Array<{ block: SchemaBlock; pageId: string; pageIndex: number }>;
}

// ── Inline Title Editor ────────────────────────────────────────

function InlineTitleEditor({
  block,
  pageId,
  onSave,
  onCancel,
}: {
  block: SchemaBlock;
  pageId: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(getBlockTitle(block));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(title);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(title)}
        className="flex-1 min-w-0 bg-app-elevated border border-app-accent/30 rounded px-1.5 py-0.5 text-xs text-app-primary focus:outline-none focus:ring-1 focus:ring-app-accent/50"
      />
      <button
        onClick={() => onSave(title)}
        className="flex-shrink-0 text-app-success hover:text-app-success/80 p-0.5"
        title="Simpan"
      >
        <Check size={10} />
      </button>
      <button
        onClick={onCancel}
        className="flex-shrink-0 text-app-muted hover:text-app-danger p-0.5"
        title="Batal"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ── Block Row ──────────────────────────────────────────────────

interface BlockRowProps {
  block: SchemaBlock;
  pageId: string;
  pageIndex: number;
  depth: number;
  selectedBlockId: string | null;
  onNavigate: (pageIndex: number, pageId: string, blockId: string, blockType: string) => void;
}

function BlockRow({ block, pageId, pageIndex, depth, selectedBlockId, onNavigate }: BlockRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const children = getChildBlocks(block);
  const hasChildren = children.length > 0;
  const isSelected = selectedBlockId === block.id;
  const display = getBlockDisplay(block.type);
  const title = getBlockTitle(block);
  const kontenTab = getKontenTabForBlockType(block.type);
  const deleteBlock = useCanvaStore(s => s.deleteBlock);
  const duplicateBlock = useCanvaStore(s => s.duplicateBlock);
  const moveBlockUp = useCanvaStore(s => s.moveBlockUp);
  const moveBlockDown = useCanvaStore(s => s.moveBlockDown);

  const handleClick = useCallback(() => {
    if (hasChildren) {
      setExpanded(prev => !prev);
    }
    onNavigate(pageIndex, pageId, block.id || '', block.type);
  }, [hasChildren, pageIndex, pageId, block.id, block.type, onNavigate]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
  }, []);

  const handleTitleSave = useCallback((newTitle: string) => {
    if (newTitle.trim() && newTitle !== getBlockTitle(block)) {
      applyGuidedSchemaPatch({
        pageId,
        blockId: block.id || '',
        patch: { title: newTitle.trim() },
        source: 'user',
      });
    }
    setEditingTitle(false);
  }, [pageId, block]);

  const handleTitleCancel = useCallback(() => {
    setEditingTitle(false);
  }, []);

  return (
    <div>
      <div
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <button
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 group ${
            isSelected
              ? 'bg-app-accent/10 text-app-accent ring-1 ring-app-accent/20'
              : 'text-app-secondary hover:bg-app-elevated/60 hover:text-app-primary'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          title={`${title} — ${display.label}${kontenTab ? ` (Edit di tab ${kontenTab})` : ''}`}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <ChevronRight
              size={12}
              className={`flex-shrink-0 text-app-muted transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-3 flex-shrink-0" />
          )}

          {/* Block type icon with color dot */}
          <span className="text-sm flex-shrink-0">
            {display.icon}
          </span>

          {/* Block title — inline edit or display */}
          {editingTitle ? (
            <InlineTitleEditor
              block={block}
              pageId={pageId}
              onSave={handleTitleSave}
              onCancel={handleTitleCancel}
            />
          ) : (
            <span className="truncate flex-1 text-xs font-medium">{title}</span>
          )}

          {/* Quick actions — visible on hover */}
          {showActions && !editingTitle && (
            <div className="flex-shrink-0 flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
                className="p-0.5 rounded text-app-muted hover:text-app-primary hover:bg-app-elevated/80 transition-colors"
                title="Edit judul"
              >
                <Pencil size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveBlockUp(block.id || ''); }}
                className="p-0.5 rounded text-app-muted hover:text-app-primary hover:bg-app-elevated/80 transition-colors"
                title="Pindah ke atas"
              >
                <ArrowUp size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveBlockDown(block.id || ''); }}
                className="p-0.5 rounded text-app-muted hover:text-app-primary hover:bg-app-elevated/80 transition-colors"
                title="Pindah ke bawah"
              >
                <ArrowDown size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id || ''); }}
                className="p-0.5 rounded text-app-muted hover:text-app-accent hover:bg-app-elevated/80 transition-colors"
                title="Duplikat blok"
              >
                <Copy size={9} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteBlock(block.id || ''); }}
                className="p-0.5 rounded text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Hapus blok"
              >
                <Trash2 size={9} />
              </button>
            </div>
          )}

          {/* Type badge — hidden when actions visible */}
          {!showActions && (
            <span
              className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
              style={{
                backgroundColor: display.color + '18',
                color: display.color,
              }}
            >
              {display.label}
            </span>
          )}

          {/* Konten tab indicator */}
          {kontenTab && !showActions && (
            <span
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title={`Edit di tab ${kontenTab}`}
            >
              <FileText size={10} className="text-app-accent/60" />
            </span>
          )}

          {/* Schema indicator */}
          <Zap size={8} className="flex-shrink-0 text-app-success/30" />
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-0 bottom-0 border-l border-app-border/20"
            style={{ left: `${depth * 16 + 18}px` }}
          />
          {children.map((child, i) => (
            <BlockRow
              key={child.id || `${block.id}-child-${i}`}
              block={child}
              pageId={pageId}
              pageIndex={pageIndex}
              depth={depth + 1}
              selectedBlockId={selectedBlockId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page Section ───────────────────────────────────────────────

interface PageSectionProps {
  data: PageBlockData;
  isActive: boolean;
  selectedBlockId: string | null;
  onNavigate: (pageIndex: number, pageId: string, blockId: string, blockType: string) => void;
}

function PageSection({ data, isActive, selectedBlockId, onNavigate }: PageSectionProps) {
  const [expanded, setExpanded] = useState(isActive);
  const display = getBlockDisplay(data.templateType);

  return (
    <div className={`rounded-xl border transition-colors ${
      isActive
        ? 'border-app-accent/20 bg-app-accent/[0.03]'
        : 'border-app-border/50 bg-app-surface'
    }`}>
      {/* Page header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-t-xl transition-colors ${
          isActive ? 'bg-app-accent/[0.06]' : 'hover:bg-app-elevated/40'
        }`}
      >
        <ChevronRight
          size={14}
          className={`flex-shrink-0 text-app-muted transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
        />

        {/* Page type icon */}
        <span className="text-base flex-shrink-0">{display.icon}</span>

        {/* Page label */}
        <span className={`text-sm font-semibold truncate flex-1 ${
          isActive ? 'text-app-accent' : 'text-app-primary'
        }`}>
          {data.pageLabel}
        </span>

        {/* Page index badge */}
        <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-app-elevated text-app-muted">
          {data.pageIndex + 1}
        </span>

        {/* Block count badge */}
        <span
          className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: display.color + '18',
            color: display.color,
          }}
        >
          {data.blocks.length} block{data.blocks.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Block list */}
      {expanded && (
        <div className="px-1.5 pb-2 space-y-0.5 border-t border-app-border/30">
          {data.blocks.map((block, i) => (
            <BlockRow
              key={block.id || `block-${i}`}
              block={block}
              pageId={data.pageId}
              pageIndex={data.pageIndex}
              depth={0}
              selectedBlockId={selectedBlockId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Category Section ───────────────────────────────────────────

interface CategorySectionProps {
  data: CategoryGroupData;
  selectedBlockId: string | null;
  onNavigate: (pageIndex: number, pageId: string, blockId: string, blockType: string) => void;
}

function CategorySection({ data, selectedBlockId, onNavigate }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);
  const { meta, category } = data;

  return (
    <div className="rounded-xl border border-app-border/50 bg-app-surface overflow-hidden">
      {/* Category header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-app-elevated/40 transition-colors"
      >
        <ChevronRight
          size={14}
          className={`flex-shrink-0 text-app-muted transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-base flex-shrink-0">{meta.icon}</span>
        <span className="text-sm font-semibold truncate flex-1 text-app-primary">
          {meta.label}
        </span>
        <span
          className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: meta.color + '18',
            color: meta.color,
          }}
        >
          {data.blocks.length}
        </span>
      </button>

      {/* Block list */}
      {expanded && (
        <div className="px-1.5 pb-2 space-y-0.5 border-t border-app-border/30">
          {data.blocks.map(({ block, pageId, pageIndex }, i) => (
            <BlockRow
              key={block.id || `${category}-block-${i}`}
              block={block}
              pageId={pageId}
              pageIndex={pageIndex}
              depth={0}
              selectedBlockId={selectedBlockId}
              onNavigate={onNavigate}
            />
          ))}
          {data.blocks.length === 0 && (
            <div className="text-center py-3">
              <span className="text-xs text-app-muted">Tidak ada blok dalam kategori ini</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary Bar ────────────────────────────────────────────────

interface SummaryBarProps {
  totalPages: number;
  totalBlocks: number;
  categoryDistribution: Record<ContentCategory, number>;
}

function SummaryBar({ totalPages, totalBlocks, categoryDistribution }: SummaryBarProps) {
  const activeCategories = Object.entries(categoryDistribution)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-app-surface border border-app-border/50 rounded-xl p-3 space-y-2.5">
      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-app-accent/70" />
          <span className="text-xs font-bold text-app-primary">{totalPages}</span>
          <span className="text-[10px] text-app-muted">halaman</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={13} className="text-app-success/70" />
          <span className="text-xs font-bold text-app-primary">{totalBlocks}</span>
          <span className="text-[10px] text-app-muted">blok</span>
        </div>
      </div>

      {/* Category distribution bar */}
      {activeCategories.length > 0 && totalBlocks > 0 && (
        <div className="space-y-1.5">
          {/* Segmented bar */}
          <div className="flex h-2 rounded-full overflow-hidden bg-app-elevated">
            {activeCategories.map(([cat, count]) => {
              const meta = CATEGORY_META[cat as ContentCategory];
              return (
                <div
                  key={cat}
                  className="transition-all duration-300"
                  style={{
                    width: `${(count / totalBlocks) * 100}%`,
                    backgroundColor: meta.color,
                    opacity: 0.7,
                  }}
                  title={`${meta.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Category labels */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {activeCategories.map(([cat, count]) => {
              const meta = CATEGORY_META[cat as ContentCategory];
              return (
                <div key={cat} className="flex items-center gap-1">
                  <span className="text-[10px]">{meta.icon}</span>
                  <span className="text-[10px] font-medium" style={{ color: meta.color }}>
                    {count}
                  </span>
                  <span className="text-[9px] text-app-muted">{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export function SchemaNavigatorPanel() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const selectBlock = useInteractionStore(s => s.selectBlock);
  const selectedBlockId = useInteractionStore(s => s.selectedBlockId);

  // ── View mode: by-page or by-category ──
  const [viewMode, setViewMode] = useState<ViewMode>('by-page');

  // ── Search / filter state ──
  const [searchQuery, setSearchQuery] = useState('');

  // ── Build page block data ──
  const pageBlockData = useMemo<PageBlockData[]>(() => {
    return pages
      .map((page, index) => ({
        pageId: page.id,
        pageIndex: index,
        pageLabel: page.label,
        templateType: page.templateType || 'custom',
        blocks: getPageBlocks(page),
      }))
      .filter(d => d.blocks.length > 0);
  }, [pages]);

  // ── Summary stats ──
  const { totalBlocks, categoryDistribution, filteredPageData, filteredCategoryData } = useMemo(() => {
    const distribution: Record<ContentCategory, number> = {
      'struktur': 0,
      'materi': 0,
      'interaktif': 0,
      'evaluasi': 0,
      'refleksi': 0,
    };

    // Count all blocks recursively
    function countBlocks(blocks: SchemaBlock[]): number {
      let count = 0;
      for (const block of blocks) {
        const cat = getContentCategory(block.type);
        distribution[cat]++;
        count++;
        // Also count children
        const children = getChildBlocks(block);
        if (children.length > 0) {
          count += countBlocks(children);
        }
      }
      return count;
    }

    let total = 0;
    for (const d of pageBlockData) {
      total += countBlocks(d.blocks);
    }

    // Filter by search query
    const q = searchQuery.toLowerCase().trim();

    // Filtered page data
    const filteredPage = q
      ? pageBlockData.map(d => {
          const matchingBlocks = d.blocks.filter(block => {
            const display = getBlockDisplay(block.type);
            const title = getBlockTitle(block);
            return (
              title.toLowerCase().includes(q) ||
              display.label.toLowerCase().includes(q) ||
              block.type.toLowerCase().includes(q) ||
              d.pageLabel.toLowerCase().includes(q)
            );
          });
          return { ...d, blocks: matchingBlocks };
        }).filter(d => d.blocks.length > 0)
      : pageBlockData;

    // Build category-grouped data
    const categoryBlocks: Record<ContentCategory, Array<{ block: SchemaBlock; pageId: string; pageIndex: number }>> = {
      'struktur': [],
      'materi': [],
      'interaktif': [],
      'evaluasi': [],
      'refleksi': [],
    };

    function collectBlocks(blocks: SchemaBlock[], pageId: string, pageIndex: number) {
      for (const block of blocks) {
        const cat = getContentCategory(block.type);
        if (!q || (() => {
          const display = getBlockDisplay(block.type);
          const title = getBlockTitle(block);
          return title.toLowerCase().includes(q) || display.label.toLowerCase().includes(q) || block.type.toLowerCase().includes(q);
        })()) {
          categoryBlocks[cat].push({ block, pageId, pageIndex });
        }
        const children = getChildBlocks(block);
        if (children.length > 0) {
          collectBlocks(children, pageId, pageIndex);
        }
      }
    }

    for (const d of pageBlockData) {
      collectBlocks(d.blocks, d.pageId, d.pageIndex);
    }

    const filteredCategory: CategoryGroupData[] = Object.entries(categoryBlocks)
      .filter(([, blocks]) => blocks.length > 0)
      .map(([cat, blocks]) => ({
        category: cat as ContentCategory,
        meta: CATEGORY_META[cat as ContentCategory],
        blocks,
      }));

    return {
      totalBlocks: total,
      categoryDistribution: distribution,
      filteredPageData: filteredPage,
      filteredCategoryData: filteredCategory,
    };
  }, [pageBlockData, searchQuery]);

  // ── Navigate handler ──
  const handleNavigate = useCallback((
    pageIndex: number,
    pageId: string,
    blockId: string,
    blockType: string,
  ) => {
    // 1. Set the Konten tab to the correct tab for this block type
    const tab = getKontenTabForBlockType(blockType);
    if (tab) {
      useCanvaStore.setState({ kontenTabRequest: tab });
    }

    // 2. Navigate to the page on canvas
    goPage(pageIndex);

    // 3. Select the block on canvas
    selectBlock(blockId, blockType);
  }, [goPage, selectBlock]);

  // ── Empty state ──
  if (pageBlockData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-app-elevated/50 flex items-center justify-center mb-4">
          <BookOpen size={28} className="text-app-muted/50" />
        </div>
        <p className="text-sm font-semibold text-app-primary mb-1">
          Belum ada konten
        </p>
        <p className="text-xs text-app-muted text-center max-w-[200px]">
          Buat halaman dengan Auto-Generate atau template untuk melihat struktur skema di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-app-accent/10 flex items-center justify-center flex-shrink-0">
          <Layers size={14} className="text-app-accent" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-app-primary leading-tight">
            Navigasi Skema
          </h3>
          <p className="text-[10px] text-app-muted">
            Klik navigasi, double-klik edit judul
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <SummaryBar
        totalPages={pageBlockData.length}
        totalBlocks={totalBlocks}
        categoryDistribution={categoryDistribution}
      />

      {/* Search + view mode toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari blok…"
            className="w-full bg-app-elevated border border-app-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-app-primary placeholder:text-app-muted/50 focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent/30 transition-colors"
          />
        </div>
        <div className="flex items-center gap-0.5 bg-app-surface border border-app-border rounded-lg p-0.5 flex-shrink-0">
          <button
            onClick={() => setViewMode('by-page')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'by-page'
                ? 'bg-app-elevated text-app-primary shadow-sm'
                : 'text-app-muted hover:text-app-secondary'
            }`}
            title="Kelompokkan per halaman"
          >
            <List size={12} />
          </button>
          <button
            onClick={() => setViewMode('by-category')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'by-category'
                ? 'bg-app-elevated text-app-primary shadow-sm'
                : 'text-app-muted hover:text-app-secondary'
            }`}
            title="Kelompokkan per kategori"
          >
            <LayoutGrid size={12} />
          </button>
        </div>
      </div>

      {/* Block list — switches between page-grouped and category-grouped */}
      <div className="space-y-2 max-h-[calc(100vh-460px)] overflow-y-auto custom-scrollbar pr-0.5">
        {viewMode === 'by-page' ? (
          // Page-grouped view
          filteredPageData.map(data => (
            <PageSection
              key={data.pageId}
              data={data}
              isActive={data.pageIndex === currentPageIndex}
              selectedBlockId={selectedBlockId}
              onNavigate={handleNavigate}
            />
          ))
        ) : (
          // Category-grouped view
          filteredCategoryData.map(data => (
            <CategorySection
              key={data.category}
              data={data}
              selectedBlockId={selectedBlockId}
              onNavigate={handleNavigate}
            />
          ))
        )}

        {/* No results for search */}
        {(viewMode === 'by-page' && filteredPageData.length === 0 && searchQuery) && (
          <div className="text-center py-6">
            <p className="text-xs text-app-muted">
              Tidak ada blok yang cocok dengan &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
        {(viewMode === 'by-category' && filteredCategoryData.length === 0 && searchQuery) && (
          <div className="text-center py-6">
            <p className="text-xs text-app-muted">
              Tidak ada blok yang cocok dengan &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
