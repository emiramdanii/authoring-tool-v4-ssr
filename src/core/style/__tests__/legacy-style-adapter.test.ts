// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Legacy Adapter Tests  (Sprint 8.1-Patch)
// ═══════════════════════════════════════════════════════════════════
// Patch: P0-2 — exhaustive tests against the actual THEME_PRESETS
//               registry. Every theme ID must have an explicit decision.
//        P0-4 — source-aware overlay tests (canva 0-100, db 0-1,
//               schema 0-80). No more ambiguous heuristic.
//        P1   — _legacyNavbarStyle side-channel removed; tests assert
//               it does NOT leak into the contract.
//
// Covers:
//   - Every theme ID in the actual THEME_PRESETS registry has a mapping
//   - Each PPKn domain theme maps explicitly (not silent fallback)
//   - 'ceria' and 'petualangan' are NOT treated as theme IDs (block presets)
//   - Source-aware overlay conversion (Canva 0-100 / DB 0-1 / Schema 0-80)
//   - colorPalette is intentionally NOT mapped (kept honest)
//   - blockAccentColor IS mapped to block.accentColor (P0-1 patch)
//   - End-to-end: legacy → contract → resolver → tokens (no throw)
//   - _legacyNavbarStyle is NOT present anywhere in the contract
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

    it('PRESET_TO_LEGACY_THEME covers all 6 presets', () => {
      const presetIds = Object.keys(PRESET_TO_LEGACY_THEME);
      expect(presetIds.length).toBe(6);
      expect(presetIds).toContain('academic-clean');
      expect(presetIds).toContain('school-cheerful');
      expect(presetIds).toContain('mission-adventure');
      expect(presetIds).toContain('dark-elegant');
      expect(presetIds).toContain('nusantara-nature');
      expect(presetIds).toContain('modern-interactive');
    });

    it('every value in LEGACY_THEME_TO_PRESET is a valid StylePresetId', () => {
      for (const presetId of Object.values(LEGACY_THEME_TO_PRESET)) {
        expect(isNewFormatPresetId(presetId)).toBe(true);
      }
    });
  });

  // ── Source-aware overlay resolution (P0-4) ───────────────────
  describe('source-aware overlay resolution (P0-4)', () => {
    it('resolveCanvaOverlay converts 0-100 → 0-80 (×0.8)', () => {
      expect(resolveCanvaOverlay(0)).toBe(0);
      expect(resolveCanvaOverlay(50)).toBe(40); // 50 × 0.8 = 40
      expect(resolveCanvaOverlay(100)).toBe(80); // 100 × 0.8 = 80
    });

    it('resolveCanvaOverlay(1) returns 1 (NOT 80) — no more ambiguous heuristic', () => {
      // P0-4 patch: previously 1 was treated as 0-1 fraction and converted to 100%.
      // Now 1 (Canva 0-100 scale) correctly converts to ~1 (×0.8 → rounded to 1).
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

    it('resolveDbOverlay converts 0-1 → 0-80 (×80)', () => {
      expect(resolveDbOverlay(0)).toBe(0);
      expect(resolveDbOverlay(0.5)).toBe(40); // 0.5 × 80 = 40
      expect(resolveDbOverlay(1)).toBe(80); // 1 × 80 = 80
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

    it('legacy input with overlaySource="canva" uses Canva 0-100 conversion', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 50,
        overlaySource: 'canva',
      });
      expect(contract.page?.background?.overlay).toBe(40); // 50 × 0.8
    });

    it('legacy input with overlaySource="db" uses DB 0-1 conversion', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 0.5,
        overlaySource: 'db',
      });
      expect(contract.page?.background?.overlay).toBe(40); // 0.5 × 80
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
      expect(contract.page?.background?.overlay).toBe(40); // 50 × 0.8
    });

    it('legacy CanvaPage.overlay=20 (a common default) converts to 16 (not 20)', () => {
      // Canva 0-100 → Schema 0-80: 20 × 0.8 = 16
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 20,
        overlaySource: 'canva',
      });
      expect(contract.page?.background?.overlay).toBe(16);
    });

    it('legacy DB bgOverlay=0.4 converts to 32', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 0.4,
        overlaySource: 'db',
      });
      expect(contract.page?.background?.overlay).toBe(32); // 0.4 × 80
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
      expect(contract.page?.background?.overlay).toBe(32); // 40 × 0.8
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

  // ── _legacyNavbarStyle removed (P1 patch) ───────────────────
  describe('_legacyNavbarStyle side-channel removed (P1)', () => {
    it('contract does NOT contain _legacyNavbarStyle field', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'minimal' });
      expect(
        (contract.document as { _legacyNavbarStyle?: string })
          ._legacyNavbarStyle,
      ).toBeUndefined();
    });

    it('navbarStyle is silently dropped (not stored anywhere in contract)', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'minimal' });
      const serialized = JSON.stringify(contract);
      expect(serialized).not.toContain('navbarStyle');
      expect(serialized).not.toContain('_legacyNavbarStyle');
      expect(serialized).not.toContain('minimal');
    });

    it('navbarStyle does NOT affect resolved tokens.navigation', () => {
      const a = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'minimal' }),
      );
      const b = resolveStyleContract(
        resolveLegacyStyle({ navbarStyle: 'glass' }),
      );
      expect(a.navigation).toEqual(b.navigation);
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
