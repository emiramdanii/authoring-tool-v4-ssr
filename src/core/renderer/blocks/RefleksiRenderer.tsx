'use client';

import React from 'react';
import { PenLine, Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { RefleksiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { RichText } from './RichText';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge } from './PremiumBlockEffects';
import { useBlockCompression } from '../../layout/useBlockCompression';
import { ShowMoreButton } from '../../layout/ShowMoreButton';
import type { CompressionDecision } from '../../layout/CompressionEngine';

export const RefleksiRenderer = React.memo(function RefleksiRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex, compression }: {
  block: RefleksiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number; compression?: CompressionDecision;
}) {
  const [responses, setResponses] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  // ── Interactive store: score reporting ──────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  const allQuestions = block.questions || [];

  // ── Compression-aware question visibility (reveal-set) ──────
  const { visibleCount, hasMore, hiddenCount, showMore, isCompressed } = useBlockCompression({
    compression,
    totalItems: allQuestions.length,
  });
  const questions = isCompressed ? allQuestions.slice(0, visibleCount) : allQuestions;

  const allAnswered = allQuestions.length > 0 &&
    allQuestions.every((_, i) => responses[i]!?.trim().length > 0);
  const answeredCount = Object.values(responses).filter(r => r.trim().length > 0).length;
  const totalQuestions = allQuestions.length;
  const progress = totalQuestions > 0 ? answeredCount / totalQuestions : 0;

  const handleSubmit = () => {
    if (!interactive || !allAnswered) return;
    setSubmitted(true);
    if (block.id) {
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: (block.questions || []).length * 10,
        maxScore: (block.questions || []).length * 10,
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

  // ══ SUBMITTED SCREEN ═══════════════════════════════════════
  if (submitted && interactive) {
    return (
      <PremiumBlockWrapper tokens={tokens} accent="p" staggerIndex={0}>
      <div className="text-center p-5 rounded-2xl"
        style={{
          ...tokens.cardStyle(),
        }}>
        <div className="mb-3">
          <CheckCircle2 size={28} style={{ color: tokens.color('g') }} />
        </div>
        <div className="font-bold text-lg mb-2" style={{ color: tokens.color('text') }}>
          Refleksi Selesai
        </div>
        <div className="mb-4" style={{ ...tokens.iosTypography('subheadline', { color: tokens.muted(0.7) }) }}>
          Terima kasih telah merenungkan pembelajaran hari ini.
        </div>
        <div className="inline-flex gap-2 mb-4">
          {(block.questions || []).map((_, i) => (
            <div key={`refleksi-dot-${block.id || 'ref'}-${i}`} className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: tokens.accentBg('g', 0.1) }}>
              <CheckCircle2 size={10} style={{ color: tokens.color('g') }} />
            </div>
          ))}
        </div>
        <div>
          <button className={`px-5 py-2 rounded-xl font-bold ${tokens.iosButtonTw(true)}`}
            onClick={() => { setResponses({}); setSubmitted(false); playSound('click'); }}
            style={{
              ...tokens.iosTypography('callToAction', { color: tokens.color('p') }),
              ...tokens.iosButtonPadding('md'),
              background: tokens.accentBg('p', 0.08),
              border: `1px solid ${tokens.colorAlpha('p', 0.2)}`,
            }}>
            <RotateCcw size={14} className="inline" /> Tulis Ulang
          </button>
        </div>
      </div>
      </PremiumBlockWrapper>
    );
  }

  return (
    <PremiumBlockWrapper tokens={tokens} accent="p" staggerIndex={0}>
    <ReadingProgressIndicator progress={progress} tokens={tokens} accent="p" height={2} position="top" />
    <div style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto' }}>
      {/* Header with icon */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="rounded-xl flex items-center justify-center"
          style={{
            ...tokens.iosIconSize('md'),
            background: tokens.accentBg('p', 0.08),
            border: `1px solid ${tokens.colorAlpha('p', 0.15)}`,
          }}>
          <PenLine size={16} style={{ color: tokens.color('p') }} />
        </div>
        <div>
          {block.title && (
            <h2 className="font-black leading-tight" style={{ fontFamily: tokens.fontFamily('display'), ...tokens.iosTypography('title3', { fontSize: isCompact ? 14 : 18, color: tokens.color('text') }) }}>
              <InlineTextEditor
                {...titleEditor}
                className="font-black leading-tight"
                style={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
              />
            </h2>
          )}
        </div>
      </div>

      {block.intro && <InlineTextEditor
        {...introEditor}
        className="mb-4 leading-relaxed"
        style={{ ...tokens.iosTypography('subheadline', { fontSize: isCompact ? 11 : 13, color: tokens.muted(0.8), wordBreak: 'break-word', overflowWrap: 'break-word' }) }}
        placeholder="Ketik intro..."
      />}

      {/* Questions */}
      {questions.map((q, i) => {
        const qColor = q.warna || 'p';
        const hasResponse = responses[i]!?.trim().length > 0;
        return (
          <div key={`refleksi-q-${q.teks?.slice(0,8)}-${i}`} className="rounded-xl mb-10 min-w-0"
            style={{
              ...tokens.iosCardPadding(isCompact),
              background: tokens.color('card'),
              border: `1px solid ${tokens.subtleBorder(0.08)}`,
              borderLeft: tokens.accentStripe(hasResponse ? 'g' : qColor, 3),
              // Sprint 3C: border-left-color transition for response state change
              // Uses iosTransitionStyle for token-driven timing
              ...tokens.iosTransitionStyle('background-color, border-color, box-shadow, border-left-color', 'standard'),
              // Sprint 3C: Subtle entrance animation via iosEntranceStyle
              ...tokens.iosEntranceStyle(i, 'slideIn'),
            }}>
            <label className={`font-bold block mb-2 ${isCompact ? 'canvas-truncate-2' : ''}`}
              style={{ ...tokens.iosTypography('headline', { fontSize: isCompact ? 12 : 14, color: tokens.color(qColor) }), lineHeight: '1.8' }}>
              {q.icon && <span className="mr-1">{q.icon}</span>} <RichText content={q.teks ?? ''} />
            </label>
            {interactive ? (
              <div className="relative">
                <textarea className={`w-full rounded-lg p-2.5 resize-y ${tokens.iosFocusRing()}`}
                  style={{
                    ...tokens.iosTypography('subheadline', { color: tokens.color('text') }),
                    background: tokens.color('card'),
                    border: `1px solid ${tokens.subtleBorder(0.12)}`,
                    minHeight: isCompact ? '40px' : '50px',
                    // Sprint 3C: Use iosTransitionStyle for focus border transition
                    ...tokens.iosTransitionStyle('border-color, box-shadow'),
                  }}
                  placeholder={q.petunjuk}
                  value={responses[i] || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
                />
                {hasResponse && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 size={14} style={{ color: tokens.color('g') }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full mt-1 rounded-lg p-2.5 min-h-[40px]"
                style={{
                  ...tokens.iosTypography('caption1', { color: tokens.muted(0.65) }),
                  background: tokens.color('card'),
                  border: `1px dashed ${tokens.subtleBorder(0.12)}`,
                }}>
                {q.petunjuk}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit button */}
      {interactive && !submitted && (
        <button
          className={`w-full py-2.5 rounded-xl font-bold ${tokens.iosButtonTw(allAnswered)}`}
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            ...tokens.iosTypography('callToAction', { color: allAnswered ? tokens.color('p') : tokens.muted(0.4) }),
            ...tokens.iosButtonPadding('md'),
            background: allAnswered
              ? tokens.accentBg('p', 0.12)
              : tokens.subtleBg(0.04),
            border: '1px solid ' + (allAnswered ? tokens.colorAlpha('p', 0.25) : tokens.subtleBorder(0.08)),
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}>
          <Send size={14} className="inline mr-1" /> Kirim Refleksi
        </button>
      )}

      {block.penugasan && !isCompressed && (
        <div className="mt-4 rounded-xl ios-entrance-card"
          style={{
            ...tokens.nestedCardStyle(),
            ...tokens.iosNestedPadding(isCompact),
            borderLeft: tokens.accentStripe('p', 3),
          }}>
          <div className="flex items-center gap-2 mb-2">
            <PenLine size={14} style={{ color: tokens.color('p') }} />
            <div className="font-bold" style={{ ...tokens.iosTypography('headline', { color: tokens.color('p'), fontSize: isCompact ? 12 : 14 }) }}>{block.penugasan.judul}</div>
          </div>
          <RichText content={block.penugasan.isi ?? ''} className={`leading-relaxed ${isCompact ? 'canvas-truncate-3' : ''}`} style={{ ...tokens.iosTypography('subheadline', { color: tokens.muted(0.8), fontSize: isCompact ? 11 : 13 }) }} />
          {block.penugasan.contoh && (
            <div className="mt-2 italic p-2 rounded-lg"
              style={{ ...tokens.iosTypography('caption1', { color: tokens.textSubtle(0.5), fontSize: isCompact ? 10 : 12 }), background: tokens.colorAlpha('p', 0.06) }}>
              Contoh: <RichText content={block.penugasan.contoh ?? ''} />
            </div>
          )}
        </div>
      )}
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
