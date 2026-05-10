'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { TemplateNavButton } from './TemplateNavButton';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';

// ── Hero Template ─────────────────────────────────────────────
// Phase 10: CTA button is now clickable in interactive mode,
// navigating to the next page. Added chips rendering improvements.

export function HeroTemplate({ td, palette, isSelected, onEditField, interactive }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const cyan = getPaletteColor(palette, '--c', '#3ecfcf');
  const bg = getPaletteColor(palette, '--bg', '#0f172a');

  const handleCtaClick = () => {
    if (!interactive) return;
    // Only navigate in actual Play/Export mode — not in canvas editor preview
    if (useInteractiveStore.getState().mode !== 'interactive') return;
    useInteractiveStore.getState().nextInteractivePage();
    const nextIdx = useInteractiveStore.getState().interactivePageIdx;
    useCanvaStore.getState().goPage(nextIdx);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
      style={{ background: `linear-gradient(135deg, ${bg}, ${alpha(bg, 0.8)}, ${bg})` }}>

      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, ${cyan}, ${accent})` }} />

      {/* Icon */}
      <div className="text-5xl mb-3" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.3))' }}>
        {String(td.icon || '🚀')}
      </div>

      {/* Title */}
      <EditableText
        value={String(td.title || '')}
        fieldKey="title"
        isSelected={isSelected}
        onEdit={onEditField}
        interactive={interactive}
        className="font-black text-white leading-tight line-clamp-2"
        style={{ fontSize: 'clamp(18px, 3vw, 30px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
        placeholder="Hero Title"
      />

      {/* Subtitle */}
      <EditableText
        value={String(td.subtitle || '')}
        fieldKey="subtitle"
        isSelected={isSelected}
        onEdit={onEditField}
        interactive={interactive}
        className="mt-2 line-clamp-3"
        style={{ fontSize: 'clamp(11px, 1.6vw, 15px)', color: 'rgba(255,255,255,.6)', lineHeight: 1.5 }}
        placeholder="Subjudul"
      />

      {/* CTA Button — clickable in interactive mode */}
      {Boolean(td.cta) ? (
        <button
          onClick={handleCtaClick}
          className={`mt-5 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            interactive ? 'hover:scale-105 active:scale-95 cursor-pointer' : ''
          }`}
          style={{
            background: `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.85)})`,
            color: '#000',
            boxShadow: interactive ? `0 4px 20px ${alpha(accent, 0.3)}` : 'none',
          }}>
          {String(td.cta)} {interactive ? '→' : ''}
        </button>
      ) : (
        interactive && (
          <div className="mt-5">
            <TemplateNavButton action="next" accent={accent} size="lg" />
          </div>
        )
      )}

      {/* Chips */}
      {Boolean(td.chips) && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {(Array.isArray(td.chips) ? td.chips as string[] : String(td.chips || '').split(',')).map((chip: string, i: number) => {
            const trimmed = chip.trim();
            if (!trimmed) return null;
            return (
              <span key={i} className="px-3 py-1 rounded-full text-[9px] font-bold"
                style={{ background: alpha(accent, 0.1), color: accent, border: `1px solid ${alpha(accent, 0.2)}` }}>
                {trimmed}
              </span>
            );
          })}
        </div>
      )}

      {/* Decorative bottom dots — positioned higher to avoid nav */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[accent, cyan, getPaletteColor(palette, '--g', '#34d399')].map((c, i) => (
          <div key={i} className="w-6 h-1 rounded-full" style={{ background: c, opacity: 0.4 }} />
        ))}
      </div>
    </div>
  );
}
