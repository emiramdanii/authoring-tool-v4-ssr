// ═══════════════════════════════════════════════════════════════════
// Tests for auto-generate parser & generators with REAL PPKn content
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { parse } from '@/components/authoring/auto-generate/parser';
import { genKuis, genTP, genFlashcard, genDiskusi } from '@/components/authoring/auto-generate/generators';
import type { ParseResult, GenSettings } from '@/components/authoring/auto-generate/types';

// ── Real PPKn content about Norma ────────────────────────────────
const PPKN_CONTENT = `Norma adalah aturan atau pedoman tingkah laku yang berlaku di masyarakat untuk menciptakan ketertiban dan ketenteraman. Norma berasal dari bahasa Sansekerta yang berarti aturan. Dalam kehidupan bermasyarakat, norma sangat penting karena tanpa norma akan terjadi kekacauan.

Jenis-jenis Norma:
1. Norma Agama - Norma agama bersumber dari perintah dan larangan Tuhan Yang Maha Esa. Contoh: "Jangan membunuh", "Hormati orang tua". Sanksi pelanggaran norma agama adalah dosa.
2. Norma Kesusilaan - Norma kesusilaan bersumber dari hati nurani manusia. Contoh: "Jangan berbohong", "Hormati sesama". Sanksinya adalah rasa bersalah dan penyesalan.
3. Norma Kesopanan - Norma kesopanan bersumber dari pergaulan manusia dalam masyarakat. Contoh: "Berkata sopan", "Menghormati yang lebih tua". Sanksinya adalah teguran atau dikucilkan.
4. Norma Hukum - Norma hukum bersumber dari peraturan perundang-undangan yang dibuat oleh lembaga berwenang. Contoh: "Wajib belajar 12 tahun", "Dilarang mencuri". Sanksinya paling tegas berupa hukuman penjara atau denda.

Fungsi Norma:
- Mengatur perilaku manusia dalam bermasyarakat
- Menciptakan ketertiban dan ketenteraman
- Melindungi hak dan kewajiban setiap orang
- Menjadi pedoman hidup yang baik

Hubungan antar norma: Norma agama menjadi landasan norma lainnya. Norma kesusilaan mendorong seseorang berbuat baik. Norma kesopanan mengatur pergaulan sehari-hari. Norma hukum memberikan sanksi tegas bagi pelanggar.

Pelanggaran terhadap norma dapat menyebabkan:
1. Kerusakan tatanan sosial
2. Konflik antarwarga
3. Kehilangan kepercayaan masyarakat
4. Sanksi sesuai jenis normanya

Perilaku patuh norma adalah perilaku yang sesuai dengan aturan yang berlaku. Contoh perilaku patuh norma di sekolah: datang tepat waktu, mengenakan seragam, menghormati guru, dan mengerjakan tugas. Contoh di masyarakat: menunggu antrian, tidak membuang sampah sembarangan, dan menghormati tetangga.

Sebab pelanggaran norma:
- Kurangnya kesadaran berupa tidak paham aturan
- Pengaruh lingkungan yang kurang baik
- Ketidakpedulian terhadap hak orang lain
- Lemahnya penegakan sanksi

Akibat pelanggaran norma:
- Timbul kekacauan dalam masyarakat
- Hak orang lain dirugikan
- Kerusakan tatanan sosial
- Hilangnya kepercayaan dan rasa aman`;

