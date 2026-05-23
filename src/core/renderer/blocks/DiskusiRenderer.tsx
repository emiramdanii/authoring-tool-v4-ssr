'use client';

import React, { useCallback } from 'react';
import { MessageCircle, Send, RotateCcw, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import type { DiskusiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';

import { useCanvaStore } from '../../../store/canva/store';
import { PremiumBlockWrapper, ReadingProgressIndicator } from './PremiumBlockEffects';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';

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
//   - Variant A/B/C support (Klasik / Kartu / Ringkas)
// ═══════════════════════════════════════════════════════════════════

// ── Variant Selector Component ──────────────────────────────────
function VariantSelector({
  active,
  onChange,
}: {
  active: 'A' | 'B' | 'C';
  onChange: (v: 'A' | 'B' | 'C') => void;
}) {
  const variants: Array<{ key: 'A' | 'B' | 'C'; label: string }> = [
    { key: 'A', label: 'Klasik' },
    { key: 'B', label: 'Kartu' },
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

export const DiskusiRenderer = React.memo(function DiskusiRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex, compression }: {
  block: DiskusiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number; compression?: CompressionDecision;
}) {
  const [responses, setResponses] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  // ── Variant state (persisted to store) ──────────────────────
  const variant: 'A' | 'B' | 'C' = (block.variant as 'A' | 'B' | 'C') || 'A';

  const updateSchemaBlock = useCanvaStore((s) => s.updateSchemaBlock);
  const handleVariantChange = useCallback((v: 'A' | 'B' | 'C') => {
    if (block.id) updateSchemaBlock(block.id, { variant: v });
  }, [block.id, updateSchemaBlock]);

  // ── Interactive store ───────────────────────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  const allQuestions = block.questions || [];

  // ── Compression-aware question visibility (reveal-set) ──────
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allQuestions.length,
  });
  const questions = isCompressed ? allQuestions.slice(0, visibleCount) : allQuestions;
  const allAnswered = React.useMemo(() =>
    allQuestions.length > 0 && allQuestions.every((_, i) => responses[i]?.trim().length > 0),
    [allQuestions.length, responses]
  );
  const answeredCount = React.useMemo(() =>
    Object.values(responses).filter(r => r.trim().length > 0).length,
    [responses]
  );
  const progress = allQuestions.length > 0 ? answeredCount / allQuestions.length : 0;

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
      <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
        <ReadingProgressIndicator progress={1} tokens={tokens} accent="c" height={2} position="top" />
      <div className="relative rounded-2xl p-5 text-center overflow-hidden"
        style={{
          background: tokens.color('card'),
          border: `1px solid ${tokens.colorAlpha('c', 0.2)}`,
          boxShadow: tokens.raw.shadow.card,
        }}>
        {/* Trophy emoji */}
        <div className="text-4xl mb-3">
          💬
        </div>

        {/* Title with gradient */}
        <div className="font-black text-lg mb-2" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('c') }}>
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
                boxShadow: 'none',
                animation: 'none',
              }}>
              <CheckCircle2 size={14} style={{ color: tokens.color('c') }} />
            </div>
          ))}
        </div>

        {/* Participation badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold" style={{ fontSize: '11px', background: tokens.accentBg('c', 0.1), color: tokens.color('c'), border: `1px solid ${tokens.colorAlpha('c', 0.25)}` }}>
            <Heart size={12} /> Aktif Berdiskusi
          </span>
        </div>

        {/* Replay button — premium spring */}
          <button className={`px-5 py-2.5 rounded-xl font-extrabold ${tokens.iosButtonTw(interactive)}`}
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
      </div>
      </PremiumBlockWrapper>
    );
  }

  // ══ VARIANT A — KLASIK (Default, original layout) ═══════════════
  const renderVariantA = () => (
    <>
      {/* Decorative sparkle */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.25)}, ${tokens.colorAlpha('c', 0.1)})`,
            border: `1px solid ${tokens.colorAlpha('c', 0.35)}`,
            boxShadow: `0 4px 12px ${tokens.colorAlpha('c', 0.25)}`,
          }}>
          <MessageCircle size={16} style={{ color: tokens.color('c') }} />
        </div>
        <div className="font-extrabold min-w-0" style={{ color: tokens.color('c'), fontSize: isCompact ? '13px' : '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </div>
        {/* Progress indicator — PremiumBadge */}
        {interactive && questions.length > 0 && (
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold" style={{ fontSize: '10px', background: allAnswered ? tokens.accentBg('g', 0.08) : tokens.accentBg('c', 0.08), color: allAnswered ? tokens.color('g') : tokens.color('c'), border: `1px solid ${allAnswered ? tokens.colorAlpha('g', 0.2) : tokens.colorAlpha('c', 0.2)}` }}>
              {answeredCount}/{questions.length}
            </span>
          </div>
        )}
      </div>

      {/* ── Intro text ───────────────────────────────────────────── */}
      {block.intro && <InlineTextEditor
        {...introEditor}
        className={`mt-1 leading-relaxed font-bold mb-3 ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik intro..."
      />}

      {/* ── Holographic Aurora Progress Bar ───────────────────────── */}
      {interactive && questions.length > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden mb-4"
          style={{ background: tokens.subtleBg(0.08) }}>
          <div className="h-full rounded-full"
            style={{
              width: progress * 100 + '%',
              background: tokens.color('c'),
              ...tokens.iosTransitionStyle('width', 'slow'),
              boxShadow: 'none',
              animation: 'none',
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
            ...tokens.iosTransitionStyle('background-color, border-color, color, transform, box-shadow', 'standard'),
          }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: isCompact ? '14px' : '16px' }}>{q.icon}</span>
            <span className="font-extrabold min-w-0 truncate" style={{ color: tokens.color(qColor), fontSize: isCompact ? '12px' : '14px' }}>{q.label}</span>
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
          <RichText content={q.teks ?? ''} tag="p" className={`mt-1.5 leading-relaxed font-bold ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }} />
          {interactive ? (
            <textarea className={`w-full mt-2 rounded-lg p-2.5 resize-y ${tokens.iosTextInputTw()}`}
              style={{
                fontSize: isCompact ? '11px' : '13px',
                color: tokens.color('text'),
                background: hasResponse
                  ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.04)}, ${tokens.subtleBg(0.06)})`
                  : tokens.subtleBg(0.06),
                border: `1px solid ${tokens.colorAlpha(hasResponse ? 'g' : qColor, hasResponse ? 0.35 : 0.2)}`,
                minHeight: isCompact ? '40px' : '60px',
                ...tokens.iosTransitionStyle('background-color, border-color, color, box-shadow', 'fast'),
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
                color: tokens.textSubtle(0.6),
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
          <button
            className={`w-full mt-4 py-2.5 rounded-xl font-extrabold ${tokens.iosButtonTw(allAnswered)}`}
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
                ? tokens.raw.shadow.card
                : 'none',
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              animation: 'none',
              '--glow-color': tokens.colorAlpha('c', 0.3),
              '--glow-color-strong': tokens.colorAlpha('c', 0.6),
            } as React.CSSProperties}>
            <Send size={14} className="inline mr-1" /> Kirim Diskusi
          </button>
      )}
    </>
  );

  // ══ VARIANT B — KARTU (Card-style layout with more visual space) ═
  const renderVariantB = () => (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.3)}, ${tokens.colorAlpha('c', 0.12)})`,
            border: `1px solid ${tokens.colorAlpha('c', 0.4)}`,
            boxShadow: `0 6px 16px ${tokens.colorAlpha('c', 0.3)}`,
          }}>
          <MessageCircle size={22} style={{ color: tokens.color('c') }} />
        </div>
        <div className="font-extrabold min-w-0" style={{ color: tokens.color('c'), fontSize: isCompact ? '15px' : '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </div>
        {/* Progress indicator — PremiumBadge */}
        {interactive && questions.length > 0 && (
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold" style={{ fontSize: '10px', background: allAnswered ? tokens.accentBg('g', 0.08) : tokens.accentBg('c', 0.08), color: allAnswered ? tokens.color('g') : tokens.color('c'), border: `1px solid ${allAnswered ? tokens.colorAlpha('g', 0.2) : tokens.colorAlpha('c', 0.2)}` }}>
              {answeredCount}/{questions.length}
            </span>
          </div>
        )}
      </div>

      {/* ── Intro text ───────────────────────────────────────────── */}
      {block.intro && <InlineTextEditor
        {...introEditor}
        className={`mt-1 leading-relaxed font-bold mb-4 ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: isCompact ? '13px' : '15px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik intro..."
      />}

      {/* ── Holographic Aurora Progress Bar ───────────────────────── */}
      {interactive && questions.length > 0 && (
        <div className="h-2 rounded-full overflow-hidden mb-5"
          style={{ background: tokens.subtleBg(0.08) }}>
          <div className="h-full rounded-full"
            style={{
              width: progress * 100 + '%',
              background: tokens.color('c'),
              ...tokens.iosTransitionStyle('width', 'slow'),
              boxShadow: 'none',
              animation: 'none',
            }} />
        </div>
      )}

      {/* ── Discussion Questions — Card Style ──────────────────────── */}
      {questions.map((q, i) => {
        const qColor = q.color || 'c';
        const hasResponse = responses[i]?.trim().length > 0;
        return (
        <div key={`diskusi-q-${q.teks?.slice(0,8)}-${i}`} className="mt-5 rounded-2xl p-5 min-w-0"
          style={{
            background: hasResponse
              ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.08)}, ${tokens.colorAlpha(qColor, 0.05)})`
              : `linear-gradient(135deg, ${tokens.colorAlpha(qColor, 0.06)}, ${tokens.subtleBg(0.04)})`,
            border: `2px solid ${tokens.colorAlpha(qColor, hasResponse ? 0.4 : 0.2)}`,
            borderLeft: `4px solid ${hasResponse ? tokens.color('g') : tokens.color(qColor)}`,
            boxShadow: hasResponse
              ? `0 4px 16px ${tokens.colorAlpha('g', 0.15)}`
              : `0 2px 8px ${tokens.colorAlpha(qColor, 0.08)}`,
            ...tokens.iosTransitionStyle('background-color, border-color, color, transform, box-shadow', 'standard'),
          }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${tokens.colorAlpha(qColor, 0.2)}, ${tokens.colorAlpha(qColor, 0.08)})`,
                border: `1px solid ${tokens.colorAlpha(qColor, 0.3)}`,
                fontSize: isCompact ? '16px' : '20px',
              }}>
              {q.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-extrabold block min-w-0 truncate" style={{ color: tokens.color(qColor), fontSize: isCompact ? '13px' : '15px' }}>{q.label}</span>
              {/* Question number badge */}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                style={{
                  background: tokens.colorAlpha(qColor, 0.12),
                  color: tokens.color(qColor),
                  border: `1px solid ${tokens.colorAlpha(qColor, 0.25)}`,
                }}>
                Pertanyaan {i + 1}
              </span>
            </div>
            {hasResponse && interactive && (
              <div style={{ animation: 'popIn 0.3s ease-out' }}>
                <CheckCircle2 size={16} style={{ color: tokens.color('g') }} />
              </div>
            )}
          </div>
          <RichText content={q.teks ?? ''} tag="p" className={`mb-3 leading-relaxed font-bold ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: isCompact ? '13px' : '15px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }} />
          {interactive ? (
            <textarea className={`w-full rounded-xl p-3.5 resize-y ${tokens.iosTextInputTw()}`}
              style={{
                fontSize: isCompact ? '12px' : '14px',
                color: tokens.color('text'),
                background: hasResponse
                  ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.05)}, ${tokens.subtleBg(0.06)})`
                  : tokens.subtleBg(0.06),
                border: `1px solid ${tokens.colorAlpha(hasResponse ? 'g' : qColor, hasResponse ? 0.35 : 0.2)}`,
                minHeight: isCompact ? '50px' : '80px',
                ...tokens.iosTransitionStyle('background-color, border-color, color, box-shadow', 'fast'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxShadow: hasResponse ? `0 0 8px ${tokens.colorAlpha('g', 0.1)}` : 'none',
              }}
              placeholder={q.petunjuk}
              value={responses[i] || ''}
              onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
            />
          ) : (
            <div className="w-full rounded-xl p-3.5 min-h-[50px]"
              style={{
                fontSize: isCompact ? '11px' : '13px',
                color: tokens.textSubtle(0.6),
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
          <button
            className={`w-full mt-5 py-3 rounded-2xl font-extrabold ${tokens.iosButtonTw(allAnswered)}`}
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              fontSize: '14px',
              background: allAnswered
                ? 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')'
                : tokens.subtleBg(0.08),
              color: allAnswered ? tokens.color('bg') : tokens.muted(0.4),
              border: '1px solid ' + (allAnswered ? tokens.colorAlpha('c', 0.4) : tokens.subtleBorder(0.1)),
              boxShadow: allAnswered
                ? tokens.raw.shadow.card
                : 'none',
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              animation: 'none',
              '--glow-color': tokens.colorAlpha('c', 0.3),
              '--glow-color-strong': tokens.colorAlpha('c', 0.6),
            } as React.CSSProperties}>
            <Send size={15} className="inline mr-1" /> Kirim Diskusi
          </button>
      )}
    </>
  );

  // ══ VARIANT C — RINGKAS (Ultra-compact layout) ══════════════════
  const renderVariantC = () => (
    <>
      {/* No decorative sparkle for Ringkas variant */}

      {/* ── Compact header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 mb-2">
        <MessageCircle size={13} style={{ color: tokens.color('c') }} />
        <span className="font-extrabold min-w-0" style={{ color: tokens.color('c'), fontSize: isCompact ? '12px' : '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </span>
        {/* Progress indicator — PremiumBadge */}
        {interactive && questions.length > 0 && (
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: '9px', background: allAnswered ? tokens.accentBg('g', 0.08) : tokens.accentBg('c', 0.08), color: allAnswered ? tokens.color('g') : tokens.color('c'), border: `1px solid ${allAnswered ? tokens.colorAlpha('g', 0.2) : tokens.colorAlpha('c', 0.2)}` }}>
              {answeredCount}/{questions.length}
            </span>
          </div>
        )}
      </div>

      {/* ── Intro text ───────────────────────────────────────────── */}
      {block.intro && <InlineTextEditor
        {...introEditor}
        className={`leading-relaxed font-bold mb-2 ${isCompact ? 'canvas-truncate-1' : ''}`}
        style={{ fontSize: '12px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik intro..."
      />}

      {/* ── Compact progress bar ───────────────────────────────────── */}
      {interactive && questions.length > 0 && (
        <div className="h-1 rounded-full overflow-hidden mb-2"
          style={{ background: tokens.subtleBg(0.08) }}>
          <div className="h-full rounded-full"
            style={{
              width: progress * 100 + '%',
              background: tokens.color('c'),
              ...tokens.iosTransitionStyle('width', 'slow'),
              boxShadow: 'none',
              animation: 'none',
            }} />
        </div>
      )}

      {/* ── Discussion Questions — Compact rows ────────────────────── */}
      {questions.map((q, i) => {
        const qColor = q.color || 'c';
        const hasResponse = responses[i]?.trim().length > 0;
        return (
        <div key={`diskusi-q-${q.teks?.slice(0,8)}-${i}`} className="mt-2 rounded-lg p-2 min-w-0"
          style={{
            background: hasResponse
              ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.04)}, ${tokens.colorAlpha(qColor, 0.02)})`
              : tokens.subtleBg(0.03),
            border: `1px solid ${tokens.colorAlpha(qColor, hasResponse ? 0.25 : 0.1)}`,
            borderLeft: `2px solid ${hasResponse ? tokens.color('g') : tokens.color(qColor)}`,
            boxShadow: hasResponse ? `0 1px 6px ${tokens.colorAlpha('g', 0.08)}` : 'none',
            ...tokens.iosTransitionStyle('background-color, border-color, color, transform, box-shadow', 'standard'),
          }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: isCompact ? '12px' : '13px' }}>{q.icon}</span>
            <span className="font-bold min-w-0 truncate" style={{ color: tokens.color(qColor), fontSize: '12px' }}>{q.label}</span>
            {hasResponse && interactive && (
              <div style={{ animation: 'popIn 0.3s ease-out' }}>
                <CheckCircle2 size={10} style={{ color: tokens.color('g') }} />
              </div>
            )}
            {/* Question number */}
            <span className="ml-auto text-[10px] font-bold px-1 py-0.5 rounded-full"
              style={{
                background: tokens.colorAlpha(qColor, 0.1),
                color: tokens.color(qColor),
              }}>
              {i + 1}
            </span>
          </div>
          <RichText content={q.teks ?? ''} tag="p" className={`mt-1 leading-snug font-semibold ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: '12px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }} />
          {interactive ? (
            <textarea className={`w-full mt-1.5 rounded-md p-1.5 resize-y ${tokens.iosTextInputTw()}`}
              style={{
                fontSize: '12px',
                color: tokens.color('text'),
                background: hasResponse
                  ? `linear-gradient(135deg, ${tokens.colorAlpha('g', 0.03)}, ${tokens.subtleBg(0.04)})`
                  : tokens.subtleBg(0.04),
                border: `1px solid ${tokens.colorAlpha(hasResponse ? 'g' : qColor, hasResponse ? 0.25 : 0.15)}`,
                minHeight: isCompact ? '28px' : '36px',
                ...tokens.iosTransitionStyle('background-color, border-color, color, box-shadow', 'fast'),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                boxShadow: hasResponse ? `0 0 4px ${tokens.colorAlpha('g', 0.08)}` : 'none',
              }}
              placeholder={q.petunjuk ? q.petunjuk.slice(0, 40) + (q.petunjuk.length > 40 ? '...' : '') : undefined}
              value={responses[i] || ''}
              onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
            />
          ) : (
            <div className="w-full mt-1.5 rounded-md p-1.5 min-h-[24px]"
              style={{
                fontSize: '11px',
                color: tokens.textSubtle(0.6),
                background: tokens.subtleBg(0.02),
                border: '1px dashed ' + tokens.colorAlpha(qColor, 0.2),
              }}>
              {q.petunjuk}
            </div>
          )}
        </div>
        );
      })}

      {/* ── Submit button — compact ─────────────────────────────────── */}
      {interactive && !submitted && questions.length > 0 && (
          <button
            className={`w-full mt-3 py-1.5 rounded-lg font-extrabold ${tokens.iosButtonTw(allAnswered)}`}
            onClick={handleSubmit}
            disabled={!allAnswered}
            style={{
              fontSize: '11px',
              background: allAnswered
                ? 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')'
                : tokens.subtleBg(0.08),
              color: allAnswered ? tokens.color('bg') : tokens.muted(0.4),
              border: '1px solid ' + (allAnswered ? tokens.colorAlpha('c', 0.4) : tokens.subtleBorder(0.1)),
              boxShadow: allAnswered
                ? tokens.raw.shadow.card
                : 'none',
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              animation: 'none',
              '--glow-color': tokens.colorAlpha('c', 0.3),
              '--glow-color-strong': tokens.colorAlpha('c', 0.6),
            } as React.CSSProperties}>
            <Send size={11} className="inline mr-1" /> Kirim
          </button>
      )}
    </>
  );

  // ══ MAIN DISCUSSION SCREEN — Render based on variant ═════════════
  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
    <ReadingProgressIndicator progress={progress} tokens={tokens} accent="c" height={3} position="top" />
    <div className="mt-3 rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${tokens.colorAlpha('c', 0.1)}, ${tokens.colorAlpha('c', 0.04)})`,
        border: `2px solid ${tokens.colorAlpha('c', 0.3)}`,
        boxShadow: tokens.raw.shadow.card + ', 0 0 24px ' + tokens.colorAlpha('c', 0.08),
      }}>
      {/* Variant selector overlay — only visible when editing */}
      {isEditing && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 45 }}>
          <VariantSelector active={variant} onChange={handleVariantChange} />
        </div>
      )}

      {/* Conditional variant rendering */}
      {variant === 'A' && renderVariantA()}
      {variant === 'B' && renderVariantB()}
      {variant === 'C' && renderVariantC()}

      {/* ═══ COMPRESSION: Show More button ════════════════════════ */}
      {hasMore && (
        <ShowMoreButton
          hiddenCount={hiddenCount}
          onShowMore={showMore}
          itemLabel="pertanyaan lagi"
          isCompact={isCompact}
          tokens={tokens}
        />
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
