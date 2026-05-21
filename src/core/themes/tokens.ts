// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKEN SYSTEM — Single Source of Truth
// ═══════════════════════════════════════════════════════════════════
// Color values are now sourced from primitive-tokens.ts to ensure
// consistency between JS token consumers and CSS variable definitions.
// The DesignTokens interface and resolveTokens function remain unchanged
// to preserve backward compatibility with all consumers.

import { PRIMITIVES } from './primitive-tokens';

export interface DesignTokens {
  colors: {
    bg: string;
    bg2: string;
    card: string;
    border: string;
    y: string;   // Yellow accent (primary)
    c: string;   // Cyan accent (secondary)
    r: string;   // Red accent (danger/wrong)
    p: string;   // Purple accent
    g: string;   // Green accent (success/correct)
    o: string;   // Orange accent
    text: string;
    muted: string;
    // Norma-specific (macam-norma)
    nagama?: string;
    nkesusilaan?: string;
    nkesopanan?: string;
    nhukum?: string;
  };
  spacing: {
    xs: number;   // 4
    sm: number;   // 8
    md: number;   // 12
    lg: number;   // 16
    xl: number;   // 20
    xxl: number;  // 24
  };
  radius: {
    sm: number;   // 8
    md: number;   // 11
    lg: number;   // 13
    xl: number;   // 16
    full: number; // 99 (pill shape)
  };
  shadow: {
    card: string;
    elevated: string;
    glow: (color: string, opacity?: number) => string;
  };
  typography: {
    fontFamily: {
      display: string;
      body: string;
    };
    fontSize: {
      xs: string;   // 0.68rem
      sm: string;   // 0.74rem
      base: string; // 0.82rem
      md: string;   // 0.86rem
      lg: string;   // 0.92rem
      xl: string;   // 1rem
      h3: string;   // 1.2rem
      h2: string;   // 1.6rem
    };
    fontWeight: {
      normal: number;
      semibold: number;
      bold: number;
      extrabold: number;
      black: number;
    };
  };
  animation: {
    fadeMs: number;
    hoverLift: string;
    pressDown: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT THEME — Colors sourced from PRIMITIVES for single source of truth
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    bg: PRIMITIVES.color.canvasBg,
    bg2: PRIMITIVES.color.canvasBg2,
    card: PRIMITIVES.color.canvasCard,
    border: 'rgba(255,255,255,.08)',
    y: PRIMITIVES.color.nagama,
    c: PRIMITIVES.color.cyan,
    r: PRIMITIVES.color.red,
    p: PRIMITIVES.color.purple,
    g: PRIMITIVES.color.green,
    o: PRIMITIVES.color.orange,
    // Dark mode text — matches --semantic-canvas-text in dark mode.
    // The app defaults to dark mode; light presets override these values.
    text: '#e8f2ff',
    muted: '#6e90b5',
  },
  spacing: {
    xs: PRIMITIVES.spacing[1],
    sm: PRIMITIVES.spacing[2],
    md: PRIMITIVES.spacing[3],
    lg: PRIMITIVES.spacing[4],
    xl: PRIMITIVES.spacing[5],
    xxl: PRIMITIVES.spacing[6],
  },
  radius: {
    sm: 8,
    md: 11,
    lg: 13,
    xl: 16,
    full: 99,
  },
  shadow: {
    card: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)',
    elevated: '0 4px 12px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.06)',
    glow: (color: string, opacity = 0.3) =>
      `0 0 20px rgba(${color},${opacity})`,
  },
  typography: {
    fontFamily: {
      display: "var(--font-fredoka), 'Fredoka', cursive",
      body: "var(--font-nunito), 'Nunito', sans-serif",
    },
    fontSize: {
      xs: '0.68rem',
      sm: '0.74rem',
      base: '0.82rem',
      md: '0.86rem',
      lg: '0.92rem',
      xl: '1rem',
      h3: '1.2rem',
      h2: '1.6rem',
    },
    fontWeight: {
      normal: PRIMITIVES.fontWeight.normal,
      semibold: PRIMITIVES.fontWeight.semibold,
      bold: PRIMITIVES.fontWeight.bold,
      extrabold: PRIMITIVES.fontWeight.extrabold,
      black: PRIMITIVES.fontWeight.black,
    },
  },
  animation: {
    fadeMs: 400,
    hoverLift: 'translateY(-2px)',
    pressDown: 'translateY(0)',
  },
};

// ═══════════════════════════════════════════════════════════════════
// THEME PRESETS — Named variations of the design tokens
// ═══════════════════════════════════════════════════════════════════

