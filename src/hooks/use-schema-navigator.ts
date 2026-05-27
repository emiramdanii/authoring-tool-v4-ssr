'use client';

// ═══════════════════════════════════════════════════════════════
// USE SCHEMA NAVIGATOR — Read content from schema, write via applyGuidedSchemaPatch
// ═══════════════════════════════════════════════════════════════
// This hook replaces the Konten tab's direct useAuthoringStore reads.
// It reads block data from the canva store's page.schema.blocks
// and writes via applyGuidedSchemaPatch() (single write path).
//
// Data flow:
//   READ:  CanvaStore.pages[].schema.blocks → filtered by blockType → projection
//   WRITE: applyGuidedSchemaPatch({ pageId, blockId, patch }) → schema updated
//          → startProjectionSync() auto-derives → authoring store updated (read-only)
//
// Currently supports ALL Konten tabs (Phase 3 complete):
//   - diskusi: 1:1 mapping
//   - refleksi: 1:1 mapping
//   - motivasi: structured → flat projection
//   - rangkuman: structured → flat projection
//   - kuis: flat array with block boundary tracking
//   - materi: materi-blok blocks inside materi-section.content[]
//   - skenario: SkenarioBlock.chapters → SkenarioChapter[]
//   - modules: game blocks across pages → Module[]
// ═══════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { applyGuidedSchemaPatch } from '@/core/schema/guided-patch';
import type { SchemaBlock } from '@/core/schema/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type { DiskusiData, RefleksiData, MotivasiData, RangkumanData, KuisItem, MateriBlok, Module, SkenarioChapter } from '@/store/authoring/types';
import type { MateriBlokBlock, SkenarioBlock } from '@/core/schema/types/blocks';
import { generateBlockId, generatePageId } from '@/core/schema/ensure-schema';
import type { CanvaPage } from '@/components/canva/types';
import { nanoid } from 'nanoid';

// ── Types ─────────────────────────────────────────────────────

interface SchemaBlockLocation {
  pageId: string;
  blockId: string;
  block: SchemaBlock;
}

// ── Main Hook ─────────────────────────────────────────────────

/**
 * Find all blocks of a given type across all pages.
 * Returns both the block data and its location (pageId, blockId)
 * so edits can target the correct block via applyGuidedSchemaPatch().
 */
export function useSchemaBlocksByType(blockType: string): SchemaBlockLocation[] {
  const pages = useCanvaStore(s => s.pages);

  return useMemo(() => {
    const results: SchemaBlockLocation[] = [];

    for (const page of pages) {
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (block.type === blockType) {
          results.push({
            pageId: page.id,
            blockId: block.id,
            block,
          });
        }
      }
    }

    return results;
  }, [pages, blockType]);
}

// ── Diskusi Hook ──────────────────────────────────────────────

export function useSchemaDiskusi(): {
  data: DiskusiData;
  locations: SchemaBlockLocation[];
  updateTitle: (title: string) => void;
  updateIntro: (intro: string) => void;
  updateQuestion: (blockIndex: number, questionIndex: number, updates: Record<string, unknown>) => void;
  addQuestion: (blockIndex: number) => void;
  removeQuestion: (blockIndex: number, questionIndex: number) => void;
} {
  const locations = useSchemaBlocksByType('diskusi');

  // Merge all diskusi blocks into a single DiskusiData (same as deriveDiskusiToProjection)
  const data = useMemo<DiskusiData>(() => {
    if (locations.length === 0) {
      return { title: 'Diskusi', intro: '', pertanyaan: [] };
    }

    // Use the first diskusi block's title/intro, merge questions from all
    const first = locations[0]!.block as unknown as {
      title?: string; intro?: string;
      questions?: Array<{ label?: string; icon?: string; teks?: string; petunjuk?: string }>;
    };

    const allQuestions: DiskusiData['pertanyaan'] = [];
    for (const loc of locations) {
      const block = loc.block as unknown as {
        questions?: Array<{ label?: string; icon?: string; teks?: string; petunjuk?: string }>;
      };
      if (block.questions) {
        allQuestions.push(...block.questions.map(q => ({
          label: q.label || '',
          icon: q.icon || '💬',
          teks: q.teks || '',
          petunjuk: q.petunjuk || '',
        })));
      }
    }

    return {
      title: first.title || 'Diskusi',
      intro: first.intro || '',
      pertanyaan: allQuestions,
    };
  }, [locations]);

  const updateTitle = useCallback((title: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { title },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateIntro = useCallback((intro: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { intro },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateQuestion = useCallback((blockIndex: number, questionIndex: number, updates: Record<string, unknown>) => {
    const loc = locations[blockIndex];
    if (!loc) return;

    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];
    if (questionIndex < 0 || questionIndex >= questions.length) return;

    const newQuestions = [...questions];
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], ...updates };

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locations]);

  const addQuestion = useCallback((blockIndex: number) => {
    const loc = locations[blockIndex];
    if (!loc) return;

    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];

    const newQuestion = {
      label: `Pertanyaan ${questions.length + 1}`,
      icon: '💬',
      teks: '',
      petunjuk: '',
    };

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: [...questions, newQuestion] },
      source: 'konten-tab',
    });
  }, [locations]);

  const removeQuestion = useCallback((blockIndex: number, questionIndex: number) => {
    const loc = locations[blockIndex];
    if (!loc) return;

    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];
    if (questionIndex < 0 || questionIndex >= questions.length) return;

    const newQuestions = questions.filter((_, i) => i !== questionIndex);

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locations]);

  return { data, locations, updateTitle, updateIntro, updateQuestion, addQuestion, removeQuestion };
}

// ── Refleksi Hook ─────────────────────────────────────────────

