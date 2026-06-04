// ═══════════════════════════════════════════════════════════════════
// PRIMARY EDIT TARGET — Domain resolver for template-first editor
// ═══════════════════════════════════════════════════════════════════
// Sprint X.1 — Foundation for pattern-first teacher mode
//
// DESIGN PRINCIPLE:
//   After adding a page, the editor should open the PRIMARY editable
//   target immediately — not just "the first block", but the block
//   that represents the page's main content based on its phase/pattern.
//
// RESOLUTION ORDER:
//   1. Pattern metadata → pattern.primaryBlockType (future: PagePatternRegistry)
//   2. Phase mapping → known primary block per templateType
//   3. GuidedEditor availability → first block with a guided editor
//   4. Fallback → first schema block
//   5. Last resort → null (page-level editor)
//
// This resolver lives in the domain/schema layer, NOT in UI components.
// It is consumed by the store (addTemplatePage), not by React click handlers.
// ═══════════════════════════════════════════════════════════════════

import type { CanvaPage } from '@/components/canva/types';
import type { SchemaBlock } from '@/core/schema/types';
import { hasGuidedEditor } from '@/core/schema/guided-patch';

// ── Types ──────────────────────────────────────────────────────

/**
 * The result of resolving the primary editable target for a page.
 *
 * `blockId` and `blockType` are null when no suitable block is found
 * (e.g., blank custom page with no blocks). The caller should fall
 * back to page-level editor in this case.
 */
export interface PrimaryEditTarget {
  /** ID of the primary block to select, or null for page-level */
  blockId: string | null;
  /** Type of the primary block, or null for page-level */
  blockType: string | null;
}

// ── Phase → Primary Block Type Mapping ────────────────────────
// This mapping encodes the pedagogical knowledge:
// "When a teacher adds a [phase] page, what block do they edit first?"
//
// In the future, this will be replaced by PagePatternRegistry entries.
// For now, it's a minimal mapping that grows naturally.

const PHASE_PRIMARY_BLOCK: Record<string, string> = {
  cover: 'cover',
  petunjuk: 'petunjuk',
  dokumen: 'tujuan-display',
  tujuan: 'tujuan-display',
  motivasi: 'motivasi',
  hero: 'hero',
  materi: 'materi-section',
  skenario: 'skenario',
  diskusi: 'diskusi',
  kuis: 'kuis',
  game: 'sortir-game',   // default game type; roda-game etc. handled by pattern
  hasil: 'hasil',
  refleksi: 'refleksi',
  rangkuman: 'rangkuman',
  penutup: 'penutup',
};

// ── Resolver ──────────────────────────────────────────────────

/**
 * Resolve the primary editable target for a page.
 *
 * This is a PURE FUNCTION — no side effects, no store access.
 * It reads the page's templateType and schema to determine which
 * block should be auto-selected after page creation.
 *
 * Resolution order:
 *   1. Pattern metadata (future: page.pattern → pattern.primaryBlockType)
 *   2. Phase mapping (templateType → known primary block type)
 *   3. First block with a GuidedEditor
 *   4. First schema block
 *   5. null → page-level editor
 */
export function resolvePrimaryEditableTarget(page: CanvaPage): PrimaryEditTarget {
  const schema = page.schema;
  if (!schema?.blocks?.length) {
    return { blockId: null, blockType: null };
  }

  const blocks = schema.blocks;

  // ── Step 1: Pattern metadata (future-proof) ──
  // When PagePatternRegistry is implemented, pages will have a `pattern` field.
  // For now, we check if page has any pattern-like metadata.
  // This branch is ready to accept pattern-based resolution without refactoring.
  const pageWithPattern = page as CanvaPage & { pattern?: string };
  if (pageWithPattern.pattern) {
    // Future: look up pattern in PagePatternRegistry
    // const pattern = PagePatternRegistry.get(pageWithPattern.pattern);
    // if (pattern) return findBlockByType(blocks, pattern.primaryBlockType);
  }

  // ── Step 2: Phase mapping ──
  // Use the page's templateType to determine the expected primary block.
  const templateType = page.templateType;
  if (templateType && templateType !== 'custom') {
    const primaryType = PHASE_PRIMARY_BLOCK[templateType];
    if (primaryType) {
      const found = findBlockByType(blocks, primaryType);
      if (found) {
        return { blockId: found.id, blockType: found.type };
      }
    }
  }

  // ── Step 3: First block with GuidedEditor ──
  // Blocks with guided editors are teacher-facing content blocks.
  // This catches cases where templateType doesn't match the mapping
  // or where a custom combination of blocks is present.
  for (const block of blocks) {
    if (hasGuidedEditor(block.type)) {
      return { blockId: block.id, blockType: block.type };
    }
  }

  // ── Step 4: First schema block ──
  // Any block is better than nothing — at least the right panel
  // will show a contextual editor instead of generic "Edit Halaman".
  const first = blocks[0];
  if (first) {
    return { blockId: first.id, blockType: first.type };
  }

  // ── Step 5: Page-level fallback ──
  return { blockId: null, blockType: null };
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Find the first block of a given type in a blocks array.
 * Checks top-level blocks only (not nested containers like materi-section.content).
 * The primary block of a page is always top-level.
 */
function findBlockByType(blocks: SchemaBlock[], blockType: string): SchemaBlock | null {
  return blocks.find(b => b.type === blockType) ?? null;
}
