// ═══════════════════════════════════════════════════════════════════
// COMMIT SCHEMA UPDATE — Centralized immutable schema block update
// ═══════════════════════════════════════════════════════════════════
// Single source of truth for ALL schema.blocks[] writes.
// Every code path that sets blocks MUST go through this function.
//
// This ensures:
//   1. Version is bumped on every write (for cache invalidation)
//   2. Purity guard catches runtime state leaks (dev mode)
//   3. No direct `page.schema.blocks = x` mutations (DUALISM #3 fix)
//
// Location: @/core/schema/ (not store/) so both core/ and store/
// can import without circular dependency.
// ═══════════════════════════════════════════════════════════════════

import type { SchemaBlock, ScreenSchema } from './types';
import { bumpVersion } from './immutable';
import { assertDocumentPurity } from './session-state';
import { logTransaction } from '../renderer/transaction-log';
import { invalidateLayoutHash } from '../renderer/render-invariants';

/**
 * Commit a schema update with new blocks array.
 * Returns a NEW ScreenSchema — the original is never mutated.
 *
 * This is the ONLY correct way to write blocks to a schema:
 *   ✅ page.schema = commitSchemaUpdate(page.schema, newBlocks)
 *   ❌ page.schema.blocks = newBlocks  (bypasses version bump + purity check)
 *
 * @param schema - Current schema (will NOT be mutated)
 * @param newBlocks - New blocks array to set
 * @returns New ScreenSchema with bumped version
 */
export function commitSchemaUpdate(schema: ScreenSchema, newBlocks: SchemaBlock[]): ScreenSchema {
  const updated = bumpVersion({ ...schema, blocks: newBlocks });
  // Dev-mode purity guard: catches runtime state leaking into schema
  // Wrapped in try-catch to prevent dev-mode crashes from breaking operations
  try {
    assertDocumentPurity(updated, 'commitSchemaUpdate');
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[commitSchemaUpdate] Purity check failed (non-fatal):', e);
  }
  // FASE 2: Invalidate layout hash — schema changed, next render must produce a new hash
  invalidateLayoutHash(schema.id);
  // FASE 2: Transaction log for dev-mode pipeline tracing
  logTransaction('COMMIT_UPDATE', {
    detail: `v${updated.version} blocks=${newBlocks.length}`,
  });
  return updated;
}
