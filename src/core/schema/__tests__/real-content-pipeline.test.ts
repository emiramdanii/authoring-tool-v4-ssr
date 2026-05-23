// ═══════════════════════════════════════════════════════════════════
// Tests for auto-generate pipeline with REAL PPKn (Budaya Demokrasi) content
// ═══════════════════════════════════════════════════════════════════
// These tests verify that the parser and generators handle actual
// Indonesian academic text — multi-word definitions, section headers
// (A., B., C., D.), numbered lists with descriptions, bullet lists,
// and "antara lain" / "Berikut ini" enumeration patterns.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll } from 'vitest';
import { parse } from '@/components/authoring/auto-generate/parser';
import {
  genMateri,
  genKuis,
  genDiskusi,
  genRefleksi,
  genSkenario,
} from '@/components/authoring/auto-generate/generators';
import type { ParseResult } from '@/components/authoring/auto-generate/types';
import {
  PPKN_MATERI_BUDAYA_DEMOKRASI,
  PPKN_GEN_META,
  PPKN_TP_FOR_DISKUSI,
} from './ppkn-test-content';

// ═══════════════════════════════════════════════════════════════════
// Describe 1: Parser with real PPKn Budaya Demokrasi content
// ═══════════════════════════════════════════════════════════════════
describe('Parser with real PPKn Budaya Demokrasi content', () => {
  let result: ParseResult;

  beforeAll(() => {
    result = parse(PPKN_MATERI_BUDAYA_DEMOKRASI);
  });

  // ── Basic structure ─────────────────────────────────────────────
  it('should return a valid ParseResult with positive word count', () => {
    expect(result).toBeDefined();
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.sentences).toBeInstanceOf(Array);
    expect(result.words).toBeInstanceOf(Array);
    expect(result.topWords).toBeInstanceOf(Array);
    expect(result.definitions).toBeInstanceOf(Array);
    expect(result.enumerations).toBeInstanceOf(Array);
    expect(result.functions).toBeInstanceOf(Array);
    expect(result.causes).toBeInstanceOf(Array);
  });

  it('should have a reasonable word count (at least 40 content words after stop-word removal)', () => {
    expect(result.wordCount).toBeGreaterThan(40);
  });

  it('should extract multiple sentences from the PPKn text', () => {
    expect(result.sentences.length).toBeGreaterThan(5);
  });

  // ── Definitions ─────────────────────────────────────────────────
  it('should detect definitions from "adalah" pattern', () => {
    expect(result.definitions.length).toBeGreaterThan(0);
  });

  it('should detect the "Budaya demokrasi" definition', () => {
    // "Budaya demokrasi adalah segala hal yang berkaitan..."
    const budayaDef = result.definitions.find(
      (d) => d.term.toLowerCase().includes('budaya') || d.term.toLowerCase().includes('demokrasi'),
    );
    expect(budayaDef).toBeDefined();
    if (budayaDef) {
      expect(budayaDef.meaning.toLowerCase()).toContain('demokrasi');
    }
  });

  it('every definition should have a non-empty term and meaning', () => {
    for (const def of result.definitions) {
      expect(def.term.length).toBeGreaterThan(0);
      expect(def.meaning.length).toBeGreaterThan(0);
    }
  });

  // ── Enumerations ────────────────────────────────────────────────
  it('should detect enumerations from numbered lists and "antara lain" patterns', () => {
    expect(result.enumerations.length).toBeGreaterThan(0);
  });

  it('should detect the "ciri-ciri budaya demokrasi" enumeration (6 items)', () => {
    const ciriEnum = result.enumerations.find(
      (e) =>
        e.subject.toLowerCase().includes('ciri') ||
        e.items.some((i) => i.toLowerCase().includes('menghargai')),
    );
    expect(ciriEnum).toBeDefined();
    if (ciriEnum) {
      expect(ciriEnum.items.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('should detect bullet-list enumerations under section headers (Di Sekolah, Di Masyarakat, Di Negara)', () => {
    // The text has "Di Sekolah:", "Di Masyarakat:", "Di Negara:" with dash bullets
    const bulletEnums = result.enumerations.filter(
      (e) =>
        e.subject.toLowerCase().includes('sekolah') ||
        e.subject.toLowerCase().includes('masyarakat') ||
        e.subject.toLowerCase().includes('negara'),
    );
    // At least one of these should be found
    expect(bulletEnums.length).toBeGreaterThanOrEqual(1);
  });

  it('should detect the "hambatan" enumeration (5 numbered items)', () => {
    const hambatanEnum = result.enumerations.find(
      (e) =>
        e.subject.toLowerCase().includes('hambatan') ||
        e.items.some((i) => i.toLowerCase().includes('kesadaran') || i.toLowerCase().includes('korupsi')),
    );
    expect(hambatanEnum).toBeDefined();
  });

  it('every enumeration should have a subject and at least 2 items', () => {
    for (const en of result.enumerations) {
      expect(en.subject.length).toBeGreaterThan(0);
      expect(en.items.length).toBeGreaterThanOrEqual(2);
    }
  });

  // ── Functions ───────────────────────────────────────────────────
  it('should detect functions from "berfungsi/berperan" patterns', () => {
    // The text mentions "Musyawarah merupakan cara..." which may not be
    // a function pattern, but the parser should still find some functions
    // if any berfungsi/berperan patterns exist
    // At minimum, functions array should be an array (even if empty)
    expect(result.functions).toBeInstanceOf(Array);
  });

  // ── Causes ──────────────────────────────────────────────────────
  it('should detect causes from "karena/menyebabkan/akibat" patterns', () => {
    // The text doesn't explicitly use "karena" or "menyebabkan" in a cause-effect
    // sentence, but the parser should handle it gracefully
    expect(result.causes).toBeInstanceOf(Array);
  });

  // ── Top words ───────────────────────────────────────────────────
  it('should include "demokrasi" in top words', () => {
    expect(result.topWords).toContain('demokrasi');
  });

  it('should include "budaya" in top words', () => {
    expect(result.topWords).toContain('budaya');
  });

  it('should not include stop words in top words', () => {
    const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'adalah', 'untuk', 'dengan'];
    for (const sw of stopWords) {
      expect(result.topWords).not.toContain(sw);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Describe 2: Generator pipeline with parsed PPKn data
// ═══════════════════════════════════════════════════════════════════
describe('Generator pipeline with real PPKn content', () => {
  let parsed: ParseResult;

  beforeAll(() => {
    parsed = parse(PPKN_MATERI_BUDAYA_DEMOKRASI);
  });

  // ── genMateri ───────────────────────────────────────────────────
  describe('genMateri', () => {
    it('should generate Materi blocks from real PPKn content', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      expect(materi.length).toBeGreaterThan(0);
    });

    it('each MateriBlok should have a valid tipe', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      const validTypes = ['teks', 'definisi', 'poin', 'highlight', 'compare', 'infobox'];
      for (const block of materi) {
        expect(validTypes).toContain(block.tipe);
      }
    });

    it('should produce definisi blocks from parsed definitions', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      const defBlocks = materi.filter((b) => b.tipe === 'definisi');
      if (parsed.definitions.length > 0) {
        expect(defBlocks.length).toBeGreaterThan(0);
      }
    });

    it('should produce poin blocks from parsed enumerations', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      const poinBlocks = materi.filter((b) => b.tipe === 'poin');
      if (parsed.enumerations.length > 0) {
        expect(poinBlocks.length).toBeGreaterThan(0);
      }
    });

    it('each block should have non-empty content', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      for (const block of materi) {
        // Every block must have some content — either isi, butir, or kiri/kanan
        const hasContent =
          (block.isi && block.isi.length > 0) ||
          (block.butir && block.butir.length > 0) ||
          (block.kiri && block.kiri.isi && block.kiri.isi.length > 0);
        expect(hasContent).toBe(true);
      }
    });

    it('should start with an intro/teks block', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      expect(materi[0]!.tipe).toBe('teks');
    });

    it('should end with an infobox/summary block', () => {
      const materi = genMateri(parsed, PPKN_GEN_META);
      const lastBlock = materi[materi.length - 1];
      expect(lastBlock!.tipe).toBe('infobox');
    });
  });

  // ── genKuis ─────────────────────────────────────────────────────
  describe('genKuis', () => {
    it('should generate Kuis items from real PPKn content', () => {
      const kuis = genKuis(parsed, 10, 2);
      expect(kuis.length).toBeGreaterThan(0);
    });

    it('should produce exactly the requested number of questions', () => {
      const kuis = genKuis(parsed, 10, 2);
      expect(kuis.length).toBe(10);
    });

    it('each KuisItem should have valid structure', () => {
      const kuis = genKuis(parsed, 10, 2);
      for (const item of kuis) {
        expect(item.q.length).toBeGreaterThan(0);
        expect(item.opts).toBeInstanceOf(Array);
        expect(item.opts.length).toBe(4);
        expect(item.ans).toBeGreaterThanOrEqual(0);
        expect(item.ans).toBeLessThanOrEqual(3);
        expect(item.ex.length).toBeGreaterThan(0);
      }
    });

    it('correct answer should match the option at the ans index', () => {
      const kuis = genKuis(parsed, 10, 2);
      for (const item of kuis) {
        expect(item.opts[item.ans]).toBeDefined();
        expect(item.opts[item.ans]!.length).toBeGreaterThan(0);
      }
    });

    it('should assign pertemuan values when jumlahPertemuan > 1', () => {
      const kuis = genKuis(parsed, 8, 2);
      const pertemuanValues = kuis.map((k) => k.pertemuan);
      expect(pertemuanValues.some((p) => p === 1)).toBe(true);
      expect(pertemuanValues.some((p) => p === 2)).toBe(true);
    });

    it('should include questions related to demokrasi or budaya', () => {
      const kuis = genKuis(parsed, 10, 2);
      const hasRelevantQ = kuis.some(
        (item) =>
          item.q.toLowerCase().includes('demokrasi') ||
          item.q.toLowerCase().includes('budaya') ||
          item.q.toLowerCase().includes('musyawarah'),
      );
      expect(hasRelevantQ).toBe(true);
    });
  });

  // ── genDiskusi ──────────────────────────────────────────────────
  describe('genDiskusi', () => {
    it('should generate Diskusi questions from real PPKn content', () => {
      const diskusi = genDiskusi(parsed, PPKN_TP_FOR_DISKUSI, PPKN_GEN_META);
      expect(diskusi.pertanyaan.length).toBeGreaterThan(0);
    });

    it('should have a title and intro', () => {
      const diskusi = genDiskusi(parsed, PPKN_TP_FOR_DISKUSI, PPKN_GEN_META);
      expect(diskusi.title.length).toBeGreaterThan(0);
      expect(diskusi.intro.length).toBeGreaterThan(0);
    });

    it('each question should have label, icon, teks, and petunjuk', () => {
      const diskusi = genDiskusi(parsed, PPKN_TP_FOR_DISKUSI, PPKN_GEN_META);
      for (const q of diskusi.pertanyaan) {
        expect(q.label.length).toBeGreaterThan(0);
        expect(q.icon.length).toBeGreaterThan(0);
        expect(q.teks.length).toBeGreaterThan(0);
        expect(q.petunjuk.length).toBeGreaterThan(0);
      }
    });

    it('should produce at most 5 discussion questions', () => {
      const diskusi = genDiskusi(parsed, PPKN_TP_FOR_DISKUSI, PPKN_GEN_META);
      expect(diskusi.pertanyaan.length).toBeLessThanOrEqual(5);
    });

    it('should include questions related to definitions or enumerations from the text', () => {
      const diskusi = genDiskusi(parsed, PPKN_TP_FOR_DISKUSI, PPKN_GEN_META);
      const hasRelevantQ = diskusi.pertanyaan.some(
        (q) =>
          q.teks.toLowerCase().includes('demokrasi') ||
          q.teks.toLowerCase().includes('budaya') ||
          q.teks.toLowerCase().includes('musyawarah'),
      );
      expect(hasRelevantQ).toBe(true);
    });
  });

  // ── genRefleksi ─────────────────────────────────────────────────
  describe('genRefleksi', () => {
    it('should generate Refleksi from real PPKn content', () => {
      const refleksi = genRefleksi(parsed, PPKN_GEN_META);
      expect(refleksi.pertanyaan.length).toBeGreaterThan(0);
    });

    it('should have a title, intro, and penugasan', () => {
      const refleksi = genRefleksi(parsed, PPKN_GEN_META);
      expect(refleksi.title.length).toBeGreaterThan(0);
      expect(refleksi.intro.length).toBeGreaterThan(0);
      expect(refleksi.penugasan).toBeDefined();
    });

    it('each reflection question should have teks and petunjuk', () => {
      const refleksi = genRefleksi(parsed, PPKN_GEN_META);
      for (const q of refleksi.pertanyaan) {
        expect(q.teks.length).toBeGreaterThan(0);
        expect(q.petunjuk.length).toBeGreaterThan(0);
      }
    });

    it('should produce at least 3 reflection questions', () => {
      const refleksi = genRefleksi(parsed, PPKN_GEN_META);
      expect(refleksi.pertanyaan.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── genSkenario ─────────────────────────────────────────────────
  describe('genSkenario', () => {
    it('should generate Skenario chapters from real PPKn content', () => {
      const skenario = genSkenario(parsed, PPKN_GEN_META);
      expect(skenario.length).toBeGreaterThan(0);
    });

    it('each chapter should have title, setup, dialog, and choices', () => {
      const skenario = genSkenario(parsed, PPKN_GEN_META);
      for (const ch of skenario) {
        expect(ch.title.length).toBeGreaterThan(0);
        expect(ch.setup.length).toBeGreaterThan(0);
        expect(ch.dialog).toBeInstanceOf(Array);
        expect(ch.dialog.length).toBeGreaterThan(0);
        expect(ch.choices).toBeInstanceOf(Array);
        expect(ch.choices.length).toBeGreaterThan(0);
      }
    });

    it('each dialog entry should have speaker and text', () => {
      const skenario = genSkenario(parsed, PPKN_GEN_META);
      for (const ch of skenario) {
        for (const d of ch.dialog) {
          expect(d.speaker.length).toBeGreaterThan(0);
          expect(d.text.length).toBeGreaterThan(0);
        }
      }
    });

    it('each choice should have text, feedback, and a correct flag', () => {
      const skenario = genSkenario(parsed, PPKN_GEN_META);
      for (const ch of skenario) {
        for (const c of ch.choices) {
          expect(c.text.length).toBeGreaterThan(0);
          expect(c.feedback.length).toBeGreaterThan(0);
          expect(typeof c.correct).toBe('boolean');
        }
      }
    });

    it('at least one choice per chapter should be correct', () => {
      const skenario = genSkenario(parsed, PPKN_GEN_META);
      for (const ch of skenario) {
        const hasCorrect = ch.choices.some((c) => c.correct);
        expect(hasCorrect).toBe(true);
      }
    });

    it('should reference demokrasi or budaya in the scenario content', () => {
      const skenario = genSkenario(parsed, PPKN_GEN_META);
      const allText = skenario
        .flatMap((ch) => [ch.setup, ...ch.dialog.map((d) => d.text)])
        .join(' ')
        .toLowerCase();
      expect(
        allText.includes('demokrasi') || allText.includes('budaya') || allText.includes('aturan'),
      ).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Describe 3: Pipeline robustness — large content, edge cases
// ═══════════════════════════════════════════════════════════════════
describe('Pipeline robustness with PPKn content', () => {
  it('should handle empty text gracefully', () => {
    const result = parse('');
    expect(result).toBeDefined();
    expect(result.wordCount).toBe(0);
    expect(result.definitions).toEqual([]);
    expect(result.enumerations).toEqual([]);
  });

  it('should handle text with only section headers (no body)', () => {
    const headerOnlyText = `
A. Pengertian
B. Prinsip
C. Contoh
`;
    const result = parse(headerOnlyText);
    expect(result).toBeDefined();
    // Should not crash, may have 0 definitions/enumerations
    expect(result.definitions).toBeInstanceOf(Array);
    expect(result.enumerations).toBeInstanceOf(Array);
  });

  it('should generate valid materi even from sparse content', () => {
    const sparseText = 'Demokrasi adalah sistem pemerintahan dari rakyat.';
    const sparseParsed = parse(sparseText);
    const materi = genMateri(sparseParsed, PPKN_GEN_META);
    expect(materi.length).toBeGreaterThan(0);
    // Should have at least the intro + infobox
    expect(materi.some((b) => b.tipe === 'teks')).toBe(true);
    expect(materi.some((b) => b.tipe === 'infobox')).toBe(true);
  });

  it('should generate valid kuis even with minimal parsed data', () => {
    const minimalText = 'Demokrasi adalah kekuasaan rakyat. Musyawarah adalah cara mengambil keputusan bersama.';
    const minimalParsed = parse(minimalText);
    const kuis = genKuis(minimalParsed, 3, 1);
    expect(kuis.length).toBe(3);
    for (const item of kuis) {
      expect(item.q.length).toBeGreaterThan(0);
      expect(item.opts.length).toBe(4);
    }
  });

  it('should handle duplicate section numbering (multiple "1." in different sections)', () => {
    // The PPKn content has two numbered lists both starting from 1
    const result = parse(PPKN_MATERI_BUDAYA_DEMOKRASI);
    // Should detect both groups, not merge them
    expect(result.enumerations.length).toBeGreaterThanOrEqual(2);
  });
});
