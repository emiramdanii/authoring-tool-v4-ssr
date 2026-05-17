// ═══════════════════════════════════════════════════════════════════
// SCREEN SCHEMA — JSON schema definitions for each page type
// ═══════════════════════════════════════════════════════════════════
// This replaces raw HTML with structured JSON that the renderer
// converts to UI. No HTML is stored — only schema.
//
// Example:
//   HTML: <div class="def-box">Norma adalah...</div>
//   JSON: { type: 'def-box', content: 'Norma adalah...' }
//
// The renderer reads the JSON and produces the appropriate React UI.

// ── Base Schema Types ──────────────────────────────────────────

export interface BlockLayout {
  /** Layout strategy: flow (flexbox) or absolute (coordinate-based) */
  position: 'flow' | 'absolute';
  /** X position in % (only for absolute) */
  x?: number;
  /** Y position in % (only for absolute) */
  y?: number;
  /** Width in % or 'auto' (only for absolute) */
  width?: number | 'auto';
  /** Height in % or 'auto' (only for absolute) */
  height?: number | 'auto';
  /** Preferred width hint: 'full' | 'half' | 'third' — used by layout engine BEFORE render */
  preferredWidth?: 'full' | 'half' | 'third';
  /** Minimum height in px — used by layout engine for scene splitting */
  minHeight?: number;
  /** Z-index layer */
  zIndex?: number;
  /** Rotation in degrees */
  rotation?: number;
}

// ── Compression Hints ────────────────────────────────────────────
// Intelligence that the layout/compression engine uses BEFORE render.
// The renderer is pure + dumb — all intelligence lives here.

export interface CompressionHints {
  /** How important is this block? High priority blocks stay visible longer. */
  priority: 'high' | 'medium' | 'low';
  /** When space is tight, how should this block compress? */
  strategy: 'accordion' | 'truncate' | 'scroll' | 'none';
  /** Can this block be split across scenes? */
  splittable?: boolean;
  /** If split, minimum content to show in first fragment (in px) */
  minFragmentHeight?: number;
  // NOTE: _compressedHeight was REMOVED from CompressionHints.
  // It was a derived runtime value that leaked into localStorage via schema.
  // The layout engines (CompressionEngine, SceneOverflowEngine, SceneLayoutEngine)
  // compute their own CompressionResult.compressedHeight at runtime.
  // The rebalance transaction now writes to a runtime cache instead of the schema.
  // See: session-state.ts → compressedHeightCache
}

// ── Semantic Hints ───────────────────────────────────────────────
// Metadata about the MEANING of this block.
// Used by AI regeneration, search, export, and smart features.

export interface SemanticHints {
  /** Topic/keyword this block relates to */
  topic?: string;
  /** Importance score 0–1 — used for prioritization in layout + export */
  importance?: number;
  /** BSNP relevance — is this block required by BSNP curriculum standards? */
  bsnpRelevant?: boolean;
  /** Which phase of learning does this block serve? */
  learningPhase?: 'pendahuluan' | 'inti' | 'penutup';
  /** Interaction type hint — what kind of student interaction? */
  interactionType?: 'read' | 'write' | 'choose' | 'drag' | 'discuss' | 'reflect';
}

export interface BaseBlock {
  type: string;
  id?: string;
  /** Optional style token overrides */
  style?: Record<string, string>;
  /** Optional variant for layout variation */
  variant?: 'A' | 'B' | 'C';
  /** Whether block is interactive */
  interactive?: boolean;
  /** Optional condition for visibility */
  showIf?: string;
  /**
   * Optional layout definition.
   * Default is flow (flexbox) — blocks stack vertically.
   * Set position: 'absolute' for coordinate-based placement.
   * This is the foundation for the Scene Node system.
   *
   * Includes preferredWidth and minHeight hints that the layout engine
   * uses BEFORE render. The renderer is pure + dumb.
   */
  layout?: BlockLayout;
  /**
   * Compression intelligence — how the scene engine should handle
   * this block when space is tight. All intelligence lives here,
   * NOT in the renderer.
   */
  compression?: CompressionHints;
  /**
   * Semantic metadata — what this block MEANS, not just what it looks like.
   * Used by AI regeneration, search, export, and smart features.
   * This is the foundation for SILSE as a "document engine".
   */
  semantic?: SemanticHints;
  /**
   * Optional children for composite blocks.
   * A composite block = mini scene with child blocks.
   * This enables: nested blocks, grouping, z-index, layer panel.
   */
  children?: SchemaBlock[];
}

