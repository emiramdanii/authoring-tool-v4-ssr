// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Preset Registry
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// Six stable preset IDs. Each preset defines its visual DNA inline.
// Sprint 8.1 establishes the IDENTITY and STRUCTURE only — visual
// polishing happens in Sprint 8.2.
//
// Constraints honored:
//   - Fonts use only families already loaded by the app (no new deps).
//     The app loads --font-fredoka (display) and --font-nunito (body)
//     via next/font in src/app/layout.tsx. We also fall back to the
//     'Poppins' stack already used by ThemePreset.
//   - Colors are self-contained — no runtime lookup into THEME_PRESETS.
//     This keeps the resolver pure, deterministic, and SSR-safe.
//   - _legacyThemeId is metadata for the migration period only.
// ═══════════════════════════════════════════════════════════════════

import type { Density, StylePresetId } from './types';
import { DEFAULT_PRESET_ID } from './defaults';

/**
 * Full definition of a style preset. Each preset is a complete visual
 * identity — colors, typography, shape, spacing, navigation.
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
   */
  _legacyThemeId: string;

  /**
   * Legacy template contractId this preset maps to, if any. Optional.
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
 * The six preset definitions. IDs are stable contracts.
 *
 * Color choices are conservative and high-contrast for accessibility.
 * Each preset's accent color is tuned to be readable against its
 * background, with accentContrast providing text-on-accent contrast.
 */
export const STYLE_PRESETS: Record<StylePresetId, StylePresetDefinition> = {
  // ─────────────────────────────────────────────────────────────
  // academic-clean
  // Conservative, scholarly, high-contrast. Maps to the existing
  // 'golden-presentation' theme + 'golden-pertemuan' contract.
  // ─────────────────────────────────────────────────────────────
  'academic-clean': {
    id: 'academic-clean',
    label: 'Akademik Bersih',
    description:
      'Tampilan tenang dan profesional dengan aksen emas. Cocok untuk materi formal dan presentasi akademik.',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      surfaceStrong: '#334155',
      text: '#f8fafc',
      textMuted: '#cbd5e1',
      accent: '#fbbf24',
      accentContrast: '#1a1a1a',
      border: '#475569',
      success: '#34d399',
      error: '#f87171',
    },
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.6rem',
      bodyScale: '0.92rem',
    },
    shape: {
      radius: '16px',
      borderWidth: '1px',
      shadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'colorful',
    },
    _legacyThemeId: 'golden-presentation',
    _legacyContractId: 'golden-pertemuan',
  },

  // ─────────────────────────────────────────────────────────────
  // school-cheerful
  // Bright, friendly, rounded. For elementary/middle-school media.
  // ─────────────────────────────────────────────────────────────
  'school-cheerful': {
    id: 'school-cheerful',
    label: 'Sekolah Ceria',
    description:
      'Warna cerah dan ramah dengan sudut membulat. Cocok untuk SD/SMP dan materi yang menyenangkan.',
    colors: {
      background: '#fffbeb',
      surface: '#ffffff',
      surfaceStrong: '#fef3c7',
      text: '#1f2937',
      textMuted: '#6b7280',
      accent: '#f97316',
      accentContrast: '#ffffff',
      border: '#fcd34d',
      success: '#22c55e',
      error: '#ef4444',
    },
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.7rem',
      bodyScale: '1rem',
    },
    shape: {
      radius: '20px',
      borderWidth: '2px',
      shadow: '0 4px 12px rgba(251, 191, 36, 0.25)',
    },
    spacing: {
      density: 'comfortable',
    },
    navigation: {
      style: 'colorful',
    },
    _legacyThemeId: 'ceria',
  },

  // ─────────────────────────────────────────────────────────────
  // mission-adventure
  // Earthy, expedition-style. For thematic / scenario-based learning.
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
    _legacyThemeId: 'petualangan',
  },

  // ─────────────────────────────────────────────────────────────
  // dark-elegant
  // Sophisticated dark with neon accents. For senior high / premium feel.
  // ─────────────────────────────────────────────────────────────
  'dark-elegant': {
    id: 'dark-elegant',
    label: 'Gelap Elegan',
    description:
      'Latar gelap dengan aksen neon terang. Cocok untuk SMA dan presentasi yang berkarakter.',
    colors: {
      background: '#020617',
      surface: '#0f172a',
      surfaceStrong: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      accent: '#22d3ee',
      accentContrast: '#020617',
      border: '#334155',
      success: '#34d399',
      error: '#fb7185',
    },
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
  // ─────────────────────────────────────────────────────────────
  'nusantara-nature': {
    id: 'nusantara-nature',
    label: 'Nusantara Alam',
    description:
      'Nuansa alam dan tanah Nusantara dengan aksen terra-cotta. Cocok untuk materi budaya dan IPA.',
    colors: {
      background: '#fef7ed',
      surface: '#fffbeb',
      surfaceStrong: '#fef3c7',
      text: '#451a03',
      textMuted: '#92400e',
      accent: '#c2410c',
      accentContrast: '#fff7ed',
      border: '#fed7aa',
      success: '#65a30d',
      error: '#dc2626',
    },
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
  // ─────────────────────────────────────────────────────────────
  'modern-interactive': {
    id: 'modern-interactive',
    label: 'Modern Interaktif',
    description:
      'Tema terang minimalis dengan aksen biru. Cocok untuk media interaktif dan kuis berbasis game.',
    colors: {
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceStrong: '#f1f5f9',
      text: '#0f172a',
      textMuted: '#64748b',
      accent: '#3b82f6',
      accentContrast: '#ffffff',
      border: '#e2e8f0',
      success: '#22c55e',
      error: '#ef4444',
    },
    typography: {
      headingFamily: FONT_DISPLAY,
      bodyFamily: FONT_BODY,
      headingScale: '1.6rem',
      bodyScale: '0.95rem',
    },
    shape: {
      radius: '14px',
      borderWidth: '1px',
      shadow: '0 1px 3px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
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
 * Strict variant of getPreset — throws if the ID is invalid. Used in
 * tests and internal code paths where the caller has already validated.
 */
export function getPresetOrThrow(id: StylePresetId): StylePresetDefinition {
  if (!isValidPresetId(id)) {
    throw new Error(`Invalid StylePresetId: ${String(id)}`);
  }
  return STYLE_PRESETS[id];
}

/**
 * Get all preset definitions in canonical display order. Used by
 * future picker UI (Sprint 8.2).
 */
export function getAllStylePresets(): StylePresetDefinition[] {
  return PRESET_ID_ORDER.map((id) => STYLE_PRESETS[id]);
}
