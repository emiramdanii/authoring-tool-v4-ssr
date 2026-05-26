// ═══════════════════════════════════════════════════════════════════
// SYNC PROJECTION → SCHEMA — Write Konten editor changes to canvas
// ═══════════════════════════════════════════════════════════════════
// Phase 18.3d: Projection Live Sync
//
// ⚠️  DEPRECATION NOTICE (Phase 1 — Guided Schema Authoring):
//   These functions are DEPRECATED. New code should use
//   applyGuidedSchemaPatch() from '@/core/schema/guided-patch'.
//
//   Migration guide:
//     OLD: syncKuisToSchema(kuis) → finds page by templateType + replaces block
//     NEW: applyGuidedSchemaPatch({ pageId, blockId, patch: { questions: kuis } })
//
//   Why deprecate?
//     - sync functions find blocks by templateType + blockType (fragile)
//     - sync functions replace entire block content (no deep merge)
//     - sync functions have no undo support
//     - sync functions bypass edit bus (no audit trail)
//     - applyGuidedSchemaPatch fixes ALL of these issues
//
//   These functions will be REMOVED in Phase 5 (Cleanup Dual Source).
//   Until then, they still work but log a deprecation warning in dev.
// ═══════════════════════════════════════════════════════════════════

import type { KuisItem, DiskusiData, RefleksiData, MateriState } from '@/store/authoring-store';
import type { SchemaBlock, ScreenSchema, MateriContentTab } from './types';
import type { CanvaPage } from '@/components/canva/types';
import { useCanvaStore } from '@/store/canva/store';
import { assertDocumentPurity } from './session-state';
import { generateBlockId } from './ensure-schema';
import { nanoid } from 'nanoid';

// ── Helper: Find and update a block in a page's schema ──────────

