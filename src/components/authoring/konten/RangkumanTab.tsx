'use client';

import { useRef, useCallback } from 'react';
import { ListChecks, BookMarked, Quote, Plus, Trash2 } from 'lucide-react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { RangkumanData } from '@/store/authoring/types';
import { INPUT_CLS, TEXTAREA_CLS, FieldLabel, MAX_TITLE, MAX_BODY } from './shared';

// ── Rangkuman Tab — Edit summary/conclusion section with dynamic poin list ──
export function RangkumanTab() {
  const rangkuman = useAuthoringStore((s) => s.rangkuman);
  const updateRangkuman = useAuthoringStore((s) => s.updateRangkuman);
  const poinListRef = useRef<HTMLDivElement>(null);

  // ── Poin (key points) array helpers ──
  const handleAddPoin = useCallback(() => {
    const newPoin = [...rangkuman.poin, ''];
    updateRangkuman({ poin: newPoin });
    setTimeout(() => {
      const el = poinListRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [rangkuman.poin, updateRangkuman]);

  const handleRemovePoin = useCallback((index: number) => {
    const newPoin = rangkuman.poin.filter((_, i) => i !== index);
    updateRangkuman({ poin: newPoin });
  }, [rangkuman.poin, updateRangkuman]);

  const handleUpdatePoin = useCallback((index: number, value: string) => {
    const newPoin = [...rangkuman.poin];
    newPoin[index] = value;
    updateRangkuman({ poin: newPoin });
  }, [rangkuman.poin, updateRangkuman]);

  // Accent color options for the closing statement
  const ACCENT_COLORS = [
    { key: 'teal', label: 'Teal', class: 'bg-teal-500/15 border-teal-500/30 text-teal-400' },
    { key: 'amber', label: 'Amber', class: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
    { key: 'rose', label: 'Rose', class: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
    { key: 'emerald', label: 'Emerald', class: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{rangkuman.poin.length} poin rangkuman</span>
      </div>

      {/* Title & Intro */}
      <div className="space-y-3 bg-app-surface border border-app-border rounded-xl p-4">
        <div>
          <FieldLabel>Judul Rangkuman</FieldLabel>
          <input
            className={INPUT_CLS}
            maxLength={MAX_TITLE}
            placeholder="Rangkuman"
            value={rangkuman.title}
            onChange={(e) => updateRangkuman({ title: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Pengantar</FieldLabel>
          <textarea
            className={TEXTAREA_CLS}
            rows={2}
            maxLength={MAX_BODY}
            placeholder="Pengantar untuk rangkuman materi..."
            value={rangkuman.intro}
            onChange={(e) => updateRangkuman({ intro: e.target.value })}
          />
        </div>
      </div>

      {/* Poin-Poin Kunci — Key Points List */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <ListChecks size={16} className="text-teal-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Poin-Poin Kunci</h4>
            <p className="text-xs text-app-muted">Poin-poin penting dari materi</p>
          </div>
        </div>

        {rangkuman.poin.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-app-border/40 rounded-lg">
            <p className="text-sm text-app-muted mb-3">Belum ada poin rangkuman</p>
            <button
              onClick={handleAddPoin}
              className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={12} /> Tambah Poin
            </button>
          </div>
        ) : (
          <div ref={poinListRef} className="space-y-2">
            {rangkuman.poin.map((poin, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-teal-500/10 text-teal-400 text-xs font-bold flex items-center justify-center mt-1.5">
                  {i + 1}
                </span>
                <textarea
                  className={TEXTAREA_CLS + ' flex-1'}
                  rows={2}
                  maxLength={MAX_BODY}
                  placeholder={`Poin ${i + 1}...`}
                  value={poin}
                  onChange={(e) => handleUpdatePoin(i, e.target.value)}
                />
                <button
                  onClick={() => handleRemovePoin(i)}
                  className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-all mt-1.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Poin button */}
      {rangkuman.poin.length > 0 && (
        <button
          onClick={handleAddPoin}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Tambah Poin
        </button>
      )}

      {/* Tips — Study Tips or Reminders */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BookMarked size={16} className="text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Tips Belajar</h4>
            <p className="text-xs text-app-muted">Tips atau pengingat untuk siswa</p>
          </div>
        </div>
        <textarea
          className={TEXTAREA_CLS}
          rows={2}
          maxLength={MAX_BODY}
          placeholder="Tulis tips atau pengingat untuk siswa..."
          value={rangkuman.tips}
          onChange={(e) => updateRangkuman({ tips: e.target.value })}
        />
      </div>

      {/* Closing Statement */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Quote size={16} className="text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-app-primary">Penutup</h4>
            <p className="text-xs text-app-muted">Pernyataan penutup yang memotivasi (opsional)</p>
          </div>
        </div>
        <textarea
          className={TEXTAREA_CLS}
          rows={2}
          maxLength={MAX_BODY}
          placeholder="Pernyataan penutup untuk memotivasi siswa..."
          value={rangkuman.closingStatement || ''}
          onChange={(e) => updateRangkuman({ closingStatement: e.target.value })}
        />
      </div>
    </div>
  );
}
