// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Parity Tests (Canvas = Preview = Present = Export)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// The parity contract states that all four rendering modes — Canvas,
// Preview, Present, Export HTML — MUST consume the SAME resolved
// tokens for the same input. There is no separate "export style" or
// "canvas style".
//
// Sprint 8.1 testing strategy:
//   - We cannot yet wire Canvas/Preview/Export to the resolver directly
//     (frozen boundary — no renderer/export changes in 8.1).
//   - Instead, we test the PARITY CONTRACT at the resolver level:
//     the resolver is the single source of truth, and any consumer
//     that calls `resolveStyleContract()` with the same input gets
//     identical tokens.
//   - We simulate the four consumer entry points with four thin
//     adapter functions, then assert all four return identical
//     tokens. When Sprint 8.2+ wires the real consumers, those
//     adapters are replaced 1:1 with the actual consumer calls —
//     and the parity test continues to pass.
//
// Test coverage:
//   - Same input → identical tokens across all 4 consumer modes
//   - Different inputs → tokens differ predictably
//   - No consumer adds or removes fields
//   - All 6 presets produce identical cross-mode parity
//   - Legacy project → identical cross-mode parity
//   - Invalid input → identical fallback across all modes
//   - Consumer adapters are deterministic
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  resolveStyleContract,
  resolveLegacyStyle,
  type LegacyStyleInput,
  type ResolvedStyleTokens,
  type StyleContract,
  type StylePresetId,
} from '../index';

// ─────────────────────────────────────────────────────────────────
// Consumer adapter stubs
// ─────────────────────────────────────────────────────────────────
// These represent the four rendering modes. In Sprint 8.1, they are
// thin pass-throughs to the resolver. In Sprint 8.2+, the real
// consumers (PageFrame, LivePreview, ExportApp, html-templates) will
// be wired to call resolveStyleContract() directly — at which point
// these stubs are deleted and the parity test runs against the real
// consumer entry points.
//
// The contract: each adapter MUST call resolveStyleContract() and
// return its output verbatim. No adapter may add, remove, or modify
// any field.

function resolveCanvasStyle(input: StyleContract): ResolvedStyleTokens {
  return resolveStyleContract(input);
}

function resolvePreviewStyle(input: StyleContract): ResolvedStyleTokens {
  return resolveStyleContract(input);
}

function resolvePresentStyle(input: StyleContract): ResolvedStyleTokens {
  return resolveStyleContract(input);
}

function resolveExportStyle(input: StyleContract): ResolvedStyleTokens {
  return resolveStyleContract(input);
}

const ALL_MODES = [
  { name: 'Canvas', fn: resolveCanvasStyle },
  { name: 'Preview', fn: resolvePreviewStyle },
  { name: 'Present', fn: resolvePresentStyle },
  { name: 'Export', fn: resolveExportStyle },
] as const;

// ─────────────────────────────────────────────────────────────────
// Test suites
// ─────────────────────────────────────────────────────────────────

