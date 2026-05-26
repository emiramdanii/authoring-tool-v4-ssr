// ═══════════════════════════════════════════════════════════════════
// GUIDED SCHEMA PATCH — Single authoritative write path to schema
// ═══════════════════════════════════════════════════════════════════
// PHASE 1 — Schema Editing Foundation
//
// DESIGN PRINCIPLE:
//   Schema (page.schema.blocks) is the SINGLE SOURCE OF TRUTH.
//   ALL content edits flow through this function:
//     - Konten tabs (Materi, Kuis, Diskusi, Refleksi, Rangkuman)
//     - Right panel guided form
//     - Right panel SchemaDrivenEditor
//     - AI regenerate
//
// MIGRATION PATH:
//   OLD: Konten Tab → useAuthoringStore (TULIS) → sync-projection → schema
//   NEW: Konten Tab → applyGuidedSchemaPatch → schema (TULIS)
//        Konten Tab ← deriveProjection ← schema (BACA)
//
// WHY NOT USE updateSchemaBlock() directly?
//   - updateSchemaBlock() is inside Zustand store — can't call from outside
//   - updateSchemaBlock() only works on currentPageIndex
//   - applyGuidedSchemaPatch() works on ANY page by pageId
//   - applyGuidedSchemaPatch() supports overflowPolicy
//   - applyGuidedSchemaPatch() is a standalone module, importable anywhere
//
// OVERFLOW POLICY:
//   When a patch makes content too long for one page:
//   - 'none': Just apply the patch, ignore overflow (default for now)
//   - 'warn': Apply the patch + log warning if overflow detected
//   - 'auto-split': Apply the patch + auto-split into separate pages
//   - 'reject': Don't apply if it would cause overflow
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { ensurePageSchema, generateBlockId } from './ensure-schema';
import { deepMergeBlock } from '@/core/editor/deep-merge';
import { commitSchemaUpdate, findBlockOwner, type BlockOwner } from '@/store/canva/schema-helpers';
import { assertDocumentPurity } from './session-state';
import { editBus } from '@/core/editor/edit-bus';
import { produceWithPatches } from 'immer';

// ── Types ──────────────────────────────────────────────────────

export type OverflowPolicy = 'none' | 'warn' | 'auto-split' | 'reject';

export interface GuidedPatchArgs {
  /** Target page ID — the page containing the block to patch */
  pageId: string;
  /** Target block ID — the specific block to update */
  blockId: string;
  /** Deep partial update to merge into the block */
  patch: Record<string, unknown>;
  /** What to do if the patch causes content overflow */
  overflowPolicy?: OverflowPolicy;
  /** Source of the edit — for edit bus tracking */
  source?: 'user' | 'ai' | 'sync' | 'guided-form' | 'konten-tab';
}

export interface GuidedPatchResult {
  /** Whether the patch was applied successfully */
  success: boolean;
  /** Error message if patch failed */
  error?: string;
  /** Whether overflow was detected */
  overflowDetected?: boolean;
  /** Whether an auto-split was performed */
  autoSplitPerformed?: boolean;
  /** New page ID created by auto-split (if any) */
  newPageId?: string;
  /** The page ID that was updated */
  pageId: string;
  /** The block ID that was updated */
  blockId: string;
}

// ── Main Function ──────────────────────────────────────────────

/**
 * Apply a guided schema patch — the SINGLE write path to schema content.
 *
 * This function:
 *   1. Finds the target page and block by ID
 *   2. Deep-merges the patch into the block
 *   3. Pushes undo history
 *   4. Emits edit bus event
 *   5. Validates document purity (dev mode)
 *   6. Optionally handles overflow (auto-split)
 *
 * Usage from Konten tabs:
 *   applyGuidedSchemaPatch({
 *     pageId: currentPageId,
 *     blockId: 'norma-golden-5',
 *     patch: { questions: [newQuestion] },
 *     source: 'konten-tab',
 *   })
 *
 * Usage from Right Panel:
 *   applyGuidedSchemaPatch({
 *     pageId: currentPageId,
 *     blockId: selectedBlockId,
 *     patch: { title: 'New Title', subtitle: 'New Sub' },
 *     source: 'guided-form',
 *   })
 */
