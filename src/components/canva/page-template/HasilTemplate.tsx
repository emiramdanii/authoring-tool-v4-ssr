'use client';

import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { useInteractiveStore } from '@/store/interactive-store';

// ── Hasil Template ────────────────────────────────────────────

export function HasilTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const totalKuis = (td.totalKuis as number) || 0;
  const namaBab = String(td.namaBab || '');

  // Live score from interactive store
  const totalPct = useInteractiveStore((s) => s.totalPct);
  const totalScore = useInteractiveStore((s) => s.totalScore);
  const totalMax = useInteractiveStore((s) => s.totalMax);

  const pct = interactive ? totalPct() : 0;
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
        style={{ fontSize: 'clamp(16px, 3%, 28px)', color: accent }}
        placeholder="Judul Hasil"
      />

      {/* Score Circle — live in interactive mode */}
      <div className="relative w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{
          background: `conic-gradient(${levelColor || accent} ${pct}%, ${accent}20 ${pct}%)`,
          boxShadow: `0 0 40px ${accent}30`,
          transition: 'background 1s ease-out',
        }}>
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center">
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
          {interactive ? `${totalScore()}/${totalMax()} poin` : `${totalKuis} soal kuis tersedia`}
        </div>
      )}

      {/* Appreciation levels */}
      <div className="flex gap-3 mt-2">
        {[
          { label: 'Sangat Baik', pct: 85, color: '#34d399' },
          { label: 'Baik', pct: 70, color: '#f9c82e' },
          { label: 'Perlu Latihan', pct: 0, color: '#f87171' },
        ].map((level) => (
          <div key={level.label} className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full mb-0.5" style={{ background: level.color + '40', border: `1px solid ${level.color}` }} />
            <span className="text-[7px] text-white/40">{level.label}</span>
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
