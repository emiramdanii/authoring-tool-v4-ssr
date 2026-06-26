// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Preset Registry  (Sprint 8.1-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
// Patch:    P0-3 — semantic palette added to every preset definition.
//           P0-2 — preset → legacy themeId mappings verified against
//                  the actual THEME_PRESETS registry (17 themes).
// Patch-2:  P0-3 — `_legacyThemeId` made optional on
//                  StylePresetDefinition. `mission-adventure` no longer
//                  fabricates a fake bridge to 'glass' — it has no 1:1
//                  legacy theme counterpart.
//
// Six stable preset IDs. Each preset defines its visual DNA inline
// INCLUDING the full semantic palette (6 accent colors + categories).
// Sprint 8.1 establishes the IDENTITY and STRUCTURE only — visual
// polishing happens in Sprint 8.2.
//
// Constraints honored:
//   - Fonts use only families already loaded by the app (no new deps).
//   - Colors are self-contained — no runtime lookup into THEME_PRESETS.
//   - _legacyThemeId is metadata for the migration period only — and
//     only present when a real 1:1 legacy bridge exists.
//   - Semantic palette colors mirror the legacy THEME_PRESETS values
//     where a direct mapping exists, so old projects render the same.
// ═══════════════════════════════════════════════════════════════════

import type { Density, SemanticPalette, StylePresetId } from './types';
import { DEFAULT_PRESET_ID } from './defaults';

/**
 * Full definition of a style preset. Each preset is a complete visual
 * identity — colors, typography, shape, spacing, navigation, AND the
 * full semantic palette.
 */
export interface StylePresetDefinition {
  /** Stable preset identifier. */
  id: StylePresetId;
  /** Human-readable label (Bahasa Indonesia, teacher-facing). */
  label: string;
  /** One-line description (teacher-facing). */
  description: string;
  /** Optional thumbnail URL (Sprint 8.2 will populate). */
  thumbnail?: string;

  colors: {
    background: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    textMuted: string;
    accent: string;
    accentContrast: string;
    border: string;
    success: string;
    error: string;
  };

  /**
   * Semantic palette — 6 accent colors + standard semantic colors +
   * optional domain categories. Mirrors the legacy DesignTokens.colors
   * map so consumers don't lose features like norma cards, feedback
   * colors, or phase badges.
   */
  semantic: SemanticPalette;

  typography: {
    /** Font family stack for headings. */
    headingFamily: string;
    /** Font family stack for body text. */
    bodyFamily: string;
    /** CSS font-size value for base heading (h2-equivalent). */
    headingScale: string;
    /** CSS font-size value for base body text. */
    bodyScale: string;
  };

  shape: {
    /** CSS border-radius value. */
    radius: string;
    /** CSS border-width value. */
    borderWidth: string;
    /** CSS box-shadow value. */
    shadow: string;
  };

  spacing: {
    /** Default density when no override is set. */
    density: Density;
  };

  navigation: {
    /** Default navbar style. */
    style: string;
  };

  /**
   * Legacy themeId this preset maps to. Consumers MAY use this during
   * the migration period (Sprint 8.1–8.4) to bridge to the existing
   * THEME_PRESETS / TokenResolver system. Sprint 8.4 will remove it.
   *
   * Patch-2 (P0-3): Now optional. Presets with no real 1:1 legacy theme
   * counterpart (e.g. `mission-adventure`, whose namesake `petualangan`
   * is a BLOCK preset, not a theme) MUST leave this undefined rather
   * than fabricate a fake bridge. Fake bridges cause unstable
   * round-trips (e.g. mission-adventure → 'glass' → dark-elegant).
   *
   * When undefined, the resolver will only emit a non-empty
   * `ResolvedStyleTokens._legacyThemeId` if the input contract carries
   * `compatibility.legacyThemeId` (i.e. the source is a legacy project).
   */
  _legacyThemeId?: string;

  /**
   * Legacy template contractId this preset maps to, if any.
   */
  _legacyContractId?: string;
}

