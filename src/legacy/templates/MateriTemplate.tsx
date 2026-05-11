'use client';

import { useState } from 'react';
import { getPaletteColor, alpha } from '@/lib/color-palette';
import type { SubTemplateProps } from './types';
import { EditableText } from './EditableText';
import { ModulePreview } from '@/components/shared/preset-module-card/PresetModuleCard';
import type { LayoutVariant, M } from '@/components/shared/preset-module-card/types';
import { TemplateNavButton } from './TemplateNavButton';
import { MateriBlokRenderer } from './MateriBlokRenderer';
import type { MateriBlok } from '@/store/authoring/types';

// ── Materi Template ───────────────────────────────────────────
// Uses ModulePreview from preset-module-card for pixel-perfect
// rendering matching the preset preview in Dashboard/Konten.

type ActiveTab = 'blok' | 'modul';

export function MateriTemplate({ td, palette, isSelected, onEditField, interactive, variant = 'A' }: SubTemplateProps) {
  const accent = getPaletteColor(palette, '--y', '#a78bfa');
  const accent2 = getPaletteColor(palette, '--c', '#3ecfcf');
  const blok = (td.blok as MateriBlok[]) || [];
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

      {/* Tab Toggle Buttons */}
      {hasAnyContent && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5">
          {tabBtn('blok', '📦', 'Materi', blok.length, accent, hasBlok)}
          {tabBtn('modul', '🧩', 'Modul', modules.length, accent2, hasModules)}
        </div>
      )}

      {/* ── Blok/Materi Content — data-driven render per tipe ── */}
      {activeTab === 'blok' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {blok.length > 0 ? (
            <div className={variant === 'B' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
              {blok.map((b, i) => (
                <MateriBlokRenderer
                  key={i}
                  blok={b}
                  accent={accent}
                  interactive={!!interactive}
                  compact={variant === 'B'}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <span className="text-3xl mb-2">📦</span>
              <span className="text-[10px]">{interactive ? 'Belum ada materi tersedia' : 'Tambah materi di panel Konten → Materi'}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Modul Content — uses ModulePreview per module ── */}
      {activeTab === 'modul' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {modules.length > 0 ? (
            <div className={variant === 'B' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
              {modules.map((m, i) => (
                <ModulePreview
                  key={i}
                  mod={m as M}
                  variant={(m.layoutVariant as LayoutVariant) || 'A'}
                  compact={variant === 'B'}
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

      {/* Empty state */}
      {!hasAnyContent && (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <span className="text-3xl mb-2">📝</span>
          <span className="text-[10px]">{interactive ? 'Belum ada materi tersedia' : 'Tambah materi di panel Konten → Materi'}</span>
        </div>
      )}

      {/* Navigation button */}
      {interactive && (
        <div className="flex justify-center mt-3">
          <TemplateNavButton action="next" accent={accent} size="md" />
        </div>
      )}
    </div>
  );
}
