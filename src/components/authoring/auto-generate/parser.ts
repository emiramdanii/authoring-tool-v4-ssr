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

  // Enumerations: Multiple detection strategies
  const enumerations: { subject: string; items: string[] }[] = [];

  // Strategy 1: "terdiri dari/meliputi/antara lain X, Y, Z"
  const enumRegex1 = /([^.]+?)\s+(?:terdiri dari|meliputi|antara lain)\s+([^.]+)/gi;
  while ((m = enumRegex1.exec(raw)) !== null) {
    const items = m[2]
      .split(/[,;]\s*/)
      .map((s) => s.replace(/^(?:yaitu|yakni|ialah)\s+/i, '').trim())
      .filter(Boolean);
    if (items.length >= 2) {
      enumerations.push({ subject: m[1].trim(), items });
    }
  }

  // Strategy 2: Numbered lists — "1. Item - description" or "1) Item: description"
  // Detect groups of consecutive numbered items in the original text (not the flattened raw)
  const numberedListRegex = /(?:^|\n)\s*(\d+)\.\s+([^-\n]+?)(?:\s*[-–—:]\s*([^.\n]*))?/gm;
  const numberedGroups = new Map<string, { subject: string; items: string[] }>();
  const textLines = text.split('\n');
  let currentGroupSubject = '';
  let currentGroupItems: string[] = [];
  let lastNum = 0;

  for (const line of textLines) {
    const numMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const content = numMatch[2].trim();
      // Extract item name (before dash/colon) and optional description
      const itemMatch = content.match(/^([^–\-—:]+?)(?:\s*[-–—:]\s*(.+))?$/);
      const itemName = itemMatch ? itemMatch[1].trim() : content;

      if (num === 1 && lastNum !== 0) {
        // New group starting — save previous group
        if (currentGroupItems.length >= 2 && currentGroupSubject) {
          numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
        }
        currentGroupItems = [];
        currentGroupSubject = '';
      }

      // Try to find subject from lines above this numbered list
      if (num === 1) {
        const prevLines = textLines.slice(Math.max(0, textLines.indexOf(line) - 3), textLines.indexOf(line));
        for (const pl of prevLines.reverse()) {
          const subjectMatch = pl.match(/^(.+?):\s*$/);
          if (subjectMatch) {
            currentGroupSubject = subjectMatch[1].replace(/^(Jenis|Macam|Kategori|Bentuk|Ciri|Sifat|Contoh)\s*-?\s*/i, '$1 ').trim();
            break;
          }
        }
        if (!currentGroupSubject) {
          // Use a generic subject based on context
          currentGroupSubject = 'Daftar';
        }
      }

      currentGroupItems.push(itemName);
      lastNum = num;
    } else if (lastNum > 0 && line.trim().length > 0 && !line.match(/^\s*\d/)) {
      // Non-numbered line after numbered items — save the group
      if (currentGroupItems.length >= 2 && currentGroupSubject) {
        numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
      }
      currentGroupItems = [];
      currentGroupSubject = '';
      lastNum = 0;
    }
  }
  // Don't forget the last group
  if (currentGroupItems.length >= 2 && currentGroupSubject) {
    numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
  }

  for (const [, group] of numberedGroups) {
    enumerations.push(group);
  }

  // Strategy 3: Bullet/dash lists under a header ending with colon
  const bulletSectionRegex = /([A-Z][^.:\n]+?):\s*\n((?:\s*[-–—•*]\s+.+\n?)+)/gm;
  while ((m = bulletSectionRegex.exec(text)) !== null) {
    const subject = m[1].trim();
    const items = m[2]
      .split('\n')
      .map((l) => l.replace(/^\s*[-–—•*]\s+/, '').trim())
      .filter((l) => l.length > 0);
    if (items.length >= 2) {
      // Check we don't already have this enumeration
      const exists = enumerations.some((e) => e.subject === subject);
      if (!exists) {
        enumerations.push({ subject, items });
      }
    }
  }

  // Functions: Multiple detection strategies
  const functions: { subject: string; desc: string }[] = [];

  // Strategy 1: "berfungsi/berperan/berguna/bertujuan untuk X"
  const funcRegex1 = /([^.]+?)\s+(?:berfungsi|berperan|berguna|bertujuan)\s+(?:sebagai|untuk|dalam)?\s*([^.]+)/gi;
  while ((m = funcRegex1.exec(raw)) !== null) {
    functions.push({ subject: m[1].trim(), desc: m[2].trim() });
  }

  // Strategy 2: "Fungsi X:" or "Tujuan X:" section headers with bullet/dash items below
  const funcSectionRegex = /(?:Fungsi|Tujuan|Peran|Manfaat)\s+([^:\n]+):\s*\n((?:\s*[-–—•*]\s+.+\n?)+)/gim;
  while ((m = funcSectionRegex.exec(text)) !== null) {
    const subject = m[1].trim();
    const descLines = m[2]
      .split('\n')
      .map((l) => l.replace(/^\s*[-–—•*]\s+/, '').trim())
      .filter((l) => l.length > 0);
    for (const desc of descLines) {
      functions.push({ subject, desc });
    }
  }

  // Strategy 3: Inline "X berfungsi/berperan sebagai Y" without "untuk"
  const funcRegex2 = /([A-Z][^,.]+?)\s+(?:berfungsi|berperan)\s+(?:sebagai|untuk|dalam)\s+([^,.]+)/g;
  while ((m = funcRegex2.exec(raw)) !== null) {
    const entry = { subject: m[1].trim(), desc: m[2].trim() };
    // Deduplicate
    if (!functions.some((f) => f.subject === entry.subject && f.desc === entry.desc)) {
      functions.push(entry);
    }
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
