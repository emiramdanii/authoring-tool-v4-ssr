'use client';

import React from 'react';
import { Star, PartyPopper, RotateCcw, BookOpen, MessageSquare, CheckCircle2, XCircle, ScrollText, Bell } from 'lucide-react';
import type { SkenarioBlock } from '../../schema/types';
import type { TokenResolver } from '../types';
import { InlineTextEditor, useInlineEditor } from '../../editor/inline-editor/InlineTextEditor';
import { PremiumBlockWrapper, ReadingProgressIndicator, PremiumBadge, MicroInteraction } from './PremiumBlockEffects';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { fireConfetti } from '@/lib/confetti';

export const SkenarioRenderer = React.memo(function SkenarioRenderer({ block, tokens, interactive, isCompact, isEditing, pageIndex }: {
  block: SkenarioBlock; tokens: TokenResolver; interactive: boolean; isCompact: boolean; isEditing?: boolean; pageIndex?: number;
}) {
  // ── Inline editing hooks ─────────────────────────────────────
  const titleEditor = useInlineEditor({
    blockId: block.id,
    fieldKey: 'title',
    value: block.title ?? '',
    tag: 'span',
  });

  const [chapter, setChapter] = React.useState(0);
  const [history, setHistory] = React.useState<Array<{ chapterIdx: number; choiceIdx: number; good: boolean; pts: number }>>([]);
  const [selectedChoice, setSelectedChoice] = React.useState<{ choiceIdx: number; choice: NonNullable<typeof block.chapters[0]>['choices'][0] } | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);
  const timersRef = React.useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // ── Replay watcher: reset all state when replayGeneration bumps ──
  const replayGeneration = useInteractiveStore(s => s.replayGeneration);
  React.useEffect(() => {
    setChapter(0);
    setHistory([]);
    setSelectedChoice(null);
    setShowFeedback(false);
  }, [replayGeneration]);

  const chapters = block.chapters || [];
  const ch = chapters[chapter];
  const isCompleted = chapter >= chapters.length;

  // ── Interactive store: score reporting ──────────────────────
  const reportScore = useInteractiveStore(s => s.reportScore);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)); };
  }, []);

  // Report score on completion (guard: only fire once per completion cycle)
  const hasReportedRef = React.useRef(false);
  React.useEffect(() => {
    if (isCompleted && interactive && block.id && !hasReportedRef.current) {
      hasReportedRef.current = true;
      const totalPts = history.reduce((sum, h) => sum + h.pts, 0);
      const totalMax = chapters.length * 20;
      reportScore({
        elementId: block.id,
        pageIndex: pageIndex ?? 0,
        score: totalPts,
        maxScore: totalMax,
        completed: true,
      });
      playSound('complete');
      fireConfetti({ count: 60 });
    }
    if (!isCompleted) hasReportedRef.current = false;
  }, [isCompleted, interactive, block.id, history, chapters.length, reportScore, pageIndex]);

  const handleChoice = (choiceIdx: number) => {
    if (!ch || !interactive) return;
    const choice = ch.choices[choiceIdx];
    setHistory(prev => [...prev, { chapterIdx: chapter, choiceIdx, good: choice.good, pts: choice.pts }]);
    setSelectedChoice({ choiceIdx, choice });
    setShowFeedback(true);

    // Play sound based on choice quality
    if (choice.good) playSound('correct');
    else playSound('incorrect');

    const timer = setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      const nextCh = choice.nextChapter != null ? choice.nextChapter : chapter + 1;
      setChapter(nextCh);
      playSound('click');
    }, 3000);
    timersRef.current.push(timer);
  };

  const totalPts = React.useMemo(
    () => history.reduce((sum, h) => sum + h.pts, 0),
    [history],
  );
  const totalMax = chapters.length * 20; // Max 20 pts per chapter
  const green = tokens.color('g');
  const red = tokens.color('r');
  const yellow = tokens.color('y');

  return (
    <PremiumBlockWrapper tokens={tokens} accent="o" staggerIndex={0}>
      <ReadingProgressIndicator progress={1} tokens={tokens} accent="o" height={2} position="top" />
    <div className="mt-3 rounded-2xl overflow-hidden border-2 premium-card-glow"
      style={{ background: tokens.color('bg'), borderColor: tokens.colorAlpha('c', 0.3), boxShadow: tokens.raw.shadow.elevated }}>
      {/* HUD with gradient accent line */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, ' + tokens.color('c') + ', ' + yellow + ', ' + tokens.color('c') + ')' }} />
        <div className="flex items-center justify-between p-3 border-b-2"
          style={{ background: 'linear-gradient(90deg, ' + tokens.color('bg') + ', ' + tokens.color('bg2') + ')', borderColor: tokens.colorAlpha('c', 0.2) }}>
          <span className="font-black text-[11px]" style={{ color: yellow, fontFamily: tokens.fontFamily('display') }}>
            🎭 <InlineTextEditor {...titleEditor} style={{ color: yellow, fontFamily: tokens.fontFamily('display') }} />
          </span>
          <div className="flex gap-2">
            <PremiumBadge tokens={tokens} accent="y" variant="solid"><Star size={14} className="inline" /> {totalPts}</PremiumBadge>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
              style={{ background: tokens.colorAlpha('c', 0.15), color: tokens.color('c'), border: '1px solid ' + tokens.colorAlpha('c', 0.3) }}>
              Babak {Math.min(chapter + 1, chapters.length)}/{chapters.length}
            </span>
          </div>
        </div>
      </div>

      {/* ══ COMPLETION SCREEN ═══════════════════════════════════ */}
      {isCompleted && (
        <div className="p-6 text-center">
          <div className="text-4xl mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}><PartyPopper size={32} className="inline" /></div>
          <div className="font-black text-lg mb-2" style={{ fontFamily: tokens.fontFamily('display'), color: yellow }}>
            Skenario Selesai!
          </div>
          <div className="mb-4" style={{ fontSize: '13px', color: tokens.muted(0.8) }}>
            Kamu telah menyelesaikan semua {chapters.length} babak skenario.
          </div>
          {/* Score summary */}
          <div className="inline-flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl"
              style={{ background: tokens.colorAlpha('g', 0.12), border: '1px solid ' + tokens.colorAlpha('g', 0.3) }}>
              <div className="font-extrabold" style={{ color: green, fontSize: '12px' }}>Skor</div>
              <div className="font-black text-lg" style={{ color: green }}>{totalPts}/{totalMax}</div>
            </div>
            <div className="px-4 py-2 rounded-xl"
              style={{ background: tokens.colorAlpha('y', 0.12), border: '1px solid ' + tokens.colorAlpha('y', 0.3) }}>
              <div className="font-extrabold" style={{ color: yellow, fontSize: '12px' }}>Pilihan Baik</div>
              <div className="font-black text-lg" style={{ color: yellow }}>{history.filter(h => h.good).length}/{chapters.length}</div>
            </div>
          </div>
          {interactive && (
            <MicroInteraction tokens={tokens} accent="y" effect="squish">
            <button className="mt-4 px-5 py-2 rounded-xl text-[11px] font-extrabold transition-all hover:scale-105"
              onClick={() => { setChapter(0); setHistory([]); hasReportedRef.current = false; playSound('click'); }}
              style={{
                background: 'linear-gradient(135deg, ' + tokens.color('y') + ', ' + tokens.color('o') + ')',
                color: tokens.color('bg'),
                boxShadow: '0 4px 16px ' + tokens.colorAlpha('y', 0.35),
              }}>
              <RotateCcw size={14} className="inline" /> Ulangi Skenario
            </button>
            </MicroInteraction>
          )}
        </div>
      )}

      {/* Body — chapter content */}
      {ch && !isCompleted && !showFeedback && (
        <div className="p-4">
          {/* Setup */}
          {ch.setup && ch.setup.length > 0 && (
            <div className="mb-4 space-y-2">
              {ch.setup.map((line, i) => {
                const isNarrator = line.speaker.toUpperCase() === 'NARRATOR' || line.speaker.toUpperCase() === 'NARATOR';
                return (
                  <div key={`skenario-setup-${line.speaker?.slice(0,6)}-${i}`} className={`flex gap-2 ${isNarrator ? 'italic' : ''}`}>
                    <span className="font-bold flex-shrink-0 mt-0.5" style={{ fontSize: '12px', color: isNarrator ? tokens.textSubtle(0.4) : tokens.color('r') }}>
                      {isNarrator ? <BookOpen size={14} className="inline" /> : line.speaker ? `${line.speaker}:` : ''}
                    </span>
                    <span className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: '13px', color: isNarrator ? tokens.textSubtle(0.6) : tokens.textSecondary(0.75), wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Choice prompt */}
          {ch.choicePrompt && (
            <div className="italic mb-3 p-2.5 rounded-lg" style={{
                fontSize: '12px', color: tokens.muted(0.7),
                background: tokens.colorAlpha('c', 0.08),
                border: '1px solid ' + tokens.colorAlpha('c', 0.2),
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}>
              <MessageSquare size={14} className="inline" /> <span className={isCompact ? 'canvas-truncate-2' : ''}>{ch.choicePrompt}</span>
            </div>
          )}

          {/* Choices — interactive or read-only preview */}
          <div className="space-y-2.5">
            {ch.choices.map((c, j) => (
              interactive ? (
                <button key={`skenario-choice-${c.label?.slice(0,8)}-${j}`} onClick={() => handleChoice(j)}
                  className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: tokens.subtleBg(0.05),
                    border: `1px solid ${tokens.subtleBorder(0.12)}`,
                    boxShadow: tokens.raw.shadow.card,
                  }}>
                  <span className="text-lg mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ fontSize: '13px', color: tokens.color('text'), wordBreak: 'break-word' }}>{c.label}</div>
                    {c.detail && <div className={`mt-0.5 ${isCompact ? 'canvas-truncate-1' : 'line-clamp-2'}`} style={{ fontSize: '12px', color: tokens.textSubtle(0.6), wordBreak: 'break-word' }}>{c.detail}</div>}
                  </div>
                </button>
              ) : (
                <div key={`skenario-choice-ro-${c.label?.slice(0,8)}-${j}`}
                  className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left"
                  style={{
                    background: tokens.subtleBg(0.05),
                    border: `1px solid ${tokens.subtleBorder(0.12)}`,
                    boxShadow: tokens.raw.shadow.card,
                  }}>
                  <span className="text-lg mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ fontSize: '13px', color: tokens.color('text'), wordBreak: 'break-word' }}>{c.label}</div>
                    {c.detail && <div className={`mt-0.5 ${isCompact ? 'canvas-truncate-1' : 'line-clamp-2'}`} style={{ fontSize: '12px', color: tokens.textSubtle(0.6), wordBreak: 'break-word' }}>{c.detail}</div>}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && selectedChoice && ch && (
        <div className="p-4 space-y-2.5">
          <div className="p-3 rounded-xl text-center"
            style={{
              background: selectedChoice.choice.good ? tokens.colorAlpha('g', 0.12) : tokens.colorAlpha('r', 0.12),
              border: '2px solid ' + (selectedChoice.choice.good ? tokens.colorAlpha('g', 0.4) : tokens.colorAlpha('r', 0.4)),
              boxShadow: selectedChoice.choice.good ? '0 0 16px ' + tokens.colorAlpha('g', 0.15) : '0 0 16px ' + tokens.colorAlpha('r', 0.15),
            }}>
            <div className="text-lg mb-1">{selectedChoice.choice.resultTitle || (selectedChoice.choice.good ? <CheckCircle2 size={20} className="inline text-emerald-400" /> : <XCircle size={20} className="inline text-red-400" />)}</div>
            <div className="text-xs font-bold" style={{ color: selectedChoice.choice.good ? tokens.color('g') : tokens.color('r') }}>
              {selectedChoice.choice.good
                ? (selectedChoice.choice.feedbackGood || 'Pilihan tepat!')
                : (selectedChoice.choice.feedbackBad || 'Coba lagi!')}
            </div>
          </div>

          {selectedChoice.choice.resultBody && (
            <div className="p-3 rounded-xl"
              style={{
                background: tokens.subtleBg(0.05),
                border: '1px solid ' + tokens.subtleBorder(0.1),
              }}>
              <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: '12px', color: tokens.textSecondary(0.75) }}>{selectedChoice.choice.resultBody}</div>
            </div>
          )}

          {selectedChoice.choice.norma && (
            <div className="p-3 rounded-xl"
              style={{ background: tokens.colorAlpha('y', 0.1), border: '1px solid ' + tokens.colorAlpha('y', 0.25) }}>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: yellow }}><ScrollText size={14} className="inline" /> Kaitan Norma</div>
              <div className={`leading-relaxed ${isCompact ? 'canvas-truncate-2' : ''}`} style={{ fontSize: '12px', color: tokens.textSecondary(0.65) }}>{selectedChoice.choice.norma}</div>
            </div>
          )}

          {selectedChoice.choice.consequences && selectedChoice.choice.consequences.length > 0 && (
            <div className="p-3 rounded-xl"
              style={{
                background: tokens.subtleBg(0.05),
                border: '1px solid ' + tokens.subtleBorder(0.1),
              }}>
              <div className="font-bold mb-1.5" style={{ fontSize: '12px', color: tokens.textSubtle(0.5) }}><Bell size={14} className="inline" /> Dampak</div>
              {selectedChoice.choice.consequences.map((con, k) => (
                <div key={`skenario-con-${con.text?.slice(0,6)}-${k}`} className={`flex items-start gap-1.5 leading-relaxed mb-1 ${isCompact ? 'canvas-truncate-1' : ''}`} style={{ fontSize: '12px', color: tokens.muted(0.7) }}>
                  <span className="mt-px">{con.icon}</span> {con.text}
                </div>
              ))}
            </div>
          )}

          {selectedChoice.choice.pts > 0 && (
            <div className="text-center">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full"
                style={{ background: tokens.colorAlpha('g', 0.15), color: green, boxShadow: '0 0 8px ' + tokens.colorAlpha('g', 0.2) }}>
                +{selectedChoice.choice.pts} poin
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {chapters.length > 0 && (
        <div className="flex gap-1 p-3 border-t"
          style={{ background: tokens.color('bg'), borderColor: tokens.colorAlpha('c', 0.15) }}>
          {chapters.map((_, i) => (
            <div key={`skenario-prog-${block.id || 'sk'}-${i}`} className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background: i < chapter ? green : i === chapter ? yellow : tokens.colorAlpha('muted', 0.2),
                boxShadow: i === chapter ? '0 0 8px ' + yellow : i < chapter ? '0 0 4px ' + tokens.colorAlpha('g', 0.3) : 'none',
              }} />
          ))}
        </div>
      )}
    </div>
    </PremiumBlockWrapper>
  );
});