export function useSchemaRefleksi(): {
  data: RefleksiData;
  locations: SchemaBlockLocation[];
  updateTitle: (title: string) => void;
  updateIntro: (intro: string) => void;
  updateQuestion: (blockIndex: number, questionIndex: number, updates: Record<string, unknown>) => void;
  addQuestion: (blockIndex: number) => void;
  removeQuestion: (blockIndex: number, questionIndex: number) => void;
  updatePenugasan: (penugasan: { judul?: string; isi?: string; contoh?: string }) => void;
} {
  const locations = useSchemaBlocksByType('refleksi');

  const data = useMemo<RefleksiData>(() => {
    if (locations.length === 0) {
      return { title: 'Refleksi', intro: '', pertanyaan: [] };
    }

    const first = locations[0]!.block as unknown as {
      title?: string; intro?: string;
      questions?: Array<{ teks?: string; petunjuk?: string; warna?: string; icon?: string }>;
      penugasan?: { judul?: string; isi?: string; contoh?: string };
    };

    const allQuestions: RefleksiData['pertanyaan'] = [];
    for (const loc of locations) {
      const block = loc.block as unknown as {
        questions?: Array<{ teks?: string; petunjuk?: string; warna?: string; icon?: string }>;
      };
      if (block.questions) {
        allQuestions.push(...block.questions.map(q => ({
          teks: q.teks || '',
          petunjuk: q.petunjuk || '',
          warna: q.warna,
          icon: q.icon,
        })));
      }
    }

    return {
      title: first.title || 'Refleksi',
      intro: first.intro || '',
      pertanyaan: allQuestions,
      penugasan: first.penugasan ? {
        judul: first.penugasan.judul || '',
        isi: first.penugasan.isi || '',
        contoh: first.penugasan.contoh,
      } : undefined,
    };
  }, [locations]);

  const updateTitle = useCallback((title: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { title },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateIntro = useCallback((intro: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { intro },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateQuestion = useCallback((blockIndex: number, questionIndex: number, updates: Record<string, unknown>) => {
    const loc = locations[blockIndex];
    if (!loc) return;

    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];
    if (questionIndex < 0 || questionIndex >= questions.length) return;

    const newQuestions = [...questions];
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], ...updates };

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locations]);

  const addQuestion = useCallback((blockIndex: number) => {
    const loc = locations[blockIndex];
    if (!loc) return;

    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];

    const newQuestion = {
      teks: '',
      petunjuk: '',
      warna: 'c',
      icon: '🪞',
    };

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: [...questions, newQuestion] },
      source: 'konten-tab',
    });
  }, [locations]);

  const removeQuestion = useCallback((blockIndex: number, questionIndex: number) => {
    const loc = locations[blockIndex];
    if (!loc) return;

    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];
    if (questionIndex < 0 || questionIndex >= questions.length) return;

    const newQuestions = questions.filter((_, i) => i !== questionIndex);

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locations]);

  const updatePenugasan = useCallback((penugasan: { judul?: string; isi?: string; contoh?: string }) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { penugasan },
      source: 'konten-tab',
    });
  }, [locations]);

  return { data, locations, updateTitle, updateIntro, updateQuestion, addQuestion, removeQuestion, updatePenugasan };
}

// ── Motivasi Hook ─────────────────────────────────────────────

/**
 * Schema-first hook for Motivasi (Apersepsi) section.
 *
 * Shape mapping (MotivasiBlock → MotivasiData):
 *   Schema.title            → data.title
 *   Schema.hookQuestion     → data.intro + data.pertanyaanPemicu (both derive from hookQuestion)
 *   Schema.connections[]    → data.koneksi (join structured → flat text)
 *   Schema.transition       → data.aktivitas
 *   Schema.visual.emoji     → data.visual
 *
 * Reverse mapping (MotivasiData → MotivasiBlock):
 *   data.koneksi            → parse lines → connections[] (each line → {icon, label, description, color})
 *   data.visual             → visual: { emoji, bgGradient? }
 */
