'use client';

import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Cover Template ────────────────────────────────────────────
// Phase 3: 3 variants — A (centered), B (left-aligned), C (split icon+text)

export function CoverTemplate({ td, palette, isSelected, onEditField, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const bg = getPaletteColor(palette, '--bg', '#0f172a');
  const cyan = getPaletteColor(palette, '--c', '#3ecfcf');
  const green = getPaletteColor(palette, '--g', '#34d399');

  // ── Variant A: Centered (original) ──
  if (variant === 'A') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        style={{ background: `linear-gradient(180deg, ${bg} 0%, ${bg}dd 100%)` }}>

        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5"
          style={{ background: `linear-gradient(90deg, ${accent}, ${cyan}, ${accent})` }} />

        {/* Icon */}
        <div className="text-5xl mb-4"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>
          {String(td.icon || '📚')}
        </div>

        {/* Title */}
        <EditableText
          value={String(td.title || '')}
          fieldKey="title"
          isSelected={isSelected}
          onEdit={onEditField}
          className="font-black text-white leading-tight"
          style={{ fontSize: 'clamp(18px, 3.5%, 32px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
          placeholder="Judul Pertemuan"
        />

        {/* Subtitle */}
        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          className="mt-2"
          style={{ fontSize: 'clamp(10px, 1.8%, 16px)', color: 'rgba(255,255,255,.7)' }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Badge */}
        {Boolean(td.mapel || td.kelas) && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: `${accent}20`,
              border: `1px solid ${accent}40`,
              color: accent,
            }}>
            {String(td.namaBab || td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
          </div>
        )}

        {/* Decorative bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {[accent, cyan, green].map((c, i) => (
            <div key={i} className="w-8 h-1 rounded-full" style={{ background: c, opacity: 0.6 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Variant B: Left-aligned ──
  if (variant === 'B') {
    return (
      <div className="absolute inset-0 flex flex-col justify-center p-8 pl-12"
        style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}cc 100%)` }}>

        {/* Decorative left bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5"
          style={{ background: `linear-gradient(180deg, ${accent}, ${cyan}, ${green})` }} />

        {/* Badge at top */}
        {Boolean(td.mapel || td.kelas) && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold w-fit"
            style={{
              background: `${accent}20`,
              border: `1px solid ${accent}40`,
              color: accent,
            }}>
            {String(td.namaBab || td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
          </div>
        )}

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>
            {String(td.icon || '📚')}
          </div>
          <EditableText
            value={String(td.title || '')}
            fieldKey="title"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-white leading-tight"
            style={{ fontSize: 'clamp(16px, 3.2%, 30px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
            placeholder="Judul Pertemuan"
          />
        </div>

        {/* Subtitle */}
        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          className="mt-1"
          style={{ fontSize: 'clamp(10px, 1.6%, 14px)', color: 'rgba(255,255,255,.6)' }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Decorative accent dots bottom right */}
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {[accent, cyan, green].map((c, i) => (
            <div key={i} className="w-2 h-2 rounded-full" style={{ background: c, opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Variant C: Split layout (icon left, text right) ──
  return (
    <div className="absolute inset-0 flex"
      style={{ background: bg }}>

      {/* Left panel: Icon + gradient background */}
      <div className="w-2/5 flex flex-col items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${accent}15, ${cyan}10)` }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${bg}80, ${bg}40)` }} />
        <div className="relative text-6xl mb-4" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.4))' }}>
          {String(td.icon || '📚')}
        </div>
        {/* Badge */}
        {Boolean(td.mapel || td.kelas) && (
          <div className="relative px-3 py-1 rounded-full text-[9px] font-bold"
            style={{ background: `${accent}30`, border: `1px solid ${accent}50`, color: accent }}>
            {String(td.namaBab || td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
          </div>
        )}
        {/* Decorative dots */}
        <div className="absolute bottom-4 flex gap-1">
          {[accent, cyan, green].map((c, i) => (
            <div key={i} className="w-6 h-1 rounded-full" style={{ background: c, opacity: 0.4 }} />
          ))}
        </div>
      </div>

      {/* Right panel: Text content */}
      <div className="w-3/5 flex flex-col justify-center p-8">
        <EditableText
          value={String(td.title || '')}
          fieldKey="title"
          isSelected={isSelected}
          onEdit={onEditField}
          className="font-black text-white leading-tight mb-3"
          style={{ fontSize: 'clamp(20px, 4%, 36px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
          placeholder="Judul Pertemuan"
        />

        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          className=""
          style={{ fontSize: 'clamp(11px, 2%, 18px)', color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Divider accent */}
        <div className="mt-4 w-16 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, ${cyan})` }} />
      </div>
    </div>
  );
}