// ── Cover Schema ───────────────────────────────────────────────

export interface CoverBlock extends BaseBlock {
  type: 'cover';
  icon: string;
  title: string;
  subtitle: string;
  badges: Array<{
    icon?: string;
    text: string;
    color: string;   // Token key: 'y', 'c', 'g', 'p'
  }>;
  meta?: {
    durasi?: string;
    fase?: string;
    elemen?: string;
  };
  cta?: {
    label: string;
    action: string;  // Navigation target screen id
  };
  accentColor?: string; // Token key override for radial glow (default: 'y')
  background?: {
    type: 'gradient';
    color1: string;
    color2: string;
  };
}

// ── Petunjuk Schema ────────────────────────────────────────────

export interface PetunjukBlock extends BaseBlock {
  type: 'petunjuk';
  title: string;
  titleHighlight: string;
  items: Array<{
    icon: string;
    title: string;
    body: string;
  }>;
  tips?: string;
  tipsColor?: string;
  /** Navigasi yang tersedia di media ini */
  navigation?: Array<{
    icon: string;
    label: string;
    description: string;
  }>;
  /** Tujuan pembelajaran singkat (BSNP wajib) */
  learningObjectives?: Array<{
    num: number;
    text: string;
  }>;
}

// ── TP (Tujuan Pembelajaran) Schema ────────────────────────────

export interface TpBlock extends BaseBlock {
  type: 'tp';
  title: string;
  titleHighlight: string;
  items: Array<{
    num: number;
    verb: string;
    desc: string;
    color: string;  // Token key
  }>;
  profil?: string;
  profilColor?: string;
}

// ── Alur Schema ────────────────────────────────────────────────

export interface AlurBlock extends BaseBlock {
  type: 'alur';
  title: string;
  totalDurasi?: string;
  steps: Array<{
    dot: string;     // Color token
    durasi: string;
    judul: string;
    deskripsi: string;
  }>;
}

// ── Skenario Schema ────────────────────────────────────────────

export interface SkenarioBlock extends BaseBlock {
  type: 'skenario';
  title: string;
  chapters: Array<{
    id: string;
    charEmoji: string;
    title: string;
    setup?: Array<{
      speaker: string;
      text: string;
    }>;
    choicePrompt?: string;
    choices: Array<{
      icon: string;
      label: string;
      detail?: string;
      good: boolean;
      pts: number;
      level: 'good' | 'mid' | 'bad';
      resultTitle?: string;
      resultBody?: string;
      feedbackGood?: string;
      feedbackBad?: string;
      norma?: string;
      consequences?: Array<{
        icon: string;
        text: string;
      }>;
      nextChapter?: number;
    }>;
  }>;
}

// ── Materi Content Block Schemas ───────────────────────────────

export interface DefBoxBlock extends BaseBlock {
  type: 'def-box';
  borderColor?: string;  // Token key, default 'y'
  content: string;
}

export interface NcGridBlock extends BaseBlock {
  type: 'nc-grid';
  cards: Array<{
    icon: string;
    title: string;
    body: string;
    color: string;  // Token key
  }>;
}

export interface FlashcardSetBlock extends BaseBlock {
  type: 'flashcard-set';
  cards: Array<{
    q: string;
    a: string;
  }>;
}

export interface FtabBlock extends BaseBlock {
  type: 'ftab';
  tabs: Array<{
    icon: string;
    label: string;
    content: SchemaBlock[];
  }>;
  showReadMarker?: boolean;
  showProgress?: boolean;
}

export interface NormaKartuBlock extends BaseBlock {
  type: 'nk-card';
  normaType: string;  // 'agama' | 'kesusilaan' | 'kesopanan' | 'hukum'
  icon: string;
  title: string;
  label: string;
  definition: string;
  characteristics: Array<{
    label: string;
    value: string;
  }>;
  sanksi: {
    title: string;
    items: Array<{
      dot: string;
      text: string;
    }>;
  };
  contoh: string;
  pelanggaran?: {
    title: string;
    items: Array<{
      icon: string;
      text: string;
    }>;
  };
}

// ── Materi Section Schema (BSNP-compliant) ──────────────────────

