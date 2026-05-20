// ═══════════════════════════════════════════════════════════════════
// FULL LESSON — Orchestration: generates all schema blocks for a complete lesson
// ═══════════════════════════════════════════════════════════════════

import type { ParseResult } from '@/components/authoring/auto-generate/types';
import type {
  SchemaBlock,
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  MotivasiBlock,
  TujuanDisplayBlock,
  SkenarioBlock,
  KuisBlock,
  FlashcardSetBlock,
  DiskusiBlock,
  RefleksiBlock,
  RangkumanBlock,
  HasilBlock,
  PenutupBlock,
} from '../types';
import { assertValidBlocks } from '../validation';
// Pendahuluan phase generators
import {
  genCoverSchema,
  genPetunjukSchema,
  genTpSchema,
  genAlurSchema,
  genMotivasiSchema,
  genTujuanDisplaySchema,
} from './pendahuluan';
// Inti (core) phase generators
import {
  genMateriSchema,
  genSkenarioSchema,
  genKuisSchema,
  genFlashcardSchema,
  genDiskusiSchema,
} from './inti';
// Penutup (closing) phase generators
import {
  genRefleksiSchema,
  genRangkumanSchema,
  genHasilSchema,
  genPenutupSchema,
} from './penutup';

// ═══════════════════════════════════════════════════════════════════
// FULL LESSON — Generate all schema blocks for a complete lesson
// ═══════════════════════════════════════════════════════════════════

export interface FullLessonSchema {
  cover: CoverBlock;
  petunjuk?: PetunjukBlock;
  tp: TpBlock;
  alur?: AlurBlock;
  motivasi?: MotivasiBlock;
  tujuan?: TujuanDisplayBlock;
  materi: SchemaBlock[];
  skenario?: SkenarioBlock;
  kuis: KuisBlock;
  flashcard?: FlashcardSetBlock;
  diskusi: DiskusiBlock;
  refleksi: RefleksiBlock;
  rangkuman?: RangkumanBlock;
  hasil: HasilBlock;
  penutup: PenutupBlock;
}

export function genFullLessonSchema(
  parsed: ParseResult,
  meta: { namaBab?: string; kelas?: string; mapel?: string; durasi?: string; ikon?: string; judulPertemuan?: string },
  opts: { pertemuan: number; bloomMax: number; jumlahKuis: number },
  petunjukLangkah?: Array<{ icon: string; judul: string; isi: string }>,
  tp?: Array<{ desc: string }>,
): FullLessonSchema {
  const result: FullLessonSchema = {
    cover: genCoverSchema(meta),
    petunjuk: petunjukLangkah?.length ? genPetunjukSchema(petunjukLangkah) : undefined,
    tp: genTpSchema(parsed, opts),
    alur: genAlurSchema(parsed, opts, meta),
    motivasi: genMotivasiSchema(parsed, meta),
    tujuan: genTujuanDisplaySchema(parsed, opts),
    materi: genMateriSchema(parsed, { judulPertemuan: meta.judulPertemuan || '', namaBab: meta.namaBab || '' }),
    skenario: genSkenarioSchema(parsed, meta),
    kuis: genKuisSchema(parsed, opts.jumlahKuis, opts.pertemuan),
    flashcard: genFlashcardSchema(parsed),
    diskusi: genDiskusiSchema(parsed, tp || [], { judulPertemuan: meta.judulPertemuan || '', namaBab: meta.namaBab || '' }),
    refleksi: genRefleksiSchema(parsed, { judulPertemuan: meta.judulPertemuan || '', namaBab: meta.namaBab || '' }),
    rangkuman: genRangkumanSchema(parsed, meta),
    hasil: genHasilSchema(),
    penutup: genPenutupSchema(meta),
  };

  // Validate all generated blocks in dev mode
  // This catches generator bugs before they reach the canvas
  if (process.env.NODE_ENV !== 'production') {
    const allBlocks: SchemaBlock[] = [
      result.cover, result.petunjuk, result.tp, result.alur,
      result.motivasi, result.tujuan, ...result.materi,
      result.skenario, result.kuis, result.flashcard,
      result.diskusi, result.refleksi, result.rangkuman,
      result.hasil, result.penutup,
    ].filter(Boolean) as SchemaBlock[];
    assertValidBlocks(allBlocks, 'genFullLessonSchema');
  }

  return result;
}
