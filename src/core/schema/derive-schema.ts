// ═══════════════════════════════════════════════════════════════════
// DERIVE SCHEMA — Authoring State → ScreenSchema (FASE 3)
// ═══════════════════════════════════════════════════════════════════
// This is the ONE-WAY data flow bridge:
//   Authoring Store → deriveSchema() → page.schema → Renderer → Canvas
//
// It replaces the dual-path:
//   OLD: Authoring → buildTemplateData() → templateData → TemplateAdapter → SchemaScreenRenderer
//   NEW: Authoring → deriveSchema() → page.schema → SchemaScreenRenderer
//
// Design Principles:
//   1. ONE-WAY — Authoring → Schema → Canvas. NEVER reverse.
//   2. PURE — deriveSchema reads authoring state and produces a new ScreenSchema.
//      No mutation, no side effects.
//   3. ID-STABLE — Preserves existing block IDs when re-deriving.
//      New blocks get nanoid(10). This is critical for undo/redo, selection.
//   4. COMPLETE — Each templateType has its own derive function that
//      produces the full ScreenSchema with all content blocks.
//   5. NO templateData — Derives directly from authoring store slices,
//      bypassing the templateData intermediate format entirely.

import type { ScreenSchema, SchemaBlock } from './types';
import type { CanvaPage, PageTemplateType } from '@/components/canva/types';
import type {
  MetaState,
  CpState,
  TpItem,
  AlurItem,
  MateriState,
  KuisItem,
  PetunjukData,
  DiskusiData,
  RefleksiData,
  PenutupData,
} from '@/store/authoring/types';
import { generateBlockId } from './ensure-schema';

// ═══════════════════════════════════════════════════════════════════
// CONTEXT — Snapshot of all authoring data needed for derivation
// ═══════════════════════════════════════════════════════════════════

