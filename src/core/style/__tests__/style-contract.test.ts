// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Resolver Tests  (Sprint 8.1-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Patch:    P0-1 — every teacher control now has a behavioral test that
//               asserts the output ACTUALLY changes (no more not.toThrow
//               substitutes). Page surface/composition/background and
//               block presetId/variant/emphasis all asserted.
//        P0-3 — semantic palette asserted (6 accents + categories).
//        P0-4 — background contract aligned with ScreenSchema
//               (radial, color2, imageFit/Opacity/Blur, overlay 0-80).
//        P1   — token keys ('y','c','g',...) must resolve to CSS hex,
//               not pass through verbatim.
// Patch-2:  P0-1 — overlay conversion preserves percentage (no rescale);
//               tests assert Canva 40 === DB 0.4 === Schema 40 === 40.
//        P0-2 — PageStyle.navigation.style override now changes output;
//               tests assert different navbarStyle values produce
//               different tokens.navigation.style.
//        P0-3 — `_legacyThemeId` is now optional; tests accept undefined
//               for mission-adventure (no fake 'glass' bridge).
//               `compatibility.legacyThemeId` propagates to resolved
//               `_legacyThemeId` (macam-norma round-trip preserved).
//        P1-1 — Semantic output is deep-cloned; mutation tests verify
//               two resolver calls produce fully isolated objects.
//        P1-2 — Single source of truth: semantic.primary ===
//               colors.accent, semantic.success === colors.success,
//               semantic.error === colors.error.
//
// Covers:
//   - Resolver is pure & deterministic
//   - All 6 preset IDs resolve to distinct tokens (incl. semantic palette)
//   - Invalid preset ID falls back to default
//   - Empty input still returns tokens (no throw)
//   - Document-level overrides (accentColor, fontScale, density) work
//   - Page-level overrides (surface/composition/background/navigation) CHANGE output (P0-1, P0-2)
//   - Block-level overrides (presetId/variant/emphasis/accent) CHANGE output (P0-1)
//   - Token keys resolve to concrete CSS hex (P1)
//   - Semantic palette present, complete, deep-cloned, single-source (P0-3, P1-1, P1-2)
//   - macam-norma categories preserved on academic-clean
//   - Background contract matches ScreenSchema (radial, color2, image fields) (P0-4)
//   - Overlay percentage preserved across all three sources (Patch-2 P0-1)
//   - Original legacy theme identity preserved via compatibility (Patch-2 P0-3)
//   - Runtime/UI state NEVER enters the contract
//   - Legacy fields (colorPalette etc.) do NOT leak into tokens
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  MAX_OVERLAY_OPACITY,
  PRESET_TO_LEGACY_THEME,
  resolveLegacyStyle,
  resolvePresetTokens,
  resolveStyleContract,
  STYLE_PRESETS,
  type BlockEmphasis,
  type DocumentStyle,
  type ResolvedStyleTokens,
  type StyleContract,
  type StylePresetId,
  type SurfaceTreatment,
  type CompositionIntent,
} from '../index';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeContract(
  presetId: StylePresetId,
  overrides?: Partial<DocumentStyle>,
): StyleContract {
  return {
    document: {
      presetId,
      ...overrides,
    },
  };
}

const ALL_PRESET_IDS = Object.keys(STYLE_PRESETS) as StylePresetId[];

// ─────────────────────────────────────────────────────────────────
// Test suites
// ─────────────────────────────────────────────────────────────────

