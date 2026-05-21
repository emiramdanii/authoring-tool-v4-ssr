// ═══════════════════════════════════════════════════════════════════
// SCHEMA TYPES — Schema-level types (union, screen, lesson)
// ═══════════════════════════════════════════════════════════════════

import type {
  CoverBlock,
  HeroBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  FtabBlock,
  NormaKartuBlock,
  MateriSectionBlock,
  DiskusiBlock,
  KuisBlock,
  SortirGameBlock,
  RodaGameBlock,
  MemoryGameBlock,
  MatchingGameBlock,
  FillBlankGameBlock,
  WordSearchGameBlock,
  TrueFalseGameBlock,
  DragDropGameBlock,
  HasilBlock,
  RefleksiBlock,
  PenutupBlock,
  TabelAccordionBlock,
  TujuanDisplayBlock,
  MotivasiBlock,
  RangkumanBlock,
  CrosswordGameBlock,
  TeamBuzzerGameBlock,
  GambarBlock,
  TimelineBlock,
  CompareBlock,
  RevealBlock,
  TabelBlock,
  ChecklistBlock,
  StatistikBlock,
  StudiBlock,
  MateriBlokBlock,
} from './blocks';

import type { BaseBlock } from './base';

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
  | TabelAccordionBlock
  | TujuanDisplayBlock
  | MotivasiBlock
  | RangkumanBlock
  | CrosswordGameBlock
  | TeamBuzzerGameBlock
  | GambarBlock
  | TimelineBlock
  | CompareBlock
  | RevealBlock
  | TabelBlock
  | ChecklistBlock
  | StatistikBlock
  | StudiBlock
  | MateriBlokBlock
  | BaseBlock;

// ── Tab Definition ──────────────────────────────────────────────

export interface TabDefinition {
  /** Unique tab ID */
  id: string;
  /** Display label */
  label: string;
  /** Icon name (Lucide icon key — resolved by getTabIcon) */
  icon: string;
  /** Block IDs assigned to this tab */
  blockIds: string[];
}

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
  /** FASE 11A — Semantic section type (replaces templateType for visual decisions) */
  sectionType?: import('../../vcs/types').SectionType;
  /** FASE 11A — Layout grammar (visual structure, overrides templateType-derived default) */
  layoutGrammar?: import('../../vcs/types').LayoutGrammarKey;
  /** Screen blocks in order */
  blocks: SchemaBlock[];
  /** Tab definitions for icon navigation */
  tabs?: TabDefinition[];
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
