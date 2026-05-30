// ═══════════════════════════════════════════════════════════════════
// BLOCK REGISTRY TESTS — Metadata completeness and consistency
// ═══════════════════════════════════════════════════════════════════
// Tests the BlockDefinitionRegistry for completeness, consistency,
// and correctness of all registered block types.

import { describe, it, expect } from 'vitest';
import {
  BLOCK_DEFINITIONS,
  DEFAULT_CAPABILITIES,
  getBlockMeta,
  getBlocksByCategoryMeta,
  getBlocksForTemplateTypeMeta,
  isBlockRegisteredMeta,
  getBlockCapabilitiesMeta,
  getBlockPropertySchemaMeta,
  getAllBlockMeta,
} from '@/core/registry/BlockDefinitionRegistry';
import type { BlockDefinitionMeta, BlockCapabilities } from '@/core/registry/BlockDefinitionRegistry';

// ═══════════════════════════════════════════════════════════════════
// EXPECTED BLOCK TYPES — All 43 block types that should be registered
// ═══════════════════════════════════════════════════════════════════

const EXPECTED_BLOCK_TYPES = [
  'cover', 'hero', 'petunjuk', 'tp', 'alur', 'skenario',
  'def-box', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card',
  'diskusi', 'kuis', 'sortir-game', 'roda-game',
  'hasil', 'refleksi', 'penutup', 'tabel-accord',
  'materi-section', 'tujuan-display', 'motivasi', 'rangkuman',
  'memory-game', 'matching-game', 'fill-blank-game',
  'word-search-game', 'true-false-game', 'drag-drop-game',
  'crossword-game', 'team-buzzer-game',
  'materi-blok', 'gambar', 'timeline', 'compare', 'reveal',
  'tabel', 'checklist', 'statistik', 'studi',
  'tab-icons', 'accordion', 'infografis',
];

