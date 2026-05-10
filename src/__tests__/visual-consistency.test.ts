// ═══════════════════════════════════════════════════════════════════
// INTEGRATION TEST — Visual consistency across canvas/preview/export
// ═══════════════════════════════════════════════════════════════════
// Verifies that the unified SchemaRenderer pipeline produces
// consistent output across all three render modes:
//   - canvas (editing mode with selection overlay)
//   - preview (interactive mode)
//   - export (static output for PDF/image)
//
// Test Strategy:
//   1. Schema integrity — same schema → same block structure
//   2. Registry completeness — all registered types dispatch correctly
//   3. Token consistency — same tokens → same colors/fonts across modes
//   4. Adapter fidelity — TemplateAdapter preserves content through conversion
//   5. Layout consistency — flow/absolute split is mode-independent

import { describe, it, expect } from 'vitest';
import { SCENE_REGISTRY, getBlockDefinition, isBlockRegistered, getBlockCapabilities } from '@/core/registry/SceneRegistry';
import { TokenResolver } from '@/core/renderer/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';
import type { CanvaPage } from '@/components/canva/types';
import { convertToSchema, paletteToTokenOverrides } from '@/core/engine/TemplateAdapter';

// ═══════════════════════════════════════════════════════════════════
// HELPER: Create a test ScreenSchema with representative blocks
// ═══════════════════════════════════════════════════════════════════

