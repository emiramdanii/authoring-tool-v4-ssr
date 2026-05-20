// ═══════════════════════════════════════════════════════════════════
// SCHEMA VERSION MIGRATION — Upgrade schema versions on load
// ═══════════════════════════════════════════════════════════════════
// When breaking changes are made to the SchemaBlock types, old schemas
// stored in localStorage or the database need to be migrated to the
// new format. This module provides:
//
//   1. migrateSchema()   — Upgrade a ScreenSchema to the latest version
//   2. MIGRATION_CHAIN   — Ordered list of migration functions
//   3. CURRENT_VERSION   — The latest schema version number
//
// DESIGN PRINCIPLES:
//   - Migrations are idempotent — safe to run multiple times
//   - Migrations never lose data — only transform/enrich
//   - Each migration has a clear from/to version number
//   - Migration chain is applied sequentially (1→2→3→...→CURRENT)
//   - Unknown versions (> CURRENT) are rejected with a warning
//
// USAGE:
//   import { migrateSchema } from '@/core/schema/schema-migration';
//
//   // After loading from storage
//   const schema = migrateSchema(loadedSchema);
//   assertValidSchema(schema);
//
// VERSION HISTORY:
//   v1 — Initial schema (all block types, CompressionHints, SemanticHints)
//   v2 — (future) Add interaction tracking fields
//   v3 — (future) Add accessibility hints
// ═══════════════════════════════════════════════════════════════════

import type { ScreenSchema, SchemaBlock } from './types';
import { SCHEMA_VERSION } from './validation';
import { generateBlockId } from './ensure-schema';
import { assertDocumentPurity } from './session-state';
import { logger } from '@/core/utils/logger';

// ── Migration Type ──────────────────────────────────────────────

export interface SchemaMigration {
  /** Version this migration upgrades FROM */
  fromVersion: number;
  /** Version this migration upgrades TO */
  toVersion: number;
  /** Human-readable description */
  description: string;
  /** The migration function — returns a new schema object */
  migrate(schema: ScreenSchema): ScreenSchema;
}

// ── Migration Chain ─────────────────────────────────────────────

/**
 * All registered migrations, ordered by fromVersion.
 * To add a new migration:
 *   1. Increment CURRENT_VERSION in validation.ts
 *   2. Add a migration object here with fromVersion = CURRENT_VERSION - 1
 *   3. Test that old schemas migrate correctly
 */
export const MIGRATION_CHAIN: SchemaMigration[] = [
  // ── v0 (no version) → v1 ──────────────────────────────────────
  // First migration: add version number, ensure all blocks have stable IDs,
  // add default compression/semantic hints where missing.
  {
    fromVersion: 0,
    toVersion: 1,
    description: 'Add version number, stable block IDs, default hints',
    migrate(schema: ScreenSchema): ScreenSchema {
      const blocks = schema.blocks.map(block => {
        // Ensure stable ID
        const id = block.id || generateBlockId();

        // Add default compression hints if missing
        const compression = block.compression || {
          priority: 'medium' as const,
          strategy: 'scroll' as const,
        };

        // Add default semantic hints if missing
        const semantic = block.semantic || inferSemanticDefaults(block);

        return { ...block, id, compression, semantic };
      });

      return {
        ...schema,
        version: 1,
        blocks,
      };
    },
  },

  // ── v1 → v2 ─────────────────────────────────────────────────
  // Add layout property to cover/hero blocks that lack it.
  // Without layout, resolveSceneLayout() silently drops these blocks
  // (excluded from flow AND absolute phases), causing "cover doesn't
  // appear" and "cover overflow to top" bugs.
  {
    fromVersion: 1,
    toVersion: 2,
    description: 'Add layout property to cover/hero blocks',
    migrate(schema: ScreenSchema): ScreenSchema {
      const FULL_PAGE_TYPES = new Set(['cover', 'hero']);
      const blocks = schema.blocks.map(block => {
        if (FULL_PAGE_TYPES.has(block.type) && !block.layout) {
          return {
            ...block,
            layout: { position: 'absolute' as const, x: 0, y: 0, width: 100, height: 100 },
          };
        }
        return block;
      });

      return {
        ...schema,
        version: 2,
        blocks,
      };
    },
  },
];

// ── Main Migration Function ─────────────────────────────────────

/**
 * Migrate a ScreenSchema to the latest version.
 * Applies migrations sequentially: v0→v1→v2→...→CURRENT_VERSION.
 *
 * If the schema is already at the latest version, returns it as-is.
 * If the schema version is unknown (> CURRENT_VERSION), logs a warning
 * and returns it unchanged (forward compatibility — don't break future schemas).
 */