export interface ThemePreset {
  id: string;
  name: string;
  tokens: Partial<DesignTokens>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default (Dark)',
    tokens: {},
  },
  {
    id: 'ios-light',
    name: '\ud83c\udf4e iOS Light',
    tokens: {
      colors: {
        bg: '#F5F7FB',
        bg2: '#FFFFFF',
        card: '#FFFFFF',
        border: 'rgba(15,23,42,0.06)',
        y: '#FF9F0A',   // iOS systemOrange
        c: '#007AFF',   // iOS systemBlue (PRIMARY accent)
        r: '#FF3B30',   // iOS systemRed
        p: '#AF52DE',   // iOS systemPurple
        g: '#34C759',   // iOS systemGreen
        o: '#FF9500',   // iOS systemOrange
        text: '#1C1C1E', // iOS label
        muted: '#8E8E93', // iOS tertiaryLabel
      },
      spacing: {
        xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
      },
      radius: {
        sm: 10, md: 14, lg: 18, xl: 24, full: 99,
      },
      shadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 8px 24px rgba(15,23,42,0.06)',
        glow: (color: string, opacity = 0.1) =>
          `0 0 20px rgba(${color},${opacity})`,
      },
      typography: {
        fontFamily: {
          display: "var(--font-fredoka), 'Fredoka', cursive",
          body: "var(--font-nunito), 'Nunito', sans-serif",
        },
        fontSize: {
          xs: '0.7rem',
          sm: '0.76rem',
          base: '0.84rem',
          md: '0.9rem',
          lg: '0.96rem',
          xl: '1.06rem',
          h3: '1.3rem',
          h2: '1.7rem',
        },
        fontWeight: {
          normal: 400,
          semibold: 500,
          bold: 600,
          extrabold: 700,
          black: 800,
        },
      },
      animation: {
        fadeMs: 300,
        hoverLift: 'translateY(-1px)',
        pressDown: 'translateY(0)',
      },
    },
  },
  {
    id: 'ios-warm',
    name: '\ud83c\udf24\ufe0f iOS Warm',
    tokens: {
      colors: {
        bg: '#FAF8F5',
        bg2: '#F5F0EB',
        card: '#FFFFFF',
        border: 'rgba(15,23,42,0.06)',
        y: '#FF9F0A',
        c: '#007AFF',
        r: '#FF3B30',
        p: '#AF52DE',
        g: '#34C759',
        o: '#FF6344',
        text: '#2C2420',
        muted: '#9A8E85',
      },
      spacing: {
        xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
      },
      radius: {
        sm: 10, md: 14, lg: 18, xl: 24, full: 99,
      },
      shadow: {
        card: '0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 8px 24px rgba(15,23,42,0.06)',
        glow: (color: string, opacity = 0.1) =>
          `0 0 20px rgba(${color},${opacity})`,
      },
    },
  },
  {
    id: 'hakikat-norma',
    name: 'Hakikat Norma (Yellow Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Yellow-driven, warm accent
      },
    },
  },
  {
    id: 'macam-norma',
    name: 'Macam Norma (Cyan Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Cyan-driven, cool accent — hl color is cyan instead of yellow
        nagama: PRIMITIVES.color.nagama,
        nkesusilaan: PRIMITIVES.color.nkesusilaan,
        nkesopanan: PRIMITIVES.color.nkesopanan,
        nhukum: PRIMITIVES.color.nhukum,
      },
    },
  },
  {
    id: 'nilai-pancasila',
    name: 'Nilai Pancasila (Red Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Red-driven, patriotic accent
      },
    },
  },
  {
    id: 'bhinneka-tunggal-ika',
    name: 'Bhinneka Tunggal Ika (Cyan Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Cyan-driven, diversity accent
      },
    },
  },
  {
    id: 'ham-hak-kewajiban',
    name: 'HAM & Kewajiban (Purple Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Purple-driven, justice accent
      },
    },
  },
  {
    id: 'demokrasi-pancasila',
    name: 'Demokrasi Pancasila (Orange Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Orange-driven, democratic accent
      },
    },
  },
  {
    id: 'globalisasi',
    name: 'Globalisasi (Green Accent)',
    tokens: {
      colors: {
        ...DEFAULT_TOKENS.colors,
        // Green-driven, global accent
      },
    },
  },
  {
    id: 'colorful',
    name: 'Colorful',
    tokens: {
      colors: {
        bg: '#1a1030',
        bg2: '#251845',
        card: '#301f58',
        border: 'rgba(255,255,255,.1)',
        y: '#ffd166',
        c: '#06d6a0',
        r: '#ef476f',
        p: '#9b5de5',
        g: '#06d6a0',
        o: '#ff9f1c',
        text: '#f0e6ff',
        muted: '#9b8ab8',
      },
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    tokens: {
      colors: {
        bg: '#0a0a1a',
        bg2: '#0d0d24',
        card: '#12122e',
        border: 'rgba(139,92,246,.15)',
        y: '#c084fc',
        c: '#22d3ee',
        r: '#f472b6',
        p: '#8b5cf6',
        g: '#34d399',
        o: '#fb923c',
        text: '#e0e7ff',
        muted: '#6366f1',
      },
    },
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    tokens: {
      colors: {
        bg: PRIMITIVES.color.slate800,
        bg2: '#263548',
        card: 'rgba(255,255,255,.06)',
        border: 'rgba(255,255,255,.1)',
        y: PRIMITIVES.color.yellow,
        c: '#22d3ee',
        r: PRIMITIVES.color.error,
        p: PRIMITIVES.color.purple,
        g: PRIMITIVES.color.green,
        o: PRIMITIVES.color.orange,
        text: PRIMITIVES.color.slate100,
        muted: PRIMITIVES.color.slate400,
      },
    },
  },
  {
    id: 'minimal',
    name: '☀️ Light',
    tokens: {
      colors: {
        bg: '#f8fafc',
        bg2: '#f1f5f9',
        card: '#ffffff',
        border: 'rgba(0,0,0,.12)',
        y: '#eab308',
        c: '#0891b2',
        r: '#dc2626',
        p: '#7c3aed',
        g: '#16a34a',
        o: '#ea580c',
        text: '#0f172a',
        muted: '#475569',
        nagama: '#eab308',
        nkesusilaan: '#dc2626',
        nkesopanan: '#0891b2',
        nhukum: '#7c3aed',
      },
      shadow: {
        card: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06)',
        elevated: '0 4px 12px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.06)',
        glow: (color: string, opacity = 0.15) =>
          `0 0 16px rgba(${color},${opacity})`,
      },
    },
  },
  {
    id: 'ocean-light',
    name: '🌊 Ocean Light',
    tokens: {
      colors: {
        bg: '#f0f9ff',
        bg2: '#e0f2fe',
        card: '#ffffff',
        border: 'rgba(0,0,0,.06)',
        y: '#f59e0b',
        c: '#0284c7',
        r: '#e11d48',
        p: '#7c3aed',
        g: '#059669',
        o: '#ea580c',
        text: '#0c4a6e',
        muted: '#64748b',
      },
      shadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        elevated: '0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)',
        glow: (color: string, opacity = 0.12) =>
          `0 0 16px rgba(${color},${opacity})`,
      },
    },
  },
  {
    id: 'warm-light',
    name: '🌸 Warm Light',
    tokens: {
      colors: {
        bg: '#fefce8',
        bg2: '#fef9c3',
        card: '#ffffff',
        border: 'rgba(0,0,0,.06)',
        y: '#ca8a04',
        c: '#0d9488',
        r: '#dc2626',
        p: '#9333ea',
        g: '#15803d',
        o: '#c2410c',
        text: '#1c1917',
        muted: '#78716c',
      },
      shadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        elevated: '0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)',
        glow: (color: string, opacity = 0.12) =>
          `0 0 16px rgba(${color},${opacity})`,
      },
    },
  },
];

