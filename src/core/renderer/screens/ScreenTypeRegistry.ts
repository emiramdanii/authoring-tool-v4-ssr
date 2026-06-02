// ═══════════════════════════════════════════════════════════════════
// SCREEN TYPE REGISTRY — Maps sceneType → screen configuration
// ═══════════════════════════════════════════════════════════════════
// The core principle: 1 screen = 1 page with no overlap and no free stacking.
// Each screen type defines its own chrome, interactivity, and constraints.
//
// This registry maps the 13 PageTemplateType values to their screen-level
// configuration. It is the SINGLE source of truth for screen behavior.
//
// Architecture:
//   PageRenderer (mode=learn)
//     → getScreenAdapter(page.templateType)
//       → ScreenAdapter (e.g., QuizScreen)
//         → ScreenShell (consistent chrome)
//           → SchemaScreenRenderer (block layout + rendering)
//
// ═══════════════════════════════════════════════════════════════════

// ── Screen Config Interface ──────────────────────────────────────

export interface ScreenConfig {
  /** Screen type identifier — matches PageTemplateType values */
  type: string;
  /** Indonesian display name for this screen type */
  displayName: string;
  /** Lucide icon name for header/footer chrome */
  icon: string;
  /** Accent color key (g/r/y/c/p/o) for chrome elements */
  accentColor: string;
  /** Can this screen have more than 1 block? */
  allowMultipleBlocks: boolean;
  /** Does this screen have interactive elements (quiz/game)? */
  isInteractive: boolean;
  /** Must user complete interaction before advancing? */
  requiresCompletion: boolean;
  /** Maximum blocks allowed on this screen type */
  maxBlocks: number;
  /** Layout mode: full-page = cover/hero only, content = with navbars */
  layout: 'full-page' | 'content';
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN CONFIG DEFINITIONS — All 13 screen types
// ═══════════════════════════════════════════════════════════════════

const SCREEN_CONFIGS: Record<string, ScreenConfig> = {
  // ── Cover — Full bleed, no chrome ───────────────────────────────
  cover: {
    type: 'cover',
    displayName: 'Cover',
    icon: 'BookOpen',
    accentColor: 'y',
    allowMultipleBlocks: false,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 1,
    layout: 'full-page',
  },

  // ── Petunjuk — Usage instructions, scrollable ──────────────────
  petunjuk: {
    type: 'petunjuk',
    displayName: 'Petunjuk Penggunaan',
    icon: 'Info',
    accentColor: 'c',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 3,
    layout: 'content',
  },

  // ── Tujuan — Learning objectives, numbered list ────────────────
  tujuan: {
    type: 'tujuan',
    displayName: 'Tujuan Pembelajaran',
    icon: 'Target',
    accentColor: 'p',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Motivasi — Hook question, connections ───────────────────────
  motivasi: {
    type: 'motivasi',
    displayName: 'Motivasi / Apersepsi',
    icon: 'Lightbulb',
    accentColor: 'y',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Materi — Main learning content, safe padding ───────────────
  materi: {
    type: 'materi',
    displayName: 'Materi Pembelajaran',
    icon: 'BookMarked',
    accentColor: 'y',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 4,
    layout: 'content',
  },

  // ── Diskusi — Interactive, requires at least 1 answer ──────────
  diskusi: {
    type: 'diskusi',
    displayName: 'Diskusi',
    icon: 'MessageCircle',
    accentColor: 'c',
    allowMultipleBlocks: true,
    isInteractive: true,
    requiresCompletion: true,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Kuis — Interactive, requires completion, score tracking ────
  kuis: {
    type: 'kuis',
    displayName: 'Kuis',
    icon: 'HelpCircle',
    accentColor: 'g',
    allowMultipleBlocks: true,
    isInteractive: true,
    requiresCompletion: true,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Game — Interactive, requires completion, score tracking ────
  game: {
    type: 'game',
    displayName: 'Game',
    icon: 'Gamepad2',
    accentColor: 'c',
    allowMultipleBlocks: true,
    isInteractive: true,
    requiresCompletion: true,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Refleksi — Interactive, requires at least 1 answer ─────────
  refleksi: {
    type: 'refleksi',
    displayName: 'Refleksi',
    icon: 'Mirror',
    accentColor: 'p',
    allowMultipleBlocks: true,
    isInteractive: true,
    requiresCompletion: true,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Rangkuman — Content display, key concepts ──────────────────
  rangkuman: {
    type: 'rangkuman',
    displayName: 'Rangkuman',
    icon: 'ListChecks',
    accentColor: 'y',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 3,
    layout: 'content',
  },

  // ── Penutup — Minimal chrome, closing message ──────────────────
  penutup: {
    type: 'penutup',
    displayName: 'Penutup',
    icon: 'Flag',
    accentColor: 'y',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 2,
    layout: 'full-page',
  },

  // ── Skenario — Interactive, choice-based navigation ────────────
  skenario: {
    type: 'skenario',
    displayName: 'Skenario',
    icon: 'GitBranch',
    accentColor: 'p',
    allowMultipleBlocks: true,
    isInteractive: true,
    requiresCompletion: true,
    maxBlocks: 2,
    layout: 'content',
  },

  // ── Hasil — Score display, results summary ─────────────────────
  hasil: {
    type: 'hasil',
    displayName: 'Hasil',
    icon: 'Trophy',
    accentColor: 'o',
    allowMultipleBlocks: true,
    isInteractive: false,
    requiresCompletion: false,
    maxBlocks: 2,
    layout: 'content',
  },
};

// ═══════════════════════════════════════════════════════════════════
// DEFAULT CONFIG — Fallback for unknown screen types
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ScreenConfig = {
  type: 'custom',
  displayName: 'Konten',
  icon: 'FileText',
  accentColor: 'y',
  allowMultipleBlocks: true,
  isInteractive: false,
  requiresCompletion: false,
  maxBlocks: 4,
  layout: 'content',
};

// ═══════════════════════════════════════════════════════════════════
// REGISTRY ACCESS FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the ScreenConfig for a given screen type.
 * Falls back to DEFAULT_CONFIG for unknown types.
 */
export function getScreenConfig(screenType: string): ScreenConfig {
  return SCREEN_CONFIGS[screenType] ?? DEFAULT_CONFIG;
}

/**
 * Check if a screen type is a "full-page" layout (no chrome).
 * Full-page screens (cover, penutup) render without header/footer.
 */
export function isFullPageScreen(screenType: string): boolean {
  return getScreenConfig(screenType).layout === 'full-page';
}

/**
 * Check if a screen type requires completion before advancing.
 */
export function requiresScreenCompletion(screenType: string): boolean {
  return getScreenConfig(screenType).requiresCompletion;
}

/**
 * Check if a screen type has interactive elements.
 */
export function isScreenInteractive(screenType: string): boolean {
  return getScreenConfig(screenType).isInteractive;
}

/**
 * Get the maximum number of blocks allowed for a screen type.
 */
export function getScreenMaxBlocks(screenType: string): number {
  return getScreenConfig(screenType).maxBlocks;
}

/**
 * Get all registered screen type keys.
 */
export function getAllScreenTypes(): string[] {
  return Object.keys(SCREEN_CONFIGS);
}

/**
 * The full registry for direct access if needed.
 */
export { SCREEN_CONFIGS };
