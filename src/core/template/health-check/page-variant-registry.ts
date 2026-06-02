// ═══════════════════════════════════════════════════════════════════
// PAGE VARIANT CONTRACT — Safe visual variations for page types
// ═══════════════════════════════════════════════════════════════════
// Varian mengikuti aturan:
//   - konten tetap
//   - page type tetap
//   - runtime tetap (score, completion, navigation lock)
//   - yang berubah hanya cara tampil
//
// Jangan variasi membuat block baru liar.
// Renderer boleh beda, tapi event contract tetap sama:
//   reportScore({ elementId, pageIndex, score, maxScore, completed: true })
// ═══════════════════════════════════════════════════════════════════

// ── Variant Types ────────────────────────────────────────────────

export type PageVariantId = string;

export interface PageVariant {
  /** Unique variant identifier */
  id: PageVariantId;
  /** Human-readable label for teacher UI */
  label: string;
  /** Short description of this variant's approach */
  description: string;
  /** Which page type this variant applies to */
  pageType: string;
  /** Icon for the variant selector UI */
  icon: string;
  /** Maximum words this variant handles well */
  maxWords?: number;
  /** Maximum items/cards this variant handles */
  maxItems?: number;
  /** Minimum body font this variant uses */
  minBodyFont: number;
  /** Interaction types this variant supports */
  allowedInteractions: VariantInteraction[];
  /** What happens when content overflows */
  overflowAction: 'split-page' | 'warning' | 'scroll';
  /** Whether this is the default variant for this page type */
  isDefault: boolean;
  /** Visual density: compact = dense layout, spacious = lots of whitespace */
  density: 'compact' | 'balanced' | 'spacious';
  /** Content reveal strategy */
  revealStrategy: 'all-visible' | 'progressive' | 'on-interaction';
}

export type VariantInteraction = 'none' | 'reveal' | 'click' | 'choose' | 'drag' | 'write' | 'discuss';

// ── Variant Validation Result ────────────────────────────────────

export interface VariantFitResult {
  /** Whether the content fits this variant well */
  fits: boolean;
  /** Warnings if content is borderline */
  warnings: string[];
  /** Suggestions for better fit */
  suggestions: string[];
}

// ═══════════════════════════════════════════════════════════════════
// PAGE VARIANT REGISTRY
// ═══════════════════════════════════════════════════════════════════

