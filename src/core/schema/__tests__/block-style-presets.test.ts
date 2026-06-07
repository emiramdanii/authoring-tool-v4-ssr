// ═══════════════════════════════════════════════════════════════════
// BLOCK STYLE PRESETS TESTS — Resolver and capability map validation
// ═══════════════════════════════════════════════════════════════════
// Sprint 2K.1 — Tests the block style preset data layer:
//   - resolveBlockStylePreset() — filters preset values by block type
//   - getSupportedStyleFields() — lists style fields per block type
//   - blockTypeSupportsPresets() — boolean check
//   - getBlockStylePreset() — lookup by ID
//   - getAllBlockStylePresets() — list all presets
//   - Edge cases: unknown preset, unknown block, empty capabilities

import { describe, it, expect } from 'vitest';
import {
  resolveBlockStylePreset,
  getSupportedStyleFields,
  blockTypeSupportsPresets,
  getBlockStylePreset,
  getAllBlockStylePresets,
  getApplicableBlockStylePresets,
} from '@/core/schema/block-style-presets';

// ═══════════════════════════════════════════════════════════════════
// 1. RESOLVER — Core logic: preset + block type → filtered patch
// ═══════════════════════════════════════════════════════════════════

describe('resolveBlockStylePreset', () => {
  // ── Happy path: well-known combinations ──

  it('kuis + ceria → { variant: "B" } (accentColor dead for kuis)', () => {
    const result = resolveBlockStylePreset('ceria', 'kuis');
    expect(result).toEqual({ variant: 'B' });
    // No accentColor — kuis renderer hardcodes it
    expect(result).not.toHaveProperty('accentColor');
  });

  it('materi-section + ceria → { accentColor: "y", variant: "B" }', () => {
    const result = resolveBlockStylePreset('ceria', 'materi-section');
    expect(result).toEqual({ accentColor: 'y', variant: 'B' });
  });

  it('sortir-game + formal → { accentColor: "c" } (no variant for sortir-game)', () => {
    const result = resolveBlockStylePreset('formal', 'sortir-game');
    expect(result).toEqual({ accentColor: 'c' });
    expect(result).not.toHaveProperty('variant');
  });

  it('def-box + berani → { borderColor: "r" } (accentColor mapped → borderColor)', () => {
    const result = resolveBlockStylePreset('berani', 'def-box');
    // Preset 'berani' has accentColor='r'
    // def-box only supports borderColor, but FIELD_MAPPINGS maps
    // accentColor → borderColor, so the resolver produces the mapped patch.
    expect(result).toEqual({ borderColor: 'r' });
    expect(result).not.toHaveProperty('accentColor');
  });

  it('def-box + ceria → { borderColor: "y" } (accentColor mapped → borderColor)', () => {
    const result = resolveBlockStylePreset('ceria', 'def-box');
    expect(result).toEqual({ borderColor: 'y' });
  });

  it('materi-blok + formal → { warna: "c" } (accentColor mapped → warna)', () => {
    const result = resolveBlockStylePreset('formal', 'materi-blok');
    // Preset 'formal' has accentColor='c'
    // materi-blok supports 'warna', mapped from accentColor
    expect(result).toEqual({ warna: 'c' });
    expect(result).not.toHaveProperty('accentColor');
  });

  it('materi-blok + ceria → { warna: "y" } (accentColor mapped → warna)', () => {
    const result = resolveBlockStylePreset('ceria', 'materi-blok');
    expect(result).toEqual({ warna: 'y' });
  });

  // ── All 7 presets for materi-section (accentColor + variant) ──

  it('materi-section + all presets → accentColor + variant for each', () => {
    const expected: Record<string, { accentColor: string; variant: string }> = {
      ceria:       { accentColor: 'y', variant: 'B' },
      formal:      { accentColor: 'c', variant: 'A' },
      modern:      { accentColor: 'p', variant: 'C' },
      petualangan: { accentColor: 'g', variant: 'B' },
      minimal:     { accentColor: 'c', variant: 'C' },
      hangat:      { accentColor: 'o', variant: 'A' },
      berani:      { accentColor: 'r', variant: 'B' },
    };

    for (const [presetId, expectedPatch] of Object.entries(expected)) {
      const result = resolveBlockStylePreset(presetId, 'materi-section');
      expect(result).toEqual(expectedPatch);
    }
  });

  // ── Blocks with only variant support ──

  it('diskusi + ceria → { variant: "B" } (no accentColor)', () => {
    const result = resolveBlockStylePreset('ceria', 'diskusi');
    expect(result).toEqual({ variant: 'B' });
  });

  it('nc-grid + modern → { variant: "C" } (no accentColor)', () => {
    const result = resolveBlockStylePreset('modern', 'nc-grid');
    expect(result).toEqual({ variant: 'C' });
  });

  it('tujuan-display + formal → { variant: "A" } (no accentColor)', () => {
    const result = resolveBlockStylePreset('formal', 'tujuan-display');
    expect(result).toEqual({ variant: 'A' });
  });

  // ── Blocks with only accentColor support ──

  it('accordion + ceria → { accentColor: "y" } (no variant)', () => {
    const result = resolveBlockStylePreset('ceria', 'accordion');
    expect(result).toEqual({ accentColor: 'y' });
  });

  it('gambar + hangat → { accentColor: "o" } (no variant)', () => {
    const result = resolveBlockStylePreset('hangat', 'gambar');
    expect(result).toEqual({ accentColor: 'o' });
  });

  it('timeline + petualangan → { accentColor: "g" } (no variant)', () => {
    const result = resolveBlockStylePreset('petualangan', 'timeline');
    expect(result).toEqual({ accentColor: 'g' });
  });

  it('roda-game + berani → { accentColor: "r" } (no variant)', () => {
    const result = resolveBlockStylePreset('berani', 'roda-game');
    expect(result).toEqual({ accentColor: 'r' });
  });

  // ── Blocks with accentColor + layoutVariant ──

  it('tab-icons + ceria → { accentColor: "y" } (layoutVariant not in preset)', () => {
    const result = resolveBlockStylePreset('ceria', 'tab-icons');
    // tab-icons supports accentColor, layoutVariant, animation
    // but preset only sets accentColor + variant
    // variant is NOT in tab-icons capabilities, so it's filtered out
    expect(result).toEqual({ accentColor: 'y' });
    expect(result).not.toHaveProperty('layoutVariant');
    expect(result).not.toHaveProperty('animation');
  });

  it('infografis + modern → { accentColor: "p" } (layoutVariant not in preset)', () => {
    const result = resolveBlockStylePreset('modern', 'infografis');
    expect(result).toEqual({ accentColor: 'p' });
    expect(result).not.toHaveProperty('layoutVariant');
  });

  // ── Blocks with no style capabilities ──

  it('tp + ceria → {} (tp reads no block-level style)', () => {
    const result = resolveBlockStylePreset('ceria', 'tp');
    expect(result).toEqual({});
  });

  it('refleksi + formal → {} (refleksi has no style fields)', () => {
    const result = resolveBlockStylePreset('formal', 'refleksi');
    expect(result).toEqual({});
  });

  it('motivasi + modern → {} (motivasi has no style fields)', () => {
    const result = resolveBlockStylePreset('modern', 'motivasi');
    expect(result).toEqual({});
  });

  it('petunjuk + petualangan → {} (petunjuk has no style fields)', () => {
    const result = resolveBlockStylePreset('petualangan', 'petunjuk');
    expect(result).toEqual({});
  });

  // ── Edge cases: unknown preset / unknown block type ──

  it('unknown preset + materi-section → {}', () => {
    const result = resolveBlockStylePreset('nonexistent', 'materi-section');
    expect(result).toEqual({});
  });

  it('ceria + unknown block type → {}', () => {
    const result = resolveBlockStylePreset('ceria', 'nonexistent-block');
    expect(result).toEqual({});
  });

  it('unknown preset + unknown block type → {}', () => {
    const result = resolveBlockStylePreset('nonexistent', 'nonexistent-block');
    expect(result).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. CAPABILITY MAP — getSupportedStyleFields
// ═══════════════════════════════════════════════════════════════════

describe('getSupportedStyleFields', () => {
  it('returns accentColor + variant for materi-section', () => {
    expect(getSupportedStyleFields('materi-section')).toEqual(['accentColor', 'variant']);
  });

  it('returns only variant for kuis (accentColor is dead)', () => {
    expect(getSupportedStyleFields('kuis')).toEqual(['variant']);
  });

  it('returns accentColor + layoutVariant + animation for tab-icons', () => {
    expect(getSupportedStyleFields('tab-icons')).toEqual(['accentColor', 'layoutVariant', 'animation']);
  });

  it('returns borderColor for def-box', () => {
    expect(getSupportedStyleFields('def-box')).toEqual(['borderColor']);
  });

  it('returns only accentColor for accordion', () => {
    expect(getSupportedStyleFields('accordion')).toEqual(['accentColor']);
  });

  it('returns empty array for tp (no style fields)', () => {
    expect(getSupportedStyleFields('tp')).toEqual([]);
  });

  it('returns empty array for unknown block type', () => {
    expect(getSupportedStyleFields('nonexistent-block')).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. SUPPORTS PRESETS — blockTypeSupportsPresets
// ═══════════════════════════════════════════════════════════════════

describe('blockTypeSupportsPresets', () => {
  it('returns true for materi-section', () => {
    expect(blockTypeSupportsPresets('materi-section')).toBe(true);
  });

  it('returns true for kuis (has variant)', () => {
    expect(blockTypeSupportsPresets('kuis')).toBe(true);
  });

  it('returns true for def-box (has borderColor)', () => {
    expect(blockTypeSupportsPresets('def-box')).toBe(true);
  });

  it('returns false for tp (no style fields)', () => {
    expect(blockTypeSupportsPresets('tp')).toBe(false);
  });

  it('returns false for refleksi (no style fields)', () => {
    expect(blockTypeSupportsPresets('refleksi')).toBe(false);
  });

  it('returns false for unknown block type', () => {
    expect(blockTypeSupportsPresets('nonexistent-block')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. PRESET LOOKUP — getBlockStylePreset
// ═══════════════════════════════════════════════════════════════════

describe('getBlockStylePreset', () => {
  it('returns the ceria preset', () => {
    const preset = getBlockStylePreset('ceria');
    expect(preset).toBeDefined();
    expect(preset!.id).toBe('ceria');
    expect(preset!.label).toBe('Ceria');
    expect(preset!.values.accentColor).toBe('y');
    expect(preset!.values.variant).toBe('B');
  });

  it('returns the formal preset', () => {
    const preset = getBlockStylePreset('formal');
    expect(preset).toBeDefined();
    expect(preset!.values.accentColor).toBe('c');
    expect(preset!.values.variant).toBe('A');
  });

  it('returns undefined for unknown preset', () => {
    expect(getBlockStylePreset('nonexistent')).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. ALL PRESETS — getAllBlockStylePresets
// ═══════════════════════════════════════════════════════════════════

describe('getAllBlockStylePresets', () => {
  it('returns exactly 7 presets', () => {
    expect(getAllBlockStylePresets()).toHaveLength(7);
  });

  it('contains all expected preset IDs', () => {
    const ids = getAllBlockStylePresets().map(p => p.id);
    expect(ids).toContain('ceria');
    expect(ids).toContain('formal');
    expect(ids).toContain('modern');
    expect(ids).toContain('petualangan');
    expect(ids).toContain('minimal');
    expect(ids).toContain('hangat');
    expect(ids).toContain('berani');
  });

  it('each preset has required fields', () => {
    for (const preset of getAllBlockStylePresets()) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.icon).toBeTruthy();
      expect(preset.values).toBeDefined();
      // Every preset should set at least accentColor or variant
      expect(
        preset.values.accentColor !== undefined ||
        preset.values.variant !== undefined ||
        preset.values.borderColor !== undefined,
      ).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. DEF-BOX SPECIAL CASE — borderColor, not accentColor
// ═══════════════════════════════════════════════════════════════════

describe('def-box special case', () => {
  it('def-box capability includes borderColor, NOT accentColor', () => {
    const fields = getSupportedStyleFields('def-box');
    expect(fields).toContain('borderColor');
    expect(fields).not.toContain('accentColor');
  });

  it('def-box returns borderColor patch via accentColor mapping for all presets', () => {
    const expected: Record<string, string> = {
      ceria: 'y',
      formal: 'c',
      modern: 'p',
      petualangan: 'g',
      minimal: 'c',
      hangat: 'o',
      berani: 'r',
    };
    for (const [presetId, colorToken] of Object.entries(expected)) {
      const result = resolveBlockStylePreset(presetId, 'def-box');
      expect(result).toEqual({ borderColor: colorToken });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6b. MATERI-BLOK SPECIAL CASE — warna, not accentColor
// ═══════════════════════════════════════════════════════════════════

describe('materi-blok special case', () => {
  it('materi-blok capability includes warna, NOT accentColor', () => {
    const fields = getSupportedStyleFields('materi-blok');
    expect(fields).toContain('warna');
    expect(fields).not.toContain('accentColor');
  });

  it('materi-blok returns warna patch via accentColor mapping for all presets', () => {
    const expected: Record<string, string> = {
      ceria: 'y',
      formal: 'c',
      modern: 'p',
      petualangan: 'g',
      minimal: 'c',
      hangat: 'o',
      berani: 'r',
    };
    for (const [presetId, colorToken] of Object.entries(expected)) {
      const result = resolveBlockStylePreset(presetId, 'materi-blok');
      expect(result).toEqual({ warna: colorToken });
    }
  });

  it('materi-blok supports presets', () => {
    expect(blockTypeSupportsPresets('materi-blok')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 7. NO DEAD FIELDS — Resolver never returns unsupported fields
// ═══════════════════════════════════════════════════════════════════

describe('no dead fields in resolver output', () => {
  it('never includes accentColor for blocks that hardcode it', () => {
    const deadBlocks = ['kuis', 'diskusi', 'nc-grid', 'tujuan-display'];
    for (const blockType of deadBlocks) {
      for (const preset of getAllBlockStylePresets()) {
        const result = resolveBlockStylePreset(preset.id, blockType);
        expect(result).not.toHaveProperty('accentColor');
      }
    }
  });

  it('never includes variant for blocks that do not support it', () => {
    const noVariantBlocks = ['accordion', 'gambar', 'timeline', 'sortir-game', 'roda-game', 'cover', 'def-box', 'materi-blok'];
    for (const blockType of noVariantBlocks) {
      for (const preset of getAllBlockStylePresets()) {
        const result = resolveBlockStylePreset(preset.id, blockType);
        expect(result).not.toHaveProperty('variant');
      }
    }
  });

  it('never includes accentColor for blocks that use field mapping', () => {
    const mappedBlocks = ['def-box', 'materi-blok'];
    for (const blockType of mappedBlocks) {
      for (const preset of getAllBlockStylePresets()) {
        const result = resolveBlockStylePreset(preset.id, blockType);
        expect(result).not.toHaveProperty('accentColor');
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 8. DEDUPLICATION — getApplicableBlockStylePresets
// ═══════════════════════════════════════════════════════════════════

describe('getApplicableBlockStylePresets', () => {
  it('kuis returns only 3 deduplicated presets (A, B, C variants)', () => {
    const applicable = getApplicableBlockStylePresets('kuis');
    // 7 presets but only 3 unique patches: {variant:'A'}, {variant:'B'}, {variant:'C'}
    expect(applicable).toHaveLength(3);
    const variants = applicable.map(a => a.patch.variant).sort();
    expect(variants).toEqual(['A', 'B', 'C']);
  });

  it('kuis deduplicated: first-of-each-variant wins', () => {
    const applicable = getApplicableBlockStylePresets('kuis');
    const ids = applicable.map(a => a.preset.id);
    // Ceria(B), Formal(A), Modern(C) are the first presets for each variant
    expect(ids).toContain('ceria');    // first variant:'B'
    expect(ids).toContain('formal');   // first variant:'A'
    expect(ids).toContain('modern');   // first variant:'C'
    // Duplicates skipped: petualangan(B), minimal(C), hangat(A), berani(B)
    expect(ids).not.toContain('petualangan');
    expect(ids).not.toContain('minimal');
    expect(ids).not.toContain('hangat');
    expect(ids).not.toContain('berani');
  });

  it('diskusi also returns only 3 deduplicated presets', () => {
    const applicable = getApplicableBlockStylePresets('diskusi');
    expect(applicable).toHaveLength(3);
  });

  it('materi-section returns all 7 presets (all unique patches)', () => {
    const applicable = getApplicableBlockStylePresets('materi-section');
    expect(applicable).toHaveLength(7);
  });

  it('def-box returns 6 deduplicated presets (minimal and formal both → c)', () => {
    const applicable = getApplicableBlockStylePresets('def-box');
    // 7 presets map to: y,c,p,g,c,o,r → 6 unique (c appears twice: formal + minimal)
    expect(applicable).toHaveLength(6);
  });

  it('materi-blok also returns 6 deduplicated presets (c duplicated)', () => {
    const applicable = getApplicableBlockStylePresets('materi-blok');
    expect(applicable).toHaveLength(6);
  });

  it('sortir-game returns 6 deduplicated presets (c duplicated)', () => {
    const applicable = getApplicableBlockStylePresets('sortir-game');
    // 7 presets map to accentColor: y,c,p,g,c,o,r → 6 unique
    expect(applicable).toHaveLength(6);
  });

  it('returns empty array for blocks without capabilities', () => {
    const applicable = getApplicableBlockStylePresets('tp');
    expect(applicable).toEqual([]);
  });

  it('each entry has preset and patch properties', () => {
    const applicable = getApplicableBlockStylePresets('kuis');
    for (const entry of applicable) {
      expect(entry.preset).toBeDefined();
      expect(entry.preset.id).toBeTruthy();
      expect(entry.patch).toBeDefined();
      expect(Object.keys(entry.patch).length).toBeGreaterThan(0);
    }
  });
});
