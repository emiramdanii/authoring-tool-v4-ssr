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
// BATCH-10C-Patch-1: Removed direct import of MODERN_EDUCATOR_CONTRACT to
// break circular dependency:
//   TemplateThemeContract.ts → ModernEducatorContract.ts → TemplateThemeContract.ts
// Instead, getContractOrGolden() now does a lazy registry lookup by ID.

// Modern Educator accent palette — defined here to avoid circular imports
// with ModernEducatorContract
export const MODERN_EDUCATOR_ACCENT_PALETTE: Record<string, string> = {
  e: '#006c49',  // Emerald — primary identity, trust, growth
  b: '#0058be',  // Royal Blue — logic, structure, assessment
  a: '#e29100',  // Amber — energy, warmth, motivation
  y: '#e29100',  // Amber (maps to 'a')
  c: '#0058be',  // Blue (maps to 'b')
  g: '#10b981',  // Light emerald (success green)
  p: '#7c3aed',  // Purple (compatibility)
  o: '#ea580c',  // Orange (compatibility)
  r: '#dc2626',  // Red (error/danger)
};

/**
 * BATCH-11D: SILSE_STUDIO_ACCENT_PALETTE — Warm Sunset
 * Used by silse-studio contract. Visually distinct from silse-fresh (teal).
 *   o = deep orange (primary identity — energy, action)
 *   a = amber (secondary — warmth, motivation)
 *   r = rose (tertiary — emphasis, reflection)
 * Plus compatibility tokens mapped to the warm palette so any block
 * that asks for y/c/g/p still gets a warm-family color.
 */
export const SILSE_STUDIO_ACCENT_PALETTE: Record<string, string> = {
  o: '#ea580c',  // Deep Orange — primary identity
  a: '#f59e0b',  // Amber — secondary
  r: '#e11d48',  // Rose — tertiary
  y: '#f59e0b',  // Amber (maps to 'a' for compat)
  c: '#ea580c',  // Orange (maps to 'o' for compat)
  g: '#f59e0b',  // Amber (maps to 'a' for compat — warm palette only)
  p: '#e11d48',  // Rose (maps to 'r' for compat)
  e: '#ea580c',  // Orange (maps to 'o' for compat — replaces emerald)
  b: '#f59e0b',  // Amber (maps to 'a' for compat — replaces blue)
  t: '#ea580c',  // Orange (maps to 'o' for compat — replaces teal)
};

// ── Contract Registry — Module-level Map, deferred registration ──
// We use a deferred registration pattern: contracts call registerContract(),
// but the actual Map is created synchronously at module load time.
const CONTRACT_REGISTRY = new Map<string, TemplateThemeContract>();
const PENDING_REGISTRATIONS: TemplateThemeContract[] = [];

export function registerContract(contract: TemplateThemeContract): void {
  // If registry is available, register immediately
  CONTRACT_REGISTRY.set(contract.id, contract);
}

export function getContract(contractId: string): TemplateThemeContract | undefined {
  return CONTRACT_REGISTRY.get(contractId);
}

