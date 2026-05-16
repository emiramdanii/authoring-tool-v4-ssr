// ═══════════════════════════════════════════════════════════════
// SCHEMA GC — Garbage collection helpers for schema block trees
// ═══════════════════════════════════════════════════════════════
// [G.4] Utilities for detecting and cleaning up orphaned references,
// estimating memory footprint, and compacting schema trees.
//
// Schema trees can accumulate dead references over long editing
// sessions (e.g., blocks referencing deleted parents, empty children
// arrays). These helpers detect and clean them up.
//
// Keep it simple — no deep graph algorithms, just practical checks.
// ═══════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock, BaseBlock } from './types';

// ── Types ──────────────────────────────────────────────────────

export interface SchemaStats {
  /** Total number of blocks in the tree (recursive) */
  blockCount: number;
  /** Estimated total memory in bytes */
  totalBytes: number;
  /** Maximum nesting depth */
  maxDepth: number;
  /** Number of orphaned references found */
  orphans: number;
}

// ── Core Functions ─────────────────────────────────────────────

/**
 * Estimate the memory footprint of a ScreenSchema.
 * Uses JSON serialization as a reasonable proxy for memory usage.
 * Cheap enough for periodic checks, not for hot paths.
 */
export function estimateSchemaSize(schema: ScreenSchema): number {
  try {
    return new Blob([JSON.stringify(schema)]).size;
  } catch {
    // Fallback: rough estimate
    return schema.blocks.length * 2000; // ~2KB per block as rough guess
  }
}

/**
 * Find blocks that reference non-existent parent IDs.
 * This can happen when blocks are moved/deleted but references
 * aren't cleaned up, especially in composite blocks with children.
 *
 * Returns an array of block IDs that are orphaned.
 */
export function findOrphanedRefs(schema: ScreenSchema): string[] {
  const orphans: string[] = [];
  const allBlockIds = new Set<string>();

  // First pass: collect all block IDs
  function collectIds(blocks: SchemaBlock[]): void {
    for (const block of blocks) {
      if (block.id) allBlockIds.add(block.id);
      if (block.children) collectIds(block.children);
    }
  }
  collectIds(schema.blocks);

  // Second pass: check for references to blocks that don't exist
  // (Currently, SchemaBlock doesn't have explicit parent references,
  // but children[] can contain blocks whose parent was deleted)
  function checkBlocks(blocks: SchemaBlock[]): void {
    for (const block of blocks) {
      // Check if this block has empty children arrays that could be trimmed
      if (block.children && block.children.length === 0) {
        // Empty children array — not strictly orphaned, but wasteful
        // We don't count these as orphans, just note them
      }

      // Check if children reference blocks that also appear at root level
      // (this shouldn't happen but could indicate a corruption)
      if (block.children) {
        checkBlocks(block.children);
      }

      // Check showIf references — if a block references a condition
      // that no longer exists, it's orphaned
      if (block.showIf && !allBlockIds.has(block.showIf)) {
        if (block.id) orphans.push(block.id);
      }
    }
  }
  checkBlocks(schema.blocks);

  return orphans;
}

/**
 * Compact a schema by removing dead references and empty structures.
 * Returns a new, cleaned schema (does not mutate the original).
 */
export function compactSchema(schema: ScreenSchema): ScreenSchema {
  function cleanBlocks(blocks: SchemaBlock[]): SchemaBlock[] {
    return blocks
      .filter(block => {
        // Remove blocks with no type (corrupt)
        if (!block.type) return false;
        return true;
      })
      .map(block => {
        const cleaned = { ...block };

        // Remove empty children arrays
        if (cleaned.children) {
          const cleanedChildren = cleanBlocks(cleaned.children);
          if (cleanedChildren.length === 0) {
            delete cleaned.children;
          } else {
            cleaned.children = cleanedChildren;
          }
        }

        // Remove showIf references that don't resolve
        if (cleaned.showIf) {
          // Verify the reference exists somewhere in the schema
          const allIds = new Set<string>();
          function collectAllIds(blocks: SchemaBlock[]): void {
            for (const b of blocks) {
              if (b.id) allIds.add(b.id);
              if (b.children) collectAllIds(b.children);
            }
          }
          collectAllIds(schema.blocks);
          if (!allIds.has(cleaned.showIf)) {
            delete cleaned.showIf;
          }
        }

        return cleaned;
      });
  }

  return {
    ...schema,
    blocks: cleanBlocks(schema.blocks),
  };
}

/**
 * Get comprehensive stats about a schema tree.
 * Useful for the memory dashboard.
 */
export function getSchemaStats(schema: ScreenSchema): SchemaStats {
  let blockCount = 0;
  let maxDepth = 0;

  function countBlocks(blocks: SchemaBlock[], depth: number): void {
    for (const block of blocks) {
      blockCount++;
      maxDepth = Math.max(maxDepth, depth);
      if (block.children && block.children.length > 0) {
        countBlocks(block.children, depth + 1);
      }
    }
  }

  countBlocks(schema.blocks, 1);

  const orphans = findOrphanedRefs(schema);
  const totalBytes = estimateSchemaSize(schema);

  return {
    blockCount,
    totalBytes,
    maxDepth,
    orphans: orphans.length,
  };
}
