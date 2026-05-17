'use client';

import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { DiskusiData, DiskusiPertanyaan } from '@/store/authoring-store';
import { RegenerateButton } from './RegenerateButton';
import { ItemRegenerateButton } from './ItemRegenerateButton';
import { regenerateDiskusi, regenerateDiskusiSchema, regenerateSingleDiskusiQuestion } from '../auto-generate/regenerate';
import { syncDiskusiToSchema } from '@/core/schema/sync-projection';
import { Zap, MessageSquare, Trash2, Plus } from 'lucide-react';
import { INPUT_CLS, TEXTAREA_CLS, FieldLabel, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

// ── Diskusi Tab — Edit discussion questions with RegenerateButton ──
export function DiskusiTab() {
  const diskusi = useAuthoringStore((s) => s.diskusi);
  const meta = useAuthoringStore((s) => s.meta);
  const tp = useAuthoringStore((s) => s.tp);
  const updateDiskusi = useAuthoringStore((s) => s.updateDiskusi);
  const addDiskusiPertanyaan = useAuthoringStore((s) => s.addDiskusiPertanyaan);
  const removeDiskusiPertanyaan = useAuthoringStore((s) => s.removeDiskusiPertanyaan);
  const updateDiskusiPertanyaan = useAuthoringStore((s) => s.updateDiskusiPertanyaan);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Phase 18.3d: Projection Live Sync ──────────────────────────
  const prevDiskusiRef = useRef(diskusi);
  useEffect(() => {
    if (diskusi !== prevDiskusiRef.current && diskusi.pertanyaan.length > 0) {
      syncDiskusiToSchema(diskusi);
    }
    prevDiskusiRef.current = diskusi;
  }, [diskusi]);

  const handleRegenerateDiskusi = async () => {
    // Schema-first: regenerate SchemaBlocks and apply to canvas directly
    const schemaBlock = regenerateDiskusiSchema(tp, {
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    // Also regenerate authoring store data (projection for Konten editor)
    const newDiskusi = regenerateDiskusi(tp, {
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    if (newDiskusi) {
      useAuthoringStore.setState({ diskusi: newDiskusi as DiskusiData, dirty: true });
      toast.success(`🗣️ Diskusi berhasil digenerate ulang (${newDiskusi.pertanyaan.length} pertanyaan)`);
    } else {
      toast.error('Gagal regenerate — tidak ada teks sumber.');
      useAuthoringStore.getState().setActivePanel('autogen');
    }
  };

  const handleAdd = useCallback(() => {
    addDiskusiPertanyaan();
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [addDiskusiPertanyaan]);

  const ICON_OPTIONS = ['💭', '🤔', '🗣️', '👥', '✋', '💡', '🎯', '📝'];

  return (
    <div className="space-y-4">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{diskusi.pertanyaan.length} pertanyaan diskusi</span>
        <RegenerateButton
          label="Diskusi"
          onRegenerate={handleRegenerateDiskusi}
          hasExistingData={diskusi.pertanyaan.length > 0}
        />
      </div>

      {/* Title & Intro */}
      <div className="space-y-3 bg-app-surface border border-app-border rounded-xl p-4">
        <div>
          <FieldLabel>Judul Diskusi</FieldLabel>
          <input
            className={INPUT_CLS}
            maxLength={MAX_TITLE}
            placeholder="Diskusi tentang..."
            value={diskusi.title}
            onChange={(e) => updateDiskusi({ title: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Pengantar</FieldLabel>
          <textarea
            className={TEXTAREA_CLS}
            rows={2}
            maxLength={MAX_BODY}
            placeholder="Instruksi untuk siswa..."
            value={diskusi.intro}
            onChange={(e) => updateDiskusi({ intro: e.target.value })}
          />
        </div>
      </div>

      {/* Empty state */}
      {diskusi.pertanyaan.length === 0 ? (
        <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={24} className="text-purple-400" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada pertanyaan diskusi</p>
          <p className="text-xs text-app-muted mb-4">Generate otomatis dari materi atau buat manual.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRegenerateDiskusi}
              className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Zap size={12} /> Auto-Generate
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated/80 border border-app-border text-app-secondary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              ＋ Manual
            </button>
          </div>
        </div>
      ) : (
        /* Question list */
        <div ref={listRef} className="space-y-3">
          {diskusi.pertanyaan.map((q, i) => (
            <div key={i} className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
              {/* Question header */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{q.icon || '💭'}</span>
                <span className="text-sm font-medium text-app-primary">Pertanyaan {i + 1}</span>
                <div className="ml-auto flex items-center gap-1">
                  <ItemRegenerateButton
                    title="Regenerate pertanyaan ini"
                    onRegenerate={async () => {
                      const newQ = regenerateSingleDiskusiQuestion(i, tp, {
                        judulPertemuan: meta.judulPertemuan,
                        namaBab: meta.namaBab,
                      });
                      if (newQ) {
                        updateDiskusiPertanyaan(i, newQ);
                        toast.success(`🔄 Pertanyaan diskusi ${i + 1} berhasil digenerate ulang`);
                      } else {
                        toast.error('Gagal regenerate — tidak ada teks sumber.');
                      }
                    }}
                  />
                  <button
                    onClick={() => removeDiskusiPertanyaan(i)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Icon selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-app-muted">Ikon:</span>
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => updateDiskusiPertanyaan(i, { icon })}
                    className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-colors ${
                      q.icon === icon ? 'bg-app-accent/15 border border-app-accent/40' : 'bg-app-elevated/50 border border-app-border/50 hover:border-app-border'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Label */}
              <div>
                <FieldLabel>Label</FieldLabel>
                <input
                  className={INPUT_CLS}
                  maxLength={MAX_SHORT_TEXT}
                  placeholder={`Pertanyaan ${i + 1}`}
                  value={q.label}
                  onChange={(e) => updateDiskusiPertanyaan(i, { label: e.target.value })}
                />
              </div>

              {/* Question text */}
              <div>
                <FieldLabel>Teks Pertanyaan</FieldLabel>
                <textarea
                  className={TEXTAREA_CLS}
                  rows={3}
                  maxLength={MAX_BODY}
                  placeholder="Tulis pertanyaan diskusi..."
                  value={q.teks}
                  onChange={(e) => updateDiskusiPertanyaan(i, { teks: e.target.value })}
                />
              </div>

              {/* Hint/petunjuk */}
              <div>
                <FieldLabel>Petunjuk Jawaban</FieldLabel>
                <input
                  className={INPUT_CLS}
                  maxLength={MAX_BODY}
                  placeholder="Petunjuk untuk membantu siswa..."
                  value={q.petunjuk}
                  onChange={(e) => updateDiskusiPertanyaan(i, { petunjuk: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add question button */}
      {diskusi.pertanyaan.length > 0 && (
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Tambah Pertanyaan
        </button>
      )}
    </div>
  );
}
