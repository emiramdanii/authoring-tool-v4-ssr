'use client';

// ═══════════════════════════════════════════════════════════════
// ADD BLOCK PANEL — Block palette for adding schema blocks from registry
// ═══════════════════════════════════════════════════════════════
// Shows all registered block types grouped by category.
// Search/filter at top, click to add block to current page.

import { useState, useMemo } from 'react';
import { Search, Plus, Blocks } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import {
  getAllBlockDefinitions,
  type BlockDefinition,
} from '@/core/registry/SceneRegistry';
import { ensurePageSchema } from '@/core/schema/ensure-schema';

// ── Category display config ──────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; colorClass: string; order: number }> = {
  layout:     { label: 'Layout',      icon: '📐', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', order: 0 },
  content:    { label: 'Konten',       icon: '📝', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', order: 1 },
  interactive:{ label: 'Interaktif',   icon: '🎮', colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20', order: 2 },
  navigation: { label: 'Navigasi',     icon: '🧭', colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', order: 3 },
  feedback:   { label: 'Umpan Balik',  icon: '🏆', colorClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', order: 4 },
  decoration: { label: 'Dekorasi',     icon: '🎨', colorClass: 'text-pink-400 bg-pink-500/10 border-pink-500/20', order: 5 },
};

export default function AddBlockPanel() {
  const addSchemaBlock = useCanvaStore(s => s.addSchemaBlock);
  const pages = useCanvaStore(s => s.pages);
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
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

  // Get all block definitions, filter by search
  const allBlocks = useMemo(() => getAllBlockDefinitions(), []);

  const filteredBlocks = useMemo(() => {
    if (!search.trim()) return allBlocks;
    const q = search.toLowerCase().trim();
    return allBlocks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [allBlocks, search]);

  // Group filtered blocks by category
  const groupedBlocks = useMemo(() => {
    const groups: Record<string, BlockDefinition[]> = {};
    for (const block of filteredBlocks) {
      const cat = block.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(block);
    }
    // Sort categories by display order
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const orderA = CATEGORY_CONFIG[a]?.order ?? 99;
      const orderB = CATEGORY_CONFIG[b]?.order ?? 99;
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

      {/* Search input */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari block..."
          className="w-full h-7 pl-7 pr-2 text-[10px] text-app-primary bg-app-elevated/60 border border-app-border/30 rounded-lg focus:border-amber-500/50 focus:outline-none placeholder:text-app-muted"
        />
      </div>

      {/* Category groups */}
      <div className="space-y-3">
        {groupedBlocks.map(([category, blocks]) => {
          const config = CATEGORY_CONFIG[category] || {
            label: category,
            icon: '📦',
            colorClass: 'text-app-secondary bg-app-elevated/10 border-app-border/20',
          };

          return (
            <div key={category}>
              {/* Category header */}
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>{config.icon}</span>
                <span className={config.colorClass.split(' ')[0]}>{config.label}</span>
                <span className="text-app-muted font-normal">({blocks.length})</span>
              </div>

              {/* Block cards */}
              <div className="space-y-1">
                {blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => addSchemaBlock(block.type)}
                    className="card-hover w-full flex items-center gap-2.5 p-2 rounded-xl bg-app-elevated/40 border border-app-border/20 active:scale-[0.97] transition-transform text-left group"
                  >
                    {/* Block icon */}
                    <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      {block.icon}
                    </span>

                    {/* Block info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-app-primary truncate group-hover:text-amber-300 transition-colors">
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
                      className="text-app-muted group-hover:text-amber-400 transition-colors flex-shrink-0"
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
        Klik block untuk menambahkan ke halaman saat ini
      </div>
    </div>
  );
}
