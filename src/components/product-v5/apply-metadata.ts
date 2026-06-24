// ═══════════════════════════════════════════════════════════════
// V5-RELEASE-HARDENING-02 — Metadata Propagation Helper
// ═══════════════════════════════════════════════════════════════
// RC-META-002 fix: Replaces badge-matching-only approach with a
// robust helper that:
//   1. Updates authoring store meta (all fields)
//   2. Updates ALL cover blocks across ALL pages (not just first)
//   3. Upserts badges by icon OR keyword (existing → update, missing → add)
//   4. Preserves unknown badges (doesn't delete what it doesn't recognize)
//   5. Works with any template (PPKn or non-PPKn)
// ═══════════════════════════════════════════════════════════════

import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { MetaState } from '@/store/authoring/types';
import type { CanvaPage } from '@/components/canva/types';

interface CoverBadge {
  icon?: string;
  text: string;
  color: string;
}

interface CoverBlock {
  id?: string;
  type: string;
  title?: string;
  subtitle?: string;
  badges?: CoverBadge[];
}

/**
 * Badge match rules — used to find existing badges by icon OR keyword.
 * If a metadata field is non-empty and no matching badge exists, a new
 * badge is appended. If a matching badge exists, its text is updated.
 */
const BADGE_RULES: Array<{
  field: keyof MetaState;
  icon: string;
  keywords: string[];
  color: string;
  defaultText: string;
}> = [
  {
    field: 'namaGuru',
    icon: '👨\u200d🏫',
    keywords: ['Guru', 'guru', 'Pengajar'],
    color: 'g',
    defaultText: 'Guru',
  },
  {
    field: 'namaSekolah',
    icon: '🏫',
    keywords: ['SMP', 'Sekolah', 'sekolah', 'MTS', 'MA', 'SMA', 'SD', 'MI'],
    color: 'c',
    defaultText: 'Sekolah',
  },
  {
    field: 'judulPertemuan',
    icon: '📚',
    keywords: ['Modul', 'Bab', 'Pertemuan'],
    color: 'y',
    defaultText: 'Modul',
  },
];

/**
 * Apply metadata to ALL cover blocks across ALL pages in the canva store.
 * This is the single official entry point for metadata → cover propagation.
 *
 * What it does:
 *   1. Updates authoring store meta (all fields via updateMeta)
 *   2. Finds ALL pages with cover blocks (not just first page)
 *   3. For each cover block:
 *      - Updates title if judulPertemuan is set
 *      - Upserts badges for guru, sekolah, judul
 *      - Preserves all other badges
 *   4. Triggers canva store update via updateSchemaBlock
 *
 * This helper is template-agnostic — works with PPKn (which has
 * pre-existing badges) and non-PPKn templates (which may have no badges).
 */
export function applyMetadataToCoverBlocks(meta: Partial<MetaState>): void {
  // Step 1: Update authoring store meta (also triggers notifyMutation via updateMeta)
  const authoringStore = useAuthoringStore.getState();
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) {
      authoringStore.updateMeta(key as keyof MetaState, String(value));
    }
  }

  // Step 2: Patch ALL cover blocks across ALL pages directly.
  // V5-RC2 (P1-2): Do NOT use updateSchemaBlock() — it only searches
  // currentPageIndex, so cover blocks on other pages are missed.
  // Instead, build a new pages array with immutable updates and
  // set it via useCanvaStore.setState().
  const canvaState = useCanvaStore.getState();
  const oldPages: CanvaPage[] = canvaState.pages;
  let anyPageChanged = false;

  const newPages = oldPages.map((page) => {
    if (!page.schema?.blocks) return page;

    let pageBlocksChanged = false;
    const newBlocks = page.schema.blocks.map((block) => {
      if (block.type !== 'cover') return block;

      const coverBlock = block as unknown as CoverBlock;
      const existingBadges: CoverBadge[] = coverBlock.badges ? coverBlock.badges.map((b) => ({ ...b })) : [];
      let badgesChanged = false;
      const patch: Record<string, unknown> = {};

      // Update title if judulPertemuan is provided
      if (meta.judulPertemuan !== undefined && meta.judulPertemuan !== '') {
        patch.title = meta.judulPertemuan;
      }

      // Upsert badges for each metadata field
      for (const rule of BADGE_RULES) {
        const value = meta[rule.field];
        if (value !== undefined && value !== '') {
          const idx = existingBadges.findIndex(
            (b) => b.icon === rule.icon || rule.keywords.some((kw) => b.text.includes(kw)),
          );
          if (idx >= 0) {
            if (existingBadges[idx]!.text !== value) {
              existingBadges[idx] = { ...existingBadges[idx]!, text: value, icon: rule.icon };
              badgesChanged = true;
            }
          } else {
            existingBadges.push({ icon: rule.icon, text: value, color: rule.color });
            badgesChanged = true;
          }
        }
      }

      if (badgesChanged) {
        patch.badges = existingBadges;
      }

      if (Object.keys(patch).length === 0) return block;

      pageBlocksChanged = true;
      return { ...block, ...patch };
    });

    if (!pageBlocksChanged) return page;

    anyPageChanged = true;
    return {
      ...page,
      schema: { ...page.schema, blocks: newBlocks },
    };
  });

  // Step 3: Set new pages in canva store if any cover block was updated
  if (anyPageChanged) {
    useCanvaStore.setState({ pages: newPages });
  }
}