export interface DeriveContext {
  meta: MetaState;
  cp: CpState;
  tp: TpItem[];
  atp: { namaBab: string; jumlahPertemuan: number; pertemuan: Array<Record<string, unknown>> };
  alur: AlurItem[];
  materi: MateriState;
  kuis: KuisItem[];
  modules: Array<Record<string, unknown>>;
  skenario: Array<Record<string, unknown>>;
  petunjuk: PetunjukData;
  diskusi: DiskusiData;
  refleksi: RefleksiData;
  penutup: PenutupData;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT — deriveSchema()
// ═══════════════════════════════════════════════════════════════════

/**
 * Derive a ScreenSchema from the current authoring state.
 * This is the primary entry point for Phase 3 one-way data flow.
 *
 * @param templateType — The page template type to derive for
 * @param ctx — Snapshot of authoring state (use createDeriveContext())
 * @param existingSchema — Current page.schema (for ID preservation)
 * @returns ScreenSchema or null (for custom pages)
 */
export function deriveSchema(
  templateType: PageTemplateType,
  ctx: DeriveContext,
  existingSchema?: ScreenSchema | null,
): ScreenSchema | null {
  if (templateType === 'custom' || !templateType) return null;

  // Build an ID map from the existing schema for stable ID reuse
  const idMap = buildIdMap(existingSchema);

  const blocks: SchemaBlock[] = [];

  switch (templateType) {
    case 'cover':
      blocks.push(deriveCover(ctx, idMap));
      break;
    case 'petunjuk':
      blocks.push(derivePetunjuk(ctx, idMap));
      break;
    case 'dokumen':
      blocks.push(...deriveDokumen(ctx, idMap));
      break;
    case 'materi':
      blocks.push(...deriveMateri(ctx, idMap));
      break;
    case 'diskusi':
      blocks.push(deriveDiskusi(ctx, idMap));
      break;
    case 'skenario':
      blocks.push(deriveSkenario(ctx, idMap));
      break;
    case 'kuis':
      blocks.push(deriveKuis(ctx, idMap));
      break;
    case 'game':
      blocks.push(...deriveGame(ctx, idMap));
      break;
    case 'hasil':
      blocks.push(deriveHasil(ctx, idMap));
      break;
    case 'refleksi':
      blocks.push(deriveRefleksi(ctx, idMap));
      break;
    case 'penutup':
      blocks.push(derivePenutup(ctx, idMap));
      break;
    case 'hero':
      blocks.push(deriveCover(ctx, idMap)); // Hero ≈ Cover layout
      break;
    default:
      blocks.push(deriveGenericFallback(ctx, templateType, idMap));
      break;
  }

  // Fallback: if no blocks produced, add a generic def-box
  if (blocks.length === 0) {
    blocks.push(deriveGenericFallback(ctx, templateType, idMap));
  }

  return {
    id: existingSchema?.id || '', // Will be set by caller with page.id
    templateType,
    sectionLabel: getSectionLabel(templateType),
    sectionColor: getSectionColor(templateType),
    blocks,
    background: (templateType === 'cover' || templateType === 'hero') ? {
      type: 'radial',
      color1: 'y',
      color2: 'bg',
    } : undefined,
    nav: {},
  };
}

/**
 * Derive schema for an existing page — preserves page.id and existing block IDs.
 */
export function deriveSchemaForPage(
  page: CanvaPage,
  ctx: DeriveContext,
): ScreenSchema | null {
  const schema = deriveSchema(page.templateType, ctx, page.schema);
  if (schema) {
    schema.id = page.id; // Always use page.id as schema.id
  }
  return schema;
}

// ═══════════════════════════════════════════════════════════════════
// ID PRESERVATION — Critical for undo/redo, selection, collaboration
// ═══════════════════════════════════════════════════════════════════

type BlockIdMap = Map<string, string>; // key: "type:index" → existing block ID

/**
 * Build a lookup map from an existing schema's blocks.
 * Key format: "{blockType}:{indexInArray}" — this lets us match
 * blocks by type and position even when content changes.
 */
function buildIdMap(existingSchema: ScreenSchema | null | undefined): BlockIdMap {
  const map = new Map<string, string>();
  if (!existingSchema?.blocks) return map;

  // Track index per type for stable matching
  const typeCounters = new Map<string, number>();

  for (const block of existingSchema.blocks) {
    if (!block.id) continue;
    const counter = typeCounters.get(block.type) ?? 0;
    map.set(`${block.type}:${counter}`, block.id);
    typeCounters.set(block.type, counter + 1);
  }

  return map;
}

/**
 * Get or generate a block ID. Reuses existing ID when possible
 * (matched by type and position), generates nanoid for new blocks.
 */
function getBlockId(idMap: BlockIdMap, blockType: string, index: number): string {
  const existing = idMap.get(`${blockType}:${index}`);
  return existing || generateBlockId();
}

// ═══════════════════════════════════════════════════════════════════
// PER-TYPE DERIVERS — Direct authoring → SchemaBlock conversion
// ═══════════════════════════════════════════════════════════════════

function deriveCover(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const m = ctx.meta;
  return {
    type: 'cover',
    id: getBlockId(idMap, 'cover', 0),
    icon: m.ikon || '\u{1F4DA}',
    title: m.judulPertemuan || 'Judul Pertemuan',
    subtitle: m.subjudul || 'Subjudul',
    badges: [
      ...(m.mapel || m.namaBab ? [{
        icon: '\u{1F4DA}',
        text: `${m.namaBab || m.mapel || ''}${m.kelas ? ` \u2022 Kelas ${m.kelas}` : ''}`,
        color: 'y',
      }] : []),
      ...(m.durasi ? [{
        icon: '\u23F1\uFE0F',
        text: m.durasi,
        color: 'c',
      }] : []),
    ],
    meta: {
      durasi: m.durasi || '',
      fase: ctx.cp?.fase || 'VII',
      elemen: ctx.cp?.elemen || '',
    },
    cta: {
      label: 'Mulai Belajar \u2192',
      action: 'next',
    },
  };
}

function derivePetunjuk(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const p = ctx.petunjuk;
  return {
    type: 'petunjuk',
    id: getBlockId(idMap, 'petunjuk', 0),
    title: p.title || 'Petunjuk',
    titleHighlight: 'Penggunaan',
    items: (p.langkah || []).map((step) => ({
      icon: step.icon || '\u{1F4CC}',
      title: step.judul || '',
      body: step.isi || '',
    })),
    tips: p.tips || undefined,
    tipsColor: 'y',
  };
}

function deriveDokumen(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];
  let blockIdx = 0;

