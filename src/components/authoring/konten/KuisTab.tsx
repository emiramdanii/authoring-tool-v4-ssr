'use client';

import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthoringStore } from '@/store/authoring-store';
import type { KuisItem } from '@/store/authoring-store';
import { useDragSort } from '@/hooks/use-drag-sort';
import { Zap, HelpCircle, ClipboardList, Trash2 } from 'lucide-react';
import { RegenerateButton } from './RegenerateButton';
import { ItemRegenerateButton } from './ItemRegenerateButton';
import { regenerateKuis, regenerateKuisSchema, regenerateSingleKuisItem } from '../auto-generate/regenerate';
import { syncKuisToSchema } from '@/core/schema/sync-projection';

// ── Kuis Tab (Fully Functional) ────────────────────────────────
export function KuisTab() {
  const kuis = useAuthoringStore((s) => s.kuis);
  const atp = useAuthoringStore((s) => s.atp);
  const addKuis = useAuthoringStore((s) => s.addKuis);
  const deleteKuis = useAuthoringStore((s) => s.deleteKuis);
  const updateKuis = useAuthoringStore((s) => s.updateKuis);
  const updateKuisOpt = useAuthoringStore((s) => s.updateKuisOpt);
  const applyKuisPreset = useAuthoringStore((s) => s.applyKuisPreset);
  const reorderKuis = useAuthoringStore((s) => s.reorderKuis);
  const listRef = useRef<HTMLDivElement>(null);
  const letters = ['A', 'B', 'C', 'D'];

  // ── Phase 18.3d: Projection Live Sync ──────────────────────────
  // When kuis changes in the authoring store (projection), sync it
  // to the schema tree so the canvas reflects the edits.
  const prevKuisRef = useRef(kuis);
  useEffect(() => {
    // Only sync if kuis actually changed AND there's data
    if (kuis !== prevKuisRef.current && kuis.length > 0) {
      syncKuisToSchema(kuis);
    }
    prevKuisRef.current = kuis;
  }, [kuis]);

  const handleReorder = useCallback((newItems: KuisItem[]) => {
    const fromIndex = kuis.findIndex((item, i) => newItems[i] !== item);
    const toIndex = newItems.findIndex((item, i) => kuis[i] !== item);
    if (fromIndex >= 0 && toIndex >= 0) reorderKuis(fromIndex, toIndex);
  }, [kuis, reorderKuis]);

  const { dragHandlers } = useDragSort(kuis, handleReorder);

  const handleAdd = () => {
    addKuis();
    setTimeout(() => {
      const el = listRef.current?.lastElementChild;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleRegenerateKuis = async () => {
    const jumlahPertemuan = atp.jumlahPertemuan || 1;
    // Schema-first: regenerate SchemaBlock and apply to canvas directly
    regenerateKuisSchema(kuis.length || 10, jumlahPertemuan);
    // Also regenerate authoring store data (projection for Konten editor)
    const newKuis = regenerateKuis(kuis.length || 10, jumlahPertemuan);
    if (newKuis) {
      useAuthoringStore.setState({ kuis: newKuis as KuisItem[], dirty: true });
      toast.success(`❓ ${newKuis.length} soal kuis berhasil digenerate ulang`);
    } else {
      toast.error('Gagal regenerate — tidak ada teks sumber.');
      useAuthoringStore.getState().setActivePanel('autogen');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-app-muted">{kuis.length} soal kuis</span>
        <RegenerateButton
          label="Kuis"
          onRegenerate={handleRegenerateKuis}
          hasExistingData={kuis.length > 0}
        />
      </div>

      {/* Preset Cards */}
      <div className="bg-app-surface border border-app-border rounded-xl p-4">
        <h4 className="text-sm font-semibold text-app-primary mb-3"><Zap size={16} className="inline" /> Preset Kuis</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => applyKuisPreset('norma-10-soal')}
            className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-3 text-center hover:border-app-border transition-colors cursor-pointer"
          >
            <div className="text-xl mb-1"><HelpCircle size={20} className="inline" /></div>
            <div className="text-xs font-semibold text-app-primary">Norma – 10 Soal</div>
            <div className="text-[0.65rem] text-app-muted">Siap pakai, bisa diedit</div>
          </button>
          <button
            onClick={() => applyKuisPreset('blank')}
            className="bg-app-elevated/50 border border-app-border/50 rounded-lg p-3 text-center hover:border-app-border transition-colors cursor-pointer"
          >
            <div className="text-xl mb-1"><ClipboardList size={20} className="inline" /></div>
            <div className="text-xs font-semibold text-app-primary">Kosong</div>
            <div className="text-[0.65rem] text-app-muted">Buat dari nol</div>
          </button>
        </div>
      </div>

      {/* Quiz List */}
      <div ref={listRef} className="space-y-4">
        {!kuis.length ? (
          <div className="text-center py-10 bg-app-surface border border-dashed border-app-border/40 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
              <HelpCircle size={24} className="text-cyan-400" />
            </div>
            <p className="text-sm font-medium text-app-primary mb-1">Belum ada soal kuis</p>
            <p className="text-xs text-app-muted mb-4">Generate otomatis dari materi atau buat manual.</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRegenerateKuis}
                className="px-3 py-1.5 bg-app-accent hover:bg-app-accent/90 text-app-inverse text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Zap size={12} /> Auto-Generate
              </button>
              <button
                onClick={() => applyKuisPreset('norma-10-soal')}
                className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated/80 border border-app-border text-app-secondary text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Zap size={12} /> Preset 10 Soal
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
          kuis.map((soal, i) => (
            <div key={i} className={`bg-app-surface border border-app-border rounded-xl p-4 space-y-3 transition-all duration-200 ${
              dragHandlers.getIsDragged(i) ? 'opacity-50 scale-[0.98]' : ''
            } ${dragHandlers.getIsOver(i) ? 'border-t-2 border-t-app-accent' : ''}`}>
              {/* Header */}
              <div className="flex items-center gap-2">
                <span
                  onPointerDown={(e) => dragHandlers.onPointerDown(e, i)}
                  className="text-app-muted hover:text-app-secondary cursor-grab active:cursor-grabbing select-none text-lg leading-none px-1"
                  aria-label="Drag to reorder"
                >
                  ⠿
                </span>
                <div className="w-7 h-7 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-app-primary">Soal {i + 1}</span>
                <div className="ml-auto flex items-center gap-1">
                  <ItemRegenerateButton
                    title="Regenerate soal ini"
                    onRegenerate={async () => {
                      const jumlahPertemuan = atp.jumlahPertemuan || 1;
                      const newItem = regenerateSingleKuisItem(i, jumlahPertemuan);
                      if (newItem) {
                        // Update projection (authoring store)
                        const newKuis = [...kuis];
                        newKuis[i]! = { ...newItem, _id: kuis[i]!._id || newItem._id };
                        useAuthoringStore.setState({ kuis: newKuis, dirty: true });
                        // Sync the updated kuis projection to schema (canvas)
                        // Uses syncKuisToSchema which writes all kuis items to the schema block
                        syncKuisToSchema(newKuis);
                        toast.success(`🔄 Soal ${i + 1} berhasil digenerate ulang`);
                      } else {
                        toast.error('Gagal regenerate — tidak ada teks sumber.');
                      }
                    }}
                  />
                  <button
                    onClick={() => deleteKuis(i)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-app-muted hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-medium text-app-secondary mb-1.5">Pertanyaan</label>
                <textarea
                  className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 transition-colors resize-none"
                  rows={2}
                  placeholder="Tulis pertanyaan…"
                  value={soal.q}
                  onChange={(e) => updateKuis(i, 'q', e.target.value)}
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-xs font-medium text-app-secondary mb-2">
                  Pilihan Jawaban (pilih yang benar)
                </label>
                <div className="space-y-2">
                  {letters.map((letter, j) => (
                    <label
                      key={j}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                        soal.ans === j
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-app-elevated/50 border border-app-border/50 hover:border-app-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`kuis_ans_${i}`}
                        checked={soal.ans === j}
                        onChange={() => updateKuis(i, 'ans', j)}
                        className="accent-cyan-400"
                      />
                      <span className="text-xs font-bold text-cyan-400 w-4">{letter}.</span>
                      <input
                        className="flex-1 bg-transparent text-sm text-app-primary placeholder:text-app-muted outline-none"
                        placeholder={`Opsi ${letter}`}
                        value={soal.opts[j] || ''}
                        onChange={(e) => updateKuisOpt(i, j, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-medium text-app-secondary mb-1.5">Penjelasan / Feedback</label>
                <input
                  className="w-full bg-app-elevated border border-app-border rounded-lg px-3 py-2 text-sm text-app-primary placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50 focus:border-app-accent/50 transition-colors"
                  placeholder="Mengapa jawaban ini benar?"
                  value={soal.ex}
                  onChange={(e) => updateKuis(i, 'ex', e.target.value)}
                />
              </div>

              {/* Pertemuan tag — dynamic dari ATP jumlahPertemuan */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-app-secondary">Pertemuan</label>
                <select
                  value={soal.pertemuan ?? ''}
                  onChange={(e) => updateKuis(i, 'pertemuan', e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-app-elevated border border-app-border rounded-lg px-2 py-1 text-xs text-app-primary focus:outline-none focus:ring-2 focus:ring-app-accent/50"
                >
                  <option value="">— Semua —</option>
                  {Array.from({ length: atp.jumlahPertemuan || 8 }, (_, n) => n + 1).map(n => (
                    <option key={n} value={n}>Pertemuan {n}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors"
      >
        ＋ Tambah Soal
      </button>
    </div>
  );
}
