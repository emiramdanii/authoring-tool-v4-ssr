'use client';

import { useState, useEffect, useRef } from 'react';
import { EmptyState } from './shared';
import type { GameComponentProps } from './shared';

/* ═══════════════════════════════════════════════════════════════
   DRAG & DROP GAME (Seret & Letakkan) — Efficiency-based scoring with 50% floor
   Score = max(ceil(items * 0.5), items - wrongAttempts)
   ═══════════════════════════════════════════════════════════════ */
export function DragDropGame({ data, compact, interactive, onComplete }: GameComponentProps) {
  const items = ((data.items as Array<Record<string, unknown>>) || []).filter(i => i.teks);
  const targets = ((data.target || data.targets) as Array<Record<string, unknown>>) || [];
  const [placed, setPlaced] = useState<Record<string, Array<{ idx: number; teks: string }>>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [phase, setPhase] = useState<'play' | 'done'>('play');
  const reported = useRef(false);

  // Phase 9 fix: Reset game state when data changes
  const dataKey = JSON.stringify(items.map(i => ({ t: String(i.teks || ''), tgt: String(i.target || i.kategori || '') })));
  useEffect(() => {
    setPlaced({});
    setSelectedIdx(null);
    setWrongAttempts(0);
    setPhase('play');
    reported.current = false;
  }, [dataKey]);

  // Efficiency-based scoring with 50% floor: score = max(ceil(items*0.5), items - wrongAttempts)
  useEffect(() => {
    if (phase === 'done' && !reported.current && onComplete) {
      reported.current = true;
      const score = Math.max(Math.ceil(items.length * 0.5), items.length - wrongAttempts);
      onComplete(score, items.length);
    }
  }, [phase, onComplete, items.length, wrongAttempts]);

  // Track placed item indices for accurate unplaced computation
  const placedIndices = new Set(Object.values(placed).flat().map(p => p.idx));
  const unplaced = items.filter((_, i) => !placedIndices.has(i));

  const handleItemSelect = (idx: number) => {
    setSelectedIdx(idx);
  };

  const handleDrop = (targetId: string) => {
    if (selectedIdx === null) return;
    const item = items[selectedIdx];
    if (!item) return;
    const correctTarget = String(item.target || item.kategori || '');
    if (correctTarget === targetId) {
      const newPlaced = { ...placed, [targetId]: [...(placed[targetId] || []), { idx: selectedIdx, teks: String(item.teks) }] };
      setPlaced(newPlaced);
      setSelectedIdx(null);
      if (Object.values(newPlaced).flat().length === items.length) setPhase('done');
    } else {
      setWrongAttempts(w => w + 1);
      setSelectedIdx(null);
    }
  };

  const handleRemove = (targetId: string, idx: number) => {
    const newPlaced = { ...placed };
    newPlaced[targetId] = (newPlaced[targetId] || []).filter(it => it.idx !== idx);
    if (!newPlaced[targetId].length) delete newPlaced[targetId];
    setPlaced(newPlaced);
  };

  if (items.length === 0 || targets.length === 0) return <EmptyState icon="🖐️" label="Seret & Letakkan" compact={compact} interactive={interactive} />;

  const finalScore = Math.max(Math.ceil(items.length * 0.5), items.length - wrongAttempts);
  const scorePct = items.length > 0 ? Math.round((finalScore / items.length) * 100) : 0;

  if (phase === 'done') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cyan-500/10 p-3 text-center">
        <span className="text-2xl">🎉</span>
        <div className="text-[11px] font-bold text-cyan-300 mt-1">Semua Terpasang!</div>
        <div className={`text-[14px] font-black mt-0.5 ${scorePct >= 85 ? 'text-emerald-400' : scorePct >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{scorePct}%</div>
        <div className="text-[9px] text-cyan-400/60 mt-0.5">{items.length} item · {wrongAttempts > 0 ? wrongAttempts + ' salah' : 'Sempurna!'}</div>
        <button onClick={() => { setPlaced({}); setSelectedIdx(null); setWrongAttempts(0); setPhase('play'); reported.current = false; }}
          className="mt-2 px-3 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 rounded text-[10px] font-bold text-cyan-200 transition-colors border border-cyan-500/30">Ulangi</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cyan-500/10 p-2">
      <div className="flex justify-between text-[9px] text-cyan-400 mb-1">
        <span className="font-bold">🖐️ Seret & Letakkan</span>
        <span>{wrongAttempts > 0 && <span className="text-red-400">{wrongAttempts} salah · </span>}{Object.values(placed).flat().length}/{items.length}</span>
      </div>
      {/* Draggable items */}
      <div className="flex flex-wrap gap-1 mb-2 min-h-[20px]">
        {unplaced.map((it, i) => {
          const origIdx = items.indexOf(it);
          return (
          <button key={origIdx} onClick={() => handleItemSelect(origIdx)}
            className={`text-[9px] px-2 py-1 rounded-md border font-semibold transition-all ${
              selectedIdx === origIdx
                ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200 ring-1 ring-cyan-400/30'
                : 'bg-cyan-500/15 border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer'
            }`}>
            {String(it.teks)}
          </button>
          );
        })}
        {unplaced.length === 0 && <span className="text-[8px] text-white/25">Semua item sudah ditempatkan</span>}
      </div>
      {/* Drop targets */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
        {targets.map((tgt, i) => {
          const tid = String(tgt.id || tgt.label || `t${i}`);
          const tgtItems = placed[tid] || [];
          const isActive = selectedIdx !== null;
          return (
            <div key={`target-${tid}`}
              onClick={() => handleDrop(tid)}
              className={`rounded-lg border-2 border-dashed p-2 min-h-[32px] transition-all ${
                isActive ? 'border-cyan-400/30 bg-cyan-500/5 cursor-pointer hover:border-cyan-400/50' : 'border-app-border/10 bg-app-elevated/5'
              }`}>
              <div className="text-[9px] font-bold text-app-primary/50 mb-1">{String(tgt.label || tid)}</div>
              <div className="flex flex-wrap gap-1 min-h-[16px]">
                {tgtItems.length > 0 ? tgtItems.map((it) => (
                  <span key={`placed-${it.idx}`} onClick={e => { e.stopPropagation(); handleRemove(tid, it.idx); }}
                    className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold cursor-pointer hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300 transition-colors">
                    {it.teks}
                  </span>
                )) : (
                  <span className="text-[7px] text-white/20 italic">Letakkan item di sini...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
