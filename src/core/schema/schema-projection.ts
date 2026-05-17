// ═══════════════════════════════════════════════════════════════════
// SCHEMA PROJECTION — Derive EditorProjectionStore state from SchemaBlock[]
// ═══════════════════════════════════════════════════════════════════
// UNIDIRECTIONAL FLOW:
//   SchemaBlock[] → deriveProjection() → EditorProjectionStore fields
//
// This is the "write-through" mechanism that makes the EditorProjectionStore
// a TRUE projection of the schema tree. When schema changes, the projection
// auto-updates by calling deriveProjectionFromPages().
//
// RULE: Schema → Projection (OK), Projection → Schema (FORBIDDEN)
//
// USAGE:
//   import { deriveProjectionFromPages } from '@/core/schema/schema-projection';
//
//   // After schema mutation, re-derive projection
//   const projection = deriveProjectionFromPages(pages);
//   useAuthoringStore.setState(projection);
//
// MAPPING:
//   CoverBlock       → meta fields (judulPertemuan, namaBab, mapel, kelas, durasi)
//   TpBlock          → TpItem[]
//   AlurBlock        → AlurItem[]
//   KuisBlock        → KuisItem[]
//   DiskusiBlock     → DiskusiData
//   RefleksiBlock    → RefleksiData
//   MateriSectionBlock → MateriBlok[]
//   SkenarioBlock    → SkenarioChapter[]
//   MotivasiBlock    → MotivasiData
//   RangkumanBlock   → RangkumanData
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from './types';
import type {
  TpItem,
  AlurItem,
  KuisItem,
  MateriBlok,
  DiskusiData,
  DiskusiPertanyaan,
  RefleksiData,
  RefleksiPertanyaan,
  SkenarioChapter,
  SkenarioChoice,
  MotivasiData,
  RangkumanData,
  MetaState,
} from '@/store/authoring/types';
import { ensurePageSchema } from './ensure-schema';

// ── Projection Result ───────────────────────────────────────────

export interface SchemaProjection {
  meta?: Partial<MetaState>;
  tp?: TpItem[];
  alur?: AlurItem[];
  kuis?: KuisItem[];
  materi?: { blok: MateriBlok[] };
  diskusi?: DiskusiData;
  refleksi?: RefleksiData;
  skenario?: SkenarioChapter[];
  motivasi?: MotivasiData;
  rangkuman?: RangkumanData;
}

// ── Main Derivation Function ────────────────────────────────────

/**
 * Derive EditorProjectionStore fields from an array of CanvaPages.
 * Scans all pages' schema blocks and converts them to projection format.
 *
 * This is the ONLY way projection should be updated after schema changes.
 * Direct writes to EditorProjectionStore are allowed only for data that
 * has no schema representation (e.g., CP, ATP, petunjuk).
 */
export function deriveProjectionFromPages(pages: CanvaPage[]): SchemaProjection {
  const projection: SchemaProjection = {};

  for (const page of pages) {
    const schema = ensurePageSchema(page);
    if (!schema) continue;

    for (const block of schema.blocks) {
      switch (block.type) {
        case 'cover':
          deriveCoverToProjection(block, projection);
          break;
        case 'tp':
          deriveTpToProjection(block, projection);
          break;
        case 'alur':
          deriveAlurToProjection(block, projection);
          break;
        case 'kuis':
          deriveKuisToProjection(block, projection);
          break;
        case 'diskusi':
          deriveDiskusiToProjection(block, projection);
          break;
        case 'refleksi':
          deriveRefleksiToProjection(block, projection);
          break;
        case 'materi-section':
          deriveMateriSectionToProjection(block, projection);
          break;
        case 'skenario':
          deriveSkenarioToProjection(block, projection);
          break;
        case 'motivasi':
          deriveMotivasiToProjection(block, projection);
          break;
        case 'rangkuman':
          deriveRangkumanToProjection(block, projection);
          break;
      }
    }
  }

  return projection;
}