export function migrateSchema(schema: ScreenSchema): ScreenSchema {
  let current = { ...schema };
  let currentVersion = current.version || 0;

  // Already at latest version
  if (currentVersion === SCHEMA_VERSION) return current;

  // Future version — don't touch
  if (currentVersion > SCHEMA_VERSION) {
    logger.warn(
      'SCHEMA-MIGRATION',
      `Schema version ${currentVersion} is newer than runtime version ${SCHEMA_VERSION}. ` +
      `Some features may not work correctly.`
    );
    return current;
  }

  // Apply migrations sequentially
  for (const migration of MIGRATION_CHAIN) {
    if (currentVersion === migration.fromVersion) {
      if (process.env.NODE_ENV !== 'production') {
        logger.warn(
          'SCHEMA-MIGRATION',
          `Migrating schema v${migration.fromVersion} → v${migration.toVersion}: ${migration.description}`
        );
      }
      current = migration.migrate(current);
      currentVersion = current.version || migration.toVersion;
    }
  }

  // Final version should match CURRENT_VERSION
  if (current.version !== SCHEMA_VERSION) {
    logger.warn(
      'SCHEMA-MIGRATION',
      `Migration chain incomplete: expected v${SCHEMA_VERSION}, got v${current.version}. ` +
      `Setting version to ${SCHEMA_VERSION}.`
    );
    current = { ...current, version: SCHEMA_VERSION };
  }

  // Dev-mode purity guard: ensure migration didn't introduce runtime state
  assertDocumentPurity(current, 'migrateSchema');

  return current;
}

/**
 * Migrate all pages' schemas in a CanvaPage array.
 * Returns the same array reference if no migration was needed,
 * or a new array with migrated schemas.
 */
export function migrateAllSchemas(pages: Array<{ schema?: ScreenSchema | null }>): {
  pages: Array<{ schema?: ScreenSchema | null }>;
  migratedCount: number;
} {
  let migratedCount = 0;
  const result = pages.map(page => {
    if (!page.schema) return page;

    const currentVersion = page.schema.version || 0;
    if (currentVersion === SCHEMA_VERSION) return page;

    const migrated = migrateSchema(page.schema);
    migratedCount++;
    return { ...page, schema: migrated };
  });

  return { pages: result, migratedCount };
}

// ── Helper: Infer Default Semantic Hints ────────────────────────

/**
 * Infer default semantic hints from block type and content.
 * This is called during v0→v1 migration for blocks without semantic hints.
 */
function inferSemanticDefaults(block: SchemaBlock): Record<string, unknown> {
  const blockType: string = block.type;

  // Map block types to learning phases
  const phaseMap: Record<string, string> = {
    'cover': 'pendahuluan',
    'petunjuk': 'pendahuluan',
    'tp': 'pendahuluan',
    'alur': 'pendahuluan',
    'tujuan-display': 'pendahuluan',
    'motivasi': 'pendahuluan',
    'materi-section': 'inti',
    'def-box': 'inti',
    'nc-grid': 'inti',
    'flashcard-set': 'inti',
    'ftab': 'inti',
    'nk-card': 'inti',
    'skenario': 'inti',
    'kuis': 'inti',
    'diskusi': 'inti',
    'sortir-game': 'inti',
    'roda-game': 'inti',
    'memory-game': 'inti',
    'matching-game': 'inti',
    'fill-blank-game': 'inti',
    'word-search-game': 'inti',
    'true-false-game': 'inti',
    'drag-drop-game': 'inti',
    'crossword-game': 'inti',
    'team-buzzer-game': 'inti',
    'hasil': 'penutup',
    'refleksi': 'penutup',
    'rangkuman': 'penutup',
    'penutup': 'penutup',
    'tabel-accord': 'inti',
    'hero': 'pendahuluan',
    'gambar': 'inti',
    'timeline': 'inti',
    'compare': 'inti',
    'reveal': 'inti',
    'tabel': 'inti',
    'checklist': 'inti',
    'statistik': 'inti',
    'studi': 'inti',
    'materi-blok': 'inti',
  };

  // Map block types to interaction types
  const interactionMap: Record<string, string> = {
    'kuis': 'choose',
    'sortir-game': 'drag',
    'roda-game': 'choose',
    'memory-game': 'choose',
    'matching-game': 'drag',
    'fill-blank-game': 'write',
    'word-search-game': 'choose',
    'true-false-game': 'choose',
    'drag-drop-game': 'drag',
    'crossword-game': 'write',
    'team-buzzer-game': 'choose',
    'diskusi': 'discuss',
    'refleksi': 'reflect',
    'flashcard-set': 'read',
    'reveal': 'choose',
    'checklist': 'choose',
  };

  return {
    learningPhase: phaseMap[blockType] || 'inti',
    interactionType: interactionMap[blockType] || 'read',
  };
}

// Re-export for external use (e.g., capability-registry)
export { inferSemanticDefaults };
