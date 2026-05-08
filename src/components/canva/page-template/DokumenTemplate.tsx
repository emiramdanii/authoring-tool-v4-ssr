'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Dokumen Template (CP/TP/ATP) ─────────────────────────────

export function DokumenTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const cp = td.cp as Record<string, unknown> | undefined;
  const tpItems = (td.tp as Array<Record<string, unknown>>) || [];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>📋</div>
        <div>
          <EditableText
            value={String(td.dokumenTitle || 'Dokumen Kurikulum')}
            fieldKey="dokumenTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-white text-sm"
            placeholder="Judul Dokumen"
          />
          <div className="text-[9px] text-white/40">Capaian Pembelajaran • Tujuan Pembelajaran</div>
        </div>
      </div>

      {/* CP Section */}
      {cp && (
        <div className="mb-3 p-3 rounded-lg" style={{ background: alpha(accent, 0.06), border: `1px solid ${alpha(accent, 0.15)}` }}>
          <div className="text-[10px] font-bold mb-1" style={{ color: accent }}>Capaian Pembelajaran</div>
          <div className="text-[9px] text-white/80 leading-relaxed line-clamp-4">
            {String(interactive ? (cp.capaianFase || '') : (cp.capaianFase || 'Belum diisi'))}
          </div>
          {Array.isArray(cp.profil) && (cp.profil as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(cp.profil as string[]).slice(0, 4).map((p, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[7px] font-bold"
                  style={{ background: alpha(accent, 0.08), color: accent }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TP Items */}
      {tpItems.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="text-[10px] font-bold mb-1.5" style={{ color: accent2 }}>Tujuan Pembelajaran</div>
          <div className="space-y-1">
            {tpItems.map((tp, i) => (
              <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded-md bg-white/5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: alpha(String(tp.color || accent2), 0.19), color: String(tp.color || accent2) }}>
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <span className="text-[8px] font-bold" style={{ color: String(tp.color || accent2) }}>
                    {String(tp.verb || '')}
                  </span>
                  <span className="text-[8px] text-white/70 ml-0.5">{String(tp.desc || '').length > 80 ? String(tp.desc).slice(0, 80) + '...' : String(tp.desc || '')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!cp?.capaianFase && tpItems.length === 0) && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📋</span>
          <span className="text-[10px]">{interactive ? 'Belum ada data dokumen' : 'Isi data CP & TP di panel Dokumen'}</span>
        </div>
      )}
    </div>
  );
}
