// ═══════════════════════════════════════════════════════════════════
// SCHEMA RECOVERY — Attempts to recover corrupted or outdated schemas
// ═══════════════════════════════════════════════════════════════════
// When localStorage data is corrupted or comes from an older version
// of the schema format, this module attempts to salvage as much
// data as possible instead of silently failing.
//
// Recovery strategies:
//   1. Try normal ensurePageSchema() — most common case
//   2. If schema exists but blocks are corrupted, filter out invalid blocks
//   3. If all else fails, return null (unrecoverable)
//
// Also provides a version migration check.
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock } from './types';
import { ensurePageSchema } from './ensure-schema';
import { SCHEMA_VERSION } from './validation';

/**
 * Attempts to recover a potentially corrupted or outdated page schema.
 * Returns a valid ScreenSchema if recovery succeeds, or null if
// the data is completely unrecoverable.
 *
 * @param page - The page object to attempt recovery on (can be any shape)
 */
export function recoverSchema(page: unknown): ScreenSchema | null {
  try {
    // Strategy 1: Try normal schema extraction first
    const schema = ensurePageSchema(page as Parameters<typeof ensurePageSchema>[0]);
    if (schema && schema.blocks && Array.isArray(schema.blocks) && schema.blocks.length > 0) {
      return schema;
    }

    // Strategy 2: If page has a raw schema with corrupted blocks, try to salvage
    if (page && typeof page === 'object' && page !== null) {
      const pageObj = page as Record<string, unknown>;

      // Check for schema property
      if (pageObj.schema && typeof pageObj.schema === 'object' && pageObj.schema !== null) {
        const rawSchema = pageObj.schema as Record<string, unknown>;

        if (Array.isArray(rawSchema.blocks)) {
          // Filter out blocks with invalid types or missing IDs
          const validBlocks = (rawSchema.blocks as unknown[]).filter(
            (b): b is SchemaBlock => {
              if (!b || typeof b !== 'object') return false;
              const block = b as Record<string, unknown>;
              return typeof block.type === 'string' && block.type.length > 0 && typeof block.id === 'string' && block.id.length > 0;
            }
          );

          if (validBlocks.length > 0) {
            return {
              ...rawSchema,
              blocks: validBlocks,
              version: (rawSchema.version as number) || 1,
              id: (rawSchema.id as string) || 'recovered',
              templateType: (rawSchema.templateType as string) || 'custom',
            } as ScreenSchema;
          }
        }
      }

      // Check for templateData.schemaScreen (legacy path)
      if (pageObj.templateData && typeof pageObj.templateData === 'object') {
        const templateData = pageObj.templateData as Record<string, unknown>;
        if (templateData.schemaScreen && typeof templateData.schemaScreen === 'object') {
          const rawSchema = templateData.schemaScreen as Record<string, unknown>;
          if (Array.isArray(rawSchema.blocks)) {
            const validBlocks = (rawSchema.blocks as unknown[]).filter(
              (b): b is SchemaBlock => {
                if (!b || typeof b !== 'object') return false;
                const block = b as Record<string, unknown>;
                return typeof block.type === 'string' && block.type.length > 0;
              }
            );

            if (validBlocks.length > 0) {
              return {
                ...rawSchema,
                blocks: validBlocks,
                version: (rawSchema.version as number) || 1,
                id: (rawSchema.id as string) || 'recovered-legacy',
                templateType: (rawSchema.templateType as string) || 'custom',
              } as ScreenSchema;
            }
          }
        }
      }
    }

    // Strategy 3: Unrecoverable
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a schema appears to be from an older version
 * and needs migration.
 */
export function needsSchemaMigration(schema: ScreenSchema): boolean {
  if (!schema.version) return true;
  return schema.version < SCHEMA_VERSION;
}