const PAGE_VARIANTS: PageVariant[] = [
  // ── Cover Variants ────────────────────────────────────────
  {
    id: 'cover-center-hero',
    label: 'Center Hero',
    description: 'Judul besar di tengah, subtitle di bawah. Klasik dan elegan.',
    pageType: 'cover',
    icon: '⬛',
    maxWords: 30,
    minBodyFont: 20,
    allowedInteractions: ['none'],
    overflowAction: 'warning',
    isDefault: true,
    density: 'spacious',
    revealStrategy: 'all-visible',
  },
  {
    id: 'cover-game-intro',
    label: 'Game Intro',
    description: 'Cover dengan elemen interaktif, seperti countdown atau animasi hook.',
    pageType: 'cover',
    icon: '🎮',
    maxWords: 20,
    minBodyFont: 20,
    allowedInteractions: ['click', 'reveal'],
    overflowAction: 'warning',
    isDefault: false,
    density: 'spacious',
    revealStrategy: 'on-interaction',
  },
  {
    id: 'cover-split',
    label: 'Split Visual',
    description: 'Judul kiri, visual/gambar kanan. Untuk cover dengan ilustrasi.',
    pageType: 'cover',
    icon: '◧◨',
    maxWords: 25,
    minBodyFont: 20,
    allowedInteractions: ['none'],
    overflowAction: 'warning',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'all-visible',
  },

  // ── Tujuan Variants ───────────────────────────────────────
  {
    id: 'tujuan-list',
    label: 'Daftar Tujuan',
    description: 'Tujuan pembelajaran ditampilkan sebagai daftar bernomor.',
    pageType: 'tujuan',
    icon: '📋',
    maxWords: 80,
    maxItems: 4,
    minBodyFont: 20,
    allowedInteractions: ['none', 'reveal'],
    overflowAction: 'split-page',
    isDefault: true,
    density: 'balanced',
    revealStrategy: 'progressive',
  },
  {
    id: 'tujuan-cards',
    label: 'Kartu Tujuan',
    description: 'Setiap tujuan dalam kartu terpisah. Visual dan mudah dibaca.',
    pageType: 'tujuan',
    icon: '🃏',
    maxWords: 60,
    maxItems: 4,
    minBodyFont: 20,
    allowedInteractions: ['reveal'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'spacious',
    revealStrategy: 'on-interaction',
  },

  // ── Materi Variants ───────────────────────────────────────
  {
    id: 'materi-concept-focus',
    label: 'Fokus Konsep',
    description: 'Satu konsep utama di tengah. Definisi jelas, visual pendukung. Ideal untuk 1 konsep.',
    pageType: 'materi',
    icon: '🎯',
    maxWords: 80,
    minBodyFont: 20,
    allowedInteractions: ['none', 'reveal'],
    overflowAction: 'split-page',
    isDefault: true,
    density: 'balanced',
    revealStrategy: 'all-visible',
  },
  {
    id: 'materi-concept-example',
    label: 'Konsep + Contoh',
    description: 'Definisi di atas, contoh konkret di bawah. Untuk materi yang butuh ilustrasi.',
    pageType: 'materi',
    icon: '💡',
    maxWords: 100,
    minBodyFont: 20,
    allowedInteractions: ['none', 'reveal'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'progressive',
  },
  {
    id: 'materi-reveal-step',
    label: 'Reveal Bertahap',
    description: 'Konten muncul langkah demi langkah. Siswa klik untuk lanjut. Baik untuk materi bertahap.',
    pageType: 'materi',
    icon: '👣',
    maxWords: 120,
    minBodyFont: 20,
    allowedInteractions: ['reveal', 'click'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'compact',
    revealStrategy: 'on-interaction',
  },
  {
    id: 'materi-flashcard',
    label: 'Flashcard',
    description: 'Kartu bolak-balik. Depan: pertanyaan/istilah. Belakang: jawaban/definisi.',
    pageType: 'materi',
    icon: '🃏',
    maxWords: 60,
    maxItems: 5,
    minBodyFont: 20,
    allowedInteractions: ['click', 'reveal'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'on-interaction',
  },

  // ── Kuis Variants ─────────────────────────────────────────
  {
    id: 'kuis-single-question',
    label: 'Satu Soal',
    description: 'Satu pertanyaan per halaman. Fokus penuh. Standar SILSE.',
    pageType: 'kuis',
    icon: '❓',
    maxWords: 40,
    maxItems: 1,
    minBodyFont: 20,
    allowedInteractions: ['choose'],
    overflowAction: 'split-page',
    isDefault: true,
    density: 'spacious',
    revealStrategy: 'on-interaction',
  },
  {
    id: 'kuis-card-choice',
    label: 'Kartu Pilihan',
    description: 'Opsi jawaban sebagai kartu visual besar. Lebih interaktif dan engaging.',
    pageType: 'kuis',
    icon: '🃏',
    maxWords: 30,
    maxItems: 1,
    minBodyFont: 20,
    allowedInteractions: ['choose', 'click'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'spacious',
    revealStrategy: 'on-interaction',
  },

  // ── Game Variants ─────────────────────────────────────────
  {
    id: 'game-board',
    label: 'Board Game',
    description: 'Papan permainan klasik. Cocok untuk sortir, drag-drop.',
    pageType: 'game',
    icon: '🎯',
    maxWords: 30,
    minBodyFont: 20,
    allowedInteractions: ['drag', 'click', 'choose'],
    overflowAction: 'warning',
    isDefault: true,
    density: 'compact',
    revealStrategy: 'on-interaction',
  },
  {
    id: 'game-arena',
    label: 'Arena',
    description: 'Area permainan terbuka. Cocok untuk memory, word-search, crossword.',
    pageType: 'game',
    icon: '🏟️',
    maxWords: 20,
    minBodyFont: 20,
    allowedInteractions: ['click', 'drag'],
    overflowAction: 'warning',
    isDefault: false,
    density: 'compact',
    revealStrategy: 'on-interaction',
  },

  // ── Diskusi Variants ──────────────────────────────────────
  {
    id: 'diskusi-single',
    label: 'Satu Pertanyaan',
    description: 'Satu pertanyaan diskusi besar. Fokus dan mendalam.',
    pageType: 'diskusi',
    icon: '💬',
    maxWords: 60,
    minBodyFont: 20,
    allowedInteractions: ['discuss', 'write'],
    overflowAction: 'split-page',
    isDefault: true,
    density: 'spacious',
    revealStrategy: 'all-visible',
  },
  {
    id: 'diskusi-multi',
    label: 'Multi Diskusi',
    description: 'Beberapa pertanyaan diskusi dalam satu halaman. Untuk eksplorasi luas.',
    pageType: 'diskusi',
    icon: '🗣️',
    maxWords: 80,
    maxItems: 3,
    minBodyFont: 20,
    allowedInteractions: ['discuss', 'write', 'reveal'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'progressive',
  },

  // ── Refleksi Variants ─────────────────────────────────────
  {
    id: 'refleksi-calm-journal',
    label: 'Jurnal Tenang',
    description: 'Pertanyaan refleksi dengan area tulis luas. Atmosfer tenang dan contemplatif.',
    pageType: 'refleksi',
    icon: '📓',
    maxWords: 40,
    minBodyFont: 20,
    allowedInteractions: ['write'],
    overflowAction: 'split-page',
    isDefault: true,
    density: 'spacious',
    revealStrategy: 'all-visible',
  },
  {
    id: 'refleksi-mood-check',
    label: 'Cek Mood',
    description: 'Pilih mood/perasaan, lalu tulis refleksi. Lebih interaktif dan personal.',
    pageType: 'refleksi',
    icon: '😊',
    maxWords: 30,
    minBodyFont: 20,
    allowedInteractions: ['click', 'write'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'on-interaction',
  },

  // ── Rangkuman Variants ────────────────────────────────────
  {
    id: 'rangkuman-list',
    label: 'Daftar Poin',
    description: 'Poin kunci sebagai daftar. Cepat dan mudah dipindai.',
    pageType: 'rangkuman',
    icon: '📝',
    maxWords: 70,
    minBodyFont: 20,
    allowedInteractions: ['none'],
    overflowAction: 'split-page',
    isDefault: true,
    density: 'balanced',
    revealStrategy: 'all-visible',
  },
  {
    id: 'rangkuman-visual',
    label: 'Visual Summary',
    description: 'Rangkuman dengan kartu visual dan ikon. Lebih engaging.',
    pageType: 'rangkuman',
    icon: '🎨',
    maxWords: 50,
    minBodyFont: 20,
    allowedInteractions: ['reveal'],
    overflowAction: 'split-page',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'progressive',
  },

  // ── Penutup Variants ──────────────────────────────────────
  {
    id: 'penutup-kartu',
    label: 'Kartu Penutup',
    description: 'Ringkasan + pesan akhir dalam kartu. Simpel dan sopan.',
    pageType: 'penutup',
    icon: '👋',
    maxWords: 40,
    minBodyFont: 20,
    allowedInteractions: ['none'],
    overflowAction: 'warning',
    isDefault: true,
    density: 'spacious',
    revealStrategy: 'all-visible',
  },
  {
    id: 'penutup-checklist',
    label: 'Checklist Penutup',
    description: 'Apa yang sudah dipelajari sebagai checklist. Sense of completion.',
    pageType: 'penutup',
    icon: '✅',
    maxWords: 50,
    minBodyFont: 20,
    allowedInteractions: ['click'],
    overflowAction: 'warning',
    isDefault: false,
    density: 'balanced',
    revealStrategy: 'on-interaction',
  },
];

// ═══════════════════════════════════════════════════════════════════
// REGISTRY API
// ═══════════════════════════════════════════════════════════════════

/** Get all variants for a specific page type */
export function getVariantsForPageType(pageType: string): PageVariant[] {
  return PAGE_VARIANTS.filter(v => v.pageType === pageType);
}

/** Get the default variant for a page type */
export function getDefaultVariant(pageType: string): PageVariant {
  const variants = getVariantsForPageType(pageType);
  const defaultVariant = variants.find(v => v.isDefault);
  return defaultVariant || variants[0] || PAGE_VARIANTS[0]!;
}

/** Get a specific variant by ID */
export function getVariantById(id: PageVariantId): PageVariant | undefined {
  return PAGE_VARIANTS.find(v => v.id === id);
}

/** Get all page types that have variants */
export function getPageTypesWithVariants(): string[] {
  const types = new Set(PAGE_VARIANTS.map(v => v.pageType));
  return [...types];
}

/** Check if content fits a variant */
export function checkVariantFit(
  variant: PageVariant,
  contentMetrics: { wordCount: number; itemCount: number },
): VariantFitResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let fits = true;

  if (variant.maxWords && contentMetrics.wordCount > variant.maxWords) {
    fits = false;
    warnings.push(`Konten ${contentMetrics.wordCount} kata, varian ini maksimal ${variant.maxWords} kata.`);
    suggestions.push('Pecah halaman atau pilih varian yang menampung lebih banyak kata.');
  }

  if (variant.maxItems && contentMetrics.itemCount > variant.maxItems) {
    fits = false;
    warnings.push(`Konten punya ${contentMetrics.itemCount} item, varian ini maksimal ${variant.maxItems} item.`);
    suggestions.push('Pecah halaman atau kurangi jumlah item.');
  }

  if (variant.maxWords && contentMetrics.wordCount > variant.maxWords * 0.8 && fits) {
    warnings.push(`Konten mendekati batas kata (${contentMetrics.wordCount}/${variant.maxWords}).`);
  }

  return { fits, warnings, suggestions };
}

/**
 * Resolve the effective variant for a page.
 * Priority:
 *   1. Explicit variant set on the page (page.templateVariant → variant mapping)
 *   2. Default variant for the page type
 */
export function resolvePageVariant(page: {
  templateType: string;
  templateVariant?: 'A' | 'B' | 'C';
}): PageVariant {
  // Map A/B/C variant to registered variant IDs
  const variantMap: Record<string, Record<string, string>> = {
    cover: { A: 'cover-center-hero', B: 'cover-split', C: 'cover-game-intro' },
    tujuan: { A: 'tujuan-list', B: 'tujuan-cards' },
    materi: { A: 'materi-concept-focus', B: 'materi-concept-example', C: 'materi-reveal-step' },
    kuis: { A: 'kuis-single-question', B: 'kuis-card-choice' },
    game: { A: 'game-board', B: 'game-arena' },
    diskusi: { A: 'diskusi-single', B: 'diskusi-multi' },
    refleksi: { A: 'refleksi-calm-journal', B: 'refleksi-mood-check' },
    rangkuman: { A: 'rangkuman-list', B: 'rangkuman-visual' },
    penutup: { A: 'penutup-kartu', B: 'penutup-checklist' },
  };

  const pageVariants = variantMap[page.templateType];
  if (pageVariants && page.templateVariant) {
    const variantId = pageVariants[page.templateVariant];
    if (variantId) {
      const variant = getVariantById(variantId);
      if (variant) return variant;
    }
  }

  return getDefaultVariant(page.templateType);
}

/** Get all registered variants */
export function getAllVariants(): PageVariant[] {
  return [...PAGE_VARIANTS];
}
