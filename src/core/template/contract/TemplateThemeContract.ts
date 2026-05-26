// ═══════════════════════════════════════════════════════════════════
// TEMPLATE THEME CONTRACT — Visual DNA for Full Pertemuan Templates
// ═══════════════════════════════════════════════════════════════════
// A TemplateThemeContract is the SINGLE visual authority for all pages
// within a full pertemuan template. It enforces consistency across:
//   - Colors (background, surface, text, accents)
//   - Typography scale (title, heading, body, caption)
//   - Spacing (page padding, card padding, block gaps)
//   - Border radius & border style
//   - Max content height (overflow guard)
//   - Card treatment (elevated/flat/subtle)
//
// Priority chain:
//   TemplateThemeContract > Scene Style > Block Default
//
// When a block renderer asks for a style, the contract OVERRIDES
// any scene-level or block-level default. This ensures all pages
// in a full pertemuan look like they belong to the SAME template.
// ═══════════════════════════════════════════════════════════════════

import type { BlockVariant } from '@/core/schema/types/base';

// ── Contract Types ──────────────────────────────────────────────

export interface TemplateThemeContract {
  /** Unique contract ID — links to CourseTemplate.theme */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the visual identity */
  description: string;

  /** Color palette — ALL pages must use these */
  colors: TemplateColorContract;

  /** Typography scale — fixed sizes per role */
  typography: TemplateTypographyContract;

  /** Spacing rules — fixed padding/gaps per role */
  spacing: TemplateSpacingContract;

  /** Border/radius rules */
  borders: TemplateBorderContract;

  /** Shadow rules */
  shadows: TemplateShadowContract;

  /** Max content height before overflow (px) */
  maxContentHeight: number;

  /** Card treatment for ALL blocks */
  cardTreatment: 'elevated' | 'flat' | 'subtle';

  /** Header treatment for ALL section headers */
  headerTreatment: 'accented' | 'outlined' | 'minimal';

  /** Per-page-type accent color overrides.
   *  Each page type may use a DIFFERENT accent, but
   *  all other properties remain the same. */
  pageAccents: Record<string, PageAccentContract>;

  /** Layout grammar per page type */
  pageLayouts: Record<string, PageLayoutContract>;

  /** Variant-specific overrides (A/B/C) */
  variantOverrides?: Record<BlockVariant, Partial<TemplateColorContract>>;
}

export interface TemplateColorContract {
  /** Page background */
  background: string;
  /** Secondary background / surface */
  surface: string;
  /** Card background */
  card: string;
  /** Primary text */
  text: string;
  /** Secondary/muted text */
  muted: string;
  /** Primary accent (main identity color) */
  accent: string;
  /** Accent with opacity for backgrounds */
  accentBg: string;
  /** Accent with opacity for borders */
  accentBorder: string;
  /** Maximum number of distinct accent colors allowed */
  maxAccents: number;
  /** Allowed accent color tokens (e.g., 'y', 'c', 'g', 'p') */
  accentTokens: string[];
}

export interface TemplateTypographyContract {
  /** Cover/hero title size (px) */
  heroSize: number;
  /** Page title size (px) */
  titleSize: number;
  /** Section heading size (px) */
  headingSize: number;
  /** Large body text (definitions, key concepts) (px) */
  bodyLgSize: number;
  /** Standard body text (px) */
  bodySize: number;
  /** Caption/label text (px) — minimum 16px for readability */
  captionSize: number;
  /** Micro/badge text (px) — minimum 14px */
  microSize: number;
  /** Font family for display (headings) */
  displayFont: string;
  /** Font family for body */
  bodyFont: string;
  /** Minimum font size allowed — blocks with smaller text are flagged */
  minFontSize: number;
}