export function useSchemaMotivasi(): {
  data: MotivasiData;
  locations: SchemaBlockLocation[];
  updateTitle: (title: string) => void;
  updateIntro: (intro: string) => void;
  updatePertanyaanPemicu: (q: string) => void;
  updateKoneksi: (koneksi: string) => void;
  updateAktivitas: (aktivitas: string) => void;
  updateVisual: (visual: string) => void;
} {
  const locations = useSchemaBlocksByType('motivasi');

  const data = useMemo<MotivasiData>(() => {
    if (locations.length === 0) {
      return {
        title: 'Motivasi / Apersepsi',
        intro: '',
        pertanyaanPemicu: '',
        koneksi: '',
        aktivitas: '',
      };
    }

    const block = locations[0]!.block as unknown as {
      title?: string;
      hookQuestion?: string;
      connections?: Array<{ icon?: string; label?: string; description?: string; color?: string }>;
      transition?: string;
      visual?: { emoji?: string; bgGradient?: [string, string] };
    };

    return {
      title: block.title || 'Motivasi / Apersepsi',
      intro: block.hookQuestion || '',
      pertanyaanPemicu: block.hookQuestion || '',
      koneksi: (block.connections || []).map(c =>
        c.label && c.description ? `${c.label}: ${c.description}` : (c.label || c.description || '')
      ).join('\n'),
      aktivitas: block.transition || '',
      visual: block.visual?.emoji,
    };
  }, [locations]);

  const updateTitle = useCallback((title: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { title },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateIntro = useCallback((intro: string) => {
    // In the current projection, intro = hookQuestion
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { hookQuestion: intro },
      source: 'konten-tab',
    });
  }, [locations]);

  const updatePertanyaanPemicu = useCallback((pertanyaanPemicu: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { hookQuestion: pertanyaanPemicu },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateKoneksi = useCallback((koneksi: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    // Parse flat text → structured connections
    // Each line becomes a connection: "Label: Description" → {label, description}
    const lines = koneksi.split('\n').filter(l => l.trim());
    const connections = lines.map((line, i) => {
      const colonIdx = line.indexOf(':');
      const COLORS = ['y', 'c', 'g', 'p'];
      if (colonIdx > 0) {
        return {
          icon: ['🔗', '💡', '🎯', '📌', '🔍'][i % 5],
          label: line.slice(0, colonIdx).trim(),
          description: line.slice(colonIdx + 1).trim(),
          color: COLORS[i % COLORS.length],
        };
      }
      return {
        icon: ['🔗', '💡', '🎯', '📌', '🔍'][i % 5],
        label: `Koneksi ${i + 1}`,
        description: line.trim(),
        color: COLORS[i % COLORS.length],
      };
    });
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { connections },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateAktivitas = useCallback((aktivitas: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { transition: aktivitas },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateVisual = useCallback((visual: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    // Preserve existing bgGradient if present
    const block = loc.block as unknown as {
      visual?: { emoji?: string; bgGradient?: [string, string] };
    };
    const existingGradient = block.visual?.bgGradient;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: {
        visual: {
          emoji: visual,
          ...(existingGradient ? { bgGradient: existingGradient } : {}),
        },
      },
      source: 'konten-tab',
    });
  }, [locations]);

  return {
    data,
    locations,
    updateTitle,
    updateIntro,
    updatePertanyaanPemicu,
    updateKoneksi,
    updateAktivitas,
    updateVisual,
  };
}

// ── Rangkuman Hook ────────────────────────────────────────────

/**
 * Schema-first hook for Rangkuman (Summary) section.
 *
 * Shape mapping (RangkumanBlock → RangkumanData):
 *   Schema.title               → data.title
 *   Schema.concepts[]          → data.poin[] (structured → flat: "title: body")
 *   Schema.closingStatement    → data.closingStatement + data.tips (both derive from same field)
 *
 * Note: RangkumanBlock has no `intro` or `tips` fields in schema.
 * The projection maps closingStatement → tips. This is a pre-existing
 * design choice. Phase 3 preserves this behavior.
 *
 * Reverse mapping (RangkumanData → RangkumanBlock):
 *   data.poin[]    → concepts[] (parse "title: body" → {icon, title, body, color})
 *   data.tips      → closingStatement (same field)
 */
export function useSchemaRangkuman(): {
  data: RangkumanData;
  locations: SchemaBlockLocation[];
  updateTitle: (title: string) => void;
  updateIntro: (intro: string) => void;
  addPoin: () => void;
  removePoin: (index: number) => void;
  updatePoin: (index: number, value: string) => void;
  updateTips: (tips: string) => void;
  updateClosingStatement: (closingStatement: string) => void;
} {
  const locations = useSchemaBlocksByType('rangkuman');

  const data = useMemo<RangkumanData>(() => {
    if (locations.length === 0) {
      return {
        title: 'Rangkuman',
        intro: '',
        poin: [],
        tips: '',
      };
    }

    const block = locations[0]!.block as unknown as {
      title?: string;
      concepts?: Array<{ icon?: string; title?: string; body?: string; color?: string }>;
      closingStatement?: string;
    };

    return {
      title: block.title || 'Rangkuman',
      intro: '',
      poin: (block.concepts || []).map(c =>
        c.title && c.body ? `${c.title}: ${c.body}` : (c.title || c.body || '')
      ),
      tips: block.closingStatement || '',
      closingStatement: block.closingStatement,
    };
  }, [locations]);

  const updateTitle = useCallback((title: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { title },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateIntro = useCallback((_intro: string) => {
    // RangkumanBlock has no intro field — no-op for compatibility
    // The intro field is kept in RangkumanData for UI compatibility
  }, []);

  /** Rebuild concepts[] from the current poin[] after a change */
  const rebuildConceptsFromPoin = useCallback((newPoin: string[]) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    const block = loc.block as unknown as {
      concepts?: Array<{ icon?: string; title?: string; body?: string; color?: string }>;
    };
    const COLORS = ['y', 'c', 'g', 'p', 'o'];
    const concepts = newPoin.map((poin, i) => {
      const colonIdx = poin.indexOf(':');
      if (colonIdx > 0) {
        return {
          icon: block.concepts?.[i]?.icon || ['📌', '📋', '🔑', '💡', '⭐'][i % 5],
          title: poin.slice(0, colonIdx).trim(),
          body: poin.slice(colonIdx + 1).trim(),
          color: block.concepts?.[i]?.color || COLORS[i % COLORS.length],
        };
      }
      return {
        icon: block.concepts?.[i]?.icon || ['📌', '📋', '🔑', '💡', '⭐'][i % 5],
        title: poin.trim(),
        body: '',
        color: block.concepts?.[i]?.color || COLORS[i % COLORS.length],
      };
    });
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { concepts },
      source: 'konten-tab',
    });
  }, [locations]);

  const addPoin = useCallback(() => {
    const newPoin = [...data.poin, ''];
    rebuildConceptsFromPoin(newPoin);
  }, [data.poin, rebuildConceptsFromPoin]);

  const removePoin = useCallback((index: number) => {
    const newPoin = data.poin.filter((_, i) => i !== index);
    rebuildConceptsFromPoin(newPoin);
  }, [data.poin, rebuildConceptsFromPoin]);

  const updatePoin = useCallback((index: number, value: string) => {
    const newPoin = [...data.poin];
    newPoin[index] = value;
    rebuildConceptsFromPoin(newPoin);
  }, [data.poin, rebuildConceptsFromPoin]);

  const updateTips = useCallback((tips: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    // tips and closingStatement map to the same schema field
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { closingStatement: tips },
      source: 'konten-tab',
    });
  }, [locations]);

  const updateClosingStatement = useCallback((closingStatement: string) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { closingStatement },
      source: 'konten-tab',
    });
  }, [locations]);

  return {
    data,
    locations,
    updateTitle,
    updateIntro,
    addPoin,
    removePoin,
    updatePoin,
    updateTips,
    updateClosingStatement,
  };
}

// ── Kuis Hook ─────────────────────────────────────────────────

/**
 * Schema-first hook for Kuis (Quiz) section.
 *
 * Shape mapping (KuisBlock → KuisItem[]):
 *   Schema.questions[] → flat KuisItem[] (1:1 shape, just adds _id)
 *
 * The KuisBlock.questions may include a `pertemuan` field even though
 * it's not in the type definition — the schema is extensible.
 *
 * All CRUD, drag-sort, and preset operations go through applyGuidedSchemaPatch.
 * The deprecated syncKuisToSchema() is no longer needed.
 */