export function getContractOrGolden(contractId?: string): TemplateThemeContract {
  // BATCH-10C-Patch-1: Lazy lookup to avoid circular import.
  // ModernEducatorContract.ts registers itself via registerContract() at
  // module load time. By the time getContractOrGolden() is CALLED (not
  // when the module is loaded), the registry is fully populated.
  // Previously this used a direct import of MODERN_EDUCATOR_CONTRACT,
  // creating a circular dependency.
  const found = CONTRACT_REGISTRY.get(contractId || '');
  if (found) return found;
  // Default fallback: modern-educator (light theme) — NOT golden-pertemuan
  const modernEdu = CONTRACT_REGISTRY.get('modern-educator');
  if (modernEdu) return modernEdu;
  // Last resort: golden-pertemuan (should always be registered first)
  return GOLDEN_PERTEMUAN_CONTRACT;
}

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
    maxAccents: 3,             // STANDAR: Max 3 active colors per page (1 main + 1 accent + 1 feedback) — was 4
    accentTokens: ['y', 'c', 'g', 'p'],
  },

  typography: {
    heroSize: 48,          // STANDAR: Cover title minimum 48px
    titleSize: 36,          // STANDAR: Page title minimum 36px
    headingSize: 26,        // STANDAR: Card title minimum 26px
    bodyLgSize: 22,         // STANDAR: Body large 22px
    bodySize: 20,           // STANDAR: Body minimum 20px — was 18, upgraded
    captionSize: 16,        // STANDAR: Caption minimum 16px
    microSize: 14,          // STANDAR: Micro/badge minimum 14px
    displayFont: "'Poppins', var(--font-fredoka), 'Fredoka', cursive",
    bodyFont: "'Open Sans', var(--font-nunito), 'Nunito', sans-serif",
    minFontSize: 16,        // STANDAR: Absolute minimum — anything below is flagged as error
  },

  spacing: {
    pagePadding: 24,           // STANDAR: increased for better whitespace ratio (0.30+)
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
// MACAM NORMA CONTRACT — Full Pertemuan PPKn (Macam-Macam Norma)
// ═══════════════════════════════════════════════════════════════════
// Visual DNA dari HTML referensi pertemuan2-macam-norma-v3:
//   - Deep navy background (#0e1c2f) — lebih gelap dari golden
//   - Solid dark cards (#182d45) — BUKAN glassmorphism
//   - Teal/cyan secondary accent (#3ecfcf) — IDENTITAS Macam Norma
//   - Fredoka One + Nunito fonts — sesuai HTML asli
//   - 4 norma warna: agama=emas, kesusilaan=merah, kesopanan=teal, hukum=ungu
//
// PERBEDAAN KUNCI vs golden-pertemuan:
//   - c: teal (#3ecfcf) bukan blue (#2563eb)
//   - Card: solid (#182d45) bukan glassmorphism
//   - Background: lebih gelap (#0e1c2f vs #0f172a)
//   - Font: Fredoka/Nunito bukan Poppins/Open Sans
// ═══════════════════════════════════════════════════════════════════

export const MACAM_NORMA_CONTRACT: TemplateThemeContract = {
  id: 'macam-norma',
  name: '📜 Macam Norma (Teal-Golden)',
  description: 'Deep navy + teal accent — Macam-Macam Norma identity. Teal (#3ecfcf) replaces blue, solid dark cards, Fredoka/Nunito fonts.',

  colors: {
    background: '#0e1c2f',       // Deep navy — sesuai HTML v3
    surface: '#13243a',           // Secondary — sesuai HTML v3
    card: '#182d45',              // Solid dark — sesuai HTML v3, BUKAN glassmorphism
    text: '#e8f2ff',              // Light blue-white — sesuai HTML v3
    muted: '#6e90b5',             // Blue-muted — sesuai HTML v3
    accent: '#f9c12e',            // Warm gold — sesuai HTML v3
    accentBg: 'rgba(249,193,46,0.12)',
    accentBorder: 'rgba(249,193,46,0.25)',
    maxAccents: 4,                // 4 norma = 4 accent colors
    accentTokens: ['y', 'c', 'g', 'p', 'r'],
  },

  typography: {
    heroSize: 48,
    titleSize: 36,
    headingSize: 26,
    bodyLgSize: 22,
    bodySize: 20,
    captionSize: 16,
    microSize: 14,
    // Fredoka One + Nunito — SUDAH DI-LOAD via next/font/google
    displayFont: "var(--font-fredoka), 'Fredoka', cursive",
    bodyFont: "var(--font-nunito), 'Nunito', sans-serif",
    minFontSize: 16,
  },

  spacing: {
    pagePadding: 24,
    cardPadding: 20,
    blockGap: 24,
    itemGap: 12,
    nestedPadding: 14,
  },

  borders: {
    cardRadius: 16,
    pillRadius: 99,  // sesuai HTML v3: border-radius: 99px untuk pill
    cardBorder: '1px solid rgba(255,255,255,0.09)',
  },

  shadows: {
    card: '0 4px 6px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.12)',
    elevated: '0 8px 20px rgba(0,0,0,0.3)',  // sesuai HTML v3: 0 8px 20px
  },

  maxContentHeight: 620,
  cardTreatment: 'elevated',
  headerTreatment: 'accented',

  // Per-page accent colors — Macam Norma uses teal for discussion/kesopanan
  pageAccents: {
    cover:       { accentToken: 'y', bgTint: 'rgba(249,193,46,0.04)' },
    petunjuk:    { accentToken: 'c', bgTint: 'rgba(62,207,207,0.04)' },  // teal
    tujuan:      { accentToken: 'c', bgTint: 'rgba(62,207,207,0.04)' },  // teal
    motivasi:    { accentToken: 'y', bgTint: 'rgba(249,193,46,0.04)' },
    materi:      { accentToken: 'p', bgTint: 'rgba(167,139,250,0.04)' },
    skenario:    { accentToken: 'o', bgTint: 'rgba(251,146,60,0.04)' },
    kuis:        { accentToken: 'g', bgTint: 'rgba(52,211,153,0.04)' },
    diskusi:     { accentToken: 'c', bgTint: 'rgba(62,207,207,0.04)' },  // teal
    refleksi:    { accentToken: 'p', bgTint: 'rgba(167,139,250,0.04)' },
    rangkuman:   { accentToken: 'y', bgTint: 'rgba(249,193,46,0.04)' },
    hasil:       { accentToken: 'g', bgTint: 'rgba(52,211,153,0.04)' },
    penutup:     { accentToken: 'y', bgTint: 'rgba(249,193,46,0.04)' },
    dokumen:     { accentToken: 'c', bgTint: 'rgba(62,207,207,0.04)' },  // teal
    custom:      { accentToken: 'y', bgTint: 'rgba(249,193,46,0.04)' },
  },

  pageLayouts: {
    cover: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['cover'],
      pattern: 'Judul besar + Subjudul + Badges norma + Tombol mulai',
    },
    petunjuk: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['petunjuk'],
      pattern: 'Judul + 4 langkah instruksi + Tips',
    },
    tujuan: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['tujuan-display', 'tp'],
      pattern: 'Judul + 2-5 tujuan dalam kartu + Profil PPP',
    },
    motivasi: {
      maxBlocks: 2,
      density: 'comfortable',
      canSplit: true,
      allowedBlockTypes: ['motivasi'],
      pattern: 'Pertanyaan pemantik + Koneksi konsep',
    },
    materi: {
      maxBlocks: 2,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['nk-card', 'materi-section', 'def-box', 'nc-grid', 'tabel-accord', 'diskusi'],
      pattern: 'Kartu norma / Tabel accordion + Diskusi',
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
      allowedBlockTypes: ['diskusi', 'nc-grid'],
      pattern: 'Pertanyaan diskusi + Kelompok + Petunjuk',
    },
    game: {
      maxBlocks: 2,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['sortir-game', 'roda-game', 'diskusi'],
      pattern: 'Game interaktif + Diskusi pasca-game',
    },
    refleksi: {
      maxBlocks: 2,
      density: 'sparse',
      canSplit: true,
      allowedBlockTypes: ['refleksi', 'flashcard-set'],
      pattern: 'Pertanyaan refleksi + Kartu kilat + Penugasan',
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
      pattern: 'Skor + Capaian + Portofolio',
    },
    penutup: {
      maxBlocks: 1,
      density: 'sparse',
      canSplit: false,
      allowedBlockTypes: ['penutup'],
      pattern: 'Pesan penutup + Penugasan pertemuan berikutnya',
    },
    dokumen: {
      maxBlocks: 3,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: ['def-box', 'nc-grid', 'tp', 'alur'],
      pattern: 'CP + TP + ATP + Profil PPP',
    },
    custom: {
      maxBlocks: 5,
      density: 'dense',
      canSplit: true,
      allowedBlockTypes: [],
      pattern: 'Bebas — tapi tetap taat aturan contract',
    },
  },

  variantOverrides: {
    A: {}, // Default — gold + teal
    B: {
      accent: '#3ecfcf',
      accentBg: 'rgba(62,207,207,0.12)',
      accentBorder: 'rgba(62,207,207,0.25)',
    },
    C: {
      accent: '#a78bfa',
      accentBg: 'rgba(167,139,250,0.12)',
      accentBorder: 'rgba(167,139,250,0.25)',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// CONTRACT REGISTRY — Auto-register all contracts
// ═══════════════════════════════════════════════════════════════════

// Auto-register the golden contract
registerContract(GOLDEN_PERTEMUAN_CONTRACT);

// Auto-register the macam-norma contract
registerContract(MACAM_NORMA_CONTRACT);

// ═══════════════════════════════════════════════════════════════════
// BATCH-10C-Patch-3: MODERN_EDUCATOR_CONTRACT — defined HERE (not in MEC.ts)
// This eliminates the circular dependency:
//   TTC → MEC (import) → TTC (import registerContract) = CYCLE
// Now TTC owns ALL contract definitions. MEC.ts is a compatibility re-export.
// ═══════════════════════════════════════════════════════════════════

export const MODERN_EDUCATOR_CONTRACT: TemplateThemeContract = {
  id: 'modern-educator',
  name: '🌿 Modern Educator',
  description: 'Light theme — Emerald Green + Royal Blue + Amber. Based on the Stitch design system for Indonesian educators.',

  colors: {
    background: '#f7f9fb',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#191c1e',
    muted: '#6c7a71',
    accent: '#006c49',
    accentBg: 'rgba(0,108,73,0.08)',
    accentBorder: 'rgba(0,108,73,0.20)',
    maxAccents: 3,
    accentTokens: ['e', 'b', 'a'],
  },

  typography: {
    heroSize: 48,
    titleSize: 36,
    headingSize: 26,
    bodyLgSize: 22,
    bodySize: 20,
    captionSize: 16,
    microSize: 14,
    displayFont: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    bodyFont: "var(--font-nunito), 'Nunito Sans', sans-serif",
    minFontSize: 16,
  },

  spacing: {
    pagePadding: 32,
    cardPadding: 24,
    blockGap: 24,
    itemGap: 16,
    nestedPadding: 20,
  },

  borders: {
    cardRadius: 24,
    pillRadius: 9999,
    cardBorder: '1px solid rgba(224, 227, 229, 1)',
  },

  shadows: {
    card: '0 1px 2px rgba(0,0,0,0.04)',
    elevated: '0 4px 12px rgba(0,0,0,0.06)',
  },

  maxContentHeight: 640,
  cardTreatment: 'flat',
  headerTreatment: 'accented',

  pageAccents: {
    cover:       { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    petunjuk:    { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    tujuan:      { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    motivasi:    { accentToken: 'a', bgTint: 'rgba(226,145,0,0.04)' },
    materi:      { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    skenario:    { accentToken: 'a', bgTint: 'rgba(226,145,0,0.04)' },
    kuis:        { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    diskusi:     { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    refleksi:    { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    rangkuman:   { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    hasil:       { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
    penutup:     { accentToken: 'a', bgTint: 'rgba(226,145,0,0.04)' },
    dokumen:     { accentToken: 'b', bgTint: 'rgba(0,88,190,0.04)' },
    custom:      { accentToken: 'e', bgTint: 'rgba(0,108,73,0.04)' },
  },

  pageLayouts: {
    cover: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['cover'], pattern: 'Judul besar + Subjudul + Identitas + Tombol mulai' },
    petunjuk: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['petunjuk'], pattern: 'Judul + 3 langkah instruksi' },
    tujuan: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['tujuan-display', 'tp'], pattern: 'Judul + 3-4 tujuan dalam kartu' },
    motivasi: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['motivasi'], pattern: 'Pertanyaan pemantik + Koneksi konsep' },
    materi: { maxBlocks: 3, density: 'dense', canSplit: true, allowedBlockTypes: ['materi-section', 'def-box', 'nc-grid'], pattern: 'Judul + Konsep inti + Contoh' },
    skenario: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['skenario'], pattern: 'Instruksi + Langkah 1-3 + Aksi siswa' },
    kuis: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['kuis'], pattern: '1 pertanyaan per layar + 4 opsi + feedback' },
    diskusi: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['diskusi'], pattern: 'Pertanyaan diskusi + Petunjuk' },
    refleksi: { maxBlocks: 2, density: 'sparse', canSplit: true, allowedBlockTypes: ['refleksi'], pattern: 'Pertanyaan besar + Isian singkat + Penutup emosional' },
    rangkuman: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['rangkuman'], pattern: 'Ringkasan konsep + Penutup' },
    hasil: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['hasil'], pattern: 'Skor + Capaian' },
    penutup: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['penutup'], pattern: 'Ringkasan + Pesan akhir + Lanjutkan' },
    dokumen: { maxBlocks: 3, density: 'dense', canSplit: true, allowedBlockTypes: ['tp', 'alur'], pattern: 'Tujuan + Alur kegiatan' },
    custom: { maxBlocks: 5, density: 'dense', canSplit: true, allowedBlockTypes: [], pattern: 'Bebas — tapi tetap taat aturan contract' },
  },

  variantOverrides: {
    A: {},
    B: { accent: '#0058be', accentBg: 'rgba(0,88,190,0.12)', accentBorder: 'rgba(0,88,190,0.25)' },
    C: { accent: '#e29100', accentBg: 'rgba(226,145,0,0.12)', accentBorder: 'rgba(226,145,0,0.25)' },
  },
};

// Auto-register the Modern Educator contract
registerContract(MODERN_EDUCATOR_CONTRACT);

// ═══════════════════════════════════════════════════════════════════
// BATCH-11: SILSE_FRESH_CONTRACT — Fresh template reinstall
// ═══════════════════════════════════════════════════════════════════
// Senior decision: template content layer needs reinstall.
// Old PPKn template (norma-golden-schema) was quarantined as legacy.
// Fresh template uses silse-fresh contract — light, clean, NO
// golden-pertemuan, NO academic-clean inheritance.
//
// Design principles (fresh contract):
//   - Light background (#fafaf9 warm cream, NOT pure white)
//   - Single accent: deep teal (#0f766e) — calm, educator-friendly
//   - Generous whitespace (pagePadding 40, blockGap 28)
//   - Larger body text (22px) for classroom projection
//   - Max 3 accent tokens per page (teal/blue/amber)
//   - No dark variants — fresh template is light-only by design
//   - Flat cards, no neon glows
//   - Borders subtle (1px soft gray)
// ═══════════════════════════════════════════════════════════════════

export const SILSE_FRESH_CONTRACT: TemplateThemeContract = {
  id: 'silse-fresh',
  name: '🌱 Silse Fresh',
  description: 'Fresh template contract — warm cream background, deep teal accent. Built from scratch for V5 fresh template. No legacy inheritance.',

  colors: {
    background: '#fafaf9',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1c1917',
    muted: '#78716c',
    accent: '#0f766e',
    accentBg: 'rgba(15,118,110,0.08)',
    accentBorder: 'rgba(15,118,110,0.20)',
    maxAccents: 3,
    accentTokens: ['t', 'b', 'a'],
  },

  typography: {
    heroSize: 52,
    titleSize: 38,
    headingSize: 28,
    bodyLgSize: 24,
    bodySize: 22,
    captionSize: 16,
    microSize: 14,
    displayFont: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
    bodyFont: "var(--font-nunito), 'Nunito Sans', sans-serif",
    minFontSize: 16,
  },

  spacing: {
    pagePadding: 40,
    cardPadding: 28,
    blockGap: 28,
    itemGap: 18,
    nestedPadding: 22,
  },

  borders: {
    cardRadius: 20,
    pillRadius: 9999,
    cardBorder: '1px solid rgba(231, 229, 228, 1)',
  },

  shadows: {
    card: '0 1px 3px rgba(28,25,23,0.04)',
    elevated: '0 6px 16px rgba(28,25,23,0.06)',
  },

  maxContentHeight: 640,
  cardTreatment: 'flat',
  headerTreatment: 'accented',

  pageAccents: {
    cover:       { accentToken: 't', bgTint: 'rgba(15,118,110,0.04)' },
    petunjuk:    { accentToken: 'b', bgTint: 'rgba(37,99,235,0.04)' },
    tujuan:      { accentToken: 'b', bgTint: 'rgba(37,99,235,0.04)' },
    motivasi:    { accentToken: 'a', bgTint: 'rgba(217,119,6,0.04)' },
    materi:      { accentToken: 't', bgTint: 'rgba(15,118,110,0.04)' },
    skenario:    { accentToken: 'a', bgTint: 'rgba(217,119,6,0.04)' },
    kuis:        { accentToken: 'b', bgTint: 'rgba(37,99,235,0.04)' },
    diskusi:     { accentToken: 'b', bgTint: 'rgba(37,99,235,0.04)' },
    refleksi:    { accentToken: 't', bgTint: 'rgba(15,118,110,0.04)' },
    rangkuman:   { accentToken: 't', bgTint: 'rgba(15,118,110,0.04)' },
    hasil:       { accentToken: 't', bgTint: 'rgba(15,118,110,0.04)' },
    penutup:     { accentToken: 'a', bgTint: 'rgba(217,119,6,0.04)' },
    dokumen:     { accentToken: 'b', bgTint: 'rgba(37,99,235,0.04)' },
    game:        { accentToken: 'a', bgTint: 'rgba(217,119,6,0.04)' },
    custom:      { accentToken: 't', bgTint: 'rgba(15,118,110,0.04)' },
  },

  pageLayouts: {
    cover: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['cover'], pattern: 'Judul besar + Subjudul + Identitas + Tombol mulai' },
    petunjuk: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['petunjuk'], pattern: 'Judul + 3-4 langkah instruksi' },
    tujuan: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['tujuan-display', 'tp'], pattern: 'Judul + 3-4 tujuan dalam kartu' },
    motivasi: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['motivasi'], pattern: 'Pertanyaan pemantik + Koneksi konsep' },
    materi: { maxBlocks: 3, density: 'dense', canSplit: true, allowedBlockTypes: ['materi-section', 'def-box', 'nc-grid'], pattern: 'Judul + Konsep inti + Contoh' },
    skenario: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['skenario'], pattern: 'Instruksi + Langkah 1-3 + Aksi siswa' },
    kuis: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['kuis'], pattern: '1-5 pertanyaan per halaman + 4 opsi + feedback' },
    diskusi: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['diskusi'], pattern: 'Pertanyaan diskusi + Petunjuk' },
    refleksi: { maxBlocks: 2, density: 'sparse', canSplit: true, allowedBlockTypes: ['refleksi'], pattern: 'Pertanyaan besar + Isian singkat + Penutup emosional' },
    rangkuman: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['rangkuman'], pattern: 'Ringkasan konsep + Penutup' },
    hasil: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['hasil'], pattern: 'Skor + Capaian' },
    penutup: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['penutup'], pattern: 'Ringkasan + Pesan akhir + Lanjutkan' },
    dokumen: { maxBlocks: 3, density: 'dense', canSplit: true, allowedBlockTypes: ['tp', 'alur'], pattern: 'Tujuan + Alur kegiatan' },
    game: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['sortir-game', 'memory-game', 'matching-game'], pattern: 'Game interaktif + Instruksi' },
    custom: { maxBlocks: 5, density: 'dense', canSplit: true, allowedBlockTypes: [], pattern: 'Bebas — tapi tetap taat aturan contract' },
  },

  variantOverrides: {
    A: {},
    B: { accent: '#2563eb', accentBg: 'rgba(37,99,235,0.12)', accentBorder: 'rgba(37,99,235,0.25)' },
    C: { accent: '#d97706', accentBg: 'rgba(217,119,6,0.12)', accentBorder: 'rgba(217,119,6,0.25)' },
  },
};

