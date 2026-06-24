// ═══════════════════════════════════════════════════════════════════
// TEACHER CURATED BLOCKS — Single Source of Truth
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.9B / 4B: Extracted from AddBlockPanel.tsx to eliminate drift
// between AddBlockPanel, tests, and any other consumers.
//
// Rules:
//   - TEACHER_ADDABLE_BLOCKS = all block types a teacher can add via "Tambah Isi"
//   - POPULAR_BLOCK_TYPES = subset shown in quick-access grid (Sederhana mode)
//   - POPULAR_BLOCK_TYPES MUST be a subset of TEACHER_ADDABLE_BLOCKS
//   - Every TEACHER_ADDABLE_BLOCKS entry MUST have:
//     1. A guided editor in GUIDED_EDITOR_REGISTRY
//     2. A block definition in BLOCK_DEFINITIONS with addable !== false
//     3. A renderer in LAZY_RENDERER_MAP
// ═══════════════════════════════════════════════════════════════════

/**
 * All block types a teacher can add via the "Tambah Isi" panel.
 * In Sederhana (teacher) mode, only these blocks are shown.
 *
 * Each entry must have:
 * - A guided editor (hasGuidedEditor returns true)
 * - A block definition in BLOCK_DEFINITIONS (addable !== false)
 * - A renderer in LAZY_RENDERER_MAP
 */
export const TEACHER_ADDABLE_BLOCKS = [
  'materi-section',
  'def-box',
  'kuis',
  'diskusi',
  'refleksi',
  'sortir-game',
  'rangkuman',
  'motivasi',
  'gambar',
  'roda-game',
  // Sprint 8.8B / 3B: hotspot-image now has full vertical slice
  'hotspot-image',
] as const;

/**
 * Subset of TEACHER_ADDABLE_BLOCKS shown in the quick-access grid
 * in Sederhana (teacher) mode. These are the most commonly used blocks.
 *
 * MUST be a subset of TEACHER_ADDABLE_BLOCKS.
 * hotspot-image is intentionally NOT in popular list yet (Sprint 8.9A note).
 */
export const POPULAR_BLOCK_TYPES = [
  'materi-section',
  'def-box',
  'kuis',
  'diskusi',
  'refleksi',
  'sortir-game',
  'rangkuman',
  'motivasi',
  'gambar',
  'roda-game',
] as const;

/**
 * The original 10 curated blocks (before hotspot-image was added in 8.8B).
 * Useful for regression tests that verify the original set is still stable.
 */
export const ORIGINAL_TEACHER_BLOCKS = TEACHER_ADDABLE_BLOCKS.slice(0, 10) as readonly string[];

/**
 * Check if a block type is teacher-addable.
 * @param type - The block type string
 * @returns true if the block is in TEACHER_ADDABLE_BLOCKS
 */
export function isTeacherAddableBlock(type: string): boolean {
  return (TEACHER_ADDABLE_BLOCKS as readonly string[]).includes(type);
}

/**
 * Check if a block type is in the popular quick-access list.
 * @param type - The block type string
 * @returns true if the block is in POPULAR_BLOCK_TYPES
 */
export function isPopularBlock(type: string): boolean {
  return (POPULAR_BLOCK_TYPES as readonly string[]).includes(type);
}
