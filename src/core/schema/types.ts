// ═══════════════════════════════════════════════════════════════════
// TYPES — Re-exports from sub-modules
// ═══════════════════════════════════════════════════════════════════
// This file preserves the public API so `from '@/core/schema/types'`
// still works. All definitions live in the types/ sub-directory.

export type {
  BlockLayout,
  CompressionHints,
  SemanticHints,
  BaseBlock,
  BlockVariant,
  ContainerRef,
  SchemaOperation,
  TransactionResult,
} from './types/base';

export type {
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
  CrosswordGameBlock,
  TeamBuzzerGameBlock,
  HasilBlock,
  RefleksiBlock,
  PenutupBlock,
  TabelAccordionBlock,
  TujuanDisplayBlock,
  MotivasiBlock,
  RangkumanBlock,
  TabelBlock,
  TimelineBlock,
  CompareBlock,
  GambarBlock,
  RevealBlock,
  ChecklistBlock,
  StatistikBlock,
  StudiBlock,
  MateriBlokBlock,
  MateriBlokTipe,
  MateriContentTab,
} from './types/blocks';

export type {
  SchemaBlock,
  TabDefinition,
  ScreenSchema,
  LessonSchema,
} from './types/schema';
