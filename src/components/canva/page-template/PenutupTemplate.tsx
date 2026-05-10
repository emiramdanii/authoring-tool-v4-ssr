'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { TemplateNavButton } from './TemplateNavButton';

// ── Penutup Template ───────────────────────────────────────────
// Phase 10: Added completion button ("Kembali ke Awal") in
// interactive mode, collapsible next pertemuan section, improved
// layout and font sizes.

export function PenutupTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--g', '#34d399');
  const cyan = getPaletteColor(palette, '--c', '#3ecfcf');
  const preview = (td.preview as Array<Record<string, unknown>>) || [];
  const nextPertemuan = td.nextPertemuan as Record<string, unknown> | undefined;
  const [showNext, setShowNext] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(() => new Set());

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header with completion badge */}
      <div className="flex items-center gap-2 mb-2">
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
        {interactive && (
          <div className="ml-auto px-2.5 py-1 rounded-lg text-[9px] font-bold"
            style={{ background: alpha(accent, 0.15), border: `1px solid ${alpha(accent, 0.3)}`, color: accent }}>
            ✅ Selesai
          </div>
        )}
      </div>

      {/* Preview Items */}
      {preview.length > 0 ? (
        variant === 'B' ? (
          /* Variant B: Checklist layout */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
            {preview.map((item, i) => {
              const warna = String(item.warna || accent);
              const isChecked = checkedItems.has(i);
              const handleToggle = interactive
                ? () => {
                    setCheckedItems(prev => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    });
                  }
                : undefined;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2 rounded-lg ${interactive ? 'cursor-pointer' : ''}`}
                  style={{
                    borderLeft: `3px solid ${alpha(warna, 0.5)}`,
                    background: isChecked ? alpha(warna, 0.08) : alpha(warna, 0.03),
                  }}
                  onClick={handleToggle}
                >
                  {/* Checkbox circle */}
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: isChecked ? warna : 'transparent',
                      border: `1.5px solid ${isChecked ? warna : alpha(warna, 0.4)}`,
                    }}
                  >
                    {isChecked ? (
                      <span className="text-white text-[10px]">✓</span>
                    ) : (
                      <span className="text-[10px]">{String(item.icon || '📌')}</span>
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold leading-tight" style={{ color: isChecked ? warna : 'rgba(255,255,255,0.85)' }}>
                      {String(item.judul || '')}
                    </div>
                    {Boolean(item.isi) && (
                      <div className="text-[9px] text-white/60 leading-relaxed mt-0.5 pl-0.5">
                        {String(item.isi || '')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Variant A: Card layout */
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {preview.map((item, i) => {
              const warna = String(item.warna || accent);
              return (
                <div key={i} className="p-2.5 rounded-lg" style={{ background: alpha(warna, 0.06), border: `1px solid ${alpha(warna, 0.15)}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{String(item.icon || '📌')}</span>
                    <span className="text-[11px] font-bold" style={{ color: warna }}>{String(item.judul || '')}</span>
                  </div>
                  <div className="text-[9px] text-white/70 leading-relaxed">{String(item.isi || '')}</div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">🎓</span>
          <span className="text-[10px]">{interactive ? 'Pembelajaran selesai' : 'Tambah item di panel Konten → Penutup'}</span>
        </div>
      )}

      {/* Next Pertemuan — collapsible */}
      {nextPertemuan && (
        <div className="mt-2">
          <button
            onClick={() => setShowNext(!showNext)}
            className="flex items-center gap-1.5 text-[10px] font-bold mb-1"
            style={{ color: cyan }}>
            <span className={`text-[8px] transition-transform ${showNext ? 'rotate-90' : ''}`}>▸</span>
            📅 {String(nextPertemuan.judul || 'Pertemuan Berikutnya')}
          </button>
          {showNext && (
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="text-[11px] font-bold mb-1" style={{ color: cyan }}>📅 {String(nextPertemuan.judul || 'Pertemuan Berikutnya')}</div>
              {Boolean(nextPertemuan.deskripsi) && (
                <div className="text-[9px] text-white/60 leading-relaxed mb-1.5">{String(nextPertemuan.deskripsi)}</div>
              )}
              {Array.isArray(nextPertemuan.items) && (nextPertemuan.items as Array<Record<string, unknown>>).length > 0 && (
                <div className="space-y-1.5">
                  {(nextPertemuan.items as Array<Record<string, unknown>>).map((it, j) => {
                    const itWarna = String(it.warna || cyan);
                    return (
                      <div key={j} className="flex items-start gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold flex-shrink-0"
                          style={{ background: alpha(itWarna, 0.1), color: itWarna, border: `1px solid ${alpha(itWarna, 0.2)}` }}>
                          {String(it.icon || '')} {String(it.judul || '')}
                        </span>
                        {Boolean(it.isi) && (
                          <span className="text-[8px] text-white/50 leading-relaxed">{String(it.isi)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons in interactive mode */}
      {interactive && (
        <div className="flex gap-2 mt-3">
          <TemplateNavButton action="restart" accent={accent} size="sm" />
          <TemplateNavButton action="next" accent={accent} size="sm" />
        </div>
      )}
    </div>
  );
}
