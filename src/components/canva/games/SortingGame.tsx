'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   SORTING GAME (Urutkan / Klasifikasi)
   ═══════════════════════════════════════════════════════════════ */
export function SortingGame({ data, compact, onComplete }: GameComponentProps) {
  const kategori = (data.kategori as Array<Record<string, unknown>>) || [];
  const items = (data.items as Array<Record<string, unknown>>) || [];
  const validItems = items.filter(i => i.teks);

  const [sorted, setSorted] = useState<Record<string, string[]>>({});
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const [wrong, setWrong] = useState<string | null>(null);
  const reported = useRef(false);

  useEffect(() => { if (phase === 'done' && !reported.current && onComplete) { reported.current = true; onComplete(validItems.length, validItems.length); } }, [phase]);

  const handleDrop = useCallback((itemText: string, catId: string) => {
    const correctCat = validItems.find(i => i.teks === itemText)?.kategori as string;
    if (correctCat === catId) {
      setSorted(prev => ({
        ...prev,
        [catId]: [...(prev[catId] || []), itemText],
      }));
      const newSorted = { ...sorted, [catId]: [...(sorted[catId] || []), itemText] };
      const totalSorted = Object.values(newSorted).flat().length;
      if (totalSorted === validItems.length) setPhase('done');
    } else {
      setWrong(catId);
      setTimeout(() => setWrong(null), 500);
    }
  }, [validItems, sorted]);

  if (validItems.length === 0) return <EmptyState icon="🔢" label="Urutkan" compact={compact} />;

  const unsorted = validItems.filter(i => {
    return !Object.values(sorted).flat().includes(i.teks as string);
  });

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Tersortir!</div>
        <button onClick={() => { setSorted({}); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">
          Ulangi
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="text-[9px] font-bold text-cyan-400 mb-1">🔢 Klasifikasi</div>
      {/* Unsorted items */}
      <div className="flex flex-wrap gap-1 mb-2">
        {unsorted.map((item, i) => (
          <span key={i} className={`${compact ? 'text-[8px]' : 'text-[9px]'} px-2 py-0.5 bg-white/10 border border-white/15 rounded text-cyan-200`}>
            {item.teks as string}
          </span>
        ))}
      </div>
      {/* Category drop zones */}
      <div className="flex-1 min-h-0 space-y-1 overflow-y-auto">
        {kategori.map((cat) => {
          const catId = cat.id as string;
          const catColor = cat.color as string || '#3ecfcf';
          const sortedItems = sorted[catId] || [];
          return (
            <div key={catId} className={`rounded border p-1.5 min-h-[32px] transition-colors ${wrong === catId ? 'bg-red-500/20 border-red-400/40' : 'bg-white/5 border-white/10'}`}
              style={{ borderLeftColor: catColor, borderLeftWidth: 3 }}>
              <div className="text-[9px] font-bold mb-0.5" style={{ color: catColor }}>{cat.label as string}</div>
              <div className="flex flex-wrap gap-0.5">
                {sortedItems.map((t, j) => (
                  <span key={j} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">{t}</span>
                ))}
              </div>
              {/* Buttons for unsorted items */}
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {unsorted.map((item, j) => (
                  <button key={j} onClick={() => handleDrop(item.teks as string, catId)}
                    className="text-[7px] px-1 py-0.5 rounded bg-white/5 border border-dashed border-white/15 text-white/40 hover:bg-white/10 hover:text-white/60 cursor-pointer transition-colors">
                    + {item.teks as string}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