  // TP (Tujuan Pembelajaran)
  const tpItems = ctx.tp;
  if (tpItems && tpItems.length > 0) {
    blocks.push({
      type: 'tp',
      id: getBlockId(idMap, 'tp', blockIdx++),
      title: 'Tujuan Pembelajaran',
      titleHighlight: '',
      items: tpItems.map((item, i) => ({
        num: i + 1,
        verb: item.verb || '',
        desc: item.desc || '',
        color: ['y', 'c', 'g', 'p'][i % 4],
      })),
      profil: ctx.cp?.profil?.length ? ctx.cp.profil.join(', ') : undefined,
      profilColor: 'g',
    });
  }

  // Alur
  const alurSteps = ctx.alur;
  if (alurSteps && alurSteps.length > 0) {
    blocks.push({
      type: 'alur',
      id: getBlockId(idMap, 'alur', blockIdx++),
      title: 'Alur Kegiatan',
      totalDurasi: undefined,
      steps: alurSteps.map((step) => ({
        dot: step.fase === 'pendahuluan' ? 'y' : step.fase === 'inti' ? 'c' : 'g',
        durasi: step.durasi || '',
        judul: step.judul || '',
        deskripsi: step.deskripsi || '',
      })),
    });
  }

  // If no specific blocks, create a generic TP block
  if (blocks.length === 0) {
    blocks.push({
      type: 'tp',
      id: getBlockId(idMap, 'tp', 0),
      title: 'Dokumen',
      titleHighlight: '',
      items: [{
        num: 1,
        verb: '',
        desc: 'Konten dokumen belum diisi',
        color: 'y',
      }],
    });
  }

  return blocks;
}

function deriveMateri(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];
  const bloks = ctx.materi.blok || [];
  let blockIdx = 0;

  for (const blok of bloks) {
    const id = getBlockId(idMap, 'def-box', blockIdx);

    switch (blok.tipe) {
      case 'definisi':
        blocks.push({
          type: 'def-box',
          id,
          borderColor: 'y',
          content: [
            blok.judul ? `<strong>${blok.judul}</strong>` : '',
            blok.isi || '',
          ].filter(Boolean).join('<br/><br/>') || 'Definisi belum diisi',
        });
        blockIdx++;
        break;

      case 'poin':
      case 'checklist':
        blocks.push({
          type: 'nc-grid',
          id: getBlockId(idMap, 'nc-grid', blockIdx),
          cards: (blok.butir || []).map((b, i) => ({
            icon: blok.tipe === 'checklist' ? '\u2705' : '\u{1F4CC}',
            title: '',
            body: b || '',
            color: ['y', 'c', 'g', 'p'][i % 4],
          })),
        });
        blockIdx++;
        break;

      case 'tabel':
        blocks.push({
          type: 'def-box',
          id,
          borderColor: 'c',
          content: formatTabel(blok),
        });
        blockIdx++;
        break;

      case 'kutipan':
        blocks.push({
          type: 'def-box',
          id,
          borderColor: 'g',
          content: blok.isi ? `\u{1F4AC} "${blok.isi}"${blok.judul ? ` \u2014 ${blok.judul}` : ''}` : 'Kutipan belum diisi',
        });
        blockIdx++;
        break;

      case 'highlight':
        blocks.push({
          type: 'def-box',
          id,
          borderColor: String(blok.warna || 'y').replace('#', '').length > 2 ? 'y' : String(blok.warna || 'y'),
          content: [
            blok.icon ? `${blok.icon} ` : '',
            blok.judul ? `<strong>${blok.judul}</strong>` : '',
            blok.isi || '',
          ].filter(Boolean).join('<br/>') || 'Highlight belum diisi',
        });
        blockIdx++;
        break;

      case 'compare':
        blocks.push({
          type: 'nc-grid',
          id: getBlockId(idMap, 'nc-grid', blockIdx),
          cards: [
            {
              icon: blok.kiri?.icon || '\u{1F539}',
              title: blok.kiri?.judul || 'Kiri',
              body: blok.kiri?.isi || '',
              color: 'y',
            },
            {
              icon: blok.kanan?.icon || '\u{1F538}',
              title: blok.kanan?.judul || 'Kanan',
              body: blok.kanan?.isi || '',
              color: 'c',
            },
          ],
        });
        blockIdx++;
        break;

      case 'timeline':
        blocks.push({
          type: 'alur',
          id: getBlockId(idMap, 'alur', blockIdx),
          title: blok.judul || 'Timeline',
          steps: (blok.langkah || []).map((step) => ({
            dot: 'y',
            durasi: '',
            judul: step.judul || '',
            deskripsi: step.isi || '',
          })),
        });
        blockIdx++;
        break;

      case 'infobox':
      case 'studi':
        blocks.push({
          type: 'def-box',
          id,
          borderColor: 'p',
          content: formatInfobox(blok),
        });
        blockIdx++;
        break;

      case 'statistik':
        blocks.push({
          type: 'nc-grid',
          id: getBlockId(idMap, 'nc-grid', blockIdx),
          cards: (blok.items || []).map((item, i) => ({
            icon: item.icon || '\u{1F4CA}',
            title: item.angka || '',
            body: item.label || '',
            color: ['y', 'c', 'g', 'p'][i % 4],
          })),
        });
        blockIdx++;
        break;

      case 'teks':
      case 'gambar':
      default:
        blocks.push({
          type: 'def-box',
          id,
          borderColor: 'y',
          content: [
            blok.judul ? `<strong>${blok.judul}</strong>` : '',
            blok.isi || '',
          ].filter(Boolean).join('<br/><br/>') || 'Konten belum diisi',
        });
        blockIdx++;
        break;
    }
  }

  // If no materi blocks, add a placeholder
  if (blocks.length === 0) {
    blocks.push({
      type: 'def-box',
      id: getBlockId(idMap, 'def-box', 0),
      borderColor: 'y',
      content: 'Materi pembelajaran belum diisi',
    });
  }

  return blocks;
}

