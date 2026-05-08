'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Refleksi Template ───────────────────────────────────────────

export function RefleksiTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--p', '#a78bfa');
  const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];
  const penugasan = td.penugasan as Record<string, unknown> | undefined;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>🪞</div>
        <div>
          <EditableText
            value={String(td.title || 'Refleksi Diri')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Refleksi"
          />
          <div className="text-[9px] text-white/40">{pertanyaan.length} pertanyaan</div>
        </div>
      </div>

      {/* Intro */}
      {Boolean(td.intro) && (
        <div className="text-[9px] text-white/70 leading-relaxed mb-3">{String(td.intro)}</div>
      )}

      {/* Questions */}
      {pertanyaan.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {pertanyaan.map((p, i) => {
            const warna = String(p.warna || accent);
            return (
              <div key={i} className="p-2 rounded-lg" style={{ background: alpha(warna, 0.03), border: `1px solid ${alpha(warna, 0.15)}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  {Boolean(p.icon) && <span className="text-sm">{String(p.icon)}</span>}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: warna }} />
                </div>
                <div className="text-[9px] text-white/80 leading-relaxed mb-0.5">{String(p.teks || '')}</div>
                {Boolean(p.petunjuk) && (
                  <div className="text-[8px] text-white/40 italic">💡 {String(p.petunjuk)}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🪞</span>
          <span className="text-[10px]">{interactive ? 'Belum ada pertanyaan tersedia' : 'Tambah pertanyaan di panel Konten → Refleksi'}</span>
        </div>
      )}

      {/* Penugasan */}
      {penugasan && (
        <div className="mt-2 p-2 rounded-lg" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.15)}` }}>
          <div className="text-[10px] font-bold mb-0.5" style={{ color: accent }}>📝 {String(penugasan.judul || 'Penugasan')}</div>
          <div className="text-[8px] text-white/70 leading-relaxed">{String(penugasan.isi || '')}</div>
          {Boolean(penugasan.contoh) && (
            <div className="mt-1 text-[7px] text-white/40 italic">Contoh: {String(penugasan.contoh)}</div>
          )}
        </div>
      )}
    </div>
  );
}