export function useSchemaKuis(): {
  data: KuisItem[];
  locations: SchemaBlockLocation[];
  addQuestion: () => void;
  deleteQuestion: (flatIndex: number) => void;
  updateQuestion: (flatIndex: number, key: string, value: unknown) => void;
  updateQuestionOpt: (flatIndex: number, optIndex: number, value: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  replaceAllQuestions: (questions: KuisItem[]) => void;
} {
  const locations = useSchemaBlocksByType('kuis');

  // Build a flat KuisItem[] from all kuis blocks, tracking block boundaries
  const data = useMemo<KuisItem[]>(() => {
    const allQuestions: KuisItem[] = [];

    for (const loc of locations) {
      const block = loc.block as unknown as {
        questions?: Array<{ q?: string; opts?: string[]; ans?: number; ex?: string; pertemuan?: number }>;
      };
      if (block.questions) {
        for (const q of block.questions) {
          allQuestions.push({
            _id: `${loc.pageId}::${loc.blockId}::${allQuestions.length}`,
            q: q.q || '',
            opts: q.opts || ['', '', '', ''],
            ans: q.ans ?? 0,
            ex: q.ex || '',
            ...(q.pertemuan != null ? { pertemuan: q.pertemuan } : {}),
          });
        }
      }
    }

    return allQuestions;
  }, [locations]);

  // ── Helper: find which block a flat index belongs to ──
  const locateFlatIndex = useCallback((flatIndex: number): {
    loc: SchemaBlockLocation;
    blockIdx: number;
    questions: Array<Record<string, unknown>>;
  } | null => {
    let offset = 0;
    for (const loc of locations) {
      const block = loc.block as unknown as Record<string, unknown>;
      const questions = (block.questions as Array<Record<string, unknown>>) || [];
      if (flatIndex < offset + questions.length) {
        return { loc, blockIdx: flatIndex - offset, questions };
      }
      offset += questions.length;
    }
    return null;
  }, [locations]);

  const addQuestion = useCallback(() => {
    // Add to the first kuis block
    if (locations.length === 0) return;
    const loc = locations[0]!;
    const block = loc.block as unknown as Record<string, unknown>;
    const questions = (block.questions as Array<Record<string, unknown>>) || [];
    const newQuestion = {
      q: '',
      opts: ['', '', '', ''],
      ans: 0,
      ex: '',
    };
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: [...questions, newQuestion] },
      source: 'konten-tab',
    });
  }, [locations]);

  const deleteQuestion = useCallback((flatIndex: number) => {
    const info = locateFlatIndex(flatIndex);
    if (!info) return;
    const { loc, blockIdx, questions } = info;
    if (blockIdx < 0 || blockIdx >= questions.length) return;
    const newQuestions = questions.filter((_, i) => i !== blockIdx);
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locateFlatIndex]);

  const updateQuestion = useCallback((flatIndex: number, key: string, value: unknown) => {
    const info = locateFlatIndex(flatIndex);
    if (!info) return;
    const { loc, blockIdx, questions } = info;
    const newQuestions = [...questions];
    newQuestions[blockIdx] = { ...newQuestions[blockIdx], [key]: value };
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locateFlatIndex]);

  const updateQuestionOpt = useCallback((flatIndex: number, optIndex: number, value: string) => {
    const info = locateFlatIndex(flatIndex);
    if (!info) return;
    const { loc, blockIdx, questions } = info;
    const question = questions[blockIdx] as Record<string, unknown>;
    const opts = [...((question.opts as string[]) || ['', '', '', ''])];
    opts[optIndex] = value;
    const newQuestions = [...questions];
    newQuestions[blockIdx] = { ...question, opts };
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locateFlatIndex]);

  const reorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
    // Reorder within the same kuis block
    const fromInfo = locateFlatIndex(fromIndex);
    const toInfo = locateFlatIndex(toIndex);
    if (!fromInfo || !toInfo) return;
    if (fromInfo.loc !== toInfo.loc) return; // Cross-block reorder not supported

    const { loc, questions } = fromInfo;
    const fromBlockIdx = fromInfo.blockIdx;
    const toBlockIdx = toInfo.blockIdx;

    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(fromBlockIdx, 1);
    newQuestions.splice(toBlockIdx, 0, moved!);

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions: newQuestions },
      source: 'konten-tab',
    });
  }, [locateFlatIndex]);

  const replaceAllQuestions = useCallback((newItems: KuisItem[]) => {
    // Replace all questions in the first kuis block
    if (locations.length === 0) return;
    const loc = locations[0]!;
    const questions = newItems.map(item => ({
      q: item.q,
      opts: item.opts,
      ans: item.ans,
      ex: item.ex,
      ...(item.pertemuan != null ? { pertemuan: item.pertemuan } : {}),
    }));
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { questions },
      source: 'konten-tab',
    });
  }, [locations]);

  return {
    data,
    locations,
    addQuestion,
    deleteQuestion,
    updateQuestion,
    updateQuestionOpt,
    reorderQuestions,
    replaceAllQuestions,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3 — Schema Navigator for Materi, Skenario, Modules
// ═══════════════════════════════════════════════════════════════════
// These hooks complete the migration of Konten Panel from
// useAuthoringStore reads → schema reads.
//
// Data flow:
//   READ:  CanvaStore.pages[].schema → find materi-section / skenario / game blocks
//   WRITE: applyGuidedSchemaPatch() → single write path
//   SYNC:  startProjectionSync() auto-derives → authoring store updated (read-only)
// ═══════════════════════════════════════════════════════════════════

// ── Materi Hook ─────────────────────────────────────────────────

/**
 * Extended location for nested materi-blok blocks inside materi-section.
 * Tracks both the parent (materi-section) and the child index within content[].
 */
interface MateriBlokLocation {
  /** Page containing the materi-section */
  pageId: string;
  /** materi-section block ID — target for applyGuidedSchemaPatch */
  sectionBlockId: string;
  /** materi-section block (the parent) */
  sectionBlock: SchemaBlock;
  /** Index of this materi-blok within the section's content[] */
  contentIndex: number;
  /** The materi-blok block itself */
  blokBlock: MateriBlokBlock;
}

/**
 * Schema-first hook for Materi (content blocks) section.
 *
 * Architecture:
 *   Materi data lives as `materi-blok` blocks inside `materi-section.content[]`.
 *   Each materi-blok block preserves the EXACT shape of the authoring store's MateriBlok,
 *   making the Konten editor a direct schema editor — no lossy conversion needed.
 *
 *   Previously, syncMateriToSchema() converted MateriBlok → various schema block types
 *   (def-box, nc-grid, tabel, etc.), which was lossy and fragile.
 *   Now, materi-blok blocks are stored directly, and MateriBlokRenderer handles rendering.
 *
 * Shape mapping (MateriBlokBlock ↔ MateriBlok):
 *   Nearly 1:1 mapping. The only difference is:
 *     - MateriBlok.style → MateriBlokBlock.infoboxStyle (backward compat)
 *     - MateriBlokBlock has accentColor (not in MateriBlok)
 *   Both fields are preserved in the schema.
 */
export function useSchemaMateri(): {
  /** Projected MateriBlok[] from all materi-blok blocks across pages */
  bloks: MateriBlok[];
  /** Locations for each blok (page + parent section + content index) */
  locations: MateriBlokLocation[];
  /** Whether any materi-section exists in schema */
  hasSections: boolean;
  /** Add a new materi-blok to the first materi-section */
  addBlok: (tipe: string) => void;
  /** Remove a materi-blok by flat index */
  removeBlok: (flatIndex: number) => void;
  /** Move a materi-blok from one position to another */
  moveBlok: (fromIndex: number, toIndex: number) => void;
  /** Update a single field on a materi-blok */
  updateBlok: (flatIndex: number, key: string, value: unknown) => void;
  /** Replace all bloks (used by regenerate) */
  replaceAllBloks: (newBloks: MateriBlok[]) => void;
} {
  const pages = useCanvaStore(s => s.pages);

  // Find all materi-blok blocks inside all materi-section blocks
  const { bloks, locations, hasSections } = useMemo(() => {
    const allBloks: MateriBlok[] = [];
    const allLocations: MateriBlokLocation[] = [];
    let foundSection = false;

    for (const page of pages) {
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (block.type === 'materi-section') {
          foundSection = true;
          const section = block as unknown as {
            id: string;
            content?: SchemaBlock[];
          };
          const content = section.content || [];

          for (let i = 0; i < content.length; i++) {
            const child = content[i]!;
            if (child.type === 'materi-blok') {
              const blokBlock = child as unknown as MateriBlokBlock;
              allLocations.push({
                pageId: page.id,
                sectionBlockId: section.id,
                sectionBlock: block,
                contentIndex: i,
                blokBlock,
              });
              // Project MateriBlokBlock → MateriBlok
              allBloks.push(materiBlokBlockToProjection(blokBlock));
            }
          }
        }
      }
    }

    return { bloks: allBloks, locations: allLocations, hasSections: foundSection };
  }, [pages]);

  // ── Helper: patch the content[] of a materi-section ──
  const patchSectionContent = useCallback((
    loc: MateriBlokLocation,
    newContent: SchemaBlock[],
  ) => {
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.sectionBlockId,
      patch: { content: newContent },
      source: 'konten-tab',
    });
  }, []);

  // ── Helper: get current content[] for a materi-section ──
  const getSectionContent = useCallback((loc: MateriBlokLocation): SchemaBlock[] => {
    const section = loc.sectionBlock as unknown as { content?: SchemaBlock[] };
    return section.content || [];
  }, []);

  const addBlok = useCallback((tipe: string) => {
    if (locations.length === 0) {
      // No materi-section exists — need to find or create a materi page
      // For now, just find the first materi page and add to its section
      const materiPage = pages.find(p => p.templateType === 'materi');
      if (!materiPage?.schema) return;

      const section = materiPage.schema.blocks.find(b => b.type === 'materi-section');
      if (!section) return;

      const newBlokBlock: MateriBlokBlock = {
        type: 'materi-blok',
        id: generateBlockId(),
        tipe: tipe as MateriBlokBlock['tipe'],
        ...(tipe === 'teks' ? { isi: '' } : {}),
        ...(tipe === 'poin' ? { butir: [''] } : {}),
        ...(tipe === 'tabel' ? { baris: [['', ''], ['', '']] } : {}),
        ...(tipe === 'timeline' ? { langkah: [{ icon: '📌', judul: '', isi: '' }] } : {}),
        ...(tipe === 'statistik' ? { items: [{ warna: '#3ecfcf', angka: '', label: '', icon: '📊' }] } : {}),
      };

      const sectionWithContent = section as unknown as { content?: SchemaBlock[] };
      const content = sectionWithContent.content || [];
      applyGuidedSchemaPatch({
        pageId: materiPage.id,
        blockId: section.id,
        patch: { content: [...content, newBlokBlock as unknown as SchemaBlock] },
        source: 'konten-tab',
      });
      return;
    }

    // Add to the last known materi-section
    const lastLoc = locations[locations.length - 1]!;
    const content = getSectionContent(lastLoc);

    const newBlokBlock: MateriBlokBlock = {
      type: 'materi-blok',
      id: generateBlockId(),
      tipe: tipe as MateriBlokBlock['tipe'],
      ...(tipe === 'teks' ? { isi: '' } : {}),
      ...(tipe === 'poin' ? { butir: [''] } : {}),
      ...(tipe === 'tabel' ? { baris: [['', ''], ['', '']] } : {}),
      ...(tipe === 'timeline' ? { langkah: [{ icon: '📌', judul: '', isi: '' }] } : {}),
      ...(tipe === 'statistik' ? { items: [{ warna: '#3ecfcf', angka: '', label: '', icon: '📊' }] } : {}),
    };

    patchSectionContent(lastLoc, [...content, newBlokBlock as unknown as SchemaBlock]);
  }, [locations, pages, getSectionContent, patchSectionContent]);

  const removeBlok = useCallback((flatIndex: number) => {
    const loc = locations[flatIndex];
    if (!loc) return;

    const content = getSectionContent(loc);
    const newContent = content.filter((_, i) => i !== loc.contentIndex);
    patchSectionContent(loc, newContent);
  }, [locations, getSectionContent, patchSectionContent]);

  const moveBlok = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const fromLoc = locations[fromIndex];
    const toLoc = locations[toIndex];
    if (!fromLoc || !toLoc) return;

    // Only support reordering within the same materi-section
    if (fromLoc.sectionBlockId !== toLoc.sectionBlockId) return;

    const content = getSectionContent(fromLoc);
    const newContent = [...content];
    const [moved] = newContent.splice(fromLoc.contentIndex, 1);
    newContent.splice(toLoc.contentIndex, 0, moved!);
    patchSectionContent(fromLoc, newContent);
  }, [locations, getSectionContent, patchSectionContent]);

  const updateBlok = useCallback((flatIndex: number, key: string, value: unknown) => {
    const loc = locations[flatIndex];
    if (!loc) return;

    const content = getSectionContent(loc);
    const target = content[loc.contentIndex];
    if (!target) return;

    const newContent = [...content];
    // Map MateriBlok field names to MateriBlokBlock field names
    const schemaKey = key === 'style' ? 'infoboxStyle' : key;
    newContent[loc.contentIndex] = {
      ...target,
      [schemaKey]: value,
    } as SchemaBlock;

    patchSectionContent(loc, newContent);
  }, [locations, getSectionContent, patchSectionContent]);

  const replaceAllBloks = useCallback((newBloks: MateriBlok[]) => {
    // Find the first materi-section and replace its entire content
    const materiPage = pages.find(p => p.templateType === 'materi');
    if (!materiPage?.schema) return;

    const section = materiPage.schema.blocks.find(b => b.type === 'materi-section');
    if (!section) return;

    const newContent: SchemaBlock[] = newBloks.map(blok => {
      const existing = locations.find(l => l.blokBlock.id);
      return projectionToMateriBlokBlock(blok, existing?.blokBlock.id || generateBlockId());
    });

    applyGuidedSchemaPatch({
      pageId: materiPage.id,
      blockId: section.id,
      patch: { content: newContent },
      source: 'konten-tab',
    });
  }, [pages, locations]);

  return {
    bloks,
    locations,
    hasSections,
    addBlok,
    removeBlok,
    moveBlok,
    updateBlok,
    replaceAllBloks,
  };
}

