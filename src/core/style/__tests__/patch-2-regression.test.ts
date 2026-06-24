// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Patch-2 Regression Tests  (Sprint 8.1-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Senior Review on commit e2178e4 returned verdict CHANGES REQUIRED
// with 3 P0 + 2 P1 issues. This file consolidates the 6 focused
// regression tests the reviewer explicitly asked for:
//
//   1. Patch-2 P0-1: Canva 40 === DB 0.4 === Schema 40 === 40
//      (overlay percentage preserved across all three sources)
//   2. Patch-2 P0-2: navbarStyle override actually changes
//      tokens.navigation.style (no more silent drop)
//   3. Patch-2 P0-3: macam-norma → resolved._legacyThemeId ===
//      'macam-norma' (original legacy identity preserved end-to-end)
//   4. Patch-2 P0-3: mission-adventure has NO fake 'glass' bridge
//      (no unstable round-trip mission-adventure → glass → dark-elegant)
//   5. Patch-2 P1-1: mutating semantic on one resolved output does
//      NOT poison the next call (deep-clone isolation)
//   6. Patch-2 P1-2: semantic.primary === colors.accent (single source
//      of truth — document accent override propagates)
//
// Each test is named with the issue it covers so the reviewer can map
// test → issue at a glance. All changes are confined to src/core/style/
// and its tests — no frozen boundary touched.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  PRESET_TO_LEGACY_THEME,
  STYLE_PRESETS,
  resolveCanvaOverlay,
  resolveDbOverlay,
  resolveLegacyStyle,
  resolvePresetTokens,
  resolveSchemaOverlay,
  resolveStyleContract,
  type StyleContract,
} from '../index';

