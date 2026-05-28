// ═══════════════════════════════════════════════════════════════════
// EXPORT PROJECTION — Derive export payload from CanvaPage[].schema
// ═══════════════════════════════════════════════════════════════════
// Phase 3: Replaces use-preview-builder's 15 useAuthoringStore reads
// with schema-derived data. The export API and entry-client.tsx still
// receive the SAME data shapes — only the source changes.
//
// Data flow:
//   READ:  CanvaStore.pages[].schema → project to authoring store shapes
//   WRITE: None — pure read-only projection
//   SYNC:  N/A — used for export/preview only
//
// Why not just use useSchemaProjection()?
//   - useSchemaProjection() only covers kuis + modules + meta
//   - Export needs ALL content shapes (diskusi, refleksi, materi, etc.)
//   - This is a non-React utility (no hooks) for use in callbacks
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type {
  KuisItem,
  Module,
  Game,
  MateriState,
  MateriBlok,
  DiskusiData,
  RefleksiData,
  PenutupData,
  PetunjukData,
  SkenarioChapter,
  SuaraConfig,
} from '@/store/authoring/types';
import type { MateriBlokBlock } from '@/core/schema/types/blocks';

// ── Game block type detection (same as use-schema-projection.ts) ──

const GAME_BLOCK_TYPES = [
  'sortir-game', 'roda-game', 'memory-game', 'matching-game',
  'fill-blank-game', 'word-search-game', 'true-false-game',
  'drag-drop-game', 'crossword-game', 'team-buzzer-game',
  'spinwheel-game', 'flashcard-set',
];

const GAME_TYPE_MAP: Record<string, string> = {
  'sortir-game': 'sorting',
  'roda-game': 'roda',
  'memory-game': 'memory',
  'matching-game': 'matching',
  'fill-blank-game': 'fillblank',
  'word-search-game': 'wordsearch',
  'true-false-game': 'truefalse',
  'drag-drop-game': 'dragdrop',
  'crossword-game': 'crossword',
  'team-buzzer-game': 'teambuzzer',
  'spinwheel-game': 'spinwheel',
  'flashcard-set': 'flashcard',
};

// ── Export Payload Type ──────────────────────────────────────────

export interface ExportPayload {
  allKuis: KuisItem[];
  allModules: Module[];
  games: Game[];
  materi: MateriState;
  diskusi: DiskusiData;
  refleksi: RefleksiData;
  penutup: PenutupData;
  petunjuk: PetunjukData;
  skenario: SkenarioChapter[];
}

// ── Main Projection Function ────────────────────────────────────

/**
 * Derive the full export payload from CanvaPage[].schema.
 * Returns the same data shapes as useAuthoringStore fields,
 * ensuring the export API and entry-client.tsx work unchanged.
 */
export function deriveExportPayloadFromSchema(pages: CanvaPage[]): ExportPayload {
  const allKuis: KuisItem[] = [];
  const allModules: Module[] = [];
  const allMateriBloks: MateriBlok[] = [];
  let diskusi: DiskusiData = { title: 'Diskusi', intro: '', pertanyaan: [] };
  let refleksi: RefleksiData = { title: 'Refleksi', intro: '', pertanyaan: [] };
  let penutup: PenutupData = { title: 'Penutup', subjudul: '', preview: [] };
  let petunjuk: PetunjukData = { title: '', intro: '', langkah: [] };
  const allSkenario: SkenarioChapter[] = [];

  for (const page of pages) {
    const schema = ensurePageSchema(page);
    if (!schema) continue;

    for (const block of schema.blocks) {
      switch (block.type) {
        case 'kuis':
          projectKuisBlock(block, page.id, allKuis);
          break;
        case 'diskusi':
          diskusi = projectDiskusiBlock(block);
          break;
        case 'refleksi':
          refleksi = projectRefleksiBlock(block);
          break;
        case 'penutup':
          penutup = projectPenutupBlock(block);
          break;
        case 'petunjuk':
          petunjuk = projectPetunjukBlock(block);
          break;
        case 'materi-section':
          projectMateriSectionBlock(block, allMateriBloks);
          break;
        case 'skenario':
          projectSkenarioBlock(block, allSkenario);
          break;
        default:
          if (GAME_BLOCK_TYPES.includes(block.type)) {
            projectGameBlock(block, allModules);
          }
          break;
      }
    }
  }

  // Games = modules filtered by game types (same as authoring store)
  const games: Game[] = allModules;

  return {
    allKuis,
    allModules,
    games,
    materi: { blok: allMateriBloks },
    diskusi,
    refleksi,
    penutup,
    petunjuk,
    skenario: allSkenario,
  };
}

