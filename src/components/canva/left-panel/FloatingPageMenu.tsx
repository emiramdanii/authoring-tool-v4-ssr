'use client';

import { useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { getPresetsGroupedByCategory, type PagePreset } from '@/core/preset/PagePresetRegistry';
import type { PageTemplateType } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════
// FLOATING PAGE MENU — Popover for adding pages by template type
// ═══════════════════════════════════════════════════════════════
// Sprint 1E.4 — Tahap 1: Tambah Halaman saja.
// Shows presets grouped by category in a compact 2-column grid.
// Uses Radix Popover: click-outside + ESC to close built-in.
// Portal rendering: floats above panel, doesn't replace content.
// ═══════════════════════════════════════════════════════════════

// Category labels for display (teacher-friendly)
const CATEGORY_LABELS: Record<string, string> = {
  utama: 'Halaman',
  konten: 'Konten',
  interaktif: 'Interaktif',
  penutup: 'Penutup',
};

interface FloatingPageMenuProps {
  /** Callback when a preset is selected — receives the template type */
  onSelect: (templateType: PageTemplateType) => void;
  /** The trigger element (button, etc.) */
  children: React.ReactNode;
  /** Alignment of popover relative to trigger */
  align?: 'start' | 'center' | 'end';
  /** Side of trigger to appear */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function FloatingPageMenu({
  onSelect,
  children,
  align = 'start',
  side = 'right',
}: FloatingPageMenuProps) {
  // Get presets grouped by category — cached by useMemo
  const grouped = useMemo(() => getPresetsGroupedByCategory(), []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-[280px] p-3 bg-silse-surface-bright border-silse-outline-variant/40 shadow-lg rounded-xl z-50"
        // Close on ESC is built-in. Close on click-outside is built-in.
        onCloseAutoFocus={(e) => {
          // Prevent focus from jumping to unexpected element after close
          e.preventDefault();
        }}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-1.5 px-1">
            <span className="material-symbols-outlined text-silse-primary" style={{ fontSize: '16px' }}>add_circle</span>
            <span className="text-[11px] font-bold text-silse-on-surface uppercase tracking-wider">
              Tambah Halaman
            </span>
          </div>

          {/* Preset groups */}
          {grouped.map(({ category, presets }) => {
            // Filter out 'custom' (kosong) from floating menu — guru adds specific types
            const filtered = presets.filter(p => p.id !== 'custom');
            if (filtered.length === 0) return null;

            return (
              <div key={category}>
                {/* Category label */}
                <div className="flex items-center gap-1.5 px-1 mb-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-silse-outline font-bold">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <div className="flex-1 h-px bg-silse-outline-variant/30" />
                </div>

                {/* 2-column grid of preset items */}
                <div className="grid grid-cols-2 gap-1">
                  {filtered.map((preset) => (
                    <PresetItem
                      key={preset.id}
                      preset={preset}
                      onClick={() => onSelect(preset.id as PageTemplateType)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Individual preset item button ────────────────────────────
function PresetItem({ preset, onClick }: { preset: PagePreset; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-1.5 px-2 py-1.5 rounded-lg
        text-[10px] font-medium text-silse-on-surface-variant
        hover:bg-silse-primary/5 hover:text-silse-primary hover:border-silse-primary/20
        border border-transparent
        transition-[background-color,color,border-color] duration-150
        text-left
      "
      title={preset.description}
    >
      <span className="text-[13px] flex-shrink-0">{preset.icon}</span>
      <span className="truncate">{preset.label}</span>
    </button>
  );
}
