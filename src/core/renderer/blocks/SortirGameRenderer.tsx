'use client';

import React from 'react';
import { FolderOpen, RotateCcw, Package, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { SortirGameBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

/** Inner kolom component so hooks are not called in loops */
function SortirKolom({ kolomDef, kolomIndex, blockId, tokens, selected, kolomItems, onKolomClick }: {
  kolomDef: SortirGameBlock['kolom'][number];
  kolomIndex: number;
  blockId: string;
  tokens: TokenResolver;
  selected: string | null;
  kolomItems: string[];
  onKolomClick: () => void;
}) {
  const labelEditor = useInlineEditor({
    blockId,
    fieldKey: `kolom.${kolomIndex}.label`,
    value: kolomDef.label ?? '',
    tag: 'span',
  });

  return (
    <div onClick={onKolomClick}
      className="rounded-xl p-3.5 min-h-[70px] border-2 transition-all cursor-pointer"
      style={{
        borderColor: selected ? tokens.colorAlpha(kolomDef.color, 0.5) : tokens.colorAlpha(kolomDef.color, 0.2),
        background: selected ? tokens.colorAlpha(kolomDef.color, 0.08) : tokens.colorAlpha(kolomDef.color, 0.04),
        boxShadow: selected ? '0 0 16px ' + tokens.colorAlpha(kolomDef.color, 0.15) : tokens.raw.shadow.card,
      }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha(kolomDef.color, 0.2) }}>
          <FolderOpen size={12} className="inline" />
        </div>
        <div className="font-extrabold uppercase tracking-wider"
          style={{ fontSize: '12px', color: tokens.color(kolomDef.color) }}>
          <InlineTextEditor
            {...labelEditor}
            className="text-[10px] font-extrabold uppercase tracking-wider"
            style={{ color: tokens.color(kolomDef.color), fontSize: 'inherit' }}
            placeholder="Ketik label kolom..."
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {kolomItems.map((text, i) => (
          <span key={i} className="px-2.5 py-1 rounded-full font-bold"
            style={{
              fontSize: '11px',
              background: tokens.colorAlpha(kolomDef.color, 0.2),
              color: tokens.color(kolomDef.color),
              border: '1px solid ' + tokens.colorAlpha(kolomDef.color, 0.3),
            }}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SortirGameRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: SortirGameBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
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
  const [wrongFeedback, setWrongFeedback] = React.useState<{ itemId: string; kolomId: string; message: string } | null>(null);
  const [attempts, setAttempts] = React.useState<Record<string, number>>({});

  // ── Interactive store: score reporting ──────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const totalPlaced = poolState.filter(p => p.placed).length;
  const totalItems = pool.length;
  const isCompleted = totalItems > 0 && totalPlaced >= totalItems;

  // Report score when completed
  React.useEffect(() => {
    if (isCompleted && interactive && block.id) {
      const totalAttempts = Object.values(attempts).reduce((s, a) => s + a, 0);
      const accuracy = totalAttempts > 0 ? Math.round((totalItems / totalAttempts) * 100) : 100;
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: accuracy,
        maxScore: 100,
        completed: true,
      });
      playSound('complete');
      fireConfetti({ count: 40 });
    }
  }, [isCompleted]);

  // Auto-dismiss wrong feedback after 2.5 seconds
  React.useEffect(() => {
    if (wrongFeedback) {
      const timer = setTimeout(() => setWrongFeedback(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [wrongFeedback]);

  const handlePoolClick = (id: string) => {
    if (!interactive) return;
    setSelected(prev => prev === id ? null : id);
    playSound('tap');
  };

  const handleKolomClick = (kolomId: string) => {
    if (!interactive || !selected) return;
    const item = poolState.find(p => p.id === selected);
    if (!item) return;

    const isCorrect = item.category === kolomId;
    if (isCorrect) {
      setPoolState(prev => prev.map(p => p.id === selected ? { ...p, placed: true } : p));
      setKolomItems(prev => ({ ...prev, [kolomId]: [...(prev[kolomId] || []), item.text] }));
      playSound('correct');
    } else {
      // ── Educational feedback on wrong answer ────────────────
      const correctKolom = kolom.find(k => k.id === item.category);
      const wrongKolom = kolom.find(k => k.id === kolomId);
      const correctLabel = correctKolom?.label ?? 'kategori yang benar';
      const wrongLabel = wrongKolom?.label ?? kolomId;
      setWrongFeedback({
        itemId: item.id,
        kolomId,
        message: `"${item.text}" bukan termasuk ${wrongLabel}. Coba pindahkan ke kolom yang tepat!`,
      });
      // Track attempts
      setAttempts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      playSound('incorrect');
    }
    setSelected(null);
  };

  // ══ COMPLETION SCREEN ═══════════════════════════════════════
  if (isCompleted) {
    const totalAttempts = Object.values(attempts).reduce((s, a) => s + a, 0);
    const perfectScore = totalAttempts <= totalItems;

    return (
      <div className="text-center p-5 rounded-2xl"
        style={{
          background: tokens.color('bg'),
          border: '2px solid ' + tokens.colorAlpha('y', 0.3),
          boxShadow: tokens.raw.shadow.elevated,
        }}>
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
          {perfectScore ? '🌟' : '🎮'}
        </div>
        <div className="font-black text-lg mb-1" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('y') }}>
          {perfectScore ? 'Sempurna!' : 'Semua Benar!'}
        </div>
        <div className="mb-2" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          {totalItems} item berhasil dikelompokkan dengan tepat!
        </div>
        {totalAttempts > totalItems && (
          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: tokens.colorAlpha('c', 0.1), border: '1px solid ' + tokens.colorAlpha('c', 0.25) }}>
            <Info size={12} className="inline" style={{ color: tokens.color('c') }} />
            <span style={{ fontSize: '11px', color: tokens.color('c') }}>
              {totalAttempts} percobaan — akurasi {Math.round((totalItems / totalAttempts) * 100)}%
            </span>
          </div>
        )}
        {interactive && (
          <button className="mt-3 px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => {
              setPoolState(pool.map(p => ({ ...p, placed: false })));
              const init: Record<string, string[]> = {};
              kolom.forEach(k => { init[k.id] = []; });
              setKolomItems(init);
              setSelected(null);
              setWrongFeedback(null);
              setAttempts({});
              playSound('click');
            }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
            }}>
            <RotateCcw size={14} className="inline" /> Ulangi Game
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Wrong answer feedback toast */}
      {wrongFeedback && (
        <div className="mb-3 p-3 rounded-xl flex items-start gap-2"
          style={{
            background: tokens.colorAlpha('r', 0.12),
            border: '1px solid ' + tokens.colorAlpha('r', 0.35),
            boxShadow: '0 4px 16px ' + tokens.colorAlpha('r', 0.15),
            animation: 'fadeIn 0.3s ease-out',
          }}>
          <XCircle size={14} className="inline flex-shrink-0 mt-0.5" style={{ color: tokens.color('r') }} />
          <div className="leading-relaxed" style={{ fontSize: '12px', color: tokens.color('r') }}>
            {wrongFeedback.message}
          </div>
        </div>
      )}

      {/* Pool */}
      <div className="flex flex-wrap gap-2.5 min-h-[50px] p-4 border-2 border-dashed rounded-xl mb-4"
        style={{
          borderColor: tokens.colorAlpha('y', 0.25),
          background: tokens.colorAlpha('y', 0.04),
        }}>
        <div className="w-full font-extrabold uppercase tracking-wider mb-2" style={{ fontSize: '11px', color: tokens.color('y') }}>
          <Package size={14} className="inline" /> Pilih Item ({totalPlaced}/{totalItems})
        </div>
        {poolState.filter(p => !p.placed).map(p => (
          <button key={p.id} onClick={() => handlePoolClick(p.id)}
            className="px-3.5 py-2 rounded-full font-extrabold transition-all hover:scale-105"
            style={{
              background: selected === p.id ? tokens.colorAlpha('y', 0.2) : tokens.subtleBg(0.07),
              border: '2px solid ' + (selected === p.id ? tokens.color('y') : tokens.subtleBorder(0.15)),
              boxShadow: selected === p.id ? '0 0 16px ' + tokens.colorAlpha('y', 0.35) : tokens.raw.shadow.card,
              fontSize: '12px',
              animation: selected === p.id ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}>
            {p.text}
          </button>
        ))}
      </div>

      {/* Kolom grid */}
      <div className="grid grid-cols-2 gap-3">
        {kolom.map((k, i) => (
          <SortirKolom
            key={k.id}
            kolomDef={k}
            kolomIndex={i}
            blockId={block.id!}
            tokens={tokens}
            selected={selected}
            kolomItems={kolomItems[k.id] || []}
            onKolomClick={() => handleKolomClick(k.id)}
          />
        ))}
      </div>
    </div>
  );
}
