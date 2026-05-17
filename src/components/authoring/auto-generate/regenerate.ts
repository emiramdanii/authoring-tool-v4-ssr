// ═══════════════════════════════════════════════════════════════════
// Regenerate Utility — Re-generate content from stored auto-gen text
// ═══════════════════════════════════════════════════════════════════
// Two pipelines exist side-by-side:
//
//   1. AUTHORING STORE pipeline (original):
//      ParseResult → MateriBlok[] / KuisItem[] / … → Authoring Store
//
//   2. SCHEMA-FIRST pipeline (new):
//      ParseResult → SchemaBlock[] → page.schema → Canvas Renderer
//
// The schema-first pipeline writes SchemaBlock[] directly to canvas
// pages, bypassing the Authoring Store → TemplateAdapter detour.
// Both pipelines are kept for backward compatibility.
// ═══════════════════════════════════════════════════════════════════

import { parse } from './parser';
import type { ParseResult } from './types';
import { genMateri, genDiskusi, genRefleksi, genSkenario, genKuis } from './generators';
import type { MateriBlok, DiskusiData, DiskusiPertanyaan, RefleksiData, RefleksiPertanyaan, KuisItem } from '@/store/authoring-store';
import type { SkenarioChapter as AutoGenSkenarioChapter } from './types';
import {
  genMateriSchema,
  genKuisSchema,
  genDiskusiSchema,
  genRefleksiSchema,
  genSkenarioSchema,
} from '@/core/schema/generators';
import { applyBlocksToPages, applyBlockToPages } from '@/core/schema/schema-apply';
import type { SchemaBlock } from '@/core/schema/types';

/** localStorage key used by the auto-generate hook */
const STORAGE_KEY = 'silse-autogen-text';

/** Minimum text length required for regeneration */
const MIN_TEXT_LENGTH = 50;

/**
 * Read the stored auto-generate text from localStorage.
 * Returns null if no text or text is too short.
 */
export function getStoredText(): string | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text && text.trim().length >= MIN_TEXT_LENGTH) return text;
  } catch { /* ignore */ }
  return null;
}

/**
 * Parse stored text into a ParseResult.
 * Returns null if no valid text stored.
 */
export function parseStoredText(): ParseResult | null {
  const text = getStoredText();
  if (!text) return null;
  return parse(text);
}

/**
 * Re-generate materi bloks from stored text.
 * Returns null if no valid source text.
 */
export function regenerateMateri(meta: { judulPertemuan: string; namaBab: string }): MateriBlok[] | null {
  const parsed = parseStoredText();
  if (!parsed) return null;
  return genMateri(parsed, meta);
}

/**
 * Re-generate skenario from stored text.
 * Returns null if no valid source text.
 */
export function regenerateSkenario(meta: { namaBab?: string }): AutoGenSkenarioChapter[] | null {
  const parsed = parseStoredText();
  if (!parsed) return null;
  return genSkenario(parsed, meta);
}

/**
 * Re-generate kuis from stored text.
 * Returns null if no valid source text.
 */
export function regenerateKuis(jumlah: number, jumlahPertemuan: number): KuisItem[] | null {
  const parsed = parseStoredText();
  if (!parsed) return null;
  return genKuis(parsed, jumlah, jumlahPertemuan);
}

/**
 * Re-generate diskusi from stored text.
 * Returns null if no valid source text.
 */
export function regenerateDiskusi(
  tp: { desc: string }[],
  meta: { judulPertemuan: string; namaBab: string },
): DiskusiData | null {
  const parsed = parseStoredText();
  if (!parsed) return null;
  return genDiskusi(parsed, tp, meta);
}

/**
 * Re-generate refleksi from stored text.
 * Returns null if no valid source text.
 */
export function regenerateRefleksi(
  meta: { judulPertemuan: string; namaBab: string },
): RefleksiData | null {
  const parsed = parseStoredText();
  if (!parsed) return null;
  return genRefleksi(parsed, meta);
}

/**
 * Check if regeneration is possible (stored text exists and is long enough).
 */
export function canRegenerate(): boolean {
  return getStoredText() !== null;
}

// ═══════════════════════════════════════════════════════════════════
// SCHEMA-FIRST REGENERATE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
// These functions follow the NEW pipeline:
//   ParseResult → SchemaBlock[] → applyBlocksToPages / applyBlockToPages
//     → canvas page.schema updated directly
//
// They also return the generated SchemaBlock[] so the caller can
// optionally update the authoring store for backward compat.
// ═══════════════════════════════════════════════════════════════════

/**
 * Re-generate materi as SchemaBlock[] and apply directly to canvas pages.
 * Returns the schema blocks, or null if no valid source text.
 */
export function regenerateMateriSchema(
  meta: { judulPertemuan: string; namaBab: string },
): SchemaBlock[] | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const materiBlocks = genMateriSchema(parsed, meta);
  applyBlocksToPages('materi', materiBlocks);
  return materiBlocks;
}

/**
 * Re-generate skenario as a SkenarioBlock and apply directly to canvas pages.
 * Returns the schema block, or null if no valid source text.
 */
export function regenerateSkenarioSchema(
  meta: { namaBab?: string },
): SchemaBlock | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const skenarioBlock = genSkenarioSchema(parsed, meta);
  applyBlockToPages('skenario', skenarioBlock);
  return skenarioBlock;
}

/**
 * Re-generate kuis as a KuisBlock and apply directly to canvas pages.
 * Returns the schema block, or null if no valid source text.
 */
export function regenerateKuisSchema(
  jumlah: number,
  jumlahPertemuan: number,
): SchemaBlock | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const kuisBlock = genKuisSchema(parsed, jumlah, jumlahPertemuan);
  applyBlockToPages('kuis', kuisBlock);
  return kuisBlock;
}

