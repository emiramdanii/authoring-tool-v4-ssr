// ═══════════════════════════════════════════════════════════════════
// SCHEMA TYPES — Schema-level types (union, screen, lesson)
// ═══════════════════════════════════════════════════════════════════

import type {
  CoverBlock,
  HeroBlock,
  PetunjukBlock,
  TpBlock,
  CpBlock,
  AtpBlock,
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
  TabIconsBlock,
  AccordionBlock,
  InfografisBlock,
} from './blocks';

import type { BaseBlock } from './base';

// ── Union Type ─────────────────────────────────────────────────

export type SchemaBlock =
  | CoverBlock
  | HeroBlock
  | PetunjukBlock
  | TpBlock
  | CpBlock
  | AtpBlock
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
  | TabIconsBlock
  | AccordionBlock
  | InfografisBlock
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
  /** Phase 7 — Learning scene type override.
   *  When set, overrides the inferred sceneType from templateType.
   *  Allows teachers to explicitly control scene-aware rendering:
   *    - Typography hierarchy (hero/title/body sizes)
   *    - Accent prominence (which colors are "vocal" vs "muted")
   *    - Emotional profile (progress/discovery/reward triggers)
   *    - Spacing density (intensity-driven rhythm)
   *    - Card/header treatment (elevated/flat/subtle)
   *  If not set, sceneType is inferred from templateType via inferSceneType(). */
  sceneType?: import('../../edu/education-scene-types').SceneType;
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
    /** Overlay opacity (0–80) for image readability. Default 40. */
    overlay?: number;
    /** Sprint 1G: Image fit mode. Default 'cover'. */
    imageFit?: 'cover' | 'contain';
    /** Sprint 1G: Image opacity (0–100). Default 100. */
    imageOpacity?: number;
    /** Sprint 1G: Image blur radius in px (0–20). Default 0. */
    imageBlur?: number;
    /** Sprint 1G: Overlay type — determines overlay color/gradient.
     *  'dark': dark scrim (rgba(0,0,0,...)) — for light images or dark-themed content
     *  'light': light scrim (rgba(255,255,255,...)) — for dark images with light content
     *  'gradient': bottom gradient scrim for text readability on varied backgrounds
     *  Default: 'dark' */
    overlayType?: 'dark' | 'light' | 'gradient';
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