// ── Individual Block Projectors ─────────────────────────────────

function projectKuisBlock(block: SchemaBlock, pageId: string, out: KuisItem[]) {
  const b = block as unknown as {
    questions?: Array<{
      q?: string;
      opts?: string[];
      ans?: number;
      ex?: string;
      pertemuan?: number;
    }>;
  };

  if (b.questions) {
    for (const q of b.questions) {
      out.push({
        _id: `${pageId}::${block.id}::${out.length}`,
        q: q.q || '',
        opts: q.opts || ['', '', '', ''],
        ans: q.ans ?? 0,
        ex: q.ex || '',
        ...(q.pertemuan != null ? { pertemuan: q.pertemuan } : {}),
      });
    }
  }
}

function projectDiskusiBlock(block: SchemaBlock): DiskusiData {
  const b = block as unknown as {
    title?: string;
    intro?: string;
    questions?: Array<{ label?: string; icon?: string; teks?: string; petunjuk?: string }>;
  };

  return {
    title: b.title || 'Diskusi',
    intro: b.intro || '',
    pertanyaan: (b.questions || []).map(q => ({
      label: q.label || '',
      icon: q.icon || '💬',
      teks: q.teks || '',
      petunjuk: q.petunjuk || '',
    })),
  };
}

function projectRefleksiBlock(block: SchemaBlock): RefleksiData {
  const b = block as unknown as {
    title?: string;
    intro?: string;
    questions?: Array<{ teks?: string; petunjuk?: string; warna?: string; icon?: string }>;
    penugasan?: { judul?: string; isi?: string; contoh?: string };
  };

  return {
    title: b.title || 'Refleksi',
    intro: b.intro || '',
    pertanyaan: (b.questions || []).map(q => ({
      teks: q.teks || '',
      petunjuk: q.petunjuk || '',
      warna: q.warna,
      icon: q.icon,
    })),
    penugasan: b.penugasan ? {
      judul: b.penugasan.judul || '',
      isi: b.penugasan.isi || '',
      contoh: b.penugasan.contoh,
    } : undefined,
  };
}

function projectPenutupBlock(block: SchemaBlock): PenutupData {
  const b = block as unknown as {
    title?: string;
    subtitle?: string;
    preview?: Array<{ icon: string; judul: string; isi: string; warna: string }>;
    nextPertemuan?: { judul: string; deskripsi: string; items: Array<{ icon: string; judul: string; isi: string; warna: string }> };
  };

  return {
    title: b.title || 'Penutup',
    subjudul: b.subtitle || '',
    preview: (b.preview || []).map(p => ({
      icon: p.icon || '📌',
      judul: p.judul || '',
      isi: p.isi || '',
      warna: p.warna || 'c',
    })),
    nextPertemuan: b.nextPertemuan ? {
      judul: b.nextPertemuan.judul || '',
      deskripsi: b.nextPertemuan.deskripsi || '',
      items: (b.nextPertemuan.items || []).map(i => ({
        icon: i.icon || '📌',
        judul: i.judul || '',
        isi: i.isi || '',
        warna: i.warna || 'c',
      })),
    } : undefined,
  };
}

