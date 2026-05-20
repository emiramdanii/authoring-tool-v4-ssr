'use client';

// ═══════════════════════════════════════════════════════════════
// ADD BLOCK PANEL — Block palette grouped by pedagogical personality
// ═══════════════════════════════════════════════════════════════
// Shows all registered block types grouped by Block Personality
// (pedagogical intent) instead of technical category.
// Search/filter at top, click to add block to current page.
// When a block is selected in the Layer panel, new blocks are
// inserted after the selected block instead of appended to the end.
//
// TEACHER MODE: In 'sederhana' mode, groups are simplified to
// "Informasi & Materi", "Aktivitas Interaktif", "Struktur Halaman"
// and "Block" terminology is replaced with "Konten".

import { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Blocks, ArrowDownToLine, Zap } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import {
  getAllBlockDefinitions,
  getBlockDefinition,
  PERSONALITY_CONFIG,
  type BlockDefinition,
  type BlockPersonality,
} from '@/core/registry/SceneRegistry';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { announceToScreenReader } from '@/lib/a11y';
import {
  teacherTerm,
  personalityToSimplifiedGroup,
  SIMPLIFIED_GROUPS,
  type TeacherMode,
} from '@/core/i18n/teacher-terminology';
import {
  getAllFragments,
  getFragmentsByCategory,
  getFragment,
  getSmartSuggestions,
  FRAGMENT_CATEGORIES,
  type TemplateFragment,
  type TemplateFragmentCategory,
  type FragmentSuggestion,
} from '@/core/template/template-fragments';