export interface TemplateSpacingContract {
  /** Page padding (px) — safe area from edge */
  pagePadding: number;
  /** Card/section padding (px) */
  cardPadding: number;
  /** Gap between blocks (px) */
  blockGap: number;
  /** Gap between items inside a block (px) */
  itemGap: number;
  /** Nested content padding (px) */
  nestedPadding: number;
}

export interface TemplateBorderContract {
  /** Border radius (px) for cards */
  cardRadius: number;
  /** Border radius (px) for badges/pills */
  pillRadius: number;
  /** Card border style */
  cardBorder: string;
}

export interface TemplateShadowContract {
  /** Card shadow */
  card: string;
  /** Elevated/active card shadow */
  elevated: string;
}

export interface PageAccentContract {
  /** Which color token to use as accent for this page type */
  accentToken: string;
  /** Optional bg tint for this page type (subtle) */
  bgTint?: string;
}

export interface PageLayoutContract {
  /** Maximum number of blocks allowed on this page type */
  maxBlocks: number;
  /** Content density */
  density: 'sparse' | 'comfortable' | 'dense';
  /** Whether this page type can split across scenes */
  canSplit: boolean;
  /** Block types allowed on this page type */
  allowedBlockTypes: string[];
  /** Layout pattern description */
  pattern: string;
}

// ═══════════════════════════════════════════════════════════════════
// GOLDEN CONTRACT — Full Pertemuan PPKn (Hakikat Norma)
// ═══════════════════════════════════════════════════════════════════
// This is the ONE contract that all pages in a full pertemuan must
// follow. It's based on the "golden-presentation" theme but enforces
// strict visual consistency across all page types.
//
// Design philosophy:
//   - ONE color family (dark navy + gold accent = identity)
//   - Different accents per page type (scene-aware, NOT random)
//   - SAME typography scale, spacing, radius, shadow everywhere
//   - SAME max content height — overflow must be handled, not ignored
// ═══════════════════════════════════════════════════════════════════

