'use client';

import React, { useState, useCallback } from 'react';
import { Trophy, Star, Target, RotateCcw, Sparkles, CheckCircle2, Zap, Award, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { HasilBlock } from '../../schema/types';
import type { ScoreEntry } from '@/store/interactive-store';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, StepCompletionOverlay, MicroInteraction } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '../../../store/canva/store';
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
//   - Variant A/B/C support (Klasik / Majalah / Ringkas)
// ═══════════════════════════════════════════════════════════════════

// ── Variant Selector Component ─────────────────────────────────────
function VariantSelector({
  active,
  onChange,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
}) {
  const variants: Array<{ key: 'A' | 'B' | 'C'; label: string }> = [
    { key: 'A', label: 'Klasik' },
    { key: 'B', label: 'Majalah' },
    { key: 'C', label: 'Ringkas' },
  ];

  return (
    <div className="variant-selector">
      {variants.map((v) => (
        <button
          key={v.key}
          className={`variant-pill ${active === v.key ? 'active' : ''}`}
          onClick={() => onChange(v.key)}
          aria-label={`Varian ${v.label}`}
          title={`Varian ${v.label}`}
          type="button"
        >
          {v.key}
        </button>
      ))}
    </div>
  );
}

// ── Variant A: Klasik (original layout) ────────────────────────────
function VariantAKlasik({
  block, tokens, isCompact, tierConfig, tierColor, displayPct, displayScore, displayMax,
  allComplete, interactive, titleEditor, subtitleEditor, scores, resetAllScores,
}: {
  block: HasilBlock; tokens: TokenResolver; isCompact: boolean;
  tierConfig: { icon: React.ReactNode; label: string; color: string; emoji: string };
  tierColor: string; displayPct: number; displayScore: number; displayMax: number;
  allComplete: boolean; interactive?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
  scores: ScoreEntry[];
  resetAllScores: () => void;
}) {
  return (
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
        <div className="absolute inset-[-2px] rounded-full premium-border-gradient"
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
          <div className="rounded-full flex items-center justify-center"
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
              <div className="text-[10px] font-bold" style={{ color: tokens.muted(0.85) }}>
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
        style={{ fontSize: '13px', color: tokens.muted(0.8), wordBreak: 'break-word', overflowWrap: 'break-word' }}
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

      {/* ── Per-activity score breakdown (Phase 21) ────────────────── */}
      {scores.length > 0 && (
        <ActivityBreakdown tokens={tokens} isCompact={isCompact} tierColor={tierColor} scores={scores} />
      )}

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
  );
}