export default function AddBlockPanel() {
  const addSchemaBlock = useCanvaStore(s => s.addSchemaBlock);
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const teacherMode = useAuthoringStore(s => s.teacherMode);
  const isSederhana = teacherMode === 'sederhana';
  const [search, setSearch] = useState('');

  const page = pages[currentPageIndex];

  // Terminology helpers based on teacher mode
  const blockLabel = isSederhana ? 'Konten' : 'Block';

  // Check if current page can accept schema blocks
  // addSchemaBlock() auto-creates an empty schema for pages that
  // don't have one yet, so ANY page can accept blocks.
  // The only case where we can't add is when there's no page at all.
  const canAddBlocks = useMemo(() => {
    if (!page) return false;
    return true;
  }, [page]);

  // ── Compute insertion index from selected block ─────────────
  const { insertAfterIndex, selectedBlockName } = useMemo(() => {
    if (!selectedBlockId || !page) return { insertAfterIndex: undefined, selectedBlockName: null };
    const schema = ensurePageSchema(page);
    if (!schema) return { insertAfterIndex: undefined, selectedBlockName: null };
    const idx = schema.blocks.findIndex(b => b.id === selectedBlockId);
    if (idx === -1) return { insertAfterIndex: undefined, selectedBlockName: null };
    const blockDef = getBlockDefinition(schema.blocks[idx].type);
    const name = blockDef?.name || schema.blocks[idx].type;
    return { insertAfterIndex: idx, selectedBlockName: isSederhana ? teacherTerm(name, 'sederhana') : name };
  }, [selectedBlockId, page, isSederhana]);

  // Get all block definitions, filter by search, exclude non-addable (internal) blocks
  const allBlocks = useMemo(() => getAllBlockDefinitions().filter(b => b.addable !== false), []);

  // ── Add block handler with screen reader announcement ──────────
  const handleAddBlock = useCallback((block: BlockDefinition) => {
    addSchemaBlock(block.type, insertAfterIndex);
    announceToScreenReader(`${blockLabel} ${block.name} ditambahkan`);
  }, [addSchemaBlock, insertAfterIndex, blockLabel]);

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

  // ── Grouping logic: simplified groups in sederhana mode ──────
  // In lengkap mode: group by personality (pedagogical intent)
  // In sederhana mode: group by simplified categories (informasi, interaktif, struktur)
  const groupedBlocksLengkap = useMemo(() => {
    const groups: Partial<Record<BlockPersonality, BlockDefinition[]>> = {};
    for (const block of filteredBlocks) {
      const p = block.personality;
      if (!groups[p]) groups[p] = [];
      groups[p]!.push(block);
    }
    const sorted = (Object.entries(groups) as [BlockPersonality, BlockDefinition[]][]).sort(([a], [b]) => {
      const orderA = PERSONALITY_CONFIG[a]?.order ?? 99;
      const orderB = PERSONALITY_CONFIG[b]?.order ?? 99;
      return orderA - orderB;
    });
    return sorted;
  }, [filteredBlocks]);

  const groupedBlocksSederhana = useMemo(() => {
    const groups: Record<string, BlockDefinition[]> = {};
    for (const block of filteredBlocks) {
      const groupKey = personalityToSimplifiedGroup(block.personality, block.type);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(block);
    }
    // Sort by simplified group order
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const orderA = SIMPLIFIED_GROUPS[a]?.order ?? 99;
      const orderB = SIMPLIFIED_GROUPS[b]?.order ?? 99;
      return orderA - orderB;
    });
    return sorted;
  }, [filteredBlocks]);

  // ── Fragment state ── (ALL hooks must be declared before any early returns)
  const [fragmentFilter, setFragmentFilter] = useState<TemplateFragmentCategory | 'all'>('all');

  // Get fragments grouped by category
  const allFragments = useMemo(() => getAllFragments(), []);

  // ── Context-aware fragment suggestion based on current page type ──
  const smartSuggestions = useMemo(() => {
    if (!page) return [];
    const templateType = page.templateType;
    if (!templateType || templateType === 'custom') return [];
    // Get existing block types on this page
    const schema = ensurePageSchema(page);
    const existingTypes = schema?.blocks.map(b => b.type) ?? [];
    // Use smart suggestion engine
    return getSmartSuggestions(templateType, existingTypes);
  }, [page]);

  // Top 3 suggestions for "Suggested for this page" section
  const suggestedFragments = useMemo(() => {
    return smartSuggestions
      .filter(s => s.reason === 'page-match' || s.reason === 'complement')
      .slice(0, 3)
      .map(s => s.fragment);
  }, [smartSuggestions]);

  // ── Quick insert fragment handler ──
  const handleInsertFragment = useCallback((fragmentId: string) => {
    const fragment = getFragment(fragmentId);
    if (!fragment) return;
    // Insert each block type from the fragment
    for (const blockType of fragment.blockTypes) {
      addSchemaBlock(blockType, insertAfterIndex);
    }
    announceToScreenReader(`Fragment ${fragment.title} ditambahkan`);
    toast.success(`"${fragment.title}" ditambahkan`);
  }, [addSchemaBlock, insertAfterIndex]);

  const filteredFragments = useMemo(() => {
    if (fragmentFilter === 'all') return allFragments;
    return getFragmentsByCategory(fragmentFilter);
  }, [allFragments, fragmentFilter]);
  const fragmentCategories = useMemo(() => FRAGMENT_CATEGORIES, []);
  const fragmentCategoryKeys = useMemo(() => Object.keys(fragmentCategories) as TemplateFragmentCategory[], [fragmentCategories]);

  // If page can't accept blocks, show message (AFTER all hooks)
  if (!canAddBlocks) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="text-2xl mb-2 opacity-40">📦</div>
        <div className="text-[10px] text-app-muted">
          Tidak dapat menambah {blockLabel.toLowerCase()}
        </div>
        <div className="text-[8px] text-app-muted mt-1">
          {isSederhana
            ? 'Konten hanya bisa ditambahkan ke halaman kosong atau template'
            : 'Block hanya bisa ditambahkan ke halaman kosong atau template/schema'}
        </div>
        <div className="text-[8px] text-app-muted mt-0.5">
          {page && page.templateType === 'custom' && page.elements && page.elements.length > 0
            ? 'Halaman ini memiliki elemen legacy — hapus elemen terlebih dahulu'
            : 'Gunakan tab Halaman untuk menambah template terlebih dahulu'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="add-block-panel">
      {/* Header */}
      <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
        <Blocks size={10} />
        {isSederhana ? 'Tambah Konten' : 'Tambah Block'}
        <span className="text-app-muted">({allBlocks.length})</span>
      </div>

      {/* Quick Insert Fragments — Phase F.4 */}
      <div className="space-y-2">
        <div className="text-[8px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
          <Zap size={8} />
          {isSederhana ? 'Sisipkan Cepat' : 'Quick Insert'}
          <span className="text-app-muted">({filteredFragments.length})</span>
        </div>

        {/* Context-aware suggestions — Phase F.4 */}
        {suggestedFragments.length > 0 && (
          <div className="space-y-1">
            <div className="text-[7px] text-app-accent font-bold uppercase tracking-wider flex items-center gap-1">
              💡 {isSederhana ? 'Cocok untuk halaman ini' : 'Suggested for this page'}
            </div>
            {suggestedFragments.map(fragment => (
              <button
                key={fragment.id}
                onClick={() => handleInsertFragment(fragment.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-app-accent/20 bg-app-accent/5 hover:bg-app-accent/10 text-left transition-all active:scale-[0.98] group"
                title={fragment.description}
              >
                <span className="text-base flex-shrink-0 group-hover:scale-110 transition-transform">{fragment.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-app-accent truncate group-hover:text-app-primary transition-colors">
                    {fragment.title}
                  </div>
                  <div className="text-[7px] text-app-muted truncate">
                    {fragment.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFragmentFilter('all')}
            className={`px-1.5 py-0.5 rounded-md text-[7px] font-bold transition-all ${
              fragmentFilter === 'all'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                : 'bg-app-elevated/30 border border-app-border/20 text-app-muted hover:text-app-secondary'
            }`}
          >
            Semua
          </button>
          {fragmentCategoryKeys.map(catKey => {
            const cat = fragmentCategories[catKey];
            return (
              <button
                key={catKey}
                onClick={() => setFragmentFilter(catKey)}
                className={`px-1.5 py-0.5 rounded-md text-[7px] font-bold transition-all flex items-center gap-0.5 ${
                  fragmentFilter === catKey
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                    : 'bg-app-elevated/30 border border-app-border/20 text-app-muted hover:text-app-secondary'
                }`}
              >
                <span className="text-[8px]">{cat.icon}</span>
                {cat.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Fragment cards */}
        <div className="space-y-1">
          {filteredFragments.map(fragment => {
            const cat = fragmentCategories[fragment.category];
            return (
              <button
                key={fragment.id}
                onClick={() => handleInsertFragment(fragment.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-app-border/15 bg-app-elevated/20 hover:bg-app-elevated/40 hover:border-app-accent/25 text-left transition-all active:scale-[0.98] group"
                title={fragment.description}
              >
                <span className="text-base flex-shrink-0 group-hover:scale-110 transition-transform">{fragment.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-app-primary truncate group-hover:text-app-accent transition-colors">
                    {fragment.title}
                  </div>
                  <div className="text-[7px] text-app-muted truncate">
                    {fragment.description}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-[6px] px-1 py-0 rounded bg-app-elevated/40 text-app-muted border border-app-border/15">
                    {cat?.label.split(' ')[0] || fragment.category}
                  </span>
                  <span className="text-[6px] text-app-muted">
                    {fragment.blockCount} block
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredFragments.length === 0 && (
          <div className="text-[8px] text-app-muted text-center py-2">
            Tidak ada fragment untuk kategori ini
          </div>
        )}
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
          placeholder={isSederhana ? 'Cari konten...' : 'Cari block...'}
          aria-label={isSederhana ? 'Cari konten' : 'Cari block'}
          aria-describedby="add-block-search-help"
          className="w-full h-7 pl-7 pr-2 text-[10px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-app-accent/50 focus:outline-none placeholder:text-app-muted"
        />
        <span id="add-block-search-help" className="sr-only">
          Ketik untuk mencari {blockLabel.toLowerCase()} berdasarkan nama, tipe, atau deskripsi
        </span>
      </div>

      {/* Block groups */}
      <div className="space-y-3">
        {isSederhana ? (
          // ── Sederhana mode: simplified groups ──
          groupedBlocksSederhana.map(([groupKey, blocks]) => {
            const config = SIMPLIFIED_GROUPS[groupKey];
            if (!config) return null;

            return (
              <div key={groupKey}>
                {/* Group header */}
                <div className={`flex items-center gap-1.5 mb-1.5 px-2 py-1.5 rounded-lg ${config.bgColorClass} border ${config.borderColorClass}`}>
                  <span className="text-sm">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold ${config.colorClass}`}>{config.label}</span>
                      <span className="text-[8px] text-app-muted">({blocks.length})</span>
                    </div>
                    <div className="text-[7px] text-app-muted leading-tight">{config.desc}</div>
                  </div>
                </div>

                {/* Block cards */}
                <div className="space-y-1" role="list" aria-label={`Daftar konten ${config.label}`}>
                  {blocks.map((block) => (
                    <button
                      key={block.type}
                      data-testid={`add-block-btn-${block.type}`}
                      onClick={() => handleAddBlock(block)}
                      aria-label={`Tambah ${teacherTerm(block.name, 'sederhana')} — ${block.description}`}
                      className="card-hover w-full flex items-center gap-2.5 p-2 rounded-xl bg-app-elevated/40 border border-app-border/20 active:scale-[0.97] transition-transform text-left group"
                    >
                      <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">
                        {block.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-app-primary truncate group-hover:text-app-accent transition-colors">
                          {teacherTerm(block.name, 'sederhana')}
                        </div>
                        <div className="text-[8px] text-app-muted leading-tight line-clamp-2">
                          {block.description}
                        </div>
                      </div>
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
          })
        ) : (
          // ── Lengkap mode: personality groups (original) ──
          groupedBlocksLengkap.map(([personality, blocks]) => {
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
                      data-testid={`add-block-btn-${block.type}`}
                      onClick={() => handleAddBlock(block)}
                      aria-label={`Tambah ${block.name} — ${block.description}`}
                      className="card-hover w-full flex items-center gap-2.5 p-2 rounded-xl bg-app-elevated/40 border border-app-border/20 active:scale-[0.97] transition-transform text-left group"
                    >
                      <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true">
                        {block.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-app-primary truncate group-hover:text-app-accent transition-colors">
                          {block.name}
                        </div>
                        <div className="text-[8px] text-app-muted leading-tight line-clamp-2">
                          {block.description}
                        </div>
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
          })
        )}
      </div>

      {/* Empty search state */}
      {filteredBlocks.length === 0 && search.trim() && (
        <div className="text-center py-4">
          <div className="text-[10px] text-app-muted">
            Tidak ada {blockLabel.toLowerCase()} yang cocok dengan &quot;{search}&quot;
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="text-[8px] text-app-muted mt-2 pt-2 border-t border-app-border/20">
        {selectedBlockName
          ? `${blockLabel} baru akan disisipkan setelah "${selectedBlockName}"`
          : `Klik ${blockLabel.toLowerCase()} untuk menambahkan ke halaman saat ini`}
      </div>
    </div>
  );
}
