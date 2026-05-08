'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { useInteractiveStore } from '@/store/interactive-store';

// ── Hasil Template ────────────────────────────────────────────
// Phase 9 fix: clamp() %→vw, hex-alpha → alpha() helper

export function HasilTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  // Phase 9 fix: use palette --bg for score circle inner instead of hardcoded zinc-900
  const bg = getPaletteColor(palette, '--bg', '#0e1c2f');
  const totalKuis = (td.totalKuis as number) || 0;
  const namaBab = String(td.namaBab || '');

  // Live score from interactive store — subscribe to scores[] array (primitive) so
  // Zustand detects changes. The function refs (totalPct, totalScore, totalMax)
  // are stable and never trigger re-renders on their own.
  const scores = useInteractiveStore((s) => s.scores);
  const _pct = useInteractiveStore((s) => {
    const max = s.scores.reduce((sum, sc) => sum + sc.maxScore, 0);
    if (max === 0) return 0;
    return Math.round((s.scores.reduce((sum, sc) => sum + sc.score, 0) / max) * 100);
  });
  const _totalScore = useInteractiveStore((s) => s.scores.reduce((sum, sc) => sum + sc.score, 0));
  const _totalMax = useInteractiveStore((s) => s.scores.reduce((sum, sc) => sum + sc.maxScore, 0));

  // Suppress unused variable warning — scores subscription is needed for reactivity
  void scores;

  const pct = interactive ? _pct : 0;
  const level = pct >= 85 ? 'Sangat Baik' : pct >= 70 ? 'Baik' : pct > 0 ? 'Perlu Latihan' : '';
  const levelColor = pct >= 85 ? '#34d399' : pct >= 70 ? '#f9c82e' : '#f87171';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
      {/* Trophy */}
      <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 4px 16px rgba(52,211,153,.3))' }}>🏆</div>

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

      {/* Score Circle — live in interactive mode */}
      <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          background: `conic-gradient(${levelColor || accent} ${pct}%, ${alpha(accent, 0.12)} ${pct}%)`,
          boxShadow: `0 0 40px ${alpha(accent, 0.19)}`,
          transition: 'background 1s ease-out',
        }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: bg }}>
          <span className="text-2xl font-black" style={{ color: pct > 0 ? levelColor : accent }}>{pct}%</span>
        </div>
      </div>

      {/* Level */}
      {level && (
        <div className="text-sm font-bold mb-2" style={{ color: levelColor }}>{level}</div>
      )}

      {/* Info */}
      {totalKuis > 0 && (
        <div className="text-[10px] text-white/50 mb-3">
          {interactive ? `${_totalScore}/${_totalMax} poin` : `${totalKuis} soal kuis tersedia`}
        </div>
      )}

      {/* Appreciation levels */}
      <div className="flex gap-3 mt-2">
        {[
          { label: 'Sangat Baik', pct: 85, color: '#34d399' },
          { label: 'Baik', pct: 70, color: '#f9c82e' },
          { label: 'Perlu Latihan', pct: 0, color: '#f87171' },
        ].map((tier) => (
          <div key={tier.label} className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full mb-0.5" style={{ background: alpha(tier.color, 0.25), border: `1px solid ${tier.color}` }} />
            <span className="text-[7px] text-white/40">{tier.label}</span>
          </div>
        ))}
      </div>

      {/* Bab name */}
      {namaBab && (
        <div className="absolute bottom-4 text-[9px] text-white/30">{namaBab}</div>
      )}
    </div>
  );
}