// ── MateriBlokBlock ↔ MateriBlok projection helpers ──

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
      // MateriBlok.items has optional fields, MateriBlokBlock.items has required
    })),
    // Map infoboxStyle → style for backward compat with block-editors
    style: block.infoboxStyle || block.style,
    infoboxStyle: block.infoboxStyle,
    karakter: block.karakter,
    situasi: block.situasi,
    pertanyaan: block.pertanyaan,
    pesan: block.pesan,
    pertemuan: block.pertemuan,
    tabGroup: block.tabGroup,
  };
}

function projectionToMateriBlokBlock(blok: MateriBlok, id: string): SchemaBlock {
  return {
    type: 'materi-blok',
    id,
    tipe: blok.tipe,
    judul: blok.judul,
    isi: blok.isi,
    butir: blok.butir,
    baris: blok.baris,
    karakter: blok.karakter,
    warna: blok.warna,
    icon: blok.icon,
    kiri: blok.kiri,
    kanan: blok.kanan,
    langkah: blok.langkah,
    situasi: blok.situasi,
    pertanyaan: blok.pertanyaan,
    pesan: blok.pesan,
    infoboxStyle: blok.style || blok.infoboxStyle,
    style: blok.style,
    items: blok.items?.map(item => ({
      warna: item.warna || '#3ecfcf',
      angka: item.angka || '',
      satuan: item.satuan,
      label: item.label || '',
      icon: item.icon,
    })),
    pertemuan: blok.pertemuan,
    tabGroup: blok.tabGroup,
  } as unknown as SchemaBlock;
}