function updateSchemaBlock(
  templateType: string,
  blockType: string,
  updater: (block: SchemaBlock) => SchemaBlock,
): boolean {
  // Runtime deprecation warning (dev only)
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[DEPRECATED] sync-projection updateSchemaBlock('${templateType}', '${blockType}') is deprecated. ` +
      `Use applyGuidedSchemaPatch({ pageId, blockId, patch }) instead. ` +
      `See guided-patch.ts for migration guide.`
    );
  }

  const store = useCanvaStore.getState();
  const pages = [...store.pages];
  let updated = false;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page!.templateType !== templateType) continue;
    if (!page!.schema) continue;

    const blockIdx = page!.schema.blocks.findIndex(b => b.type === blockType);
    if (blockIdx < 0) continue;

    const newBlocks = [...page!.schema.blocks];
    newBlocks[blockIdx]! = updater!(newBlocks[blockIdx]);

    const newSchema: ScreenSchema = { ...page!.schema, blocks: newBlocks };
    assertDocumentPurity(newSchema, 'syncFieldToSchema');

    pages[i] = { ...page, schema: newSchema };
    updated = true;
  }

  if (updated) {
    // [PERSIST-01] Capture snapshot before projection sync writes so undo can revert
    useCanvaStore.getState()._pushHistory();
    useCanvaStore.setState({ pages });
  }

  return updated;
}

// ── Public Sync Functions ───────────────────────────────────────

/**
 * Sync KuisItem[] from projection to the KuisBlock in the schema.
 * Updates all KuisBlocks on pages with templateType 'kuis'.
 *
 * @deprecated Use applyGuidedSchemaPatch() instead.
 *   OLD: syncKuisToSchema(kuis)
 *   NEW: applyGuidedSchemaPatch({ pageId, blockId, patch: { questions: kuis } })
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
 *
 * @deprecated Use applyGuidedSchemaPatch() instead.
 *   OLD: syncDiskusiToSchema(diskusi)
 *   NEW: applyGuidedSchemaPatch({ pageId, blockId, patch: { ...diskusi } })
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
 *
 * @deprecated Use applyGuidedSchemaPatch() instead.
 *   OLD: syncRefleksiToSchema(refleksi)
 *   NEW: applyGuidedSchemaPatch({ pageId, blockId, patch: { ...refleksi } })
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
 * Also produces MateriContentTab[] when any MateriBlok has a tabGroup.
 *
 * This is the most complex sync because MateriBlok has varied types
 * (teks, definisi, poin, highlight, compare, infobox, etc.) that each
 * map to different SchemaBlock types (def-box, nc-grid, etc.).
 *
 * @deprecated Use applyGuidedSchemaPatch() instead.
 *   OLD: syncMateriToSchema(materi)
 *   NEW: applyGuidedSchemaPatch({ pageId, blockId, patch: { content: [...], tabs: [...] } })
 *   Note: MateriBlock→SchemaBlock conversion still needed until Phase 3.
 */
export function syncMateriToSchema(materi: MateriState): boolean {
  return updateSchemaBlock('materi', 'materi-section', (block) => {
    const result = materiBloksToSchemaBlocks(materi.blok);
    return {
      ...block,
      content: result.content,
      ...(result.tabs ? { tabs: result.tabs } : {}),
    } as SchemaBlock;
  });
}

/**
 * Convert a single MateriBlok from the authoring store to a SchemaBlock for the canvas.
 * Each MateriBlok.tipe maps to a specific SchemaBlock type.
 */
function convertMateriBlok(blok: import('@/store/authoring-store').MateriBlok): SchemaBlock {
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
        semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'read' as const },
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
        semantic: { topic: blok.judul, learningPhase: 'inti' as const, interactionType: 'choose' as const },
      };
    case 'statistik':
      return {
        type: 'statistik' as const,
        id: generateBlockId(),
        title: blok.judul || undefined,
        items: ((blok as unknown as Record<string, unknown>).items || []) as Array<{ angka: string; satuan?: string; label: string; warna: string }>,
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
        pertanyaan: (blok as unknown as Record<string, unknown>).pertanyaan as string || '',
        pesan: (blok as unknown as Record<string, unknown>).pesan as string || undefined,
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
}

/**
 * Convert MateriBlok[] from the authoring store to SchemaBlock[] for the canvas.
 * When any MateriBlok has a `tabGroup`, blocks are grouped into tabs
 * (MateriContentTab[]) and both flat content + tabs are returned.
 * When no `tabGroup` is present, returns flat content only (backward compatible).
 */
function materiBloksToSchemaBlocks(bloks: import('@/store/authoring-store').MateriBlok[]): {
  content: SchemaBlock[];
  tabs?: MateriContentTab[];
} {
  // Check if any blok has tabGroup
  const hasGroups = bloks.some(b => b.tabGroup);

  if (!hasGroups) {
    // Existing flat behavior — zero breaking change
    return { content: bloks.flatMap(b => convertMateriBlok(b)) };
  }

  // Group by tabGroup
  const groups = new Map<string, import('@/store/authoring-store').MateriBlok[]>();
  const ungrouped: import('@/store/authoring-store').MateriBlok[] = [];

  for (const blok of bloks) {
    if (blok.tabGroup) {
      const arr = groups.get(blok.tabGroup) || [];
      arr.push(blok);
      groups.set(blok.tabGroup, arr);
    } else {
      ungrouped.push(blok);
    }
  }

  // Create tabs from groups
  const tabs: MateriContentTab[] = [];

  // Ungrouped bloks go into a leading "Utama" tab
  if (ungrouped.length > 0) {
    tabs.push({
      id: `tab-${nanoid(6)}`,
      label: 'Utama',
      content: ungrouped.flatMap(b => convertMateriBlok(b)),
    });
  }

  for (const [groupName, groupBloks] of groups) {
    tabs.push({
      id: `tab-${nanoid(6)}`,
      label: groupName,
      content: groupBloks.flatMap(b => convertMateriBlok(b)),
    });
  }

  // Put all content as flat content too for backward compat
  const allContent = bloks.flatMap(b => convertMateriBlok(b));

  return { content: allContent, tabs };
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
