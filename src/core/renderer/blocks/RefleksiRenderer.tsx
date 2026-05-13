'use client';

import React from 'react';
import { PenLine, Sparkles, Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { RefleksiBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge } from './PremiumBlockEffects';

export const RefleksiRenderer = React.memo(function RefleksiRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: RefleksiBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  const [responses, setResponses] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  // ── Interactive store: score reporting ──────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  const allAnswered = (block.questions || []).length > 0 &&
    (block.questions || []).every((_, i) => responses[i]?.trim().length > 0);
  const answeredCount = Object.values(responses).filter(r => r.trim().length > 0).length;
  const totalQuestions = (block.questions || []).length;
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
      <div className="text-center p-5 rounded-2xl premium-card-glow"
        style={{
          background: tokens.color('bg'),
          border: '2px solid ' + tokens.colorAlpha('g', 0.3),
          boxShadow: tokens.raw.shadow.elevated,
        }}>
        <div className="text-3xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>🪞</div>
        <div className="font-black text-lg mb-2" style={{ fontFamily: tokens.fontFamily('display'), color: tokens.color('g') }}>
          Refleksi Selesai!
        </div>
        <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
          Terima kasih telah merenungkan pembelajaran hari ini. Jawabanmu menunjukkan pemahaman yang mendalam!
        </div>
        <div className="inline-flex gap-2 mb-4">
          {(block.questions || []).map((_, i) => (
            <div key={`refleksi-dot-${block.id || 'ref'}-${i}`} className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('g', 0.2), border: '1px solid ' + tokens.colorAlpha('g', 0.3) }}>
              <CheckCircle2 size={12} style={{ color: tokens.color('g') }} />
            </div>
          ))}
        </div>
        <div>
          <button className="px-5 py-2 rounded-xl font-extrabold transition-all hover:scale-105"
            onClick={() => { setResponses({}); setSubmitted(false); playSound('click'); }}
            style={{
              fontSize: '13px',
              background: 'linear-gradient(135deg, ' + tokens.color('p') + ', ' + tokens.color('c') + ')',
              color: tokens.color('bg'),
              boxShadow: '0 4px 16px ' + tokens.colorAlpha('p', 0.35),
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
    <div>
      {/* Header with icon */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: tokens.colorAlpha('p', 0.15),
            border: '1px solid ' + tokens.colorAlpha('p', 0.3),
            boxShadow: '0 0 12px ' + tokens.colorAlpha('p', 0.1),
          }}>
          <Sparkles size={16} style={{ color: tokens.color('p') }} />
        </div>
        <div>
          {block.title && (
            <h2 className="font-black leading-tight" style={{ fontFamily: tokens.fontFamily('display'), fontSize: isCompact ? '14px' : '18px', color: tokens.color('text') }}>
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
        style={{ fontSize: isCompact ? '11px' : '13px', color: tokens.muted(0.8) }}
        placeholder="Ketik intro..."
      />}

      {/* Questions */}
      {(block.questions || []).map((q, i) => {
        const qColor = q.warna || 'p';
        const hasResponse = responses[i]?.trim().length > 0;
        return (
          <div key={`refleksi-q-${q.teks?.slice(0,8)}-${i}`} className="rounded-xl p-3.5 mb-3 transition-all hover:-translate-y-0.5 min-w-0"
            style={{
              background: tokens.colorAlpha(qColor, 0.06),
              border: '1px solid ' + tokens.colorAlpha(qColor, hasResponse ? 0.35 : 0.2),
              borderLeft: '4px solid ' + (hasResponse ? tokens.color('g') : tokens.color(qColor)),
              boxShadow: tokens.raw.shadow.card,
            }}>
            <label className={`font-extrabold block mb-2 ${isCompact ? 'canvas-truncate-2' : ''}`}
              style={{ color: tokens.color(qColor), fontSize: isCompact ? '12px' : '14px' }}>
              {q.icon && <span className="mr-1">{q.icon}</span>} {q.teks}
            </label>
            {interactive ? (
              <div className="relative">
                <textarea className="w-full rounded-lg p-2.5 resize-y"
                  style={{
                    fontSize: isCompact ? '11px' : '13px',
                    color: tokens.color('text'),
                    background: tokens.subtleBg(0.06),
                    border: '1px solid ' + tokens.colorAlpha(hasResponse ? 'g' : qColor, hasResponse ? 0.3 : 0.2),
                    minHeight: isCompact ? '40px' : '50px',
                    transition: 'border-color 0.2s',
                  }}
                  placeholder={q.petunjuk}
                  value={responses[i] || ''}
                  onChange={(e) => setResponses(prev => ({ ...prev, [i]: e.target.value }))}
                  onInput={() => playSound('tap')}
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
                  fontSize: isCompact ? '10px' : '12px',
                  color: tokens.textSubtle(0.4),
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
      {interactive && !submitted && (
        <button
          className="w-full py-2.5 rounded-xl font-extrabold transition-all hover:scale-[1.02]"
          onClick={handleSubmit}
          disabled={!allAnswered}
          style={{
            fontSize: '13px',
            background: allAnswered
              ? 'linear-gradient(135deg, ' + tokens.color('p') + ', ' + tokens.color('c') + ')'
              : tokens.subtleBg(0.08),
            color: allAnswered ? tokens.color('bg') : tokens.muted(0.4),
            border: '1px solid ' + (allAnswered ? tokens.colorAlpha('p', 0.4) : tokens.subtleBorder(0.1)),
            boxShadow: allAnswered ? '0 4px 16px ' + tokens.colorAlpha('p', 0.35) : 'none',
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}>
          <Send size={14} className="inline mr-1" /> Kirim Refleksi
        </button>
      )}

      {block.penugasan && (
        <div className="mt-4 p-4 rounded-xl"
          style={{
            background: tokens.colorAlpha('p', 0.1),
            border: '1px solid ' + tokens.colorAlpha('p', 0.25),
            borderLeft: '4px solid ' + tokens.color('p'),
            boxShadow: tokens.raw.shadow.card,
          }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: tokens.colorAlpha('p', 0.2), boxShadow: '0 4px 12px ' + tokens.colorAlpha('p', 0.25) }}>
              <PenLine size={14} className="inline" style={{ color: tokens.color('p') }} />
            </div>
            <div className="font-extrabold" style={{ color: tokens.color('p'), fontSize: isCompact ? '12px' : '14px' }}>{block.penugasan.judul}</div>
          </div>
          <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-3' : ''}`} style={{ color: tokens.muted(0.8), fontSize: isCompact ? '11px' : '13px' }}>{block.penugasan.isi}</div>
          {block.penugasan.contoh && (
            <div className="mt-2 italic p-2 rounded-lg"
              style={{ fontSize: isCompact ? '10px' : '12px', color: tokens.textSubtle(0.5), background: tokens.colorAlpha('p', 0.06) }}>
              Contoh: {block.penugasan.contoh}
            </div>
          )}
        </div>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
