'use client';

// ═══════════════════════════════════════════════════════════════════
// STYLE PRESET PICKER — New Style Contract preset selector (Sprint 8.2D)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2D — Teacher Style Picker
//
// Shows the 6 Style Contract presets (academic-clean, school-cheerful,
// mission-adventure, dark-elegant, nusantara-nature, modern-interactive)
// with color swatch previews. Selecting a preset calls setSchemaThemeId()
// which writes to schema.themeId — the canonical source for
// resolvePageStyleTokens().
//
// This component does NOT replace the legacy ThemePresetPicker (which
// uses 17 legacy THEME_PRESETS + CSS variable injection). Both coexist
// during the migration period. The legacy picker is for old themes;
// this picker is for the new Style Contract presets.
//
// When a teacher selects a new preset:
//   1. setSchemaThemeId(presetId) writes to schema.themeId
//   2. resolvePageStyleTokens(page) picks it up (source = 'new-preset')
//   3. Canvas, Preview, Present, Export all use the same tokens
//   4. No CSS variable injection — tokens flow through Style Contract
// ═══════════════════════════════════════════════════════════════════

import React from 'react';
import {
  getAllStylePresets,
  isValidPresetId,
  type StylePresetDefinition,
} from '@/core/style/preset-registry';

interface StylePresetPickerProps {
  /** Current schema.themeId (or templateData.schemaThemeId) */
  currentThemeId: string | undefined;
  /** Callback to set the theme — typically setSchemaThemeId */
  onSelect: (presetId: string) => void;
}

export function StylePresetPicker({
  currentThemeId,
  onSelect,
}: StylePresetPickerProps) {
  const presets = getAllStylePresets();

  return (
    <div className="mb-3">
      <label className="text-[10px] text-silse-on-surface-variant block mb-1">
        ✨ Preset Gaya Baru
      </label>
      <div className="grid grid-cols-3 gap-1">
        {presets.map((preset: StylePresetDefinition) => {
          const isActive =
            currentThemeId === preset.id ||
            (!currentThemeId && preset.id === 'academic-clean');

          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className={`py-1.5 px-1 rounded-lg text-[8px] font-bold transition-[background-color,border-color,color] border ${
                isActive
                  ? 'border-silse-primary bg-silse-primary/20 text-silse-primary'
                  : 'border-silse-outline-variant bg-silse-surface-container-low text-silse-on-surface-variant hover:border-silse-outline-variant'
              }`}
              title={preset.description}
            >
              {/* Color swatch preview */}
              <div className="flex gap-0.5 justify-center mb-0.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: preset.colors.accent }}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: preset.semantic.accents.cyan }}
                />
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: preset.semantic.accents.green }}
                />
              </div>
              <span className="block truncate">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