function deriveDiskusi(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const d = ctx.diskusi;
  return {
    type: 'diskusi',
    id: getBlockId(idMap, 'diskusi', 0),
    title: d.title || 'Diskusi',
    intro: d.intro || undefined,
    questions: (d.pertanyaan || []).map((q) => ({
      label: q.label || '',
      icon: q.icon || '\u{1F4AC}',
      teks: q.teks || '',
      petunjuk: q.petunjuk || '',
    })),
  };
}

function deriveSkenario(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const chapters = ctx.skenario || [];
  return {
    type: 'skenario',
    id: getBlockId(idMap, 'skenario', 0),
    title: chapters.length > 0 ? 'Skenario Interaktif' : 'Skenario',
    chapters: chapters.map((ch, i) => ({
      id: String(ch.id || `ch-${i}`),
      charEmoji: String(ch.charEmoji || ch.icon || '\u{1F3AD}'),
      title: String(ch.title || ''),
      setup: (ch.setup as Array<{ speaker: string; text: string }>) || undefined,
      choicePrompt: ch.choicePrompt ? String(ch.choicePrompt) : undefined,
      choices: ((ch.choices || []) as Array<Record<string, unknown>>).map((c) => ({
        icon: String(c.icon || '\u{1F449}'),
        label: String(c.label || ''),
        detail: c.detail ? String(c.detail) : undefined,
        good: Boolean(c.good),
        pts: Number(c.pts || 0),
        level: (['good', 'mid', 'bad'].includes(String(c.level)) ? c.level : 'mid') as 'good' | 'mid' | 'bad',
        resultTitle: c.resultTitle ? String(c.resultTitle) : undefined,
        resultBody: c.resultBody ? String(c.resultBody) : undefined,
        feedbackGood: c.feedbackGood ? String(c.feedbackGood) : undefined,
        feedbackBad: c.feedbackBad ? String(c.feedbackBad) : undefined,
        norma: c.norma ? String(c.norma) : undefined,
        consequences: (c.consequences as Array<{ icon: string; text: string }>) || undefined,
        nextChapter: c.nextChapter != null ? Number(c.nextChapter) : undefined,
      })),
    })),
  };
}

