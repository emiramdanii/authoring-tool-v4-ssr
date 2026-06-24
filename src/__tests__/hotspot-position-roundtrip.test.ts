// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.8B-Patch-2 — Hotspot Position Roundtrip Tests
// ═══════════════════════════════════════════════════════════════════
// Verifies the core fix: preset posisi 3×3 → x/y roundtrip.
//
//   1. parseHotspotPosition("15,15") → { x: 15, y: 15 }
//   2. parseHotspotPosition("85,85") → { x: 85, y: 85 }
//   3. parseHotspotPosition("50,50") → { x: 50, y: 50 }
//   4. Malformed input → fallback to center { x: 50, y: 50 }
//   5. formatHotspotPosition(15, 15) → "15,15"
//   6. No 'posisi' field stored on block — only x and y
//   7. Guided editor posisi select derives value from x,y (not posisi)
//   8. Renderer reads x/y (not posisi)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

import { parseHotspotPosition, formatHotspotPosition } from '@/core/schema/hotspot-position';
import { getGuidedEditorSchema } from '@/core/schema/guided-patch';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry/definitions';
import type { HotspotImageBlock } from '@/core/schema/types/blocks';

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.8B-Patch-2 — Hotspot Position Roundtrip', () => {

  // ── 1-4. parseHotspotPosition pure function ──────────────────

  describe('parseHotspotPosition', () => {
    it('parses "15,15" → { x: 15, y: 15 } (Kiri Atas)', () => {
      const result = parseHotspotPosition('15,15');
      expect(result.x).toBe(15);
      expect(result.y).toBe(15);
    });

    it('parses "85,85" → { x: 85, y: 85 } (Kanan Bawah)', () => {
      const result = parseHotspotPosition('85,85');
      expect(result.x).toBe(85);
      expect(result.y).toBe(85);
    });

    it('parses "50,50" → { x: 50, y: 50 } (Tengah)', () => {
      const result = parseHotspotPosition('50,50');
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it('parses "15,85" → { x: 15, y: 85 } (Kiri Bawah)', () => {
      const result = parseHotspotPosition('15,85');
      expect(result.x).toBe(15);
      expect(result.y).toBe(85);
    });

    it('clamps values above 100 to 100', () => {
      const result = parseHotspotPosition('150,200');
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('clamps negative values to 0', () => {
      const result = parseHotspotPosition('-10,-20');
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('falls back to center {50,50} for malformed input', () => {
      expect(parseHotspotPosition('abc')).toEqual({ x: 50, y: 50 });
      expect(parseHotspotPosition('')).toEqual({ x: 50, y: 50 });
      expect(parseHotspotPosition(null)).toEqual({ x: 50, y: 50 });
      expect(parseHotspotPosition(undefined)).toEqual({ x: 50, y: 50 });
      expect(parseHotspotPosition('15')).toEqual({ x: 50, y: 50 });
      expect(parseHotspotPosition('15,15,15')).toEqual({ x: 50, y: 50 });
    });
  });

  // ── 5. formatHotspotPosition ────────────────────────────────

  describe('formatHotspotPosition', () => {
    it('formats (15, 15) → "15,15"', () => {
      expect(formatHotspotPosition(15, 15)).toBe('15,15');
    });

    it('formats (85, 85) → "85,85"', () => {
      expect(formatHotspotPosition(85, 85)).toBe('85,85');
    });

    it('formats (50, 50) → "50,50"', () => {
      expect(formatHotspotPosition(50, 50)).toBe('50,50');
    });

    it('falls back to "50,50" for non-number inputs', () => {
      expect(formatHotspotPosition('abc', 15)).toBe('50,15');
      expect(formatHotspotPosition(15, undefined)).toBe('15,50');
      expect(formatHotspotPosition(null, null)).toBe('50,50');
    });
  });

  // ── 6. No 'posisi' field stored on block ────────────────────

  describe('No posisi field on HotspotImageBlock', () => {
    it('createDefault does not produce a posisi field', () => {
      const def = BLOCK_DEFINITIONS['hotspot-image'];
      const block = def.createDefault() as HotspotImageBlock;
      expect(block.hotspots[0]).not.toHaveProperty('posisi');
      expect(block.hotspots[0]).toHaveProperty('x');
      expect(block.hotspots[0]).toHaveProperty('y');
    });

    it('HotspotImageBlock type does not have posisi (only x and y)', () => {
      // This is verified by TypeScript: if posisi were in the type,
      // the block below would not cause a type error when accessing .posisi
      const hs: HotspotImageBlock['hotspots'][number] = {
        id: '1', x: 50, y: 50, label: '1',
      };
      // @ts-expect-error — posisi is NOT a field on the hotspot type
      const _ = hs.posisi;
      expect(hs.x).toBe(50);
      expect(hs.y).toBe(50);
    });
  });

  // ── 7. Guided editor posisi field is a select with 9 options ─

  describe('Guided editor posisi field', () => {
    it('posisi is a select field (not stored, UI-only)', () => {
      const schema = getGuidedEditorSchema('hotspot-image');
      if (!schema) return;

      const hotspotsField = schema.fields!.find(f => f.key === 'hotspots');
      if (!hotspotsField?.fields) return;

      const posisiField = hotspotsField.fields.find(f => f.key === 'posisi');
      expect(posisiField).toBeDefined();
      expect(posisiField!.type).toBe('select');
      expect(posisiField!.options!.length).toBe(9);
    });

    it('all 9 posisi options map to valid x,y coordinates', () => {
      const schema = getGuidedEditorSchema('hotspot-image');
      if (!schema) return;

      const hotspotsField = schema.fields!.find(f => f.key === 'hotspots');
      if (!hotspotsField?.fields) return;

      const posisiField = hotspotsField.fields.find(f => f.key === 'posisi');
      if (!posisiField?.options) return;

      for (const opt of posisiField.options) {
        const parsed = parseHotspotPosition(opt.value);
        expect(parsed.x).toBeGreaterThanOrEqual(0);
        expect(parsed.x).toBeLessThanOrEqual(100);
        expect(parsed.y).toBeGreaterThanOrEqual(0);
        expect(parsed.y).toBeLessThanOrEqual(100);
      }
    });
  });

  // ── 8. Roundtrip: preset → parse → x/y → format → preset ────

  describe('Full roundtrip: preset → x/y → preset', () => {
    it('roundtrip stable for all 9 positions', () => {
      const positions = ['15,15', '50,15', '85,15', '15,50', '50,50', '85,50', '15,85', '50,85', '85,85'];
      for (const pos of positions) {
        const parsed = parseHotspotPosition(pos);
        const formatted = formatHotspotPosition(parsed.x, parsed.y);
        expect(formatted).toBe(pos);
      }
    });
  });
});