// ── Variant B: Majalah (Magazine-style) ────────────────────────────
function VariantBMajalah({
  block, tokens, isCompact, tierConfig, tierColor, displayPct, displayScore, displayMax,
  allComplete, interactive, titleEditor, subtitleEditor, scores, resetAllScores,
}: {
  block: HasilBlock; tokens: TokenResolver; isCompact: boolean;
  tierConfig: { icon: React.ReactNode; label: string; color: string; emoji: string };
  tierColor: string; displayPct: number; displayScore: number; displayMax: number;
  allComplete: boolean; interactive?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
  scores: ScoreEntry[];
  resetAllScores: () => void;
}) {
  const motivationalText = displayPct >= 90
    ? 'Kamu menguasai materi dengan sangat baik! Pertahankan prestasimu dan terus belajar!'
    : displayPct >= 75
      ? 'Pemahamanmu sudah baik! Masih ada ruang untuk berkembang lebih lagi.'
      : displayPct >= 50
        ? 'Usahamu cukup baik! Coba pelajari kembali bagian yang masih kurang dipahami.'
        : 'Jangan menyerah! Pelajari kembali materi dan coba lagi. Kamu pasti bisa!';

  return (
    <div className="relative p-5 overflow-hidden">
      {/* Step Completion Overlay */}
      <StepCompletionOverlay
        show={allComplete || displayMax > 0}
        tokens={tokens}
        accent={tierColor}
        completionText={tierConfig.label}
        isCompact={isCompact}
      />

      {/* ── Header: Tier badge + Title side by side ──────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <PremiumBadge tokens={tokens} accent={tierColor} variant="gradient" isCompact={isCompact}>
          <span style={{ fontSize: '14px' }}>{tierConfig.emoji}</span>
          <span>{tierConfig.label}</span>
        </PremiumBadge>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-lg leading-tight" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
            <InlineTextEditor
              {...titleEditor}
              className="font-black text-lg"
              style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            />
          </h2>
        </div>
      </div>

      {/* ── Subtitle ──────────────────────────────────────────────── */}
      <InlineTextEditor
        {...subtitleEditor}
        className={`mb-4 max-w-full ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: '13px', color: tokens.muted(0.8), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik subtitle..."
      />

      {/* ── Horizontal Progress Bar ──────────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-extrabold text-sm" style={{ color: tokens.color(tierColor) }}>
            Skor Kamu
          </span>
          <span className="font-black text-2xl" style={{ color: tokens.color(tierColor) }}>
            {displayPct}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden"
          style={{ background: tokens.colorAlpha(tierColor, 0.1) }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${displayPct}%`,
              background: `linear-gradient(90deg, ${tokens.color(tierColor)}, ${tokens.colorAlpha(tierColor, 0.7)})`,
              boxShadow: `0 0 12px ${tokens.colorAlpha(tierColor, 0.4)}`,
            }} />
        </div>
        <div className="text-[10px] mt-1 font-bold" style={{ color: tokens.muted(0.5) }}>
          {displayScore} dari {displayMax} poin
        </div>
      </div>

      {/* ── Score Breakdown — horizontal cards ────────────────────── */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 px-3 py-2 rounded-lg premium-card-glow"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.1)}, ${tokens.colorAlpha('g', 0.04)})`,
            border: `1px solid ${tokens.colorAlpha('g', 0.25)}`,
          }}>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} style={{ color: tokens.color('g') }} />
            <span className="font-extrabold text-[10px]" style={{ color: tokens.color('g') }}>Benar</span>
          </div>
          <div className="font-black text-lg mt-0.5" style={{ color: tokens.color('g') }}>
            {scores.filter(s => s.completed).length}
          </div>
        </div>
        <div className="flex-1 px-3 py-2 rounded-lg premium-card-glow"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('y', 0.1)}, ${tokens.colorAlpha('y', 0.04)})`,
            border: `1px solid ${tokens.colorAlpha('y', 0.25)}`,
          }}>
          <div className="flex items-center gap-1.5">
            <Star size={12} style={{ color: tokens.color('y') }} />
            <span className="font-extrabold text-[10px]" style={{ color: tokens.color('y') }}>Skor</span>
          </div>
          <div className="font-black text-lg mt-0.5" style={{ color: tokens.color('y') }}>{displayScore}</div>
        </div>
        <div className="flex-1 px-3 py-2 rounded-lg premium-card-glow"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.1)}, ${tokens.colorAlpha('c', 0.04)})`,
            border: `1px solid ${tokens.colorAlpha('c', 0.25)}`,
          }}>
          <div className="flex items-center gap-1.5">
            <Target size={12} style={{ color: tokens.color('c') }} />
            <span className="font-extrabold text-[10px]" style={{ color: tokens.color('c') }}>Maks</span>
          </div>
          <div className="font-black text-lg mt-0.5" style={{ color: tokens.color('c') }}>{displayMax}</div>
        </div>
      </div>

      {/* ── 2-column: Badges + Motivational message ──────────────── */}
      <div className="flex gap-3 items-start">
        {/* Left: Level badges */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <PremiumBadge tokens={tokens} accent={tierColor} variant="outline" isCompact>
            <TrendingUp size={10} /> {displayPct >= 90 ? 'Mahir' : displayPct >= 75 ? 'Kompeten' : displayPct >= 50 ? 'Berkembang' : 'Dasar'}
          </PremiumBadge>
          <PremiumBadge tokens={tokens} accent={tierColor} variant="glass" isCompact>
            <Award size={10} /> {scores.filter(s => s.completed).length} Aktivitas
          </PremiumBadge>
        </div>

        {/* Right: Motivational message */}
        <div className="flex-1 p-3 rounded-xl premium-card-glow"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha(tierColor, 0.08)}, ${tokens.colorAlpha(tierColor, 0.03)})`,
            border: `1px solid ${tokens.colorAlpha(tierColor, 0.2)}`,
            borderLeft: `3px solid ${tokens.color(tierColor)}`,
          }}>
          <div className="flex items-start gap-2">
            <Sparkles size={13} className="flex-shrink-0 mt-0.5" style={{ color: tokens.color(tierColor), animation: 'sparkle 2s ease-in-out infinite' }} />
            <div className="leading-relaxed text-left" style={{ fontSize: '12px', color: tokens.muted(0.8) }}>
              {motivationalText}
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-activity score breakdown (Phase 21) ────────────────── */}
      {scores.length > 0 && (
        <ActivityBreakdown tokens={tokens} isCompact={isCompact} tierColor={tierColor} scores={scores} />
      )}

      {/* ── Reset button ──────────────────────────────────────────── */}
      {interactive && allComplete && (
        <div className="mt-4 flex justify-end">
          <MicroInteraction tokens={tokens} accent="y" effect="bounce">
            <button className="px-4 py-2 rounded-lg font-extrabold transition-all hover:scale-105"
              onClick={() => {
                resetAllScores();
                playSound('click');
              }}
              aria-label="Ulangi semua"
              style={{
                fontSize: '12px',
                background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
                color: tokens.color('bg'),
                boxShadow: '0 4px 12px ' + tokens.colorAlpha('y', 0.3),
                animation: 'springBounce 0.4s ease',
              }}>
              <RotateCcw size={12} className="inline" /> Ulangi Semua
            </button>
          </MicroInteraction>
        </div>
      )}
    </div>
  );
}

// ── Variant C: Ringkas (Ultra-compact) ─────────────────────────────
function VariantCRingkas({
  block, tokens, isCompact, tierConfig, tierColor, displayPct, displayScore, displayMax,
  allComplete, interactive, titleEditor, subtitleEditor, scores, resetAllScores,
}: {
  block: HasilBlock; tokens: TokenResolver; isCompact: boolean;
  tierConfig: { icon: React.ReactNode; label: string; color: string; emoji: string };
  tierColor: string; displayPct: number; displayScore: number; displayMax: number;
  allComplete: boolean; interactive?: boolean;
  titleEditor: ReturnType<typeof useInlineEditor>;
  subtitleEditor: ReturnType<typeof useInlineEditor>;
  scores: ScoreEntry[];
  resetAllScores: () => void;
}) {
  const motivationalText = displayPct >= 90
    ? 'Luar biasa! Pertahankan!'
    : displayPct >= 75
      ? 'Hebat! Terus berkembang!'
      : displayPct >= 50
        ? 'Cukup baik. Pelajari lagi ya!'
        : 'Terus berlatih, kamu pasti bisa!';

  return (
    <div className="relative p-3 overflow-hidden">
      {/* Step Completion Overlay */}
      <StepCompletionOverlay
        show={allComplete || displayMax > 0}
        tokens={tokens}
        accent={tierColor}
        completionText={tierConfig.label}
        isCompact={true}
      />

      {/* ── Inline: Tier badge + Percentage + Title ──────────────── */}
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 rounded-md font-bold text-[11px]"
          style={{
            background: tokens.colorAlpha(tierColor, 0.15),
            color: tokens.color(tierColor),
            border: `1px solid ${tokens.colorAlpha(tierColor, 0.3)}`,
          }}>
          {tierConfig.emoji} {tierConfig.label}
        </span>
        <span className="font-black text-xl" style={{ color: tokens.color(tierColor) }}>
          {displayPct}%
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-sm leading-tight" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('text') }}>
            <InlineTextEditor
              {...titleEditor}
              className="font-black text-sm"
              style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            />
          </h2>
        </div>
      </div>

      {/* ── Subtitle ──────────────────────────────────────────────── */}
      <InlineTextEditor
        {...subtitleEditor}
        className="canvas-truncate-2 max-w-full"
        style={{ fontSize: '11px', color: tokens.muted(0.85), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik subtitle..."
      />

      {/* ── Score breakdown as simple inline text ─────────────────── */}
      <div className="mt-2 flex items-center gap-3 text-[10px] font-bold" style={{ color: tokens.muted(0.85) }}>
        <span className="flex items-center gap-1">
          <CheckCircle2 size={10} style={{ color: tokens.color('g') }} />
          <span style={{ color: tokens.color('g') }}>{scores.filter(s => s.completed).length}</span> benar
        </span>
        <span className="flex items-center gap-1">
          <Star size={10} style={{ color: tokens.color('y') }} />
          <span style={{ color: tokens.color('y') }}>{displayScore}</span> skor
        </span>
        <span className="flex items-center gap-1">
          <Target size={10} style={{ color: tokens.color('c') }} />
          <span style={{ color: tokens.color('c') }}>{displayMax}</span> maks
        </span>
        <span style={{ color: tokens.muted(0.5) }}>|</span>
        <span className="flex items-center gap-0.5">
          <TrendingUp size={10} style={{ color: tokens.color(tierColor) }} />
          <span style={{ color: tokens.color(tierColor) }}>
            {displayPct >= 90 ? 'Mahir' : displayPct >= 75 ? 'Kompeten' : displayPct >= 50 ? 'Berkembang' : 'Dasar'}
          </span>
        </span>
      </div>

      {/* ── Mini motivational text ────────────────────────────────── */}
      <div className="mt-2 text-[11px]" style={{ color: tokens.muted(0.85) }}>
        {motivationalText}
      </div>

      {/* ── Per-activity score breakdown (Phase 21) ────────────────── */}
      {scores.length > 0 && (
        <ActivityBreakdown tokens={tokens} isCompact={isCompact} tierColor={tierColor} scores={scores} />
      )}

      {/* ── Reset button (compact) ────────────────────────────────── */}
      {interactive && allComplete && (
        <div className="mt-2">
          <button className="px-3 py-1 rounded-md font-extrabold transition-all hover:scale-105"
            onClick={() => {
              resetAllScores();
              playSound('click');
            }}
            aria-label="Ulangi semua"
            style={{
              fontSize: '10px',
              background: tokens.colorAlpha('y', 0.15),
              color: tokens.color('y'),
              border: `1px solid ${tokens.colorAlpha('y', 0.3)}`,
            }}>
            <RotateCcw size={10} className="inline" /> Ulangi
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PER-ACTIVITY SCORE BREAKDOWN (Phase 21)
// ═══════════════════════════════════════════════════════════════════
function ActivityBreakdown({
  tokens, isCompact, tierColor, scores,
}: {
  tokens: TokenResolver; isCompact: boolean; tierColor: string;
  scores: ScoreEntry[];
}) {
  const [expanded, setExpanded] = React.useState(true);

  // Group scores by pageIndex
  const pages = useCanvaStore(s => s.pages);

  const activities = React.useMemo(() => {
    const pageMap = new Map<number, { label: string; score: number; maxScore: number; completed: boolean; pct: number }>();

    for (const s of scores) {
      const existing = pageMap.get(s.pageIndex);
      if (existing) {
        existing.score += s.score;
        existing.maxScore += s.maxScore;
        existing.completed = existing.completed && s.completed;
      } else {
        pageMap.set(s.pageIndex, {
          label: pages[s.pageIndex]?.label || `Aktivitas ${s.pageIndex + 1}`,
          score: s.score,
          maxScore: s.maxScore,
          completed: s.completed,
          pct: s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
        });
      }
    }

    // Recalculate pct after aggregation
    for (const [, entry] of pageMap) {
      entry.pct = entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0;
    }

    return Array.from(pageMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, v]) => v);
  }, [scores, pages]);

  if (activities.length === 0) return null;

  const getBarColor = (pct: number) => pct >= 90 ? 'y' : pct >= 75 ? 'g' : pct >= 50 ? 'c' : 'o';

  return (
    <div className="mt-4 w-full max-w-[320px]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full mb-2 cursor-pointer"
        type="button"
      >
        <span className="font-extrabold text-[11px] uppercase tracking-wider" style={{ color: tokens.color(tierColor) }}>
          Skor Per Aktivitas
        </span>
        {expanded
          ? <ChevronUp size={12} style={{ color: tokens.muted(0.5) }} />
          : <ChevronDown size={12} style={{ color: tokens.muted(0.5) }} />
        }
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {activities.map((act, i) => {
            const barColor = getBarColor(act.pct);
            return (
              <div key={`act-${i}`} className="flex items-center gap-2.5 p-2 rounded-lg transition-all hover:-translate-y-0.5"
                style={{
                  background: tokens.colorAlpha(barColor, 0.06),
                  border: `1px solid ${tokens.colorAlpha(barColor, 0.15)}`,
                }}>
                {/* Completion indicator */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: act.completed ? tokens.colorAlpha(barColor, 0.2) : tokens.colorAlpha('p', 0.1),
                  }}>
                  {act.completed
                    ? <CheckCircle2 size={10} style={{ color: tokens.color(barColor) }} />
                    : <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.muted(0.3) }} />
                  }
                </div>
                {/* Label + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold truncate" style={{ color: tokens.color('text'), maxWidth: '140px' }}>{act.label}</span>
                    <span className="text-[10px] font-black flex-shrink-0" style={{ color: tokens.color(barColor) }}>{act.pct}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: tokens.colorAlpha(barColor, 0.08) }}>
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{
                      width: `${act.pct}%`,
                      background: tokens.color(barColor),
                      boxShadow: `0 0 6px ${tokens.colorAlpha(barColor, 0.25)}`,
                    }} />
                  </div>
                </div>
                {/* Score */}
                <span className="text-[9px] font-bold flex-shrink-0" style={{ color: tokens.muted(0.5) }}>{act.score}/{act.maxScore}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HASIL RENDERER
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

  // ── Variant state (persisted to store) ────────────────────────
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

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

  // ── Shared props for all variants ────────────────────────────
  const sharedProps = {
    block,
    tokens,
    isCompact,
    tierConfig,
    tierColor,
    displayPct,
    displayScore,
    displayMax,
    allComplete,
    interactive,
    titleEditor,
    subtitleEditor,
    scores,
    resetAllScores,
  };

  return (
    <PremiumBlockWrapper tokens={tokens} accent={tierColor} staggerIndex={0} gradientBorder>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={tierColor} height={3} position="top" />

      {/* Variant selector overlay — only when editing */}
      {isEditing && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
          <VariantSelector active={variant} onChange={handleVariantChange} />
        </div>
      )}

      {/* ── Conditional rendering based on variant ──────────────── */}
      {variant === 'A' && <VariantAKlasik {...sharedProps} />}
      {variant === 'B' && <VariantBMajalah {...sharedProps} />}
      {variant === 'C' && <VariantCRingkas {...sharedProps} />}
    </PremiumBlockWrapper>
  );
});
