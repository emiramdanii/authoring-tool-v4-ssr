'use client';

// ═══════════════════════════════════════════════════════════════════
// BLOCK STYLE PRESET GRID — "Gaya Cepat" per-block preset picker
// ═══════════════════════════════════════════════════════════════════
// Sprint 2K.2 — Block Style Preset Grid UI
//
// PURPOSE:
//   Displays a compact grid of style presets ("Gaya Cepat") in the
//   guided editor's "Tampilan" section. Teachers can click a preset
//   to apply a curated combination of style values in one action.
//
// DATA FLOW:
//   Click preset → resolveBlockStylePreset(presetId, blockType)
//                → onApplyPreset(resolvedPatch)
//                → applyGuidedSchemaPatch() in GuidedFormEditor
//
// SAFETY:
//   - Only renders when blockTypeSupportsPresets(blockType) === true
//   - Only applies fields the renderer actually reads (via resolver)
//   - Empty patches are never applied
//   - Active state shows which preset currently matches block values
//   - Duplicate patches are deduplicated (e.g., kuis shows 3, not 7)
//
// DEDUPLICATION (Sprint 2K.4):
//   For variant-only blocks (kuis, diskusi, nc-grid, tujuan-display),
//   multiple presets may resolve to identical patches. The grid uses
//   getApplicableBlockStylePresets() which deduplicates by patch content,
//   keeping only the first preset for each unique patch.
//
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import type { SchemaBlock } from '@/core/schema/types';
import {
  resolveBlockStylePreset,
  blockTypeSupportsPresets,
  getSupportedStyleFields,
  getApplicableBlockStylePresets,
} from '@/core/schema/block-style-presets';
import type { BlockStylePreset } from '@/core/schema/block-style-presets';

// ── Accent Color Swatch Mapping ────────────────────────────────
// Mirrors TOKEN_COLORS from guided-field-renderer.tsx.
// Kept local to avoid cross-file coupling — this component only
// needs the 6 accent color tokens (y/c/g/p/o/r), not the full set.

const ACCENT_SWATCHES: Record<string, {
  swatch: string;
  bg: string;
  activeBg: string;
  activeText: string;
  ring: string;
}> = {
  'y': { swatch: 'bg-amber-500',    bg: 'bg-amber-500/10',    activeBg: 'bg-amber-500/20',    activeText: 'text-amber-700',    ring: 'ring-amber-500/40' },
  'c': { swatch: 'bg-cyan-500',     bg: 'bg-cyan-500/10',     activeBg: 'bg-cyan-500/20',     activeText: 'text-cyan-700',     ring: 'ring-cyan-500/40' },
  'g': { swatch: 'bg-emerald-500',  bg: 'bg-emerald-500/10',  activeBg: 'bg-emerald-500/20',  activeText: 'text-emerald-700',  ring: 'ring-emerald-500/40' },
  'p': { swatch: 'bg-purple-500',   bg: 'bg-purple-500/10',   activeBg: 'bg-purple-500/20',   activeText: 'text-purple-700',   ring: 'ring-purple-500/40' },
  'o': { swatch: 'bg-orange-500',   bg: 'bg-orange-500/10',   activeBg: 'bg-orange-500/20',   activeText: 'text-orange-700',   ring: 'ring-orange-500/40' },
  'r': { swatch: 'bg-red-500',      bg: 'bg-red-500/10',      activeBg: 'bg-red-500/20',      activeText: 'text-red-700',      ring: 'ring-red-500/40' },
};

// ── Props ──────────────────────────────────────────────────────

interface BlockStylePresetGridProps {
  /** Block type (e.g., 'materi-section', 'kuis') */
  blockType: string;
  /** Current block data — used for active state detection */
  block: SchemaBlock;
  /** Callback to apply a resolved preset patch */
  onApplyPreset: (patch: Record<string, unknown>) => void;
}