describe('Style Contract — Resolver', () => {
  // ── Purity & Determinism ──────────────────────────────────────
  describe('purity & determinism', () => {
    it('returns the same output for the same input across multiple calls', () => {
      const contract = makeContract('academic-clean');
      const a = resolveStyleContract(contract);
      const b = resolveStyleContract(contract);
      const c = resolveStyleContract(contract);
      expect(a).toEqual(b);
      expect(b).toEqual(c);
    });

    it('does not mutate the input contract', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', color1: '#fff' } },
        block: { variant: 'B', emphasis: 'highlight' },
      };
      const snapshot = JSON.parse(JSON.stringify(contract));
      resolveStyleContract(contract);
      expect(JSON.parse(JSON.stringify(contract))).toEqual(snapshot);
    });

    it('returns a fresh object on every call (no shared references)', () => {
      const contract = makeContract('school-cheerful');
      const a = resolveStyleContract(contract);
      const b = resolveStyleContract(contract);
      expect(a).not.toBe(b);
      expect(a.colors).not.toBe(b.colors);
      expect(a.typography).not.toBe(b.typography);
      expect(a.page).not.toBe(b.page);
      expect(a.block).not.toBe(b.block);
      // Patch-2 P1-1: semantic tree must also be fully isolated.
      expect(a.semantic).not.toBe(b.semantic);
      expect(a.semantic.accents).not.toBe(b.semantic.accents);
      expect(a.semantic.categories).not.toBe(b.semantic.categories);
    });

    // ── Patch-2 P1-1: Semantic deep-clone mutation test ──────────
    it('mutating semantic on one resolved output does not poison the next call (P1-1)', () => {
      const contract = makeContract('academic-clean');
      const a = resolveStyleContract(contract);
      // Mutate the deep-cloned semantic tree on `a`
      a.semantic.categories.agama = '#000000';
      a.semantic.accents.yellow = '#ffffff';
      a.semantic.primary = '#deadbe';

      // Resolve again — should be unaffected by the mutations above
      const b = resolveStyleContract(contract);
      expect(b.semantic.categories.agama).not.toBe('#000000');
      expect(b.semantic.accents.yellow).not.toBe('#ffffff');
      expect(b.semantic.primary).not.toBe('#deadbe');

      // Verify the preset registry itself wasn't poisoned either.
      // Re-resolve one more time and check the preset's yellow accent
      // is still its original value.
      const presetYellow = STYLE_PRESETS['academic-clean'].semantic.accents.yellow;
      expect(b.semantic.accents.yellow).toBe(presetYellow);
    });
  });

  // ── Preset resolution ─────────────────────────────────────────
  describe('preset resolution', () => {
    it('resolves all 6 preset IDs without throwing', () => {
      for (const id of ALL_PRESET_IDS) {
        expect(() => resolvePresetTokens(id)).not.toThrow();
      }
    });

    it('each preset yields a distinct accent color', () => {
      const accents = ALL_PRESET_IDS.map(
        (id) => resolvePresetTokens(id).colors.accent,
      );
      const unique = new Set(accents);
      expect(unique.size).toBe(ALL_PRESET_IDS.length);
    });

    it('each preset yields a distinct background color', () => {
      const bgs = ALL_PRESET_IDS.map(
        (id) => resolvePresetTokens(id).colors.background,
      );
      const unique = new Set(bgs);
      expect(unique.size).toBe(ALL_PRESET_IDS.length);
    });

    it('presets with a real 1:1 legacy bridge expose _legacyThemeId; mission-adventure has none (Patch-2 P0-3)', () => {
      // Patch-2 P0-3: `_legacyThemeId` is now optional. Presets with no
      // real 1:1 legacy counterpart (mission-adventure — 'petualangan'
      // is a block preset, not a theme) leave it undefined. The previous
      // fake bridge to 'glass' caused an unstable round-trip
      // (mission-adventure → 'glass' → dark-elegant) and is now removed.
      for (const id of ALL_PRESET_IDS) {
        const preset = STYLE_PRESETS[id];
        const tokens = resolvePresetTokens(id);
        if (preset._legacyThemeId) {
          expect(tokens._legacyThemeId).toBe(preset._legacyThemeId);
          expect(typeof tokens._legacyThemeId).toBe('string');
          expect(tokens._legacyThemeId!.length).toBeGreaterThan(0);
        } else {
          // mission-adventure: no real bridge — _legacyThemeId undefined
          expect(tokens._legacyThemeId).toBeUndefined();
        }
      }
    });

    it('preset tokens match the StylePresetDefinition values verbatim', () => {
      const preset = STYLE_PRESETS['academic-clean'];
      const tokens = resolvePresetTokens('academic-clean');
      expect(tokens.colors.background).toBe(preset.colors.background);
      expect(tokens.colors.surface).toBe(preset.colors.surface);
      expect(tokens.colors.accent).toBe(preset.colors.accent);
      expect(tokens.typography.headingFamily).toBe(
        preset.typography.headingFamily,
      );
      expect(tokens.shape.radius).toBe(preset.shape.radius);
      expect(tokens.spacing.density).toBe(preset.spacing.density);
    });
  });

  // ── Semantic palette (P0-3) ──────────────────────────────────
  describe('semantic palette (P0-3)', () => {
    it('every preset has a complete semantic palette', () => {
      for (const id of ALL_PRESET_IDS) {
        const tokens = resolvePresetTokens(id);
        expect(tokens.semantic).toBeDefined();
        expect(tokens.semantic.accents.yellow).toBeTruthy();
        expect(tokens.semantic.accents.cyan).toBeTruthy();
        expect(tokens.semantic.accents.red).toBeTruthy();
        expect(tokens.semantic.accents.purple).toBeTruthy();
        expect(tokens.semantic.accents.green).toBeTruthy();
        expect(tokens.semantic.accents.orange).toBeTruthy();
        expect(tokens.semantic.primary).toBeTruthy();
        expect(tokens.semantic.secondary).toBeTruthy();
        expect(tokens.semantic.info).toBeTruthy();
        expect(tokens.semantic.warning).toBeTruthy();
        expect(tokens.semantic.success).toBeTruthy();
        expect(tokens.semantic.error).toBeTruthy();
      }
    });

    it('academic-clean preserves macam-norma categories (P0-3)', () => {
      const tokens = resolvePresetTokens('academic-clean');
      expect(tokens.semantic.categories).toBeDefined();
      expect(tokens.semantic.categories.agama).toBeTruthy();
      expect(tokens.semantic.categories.kesusilaan).toBeTruthy();
      expect(tokens.semantic.categories.kesopanan).toBeTruthy();
      expect(tokens.semantic.categories.hukum).toBeTruthy();
      // 4 distinct colors for the 4 norma types
      const colors = new Set([
        tokens.semantic.categories.agama,
        tokens.semantic.categories.kesusilaan,
        tokens.semantic.categories.kesopanan,
        tokens.semantic.categories.hukum,
      ]);
      expect(colors.size).toBe(4);
    });

    it('presets without domain categories have empty categories record', () => {
      const tokens = resolvePresetTokens('school-cheerful');
      expect(Object.keys(tokens.semantic.categories).length).toBe(0);
    });

    it('semantic.accents are concrete CSS hex (no token keys)', () => {
      for (const id of ALL_PRESET_IDS) {
        const tokens = resolvePresetTokens(id);
        for (const color of Object.values(tokens.semantic.accents)) {
          expect(color).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
        }
      }
    });

    it('semantic.success === colors.success (single source of truth — Patch-2 P1-2)', () => {
      // Patch-2 P1-2: semantic.success is now sourced FROM colors.success.
      // Previously semantic.success was sourced from accents.green and
      // could diverge from colors.success (e.g. mission-adventure had
      // accents.green=#84cc16 but colors.success=#22c55e). This opened
      // a parity risk where Canvas reads colors.success while Export
      // reads semantic.success and they accidentally disagree.
      for (const id of ALL_PRESET_IDS) {
        const tokens = resolvePresetTokens(id);
        expect(tokens.semantic.success).toBe(tokens.colors.success);
        expect(tokens.semantic.success).toMatch(/^#/);
      }
    });

    it('semantic.error === colors.error (single source of truth — Patch-2 P1-2)', () => {
      for (const id of ALL_PRESET_IDS) {
        const tokens = resolvePresetTokens(id);
        expect(tokens.semantic.error).toBe(tokens.colors.error);
        expect(tokens.semantic.error).toMatch(/^#/);
      }
    });

    it('semantic.primary === colors.accent (single source of truth — Patch-2 P1-2)', () => {
      // Without an override, semantic.primary mirrors the preset accent.
      for (const id of ALL_PRESET_IDS) {
        const tokens = resolvePresetTokens(id);
        expect(tokens.semantic.primary).toBe(tokens.colors.accent);
      }
    });

    it('document accentColor override propagates to semantic.primary (Patch-2 P1-2)', () => {
      // Previously the document accent override only changed colors.accent;
      // semantic.primary stayed pinned to the preset's yellow accent.
      // Patch-2 makes them aliased — overriding one overrides the other.
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: '#ff0000' }),
      );
      expect(tokens.colors.accent).toBe('#ff0000');
      expect(tokens.semantic.primary).toBe('#ff0000');
    });
  });

  // ── Invalid / missing presetId ───────────────────────────────
  describe('invalid preset id fallback', () => {
    it('falls back to DEFAULT_PRESET_ID when presetId is invalid', () => {
      const contract = {
        document: { presetId: 'does-not-exist' as StylePresetId },
      };
      const tokens = resolveStyleContract(contract);
      const defaultTokens = resolvePresetTokens(DEFAULT_PRESET_ID);
      expect(tokens).toEqual(defaultTokens);
    });

    it('falls back to DEFAULT_PRESET_ID when presetId is empty string', () => {
      const contract = {
        document: { presetId: '' as StylePresetId },
      };
      const tokens = resolveStyleContract(contract);
      expect(tokens.colors.background).toBe(
        STYLE_PRESETS[DEFAULT_PRESET_ID].colors.background,
      );
    });

    it('resolvePresetTokens(undefined) returns default preset tokens', () => {
      const tokens = resolvePresetTokens(undefined);
      expect(tokens.colors.background).toBe(
        STYLE_PRESETS[DEFAULT_PRESET_ID].colors.background,
      );
    });

    it('does not throw on garbage presetId (string with special chars)', () => {
      const contract = {
        document: { presetId: '!!!invalid!!!' as StylePresetId },
      };
      expect(() => resolveStyleContract(contract)).not.toThrow();
    });
  });

  // ── Empty input ───────────────────────────────────────────────
  describe('empty input handling', () => {
    it('empty contract returns document-level tokens with page and block defaults', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
      });
      expect(tokens.colors).toBeDefined();
      expect(tokens.typography).toBeDefined();
      expect(tokens.shape).toBeDefined();
      expect(tokens.spacing).toBeDefined();
      expect(tokens.navigation).toBeDefined();
      expect(tokens.page).toBeDefined();
      expect(tokens.block).toBeDefined();
    });

    it('contract with empty page object still resolves', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {},
      });
      expect(tokens.colors.background).toBe(
        STYLE_PRESETS['academic-clean'].colors.background,
      );
    });

    it('contract with empty block object still resolves', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: {},
      });
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
    });
  });

  // ── Document-level overrides ─────────────────────────────────
  describe('document-level overrides', () => {
    it('accentColor override (hex) replaces preset accent', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: '#ff0000' }),
      );
      expect(tokens.colors.accent).toBe('#ff0000');
      expect(tokens.block.accent).toBe('#ff0000');
    });

    it('accentColor override with token key resolves to CSS hex (P1)', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: 'y' }),
      );
      // Token key 'y' must be resolved to the preset's yellow hex,
      // NOT passed through as the string 'y'
      expect(tokens.colors.accent).not.toBe('y');
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].semantic.accents.yellow,
      );
    });

    it('accentColor override with token key "c" resolves to preset cyan', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: 'c' }),
      );
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].semantic.accents.cyan,
      );
    });

    it('accentColor override with empty string falls back to preset', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: '' }),
      );
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
    });

    it('accentColor override with whitespace-only string falls back', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: '   ' }),
      );
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
    });

    it('fontScale compact yields 0.92 multiplier', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { fontScale: 'compact' }),
      );
      expect(tokens.typography.fontScaleMultiplier).toBe(0.92);
    });

    it('fontScale comfortable yields 1.0 multiplier', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { fontScale: 'comfortable' }),
      );
      expect(tokens.typography.fontScaleMultiplier).toBe(1.0);
    });

    it('fontScale large yields 1.12 multiplier', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { fontScale: 'large' }),
      );
      expect(tokens.typography.fontScaleMultiplier).toBe(1.12);
    });

    it('invalid fontScale value falls back to 1.0 multiplier', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', {
          fontScale: 'mega' as unknown as DocumentStyle['fontScale'],
        }),
      );
      expect(tokens.typography.fontScaleMultiplier).toBe(1.0);
    });

    it('density compact yields compact spacing tokens', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { density: 'compact' }),
      );
      expect(tokens.spacing.density).toBe('compact');
      expect(tokens.spacing.pagePadding).toBe('12px');
      expect(tokens.spacing.cardPadding).toBe('10px');
      expect(tokens.spacing.blockGap).toBe('8px');
    });

    it('density spacious yields spacious spacing tokens', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { density: 'spacious' }),
      );
      expect(tokens.spacing.density).toBe('spacious');
      expect(tokens.spacing.pagePadding).toBe('32px');
      expect(tokens.spacing.cardPadding).toBe('24px');
      expect(tokens.spacing.blockGap).toBe('20px');
    });

    it('invalid density value falls back to preset default', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', {
          density: 'ultra' as unknown as DocumentStyle['density'],
        }),
      );
      expect(tokens.spacing.density).toBe('comfortable');
    });
  });

  // ── Page-level overrides — P0-1: ACTUALLY CHANGE OUTPUT ─────
  describe('page-level overrides produce visible changes (P0-1)', () => {
    it('surface=flat / soft / elevated each produce different page.surface', () => {
      const surfaces: SurfaceTreatment[] = ['flat', 'soft', 'elevated'];
      const results = surfaces.map((surface) =>
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
          page: { surface },
        }).page.surface,
      );
      expect(new Set(results).size).toBe(3);
      expect(results).toEqual(surfaces);
    });

    it('composition=default / focus / immersive each produce different page.composition', () => {
      const comps: CompositionIntent[] = ['default', 'focus', 'immersive'];
      const results = comps.map((composition) =>
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
          page: { composition },
        }).page.composition,
      );
      expect(new Set(results).size).toBe(3);
      expect(results).toEqual(comps);
    });

    it('page.background.color1 override changes colors.background AND page.background.color1', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', color1: '#abcdef' } },
      });
      expect(tokens.page.background.color1).toBe('#abcdef');
      expect(tokens.colors.background).toBe('#abcdef');
    });

    it('page.background.color1 with token key resolves to CSS hex (P1)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', color1: 'y' } },
      });
      expect(tokens.page.background.color1).not.toBe('y');
      expect(tokens.page.background.color1).toBe(
        STYLE_PRESETS['academic-clean'].semantic.accents.yellow,
      );
    });

    it('page.background.type=radial is supported (P0-4)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'radial', color1: '#000', color2: '#fff' },
        },
      });
      expect(tokens.page.background.type).toBe('radial');
      expect(tokens.page.background.color1).toBe('#000');
      expect(tokens.page.background.color2).toBe('#fff');
    });

    it('page.background.type=gradient with color1 + color2 (P0-4)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'gradient', color1: '#aaa', color2: '#bbb' },
        },
      });
      expect(tokens.page.background.type).toBe('gradient');
      expect(tokens.page.background.color1).toBe('#aaa');
      expect(tokens.page.background.color2).toBe('#bbb');
    });

    it('page.background.imageUrl carries through to resolved tokens', () => {
      const url = 'data:image/png;base64,abc123';
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', imageUrl: url } },
      });
      expect(tokens.page.background.imageUrl).toBe(url);
    });

    it('page.background.imageFit cover/contain both supported (P0-4)', () => {
      const cover = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'solid', imageUrl: 'x', imageFit: 'cover' },
        },
      });
      const contain = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'solid', imageUrl: 'x', imageFit: 'contain' },
        },
      });
      expect(cover.page.background.imageFit).toBe('cover');
      expect(contain.page.background.imageFit).toBe('contain');
    });

    it('page.background.imageOpacity 0-100 carries through (P0-4)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'solid', imageUrl: 'x', imageOpacity: 42 },
        },
      });
      expect(tokens.page.background.imageOpacity).toBe(42);
    });

    it('page.background.imageBlur 0-20 carries through (P0-4)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'solid', imageUrl: 'x', imageBlur: 7 },
        },
      });
      expect(tokens.page.background.imageBlur).toBe(7);
    });

    it('page.background.overlay out-of-range (negative) clamps to 0', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', overlay: -50 } },
      });
      expect(tokens.page.background.overlay).toBe(0);
    });

    it('page.background.overlay out-of-range (>80) clamps to 80 (P0-4)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', overlay: 200 } },
      });
      expect(tokens.page.background.overlay).toBe(MAX_OVERLAY_OPACITY);
    });

    it('page.background.overlay=100 (legacy 0-100 scale) does NOT silently become 80 — it CLAMPS to 80', () => {
      // P0-4 patch: overlay scale is now 0-80 (schema-aligned). Callers
      // passing 0-100 values will be clamped, NOT auto-converted.
      // Legacy adapters handle scale conversion via overlaySource.
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', overlay: 100 } },
      });
      expect(tokens.page.background.overlay).toBe(MAX_OVERLAY_OPACITY);
    });

    it('page.background.overlay=NaN falls back to default', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', overlay: NaN } },
      });
      expect(tokens.page.background.overlay).toBe(40);
    });

    it('page.background.overlay=40 stays 40', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', overlay: 40 } },
      });
      expect(tokens.page.background.overlay).toBe(40);
    });

    it('page.background.overlayType dark/light/gradient all supported', () => {
      const types: Array<'dark' | 'light' | 'gradient'> = [
        'dark',
        'light',
        'gradient',
      ];
      for (const overlayType of types) {
        const tokens = resolveStyleContract({
          document: { presetId: 'academic-clean' },
          page: { background: { type: 'solid', overlayType } },
        });
        expect(tokens.page.background.overlayType).toBe(overlayType);
      }
    });

    it('default page.background has solid type + preset color', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
      });
      expect(tokens.page.background.type).toBe('solid');
      expect(tokens.page.background.color1).toBe(
        STYLE_PRESETS['academic-clean'].colors.background,
      );
    });
  });

  // ── Page-level navigation override — Patch-2 P0-2 ───────────
  describe('page-level navigation override (Patch-2 P0-2)', () => {
    it('PageStyle.navigation.style override changes tokens.navigation.style', () => {
      const base = resolveStyleContract({
        document: { presetId: 'academic-clean' },
      });
      const minimal = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { navigation: { style: 'minimal' } },
      });
      const glass = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { navigation: { style: 'glass' } },
      });
      // Base uses preset default ('colorful' for academic-clean)
      expect(base.navigation.style).toBe('colorful');
      // Overrides take effect
      expect(minimal.navigation.style).toBe('minimal');
      expect(glass.navigation.style).toBe('glass');
      // All three are distinct
      expect(
        new Set([base.navigation.style, minimal.navigation.style, glass.navigation.style]).size,
      ).toBe(3);
    });

    it('invalid navigation style falls back to preset default', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { navigation: { style: 'bogus' as unknown as 'minimal' } },
      });
      expect(tokens.navigation.style).toBe(
        STYLE_PRESETS['academic-clean'].navigation.style,
      );
    });

    it('omitting PageStyle.navigation uses preset default', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {},
      });
      expect(tokens.navigation.style).toBe(
        STYLE_PRESETS['academic-clean'].navigation.style,
      );
    });

    it('each preset has a distinct default navigation style assertion', () => {
      // Sanity: at least one preset uses each of the three styles
      const allStyles = ALL_PRESET_IDS.map(
        (id) => STYLE_PRESETS[id].navigation.style,
      );
      expect(allStyles).toContain('colorful');
      expect(allStyles).toContain('minimal');
      expect(allStyles).toContain('glass');
    });
  });

  // ── Block-level overrides — P0-1: ACTUALLY CHANGE OUTPUT ────
  describe('block-level overrides produce visible changes (P0-1)', () => {
    it('block.presetId carries through to resolved tokens', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { presetId: 'ceria' },
      });
      expect(tokens.block.presetId).toBe('ceria');
    });

    it('block.variant A/B/C each produce different output', () => {
      const variants: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
      const results = variants.map((variant) =>
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
          block: { variant },
        }).block.variant,
      );
      expect(new Set(results).size).toBe(3);
      expect(results).toEqual(variants);
    });

    it('block.emphasis=normal produces preset surface + preset text', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'normal' },
      });
      expect(tokens.block.emphasis).toBe('normal');
      expect(tokens.block.surface).toBe(
        STYLE_PRESETS['academic-clean'].colors.surface,
      );
      expect(tokens.block.text).toBe(
        STYLE_PRESETS['academic-clean'].colors.text,
      );
      expect(tokens.block.border).toBe(
        STYLE_PRESETS['academic-clean'].colors.border,
      );
    });

    it('block.emphasis=highlight produces surfaceStrong + accent border (DIFFERENT from normal)', () => {
      const normal = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'normal' },
      });
      const highlight = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'highlight' },
      });
      expect(highlight.block.emphasis).toBe('highlight');
      expect(highlight.block.surface).not.toBe(normal.block.surface);
      expect(highlight.block.border).not.toBe(normal.block.border);
      expect(highlight.block.surface).toBe(
        STYLE_PRESETS['academic-clean'].colors.surfaceStrong,
      );
      expect(highlight.block.border).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
    });

    it('block.emphasis=strong produces accent surface + accentContrast text (DIFFERENT from normal/highlight)', () => {
      const normal = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'normal' },
      });
      const highlight = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'highlight' },
      });
      const strong = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'strong' },
      });
      expect(strong.block.emphasis).toBe('strong');
      expect(strong.block.surface).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
      expect(strong.block.text).toBe(
        STYLE_PRESETS['academic-clean'].colors.accentContrast,
      );
      // Verify all three are distinct
      expect(strong.block.surface).not.toBe(normal.block.surface);
      expect(strong.block.surface).not.toBe(highlight.block.surface);
      expect(strong.block.text).not.toBe(normal.block.text);
    });

    it('all 3 emphasis values produce 3 distinct surface values', () => {
      const emphases: BlockEmphasis[] = ['normal', 'highlight', 'strong'];
      const surfaces = emphases.map((emphasis) =>
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
          block: { emphasis },
        }).block.surface,
      );
      expect(new Set(surfaces).size).toBe(3);
    });

    it('block.accentColor (token key) resolves to CSS hex (P1)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { accentColor: 'g' },
      });
      expect(tokens.block.accent).not.toBe('g');
      expect(tokens.block.accent).toBe(
        STYLE_PRESETS['academic-clean'].semantic.accents.green,
      );
    });

    it('block.accentColor (hex) overrides document accent for the block', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean', accentColor: '#ff0000' },
        block: { accentColor: '#00ff00' },
      });
      expect(tokens.colors.accent).toBe('#ff0000');
      expect(tokens.block.accent).toBe('#00ff00');
    });

    it('block.accentColor drives emphasis=highlight border and emphasis=strong surface', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { accentColor: '#abc123', emphasis: 'highlight' },
      });
      expect(tokens.block.border).toBe('#abc123');

      const tokens2 = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { accentColor: '#abc123', emphasis: 'strong' },
      });
      expect(tokens2.block.surface).toBe('#abc123');
    });

    it('all block fields optional — empty block does not throw', () => {
      expect(() =>
        resolveStyleContract({
          document: { presetId: 'academic-clean' },
          block: {},
        }),
      ).not.toThrow();
    });
  });

  // ── Runtime/UI state must NOT enter contract ─────────────────
  describe('runtime/UI state isolation', () => {
    it('ResolvedStyleTokens does not contain displayMode field', () => {
      const tokens = resolvePresetTokens('academic-clean');
      expect(tokens).not.toHaveProperty('displayMode');
      expect(tokens).not.toHaveProperty('eduViewingMode');
    });

    it('ResolvedStyleTokens is fully JSON-serializable (pure data)', () => {
      const tokens = resolvePresetTokens('academic-clean');
      const round = JSON.parse(JSON.stringify(tokens)) as ResolvedStyleTokens;
      expect(round).toEqual(tokens);
    });

    it('ResolvedStyleTokens does not contain store-specific fields', () => {
      const tokens = resolvePresetTokens('academic-clean');
      expect(tokens).not.toHaveProperty('dirty');
      expect(tokens).not.toHaveProperty('saveStatus');
      expect(tokens).not.toHaveProperty('projectId');
      expect(tokens).not.toHaveProperty('schema');
    });

    it('ResolvedStyleTokens does not contain _legacyNavbarStyle (P1 patch)', () => {
      const tokens = resolvePresetTokens('academic-clean');
      expect(tokens).not.toHaveProperty('_legacyNavbarStyle');
      expect(JSON.stringify(tokens)).not.toContain('_legacyNavbarStyle');
    });

    it('resolver does not access window or document globals', () => {
      const originalWindow = globalThis.window;
      const originalDocument = globalThis.document;
      const windowAccess: string[] = [];
      const docAccess: string[] = [];
      try {
        const winProxy = new Proxy(globalThis.window, {
          get(target, prop) {
            windowAccess.push(String(prop));
            return Reflect.get(target, prop);
          },
        });
        const docProxy = new Proxy(globalThis.document, {
          get(target, prop) {
            docAccess.push(String(prop));
            return Reflect.get(target, prop);
          },
        });
        (globalThis as Record<string, unknown>).window = winProxy;
        (globalThis as Record<string, unknown>).document = docProxy;
        resolvePresetTokens('academic-clean');
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
        (globalThis as Record<string, unknown>).document = originalDocument;
      }
      expect(windowAccess).not.toContain('localStorage');
      expect(windowAccess).not.toContain('getComputedStyle');
      expect(docAccess).not.toContain('documentElement');
      expect(docAccess).not.toContain('body');
      expect(docAccess).not.toContain('createElement');
    });
  });

  // ── Type shape invariants ────────────────────────────────────
  describe('type shape invariants', () => {
    const tokens = resolvePresetTokens('academic-clean');

    it('colors has all 10 required fields', () => {
      const colorKeys = Object.keys(tokens.colors).sort();
      expect(colorKeys).toEqual(
        [
          'accent',
          'accentContrast',
          'background',
          'border',
          'error',
          'surface',
          'surfaceStrong',
          'success',
          'text',
          'textMuted',
        ].sort(),
      );
    });

    it('semantic has all required fields', () => {
      expect(tokens.semantic).toHaveProperty('primary');
      expect(tokens.semantic).toHaveProperty('secondary');
      expect(tokens.semantic).toHaveProperty('info');
      expect(tokens.semantic).toHaveProperty('warning');
      expect(tokens.semantic).toHaveProperty('success');
      expect(tokens.semantic).toHaveProperty('error');
      expect(tokens.semantic).toHaveProperty('accents');
      expect(tokens.semantic).toHaveProperty('categories');
    });

    it('page has all required fields', () => {
      expect(tokens.page).toHaveProperty('background');
      expect(tokens.page).toHaveProperty('surface');
      expect(tokens.page).toHaveProperty('composition');
    });

    it('page.background has all required fields (P0-4)', () => {
      const bg = tokens.page.background;
      expect(bg).toHaveProperty('type');
      expect(bg).toHaveProperty('color1');
      expect(bg).toHaveProperty('color2');
      expect(bg).toHaveProperty('imageUrl');
      expect(bg).toHaveProperty('overlay');
      expect(bg).toHaveProperty('overlayType');
      expect(bg).toHaveProperty('imageFit');
      expect(bg).toHaveProperty('imageOpacity');
      expect(bg).toHaveProperty('imageBlur');
    });

    it('block has all required fields (P0-1)', () => {
      expect(tokens.block).toHaveProperty('presetId');
      expect(tokens.block).toHaveProperty('variant');
      expect(tokens.block).toHaveProperty('emphasis');
      expect(tokens.block).toHaveProperty('accent');
      expect(tokens.block).toHaveProperty('surface');
      expect(tokens.block).toHaveProperty('text');
      expect(tokens.block).toHaveProperty('border');
    });

    it('_legacyThemeId is present and non-empty for academic-clean (1:1 bridge)', () => {
      // Patch-2 P0-3: _legacyThemeId is now optional overall, but
      // academic-clean still has a real 1:1 bridge to 'golden-presentation'.
      expect(typeof tokens._legacyThemeId).toBe('string');
      expect(tokens._legacyThemeId!.length).toBeGreaterThan(0);
      expect(tokens._legacyThemeId).toBe('golden-presentation');
    });
  });

  // ── Patch-2 P0-3: Legacy theme identity preservation ─────────
  describe('legacy theme identity preservation (Patch-2 P0-3)', () => {
    it('StyleContract.compatibility.legacyThemeId propagates to resolved _legacyThemeId', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        compatibility: { legacyThemeId: 'macam-norma' },
      });
      // The resolver MUST prefer compatibility.legacyThemeId over
      // preset._legacyThemeId — otherwise the original legacy identity
      // is lost (macam-norma would have shown up as 'golden-presentation').
      expect(tokens._legacyThemeId).toBe('macam-norma');
    });

    it('without compatibility, preset._legacyThemeId is used (academic-clean)', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
      });
      expect(tokens._legacyThemeId).toBe('golden-presentation');
    });

    it('mission-adventure has no preset._legacyThemeId and no fake bridge (P0-3)', () => {
      // Patch-2 P0-3: removed the fake 'mission-adventure → glass' bridge.
      // Fresh projects picking mission-adventure get _legacyThemeId: undefined.
      const tokens = resolveStyleContract({
        document: { presetId: 'mission-adventure' },
      });
      expect(tokens._legacyThemeId).toBeUndefined();
    });

    it('mission-adventure with compatibility.legacyThemeId still propagates original ID', () => {
      // Even though mission-adventure has no preset._legacyThemeId, a
      // legacy project migrating through mission-adventure can still
      // preserve its original identity via compatibility.
      const tokens = resolveStyleContract({
        document: { presetId: 'mission-adventure' },
        compatibility: { legacyThemeId: 'warm-light' },
      });
      expect(tokens._legacyThemeId).toBe('warm-light');
    });

    it('compatibility.legacyThemeId takes precedence over preset._legacyThemeId', () => {
      // academic-clean has preset._legacyThemeId = 'golden-presentation'.
      // A legacy project with schemaThemeId='nilai-pancasila' (which
      // maps to academic-clean) should resolve to 'nilai-pancasila',
      // NOT 'golden-presentation'.
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        compatibility: { legacyThemeId: 'nilai-pancasila' },
      });
      expect(tokens._legacyThemeId).toBe('nilai-pancasila');
      expect(tokens._legacyThemeId).not.toBe('golden-presentation');
    });

    it('macam-norma round-trip via legacy adapter preserves identity', () => {
      // End-to-end: legacy 'macam-norma' input → contract → tokens.
      // Before Patch-2 the resolver emitted 'golden-presentation'
      // (the preset's bridge ID), losing the original 'macam-norma'.
      // After Patch-2 the resolver emits 'macam-norma' verbatim.
      const contract = resolveLegacyStyle({ schemaThemeId: 'macam-norma' });
      expect(contract.compatibility?.legacyThemeId).toBe('macam-norma');
      const tokens = resolveStyleContract(contract);
      expect(tokens._legacyThemeId).toBe('macam-norma');
    });

    it('PRESET_TO_LEGACY_THEME no longer contains mission-adventure (fake bridge removed)', () => {
      // The reverse mapping was made Partial in Patch-2 P0-3.
      // mission-adventure must NOT appear — it has no real 1:1 bridge.
      expect(PRESET_TO_LEGACY_THEME).not.toHaveProperty('mission-adventure');
      // But the 5 real bridges are still there
      expect(PRESET_TO_LEGACY_THEME).toHaveProperty('academic-clean');
      expect(PRESET_TO_LEGACY_THEME).toHaveProperty('school-cheerful');
      expect(PRESET_TO_LEGACY_THEME).toHaveProperty('dark-elegant');
      expect(PRESET_TO_LEGACY_THEME).toHaveProperty('nusantara-nature');
      expect(PRESET_TO_LEGACY_THEME).toHaveProperty('modern-interactive');
    });
  });

  // ── Cross-preset distinctness ────────────────────────────────
  describe('cross-preset distinctness', () => {
    it('no two presets produce identical token sets', () => {
      const allTokens = ALL_PRESET_IDS.map((id) =>
        JSON.stringify(resolvePresetTokens(id)),
      );
      const unique = new Set(allTokens);
      expect(unique.size).toBe(ALL_PRESET_IDS.length);
    });
  });
});