function deriveKuis(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const questions = (ctx.kuis || []).filter(k => k.q?.trim());
  return {
    type: 'kuis',
    id: getBlockId(idMap, 'kuis', 0),
    title: 'Kuis',
    questions: questions.map((q) => ({
      q: q.q || '',
      opts: q.opts || ['', '', '', ''],
      ans: q.ans ?? 0,
      ex: q.ex || '',
    })),
  };
}

function deriveGame(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock[] {
  const GAME_TYPES = ['sortir', 'sortir-game', 'roda', 'roda-game', 'spinwheel', 'sorting'];
  const games = (ctx.modules || []).filter((m: Record<string, unknown>) =>
    GAME_TYPES.includes(m.type as string)
  );

  if (games.length === 0) {
    // No game modules — fallback to kuis format
    return [deriveKuis(ctx, idMap)];
  }

  const blocks: SchemaBlock[] = [];

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    const gameType = game.type as string;
    const id = getBlockId(idMap, gameType === 'sortir' || gameType === 'sortir-game' || gameType === 'sorting' ? 'sortir-game' : 'roda-game', i);

    if (gameType === 'sortir' || gameType === 'sortir-game' || gameType === 'sorting') {
      const pool = (game.pool || game.items || []) as Array<Record<string, unknown>>;
      const kolom = (game.kolom || game.columns || game.categories || []) as Array<Record<string, unknown>>;
      blocks.push({
        type: 'sortir-game',
        id,
        title: String(game.title || 'Game Sortir'),
        pool: pool.map((item) => ({
          id: String(item.id || ''),
          text: String(item.text || item.label || ''),
          category: String(item.category || item.kolom || ''),
        })),
        kolom: kolom.map((k) => ({
          id: String(k.id || k.key || ''),
          label: String(k.label || k.name || ''),
          color: String(k.color || 'y'),
        })),
      });
    } else {
      // Roda / Spinwheel
      const questions = (game.questions || game.items || []) as Array<Record<string, unknown>>;
      blocks.push({
        type: 'roda-game',
        id,
        title: String(game.title || 'Game Roda'),
        questions: questions.map((q) => ({
          q: String(q.q || q.question || ''),
          diskusiHint: q.diskusiHint ? String(q.diskusiHint) : undefined,
          opts: ((q.opts || q.options || []) as Array<Record<string, unknown>>).map((opt) => ({
            text: String(opt.text || opt.label || ''),
            correct: Boolean(opt.correct || opt.isCorrect),
          })),
          feedbackCorrect: q.feedbackCorrect ? String(q.feedbackCorrect) : undefined,
          feedbackWrong: q.feedbackWrong ? String(q.feedbackWrong) : undefined,
        })),
      });
    }
  }

  return blocks;
}

function deriveHasil(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  return {
    type: 'hasil',
    id: getBlockId(idMap, 'hasil', 0),
    title: 'Hasil',
    subtitle: ctx.meta.namaBab || '',
  };
}

function deriveRefleksi(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const r = ctx.refleksi;
  return {
    type: 'refleksi',
    id: getBlockId(idMap, 'refleksi', 0),
    title: r.title || 'Refleksi',
    intro: r.intro || undefined,
    questions: (r.pertanyaan || []).map((q) => ({
      teks: q.teks || '',
      petunjuk: q.petunjuk || '',
      warna: q.warna || undefined,
      icon: q.icon || undefined,
    })),
    penugasan: r.penugasan ? {
      judul: r.penugasan.judul || '',
      isi: r.penugasan.isi || '',
    } : undefined,
  };
}

function derivePenutup(ctx: DeriveContext, idMap: BlockIdMap): SchemaBlock {
  const p = ctx.penutup;
  return {
    type: 'penutup',
    id: getBlockId(idMap, 'penutup', 0),
    title: p.title || 'Penutup',
    subtitle: p.subjudul || '',
    preview: (p.preview || []).map((item) => ({
      icon: item.icon || '\u{1F4CC}',
      judul: item.judul || '',
      isi: item.isi || '',
      warna: item.warna || 'y',
    })),
    nextPertemuan: p.nextPertemuan ? {
      judul: p.nextPertemuan.judul || '',
      deskripsi: p.nextPertemuan.deskripsi || '',
      items: (p.nextPertemuan.items || []).map((item) => ({
        icon: item.icon || '\u{1F4CC}',
        judul: item.judul || '',
        isi: item.isi || '',
        warna: item.warna || 'y',
      })),
    } : undefined,
  };
}