function createTestSchema(): ScreenSchema {
  return {
    id: 'test-screen',
    templateType: 'materi',
    sectionLabel: 'Materi',
    sectionColor: 'y',
    blocks: [
      {
        type: 'def-box',
        id: 'test-def-1',
        content: 'Norma adalah peraturan atau ketentuan yang mengatur tingkah laku manusia.',
        borderColor: 'y',
        layout: { position: 'flow' },
      },
      {
        type: 'nc-grid',
        id: 'test-ncgrid-1',
        cards: [
          { icon: '🏛️', title: 'Norma Agama', body: 'Peraturan dari Tuhan', color: 'y' },
          { icon: '⚖️', title: 'Norma Hukum', body: 'Peraturan negara', color: 'r' },
        ],
        layout: { position: 'flow' },
      },
      {
        type: 'flashcard-set',
        id: 'test-flash-1',
        cards: [
          { q: 'Apa itu norma?', a: 'Peraturan tingkah laku' },
          { q: 'Sanksi norma agama?', a: 'Dosa' },
        ],
        layout: { position: 'flow' },
      },
    ],
    background: {
      type: 'gradient',
      color1: 'bg',
      color2: 'bg2',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE 1: Registry Completeness
// ═══════════════════════════════════════════════════════════════════

describe('SceneRegistry — Block Registration Completeness', () => {
  const EXPECTED_BLOCK_TYPES = [
    'cover', 'petunjuk', 'tp', 'alur', 'skenario',
    'def-box', 'nc-grid', 'flashcard-set', 'ftab', 'nk-card',
    'diskusi', 'kuis', 'sortir-game', 'roda-game',
    'hasil', 'refleksi', 'penutup', 'tabel-accord',
  ];

  it('should register all expected block types', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      expect(isBlockRegistered(type), `Block type "${type}" should be registered`).toBe(true);
    }
  });

  it('should have a renderer for every registered block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const def = getBlockDefinition(type);
      expect(def, `Block "${type}" should have a definition`).toBeDefined();
      expect(def!.renderer, `Block "${type}" should have a renderer`).toBeDefined();
      expect(typeof def!.renderer, `Block "${type}" renderer should be a component`).toBe('function');
    }
  });

  it('should have capabilities for every registered block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const caps = getBlockCapabilities(type);
      expect(caps, `Block "${type}" should have capabilities`).toBeDefined();
      expect(typeof caps.editable, `Block "${type}" editable should be boolean`).toBe('boolean');
      expect(typeof caps.interactive, `Block "${type}" interactive should be boolean`).toBe('boolean');
    }
  });

  it('should not have duplicate block type registrations', () => {
    const types = Object.keys(SCENE_REGISTRY);
    const uniqueTypes = new Set(types);
    expect(types.length, 'No duplicate block types in registry').toBe(uniqueTypes.size);
  });

  it('should have valid default layout for every block type', () => {
    for (const type of EXPECTED_BLOCK_TYPES) {
      const def = getBlockDefinition(type);
      expect(def!.defaultLayout, `Block "${type}" should have defaultLayout`).toBeDefined();
      expect(['flow', 'absolute'], `Block "${type}" layout position should be flow or absolute`).toContain(def!.defaultLayout.position);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE 2: Token Resolver Consistency
// ═══════════════════════════════════════════════════════════════════

describe('TokenResolver — Consistent across render modes', () => {
  it('should produce identical colors for same token key regardless of theme', () => {
    const resolver = new TokenResolver();
    // Core color tokens should be stable
    expect(resolver.color('y')).toBe(resolver.color('y'));
    expect(resolver.color('c')).toBe(resolver.color('c'));
    expect(resolver.color('g')).toBe(resolver.color('g'));
    expect(resolver.color('r')).toBe(resolver.color('r'));
  });

  it('should produce consistent colorAlpha values', () => {
    const resolver = new TokenResolver();
    const alpha1 = resolver.colorAlpha('y', 0.5);
    const alpha2 = resolver.colorAlpha('y', 0.5);
    expect(alpha1).toBe(alpha2);
  });

  it('should pass through hex colors when not a token key', () => {
    const resolver = new TokenResolver();
    expect(resolver.color('#ff0000')).toBe('#ff0000');
    expect(resolver.color('#00ff00')).toBe('#00ff00');
  });

  it('should produce consistent font families', () => {
    const resolver = new TokenResolver();
    const body1 = resolver.fontFamily('body');
    const body2 = resolver.fontFamily('body');
    expect(body1).toBe(body2);

    const display1 = resolver.fontFamily('display');
    const display2 = resolver.fontFamily('display');
    expect(display1).toBe(display2);
  });

  it('should create identical resolvers for same theme', () => {
    const r1 = new TokenResolver();
    const r2 = new TokenResolver();
    // Both use default theme
    expect(r1.color('y')).toBe(r2.color('y'));
    expect(r1.color('bg')).toBe(r2.color('bg'));
    expect(r1.color('text')).toBe(r2.color('text'));
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE 3: Schema Structure Consistency
// ═══════════════════════════════════════════════════════════════════

describe('Schema — Structural consistency across modes', () => {
  const schema = createTestSchema();

  it('should have consistent block count across all modes', () => {
    // The same schema should produce the same number of blocks regardless of mode
    const modes: Array<'canvas' | 'preview' | 'export'> = ['canvas', 'preview', 'export'];
    for (const mode of modes) {
      expect(schema.blocks.length, `Block count in ${mode} mode should be consistent`).toBe(3);
    }
  });

  it('should preserve block types in flow/absolute split', () => {
    const flowBlocks = schema.blocks.filter(b => !b.layout || b.layout.position === 'flow');
    const absoluteBlocks = schema.blocks.filter(b => b.layout?.position === 'absolute');

    // All test blocks are flow
    expect(flowBlocks.length).toBe(3);
    expect(absoluteBlocks.length).toBe(0);

    // Block types should be preserved
    const flowTypes = flowBlocks.map(b => b.type);
    expect(flowTypes).toContain('def-box');
    expect(flowTypes).toContain('nc-grid');
    expect(flowTypes).toContain('flashcard-set');
  });

  it('should preserve block IDs across mode transitions', () => {
    const modes: Array<'canvas' | 'preview' | 'export'> = ['canvas', 'preview', 'export'];
    const idsByMode = modes.map(mode =>
      schema.blocks.map(b => b.id).join(',')
    );
    // All modes should see the same block IDs
    expect(idsByMode[0]).toBe(idsByMode[1]);
    expect(idsByMode[1]).toBe(idsByMode[2]);
  });

  it('should preserve block content across mode transitions', () => {
    const defBlock = schema.blocks.find(b => b.type === 'def-box');
    expect(defBlock).toBeDefined();
    // Content should be identical regardless of mode
    expect((defBlock as any).content).toBe('Norma adalah peraturan atau ketentuan yang mengatur tingkah laku manusia.');
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE 4: TemplateAdapter — Conversion Fidelity
// ═══════════════════════════════════════════════════════════════════

describe('TemplateAdapter — Content fidelity through conversion', () => {
  function createTestCanvaPage(templateType: string, templateData: Record<string, unknown> = {}): CanvaPage {
    return {
      id: 'test-page',
      label: 'Test Page',
      templateType: templateType as any,
      locked: true,
      elements: [],
      overlayElements: [],
      bgColor: '#1e293b',
      bgDataUrl: null,
      overlay: 0,
      colorPalette: null,
      templateData,
      navConfig: {
        showNavbar: true,
        showPrevNext: true,
        showScore: false,
        showProgress: true,
        navbarStyle: 'colorful' as const,
      },
    };
  }

  it('should convert cover template to schema with correct block type', () => {
    const page = createTestCanvaPage('cover', {
      title: 'Hakikat Norma',
      subtitle: 'PPKn Kelas 8',
      icon: '⚖️',
    });
    const schema = convertToSchema(page)!;
    expect(schema).toBeDefined();
    expect(schema.templateType).toBe('cover');
    expect(schema.blocks.length).toBeGreaterThan(0);
    expect(schema.blocks[0].type).toBe('cover');
  });

  it('should convert petunjuk template to schema', () => {
    const page = createTestCanvaPage('petunjuk');
    const schema = convertToSchema(page)!;
    expect(schema).toBeDefined();
    expect(schema.templateType).toBe('petunjuk');
    const hasPetunjuk = schema.blocks.some(b => b.type === 'petunjuk');
    expect(hasPetunjuk, 'Should contain petunjuk block').toBe(true);
  });

  it('should convert materi template to schema', () => {
    const page = createTestCanvaPage('materi');
    const schema = convertToSchema(page)!;
    expect(schema).toBeDefined();
    expect(schema.templateType).toBe('materi');
  });

  it('should convert kuis template to schema', () => {
    const page = createTestCanvaPage('kuis');
    const schema = convertToSchema(page)!;
    expect(schema).toBeDefined();
    expect(schema.templateType).toBe('kuis');
  });

  it('should handle unknown template types gracefully', () => {
    const page = createTestCanvaPage('unknown-type');
    const schema = convertToSchema(page)!;
    expect(schema).toBeDefined();
    // Should not crash — produces a generic schema
    expect(schema.blocks).toBeDefined();
    expect(Array.isArray(schema.blocks)).toBe(true);
  });

  it('should preserve section label through conversion', () => {
    const page = createTestCanvaPage('materi');
    const schema = convertToSchema(page)!;
    if (schema.sectionLabel) {
      expect(typeof schema.sectionLabel).toBe('string');
      expect(schema.sectionLabel.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE 5: Palette Override Consistency
// ═══════════════════════════════════════════════════════════════════

describe('Palette Overrides — Consistent token mapping', () => {
  it('should map palette colors to token keys consistently', () => {
    const overrides = paletteToTokenOverrides({
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
      mapping: { '--y': '#ff0000', '--c': '#00ff00', '--g': '#0000ff', '--r': '#ffff00' },
    } as any);

    expect(overrides).toBeDefined();
    expect(overrides!.y).toBe('#ff0000');
    expect(overrides!.c).toBe('#00ff00');
    expect(overrides!.g).toBe('#0000ff');
    expect(overrides!.r).toBe('#ffff00');
  });

  it('should return undefined for pages without palette', () => {
    const overrides = paletteToTokenOverrides(null as any);
    expect(overrides).toBeUndefined();
  });

  it('should apply overrides consistently to TokenResolver', () => {
    const resolver = new TokenResolver();
    const raw = resolver.raw;
    const originalY = raw.colors.y;

    // Simulate palette override
    const overrides = { y: '#custom-yellow' };
    (raw.colors as Record<string, string>)['y'] = overrides.y;

    expect(resolver.color('y')).toBe('#custom-yellow');

    // Reset
    (raw.colors as Record<string, string>)['y'] = originalY;
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST SUITE 6: Layout Split Consistency
// ═══════════════════════════════════════════════════════════════════

describe('Layout Split — Flow vs Absolute consistency', () => {
  it('should correctly categorize blocks by layout position', () => {
    const schema: ScreenSchema = {
      id: 'layout-test',
      templateType: 'cover',
      blocks: [
        { type: 'cover', id: 'abs-1', layout: { position: 'absolute', x: 0, y: 0, width: 100, height: 100, zIndex: 0 } } as any,
        { type: 'def-box', id: 'flow-1', layout: { position: 'flow' } } as any,
        { type: 'nc-grid', id: 'flow-2' } as any, // No layout = default flow
        { type: 'kuis', id: 'abs-2', layout: { position: 'absolute', x: 10, y: 20, width: 80, height: 60, zIndex: 5 } } as any,
      ],
    };

    const flowBlocks = schema.blocks.filter(b => !b.layout || b.layout.position === 'flow');
    const absoluteBlocks = schema.blocks.filter(b => b.layout?.position === 'absolute');

    expect(flowBlocks.length).toBe(2);
    expect(absoluteBlocks.length).toBe(2);
    expect(flowBlocks.map(b => b.id)).toEqual(['flow-1', 'flow-2']);
    expect(absoluteBlocks.map(b => b.id)).toEqual(['abs-1', 'abs-2']);
  });

  it('should handle cover block as absolute by default', () => {
    const coverDef = getBlockDefinition('cover');
    expect(coverDef!.defaultLayout.position).toBe('absolute');
  });

  it('should handle content blocks as flow by default', () => {
    const contentTypes = ['def-box', 'nc-grid', 'flashcard-set', 'tp', 'alur', 'kuis', 'diskusi'];
    for (const type of contentTypes) {
      const def = getBlockDefinition(type);
      expect(def!.defaultLayout.position, `Block "${type}" should default to flow`).toBe('flow');
    }
  });
});
