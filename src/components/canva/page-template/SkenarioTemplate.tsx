'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { useInteractiveStore } from '@/store/interactive-store';
import { playSound } from '@/lib/sounds';
import { TemplateNavButton } from './TemplateNavButton';

// ── Skenario Template ─────────────────────────────────────────
// Renders full interactive scenario with:
// - Setup dialogue (narrative context before choices)
// - Choice buttons with detail descriptions
// - Rich feedback: resultTitle, resultBody, consequences, norma
// - Scoring by pts/level
// - Branching navigation (nextChapter)

export function SkenarioTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f472b6');
  const green = getPaletteColor(palette, '--g', '#34d399');
  const red = getPaletteColor(palette, '--r', '#f87171');
  const yellow = getPaletteColor(palette, '--y', '#f9c82e');
  const skenario = (td.skenario as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  // Phase 4: Track current chapter and choice history for interactive mode
  const [currentChapter, setCurrentChapter] = useState(0);
  const [choiceHistory, setChoiceHistory] = useState<Array<{ chapter: number; choiceIdx: number; good: boolean; pts: number }>>([]);
  const [selectedChoice, setSelectedChoice] = useState<{ choiceIdx: number; choice: Record<string, unknown> } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track skenario identity for proper reset on data swap
  const skenarioId = (td.skenarioId || td._id) as string | undefined;
  const [lastScenarioId, setLastScenarioId] = useState(skenarioId);
  useEffect(() => {
    if (skenarioId !== lastScenarioId) {
      setCurrentChapter(0);
      setChoiceHistory([]);
      setSelectedChoice(null);
      setShowFeedback(false);
      setLastScenarioId(skenarioId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [skenarioId, lastScenarioId]);

  // Reset currentChapter when skenario data changes and currentChapter is out of bounds
  useEffect(() => {
    if (skenario && currentChapter >= skenario.length) {
      setCurrentChapter(0);
    }
  }, [skenario, currentChapter]);

  // Reset state when not in interactive mode
  useEffect(() => {
    if (!interactive) {
      setCurrentChapter(0);
      setChoiceHistory([]);
      setSelectedChoice(null);
      setShowFeedback(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [interactive]);

  const handleChoice = useCallback((chapterIdx: number, choiceIdx: number, choice: Record<string, unknown>) => {
    const isGood = Boolean(choice.good);
    const pts = Number(choice.pts || (isGood ? 1 : 0));
    const nextChapter = choice.nextChapter != null ? Number(choice.nextChapter) : chapterIdx + 1;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setChoiceHistory(prev => [...prev, { chapter: chapterIdx, choiceIdx, good: isGood, pts }]);
    setSelectedChoice({ choiceIdx, choice });
    setShowFeedback(true);

    // Play sound feedback — tap on choice, then ding/buzz for result
    playSound('tap');
    setTimeout(() => playSound(isGood ? 'ding' : 'buzz'), 300);

    // Auto-advance after feedback (longer delay to read consequences)
    timeoutRef.current = setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      if (nextChapter < skenario.length && nextChapter >= 0) {
        setCurrentChapter(nextChapter);
      } else if (nextChapter >= skenario.length) {
        setCurrentChapter(nextChapter);
        // Report score
        if (useInteractiveStore.getState().mode !== 'interactive') return;
        const allChoices = [...choiceHistory, { chapter: chapterIdx, choiceIdx, good: isGood, pts }];
        const totalPts = allChoices.reduce((sum, c) => sum + c.pts, 0);
        const maxPts = skenario.reduce((sum, ch) => {
          const choices = (ch.choices as Array<Record<string, unknown>>) || [];
          const bestPts = Math.max(...choices.map(c => Number(c.pts || (c.good ? 1 : 0))), 0);
          return sum + bestPts;
        }, 0);
        reportScore({
          elementId: 'skenario-template',
          pageIndex: interactivePageIdx,
          score: totalPts,
          maxScore: Math.max(maxPts, allChoices.length),
          completed: true,
        });
      }
    }, 3500);
  }, [choiceHistory, skenario.length, reportScore, interactivePageIdx]);

  const currentCh = skenario[currentChapter];
  const totalPts = choiceHistory.reduce((sum, c) => sum + c.pts, 0);
  const totalGoodChoices = choiceHistory.filter(c => c.good).length;
  const isCompleted = currentChapter >= skenario.length && skenario.length > 0;

  // Phase 9 fix: Reset button handler for replaying scenario
  const handleReset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentChapter(0);
    setChoiceHistory([]);
    setSelectedChoice(null);
    setShowFeedback(false);
  }, []);

  // Helper: get level color
  const getLevelColor = (level: string) => {
    if (level === 'good') return green;
    if (level === 'mid') return yellow;
    if (level === 'bad') return red;
    return accent;
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>🎭</div>
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
              ? isCompleted
                ? `Selesai • ${totalPts} poin • ${totalGoodChoices}/${choiceHistory.length} benar`
                : `Babak ${currentChapter + 1}/${skenario.length} • ${totalPts} poin`
              : `${skenario.length} babak`
            }
          </div>
        </div>
      </div>

      {/* ── Interactive Mode: Show current chapter with setup + choices ── */}
      {interactive && skenario.length > 0 && currentCh ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {/* Current chapter card */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
            {/* Chapter header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{String(currentCh.charEmoji || '🧑')}</span>
              <div>
                <div className="text-[11px] font-bold text-white">
                  {currentCh.title ? String(currentCh.title) : `Babak ${currentChapter + 1}`}
                </div>
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

            {/* ── Setup Dialogue — narrative context before choices ── */}
            {Array.isArray(currentCh.setup) && (currentCh.setup as Array<Record<string, unknown>>).length > 0 && !showFeedback && (
              <div className="mb-3 space-y-1.5">
                {(currentCh.setup as Array<Record<string, unknown>>).map((line, i) => {
                  const speaker = String(line.speaker || '');
                  const text = String(line.text || '');
                  const isNarrator = speaker.toUpperCase() === 'NARRATOR' || speaker.toUpperCase() === 'NARATOR';
                  return (
                    <div key={i} className={`flex gap-2 ${isNarrator ? 'italic' : ''}`}>
                      <span className={`text-[9px] font-bold flex-shrink-0 mt-0.5 ${isNarrator ? 'text-white/40' : 'text-pink-300'}`}>
                        {isNarrator ? '📖' : speaker ? `${speaker}:` : ''}
                      </span>
                      <span className={`text-[10px] leading-relaxed ${isNarrator ? 'text-white/50' : 'text-white/75'}`}>
                        {text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Choice prompt */}
            {Boolean(currentCh.choicePrompt) && !showFeedback && (
              <div className="text-[10px] text-white/60 italic mb-2 p-2 rounded-lg bg-white/5">
                💭 {String(currentCh.choicePrompt)}
              </div>
            )}

            {/* ── Choice buttons — with detail description ── */}
            {Array.isArray(currentCh.choices) && !showFeedback && (
              <div className="space-y-2">
                {(currentCh.choices as Array<Record<string, unknown>>).map((c, j) => {
                  const level = String(c.level || '');
                  const levelColor = getLevelColor(level);
                  return (
                    <button
                      key={j}
                      onClick={() => handleChoice(currentChapter, j, c)}
                      className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'rgba(255,255,255,.05)',
                        border: `1px solid ${level ? alpha(levelColor, 0.15) : 'rgba(255,255,255,.15)'}`,
                      }}
                    >
                      <span className="text-lg mt-0.5">{String(c.icon || '🤔')}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-white truncate">
                          {String(c.label || `Pilihan ${j + 1}`)}
                        </div>
                        {/* Use c.detail (preset field name) — fallback to c.desc for backwards compat */}
                        {(Boolean(c.detail) || Boolean(c.desc)) && (
                          <div className="text-[8px] text-white/40 mt-0.5 line-clamp-2">
                            {String(c.detail || c.desc || '')}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Rich Feedback: resultTitle, resultBody, consequences, norma ── */}
            {showFeedback && selectedChoice && (
              <div className="space-y-2">
                {/* Result header */}
                {Boolean(selectedChoice.choice.resultTitle) && (
                  <div className={`p-2.5 rounded-lg text-center ${
                    selectedChoice.choice.good
                      ? 'bg-emerald-500/15 border border-emerald-500/25'
                      : 'bg-red-500/15 border border-red-500/25'
                  }`}>
                    <div className="text-lg mb-1">{String(selectedChoice.choice.resultTitle || '')}</div>
                  </div>
                )}

                {/* Fallback: basic feedback if no resultTitle */}
                {!selectedChoice.choice.resultTitle && (
                  <div className={`p-2.5 rounded-lg text-center ${
                    selectedChoice.choice.good
                      ? 'bg-emerald-500/20 border border-emerald-500/30'
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    <div className="text-xl mb-1">{selectedChoice.choice.good ? '✅' : '❌'}</div>
                    <div className={`text-xs font-bold ${selectedChoice.choice.good ? 'text-emerald-300' : 'text-red-300'}`}>
                      {selectedChoice.choice.good
                        ? String(selectedChoice.choice.feedbackGood || 'Pilihan tepat!')
                        : String(selectedChoice.choice.feedbackBad || 'Coba lagi!')}
                    </div>
                  </div>
                )}

                {/* Result body — detailed explanation */}
                {Boolean(selectedChoice.choice.resultBody) && (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] text-white/75 leading-relaxed">
                      {String(selectedChoice.choice.resultBody)}
                    </div>
                  </div>
                )}

                {/* Norma reference — educational payoff */}
                {Boolean(selectedChoice.choice.norma) && (
                  <div className="p-2 rounded-lg" style={{
                    background: alpha(yellow, 0.08),
                    border: `1px solid ${alpha(yellow, 0.2)}`,
                  }}>
                    <div className="text-[9px] font-bold mb-0.5" style={{ color: yellow }}>
                      📜 Kaitan Norma
                    </div>
                    <div className="text-[9px] text-white/65 leading-relaxed">
                      {String(selectedChoice.choice.norma)}
                    </div>
                  </div>
                )}

                {/* Consequences — detailed impact items */}
                {Array.isArray(selectedChoice.choice.consequences) &&
                  (selectedChoice.choice.consequences as Array<Record<string, unknown>>).length > 0 && (
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[9px] font-bold text-white/50 mb-1.5">🔔 Dampak</div>
                    <div className="space-y-1">
                      {(selectedChoice.choice.consequences as Array<Record<string, unknown>>).map((con, k) => (
                        <div key={k} className="flex items-start gap-1.5">
                          <span className="text-[10px] mt-px">{String(con.icon || '•')}</span>
                          <span className="text-[9px] text-white/60 leading-relaxed">{String(con.text || '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Points indicator */}
                {Number(selectedChoice.choice.pts) > 0 && (
                  <div className="text-center">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: alpha(green, 0.12), color: green }}>
                      +{String(selectedChoice.choice.pts)} poin
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Choice history summary */}
          {choiceHistory.length > 0 && (
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0 mt-1">
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
              {/* Reset button for replaying scenario */}
              {isCompleted && (
                <button
                  onClick={handleReset}
                  className="mt-2 w-full px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg text-[9px] font-bold text-pink-300 transition-colors border border-pink-500/30 cursor-pointer"
                >
                  ↩ Ulangi Skenario
                </button>
              )}
            </div>
          )}

          {/* Navigation button — advance to next page after completing scenario */}
          {isCompleted && (
            <div className="flex justify-center mt-3">
              <TemplateNavButton action="next" accent={accent} size="md" />
            </div>
          )}
        </div>
      ) : !interactive && skenario.length > 0 ? (
        variant === 'B' ? (
          /* ── Design Mode Variant B: Timeline layout ── */
          <div className="flex-1 min-h-0 overflow-y-auto relative pl-6">
            {/* Vertical timeline line */}
            <div
              className="absolute left-[11px] top-2 bottom-2 w-0.5 rounded-full"
              style={{ background: alpha(accent, 0.3) }}
            />

            {skenario.map((ch, i) => {
              const isActive = i === currentChapter;
              return (
                <div key={i} className="relative flex gap-3 pb-3 last:pb-0">
                  {/* Timeline node dot */}
                  <div
                    className="absolute left-[-20px] top-1.5 w-[22px] h-[22px] flex items-center justify-center z-10"
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[8px] font-bold border-2 transition-all ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}
                      style={{
                        background: isActive ? alpha(accent, 0.25) : 'rgba(255,255,255,.06)',
                        borderColor: isActive ? accent : alpha(accent, 0.25),
                        color: isActive ? accent : 'rgba(255,255,255,.4)',
                      }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Chapter card content */}
                  <div
                    className={`flex-1 p-2 rounded-lg border transition-all ${
                      isActive
                        ? 'border-opacity-100'
                        : 'bg-white/5 border-white/10'
                    }`}
                    style={isActive ? {
                      background: alpha(accent, 0.08),
                      borderColor: alpha(accent, 0.35),
                    } : undefined}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{String(ch.charEmoji || '🧑')}</span>
                      <span className="text-[10px] font-bold text-white">Babak {i + 1}</span>
                      {Boolean(ch.title) && <span className="text-[8px] text-white/40 truncate">{String(ch.title)}</span>}
                      {isActive && (
                        <span
                          className="ml-auto text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: alpha(accent, 0.2), color: accent }}
                        >
                          AKTIF
                        </span>
                      )}
                    </div>

                    {/* Setup dialogue preview */}
                    {Array.isArray(ch.setup) && (ch.setup as Array<Record<string, unknown>>).length > 0 && (
                      <div className="mb-1 pl-2 border-l-2" style={{ borderColor: alpha(accent, 0.2) }}>
                        {(ch.setup as Array<Record<string, unknown>>).slice(0, 2).map((line, j) => (
                          <div key={j} className="text-[7px] text-white/30">
                            <span className="font-bold">{String(line.speaker || '')}: </span>
                            <span>{String(line.text || '').slice(0, 60)}{String(line.text || '').length > 60 ? '...' : ''}</span>
                          </div>
                        ))}
                        {(ch.setup as Array<Record<string, unknown>>).length > 2 && (
                          <div className="text-[7px] text-white/20">+{(ch.setup as Array<Record<string, unknown>>).length - 2} dialog lagi</div>
                        )}
                      </div>
                    )}

                    {Boolean(ch.choicePrompt) && (
                      <div className="text-[8px] text-white/50 italic mb-1">{String(ch.choicePrompt)}</div>
                    )}
                    {Array.isArray(ch.choices) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
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
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Design Mode Variant A: Show all chapters as preview cards ── */
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

                {/* Setup dialogue preview */}
                {Array.isArray(ch.setup) && (ch.setup as Array<Record<string, unknown>>).length > 0 && (
                  <div className="mb-1 pl-2 border-l-2 border-white/10">
                    {(ch.setup as Array<Record<string, unknown>>).slice(0, 2).map((line, j) => (
                      <div key={j} className="text-[7px] text-white/30">
                        <span className="font-bold">{String(line.speaker || '')}: </span>
                        <span>{String(line.text || '').slice(0, 60)}{String(line.text || '').length > 60 ? '...' : ''}</span>
                      </div>
                    ))}
                    {(ch.setup as Array<Record<string, unknown>>).length > 2 && (
                      <div className="text-[7px] text-white/20">+{(ch.setup as Array<Record<string, unknown>>).length - 2} dialog lagi</div>
                    )}
                  </div>
                )}

                {Boolean(ch.choicePrompt) && (
                  <div className="text-[8px] text-white/50 italic mb-1">{String(ch.choicePrompt)}</div>
                )}
                {Array.isArray(ch.choices) && (
                  <div className="flex gap-1 mt-1 flex-wrap">
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
        )
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
