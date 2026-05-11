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
  /** Z-index layer */
  zIndex?: number;
  /** Rotation in degrees */
  rotation?: number;
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
   */
  layout?: BlockLayout;
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

// ── Union Type ─────────────────────────────────────────────────

export type SchemaBlock =
  | CoverBlock
  | PetunjukBlock
  | TpBlock
  | AlurBlock
  | SkenarioBlock
  | DefBoxBlock
  | NcGridBlock
  | FlashcardSetBlock
  | FtabBlock
  | NormaKartuBlock
  | DiskusiBlock
  | KuisBlock
  | SortirGameBlock
  | RodaGameBlock
  | HasilBlock
  | RefleksiBlock
  | PenutupBlock
  | TabelAccordionBlock
  | BaseBlock;

// ── Screen Schema ──────────────────────────────────────────────

export interface ScreenSchema {
  /** Unique screen ID */
  id: string;
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
  };
}

// ── Lesson Schema (full lesson = multiple screens) ─────────────

export interface LessonSchema {
  /** Lesson ID */
  id: string;
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
