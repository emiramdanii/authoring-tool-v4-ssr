'use client';

// ═══════════════════════════════════════════════════════════════
// ADD BLOCK PANEL — Block palette grouped by pedagogical personality
// ═══════════════════════════════════════════════════════════════
// Shows all registered block types grouped by Block Personality
// (pedagogical intent) instead of technical category.
// Search/filter at top, click to add block to current page.
// When a block is selected in the Layer panel, new blocks are
// inserted after the selected block instead of appended to the end.

import { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Blocks, ArrowDownToLine } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import {
  getAllBlockDefinitions,
  getBlockDefinition,
  PERSONALITY_CONFIG,
  type BlockDefinition,
  type BlockPersonality,
} from '@/core/registry/SceneRegistry';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { announceToScreenReader } from '@/lib/a11y';

export default function AddBlockPanel() {
  const addSchemaBlock = useCanvaStore(s => s.addSchemaBlock);
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const [search, setSearch] = useState('');

  const page = pages[currentPageIndex];

  // Check if current page can accept schema blocks
  // FASE 1: Schema-first — any page with schema can accept blocks.
  // We also allow custom pages to be upgraded via ensurePageSchema().
  const canAddBlocks = useMemo(() => {
    if (!page) return false;
    // Any page that can produce a schema (via ensurePageSchema) can accept blocks
    const schema = ensurePageSchema(page);
    return !!schema;
  }, [page]);

  // ── Compute insertion index from selected block ─────────────
  // When a block is selected, find its index in the schema blocks
  // array so we can insert after it.
  const { insertAfterIndex, selectedBlockName } = useMemo(() => {
    if (!selectedBlockId || !page) return { insertAfterIndex: undefined, selectedBlockName: null };
    const schema = ensurePageSchema(page);
    if (!schema) return { insertAfterIndex: undefined, selectedBlockName: null };
    const idx = schema.blocks.findIndex(b => b.id === selectedBlockId);
    if (idx === -1) return { insertAfterIndex: undefined, selectedBlockName: null };
    const blockDef = getBlockDefinition(schema.blocks[idx].type);
    return { insertAfterIndex: idx, selectedBlockName: blockDef?.name || schema.blocks[idx].type };
  }, [selectedBlockId, page]);

  // Get all block definitions, filter by search
  const allBlocks = useMemo(() => getAllBlockDefinitions(), []);

  // ── Add block handler with screen reader announcement ──────────
  const handleAddBlock = useCallback((block: BlockDefinition) => {
    addSchemaBlock(block.type, insertAfterIndex);
    announceToScreenReader(`Block ${block.name} ditambahkan`);
  }, [addSchemaBlock, insertAfterIndex]);

  const filteredBlocks = useMemo(() => {
    if (!search.trim()) return allBlocks;
    const q = search.toLowerCase().trim();
    return allBlocks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.personality.toLowerCase().includes(q) ||
        (PERSONALITY_CONFIG[b.personality]?.label ?? '').toLowerCase().includes(q)
    );
  }, [allBlocks, search]);

  // Group filtered blocks by personality (pedagogical intent)
  const groupedBlocks = useMemo(() => {
    const groups: Partial<Record<BlockPersonality, BlockDefinition[]>> = {};
    for (const block of filteredBlocks) {
      const p = block.personality;
      if (!groups[p]) groups[p] = [];
      groups[p]!.push(block);
    }
    // Sort personality groups by display order
    const sorted = (Object.entries(groups) as [BlockPersonality, BlockDefinition[]][]).sort(([a], [b]) => {
      const orderA = PERSONALITY_CONFIG[a]?.order ?? 99;
      const orderB = PERSONALITY_CONFIG[b]?.order ?? 99;
      return orderA - orderB;
    });
    return sorted;
  }, [filteredBlocks]);

  // If page can't accept blocks, show message
  if (!canAddBlocks) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="text-2xl mb-2 opacity-40">📦</div>
        <div className="text-[10px] text-app-muted">Tidak dapat menambah block</div>
        <div className="text-[8px] text-app-muted mt-1">
          Block hanya bisa ditambahkan ke halaman template/schema
        </div>
        <div className="text-[8px] text-app-muted mt-0.5">
          Gunakan tab Halaman untuk menambah template terlebih dahulu
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
        <Blocks size={10} />
        Tambah Block
        <span className="text-app-muted">({allBlocks.length})</span>
      </div>

      {/* Insertion point indicator — shows when a block is selected */}
      {selectedBlockName && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-app-accent/10 border border-app-accent/20 text-[9px] text-app-accent font-semibold">
          <ArrowDownToLine size={10} />
          <span>Sisipkan setelah:</span>
          <span className="font-bold truncate">{selectedBlockName}</span>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" aria-hidden="true" />
        <input
          id="add-block-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari block..."
          aria-label="Cari block"
          aria-describedby="add-block-search-help"
          className="w-full h-7 pl-7 pr-2 text-[10px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none placeholder:text-app-muted"
        />
        <span id="add-block-search-help" className="sr-only">
          Ketik untuk mencari block berdasarkan nama, tipe, atau deskripsi
        </span>
      </div>

      {/* Personality groups */}
      <div className="space-y-3">
        {groupedBlocks.map(([personality, blocks]) => {
          const config = PERSONALITY_CONFIG[personality];
          if (!config) return null;

          return (
            <div key={personality}>
              {/* Personality header */}
              <div className={`flex items-center gap-1.5 mb-1.5 px-2 py-1.5 rounded-lg ${config.bgColorClass} border ${config.borderColorClass}`}>
                <span className="text-sm">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold ${config.colorClass}`}>{config.label}</span>
                    <span className="text-[8px] text-app-muted">({blocks.length})</span>
                  </div>
                  <div className="text-[7px] text-app-muted leading-tight">{config.description}</div>
                </div>
              </div>

              {/* Block cards */}
              <div className="space-y-1" role="list" aria-label={`Daftar block ${config.label}`}>
                {blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => handleAddBlock(block)}
                    aria-label={`Tambah ${block.name} — ${block.description}`}
                    className="card-hover w-full flex items-center gap-2.5 p-2 rounded-xl bg-app-elevated/40 border border-app-border/20 active:scale-[0.97] transition-transform text-left group"
                  >
                    {/* Block icon */}
                    <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">
                      {block.icon}
                    </span>

                    {/* Block info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-app-primary truncate group-hover:text-app-accent transition-colors">
                        {block.name}
                      </div>
                      <div className="text-[8px] text-app-muted leading-tight line-clamp-2">
                        {block.description}
                      </div>
                      {/* Used-in templates */}
                      {block.usedInTemplates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {block.usedInTemplates.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[7px] px-1 py-0 rounded bg-app-elevated/40 text-app-muted"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add button */}
                    <Plus
                      size={14}
                      className="text-app-muted group-hover:text-app-accent transition-colors flex-shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty search state */}
      {filteredBlocks.length === 0 && search.trim() && (
        <div className="text-center py-4">
          <div className="text-[10px] text-app-muted">
            Tidak ada block yang cocok dengan &quot;{search}&quot;
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="text-[8px] text-app-muted mt-2 pt-2 border-t border-app-border/20">
        {selectedBlockName
          ? `Block baru akan disisipkan setelah "${selectedBlockName}"`
          : 'Klik block untuk menambahkan ke halaman saat ini'}
      </div>
    </div>
  );
}
