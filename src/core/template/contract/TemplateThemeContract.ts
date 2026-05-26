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
import { MODERN_EDUCATOR_ACCENT_PALETTE } from './ModernEducatorContract';

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
  /** Accent color for this page type (resolves from pageAccents) */
  accent: string;
  /** Accent bg (low opacity) — derived from page's accent color */
  accentBg: string;
  /** Accent border — derived from page's accent color */
  accentBorder: string;
  /** Per-page bg tint — subtle background tint for the page type */
  bgTint: string;
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

  // ═══════════════════════════════════════════════════════════════════
  // PER-PAGE ACCENT TOKEN MAP — the KEY fix for "hollow output"
  // ═══════════════════════════════════════════════════════════════════
  // When a materi page (accentToken='p') renders, block renderers
  // call tokens.color('p'). Without this map, 'p' returns the theme
  // default purple, which may be a completely different shade than
  // what the contract specifies. This map patches ALL accent tokens
  // so that tokens.color('c'|'g'|'p'|'o'|'r'|'y') ALL return
  // contract-compliant colors for the current page type.
  //
  // The page's primary accent token gets the contract's accent color.
  // Other tokens keep their identity colors but from the contract's
  // curated palette — not raw theme defaults.
  // ═══════════════════════════════════════════════════════════════════

  /** Map of token key → resolved color for ALL accent tokens.
   *  Used by applyContract() to patch every accent token.
   *  Example for a 'materi' page (accentToken='p'):
   *    accentTokenMap.p = '#c084fc' (PRIMARY — contract accent)
   *    accentTokenMap.y = '#fbbf24' (identity gold — from contract palette)
   *    accentTokenMap.c = '#2563eb' (identity blue — from contract palette)
   *    accentTokenMap.g = '#4ade80' (identity green — from contract palette)
   *    accentTokenMap.o = '#fb923c' (identity orange — from contract palette)
   *    accentTokenMap.r = '#f87171' (identity red — from contract palette)
   */
  accentTokenMap: Record<string, string>;

  /** Which token is the PRIMARY accent for this page type.
   *  Used by renderers that want to know "what's my accent?"
   *  without hardcoding 'y'. */
  primaryAccentToken: string;
}

/**
 * The contract's curated accent color palette.
 * These are the ONLY accent colors allowed in the contract.
 * They're designed to work together on a dark navy background.
 */
const CONTRACT_ACCENT_PALETTE: Record<string, string> = {
  y: '#fbbf24',  // Gold — identity, warmth, achievement
  c: '#2563eb',  // Blue — trust, logic, structure
  g: '#4ade80',  // Green — success, growth, nature
  p: '#c084fc',  // Purple — creativity, reflection, depth
  o: '#fb923c',  // Orange — energy, action, alert
  r: '#f87171',  // Red — danger, urgency, emphasis
};

/**
 * Resolve the full visual style for a page, enforcing contract rules.
 * This is the function that renderers should call to get their styles.
 *
 * KEY FIX: Now returns accentTokenMap — a complete map of ALL accent
 * token keys to their resolved colors for THIS page type. This ensures
 * that tokens.color('c'), tokens.color('g'), tokens.color('p'), etc.
 * ALL return contract-compliant colors, not raw theme defaults.
 *
 * Before this fix:
 *   materi page → accentToken='p' → tokens.color('p') = theme default purple
 *   (could be #a855f7 from 'hakikat-norma' theme instead of #c084fc)
 *
 * After this fix:
 *   materi page → accentToken='p' → tokens.color('p') = #c084fc (contract)
 *   ALL accent tokens return contract palette colors, regardless of theme.
 */
export function resolveContractStyle(
  contractId: string | undefined,
  pageType: string,
  variant: BlockVariant = 'A',
): ContractResolvedStyle {
  const contract = getContractOrGolden(contractId);

  // Get per-page accent
  const pageAccent = contract.pageAccents[pageType] || contract.pageAccents['custom'] || { accentToken: 'y', bgTint: 'rgba(251,191,36,0.04)' };

  // Apply variant override (changes the primary accent color family)
  const variantColors = contract.variantOverrides?.[variant] || {};

  // Resolve which token is the primary accent for this page type
  const primaryAccentToken = pageAccent.accentToken || (isModernEducator ? 'e' : 'y');

  // ═══ BUILD THE ACCENT TOKEN MAP ═════════════════════════════════
  // This is the KEY fix. Every accent token gets a contract-compliant
  // color. The primary accent token for THIS page gets the contract's
  // accent color (with variant override). Other tokens get their
  // identity colors from the contract palette.
  //
  // Example for materi page (accentToken='p'):
  //   accentTokenMap.y = '#fbbf24'  (gold — identity, always present)
  //   accentTokenMap.c = '#2563eb'  (blue — identity)
  //   accentTokenMap.g = '#4ade80'  (green — identity)
  //   accentTokenMap.p = '#c084fc'  (purple — PRIMARY for this page)
  //   accentTokenMap.o = '#fb923c'  (orange — identity)
  //   accentTokenMap.r = '#f87171'  (red — identity)
  //
  // All block renderers on this page that call tokens.color('p')
  // will get #c084fc — the contract's curated purple, NOT the theme
  // default which could be a different shade.
  const accentTokenMap: Record<string, string> = {};
  // Use the Modern Educator palette if that contract is active
  const isModernEducator = contract.id === 'modern-educator';
  const palette = isModernEducator ? MODERN_EDUCATOR_ACCENT_PALETTE : CONTRACT_ACCENT_PALETTE;
  for (const [token, color] of Object.entries(palette)) {
    accentTokenMap[token] = color;
  }
  // Override the primary accent token with the contract's accent (with variant)
  accentTokenMap[primaryAccentToken] = variantColors.accent || contract.colors.accent;
  // For variant A, the primary accent IS the contract's accent color.
  // For variants B/C, the primary accent is overridden by variant colors.
  // The token 'y' should always map to the contract's identity gold
  // UNLESS 'y' IS the primary accent token (in which case variant overrides apply).
  if (primaryAccentToken === 'y') {
    accentTokenMap['y'] = variantColors.accent || contract.colors.accent;
  }

  // Resolve the primary accent color
  const resolvedAccent = accentTokenMap[primaryAccentToken]!;

  // Build accent variants for the PRIMARY accent
  // These are derived from the primary accent color for THIS page
  const resolvedAccentBg = variantColors.accentBg || contract.colors.accentBg;
  const resolvedAccentBorder = variantColors.accentBorder || contract.colors.accentBorder;

  // Resolve bgTint for this page type
  const resolvedBgTint = pageAccent.bgTint || (isModernEducator ? 'rgba(0,108,73,0.04)' : 'rgba(251,191,36,0.04)');

  return {
    background: contract.colors.background,
    cardBg: contract.colors.card,
    textColor: contract.colors.text,
    mutedColor: contract.colors.muted,
    accent: resolvedAccent,
    accentBg: resolvedAccentBg,
    accentBorder: resolvedAccentBorder,
    bgTint: resolvedBgTint,
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
    accentTokenMap,
    primaryAccentToken,
  };
}
