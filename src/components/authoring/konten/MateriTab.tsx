'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { MateriBlok } from '@/store/authoring-store';
import { BLOCK_TYPES, blockTypeInfo, ChevronIcon, TypeBadge } from './shared';
import { BlockEditor } from './block-editors';
import { Trash2, FileEdit, BookOpen, Zap } from 'lucide-react';
import { RegenerateButton } from './RegenerateButton';
import { regenerateMateri, regenerateMateriSchema } from '../auto-generate/regenerate';
import { toast } from 'sonner';

// ── Blok Card ──────────────────────────────────────────────────
function BlokCard({
  blok,
  idx,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  blok: MateriBlok;
  idx: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
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
              onClick={onRemove}
              className="px-2 py-1 text-xs text-app-muted hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
              title="Hapus blok"
            >
              <Trash2 size={12} className="inline" /> Hapus
            </button>
          </div>

          {/* Editor form */}
          <BlockEditor blok={blok} idx={idx} />
        </div>
      )}
    </div>
  );
}

// ── Materi Tab ─────────────────────────────────────────────────
export function MateriTab() {
  const materi = useAuthoringStore((s) => s.materi);
  const meta = useAuthoringStore((s) => s.meta);
  const addMateriBlok = useAuthoringStore((s) => s.addMateriBlok);
  const removeMateriBlok = useAuthoringStore((s) => s.removeMateriBlok);
  const moveMateriBlok = useAuthoringStore((s) => s.moveMateriBlok);
  const listRef = useRef<HTMLDivElement>(null);

  const handleAdd = useCallback(
    (tipe: string) => {
      addMateriBlok(tipe);
      setTimeout(() => {
        const el = listRef.current?.lastElementChild;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    },
    [addMateriBlok],
  );

  const handleRegenerateMateri = async () => {
    // Schema-first: regenerate SchemaBlocks and apply to canvas directly
    const schemaBlocks = regenerateMateriSchema({
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    // Also regenerate authoring store data (projection for Konten editor)
    const bloks = regenerateMateri({
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    if (bloks) {
      useAuthoringStore.setState({ materi: { blok: bloks as MateriBlok[] }, dirty: true });
      toast.success(`📖 ${bloks.length} blok materi berhasil digenerate ulang`);
    } else {
      toast.error('Gagal regenerate — tidak ada teks sumber.');
      useAuthoringStore.getState().setActivePanel('autogen');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-app-muted">
          {materi.blok.length} blok materi
        </div>
        <RegenerateButton
          label="Materi"
          onRegenerate={handleRegenerateMateri}
          hasExistingData={materi.blok.length > 0}
        />
      </div>

      {/* Empty state */}
      {materi.blok.length === 0 ? (
        <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={24} className="text-teal-400" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada materi</p>
          <p className="text-xs text-app-muted mb-4">Gunakan Auto-Generate atau buat manual</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRegenerateMateri}
              className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Zap size={12} /> Auto-Generate
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
          {materi.blok.map((blok, i) => (
            <BlokCard
              key={i}
              blok={blok}
              idx={i}
              total={materi.blok.length}
              onMoveUp={() => moveMateriBlok(i, i - 1)}
              onMoveDown={() => moveMateriBlok(i, i + 1)}
              onRemove={() => removeMateriBlok(i)}
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
