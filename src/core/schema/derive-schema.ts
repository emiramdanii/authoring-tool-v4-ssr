// ═══════════════════════════════════════════════════════════════════════
// DERIVE SCHEMA — Deprecated (schema-first architecture)
// ═══════════════════════════════════════════════════════════════════════
// The original derive-schema.ts was a one-way derivation pipeline:
//   Authoring → deriveSchema() → page.schema → Renderer
//
// Now replaced by schema-first architecture where blocks are created
// directly via ensurePageSchema() / addSchemaBlock() / sync-projection.
//
// This file exists only for backward compatibility with test mocks.
// Do NOT import or use in production code.
// ═══════════════════════════════════════════════════════════════════════

import type { ScreenSchema } from './types';
import type { PageTemplateType } from '@/components/canva/types';

/** @deprecated Use ensurePageSchema() or addSchemaBlock() instead. */
export function deriveSchema(
  _templateType: PageTemplateType,
): ScreenSchema | null {
  return null;
}