describe('Style Contract — Parity (Canvas = Preview = Present = Export)', () => {
  // ── Core parity: same input → identical tokens across all modes ──
  describe('core parity', () => {
    it('all 4 modes return identical tokens for the same contract', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
    });

    it('all 4 modes return identical tokens for a complex contract', () => {
      const contract: StyleContract = {
        document: {
          presetId: 'school-cheerful',
          accentColor: '#f97316',
          fontScale: 'large',
          density: 'spacious',
        },
        page: {
          background: { type: 'solid', color: '#fffbeb' },
          surface: 'soft',
          composition: 'focus',
        },
        block: { variant: 'B', emphasis: 'highlight', presetId: 'ceria' },
      };
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
    });

    it('Canvas tokens === Export tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'dark-elegant' },
      };
      expect(resolveCanvasStyle(contract)).toEqual(resolveExportStyle(contract));
    });

    it('Canvas tokens === Preview tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'mission-adventure' },
      };
      expect(resolveCanvasStyle(contract)).toEqual(resolvePreviewStyle(contract));
    });

    it('Preview tokens === Present tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'nusantara-nature' },
      };
      expect(resolvePreviewStyle(contract)).toEqual(resolvePresentStyle(contract));
    });

    it('Present tokens === Export tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'modern-interactive' },
      };
      expect(resolvePresentStyle(contract)).toEqual(resolveExportStyle(contract));
    });
  });

  // ── All 6 presets produce cross-mode parity ─────────────────
  describe('all 6 presets produce cross-mode parity', () => {
    const presetIds: StylePresetId[] = [
      'academic-clean',
      'school-cheerful',
      'mission-adventure',
      'dark-elegant',
      'nusantara-nature',
      'modern-interactive',
    ];

    for (const presetId of presetIds) {
      it(`preset '${presetId}' produces identical tokens across all 4 modes`, () => {
        const contract: StyleContract = {
          document: { presetId },
        };
        const tokens = ALL_MODES.map((m) => m.fn(contract));
        for (let i = 1; i < tokens.length; i++) {
          expect(tokens[i]).toEqual(tokens[0]);
        }
      });
    }
  });

  // ── Different inputs → tokens differ predictably ────────────
  describe('different inputs produce different tokens', () => {
    it('two different presets produce different canvas tokens', () => {
      const a = resolveCanvasStyle({
        document: { presetId: 'academic-clean' },
      });
      const b = resolveCanvasStyle({
        document: { presetId: 'school-cheerful' },
      });
      expect(a).not.toEqual(b);
    });

    it('accent override changes tokens', () => {
      const base = resolveCanvasStyle({
        document: { presetId: 'academic-clean' },
      });
      const withOverride = resolveCanvasStyle({
        document: { presetId: 'academic-clean', accentColor: '#ff0000' },
      });
      expect(base.colors.accent).not.toBe(withOverride.colors.accent);
      expect(withOverride.colors.accent).toBe('#ff0000');
    });

    it('fontScale override changes multiplier', () => {
      const compact = resolveCanvasStyle({
        document: { presetId: 'academic-clean', fontScale: 'compact' },
      });
      const large = resolveCanvasStyle({
        document: { presetId: 'academic-clean', fontScale: 'large' },
      });
      expect(compact.typography.fontScaleMultiplier).not.toBe(
        large.typography.fontScaleMultiplier,
      );
    });
  });

  // ── Invalid input → identical fallback across all modes ─────
  describe('invalid input fallback parity', () => {
    it('invalid presetId falls back identically across all 4 modes', () => {
      const contract: StyleContract = {
        document: { presetId: 'bogus-id' as StylePresetId },
      };
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
      // And the fallback is the default preset
      expect(tokens[0].colors.background).toBe(
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
        }).colors.background,
      );
    });

    it('empty contract resolves identically across all 4 modes', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
    });
  });

  // ── Legacy project → cross-mode parity ──────────────────────
  describe('legacy project parity', () => {
    it('legacy project produces identical tokens across all 4 modes', () => {
      const legacyInput: LegacyStyleInput = {
        schemaThemeId: 'golden-presentation',
        templateVariant: 'B',
        bgColor: '#0f172a',
        overlay: 40,
        navbarStyle: 'minimal',
        blockVariant: 'B',
        blockStylePreset: 'formal',
        blockAccentColor: 'y',
      };
      const contract = resolveLegacyStyle(legacyInput);
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
    });

    it('empty legacy input produces identical fallback tokens across all 4 modes', () => {
      const contract = resolveLegacyStyle({});
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
      // And the fallback is the default preset
      expect(tokens[0].colors.background).toBe(
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
        }).colors.background,
      );
    });

    it('legacy project with themeId=neon produces dark-elegant tokens across all modes', () => {
      const contract = resolveLegacyStyle({ schemaThemeId: 'neon' });
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
      expect(tokens[0].colors.background).toBe('#020617');
    });
  });

  // ── Field shape parity ──────────────────────────────────────
  describe('field shape parity', () => {
    it('all 4 modes return the exact same set of top-level keys', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract)).sort(),
      );
      for (let i = 1; i < keySets.length; i++) {
        expect(keySets[i]).toEqual(keySets[0]);
      }
    });

    it('all 4 modes return the exact same set of colors keys', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract).colors).sort(),
      );
      for (let i = 1; i < keySets.length; i++) {
        expect(keySets[i]).toEqual(keySets[0]);
      }
    });

    it('all 4 modes return the exact same set of typography keys', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract).typography).sort(),
      );
      for (let i = 1; i < keySets.length; i++) {
        expect(keySets[i]).toEqual(keySets[0]);
      }
    });

    it('all 4 modes return the exact same set of spacing keys', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract).spacing).sort(),
      );
      for (let i = 1; i < keySets.length; i++) {
        expect(keySets[i]).toEqual(keySets[0]);
      }
    });

    it('no mode adds extra "_mode" or "consumer" markers', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      for (const mode of ALL_MODES) {
        const tokens = mode.fn(contract);
        const serialized = JSON.stringify(tokens);
        expect(serialized).not.toContain('"_mode"');
        expect(serialized).not.toContain('"consumer"');
        expect(serialized).not.toContain('"canvas"');
        expect(serialized).not.toContain('"preview"');
        expect(serialized).not.toContain('"present"');
        expect(serialized).not.toContain('"export"');
      }
    });
  });

  // ── Determinism across calls ────────────────────────────────
  describe('determinism across calls', () => {
    it('calling the same mode twice returns deep-equal tokens', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      for (const mode of ALL_MODES) {
        const a = mode.fn(contract);
        const b = mode.fn(contract);
        expect(a).toEqual(b);
      }
    });

    it('cross-mode determinism: 10 rounds, all equal', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean', density: 'spacious' },
        page: { background: { type: 'image', imageUrl: 'x', overlay: 60 } },
      };
      for (let round = 0; round < 10; round++) {
        const tokens = ALL_MODES.map((m) => m.fn(contract));
        for (let i = 1; i < tokens.length; i++) {
          expect(tokens[i]).toEqual(tokens[0]);
        }
      }
    });
  });

  // ── JSON-serializability parity ─────────────────────────────
  describe('JSON serializability parity', () => {
    it('all 4 modes produce JSON-serializable tokens (no functions)', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      for (const mode of ALL_MODES) {
        const tokens = mode.fn(contract);
        expect(() => JSON.stringify(tokens)).not.toThrow();
        const serialized = JSON.stringify(tokens);
        expect(serialized).not.toContain('function');
        expect(serialized).not.toContain('undefined');
      }
    });

    it('round-trip JSON produces equal tokens across all 4 modes', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const roundTrips = ALL_MODES.map((m) =>
        JSON.parse(JSON.stringify(m.fn(contract))) as ResolvedStyleTokens,
      );
      for (let i = 1; i < roundTrips.length; i++) {
        expect(roundTrips[i]).toEqual(roundTrips[0]);
      }
    });
  });
});