export interface MateriSectionBlock extends BaseBlock {
  type: 'materi-section';
  title: string;
  subtitle?: string;
  /** BSNP compliance badge — shows "WAJIB BSNP" when true */
  bsnpRequired?: boolean;
  /** Section icon emoji */
  icon?: string;
  /** Color accent token key */
  accentColor?: string;
  /** Content blocks within this section */
  content: SchemaBlock[];
  /** Key takeaways at the bottom */
  takeaways?: string[];
  /** "Apa yang sudah kamu pelajari?" self-check prompt */
  selfCheck?: string;
}

// ── Diskusi Schema ─────────────────────────────────────────────

export interface DiskusiBlock extends BaseBlock {
  type: 'diskusi';
  title: string;
  intro?: string;
  questions: Array<{
    label: string;
    icon: string;
    teks: string;
    petunjuk: string;
    color?: string;
  }>;
  kelompok?: Array<{
    icon: string;
    label: string;
    judul: string;
    isi: string;
    color: string;
  }>;
}

// ── Kuis/Game Schema ───────────────────────────────────────────

export interface KuisBlock extends BaseBlock {
  type: 'kuis';
  title: string;
  questions: Array<{
    q: string;
    opts: string[];
    ans: number;
    ex: string;
    /** Pertemuan ke berapa (1-based), undefined = tanpa tag / semua pertemuan */
    pertemuan?: number;
  }>;
}

export interface SortirGameBlock extends BaseBlock {
  type: 'sortir-game';
  title: string;
  pool: Array<{
    id: string;
    text: string;
    category: string;
  }>;
  kolom: Array<{
    id: string;
    label: string;
    color: string;
  }>;
}

export interface RodaGameBlock extends BaseBlock {
  type: 'roda-game';
  title: string;
  questions: Array<{
    q: string;
    diskusiHint?: string;
    opts: Array<{
      text: string;
      correct: boolean;
    }>;
    feedbackCorrect?: string;
    feedbackWrong?: string;
  }>;
}

// ── Memory Game Schema ─────────────────────────────────────────