// Auto-register the Silse Fresh contract
registerContract(SILSE_FRESH_CONTRACT);

// ═══════════════════════════════════════════════════════════════════
// BATCH-11D: SILSE_STUDIO_CONTRACT — Warm Sunset palette
// ═══════════════════════════════════════════════════════════════════
// Senior feedback Batch 11C: "Warna sama bentuk sama semua sama dengan
// legacy apanya yang baru". Studio + Fresh PPKn pakai contract yang
// SAMA (silse-fresh) → visually identik. Tidak ada yang "baru".
//
// Fix: buat contract BARU dengan palet BERBEDA — Warm Sunset:
//   - Background: warm cream (#fff7ed) — warmer than silse-fresh's #fafaf9
//   - Accent: deep orange (#ea580c) — vs silse-fresh's deep teal #0f766e
//   - Secondary accent: amber (#f59e0b)
//   - Tertiary: rose (#e11d48)
//   - Typography: same scale, different display font (Fredoka for friendly feel)
//
// This makes Studio VISUALLY DISTINCT from Fresh PPKn at first glance:
//   - Fresh PPKn = teal + cool cream (calm, professional)
//   - Studio     = orange + warm cream (energetic, friendly)
// ═══════════════════════════════════════════════════════════════════

export const SILSE_STUDIO_CONTRACT: TemplateThemeContract = {
  id: 'silse-studio',
  name: '🎨 Silse Studio — Warm Sunset',
  description: 'Warm Sunset palette — deep orange accent + warm cream bg. Energetic, friendly feel. Visually distinct from silse-fresh (teal). Built for SILSE Studio editable template.',

  colors: {
    background: '#fff7ed',  // warm cream (warmer than silse-fresh #fafaf9)
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1c1917',
    muted: '#78716c',
    accent: '#ea580c',  // deep orange (vs silse-fresh #0f766e teal)
    accentBg: 'rgba(234,88,12,0.08)',
    accentBorder: 'rgba(234,88,12,0.20)',
    maxAccents: 3,
    accentTokens: ['o', 'a', 'r'],  // orange, amber, rose
  },

  typography: {
    heroSize: 52,
    titleSize: 38,
    headingSize: 28,
    bodyLgSize: 24,
    bodySize: 22,
    captionSize: 16,
    microSize: 14,
    displayFont: "var(--font-fredoka), 'Fredoka', cursive",  // friendly rounded
    bodyFont: "var(--font-nunito), 'Nunito Sans', sans-serif",
    minFontSize: 16,
  },

  spacing: {
    pagePadding: 40,
    cardPadding: 28,
    blockGap: 28,
    itemGap: 18,
    nestedPadding: 22,
  },

  borders: {
    cardRadius: 20,
    pillRadius: 9999,
    cardBorder: '1px solid rgba(251,191,36,0.25)',  // amber-tinted border
  },

  shadows: {
    card: '0 1px 3px rgba(234,88,12,0.06)',  // warm shadow
    elevated: '0 6px 16px rgba(234,88,12,0.10)',
  },

  maxContentHeight: 640,
  cardTreatment: 'flat',
  headerTreatment: 'accented',

  pageAccents: {
    cover:       { accentToken: 'o', bgTint: 'rgba(234,88,12,0.04)' },
    petunjuk:    { accentToken: 'a', bgTint: 'rgba(245,158,11,0.04)' },
    tujuan:      { accentToken: 'a', bgTint: 'rgba(245,158,11,0.04)' },
    motivasi:    { accentToken: 'r', bgTint: 'rgba(225,29,72,0.04)' },
    materi:      { accentToken: 'o', bgTint: 'rgba(234,88,12,0.04)' },
    skenario:    { accentToken: 'r', bgTint: 'rgba(225,29,72,0.04)' },
    kuis:        { accentToken: 'a', bgTint: 'rgba(245,158,11,0.04)' },
    diskusi:     { accentToken: 'a', bgTint: 'rgba(245,158,11,0.04)' },
    refleksi:    { accentToken: 'o', bgTint: 'rgba(234,88,12,0.04)' },
    rangkuman:   { accentToken: 'o', bgTint: 'rgba(234,88,12,0.04)' },
    hasil:       { accentToken: 'o', bgTint: 'rgba(234,88,12,0.04)' },
    penutup:     { accentToken: 'r', bgTint: 'rgba(225,29,72,0.04)' },
    dokumen:     { accentToken: 'a', bgTint: 'rgba(245,158,11,0.04)' },
    game:        { accentToken: 'r', bgTint: 'rgba(225,29,72,0.04)' },
    custom:      { accentToken: 'o', bgTint: 'rgba(234,88,12,0.04)' },
  },

  pageLayouts: {
    cover: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['cover'], pattern: 'Judul besar + Subjudul + Identitas + Tombol mulai' },
    petunjuk: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['petunjuk'], pattern: 'Judul + 3-4 langkah instruksi' },
    tujuan: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['tujuan-display', 'tp'], pattern: 'Judul + 3-4 tujuan dalam kartu' },
    motivasi: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['motivasi'], pattern: 'Pertanyaan pemantik + Koneksi konsep' },
    materi: { maxBlocks: 3, density: 'dense', canSplit: true, allowedBlockTypes: ['materi-section', 'def-box', 'nc-grid'], pattern: 'Judul + Konsep inti + Contoh' },
    skenario: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['skenario'], pattern: 'Instruksi + Langkah 1-3 + Aksi siswa' },
    kuis: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['kuis'], pattern: '1-5 pertanyaan per halaman + 4 opsi + feedback' },
    diskusi: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['diskusi'], pattern: 'Pertanyaan diskusi + Petunjuk' },
    refleksi: { maxBlocks: 2, density: 'sparse', canSplit: true, allowedBlockTypes: ['refleksi'], pattern: 'Pertanyaan besar + Isian singkat + Penutup emosional' },
    rangkuman: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['rangkuman'], pattern: 'Ringkasan konsep + Penutup' },
    hasil: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['hasil'], pattern: 'Skor + Capaian' },
    penutup: { maxBlocks: 1, density: 'sparse', canSplit: false, allowedBlockTypes: ['penutup'], pattern: 'Ringkasan + Pesan akhir + Lanjutkan' },
    dokumen: { maxBlocks: 3, density: 'dense', canSplit: true, allowedBlockTypes: ['tp', 'alur'], pattern: 'Tujuan + Alur kegiatan' },
    game: { maxBlocks: 2, density: 'comfortable', canSplit: true, allowedBlockTypes: ['sortir-game', 'memory-game', 'matching-game'], pattern: 'Game interaktif + Instruksi' },
    custom: { maxBlocks: 5, density: 'dense', canSplit: true, allowedBlockTypes: [], pattern: 'Bebas — tapi tetap taat aturan contract' },
  },

  variantOverrides: {
    A: {},
    B: { accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.12)', accentBorder: 'rgba(245,158,11,0.25)' },  // amber
    C: { accent: '#e11d48', accentBg: 'rgba(225,29,72,0.12)', accentBorder: 'rgba(225,29,72,0.25)' },  // rose
  },
};