/**
 * Font stacks available in the app. Pulled from src/app/layout.tsx
 * (next/font definitions) and src/core/themes/tokens.ts (DesignTokens
 * defaults). No external font dependencies added.
 */
const FONT_DISPLAY =
  "'Fredoka', 'Poppins', var(--font-fredoka), system-ui, -apple-system, sans-serif";
const FONT_BODY =
  "'Nunito', 'Segoe UI', var(--font-nunito), system-ui, -apple-system, sans-serif";

/**
 * Helper: build a standard semantic palette from the 6 accent colors.
 * Domain-specific `categories` is left empty by default; presets that
 * need it (e.g. macam-norma) override.
 */
function buildSemanticPalette(accents: {
  yellow: string;
  cyan: string;
  red: string;
  purple: string;
  green: string;
  orange: string;
  categories?: Record<string, string>;
}): SemanticPalette {
  return {
    primary: accents.yellow,
    secondary: accents.cyan,
    info: accents.cyan,
    warning: accents.orange,
    success: accents.green,
    error: accents.red,
    accents: {
      yellow: accents.yellow,
      cyan: accents.cyan,
      red: accents.red,
      purple: accents.purple,
      green: accents.green,
      orange: accents.orange,
    },
    categories: accents.categories ?? {},
  };
}

/**
 * The six preset definitions. IDs are stable contracts.
 *
 * Color choices mirror the legacy THEME_PRESETS values where a direct
 * mapping exists, so old projects render identically after migration.
 */
