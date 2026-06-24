// ═══════════════════════════════════════════════════════════════════
// EDITOR-RADICAL-RESET-01-PATCH-1 — MPI AddContentBar schema test
// ═══════════════════════════════════════════════════════════════════
// Verifies that MpiAddContentBar uses addTemplatePage() for typed
// pages (cover, materi, kuis, game) — NOT addPage() + mutate.
//
// Senior audit finding: addPage() creates a blank page. Mutating
// templateType after addPage() does NOT create the schema preset.
// Result: canvas shows empty/black/broken because schema.blocks
// doesn't contain the expected block (cover, materi-section, kuis,
// sortir-game).
//
// Patch-1 fix: typed pages use addTemplatePage(templateType) which
// calls createPageFromPreset() → createDefaultSchemaForTemplateType()
// → TEMPLATE_BLOCK_MAP populates schema.blocks with the correct
// block type per templateType.
//
// This test verifies the mapping is correct:
//   cover → schema.blocks[0].type === 'cover'
//   materi → schema.blocks[0].type === 'materi-section'
//   kuis → schema.blocks[0].type === 'kuis'
//   game → schema.blocks[0].type === 'sortir-game'
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';

// Mock stores so addTemplatePage can be called in isolation
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), {
    getState: () => ({
      modules: [], kuis: [], games: [], meta: {}, cp: {}, tp: [], atp: {},
      alur: {}, materi: { blok: [] }, skenario: [], petunjuk: { langkah: [] },
      diskusi: { pertanyaan: [] }, refleksi: { pertanyaan: [] },
      penutup: { preview: [] }, motivasi: {}, rangkuman: {}, suara: {},
    }),
    setState: () => {},
  }),
}));

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({ dirty: false }), {
    getState: () => ({ dirty: false, markDirty: () => {} }),
    setState: () => {},
  }),
}));

vi.mock('@/core/schema/capability-registry', () => ({
  BlockCapabilityRegistry: { filterByCapability: () => [] },
}));

// ─────────────────────────────────────────────────────────────────

describe('EDITOR-RADICAL-RESET-01-PATCH-1 — addTemplatePage schema preset', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // ── Cover → cover block ──────────────────────────────────────

  it('createPageFromPreset("cover") produces schema with cover block', () => {
    const page = createPageFromPreset('cover', 0);
    expect(page.schema).toBeDefined();
    expect(page.schema!.blocks.length).toBeGreaterThan(0);
    expect(page.schema!.blocks[0]!.type).toBe('cover');
  });

  it('cover page templateType is "cover"', () => {
    const page = createPageFromPreset('cover', 0);
    expect(page.templateType).toBe('cover');
  });

  // ── Materi → materi-section block ────────────────────────────

  it('createPageFromPreset("materi") produces schema with materi-section block', () => {
    const page = createPageFromPreset('materi', 0);
    expect(page.schema).toBeDefined();
    expect(page.schema!.blocks.length).toBeGreaterThan(0);
    expect(page.schema!.blocks[0]!.type).toBe('materi-section');
  });

  it('materi page templateType is "materi"', () => {
    const page = createPageFromPreset('materi', 0);
    expect(page.templateType).toBe('materi');
  });

  // ── Kuis → kuis block ────────────────────────────────────────

  it('createPageFromPreset("kuis") produces schema with kuis block', () => {
    const page = createPageFromPreset('kuis', 0);
    expect(page.schema).toBeDefined();
    expect(page.schema!.blocks.length).toBeGreaterThan(0);
    expect(page.schema!.blocks[0]!.type).toBe('kuis');
  });

  it('kuis page templateType is "kuis"', () => {
    const page = createPageFromPreset('kuis', 0);
    expect(page.templateType).toBe('kuis');
  });

  // ── Game → sortir-game block ─────────────────────────────────

  it('createPageFromPreset("game") produces schema with sortir-game block', () => {
    const page = createPageFromPreset('game', 0);
    expect(page.schema).toBeDefined();
    expect(page.schema!.blocks.length).toBeGreaterThan(0);
    expect(page.schema!.blocks[0]!.type).toBe('sortir-game');
  });

  it('game page templateType is "game"', () => {
    const page = createPageFromPreset('game', 0);
    expect(page.templateType).toBe('game');
  });

  // ── All typed pages have non-empty schema (not blank) ────────

  it('ALL typed pages have non-empty schema.blocks (not blank)', () => {
    const types = ['cover', 'petunjuk', 'tujuan', 'motivasi', 'materi', 'diskusi', 'skenario', 'kuis', 'game', 'hasil', 'refleksi', 'rangkuman', 'penutup'] as const;
    for (const t of types) {
      const page = createPageFromPreset(t, 0);
      expect(page.schema, `page type "${t}" should have schema`).toBeDefined();
      expect(page.schema!.blocks.length, `page type "${t}" should have at least 1 block`).toBeGreaterThan(0);
    }
  });

  // ── Page label is friendly (not "Scene N: ...") ──────────────

  it('cover page label starts with "Cover" (friendly, not "Scene 1: Cover")', () => {
    const page = createPageFromPreset('cover', 0);
    expect(page.label.startsWith('Cover')).toBe(true);
  });

  it('materi page label starts with "Materi" (friendly)', () => {
    const page = createPageFromPreset('materi', 0);
    expect(page.label.startsWith('Materi')).toBe(true);
  });

  it('game page label starts with "Game" (friendly)', () => {
    const page = createPageFromPreset('game', 0);
    expect(page.label.startsWith('Game')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Source audit: MpiAddContentBar uses addTemplatePage for typed pages
// ═══════════════════════════════════════════════════════════════════

describe('EDITOR-RADICAL-RESET-01-PATCH-1 — MpiAddContentBar source audit', () => {
  it('MpiAddContentBar imports addTemplatePage (not just addPage)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/canva/mpi-editor/MpiAddContentBar.tsx'),
      'utf-8',
    );
    expect(src).toMatch(/addTemplatePage/);
    expect(src).toMatch(/useCanvaStore\(.*addTemplatePage/);
  });

  it('MpiAddContentBar uses addTemplatePage for typed pages (cover, materi, kuis, game)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/canva/mpi-editor/MpiAddContentBar.tsx'),
      'utf-8',
    );
    // handleAddPage should call addTemplatePage for non-custom types
    expect(src).toMatch(/addTemplatePage\(templateType as PageTemplateType\)/);
    // handleAddGame should call addTemplatePage('game'), NOT addPage + mutate
    expect(src).toMatch(/addTemplatePage\('game'\)/);
  });

  it('MpiAddContentBar does NOT mutate templateType after addPage (old broken pattern)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/canva/mpi-editor/MpiAddContentBar.tsx'),
      'utf-8',
    );
    // The old broken pattern: addPage() then setState with mutated templateType
    // This regex looks for the anti-pattern: addPage followed by templateType mutation
    const oldPattern = /addPage\(\)[\s\S]*?templateType:\s*templateType\s*as\s*never/;
    expect(oldPattern.test(src)).toBe(false);
  });

  it('MpiAddContentBar only uses addPage for "Halaman Kosong" (custom)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/canva/mpi-editor/MpiAddContentBar.tsx'),
      'utf-8',
    );
    // addPage should only appear in the custom branch
    expect(src).toMatch(/templateType === 'custom'[\s\S]*?addPage\(\)/);
  });
});
