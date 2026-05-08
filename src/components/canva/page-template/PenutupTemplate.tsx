'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Penutup Template ───────────────────────────────────────────

export function PenutupTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const preview = (td.preview as Array<Record<string, unknown>>) || [];
  const nextPertemuan = td.nextPertemuan as Record<string, unknown> | undefined;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>🎓</div>
        <div>
          <EditableText
            value={String(td.title || 'Penutup')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-sm"
            style={{ color: accent }}
            placeholder="Judul Penutup"
          />
          {Boolean(td.subjudul) && (
            <div className="text-[9px] text-white/50">{String(td.subjudul)}</div>
          )}
        </div>
      </div>

      {/* Preview Items */}
      {preview.length > 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {preview.map((item, i) => {
            const warna = String(item.warna || accent);
            return (
              <div key={i} className="p-2 rounded-lg" style={{ background: alpha(warna, 0.06), border: `1px solid ${alpha(warna, 0.15)}` }}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{String(item.icon || '📌')}</span>
                  <span className="text-[10px] font-bold" style={{ color: warna }}>{String(item.judul || '')}</span>
                </div>
                <div className="text-[8px] text-white/70 leading-relaxed">{String(item.isi || '')}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🎓</span>
          <span className="text-[10px]">{interactive ? 'Belum ada item tersedia' : 'Tambah item di panel Konten → Penutup'}</span>
        </div>
      )}

      {/* Next Pertemuan */}
      {nextPertemuan && (
        <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="text-[10px] font-bold mb-0.5" style={{ color: accent }}>📅 {String(nextPertemuan.judul || 'Pertemuan Berikutnya')}</div>
          {Boolean(nextPertemuan.deskripsi) && (
            <div className="text-[8px] text-white/60 leading-relaxed mb-1">{String(nextPertemuan.deskripsi)}</div>
          )}
          {Array.isArray(nextPertemuan.items) && (nextPertemuan.items as Array<Record<string, unknown>>).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(nextPertemuan.items as Array<Record<string, unknown>>).map((it, j) => {
                const itWarna = String(it.warna || accent);
                return (
                  <span key={j} className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                    style={{ background: alpha(itWarna, 0.08), color: itWarna }}>
                    {String(it.icon || '')} {String(it.judul || '')}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
