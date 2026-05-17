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

import type { KuisItem, DiskusiData, RefleksiData, MateriState } from '@/store/authoring-store';
import type { SchemaBlock, ScreenSchema } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { assertDocumentPurity } from './session-state';
import { generateBlockId } from './ensure-schema';

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
 * Sync MateriState from projection to the materi-section block in the schema.
 * Converts MateriBlok[] → SchemaBlock[] for the materi-section's content.
 *
 * This is the most complex sync because MateriBlok has varied types
 * (teks, definisi, poin, highlight, compare, infobox, etc.) that each
 * map to different SchemaBlock types (def-box, nc-grid, etc.).
 */
export function syncMateriToSchema(materi: MateriState): boolean {
  return updateSchemaBlock('materi', 'materi-section', (block) => {
    const contentBlocks = materiBloksToSchemaBlocks(materi.blok);
    return {
      ...block,
      content: contentBlocks,
    } as SchemaBlock;
  });
}

/**
 * Convert MateriBlok[] from the authoring store to SchemaBlock[] for the canvas.
 * Each MateriBlok.tipe maps to a specific SchemaBlock type.
 */
function materiBloksToSchemaBlocks(bloks: import('@/store/authoring-store').MateriBlok[]): SchemaBlock[] {
  return bloks.map((blok) => {
    switch (blok.tipe) {
      case 'teks':
        return {
          type: 'def-box' as const,
          id: generateBlockId(),
          borderColor: 'c',
          content: blok.isi || '',
          compression: { priority: 'high' as const, strategy: 'accordion' as const },
          semantic: { learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'definisi':
        return {
          type: 'def-box' as const,
          id: generateBlockId(),
          borderColor: 'y',
          content: blok.judul ? `<strong>${blok.judul}</strong> — ${blok.isi || ''}` : blok.isi || '',
          compression: { priority: 'high' as const, strategy: 'accordion' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'poin':
        return {
          type: 'nc-grid' as const,
          id: generateBlockId(),
          cards: (blok.butir || []).map((item, i) => ({
            icon: ['📌', '📋', '🔑', '💡', '⭐', '📝'][i % 6],
            title: item,
            body: `Bagian dari ${blok.judul || 'materi'}`,
            color: ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c'][i % 6],
          })),
          compression: { priority: 'medium' as const, strategy: 'scroll' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'highlight':
        return {
          type: 'def-box' as const,
          id: generateBlockId(),
          borderColor: blok.warna === 'blue' ? 'c' : 'y',
          content: blok.judul ? `<strong>${blok.judul}</strong> — ${blok.isi || ''}` : blok.isi || '',
          compression: { priority: 'high' as const, strategy: 'accordion' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'compare':
        return {
          type: 'nc-grid' as const,
          id: generateBlockId(),
          cards: [
            { icon: '🔥', title: 'Kiri', body: blok.kiri?.isi || blok.kiri?.judul || '', color: 'c' },
            { icon: '⚡', title: 'Kanan', body: blok.kanan?.isi || blok.kanan?.judul || '', color: 'y' },
          ],
          compression: { priority: 'medium' as const, strategy: 'scroll' as const },
          semantic: { learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'infobox':
        return {
          type: 'def-box' as const,
          id: generateBlockId(),
          borderColor: 'g',
          content: blok.judul ? `<strong>${blok.judul}</strong> — ${blok.isi || ''}` : blok.isi || '',
          compression: { priority: 'high' as const, strategy: 'accordion' as const },
          semantic: { learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'kutipan':
        return {
          type: 'def-box' as const,
          id: generateBlockId(),
          borderColor: 'g',
          content: blok.isi ? `"${blok.isi}"` : '',
          compression: { priority: 'high' as const, strategy: 'accordion' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const, style: 'quote' },
        };
      case 'tabel':
        return {
          type: 'tabel' as const,
          id: generateBlockId(),
          title: blok.judul || undefined,
          headers: (blok.baris?.[0]) || ['No', 'Isi'],
          rows: (blok.baris?.slice(1) || []) as string[][],
          accentColor: 'c',
          compression: { priority: 'medium' as const, strategy: 'scroll' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'gambar':
        return {
          type: 'gambar' as const,
          id: generateBlockId(),
          title: blok.judul || undefined,
          url: blok.isi || '',
          caption: blok.isi || undefined,
          accentColor: 'c',
          compression: { priority: 'low' as const, strategy: 'scroll' as const },
          semantic: { learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'timeline':
        return {
          type: 'timeline' as const,
          id: generateBlockId(),
          title: blok.judul || undefined,
          steps: (blok.langkah || []).map((step, i) => ({
            icon: (step as Record<string, unknown>).icon as string || ['📌', '📋', '🔑', '💡', '⭐'][i % 5],
            label: (step as Record<string, unknown>).judul as string || (step as Record<string, unknown>).label as string || `Langkah ${i + 1}`,
            description: (step as Record<string, unknown>).isi as string || (step as Record<string, unknown>).description as string || '',
            color: ['c', 'g', 'y', 'p', 'o'][i % 5],
          })),
          accentColor: 'c',
          compression: { priority: 'medium' as const, strategy: 'scroll' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'checklist':
        return {
          type: 'checklist' as const,
          id: generateBlockId(),
          title: blok.judul || undefined,
          items: (blok.butir || []).map(item => ({
            text: typeof item === 'string' ? item : (item as Record<string, unknown>).text as string || '',
            checked: false,
          })),
          accentColor: 'g',
          compression: { priority: 'medium' as const, strategy: 'scroll' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'interact' as const },
        };
      case 'statistik':
        return {
          type: 'statistik' as const,
          id: generateBlockId(),
          title: blok.judul || undefined,
          items: ((blok as Record<string, unknown>).items || []) as Array<{ angka: string; satuan?: string; label: string; warna: string }>,
          accentColor: 'c',
          compression: { priority: 'low' as const, strategy: 'scroll' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
      case 'studi':
        return {
          type: 'studi' as const,
          id: generateBlockId(),
          title: blok.judul || undefined,
          karakter: blok.karakter || undefined,
          situasi: blok.situasi || blok.isi || '',
          pertanyaan: (blok as Record<string, unknown>).pertanyaan as string || '',
          pesan: (blok as Record<string, unknown>).pesan as string || undefined,
          accentColor: 'y',
          compression: { priority: 'medium' as const, strategy: 'accordion' as const },
          semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'reflect' as const },
        };
      default:
        // Fallback: any unknown type → def-box
        return {
          type: 'def-box' as const,
          id: generateBlockId(),
          borderColor: 'y',
          content: blok.isi || blok.judul || `Blok ${blok.tipe}`,
          compression: { priority: 'high' as const, strategy: 'accordion' as const },
          semantic: { learningPhase: 'inti' as const, interactionType: 'read' as const },
        };
    }
  });
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
