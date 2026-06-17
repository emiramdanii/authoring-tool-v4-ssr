// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Legacy Adapter Tests  (Sprint 8.1-Patch-2)
// ═══════════════════════════════════════════════════════════════════
// Patch:    P0-2 — exhaustive tests against the actual THEME_PRESETS
//               registry. Every theme ID must have an explicit decision.
//        P0-4 — source-aware overlay tests (canva 0-100, db 0-1,
//               schema 0-80). No more ambiguous heuristic.
//        P1   — _legacyNavbarStyle side-channel removed; tests assert
//               it does NOT leak into the contract.
// Patch-2:  P0-1 — overlay conversions now PRESERVE percentage (no rescale).
//               Canva 40 === DB 0.4 === Schema 40 === 40. All clamped
//               to 0-80 max. Previously Patch-1 silently turned 40 → 32.
//        P0-2 — legacy navbarStyle now properly carries through via
//               PageStyle.navigation.style (no more `void` discard).
//               Tests assert different navbarStyle values produce
//               different resolved tokens.navigation.style.
//        P0-3 — original legacy schemaThemeId preserved on the contract
//               as `compatibility.legacyThemeId`. `PRESET_TO_LEGACY_THEME`
//               made Partial — mission-adventure bridge removed.
//
// Covers:
//   - Every theme ID in the actual THEME_PRESETS registry has a mapping
//   - Each PPKn domain theme maps explicitly (not silent fallback)
//   - 'ceria' and 'petualangan' are NOT treated as theme IDs (block presets)
//   - Source-aware overlay conversion — PERCENTAGE PRESERVED (Patch-2 P0-1)
//   - Semantic equality: Canva 40 = DB 0.4 = Schema 40 = 40 (Patch-2 P0-1)
//   - colorPalette is intentionally NOT mapped (kept honest)
//   - blockAccentColor IS mapped to block.accentColor (P0-1 patch)
//   - navbarStyle IS mapped to page.navigation.style (Patch-2 P0-2)
//   - Original legacy themeId IS preserved via compatibility (Patch-2 P0-3)
//   - End-to-end: legacy → contract → resolver → tokens (no throw)
//   - _legacyNavbarStyle side-channel is NOT present anywhere (P1)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  LEGACY_THEME_IDS_WITH_MAPPING,
  LEGACY_THEME_TO_PRESET,
  PRESET_TO_LEGACY_THEME,
  hasLegacyStyleFields,
  isNewFormatPresetId,
  resolveCanvaOverlay,
  resolveDbOverlay,
  resolveLegacyStyle,
  resolveSchemaOverlay,
  resolveStyleContract,
  type LegacyStyleInput,
} from '../index';

// ─────────────────────────────────────────────────────────────────
// The ACTUAL THEME_PRESETS registry (mirror of src/core/themes/tokens.ts)
// — used to verify the mapping is exhaustive against the real source.
// ─────────────────────────────────────────────────────────────────
const ACTUAL_THEME_PRESET_IDS: string[] = [
  'default',
  'golden-presentation',
  'ios-light',
  'ios-warm',
  'hakikat-norma',
  'macam-norma',
  'nilai-pancasila',
  'bhinneka-tunggal-ika',
  'ham-hak-kewajiban',
  'demokrasi-pancasila',
  'globalisasi',
  'colorful',
  'neon',
  'glass',
  'minimal',
  'ocean-light',
  'warm-light',
];