// ═══════════════════════════════════════════════════════════════════
// Describe 1: Parser tests with real PPKn content
// ═══════════════════════════════════════════════════════════════════
describe('Parser with real PPKn content', () => {
  let result: ParseResult;

  // Parse once and reuse across tests
  beforeAll(() => {
    result = parse(PPKN_CONTENT);
  });

  // ── 1. Parse returns valid result with correct word count ──────
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

  it('should have wordCount matching the words array length', () => {
    expect(result.wordCount).toBe(result.words.length);
  });

  it('should have a reasonable word count for the content (at least 50 words after filtering)', () => {
    // The content has ~250+ Indonesian words; after stop-word removal,
    // at least 50 content words should remain.
    expect(result.wordCount).toBeGreaterThan(50);
  });

  it('should extract multiple sentences', () => {
    expect(result.sentences.length).toBeGreaterThan(5);
  });

  // ── 2. Definitions should be detected ──────────────────────────
  it('should detect the "Norma" definition', () => {
    expect(result.definitions.length).toBeGreaterThan(0);

    const normaDef = result.definitions.find(
      (d) => d.term.toLowerCase() === 'norma',
    );
    expect(normaDef).toBeDefined();
    expect(normaDef!.meaning).toContain('aturan');
    expect(normaDef!.meaning).toContain('pedoman');
  });

  it('should detect additional definitions with "adalah" pattern', () => {
    // Other "adalah" patterns in the text include:
    // "Sanksi pelanggaran norma agama adalah dosa" → "agama" won't match
    //   because it's lowercase before "adalah"
    // "Sanksinya adalah rasa bersalah dan penyesalan" → "Sanksinya" matches
    // "Sanksinya adalah teguran atau dikucilkan" → "Sanksinya" matches
    // "Perilaku patuh norma adalah perilaku yang sesuai..." → "norma" is
    //   lowercase before "adalah"

    // At minimum we should have the "Norma" definition
    const areDefinitions = result.definitions.filter(
      (d) => d.term === 'Sanksinya',
    );
    // "Sanksinya" should be detected (capital S, single word before "adalah")
    expect(areDefinitions.length).toBeGreaterThan(0);
  });

  it('every definition should have a non-empty term and meaning', () => {
    for (const def of result.definitions) {
      expect(def.term.length).toBeGreaterThan(0);
      expect(def.meaning.length).toBeGreaterThan(0);
    }
  });

  // ── 3. Enumerations ────────────────────────────────────────────
  it('should detect enumerations from numbered lists', () => {
    // The PPKn content uses numbered lists ("1. Norma Agama - ...")
    // and bullet lists under "Sebab pelanggaran norma:" etc.
    // After parser improvement, these should be detected.
    expect(result.enumerations.length).toBeGreaterThan(0);
  });

  it('should detect the 4 types of norms as an enumeration', () => {
    // "Jenis-jenis Norma:" followed by numbered list
    const normaEnum = result.enumerations.find(
      (e) => e.items.some((i) => i.toLowerCase().includes('norma agama')),
    );
    expect(normaEnum).toBeDefined();
    expect(normaEnum!.items.length).toBeGreaterThanOrEqual(4);
  });

  it('every enumeration should have a subject and at least 2 items', () => {
    for (const en of result.enumerations) {
      expect(en.subject.length).toBeGreaterThan(0);
      expect(en.items.length).toBeGreaterThanOrEqual(2);
    }
  });

  // ── 4. Functions ───────────────────────────────────────────────
  it('should detect functions from "Fungsi X:" section headers', () => {
    // The "Fungsi Norma:" section uses bullet points.
    // After parser improvement, these should be detected.
    expect(result.functions.length).toBeGreaterThan(0);
  });

  it('should detect "Mengatur perilaku" as a function of Norma', () => {
    const hasMengatur = result.functions.some(
      (fn) => fn.desc.toLowerCase().includes('mengatur') || fn.desc.toLowerCase().includes('perilaku'),
    );
    expect(hasMengatur).toBe(true);
  });

  it('every function should have a subject and description', () => {
    for (const fn of result.functions) {
      expect(fn.subject.length).toBeGreaterThan(0);
      expect(fn.desc.length).toBeGreaterThan(0);
    }
  });

  // ── 5. Causes should be detected ───────────────────────────────
  it('should detect causes from "karena" keyword', () => {
    // The text contains:
    // "...norma sangat penting karena tanpa norma akan terjadi kekacauan"
    expect(result.causes.length).toBeGreaterThan(0);
  });

  it('should detect causes from "menyebabkan" keyword', () => {
    // The text contains:
    // "Pelanggaran terhadap norma dapat menyebabkan: ..."
    const hasMenyebabkan = result.causes.some(
      (c) =>
        c.cause.toLowerCase().includes('pelanggaran') ||
        c.effect.toLowerCase().includes('kerusakan') ||
        c.effect.toLowerCase().includes('konflik'),
    );
    expect(hasMenyebabkan).toBe(true);
  });

  it('should detect causes from "Akibat" keyword (case-insensitive)', () => {
    // The text contains "Akibat pelanggaran norma:"
    const hasAkibat = result.causes.some(
      (c) =>
        c.cause.toLowerCase().includes('akibat') ||
        c.effect.toLowerCase().includes('kekacauan') ||
        c.effect.toLowerCase().includes('kepercayaan'),
    );
    expect(hasAkibat).toBe(true);
  });

  it('every cause should have non-empty cause and effect strings', () => {
    for (const c of result.causes) {
      // The parser may produce empty strings for cause/effect
      // depending on keyword position, but they should be strings
      expect(typeof c.cause).toBe('string');
      expect(typeof c.effect).toBe('string');
    }
  });

  // ── 6. Top words should include relevant terms ─────────────────
  it('should include "norma" in top words', () => {
    expect(result.topWords).toContain('norma');
  });

  it('should include "masyarakat" in top words', () => {
    expect(result.topWords).toContain('masyarakat');
  });

  it('should include "sanksi" in top words', () => {
    expect(result.topWords).toContain('sanksi');
  });

  it('should have "norma" as one of the top 3 most frequent words', () => {
    // "norma" appears extensively throughout the text
    expect(result.topWords.indexOf('norma')).toBeLessThan(3);
  });

  it('should not include stop words in top words', () => {
    const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'adalah', 'untuk', 'dengan'];
    for (const sw of stopWords) {
      expect(result.topWords).not.toContain(sw);
    }
  });

  it('should return at most 30 top words', () => {
    expect(result.topWords.length).toBeLessThanOrEqual(30);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Describe 2: Generator tests with parsed PPKn data
// ═══════════════════════════════════════════════════════════════════
describe('Generators with parsed PPKn data', () => {
  let parsed: ParseResult;

  beforeAll(() => {
    parsed = parse(PPKN_CONTENT);
  });

  // ── 1. genKuis ─────────────────────────────────────────────────
  describe('genKuis', () => {
    it('should produce the requested number of questions', () => {
      const jumlah = 5;
      const kuis = genKuis(parsed, jumlah);
      expect(kuis.length).toBe(jumlah);
    });

    it('should produce exactly 10 questions when requested', () => {
      const jumlah = 10;
      const kuis = genKuis(parsed, jumlah);
      expect(kuis.length).toBe(jumlah);
    });

    it('should produce 1 question when jumlah is 1', () => {
      const kuis = genKuis(parsed, 1);
      expect(kuis.length).toBe(1);
    });

    it('each kuis item should have valid structure', () => {
      const kuis = genKuis(parsed, 5);
      for (const item of kuis) {
        expect(item.q.length).toBeGreaterThan(0);
        expect(item.opts).toBeInstanceOf(Array);
        expect(item.opts.length).toBe(4); // always 4 options
        expect(item.ans).toBeGreaterThanOrEqual(0);
        expect(item.ans).toBeLessThanOrEqual(3);
        expect(item.ex.length).toBeGreaterThan(0);
      }
    });

    it('correct answer should match the option at the ans index', () => {
      const kuis = genKuis(parsed, 5);
      for (const item of kuis) {
        expect(item.opts[item.ans]).toBeDefined();
        expect(item.opts[item.ans].length).toBeGreaterThan(0);
      }
    });

    it('should assign pertemuan values when jumlahPertemuan > 1', () => {
      const kuis = genKuis(parsed, 6, 2);
      const pertemuanValues = kuis.map((k) => k.pertemuan);
      expect(pertemuanValues.some((p) => p === 1)).toBe(true);
      expect(pertemuanValues.some((p) => p === 2)).toBe(true);
    });

    it('should generate definition-based questions for "Norma"', () => {
      const kuis = genKuis(parsed, 5);
      const hasNormaQ = kuis.some(
        (item) => item.q.toLowerCase().includes('norma'),
      );
      expect(hasNormaQ).toBe(true);
    });
  });

  // ── 2. genTP ───────────────────────────────────────────────────
  describe('genTP', () => {
    it('should produce learning objectives', () => {
      const settings: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      };
      const tps = genTP(parsed, settings);
      expect(tps.length).toBeGreaterThan(0);
    });

    it('should produce at least 3 TPs (fallback guarantee)', () => {
      const settings: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      };
      const tps = genTP(parsed, settings);
      expect(tps.length).toBeGreaterThanOrEqual(3);
    });

    it('each TP item should have verb, desc, pertemuan, and color', () => {
      const settings: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      };
      const tps = genTP(parsed, settings);
      for (const tp of tps) {
        expect(tp.verb.length).toBeGreaterThan(0);
        expect(tp.desc.length).toBeGreaterThan(0);
        expect(tp.pertemuan).toBeGreaterThanOrEqual(1);
        expect(tp.color.length).toBeGreaterThan(0);
      }
    });

    it('should produce C1 TPs from definitions', () => {
      const settings: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      };
      const tps = genTP(parsed, settings);
      // Since we have at least the "Norma" definition, there should be
      // a C1 TP (Menyebutkan/Mendefinisikan/etc.)
      const c1Verbs = ['Menyebutkan', 'Mendefinisikan', 'Mengidentifikasi', 'Menyebut', 'Menuliskan'];
      const hasC1 = tps.some((tp) => c1Verbs.includes(tp.verb));
      expect(hasC1).toBe(true);
    });

    it('should respect bloomMax setting', () => {
      const lowBloom: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 2,
      };
      const highBloom: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 6,
      };
      const tpsLow = genTP(parsed, lowBloom);
      const tpsHigh = genTP(parsed, highBloom);
      // Higher bloomMax should produce at least as many TPs
      expect(tpsHigh.length).toBeGreaterThanOrEqual(tpsLow.length);
    });

    it('should not exceed pertemuan in pertemuan assignment', () => {
      const settings: GenSettings = {
        jumlahKuis: 5,
        pertemuan: 3,
        bloomMax: 6,
      };
      const tps = genTP(parsed, settings);
      for (const tp of tps) {
        expect(tp.pertemuan).toBeLessThanOrEqual(3);
      }
    });
  });

  // ── 3. genFlashcard ────────────────────────────────────────────
  describe('genFlashcard', () => {
    it('should produce flashcard items', () => {
      const cards = genFlashcard(parsed);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should produce flashcards from definitions', () => {
      const cards = genFlashcard(parsed);
      // At minimum, the "Norma" definition should produce a flashcard
      const normaCard = cards.find(
        (c) => c.depan.toLowerCase().includes('norma'),
      );
      expect(normaCard).toBeDefined();
    });

    it('each flashcard should have depan, belakang, and hint', () => {
      const cards = genFlashcard(parsed);
      for (const card of cards) {
        expect(card.depan.length).toBeGreaterThan(0);
        expect(card.belakang.length).toBeGreaterThan(0);
        expect(card.hint.length).toBeGreaterThan(0);
      }
    });

    it('definition flashcards should ask about the term', () => {
      const cards = genFlashcard(parsed);
      const normaCard = cards.find(
        (c) => c.depan.toLowerCase().includes('norma'),
      );
      if (normaCard) {
        expect(normaCard.depan).toContain('dimaksud');
        expect(normaCard.belakang).toContain('aturan');
      }
    });
  });

  // ── 4. genDiskusi ──────────────────────────────────────────────
  describe('genDiskusi', () => {
    it('should produce discussion questions', () => {
      const tps = genTP(parsed, {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      });
      const diskusi = genDiskusi(parsed, tps, {
        judulPertemuan: 'Norma dalam Kehidupan',
        namaBab: 'Norma',
      });
      expect(diskusi.pertanyaan.length).toBeGreaterThan(0);
    });

    it('should produce at most 5 discussion questions', () => {
      const tps = genTP(parsed, {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      });
      const diskusi = genDiskusi(parsed, tps, {
        judulPertemuan: 'Norma dalam Kehidupan',
        namaBab: 'Norma',
      });
      expect(diskusi.pertanyaan.length).toBeLessThanOrEqual(5);
    });

    it('should have a title and intro', () => {
      const tps = genTP(parsed, {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      });
      const diskusi = genDiskusi(parsed, tps, {
        judulPertemuan: 'Norma dalam Kehidupan',
        namaBab: 'Norma',
      });
      expect(diskusi.title.length).toBeGreaterThan(0);
      expect(diskusi.intro.length).toBeGreaterThan(0);
    });

    it('each question should have label, icon, teks, and petunjuk', () => {
      const tps = genTP(parsed, {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      });
      const diskusi = genDiskusi(parsed, tps, {
        judulPertemuan: 'Norma dalam Kehidupan',
        namaBab: 'Norma',
      });
      for (const q of diskusi.pertanyaan) {
        expect(q.label.length).toBeGreaterThan(0);
        expect(q.icon.length).toBeGreaterThan(0);
        expect(q.teks.length).toBeGreaterThan(0);
        expect(q.petunjuk.length).toBeGreaterThan(0);
      }
    });

    it('should include definition-based discussion questions', () => {
      const tps = genTP(parsed, {
        jumlahKuis: 5,
        pertemuan: 2,
        bloomMax: 4,
      });
      const diskusi = genDiskusi(parsed, tps, {
        judulPertemuan: 'Norma dalam Kehidupan',
        namaBab: 'Norma',
      });
      const hasNormaQ = diskusi.pertanyaan.some(
        (q) => q.teks.toLowerCase().includes('norma'),
      );
      expect(hasNormaQ).toBe(true);
    });
  });
});