export const DEFAULT_THEME_ID = 'ios-light';

/**
 * Merge a theme preset with default tokens.
 * Deep-merges colors, shallow-merges everything else.
 */
export function resolveTokens(presetId?: string): DesignTokens {
  const effectiveId = (!presetId || presetId === 'default') ? DEFAULT_THEME_ID : presetId;

  const preset = THEME_PRESETS.find(p => p.id === effectiveId);
  if (!preset) return DEFAULT_TOKENS; // Fallback to dark tokens if not found

  return {
    ...DEFAULT_TOKENS,
    ...preset.tokens,
    colors: {
      ...DEFAULT_TOKENS.colors,
      ...(preset.tokens.colors || {}),
    },
    spacing: {
      ...DEFAULT_TOKENS.spacing,
      ...(preset.tokens.spacing || {}),
    },
    radius: {
      ...DEFAULT_TOKENS.radius,
      ...(preset.tokens.radius || {}),
    },
    typography: {
      ...DEFAULT_TOKENS.typography,
      fontFamily: {
        ...DEFAULT_TOKENS.typography.fontFamily,
        ...(preset.tokens.typography?.fontFamily || {}),
      },
      fontSize: {
        ...DEFAULT_TOKENS.typography.fontSize,
        ...(preset.tokens.typography?.fontSize || {}),
      },
      fontWeight: {
        ...DEFAULT_TOKENS.typography.fontWeight,
        ...(preset.tokens.typography?.fontWeight || {}),
      },
    },
    animation: {
      ...DEFAULT_TOKENS.animation,
      ...(preset.tokens.animation || {}),
    },
    shadow: {
      ...DEFAULT_TOKENS.shadow,
      ...(preset.tokens.shadow || {}),
    },
  };
}
