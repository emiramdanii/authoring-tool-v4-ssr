'use client';

// ═══════════════════════════════════════════════════════════════════
// SCHEMA BLOCK TREE — Navigate schema blocks within each page
// ═══════════════════════════════════════════════════════════════════
// Phase 3 deliverable: Shows the block tree structure of each page's
// schema, enabling navigation from a block to the canvas.
//
// Architecture:
//   READ:  CanvaStore.pages[].schema.blocks → tree structure
//   NAV:   goPage() + selectBlock() → navigate & edit
//   CROSS: Click block → navigate to page + show in right panel
//
// This replaces the flat page-only view with a navigable block tree
// that makes the schema structure visible and accessible.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useInteractionStore } from '@/store/canva/interaction-store';
// Phase 3: Removed useAuthoringStore import — cross-panel nav now uses useCanvaStore only
import { ensurePageSchema, getPageBlocks } from '@/core/schema/ensure-schema';
import { isCompositeBlockType, getCompositeContainerDescriptor } from '@/core/schema/capability-registry';
import { getKontenTabForBlockType } from '@/hooks/use-schema-navigator';
import type { SchemaBlock } from '@/core/schema/types';
import type { CanvaPage } from '@/components/canva/types';
import { ChevronRight, Zap, Pencil } from 'lucide-react';

// ── Block Type Display Map ──────────────────────────────────────
// Maps schema block types to human-readable labels and icons.
// Single source of truth for the tree view display.

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
  'diskusi':           { icon: '💬', label: 'Diskusi',          color: '#34d399' },
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

// ── Get block title/label for the tree item ─────────────────────

function getBlockTitle(block: SchemaBlock): string {
  const b = block as Record<string, unknown>;
  // Check common title fields
  if (typeof b.title === 'string' && b.title) return b.title as string;
  if (typeof b.label === 'string' && b.label) return b.label as string;
  // Fallback to type display label
  return getBlockDisplay(block.type).label;
}

// ── Get child blocks from a composite block ─────────────────────

function getChildBlocks(block: SchemaBlock): SchemaBlock[] {
  const children: SchemaBlock[] = [];

  // Try container descriptor first (capability registry)
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

  // Generic BaseBlock.children[]
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
        className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-left transition-colors text-[10px] group ${
          isSelected
            ? 'bg-app-accent/10 text-app-accent'
            : 'text-app-secondary hover:bg-app-elevated/50 hover:text-app-primary'
        }`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        title={title}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <ChevronRight
            size={10}
            className={`flex-shrink-0 text-app-muted transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <span className="w-[10px] flex-shrink-0" />
        )}

        {/* Block type icon */}
        <span className="text-xs flex-shrink-0">{display.icon}</span>

        {/* Block title */}
        <span className="truncate flex-1 font-medium">{title}</span>

        {/* Edit in Konten button — only for content blocks that have a Konten tab */}
        {getKontenTabForBlockType(block.type) && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              const tab = getKontenTabForBlockType(block.type);
              if (tab) {
                // Phase 3: Pure canva-store navigation — no useAuthoringStore needed
                useCanvaStore.setState({ kontenTabRequest: tab, kontenPanelRequest: true });
              }
            }}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-app-muted hover:text-app-accent transition-opacity cursor-pointer"
            title="Edit di Konten"
          >
            <Pencil size={8} />
          </span>
        )}

        {/* Schema badge for schema-driven blocks */}
        <Zap size={8} className="flex-shrink-0 text-app-success/40" />
      </button>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
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
  const [expanded, setExpanded] = useState(isActive); // Auto-expand active page
  const blocks = useMemo(() => getPageBlocks(page), [page]);
  const isSchemaDriven = !!page.schema;

  if (!isSchemaDriven || blocks.length === 0) {
    // Non-schema pages or empty pages: no block tree to show
    return null;
  }

  return (
    <div className="border-l border-app-border/30 ml-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-1 px-2 py-0.5 text-[9px] text-app-muted hover:text-app-secondary transition-colors ${
          isActive ? 'text-app-accent' : ''
        }`}
      >
        <ChevronRight size={8} className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
        <Zap size={7} className="text-app-success/60" />
        <span>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
      </button>

      {/* Block tree */}
      {expanded && (
        <div className="pb-1">
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

    // Navigate to the page first
    if (pageIndex !== currentPageIndex) {
      goPage(pageIndex);
    }

    // Then select the block (shows in right panel)
    selectBlock(blockId, blockType);
  }, [pages, currentPageIndex, goPage, selectBlock]);

  // Only show schema-driven pages that have blocks
  const schemaPages = useMemo(() => {
    return pages
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => {
        if (!page.schema) return false;
        const blocks = getPageBlocks(page);
        return blocks.length > 0;
      });
  }, [pages]);

  if (schemaPages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      <div className="text-[8px] font-bold text-app-muted uppercase tracking-wider px-2 py-1">
        Schema Navigator
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

  const blocks = useMemo(() => getPageBlocks(page), [page]);
  const isSchemaDriven = !!page.schema;

  const handleSelect = useCallback((pageId: string, blockId: string, blockType: string) => {
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx < 0) return;
    if (idx !== currentPageIndex) goPage(idx);
    selectBlock(blockId, blockType);
  }, [pages, currentPageIndex, goPage, selectBlock]);

  if (!isSchemaDriven || blocks.length === 0) return null;

  return (
    <div className="ml-5">
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="flex items-center gap-1 text-[8px] text-app-muted hover:text-app-accent transition-colors py-0.5"
      >
        <ChevronRight size={7} className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />
        <Zap size={7} className="text-app-success/60" />
        <span>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
      </button>

      {expanded && (
        <div className="space-y-0">
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
