'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import PresetModuleCard, { type LayoutVariant } from '@/components/shared/PresetModuleCard';
import { TemplateNavButton } from './TemplateNavButton';

// ── Materi Template ───────────────────────────────────────────
// Phase 10: Added tab toggle for Blok/Modul views, improved font
// sizes for readability, fixed overflow when both blocks and modules exist.
// Phase 11: Added "Lanjut" nav button in interactive mode.

type ActiveTab = 'blok' | 'modul';

export function MateriTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#a78bfa');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const blok = (td.blok as Array<Record<string, unknown>>) || [];
  const modules = (td.modules as Array<Record<string, unknown>>) || [];

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (blok.length > 0) return 'blok';
    if (modules.length > 0) return 'modul';
    return 'blok';
  });

  const hasBlok = blok.length > 0;
  const hasModules = modules.length > 0;
  const hasAnyContent = hasBlok || hasModules;

  // Tab button helper
  const tabBtn = (tab: ActiveTab, icon: string, label: string, count: number, color: string, enabled: boolean) => (
    <button
      onClick={() => enabled && setActiveTab(tab)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
        activeTab === tab && enabled
          ? 'scale-105'
          : enabled
            ? 'opacity-60 hover:opacity-90'
            : 'opacity-30 cursor-not-allowed'
      }`}
      style={{
        background: activeTab === tab && enabled ? alpha(color, 0.15) : 'rgba(255,255,255,0.04)',
        border: `1px solid ${activeTab === tab && enabled ? alpha(color, 0.35) : 'rgba(255,255,255,0.08)'}`,
        color: activeTab === tab && enabled ? color : 'rgba(255,255,255,0.5)',
        boxShadow: activeTab === tab && enabled ? `0 0 12px ${alpha(color, 0.12)}` : 'none',
      }}
      disabled={!enabled}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span className="px-1 rounded text-[7px]"
          style={{ background: alpha(color, 0.15), color: activeTab === tab && enabled ? color : 'rgba(255,255,255,0.4)' }}>
          {count}
        </span>
      )}
      {activeTab === tab && enabled && <span className="text-[7px]" style={{ color }}>●</span>}
    </button>
  );

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: alpha(accent, 0.12) }}>📝</div>
        <div>
          <EditableText
            value={String(td.materiTitle || 'Materi Pembelajaran')}
            fieldKey="materiTitle"
            isSelected={isSelected}
            onEdit={onEditField}
            interactive={interactive}
            className="font-black text-white text-sm"
            placeholder="Judul Materi"
          />
          <div className="text-[9px] text-white/40">{blok.length} blok • {modules.length} modul</div>
        </div>
      </div>

      {/* Tab Toggle Buttons — show when both content types exist */}
      {hasAnyContent && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
          {tabBtn('blok', '📦', 'Materi', blok.length, accent, hasBlok)}
          {tabBtn('modul', '🧩', 'Modul', modules.length, accent2, hasModules)}
        </div>
      )}

      {/* ── Blok/Materi Content ── */}
      {activeTab === 'blok' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {blok.length > 0 ? (
            variant === 'B' ? (
              /* Variant B: 2-column grid */
              <div className="grid grid-cols-2 gap-2">
                {blok.map((b, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      {Boolean(b.icon) && <span className="text-base">{String(b.icon)}</span>}
                      {Boolean(b.judul) && <span className="text-[10px] font-bold text-white">{String(b.judul)}</span>}
                    </div>
                    {Boolean(b.isi) && <div className="text-[9px] text-white/70 leading-relaxed line-clamp-4">{String(b.isi)}</div>}
                    {Array.isArray(b.butir) && (
                      <div className="space-y-0.5 mt-1.5">
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
            ) : (
              /* Variant A: Vertical list */
              <div className="space-y-2">
                {blok.map((b, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      {Boolean(b.icon) && <span className="text-base">{String(b.icon)}</span>}
                      {Boolean(b.judul) && <span className="text-[11px] font-bold text-white">{String(b.judul)}</span>}
                    </div>
                    {Boolean(b.isi) && <div className="text-[9px] text-white/70 leading-relaxed line-clamp-4">{String(b.isi)}</div>}
                    {Array.isArray(b.butir) && (
                      <div className="space-y-0.5 mt-1.5">
                        {(b.butir as string[]).slice(0, 5).map((item, j) => (
                          <div key={j} className="text-[9px] text-white/60 flex items-start gap-1">
                            <span className="text-[8px] mt-0.5">•</span>
                            <span className="line-clamp-2">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <span className="text-3xl mb-2">📦</span>
              <span className="text-[10px]">{interactive ? 'Belum ada materi tersedia' : 'Tambah materi di panel Konten → Materi'}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Modul Content ── */}
      {activeTab === 'modul' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {modules.length > 0 ? (
            <div className="space-y-2">
              {modules.map((m, i) => (
                <PresetModuleCard
                  key={i}
                  mode="canvas"
                  module={m as Parameters<typeof PresetModuleCard>[0]['module']}
                  layoutVariant={(m.layoutVariant as LayoutVariant) || 'A'}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <span className="text-3xl mb-2">🧩</span>
              <span className="text-[10px]">{interactive ? 'Belum ada modul tersedia' : 'Tambah modul di panel Konten → Modul'}</span>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no content at all */}
      {!hasAnyContent && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📝</span>
          <span className="text-[10px]">{interactive ? 'Belum ada materi tersedia' : 'Tambah materi di panel Konten → Materi'}</span>
        </div>
      )}

      {/* Navigation button — advance to next page in interactive mode */}
      {interactive && (
        <div className="flex justify-center mt-3">
          <TemplateNavButton action="next" accent={accent} size="md" />
        </div>
      )}
    </div>
  );
}
