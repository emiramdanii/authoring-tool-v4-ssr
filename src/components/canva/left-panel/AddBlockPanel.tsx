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
// TEACHER MODE: In 'sederhana' mode, only curated blocks are shown
// (TEACHER_ADDABLE_BLOCKS) — 8 safe types that have guided editors.
// Groups are simplified to "Isi & Materi", "Interaktif", etc.
// "Block" terminology is replaced with "Isi".

import { useState, useMemo, useCallback } from 'react';
// No lucide-react imports — all icons use Material Symbols Outlined per v4 spec
import { useCanvaStore } from '@/store/canva-store';
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
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const isSederhana = teacherMode;
  const [search, setSearch] = useState('');

  const page = pages[currentPageIndex];

  // Terminology helpers based on teacher mode
  const blockLabel = isSederhana ? 'Isi' : 'Block';

  // ── Curated block types for Teacher/Sederhana mode ──
  // Only blocks that are (1) addable, (2) have guided editors, and
  // (3) are meaningful for teachers to insert as content.
  // Page-level blocks (cover, tp, penutup, petunjuk) are NOT here —
  // those are added via "Tambah Halaman", not "Tambah Isi".
  // gambar (P3A) and roda-game (P3B) have guided editors.
  const TEACHER_ADDABLE_BLOCKS = useMemo(() => [
    'materi-section', 'def-box', 'kuis', 'diskusi',
    'refleksi', 'sortir-game', 'rangkuman', 'motivasi',
    'gambar', 'roda-game',
  ], []);

  // ── Popular blocks for quick-access grid (Sederhana only) ──
  // Aligned with TEACHER_ADDABLE_BLOCKS — no page-level or non-addable types.
  const POPULAR_BLOCK_TYPES = useMemo(() => [
    'materi-section', 'def-box', 'kuis', 'diskusi',
    'refleksi', 'sortir-game', 'rangkuman', 'motivasi',
    'gambar', 'roda-game',
  ], []);

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
    const blockDef = getBlockDefinition(schema.blocks[idx]!.type);
    const name = blockDef?.name || schema.blocks[idx]!.type;
    return { insertAfterIndex: idx, selectedBlockName: isSederhana ? teacherTerm(name, 'sederhana') : name };
  }, [selectedBlockId, page, isSederhana]);

  // Get all block definitions, filter by search, exclude non-addable (internal) blocks
  // In sederhana/teacher mode, further filter to curated list only
  const allBlocks = useMemo(() => {
    const raw = getAllBlockDefinitions().filter(b => b.addable !== false);
    if (!isSederhana) return raw;
    // Teacher mode: only show curated blocks that are safe for teachers
    return raw.filter(b => TEACHER_ADDABLE_BLOCKS.includes(b.type));
  }, [isSederhana, TEACHER_ADDABLE_BLOCKS]);

  // Popular blocks derived from allBlocks (must come after allBlocks declaration)
  const popularBlocks = useMemo(() => {
    if (!isSederhana) return [];
    return POPULAR_BLOCK_TYPES
      .map(type => allBlocks.find(b => b.type === type))
      .filter((b): b is BlockDefinition => b != null);
  }, [isSederhana, allBlocks, POPULAR_BLOCK_TYPES]);

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
        <div className="text-[10px] text-silse-on-surface-variant">
          Tidak dapat menambah {blockLabel.toLowerCase()}
        </div>
        <div className="text-[8px] text-silse-on-surface-variant mt-1">
          {isSederhana
            ? 'Konten hanya bisa ditambahkan ke halaman kosong atau template'
            : 'Block hanya bisa ditambahkan ke halaman kosong atau template/schema'}
        </div>
        <div className="text-[8px] text-silse-on-surface-variant mt-0.5">
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
      <div className="text-[11px] font-bold text-silse-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>widgets</span>
        {isSederhana ? 'Tambah Isi' : 'Tambah Block'}
        <span className="text-silse-on-surface-variant/60">({allBlocks.length})</span>
      </div>

      {/* ── Paling Sering Digunakan (Sederhana only) ── */}
      {isSederhana && popularBlocks.length > 0 && !search.trim() && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-silse-tertiary uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>star</span>
            Paling Sering Digunakan
          </div>
          <div className="grid grid-cols-3 gap-1">
            {popularBlocks.map((block) => (
              <button
                key={block.type}
                onClick={() => handleAddBlock(block)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-dashed border-silse-outline-variant bg-silse-surface-container-low hover:bg-white hover:border-silse-primary transition-[background-color,border-color] active:scale-[0.96] text-center group"
                title={`${teacherTerm(block.name, 'sederhana')} — ${block.description}`}
              >
                <span className="text-lg group-hover:scale-[1.1] transition-transform" aria-hidden="true">{block.icon}</span>
                <span className="text-[10px] font-semibold text-silse-on-surface leading-tight line-clamp-2 group-hover:text-silse-primary transition-colors">
                  {teacherTerm(block.name, 'sederhana')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Insert Fragments — Phase F.4 */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-silse-tertiary uppercase tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>bolt</span>
          {isSederhana ? 'Sisipkan Cepat' : 'Quick Insert'}
          <span className="text-silse-on-surface-variant">({filteredFragments.length})</span>
        </div>

        {/* Context-aware suggestions — Phase F.4 */}
        {suggestedFragments.length > 0 && (
          <div className="space-y-1">
            <div className="text-[9px] text-silse-primary font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>lightbulb</span> {isSederhana ? 'Cocok untuk halaman ini' : 'Suggested for this page'}
            </div>
            {suggestedFragments.map(fragment => (
              <button
                key={fragment.id}
                onClick={() => handleInsertFragment(fragment.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border border-silse-outline-variant/50 bg-silse-surface-container-low hover:bg-silse-surface-container-lowest hover:border-silse-primary/30 text-left transition-[transform,box-shadow,background-color] active:scale-[0.98] group"
                title={fragment.description}
              >
                <span className="text-base flex-shrink-0 group-hover:scale-[1.05] transition-transform">{fragment.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-silse-primary truncate group-hover:text-silse-on-surface transition-colors">
                    {fragment.title}
                  </div>
                  <div className="text-[9px] text-silse-on-surface-variant truncate">
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
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-[background-color,border-color,color] ${
              fragmentFilter === 'all'
                ? 'bg-silse-tertiary-container/15 border border-silse-tertiary-container/30 text-silse-tertiary'
                : 'bg-silse-surface-container-high/50 border border-silse-outline-variant/40 text-silse-on-surface-variant hover:text-silse-on-surface'
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
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-[background-color,border-color,color] flex items-center gap-0.5 ${
                  fragmentFilter === catKey
                    ? 'bg-silse-tertiary-container/15 border border-silse-tertiary-container/30 text-silse-tertiary'
                    : 'bg-silse-surface-container-high/50 border border-silse-outline-variant/40 text-silse-on-surface-variant hover:text-silse-on-surface'
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
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border border-silse-outline-variant/40 bg-silse-surface-container-low hover:bg-silse-surface-container-lowest hover:border-silse-primary/30 text-left transition-[transform,box-shadow,background-color] active:scale-[0.98] group"
                title={fragment.description}
              >
                <span className="text-base flex-shrink-0 group-hover:scale-[1.05] transition-transform">{fragment.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-silse-on-surface truncate group-hover:text-silse-primary transition-colors">
                    {fragment.title}
                  </div>
                  <div className="text-[9px] text-silse-on-surface-variant truncate">
                    {fragment.description}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-[8px] px-1 py-0 rounded bg-silse-surface-container-high/50 text-silse-on-surface-variant border border-silse-outline-variant/30">
                    {cat?.label.split(' ')[0] || fragment.category}
                  </span>
                  <span className="text-[8px] text-silse-on-surface-variant">
                    {fragment.blockCount} {isSederhana ? 'konten' : 'block'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredFragments.length === 0 && (
          <div className="text-[8px] text-silse-on-surface-variant text-center py-2">
            Tidak ada fragment untuk kategori ini
          </div>
        )}
      </div>

      {/* Insertion point indicator — shows when a block is selected */}
      {selectedBlockName && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-silse-primary-container/10 border border-silse-primary-container/25 text-[10px] text-silse-primary font-semibold">
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>arrow_downward</span>
          <span>Sisipkan setelah:</span>
          <span className="font-bold truncate">{selectedBlockName}</span>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-silse-on-surface-variant" style={{ fontSize: '14px' }} aria-hidden="true">search</span>
        <input
          id="add-block-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isSederhana ? 'Cari isi...' : 'Cari block...'}
          aria-label={isSederhana ? 'Cari isi' : 'Cari block'}
          aria-describedby="add-block-search-help"
          className="w-full h-7 pl-7 pr-2 text-[11px] text-silse-on-surface bg-silse-surface-container-low border border-silse-outline-variant/50 rounded-xl focus:border-silse-primary/50 focus:ring-1 focus:ring-silse-primary/20 focus:outline-none placeholder:text-silse-on-surface-variant/50"
        />
        <span id="add-block-search-help" className="sr-only">
          Ketik untuk mencari {isSederhana ? 'isi' : 'block'} berdasarkan nama, tipe, atau deskripsi
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
                      <span className="text-[8px] text-silse-on-surface-variant">({blocks.length})</span>
                    </div>
                    <div className="text-[7px] text-silse-on-surface-variant leading-tight">{config.desc}</div>
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
                      className="card-hover w-full flex items-center gap-2.5 p-2 rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/40 hover:border-silse-primary/30 active:scale-[0.97] transition-all text-left group"
                    >
                      <span className="text-lg flex-shrink-0 group-hover:scale-[1.05] transition-transform" aria-hidden="true">
                        {block.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-silse-on-surface truncate group-hover:text-silse-primary transition-colors">
                          {teacherTerm(block.name, 'sederhana')}
                        </div>
                        <div className="text-[8px] text-silse-on-surface-variant leading-tight line-clamp-2">
                          {block.description}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-silse-on-surface-variant group-hover:text-silse-primary transition-colors flex-shrink-0" style={{ fontSize: '16px' }}>add_circle_outline</span>
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
                      <span className="text-[8px] text-silse-on-surface-variant">({blocks.length})</span>
                    </div>
                    <div className="text-[7px] text-silse-on-surface-variant leading-tight">{config.description}</div>
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
                      className="card-hover w-full flex items-center gap-2.5 p-2 rounded-xl bg-silse-surface-container-low border border-silse-outline-variant/40 hover:border-silse-primary/30 active:scale-[0.97] transition-all text-left group"
                    >
                      <span className="text-lg flex-shrink-0 group-hover:scale-[1.05] transition-transform" aria-hidden="true">
                        {block.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-silse-on-surface truncate group-hover:text-silse-primary transition-colors">
                          {block.name}
                        </div>
                        <div className="text-[8px] text-silse-on-surface-variant leading-tight line-clamp-2">
                          {block.description}
                        </div>
                        {block.usedInTemplates.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {block.usedInTemplates.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[7px] px-1 py-0 rounded bg-silse-surface-container-high/50 text-silse-on-surface-variant"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-silse-on-surface-variant group-hover:text-silse-primary transition-colors flex-shrink-0" style={{ fontSize: '16px' }}>add_circle_outline</span>
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
          <div className="text-[10px] text-silse-on-surface-variant">
            Tidak ada {blockLabel.toLowerCase()} yang cocok dengan &quot;{search}&quot;
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="text-[8px] text-silse-on-surface-variant mt-2 pt-2 border-t border-silse-outline-variant/40">
        {selectedBlockName
          ? `${blockLabel} baru akan disisipkan setelah "${selectedBlockName}"`
          : `Klik ${blockLabel.toLowerCase()} untuk menambahkan ke halaman saat ini`}
      </div>
    </div>
  );
}