/**
 * Derive projection from a single page's schema.
 * More efficient when only one page changed.
 */
export function deriveProjectionFromPage(page: CanvaPage): SchemaProjection {
  return deriveProjectionFromPages([page]);
}

// ── Per-Block Derivers ──────────────────────────────────────────

function deriveCoverToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const cover = block as {
    title?: string;
    subtitle?: string;
    icon?: string;
    meta?: { durasi?: string; fase?: string; elemen?: string };
    badges?: Array<{ text: string }>;
  };

  if (!projection.meta) projection.meta = {};

  if (cover.title) projection.meta.judulPertemuan = cover.title;
  if (cover.subtitle) projection.meta.mapel = cover.subtitle;
  if (cover.meta?.durasi) projection.meta.durasi = cover.meta.durasi;
  if (cover.icon) projection.meta.ikon = cover.icon;

  // Extract namaBab and kelas from first badge if present
  if (cover.badges && cover.badges.length > 0) {
    const badgeText = cover.badges[0].text;
    // Badge format: "NamaBab • Kelas VII" or just "NamaBab"
    const parts = badgeText.split(' • ');
    if (parts[0]) projection.meta.namaBab = parts[0];
    const kelasMatch = parts[1]?.match(/Kelas\s+(\S+)/);
    if (kelasMatch) projection.meta.kelas = kelasMatch[1];
  }
}

function deriveTpToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const tp = block as {
    items?: Array<{ num?: number; verb?: string; desc?: string; color?: string }>;
  };

  if (!tp.items?.length) return;

  projection.tp = tp.items.map((item, i) => ({
    verb: item.verb || '',
    desc: item.desc || '',
    pertemuan: Math.min(Math.ceil((i + 1) / 2), 3), // Default distribution
    color: item.color || '#f9c82e',
  }));
}

function deriveAlurToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const alur = block as {
    steps?: Array<{ dot?: string; durasi?: string; judul?: string; deskripsi?: string }>;
  };

  if (!alur.steps?.length) return;

  projection.alur = alur.steps.map((step, i) => ({
    fase: i === 0 ? 'Pendahuluan' : i === alur.steps!.length - 1 ? 'Penutup' : 'Inti',
    durasi: step.durasi || '',
    judul: step.judul || '',
    deskripsi: step.deskripsi || '',
  }));
}

function deriveKuisToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const kuis = block as {
    questions?: Array<{ q?: string; opts?: string[]; ans?: number; ex?: string; pertemuan?: number }>;
  };

  if (!kuis.questions?.length) return;

  // Merge with existing kuis if multiple kuis blocks exist
  const existing = projection.kuis || [];
  projection.kuis = [
    ...existing,
    ...kuis.questions.map(q => ({
      q: q.q || '',
      opts: q.opts || [],
      ans: q.ans ?? 0,
      ex: q.ex || '',
      ...(q.pertemuan != null ? { pertemuan: q.pertemuan } : {}),
    })),
  ];
}

function deriveDiskusiToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const diskusi = block as {
    title?: string;
    intro?: string;
    questions?: Array<{ label?: string; icon?: string; teks?: string; petunjuk?: string }>;
  };

  if (!diskusi.questions?.length) return;

  projection.diskusi = {
    title: diskusi.title || 'Diskusi',
    intro: diskusi.intro || '',
    pertanyaan: diskusi.questions.map(q => ({
      label: q.label || '',
      icon: q.icon || '💬',
      teks: q.teks || '',
      petunjuk: q.petunjuk || '',
    })),
  };
}

function deriveRefleksiToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const refleksi = block as {
    title?: string;
    intro?: string;
    questions?: Array<{ teks?: string; petunjuk?: string; warna?: string; icon?: string }>;
    penugasan?: { judul?: string; isi?: string; contoh?: string };
  };

  if (!refleksi.questions?.length) return;

  projection.refleksi = {
    title: refleksi.title || 'Refleksi',
    intro: refleksi.intro || '',
    pertanyaan: refleksi.questions.map(q => ({
      teks: q.teks || '',
      petunjuk: q.petunjuk || '',
      warna: q.warna,
      icon: q.icon,
    })),
    penugasan: refleksi.penugasan ? {
      judul: refleksi.penugasan.judul || '',
      isi: refleksi.penugasan.isi || '',
      contoh: refleksi.penugasan.contoh,
    } : undefined,
  };
}

function deriveMateriSectionToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const materi = block as {
    title?: string;
    content?: SchemaBlock[];
    takeaways?: string[];
  };

  // Convert nested content blocks to MateriBlok[]
  const bloks: MateriBlok[] = [];
  const content = materi.content || [];

  for (const child of content) {
    switch (child.type) {
      case 'def-box': {
        const def = child as { content?: string; borderColor?: string; semantic?: { style?: string } };
        // Detect kutipan vs teks vs definisi via borderColor + semantic hints
        const isQuote = def.semantic?.style === 'quote' || (def.content?.startsWith('"') && def.content?.endsWith('"'));
        bloks.push({
          tipe: isQuote ? 'kutipan' : (def.borderColor === 'c' ? 'teks' : (def.borderColor === 'g' ? 'infobox' : 'definisi')),
          isi: def.content || '',
          warna: def.borderColor,
        });
        break;
      }
      case 'nc-grid': {
        const grid = child as { cards?: Array<{ icon?: string; title?: string; body?: string; color?: string }> };
        bloks.push({
          tipe: 'poin',
          judul: 'Daftar',
          butir: (grid.cards || []).map(c => c.title || c.body || ''),
        });
        break;
      }
      case 'flashcard-set': {
        const fc = child as { cards?: Array<{ q?: string; a?: string }> };
        bloks.push({
          tipe: 'flashcard',
          judul: 'Flashcard',
          items: (fc.cards || []).map(c => ({
            judul: c.q || '',
            isi: c.a || '',
          })),
        });
        break;
      }
      case 'tabel': {
        const tbl = child as { title?: string; headers?: string[]; rows?: string[][] };
        bloks.push({
          tipe: 'tabel',
          judul: tbl.title || '',
          baris: [tbl.headers || [], ...(tbl.rows || [])],
        });
        break;
      }
      case 'gambar': {
        const img = child as { title?: string; url?: string; caption?: string };
        bloks.push({
          tipe: 'gambar',
          judul: img.title || '',
          isi: img.url || '',
        });
        break;
      }
      case 'timeline': {
        const tl = child as { title?: string; steps?: Array<{ icon?: string; label?: string; description?: string; color?: string }> };
        bloks.push({
          tipe: 'timeline',
          judul: tl.title || '',
          langkah: (tl.steps || []).map(s => ({
            icon: s.icon || '📌',
            judul: s.label || '',
            isi: s.description || '',
          })),
        });
        break;
      }
      case 'checklist': {
        const cl = child as { title?: string; items?: Array<{ text?: string; checked?: boolean }> };
        bloks.push({
          tipe: 'checklist',
          judul: cl.title || '',
          butir: (cl.items || []).map(i => i.text || ''),
        });
        break;
      }
      case 'statistik': {
        const st = child as { title?: string; items?: Array<{ angka?: string; satuan?: string; label?: string; warna?: string }> };
        bloks.push({
          tipe: 'statistik',
          judul: st.title || '',
          items: (st.items || []).map(i => ({
            angka: i.angka || '',
            satuan: i.satuan || '',
            label: i.label || '',
            warna: i.warna || 'c',
          })),
        });
        break;
      }
      case 'studi': {
        const sd = child as { title?: string; karakter?: string; situasi?: string; pertanyaan?: string; pesan?: string };
        bloks.push({
          tipe: 'studi',
          judul: sd.title || '',
          karakter: sd.karakter || '',
          situasi: sd.situasi || '',
          pertanyaan: sd.pertanyaan || '',
          pesan: sd.pesan || '',
        });
        break;
      }
      case 'ftab': {
        const ft = child as { tabs?: Array<{ icon?: string; label?: string }> };
        bloks.push({
          tipe: 'definisi',
          judul: ft.tabs?.map(t => t.label).join(', ') || '',
          isi: 'Tab konten',
        });
        break;
      }
      case 'tabel-accord': {
        const ta = child as { rows?: Array<{ icon?: string; title?: string; color?: string }> };
        bloks.push({
          tipe: 'tabel',
          judul: 'Tabel',
          baris: [['No', 'Isi'], ...(ta.rows || []).map((r, i) => [`${i + 1}`, r.title || ''])],
        });
        break;
      }
      case 'nk-card': {
        const nk = child as { title?: string; definition?: string };
        bloks.push({
          tipe: 'definisi',
          judul: nk.title || '',
          isi: nk.definition || '',
        });
        break;
      }
    }
  }

  // Add takeaways as infobox
  if (materi.takeaways?.length) {
    bloks.push({
      tipe: 'infobox',
      judul: 'Ringkasan',
      isi: `Poin penting: ${materi.takeaways.join(', ')}`,
    });
  }

  if (bloks.length > 0) {
    projection.materi = { blok: bloks };
  }
}

function deriveSkenarioToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const skenario = block as {
    chapters?: Array<{
      id?: string;
      charEmoji?: string;
      title?: string;
      setup?: Array<{ speaker?: string; text?: string }>;
      choicePrompt?: string;
      choices?: Array<{
        icon?: string;
        label?: string;
        detail?: string;
        good?: boolean;
        pts?: number;
        level?: string;
        norma?: string;
        resultTitle?: string;
        resultBody?: string;
        consequences?: Array<{ icon?: string; text?: string }>;
      }>;
    }>;
  };

  if (!skenario.chapters?.length) return;

  projection.skenario = skenario.chapters.map(ch => ({
    title: ch.title || '',
    bg: 'default',
    charEmoji: ch.charEmoji || '🎭',
    charColor: '#f9c82e',
    charPants: '#3ecfcf',
    choicePrompt: ch.choicePrompt || 'Apa yang akan kamu lakukan?',
    setup: (ch.setup || []).map(s => ({
      speaker: s.speaker || '',
      text: s.text || '',
    })),
    choices: (ch.choices || []).map(c => ({
      icon: c.icon || '👉',
      label: c.label || '',
      detail: c.detail || '',
      good: c.good ?? false,
      pts: c.pts ?? 0,
      level: c.level || 'mid',
      norma: c.norma || '',
      resultTitle: c.resultTitle || '',
      resultBody: c.resultBody || '',
      consequences: (c.consequences || []).map(cs => ({
        icon: cs.icon || '',
        text: cs.text || '',
      })),
    })),
  }));
}

function deriveMotivasiToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const motivasi = block as {
    hookQuestion?: string;
    connections?: Array<{ label?: string; description?: string }>;
    transition?: string;
  };

  projection.motivasi = {
    title: 'Motivasi / Apersepsi',
    intro: motivasi.hookQuestion || '',
    pertanyaanPemicu: motivasi.hookQuestion || '',
    koneksi: motivasi.connections?.map(c => `${c.label}: ${c.description}`).join('\n') || '',
    aktivitas: motivasi.transition || '',
  };
}

function deriveRangkumanToProjection(block: SchemaBlock, projection: SchemaProjection): void {
  const rangkuman = block as {
    concepts?: Array<{ title?: string; body?: string }>;
    closingStatement?: string;
  };

  projection.rangkuman = {
    title: 'Rangkuman',
    intro: 'Ringkasan materi pembelajaran',
    poin: (rangkuman.concepts || []).map(c => `${c.title}: ${c.body}`),
    tips: rangkuman.closingStatement || '',
    closingStatement: rangkuman.closingStatement,
  };
}
