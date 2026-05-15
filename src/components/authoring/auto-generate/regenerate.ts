// ═══════════════════════════════════════════════════════════════════
// Regenerate Utility — Re-generate content from stored auto-gen text
// ═══════════════════════════════════════════════════════════════════

import { parse } from './parser';
import type { ParseResult } from './types';
import { genMateri, genDiskusi, genRefleksi, genSkenario, genKuis } from './generators';
import type { MateriBlok, DiskusiData, RefleksiData, KuisItem } from '@/store/authoring-store';
import type { SkenarioChapter as AutoGenSkenarioChapter } from './types';

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