// ── Skenario Hook ──────────────────────────────────────────────

/**
 * Schema-first hook for Skenario (Interactive Scenario) section.
 *
 * Architecture:
 *   Skenario data lives as SkenarioBlock (type: 'skenario') in the schema.
 *   The block has a `chapters[]` array that maps closely to SkenarioChapter[].
 *
 * Shape mapping (SkenarioBlock.chapters ↔ SkenarioChapter[]):
 *   Nearly 1:1 mapping. Differences:
 *     - SkenarioBlock.chapters[].id → not in SkenarioChapter
 *     - SkenarioChapter.bg, charColor, charPants → not in SkenarioBlock.chapters[]
 *       (stored as extra fields via the index signature)
 */
export function useSchemaSkenario(): {
  /** Projected SkenarioChapter[] from all skenario blocks */
  chapters: SkenarioChapter[];
  /** Locations of skenario blocks */
  locations: SchemaBlockLocation[];
  /** Add a new chapter */
  addChapter: () => void;
  /** Remove a chapter by index */
  removeChapter: (index: number) => void;
  /** Update a chapter field */
  updateChapter: (chapterIndex: number, key: string, value: unknown) => void;
  /** Add a setup dialog line to a chapter */
  addSetup: (chapterIndex: number) => void;
  /** Remove a setup dialog line */
  removeSetup: (chapterIndex: number, setupIndex: number) => void;
  /** Update a setup dialog field */
  updateSetup: (chapterIndex: number, setupIndex: number, key: string, value: unknown) => void;
  /** Add a choice to a chapter */
  addChoice: (chapterIndex: number) => void;
  /** Remove a choice from a chapter */
  removeChoice: (chapterIndex: number, choiceIndex: number) => void;
  /** Update a choice field */
  updateChoice: (chapterIndex: number, choiceIndex: number, key: string, value: unknown) => void;
  /** Add a consequence to a choice */
  addConsequence: (chapterIndex: number, choiceIndex: number) => void;
  /** Remove a consequence */
  removeConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number) => void;
  /** Update a consequence field */
  updateConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number, key: string, value: unknown) => void;
  /** Replace all chapters (for regenerate) */
  replaceAllChapters: (chapters: SkenarioChapter[]) => void;
} {
  const locations = useSchemaBlocksByType('skenario');

  // Project SkenarioBlock.chapters → SkenarioChapter[]
  const chapters = useMemo<SkenarioChapter[]>(() => {
    if (locations.length === 0) return [];

    const block = locations[0]!.block as unknown as SkenarioBlock;
    return (block.chapters || []).map(ch => ({
      id: ch.id,
      title: ch.title || '',
      bg: (ch as unknown as Record<string, unknown>).bg as string || 'sbg-kampung',
      charEmoji: ch.charEmoji || '🧑',
      charColor: (ch as unknown as Record<string, unknown>).charColor as string || '#60a5fa',
      charPants: (ch as unknown as Record<string, unknown>).charPants as string || '#34d399',
      choicePrompt: ch.choicePrompt || '',
      setup: (ch.setup || []).map(s => ({ speaker: s.speaker || '', text: s.text || '' })),
      choices: (ch.choices || []).map(c => ({
        icon: c.icon || '🔍',
        label: c.label || '',
        detail: c.detail || '',
        good: c.good ?? false,
        pts: c.pts ?? 0,
        level: c.level || 'mid',
        norma: (c as unknown as Record<string, unknown>).norma as string || '',
        resultTitle: c.resultTitle || '',
        resultBody: c.resultBody || '',
        consequences: (c.consequences || []).map(con => ({ icon: con.icon || '📌', text: con.text || '' })),
      })),
    }));
  }, [locations]);

  // ── Helper: patch the skenario block's chapters ──
  const patchChapters = useCallback((newChapters: unknown[]) => {
    if (locations.length === 0) return;
    const loc = locations[0]!;
    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { chapters: newChapters },
      source: 'konten-tab',
    });
  }, [locations]);

  // ── Helper: get current chapters from schema ──
  const getCurrentChapters = useCallback((): unknown[] => {
    if (locations.length === 0) return [];
    const block = locations[0]!.block as unknown as Record<string, unknown>;
    return (block.chapters as unknown[]) || [];
  }, [locations]);

  const addChapter = useCallback(() => {
    const current = getCurrentChapters();
    const newChapter = {
      id: nanoid(8),
      title: '',
      charEmoji: '🧑',
      setup: [{ speaker: 'NARRATOR', text: '' }],
      choicePrompt: '',
      choices: [{
        icon: '🔍', label: '', detail: '', good: false, pts: 0, level: 'mid',
        resultTitle: '', resultBody: '', consequences: [],
      }],
    };
    patchChapters([...current, newChapter]);
  }, [getCurrentChapters, patchChapters]);

  const removeChapter = useCallback((index: number) => {
    const current = getCurrentChapters();
    if (index < 0 || index >= current.length) return;
    patchChapters(current.filter((_, i) => i !== index));
  }, [getCurrentChapters, patchChapters]);

  const updateChapter = useCallback((chapterIndex: number, key: string, value: unknown) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...(newChapters[chapterIndex] as Record<string, unknown>), [key]: value };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const addSetup = useCallback((chapterIndex: number) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const setup = (chapter.setup as unknown[]) || [];
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, setup: [...setup, { speaker: 'NARRATOR', text: '' }] };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const removeSetup = useCallback((chapterIndex: number, setupIndex: number) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const setup = (chapter.setup as unknown[]) || [];
    if (setupIndex < 0 || setupIndex >= setup.length) return;
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, setup: setup.filter((_, i) => i !== setupIndex) };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const updateSetup = useCallback((chapterIndex: number, setupIndex: number, key: string, value: unknown) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const setup = [...((chapter.setup as unknown[]) || [])];
    if (setupIndex < 0 || setupIndex >= setup.length) return;
    setup[setupIndex] = { ...(setup[setupIndex] as Record<string, unknown>), [key]: value };
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, setup };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const addChoice = useCallback((chapterIndex: number) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const choices = (chapter.choices as unknown[]) || [];
    const newChapters = [...current];
    newChapters[chapterIndex] = {
      ...chapter,
      choices: [...choices, {
        icon: '🔍', label: '', detail: '', good: false, pts: 0, level: 'mid',
        resultTitle: '', resultBody: '', consequences: [],
      }],
    };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const removeChoice = useCallback((chapterIndex: number, choiceIndex: number) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const choices = (chapter.choices as unknown[]) || [];
    if (choiceIndex < 0 || choiceIndex >= choices.length) return;
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, choices: choices.filter((_, i) => i !== choiceIndex) };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const updateChoice = useCallback((chapterIndex: number, choiceIndex: number, key: string, value: unknown) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const choices = [...((chapter.choices as unknown[]) || [])];
    if (choiceIndex < 0 || choiceIndex >= choices.length) return;
    choices[choiceIndex] = { ...(choices[choiceIndex] as Record<string, unknown>), [key]: value };
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, choices };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const addConsequence = useCallback((chapterIndex: number, choiceIndex: number) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const choices = [...((chapter.choices as unknown[]) || [])];
    if (choiceIndex < 0 || choiceIndex >= choices.length) return;
    const choice = choices[choiceIndex] as Record<string, unknown>;
    const consequences = [...((choice.consequences as unknown[]) || []), { icon: '📌', text: '' }];
    choices[choiceIndex] = { ...choice, consequences };
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, choices };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const removeConsequence = useCallback((chapterIndex: number, choiceIndex: number, consIndex: number) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const choices = [...((chapter.choices as unknown[]) || [])];
    if (choiceIndex < 0 || choiceIndex >= choices.length) return;
    const choice = choices[choiceIndex] as Record<string, unknown>;
    const consequences = ((choice.consequences as unknown[]) || []).filter((_, i) => i !== consIndex);
    choices[choiceIndex] = { ...choice, consequences };
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, choices };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const updateConsequence = useCallback((chapterIndex: number, choiceIndex: number, consIndex: number, key: string, value: unknown) => {
    const current = getCurrentChapters();
    if (chapterIndex < 0 || chapterIndex >= current.length) return;
    const chapter = current[chapterIndex] as Record<string, unknown>;
    const choices = [...((chapter.choices as unknown[]) || [])];
    if (choiceIndex < 0 || choiceIndex >= choices.length) return;
    const choice = choices[choiceIndex] as Record<string, unknown>;
    const consequences = [...((choice.consequences as unknown[]) || [])];
    if (consIndex < 0 || consIndex >= consequences.length) return;
    consequences[consIndex] = { ...(consequences[consIndex] as Record<string, unknown>), [key]: value };
    choices[choiceIndex] = { ...choice, consequences };
    const newChapters = [...current];
    newChapters[chapterIndex] = { ...chapter, choices };
    patchChapters(newChapters);
  }, [getCurrentChapters, patchChapters]);

  const replaceAllChapters = useCallback((newChapters: SkenarioChapter[]) => {
    const schemaChapters = newChapters.map(ch => ({
      id: (ch as unknown as Record<string, unknown>).id || nanoid(8),
      title: ch.title,
      charEmoji: ch.charEmoji,
      charColor: ch.charColor,
      charPants: ch.charPants,
      bg: ch.bg,
      choicePrompt: ch.choicePrompt,
      setup: ch.setup,
      choices: ch.choices.map(c => ({
        icon: c.icon,
        label: c.label,
        detail: c.detail,
        good: c.good,
        pts: c.pts,
        level: c.level,
        norma: c.norma,
        resultTitle: c.resultTitle,
        resultBody: c.resultBody,
        consequences: c.consequences,
      })),
    }));
    patchChapters(schemaChapters);
  }, [patchChapters]);

  return {
    chapters,
    locations,
    addChapter,
    removeChapter,
    updateChapter,
    addSetup,
    removeSetup,
    updateSetup,
    addChoice,
    removeChoice,
    updateChoice,
    addConsequence,
    removeConsequence,
    updateConsequence,
    replaceAllChapters,
  };
}