export const GOLDEN_PERTEMUAN_CONTRACT: TemplateThemeContract = {
  id: 'golden-pertemuan',
  name: '✨ Golden Pertemuan',
  description: 'Dark navy + gold accent — the SILSE v2.1 identity contract. All pages in a full pertemuan must follow this.',

  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    card: 'rgba(255,255,255,0.06)',
    text: '#ffffff',
    muted: '#94a3b8',
    accent: '#fbbf24',
    accentBg: 'rgba(251,191,36,0.12)',
    accentBorder: 'rgba(251,191,36,0.25)',
    maxAccents: 4,
    accentTokens: ['y', 'c', 'g', 'p'],
  },

  typography: {
    heroSize: 48,
    titleSize: 34,
    headingSize: 24,
    bodyLgSize: 20,
    bodySize: 18,
    captionSize: 16,
    microSize: 14,
    displayFont: "'Poppins', var(--font-fredoka), 'Fredoka', cursive",
    bodyFont: "'Open Sans', var(--font-nunito), 'Nunito', sans-serif",
    minFontSize: 14,
  },

  spacing: {
    pagePadding: 20,
    cardPadding: 20,
    blockGap: 24,
    itemGap: 12,
    nestedPadding: 14,
  },

  borders: {
    cardRadius: 16,
    pillRadius: 20,
    cardBorder: '1px solid rgba(255,255,255,0.08)',
  },

  shadows: {
    card: '0 4px 6px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.12)',
    elevated: '0 10px 25px rgba(0,0,0,0.3), 0 6px 10px rgba(0,0,0,0.15)',
  },

  maxContentHeight: 620,
  cardTreatment: 'elevated',
  headerTreatment: 'accented',

  // Per-page accent colors — each page type gets its own accent
  // but everything else stays the SAME
  pageAccents: {
    cover:       { accentToken: 'y', bgTint: 'rgba(251,191,36,0.04)' },
    petunjuk:    { accentToken: 'c', bgTint: 'rgba(37,99,235,0.04)' },
    tujuan:      { accentToken: 'c', bgTint: 'rgba(37,99,235,0.04)' },
    motivasi:    { accentToken: 'y', bgTint: 'rgba(251,191,36,0.04)' },
    materi:      { accentToken: 'p', bgTint: 'rgba(192,132,252,0.04)' },
    skenario:    { accentToken: 'o', bgTint: 'rgba(251,146,60,0.04)' },
    kuis:        { accentToken: 'g', bgTint: 'rgba(74,222,128,0.04)' },
    diskusi:     { accentToken: 'c', bgTint: 'rgba(37,99,235,0.04)' },
    refleksi:    { accentToken: 'p', bgTint: 'rgba(192,132,252,0.04)' },
    rangkuman:   { accentToken: 'y', bgTint: 'rgba(251,191,36,0.04)' },
    hasil:       { accentToken: 'g', bgTint: 'rgba(74,222,128,0.04)' },
    penutup:     { accentToken: 'y', bgTint: 'rgba(251,191,36,0.04)' },
    dokumen:     { accentToken: 'c', bgTint: 'rgba(37,99,235,0.04)' },
    custom:      { accentToken: 'y', bgTint: 'rgba(251,191,36,0.04)' },
  },

  // Per-page layout grammar — defines what's allowed
  pageLayouts: {
    cover: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['cover'],
      pattern: 'Judul besar + Subjudul + Identitas + Tombol mulai',
    },
    petunjuk: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['petunjuk'],
      pattern: 'Judul + 3 langkah instruksi',
    },
    tujuan: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['tujuan-display', 'tp'],
      pattern: 'Judul + 3-4 tujuan dalam kartu',
    },
    motivasi: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['motivasi'],
      pattern: 'Pertanyaan pemantik + Koneksi konsep',
    },
    materi: {
      maxBlocks: 3,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['materi-section', 'def-box', 'nc-grid'],
      pattern: 'Judul + Konsep inti + Contoh',
    },
    skenario: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['skenario'],
      pattern: 'Instruksi + Langkah 1-3 + Aksi siswa',
    },
    kuis: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['kuis'],
      pattern: '1 pertanyaan per layar + 4 opsi + feedback',
    },
    diskusi: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['diskusi'],
      pattern: 'Pertanyaan diskusi + Petunjuk',
    },
    refleksi: {
      maxBlocks: 2,
      density: 'sparse',
      canSplit: true,
      allowedBlockTypes: ['refleksi'],
      pattern: 'Pertanyaan besar + Isian singkat + Penutup emosional',
    },
    rangkuman: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['rangkuman'],
      pattern: 'Ringkasan konsep + Penutup',
    },
    hasil: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['hasil'],
      pattern: 'Skor + Capaian',
    },
    penutup: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['penutup'],
      pattern: 'Ringkasan + Pesan akhir + Lanjutkan',
    },
    dokumen: {
      maxBlocks: 3,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['tp', 'alur'],
      pattern: 'Tujuan + Alur kegiatan',
    },
    custom: {
      maxBlocks: 5,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: [],
      pattern: 'Bebas — tapi tetap taat aturan contract',
    },
  },

  // Variant overrides — different accent combinations
  variantOverrides: {
    A: {}, // Default — gold accent
    B: {
      accent: '#38bdf8',
      accentBg: 'rgba(56,189,248,0.12)',
      accentBorder: 'rgba(56,189,248,0.25)',
    },
    C: {
      accent: '#c084fc',
      accentBg: 'rgba(192,132,252,0.12)',
      accentBorder: 'rgba(192,132,252,0.25)',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// CONTRACT REGISTRY — Map themeId → TemplateThemeContract
// ═══════════════════════════════════════════════════════════════════

const CONTRACT_REGISTRY = new Map<string, TemplateThemeContract>();

export function registerContract(contract: TemplateThemeContract): void {
  CONTRACT_REGISTRY.set(contract.id, contract);
}

export function getContract(contractId: string): TemplateThemeContract | undefined {
  return CONTRACT_REGISTRY.get(contractId);
}

export function getContractOrGolden(contractId?: string): TemplateThemeContract {
  return CONTRACT_REGISTRY.get(contractId || '') || GOLDEN_PERTEMUAN_CONTRACT;
}

// Auto-register the golden contract
registerContract(GOLDEN_PERTEMUAN_CONTRACT);

// ═══════════════════════════════════════════════════════════════════
// CONTRACT ENFORCEMENT — Resolve style with contract priority
// ═══════════════════════════════════════════════════════════════════
// Priority: TemplateThemeContract > Scene Style > Block Default
//
// When a renderer asks for a style, the contract gets FINAL say.
// Scene types can modify intensity/whitespace, but NOT override
// the contract's color family, typography scale, or spacing rules.

export interface ContractResolvedStyle {
  /** Background color */
  background: string;
  /** Surface/card background */
  cardBg: string;
  /** Primary text color */
  textColor: string;
  /** Muted text color */
  mutedColor: string;
  /** Accent color for this page type */
  accent: string;
  /** Accent bg (low opacity) */
  accentBg: string;
  /** Accent border */
  accentBorder: string;
  /** Page padding */
  pagePadding: number;
  /** Card padding */
  cardPadding: number;
  /** Block gap */
  blockGap: number;
  /** Card radius */
  cardRadius: number;
  /** Card shadow */
  cardShadow: string;
  /** Typography scale */
  typo: {
    hero: number;
    title: number;
    heading: number;
    bodyLg: number;
    body: number;
    caption: number;
    micro: number;
  };
  /** Max content height */
  maxContentHeight: number;
}

/**
 * Resolve the full visual style for a page, enforcing contract rules.
 * This is the function that renderers should call to get their styles.
 */
export function resolveContractStyle(
  contractId: string | undefined,
  pageType: string,
  variant: BlockVariant = 'A',
): ContractResolvedStyle {
  const contract = getContractOrGolden(contractId);

  // Get per-page accent
  const pageAccent = contract.pageAccents[pageType] || contract.pageAccents['custom'] || { accentToken: 'y' };

  // Apply variant override
  const variantColors = contract.variantOverrides?.[variant] || {};

  // Resolve accent from contract's accentTokens
  const accentToken = pageAccent.accentToken;
  // Map token key to actual color from contract colors
  const tokenColorMap: Record<string, string> = {
    y: variantColors.accent || contract.colors.accent,
    c: '#2563eb',
    g: '#4ade80',
    p: '#c084fc',
    o: '#fb923c',
    r: '#f87171',
  };

  const resolvedAccent = tokenColorMap[accentToken] || contract.colors.accent;

  // Build accent variants from the resolved accent
  const resolvedAccentBg = variantColors.accentBg || contract.colors.accentBg;
  const resolvedAccentBorder = variantColors.accentBorder || contract.colors.accentBorder;

  return {
    background: contract.colors.background,
    cardBg: contract.colors.card,
    textColor: contract.colors.text,
    mutedColor: contract.colors.muted,
    accent: resolvedAccent,
    accentBg: resolvedAccentBg,
    accentBorder: resolvedAccentBorder,
    pagePadding: contract.spacing.pagePadding,
    cardPadding: contract.spacing.cardPadding,
    blockGap: contract.spacing.blockGap,
    cardRadius: contract.borders.cardRadius,
    cardShadow: contract.shadows.card,
    maxContentHeight: contract.maxContentHeight,
    typo: {
      hero: contract.typography.heroSize,
      title: contract.typography.titleSize,
      heading: contract.typography.headingSize,
      bodyLg: contract.typography.bodyLgSize,
      body: contract.typography.bodySize,
      caption: contract.typography.captionSize,
      micro: contract.typography.microSize,
    },
  };
}
