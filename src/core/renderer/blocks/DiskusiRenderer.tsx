'use client';

import React from 'react';
import { MessageCircle, Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { DiskusiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge } from './PremiumBlockEffects';

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
      <div className="rounded-2xl p-5 text-center"
        style={{
          background: tokens.colorAlpha('c', 0.1),
          border: '2px solid ' + tokens.colorAlpha('c', 0.3),
          boxShadow: tokens.raw.shadow.card + ', 0 0 24px ' + tokens.colorAlpha('c', 0.08),
          animation: 'popSuccess 0.5s ease-out',
        }}>
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>💬</div>
        <div className="font-black text-lg mb-2" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('c') }}>
          Diskusi Selesai!
        </div>
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Terima kasih telah berdiskusi! Pendapatmu sangat berharga untuk pembelajaran bersama.
        </div>
        <div className="inline-flex gap-2 mb-4">
          {questions.map((_, i) => (
            <div key={`diskusi-dot-${block.id || 'd'}-${i}`} className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('c', 0.2), border: '1px solid ' + tokens.colorAlpha('c', 0.3) }}>
              <CheckCircle2 size={12} style={{ color: tokens.color('c') }} />
            </div>
          ))}
        </div>
        <div>
          <button className="px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setResponses({}); setSubmitted(false); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('c') + ', ' + tokens.color('y') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('c', 0.35),
            }}>
            <RotateCcw size={14} className="inline" /> Diskusi Ulang
          </button>
        </div>
      </div>
      </PremiumBlockWrapper>
    );
  }

  return (
    <PremiumBlockWrapper tokens={tokens} accent="c" staggerIndex={0}>
    <ReadingProgressIndicator progress={progress} tokens={tokens} accent="c" height={2} position="top" />
    <div className="mt-3 rounded-2xl p-4 premium-card-glow"
      style={{
        background: tokens.colorAlpha('c', 0.1),
        border: '2px solid ' + tokens.colorAlpha('c', 0.3),
        boxShadow: tokens.raw.shadow.card + ', 0 0 24px ' + tokens.colorAlpha('c', 0.08),
      }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: tokens.colorAlpha('c', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('c', 0.25) }}>
          <MessageCircle size={14} className="inline" style={{ color: tokens.color('c') }} />
        </div>
        <div className="font-extrabold" style={{ color: tokens.color('c'), fontSize: isCompact ? '12px' : '14px' }}>
          <InlineTextEditor
            {...titleEditor}
            className="font-extrabold"
            style={{ color: tokens.color('c'), fontSize: 'inherit' }}
          />
        </div>
        {/* Progress indicator */}
        {interactive && questions.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] font-bold" style={{ color: tokens.color('c') }}>
              {Object.values(responses).filter(r => r.trim().length > 0).length}/{questions.length}
            </span>
          </div>
        )}
      </div>
      {block.intro && <InlineTextEditor
        {...introEditor}
        className={`mt-1 leading-relaxed font-bold mb-3 ${isCompact ? 'canvas-truncate-2' : ''}`}
        style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text') }}
        placeholder="Ketik intro..."
      />}

      {questions.map((q, i) => {
        const qColor = q.color || 'c';
        const hasResponse = responses[i]?.trim().length > 0;
        return (
        <div key={`diskusi-q-${q.teks?.slice(0,8)}-${i}`} className="mt-4 rounded-xl p-3 min-w-0"
          style={{
            background: tokens.subtleBg(0.05),
            border: '1px solid ' + tokens.colorAlpha(qColor, hasResponse ? 0.35 : 0.15),
            borderLeft: '3px solid ' + (hasResponse ? tokens.color('g') : tokens.color(qColor)),
            transition: 'border-color 0.2s',
          }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: isCompact ? '14px' : '16px' }}>{q.icon}</span>
            <span className="font-extrabold" style={{ color: tokens.color(qColor), fontSize: isCompact ? '12px' : '14px' }}>{q.label}</span>
            {hasResponse && interactive && (
              <CheckCircle2 size={12} style={{ color: tokens.color('g') }} />
            )}
          </div>
          <p className={`mt-1.5 leading-relaxed font-bold ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: isCompact ? '12px' : '14px', color: tokens.color('text'), wordBreak: 'break-word', overflowWrap: 'break-word' }}>{q.teks}</p>
          {interactive ? (
            <textarea className="w-full mt-2 rounded-lg p-2.5 resize-y"
              style={{
                fontSize: isCompact ? '11px' : '13px',
                color: tokens.color('text'),
                background: tokens.subtleBg(0.06),
                border: '1px solid ' + tokens.colorAlpha(hasResponse ? 'g' : qColor, hasResponse ? 0.3 : 0.2),
                minHeight: isCompact ? '40px' : '60px',
                transition: 'border-color 0.2s',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
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

      {/* Submit button */}
      {interactive && !submitted && questions.length > 0 && (
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
            boxShadow: allAnswered ? '0 4px 16px ' + tokens.colorAlpha('c', 0.35) : 'none',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}>
          <Send size={14} className="inline mr-1" /> Kirim Diskusi
        </button>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