export interface MemoryGameBlock extends BaseBlock {
  type: 'memory-game';
  title: string;
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

// ── Matching Game Schema ──────────────────────────────────────

export interface MatchingGameBlock extends BaseBlock {
  type: 'matching-game';
  title: string;
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

// ── Fill-Blank Game Schema ────────────────────────────────────

export interface FillBlankGameBlock extends BaseBlock {
  type: 'fill-blank-game';
  title: string;
  questions: Array<{
    text: string;
    answer: string;
    hint?: string;
  }>;
}

// ── Word Search Game Schema ────────────────────────────────────

export interface WordSearchGameBlock extends BaseBlock {
  type: 'word-search-game';
  title: string;
  words: string[];
  gridSize?: number;
}

// ── True/False Game Schema ─────────────────────────────────────

export interface TrueFalseGameBlock extends BaseBlock {
  type: 'true-false-game';
  title: string;
  questions: Array<{
    text: string;
    correct: boolean;
    explanation?: string;
  }>;
}

// ── Drag & Drop Game Schema ────────────────────────────────────

export interface DragDropGameBlock extends BaseBlock {
  type: 'drag-drop-game';
  title: string;
  items: Array<{
    text: string;
    target: string;
  }>;
  targets: Array<{
    id: string;
    label: string;
    color?: string;
  }>;
}

// ── Crossword Game Schema ─────────────────────────────────────

export interface CrosswordGameBlock extends BaseBlock {
  type: 'crossword-game';
  title: string;
  words: Array<{
    teks: string;
    hint: string;
    arah?: 'across' | 'down';
    baris?: number;
    kolom?: number;
  }>;
  gridSize?: number;
}

// ── Team Buzzer Game Schema ────────────────────────────────────

export interface TeamBuzzerGameBlock extends BaseBlock {
  type: 'team-buzzer-game';
  title: string;
  teamA: string;
  teamB: string;
  questions: Array<{
    teks: string;
    poin: number;
  }>;
}

// ── Hasil Schema ───────────────────────────────────────────────

export interface HasilBlock extends BaseBlock {
  type: 'hasil';
  title: string;
  subtitle: string;
}

// ── Refleksi Schema ────────────────────────────────────────────

export interface RefleksiBlock extends BaseBlock {
  type: 'refleksi';
  title: string;
  intro?: string;
  questions: Array<{
    teks: string;
    petunjuk: string;
    warna?: string;
    icon?: string;
  }>;
  penugasan?: {
    judul: string;
    isi: string;
    contoh?: string;
  };
}

// ── Penutup Schema ─────────────────────────────────────────────

export interface PenutupBlock extends BaseBlock {
  type: 'penutup';
  title: string;
  subtitle: string;
  preview: Array<{
    icon: string;
    judul: string;
    isi: string;
    warna: string;
  }>;
  nextPertemuan?: {
    judul: string;
    deskripsi: string;
    items: Array<{
      icon: string;
      judul: string;
      isi: string;
      warna: string;
    }>;
  };
}

// ── Tabel Schema ───────────────────────────────────────────────

export interface TabelBlock extends BaseBlock {
  type: 'tabel';
  title?: string;
  headers: string[];
  rows: string[][];
  accentColor?: string;
}

// ── Gambar Schema ──────────────────────────────────────────────

export interface GambarBlock extends BaseBlock {
  type: 'gambar';
  title?: string;
  url: string;
  caption?: string;
  accentColor?: string;
}

// ── Timeline Schema ────────────────────────────────────────────

export interface TimelineBlock extends BaseBlock {
  type: 'timeline';
  title?: string;
  steps: Array<{
    icon: string;
    label: string;
    description: string;
    color: string;
  }>;
  accentColor?: string;
}

// ── Checklist Schema ───────────────────────────────────────────

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  title?: string;
  items: Array<{
    text: string;
    checked?: boolean;
  }>;
  accentColor?: string;
}

// ── Statistik Schema ───────────────────────────────────────────

export interface StatistikBlock extends BaseBlock {
  type: 'statistik';
  title?: string;
  items: Array<{
    angka: string;
    satuan?: string;
    label: string;
    warna: string;
  }>;
  accentColor?: string;
}

// ── Studi Schema ───────────────────────────────────────────────

export interface StudiBlock extends BaseBlock {
  type: 'studi';
  title?: string;
  karakter?: string;
  situasi: string;
  pertanyaan: string;
  pesan?: string;
  accentColor?: string;
}

// ── Tabel Accordion Schema ─────────────────────────────────────

export interface TabelAccordionBlock extends BaseBlock {
  type: 'tabel-accord';
  rows: Array<{
    icon: string;
    title: string;
    color: string;
    details: Array<{
      label: string;
      value: string;
    }>;
  }>;
}

// ── Tujuan Display Schema (BSNP — student-facing TP) ───────────

export interface TujuanDisplayBlock extends BaseBlock {
  type: 'tujuan-display';
  title: string;
  subtitle?: string;
  /** BSNP compliance badge */
  bsnpRequired?: boolean;
  /** Learning objectives displayed to students */
  objectives: Array<{
    icon: string;
    text: string;
    color: string;  // Token key
  }>;
  /** Profil Pelajar Pancasila connection */
  profil?: string;
  profilColor?: string;
}

// ── Motivasi Schema (BSNP — Apersepsi / motivation hook) ────────

export interface MotivasiBlock extends BaseBlock {
  type: 'motivasi';
  title: string;
  /** BSNP compliance badge */
  bsnpRequired?: boolean;
  /** Hook question to grab attention */
  hookQuestion: string;
  /** Visual/media element */
  visual?: {
    emoji: string;
    bgGradient?: [string, string]; // [color1, color2] token keys
  };
  /** Connection points to prior knowledge */
  connections: Array<{
    icon: string;
    label: string;
    description: string;
    color: string;  // Token key
  }>;
  /** Transition statement to the main content */
  transition?: string;
}

// ── Rangkuman Schema (BSNP — Summary / reinforcement) ──────────

export interface RangkumanBlock extends BaseBlock {
  type: 'rangkuman';
  title: string;
  /** BSNP compliance badge */
  bsnpRequired?: boolean;
  /** Key concept cards */
  concepts: Array<{
    icon: string;
    title: string;
    body: string;
    color: string;  // Token key
  }>;
  /** Final takeaway / closing statement */
  closingStatement?: string;
  /** Accent color token key */
  accentColor?: string;
}

// ── Hero Schema ───────────────────────────────────────────────
// Hero uses the same data model as Cover but with type: 'hero'.
// This enables separate BlockDefinitionRegistry entry + variant support.

export type HeroBlock = Omit<CoverBlock, 'type'> & { type: 'hero' };

// ── Block Variant Type ──────────────────────────────────────────

export type BlockVariant = 'A' | 'B' | 'C';

// ── Container Reference ─────────────────────────────────────────
// Used by transaction system to reference where a block lives.

export interface ContainerRef {
  type: 'root' | 'materi-section' | 'ftab' | 'children';
  id?: string;
  tabIndex?: number;
}

// ── Schema Operation ────────────────────────────────────────────
// Describes a single mutation step in a transaction.

export type SchemaOperation =
  | { type: 'insert-block'; block: SchemaBlock; container: ContainerRef; index?: number }
  | { type: 'remove-block'; blockId: string }
  | { type: 'move-block'; blockId: string; from: ContainerRef; to: ContainerRef; index?: number }
  | { type: 'update-block'; blockId: string; changes: Partial<SchemaBlock> }
  | { type: 'duplicate-block'; blockId: string; container?: ContainerRef }
  | { type: 'change-variant'; blockId: string; variant: BlockVariant }
  | { type: 'split-scene'; splitIndex: number }
  | { type: 'merge-scene'; sourcePageId: string };

// ── Transaction Result ──────────────────────────────────────────

export interface TransactionResult {
  success: boolean;
  schema: ScreenSchema;
  errors: string[];
  warnings: import('./validation').ValidationError[];
}

// ── Union Type ─────────────────────────────────────────────────

export type SchemaBlock =
  | CoverBlock
  | HeroBlock
  | PetunjukBlock
  | TpBlock
  | AlurBlock
  | SkenarioBlock
  | DefBoxBlock
  | NcGridBlock
  | FlashcardSetBlock
  | FtabBlock
  | NormaKartuBlock
  | MateriSectionBlock
  | DiskusiBlock
  | KuisBlock
  | SortirGameBlock
  | RodaGameBlock
  | MemoryGameBlock
  | MatchingGameBlock
  | FillBlankGameBlock
  | WordSearchGameBlock
  | TrueFalseGameBlock
  | DragDropGameBlock
  | HasilBlock
  | RefleksiBlock
  | PenutupBlock
  | TabelBlock
  | GambarBlock
  | TimelineBlock
  | ChecklistBlock
  | StatistikBlock
  | StudiBlock
  | TabelAccordionBlock
  | TujuanDisplayBlock
  | MotivasiBlock
  | RangkumanBlock
  | CrosswordGameBlock
  | TeamBuzzerGameBlock
  | BaseBlock;

// ── Screen Schema ──────────────────────────────────────────────

export interface ScreenSchema {
  /** Unique screen ID */
  id: string;
  /** Schema version for future migration tracking */
  version?: number;
  /** Maps to PageTemplateType */
  templateType: string;
  /** Section label chip */
  sectionLabel?: string;
  /** Section label color token */
  sectionColor?: string;
  /** Screen blocks in order */
  blocks: SchemaBlock[];
  /** Navigation targets and config */
  nav?: {
    prev?: string;
    next?: string;
    nextLabel?: string;
    /** Navbar configuration (from auto-generate blueprint) */
    navbar?: Record<string, unknown>;
    /** Timer configuration (from auto-generate blueprint) */
    timer?: Record<string, unknown>;
  };
  /** Background style */
  background?: {
    type: 'solid' | 'gradient' | 'radial';
    color1?: string;
    color2?: string;
    /** Background image URL — rendered as cover image behind content */
    imageUrl?: string;
    /** Dark overlay opacity (0–60) for image readability */
    overlay?: number;
  };
}

// ── Lesson Schema (full lesson = multiple screens) ─────────────

export interface LessonSchema {
  /** Lesson ID */
  id: string;
  /** Schema version for future migration tracking — start at 1 */
  version: number;
  /** Lesson title */
  title: string;
  /** Subject */
  mapel: string;
  /** Class */
  kelas: string;
  /** Theme preset ID */
  themeId: string;
  /** Ordered screens */
  screens: ScreenSchema[];
  /** Navbar config */
  navbar?: {
    logoText: string;
    logoColor: string;
    progressGradient: [string, string]; // [start, end] token keys
  };
}
