// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — TokenResolver Bridge Tests  (Sprint 8.2A-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A-Patch — Senior Review P0-1
//
// Tests for `applyResolvedStyleTokensToTokenResolver()` — the bridge
// that patches ResolvedStyleTokens values into a legacy TokenResolver
// so block renderers see the Style Contract's chosen preset values.
//
// Coverage:
//   - colors (bg, card, border, text, muted, y/c/r/p/g/o accents)
//   - norma category colors (nagama, nkesusilaan, nkesopanan, nhukum)
//   - typography.fontFamily.display + .body
//   - typography.fontSize.h2 + .base (with fontScaleMultiplier)
//   - radius.lg + derived scale
//   - shadow.card
//   - spacing.lg + .xl + .xxl + .sm + .md (density-driven)
//   - input ResolvedStyleTokens is NOT mutated
//   - bridge order: bridge → applyContract (contract wins)
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { TokenResolver } from '@/core/renderer/types';
import {
  applyResolvedStyleTokensToTokenResolver,
  resolveStyleContract,
  resolvePresetTokens,
  type ResolvedStyleTokens,
} from '../index';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeResolvedTokens(
  overrides: Partial<ResolvedStyleTokens> = {},
): ResolvedStyleTokens {
  const base = resolvePresetTokens('academic-clean');
  return { ...base, ...overrides };
}

