'use client';

import React from 'react';
import type { SkenarioBlock } from '../../schema/types';
import type { TokenResolver } from '../types';

export function SkenarioRenderer({ block, tokens, interactive }: {
  block: SkenarioBlock; tokens: TokenResolver; interactive: boolean;
}) {
  const [chapter, setChapter] = React.useState(0);
  const [history, setHistory] = React.useState<Array<{ chapterIdx: number; choiceIdx: number; good: boolean; pts: number }>>([]);
  const [selectedChoice, setSelectedChoice] = React.useState<{ choiceIdx: number; choice: typeof block.chapters[0]['choices'][0] } | null>(null);
  const [showFeedback, setShowFeedback] = React.useState(false);

  const ch = block.chapters[chapter];
  const isCompleted = chapter >= block.chapters.length;

  const handleChoice = (choiceIdx: number) => {
    const choice = ch.choices[choiceIdx];
    setHistory(prev => [...prev, { chapterIdx: chapter, choiceIdx, good: choice.good, pts: choice.pts }]);
    setSelectedChoice({ choiceIdx, choice });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedChoice(null);
      const nextCh = choice.nextChapter != null ? choice.nextChapter : chapter + 1;
      if (nextCh < block.chapters.length) {
        setChapter(nextCh);
      } else {
        setChapter(nextCh); // Mark completed
      }
    }, 3000);
  };

  const totalPts = history.reduce((sum, h) => sum + h.pts, 0);
  const green = tokens.color('g');
  const red = tokens.color('r');
  const yellow = tokens.color('y');

  return (
    <div className="mt-3 rounded-2xl overflow-hidden border-2"
      style={{ background: tokens.color('bg'), borderColor: tokens.colorAlpha('c', 0.3), boxShadow: tokens.raw.shadow.elevated }}>
      {/* HUD with gradient accent line */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, ' + tokens.color('c') + ', ' + yellow + ', ' + tokens.color('c') + ')' }} />
        <div className="flex items-center justify-between p-3 border-b-2"
          style={{ background: 'linear-gradient(90deg, ' + tokens.color('bg') + ', ' + tokens.color('bg2') + ')', borderColor: tokens.colorAlpha('c', 0.2) }}>
          <span className="font-black text-[11px]" style={{ color: yellow, fontFamily: tokens.fontFamily('display') }}>
            🎭 {block.title}
          </span>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
              style={{ background: tokens.colorAlpha('y', 0.15), color: yellow, border: '1px solid ' + tokens.colorAlpha('y', 0.3), boxShadow: '0 0 8px ' + tokens.colorAlpha('y', 0.15) }}>
              ⭐ {totalPts}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-extrabold"
              style={{ background: tokens.colorAlpha('c', 0.15), color: tokens.color('c'), border: '1px solid ' + tokens.colorAlpha('c', 0.3) }}>
              Babak {Math.min(chapter + 1, block.chapters.length)}/{block.chapters.length}
            </span>
          </div>
        </div>
      </div>

      {/* Body — always render content; interactive controls only when interactive */}
      {ch && !showFeedback && (
        <div className="p-4">
          {/* Setup */}
          {ch.setup && ch.setup.length > 0 && (
            <div className="mb-4 space-y-2">
              {ch.setup.map((line, i) => {
                const isNarrator = line.speaker.toUpperCase() === 'NARRATOR' || line.speaker.toUpperCase() === 'NARATOR';
                return (
                  <div key={i} className={`flex gap-2 ${isNarrator ? 'italic' : ''}`}>
                    <span className={`text-[10px] font-bold flex-shrink-0 mt-0.5 ${isNarrator ? 'text-white/40' : 'text-pink-300'}`}>
                      {isNarrator ? '📖' : line.speaker ? `${line.speaker}:` : ''}
                    </span>
                    <span className={`text-[11px] leading-relaxed ${isNarrator ? 'text-white/50' : 'text-white/75'}`}>
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Choice prompt */}
          {ch.choicePrompt && (
            <div className="text-[10px] text-white/60 italic mb-3 p-2.5 rounded-lg"
              style={{
                background: tokens.colorAlpha('c', 0.08),
                border: '1px solid ' + tokens.colorAlpha('c', 0.2),
              }}>
              💭 {ch.choicePrompt}
            </div>
          )}

          {/* Choices — interactive or read-only preview */}
          <div className="space-y-2.5">
            {ch.choices.map((c, j) => (
              interactive ? (
                <button key={j} onClick={() => handleChoice(j)}
                  className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: `1px solid rgba(255,255,255,.12)`,
                    boxShadow: tokens.raw.shadow.card,
                  }}>
                  <span className="text-lg mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white">{c.label}</div>
                    {c.detail && <div className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{c.detail}</div>}
                  </div>
                </button>
              ) : (
                <div key={j}
                  className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl text-left"
                  style={{
                    background: 'rgba(255,255,255,.05)',
                    border: `1px solid rgba(255,255,255,.12)`,
                    boxShadow: tokens.raw.shadow.card,
                  }}>
                  <span className="text-lg mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-white">{c.label}</div>
                    {c.detail && <div className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{c.detail}</div>}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && selectedChoice && (
        <div className="p-4 space-y-2.5">
          <div className={`p-3 rounded-xl text-center ${
            selectedChoice.choice.good ? '' : ''
          }`}
            style={{
              background: selectedChoice.choice.good ? tokens.colorAlpha('g', 0.12) : tokens.colorAlpha('r', 0.12),
              border: '2px solid ' + (selectedChoice.choice.good ? tokens.colorAlpha('g', 0.4) : tokens.colorAlpha('r', 0.4)),
              boxShadow: selectedChoice.choice.good ? '0 0 16px ' + tokens.colorAlpha('g', 0.15) : '0 0 16px ' + tokens.colorAlpha('r', 0.15),
            }}>
            <div className="text-lg mb-1">{selectedChoice.choice.resultTitle || (selectedChoice.choice.good ? '✅' : '❌')}</div>
            <div className="text-xs font-bold" style={{ color: selectedChoice.choice.good ? tokens.color('g') : tokens.color('r') }}>
              {selectedChoice.choice.good
                ? (selectedChoice.choice.feedbackGood || 'Pilihan tepat!')
                : (selectedChoice.choice.feedbackBad || 'Coba lagi!')}
            </div>
          </div>

          {selectedChoice.choice.resultBody && (
            <div className="p-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
              }}>
              <div className="text-[10px] text-white/75 leading-relaxed">{selectedChoice.choice.resultBody}</div>
            </div>
          )}

          {selectedChoice.choice.norma && (
            <div className="p-3 rounded-xl"
              style={{ background: tokens.colorAlpha('y', 0.1), border: '1px solid ' + tokens.colorAlpha('y', 0.25) }}>
              <div className="text-[10px] font-bold mb-0.5" style={{ color: yellow }}>📜 Kaitan Norma</div>
              <div className="text-[10px] text-white/65 leading-relaxed">{selectedChoice.choice.norma}</div>
            </div>
          )}

          {selectedChoice.choice.consequences && selectedChoice.choice.consequences.length > 0 && (
            <div className="p-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
              }}>
              <div className="text-[10px] font-bold text-white/50 mb-1.5">🔔 Dampak</div>
              {selectedChoice.choice.consequences.map((con, k) => (
                <div key={k} className="flex items-start gap-1.5 text-[10px] text-white/60 leading-relaxed mb-1">
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

      {/* Progress bar — more visible */}
      <div className="flex gap-1 p-3 border-t"
        style={{ background: tokens.color('bg'), borderColor: tokens.colorAlpha('c', 0.15) }}>
        {block.chapters.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
            style={{
              background: i < chapter ? green : i === chapter ? yellow : tokens.colorAlpha('muted', 0.2),
              boxShadow: i === chapter ? '0 0 8px ' + yellow : i < chapter ? '0 0 4px ' + tokens.colorAlpha('g', 0.3) : 'none',
            }} />
        ))}
      </div>
    </div>
  );
}
