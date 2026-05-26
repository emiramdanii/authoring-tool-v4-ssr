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
import type { DiskusiData, RefleksiData } from '@/store/authoring/types';

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
