'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { useInteractiveStore } from '@/store/interactive-store';

// ── Skenario Template ─────────────────────────────────────────
// Phase 4: Interactive choices — clickable in play mode with branching navigation

export function SkenarioTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--r', '#f472b6');
  const green = getPaletteColor(palette, '--g', '#34d399');
  const red = getPaletteColor(palette, '--r', '#f87171');
  const skenario = (td.skenario as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  // Phase 4: Track current chapter and choice history for interactive mode
  const [currentChapter, setCurrentChapter] = useState(0);
  const [choiceHistory, setChoiceHistory] = useState<Array<{ chapter: number; choiceIdx: number; good: boolean }>>([]);
  const [showFeedback, setShowFeedback] = useState<{ good: boolean; message: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when not in interactive mode
  useEffect(() => {
    if (!interactive) {
      setCurrentChapter(0);
      setChoiceHistory([]);
      setShowFeedback(null);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [interactive]);

  const handleChoice = useCallback((chapterIdx: number, choiceIdx: number, choice: Record<string, unknown>) => {
    const isGood = Boolean(choice.good);
    const nextChapter = choice.nextChapter != null ? Number(choice.nextChapter) : chapterIdx + 1;

    setChoiceHistory(prev => [...prev, { chapter: chapterIdx, choiceIdx, good: isGood }]);

    // Show brief feedback
    setShowFeedback({
      good: isGood,
      message: isGood
        ? String(choice.feedbackGood || 'Pilihan tepat!')
        : String(choice.feedbackBad || 'Coba lagi!'),
    });

    // Auto-advance after feedback
    timeoutRef.current = setTimeout(() => {
      setShowFeedback(null);
      if (nextChapter < skenario.length && nextChapter >= 0) {
        setCurrentChapter(nextChapter);
      } else if (nextChapter >= skenario.length) {
        // Completed all chapters — report score
        const goodCount = [...choiceHistory, { chapter: chapterIdx, choiceIdx, good: isGood }].filter(c => c.good).length;
        const totalChoices = [...choiceHistory, { chapter: chapterIdx, choiceIdx, good: isGood }].length;
        reportScore({
          elementId: 'skenario-template',
          pageIndex: interactivePageIdx,
          score: goodCount,
          maxScore: totalChoices,
          completed: true,
        });
      }
    }, 1500);
  }, [choiceHistory, skenario.length, reportScore, interactivePageIdx]);

  const currentCh = skenario[currentChapter];
  const totalGoodChoices = choiceHistory.filter(c => c.good).length;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>🎭</div>
        <div>
          <EditableText
            value={String(td.skenarioTitle || 'Skenario Interaktif')}
            fieldKey="skenarioTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Skenario"
          />
          <div className="text-[9px] text-white/40">
            {interactive
              ? `Babak ${currentChapter + 1}/${skenario.length} • ${totalGoodChoices} benar`
              : `${skenario.length} babak`
            }
          </div>
        </div>
      </div>

      {/* ── Interactive Mode: Show current chapter with clickable choices ── */}
      {interactive && skenario.length > 0 && currentCh ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Current chapter card */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{String(currentCh.charEmoji || '🧑')}</span>
              <div>
                <div className="text-[11px] font-bold text-white">
                  {currentCh.title ? String(currentCh.title) : `Babak ${currentChapter + 1}`}
                </div>
                {Boolean(currentCh.choicePrompt) && (
                  <div className="text-[10px] text-white/60 italic mt-0.5">
                    {String(currentCh.choicePrompt)}
                  </div>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 mb-2">
              {skenario.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i < currentChapter
                      ? 'w-4 bg-emerald-500'
                      : i === currentChapter
                        ? 'w-6 bg-pink-400'
                        : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Choice buttons */}
            {Array.isArray(currentCh.choices) && !showFeedback && (
              <div className="space-y-2">
                {(currentCh.choices as Array<Record<string, unknown>>).map((c, j) => (
                  <button
                    key={j}
                    onClick={() => handleChoice(currentChapter, j, c)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'rgba(255,255,255,.05)',
                      border: '1px solid rgba(255,255,255,.15)',
                    }}
                  >
                    <span className="text-lg">{String(c.icon || '🤔')}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-white truncate">
                        {String(c.label || `Pilihan ${j + 1}`)}
                      </div>
                      {Boolean(c.desc) && (
                        <div className="text-[8px] text-white/40 truncate">
                          {String(c.desc)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Feedback overlay */}
            {showFeedback && (
              <div className={`p-3 rounded-lg text-center transition-all ${
                showFeedback.good
                  ? 'bg-emerald-500/20 border border-emerald-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <div className="text-xl mb-1">{showFeedback.good ? '✅' : '❌'}</div>
                <div className={`text-xs font-bold ${showFeedback.good ? 'text-emerald-300' : 'text-red-300'}`}>
                  {showFeedback.message}
                </div>
              </div>
            )}
          </div>

          {/* Choice history summary */}
          {choiceHistory.length > 0 && (
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
              <div className="text-[8px] text-white/30 font-bold mb-1">Riwayat Pilihan</div>
              {choiceHistory.map((h, i) => {
                const ch = skenario[h.chapter];
                const choice = Array.isArray(ch?.choices)
                  ? (ch.choices as Array<Record<string, unknown>>)[h.choiceIdx]
                  : null;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[8px]">
                    <span className={h.good ? 'text-emerald-400' : 'text-red-400'}>
                      {h.good ? '✓' : '✗'}
                    </span>
                    <span className="text-white/50">Babak {h.chapter + 1}:</span>
                    <span className="text-white/70 truncate">
                      {choice ? String(choice.label || `Pilihan ${h.choiceIdx + 1}`) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : !interactive && skenario.length > 0 ? (
        /* ── Design Mode: Show all chapters as preview cards ── */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {skenario.map((ch, i) => (
            <div key={i} className={`p-2 rounded-lg border ${
              i === currentChapter
                ? 'bg-pink-500/10 border-pink-500/30'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{String(ch.charEmoji || '🧑')}</span>
                <span className="text-[10px] font-bold text-white">Babak {i + 1}</span>
                {Boolean(ch.title) && <span className="text-[8px] text-white/40 truncate">{String(ch.title)}</span>}
              </div>
              {Boolean(ch.choicePrompt) && (
                <div className="text-[8px] text-white/50 italic">{String(ch.choicePrompt)}</div>
              )}
              {Array.isArray(ch.choices) && (
                <div className="flex gap-1 mt-1">
                  {(ch.choices as Array<Record<string, unknown>>).map((c, j) => (
                    <div key={j} className="px-1.5 py-0.5 rounded text-[7px]"
                      style={{
                        background: c.good ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)',
                        color: c.good ? '#34d399' : '#f87171',
                      }}>
                      {String(c.icon || '🤔')} {String(c.label || `Pilihan ${j + 1}`)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🎭</span>
          <span className="text-[10px]">{interactive ? 'Belum ada skenario tersedia' : 'Tambah skenario di panel Konten → Skenario'}</span>
        </div>
      )}
    </div>
  );
}