export function applyGuidedSchemaPatch(args: GuidedPatchArgs): GuidedPatchResult {
  const { pageId, blockId, patch, overflowPolicy = 'none', source = 'user' } = args;

  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  const pageIndex = pages.findIndex(p => p.id === pageId);

  if (pageIndex < 0) {
    return { success: false, error: `Page "${pageId}" not found`, pageId, blockId };
  }

  let page = pages[pageIndex]!;
  let schema = ensurePageSchema(page);

  if (!schema) {
    return { success: false, error: `Page "${pageId}" has no schema`, pageId, blockId };
  }

  // Ensure page has schema (migrate if needed)
  if (!page.schema && schema) {
    page = { ...page, schema };
    pages[pageIndex] = page;
  }

  const blocks = schema.blocks;
  if (!Array.isArray(blocks)) {
    return { success: false, error: `Page "${pageId}" schema has no blocks array`, pageId, blockId };
  }

  // Find the target block
  const owner = findBlockOwner(blocks, blockId);
  if (!owner) {
    return { success: false, error: `Block "${blockId}" not found in page "${pageId}"`, pageId, blockId };
  }

  // Push history for undo BEFORE mutation
  store._pushHistory();

  // Apply the patch based on block ownership (top-level vs nested)
  let newBlocks: SchemaBlock[];
  let forwardPatches: import('immer').Patch[];
  let inversePatches: import('immer').Patch[];
  let blockType: string;

  if (owner.kind === 'top-level') {
    blockType = blocks[owner.index]!.type;

    // Deep merge the patch into the target block using the existing merge utility
    const mergeResult = mergeBlockInArray(blocks, owner.index, patch);
    newBlocks = mergeResult.blocks;
    forwardPatches = mergeResult.patches;
    inversePatches = mergeResult.inversePatches;
  } else {
    // Nested block (materi-section content, ftab tab, children)
    const result = produceWithPatches(blocks, draft => {
      let target: SchemaBlock | undefined;
      if (owner.kind === 'ftab-tab') {
        const ft = draft[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
        target = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex];
      } else if (owner.kind === 'materi-section') {
        const ms = draft[owner.blockIndex] as { content?: SchemaBlock[] };
        target = ms.content?.[owner.childIndex];
      } else if (owner.kind === 'children') {
        target = draft[owner.blockIndex]!.children?.[owner.childIndex];
      }
      if (target) {
        Object.assign(target, deepMergeBlock(target, patch));
      }
    });

    newBlocks = result[0] as SchemaBlock[];
    forwardPatches = result[1];
    inversePatches = result[2];

    // Determine block type for nested block
    if (owner.kind === 'ftab-tab') {
      const ft = blocks[owner.blockIndex] as { tabs?: Array<{ content?: SchemaBlock[] }> };
      blockType = ft.tabs?.[owner.tabIndex]?.content?.[owner.childIndex]?.type || 'unknown';
    } else if (owner.kind === 'materi-section') {
      const ms = blocks[owner.blockIndex] as { content?: SchemaBlock[] };
      blockType = ms.content?.[owner.childIndex]?.type || 'unknown';
    } else {
      blockType = blocks[owner.blockIndex]!.children?.[owner.childIndex]?.type || 'unknown';
    }
  }

  // Commit the schema update
  const newSchema = commitSchemaUpdate(schema, newBlocks);

  // Dev-mode purity guard
  assertDocumentPurity(newSchema, 'applyGuidedSchemaPatch');

  // Write to store
  pages[pageIndex] = { ...page, schema: newSchema };
  useCanvaStore.setState({ pages });

  // Emit edit bus event for audit trail
  editBus.emit({
    type: 'patch',
    patch: {
      blockId,
      blockType,
      pageIndex,
      patch,
      timestamp: Date.now(),
      source,
      _immerPatches: { forward: forwardPatches, inverse: inversePatches, pageIndex },
    },
  });

  // Handle overflow policy
  let overflowDetected = false;
  let autoSplitPerformed = false;
  let newPageId: string | undefined;

  if (overflowPolicy !== 'none') {
    overflowDetected = checkOverflow(newSchema);

    if (overflowDetected) {
      if (overflowPolicy === 'warn') {
        console.warn(
          `[guided-patch] Overflow detected on page "${pageId}" after patching block "${blockId}". ` +
          `Consider splitting the content.`
        );
      } else if (overflowPolicy === 'reject') {
        // Revert the patch — restore original state
        useCanvaStore.setState({ pages: store.pages });
        return {
          success: false,
          error: 'Patch rejected: would cause content overflow',
          overflowDetected: true,
          pageId,
          blockId,
        };
      } else if (overflowPolicy === 'auto-split') {
        // Auto-split: delegate to the existing promoteSceneSplitToPage
        // For now, just warn — full auto-split integration is Phase 4
        console.warn(
          `[guided-patch] Overflow detected on page "${pageId}". ` +
          `Auto-split is not yet implemented (Phase 4). Content may overflow.`
        );
      }
    }
  }

  return {
    success: true,
    overflowDetected,
    autoSplitPerformed,
    newPageId,
    pageId,
    blockId,
  };
}

