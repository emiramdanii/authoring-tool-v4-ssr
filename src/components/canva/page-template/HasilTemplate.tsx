'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';
import { playSound } from '@/lib/sounds';
import { TemplateNavButton } from './TemplateNavButton';

// ── Hasil Template ────────────────────────────────────────────
// Phase 10: Added action button in interactive mode, better preview
// state in design mode, improved readability.

export function HasilTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const bg = getPaletteColor(palette, '--bg', '#0e1c2f');
  const yellow = getPaletteColor(palette, '--y', '#f9c82e');
  const totalKuis = (td.totalKuis as number) || 0;
  const namaBab = String(td.namaBab || '');

  const scores = useInteractiveStore((s) => s.scores);
  const _pct = useInteractiveStore((s) => {
    const max = s.scores.reduce((sum, sc) => sum + sc.maxScore, 0);
    if (max === 0) return 0;
    return Math.round((s.scores.reduce((sum, sc) => sum + sc.score, 0) / max) * 100);
  });
  const _totalScore = useInteractiveStore((s) => s.scores.reduce((sum, sc) => sum + sc.score, 0));
  const _totalMax = useInteractiveStore((s) => s.scores.reduce((sum, sc) => sum + sc.maxScore, 0));

  void scores;

  // In interactive mode with actual scores: show live score.
  // In interactive mode with no scores yet (canvas preview): show preview mode.
  // In design mode: always show preview mode.
  const hasScores = interactive && _totalMax > 0;
  const pct = hasScores ? _pct : 0;
  const showPreview = !hasScores;
  const level = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : pct > 0 ? 'Perlu Latihan' : '';
  const levelColor = pct >= 85 ? '#34d399' : pct >= 70 ? '#f9c82e' : '#f87171';
  const levelEmoji = pct >= 85 ? '🌟' : pct >= 70 ? '👍' : pct > 0 ? '💪' : '';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
      {/* Trophy */}
      <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 4px 16px rgba(52,211,153,.3))' }}>
        {hasScores && pct > 0 ? levelEmoji : '🏆'}
      </div>

      {/* Title */}
      <EditableText
        value={String(td.hasilTitle || 'Hasil Belajar')}
        fieldKey="hasilTitle"
        isSelected={isSelected}
        onEdit={onEditField}
        interactive={interactive}
        className="font-black mb-2"
        style={{ fontSize: 'clamp(16px, 3vw, 28px)', color: accent }}
        placeholder="Judul Hasil"
      />

      {/* Score Circle — live when scores exist, preview when no scores yet */}
      <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          background: hasScores && pct > 0
            ? `conic-gradient(${levelColor} ${pct}%, ${alpha(accent, 0.12)} ${pct}%)`
            : `conic-gradient(${alpha(accent, 0.3)} 75%, ${alpha(accent, 0.08)} 75%)`,
          boxShadow: `0 0 40px ${alpha(accent, 0.19)}`,
          transition: 'background 1s ease-out',
        }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: bg }}>
          {hasScores ? (
            <span className="text-2xl font-black" style={{ color: pct > 0 ? levelColor : accent }}>{pct}%</span>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-lg font-black" style={{ color: accent }}>75%</span>
              <span className="text-[7px] text-white/40">Preview</span>
            </div>
          )}
        </div>
      </div>

      {/* Level */}
      {hasScores && level && (
        <div className="text-sm font-bold mb-2" style={{ color: levelColor }}>{level}</div>
      )}
      {showPreview && (
        <div className="text-[10px] text-white/40 mb-2">Skor akan muncul setelah mengerjakan aktivitas</div>
      )}

      {/* Score info */}
      {(hasScores ? _totalMax > 0 : totalKuis > 0) && (
        <div className="text-[10px] text-white/50 mb-3">
          {hasScores ? `${_totalScore}/${_totalMax} poin dari ${scores.length} aktivitas` : `${totalKuis} soal kuis tersedia`}
        </div>
      )}

      {/* Appreciation levels */}
      <div className="flex gap-3 mt-2">
        {[
          { label: 'Sangat Baik', pct: 85, color: '#34d399', emoji: '🌟' },
          { label: 'Baik', pct: 70, color: '#f9c82e', emoji: '👍' },
          { label: 'Perlu Latihan', pct: 0, color: '#f87171', emoji: '💪' },
        ].map((tier) => (
          <div key={tier.label} className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full mb-1 flex items-center justify-center text-[10px] ${
              hasScores && pct >= tier.pct ? '' : 'opacity-40'
            }`}
              style={{
                background: hasScores && pct >= tier.pct ? alpha(tier.color, 0.25) : alpha(tier.color, 0.1),
                border: `1px solid ${tier.color}`,
                boxShadow: hasScores && pct >= tier.pct ? `0 0 8px ${alpha(tier.color, 0.3)}` : 'none',
              }}>
              {hasScores && pct >= tier.pct ? tier.emoji : ''}
            </div>
            <span className="text-[8px] text-white/40">{tier.label}</span>
          </div>
        ))}
      </div>

      {/* Action buttons in interactive mode */}
      {interactive && (
        <div className="flex gap-2 mt-4">
          <TemplateNavButton action="restart" accent={accent} size="sm" />
          <TemplateNavButton action="next" accent={accent} size="sm" />
        </div>
      )}

      {/* Bab name */}
      {namaBab && (
        <div className="absolute bottom-6 text-[9px] text-white/30">{namaBab}</div>
      )}
    </div>
  );
}