// ── Helper: determine which preset color token to show ─────────
// For blocks that support accentColor, show the preset's accentColor swatch.
// For blocks that only support variant (kuis, diskusi, etc.),
// show a neutral indicator since the preset only changes variant.
// For def-box (borderColor only), show the borderColor swatch.

function getPresetDisplayColor(preset: BlockStylePreset, supportedFields: string[]): string | null {
  if (supportedFields.includes('accentColor') && preset.values.accentColor) {
    return preset.values.accentColor;
  }
  if (supportedFields.includes('borderColor') && preset.values.accentColor) {
    // For def-box, borderColor maps from preset's accentColor value
    return preset.values.accentColor;
  }
  if (supportedFields.includes('warna') && preset.values.accentColor) {
    // For materi-blok, warna maps from preset's accentColor value
    return preset.values.accentColor;
  }
  // Block only has variant — no color swatch meaningful
  return null;
}

// ── Helper: check if current block matches a resolved preset ───

function isPresetActive(
  preset: BlockStylePreset,
  blockType: string,
  blockData: Record<string, unknown>,
): boolean {
  const resolved = resolveBlockStylePreset(preset.id, blockType);
  const keys = Object.keys(resolved);
  if (keys.length === 0) return false;

  return keys.every(key => {
    const currentVal = blockData[key];
    const presetVal = resolved[key];
    return currentVal === presetVal;
  });
}

// ── Component ──────────────────────────────────────────────────

export function BlockStylePresetGrid({ blockType, block, onApplyPreset }: BlockStylePresetGridProps) {
  // Guard: only render for block types with preset capabilities
  const supported = blockTypeSupportsPresets(blockType);
  const supportedFields = useMemo(() => getSupportedStyleFields(blockType), [blockType]);

  // Get deduplicated applicable presets (filters empty + removes duplicate patches)
  const applicablePresets = useMemo(() => {
    return getApplicableBlockStylePresets(blockType);
  }, [blockType]);

  // Block data as Record for field comparison
  const blockData = block as unknown as Record<string, unknown>;

  // Handle preset click — use pre-resolved patch
  const handlePresetClick = useCallback((preset: BlockStylePreset, patch: Record<string, unknown>) => {
    if (Object.keys(patch).length === 0) return; // Empty patch — don't apply
    onApplyPreset(patch);
  }, [onApplyPreset]);

  if (!supported || applicablePresets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Section label — matches SILSE v4 PropertyGroup style */}
      <label className="text-[12px] font-bold text-silse-on-surface-variant flex items-center gap-1.5">
        <span
          className="material-symbols-outlined text-silse-on-surface-variant"
          style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1, 'wght' 400" }}
        >
          auto_awesome
        </span>
        Gaya Cepat
      </label>

      {/* Preset grid — 3 columns for compact layout */}
      <div className="grid grid-cols-3 gap-2">
        {applicablePresets.map(({ preset, patch }) => {
          const colorToken = getPresetDisplayColor(preset, supportedFields);
          const swatchInfo = colorToken ? ACCENT_SWATCHES[colorToken] : null;
          const isActive = isPresetActive(preset, blockType, blockData);

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset, patch)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-200
                ${isActive
                  ? swatchInfo
                    ? `${swatchInfo.activeBg} ${swatchInfo.activeText} border-current/30 ring-2 ${swatchInfo.ring}`
                    : 'bg-silse-primary-container/20 text-silse-on-primary-container border-silse-primary/30 ring-2 ring-silse-primary/20'
                  : 'bg-silse-surface-bright border-silse-outline-variant text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:border-silse-on-surface-variant/30'
                }
              `}
              title={preset.description}
              type="button"
            >
              {/* Icon row: emoji + color swatch */}
              <div className="flex items-center gap-1">
                <span className="text-[14px] leading-none">{preset.icon}</span>
                {swatchInfo && (
                  <span className={`w-3 h-3 rounded-full ${swatchInfo.swatch} ring-1 ring-black/10`} />
                )}
              </div>
              {/* Preset label */}
              <span className="text-[10px] font-bold leading-tight">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
