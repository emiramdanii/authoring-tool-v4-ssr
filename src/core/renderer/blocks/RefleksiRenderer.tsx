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

  // ── Educational design tokens ──────────────────────────────
  const edu = tokens.edu('refleksi', isCompact);

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
      // Report completion without inflating actual score — refleksi is
      // reflection-based, not scored. Score (0, 0) allows the bridge
      // to mark the page as completed via markPageReflected, but won't
      // add to the Hasil page's total score.
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: 0,
        maxScore: 0,
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
      <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
      <div className="text-center p-5 rounded-2xl"
        style={{
          ...edu.cardStyle(),
        }}>
        <div className="mb-3">
          <span className="material-symbols-outlined" style={ { fontSize: '28px' } }>check_circle</span>
        </div>
        <div className="font-bold mb-2" style={{ ...edu.heading(), color: edu.textColor() }}>
          Refleksi Selesai
        </div>
        <div className="mb-4" style={{ ...edu.body(), color: edu.mutedText(0.7) }}>
          Terima kasih telah merenungkan pembelajaran hari ini.
        </div>
        <div className="inline-flex gap-2 mb-4">
          {(block.questions || []).map((_, i) => (
            <div key={`refleksi-dot-${block.id || 'ref'}-${i}`} className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: tokens.accentBg('g', 0.1) }}>
              <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>check_circle</span>
            </div>
          ))}
        </div>
        <div>
          <button className={`px-5 py-2 rounded-xl font-bold ${tokens.iosButtonTw(true)}`}
            onClick={() => { setResponses({}); setSubmitted(false); playSound('click'); }}
            style={{
              ...edu.bodyLg(), fontWeight: 700,
              ...tokens.iosButtonPadding('md'),
              color: edu.accent(),
              background: edu.accentAlpha(0.08),
              border: `1px solid ${edu.accentBorder()}`,
            }}>
            <span className="material-symbols-outlined inline" style={ { fontSize: '14px' } }>refresh</span> Tulis Ulang
          </button>
        </div>
      </div>
      </PremiumBlockWrapper>
    );
  }

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
    <ReadingProgressIndicator progress={progress} tokens={tokens} accent="c" height={2} position="top" />
    <div style={{ maxWidth: tokens.narrowWidth(), margin: '0 auto' }}>
      {/* Header with icon */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="rounded-xl flex items-center justify-center"
          style={{
            width: edu.iconSize('md'), height: edu.iconSize('md'),
            background: edu.accentAlpha(0.08),
            border: `1px solid ${edu.accentAlpha(0.15)}`,
          }}>
          <PenLine size={16} style={{ color: edu.accent() }} />
        </div>
        <div>
          {block.title && (
            <h2 className="font-black leading-tight" style={{ ...edu.heading(), color: edu.textColor() }}>
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
        style={{ ...edu.body(), color: edu.mutedText(0.8), wordBreak: 'break-word', overflowWrap: 'break-word' }}
        placeholder="Ketik intro..."
      />}

      {/* Questions */}
      {questions.map((q, i) => {
        const qColor = q.warna || 'p';
        const hasResponse = responses[i]!?.trim().length > 0;
        return (
          <div key={`refleksi-q-${q.teks?.slice(0,8)}-${i}`} className={`rounded-xl min-w-0 ${isCompact ? 'mb-3' : 'mb-10'}`}
            style={{
              ...edu.componentPadding(),
              background: edu.cardBg(),
              border: `1px solid ${tokens.subtleBorder(0.08)}`,
              borderLeft: `${edu.stripeWidth()}px solid ${tokens.color(hasResponse ? 'g' : qColor)}`,
              ...edu.transition('background-color, border-color, box-shadow, border-left-color', 'standard'),
              ...edu.entrance(i),
            }}>
            <label className={`font-bold block mb-2 ${isCompact ? 'canvas-truncate-2' : ''}`}
              style={{ ...edu.bodyLg(), fontWeight: 700, color: tokens.color(qColor), lineHeight: isCompact ? '1.4' : '1.8' }}>
              {q.icon && <span className="mr-1">{q.icon}</span>} <RichText content={q.teks ?? ''} />
            </label>
            {interactive ? (
              <div className="relative">
                <textarea className={`w-full rounded-lg p-2.5 resize-y ${tokens.iosFocusRing()}`}
                  style={{
                    ...edu.body(), color: edu.textColor(),
                    background: edu.cardBg(),
                    border: `1px solid ${tokens.subtleBorder(0.12)}`,
                    minHeight: isCompact ? '32px' : '50px',
                    maxHeight: isCompact ? '60px' : undefined,
                    ...edu.transition('border-color, box-shadow', 'fast'),
                  }}
                  placeholder={q.petunjuk}
                  value={responses[i] || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
                />
                {hasResponse && (
                  <div className="absolute top-2 right-2">
                    <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>check_circle</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={`w-full mt-1 rounded-lg p-2.5 ${isCompact ? 'min-h-[28px]' : 'min-h-[40px]'}`}
                style={{
                  ...edu.caption(), color: edu.mutedText(0.65),
                  background: edu.cardBg(),
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
            ...edu.bodyLg(), fontWeight: 700, color: allAnswered ? edu.accent() : edu.mutedText(0.4),
            ...tokens.iosButtonPadding('md'),
            background: allAnswered
              ? edu.accentAlpha(0.12)
              : tokens.subtleBg(0.04),
            border: '1px solid ' + (allAnswered ? edu.accentAlpha(0.25) : tokens.subtleBorder(0.08)),
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}>
          <Send size={14} className="inline mr-1" /> Kirim Refleksi
        </button>
      )}

      {block.penugasan && !isCompressed && (
        <div className={`rounded-xl ios-entrance-card ${isCompact ? 'mt-2' : 'mt-4'}`}
          style={{
            ...tokens.nestedCardStyle(),
            ...edu.nestedPadding(),
            borderLeft: `${edu.stripeWidth()}px solid ${edu.accent()}`,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <PenLine size={14} style={{ color: edu.accent() }} />
            <div className="font-bold" style={{ ...edu.bodyLg(), fontWeight: 700, color: edu.accent() }}>{block.penugasan.judul}</div>
          </div>
          <RichText content={block.penugasan.isi ?? ''} className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ ...edu.body(), color: edu.mutedText(0.8) }} />
          {/* V3-PHASE-4: Hide "Contoh" in compact mode to save vertical space.
              In canvas mode, teachers edit content but don't need to see the
              example. In preview/export mode (non-compact), the example shows. */}
          {block.penugasan.contoh && !isCompact && (
            <div className="mt-2 italic p-2 rounded-lg"
              style={{ ...edu.caption(), color: tokens.textSubtle(0.5), background: edu.accentAlpha(0.06) }}>
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
