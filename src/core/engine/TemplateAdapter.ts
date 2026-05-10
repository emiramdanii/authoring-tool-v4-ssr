// ═══════════════════════════════════════════════════════════════════
// TEMPLATE ADAPTER — Converts legacy CanvaPage → ScreenSchema
// ═══════════════════════════════════════════════════════════════════
// This bridges the gap between:
//   - Legacy pages (templateData + colorPalette)
//   - Schema-driven pages (ScreenSchema + TokenResolver)
//
// Instead of having two separate renderers (PageTemplate + SchemaRenderer),
// we convert legacy data to ScreenSchema on-the-fly and always use
// SchemaScreenRenderer. This ensures visual consistency.
//
// The legacy template files are NOT deleted — they stay as reference
// and fallback. But the rendering pipeline is now unified.

import type { CanvaPage, ColorPalette } from '@/components/canva/types';
import type {
  ScreenSchema,
  SchemaBlock,
  CoverBlock,
  PetunjukBlock,
  TpBlock,
  AlurBlock,
  SkenarioBlock,
  DiskusiBlock,
  KuisBlock,
  RefleksiBlock,
  PenutupBlock,
  HasilBlock,
  DefBoxBlock,
  NcGridBlock,
  FlashcardSetBlock,
  SortirGameBlock,
  RodaGameBlock,
  FtabBlock,
  NormaKartuBlock,
} from '../schema/types';

// ═══════════════════════════════════════════════════════════════════
// PALETTE → TOKEN KEY MAPPING
// ═══════════════════════════════════════════════════════════════════
// Legacy templates use `getPaletteColor(palette, '--y', '#fallback')`.
// Schema renderer uses `tokens.color('y')`.
// We need to resolve the palette first, then map to token keys.

function resolveColor(palette: ColorPalette | null, key: string, fallback: string): string {
  return palette?.mapping?.[key] || fallback;
}

/**
 * Create a "palette-aware" theme ID by checking if the palette
 * has custom mappings that differ from the defaults.
 * Returns undefined if palette is default/empty.
 */
export function inferThemeId(palette: ColorPalette | null): string | undefined {
  if (!palette || !palette.mapping) return undefined;
  // If palette has custom colors, we still use default tokens
  // but the TemplateAdapter will inject palette overrides
  return undefined;
}

/**
 * Create custom token overrides from a ColorPalette.
 * This allows legacy pages to get their palette colors
 * while still using the token system.
 */
