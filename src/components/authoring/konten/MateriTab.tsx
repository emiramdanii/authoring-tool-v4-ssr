'use client';

import { useState, useRef, useCallback } from 'react';
import { useSchemaMateri, useSchemaContext } from '@/hooks/use-schema-navigator';
import type { MateriBlok } from '@/store/authoring-store';
import { BLOCK_TYPES, blockTypeInfo, ChevronIcon, TypeBadge } from './shared';
import { BlockEditor } from './block-editors';
// All icons migrated to Material Symbols Outlined
import { RegenerateButton } from './RegenerateButton';
import { regenerateMateri, regenerateMateriSchema, regenerateSingleMateriBlok } from '../auto-generate/regenerate';
import { toast } from 'sonner';

// ── Blok Card ──────────────────────────────────────────────────
function BlokCard({
  blok,
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onRegenerate,
  onUpdatePertemuan,
  onUpdateTabGroup,
  jumlahPertemuan,
}: {
  blok: MateriBlok;
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onRegenerate: () => void;
  onUpdatePertemuan: (val: number | undefined) => void;
  onUpdateTabGroup: (val: string | undefined) => void;
  jumlahPertemuan: number;
}) {
  const [open, setOpen] = useState(true);
  const info = blockTypeInfo(blok.tipe);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="bg-app-surface border border-app-border rounded-xl overflow-hidden transition-all"
      style={{ borderLeftWidth: '3px', borderLeftColor: info.color }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-app-elevated/30 transition-colors"
      >
        <TypeBadge tipe={blok.tipe} />
        <span className="flex-1 text-sm text-app-secondary truncate">
          {blok.judul || info.label}
        </span>
        <span className="text-xs text-app-muted">#{idx + 1}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-app-border">
          {/* Action buttons */}
          <div className="flex items-center gap-1 mb-3 pt-2">
            <button
              onClick={onMoveUp}
              disabled={idx === 0}
              className="px-2 py-1 text-xs text-app-muted hover:text-app-primary disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-app-elevated transition-colors"
              title="Pindah ke atas"
            >
              ↑ Naik
            </button>
            <button
              onClick={onMoveDown}
              disabled={idx === total - 1}
              className="px-2 py-1 text-xs text-app-muted hover:text-app-primary disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-app-elevated transition-colors"
              title="Pindah ke bawah"
            >
              ↓ Turun
            </button>
            <div className="flex-1" />
            <button
              onClick={onRegenerate}
              className="px-2 py-1 text-xs text-app-muted hover:text-cyan-400 rounded-md hover:bg-cyan-500/10 transition-colors"
              title="Regenerate blok ini"
            >
              <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>refresh</span> Regen
            </button>
            <button
              onClick={onRemove}
              className="px-2 py-1 text-xs text-app-muted hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
              title="Hapus blok"
            >
              <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>delete</span> Hapus
            </button>
          </div>

          {/* Editor form — schema-driven writes */}
          <BlockEditor blok={blok} idx={idx} />

          {/* Pertemuan tag — same pattern as KuisTab */}
          {jumlahPertemuan > 1 && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-app-border/40">
              <label className="text-xs font-medium text-app-secondary">Pertemuan</label>
              <select
                value={blok.pertemuan ?? ''}
                onChange={(e) => onUpdatePertemuan(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-app-elevated border border-app-border rounded-lg px-2 py-1 text-xs text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50"
              >
                <option value="">— Semua —</option>
                {Array.from({ length: jumlahPertemuan }, (_, n) => n + 1).map(n => (
                  <option key={n} value={n}>Pertemuan {n}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tab Group — for organizing blocks into tabs */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-app-border/40">
            <label className="text-xs font-medium text-app-secondary whitespace-nowrap">Grup Tab</label>
            <input
              type="text"
              value={blok.tabGroup ?? ''}
              onChange={(e) => onUpdateTabGroup(e.target.value || undefined)}
              placeholder="— tanpa grup —"
              className="bg-app-elevated border border-app-border rounded-lg px-2 py-1 text-xs text-app-primary placeholder:text-app-muted/50 focus:outline-none focus:ring-2 focus:ring-app-accent/50 flex-1 min-w-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Materi Tab ─────────────────────────────────────────────────
export function MateriTab() {
  // ═══ Phase 3: Schema-first reads via useSchemaMateri ═══
  const { bloks, locations, hasSections, addBlok, removeBlok, moveBlok, updateBlok, replaceAllBloks } = useSchemaMateri();

  const { meta, atp, goToAutoGen } = useSchemaContext();
  const listRef = useRef<HTMLDivElement>(null);
  const jumlahPertemuan = atp.jumlahPertemuan || 1;

  // NOTE: syncMateriToSchema useEffect REMOVED — schema is now the source of truth.
  // Writes go directly through applyGuidedSchemaPatch via useSchemaMateri.updateBlok.

  const handleAdd = useCallback(
    (tipe: string) => {
      addBlok(tipe);
      setTimeout(() => {
        const el = listRef.current?.lastElementChild;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    },
    [addBlok],
  );

  const handleRegenerateMateri = async () => {
    // Schema-first: regenerate SchemaBlocks and apply to canvas directly
    const schemaBlocks = regenerateMateriSchema({
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    // Also regenerate authoring store data (projection for backward compat)
    const blokResults = regenerateMateri({
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    if (blokResults) {
      // Write to schema via the hook's replaceAllBloks
      replaceAllBloks(blokResults as MateriBlok[]);
      toast.success(`📖 ${blokResults.length} blok materi berhasil digenerate ulang`);
    } else {
      toast.error('Gagal regenerate — tidak ada teks sumber.');
      goToAutoGen();
    }
  };

  // Empty state — show when no materi-section exists or no materi-blok blocks
  const isEmpty = bloks.length === 0;

  return (
    <div className="space-y-4">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-app-muted">
          {bloks.length} blok materi
        </div>
        <RegenerateButton
          label="Materi"
          onRegenerate={handleRegenerateMateri}
          hasExistingData={bloks.length > 0}
        />
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-teal-400" style={ { fontSize: '24px' } }>menu_book</span>
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada materi</p>
          <p className="text-xs text-app-muted mb-4">Gunakan Auto-Generate atau tambah blok manual.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRegenerateMateri}
              className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>bolt</span> Auto-Generate
            </button>
            <button
              onClick={() => handleAdd('teks')}
              className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated/80 border border-app-border text-app-secondary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              Buat Manual
            </button>
          </div>
        </div>
      ) : (
        /* Block list */
        <div ref={listRef} className="space-y-3">
          {bloks.map((blok, i) => (
            <BlokCard
              key={locations[i]?.blokBlock?.id || i}
              blok={blok}
              idx={i}
              total={bloks.length}
              onMoveUp={() => moveBlok(i, i - 1)}
              onMoveDown={() => moveBlok(i, i + 1)}
              onRemove={() => removeBlok(i)}
              onRegenerate={() => {
                const newBlok = regenerateSingleMateriBlok(i, {
                  judulPertemuan: meta.judulPertemuan,
                  namaBab: meta.namaBab,
                });
                if (newBlok) {
                  // Update individual blok via schema patch
                  updateBlok(i, 'judul', newBlok.judul);
                  updateBlok(i, 'isi', newBlok.isi);
                  if (newBlok.butir) updateBlok(i, 'butir', newBlok.butir);
                  if (newBlok.baris) updateBlok(i, 'baris', newBlok.baris);
                  if (newBlok.langkah) updateBlok(i, 'langkah', newBlok.langkah);
                  if (newBlok.items) updateBlok(i, 'items', newBlok.items);
                  toast.success(`🔄 Blok materi ${i + 1} berhasil digenerate ulang`);
                } else {
                  toast.error('Gagal regenerate — tidak ada teks sumber.');
                }
              }}
              onUpdatePertemuan={(val) => updateBlok(i, 'pertemuan', val)}
              onUpdateTabGroup={(val) => updateBlok(i, 'tabGroup', val)}
              jumlahPertemuan={jumlahPertemuan}
            />
          ))}
        </div>
      )}

      {/* Add Block Grid */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-app-primary mb-3">➕ Tambah Blok</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleAdd(t.id)}
              className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-2.5 text-center hover:border-app-border transition-colors cursor-pointer"
              title={`Tambah blok ${t.label}`}
            >
              <div className="text-lg mb-0.5">{t.icon}</div>
              <div className="text-[0.65rem] text-app-secondary">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
