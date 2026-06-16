// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Legacy Adapter Tests
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// Covers:
//   - Each legacy field maps correctly to a StyleContract field
//   - Unknown legacy themeId falls back to DEFAULT_PRESET_ID
//   - Missing legacy fields do not produce undefined contract entries
//   - Old projects with partial data still resolve cleanly
//   - colorPalette is intentionally NOT mapped (kept honest)
//   - Overlay 0-1 range is auto-converted to 0-100
//   - Invalid navbarStyle / blockVariant are silently dropped
//   - End-to-end: legacy → contract → resolver → tokens (no throw)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  LEGACY_THEME_TO_PRESET,
  PRESET_TO_LEGACY_THEME,
  hasLegacyStyleFields,
  isNewFormatPresetId,
  resolveLegacyStyle,
  resolveStyleContract,
  type LegacyStyleInput,
} from '../index';

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
  // ── schemaThemeId → presetId mapping ─────────────────────────
  describe('schemaThemeId → presetId mapping', () => {
    it('golden-presentation maps to academic-clean', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'golden-presentation',
      });
      expect(contract.document.presetId).toBe('academic-clean');
    });

    it('ceria maps to school-cheerful', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'ceria',
      });
      expect(contract.document.presetId).toBe('school-cheerful');
    });

    it('petualangan maps to mission-adventure', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'petualangan',
      });
      expect(contract.document.presetId).toBe('mission-adventure');
    });

    it('neon maps to dark-elegant', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'neon',
      });
      expect(contract.document.presetId).toBe('dark-elegant');
    });

    it('warm-light maps to nusantara-nature', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'warm-light',
      });
      expect(contract.document.presetId).toBe('nusantara-nature');
    });

    it('ios-light maps to modern-interactive', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'ios-light',
      });
      expect(contract.document.presetId).toBe('modern-interactive');
    });

    it('unknown themeId falls back to DEFAULT_PRESET_ID', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: 'theme-from-the-future',
      });
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
    });

    it('null schemaThemeId falls back to DEFAULT_PRESET_ID', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: null,
      });
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
    });

    it('undefined schemaThemeId falls back to DEFAULT_PRESET_ID', () => {
      const { contract } = resolveLegacyAndTokens({});
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
    });

    it('empty string schemaThemeId falls back to DEFAULT_PRESET_ID', () => {
      const { contract } = resolveLegacyAndTokens({
        schemaThemeId: '',
      });
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
    });
  });

  // ── Legacy mapping table integrity ───────────────────────────
  describe('legacy mapping table integrity', () => {
    it('LEGACY_THEME_TO_PRESET has at least 6 direct mappings', () => {
      const directMappings = Object.entries(LEGACY_THEME_TO_PRESET).filter(
        ([, preset]) => preset,
      );
      expect(directMappings.length).toBeGreaterThanOrEqual(6);
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

  // ── bgColor / bgDataUrl / overlay → page.background ─────────
  describe('background field mapping', () => {
    it('bgDataUrl present → page.background.type=image', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
      });
      expect(contract.page?.background?.type).toBe('image');
      expect(contract.page?.background?.imageUrl).toBe(
        'data:image/png;base64,abc',
      );
      expect(contract.page?.background?.overlay).toBe(40);
    });

    it('bgColor only → page.background.type=solid', () => {
      const { contract } = resolveLegacyAndTokens({
        bgColor: '#0f172a',
      });
      expect(contract.page?.background?.type).toBe('solid');
      expect(contract.page?.background?.color).toBe('#0f172a');
    });

    it('bgDataUrl takes precedence over bgColor when both present', () => {
      const { contract } = resolveLegacyAndTokens({
        bgColor: '#ffffff',
        bgDataUrl: 'data:image/png;base64,abc',
      });
      expect(contract.page?.background?.type).toBe('image');
      expect(contract.page?.background?.imageUrl).toBe(
        'data:image/png;base64,abc',
      );
      // bgColor is dropped when image is present
      expect(contract.page?.background?.color).toBeUndefined();
    });

    it('overlay=0.4 (legacy DB 0-1 float) auto-converts to 40', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 0.4,
      });
      expect(contract.page?.background?.overlay).toBe(40);
    });

    it('overlay=1.0 (legacy DB 0-1 max) converts to 100', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 1.0,
      });
      expect(contract.page?.background?.overlay).toBe(100);
    });

    it('overlay=20 (already 0-100) stays 20', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 20,
      });
      expect(contract.page?.background?.overlay).toBe(20);
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

    it('overlay=-50 (out of range) clamps to 0', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: -50,
      });
      expect(contract.page?.background?.overlay).toBe(0);
    });

    it('overlay=200 (out of range) clamps to 100', () => {
      const { contract } = resolveLegacyAndTokens({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 200,
      });
      expect(contract.page?.background?.overlay).toBe(100);
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
  });

  // ── navbarStyle mapping ──────────────────────────────────────
  describe('navbarStyle mapping', () => {
    it('valid navbarStyle is preserved as legacy hint', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'minimal' });
      expect(
        (contract.document as { _legacyNavbarStyle?: string })
          ._legacyNavbarStyle,
      ).toBe('minimal');
    });

    it('invalid navbarStyle is silently dropped', () => {
      const contract = resolveLegacyStyle({ navbarStyle: 'ultra' });
      expect(
        (contract.document as { _legacyNavbarStyle?: string })
          ._legacyNavbarStyle,
      ).toBeUndefined();
    });

    it('null navbarStyle is silently dropped', () => {
      const contract = resolveLegacyStyle({ navbarStyle: null });
      expect(
        (contract.document as { _legacyNavbarStyle?: string })
          ._legacyNavbarStyle,
      ).toBeUndefined();
    });
  });

  // ── block fields mapping ────────────────────────────────────
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
      // colorPalette must NOT leak into document.accentColor
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
      // Tokens accent comes from the preset, not the palette
      expect(tokens.colors.accent).not.toBe('#00ff00');
    });
  });

  // ── hasLegacyStyleFields detector ───────────────────────────
  describe('hasLegacyStyleFields detector', () => {
    it('returns false for empty input', () => {
      expect(hasLegacyStyleFields({})).toBe(false);
    });

    it('returns true when schemaThemeId is present', () => {
      expect(hasLegacyStyleFields({ schemaThemeId: 'golden-presentation' })).toBe(true);
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

    it('minimal legacy project (only schemaThemeId) resolves', () => {
      const { contract, tokens } = resolveLegacyAndTokens({
        schemaThemeId: 'macam-norma',
      });
      // macam-norma is NOT in our direct map → falls back to DEFAULT
      expect(contract.document.presetId).toBe(DEFAULT_PRESET_ID);
      expect(tokens.colors).toBeDefined();
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
      const input: LegacyStyleInput = { schemaThemeId: 'golden-presentation' };
      const a = resolveLegacyStyle(input);
      const b = resolveLegacyStyle(input);
      expect(a).not.toBe(b);
      expect(a.document).not.toBe(b.document);
    });
  });
});
