'use client';

import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { useInteractiveStore } from '@/store/interactive-store';
import { useCanvaStore } from '@/store/canva-store';

// ── Cover Template ────────────────────────────────────────────
// Phase 10: Fixed bottom decoration overlap with nav bar,
// added durasi display, improved readability of all text sizes.
// Phase 11: Added "Mulai Belajar" button for interactive mode.

export function CoverTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#f9c82e');
  const bg = getPaletteColor(palette, '--bg', '#0f172a');
  const cyan = getPaletteColor(palette, '--c', '#3ecfcf');
  const green = getPaletteColor(palette, '--g', '#34d399');

  // ── "Mulai Belajar" button — navigates to next page in Play/Export ──
  const MulaiButton = () => (
    <button
      onClick={() => {
        // Guard: only navigate in actual Play/Export mode, not canvas preview
        if (useInteractiveStore.getState().mode !== 'interactive') return;
        useInteractiveStore.getState().nextInteractivePage();
        const nextIdx = useCanvaStore.getState().currentPageIndex + 1;
        useCanvaStore.getState().goPage(nextIdx);
      }}
      className="px-6 py-2.5 rounded-xl text-[12px] font-extrabold transition-all hover:scale-105 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${accent}, ${alpha(accent, 0.8)})`,
        color: '#0f172a',
        boxShadow: `0 4px 20px ${alpha(accent, 0.35)}, 0 0 40px ${alpha(accent, 0.15)}`,
      }}
    >
      Mulai Belajar →
    </button>
  );

  // ── Variant A: Centered (original) ──
  if (variant === 'A') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
        style={{ background: `linear-gradient(180deg, ${bg} 0%, ${alpha(bg, 0.87)} 100%)` }}>

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
          interactive={interactive}
          className="font-black text-white leading-tight line-clamp-2"
          style={{ fontSize: 'clamp(18px, 3.5vw, 32px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
          placeholder="Judul Pertemuan"
        />

        {/* Subtitle */}
        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          interactive={interactive}
          className="mt-2 line-clamp-2"
          style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', color: 'rgba(255,255,255,.7)' }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Badge: Mapel + Kelas + Durasi */}
        {(Boolean(td.mapel || td.kelas) || Boolean(td.durasi)) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {Boolean(td.mapel || td.kelas) && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold"
                style={{
                  background: alpha(accent, 0.12),
                  border: `1px solid ${alpha(accent, 0.25)}`,
                  color: accent,
                }}>
                {String(td.namaBab || td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
              </span>
            )}
            {Boolean(td.durasi) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
                style={{
                  background: alpha(cyan, 0.1),
                  border: `1px solid ${alpha(cyan, 0.2)}`,
                  color: cyan,
                }}>
                ⏱ {String(td.durasi)}
              </span>
            )}
          </div>
        )}

        {/* Mulai Belajar button */}
        <div className="mt-6">
          <MulaiButton />
        </div>

        {/* Decorative bottom — positioned higher to avoid bottom nav overlap */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
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
        style={{ background: `linear-gradient(135deg, ${bg} 0%, ${alpha(bg, 0.8)} 100%)` }}>

        {/* Decorative left bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5"
          style={{ background: `linear-gradient(180deg, ${accent}, ${cyan}, ${green})` }} />

        {/* Badge at top */}
        {(Boolean(td.mapel || td.kelas) || Boolean(td.durasi)) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 w-fit">
            {Boolean(td.mapel || td.kelas) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: alpha(accent, 0.12),
                  border: `1px solid ${alpha(accent, 0.25)}`,
                  color: accent,
                }}>
                {String(td.namaBab || td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
              </span>
            )}
            {Boolean(td.durasi) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold"
                style={{ background: alpha(cyan, 0.1), border: `1px solid ${alpha(cyan, 0.2)}`, color: cyan }}>
                ⏱ {String(td.durasi)}
              </span>
            )}
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
            interactive={interactive}
            className="font-black text-white leading-tight line-clamp-2"
            style={{ fontSize: 'clamp(16px, 3.2vw, 30px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
            placeholder="Judul Pertemuan"
          />
        </div>

        {/* Subtitle */}
        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          interactive={interactive}
          className="mt-1 line-clamp-2"
          style={{ fontSize: 'clamp(11px, 1.6vw, 14px)', color: 'rgba(255,255,255,.6)' }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Mulai Belajar button */}
        <div className="mt-5">
          <MulaiButton />
        </div>

        {/* Decorative accent dots bottom right */}
        <div className="absolute bottom-8 right-6 flex gap-1.5">
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
        style={{ background: `linear-gradient(135deg, ${alpha(accent, 0.08)}, ${alpha(cyan, 0.06)})` }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${alpha(bg, 0.5)}, ${alpha(bg, 0.25)})` }} />
        <div className="relative text-6xl mb-4" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.4))' }}>
          {String(td.icon || '📚')}
        </div>
        {/* Badges */}
        <div className="relative flex flex-col items-center gap-1.5">
          {Boolean(td.mapel || td.kelas) && (
            <span className="px-3 py-1 rounded-full text-[9px] font-bold"
              style={{ background: alpha(accent, 0.19), border: `1px solid ${alpha(accent, 0.31)}`, color: accent }}>
              {String(td.namaBab || td.mapel || '')} {td.kelas ? `• Kelas ${td.kelas}` : ''}
            </span>
          )}
          {Boolean(td.durasi) && (
            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold"
              style={{ background: alpha(cyan, 0.1), border: `1px solid ${alpha(cyan, 0.2)}`, color: cyan }}>
              ⏱ {String(td.durasi)}
            </span>
          )}
        </div>
        {/* Decorative dots */}
        <div className="absolute bottom-8 flex gap-1">
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
          interactive={interactive}
          className="font-black text-white leading-tight mb-3 line-clamp-2"
          style={{ fontSize: 'clamp(20px, 4vw, 36px)', textShadow: '0 2px 12px rgba(0,0,0,.5)' }}
          placeholder="Judul Pertemuan"
        />

        <EditableText
          value={String(td.subtitle || '')}
          fieldKey="subtitle"
          isSelected={isSelected}
          onEdit={onEditField}
          interactive={interactive}
          className="line-clamp-3"
          style={{ fontSize: 'clamp(11px, 2vw, 18px)', color: 'rgba(255,255,255,.65)', lineHeight: 1.5 }}
          placeholder="Subjudul / Deskripsi"
        />

        {/* Mulai Belajar button */}
        <div className="mt-5">
          <MulaiButton />
        </div>

        {/* Divider accent */}
        <div className="mt-4 w-16 h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, ${cyan})` }} />
      </div>
    </div>
  );
}