/**
 * Re-generate diskusi as a DiskusiBlock and apply directly to canvas pages.
 * Returns the schema block, or null if no valid source text.
 */
export function regenerateDiskusiSchema(
  tp: Array<{ desc: string }>,
  meta: { judulPertemuan: string; namaBab: string },
): SchemaBlock | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const diskusiBlock = genDiskusiSchema(parsed, tp, meta);
  applyBlocksToPages('diskusi', [diskusiBlock]);
  return diskusiBlock;
}

/**
 * Re-generate refleksi as a RefleksiBlock and apply directly to canvas pages.
 * Returns the schema block, or null if no valid source text.
 */
export function regenerateRefleksiSchema(
  meta: { judulPertemuan: string; namaBab: string },
): SchemaBlock | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const refleksiBlock = genRefleksiSchema(parsed, meta);
  applyBlocksToPages('refleksi', [refleksiBlock]);
  return refleksiBlock;
}

// ═══════════════════════════════════════════════════════════════════
// PARTIAL SCOPED REGENERATE — Regenerate a SINGLE item, not full page
// ═══════════════════════════════════════════════════════════════════
// Phase 18.3: Teacher can regenerate just one question/block instead
// of replacing the entire section. This is the "partial scoped"
// regenerate — only the targeted item changes, everything else stays.
//
// Strategy:
//   1. Parse stored source text
//   2. Generate a full set of items
//   3. Pick a random item that's DIFFERENT from the current one
//   4. Return the new item for the caller to replace in the array
//
// The caller (Konten tab) is responsible for:
//   - Replacing the item at the target index in the projection (authoring store)
//   - Updating the corresponding schema block (canvas)
// ═══════════════════════════════════════════════════════════════════

/**
 * Regenerate a single kuis question.
 * Returns a new KuisItem to replace the one at `index`, or null.
 */
export function regenerateSingleKuisItem(
  index: number,
  jumlahPertemuan: number = 1,
): KuisItem | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  // Generate a fresh full set
  const fullSet = genKuis(parsed, 10, jumlahPertemuan);
  if (fullSet.length === 0) return null;

  // Pick a random item (prefer one different from index)
  const candidates = fullSet.filter((_, i) => i !== index % fullSet.length);
  const pick = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : fullSet[Math.floor(Math.random() * fullSet.length)];

  return pick;
}

/**
 * Regenerate a single diskusi question.
 * Returns a new DiskusiPertanyaan to replace the one at `index`, or null.
 */
export function regenerateSingleDiskusiQuestion(
  index: number,
  tp: Array<{ desc: string }>,
  meta: { judulPertemuan: string; namaBab: string },
): DiskusiPertanyaan | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const fullData = genDiskusi(parsed, tp, meta);
  if (fullData.pertanyaan.length === 0) return null;

  // Pick a random question (prefer one different from index)
  const candidates = fullData.pertanyaan.filter((_, i) => i !== index % fullData.pertanyaan.length);
  const pick = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : fullData.pertanyaan[Math.floor(Math.random() * fullData.pertanyaan.length)];

  return pick;
}

/**
 * Regenerate a single refleksi question.
 * Returns a new RefleksiPertanyaan to replace the one at `index`, or null.
 */
export function regenerateSingleRefleksiQuestion(
  index: number,
  meta: { judulPertemuan: string; namaBab: string },
): RefleksiPertanyaan | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  const fullData = genRefleksi(parsed, meta);
  if (fullData.pertanyaan.length === 0) return null;

  // Pick a random question (prefer one different from index)
  const candidates = fullData.pertanyaan.filter((_, i) => i !== index % fullData.pertanyaan.length);
  const pick = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : fullData.pertanyaan[Math.floor(Math.random() * fullData.pertanyaan.length)];

  return pick;
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE: Regenerate ALL sections via schema-first pipeline
// ═══════════════════════════════════════════════════════════════════

/**
 * Regenerate all content sections and apply to canvas pages.
 * Uses schema-first pipeline — writes SchemaBlock[] directly to page.schema.
 * Also returns authoring store data for Konten editor backward compat.
 */
export function regenerateAllToSchema(opts: {
  jumlahKuis: number;
  jumlahPertemuan: number;
  meta: { judulPertemuan: string; namaBab: string };
  tp: Array<{ desc: string }>;
}): {
  materi: MateriBlok[] | null;
  kuis: KuisItem[] | null;
  diskusi: DiskusiData | null;
  refleksi: RefleksiData | null;
} | null {
  const parsed = parseStoredText();
  if (!parsed) return null;

  // Generate schema blocks and apply to canvas
  const materiBlocks = genMateriSchema(parsed, opts.meta);
  applyBlocksToPages('materi', materiBlocks);

  const kuisBlock = genKuisSchema(parsed, opts.jumlahKuis, opts.jumlahPertemuan);
  applyBlockToPages('kuis', kuisBlock);

  const diskusiBlock = genDiskusiSchema(parsed, opts.tp, opts.meta);
  applyBlocksToPages('diskusi', [diskusiBlock]);

  const refleksiBlock = genRefleksiSchema(parsed, opts.meta);
  applyBlocksToPages('refleksi', [refleksiBlock]);

  // Return authoring store data for backward compat (projection)
  return {
    materi: genMateri(parsed, opts.meta),
    kuis: genKuis(parsed, opts.jumlahKuis, opts.jumlahPertemuan),
    diskusi: genDiskusi(parsed, opts.tp, opts.meta),
    refleksi: genRefleksi(parsed, opts.meta),
  };
}
