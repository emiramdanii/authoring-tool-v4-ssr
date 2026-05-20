// ═══════════════════════════════════════════════════════════════════
// TYPES BARREL — Re-exports everything from sub-modules
// ═══════════════════════════════════════════════════════════════════
// This preserves the public API so `from '../types'` still works.

export type {
  BlockLayout,
  CompressionHints,
  SemanticHints,
  BaseBlock,
  BlockVariant,
  ContainerRef,
  SchemaOperation,
  TransactionResult,
} from './base';

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
} from './blocks';

export type {
  SchemaBlock,
  ScreenSchema,
  LessonSchema,
} from './schema';
