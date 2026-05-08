'use client';

import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Petunjuk Template ─────────────────────────────────────────

export function PetunjukTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const langkah = (td.langkah as Array<Record<string, unknown>>) || [];
  const tips = String(td.tips || '');

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>📋</div>
        <div>
          <EditableText
            value={String(td.title || 'Petunjuk Penggunaan')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Petunjuk"
          />
          <div className="text-[9px] text-white/40">{langkah.length} langkah</div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[9px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
      )}

      {/* Steps */}
      {langkah.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {langkah.map((l, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5"
                style={{ background: `${accent}30`, color: accent }}>
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">{String(l.icon || '📌')}</span>
                  <span className="text-[10px] font-bold text-white">{String(l.judul || '')}</span>
                </div>
                <div className="text-[8px] text-white/70 leading-relaxed line-clamp-3">{String(l.isi || '')}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📋</span>
          <span className="text-[10px]">Tambah langkah di panel Konten → Petunjuk</span>
        </div>
      )}

      {/* Tips */}
      {tips && (
        <div className="mt-2 p-2 rounded-lg" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
          <div className="text-[9px] font-bold mb-0.5" style={{ color: accent }}>💡 Tips</div>
          <div className="text-[8px] text-white/70 leading-relaxed">{tips}</div>
        </div>
      )}
    </div>
  );
}
