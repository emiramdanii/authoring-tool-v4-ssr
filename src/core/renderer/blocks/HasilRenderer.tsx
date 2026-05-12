'use client';

import React from 'react';
import { Trophy, Star, Target, RotateCcw, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import type { HasilBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';

export function HasilRenderer({ block, tokens, interactive, isEditing, pageIndex }: {
  block: HasilBlock; tokens: TokenResolver; interactive?: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  // ── Read actual scores from interactive store ───────────────
  const totalScore = useInteractiveStore(s => s.totalScore());
  const totalMax = useInteractiveStore(s => s.totalMax());
  const totalPct = useInteractiveStore(s => s.totalPct());
  const allComplete = useInteractiveStore(s => s.allPagesComplete());
  const scores = useInteractiveStore(s => s.scores);
  const resetAllScores = useInteractiveStore(s => s.resetAllScores);

  // Use real scores when available, fallback to placeholder for design mode
  const displayPct = allComplete && totalMax > 0 ? totalPct : (totalMax > 0 ? totalPct : 75);
  const displayScore = totalScore;
  const displayMax = totalMax > 0 ? totalMax : 100;

  // Determine performance tier
  const tier = displayPct >= 90 ? 'excellent' : displayPct >= 75 ? 'good' : displayPct >= 50 ? 'fair' : 'needs-practice';
  const tierConfig = {
    'excellent': { icon: <Trophy size={24} className="inline" />, label: 'Luar Biasa!', color: 'y', emoji: '🏆' },
    'good': { icon: <Star size={24} className="inline" />, label: 'Hebat!', color: 'g', emoji: '⭐' },
    'fair': { icon: <Target size={24} className="inline" />, label: 'Cukup Baik', color: 'c', emoji: '🎯' },
    'needs-practice': { icon: <Zap size={24} className="inline" />, label: 'Terus Berlatih!', color: 'o', emoji: '💪' },
  }[tier];
  const tierColor = tierConfig.color;

  // Play completion sound when results are shown in interactive mode
  React.useEffect(() => {
    if (interactive && allComplete) {
      playSound('complete');
    }
  }, [interactive, allComplete]);

  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const subtitleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'subtitle',
    value: block.subtitle ?? '',
    tag: 'p',
  });

  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      {/* Performance tier badge */}
      <div className="mb-4 px-4 py-1.5 rounded-full"
        style={{
          background: tokens.colorAlpha(tierColor, 0.15),
          border: '1px solid ' + tokens.colorAlpha(tierColor, 0.35),
          boxShadow: '0 0 12px ' + tokens.colorAlpha(tierColor, 0.15),
        }}>
        <span className="font-extrabold" style={{ fontSize: '12px', color: tokens.color(tierColor) }}>
          {tierConfig.emoji} {tierConfig.label}
        </span>
      </div>

      {/* Circle progress - improved with tier color */}
      <div className="relative w-36 h-36 mb-5">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full"
          style={{
            boxShadow: '0 0 40px ' + tokens.colorAlpha(tierColor, 0.2) + ', 0 0 80px ' + tokens.colorAlpha(tierColor, 0.08),
          }} />
        <div className="w-36 h-36 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${tokens.color(tierColor)} 0%, ${tokens.color(tierColor)} ${displayPct}%, ${tokens.colorAlpha(tierColor, 0.1)} ${displayPct}%, ${tokens.colorAlpha(tierColor, 0.1)} 100%)`,
          }}>
          <div className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: tokens.color('bg2') }}>
            <div className="text-center">
              <div className="text-3xl mb-1" style={{ animation: 'float 3s ease-in-out infinite' }}>{tierConfig.emoji}</div>
              <div className="text-2xl font-black" style={{ color: tokens.color(tierColor) }}>{displayPct}%</div>
              <div className="text-[9px] font-bold" style={{ color: tokens.muted(0.6) }}>
                {displayScore}/{displayMax} poin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="font-black text-lg" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black text-lg"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
        />
      </h2>
      <InlineTextEditor
        {...subtitleEditor}
        className="mt-1 max-w-[320px]"
        style={{ fontSize: '13px', color: tokens.muted(0.8) }}
        placeholder="Ketik subtitle..."
      />

      {/* Score breakdown badges */}
      <div className="mt-5 flex gap-3">
        <div className="px-4 py-2.5 rounded-xl text-center min-w-[70px]"
          style={{
            background: tokens.colorAlpha('g', 0.12),
            border: '1px solid ' + tokens.colorAlpha('g', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <CheckCircle2 size={14} className="inline mb-0.5" style={{ color: tokens.color('g') }} />
          <div className="font-extrabold" style={{ color: tokens.color('g'), fontSize: '11px' }}>Benar</div>
          <div className="font-black text-sm" style={{ color: tokens.color('g') }}>
            {scores.filter(s => s.completed).length}
          </div>
        </div>
        <div className="px-4 py-2.5 rounded-xl text-center min-w-[70px]"
          style={{
            background: tokens.colorAlpha('y', 0.12),
            border: '1px solid ' + tokens.colorAlpha('y', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <Star size={14} className="inline mb-0.5" style={{ color: tokens.color('y') }} />
          <div className="font-extrabold" style={{ color: tokens.color('y'), fontSize: '11px' }}>Skor</div>
          <div className="font-black text-sm" style={{ color: tokens.color('y') }}>{displayScore}</div>
        </div>
        <div className="px-4 py-2.5 rounded-xl text-center min-w-[70px]"
          style={{
            background: tokens.colorAlpha('c', 0.12),
            border: '1px solid ' + tokens.colorAlpha('c', 0.3),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <Target size={14} className="inline mb-0.5" style={{ color: tokens.color('c') }} />
          <div className="font-extrabold" style={{ color: tokens.color('c'), fontSize: '11px' }}>Maks</div>
          <div className="font-black text-sm" style={{ color: tokens.color('c') }}>{displayMax}</div>
        </div>
      </div>

      {/* Motivational message based on score */}
      <div className="mt-4 p-3 rounded-xl max-w-[300px]"
        style={{
          background: tokens.colorAlpha(tierColor, 0.08),
          border: '1px solid ' + tokens.colorAlpha(tierColor, 0.2),
          borderLeft: '3px solid ' + tokens.color(tierColor),
        }}>
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="inline flex-shrink-0 mt-0.5" style={{ color: tokens.color(tierColor) }} />
          <div className="leading-relaxed text-left" style={{ fontSize: '12px', color: tokens.muted(0.8) }}>
            {displayPct >= 90
              ? 'Kamu menguasai materi dengan sangat baik! Pertahankan prestasimu dan terus belajar!'
              : displayPct >= 75
                ? 'Pemahamanmu sudah baik! Masih ada ruang untuk berkembang lebih lagi.'
                : displayPct >= 50
                  ? 'Usahamu cukup baik! Coba pelajari kembali bagian yang masih kurang dipahami.'
                  : 'Jangan menyerah! Pelajari kembali materi dan coba lagi. Kamu pasti bisa!'}
          </div>
        </div>
      </div>

      {/* Reset button in interactive mode */}
      {interactive && allComplete && (
        <button className="mt-5 px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
          onClick={() => {
            resetAllScores();
            playSound('click');
          }}
          style={{
            fontSize: '13px',
            background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
            color: tokens.color('bg'),
            boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
          }}>
          <RotateCcw size={14} className="inline" /> Ulangi Semua
        </button>
      )}
    </div>
  );
}
