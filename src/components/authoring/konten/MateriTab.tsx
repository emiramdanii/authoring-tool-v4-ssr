'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { MateriBlok } from '@/store/authoring-store';
import { BLOCK_TYPES, blockTypeInfo, ChevronIcon, TypeBadge } from './shared';
import { BlockEditor } from './block-editors';
import { Trash2, FileEdit } from 'lucide-react';

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
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all"
      style={{ borderLeftWidth: '3px', borderLeftColor: info.color }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <TypeBadge tipe={blok.tipe} />
        <span className="flex-1 text-sm text-zinc-300 truncate">
          {blok.judul || info.label}
        </span>
        <span className="text-xs text-zinc-600">#{idx + 1}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-800">
          {/* Action buttons */}
          <div className="flex items-center gap-1 mb-3 pt-2">
            <button
              onClick={onMoveUp}
              disabled={idx === 0}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-zinc-800 transition-colors"
              title="Pindah ke atas"
            >
              ↑ Naik
            </button>
            <button
              onClick={onMoveDown}
              disabled={idx === total - 1}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-md hover:bg-zinc-800 transition-colors"
              title="Pindah ke bawah"
            >
              ↓ Turun
            </button>
            <div className="flex-1" />
            <button
              onClick={onRemove}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
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

  return (
    <div className="space-y-4">
      {/* Block count */}
      <div className="text-xs text-zinc-500">
        {materi.blok.length} blok materi
      </div>

      {/* Empty state */}
      {materi.blok.length === 0 ? (
        <div className="text-center py-8 bg-zinc-900 border border-zinc-800 rounded-xl">
          <FileEdit size={28} className="text-zinc-500 mb-2" />
          <p className="text-sm text-zinc-500">Belum ada blok materi. Tambahkan blok di bawah.</p>
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-zinc-200 mb-3">➕ Tambah Blok</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleAdd(t.id)}
              className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-2.5 text-center hover:border-zinc-600 transition-colors cursor-pointer"
              title={`Tambah blok ${t.label}`}
            >
              <div className="text-lg mb-0.5">{t.icon}</div>
              <div className="text-[0.65rem] text-zinc-400">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