export function paletteToTokenOverrides(palette: ColorPalette | null): Record<string, string> | undefined {
  if (!palette || !palette.mapping) return undefined;
  const overrides: Record<string, string> = {};
  const mapping = palette.mapping;

  // Map CSS var names to token keys
  if (mapping['--y']) overrides.y = mapping['--y'];
  if (mapping['--c']) overrides.c = mapping['--c'];
  if (mapping['--g']) overrides.g = mapping['--g'];
  if (mapping['--r']) overrides.r = mapping['--r'];
  if (mapping['--bg']) overrides.bg = mapping['--bg'];
  if (mapping['--card']) overrides.card = mapping['--card'];

  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CONVERSION: CanvaPage → ScreenSchema
// ═══════════════════════════════════════════════════════════════════

/**
 * Convert a legacy CanvaPage to a ScreenSchema for unified rendering.
 * Returns null ONLY for custom pages (no template type).
 * For any valid template type, always produces a ScreenSchema —
 * even if the data is minimal, a generic fallback block is created.
 * This ensures dual rendering is truly dead: no PageTemplate fallback needed.
 */
export function convertToSchema(page: CanvaPage): ScreenSchema | null {
  const td = page.templateData;
  const tt = page.templateType;
  const variant = page.templateVariant || 'A';

  if (tt === 'custom' || !tt) return null;

  const blocks: SchemaBlock[] = [];

  switch (tt) {
    case 'cover':
      blocks.push(convertCover(td, variant));
      break;
    case 'petunjuk':
      blocks.push(convertPetunjuk(td));
      break;
    case 'dokumen':
      blocks.push(...convertDokumen(td));
      break;
    case 'skenario':
      blocks.push(convertSkenario(td));
      break;
    case 'materi':
      blocks.push(...convertMateri(td));
      break;
    case 'diskusi':
      blocks.push(convertDiskusi(td));
      break;
    case 'kuis':
      blocks.push(convertKuis(td));
      break;
    case 'game': {
      // Check game sub-type in templateData
      const gameType = td.gameType || td.gameSubtype || '';
      if (gameType === 'sortir' || gameType === 'sortir-game') {
        blocks.push(convertSortirGame(td));
      } else if (gameType === 'roda' || gameType === 'roda-game') {
        blocks.push(convertRodaGame(td));
      } else {
        blocks.push(convertKuis(td)); // Default game = kuis format
      }
      break;
    }
    case 'hasil':
      blocks.push(convertHasil(td));
      break;
    case 'refleksi':
      blocks.push(convertRefleksi(td));
      break;
    case 'penutup':
      blocks.push(convertPenutup(td));
      break;
    case 'hero':
      blocks.push(convertCover(td, variant)); // Hero is similar to cover
      break;
    default:
      // Unknown template type — create a generic fallback block
      // instead of returning null (which would trigger PageTemplate)
      blocks.push(convertGenericFallback(td, tt));
      break;
  }

  // If converter produced empty blocks, add a generic fallback
  // rather than returning null (which would trigger PageTemplate)
  if (blocks.length === 0) {
    blocks.push(convertGenericFallback(td, tt));
  }

  return {
    id: page.id,
    templateType: tt,
    sectionLabel: getSectionLabel(tt),
    sectionColor: getSectionColor(tt),
    blocks,
    background: tt === 'cover' || tt === 'hero' ? {
      type: 'radial',
      color1: 'y',
      color2: 'bg',
    } : undefined,
    nav: {},
  };
}

// ═══════════════════════════════════════════════════════════════════
// PER-TYPE CONVERTERS
// ═══════════════════════════════════════════════════════════════════

function convertCover(td: Record<string, unknown>, variant: 'A' | 'B' | 'C'): CoverBlock {
  return {
    type: 'cover',
    variant,
    icon: String(td.icon || '📚'),
    title: String(td.title || ''),
    subtitle: String(td.subtitle || ''),
    badges: [
      ...(td.mapel || td.namaBab ? [{
        icon: '📚',
        text: `${String(td.namaBab || td.mapel || '')}${td.kelas ? ` • Kelas ${td.kelas}` : ''}`,
        color: 'y',
      }] : []),
      ...(td.durasi ? [{
        icon: '⏱️',
        text: String(td.durasi),
        color: 'c',
      }] : []),
    ],
    meta: {
      durasi: String(td.durasi || ''),
      fase: String(td.fase || 'VII'),
      elemen: String(td.elemen || ''),
    },
    cta: {
      label: 'Mulai Belajar →',
      action: 'next',
    },
  };
}

function convertPetunjuk(td: Record<string, unknown>): PetunjukBlock {
  const items = (td.items as Array<Record<string, unknown>>) || [];
  return {
    type: 'petunjuk',
    title: String(td.title || 'Petunjuk'),
    titleHighlight: String(td.titleHighlight || 'Penggunaan'),
    items: items.map((item) => ({
      icon: String(item.icon || '📌'),
      title: String(item.title || ''),
      body: String(item.body || ''),
    })),
    tips: td.tips ? String(td.tips) : undefined,
    tipsColor: 'y',
  };
}

function convertDokumen(td: Record<string, unknown>): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];

  // TP (Tujuan Pembelajaran)
  const tpItems = (td.tpItems || td.items) as Array<Record<string, unknown>> | undefined;
  if (tpItems && tpItems.length > 0) {
    blocks.push({
      type: 'tp',
      title: String(td.tpTitle || 'Tujuan Pembelajaran'),
      titleHighlight: String(td.tpHighlight || ''),
      items: tpItems.map((item, i) => ({
        num: i + 1,
        verb: String(item.verb || ''),
        desc: String(item.desc || ''),
        color: ['y', 'c', 'g', 'p'][i % 4],
      })),
      profil: td.profil ? String(td.profil) : undefined,
      profilColor: 'g',
    } as TpBlock);
  }

  // Alur
  const alurSteps = (td.alurSteps || td.steps) as Array<Record<string, unknown>> | undefined;
  if (alurSteps && alurSteps.length > 0) {
    blocks.push({
      type: 'alur',
      title: 'Alur Kegiatan',
      totalDurasi: td.totalDurasi ? String(td.totalDurasi) : undefined,
      steps: alurSteps.map((step) => ({
        dot: String(step.dot || 'y'),
        durasi: String(step.durasi || ''),
        judul: String(step.judul || ''),
        deskripsi: String(step.deskripsi || ''),
      })),
    } as AlurBlock);
  }

  // If no specific blocks, create a generic tp block
  if (blocks.length === 0) {
    blocks.push({
      type: 'tp',
      title: String(td.title || 'Dokumen'),
      titleHighlight: '',
      items: [{
        num: 1,
        verb: '',
        desc: String(td.content || td.text || ''),
        color: 'y',
      }],
    } as TpBlock);
  }

  return blocks;
}

