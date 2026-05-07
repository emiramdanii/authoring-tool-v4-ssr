'use client';

import { getPaletteColor } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';

// ── Materi Template ───────────────────────────────────────────
// Phase 3: 2 variants — A (vertical list), B (2-column grid)

export function MateriTemplate({ td, palette, isSelected, onEditField, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#a78bfa');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const blok = (td.blok as Array<Record<string, unknown>>) || [];
  const modules = (td.modules as Array<Record<string, unknown>>) || [];

  // ── Variant A: Vertical list (original) ──
  if (variant === 'A') {
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: `${accent}20` }}>📝</div>
          <div>
            <EditableText
              value="Materi Pembelajaran"
              fieldKey="materiTitle"
              isSelected={isSelected}
              onEdit={onEditField}
              className="font-black text-white text-sm"
              placeholder="Judul Materi"
            />
            <div className="text-[9px] text-white/40">{blok.length} blok • {modules.length} modul</div>
          </div>
        </div>

        {/* Materi Blocks */}
        {blok.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {blok.map((b, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                {Boolean(b.judul) && <div className="text-[10px] font-bold text-white mb-0.5">{String(b.judul)}</div>}
                {Boolean(b.isi) && <div className="text-[8px] text-white/70 leading-relaxed line-clamp-3">{String(b.isi)}</div>}
                {Boolean(b.icon) && <span className="text-sm mr-1">{String(b.icon)}</span>}
                {Array.isArray(b.butir) && (
                  <div className="space-y-0.5 mt-1">
                    {(b.butir as string[]).slice(0, 4).map((item, j) => (
                      <div key={j} className="text-[8px] text-white/60 flex items-start gap-1">
                        <span className="text-[7px] mt-0.5">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Module Cards */}
        {modules.length > 0 && (
          <div className="mt-2 space-y-1">
            {modules.slice(0, 3).map((m, i) => (
              <PresetModuleCard
                key={i}
                mode="canvas"
                module={m as Parameters<typeof PresetModuleCard>[0]['module']}
                layoutVariant={(m.layoutVariant as LayoutVariant) || 'A'}
                compact
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {blok.length === 0 && modules.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30">
            <span className="text-3xl mb-2">📝</span>
            <span className="text-[10px]">Tambah materi di panel Konten → Materi</span>
          </div>
        )}
      </div>
    );
  }

  // ── Variant B: 2-column grid layout ──
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: `${accent}20` }}>📝</div>
        <div>
          <EditableText
            value="Materi Pembelajaran"
            fieldKey="materiTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            className="font-black text-white text-sm"
            placeholder="Judul Materi"
          />
          <div className="text-[9px] text-white/40">{blok.length} blok • {modules.length} modul</div>
        </div>
      </div>

      {/* 2-column grid */}
      {blok.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {blok.map((b, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10">
                {Boolean(b.icon) && <span className="text-lg">{String(b.icon)}</span>}
                {Boolean(b.judul) && <div className="text-[9px] font-bold text-white mb-0.5">{String(b.judul)}</div>}
                {Boolean(b.isi) && <div className="text-[7px] text-white/70 leading-relaxed line-clamp-4">{String(b.isi)}</div>}
                {Array.isArray(b.butir) && (
                  <div className="space-y-0.5 mt-1">
                    {(b.butir as string[]).slice(0, 3).map((item, j) => (
                      <div key={j} className="text-[7px] text-white/60 flex items-start gap-0.5">
                        <span className="text-[6px] mt-0.5">•</span>
                        <span className="line-clamp-1">{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Cards — horizontal scroll in variant B */}
      {modules.length > 0 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {modules.slice(0, 4).map((m, i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <PresetModuleCard
                mode="canvas"
                module={m as Parameters<typeof PresetModuleCard>[0]['module']}
                layoutVariant={(m.layoutVariant as LayoutVariant) || 'A'}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {blok.length === 0 && modules.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📝</span>
          <span className="text-[10px]">Tambah materi di panel Konten → Materi</span>
        </div>
      )}
    </div>
  );
}