// Auto-register the Silse Studio contract
registerContract(SILSE_STUDIO_CONTRACT);

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
 * Macam Norma accent palette — teal replaces blue.
 * These match the HTML original (pertemuan2-macam-norma-v3)
 * and the macam-norma theme preset in tokens.ts.
 */
const MACAM_NORMA_ACCENT_PALETTE: Record<string, string> = {
  y: '#f9c12e',  // Warm gold — sesuai HTML v3
  c: '#3ecfcf',  // Teal — IDENTITAS Macam Norma, sesuai HTML v3
  g: '#34d399',  // Green — sesuai HTML v3
  p: '#a78bfa',  // Purple — sesuai HTML v3
  o: '#fb923c',  // Orange — sesuai HTML v3
  r: '#ff6b6b',  // Red — sesuai HTML v3
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

  // Detect contract type — must be before primaryAccentToken resolution
  const isModernEducator = contract.id === 'modern-educator';
  const isMacamNorma = contract.id === 'macam-norma';
  const isSilseFresh = contract.id === 'silse-fresh';
  const isSilseStudio = contract.id === 'silse-studio';

  // Resolve which token is the primary accent for this page type
  const primaryAccentToken = pageAccent.accentToken
    || (isModernEducator ? 'e'
      : isSilseFresh ? 't'
      : isSilseStudio ? 'o'
      : 'y');

  // ═══ BUILD THE ACCENT TOKEN MAP ═════════════════════════════════
  // This is the KEY fix. Every accent token gets a contract-compliant
  // color. The primary accent token for THIS page gets the contract's
  // accent color (with variant override). Other tokens get their
  // identity colors from the contract palette.
  //
  // BATCH-11D: Added silse-studio palette (warm sunset — orange/amber/rose).
  // Visually distinct from silse-fresh (teal) at first glance.
  const accentTokenMap: Record<string, string> = {};
  // Use the Modern Educator palette if that contract is active
  // Use the Macam Norma palette if that contract is active (teal replaces blue)
  // Use the Silse Studio palette if that contract is active (warm sunset)
  // (isModernEducator, isMacamNorma, isSilseStudio already declared above)
  const palette = isModernEducator
    ? MODERN_EDUCATOR_ACCENT_PALETTE
    : isMacamNorma
    ? MACAM_NORMA_ACCENT_PALETTE
    : isSilseStudio
    ? SILSE_STUDIO_ACCENT_PALETTE
    : CONTRACT_ACCENT_PALETTE;
  for (const [token, color] of Object.entries(palette)) {
    accentTokenMap[token] = color;
  }
  // Override the primary accent token with the resolved accent (with variant)
  // BATCH-10C-Patch-3: Use palette[primaryAccentToken] as base, then apply
  // variant override. This prevents all page accents from becoming the
  // contract's identity accent (#006c49 for modern-educator).
  // Algorithm:
  //   variant A: resolvedAccent = palette[primaryAccentToken] || contract.colors.accent
  //   variant B/C: resolvedAccent = variantColors.accent || palette[primaryAccentToken] || contract.colors.accent
  const resolvedAccent = variantColors.accent
    || palette[primaryAccentToken]
    || contract.colors.accent;
  accentTokenMap[primaryAccentToken] = resolvedAccent;

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