function convertSkenario(td: Record<string, unknown>): SkenarioBlock {
  const chapters = (td.chapters as Array<Record<string, unknown>>) || [];
  return {
    type: 'skenario',
    title: String(td.title || 'Skenario'),
    chapters: chapters.map((ch) => ({
      id: String(ch.id || ''),
      charEmoji: String(ch.charEmoji || ch.icon || '🎭'),
      title: String(ch.title || ''),
      setup: (ch.setup as Array<{ speaker: string; text: string }>) || undefined,
      choicePrompt: ch.choicePrompt ? String(ch.choicePrompt) : undefined,
      choices: ((ch.choices || []) as Array<Record<string, unknown>>).map((c) => ({
        icon: String(c.icon || '👉'),
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

function convertMateri(td: Record<string, unknown>): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];

  // Def-box
  if (td.definition || td.content) {
    blocks.push({
      type: 'def-box',
      borderColor: 'y',
      content: String(td.definition || td.content || ''),
    } as DefBoxBlock);
  }

  // NC Grid (Norma Cards)
  const cards = (td.cards || td.ncCards) as Array<Record<string, unknown>> | undefined;
  if (cards && cards.length > 0) {
    blocks.push({
      type: 'nc-grid',
      cards: cards.map((card) => ({
        icon: String(card.icon || '📋'),
        title: String(card.title || ''),
        body: String(card.body || ''),
        color: String(card.color || 'y'),
      })),
    } as NcGridBlock);
  }

  // Flashcard set
  const flashcards = (td.flashcards || td.cards) as Array<Record<string, unknown>> | undefined;
  if (flashcards && td.flashcards) {
    blocks.push({
      type: 'flashcard-set',
      cards: flashcards.map((fc) => ({
        q: String(fc.q || fc.question || ''),
        a: String(fc.a || fc.answer || ''),
      })),
    } as FlashcardSetBlock);
  }

  // Ftab (tabbed content) — converts tab data from templateData
  const tabs = (td.tabs || td.ftabTabs) as Array<Record<string, unknown>> | undefined;
  if (tabs && tabs.length > 0 && (td.tabs || td.ftabTabs)) {
    blocks.push({
      type: 'ftab',
      tabs: tabs.map((tab) => ({
        icon: String(tab.icon || '📑'),
        label: String(tab.label || tab.title || ''),
        content: ((tab.content || tab.blocks) as Array<Record<string, unknown>> || []).map((b) => ({
          type: String(b.type || 'def-box'),
          borderColor: String(b.borderColor || b.color || 'y'),
          content: String(b.content || b.text || ''),
        })),
      })),
      showReadMarker: td.showReadMarker ? Boolean(td.showReadMarker) : undefined,
      showProgress: td.showProgress ? Boolean(td.showProgress) : undefined,
    } as FtabBlock);
  }

  // Norma Kartu (detailed norma card) — converts detailed card data
  const nkCards = (td.nkCards || td.normaKartu) as Array<Record<string, unknown>> | undefined;
  if (nkCards && nkCards.length > 0 && (td.nkCards || td.normaKartu)) {
    nkCards.forEach((card) => {
      blocks.push({
        type: 'nk-card',
        normaType: String(card.normaType || card.type || ''),
        icon: String(card.icon || '📜'),
        title: String(card.title || ''),
        label: String(card.label || ''),
        definition: String(card.definition || card.desc || ''),
        characteristics: ((card.characteristics || card.chars) as Array<Record<string, unknown>> || []).map((c) => ({
          label: String(c.label || ''),
          value: String(c.value || ''),
        })),
        sanksi: {
          title: String((card.sanksi as Record<string, unknown>)?.title || 'Sanksi'),
          items: (((card.sanksi as Record<string, unknown>)?.items || []) as Array<Record<string, unknown>>).map((s) => ({
            dot: String(s.dot || s.color || 'r'),
            text: String(s.text || ''),
          })),
        },
        contoh: String(card.contoh || card.example || ''),
        pelanggaran: card.pelanggaran ? {
          title: String((card.pelanggaran as Record<string, unknown>).title || 'Pelanggaran'),
          items: (((card.pelanggaran as Record<string, unknown>).items || []) as Array<Record<string, unknown>>).map((p) => ({
            icon: String(p.icon || '⚠️'),
            text: String(p.text || ''),
          })),
        } : undefined,
      } as NormaKartuBlock);
    });
  }

  // If no specific blocks, create a generic def-box
  if (blocks.length === 0) {
    blocks.push({
      type: 'def-box',
      borderColor: 'y',
      content: String(td.text || td.title || 'Materi pembelajaran'),
    } as DefBoxBlock);
  }

  return blocks;
}

function convertDiskusi(td: Record<string, unknown>): DiskusiBlock {
  const pertanyaan = (td.pertanyaan || td.questions) as Array<Record<string, unknown>> | undefined;
  return {
    type: 'diskusi',
    title: String(td.title || 'Diskusi'),
    intro: td.intro ? String(td.intro) : undefined,
    questions: (pertanyaan || []).map((q) => ({
      label: String(q.label || ''),
      icon: String(q.icon || '💬'),
      teks: String(q.teks || q.text || ''),
      petunjuk: String(q.petunjuk || q.hint || ''),
      color: q.color ? String(q.color) : undefined,
    })),
  };
}

function convertKuis(td: Record<string, unknown>): KuisBlock {
  const questions = (td.questions || td.items) as Array<Record<string, unknown>> | undefined;
  return {
    type: 'kuis',
    title: String(td.title || 'Kuis'),
    questions: (questions || []).map((q) => ({
      q: String(q.q || q.question || ''),
      opts: (q.opts || q.options || []) as string[],
      ans: Number(q.ans ?? q.correct ?? 0),
      ex: String(q.ex || q.explanation || ''),
    })),
  };
}

function convertSortirGame(td: Record<string, unknown>): SortirGameBlock {
  const pool = (td.pool || td.items) as Array<Record<string, unknown>> | undefined;
  const kolom = (td.kolom || td.columns || td.categories) as Array<Record<string, unknown>> | undefined;
  return {
    type: 'sortir-game',
    title: String(td.title || 'Game Sortir'),
    pool: (pool || []).map((item) => ({
      id: String(item.id || ''),
      text: String(item.text || item.label || ''),
      category: String(item.category || item.kolom || ''),
    })),
    kolom: (kolom || []).map((k) => ({
      id: String(k.id || k.key || ''),
      label: String(k.label || k.name || ''),
      color: String(k.color || 'y'),
    })),
  };
}

function convertRodaGame(td: Record<string, unknown>): RodaGameBlock {
  const questions = (td.questions || td.items) as Array<Record<string, unknown>> | undefined;
  return {
    type: 'roda-game',
    title: String(td.title || 'Game Roda'),
    questions: (questions || []).map((q) => ({
      q: String(q.q || q.question || ''),
      diskusiHint: q.diskusiHint ? String(q.diskusiHint) : undefined,
      opts: ((q.opts || q.options || []) as Array<Record<string, unknown>>).map((opt) => ({
        text: String(opt.text || opt.label || ''),
        correct: Boolean(opt.correct || opt.isCorrect),
      })),
      feedbackCorrect: q.feedbackCorrect ? String(q.feedbackCorrect) : undefined,
      feedbackWrong: q.feedbackWrong ? String(q.feedbackWrong) : undefined,
    })),
  };
}

function convertHasil(td: Record<string, unknown>): HasilBlock {
  return {
    type: 'hasil',
    title: String(td.title || 'Hasil'),
    subtitle: String(td.subtitle || ''),
  };
}

function convertRefleksi(td: Record<string, unknown>): RefleksiBlock {
  const questions = (td.questions || td.items) as Array<Record<string, unknown>> | undefined;
  return {
    type: 'refleksi',
    title: String(td.title || 'Refleksi'),
    intro: td.intro ? String(td.intro) : undefined,
    questions: (questions || []).map((q) => ({
      teks: String(q.teks || q.text || ''),
      petunjuk: String(q.petunjuk || q.hint || ''),
      warna: q.warna ? String(q.warna) : undefined,
      icon: q.icon ? String(q.icon) : undefined,
    })),
    penugasan: td.penugasan ? {
      judul: String((td.penugasan as Record<string, unknown>).judul || ''),
      isi: String((td.penugasan as Record<string, unknown>).isi || ''),
    } : undefined,
  };
}

function convertPenutup(td: Record<string, unknown>): PenutupBlock {
  const preview = (td.preview || td.items) as Array<Record<string, unknown>> | undefined;
  return {
    type: 'penutup',
    title: String(td.title || 'Penutup'),
    subtitle: String(td.subtitle || ''),
    preview: (preview || []).map((p) => ({
      icon: String(p.icon || '📌'),
      judul: String(p.judul || p.title || ''),
      isi: String(p.isi || p.body || ''),
      warna: String(p.warna || p.color || 'y'),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════
// GENERIC FALLBACK — For template types without a specific converter
// ═══════════════════════════════════════════════════════════════════
// This ensures convertToSchema() NEVER returns null for valid template
// types. If no specific converter handles the templateType, or if a
// converter produces empty blocks, this generic block is used instead.
// It renders as a simple def-box with the page title/content.

function convertGenericFallback(td: Record<string, unknown>, tt: string): DefBoxBlock {
  const title = String(td.title || td.name || td.label || '');
  const content = String(td.content || td.text || td.description || td.body || '');

  return {
    type: 'def-box',
    borderColor: getSectionColor(tt),
    content: title
      ? `<strong>${title}</strong>${content ? `<br/><br/>${content}` : ''}`
      : content || `Template "${tt}" — konten belum tersedia`,
  };
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getSectionLabel(tt: string): string {
  const labels: Record<string, string> = {
    cover: 'Cover',
    petunjuk: 'Petunjuk',
    dokumen: 'Dokumen',
    skenario: 'Skenario',
    materi: 'Materi',
    diskusi: 'Diskusi',
    kuis: 'Kuis',
    game: 'Game',
    hasil: 'Hasil',
    refleksi: 'Refleksi',
    penutup: 'Penutup',
    hero: 'Hero',
  };
  return labels[tt] || tt;
}

function getSectionColor(tt: string): string {
  const colors: Record<string, string> = {
    cover: 'y',
    petunjuk: 'c',
    dokumen: 'c',
    skenario: 'p',
    materi: 'p',
    diskusi: 'c',
    kuis: 'y',
    game: 'c',
    hasil: 'g',
    refleksi: 'p',
    penutup: 'o',
    hero: 'o',
  };
  return colors[tt] || 'y';
}
