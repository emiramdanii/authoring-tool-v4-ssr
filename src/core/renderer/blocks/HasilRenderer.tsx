'use client';

import React from 'react';
import { Trophy, Star, Target, RotateCcw, Sparkles, CheckCircle2, Zap, Award, TrendingUp } from 'lucide-react';
import type { HasilBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, StepCompletionOverlay, MicroInteraction } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiCelebration } from '@/lib/confetti';

// ═══════════════════════════════════════════════════════════════════
// HASIL RENDERER (SKORING) — Premium Score Results with Full Visual FX
// ═══════════════════════════════════════════════════════════════════
// Premium Features:
//   - Holographic aurora conic-gradient progress circle
//   - StepCompletionOverlay when results shown
//   - Confetti celebration on excellent scores
//   - Glow pulse ring around score circle
//   - PremiumBadge for tier classification
//   - MicroInteraction on reset button
//   - Animated sparkles on tier badge
//   - Holographic aurora progress bar
//   - Premium card glow hover
//   - Score breakdown with gradient borders
// ═══════════════════════════════════════════════════════════════════

export const HasilRenderer = React.memo(function HasilRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: HasilBlock; tokens: TokenResolver; interactive?: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
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
      if (totalPct >= 80) fireConfettiCelebration();
      else if (totalPct >= 50) fireConfetti({ count: 50, duration: 3000 });
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
    <PremiumBlockWrapper tokens={tokens} accent={tierColor} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={tierColor} height={3} position="top" />
    <div className="relative flex flex-col items-center justify-center text-center p-6 overflow-hidden">
      {/* Step Completion Overlay — sparkle particles + trophy */}
      <StepCompletionOverlay
        show={allComplete || displayMax > 0}
        tokens={tokens}
        accent={tierColor}
        completionText={tierConfig.label}
        isCompact={isCompact}
      />

      {/* ── Performance Tier Badge — premium gradient ──────────────── */}
      <div className="mb-4">
        <PremiumBadge tokens={tokens} accent={tierColor} variant="gradient" isCompact={isCompact}>
          <span style={{ fontSize: isCompact ? '12px' : '14px' }}>{tierConfig.emoji}</span>
          <span>{tierConfig.label}</span>
        </PremiumBadge>
      </div>

      {/* ── Holographic Aurora Circle — score ring ────────────────── */}
      <div className={`relative ${isCompact ? 'w-28 h-28' : 'w-40 h-40'} mb-5`}>
        {/* Outer glow ring — pulse animation */}
        <div className="absolute inset-[-4px] rounded-full"
          style={{
            boxShadow: `0 0 50px ${tokens.colorAlpha(tierColor, 0.3)}, 0 0 100px ${tokens.colorAlpha(tierColor, 0.1)}`,
            animation: 'glowPulse 2s ease-in-out infinite',
            '--glow-color': tokens.colorAlpha(tierColor, 0.3),
            '--glow-color-strong': tokens.colorAlpha(tierColor, 0.6),
          } as React.CSSProperties} />

        {/* Rotating border gradient */}
        <div className={`absolute inset-[-2px] rounded-full premium-border-gradient`}
          style={{
            background: 'conic-gradient(from var(--border-angle, 0deg), ' + tokens.color(tierColor) + ', ' + tokens.color('c') + ', ' + tokens.color(tierColor) + ', ' + tokens.color('c') + ', ' + tokens.color(tierColor) + ')',
            padding: '3px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          } as React.CSSProperties} />

        {/* Conic gradient score ring */}
        <div className={`${isCompact ? 'w-28 h-28' : 'w-40 h-40'} rounded-full flex items-center justify-center`}
          style={{
            background: `conic-gradient(${tokens.color(tierColor)} 0%, ${tokens.color(tierColor)} ${displayPct}%, ${tokens.colorAlpha(tierColor, 0.08)} ${displayPct}%, ${tokens.colorAlpha(tierColor, 0.08)} 100%)`,
          }}>
          <div className={`${isCompact ? 'w-22 h-22' : 'w-34 h-34'} rounded-full flex items-center justify-center`}
            style={{
              background: tokens.color('bg2'),
              width: isCompact ? '88px' : '136px',
              height: isCompact ? '88px' : '136px',
            }}>
            <div className="text-center">
              <div className="text-3xl mb-1" style={{ animation: 'trophyBounce 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
                {tierConfig.emoji}
              </div>
              <div className="text-3xl font-black premium-text-gradient"
                style={{ color: tokens.color(tierColor) }}>
                {displayPct}%
              </div>
              <div className="text-[9px] font-bold" style={{ color: tokens.muted(0.6) }}>
                {displayScore}/{displayMax} poin
              </div>
            </div>
          </div>
        </div>

        {/* Animated sparkles around circle */}
        {[
          { top: '-6px', left: '50%', delay: '0s' },
          { top: '50%', right: '-6px', delay: '0.4s' },
          { bottom: '-6px', left: '50%', delay: '0.8s' },
          { top: '50%', left: '-6px', delay: '1.2s' },
        ].map((pos, idx) => (
          <div key={`hasil-sparkle-${idx}`}
            style={{
              position: 'absolute',
              ...pos,
              width: isCompact ? '6px' : '8px',
              height: isCompact ? '6px' : '8px',
              borderRadius: '50%',
              background: tokens.color(tierColor),
              animation: `sparkle 2s ease-in-out ${pos.delay} infinite`,
              pointerEvents: 'none',
            } as React.CSSProperties} />
        ))}
      </div>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <h2 className="font-black text-lg" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black text-lg"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
        />
      </h2>
      <InlineTextEditor
        {...subtitleEditor}
        className={`mt-1 max-w-[320px] ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: '13px', color: tokens.muted(0.8) }}
        placeholder="Ketik subtitle..."
      />

      {/* ── Score Breakdown — premium gradient cards ──────────────── */}
      <div className="mt-5 flex gap-3">
        <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl text-center ${isCompact ? 'min-w-[50px]' : 'min-w-[70px]'} premium-card-glow`}
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.12)}, ${tokens.colorAlpha('g', 0.06)})`,
            border: `1px solid ${tokens.colorAlpha('g', 0.35)}`,
            boxShadow: tokens.raw.shadow.card + `, 0 0 16px ${tokens.colorAlpha('g', 0.08)}`,
          }}>
          <CheckCircle2 size={14} className="inline mb-0.5" style={{ color: tokens.color('g') }} />
          <div className="font-extrabold" style={{ color: tokens.color('g'), fontSize: isCompact ? '9px' : '11px' }}>Benar</div>
          <div className={`font-black ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.color('g') }}>
            {scores.filter(s => s.completed).length}
          </div>
        </div>
        <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl text-center ${isCompact ? 'min-w-[50px]' : 'min-w-[70px]'} premium-card-glow`}
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.12)}, ${tokens.colorAlpha('y', 0.06)})`,
            border: `1px solid ${tokens.colorAlpha('y', 0.35)}`,
            boxShadow: tokens.raw.shadow.card + `, 0 0 16px ${tokens.colorAlpha('y', 0.08)}`,
          }}>
          <Star size={14} className="inline mb-0.5" style={{ color: tokens.color('y') }} />
          <div className="font-extrabold" style={{ color: tokens.color('y'), fontSize: isCompact ? '9px' : '11px' }}>Skor</div>
          <div className={`font-black ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.color('y') }}>{displayScore}</div>
        </div>
        <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl text-center ${isCompact ? 'min-w-[50px]' : 'min-w-[70px]'} premium-card-glow`}
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.12)}, ${tokens.colorAlpha('c', 0.06)})`,
            border: `1px solid ${tokens.colorAlpha('c', 0.35)}`,
            boxShadow: tokens.raw.shadow.card + `, 0 0 16px ${tokens.colorAlpha('c', 0.08)}`,
          }}>
          <Target size={14} className="inline mb-0.5" style={{ color: tokens.color('c') }} />
          <div className="font-extrabold" style={{ color: tokens.color('c'), fontSize: isCompact ? '9px' : '11px' }}>Maks</div>
          <div className={`font-black ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.color('c') }}>{displayMax}</div>
        </div>
      </div>

      {/* ── Motivational message — premium glassmorphism ──────────── */}
      <div className="mt-4 p-3.5 rounded-xl max-w-[300px] premium-card-glow"
        style={{
          background: `linear-gradient(135deg, ${tokens.colorAlpha(tierColor, 0.1)}, ${tokens.colorAlpha(tierColor, 0.04)})`,
          border: `1px solid ${tokens.colorAlpha(tierColor, 0.25)}`,
          borderLeft: `3px solid ${tokens.color(tierColor)}`,
          boxShadow: `0 2px 12px ${tokens.colorAlpha(tierColor, 0.08)}`,
        }}>
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="inline flex-shrink-0 mt-0.5" style={{ color: tokens.color(tierColor), animation: 'sparkle 2s ease-in-out infinite' }} />
          <div className={`leading-relaxed text-left ${isCompact ? 'canvas-truncate-3' : ''}`} style={{ fontSize: '12px', color: tokens.muted(0.8) }}>
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

      {/* ── Tier progress indicator badges ────────────────────────── */}
      <div className="mt-3 flex gap-2">
        <PremiumBadge tokens={tokens} accent={tierColor} variant="outline" isCompact={isCompact}>
          <TrendingUp size={10} /> Level {displayPct >= 90 ? 'Mahir' : displayPct >= 75 ? 'Kompeten' : displayPct >= 50 ? 'Berkembang' : 'Dasar'}
        </PremiumBadge>
        <PremiumBadge tokens={tokens} accent={tierColor} variant="glass" isCompact={isCompact}>
          <Award size={10} /> {scores.filter(s => s.completed).length} Aktivitas
        </PremiumBadge>
      </div>

      {/* ── Reset button — premium spring ─────────────────────────── */}
      {interactive && allComplete && (
        <div className="mt-5">
          <MicroInteraction tokens={tokens} accent="y" effect="bounce">
            <button className="px-5 py-2.5 rounded-xl font-extrabold transition-all hover:scale-105"
              onClick={() => {
                resetAllScores();
                playSound('click');
              }}
              aria-label="Ulangi semua"
              style={{
                fontSize: '13px',
                background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
                color: tokens.color('bg'),
                boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
                animation: 'springBounce 0.4s ease',
              }}>
              <RotateCcw size={14} className="inline" /> Ulangi Semua
            </button>
          </MicroInteraction>
        </div>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