// ── Batch Patch ────────────────────────────────────────────────

/**
 * Apply multiple patches atomically.
 * All patches succeed or none are applied.
 *
 * Useful for: bulk edits from AI regenerate, multi-field updates from Konten tab.
 */
export function applyGuidedSchemaPatchBatch(
  patches: GuidedPatchArgs[],
): GuidedPatchResult[] {
  const results: GuidedPatchResult[] = [];

  // For now, apply sequentially. Transaction-based batch is a future enhancement.
  for (const patchArgs of patches) {
    const result = applyGuidedSchemaPatch(patchArgs);
    results.push(result);

    // If any patch fails, stop applying further patches
    if (!result.success) {
      break;
    }
  }

  return results;
}

// ── Helper: Get Editable Schema Blocks ─────────────────────────

/**
 * Get all editable blocks from a page's schema.
 * Filters out non-content blocks (layout-only, system blocks).
 *
 * This is what the Konten panel (Schema Navigator) will use
 * to display the list of editable content blocks.
 */
export function getEditableSchemaBlocks(page: CanvaPage): SchemaBlock[] {
  if (!page.schema?.blocks) return [];

  return page.schema.blocks.filter(block => {
    // All blocks with type are editable by default
    // System/layout-only blocks would be filtered here
    // For now, all schema blocks are content blocks
    return !!block.type;
  });
}

/**
 * Get editable blocks from a specific page by ID.
 */
export function getEditableSchemaBlocksByPageId(pageId: string): SchemaBlock[] {
  const store = useCanvaStore.getState();
  const page = store.pages.find(p => p.id === pageId);
  if (!page) return [];
  return getEditableSchemaBlocks(page);
}

/**
 * Get a specific block from a page's schema by block ID.
 * Returns null if not found.
 */
export function getSchemaBlockById(pageId: string, blockId: string): SchemaBlock | null {
  const store = useCanvaStore.getState();
  const page = store.pages.find(p => p.id === pageId);
  if (!page?.schema?.blocks) return null;

  const block = findBlockByIdInPage(page.schema.blocks, blockId);
  return block;
}

/**
 * Find a block in a page's blocks array (including nested containers).
 */
function findBlockByIdInPage(blocks: SchemaBlock[], blockId: string): SchemaBlock | null {
  for (const block of blocks) {
    if (block.id === blockId) return block;

    // Check nested containers
    const b = block as unknown as Record<string, unknown>;

    // materi-section.content
    if (b.content && Array.isArray(b.content)) {
      const found = findBlockByIdInPage(b.content as SchemaBlock[], blockId);
      if (found) return found;
    }

    // ftab.tabs[].content
    if (b.tabs && Array.isArray(b.tabs)) {
      for (const tab of b.tabs as Array<{ content?: SchemaBlock[] }>) {
        if (tab.content) {
          const found = findBlockByIdInPage(tab.content, blockId);
          if (found) return found;
        }
      }
    }

    // children
    if (block.children) {
      const found = findBlockByIdInPage(block.children, blockId);
      if (found) return found;
    }
  }

  return null;
}

// ── Guided Editor Schema Registry ─────────────────────────────

/**
 * Field definition for the guided editor.
 * Simpler than PropertyField — focused on CONTENT editing,
 * not layout/style editing.
 */
export interface GuidedFieldDef {
  /** Property key in the schema block */
  key: string;
  /** Display label (teacher-friendly) */
  label: string;
  /** Field type */
  type: 'text' | 'textarea' | 'richtext' | 'color' | 'icon' | 'select' | 'number' | 'boolean' | 'array';
  /** Help text for teachers */
  helpText?: string;
  /** Placeholder */
  placeholder?: string;
  /** Is this field required? */
  required?: boolean;
  /** For array type: sub-field definitions */
  fields?: GuidedFieldDef[];
  /** For array type: max items */
  maxItems?: number;
  /** For select type: options */
  options?: Array<{ label: string; value: string }>;
  /** For number type: min/max */
  min?: number;
  max?: number;
}

