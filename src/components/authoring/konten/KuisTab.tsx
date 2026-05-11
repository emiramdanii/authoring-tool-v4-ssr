'use client';

import { useRef, useCallback } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import type { KuisItem } from '@/store/authoring-store';
import { useDragSort } from '@/hooks/use-drag-sort';
import { Zap, HelpCircle, ClipboardList, Trash2 } from 'lucide-react';

// ── Kuis Tab (Fully Functional) ────────────────────────────────
export function KuisTab() {
  const kuis = useAuthoringStore((s) => s.kuis);
  const addKuis = useAuthoringStore((s) => s.addKuis);
  const deleteKuis = useAuthoringStore((s) => s.deleteKuis);
  const updateKuis = useAuthoringStore((s) => s.updateKuis);
  const updateKuisOpt = useAuthoringStore((s) => s.updateKuisOpt);
  const applyKuisPreset = useAuthoringStore((s) => s.applyKuisPreset);
  const reorderKuis = useAuthoringStore((s) => s.reorderKuis);
  const listRef = useRef<HTMLDivElement>(null);
  const letters = ['A', 'B', 'C', 'D'];

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

  return (
    <div className="space-y-4">
      {/* Preset Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-zinc-200 mb-3"><Zap size={16} className="inline" /> Preset Kuis</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => applyKuisPreset('norma-10-soal')}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <div className="text-xl mb-1"><HelpCircle size={20} className="inline" /></div>
            <div className="text-xs font-semibold text-zinc-200">Norma – 10 Soal</div>
            <div className="text-[0.65rem] text-zinc-500">Siap pakai, bisa diedit</div>
          </button>
          <button
            onClick={() => applyKuisPreset('blank')}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-center hover:border-zinc-600 transition-colors cursor-pointer"
          >
            <div className="text-xl mb-1"><ClipboardList size={20} className="inline" /></div>
            <div className="text-xs font-semibold text-zinc-200">Kosong</div>
            <div className="text-[0.65rem] text-zinc-500">Buat dari nol</div>
          </button>
        </div>
      </div>

      {/* Quiz List */}
      <div ref={listRef} className="space-y-4">
        {!kuis.length ? (
          <div className="text-center py-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <HelpCircle size={28} className="text-zinc-500 mb-2" />
            <p className="text-sm text-zinc-500">Belum ada soal.</p>
          </div>
        ) : (
          kuis.map((soal, i) => (
            <div key={i} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 transition-all duration-200 ${
              dragHandlers.getIsDragged(i) ? 'opacity-50 scale-[0.98]' : ''
            } ${dragHandlers.getIsOver(i) ? 'border-t-2 border-t-amber-500' : ''}`}>
              {/* Header */}
              <div className="flex items-center gap-2">
                <span
                  onPointerDown={(e) => dragHandlers.onPointerDown(e, i)}
                  className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing select-none text-lg leading-none px-1"
                  aria-label="Drag to reorder"
                >
                  ⠿
                </span>
                <div className="w-7 h-7 rounded-md bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-zinc-200">Soal {i + 1}</span>
                <button
                  onClick={() => deleteKuis(i)}
                  className="ml-auto text-zinc-500 hover:text-red-400 transition-colors text-sm"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pertanyaan</label>
                <textarea
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors resize-none"
                  rows={2}
                  placeholder="Tulis pertanyaan…"
                  value={soal.q}
                  onChange={(e) => updateKuis(i, 'q', e.target.value)}
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                  Pilihan Jawaban (pilih yang benar)
                </label>
                <div className="space-y-2">
                  {letters.map((letter, j) => (
                    <label
                      key={j}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                        soal.ans === j
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600'
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
                        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
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
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Penjelasan / Feedback</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors"
                  placeholder="Mengapa jawaban ini benar?"
                  value={soal.ex}
                  onChange={(e) => updateKuis(i, 'ex', e.target.value)}
                />
              </div>

              {/* Pertemuan tag */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-400">Pertemuan</label>
                <select
                  value={soal.pertemuan ?? ''}
                  onChange={(e) => updateKuis(i, 'pertemuan', e.target.value ? Number(e.target.value) : undefined)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">— Semua —</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
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
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
      >
        ＋ Tambah Soal
      </button>
    </div>
  );
}