export const STYLE_PRESETS: Record<StylePresetId, StylePresetDefinition> = {
  // ─────────────────────────────────────────────────────────────
  // academic-clean
  // BATCH-10C: Changed from dark navy (golden mirror) to LIGHT theme.
  // Was: background #0f172a, text #ffffff (dark — misleading name "clean")
  // Now: background #f8fafc, text #1e293b (actually clean/light)
  // Legacy golden-presentation projects still render via contract fallback.
  // ─────────────────────────────────────────────────────────────
  'academic-clean': {
    id: 'academic-clean',
    label: 'Akademik Bersih',
    description:
      'Tampilan terang dan profesional dengan aksen emas. Cocok untuk materi formal dan presentasi akademik.',
    colors: {
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceStrong: '#f1f5f9',
      text: '#1e293b',
      textMuted: '#64748b',
      accent: '#d97706',
      accentContrast: '#ffffff',
      border: '#e2e8f0',
      success: '#16a34a',
      error: '#dc2626',
    },
    semantic: buildSemanticPalette({
      yellow: '#d97706',
      cyan: '#0284c7',
      red: '#dc2626',
      purple: '#7c3aed',
      green: '#16a34a',
      orange: '#ea580c',
      categories: {
        agama: '#d97706',
        kesusilaan: '#dc2626',
        kesopanan: '#0284c7',
        hukum: '#7c3aed',
      },
    }),
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.6rem',
      bodyScale: '0.92rem',
    },
    shape: {
      radius: '12px',
      borderWidth: '1px',
      shadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'minimal',
    },
    _legacyThemeId: 'golden-presentation',
    _legacyContractId: 'golden-pertemuan',
  },

  // ─────────────────────────────────────────────────────────────
  // school-cheerful
  // Bright, friendly, rounded. For elementary/middle-school media.
  // Maps from legacy 'colorful' + 'ios-warm' themes.
  // ─────────────────────────────────────────────────────────────
  'school-cheerful': {
    id: 'school-cheerful',
    label: 'Sekolah Ceria',
    description:
      'Warna cerah dan ramah dengan sudut membulat. Cocok untuk SD/SMP dan materi yang menyenangkan.',
    colors: {
      background: '#1a1030',
      surface: '#301f58',
      surfaceStrong: '#3d2970',
      text: '#f0e6ff',
      textMuted: '#9b8ab8',
      accent: '#ffd166',
      accentContrast: '#1a1030',
      border: 'rgba(255,255,255,0.1)',
      success: '#06d6a0',
      error: '#ef476f',
    },
    semantic: buildSemanticPalette({
      yellow: '#ffd166',
      cyan: '#06d6a0',
      red: '#ef476f',
      purple: '#9b5de5',
      green: '#06d6a0',
      orange: '#ff9f1c',
    }),
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.7rem',
      bodyScale: '1rem',
    },
    shape: {
      radius: '20px',
      borderWidth: '2px',
      shadow: '0 4px 12px rgba(155, 90, 229, 0.25)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'colorful',
    },
    _legacyThemeId: 'colorful',
  },

  // ─────────────────────────────────────────────────────────────
  // mission-adventure
  // Earthy, expedition-style. For thematic / scenario-based learning.
  // Patch-2 (P0-3): 'petualangan' is a BLOCK style preset (not a theme
  // preset), so this preset has NO 1:1 legacy themeId counterpart.
  // Previously Sprint 8.1 fabricated a fake bridge to 'glass' which
  // caused an unstable round-trip (mission-adventure → 'glass' →
  // dark-elegant). The bridge is now removed; `_legacyThemeId` is left
  // undefined. Legacy projects with schemaThemeId='petualangan' will
  // fall through the LEGACY_THEME_TO_PRESET table to DEFAULT_PRESET_ID
  // (academic-clean) — which is acceptable since 'petualangan' was a
  // block preset and never a document-level theme in any real project.
  // ─────────────────────────────────────────────────────────────
  'mission-adventure': {
    id: 'mission-adventure',
    label: 'Misi Petualangan',
    description:
      'Nuansa ekspedisi dengan aksen hijau hutan. Cocok untuk materi berbasis skenario dan misi.',
    colors: {
      background: '#1c1917',
      surface: '#292524',
      surfaceStrong: '#44403c',
      text: '#fafaf9',
      textMuted: '#d6d3d1',
      accent: '#84cc16',
      accentContrast: '#1a2e05',
      border: '#57534e',
      success: '#22c55e',
      error: '#f87171',
    },
    semantic: buildSemanticPalette({
      yellow: '#fbbf24',
      cyan: '#3ecfcf',
      red: '#f87171',
      purple: '#a78bfa',
      green: '#84cc16',
      orange: '#fb923c',
    }),
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.65rem',
      bodyScale: '0.94rem',
    },
    shape: {
      radius: '12px',
      borderWidth: '1px',
      shadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'minimal',
    },
    // No _legacyThemeId — see preset header comment above (P0-3 patch-2).
  },

  // ─────────────────────────────────────────────────────────────
  // dark-elegant
  // Sophisticated dark with neon accents. For senior high / premium feel.
  // Maps from legacy 'neon' theme (1:1 color match).
  // ─────────────────────────────────────────────────────────────
  'dark-elegant': {
    id: 'dark-elegant',
    label: 'Gelap Elegan',
    description:
      'Latar gelap dengan aksen neon terang. Cocok untuk SMA dan presentasi yang berkarakter.',
    colors: {
      background: '#0a0a1a',
      surface: '#12122e',
      surfaceStrong: '#1a1a3e',
      text: '#e0e7ff',
      textMuted: '#6366f1',
      accent: '#22d3ee',
      accentContrast: '#0a0a1a',
      border: 'rgba(139,92,246,0.15)',
      success: '#34d399',
      error: '#f472b6',
    },
    semantic: buildSemanticPalette({
      yellow: '#c084fc',
      cyan: '#22d3ee',
      red: '#f472b6',
      purple: '#8b5cf6',
      green: '#34d399',
      orange: '#fb923c',
    }),
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.7rem',
      bodyScale: '0.95rem',
    },
    shape: {
      radius: '14px',
      borderWidth: '1px',
      shadow:
        '0 0 0 1px rgba(34, 211, 238, 0.15), 0 12px 36px rgba(0, 0, 0, 0.6)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'glass',
    },
    _legacyThemeId: 'neon',
  },

  // ─────────────────────────────────────────────────────────────
  // nusantara-nature
  // Warm, natural, batik-inspired earth tones. Cultural identity.
  // Maps from legacy 'warm-light' theme.
  // ─────────────────────────────────────────────────────────────
  'nusantara-nature': {
    id: 'nusantara-nature',
    label: 'Nusantara Alam',
    description:
      'Nuansa alam dan tanah Nusantara dengan aksen terra-cotta. Cocok untuk materi budaya dan IPA.',
    colors: {
      background: '#fefce8',
      surface: '#ffffff',
      surfaceStrong: '#fef9c3',
      text: '#1c1917',
      textMuted: '#78716c',
      accent: '#c2410c',
      accentContrast: '#fff7ed',
      border: 'rgba(0,0,0,0.06)',
      success: '#15803d',
      error: '#dc2626',
    },
    semantic: buildSemanticPalette({
      yellow: '#ca8a04',
      cyan: '#0d9488',
      red: '#dc2626',
      purple: '#9333ea',
      green: '#15803d',
      orange: '#c2410c',
    }),
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.6rem',
      bodyScale: '0.96rem',
    },
    shape: {
      radius: '18px',
      borderWidth: '1.5px',
      shadow: '0 4px 16px rgba(120, 53, 15, 0.15)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'colorful',
    },
    _legacyThemeId: 'warm-light',
  },

  // ─────────────────────────────────────────────────────────────
  // modern-interactive
  // Clean iOS-inspired light theme. For interactive / game-heavy media.
  // Maps from legacy 'ios-light' theme (1:1 color match).
  // ─────────────────────────────────────────────────────────────
  'modern-interactive': {
    id: 'modern-interactive',
    label: 'Modern Interaktif',
    description:
      'Tema terang minimalis dengan aksen biru. Cocok untuk media interaktif dan kuis berbasis game.',
    colors: {
      background: '#F5F7FB',
      surface: '#FFFFFF',
      surfaceStrong: '#f1f5f9',
      text: '#1C1C1E',
      textMuted: '#8E8E93',
      accent: '#007AFF',
      accentContrast: '#ffffff',
      border: 'rgba(15,23,42,0.06)',
      success: '#34C759',
      error: '#FF3B30',
    },
    semantic: buildSemanticPalette({
      yellow: '#FF9F0A',
      cyan: '#007AFF',
      red: '#FF3B30',
      purple: '#AF52DE',
      green: '#34C759',
      orange: '#FF9500',
    }),
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.6rem',
      bodyScale: '0.95rem',
    },
    shape: {
      radius: '14px',
      borderWidth: '1px',
      shadow: '0 1px 2px rgba(0,0,0,0.04)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'glass',
    },
    _legacyThemeId: 'ios-light',
  },
};

