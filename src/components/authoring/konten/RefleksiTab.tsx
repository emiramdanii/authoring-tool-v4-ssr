'use client';

import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { RefleksiData, RefleksiPertanyaan } from '@/store/authoring-store';
import { RegenerateButton } from './RegenerateButton';
import { regenerateRefleksi, regenerateRefleksiSchema } from '../auto-generate/regenerate';
import { Zap, NotebookPen, Trash2, Plus } from 'lucide-react';
import { INPUT_CLS, TEXTAREA_CLS, FieldLabel, MAX_TITLE, MAX_BODY, MAX_SHORT_TEXT } from './shared';

// ── Refleksi Tab — Edit reflection questions with RegenerateButton ──
export function RefleksiTab() {
  const refleksi = useAuthoringStore((s) => s.refleksi);
  const meta = useAuthoringStore((s) => s.meta);
  const updateRefleksi = useAuthoringStore((s) => s.updateRefleksi);
  const addRefleksiPertanyaan = useAuthoringStore((s) => s.addRefleksiPertanyaan);
  const removeRefleksiPertanyaan = useAuthoringStore((s) => s.removeRefleksiPertanyaan);
  const updateRefleksiPertanyaan = useAuthoringStore((s) => s.updateRefleksiPertanyaan);
  const listRef = useRef<HTMLDivElement>(null);

  const handleRegenerateRefleksi = async () => {
    // Schema-first: regenerate SchemaBlocks and apply to canvas directly
    const schemaBlock = regenerateRefleksiSchema({
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    // Also regenerate authoring store data (projection for Konten editor)
    const newRefleksi = regenerateRefleksi({
      judulPertemuan: meta.judulPertemuan,
      namaBab: meta.namaBab,
    });
    if (newRefleksi) {
      useAuthoringStore.setState({ refleksi: newRefleksi as RefleksiData, dirty: true });
      toast.success(`🪞 Refleksi berhasil digenerate ulang (${newRefleksi.pertanyaan.length} pertanyaan)`);
    } else {
      toast.error('Gagal regenerate — tidak ada teks sumber.');
      useAuthoringStore.getState().setActivePanel('autogen');
    }
  };

  const handleAdd = useCallback(() => {
    addRefleksiPertanyaan();
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [addRefleksiPertanyaan]);

  const ICON_OPTIONS = ['🪞', '💭', '🎯', '📝', '🔄', '👩‍🏫', '🔍', '❓'];
  const COLOR_OPTIONS = [
    { key: 'c', label: 'Biru', class: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
    { key: 'g', label: 'Hijau', class: 'bg-green-500/15 border-green-500/30 text-green-400' },
    { key: 'y', label: 'Kuning', class: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' },
    { key: 'p', label: 'Ungu', class: 'bg-purple-500/15 border-purple-500/30 text-purple-400' },
    { key: 'r', label: 'Merah', class: 'bg-red-500/15 border-red-500/30 text-red-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{refleksi.pertanyaan.length} pertanyaan refleksi</span>
        <RegenerateButton
          label="Refleksi"
          onRegenerate={handleRegenerateRefleksi}
          hasExistingData={refleksi.pertanyaan.length > 0}
        />
      </div>

      {/* Title & Intro */}
      <div className="space-y-3 bg-app-surface border border-app-border rounded-xl p-4">
        <div>
          <FieldLabel>Judul Refleksi</FieldLabel>
          <input
            className={INPUT_CLS}
            maxLength={MAX_TITLE}
            placeholder="Refleksi Pembelajaran"
            value={refleksi.title}
            onChange={(e) => updateRefleksi({ title: e.target.value })}
          />
        </div>
        <div>
          <FieldLabel>Pengantar</FieldLabel>
          <textarea
            className={TEXTAREA_CLS}
            rows={2}
            maxLength={MAX_BODY}
            placeholder="Instruksi refleksi untuk siswa..."
            value={refleksi.intro}
            onChange={(e) => updateRefleksi({ intro: e.target.value })}
          />
        </div>
      </div>

      {/* Empty state */}
      {refleksi.pertanyaan.length === 0 ? (
        <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <NotebookPen size={24} className="text-amber-400" />
          </div>
          <p className="text-sm font-medium text-app-primary mb-1">Belum ada pertanyaan refleksi</p>
          <p className="text-xs text-app-muted mb-4">Generate otomatis dari materi atau buat manual.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRegenerateRefleksi}
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
          {refleksi.pertanyaan.map((q, i) => (
            <div key={i} className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
              {/* Question header */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{q.icon || '🪞'}</span>
                <span className="text-sm font-medium text-app-primary">Refleksi {i + 1}</span>
                <button
                  onClick={() => removeRefleksiPertanyaan(i)}
                  className="ml-auto text-app-muted hover:text-red-400 transition-colors text-sm"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </div>

              {/* Icon selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-app-muted">Ikon:</span>
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => updateRefleksiPertanyaan(i, { icon })}
                    className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-colors ${
                      q.icon === icon ? 'bg-app-accent/15 border border-app-accent/40' : 'bg-app-elevated/50 border border-app-border/50 hover:border-app-border'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Color selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-app-muted">Warna:</span>
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => updateRefleksiPertanyaan(i, { warna: c.key })}
                    className={`px-2 py-0.5 rounded-md text-[0.65rem] font-medium border transition-colors ${
                      q.warna === c.key ? c.class : 'bg-app-elevated/50 border-app-border/50 text-app-muted hover:border-app-border'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Question text */}
              <div>
                <FieldLabel>Teks Pertanyaan</FieldLabel>
                <textarea
                  className={TEXTAREA_CLS}
                  rows={3}
                  maxLength={MAX_BODY}
                  placeholder="Tulis pertanyaan refleksi..."
                  value={q.teks}
                  onChange={(e) => updateRefleksiPertanyaan(i, { teks: e.target.value })}
                />
              </div>

              {/* Hint/petunjuk */}
              <div>
                <FieldLabel>Petunjuk Jawaban</FieldLabel>
                <input
                  className={INPUT_CLS}
                  maxLength={MAX_BODY}
                  placeholder="Petunjuk untuk membantu siswa merefleksikan..."
                  value={q.petunjuk}
                  onChange={(e) => updateRefleksiPertanyaan(i, { petunjuk: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Penugasan section */}
      {refleksi.pertanyaan.length > 0 && (
        <div className="bg-app-surface border border-app-border rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-app-primary">📝 Tugas Refleksi (opsional)</h4>
          <div>
            <FieldLabel>Judul Tugas</FieldLabel>
            <input
              className={INPUT_CLS}
              maxLength={MAX_TITLE}
              placeholder="Tugas Refleksi"
              value={refleksi.penugasan?.judul || ''}
              onChange={(e) => updateRefleksi({ penugasan: { judul: e.target.value, isi: refleksi.penugasan?.isi || '', contoh: refleksi.penugasan?.contoh } })}
            />
          </div>
          <div>
            <FieldLabel>Isi Tugas</FieldLabel>
            <textarea
              className={TEXTAREA_CLS}
              rows={3}
              maxLength={MAX_BODY}
              placeholder="Tulis instruksi tugas refleksi..."
              value={refleksi.penugasan?.isi || ''}
              onChange={(e) => updateRefleksi({ penugasan: { judul: refleksi.penugasan?.judul || 'Tugas Refleksi', isi: e.target.value, contoh: refleksi.penugasan?.contoh } })}
            />
          </div>
          <div>
            <FieldLabel>Contoh Jawaban</FieldLabel>
            <input
              className={INPUT_CLS}
              maxLength={MAX_BODY}
              placeholder="Contoh jawaban refleksi..."
              value={refleksi.penugasan?.contoh || ''}
              onChange={(e) => updateRefleksi({ penugasan: { judul: refleksi.penugasan?.judul || 'Tugas Refleksi', isi: refleksi.penugasan?.isi || '', contoh: e.target.value } })}
            />
          </div>
        </div>
      )}

      {/* Add question button */}
      {refleksi.pertanyaan.length > 0 && (
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> Tambah Refleksi
        </button>
      )}
    </div>
  );
}