// ── Modules Hook ───────────────────────────────────────────────

/** Game module block types that appear in schema */
const GAME_BLOCK_TYPES = [
  'flashcard-set', 'roda-game', 'memory-game', 'matching-game',
  'sortir-game', 'fill-blank-game', 'word-search-game', 'true-false-game',
  'drag-drop-game', 'crossword-game', 'team-buzzer-game',
  'nk-card', // NormaKartu as a module too
];

/** Map game block type → Module type string */
function gameBlockTypeToModuleType(blockType: string): string {
  const map: Record<string, string> = {
    'flashcard-set': 'flashcard',
    'roda-game': 'roda',
    'memory-game': 'memory',
    'matching-game': 'matching',
    'sortir-game': 'sortir',
    'fill-blank-game': 'fill-blank',
    'word-search-game': 'word-search',
    'true-false-game': 'true-false',
    'drag-drop-game': 'drag-drop',
    'crossword-game': 'crossword',
    'team-buzzer-game': 'team-buzzer',
    'nk-card': 'norma-kartu',
  };
  return map[blockType] || blockType;
}

/** Map Module type string → game block type */
function moduleTypeToGameBlockType(moduleType: string): string {
  const map: Record<string, string> = {
    'flashcard': 'flashcard-set',
    'roda': 'roda-game',
    'memory': 'memory-game',
    'matching': 'matching-game',
    'sortir': 'sortir-game',
    'fill-blank': 'fill-blank-game',
    'word-search': 'word-search-game',
    'true-false': 'true-false-game',
    'drag-drop': 'drag-drop-game',
    'crossword': 'crossword-game',
    'team-buzzer': 'team-buzzer-game',
    'norma-kartu': 'nk-card',
  };
  return map[moduleType] || moduleType;
}

