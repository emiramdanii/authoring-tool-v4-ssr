// ═══════════════════════════════════════════════════════════════════
// Parser — Extracts structured data from raw text
// Improved for real Indonesian PPKn academic text patterns:
//   - Multi-word definition terms (e.g. "Budaya demokrasi adalah...")
//   - Section headers (A., B., C., D.) as context
//   - Numbered items with multi-line descriptions
//   - "antara lain:" / "meliputi:" / "Berikut ini" enumeration intros
//   - Bullet lists under descriptive headers
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

  // ═════════════════════════════════════════════════════════════════
  // Definitions: "X adalah/merupakan/yaitu/ialah Y"
  // ═════════════════════════════════════════════════════════════════
  const definitions: { term: string; meaning: string }[] = [];
  let m: RegExpExecArray | null;

  // Strategy 1: Multi-word definition terms (1 uppercase word + 0–3 lowercase words)
  // Matches patterns like:
  //   "Budaya demokrasi adalah segala hal yang berkaitan..."
  //   "Musyawarah merupakan cara penyelesaian masalah..."
  //   "Norma agama bersumber dari..." (not a definition, won't match)
  const defRegexMulti = /([A-Z][a-zA-Z]+(?:\s+[a-z][a-zA-Z]+){0,3})\s+(?:adalah|merupakan|yaitu|ialah)\s+([^.]+)/g;
  while ((m = defRegexMulti.exec(raw)) !== null) {
    const term = m[1].trim();
    const meaning = m[2].trim();
    // Validate: term should be 2-60 chars, meaning should be substantive
    if (term.length >= 2 && term.length <= 60 && meaning.length > 5) {
      // Avoid duplicates (prefer multi-word match over single-word)
      if (!definitions.some((d) => d.term === term)) {
        definitions.push({ term, meaning });
      }
    }
  }

  // Strategy 2: Single-word definitions (fallback, catches short terms)
  // e.g. "Norma adalah aturan..." where "Norma" is a single word
  // Only adds if not already captured by the multi-word regex
  const defRegexSingle = /([A-Z][^\s,.:;]{1,40})\s+(?:adalah|merupakan|yaitu|ialah)\s+([^.]+)/g;
  while ((m = defRegexSingle.exec(raw)) !== null) {
    const term = m[1].trim();
    const meaning = m[2].trim();
    if (term.length >= 2 && meaning.length > 5) {
      if (!definitions.some((d) => d.term === term)) {
        definitions.push({ term, meaning });
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // Enumerations: Multiple detection strategies
  // ═════════════════════════════════════════════════════════════════
  const enumerations: { subject: string; items: string[] }[] = [];

  // Strategy 1: "terdiri dari/meliputi/antara lain X, Y, Z"
  const enumRegex1 = /([^.]+?)\s+(?:terdiri dari|meliputi|antara lain)\s+([^.]+)/gi;
  while ((m = enumRegex1.exec(raw)) !== null) {
    const items = m[2]
      .split(/[,;]\s*/)
      .map((s) => s.replace(/^(?:yaitu|yakni|ialah)\s+/i, '').trim())
      .filter(Boolean);
    if (items.length >= 2) {
      const subject = m[1].trim();
      if (!enumerations.some((e) => e.subject === subject)) {
        enumerations.push({ subject, items });
      }
    }
  }

  // Strategy 2: Numbered lists — with improved handling of multi-line descriptions
  // Key improvements:
  //   - Tolerate non-numbered continuation lines between numbered items
  //   - Better subject detection: "meliputi:", "antara lain:", section headers
  //   - Section headers (A., B., C., D.) used as context
  const textLines = text.split('\n');
  const numberedGroups = new Map<string, { subject: string; items: string[] }>();
  let currentGroupSubject = '';
  let currentGroupItems: string[] = [];
  let lastNum = 0;
  let continuationLinesSinceLastNumber = 0;
  const MAX_CONTINUATION_LINES = 3; // allow up to 3 non-numbered lines between numbered items

  for (let lineIdx = 0; lineIdx < textLines.length; lineIdx++) {
    const line = textLines[lineIdx];
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
        const prevLines = textLines.slice(Math.max(0, lineIdx - 5), lineIdx);
        for (const pl of prevLines.reverse()) {
          // Pattern 1: Line ending with ":"
          const subjectMatch = pl.match(/^(.+?):\s*$/);
          if (subjectMatch) {
            const rawSubject = subjectMatch[1]
              .replace(/^(Jenis|Macam|Kategori|Bentuk|Ciri|Sifat|Contoh|Hambatan|Faktor|Penyebab|Prinsip)\s*-?\s*/i, '$1 ')
              .trim();
            currentGroupSubject = rawSubject;
            break;
          }
          // Pattern 2: Section header "A. Title" / "B. Title"
          const sectionMatch = pl.match(/^[A-Z]\.\s+(.+)/);
          if (sectionMatch) {
            currentGroupSubject = sectionMatch[1].trim();
            break;
          }
          // Pattern 3: Non-empty text line (use as context, but skip blank lines going up)
          if (pl.trim().length > 10) {
            // Use last meaningful line as subject, truncated
            currentGroupSubject = pl.trim().replace(/[.:]\s*$/, '');
            break;
          }
        }
        if (!currentGroupSubject) {
          currentGroupSubject = 'Daftar';
        }
      }

      currentGroupItems.push(itemName);
      lastNum = num;
      continuationLinesSinceLastNumber = 0;
    } else if (lastNum > 0 && line.trim().length > 0) {
      // Non-numbered line after numbered items
      continuationLinesSinceLastNumber++;

      // Check if this might be a continuation of a numbered item (description text)
      // or if it's a new section that breaks the group
      const isSectionHeader = /^[A-Z]\.\s+/.test(line.trim());
      const isBulletItem = /^\s*[-–—•*]\s+/.test(line);
      const isBlankLine = line.trim().length === 0;

      if (isSectionHeader) {
        // Section header definitely breaks the group
        if (currentGroupItems.length >= 2 && currentGroupSubject) {
          numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
        }
        currentGroupItems = [];
        currentGroupSubject = '';
        lastNum = 0;
        continuationLinesSinceLastNumber = 0;
      } else if (continuationLinesSinceLastNumber > MAX_CONTINUATION_LINES) {
        // Too many continuation lines — save the group and reset
        if (currentGroupItems.length >= 2 && currentGroupSubject) {
          numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
        }
        currentGroupItems = [];
        currentGroupSubject = '';
        lastNum = 0;
        continuationLinesSinceLastNumber = 0;
      } else if (isBulletItem) {
        // Bullet items after numbered items — save the numbered group
        if (currentGroupItems.length >= 2 && currentGroupSubject) {
          numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
        }
        currentGroupItems = [];
        currentGroupSubject = '';
        lastNum = 0;
        continuationLinesSinceLastNumber = 0;
      }
      // Otherwise, it's a continuation line — keep the group alive
    } else if (lastNum > 0 && line.trim().length === 0) {
      // Blank line — increment continuation counter but don't break yet
      continuationLinesSinceLastNumber++;
    }
  }
  // Don't forget the last group
  if (currentGroupItems.length >= 2 && currentGroupSubject) {
    numberedGroups.set(currentGroupSubject, { subject: currentGroupSubject, items: currentGroupItems });
  }

  for (const [, group] of numberedGroups) {
    if (!enumerations.some((e) => e.subject === group.subject)) {
      enumerations.push(group);
    }
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

  // ═════════════════════════════════════════════════════════════════
  // Functions: Multiple detection strategies
  // ═════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════
  // Causes: "karena/sehingga/akibat/menyebabkan X"
  // ═════════════════════════════════════════════════════════════════
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
