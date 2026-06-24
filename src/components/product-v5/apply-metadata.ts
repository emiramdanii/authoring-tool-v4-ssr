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
 * Upsert a badge in the badges array. If a matching badge (by icon or
 * keyword) exists, update its text. Otherwise, append a new badge.
 * Preserves all non-matching badges.
 */
function upsertBadge(
  badges: CoverBadge[],
  icon: string,
  keywords: string[],
  text: string,
  color: string,
): CoverBadge[] {
  const result = [...badges];
  const idx = result.findIndex(
    (b) => b.icon === icon || keywords.some((kw) => b.text.includes(kw)),
  );
  if (idx >= 0) {
    result[idx] = { ...result[idx]!, text, icon };
  } else {
    result.push({ icon, text, color });
  }
  return result;
}

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
  // Step 1: Update authoring store meta
  const authoringStore = useAuthoringStore.getState();
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) {
      authoringStore.updateMeta(key as keyof MetaState, String(value));
    }
  }

  // Step 2: Find ALL pages with cover blocks
  const canvaState = useCanvaStore.getState();
  const pages: CanvaPage[] = canvaState.pages;

  for (const page of pages) {
    if (!page.schema?.blocks) continue;

    for (const block of page.schema.blocks) {
      if (block.type !== 'cover') continue;

      const coverBlock = block as unknown as CoverBlock;
      if (!coverBlock.id) continue;

      const existingBadges: CoverBadge[] = coverBlock.badges ? [...coverBlock.badges] : [];
      let badgesChanged = false;
      let patch: Record<string, unknown> = {};

      // Step 3a: Update title if judulPertemuan is provided
      if (meta.judulPertemuan !== undefined && meta.judulPertemuan !== '') {
        patch.title = meta.judulPertemuan;
      }

      // Step 3b: Upsert badges for each metadata field
      for (const rule of BADGE_RULES) {
        const value = meta[rule.field];
        if (value !== undefined && value !== '') {
          const newBadges = upsertBadge(
            existingBadges,
            rule.icon,
            rule.keywords,
            value,
            rule.color,
          );
          if (newBadges.length !== existingBadges.length ||
              newBadges.some((b, i) => b.text !== existingBadges[i]?.text)) {
            existingBadges.length = 0;
            existingBadges.push(...newBadges);
            badgesChanged = true;
          }
        }
      }

      if (badgesChanged) {
        patch.badges = existingBadges;
      }

      // Step 4: Update canva store if anything changed
      if (Object.keys(patch).length > 0) {
        canvaState.updateSchemaBlock(coverBlock.id, patch as never, { source: 'user' });
      }
    }
  }
}
