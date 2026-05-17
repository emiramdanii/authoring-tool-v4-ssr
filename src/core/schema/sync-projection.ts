// ═══════════════════════════════════════════════════════════════════
// SYNC PROJECTION → SCHEMA — Write Konten editor changes to canvas
// ═══════════════════════════════════════════════════════════════════
// Phase 18.3d: Projection Live Sync
//
// PROBLEM: Konten editor tabs write to the AuthoringStore projection,
// but the canvas reads from the schema tree. So edits don't appear
// on the canvas until a full regeneration.
//
// SOLUTION: syncFieldToSchema() bridges the gap. When a Konten tab
// edits data, it also calls syncFieldToSchema() to write the changes
// to the corresponding schema block in the canvas page.
//
// FLOW:
//   Konten tab edit → updateKuis(i, ...) [projection]
//                   → syncKuisToSchema(kuis) [schema write-back]
//                   → Canvas re-renders with new data ✅
//
// DESIGN:
//   - Lightweight: only syncs the specific field, not the whole page
//   - Scoped: finds the right page and block by templateType + blockType
//   - Safe: doesn't modify projection data, only schema blocks
//   - Best-effort: if the schema block isn't found, silently skips
//     (the projection still has the data, it just won't show on canvas)
// ═══════════════════════════════════════════════════════════════════

import type { KuisItem, DiskusiData, RefleksiData } from '@/store/authoring-store';
import type { SchemaBlock, ScreenSchema } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { assertDocumentPurity } from './session-state';

// ── Helper: Find and update a block in a page's schema ──────────

function updateSchemaBlock(
  templateType: string,
  blockType: string,
  updater: (block: SchemaBlock) => SchemaBlock,
): boolean {
  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  let updated = false;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.templateType !== templateType) continue;
    if (!page.schema) continue;

    const blockIdx = page.schema.blocks.findIndex(b => b.type === blockType);
    if (blockIdx < 0) continue;

    const newBlocks = [...page.schema.blocks];
    newBlocks[blockIdx] = updater(newBlocks[blockIdx]);

    const newSchema: ScreenSchema = { ...page.schema, blocks: newBlocks };
    assertDocumentPurity(newSchema, 'syncFieldToSchema');

    pages[i] = { ...page, schema: newSchema };
    updated = true;
  }

  if (updated) {
    useCanvaStore.setState({ pages });
  }

  return updated;
}

// ── Public Sync Functions ───────────────────────────────────────

/**
 * Sync KuisItem[] from projection to the KuisBlock in the schema.
 * Updates all KuisBlocks on pages with templateType 'kuis'.
 */
export function syncKuisToSchema(kuis: KuisItem[]): boolean {
  return updateSchemaBlock('kuis', 'kuis', (block) => ({
    ...block,
    questions: kuis.map(item => ({
      q: item.q,
      opts: item.opts,
      ans: item.ans,
      ex: item.ex,
      ...(item.pertemuan != null ? { pertemuan: item.pertemuan } : {}),
    })),
  }) as SchemaBlock);
}

/**
 * Sync DiskusiData from projection to the DiskusiBlock in the schema.
 * Updates all DiskusiBlocks on pages with templateType 'diskusi'.
 */
export function syncDiskusiToSchema(diskusi: DiskusiData): boolean {
  return updateSchemaBlock('diskusi', 'diskusi', (block) => ({
    ...block,
    title: diskusi.title,
    intro: diskusi.intro,
    questions: diskusi.pertanyaan.map(q => ({
      label: q.label,
      icon: q.icon,
      teks: q.teks,
      petunjuk: q.petunjuk,
    })),
  }) as SchemaBlock);
}

/**
 * Sync RefleksiData from projection to the RefleksiBlock in the schema.
 * Updates all RefleksiBlocks on pages with templateType 'refleksi'.
 */
export function syncRefleksiToSchema(refleksi: RefleksiData): boolean {
  return updateSchemaBlock('refleksi', 'refleksi', (block) => ({
    ...block,
    title: refleksi.title,
    intro: refleksi.intro,
    questions: refleksi.pertanyaan.map(q => ({
      teks: q.teks,
      petunjuk: q.petunjuk,
      warna: q.warna,
      icon: q.icon,
    })),
    penugasan: refleksi.penugasan ? {
      judul: refleksi.penugasan.judul,
      isi: refleksi.penugasan.isi,
      contoh: refleksi.penugasan.contoh,
    } : undefined,
  }) as SchemaBlock);
}

/**
 * Check if a page with the given template type has a schema with
 * the specified block type. Used to determine if sync is possible.
 */
export function hasSchemaBlock(templateType: string, blockType: string): boolean {
  const pages = useCanvaStore.getState().pages;
  const page = pages.find(p => p.templateType === templateType);
  if (!page?.schema) return false;
  return page.schema.blocks.some(b => b.type === blockType);
}
