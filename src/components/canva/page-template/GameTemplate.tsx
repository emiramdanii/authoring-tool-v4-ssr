'use client';

import { useCallback, useState, useEffect } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import GameWidget from '../GameWidget';
import { useInteractiveStore } from '@/store/interactive-store';
import { getGameIcon, getGameModuleIndex } from './shared-helpers';
import { TemplateNavButton } from './TemplateNavButton';

// ── Game Template ─────────────────────────────────────────────

export function GameTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--c', '#3ecfcf');
  const games = (td.games as Array<Record<string, unknown>>) || [];
  const reportScore = useInteractiveStore((s) => s.reportScore);
  const interactivePageIdx = useInteractiveStore((s) => s.interactivePageIdx);

  // Phase 4: Game selector — track which game is displayed as main widget
  const [activeGameIdx, setActiveGameIdx] = useState(() => {
    const stored = td.activeGameIdx as number | undefined;
    return (stored != null && stored >= 0 && stored < games.length) ? stored : 0;
  });

  // Sync with templateData if it changes externally
  useEffect(() => {
    const stored = td.activeGameIdx as number | undefined;
    if (stored != null && stored >= 0 && stored < games.length && stored !== activeGameIdx) {
      setActiveGameIdx(stored);
    }
  }, [td.activeGameIdx, games.length]);

  // Ensure activeGameIdx is valid (must be declared before handleComplete)
  const safeIdx = activeGameIdx < games.length ? activeGameIdx : 0;
  const activeGame = games[safeIdx];

  const activeGameId = (activeGame?._id as string) || String(safeIdx);

  const handleComplete = useCallback((score: number, maxScore: number) => {
    // Skip score reporting for non-scored games (e.g., Roda, SpinWheel)
    // to prevent overwriting valid scores from other games on the same page
    if (maxScore === 0) return;
    // Guard: only report scores in actual Play/Export mode, not canvas preview
    if (useInteractiveStore.getState().mode !== 'interactive') return;
    reportScore({ elementId: `game-${activeGameId}`, pageIndex: interactivePageIdx, score, maxScore, completed: true });
  }, [reportScore, interactivePageIdx, activeGameId, safeIdx]);

  const handleSelectGame = useCallback((idx: number) => {
    setActiveGameIdx(idx);
    // Persist to templateData (only if editable)
    onEditField?.('activeGameIdx', String(idx));
  }, [onEditField]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2"
        style={{ background: `linear-gradient(90deg, ${alpha(accent, 0.08)}, transparent)` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>🎮</div>
        <div>
          <EditableText
            value={String(td.gameTitle || 'Game Interaktif')}
            fieldKey="gameTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Game"
          />
          <div className="text-[9px] text-white/40">{games.length} game tersedia{games.length > 1 ? ' • klik untuk ganti' : ''}</div>
        </div>
      </div>

      {/* Game selection or widget */}
      <div className="flex-1 min-h-0 px-3 pb-3">
        {games.length > 0 ? (
          /* ── Variant B ("Galeri"): Gallery grid for design mode ── */
          variant === 'B' && !interactive ? (
            <div className="grid grid-cols-2 gap-2 overflow-y-auto h-full">
              {games.map((g, i) => (
                <button key={i}
                  onClick={() => handleSelectGame(i)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-[1.03] cursor-pointer text-center"
                  style={{
                    background: i === safeIdx ? alpha(accent, 0.1) : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${i === safeIdx ? alpha(accent, 0.3) : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: i === safeIdx ? `0 0 12px ${alpha(accent, 0.1)}` : 'none',
                  }}>
                  <span className="text-2xl">{getGameIcon(String(g.type))}</span>
                  <span className="text-[9px] font-bold text-white/90 leading-tight line-clamp-2">
                    {String(g.title || g.type)}
                  </span>
                  <span className="text-[7px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: alpha(accent, 0.12), color: accent }}>
                    {String(g.type)}
                  </span>
                  {i === safeIdx && (
                    <span className="text-[8px] font-bold" style={{ color: accent }}>✦ Pilih</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
          /* ── Variant A (or interactive mode): Widget + tabs ── */
          <div className="space-y-2">
            {/* Show selected game as main widget */}
            {activeGame && (
              <GameWidget key={activeGameId} dataIdx={Math.max(0, getGameModuleIndex(activeGame))} moduleId={(activeGame._id as string) || undefined} compact={!interactive} interactive={interactive} onComplete={interactive ? handleComplete : undefined} />
            )}

            {/* Game selector tabs — always visible when multiple games */}
            {games.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {games.map((g, i) => (
                  <button key={i}
                    onClick={() => handleSelectGame(i)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition-all hover:scale-105"
                    style={{
                      background: i === safeIdx ? alpha(accent, 0.12) : 'rgba(255,255,255,.05)',
                      border: `1px solid ${i === safeIdx ? alpha(accent, 0.31) : 'rgba(255,255,255,.1)'}`,
                      boxShadow: i === safeIdx ? `0 0 12px ${alpha(accent, 0.12)}` : 'none',
                    }}>
                    <span className="text-sm">{getGameIcon(String(g.type))}</span>
                    <span className={`text-[8px] font-bold truncate max-w-[60px] ${i === safeIdx ? 'text-white' : 'text-white/50'}`}>
                      {String(g.title || g.type)}
                    </span>
                    {i === safeIdx && (
                      <span className="text-[7px] text-cyan-400 font-bold">●</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <span className="text-3xl mb-2">🎮</span>
            <span className="text-[10px]">{interactive ? 'Belum ada game tersedia' : 'Tambah game di panel Konten → Modul'}</span>
          </div>
        )}
      </div>

      {/* Navigation button — advance to next page in interactive mode */}
      {interactive && (
        <div className="flex justify-center px-4 pb-3">
          <TemplateNavButton action="next" accent={accent} size="md" />
        </div>
      )}
    </div>
  );
}