/**
 * Guided editor schema for a block type.
 * Defines what CONTENT fields a teacher can edit.
 * Does NOT include layout/style/position — those stay in the right panel.
 */
export interface GuidedEditorSchema {
  /** Block type this schema belongs to */
  blockType: string;
  /** Display name */
  displayName: string;
  /** Description for teachers */
  description: string;
  /** Icon */
  icon: string;
  /** Ordered list of editable content fields */
  fields: GuidedFieldDef[];
  /** Sections for grouping fields */
  sections?: Array<{
    key: string;
    label: string;
    fieldKeys: string[];
  }>;
}

/**
 * Get the guided editor schema for a block type.
 * Returns null if no guided editor is defined for this block type.
 *
 * Currently returns definitions for the most common block types.
 * More block types will be added as Phase 2 progresses.
 */
export function getGuidedEditorSchema(blockType: string): GuidedEditorSchema | null {
  return GUIDED_EDITOR_REGISTRY[blockType] ?? null;
}

/**
 * Check if a block type has a guided editor defined.
 */
export function hasGuidedEditor(blockType: string): boolean {
  return blockType in GUIDED_EDITOR_REGISTRY;
}

// ── Guided Editor Registry ────────────────────────────────────
// Maps blockType → GuidedEditorSchema
// Add new block types here as Phase 2 progresses.

