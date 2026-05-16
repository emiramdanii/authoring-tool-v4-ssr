// ═══════════════════════════════════════════════════════════════════════
// DERIVE SCHEMA — Stub (original removed in R-1 cleanup)
// ═══════════════════════════════════════════════════════════════════════
// The original derive-schema.ts (1,078 lines) was a one-way derivation
// pipeline: Authoring → deriveSchema() → page.schema → Renderer.
// Since we're moving to a schema-first architecture where blocks are
// created directly (not derived from authoring data), this is now a stub.
// PagePresetRegistry will be updated in the redesign to create schemas
// directly instead of deriving them.
// ═══════════════════════════════════════════════════════════════════════

import type { ScreenSchema } from './types';
import type { PageTemplateType } from '@/components/canva/types';

/** Derivation context — currently unused, kept for API compatibility */
export interface DeriveContext {
  // Placeholder — will be replaced with direct schema creation in redesign
}

/** Create a derivation context — returns empty object for now */
export function createDeriveContext(): DeriveContext {
  return {};
}

/**
 * Derive a ScreenSchema from a page template type.
 * Returns null for now — schemas should be created directly via
 * ensurePageSchema() or addSchemaBlock() instead of derived.
 */
export function deriveSchema(
  _templateType: PageTemplateType,
  _ctx: DeriveContext
): ScreenSchema | null {
  // Schema-first: blocks are created directly, not derived from authoring
  return null;
}
