'use client';

// ═══════════════════════════════════════════════════════════════════
// THEME PRESET PICKER — Popover UI for selecting theme presets
// ═══════════════════════════════════════════════════════════════════
// Shows all available theme presets with color swatch previews.
// Selecting a preset applies it immediately via applyThemePreset().

import { useState, useEffect, useCallback } from 'react';
import { Palette, Check } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { THEME_PRESETS } from '@/core/themes/tokens';
import {
  applyThemePreset,
  getStoredPresetId,
  getPresetSwatchColors,
} from '@/lib/apply-theme-preset';

export function ThemePresetPicker() {
  const [currentPreset, setCurrentPreset] = useState<string>('default');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = getStoredPresetId();
    if (stored) {
      setCurrentPreset(stored);
    }
  }, []);

  const handleSelect = useCallback((presetId: string) => {
    setCurrentPreset(presetId);
    applyThemePreset(presetId);
    setOpen(false);
  }, []);

  // Avoid hydration mismatch — render a skeleton until mounted
  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center h-6 w-6 rounded-md text-app-muted opacity-50"
        disabled
      >
        <Palette size={12} />
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center justify-center h-6 w-6 rounded-md text-app-muted hover:text-app-accent hover:bg-app-accent/10 transition-colors"
          title="Theme presets"
        >
          <Palette size={12} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        className="w-60 p-1.5 bg-app-surface border border-app-border shadow-lg"
      >
        <div className="text-[9px] font-bold text-app-secondary uppercase tracking-wider px-2 py-1.5 mb-1 flex items-center gap-1.5">
          <Palette size={10} />
          Theme Presets
        </div>

        <div className="space-y-0.5 max-h-[280px] overflow-y-auto custom-scrollbar">
          {THEME_PRESETS.map((preset) => {
            const colors = getPresetSwatchColors(preset.id);
            const isActive = currentPreset === preset.id;

            return (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[11px]
                  ${
                    isActive
                      ? 'bg-app-accent/15 text-app-accent border border-app-accent/25'
                      : 'text-app-primary hover:bg-app-elevated/60 border border-transparent'
                  }
                `}
              >
                {/* Color swatch dots */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <span
                    className="w-3 h-3 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: colors.secondary }}
                  />
                </div>

                {/* Preset name */}
                <span className="flex-1 truncate">{preset.name}</span>

                {/* Active indicator */}
                {isActive && (
                  <Check size={12} className="text-app-accent flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