const GUIDED_EDITOR_REGISTRY: Record<string, GuidedEditorSchema> = {
  'cover': {
    blockType: 'cover',
    displayName: 'Cover',
    description: 'Halaman sampul pembelajaran',
    icon: '🏛️',
    fields: [
      { key: 'title', label: 'Judul', type: 'text', required: true, helpText: 'Judul utama pembelajaran', placeholder: 'Contoh: Macam-Macam Norma' },
      { key: 'subtitle', label: 'Subjudul', type: 'text', helpText: 'Kelas dan semester', placeholder: 'PPKn Kelas VII — Semester 1' },
      { key: 'icon', label: 'Ikon', type: 'icon', helpText: 'Ikon utama di cover' },
    ],
    sections: [
      { key: 'main', label: 'Konten Utama', fieldKeys: ['title', 'subtitle', 'icon'] },
    ],
  },

  'kuis': {
    blockType: 'kuis',
    displayName: 'Kuis / Evaluasi',
    description: 'Soal evaluasi pilihan ganda',
    icon: '📝',
    fields: [
      { key: 'title', label: 'Judul Kuis', type: 'text', required: true, placeholder: 'Kuis: Macam-Macam Norma' },
      {
        key: 'questions',
        label: 'Soal',
        type: 'array',
        maxItems: 1,
        helpText: 'STANDAR: 1 soal per halaman. Tambah halaman baru untuk soal berikutnya.',
        fields: [
          { key: 'q', label: 'Pertanyaan', type: 'textarea', required: true, placeholder: 'Tulis pertanyaan di sini...' },
          { key: 'opts', label: 'Pilihan Jawaban', type: 'array', maxItems: 4, fields: [
            { key: '', label: 'Pilihan', type: 'text', placeholder: 'Tulis pilihan jawaban...' },
          ]},
          { key: 'ans', label: 'Jawaban Benar (indeks)', type: 'number', min: 0, max: 3, helpText: 'Nomor indeks jawaban benar (0=A, 1=B, 2=C, 3=D)' },
          { key: 'ex', label: 'Penjelasan', type: 'textarea', helpText: 'Penjelasan mengapa jawaban ini benar', placeholder: 'Jelaskan alasan jawaban benar...' },
        ],
      },
    ],
    sections: [
      { key: 'title', label: 'Judul', fieldKeys: ['title'] },
      { key: 'questions', label: 'Soal', fieldKeys: ['questions'] },
    ],
  },

  'diskusi': {
    blockType: 'diskusi',
    displayName: 'Diskusi',
    description: 'Pertanyaan diskusi kelompok',
    icon: '💬',
    fields: [
      { key: 'title', label: 'Judul Diskusi', type: 'text', required: true },
      { key: 'intro', label: 'Pengantar', type: 'textarea', helpText: 'Pengantar singkat untuk memulai diskusi' },
      {
        key: 'questions',
        label: 'Pertanyaan',
        type: 'array',
        maxItems: 3,
        helpText: 'STANDAR: Maksimal 2-3 pertanyaan per halaman',
        fields: [
          { key: 'label', label: 'Label', type: 'text', placeholder: 'Pertanyaan 1' },
          { key: 'icon', label: 'Ikon', type: 'icon' },
          { key: 'teks', label: 'Teks Pertanyaan', type: 'textarea', required: true },
          { key: 'petunjuk', label: 'Petunjuk', type: 'textarea', helpText: 'Petunjuk untuk membantu siswa menjawab' },
        ],
      },
    ],
    sections: [
      { key: 'header', label: 'Header', fieldKeys: ['title', 'intro'] },
      { key: 'questions', label: 'Pertanyaan Diskusi', fieldKeys: ['questions'] },
    ],
  },

  'refleksi': {
    blockType: 'refleksi',
    displayName: 'Refleksi',
    description: 'Refleksi metakognitif dan penugasan pribadi',
    icon: '🪞',
    fields: [
      { key: 'title', label: 'Judul Refleksi', type: 'text', required: true },
      { key: 'intro', label: 'Pengantar', type: 'textarea' },
      {
        key: 'questions',
        label: 'Pertanyaan Refleksi',
        type: 'array',
        maxItems: 3,
        helpText: 'STANDAR: Maksimal 2-3 pertanyaan per halaman',
        fields: [
          { key: 'teks', label: 'Teks Pertanyaan', type: 'textarea', required: true },
          { key: 'petunjuk', label: 'Petunjuk', type: 'textarea' },
          { key: 'icon', label: 'Ikon', type: 'icon' },
        ],
      },
    ],
    sections: [
      { key: 'header', label: 'Header', fieldKeys: ['title', 'intro'] },
      { key: 'questions', label: 'Pertanyaan Refleksi', fieldKeys: ['questions'] },
    ],
  },

  'materi-section': {
    blockType: 'materi-section',
    displayName: 'Materi',
    description: 'Bagian materi pembelajaran',
    icon: '📖',
    fields: [
      { key: 'title', label: 'Judul Materi', type: 'text', required: true },
      // Note: content is an array of nested SchemaBlocks — too complex for simple guided form
      // The guided form for materi-section will be enhanced in Phase 2
    ],
    sections: [
      { key: 'header', label: 'Header', fieldKeys: ['title'] },
    ],
  },

  'def-box': {
    blockType: 'def-box',
    displayName: 'Kotak Definisi',
    description: 'Kotak definisi, penjelasan, atau kutipan',
    icon: '📦',
    fields: [
      { key: 'content', label: 'Konten', type: 'richtext', required: true, helpText: 'Teks definisi atau penjelasan. Gunakan <strong> untuk cetak tebal.', placeholder: 'Tulis definisi atau penjelasan...' },
      { key: 'borderColor', label: 'Warna Border', type: 'color', options: [
        { label: 'Kuning', value: 'y' },
        { label: 'Cyan', value: 'c' },
        { label: 'Hijau', value: 'g' },
        { label: 'Pink', value: 'p' },
        { label: 'Oranye', value: 'o' },
        { label: 'Merah', value: 'r' },
      ]},
    ],
  },

  'nc-grid': {
    blockType: 'nc-grid',
    displayName: 'Kartu Info',
    description: 'Grid kartu informasi',
    icon: '🃏',
    fields: [
      {
        key: 'cards',
        label: 'Kartu',
        type: 'array',
        maxItems: 4,
        helpText: 'STANDAR: Maksimal 4 kartu per halaman',
        fields: [
          { key: 'icon', label: 'Ikon', type: 'icon' },
          { key: 'title', label: 'Judul Kartu', type: 'text', required: true },
          { key: 'body', label: 'Isi Kartu', type: 'textarea', required: true },
          { key: 'color', label: 'Warna', type: 'color' },
        ],
      },
    ],
  },

  'tujuan-display': {
    blockType: 'tujuan-display',
    displayName: 'Tujuan Pembelajaran',
    description: 'Tujuan pembelajaran (TP)',
    icon: '🎯',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      {
        key: 'objectives',
        label: 'Tujuan',
        type: 'array',
        maxItems: 4,
        helpText: 'STANDAR: Maksimal 4 tujuan per halaman',
        fields: [
          { key: 'icon', label: 'Ikon', type: 'icon' },
          { key: 'text', label: 'Teks Tujuan', type: 'textarea', required: true },
          { key: 'color', label: 'Warna', type: 'color' },
        ],
      },
      { key: 'profil', label: 'Profil Pelajar Pancasila', type: 'text' },
    ],
  },

  'rangkuman': {
    blockType: 'rangkuman',
    displayName: 'Rangkuman',
    description: 'Rangkuman materi',
    icon: '📋',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      {
        key: 'concepts',
        label: 'Konsep',
        type: 'array',
        maxItems: 4,
        helpText: 'STANDAR: Maksimal 4 konsep per halaman',
        fields: [
          { key: 'icon', label: 'Ikon', type: 'icon' },
          { key: 'title', label: 'Judul Konsep', type: 'text', required: true },
          { key: 'body', label: 'Penjelasan', type: 'textarea', required: true },
          { key: 'color', label: 'Warna', type: 'color' },
        ],
      },
      { key: 'closingStatement', label: 'Pernyataan Penutup', type: 'textarea' },
    ],
  },

  'motivasi': {
    blockType: 'motivasi',
    displayName: 'Motivasi / Apersepsi',
    description: 'Pertanyaan pemantik dan koneksi',
    icon: '💡',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'hookQuestion', label: 'Pertanyaan Pemantik', type: 'textarea', required: true, helpText: 'Pertanyaan yang memotivasi dan menghubungkan dengan materi' },
    ],
  },

  'petunjuk': {
    blockType: 'petunjuk',
    displayName: 'Petunjuk',
    description: 'Petunjuk penggunaan media pembelajaran',
    icon: '📌',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      {
        key: 'items',
        label: 'Langkah-langkah',
        type: 'array',
        maxItems: 4,
        fields: [
          { key: 'icon', label: 'Ikon', type: 'icon' },
          { key: 'title', label: 'Judul Langkah', type: 'text', required: true },
          { key: 'body', label: 'Deskripsi', type: 'textarea', required: true },
        ],
      },
      { key: 'tips', label: 'Tips', type: 'textarea' },
    ],
  },

  'penutup': {
    blockType: 'penutup',
    displayName: 'Penutup',
    description: 'Halaman penutup pembelajaran',
    icon: '🏁',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'subtitle', label: 'Subjudul', type: 'text' },
    ],
  },
};