describe('Patch-2 Senior Review Regression Tests (3 P0 + 2 P1)', () => {
  // ───────────────────────────────────────────────────────────────
  // P0-1 — Overlay conversion must preserve opacity percentage
  // ───────────────────────────────────────────────────────────────
  describe('P0-1: overlay percentage preserved across sources', () => {
    it('Canva 40 === DB 0.4 === Schema 40 === 40 (semantic equality)', () => {
      // Patch-1 had: Canva 40 → 32 (×0.8), DB 0.4 → 32 (×80), Schema 40 → 40.
      // This silently changed the visual meaning the teacher intended.
      // Patch-2 preserves percentage: all three resolve to 40.
      expect(resolveCanvaOverlay(40)).toBe(40);
      expect(resolveDbOverlay(0.4)).toBe(40);
      expect(resolveSchemaOverlay(40)).toBe(40);

      // Cross-source equality — the invariant the reviewer required.
      expect(resolveCanvaOverlay(40)).toBe(resolveDbOverlay(0.4));
      expect(resolveDbOverlay(0.4)).toBe(resolveSchemaOverlay(40));
    });

    it('Canva 100 === DB 1.0 === Schema 80 === 80 (max clamps consistently)', () => {
      // The MAX opacity, expressed in three different source scales,
      // must all clamp to the schema max of 80.
      expect(resolveCanvaOverlay(100)).toBe(80);
      expect(resolveDbOverlay(1.0)).toBe(80);
      expect(resolveSchemaOverlay(80)).toBe(80);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // P0-2 — navbarStyle must produce a resolved output change
  // ───────────────────────────────────────────────────────────────
  describe('P0-2: navbarStyle override produces output change', () => {
    it('different navbarStyle values produce different tokens.navigation.style', () => {
      // Patch-1 silently dropped navbarStyle via `void input.navbarStyle`.
      // Patch-2 carries it through via PageStyle.navigation.style.
      const a = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'minimal' }),
      );
      const b = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'glass' }),
      );
      const c = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'colorful' }),
      );

      expect(a.navigation.style).toBe('minimal');
      expect(b.navigation.style).toBe('glass');
      expect(c.navigation.style).toBe('colorful');

      // All three are distinct — the override actually takes effect.
      const distinct = new Set([
        a.navigation.style,
        b.navigation.style,
        c.navigation.style,
      ]);
      expect(distinct.size).toBe(3);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // P0-3 — Original legacy theme identity must be preserved
  // ───────────────────────────────────────────────────────────────
  describe('P0-3: original legacy theme identity preserved', () => {
    it('macam-norma → resolved._legacyThemeId === "macam-norma" (not "golden-presentation")', () => {
      // Patch-1 had: macam-norma → academic-clean → preset._legacyThemeId
      //              = 'golden-presentation'. Identity lost.
      // Patch-2: contract.compatibility.legacyThemeId preserves the
      //          ORIGINAL 'macam-norma' end-to-end.
      const contract = resolveLegacyStyle({ schemaThemeId: 'macam-norma' });
      expect(contract.compatibility?.legacyThemeId).toBe('macam-norma');

      const tokens = resolveStyleContract(contract);
      expect(tokens._legacyThemeId).toBe('macam-norma');
      expect(tokens._legacyThemeId).not.toBe('golden-presentation');
    });

    it('mission-adventure has NO fake bridge — no unstable round-trip', () => {
      // Patch-1 had: PRESET_TO_LEGACY_THEME['mission-adventure'] = 'glass'
      //              LEGACY_THEME_TO_PRESET['glass'] = 'dark-elegant'
      //              → unstable round-trip: mission-adventure → glass → dark-elegant
      // Patch-2: PRESET_TO_LEGACY_THEME is Partial; mission-adventure omitted.
      expect(PRESET_TO_LEGACY_THEME).not.toHaveProperty('mission-adventure');

      // Fresh project picking mission-adventure gets _legacyThemeId: undefined.
      const tokens = resolveStyleContract({
        document: { presetId: 'mission-adventure' },
      } as StyleContract);
      expect(tokens._legacyThemeId).toBeUndefined();

      // And the preset definition itself has no _legacyThemeId.
      expect(STYLE_PRESETS['mission-adventure']._legacyThemeId).toBeUndefined();

      // Verify the round-trip is now stable for every preset that DOES
      // have a bridge: preset → legacy → preset === identity.
      for (const [presetId, legacyId] of Object.entries(
        PRESET_TO_LEGACY_THEME,
      )) {
        const roundTrip = resolveLegacyStyle({
          schemaThemeId: legacyId,
        }).document.presetId;
        expect(roundTrip).toBe(presetId as never);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────
  // P1-1 — Semantic output must be deep-cloned (no shared references)
  // ───────────────────────────────────────────────────────────────
  describe('P1-1: semantic output deep-cloned (mutation isolation)', () => {
    it('mutating semantic on one resolved output does NOT poison the next call', () => {
      // Patch-1 returned `preset.semantic` directly — a consumer
      // mutating `tokens.semantic.categories.agama` would poison the
      // preset registry and all future resolver calls.
      // Patch-2 deep-clones accents + categories so the entire semantic
      // tree is consumer-owned.
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const originalAgama = STYLE_PRESETS['academic-clean'].semantic.categories.agama;
      const originalYellow = STYLE_PRESETS['academic-clean'].semantic.accents.yellow;

      // Resolve once and mutate the result aggressively.
      const a = resolveStyleContract(contract);
      a.semantic.categories.agama = '#000000';
      a.semantic.accents.yellow = '#ffffff';
      a.semantic.primary = '#deadbe';

      // Resolve again — must be unaffected.
      const b = resolveStyleContract(contract);
      expect(b.semantic.categories.agama).toBe(originalAgama);
      expect(b.semantic.accents.yellow).toBe(originalYellow);
      expect(b.semantic.primary).not.toBe('#deadbe');

      // The preset registry itself is also unaffected.
      expect(STYLE_PRESETS['academic-clean'].semantic.categories.agama).toBe(
        originalAgama,
      );
      expect(STYLE_PRESETS['academic-clean'].semantic.accents.yellow).toBe(
        originalYellow,
      );
    });

    it('two resolver calls produce fully isolated semantic objects (no shared refs)', () => {
      const contract: StyleContract = {
        document: { presetId: 'academic-clean' },
      };
      const a = resolveStyleContract(contract);
      const b = resolveStyleContract(contract);
      expect(a.semantic).not.toBe(b.semantic);
      expect(a.semantic.accents).not.toBe(b.semantic.accents);
      expect(a.semantic.categories).not.toBe(b.semantic.categories);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // P1-2 — Single source of truth for semantic aliases
  // ───────────────────────────────────────────────────────────────
  describe('P1-2: semantic aliases are single-sourced', () => {
    it('semantic.primary === colors.accent (document accent override propagates)', () => {
      // Patch-1 had two divergent sources: colors.accent (overridable)
      // vs semantic.primary (pinned to accents.yellow). Document
      // accent override only changed colors.accent — leaving
      // semantic.primary behind. Canvas might read colors.accent
      // while Export reads semantic.primary and they'd disagree.
      // Patch-2 makes them aliased.
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean', accentColor: '#ff0000' },
      });
      expect(tokens.colors.accent).toBe('#ff0000');
      expect(tokens.semantic.primary).toBe('#ff0000');
      expect(tokens.semantic.primary).toBe(tokens.colors.accent);
    });

    it('semantic.success === colors.success AND semantic.error === colors.error (every preset)', () => {
      // Verify the single-source invariant holds across ALL 6 presets
      // — no preset should have divergent success/error colors.
      const presetIds = Object.keys(STYLE_PRESETS) as Array<
        keyof typeof STYLE_PRESETS
      >;
      for (const presetId of presetIds) {
        const tokens = resolvePresetTokens(presetId);
        expect(tokens.semantic.success).toBe(tokens.colors.success);
        expect(tokens.semantic.error).toBe(tokens.colors.error);
        expect(tokens.semantic.primary).toBe(tokens.colors.accent);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────
  // End-to-end regression: legacy project round-trips correctly
  // ───────────────────────────────────────────────────────────────
  describe('end-to-end: legacy project round-trip with all Patch-2 fixes', () => {
    it('realistic legacy project preserves identity + navbar + overlay + accent', () => {
      // A realistic legacy project that exercises every Patch-2 fix
      // simultaneously: original theme identity (P0-3), navbar carry-
      // through (P0-2), overlay percentage preservation (P0-1), and
      // semantic isolation (P1-1, P1-2).
      const contract = resolveLegacyStyle({
        schemaThemeId: 'macam-norma',
        bgColor: '#0f172a',
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
        overlaySource: 'canva',
        navbarStyle: 'glass',
        blockAccentColor: 'y',
        blockVariant: 'B',
      });

      // P0-3: original 'macam-norma' identity preserved.
      expect(contract.compatibility?.legacyThemeId).toBe('macam-norma');

      // P0-2: navbarStyle 'glass' carried through.
      expect(contract.page?.navigation?.style).toBe('glass');

      // P0-1: Canva overlay 40 stays 40 (was 32 in Patch-1).
      expect(contract.page?.background?.overlay).toBe(40);

      // Resolve and verify end-to-end.
      const tokens = resolveStyleContract(contract);

      // P0-3 round-trip: resolved _legacyThemeId === 'macam-norma'.
      expect(tokens._legacyThemeId).toBe('macam-norma');

      // P0-2 round-trip: tokens.navigation.style === 'glass'.
      expect(tokens.navigation.style).toBe('glass');

      // P0-1 round-trip: tokens.page.background.overlay === 40.
      expect(tokens.page.background.overlay).toBe(40);

      // P1-2: semantic.primary aliased to colors.accent (no override
      // here → both are the preset's accent).
      expect(tokens.semantic.primary).toBe(tokens.colors.accent);

      // P1-1: mutating the resolved semantic must not affect future calls.
      const originalAgama = tokens.semantic.categories.agama;
      tokens.semantic.categories.agama = '#poison';
      const fresh = resolveStyleContract(contract);
      expect(fresh.semantic.categories.agama).toBe(originalAgama);
    });
  });
});
