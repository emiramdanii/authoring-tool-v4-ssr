// ═══════════════════════════════════════════════════════════════════
// BLOCK DEFINITION REGISTRY — Query Functions (API)
// ═══════════════════════════════════════════════════════════════════
// All query functions for looking up block metadata.
// Safe for store imports — no renderer dependency.
//
// Rule: This file MUST NOT import any React components or stores.

import type { PropertySchema } from '../../editor/types';
import type { BlockDefinitionMeta, BlockCapabilities, BlockPersonality } from './types';
import { DEFAULT_CAPABILITIES } from './types';
import { BLOCK_DEFINITIONS } from './definitions';

// ═══════════════════════════════════════════════════════════════════
// METADATA API (safe for store imports — no renderer dependency)
// ═══════════════════════════════════════════════════════════════════

/** Get block metadata by type (no renderer) */
export function getBlockMeta(type: string): BlockDefinitionMeta | undefined {
  return BLOCK_DEFINITIONS[type];
}

/** Get all block types in a category */
export function getBlocksByCategoryMeta(category: string): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS).filter(b => b.category === category);
}

/** Get all block types with a given personality */
export function getBlocksByPersonalityMeta(personality: BlockPersonality): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS).filter(b => b.personality === personality);
}

/** Get all block types used in a template */
export function getBlocksForTemplateTypeMeta(templateType: string): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS).filter(b =>
    b.usedInTemplates.includes(templateType) || b.usedInTemplates.includes('all')
  );
}

/** Check if a block type is registered */
export function isBlockRegisteredMeta(type: string): boolean {
  return type in BLOCK_DEFINITIONS;
}

/** Get capabilities for a block type */
export function getBlockCapabilitiesMeta(type: string): BlockCapabilities {
  return BLOCK_DEFINITIONS[type]?.capabilities ?? DEFAULT_CAPABILITIES;
}

/** Get property schema for a block type */
export function getBlockPropertySchemaMeta(type: string): PropertySchema | undefined {
  return BLOCK_DEFINITIONS[type]?.propertySchema;
}

/** Get all registered block metadata */
export function getAllBlockMeta(): BlockDefinitionMeta[] {
  return Object.values(BLOCK_DEFINITIONS);
}