/**
 * Schema-first hook for Modules & Games section.
 *
 * Architecture:
 *   Each module/game is a top-level SchemaBlock on a page.
 *   The hook finds all game-type blocks across pages and projects
 *   them to Module[] format for the Konten editor.
 *
 *   When adding a module, a new page is created with the game block.
 *   When editing, applyGuidedSchemaPatch targets the specific game block.
 */
export function useSchemaModules(): {
  /** Projected Module[] from all game blocks across pages */
  modules: Module[];
  /** Location info for each module */
  locations: Array<{ pageId: string; blockId: string; pageIndex: number }>;
  /** Add a new module (creates a new page with the game block) */
  addModule: (typeId: string) => void;
  /** Remove a module by index */
  removeModule: (index: number) => void;
  /** Move a module (reorder pages) */
  moveModule: (fromIndex: number, toIndex: number) => void;
  /** Update a module field */
  updateModuleField: (index: number, key: string, value: unknown) => void;
} {
  const pages = useCanvaStore(s => s.pages);

  // Find all game blocks across pages
  const { modules, locations } = useMemo(() => {
    const allModules: Module[] = [];
    const allLocations: Array<{ pageId: string; blockId: string; pageIndex: number }> = [];

    for (let pi = 0; pi < pages.length; pi++) {
      const page = pages[pi]!;
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (GAME_BLOCK_TYPES.includes(block.type)) {
          const b = block as unknown as Record<string, unknown>;
          allModules.push({
            _id: block.id,
            type: gameBlockTypeToModuleType(block.type),
            title: (b.title as string) || block.type,
            layoutVariant: (b.layoutVariant as string) || 'A',
            ...b, // Spread all game-specific fields
          });
          allLocations.push({
            pageId: page.id,
            blockId: block.id,
            pageIndex: pi,
          });
        }
      }
    }

    return { modules: allModules, locations: allLocations };
  }, [pages]);

  const addModule = useCallback((typeId: string) => {
    const blockType = moduleTypeToGameBlockType(typeId);
    const store = useCanvaStore.getState();
    const newPageId = generatePageId();

    // Create default block content based on type
    const defaultBlock = createDefaultGameBlock(blockType);

    const newPage: CanvaPage = {
      id: newPageId,
      label: `Game: ${typeId}`,
      bgDataUrl: null,
      bgColor: '#1a1a2e',
      overlay: 0,
      elements: [],
      templateType: blockType.replace('-game', '').replace('-set', ''),
      colorPalette: null,
      navConfig: { prev: true, next: true, navbar: true },
      templateData: {},
      pageMode: 'schema',
      schema: {
        id: newPageId,
        version: 1,
        templateType: blockType.replace('-game', '').replace('-set', ''),
        blocks: [defaultBlock],
      },
    };

    store._pushHistory();
    useCanvaStore.setState({ pages: [...store.pages, newPage] });
  }, []);

  const removeModule = useCallback((index: number) => {
    const loc = locations[index];
    if (!loc) return;

    // Remove the entire page that contains this game block
    const store = useCanvaStore.getState();
    const newPages = store.pages.filter((_, i) => i !== loc.pageIndex);
    store._pushHistory();
    useCanvaStore.setState({ pages: newPages });
  }, [locations]);

  const moveModule = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const fromLoc = locations[fromIndex];
    const toLoc = locations[toIndex];
    if (!fromLoc || !toLoc) return;

    // Swap the pages
    const store = useCanvaStore.getState();
    const newPages = [...store.pages];
    const fromPageIndex = fromLoc.pageIndex;
    const toPageIndex = toLoc.pageIndex;
    [newPages[fromPageIndex], newPages[toPageIndex]] = [newPages[toPageIndex], newPages[fromPageIndex]];

    store._pushHistory();
    useCanvaStore.setState({ pages: newPages });
  }, [locations]);

  const updateModuleField = useCallback((index: number, key: string, value: unknown) => {
    const loc = locations[index];
    if (!loc) return;

    applyGuidedSchemaPatch({
      pageId: loc.pageId,
      blockId: loc.blockId,
      patch: { [key]: value },
      source: 'konten-tab',
    });
  }, [locations]);

  return {
    modules,
    locations,
    addModule,
    removeModule,
    moveModule,
    updateModuleField,
  };
}

/** Create a default game block of the given type */
function createDefaultGameBlock(blockType: string): SchemaBlock {
  const id = generateBlockId();

  const defaults: Record<string, Record<string, unknown>> = {
    'flashcard-set': { title: 'Flashcard', cards: [{ q: '', a: '' }] },
    'roda-game': { title: 'Roda Keberuntungan', questions: [{ q: '', opts: [{ text: '', correct: false }] }] },
    'memory-game': { title: 'Memory Game', pairs: [{ left: '', right: '' }] },
    'matching-game': { title: 'Matching', pairs: [{ left: '', right: '' }] },
    'sortir-game': { title: 'Sortir', pool: [], kolom: [] },
    'fill-blank-game': { title: 'Isian', questions: [{ text: '', answer: '' }] },
    'word-search-game': { title: 'Cari Kata', words: [] },
    'true-false-game': { title: 'Benar/Salah', questions: [{ text: '', correct: true }] },
    'drag-drop-game': { title: 'Drag & Drop', items: [], targets: [] },
    'crossword-game': { title: 'Teka-Teki Silang', words: [] },
    'team-buzzer-game': { title: 'Buzzer Tim', teamA: 'Tim A', teamB: 'Tim B', questions: [] },
    'nk-card': { title: 'Kartu Norma', normaType: 'agama', icon: '⚖️', label: '', definition: '', characteristics: [], sanksi: { title: '', items: [] }, contoh: '' },
  };

  return {
    type: blockType,
    id,
    ...(defaults[blockType] || { title: blockType }),
  } as unknown as SchemaBlock;
}