function projectPetunjukBlock(block: SchemaBlock): PetunjukData {
  const b = block as unknown as {
    title?: string;
    titleHighlight?: string;
    items?: Array<{ icon: string; title: string; body: string }>;
    tips?: string;
    navigation?: Array<{ icon: string; label: string; description: string }>;
  };

  return {
    title: b.title || 'Petunjuk',
    intro: b.titleHighlight || '',
    langkah: (b.items || []).map(item => ({
      icon: item.icon || '📌',
      judul: item.title || '',
      isi: item.body || '',
    })),
    tips: b.tips,
    navigation: (b.navigation || []).map(n => n.label),
  };
}

function projectMateriSectionBlock(block: SchemaBlock, out: MateriBlok[]) {
  const b = block as unknown as {
    content?: SchemaBlock[];
  };

  const content = b.content || [];
  for (const child of content) {
    if (child.type === 'materi-blok') {
      out.push(materiBlokBlockToProjection(child as unknown as MateriBlokBlock));
    }
  }
}

/**
 * Project MateriBlokBlock → MateriBlok (same as use-schema-navigator.ts)
 */
function materiBlokBlockToProjection(block: MateriBlokBlock): MateriBlok {
  return {
    tipe: block.tipe,
    judul: block.judul,
    isi: block.isi,
    icon: block.icon,
    warna: block.warna,
    butir: block.butir,
    baris: block.baris,
    langkah: block.langkah?.map(l => ({
      icon: l.icon || '📌',
      judul: l.judul,
      isi: l.isi || '',
    })),
    kiri: block.kiri,
    kanan: block.kanan,
    items: block.items?.map(item => ({
      ...item,
    })),
    // Map infoboxStyle → style for backward compat
    style: block.infoboxStyle || (typeof block.style === 'string' ? block.style : undefined),
    infoboxStyle: block.infoboxStyle,
    karakter: block.karakter,
    situasi: block.situasi,
    pertanyaan: block.pertanyaan,
    pesan: block.pesan,
    pertemuan: block.pertemuan,
    tabGroup: block.tabGroup,
  };
}

function projectSkenarioBlock(block: SchemaBlock, out: SkenarioChapter[]) {
  const b = block as unknown as {
    chapters?: Array<Record<string, unknown>>;
  };

  const chapters = b.chapters || [];
  for (const ch of chapters) {
    out.push({
      id: (ch.id as string) || '',
      title: (ch.title as string) || '',
      bg: (ch.bg as string) || 'sbg-kampung',
      charEmoji: (ch.charEmoji as string) || '🧑',
      charColor: (ch.charColor as string) || '#60a5fa',
      charPants: (ch.charPants as string) || '#34d399',
      choicePrompt: (ch.choicePrompt as string) || '',
      setup: ((ch.setup as Array<Record<string, unknown>>) || []).map(s => ({
        speaker: (s.speaker as string) || '',
        text: (s.text as string) || '',
      })),
      choices: ((ch.choices as Array<Record<string, unknown>>) || []).map(c => ({
        icon: (c.icon as string) || '🔍',
        label: (c.label as string) || '',
        detail: (c.detail as string) || '',
        good: (c.good as boolean) ?? false,
        pts: (c.pts as number) ?? 0,
        level: (c.level as string) || 'mid',
        norma: (c.norma as string) || '',
        resultTitle: (c.resultTitle as string) || '',
        resultBody: (c.resultBody as string) || '',
        consequences: ((c.consequences as Array<Record<string, unknown>>) || []).map(con => ({
          icon: (con.icon as string) || '📌',
          text: (con.text as string) || '',
        })),
      })),
    });
  }
}

function projectGameBlock(block: SchemaBlock, out: Module[]) {
  const b = block as unknown as Record<string, unknown>;
  out.push({
    _id: block.id || '',
    type: GAME_TYPE_MAP[block.type] || block.type,
    title: (b.title as string) || block.type,
    layoutVariant: (b.layoutVariant as string) || 'A',
    ...b, // Spread all game-specific fields
  });
}
