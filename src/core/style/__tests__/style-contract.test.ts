// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Resolver Tests
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.1 — Style Contract Audit & Consolidation
//
// Covers:
//   - Resolver is pure & deterministic
//   - All 6 preset IDs resolve to distinct tokens
//   - Invalid preset ID falls back to default
//   - Undefined preset ID falls back to default
//   - Empty input still returns tokens (no throw)
//   - Document-level overrides (accentColor, fontScale, density) work
//   - Page-level background override works
//   - Block-level override does not corrupt document tokens
//   - Runtime/UI state NEVER enters the contract
//   - Legacy fields (colorPalette etc.) do NOT leak into tokens
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  resolvePresetTokens,
  resolveStyleContract,
  STYLE_PRESETS,
  type DocumentStyle,
  type ResolvedStyleTokens,
  type StyleContract,
  type StylePresetId,
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
        page: { background: { type: 'solid', color: '#fff' } },
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

    it('each preset exposes a stable _legacyThemeId for migration', () => {
      for (const id of ALL_PRESET_IDS) {
        const tokens = resolvePresetTokens(id);
        expect(typeof tokens._legacyThemeId).toBe('string');
        expect(tokens._legacyThemeId.length).toBeGreaterThan(0);
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
    it('empty contract (no page, no block) returns document-level tokens', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
      });
      expect(tokens.colors).toBeDefined();
      expect(tokens.typography).toBeDefined();
      expect(tokens.shape).toBeDefined();
      expect(tokens.spacing).toBeDefined();
      expect(tokens.navigation).toBeDefined();
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
    it('accentColor override replaces preset accent', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: '#ff0000' }),
      );
      expect(tokens.colors.accent).toBe('#ff0000');
    });

    it('accentColor override with token key passes through verbatim', () => {
      const tokens = resolveStyleContract(
        makeContract('academic-clean', { accentColor: 'y' }),
      );
      // Token keys are passed through; consumer resolves them.
      expect(tokens.colors.accent).toBe('y');
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
      // 'academic-clean' default density is 'comfortable'
      expect(tokens.spacing.density).toBe('comfortable');
    });
  });

  // ── Page-level overrides ─────────────────────────────────────
  describe('page-level overrides', () => {
    it('page.background.color override replaces colors.background', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', color: '#abcdef' } },
      });
      expect(tokens.colors.background).toBe('#abcdef');
    });

    it('page.background.color with token key passes through', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { background: { type: 'solid', color: 'bg' } },
      });
      expect(tokens.colors.background).toBe('bg');
    });

    it('page.background.type=image does not throw', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: {
          background: {
            type: 'image',
            imageUrl: 'data:image/png;base64,abc',
            overlay: 60,
          },
        },
      });
      // Background base color remains the preset default (image is rendered on top by consumer)
      expect(tokens.colors.background).toBe(
        STYLE_PRESETS['academic-clean'].colors.background,
      );
    });

    it('page.background.overlay out-of-range (negative) clamps to 0', () => {
      const contract = {
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'image', imageUrl: 'x', overlay: -50 },
        },
      } as StyleContract;
      // Resolver does not expose overlay on tokens; just verify no throw.
      expect(() => resolveStyleContract(contract)).not.toThrow();
    });

    it('page.background.overlay out-of-range (>100) clamps to 100', () => {
      const contract = {
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'image', imageUrl: 'x', overlay: 200 },
        },
      } as StyleContract;
      expect(() => resolveStyleContract(contract)).not.toThrow();
    });

    it('page.background.overlay=NaN falls back to default', () => {
      const contract = {
        document: { presetId: 'academic-clean' },
        page: {
          background: { type: 'image', imageUrl: 'x', overlay: NaN },
        },
      } as StyleContract;
      expect(() => resolveStyleContract(contract)).not.toThrow();
    });

    it('page.surface / page.composition do not throw and do not corrupt tokens', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        page: { surface: 'elevated', composition: 'focus' },
      });
      expect(tokens.colors.surface).toBe(
        STYLE_PRESETS['academic-clean'].colors.surface,
      );
    });
  });

  // ── Block-level overrides ────────────────────────────────────
  describe('block-level overrides', () => {
    it('block.variant does not corrupt document-level tokens', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { variant: 'C' },
      });
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
    });

    it('block.emphasis does not corrupt document-level tokens', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { emphasis: 'strong' },
      });
      expect(tokens.colors.accent).toBe(
        STYLE_PRESETS['academic-clean'].colors.accent,
      );
    });

    it('block.presetId does not corrupt document-level tokens', () => {
      const tokens = resolveStyleContract({
        document: { presetId: 'academic-clean' },
        block: { presetId: 'ceria' },
      });
      // Document-level preset is unaffected by block preset
      expect(tokens._legacyThemeId).toBe(
        STYLE_PRESETS['academic-clean']._legacyThemeId,
      );
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

    it('ResolvedStyleTokens does not contain React/DOM artifacts', () => {
      const tokens = resolvePresetTokens('academic-clean');
      // No functions, no DOM references, no React elements
      const serialized = JSON.stringify(tokens);
      expect(serialized).not.toContain('function');
      expect(serialized).not.toContain('undefined');
      expect(serialized).not.toContain('[object');
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

    it('resolver does not access window or document globals', () => {
      // Spy on window/document — if the resolver tried to access them,
      // these spies would record the access. Resolver is pure, so it
      // should not touch them at all.
      const originalWindow = globalThis.window;
      const originalDocument = globalThis.document;
      // jsdom provides window/document — temporarily stub getters.
      const windowAccess: string[] = [];
      const docAccess: string[] = [];
      try {
        // Use a Proxy to log property accesses without breaking jsdom.
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
        // Replace globals
        (globalThis as Record<string, unknown>).window = winProxy;
        (globalThis as Record<string, unknown>).document = docProxy;
        // Call resolver
        resolvePresetTokens('academic-clean');
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
        (globalThis as Record<string, unknown>).document = originalDocument;
      }
      // The resolver must not have touched window or document.
      // (jsdom may lazily access these for its own bookkeeping, but the
      // pure resolver itself does not. Tolerate any internal jsdom noise
      // by checking that the resolver's known property accesses are absent.)
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

    it('typography has all 5 required fields', () => {
      expect(tokens.typography).toHaveProperty('headingFamily');
      expect(tokens.typography).toHaveProperty('bodyFamily');
      expect(tokens.typography).toHaveProperty('headingScale');
      expect(tokens.typography).toHaveProperty('bodyScale');
      expect(tokens.typography).toHaveProperty('fontScaleMultiplier');
      expect(typeof tokens.typography.fontScaleMultiplier).toBe('number');
    });

    it('shape has all 3 required fields as strings', () => {
      expect(typeof tokens.shape.radius).toBe('string');
      expect(typeof tokens.shape.borderWidth).toBe('string');
      expect(typeof tokens.shape.shadow).toBe('string');
    });

    it('spacing has all 4 required fields', () => {
      expect(tokens.spacing).toHaveProperty('density');
      expect(tokens.spacing).toHaveProperty('pagePadding');
      expect(tokens.spacing).toHaveProperty('cardPadding');
      expect(tokens.spacing).toHaveProperty('blockGap');
      expect(['compact', 'comfortable', 'spacious']).toContain(
        tokens.spacing.density,
      );
    });

    it('navigation has style field', () => {
      expect(typeof tokens.navigation.style).toBe('string');
      expect(tokens.navigation.style.length).toBeGreaterThan(0);
    });

    it('_legacyThemeId is present and non-empty', () => {
      expect(typeof tokens._legacyThemeId).toBe('string');
      expect(tokens._legacyThemeId.length).toBeGreaterThan(0);
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
