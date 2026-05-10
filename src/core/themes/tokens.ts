// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKEN SYSTEM — Single Source of Truth
// ═══════════════════════════════════════════════════════════════════
// Extracted from: pertemuan1-hakikat-norma-v2.html & pertemuan2-macam-norma-v3.html
// These tokens replace ALL hardcoded CSS values across templates.
// Renderer consumes tokens → produces consistent UI.

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
// DEFAULT THEME — Extracted from :root in both HTML preset files
// ═══════════════════════════════════════════════════════════════════

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    bg: '#0e1c2f',
    bg2: '#13243a',
    card: '#182d45',
    border: 'rgba(255,255,255,.09)',
    y: '#f9c12e',
    c: '#3ecfcf',
    r: '#ff6b6b',
    p: '#a78bfa',
    g: '#34d399',
    o: '#fb923c',
    text: '#e8f2ff',
    muted: '#6e90b5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 8,
    md: 11,
    lg: 13,
    xl: 16,
    full: 99,
  },
  shadow: {
    card: '0 2px 8px rgba(0,0,0,.2)',
    elevated: '0 8px 20px rgba(0,0,0,.3)',
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
      normal: 400,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
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
    name: 'Dark Classic',
    tokens: {},
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
        nagama: '#f9c12e',
        nkesusilaan: '#ff6b6b',
        nkesopanan: '#3ecfcf',
        nhukum: '#a78bfa',
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
        bg: '#1e293b',
        bg2: '#263548',
        card: 'rgba(255,255,255,.06)',
        border: 'rgba(255,255,255,.1)',
        y: '#fbbf24',
        c: '#22d3ee',
        r: '#f87171',
        p: '#a78bfa',
        g: '#34d399',
        o: '#fb923c',
        text: '#f1f5f9',
        muted: '#94a3b8',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Light',
    tokens: {
      colors: {
        bg: '#fafafa',
        bg2: '#f5f5f5',
        card: '#ffffff',
        border: 'rgba(0,0,0,.08)',
        y: '#eab308',
        c: '#0891b2',
        r: '#dc2626',
        p: '#7c3aed',
        g: '#16a34a',
        o: '#ea580c',
        text: '#1a1a1a',
        muted: '#737373',
      },
    },
  },
];

/**
 * Merge a theme preset with default tokens.
 * Deep-merges colors, shallow-merges everything else.
 */
export function resolveTokens(presetId?: string): DesignTokens {
  if (!presetId || presetId === 'default') return DEFAULT_TOKENS;

  const preset = THEME_PRESETS.find(p => p.id === presetId);
  if (!preset) return DEFAULT_TOKENS;

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
