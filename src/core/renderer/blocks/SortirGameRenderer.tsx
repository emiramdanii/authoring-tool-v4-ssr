'use client';

import React from 'react';
import type { SortirGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function SortirGameRenderer({ block, tokens, interactive, isCompact }: {
  block: SortirGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean;
}) {
  const pool = block.pool || [];
  const kolom = block.kolom || [];

  const [poolState, setPoolState] = React.useState(pool.map(p => ({ ...p, placed: false })));
  const [kolomItems, setKolomItems] = React.useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    kolom.forEach(k => { init[k.id] = []; });
    return init;
  });
  const [selected, setSelected] = React.useState<string | null>(null);

  const totalPlaced = poolState.filter(p => p.placed).length;
  const totalItems = pool.length;
  const isCompleted = totalItems > 0 && totalPlaced >= totalItems;

  const handlePoolClick = (id: string) => {
    if (!interactive) return;
    setSelected(prev => prev === id ? null : id);
  };

  const handleKolomClick = (kolomId: string) => {
    if (!interactive || !selected) return;
    const item = poolState.find(p => p.id === selected);
    if (!item) return;

    const isCorrect = item.category === kolomId;
    if (isCorrect) {
      setPoolState(prev => prev.map(p => p.id === selected ? { ...p, placed: true } : p));
      setKolomItems(prev => ({ ...prev, [kolomId]: [...(prev[kolomId] || []), item.text] }));
    }
    setSelected(null);
  };

  // ══ COMPLETION SCREEN ═══════════════════════════════════════
  if (isCompleted) {
    return (
      <div className="text-center p-5 rounded-2xl"
        style={{
          background: tokens.color('bg'),
          border: '2px solid ' + tokens.colorAlpha('y', 0.3),
          boxShadow: tokens.raw.shadow.elevated,
        }}>
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>🎮</div>
        <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('y') }}>
          Semua Benar!
        </div>
        <div className="text-[11px] text-white/55 mb-4">
          {totalItems} item berhasil dikelompokkan dengan tepat!
        </div>
        {interactive && (
          <button className="px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
            onClick={() => {
              setPoolState(pool.map(p => ({ ...p, placed: false })));
              const init: Record<string, string[]> = {};
              kolom.forEach(k => { init[k.id] = []; });
              setKolomItems(init);
              setSelected(null);
            }}
            style={{
              background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
            }}>
            🔄 Ulangi Game
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Pool */}
      <div className="flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl mb-4"
        style={{
          borderColor: tokens.colorAlpha('y', 0.25),
          background: tokens.colorAlpha('y', 0.04),
        }}>
        <div className="w-full text-[9px] font-extrabold uppercase tracking-wider mb-2" style={{ color: tokens.color('y') }}>
          📦 Pilih Item ({totalPlaced}/{totalItems})
        </div>
        {poolState.filter(p => !p.placed).map(p => (
          <button key={p.id} onClick={() => handlePoolClick(p.id)}
            className="px-3.5 py-2 rounded-full text-[10px] font-extrabold transition-all hover:scale-105"
            style={{
              background: selected === p.id ? tokens.colorAlpha('y', 0.2) : 'rgba(255,255,255,.07)',
              border: '2px solid ' + (selected === p.id ? tokens.color('y') : 'rgba(255,255,255,.15)'),
              boxShadow: selected === p.id ? '0 0 16px ' + tokens.colorAlpha('y', 0.35) : tokens.raw.shadow.card,
              animation: selected === p.id ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}>
            {p.text}
          </button>
        ))}
      </div>

      {/* Kolom grid */}
      <div className="grid grid-cols-2 gap-3">
        {kolom.map(k => (
          <div key={k.id} onClick={() => handleKolomClick(k.id)}
            className="rounded-xl p-3.5 min-h-[70px] border-2 transition-all cursor-pointer"
            style={{
              borderColor: selected ? tokens.colorAlpha(k.color, 0.5) : tokens.colorAlpha(k.color, 0.2),
              background: selected ? tokens.colorAlpha(k.color, 0.08) : tokens.colorAlpha(k.color, 0.04),
              boxShadow: selected ? '0 0 16px ' + tokens.colorAlpha(k.color, 0.15) : tokens.raw.shadow.card,
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: tokens.colorAlpha(k.color, 0.2) }}>
                <span className="text-[10px]">📂</span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider"
                style={{ color: tokens.color(k.color) }}>
                {k.label}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(kolomItems[k.id] || []).map((text, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-[9px] font-bold"
                  style={{
                    background: tokens.colorAlpha(k.color, 0.2),
                    color: tokens.color(k.color),
                    border: '1px solid ' + tokens.colorAlpha(k.color, 0.3),
                  }}>
                  {text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
