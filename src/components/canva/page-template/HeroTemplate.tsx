'use client';

import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';

// ── Hero Template ─────────────────────────────────────────────

export function HeroTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  // Phase 9 fix: use palette --bg instead of hardcoded gradient
  const bg = getPaletteColor(palette, '--bg', '#0f172a');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}cc, ${bg})` }}>

      {/* Icon */}
      <div className="text-4xl mb-3">{String(td.icon || '🚀')}</div>

      {/* Title */}
      <EditableText
        value={String(td.title || '')}
        fieldKey="title"
        isSelected={isSelected}
        onEdit={onEditField}
        interactive={interactive}
        className="font-black text-white leading-tight"
        style={{ fontSize: 'clamp(16px, 3%, 28px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
        placeholder="Hero Title"
      />

      {/* Subtitle */}
      <EditableText
        value={String(td.subtitle || '')}
        fieldKey="subtitle"
        isSelected={isSelected}
        onEdit={onEditField}
        interactive={interactive}
        className="mt-2"
        style={{ fontSize: 'clamp(10px, 1.6%, 14px)', color: 'rgba(255,255,255,.6)' }}
        placeholder="Subjudul"
      />

      {/* CTA Button */}
      {Boolean(td.cta) && (
        <div className="mt-5 px-5 py-2 rounded-xl font-bold text-sm"
          style={{ background: accent, color: '#000' }}>
          {String(td.cta)}
        </div>
      )}

      {/* Chips */}
      {Boolean(td.chips) && (
        <div className="flex gap-2 mt-3">
          {String(td.chips).split(',').map((chip, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[8px] font-bold"
              style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
              {chip.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
