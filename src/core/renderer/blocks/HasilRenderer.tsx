'use client';

import React, { useState, useCallback } from 'react';
import { Trophy, Star, Target, RotateCcw, Sparkles, CheckCircle2, Zap, Award, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { HasilBlock } from '../../schema/types';
import type { ScoreEntry } from '@/store/interactive-store';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '../../../store/canva/store';
import { playSound } from '@/lib/sounds';

// ═══════════════════════════════════════════════════════════════════
// HASIL RENDERER (SKORING) — Clean Score Results for iOS Light
// ═══════════════════════════════════════════════════════════════════
// Variant A/B/C support (Klasik / Majalah / Ringkas)
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
  const edu = tokens.edu('hasil', isCompact);
  return (
    <div className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto', ...edu.componentPadding() }}>
      {/* ── Performance Tier Badge ──────────────── */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold"
          style={{
            ...edu.micro(),
            background: tokens.accentBg(tierColor, 0.1),
            color: tokens.color(tierColor),
            border: `1px solid ${tokens.colorAlpha(tierColor, 0.25)}`,
          }}>
          <span style={{ fontSize: isCompact ? '12px' : '14px' }}>{tierConfig.emoji}</span>
          <span>{tierConfig.label}</span>
        </span>
      </div>

      {/* ── Score Circle — clean progress ring ────────────────── */}
      <div className={`relative ${isCompact ? 'w-28 h-28' : 'w-40 h-40'} mb-5`}>
        {/* Conic gradient score ring */}
        <div className={`${isCompact ? 'w-28 h-28' : 'w-40 h-40'} rounded-full flex items-center justify-center`}
          style={{
            background: `conic-gradient(${tokens.color(tierColor)} 0%, ${tokens.color(tierColor)} ${displayPct}%, ${tokens.colorAlpha(tierColor, 0.08)} ${displayPct}%, ${tokens.colorAlpha(tierColor, 0.08)} 100%)`,
          }}>
          <div className="rounded-full flex items-center justify-center"
            style={{
              background: edu.cardBg(),
              width: isCompact ? '88px' : '136px',
              height: isCompact ? '88px' : '136px',
            }}>
            <div className="text-center">
              <div className="text-3xl mb-1">
                {tierConfig.emoji}
              </div>
              <div className="text-3xl font-black"
                style={{ color: tokens.color(tierColor) }}>
                {displayPct}%
              </div>
              <div style={{ ...edu.micro(), color: edu.mutedText(0.85) }}>
                {displayScore}/{displayMax} poin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <h2 className="font-black text-lg" style={{ fontFamily: tokens.fontFamily('display'), color: edu.textColor() }}>
        <InlineTextEditor
          {...titleEditor}
          className="font-black text-lg"
          style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
        />
      </h2>
      <InlineTextEditor
        {...subtitleEditor}
        className={`mt-1 ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ ...edu.body(), color: edu.mutedText(0.8), wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: tokens.iosSubtitleWidth('coverCentered') }}
        placeholder="Ketik subtitle..."
      />

      {/* ── Score Breakdown ──────────────── */}
      <div className="mt-5 flex gap-3">
        <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl text-center ${isCompact ? 'min-w-[50px]' : 'min-w-[70px]'}`}
          style={{
            background: tokens.accentBg('g', 0.06),
            border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
            boxShadow: edu.shadow('card'),
          }}>
          <span className="material-symbols-outlined inline mb-0.5" style={ { fontSize: '14px' } }>check_circle</span>
          <div className="font-extrabold" style={{ color: tokens.color('g'), ...edu.micro() }}>Benar</div>
          <div className={`font-black ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.color('g') }}>
            {scores.filter(s => s.completed).length}
          </div>
        </div>
        <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl text-center ${isCompact ? 'min-w-[50px]' : 'min-w-[70px]'}`}
          style={{
            background: tokens.accentBg('y', 0.06),
            border: `1px solid ${tokens.colorAlpha('y', 0.2)}`,
            boxShadow: edu.shadow('card'),
          }}>
          <span className="material-symbols-outlined inline mb-0.5" style={ { fontSize: '14px' } }>star</span>
          <div className="font-extrabold" style={{ color: tokens.color('y'), ...edu.micro() }}>Skor</div>
          <div className={`font-black ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.color('y') }}>{displayScore}</div>
        </div>
        <div className={`${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl text-center ${isCompact ? 'min-w-[50px]' : 'min-w-[70px]'}`}
          style={{
            background: tokens.accentBg('c', 0.06),
            border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
            boxShadow: edu.shadow('card'),
          }}>
          <span className="material-symbols-outlined inline mb-0.5" style={ { fontSize: '14px' } }>target</span>
          <div className="font-extrabold" style={{ color: tokens.color('c'), ...edu.micro() }}>Maks</div>
          <div className={`font-black ${isCompact ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.color('c') }}>{displayMax}</div>
        </div>
      </div>

      {/* ── Motivational message ──────────── */}
      <div className="mt-4 rounded-xl"
        style={{
          background: tokens.accentBg(tierColor, 0.04),
          border: `1px solid ${tokens.colorAlpha(tierColor, 0.15)}`,
          borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(tierColor)}`,
          boxShadow: edu.shadow('card'),
          ...edu.nestedPadding(),
          maxWidth: tokens.iosSubtitleWidth('coverCentered'),
        }}>
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined inline flex-shrink-0 mt-0.5" style={ { fontSize: '14px' } }>auto_awesome</span>
          <div className={`leading-relaxed text-left ${isCompact ? 'canvas-truncate-3' : ''}`} style={{ ...edu.caption(), color: edu.mutedText(0.8) }}>
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
          style={{ ...edu.micro(), background: 'transparent', border: `1px solid ${tokens.color(tierColor)}`, color: tokens.color(tierColor) }}>
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>trending_up</span> Level {displayPct >= 90 ? 'Mahir' : displayPct >= 75 ? 'Kompeten' : displayPct >= 50 ? 'Berkembang' : 'Dasar'}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
          style={{ ...edu.micro(), background: tokens.accentBg(tierColor, 0.08), border: `1px solid ${tokens.colorAlpha(tierColor, 0.2)}`, color: tokens.color(tierColor) }}>
          <Award size={10} /> {scores.filter(s => s.completed).length} Aktivitas
        </span>
      </div>

      {/* ── Per-activity score breakdown ────────────────── */}
      {scores.length > 0 && (
        <ActivityBreakdown tokens={tokens} isCompact={isCompact} tierColor={tierColor} scores={scores} />
      )}

      {/* ── Reset button ─────────────────────────── */}
      {interactive && allComplete && (
        <div className="mt-5">
            <button className={`px-5 py-2.5 rounded-xl font-extrabold ${tokens.iosButtonTw()}`}
              onClick={() => {
                resetAllScores();
                playSound('click');
              }}
              aria-label="Ulangi semua"
              style={{
                ...edu.body(),
                background: tokens.color('y'),
                color: tokens.color('bg'),
                boxShadow: edu.shadow('card'),
              }}>
              <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>refresh</span> Ulangi Semua
            </button>
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
  const edu = tokens.edu('hasil', isCompact);
  const motivationalText = displayPct >= 90
    ? 'Kamu menguasai materi dengan sangat baik! Pertahankan prestasimu dan terus belajar!'
    : displayPct >= 75
      ? 'Pemahamanmu sudah baik! Masih ada ruang untuk berkembang lebih lagi.'
      : displayPct >= 50
        ? 'Usahamu cukup baik! Coba pelajari kembali bagian yang masih kurang dipahami.'
        : 'Jangan menyerah! Pelajari kembali materi dan coba lagi. Kamu pasti bisa!';

  return (
    <div className="relative overflow-hidden" style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto', ...edu.componentPadding() }}>
      {/* ── Header: Tier badge + Title side by side ──────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold"
          style={{
            ...edu.micro(),
            background: tokens.accentBg(tierColor, 0.1),
            color: tokens.color(tierColor),
            border: `1px solid ${tokens.colorAlpha(tierColor, 0.2)}`,
          }}>
          <span style={{ fontSize: '14px' }}>{tierConfig.emoji}</span>
          <span>{tierConfig.label}</span>
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-lg leading-tight" style={{ fontFamily: tokens.fontFamily('display'), color: edu.textColor() }}>
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
        style={{ ...edu.body(), color: edu.mutedText(0.8), wordBreak: 'break-word', overflowWrap: 'break-word' }}
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
        <div className="w-full h-2.5 rounded-full overflow-hidden"
          style={{ background: tokens.subtleBg(0.06) }}>
          <div className="h-full rounded-full"
            style={{
              width: `${displayPct}%`,
              background: tokens.color(tierColor),
              ...edu.transition('width', 'slow'),
            }} />
        </div>
        <div style={{ ...edu.micro(), color: edu.mutedText(0.5), marginTop: '4px' }}>
          {displayScore} dari {displayMax} poin
        </div>
      </div>

      {/* ── Score Breakdown ────────────────────── */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 px-3 py-2 rounded-lg"
          style={{
            background: tokens.accentBg('g', 0.06),
            border: `1px solid ${tokens.colorAlpha('g', 0.2)}`,
          }}>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>check_circle</span>
            <span className="font-extrabold" style={{ color: tokens.color('g'), ...edu.micro() }}>Benar</span>
          </div>
          <div className="font-black text-lg mt-0.5" style={{ color: tokens.color('g') }}>
            {scores.filter(s => s.completed).length}
          </div>
        </div>
        <div className="flex-1 px-3 py-2 rounded-lg"
          style={{
            background: tokens.accentBg('y', 0.06),
            border: `1px solid ${tokens.colorAlpha('y', 0.2)}`,
          }}>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>star</span>
            <span className="font-extrabold" style={{ color: tokens.color('y'), ...edu.micro() }}>Skor</span>
          </div>
          <div className="font-black text-lg mt-0.5" style={{ color: tokens.color('y') }}>{displayScore}</div>
        </div>
        <div className="flex-1 px-3 py-2 rounded-lg"
          style={{
            background: tokens.accentBg('c', 0.06),
            border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
          }}>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>target</span>
            <span className="font-extrabold" style={{ color: tokens.color('c'), ...edu.micro() }}>Maks</span>
          </div>
          <div className="font-black text-lg mt-0.5" style={{ color: tokens.color('c') }}>{displayMax}</div>
        </div>
      </div>

      {/* ── 2-column: Badges + Motivational message ──────────────── */}
      <div className="flex gap-3 items-start">
        {/* Left: Level badges */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
            style={{ ...edu.micro(), background: 'transparent', border: `1px solid ${tokens.color(tierColor)}`, color: tokens.color(tierColor) }}>
            <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>trending_up</span> {displayPct >= 90 ? 'Mahir' : displayPct >= 75 ? 'Kompeten' : displayPct >= 50 ? 'Berkembang' : 'Dasar'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold"
            style={{ ...edu.micro(), background: tokens.accentBg(tierColor, 0.08), border: `1px solid ${tokens.colorAlpha(tierColor, 0.2)}`, color: tokens.color(tierColor) }}>
            <Award size={10} /> {scores.filter(s => s.completed).length} Aktivitas
          </span>
        </div>

        {/* Right: Motivational message */}
        <div className="flex-1 rounded-xl"
          style={{
            background: tokens.accentBg(tierColor, 0.04),
            border: `1px solid ${tokens.colorAlpha(tierColor, 0.15)}`,
            borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(tierColor)}`,
            ...edu.nestedPadding(),
          }}>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined flex-shrink-0 mt-0.5" style={ { fontSize: '13px' } }>auto_awesome</span>
            <div className="leading-relaxed text-left" style={{ ...edu.caption(), color: edu.mutedText(0.8) }}>
              {motivationalText}
            </div>
          </div>
        </div>
      </div>

      {/* ── Per-activity score breakdown ────────────────── */}
      {scores.length > 0 && (
        <ActivityBreakdown tokens={tokens} isCompact={isCompact} tierColor={tierColor} scores={scores} />
      )}

      {/* ── Reset button ──────────────────────────────────────────── */}
      {interactive && allComplete && (
        <div className="mt-4 flex justify-end">
            <button className={`px-4 py-2 rounded-lg font-extrabold ${tokens.iosButtonTw()}`}
              onClick={() => {
                resetAllScores();
                playSound('click');
              }}
              aria-label="Ulangi semua"
              style={{
                ...edu.body(),
                background: tokens.color('y'),
                color: tokens.color('bg'),
                boxShadow: edu.shadow('card'),
              }}>
              <span className="material-symbols-outlined inline" style={ { fontSize: '12px' } }>refresh</span> Ulangi Semua
            </button>
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
  const edu = tokens.edu('hasil', isCompact);
  const motivationalText = displayPct >= 90
    ? 'Luar biasa! Pertahankan!'
    : displayPct >= 75
      ? 'Hebat! Terus berkembang!'
      : displayPct >= 50
        ? 'Cukup baik. Pelajari lagi ya!'
        : 'Terus berlatih, kamu pasti bisa!';

  return (
    <div className="relative overflow-hidden" style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto', ...edu.componentPadding() }}>
      {/* ── Inline: Tier badge + Percentage + Title ──────────────── */}
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 rounded-md font-bold"
          style={{
            ...edu.micro(),
            background: tokens.accentBg(tierColor, 0.1),
            color: tokens.color(tierColor),
            border: `1px solid ${tokens.colorAlpha(tierColor, 0.25)}`,
          }}>
          {tierConfig.emoji} {tierConfig.label}
        </span>
        <span className="font-black text-xl" style={{ color: tokens.color(tierColor) }}>
          {displayPct}%
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-sm leading-tight" style={{ fontFamily: tokens.fontFamily('display'), color: edu.textColor() }}>
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
        style={{ ...edu.caption(), color: edu.mutedText(0.85), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik subtitle..."
      />

      {/* ── Score breakdown as simple inline text ─────────────────── */}
      <div className="mt-2 flex items-center gap-3" style={{ ...edu.micro(), color: edu.mutedText(0.85), fontWeight: 700 }}>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>check_circle</span>
          <span style={{ color: tokens.color('g') }}>{scores.filter(s => s.completed).length}</span> benar
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>star</span>
          <span style={{ color: tokens.color('y') }}>{displayScore}</span> skor
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>target</span>
          <span style={{ color: tokens.color('c') }}>{displayMax}</span> maks
        </span>
        <span style={{ color: edu.mutedText(0.5) }}>|</span>
        <span className="flex items-center gap-0.5">
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>trending_up</span>
          <span style={{ color: tokens.color(tierColor) }}>
            {displayPct >= 90 ? 'Mahir' : displayPct >= 75 ? 'Kompeten' : displayPct >= 50 ? 'Berkembang' : 'Dasar'}
          </span>
        </span>
      </div>

      {/* ── Mini motivational text ────────────────────────────────── */}
      <div className="mt-2" style={{ ...edu.caption(), color: edu.mutedText(0.85) }}>
        {motivationalText}
      </div>

      {/* ── Per-activity score breakdown ────────────────── */}
      {scores.length > 0 && (
        <ActivityBreakdown tokens={tokens} isCompact={isCompact} tierColor={tierColor} scores={scores} />
      )}

      {/* ── Reset button (compact) ────────────────────────────────── */}
      {interactive && allComplete && (
        <div className="mt-2">
          <button className={`px-3 py-1 rounded-md font-extrabold ${tokens.iosButtonTw()}`}
            onClick={() => {
              resetAllScores();
              playSound('click');
            }}
            aria-label="Ulangi semua"
            style={{
              ...edu.micro(),
              background: tokens.accentBg('y', 0.1),
              color: tokens.color('y'),
              border: `1px solid ${tokens.colorAlpha('y', 0.25)}`,
            }}>
            <span className="material-symbols-outlined inline" style={ { fontSize: '10px' } }>refresh</span> Ulangi
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PER-ACTIVITY SCORE BREAKDOWN
// ═══════════════════════════════════════════════════════════════════
function ActivityBreakdown({
  tokens, isCompact, tierColor, scores,
}: {
  tokens: TokenResolver; isCompact: boolean; tierColor: string;
  scores: ScoreEntry[];
}) {
  const edu = tokens.edu('hasil', isCompact);
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
    <div className="mt-4 w-full" style={{ maxWidth: tokens.iosSubtitleWidth('coverCentered') }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 w-full mb-2 ${tokens.iosAccordionTw()}`}
        type="button"
      >
        <span className="font-extrabold uppercase tracking-wider" style={{ ...edu.micro(), color: tokens.color(tierColor) }}>
          Skor Per Aktivitas
        </span>
        {expanded
          ? <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>expand_less</span>
          : <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>expand_more</span>
        }
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {activities.map((act, i) => {
            const barColor = getBarColor(act.pct);
            return (
              <div key={`act-${i}`} className="flex items-center gap-2.5 p-2 rounded-lg transition-[background-color,border-color]"
                style={{
                  background: tokens.accentBg(barColor, 0.04),
                  border: `1px solid ${tokens.colorAlpha(barColor, 0.12)}`,
                }}>
                {/* Completion indicator */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: act.completed ? tokens.accentBg(barColor, 0.1) : tokens.accentBg('p', 0.05),
                  }}>
                  {act.completed
                    ? <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>check_circle</span>
                    : <div className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.muted(0.3) }} />
                  }
                </div>
                {/* Label + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold truncate" style={{ ...edu.micro(), color: edu.textColor(), maxWidth: '140px' }}>{act.label}</span>
                    <span className="font-black flex-shrink-0" style={{ ...edu.micro(), color: tokens.color(barColor) }}>{act.pct}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: tokens.subtleBg(0.06) }}>
                    <div className="h-full rounded-full" style={{
                      width: `${act.pct}%`,
                      background: tokens.color(barColor),
                      ...edu.transition('width', 'slow'),
                    }} />
                  </div>
                </div>
                {/* Score */}
                <span className="font-bold flex-shrink-0" style={{ ...edu.micro(), color: edu.mutedText(0.5) }}>{act.score}/{act.maxScore}</span>
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
    'excellent': { icon: <span className="material-symbols-outlined inline" style={ { fontSize: '24px' } }>emoji_events</span>, label: 'Luar Biasa!', color: 'y', emoji: '🏆' },
    'good': { icon: <span className="material-symbols-outlined inline" style={ { fontSize: '24px' } }>star</span>, label: 'Hebat!', color: 'g', emoji: '⭐' },
    'fair': { icon: <span className="material-symbols-outlined inline" style={ { fontSize: '24px' } }>target</span>, label: 'Cukup Baik', color: 'c', emoji: '🎯' },
    'needs-practice': { icon: <span className="material-symbols-outlined inline" style={ { fontSize: '24px' } }>bolt</span>, label: 'Terus Berlatih!', color: 'o', emoji: '💪' },
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
    <PremiumBlockWrapper tokens={tokens} accent={tierColor} staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent={tierColor} height={2} position="top" />

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