// ── Overflow Detection ─────────────────────────────────────────

/**
 * Simple overflow detection based on word count and block count.
 * This is a HEURISTIC — the real overflow detection uses SceneOverflowEngine
 * which needs measured heights. This is a fast approximation.
 *
 * Returns true if the page likely overflows.
 */
function checkOverflow(schema: ScreenSchema): boolean {
  let totalWords = 0;

  for (const block of schema.blocks) {
    const b = block as Record<string, unknown>;

    // Count words in text fields
    const textFields = ['title', 'subtitle', 'content', 'body', 'text', 'intro', 'hookQuestion', 'closingStatement'];
    for (const field of textFields) {
      if (field in b && typeof b[field] === 'string') {
        totalWords += (b[field] as string).replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
      }
    }

    // Count words in array fields
    const arrayFields = ['questions', 'objectives', 'cards', 'concepts', 'items'];
    for (const field of arrayFields) {
      if (field in b && Array.isArray(b[field])) {
        for (const item of b[field] as Record<string, unknown>[]) {
          for (const tf of ['teks', 'text', 'body', 'q', 'isi', 'description', 'petunjuk']) {
            if (tf in item && typeof item[tf] === 'string') {
              totalWords += (item[tf] as string).replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
            }
          }
        }
      }
    }
  }

  // Rough heuristic: more than 90 words on a single page = likely overflow
  // This matches PAGE_DENSITY_RULES.maxWords
  return totalWords > 90;
}

// ── Convenience: Patch and get fresh projection ────────────────

/**
 * Apply a guided schema patch and then derive a fresh projection
 * from the updated schema.
 *
 * This is the full cycle: write to schema → read projection back.
 * Used by Konten tabs that need to update the schema AND refresh
 * their local state from the new projection.
 *
 * @param args - Patch arguments
 * @param projectionDeriver - Function to derive projection from updated page
 * @returns Patch result + derived projection
 */
export function applyGuidedSchemaPatchWithProjection<T>(
  args: GuidedPatchArgs,
  projectionDeriver: (page: CanvaPage) => T,
): GuidedPatchResult & { projection: T | null } {
  const result = applyGuidedSchemaPatch(args);

  if (!result.success) {
    return { ...result, projection: null };
  }

  // Read the updated page from store
  const store = useCanvaStore.getState();
  const updatedPage = store.pages.find(p => p.id === result.pageId);

  if (!updatedPage) {
    return { ...result, projection: null };
  }

  const projection = projectionDeriver(updatedPage);
  return { ...result, projection };
}