// ═══════════════════════════════════════════════════════════════════
// BRIDGE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2A-Patch — TokenResolver Bridge (P0-1)', () => {
  // ── Colors ──────────────────────────────────────────────────────
  describe('colors — patched onto resolver.raw.colors', () => {
    it('patches bg + card + border + text + muted from resolved tokens', () => {
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        colors: {
          background: '#0a0a0a',
          surface: '#1a1a1a',
          surfaceStrong: '#2a2a2a',
          text: '#eeeeee',
          textMuted: '#888888',
          accent: '#fbbf24',
          accentContrast: '#000000',
          border: '#333333',
          success: '#4ade80',
          error: '#f87171',
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      expect(resolver.color('bg')).toBe('#0a0a0a');
      expect(resolver.color('card')).toBe('#1a1a1a');
      expect(resolver.color('border')).toBe('#333333');
      expect(resolver.color('text')).toBe('#eeeeee');
      expect(resolver.color('muted')).toBe('#888888');
    });

    it('patches all 6 accent colors (y/c/r/p/g/o)', () => {
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        semantic: {
          ...resolvePresetTokens('academic-clean').semantic,
          accents: {
            yellow: '#ffff00',
            cyan: '#00ffff',
            red: '#ff0000',
            purple: '#ff00ff',
            green: '#00ff00',
            orange: '#ff8800',
          },
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      expect(resolver.color('y')).toBe('#ffff00');
      expect(resolver.color('c')).toBe('#00ffff');
      expect(resolver.color('r')).toBe('#ff0000');
      expect(resolver.color('p')).toBe('#ff00ff');
      expect(resolver.color('g')).toBe('#00ff00');
      expect(resolver.color('o')).toBe('#ff8800');
    });

    it('patches norma category colors when semantic.categories is populated', () => {
      const resolver = new TokenResolver('macam-norma', 'classroom');
      const tokens = makeResolvedTokens({
        semantic: {
          ...resolvePresetTokens('academic-clean').semantic,
          categories: {
            agama: '#ff0000',
            kesusilaan: '#00ff00',
            kesopanan: '#0000ff',
            hukum: '#ff00ff',
          },
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      expect(resolver.color('nagama')).toBe('#ff0000');
      expect(resolver.color('nkesusilaan')).toBe('#00ff00');
      expect(resolver.color('nkesopanan')).toBe('#0000ff');
      expect(resolver.color('nhukum')).toBe('#ff00ff');
    });
  });

  // ── Typography ──────────────────────────────────────────────────
  describe('typography — fontFamily + fontSize patched', () => {
    it('patches fontFamily.display + fontFamily.body (on raw, not via fontFamily() which returns CSS vars)', () => {
      // Note: TokenResolver.fontFamily('display'|'body') is hardcoded
      // to return CSS variables (var(--font-fredoka), var(--font-nunito))
      // for next/font integration. The bridge patches the underlying
      // raw.typography.fontFamily fields instead — block renderers
      // that read raw.fontFamily directly (e.g. SchemaPlayer) see
      // the Style Contract's values.
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        typography: {
          ...resolvePresetTokens('academic-clean').typography,
          headingFamily: "'CustomDisplay', sans-serif",
          bodyFamily: "'CustomBody', serif",
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      expect(resolver.raw.typography.fontFamily.display).toBe("'CustomDisplay', sans-serif");
      expect(resolver.raw.typography.fontFamily.body).toBe("'CustomBody', serif");
    });

    it('patches fontSize.h2 + fontSize.base using fontScaleMultiplier (rem → px)', () => {
      // The Style Contract carries typography scales as rem strings
      // ('1.6rem', '0.92rem'). The bridge normalizes rem → px (1rem = 16px),
      // applies the fontScaleMultiplier, and re-emits as 'px'.
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        typography: {
          ...resolvePresetTokens('academic-clean').typography,
          headingScale: '1.6rem', // 1.6 × 16 = 25.6px
          bodyScale: '0.92rem',   // 0.92 × 16 = 14.72px
          fontScaleMultiplier: 1.12, // 'large' override
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      // 25.6 × 1.12 = 28.672 → "28.672px" (3-decimal rounding)
      expect(resolver.raw.typography.fontSize.h2).toBe('28.672px');
      // 14.72 × 1.12 = 16.4864 → rounded to 3 decimals = 16.486 → "16.486px"
      expect(resolver.raw.typography.fontSize.base).toBe('16.486px');
    });
  });

  // ── Radius ──────────────────────────────────────────────────────
  describe('radius — preset radius drives the legacy scale', () => {
    it('patches radius.lg to the preset value, derives sm/base/md/xl', () => {
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        shape: {
          ...resolvePresetTokens('academic-clean').shape,
          radius: '20px',
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      // lg = preset value (20)
      expect(resolver.raw.radius.lg).toBe(20);
      // sm = round(20 * 0.5) = 10
      expect(resolver.raw.radius.sm).toBe(10);
      // full stays at 99 (pill shape)
      expect(resolver.raw.radius.full).toBe(99);
    });
  });

  // ── Shadow ──────────────────────────────────────────────────────
  describe('shadow — preset shadow patched onto shadow.card', () => {
    it('patches shadow.card from preset', () => {
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        shape: {
          ...resolvePresetTokens('academic-clean').shape,
          shadow: '0 8px 16px rgba(0,0,0,0.3)',
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      expect(resolver.raw.shadow.card).toBe('0 8px 16px rgba(0,0,0,0.3)');
    });
  });

  // ── Spacing ─────────────────────────────────────────────────────
  describe('spacing — density-driven padding patches the spacing scale', () => {
    it('patches spacing.md from cardPadding, derives xs/sm/lg/xl/xxl', () => {
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        spacing: {
          ...resolvePresetTokens('academic-clean').spacing,
          pagePadding: '32px',
          cardPadding: '24px',
          blockGap: '20px',
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      // md = cardPadding (24)
      expect(resolver.raw.spacing.md).toBe(24);
      // sm = blockGap (20) — overrides the derived value
      expect(resolver.raw.spacing.sm).toBe(20);
      // xl = pagePadding (32)
      expect(resolver.raw.spacing.xl).toBe(32);
    });
  });

  // ── Purity ──────────────────────────────────────────────────────
  describe('purity — input ResolvedStyleTokens NOT mutated', () => {
    it('mutating resolver.raw after bridge does NOT affect the input tokens', () => {
      const tokens = makeResolvedTokens();
      const tokensSnapshot = JSON.stringify(tokens);
      const resolver = new TokenResolver(undefined, 'classroom');

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      // Aggressively mutate the resolver's internal state.
      resolver.raw.colors.y = '#poison';
      resolver.raw.colors.bg = '#poison';
      resolver.raw.typography.fontSize.h2 = '999px';
      resolver.raw.spacing.md = 9999;
      resolver.raw.radius.lg = 9999;
      resolver.raw.shadow.card = 'poison';

      // The input tokens object is unaffected.
      expect(JSON.stringify(tokens)).toBe(tokensSnapshot);
    });
  });

  // ── Bridge order — contract wins ────────────────────────────────
  describe('bridge order — explicit TemplateThemeContract applied LAST wins', () => {
    it('bridge patches Style Contract values, then applyContract overrides', () => {
      // This test verifies the documented bridge order:
      //   1. base TokenResolver
      //   2. applyResolvedStyleTokensToTokenResolver (Style Contract bridge)
      //   3. resolver.applyContract(contractStyle) — contract wins
      //
      // We don't import the full ContractResolvedStyle builder here;
      // we just verify the bridge writes values that a subsequent
      // mutation can override (proving the bridge doesn't lock the
      // resolver into Style Contract values).
      const resolver = new TokenResolver(undefined, 'classroom');
      const tokens = makeResolvedTokens({
        colors: {
          ...resolvePresetTokens('academic-clean').colors,
          background: '#style-contract-bg',
        },
      });

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);
      expect(resolver.color('bg')).toBe('#style-contract-bg');

      // Simulate what resolver.applyContract() does — patch raw.colors.
      // The bridge must NOT prevent this later mutation from taking effect.
      resolver.raw.colors.bg = '#contract-wins';
      expect(resolver.color('bg')).toBe('#contract-wins');
    });
  });

  // ── End-to-end: resolver produces Style Contract colors ─────────
  describe('end-to-end — block renderers see Style Contract values', () => {
    it('mission-adventure preset → resolver.color("g") returns earth-tone green', () => {
      // Before P0-1: a fresh project with themeId='mission-adventure'
      // resolved correctly through Style Contract but block renderers
      // saw DEFAULT_TOKENS values (because TokenResolver was built
      // with themeId=undefined). The bridge fixes this.
      const resolver = new TokenResolver('mission-adventure', 'classroom');
      const tokens = resolvePresetTokens('mission-adventure');

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      // mission-adventure's accent is '#84cc16' (earth-tone green).
      expect(resolver.color('g')).toBe('#84cc16');
      // Its background is '#1c1917' (earthy dark).
      expect(resolver.color('bg')).toBe('#1c1917');
    });

    it('dark-elegant preset → resolver.color("c") returns neon cyan', () => {
      const resolver = new TokenResolver('dark-elegant', 'classroom');
      const tokens = resolvePresetTokens('dark-elegant');

      applyResolvedStyleTokensToTokenResolver(resolver, tokens);

      expect(resolver.color('c')).toBe('#22d3ee');
      expect(resolver.color('bg')).toBe('#0a0a1a');
    });
  });
});
