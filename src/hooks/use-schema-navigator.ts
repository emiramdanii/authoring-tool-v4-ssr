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
// Currently supports:
//   - diskusi: 1:1 mapping (cleanest)
//   - refleksi: 1:1 mapping (cleanest)
//   - More block types will be added progressively
// ═══════════════════════════════════════════════════════════════

import { useMemo, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { applyGuidedSchemaPatch } from '@/core/schema/guided-patch';
import type { SchemaBlock } from '@/core/schema/types';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type { DiskusiData, RefleksiData, MotivasiData, RangkumanData, KuisItem } from '@/store/authoring/types';

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
