'use client';

// ═══════════════════════════════════════════════════════════════════
// USE SCHEMA PROJECTION — Read-only data projections from schema
// ═══════════════════════════════════════════════════════════════════
// Phase 3 deliverable: Provides the SAME data shapes as useAuthoringStore
// (kuis, modules, meta) but reads directly from CanvaPage[].schema.
//
// This hook is for RENDERING-SIDE consumers only (QuizWidget, GameWidget,
// BlockRenderer, DataIdxSelector, PageFrame). Konten tabs continue using
// the full useSchema*() hooks which include write actions.
//
// Architecture:
//   READ:  CanvaStore.pages[].schema → project to KuisItem[] / Module[]
//   META:  Still from useAuthoringStore (project-level, Phase 5 territory)
//   WRITE: None — this is read-only. Use applyGuidedSchemaPatch() or
//          the full useSchema*() hooks for writes.
//
// Drop-in replacement pattern:
//   BEFORE: const kuis = useAuthoringStore(s => s.kuis);
//   AFTER:  const { kuis } = useSchemaProjection();
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import type { KuisItem, Module, MetaState } from '@/store/authoring/types';
import type { SchemaBlock } from '@/core/schema/types';

// ── Game block type detection ──────────────────────────────────

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

// ── Main Hook ─────────────────────────────────────────────────

/**
 * Read-only schema projection — provides the same data shapes as
 * useAuthoringStore but reads from CanvaPage[].schema.
 *
 * Usage:
 *   const { kuis, modules, meta } = useSchemaProjection();
 *
 * This replaces:
 *   const kuis = useAuthoringStore(s => s.kuis);
 *   const modules = useAuthoringStore(s => s.modules);
 *   const meta = useAuthoringStore(s => s.meta);
 */
export function useSchemaProjection(): {
  kuis: KuisItem[];
  modules: Module[];
  meta: MetaState;
} {
  const pages = useCanvaStore(s => s.pages);

  // ── Project KuisItem[] from all kuis blocks across pages ──
  const kuis = useMemo<KuisItem[]>(() => {
    const allQuestions: KuisItem[] = [];

    for (const page of pages) {
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (block.type === 'kuis') {
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
              allQuestions.push({
                _id: `${page.id}::${block.id}::${allQuestions.length}`,
                q: q.q || '',
                opts: q.opts || ['', '', '', ''],
                ans: q.ans ?? 0,
                ex: q.ex || '',
                ...(q.pertemuan != null ? { pertemuan: q.pertemuan } : {}),
              });
            }
          }
        }
      }
    }

    return allQuestions;
  }, [pages]);

  // ── Project Module[] from all game blocks across pages ──
  const modules = useMemo<Module[]>(() => {
    const allModules: Module[] = [];

    for (const page of pages) {
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (GAME_BLOCK_TYPES.includes(block.type) && block.id) {
          const b = block as unknown as Record<string, unknown>;
          allModules.push({
            _id: block.id,
            type: GAME_TYPE_MAP[block.type] || block.type,
            title: (b.title as string) || block.type,
            layoutVariant: (b.layoutVariant as string) || 'A',
            ...b, // Spread all game-specific fields
          });
        }
      }
    }

    return allModules;
  }, [pages]);

  // ── Meta still from authoring store (project-level, Phase 5 territory) ──
  const meta = useAuthoringStore((s: any) => s.meta) as MetaState;

  return { kuis, modules, meta };
}

// ── Granular Hooks (for components that only need one data type) ──

/**
 * Schema-only kuis projection — no authoring store dependency.
 * Use in rendering components that only need quiz data.
 */
export function useSchemaKuisProjection(): KuisItem[] {
  const pages = useCanvaStore(s => s.pages);

  return useMemo<KuisItem[]>(() => {
    const allQuestions: KuisItem[] = [];

    for (const page of pages) {
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (block.type === 'kuis') {
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
              allQuestions.push({
                _id: `${page.id}::${block.id}::${allQuestions.length}`,
                q: q.q || '',
                opts: q.opts || ['', '', '', ''],
                ans: q.ans ?? 0,
                ex: q.ex || '',
                ...(q.pertemuan != null ? { pertemuan: q.pertemuan } : {}),
              });
            }
          }
        }
      }
    }

    return allQuestions;
  }, [pages]);
}

/**
 * Schema-only modules projection — no authoring store dependency.
 * Use in rendering components that only need game/module data.
 */
export function useSchemaModulesProjection(): Module[] {
  const pages = useCanvaStore(s => s.pages);

  return useMemo<Module[]>(() => {
    const allModules: Module[] = [];

    for (const page of pages) {
      const schema = ensurePageSchema(page);
      if (!schema) continue;

      for (const block of schema.blocks) {
        if (GAME_BLOCK_TYPES.includes(block.type) && block.id) {
          const b = block as unknown as Record<string, unknown>;
          allModules.push({
            _id: block.id,
            type: GAME_TYPE_MAP[block.type] || block.type,
            title: (b.title as string) || block.type,
            layoutVariant: (b.layoutVariant as string) || 'A',
            ...b,
          });
        }
      }
    }

    return allModules;
  }, [pages]);
}

/**
 * Schema-only meta projection — still reads from authoring store.
 * Centralized here so all canva-area meta reads go through one hook.
 * Phase 5 will move meta to a dedicated project metadata store.
 */
export function useSchemaMetaProjection(): MetaState {
  return useAuthoringStore((s: any) => s.meta) as MetaState;
}
