'use client';

// ═══════════════════════════════════════════════════════════════════
// SCHEMA BLOCK TREE v3 — SILSE v4 MD3 Block Navigator
// ═══════════════════════════════════════════════════════════════════
// Navigate schema blocks within each page.
//
// Architecture:
//   READ:  CanvaStore.pages[].schema.blocks → tree structure
//   NAV:   goPage() + selectBlock() → navigate & edit
//   CROSS: Click block → navigate to page + show in right panel
//
// v3 changes:
//   - Better MD3 styling with rounded-lg items and active state
//   - SILSE semantic tokens for block type colors (no hardcoded Tailwind)
//   - Smooth transitions for expand/collapse
//   - Better visual hierarchy with depth-based indentation
//   - Schema badge uses silse-primary tokens
//   - Hover states with proper surface colors
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractionStore } from '@/store/canva/interaction-store';
import { getPageBlocks } from '@/core/schema/ensure-schema';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '@/core/schema/capability-registry';
import { getKontenTabForBlockType } from '@/hooks/use-schema-navigator';
import type { SchemaBlock } from '@/core/schema/types';
import type { CanvaPage } from '@/components/canva/types';

// ── Block Type Display Map — Material Symbols + SILSE semantic tokens ──
const BLOCK_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  'cover':             { icon: 'home', label: 'Cover', color: 'text-silse-tertiary-container' },
  'hero':              { icon: 'rocket_launch', label: 'Hero', color: 'text-silse-tertiary' },
  'petunjuk':          { icon: 'push_pin', label: 'Petunjuk', color: 'text-silse-secondary' },
  'tp':                { icon: 'target', label: 'Tujuan Pembelajaran', color: 'text-silse-secondary' },
  'alur':              { icon: 'map', label: 'Alur Pembelajaran', color: 'text-silse-tertiary' },
  'sateri':            { icon: 'theater_comedy', label: 'Skenario', color: 'text-silse-error' },
  'materi-section':    { icon: 'auto_stories', label: 'Materi', color: 'text-silse-primary' },
  'materi-blok':       { icon: 'edit_note', label: 'Blok Materi', color: 'text-silse-primary' },
  'def-box':           { icon: 'push_pin', label: 'Definisi', color: 'text-silse-tertiary-container' },
  'nc-grid':           { icon: 'grid_view', label: 'Grid Konten', color: 'text-silse-secondary' },
  'flashcard-set':     { icon: 'style', label: 'Flashcard', color: 'text-silse-tertiary' },
  'ftab':              { icon: 'tab', label: 'Tab', color: 'text-silse-secondary' },
  'nk-card':           { icon: 'menu_book', label: 'Kartu', color: 'text-silse-primary' },
  'diskusi':           { icon: 'forum', label: 'Diskusi', color: 'text-silse-primary-container' },
  'kuis':              { icon: 'quiz', label: 'Kuis', color: 'text-silse-tertiary-container' },
  'motivasi':          { icon: 'lightbulb', label: 'Motivasi', color: 'text-silse-tertiary' },
  'refleksi':          { icon: 'self_improvement', label: 'Refleksi', color: 'text-silse-primary-container' },
  'rangkuman':         { icon: 'summarize', label: 'Rangkuman', color: 'text-silse-secondary' },
  'penutup':           { icon: 'school', label: 'Penutup', color: 'text-silse-tertiary' },
  'hasil':             { icon: 'emoji_events', label: 'Hasil', color: 'text-silse-primary-container' },
  'tabel':             { icon: 'table_chart', label: 'Tabel', color: 'text-silse-tertiary' },
  'timeline':          { icon: 'timeline', label: 'Timeline', color: 'text-silse-secondary' },
  'compare':           { icon: 'compare', label: 'Perbandingan', color: 'text-silse-primary' },
  'gambar':            { icon: 'image', label: 'Gambar', color: 'text-silse-tertiary' },
  'reveal':            { icon: 'auto_awesome', label: 'Reveal', color: 'text-silse-tertiary-container' },
  'checklist':         { icon: 'checklist', label: 'Checklist', color: 'text-silse-primary-container' },
  'statistik':         { icon: 'bar_chart', label: 'Statistik', color: 'text-silse-tertiary' },
  'studi':             { icon: 'case', label: 'Studi Kasus', color: 'text-silse-error' },
  'tabel-accord':      { icon: 'accordion', label: 'Accordion', color: 'text-silse-tertiary' },
  'tujuan-display':    { icon: 'target', label: 'Tujuan', color: 'text-silse-secondary' },
  'sortir-game':       { icon: 'sort', label: 'Game Sortir', color: 'text-silse-secondary' },
  'roda-game':         { icon: 'refresh', label: 'Roda Putar', color: 'text-silse-tertiary' },
  'memory-game':       { icon: 'psychology', label: 'Memory', color: 'text-silse-tertiary' },
  'matching-game':     { icon: 'compare_arrows', label: 'Pasangkan', color: 'text-silse-tertiary-container' },
  'fill-blank-game':   { icon: 'edit', label: 'Isian', color: 'text-silse-primary-container' },
  'word-search-game':  { icon: 'search', label: 'Teka-Teki Kata', color: 'text-silse-secondary' },
  'true-false-game':   { icon: 'check_circle', label: 'Benar/Salah', color: 'text-silse-primary-container' },
  'drag-drop-game':    { icon: 'drag_pan', label: 'Seret & Letakkan', color: 'text-silse-tertiary' },
  'crossword-game':    { icon: 'crossword', label: 'Teka Silang', color: 'text-silse-tertiary' },
  'team-buzzer-game':  { icon: 'groups', label: 'Kuis Tim', color: 'text-silse-tertiary-container' },
};

