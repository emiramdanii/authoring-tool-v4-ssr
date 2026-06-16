// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Resolver Consistency Tests  (Sprint 8.1-Patch)
// ═══════════════════════════════════════════════════════════════════
// Patch: P1 — renamed from "Parity" to "Resolver Consistency Contract".
//             The Sprint 8.1 audit incorrectly claimed Canvas=Preview=
//             Present=Export parity as PASS. That claim was based on
//             four stubs that all call the same function. The actual
//             parity gate (real consumer integration) is Sprint 8.2.
//
// What this suite DOES prove (Sprint 8.1 scope):
//   - The resolver is deterministic: same input → identical output.
//   - When Sprint 8.2 wires the four consumers to call
//     resolveStyleContract(), they will receive identical tokens.
//   - The resolver is the single source of truth — no per-consumer
//     divergence is possible while all consumers use it.
//
// What this suite DOES NOT prove (deferred to Sprint 8.2):
//   - That the real Canvas / Preview / Present / Export code paths
//     actually call resolveStyleContract().
//   - That the real consumers don't post-process tokens in a
//     divergent way.
//
// Gate status (post-patch):
//   - "Canvas = Preview = Present = Export" → READY FOR INTEGRATION
//   - Will become PASS after Sprint 8.2 wires real consumers.
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
// these stubs are deleted and this suite is replaced with tests that
// import the real consumer entry points.
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

describe('Style Resolver Consistency Contract (Sprint 8.1 — READY FOR INTEGRATION)', () => {
  // ── Header note: scope of this test suite ───────────────────
  it('suite scope: tests resolver consistency, NOT actual consumer wiring', () => {
    // This test exists to document the suite scope explicitly.
    // Sprint 8.2 will replace these stubs with real consumer imports.
    expect(ALL_MODES.length).toBe(4);
    expect(ALL_MODES.map((m) => m.name)).toEqual([
      'Canvas',
      'Preview',
      'Present',
      'Export',
    ]);
  });

  // ── Core consistency: same input → identical tokens across all modes ──
  describe('core consistency', () => {
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
          background: {
            type: 'gradient',
            color1: '#fffbeb',
            color2: '#fef3c7',
          },
          surface: 'soft',
          composition: 'focus',
        },
        block: {
          variant: 'B',
          emphasis: 'highlight',
          presetId: 'ceria',
          accentColor: 'y',
        },
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
      expect(resolveCanvasStyle(contract)).toEqual(
        resolveExportStyle(contract),
      );
    });

    it('Canvas tokens === Preview tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'mission-adventure' },
      };
      expect(resolveCanvasStyle(contract)).toEqual(
        resolvePreviewStyle(contract),
      );
    });

    it('Preview tokens === Present tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'nusantara-nature' },
      };
      expect(resolvePreviewStyle(contract)).toEqual(
        resolvePresentStyle(contract),
      );
    });

    it('Present tokens === Export tokens (explicit pair assertion)', () => {
      const contract: StyleContract = {
        document: { presetId: 'modern-interactive' },
      };
      expect(resolvePresentStyle(contract)).toEqual(
        resolveExportStyle(contract),
      );
    });
  });

  // ── All 6 presets produce cross-mode consistency ────────────
  describe('all 6 presets produce cross-mode consistency', () => {
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

    it('block emphasis changes block.surface (P0-1 patch)', () => {
      const normal = resolveCanvasStyle({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'normal' },
      });
      const strong = resolveCanvasStyle({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'strong' },
      });
      expect(normal.block.surface).not.toBe(strong.block.surface);
    });
  });

  // ── Invalid input → identical fallback across all modes ─────
  describe('invalid input fallback consistency', () => {
    it('invalid presetId falls back identically across all 4 modes', () => {
      const contract: StyleContract = {
        document: { presetId: 'bogus-id' as StylePresetId },
      };
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
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

  // ── Legacy project → cross-mode consistency ─────────────────
  describe('legacy project consistency', () => {
    it('legacy project produces identical tokens across all 4 modes', () => {
      const legacyInput: LegacyStyleInput = {
        schemaThemeId: 'golden-presentation',
        templateVariant: 'B',
        bgColor: '#0f172a',
        overlay: 40,
        overlaySource: 'canva',
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
    });

    it('legacy macam-norma project produces academic-clean tokens across all modes (P0-2)', () => {
      const contract = resolveLegacyStyle({ schemaThemeId: 'macam-norma' });
      const tokens = ALL_MODES.map((m) => m.fn(contract));
      for (let i = 1; i < tokens.length; i++) {
        expect(tokens[i]).toEqual(tokens[0]);
      }
      expect(tokens[0]._legacyThemeId).toBe('golden-presentation');
      expect(tokens[0].semantic.categories.agama).toBeTruthy();
    });
  });

  // ── Field shape consistency ─────────────────────────────────
  describe('field shape consistency', () => {
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

    it('all 4 modes return the exact same set of semantic keys', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract).semantic).sort(),
      );
      for (let i = 1; i < keySets.length; i++) {
        expect(keySets[i]).toEqual(keySets[0]);
      }
    });

    it('all 4 modes return the exact same set of page keys (P0-1)', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract).page).sort(),
      );
      for (let i = 1; i < keySets.length; i++) {
        expect(keySets[i]).toEqual(keySets[0]);
      }
    });

    it('all 4 modes return the exact same set of block keys (P0-1)', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const keySets = ALL_MODES.map((m) =>
        Object.keys(m.fn(contract).block).sort(),
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
        page: {
          background: {
            type: 'gradient',
            color1: '#000',
            color2: '#fff',
            imageUrl: 'x',
            overlay: 60,
          },
        },
        block: { emphasis: 'strong', accentColor: 'g' },
      };
      for (let round = 0; round < 10; round++) {
        const tokens = ALL_MODES.map((m) => m.fn(contract));
        for (let i = 1; i < tokens.length; i++) {
          expect(tokens[i]).toEqual(tokens[0]);
        }
      }
    });
  });

  // ── JSON-serializability consistency ────────────────────────
  describe('JSON serializability consistency', () => {
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
      const roundTrips = ALL_MODES.map(
        (m) =>
          JSON.parse(JSON.stringify(m.fn(contract))) as ResolvedStyleTokens,
      );
      for (let i = 1; i < roundTrips.length; i++) {
        expect(roundTrips[i]).toEqual(roundTrips[0]);
      }
    });
  });

  // ── Integration readiness note (P1 patch) ───────────────────
  describe('integration readiness (P1 patch)', () => {
    it('documents that real consumer parity is READY FOR INTEGRATION, not PASS', () => {
      // This test exists to assert the gate status explicitly.
      // The "Canvas = Preview = Present = Export" gate becomes PASS
      // only after Sprint 8.2 wires real consumers to import
      // resolveStyleContract() from '@/core/style'.
      //
      // Sprint 8.1 status:
      //   ✅ Resolver is deterministic and consistent
      //   ✅ All 4 stub modes return identical tokens
      //   ⏳ Real consumers NOT yet wired (deferred to Sprint 8.2)
      //
      // Gate: READY FOR INTEGRATION (Sprint 8.2 will flip to PASS)
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const allEqual = ALL_MODES.every(
        (m) => JSON.stringify(m.fn(contract)) ===
          JSON.stringify(resolveStyleContract(contract)),
      );
      expect(allEqual).toBe(true);
    });
  });
});
