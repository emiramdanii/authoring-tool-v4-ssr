// ═══════════════════════════════════════════════════════════════════
// BLOCK TYPES — All specific block interface definitions
// ═══════════════════════════════════════════════════════════════════

import type { BaseBlock } from './base';

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

// ── CP (Capaian Pembelajaran) Schema ────────────────────────────

export interface CpBlock extends BaseBlock {
  type: 'cp';
  /** Elemen CP (e.g., "Pancasila") */
  elemen: string;
  /** Sub-elemen (e.g., "Pemahaman norma dan nilai") */
  subElemen: string;
  /** Full capaian fase narrative */
  capaianFase: string;
  /** Profil Pelajar Pancasila tags */
  profil: string[];
  /** Fase (e.g., "D") */
  fase?: string;
  /** Kelas (e.g., "VII") */
  kelas?: string;
}

// ── ATP (Alur Tujuan Pembelajaran) Schema ──────────────────────

export interface AtpBlock extends BaseBlock {
  type: 'atp';
  /** Nama bab / unit */
  namaBab: string;
  /** Jumlah pertemuan */
  jumlahPertemuan: number;
  /** Detail per pertemuan */
  pertemuan: Array<{
    judul: string;
    tp: string;
    durasi: string;
    kegiatan: string;
    penilaian: string;
  }>;
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
    content: import('./schema').SchemaBlock[];
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

// ── Materi Content Tab ─────────────────────────────────────────

/**
 * A tab within a MateriSectionBlock.
 * When present, content is organized into named tabs
 * instead of a single flat array.
 */
export interface MateriContentTab {
  /** Unique ID for the tab */
  id: string;
  /** Display label (e.g., "Definisi", "Contoh") */
  label: string;
  /** Optional icon name */
  icon?: string;
  /** Blocks within this tab */
  content: import('./schema').SchemaBlock[];
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
  content: import('./schema').SchemaBlock[];
  /** NEW: Tab-grouped content. When present, renderer shows tab bar.
   *  When absent, flat content is used (backward compatible). */
  tabs?: MateriContentTab[];
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

// ── Tabel Schema ──────────────────────────────────────────────

export interface TabelBlock extends BaseBlock {
  type: 'tabel';
  title?: string;
  headers: string[];
  rows: string[][];
  accentColor?: string;
}

// ── Timeline Schema ───────────────────────────────────────────

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

// ── Compare Schema ────────────────────────────────────────────

export interface CompareBlock extends BaseBlock {
  type: 'compare';
  title?: string;
  kiri?: {
    icon?: string;
    judul?: string;
    isi?: string;
  };
  kanan?: {
    icon?: string;
    judul?: string;
    isi?: string;
  };
  accentColor?: string;
}

// ── Gambar Schema ─────────────────────────────────────────────

export interface GambarBlock extends BaseBlock {
  type: 'gambar';
  title?: string;
  url: string;
  caption?: string;
  accentColor?: string;
}

// ── Reveal Schema ─────────────────────────────────────────────

export interface RevealBlock extends BaseBlock {
  type: 'reveal';
  title?: string;
  coverIcon?: string;
  coverText?: string;
  revealIcon?: string;
  revealContent?: string;
  accentColor?: string;
}

// ── Checklist Schema ──────────────────────────────────────────

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  title?: string;
  items: Array<{
    text: string;
    checked?: boolean;
  }>;
  accentColor?: string;
}

// ── Statistik Schema ──────────────────────────────────────────

export interface StatistikBlock extends BaseBlock {
  type: 'statistik';
  title?: string;
  items: Array<{
    warna: string;
    angka: string;
    satuan?: string;
    label: string;
    icon?: string;
  }>;
  accentColor?: string;
}

// ── Studi (Case Study) Schema ─────────────────────────────────

export interface StudiBlock extends BaseBlock {
  type: 'studi';
  title?: string;
  karakter?: string;
  situasi: string;
  pertanyaan?: string;
  pesan?: string;
  accentColor?: string;
}

// ── Tab Icons Schema (Interactive tabs with icons) ────────────
// Phase 5-G: Presentation module — previously AuthoringStore Module type 'tab-icons'.
// Different from FtabBlock which uses nested SchemaBlock[] content;
// this uses flat text fields (isi, poin, refleksi) per tab.

export interface TabIconsBlock extends BaseBlock {
  type: 'tab-icons';
  title: string;
  intro?: string;
  /** Layout variant: horizontal, vertical, pills */
  layoutVariant?: 'horizontal' | 'vertical' | 'pills';
  /** Animation style for tab switching */
  animation?: 'fade' | 'slide-up' | 'zoom' | 'bounce';
  tabs: Array<{
    icon: string;
    judul: string;
    warna: string;
    isi: string;
    poin?: string[];
    refleksi?: string;
  }>;
  accentColor?: string;
}

// ── Accordion Schema (Expandable sections) ────────────────────
// Phase 5-G: Presentation module — previously AuthoringStore Module type 'accordion'.
// Different from TabelAccordionBlock which has table-like label/value details;
// this uses simple icon/judul/isi items.

export interface AccordionBlock extends BaseBlock {
  type: 'accordion';
  title: string;
  intro?: string;
  items: Array<{
    icon: string;
    judul: string;
    isi: string;
  }>;
  accentColor?: string;
}

// ── Infografis Schema (Visual info cards) ─────────────────────
// Phase 5-G: Presentation module — previously AuthoringStore Module type 'infografis'.
// No prior schema equivalent — this is a brand new block type.

export interface InfografisBlock extends BaseBlock {
  type: 'infografis';
  title: string;
  intro?: string;
  /** Layout variant: grid, list, timeline */
  layoutVariant?: 'grid' | 'list' | 'timeline';
  kartu: Array<{
    icon: string;
    judul: string;
    isi: string;
    warna?: string;
  }>;
  accentColor?: string;
}

// ── MateriBlok (Legacy) Schema ────────────────────────────────
// Used by MateriBlokRenderer inside MateriSection content

export type MateriBlokTipe =
  | 'teks' | 'definisi' | 'poin' | 'tabel' | 'kutipan'
  | 'gambar' | 'timeline' | 'highlight' | 'compare'
  | 'infobox' | 'checklist' | 'statistik' | 'studi';

export interface MateriBlokBlock extends BaseBlock {
  type: 'materi-blok';
  tipe: MateriBlokTipe;
  judul?: string;
  isi?: string;
  butir?: string[];
  baris?: string[][];
  karakter?: string;
  warna?: string;
  icon?: string;
  kiri?: { icon?: string; judul?: string; isi?: string };
  kanan?: { icon?: string; judul?: string; isi?: string };
  langkah?: Array<{ icon?: string; judul: string; isi?: string }>;
  situasi?: string;
  pertanyaan?: string;
  pesan?: string;
  /** Infobox style variant: info / tips / warning / success */
  infoboxStyle?: string;
  /** Legacy style field (maps to infoboxStyle for backward compat) — NOT BaseBlock.style */
  blockStyle?: string;
  items?: Array<{ warna: string; angka: string; satuan?: string; label: string; icon?: string }>;
  accentColor?: string;
  /** Pertemuan ke berapa (1-based), undefined = semua pertemuan */
  pertemuan?: number;
  /** Group name for tab organization — blocks with same tabGroup go into the same tab */
  tabGroup?: string;
}