// Block style presets (from src/core/schema/block-style-presets.ts) —
// these are NOT theme IDs and must NOT be in LEGACY_THEME_TO_PRESET.
const BLOCK_STYLE_PRESET_IDS: string[] = [
  'ceria',
  'formal',
  'modern',
  'petualangan',
  'minimal', // NOTE: 'minimal' is BOTH a block preset AND a theme ID
  'hangat',
  'berani',
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function resolveLegacyAndTokens(input: LegacyStyleInput) {
  const contract = resolveLegacyStyle(input);
  return { contract, tokens: resolveStyleContract(contract) };
}

// ─────────────────────────────────────────────────────────────────
// Test suites
// ─────────────────────────────────────────────────────────────────

describe('Style Contract — Legacy Adapter', () => {
  // ── P0-2: Exhaustive mapping against actual THEME_PRESETS ────
  describe('exhaustive mapping against actual THEME_PRESETS (P0-2)', () => {
    it('every actual THEME_PRESETS ID has an explicit mapping', () => {
      for (const themeId of ACTUAL_THEME_PRESET_IDS) {
        expect(
          themeId in LEGACY_THEME_TO_PRESET,
          `Theme '${themeId}' has no explicit mapping in LEGACY_THEME_TO_PRESET`,
        ).toBe(true);
      }
    });

    it('LEGACY_THEME_TO_PRESET has exactly 17 entries (matches THEME_PRESETS count)', () => {
      expect(LEGACY_THEME_IDS_WITH_MAPPING.length).toBe(
        ACTUAL_THEME_PRESET_IDS.length,
      );
    });

    it('for each legacy themeId, resolveLegacyStyle produces a valid presetId (not silent fallback)', () => {
      for (const themeId of ACTUAL_THEME_PRESET_IDS) {
        const { contract } = resolveLegacyAndTokens({ schemaThemeId: themeId });
        // Must be a valid preset ID
        expect(isNewFormatPresetId(contract.document.presetId)).toBe(true);
        // Must be the mapped one (not just the default by accident)
        expect(contract.document.presetId).toBe(
          LEGACY_THEME_TO_PRESET[themeId],
        );
      }
    });

    it('macam-norma maps explicitly to academic-clean (NOT silent fallback)', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'macam-norma',
      });
      expect(contract.document.presetId).toBe('academic-clean');
      // Verify this is via the mapping, not via fallback
      expect(LEGACY_THEME_TO_PRESET['macam-norma']).toBe('academic-clean');
    });

    it('hakikat-norma maps explicitly to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'hakikat-norma',
      });
      expect(contract.document.presetId).toBe('academic-clean');
      expect(LEGACY_THEME_TO_PRESET['hakikat-norma']).toBe('academic-clean');
    });

    it('nilai-pancasila maps explicitly to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'nilai-pancasila',
      });
      expect(contract.document.presetId).toBe('academic-clean');
    });

    it('bhinneka-tunggal-ika maps explicitly to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'bhinneka-tunggal-ika',
      });
      expect(contract.document.presetId).toBe('academic-clean');
    });

    it('ham-hak-kewajiban maps explicitly to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'ham-hak-kewajiban',
      });
      expect(contract.document.presetId).toBe('academic-clean');
    });

    it('demokrasi-pancasila maps explicitly to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'demokrasi-pancasila',
      });
      expect(contract.document.presetId).toBe('academic-clean');
    });

    it('globalisasi maps explicitly to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'globalisasi',
      });
      expect(contract.document.presetId).toBe('academic-clean');
    });

    it("'default' theme maps explicitly to academic-clean", () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'default',
      });
      expect(contract.document.presetId).toBe('academic-clean');
      expect(LEGACY_THEME_TO_PRESET['default']).toBe('academic-clean');
    });

    it('macam-norma preserves 4-color norma categories after migration (P0-3)', () => {
      const { tokens } = resolveLegacyAndTokens({
        schemaThemeId: 'macam-norma',
      });
      // academic-clean carries the macam-norma categories
      expect(tokens.semantic.categories.agama).toBeTruthy();
      expect(tokens.semantic.categories.kesusilaan).toBeTruthy();
      expect(tokens.semantic.categories.kesopanan).toBeTruthy();
      expect(tokens.semantic.categories.hukum).toBeTruthy();
      const colors = new Set([
        tokens.semantic.categories.agama,
        tokens.semantic.categories.kesusilaan,
        tokens.semantic.categories.kesopanan,
        tokens.semantic.categories.hukum,
      ]);
      expect(colors.size).toBe(4);
    });

    it("'ceria' and 'petualangan' are NOT in LEGACY_THEME_TO_PRESET (they are block presets)", () => {
      expect('ceria' in LEGACY_THEME_TO_PRESET).toBe(false);
      expect('petualangan' in LEGACY_THEME_TO_PRESET).toBe(false);
    });

    it('block-only preset IDs that are NOT theme IDs are not in the mapping', () => {
      // 'minimal' is BOTH a block preset AND a theme ID, so it IS in the mapping.
      // 'ceria', 'formal', 'modern', 'hangat', 'berani' are block-only.
      const blockOnlyIds = BLOCK_STYLE_PRESET_IDS.filter(
        (id) => !ACTUAL_THEME_PRESET_IDS.includes(id),
      );
      for (const id of blockOnlyIds) {
        expect(id in LEGACY_THEME_TO_PRESET).toBe(false);
      }
    });
  });

  // ── Legacy mapping table integrity ───────────────────────────
  describe('legacy mapping table integrity', () => {
    it('LEGACY_THEME_TO_PRESET has 17 entries (matches actual registry)', () => {
      expect(Object.keys(LEGACY_THEME_TO_PRESET).length).toBe(17);
    });

    it('PRESET_TO_LEGACY_THEME covers 5 presets with real 1:1 bridges (Patch-2 P0-3)', () => {
      // Patch-2 P0-3: PRESET_TO_LEGACY_THEME is now Partial.
      // mission-adventure has NO real 1:1 legacy theme counterpart
      // ('petualangan' is a block preset, not a theme). The fake
      // 'mission-adventure → glass' bridge was removed to prevent the
      // unstable round-trip mission-adventure → 'glass' → dark-elegant.
      const presetIds = Object.keys(PRESET_TO_LEGACY_THEME);
      expect(presetIds.length).toBe(5);
      expect(presetIds).toContain('academic-clean');
      expect(presetIds).toContain('school-cheerful');
      expect(presetIds).not.toContain('mission-adventure');
      expect(presetIds).toContain('dark-elegant');
      expect(presetIds).toContain('nusantara-nature');
      expect(presetIds).toContain('modern-interactive');
    });

    it('every value in LEGACY_THEME_TO_PRESET is a valid StylePresetId', () => {
      for (const presetId of Object.values(LEGACY_THEME_TO_PRESET)) {
        expect(isNewFormatPresetId(presetId)).toBe(true);
      }
    });

    it('PRESET_TO_LEGACY_THEME has no unstable round-trips (Patch-2 P0-3)', () => {
      // Verify that for each preset → legacy → preset round-trip, we
      // arrive back at the same preset. The previous fake
      // 'mission-adventure → glass' bridge violated this
      // (mission-adventure → 'glass' → dark-elegant).
      for (const [presetId, legacyId] of Object.entries(
        PRESET_TO_LEGACY_THEME,
      )) {
        const roundTrip = LEGACY_THEME_TO_PRESET[legacyId];
        expect(roundTrip).toBe(presetId as never);
      }
    });
  });

  // ── Source-aware overlay resolution (Patch-2 P0-1: percentage preserved)
  describe('source-aware overlay resolution (Patch-2 P0-1)', () => {
    it('resolveCanvaOverlay preserves 0-100 percentage, clamped to 0-80', () => {
      // Patch-2 P0-1: Canva value IS the opacity percentage. The
      // previous Patch-1 multiplied by 0.8 — Canva 40 silently became
      // 32. Now 40 stays 40 (semantically: 40% opacity), and values
      // above 80 are clamped to the schema max.
      expect(resolveCanvaOverlay(0)).toBe(0);
      expect(resolveCanvaOverlay(40)).toBe(40); // was 32 in Patch-1
      expect(resolveCanvaOverlay(50)).toBe(50); // was 40 in Patch-1
      expect(resolveCanvaOverlay(80)).toBe(80);
      expect(resolveCanvaOverlay(100)).toBe(80); // clamped to schema max
    });

    it('resolveCanvaOverlay(1) returns 1 (NOT 80) — no ambiguous heuristic', () => {
      // Patch-1 already removed the ambiguous "<=1 → fraction" heuristic.
      // Patch-2 keeps that fix; 1 (Canva 0-100 scale) is a tiny opacity,
      // not a fraction.
      expect(resolveCanvaOverlay(1)).toBe(1);
    });

    it('resolveCanvaOverlay clamps out-of-range', () => {
      expect(resolveCanvaOverlay(-50)).toBe(0);
      expect(resolveCanvaOverlay(150)).toBe(80);
    });

    it('resolveCanvaOverlay handles null/undefined/NaN', () => {
      expect(resolveCanvaOverlay(null)).toBe(40); // default
      expect(resolveCanvaOverlay(undefined)).toBe(40);
      expect(resolveCanvaOverlay(NaN)).toBe(40);
    });

    it('resolveDbOverlay converts 0-1 fraction → percentage, clamped to 0-80', () => {
      // Patch-2 P0-1: DB fraction 0.4 = 40% opacity. The previous
      // Patch-1 multiplied by 80 — DB 0.4 silently became 32. Now
      // 0.4 → 40 (semantically: 40% opacity), and 0.8+ clamps to 80.
      expect(resolveDbOverlay(0)).toBe(0);
      expect(resolveDbOverlay(0.4)).toBe(40); // was 32 in Patch-1
      expect(resolveDbOverlay(0.5)).toBe(50); // was 40 in Patch-1
      expect(resolveDbOverlay(0.8)).toBe(80);
      expect(resolveDbOverlay(1)).toBe(80); // clamped to schema max
    });

    it('resolveDbOverlay clamps out-of-range', () => {
      expect(resolveDbOverlay(-0.5)).toBe(0);
      expect(resolveDbOverlay(1.5)).toBe(80);
    });

    it('resolveSchemaOverlay passes through 0-80 with clamping', () => {
      expect(resolveSchemaOverlay(0)).toBe(0);
      expect(resolveSchemaOverlay(40)).toBe(40);
      expect(resolveSchemaOverlay(80)).toBe(80);
      expect(resolveSchemaOverlay(-10)).toBe(0);
      expect(resolveSchemaOverlay(120)).toBe(80);
    });

    // ── Patch-2 P0-1: Semantic equality invariant ──
    it('semantic equality: Canva 40 === DB 0.4 === Schema 40 === 40 (Patch-2 P0-1)', () => {
      // The same visual opacity, expressed in three different source
      // scales, must resolve to the SAME schema value. This is the
      // core invariant the Senior Review required.
      expect(resolveCanvaOverlay(40)).toBe(40);
      expect(resolveDbOverlay(0.4)).toBe(40);
      expect(resolveSchemaOverlay(40)).toBe(40);
      // All three are equal
      expect(resolveCanvaOverlay(40)).toBe(resolveDbOverlay(0.4));
      expect(resolveDbOverlay(0.4)).toBe(resolveSchemaOverlay(40));
    });

    it('semantic equality: Canva 100 === DB 1.0 === Schema 80 === 80 (Patch-2 P0-1)', () => {
      // The MAX visual opacity, expressed in three different source
      // scales, must all clamp to the schema max of 80.
      expect(resolveCanvaOverlay(100)).toBe(80);
      expect(resolveDbOverlay(1.0)).toBe(80);
      expect(resolveSchemaOverlay(80)).toBe(80);
    });

    it('semantic equality: Canva 0 === DB 0 === Schema 0 === 0 (Patch-2 P0-1)', () => {
      expect(resolveCanvaOverlay(0)).toBe(0);
      expect(resolveDbOverlay(0)).toBe(0);
      expect(resolveSchemaOverlay(0)).toBe(0);
    });

    it('legacy input with overlaySource="canva" preserves percentage (Patch-2 P0-1)', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 50,
        overlaySource: 'canva',
      });
      // 50% opacity stays 50 (was 40 in Patch-1, losing 10% of the
      // visual meaning the teacher intended).
      expect(contract.page?.background?.overlay).toBe(50);
    });

    it('legacy input with overlaySource="db" preserves percentage (Patch-2 P0-1)', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 0.5,
        overlaySource: 'db',
      });
      // 0.5 fraction = 50% opacity → 50 (was 40 in Patch-1).
      expect(contract.page?.background?.overlay).toBe(50);
    });

    it('legacy input with overlaySource="schema" passes through 0-80', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 60,
        overlaySource: 'schema',
      });
      expect(contract.page?.background?.overlay).toBe(60);
    });

    it('legacy input without overlaySource defaults to Canva 0-100 (backward compat)', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 50,
      });
      // Defaults to Canva 0-100; 50 stays 50.
      expect(contract.page?.background?.overlay).toBe(50);
    });

    it('legacy CanvaPage.overlay=20 stays 20 (Patch-2 P0-1 — was 16 in Patch-1)', () => {
      // Patch-2 P0-1: 20% opacity stays 20 — no rescale.
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 20,
        overlaySource: 'canva',
      });
      expect(contract.page?.background?.overlay).toBe(20);
    });

    it('legacy DB bgOverlay=0.4 converts to 40 (Patch-2 P0-1 — was 32 in Patch-1)', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 0.4,
        overlaySource: 'db',
      });
      // 0.4 = 40% opacity → 40 (was 32 in Patch-1).
      expect(contract.page?.background?.overlay).toBe(40);
    });
  });

  // ── Background field mapping (P0-4 — schema-aligned) ─────────
  describe('background field mapping (P0-4 schema-aligned)', () => {
    it('bgDataUrl present → page.background.imageUrl set (image layered on top, NOT separate type)', () => {
      const { contract } = resolveLegacyAndTokens({
        bgColor: '#0f172a',
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
        overlaySource: 'canva',
      });
      // P0-4: image is layered on top of solid/gradient — NOT a separate type
      expect(contract.page?.background?.type).toBe('solid');
      expect(contract.page?.background?.color1).toBe('#0f172a');
      expect(contract.page?.background?.imageUrl).toBe(
        'data:image/png;base64,abc',
      );
      // Patch-2 P0-1: Canva 40 stays 40 (was 32 in Patch-1).
      expect(contract.page?.background?.overlay).toBe(40);
    });

    it('bgColor only → page.background.type=solid with color1', () => {
      const { contract } = resolveLegacyAndTokens({
        bgColor: '#0f172a',
      });
      expect(contract.page?.background?.type).toBe('solid');
      expect(contract.page?.background?.color1).toBe('#0f172a');
      expect(contract.page?.background?.imageUrl).toBeUndefined();
    });

    it('no bg fields → page.background is undefined', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'golden-presentation',
      });
      expect(contract.page).toBeUndefined();
    });

    it('empty bgColor + empty bgDataUrl → page.background is undefined', () => {
      const { contract } = resolveLegacyAndTokens({
        bgColor: '',
        bgDataUrl: '',
      });
      expect(contract.page).toBeUndefined();
    });

    it('overlay=null → default 40', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: null,
      });
      expect(contract.page?.background?.overlay).toBe(40);
    });

    it('overlay=NaN → default 40', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: NaN,
      });
      expect(contract.page?.background?.overlay).toBe(40);
    });
  });

  // ── Patch-2 P0-2: navbarStyle properly carried through ────────
  describe('navbarStyle carries through to PageStyle.navigation (Patch-2 P0-2)', () => {
    it('contract does NOT contain _legacyNavbarStyle side-channel field (P1)', () => {
      // The side-channel is still gone — the value now lives in the
      // proper PageStyle.navigation.style contract field.
      const contract = resolveLegacyStyle({ navbarStyle: 'minimal' });
      expect(
        (contract.document as { _legacyNavbarStyle?: string })
          ._legacyNavbarStyle,
      ).toBeUndefined();
    });

    it('navbarStyle is carried through via page.navigation.style (Patch-2 P0-2)', () => {
      // Patch-2 P0-2: Previously the P1 patch correctly removed the
      // side-channel but went too far and silently discarded the value
      // via `void input.navbarStyle`. The carry-through is restored
      // via the proper PageStyle.navigation.style field.
      const contract = resolveLegacyStyle({ navbarStyle: 'minimal' });
      expect(contract.page?.navigation?.style).toBe('minimal');
    });

    it('navbarStyle "colorful" carries through', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'colorful' });
      expect(contract.page?.navigation?.style).toBe('colorful');
    });

    it('navbarStyle "glass" carries through', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'glass' });
      expect(contract.page?.navigation?.style).toBe('glass');
    });

    it('navbarStyle "minimal" carries through', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'minimal' });
      expect(contract.page?.navigation?.style).toBe('minimal');
    });

    it('navbarStyle AFFECTS resolved tokens.navigation.style (Patch-2 P0-2)', () => {
      // Previously (Patch-1) the resolver ignored navbarStyle entirely
      // and derived navigation.style from the preset. Different
      // navbarStyle values produced the SAME tokens.navigation.
      // Patch-2 makes the override actually take effect.
      const a = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'minimal' }),
      );
      const b = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'glass' }),
      );
      expect(a.navigation.style).toBe('minimal');
      expect(b.navigation.style).toBe('glass');
      expect(a.navigation).not.toEqual(b.navigation);
    });

    it('invalid navbarStyle value is dropped (falls back to preset default)', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'bogus' });
      expect(contract.page?.navigation).toBeUndefined();
    });

    it('null navbarStyle is dropped', () => {
      const contract = resolveLegacyStyle({ navbarStyle: null });
      expect(contract.page?.navigation).toBeUndefined();
    });

    it('absent navbarStyle leaves page.navigation undefined', () => {
      const contract = resolveLegacyStyle({});
      expect(contract.page?.navigation).toBeUndefined();
    });

    it('navbarStyle + bgColor + bgDataUrl all carry through together', () => {
      // Verify the navbarStyle path works even when other page fields
      // are also present (no accidental clobbering).
      const contract = resolveLegacyStyle({
        bgColor: '#0f172a',
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
        overlaySource: 'canva',
        navbarStyle: 'glass',
      });
      expect(contract.page?.background?.color1).toBe('#0f172a');
      expect(contract.page?.background?.imageUrl).toBe(
        'data:image/png;base64,abc',
      );
      expect(contract.page?.background?.overlay).toBe(40);
      expect(contract.page?.navigation?.style).toBe('glass');
    });
  });

  // ── Patch-2 P0-3: Original legacy theme identity preservation ─
  describe('original legacy theme identity preserved (Patch-2 P0-3)', () => {
    it('schemaThemeId is preserved on contract.compatibility.legacyThemeId', () => {
      const contract = resolveLegacyStyle({ schemaThemeId: 'macam-norma' });
      expect(contract.compatibility).toBeDefined();
      expect(contract.compatibility?.legacyThemeId).toBe('macam-norma');
    });

    it('macam-norma → compatibility.legacyThemeId === "macam-norma"', () => {
      const contract = resolveLegacyStyle({ schemaThemeId: 'macam-norma' });
      expect(contract.compatibility?.legacyThemeId).toBe('macam-norma');
    });

    it('macam-norma → resolved tokens._legacyThemeId === "macam-norma" (round-trip)', () => {
      // End-to-end identity preservation. Before Patch-2, the resolver
      // emitted preset._legacyThemeId ('golden-presentation') — losing
      // the 'macam-norma' original identity.
      const contract = resolveLegacyStyle({ schemaThemeId: 'macam-norma' });
      const tokens = resolveStyleContract(contract);
      expect(tokens._legacyThemeId).toBe('macam-norma');
      expect(tokens._legacyThemeId).not.toBe('golden-presentation');
    });

    it('every PPKn domain theme preserves its original ID through the round-trip', () => {
      const domainThemes = [
        'hakikat-norma',
        'macam-norma',
        'nilai-pancasila',
        'bhinneka-tunggal-ika',
        'ham-hak-kewajiban',
        'demokrasi-pancasila',
        'globalisasi',
      ];
      for (const themeId of domainThemes) {
        const contract = resolveLegacyStyle({ schemaThemeId: themeId });
        expect(contract.compatibility?.legacyThemeId).toBe(themeId);
        const tokens = resolveStyleContract(contract);
        expect(tokens._legacyThemeId).toBe(themeId);
      }
    });

    it('direct-mapped themes also preserve original ID (golden-presentation)', () => {
      const contract = resolveLegacyStyle({
        schemaThemeId: 'golden-presentation',
      });
      expect(contract.compatibility?.legacyThemeId).toBe(
        'golden-presentation',
      );
      const tokens = resolveStyleContract(contract);
      // Both compatibility.legacyThemeId AND preset._legacyThemeId are
      // 'golden-presentation' — so the resolved value is the same.
      expect(tokens._legacyThemeId).toBe('golden-presentation');
    });

    it('empty schemaThemeId leaves compatibility undefined (fresh project path)', () => {
      const contract = resolveLegacyStyle({ schemaThemeId: '' });
      expect(contract.compatibility).toBeUndefined();
    });

    it('null schemaThemeId leaves compatibility undefined', () => {
      const contract = resolveLegacyStyle({ schemaThemeId: null });
      expect(contract.compatibility).toBeUndefined();
    });

    it('absent schemaThemeId leaves compatibility undefined', () => {
      const contract = resolveLegacyStyle({});
      expect(contract.compatibility).toBeUndefined();
    });
  });

  // ── Block fields mapping (P0-1 — blockAccentColor now mapped) ─
  describe('block field mapping', () => {
    it('blockVariant A → contract.block.variant=A', () => {
      const { contract } = resolveLegacyAndTokens({ blockVariant: 'A' });
      expect(contract.block?.variant).toBe('A');
    });

    it('blockVariant B → contract.block.variant=B', () => {
      const { contract } = resolveLegacyAndTokens({ blockVariant: 'B' });
      expect(contract.block?.variant).toBe('B');
    });

    it('blockVariant invalid → variant undefined', () => {
      const { contract } = resolveLegacyAndTokens({ blockVariant: 'X' });
      expect(contract.block?.variant).toBeUndefined();
    });

    it('templateVariant (page-level) doubles as block.variant when block has no own variant', () => {
      const { contract } = resolveLegacyAndTokens({ templateVariant: 'C' });
      expect(contract.block?.variant).toBe('C');
    });

    it('blockVariant takes precedence over templateVariant', () => {
      const { contract } = resolveLegacyAndTokens({
        blockVariant: 'A',
        templateVariant: 'B',
      });
      expect(contract.block?.variant).toBe('A');
    });

    it('blockStylePreset is carried through', () => {
      const { contract } = resolveLegacyAndTokens({
        blockStylePreset: 'ceria',
      });
      expect(contract.block?.presetId).toBe('ceria');
    });

    it('empty blockStylePreset is dropped', () => {
      const { contract } = resolveLegacyAndTokens({ blockStylePreset: '' });
      expect(contract.block?.presetId).toBeUndefined();
    });

    it('blockAccentColor is mapped to block.accentColor (P0-1 patch)', () => {
      const { contract } = resolveLegacyAndTokens({
        blockAccentColor: 'y',
      });
      expect(contract.block?.accentColor).toBe('y');
    });

    it('blockAccentColor drives resolved block.accent to CSS hex (P1)', () => {
      const { tokens } = resolveLegacyAndTokens({
        blockAccentColor: 'y',
      });
      // Token key 'y' resolves to the preset's yellow, not 'y' verbatim
      expect(tokens.block.accent).not.toBe('y');
      expect(tokens.block.accent).toMatch(/^#/);
    });

    it('blockAccentColor empty → not mapped', () => {
      const { contract } = resolveLegacyAndTokens({
        blockAccentColor: '',
      });
      expect(contract.block?.accentColor).toBeUndefined();
    });
  });

  // ── colorPalette is intentionally NOT mapped ────────────────
  describe('colorPalette honesty (intentionally not mapped)', () => {
    it('legacy colorPalette does NOT become document.accentColor', () => {
      const { contract } = resolveLegacyAndTokens({
        colorPalette: {
          colors: ['#ff0000', '#00ff00', '#0000ff'],
          mapping: { accent: '#ff0000' },
        },
      });
      expect(contract.document.accentColor).toBeUndefined();
    });

    it('legacy colorPalette does NOT affect resolved tokens.accent', () => {
      const { tokens } = resolveLegacyAndTokens({
        schemaThemeId: 'golden-presentation',
        colorPalette: {
          colors: ['#00ff00'],
          mapping: { accent: '#00ff00' },
        },
      });
      expect(tokens.colors.accent).not.toBe('#00ff00');
    });
  });

  // ── hasLegacyStyleFields detector ───────────────────────────
  describe('hasLegacyStyleFields detector', () => {
    it('returns false for empty input', () => {
      expect(hasLegacyStyleFields({})).toBe(false);
    });

    it('returns true when schemaThemeId is present', () => {
      expect(
        hasLegacyStyleFields({ schemaThemeId: 'golden-presentation' }),
      ).toBe(true);
    });

    it('returns true when bgColor is present', () => {
      expect(hasLegacyStyleFields({ bgColor: '#fff' })).toBe(true);
    });

    it('returns true when bgDataUrl is present', () => {
      expect(hasLegacyStyleFields({ bgDataUrl: 'data:...' })).toBe(true);
    });

    it('returns true when overlay is present', () => {
      expect(hasLegacyStyleFields({ overlay: 40 })).toBe(true);
    });

    it('returns true when navbarStyle is present', () => {
      expect(hasLegacyStyleFields({ navbarStyle: 'minimal' })).toBe(true);
    });

    it('returns true when blockAccentColor is present', () => {
      expect(hasLegacyStyleFields({ blockAccentColor: 'y' })).toBe(true);
    });

    it('returns true when blockVariant is present', () => {
      expect(hasLegacyStyleFields({ blockVariant: 'A' })).toBe(true);
    });

    it('returns true when blockStylePreset is present', () => {
      expect(hasLegacyStyleFields({ blockStylePreset: 'ceria' })).toBe(true);
    });

    it('returns true when colorPalette is present', () => {
      expect(
        hasLegacyStyleFields({
          colorPalette: { colors: [], mapping: {} },
        }),
      ).toBe(true);
    });

    it('returns true when templateVariant is present', () => {
      expect(hasLegacyStyleFields({ templateVariant: 'B' })).toBe(true);
    });
  });

  // ── End-to-end: legacy → contract → tokens ──────────────────
  describe('end-to-end: legacy → contract → tokens', () => {
    it('realistic legacy project resolves without throwing', () => {
      const realisticInput: LegacyStyleInput = {
        schemaThemeId: 'golden-presentation',
        templateVariant: 'A',
        bgColor: '#0f172a',
        overlay: 40,
        overlaySource: 'canva',
        navbarStyle: 'colorful',
        blockVariant: 'A',
        blockStylePreset: 'formal',
        blockAccentColor: 'y',
        colorPalette: {
          colors: ['#0f172a', '#fbbf24'],
          mapping: { accent: '#fbbf24' },
        },
      };
      expect(() => resolveLegacyAndTokens(realisticInput)).not.toThrow();
    });

    it('macam-norma legacy project resolves AND preserves categories', () => {
      const { contract, tokens } = resolveLegacyAndTokens({
        schemaThemeId: 'macam-norma',
      });
      expect(contract.document.presetId).toBe('academic-clean');
      expect(tokens.semantic.categories.agama).toBeTruthy();
      expect(tokens.semantic.categories.kesopanan).toBeTruthy();
    });

    it('completely empty legacy input still resolves to default preset', () => {
      const { contract, tokens } = resolveLegacyAndTokens({});
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
      expect(tokens.colors).toBeDefined();
      expect(tokens.typography).toBeDefined();
    });

    it('all-null legacy input still resolves', () => {
      const { contract, tokens } = resolveLegacyAndTokens({
        schemaThemeId: null,
        colorPalette: null,
        templateVariant: null,
        bgColor: null,
        bgDataUrl: null,
        overlay: null,
        navbarStyle: null,
        blockAccentColor: null,
        blockVariant: null,
        blockStylePreset: null,
      });
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
      expect(tokens.colors).toBeDefined();
    });

    it('unknown themeId (not in registry) falls back to DEFAULT_PRESET_ID', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'theme-from-the-future',
      });
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
    });
  });

  // ── Purity ───────────────────────────────────────────────────
  describe('purity', () => {
    it('resolveLegacyStyle does not mutate its input', () => {
      const input: LegacyStyleInput = {
        schemaThemeId: 'golden-presentation',
        bgColor: '#0f172a',
        overlay: 40,
      };
      const snapshot = JSON.parse(JSON.stringify(input));
      resolveLegacyStyle(input);
      expect(JSON.parse(JSON.stringify(input))).toEqual(snapshot);
    });

    it('resolveLegacyStyle returns fresh objects on each call', () => {
      const input: LegacyStyleInput = {
        schemaThemeId: 'golden-presentation',
      };
      const a = resolveLegacyStyle(input);
      const b = resolveLegacyStyle(input);
      expect(a).not.toBe(b);
      expect(a.document).not.toBe(b.document);
    });
  });
});