function getBlockDisplay(type: string): { icon: string; label: string; color: string } {
  return BLOCK_DISPLAY[type] || { icon: 'widgets', label: type, color: 'text-silse-on-surface-variant' };
}

// ── Get block title/label for the tree item ─────────────────────

function getBlockTitle(block: SchemaBlock): string {
  const b = block as Record<string, unknown>;
  if (typeof b.title === 'string' && b.title) return b.title as string;
  if (typeof b.label === 'string' && b.label) return b.label as string;
  return getBlockDisplay(block.type).label;
}

// ── Get child blocks from a composite block ─────────────────────

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

// ── Tree Node ───────────────────────────────────────────────────

interface TreeNodeProps {
  block: SchemaBlock;
  pageId: string;
  depth: number;
  selectedBlockId: string | null;
  onSelect: (pageId: string, blockId: string, blockType: string) => void;
}

function TreeNode({ block, pageId, depth, selectedBlockId, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1); // Auto-expand first level
  const children = getChildBlocks(block);
  const hasChildren = children.length > 0;
  const isSelected = selectedBlockId === block.id;
  const display = getBlockDisplay(block.type);
  const title = getBlockTitle(block);

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded);
          }
          onSelect(pageId, block.id!, block.type);
        }}
        className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-left transition-[background-color,color] duration-150 text-[10px] group ${
          isSelected
            ? 'bg-silse-primary-container/20 text-silse-primary font-semibold'
            : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/50 hover:text-silse-on-surface'
        }`}
        style={{ paddingLeft: `${depth * 10 + 6}px` }}
        title={title}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <span
            className={`material-symbols-outlined flex-shrink-0 text-silse-on-surface-variant/50 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            style={{ fontSize: '12px' }}
          >chevron_right</span>
        ) : (
          <span className="w-[10px] flex-shrink-0" />
        )}

        {/* Block type icon — Material Symbol with SILSE color */}
        <span className={`material-symbols-outlined flex-shrink-0 ${display.color}`} style={{ fontSize: '14px' }}>
          {display.icon}
        </span>

        {/* Block title */}
        <span className="truncate flex-1 font-medium">{title}</span>

        {/* Edit in Konten button */}
        {getKontenTabForBlockType(block.type) && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              const tab = getKontenTabForBlockType(block.type);
              if (tab) {
                useCanvaStore.setState({ kontenTabRequest: tab, kontenPanelRequest: true });
              }
            }}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-silse-on-surface-variant/60 hover:text-silse-primary transition-opacity cursor-pointer"
            title="Edit di Konten"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>edit</span>
          </span>
        )}

        {/* Schema badge */}
        <span className="material-symbols-outlined flex-shrink-0 text-silse-primary/25" style={{ fontSize: '10px' }}>bolt</span>
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="border-l border-silse-outline-variant/25 ml-3">
          {children.map((child, i) => (
            <TreeNode
              key={child.id || `${block.id}-child-${i}`}
              block={child}
              pageId={pageId}
              depth={depth + 1}
              selectedBlockId={selectedBlockId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page Block Section ──────────────────────────────────────────

interface PageBlockSectionProps {
  page: CanvaPage;
  pageIndex: number;
  isActive: boolean;
  selectedBlockId: string | null;
  onSelect: (pageId: string, blockId: string, blockType: string) => void;
}

function PageBlockSection({ page, pageIndex, isActive, selectedBlockId, onSelect }: PageBlockSectionProps) {
  const [expanded, setExpanded] = useState(isActive); // Auto-expand active page on initial render
  // Subscribe to schema changes reactively — re-compute blocks when schema content changes.
  // Previously, [page] alone could miss updates when Zustand/immer patches deep schema fields
  // without creating a new page reference. Adding page.schema and block count ensures reactivity.
  const schemaBlocksLength = page.schema?.blocks?.length ?? 0;
  const blocks = useMemo(() => getPageBlocks(page), [page, page.schema, schemaBlocksLength]);
  const isSchemaDriven = !!page.schema;

  if (!isSchemaDriven || blocks.length === 0) {
    return null;
  }

  return (
    <div className="border-l border-silse-outline-variant/25 ml-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-1 px-2 py-0.5 text-[9px] transition-[background-color,color] duration-150 rounded-md ${
          isActive ? 'text-silse-primary font-bold' : 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high/40'
        }`}
      >
        <span className={`material-symbols-outlined transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} style={{ fontSize: '10px' }}>chevron_right</span>
        <span className="material-symbols-outlined text-silse-primary/40" style={{ fontSize: '9px' }}>bolt</span>
        <span>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
      </button>

      {/* Block tree */}
      {expanded && (
        <div className="pb-0.5">
          {blocks.map((block, i) => (
            <TreeNode
              key={block.id || `block-${i}`}
              block={block}
              pageId={page.id}
              depth={0}
              selectedBlockId={selectedBlockId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export function SchemaBlockTree() {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const selectBlock = useInteractionStore(s => s.selectBlock);
  const selectedBlockId = useInteractionStore(s => s.selectedBlockId);

  // Navigate to a block: go to the page and select the block
  const handleSelect = useCallback((pageId: string, blockId: string, blockType: string) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex < 0) return;

    if (pageIndex !== currentPageIndex) {
      goPage(pageIndex);
    }

    selectBlock(blockId, blockType);
  }, [pages, currentPageIndex, goPage, selectBlock]);

  // Only show schema-driven pages that have blocks.
  // Stable key: compute block count from each page's schema to ensure re-render
  // when blocks are added/removed/edited, even if the pages array reference is the same.
  const schemaBlockCounts = pages.map(p => p.schema?.blocks?.length ?? 0).join(',');
  const schemaPages = useMemo(() => {
    return pages
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => {
        if (!page.schema) return false;
        const blocks = getPageBlocks(page);
        return blocks.length > 0;
      });
  }, [pages, schemaBlockCounts]);

  if (schemaPages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 px-1 py-1">
        <span className="material-symbols-outlined text-silse-outline" style={{ fontSize: '14px' }}>account_tree</span>
        <span className="text-[11px] font-bold text-silse-outline uppercase tracking-widest">
          Schema
        </span>
      </div>
      {schemaPages.map(({ page, index }) => (
        <PageBlockSection
          key={page.id}
          page={page}
          pageIndex={index}
          isActive={index === currentPageIndex}
          selectedBlockId={selectedBlockId}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

// ── Compact version for embedding in SceneList ──────────────────

interface SchemaBlockTreeCompactProps {
  page: CanvaPage;
  pageIndex: number;
  isActive: boolean;
}

export function SchemaBlockTreeCompact({ page, pageIndex, isActive }: SchemaBlockTreeCompactProps) {
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const goPage = useCanvaStore(s => s.goPage);
  const selectBlock = useInteractionStore(s => s.selectBlock);
  const selectedBlockId = useInteractionStore(s => s.selectedBlockId);
  const [expanded, setExpanded] = useState(false);

  // Reactive: re-compute blocks when schema changes (not just page reference)
  const schemaBlocksLength = page.schema?.blocks?.length ?? 0;
  const blocks = useMemo(() => getPageBlocks(page), [page, page.schema, schemaBlocksLength]);
  const isSchemaDriven = !!page.schema;

  const handleSelect = useCallback((pageId: string, blockId: string, blockType: string) => {
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx < 0) return;
    if (idx !== currentPageIndex) goPage(idx);
    selectBlock(blockId, blockType);
  }, [pages, currentPageIndex, goPage, selectBlock]);

  if (!isSchemaDriven || blocks.length === 0) return null;

  return (
    <div className="ml-4">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1 text-[10px] text-silse-on-surface-variant hover:text-silse-primary transition-colors py-0.5 rounded-lg"
      >
        <span className={`material-symbols-outlined transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} style={{ fontSize: '9px' }}>chevron_right</span>
        <span className="material-symbols-outlined text-silse-primary-container/50" style={{ fontSize: '9px' }}>bolt</span>
        <span>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <div className="space-y-0 border-l border-silse-outline-variant/30">
          {blocks.map((block, i) => (
            <TreeNode
              key={block.id || `block-${i}`}
              block={block}
              pageId={page.id}
              depth={0}
              selectedBlockId={selectedBlockId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