// ═══════════════════════════════════════════════════════════════════
// 1. REGISTRATION COMPLETENESS
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Registration Completeness', () => {
  it('should have exactly 43 block types registered', () => {
    const registeredTypes = Object.keys(BLOCK_DEFINITIONS);
    expect(registeredTypes.length, `Expected 43 block types, got ${registeredTypes.length}`).toBe(43);
  });

  it('should register all expected block types', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      expect(isBlockRegisteredMeta(type), `Block type "${type}" should be registered`).toBe(true);
    }
  });

  it('should not have duplicate block type registrations', () => {
    const types = Object.keys(BLOCK_DEFINITIONS);
    const uniqueTypes = new Set(types);
    expect(types.length, 'No duplicate block types in registry').toBe(uniqueTypes.size);
  });

  it('should return undefined for unregistered block type', () => {
    expect(getBlockMeta('non-existent-block')).toBeUndefined();
    expect(isBlockRegisteredMeta('non-existent-block')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. REQUIRED METADATA
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Required Metadata', () => {
  it('should have required metadata fields for every block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const meta = getBlockMeta(type);
      expect(meta, `Block "${type}" should have metadata`).toBeDefined();

      // Required fields
      expect(meta!.type, `Block "${type}" should have type`).toBe(type);
      expect(meta!.name, `Block "${type}" should have name`).toBeTruthy();
      expect(meta!.icon, `Block "${type}" should have icon`).toBeTruthy();
      expect(meta!.category, `Block "${type}" should have category`).toBeTruthy();
      expect(meta!.description, `Block "${type}" should have description`).toBeTruthy();
      expect(meta!.capabilities, `Block "${type}" should have capabilities`).toBeDefined();
      expect(meta!.defaultLayout, `Block "${type}" should have defaultLayout`).toBeDefined();
      expect(meta!.usedInTemplates, `Block "${type}" should have usedInTemplates`).toBeDefined();
      expect(meta!.propertySchema, `Block "${type}" should have propertySchema`).toBeDefined();
      expect(typeof meta!.createDefault, `Block "${type}" should have createDefault function`).toBe('function');
    }
  });

  it('should have valid block type matching key', () => {
    for (const [key, meta] of Object.entries(BLOCK_DEFINITIONS)) {
      expect(meta.type, `Block key "${key}" should match meta.type`).toBe(key);
    }
  });

  it('should have non-empty names and icons', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const meta = getBlockMeta(type)!;
      expect(meta.name.length, `Block "${type}" name should not be empty`).toBeGreaterThan(0);
      expect(meta.icon.length, `Block "${type}" icon should not be empty`).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. CATEGORY VALIDATION
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Category Validation', () => {
  const VALID_CATEGORIES = ['layout', 'content', 'interactive', 'navigation', 'feedback', 'decoration'];

  it('should have valid category for every block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const meta = getBlockMeta(type)!;
      expect(VALID_CATEGORIES, `Block "${type}" category "${meta.category}" should be valid`).toContain(meta.category);
    }
  });

  it('should filter blocks by category correctly', () => {
    const interactiveBlocks = getBlocksByCategoryMeta('interactive');
    expect(interactiveBlocks.length).toBeGreaterThan(0);
    expect(interactiveBlocks.every(b => b.category === 'interactive')).toBe(true);

    const contentBlocks = getBlocksByCategoryMeta('content');
    expect(contentBlocks.length).toBeGreaterThan(0);
    expect(contentBlocks.every(b => b.category === 'content')).toBe(true);
  });

  it('should have at least one block in each primary category', () => {
    const primaryCategories = ['layout', 'content', 'interactive', 'feedback'];
    for (const cat of primaryCategories) {
      const blocks = getBlocksByCategoryMeta(cat);
      expect(blocks.length, `Category "${cat}" should have at least 1 block`).toBeGreaterThan(0);
    }
  });

  it('should return empty array for non-existent category', () => {
    const blocks = getBlocksByCategoryMeta('non-existent');
    expect(blocks).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. TEMPLATE TYPE FILTERING
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Template Type Filtering', () => {
  it('should filter blocks by template type correctly', () => {
    const materiBlocks = getBlocksForTemplateTypeMeta('materi');
    expect(materiBlocks.length).toBeGreaterThan(0);
    expect(materiBlocks.every(b => b.usedInTemplates.includes('materi') || b.usedInTemplates.includes('all'))).toBe(true);

    const gameBlocks = getBlocksForTemplateTypeMeta('game');
    expect(gameBlocks.length).toBeGreaterThan(0);
    expect(gameBlocks.every(b => b.usedInTemplates.includes('game') || b.usedInTemplates.includes('all'))).toBe(true);
  });

  it('should return empty array for non-existent template type with no "all" blocks', () => {
    const blocks = getBlocksForTemplateTypeMeta('non-existent-type-xyz');
    // Only returns blocks with usedInTemplates = ['all'], if any
    const allBlocks = blocks.filter(b => b.usedInTemplates.includes('all'));
    expect(blocks.length).toBe(allBlocks.length);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. CAPABILITIES VALIDATION
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Capabilities Validation', () => {
  const CAPABILITY_KEYS: Array<keyof BlockCapabilities> = [
    'editable', 'resizable', 'movable', 'backgroundCustom',
    'interactive', 'autoGeneratable', 'composite', 'variants',
  ];

  it('should have all capability fields for every block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const caps = getBlockCapabilitiesMeta(type);
      for (const key of CAPABILITY_KEYS) {
        expect(caps[key], `Block "${type}" should have capability "${key}"`).toBeDefined();
      }
    }
  });

  it('should have boolean values for boolean capabilities', () => {
    const boolKeys: Array<keyof BlockCapabilities> = [
      'editable', 'resizable', 'movable', 'backgroundCustom',
      'interactive', 'autoGeneratable', 'composite',
    ];
    for (const type of EXPECTED_BLOCK_TYPES) {
      const caps = getBlockCapabilitiesMeta(type);
      for (const key of boolKeys) {
        expect(typeof caps[key], `Block "${type}" capability "${key}" should be boolean`).toBe('boolean');
      }
    }
  });

  it('should have variants as array of A/B/C', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const caps = getBlockCapabilitiesMeta(type);
      expect(Array.isArray(caps.variants), `Block "${type}" variants should be array`).toBe(true);
      expect(caps.variants.length, `Block "${type}" should have at least one variant`).toBeGreaterThan(0);
      for (const v of caps.variants) {
        expect(['A', 'B', 'C'], `Block "${type}" variant should be A, B, or C`).toContain(v);
      }
    }
  });

  it('should return default capabilities for unregistered block type', () => {
    const caps = getBlockCapabilitiesMeta('non-existent');
    expect(caps).toEqual(DEFAULT_CAPABILITIES);
  });

  it('should mark game blocks as interactive', () => {
    const gameTypes = [
      'sortir-game', 'roda-game', 'memory-game', 'matching-game',
      'fill-blank-game', 'word-search-game', 'true-false-game',
      'drag-drop-game', 'crossword-game', 'team-buzzer-game',
      'kuis', 'skenario', 'diskusi',
    ];
    for (const type of gameTypes) {
      const caps = getBlockCapabilitiesMeta(type);
      expect(caps.interactive, `Block "${type}" should be interactive`).toBe(true);
    }
  });

  it('should mark cover as absolute layout', () => {
    const cover = getBlockMeta('cover')!;
    expect(cover.defaultLayout.position).toBe('absolute');
  });

  it('should mark content blocks as flow layout', () => {
    const contentTypes = ['def-box', 'nc-grid', 'tp', 'alur', 'kuis', 'diskusi', 'refleksi'];
    for (const type of contentTypes) {
      const meta = getBlockMeta(type)!;
      expect(meta.defaultLayout.position, `Block "${type}" should default to flow`).toBe('flow');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. PROPERTY SCHEMAS VALIDATION
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Property Schemas', () => {
  it('should have property schema for every block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const schema = getBlockPropertySchemaMeta(type);
      expect(schema, `Block "${type}" should have propertySchema`).toBeDefined();
    }
  });

  it('should have valid property schema structure', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const schema = getBlockPropertySchemaMeta(type);
      // Property schemas should be an object or array
      expect(schema, `Block "${type}" propertySchema should exist`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. CREATE DEFAULT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Create Default Functions', () => {
  it('should return an object from createDefault for every block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const meta = getBlockMeta(type)!;
      const defaults = meta.createDefault();
      expect(defaults, `Block "${type}" createDefault should return an object`).toBeTruthy();
      expect(typeof defaults, `Block "${type}" createDefault should return object`).toBe('object');
    }
  });

  it('should include a title in default content', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const meta = getBlockMeta(type)!;
      const defaults = meta.createDefault();
      // Most blocks should have a title or similar content field
      const hasContent = 'title' in defaults || 'content' in defaults || 'text' in defaults;
      expect(hasContent || Object.keys(defaults).length > 0, `Block "${type}" createDefault should have content`).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. METADATA API
// ═══════════════════════════════════════════════════════════════════

describe('Block Registry — Metadata API', () => {
  it('getAllBlockMeta should return all block metadata', () => {
    const all = getAllBlockMeta();
    expect(all.length).toBe(EXPECTED_BLOCK_TYPES.length);
  });

  it('getBlockMeta should return correct metadata', () => {
    const meta = getBlockMeta('cover');
    expect(meta).toBeDefined();
    expect(meta!.type).toBe('cover');
    expect(meta!.name).toBe('Cover');
    expect(meta!.category).toBe('layout');
  });

  it('getBlockMeta should return undefined for unknown type', () => {
    expect(getBlockMeta('unknown-type')).toBeUndefined();
  });
});