/**
 * Ordered list of preset IDs (for UI iteration / picker rendering).
 * Order is the canonical display order — do not reorder without reason.
 */
export const PRESET_ID_ORDER: StylePresetId[] = [
  'academic-clean',
  'school-cheerful',
  'mission-adventure',
  'dark-elegant',
  'nusantara-nature',
  'modern-interactive',
];

/**
 * Type guard: is the given string a valid StylePresetId?
 */
export function isValidPresetId(id: unknown): id is StylePresetId {
  return (
    typeof id === 'string' &&
    id in STYLE_PRESETS &&
    PRESET_ID_ORDER.includes(id as StylePresetId)
  );
}

/**
 * Get a preset definition by ID. Returns the default preset if the ID
 * is invalid or missing. NEVER throws — used by the resolver for
 * guaranteed-deterministic output.
 */
export function getPreset(id: string | undefined | null): StylePresetDefinition {
  if (id && isValidPresetId(id)) {
    return STYLE_PRESETS[id];
  }
  return STYLE_PRESETS[DEFAULT_PRESET_ID];
}

/**
 * Strict variant of getPreset — throws if the ID is invalid.
 */
export function getPresetOrThrow(id: StylePresetId): StylePresetDefinition {
  if (!isValidPresetId(id)) {
    throw new Error(`Invalid StylePresetId: ${String(id)}`);
  }
  return STYLE_PRESETS[id];
}

/**
 * Get all preset definitions in canonical display order.
 */
export function getAllStylePresets(): StylePresetDefinition[] {
  return PRESET_ID_ORDER.map((id) => STYLE_PRESETS[id]);
}
