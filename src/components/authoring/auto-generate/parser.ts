// ═══════════════════════════════════════════════════════════════════
// Parser — Extracts structured data from raw text
// ═══════════════════════════════════════════════════════════════════

import type { ParseResult } from './types';
import { STOP_WORDS } from './constants';

export function parse(text: string): ParseResult {
  // Split into sentences
  const raw = text.replace(/\n+/g, ' ').trim();
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Extract words
  const allWords = raw
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Word frequencies
  const freq = new Map<string, number>();
  for (const w of allWords) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const topWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);

  // Definitions: "X adalah/merupakan/yaitu/ialah Y"
  const defRegex = /([A-Z][^\s,.:;]{1,40})\s+(?:adalah|merupakan|yaitu|ialah)\s+([^.]+)/g;
  const definitions: { term: string; meaning: string }[] = [];
  let m;
  while ((m = defRegex.exec(raw)) !== null) {
    definitions.push({ term: m[1].trim(), meaning: m[2].trim() });
  }

  // Enumerations: "terdiri dari/meliputi/antara lain X, Y, Z"
  const enumRegex = /([^.]+?)\s+(?:terdiri dari|meliputi|antara lain)\s+([^.]+)/gi;
  const enumerations: { subject: string; items: string[] }[] = [];
  while ((m = enumRegex.exec(raw)) !== null) {
    const items = m[2]
      .split(/[,;]\s*/)
      .map((s) => s.replace(/^(?:yaitu|yakni|ialah)\s+/i, '').trim())
      .filter(Boolean);
    if (items.length >= 2) {
      enumerations.push({ subject: m[1].trim(), items });
    }
  }

  // Functions: "berfungsi/berperan/berguna/bertujuan untuk X"
  const funcRegex = /([^.]+?)\s+(?:berfungsi|berperan|berguna|bertujuan)\s+(?:sebagai|untuk|dalam)?\s*([^.]+)/gi;
  const functions: { subject: string; desc: string }[] = [];
  while ((m = funcRegex.exec(raw)) !== null) {
    functions.push({ subject: m[1].trim(), desc: m[2].trim() });
  }

  // Causes: "karena/sehingga/akibat/menyebabkan X"
  const causeRegex = /([^.]*?(?:karena|akibat|menyebabkan|sehingga)[^.]+)/gi;
  const causes: { cause: string; effect: string }[] = [];
  while ((m = causeRegex.exec(raw)) !== null) {
    const clause = m[1].trim();
    const sep = clause.match(/(?:karena|akibat|menyebabkan|sehingga)/i);
    if (sep) {
      const idx = clause.toLowerCase().indexOf(sep[0].toLowerCase());
      causes.push({
        cause: clause.slice(0, idx).trim(),
        effect: clause.slice(idx + sep[0].length).trim(),
      });
    }
  }

  return {
    sentences,
    words: allWords,
    topWords,
    wordCount: allWords.length,
    definitions,
    enumerations,
    functions,
    causes,
  };
}
