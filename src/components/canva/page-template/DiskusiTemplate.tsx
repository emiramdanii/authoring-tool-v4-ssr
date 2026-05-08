'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Diskusi Template ───────────────────────────────────────────

export function DiskusiTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--c', '#3ecfcf');
  const pertanyaan = (td.pertanyaan as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>💬</div>
        <div>
          <EditableText
            value={String(td.title || 'Diskusi & Pertanyaan')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Diskusi"
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
          {pertanyaan.map((p, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                  style={{ background: alpha(accent, 0.12), color: accent }}>
                  {String(p.label || `Pertanyaan ${i + 1}`)}
                </span>
                <span className="text-sm">{String(p.icon || '💬')}</span>
              </div>
              <div className="text-[9px] text-white/80 leading-relaxed mb-1">{String(p.teks || '')}</div>
              {Boolean(p.petunjuk) && (
                <div className="text-[8px] text-white/40 italic">💡 {String(p.petunjuk)}</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">💬</span>
          <span className="text-[10px]">{interactive ? 'Belum ada pertanyaan tersedia' : 'Tambah pertanyaan di panel Konten → Diskusi'}</span>
        </div>
      )}
    </div>
  );
}
