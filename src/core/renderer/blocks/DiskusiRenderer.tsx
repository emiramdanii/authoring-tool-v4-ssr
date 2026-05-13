'use client';

import React from 'react';
import { MessageCircle, Send, RotateCcw, CheckCircle2, Sparkles, Heart, Zap } from 'lucide-react';
import type { DiskusiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti, fireConfettiMini } from '@/lib/confetti';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, StepCompletionOverlay, MicroInteraction } from './PremiumBlockEffects';

// ═══════════════════════════════════════════════════════════════════
// DISKUSI RENDERER — Premium Discussion with Full Visual FX
// ═══════════════════════════════════════════════════════════════════
// Premium Features:
//   - Holographic aurora progress bar
//   - StepCompletionOverlay when submitted
//   - MicroInteraction on submit button (spring bounce)
//   - PremiumBadge for progress indicator
//   - Confetti celebration on submit
//   - Glow pulse on answered questions
//   - Sparkle decorations
//   - Premium card glow hover effect
// ═══════════════════════════════════════════════════════════════════

export const DiskusiRenderer = React.memo(function DiskusiRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: DiskusiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  const [responses, setResponses] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  // ── Interactive store ───────────────────────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  const questions = block.questions || [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => responses[i]?.trim().length > 0);
  const answeredCount = Object.values(responses).filter(r => r.trim().length > 0).length;
  const progress = questions.length > 0 ? answeredCount / questions.length : 0;

  const handleSubmit = () => {
    if (!interactive || !allAnswered) return;
    setSubmitted(true);
    if (block.id) {
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: questions.length * 10,
        maxScore: questions.length * 10,
        completed: true,
      });
    }
    playSound('complete');
    fireConfetti({ count: 50, duration: 3000 });
  };

  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });
  const introEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'intro',
    value: block.intro ?? '',
    tag: 'p',
  });

  // ══ SUBMITTED SCREEN — Premium with StepCompletionOverlay ═══════
  if (submitted && interactive) {
    return (
      <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0} gradientBorder>
        <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={3} position="top" />
      <div className="relative rounded-2xl p-5 text-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.12)}, ${tokens.colorAlpha('y', 0.05)})`,
          border: `2px solid ${tokens.colorAlpha('c', 0.35)}`,
          boxShadow: tokens.raw.shadow.card + ', 0 0 30px ' + tokens.colorAlpha('c', 0.1),
          animation: 'popSuccess 0.5s ease-out',
        }}>
        {/* Step Completion Overlay */}
        <StepCompletionOverlay
          show={true}
          tokens={tokens}
          accent="c"
          completionText="SELESAI!"
          isCompact={isCompact}
        />

        {/* Trophy emoji with bounce */}
        <div className="text-4xl mb-3" style={{ animation: 'trophyBounce 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
          💬
        </div>

        {/* Title with gradient */}
        <div className="font-black text-lg mb-2 premium-text-gradient" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('c') }}>
          Diskusi Selesai!
        </div>
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Terima kasih telah berdiskusi! Pendapatmu sangat berharga untuk pembelajaran bersama.
        </div>

        {/* Answered question badges */}
        <div className="inline-flex gap-2 mb-4">
          {questions.map((_, i) => (
            <div key={`diskusi-dot-${block.id || 'd'}-${i}`}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.2)}, ${tokens.colorAlpha('c', 0.1)})`,
                border: `1px solid ${tokens.colorAlpha('c', 0.35)}`,
                boxShadow: `0 2px 8px ${tokens.colorAlpha('c', 0.15)}`,
                animation: `sparkle 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}>
              <CheckCircle2 size={14} style={{ color: tokens.color('c') }} />
            </div>
          ))}
        </div>

        {/* Participation badge */}
        <div className="mb-4">
          <PremiumBadge tokens={tokens} accent="c" variant="gradient" isCompact={isCompact}>
            <Heart size={12} /> Aktif Berdiskusi
          </PremiumBadge>
        </div>

        {/* Replay button — premium spring */}
        <MicroInteraction tokens={tokens} accent="c" effect="squish">
          <button className="px-5 py-2.5 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setResponses({}); setSubmitted(false); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('c', 0.35),
              animation: 'springBounce 0.4s ease',
            }}>
            <RotateCcw size={14} className="inline" /> Diskusi Ulang
          </button>
        </MicroInteraction>
      </div>
      </PremiumBlockWrapper>
    );
  }

  // ══ MAIN DISCUSSION SCREEN — Premium Interactive ═════════════════
  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
    <ReadingProgressIndicator progress={progress} tokens={tokens} accent="c" height={3} position="top" />
    <div className="mt-3 rounded-2xl p-4 premium-card-glow relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.1)}, ${tokens.colorAlpha('c', 0.04)})`,
        border: `2px solid ${tokens.colorAlpha('c', 0.3)}`,
        boxShadow: tokens.raw.shadow.card + ', 0 0 24px ' + tokens.colorAlpha('c', 0.08),
      }}>
      {/* Decorative sparkle */}
      <div className="absolute top-3 right-4" style={{ animation: 'float 3s ease-in-out infinite', opacity: 0.2 }}>
        <Sparkles size={18} style={{ color: tokens.color('c') }} />
      </div>

      {/* ── Header with premium icon ─────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.25)}, ${tokens.colorAlpha('c', 0.1)})`,
            border: `1px solid ${tokens.colorAlpha('c', 0.35)}`,
            boxShadow: `0 4px 12px ${tokens.colorAlpha('c', 0.25)}`,
          }}>
          <MessageCircle size={16} style={{ color: tokens.color('c') }} />
        </div>
        <div className="font-extrabold" style={{ color: tokens.color('c'), fontSize: isCompact ? '13px' : '15px' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </div>
        {/* Progress indicator — PremiumBadge */}
        {interactive && questions.length > 0 && (
          <div className="ml-auto">
            <PremiumBadge tokens={tokens} accent={allAnswered ? 'g' : 'c'} variant={allAnswered ? 'gradient' : 'glass'} isCompact={isCompact}>
              {answeredCount}/{questions.length}
            </PremiumBadge>
          </div>
        )}
      </div>

      {/* ── Intro text ───────────────────────────────────────────── */}
      {block.intro && <InlineTextEditor
        {...introEditor}
        className={`mt-1 leading-relaxed font-bold mb-3 ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text') }}
        placeholder="Ketik intro..."
      />}

      {/* ── Holographic Aurora Progress Bar ───────────────────────── */}
      {interactive && questions.length > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden mb-4"
          style={{ background: tokens.subtleBg(0.08) }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: progress * 100 + '%',
              background: `linear-gradient(90deg, ${tokens.color('c')}, ${tokens.color('y')}, ${tokens.color('c')})`,
              backgroundSize: '200% 100%',
              boxShadow: `0 0 8px ${tokens.colorAlpha('c', 0.4)}`,
              animation: 'shimmer 2s linear infinite',
            }} />
        </div>
      )}

      {/* ── Discussion Questions ──────────────────────────────────── */}
      {questions.map((q, i) => {
        const qColor = q.color || 'c';
        const hasResponse = responses[i]?.trim().length > 0;
        return (
        <div key={`diskusi-q-${q.teks?.slice(0,8)}-${i}`} className="mt-4 rounded-xl p-3 min-w-0"
          style={{
            background: hasResponse
              ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.06)}, ${tokens.colorAlpha(qColor, 0.04)})`
              : tokens.subtleBg(0.05),
            border: `1px solid ${tokens.colorAlpha(qColor, hasResponse ? 0.35 : 0.15)}`,
            borderLeft: `3px solid ${hasResponse ? tokens.color('g') : tokens.color(qColor)}`,
            boxShadow: hasResponse ? `0 2px 12px ${tokens.colorAlpha('g', 0.1)}` : 'none',
            transition: 'all 0.3s ease',
          }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: isCompact ? '14px' : '16px' }}>{q.icon}</span>
            <span className="font-extrabold" style={{ color: tokens.color(qColor), fontSize: isCompact ? '12px' : '14px' }}>{q.label}</span>
            {hasResponse && interactive && (
              <div style={{ animation: 'popIn 0.3s ease-out' }}>
                <CheckCircle2 size={12} style={{ color: tokens.color('g') }} />
              </div>
            )}
            {/* Question number badge */}
            <div className="ml-auto">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tokens.colorAlpha(qColor, 0.12),
                  color: tokens.color(qColor),
                  border: `1px solid ${tokens.colorAlpha(qColor, 0.25)}`,
                }}>
                {i + 1}
              </span>
            </div>
          </div>
          <p className={`mt-1.5 leading-relaxed font-bold ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}>{q.teks}</p>
          {interactive ? (
            <textarea className="w-full mt-2 rounded-lg p-2.5 resize-y transition-all"
              style={{
                fontSize: isCompact ? '11px' : '13px',
                color: tokens.color('text'),
                background: hasResponse
                  ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.04)}, ${tokens.subtleBg(0.06)})`
                  : tokens.subtleBg(0.06),
                border: `1px solid ${tokens.colorAlpha(hasResponse ? 'g' : qColor, hasResponse ? 0.35 : 0.2)}`,
                minHeight: isCompact ? '40px' : '60px',
                transition: 'all 0.2s ease',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxShadow: hasResponse ? `0 0 8px ${tokens.colorAlpha('g', 0.1)}` : 'none',
              }}
              placeholder={q.petunjuk}
              value={responses[i] || ''}
              onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
            />
          ) : (
            <div className="w-full mt-2 rounded-lg p-2.5 min-h-[40px]"
              style={{
                fontSize: isCompact ? '10px' : '12px',
                color: tokens.textSubtle(0.5),
                background: tokens.subtleBg(0.03),
                border: '1px dashed ' + tokens.colorAlpha(qColor, 0.25),
              }}>
              {q.petunjuk}
            </div>
          )}
        </div>
        );
      })}

      {/* ── Submit button — premium spring bounce ──────────────────── */}
      {interactive && !submitted && questions.length > 0 && (
        <MicroInteraction tokens={tokens} accent="c" effect={allAnswered ? 'bounce' : 'squish'}>
          <button
            className="w-full mt-4 py-2.5 rounded-xl font-extrabold transition-all hover:scale-[1.02]"
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              fontSize: '13px',
              background: allAnswered
                ? 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')'
                : tokens.subtleBg(0.08),
              color: allAnswered ? tokens.color('bg') : tokens.muted(0.4),
              border: '1px solid ' + (allAnswered ? tokens.colorAlpha('c', 0.4) : tokens.subtleBorder(0.1)),
              boxShadow: allAnswered
                ? `0 4px 20px ${tokens.colorAlpha('c', 0.4)}, 0 0 30px ${tokens.colorAlpha('c', 0.15)}`
                : 'none',
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              animation: allAnswered ? 'glowPulse 2s ease-in-out infinite' : 'none',
              '--glow-color': tokens.colorAlpha('c', 0.3),
              '--glow-color-strong': tokens.colorAlpha('c', 0.6),
            } as React.CSSProperties}>
            <Send size={14} className="inline mr-1" /> Kirim Diskusi
          </button>
        </MicroInteraction>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