function deriveGenericFallback(
  ctx: DeriveContext,
  templateType: string,
  idMap: BlockIdMap,
): SchemaBlock {
  const title = ctx.meta.judulPertemuan || '';
  return {
    type: 'def-box',
    id: getBlockId(idMap, 'def-box', 0),
    borderColor: getSectionColor(templateType),
    content: title
      ? `<strong>${title}</strong><br/><br/>Template "${templateType}" \u2014 konten belum tersedia`
      : `Template "${templateType}" \u2014 konten belum tersedia`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function formatTabel(blok: { judul?: string; baris?: string[][] }): string {
  if (!blok.baris || blok.baris.length === 0) {
    return blok.judul || 'Tabel belum diisi';
  }
  const header = blok.baris[0]?.map(h => `<strong>${h}</strong>`).join(' | ') || '';
  const rows = blok.baris.slice(1).map(r => r.join(' | ')).join('<br/>');
  return [blok.judul ? `<strong>${blok.judul}</strong>` : '', header, rows].filter(Boolean).join('<br/><br/>');
}

function formatInfobox(blok: {
  tipe?: string; judul?: string; isi?: string; icon?: string;
  style?: string; karakter?: string; situasi?: string;
  pertanyaan?: string; pesan?: string;
}): string {
  const parts: string[] = [];
  if (blok.judul) parts.push(`<strong>${blok.judul}</strong>`);
  if (blok.situasi) parts.push(`\u{1F3AD} ${blok.situasi}`);
  if (blok.isi) parts.push(blok.isi);
  if (blok.pertanyaan) parts.push(`\u2753 ${blok.pertanyaan}`);
  if (blok.pesan) parts.push(`\u{1F4DD} ${blok.pesan}`);
  return parts.join('<br/><br/>') || 'Infobox belum diisi';
}

function getSectionLabel(tt: string): string {
  const labels: Record<string, string> = {
    cover: 'Cover', petunjuk: 'Petunjuk', dokumen: 'Dokumen',
    skenario: 'Skenario', materi: 'Materi', diskusi: 'Diskusi',
    kuis: 'Kuis', game: 'Game', hasil: 'Hasil',
    refleksi: 'Refleksi', penutup: 'Penutup', hero: 'Hero',
  };
  return labels[tt] || tt;
}

function getSectionColor(tt: string): string {
  const colors: Record<string, string> = {
    cover: 'y', petunjuk: 'c', dokumen: 'c',
    skenario: 'p', materi: 'p', diskusi: 'c',
    kuis: 'y', game: 'c', hasil: 'g',
    refleksi: 'p', penutup: 'o', hero: 'o',
  };
  return colors[tt] || 'y';
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXT FACTORY — Create DeriveContext from authoring store
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a DeriveContext snapshot from the current authoring store state.
 * This is the ONLY way to create a DeriveContext — ensures consistency.
 *
 * Usage:
 *   const ctx = createDeriveContext();
 *   const schema = deriveSchema('cover', ctx, page.schema);
 */
export function createDeriveContext(): DeriveContext {
  // Lazy import to avoid circular dependency at module level.
  // The authoring store imports are only needed at runtime, not at
  // module evaluation time.
  const { useAuthoringStore } = require('@/store/authoring-store');
  const s = useAuthoringStore.getState();

  return {
    meta: s.meta,
    cp: s.cp,
    tp: s.tp,
    atp: s.atp,
    alur: s.alur,
    materi: s.materi,
    kuis: s.kuis,
    modules: s.modules,
    skenario: s.skenario,
    petunjuk: s.petunjuk,
    diskusi: s.diskusi,
    refleksi: s.refleksi,
    penutup: s.penutup,
  };
}
