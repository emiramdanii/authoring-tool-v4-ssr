// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — Page Style Adapter Tests  (Sprint 8.2A)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A — Style Consumer Wiring: Canvas + Preview
//
// Tests for `createStyleContractFromPage()` — the SINGLE adapter that
// converts a CanvaPage into a normalized StyleContract.
//
// Coverage (8 mandatory adapter tests from the Sprint 8.2A spec):
//   1. Schema background dipetakan tanpa kehilangan field.
//   2. Legacy Canva overlay 40 tetap 40.
//   3. Navbar `minimal` tetap `minimal`.
//   4. `macam-norma` mempertahankan legacy identity.
//   5. `mission-adventure` tidak mendapatkan fake legacy bridge.
//   6. `page.contractId` tetap lebih tinggi dari preset contract bridge.
//   7. Invalid theme/preset kembali ke default.
//   8. Adapter tidak memutasi page input.
//
// Plus regression fixtures (6 cases from spec):
//   F1. Golden Pertemuan dengan contractId
//   F2. Macam Norma legacy
//   F3. Halaman dengan bg image + overlay 40
//   F4. Navbar glass
//   F5. Fresh project mission-adventure
//   F6. Invalid legacy theme
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import type { ScreenSchema } from '@/core/schema/types';
import {
  createStyleContractFromPage,
  type PageStyleAdapterResult,
} from '../page-style-adapter';
import { DEFAULT_PRESET_ID } from '../defaults';
import { STYLE_PRESETS } from '../preset-registry';

// ─────────────────────────────────────────────────────────────────
// Fixture builders — minimal CanvaPage / ScreenSchema shapes
// ─────────────────────────────────────────────────────────────────

function makeBasePage(overrides: Partial<CanvaPage> = {}): CanvaPage {
  return {
    id: 'test-page',
    label: 'Test Page',
    bgDataUrl: null,
    bgColor: '',
    overlay: 0,
    elements: [],
    templateType: 'custom',
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
    ...overrides,
  };
}

function makeSchemaPage(
  schemaOverrides: Partial<ScreenSchema> = {},
  pageOverrides: Partial<CanvaPage> = {},
): CanvaPage {
  const schema: ScreenSchema = {
    id: 'schema-1',
    templateType: 'materi',
    blocks: [],
    ...schemaOverrides,
  };
  return makeBasePage({
    schema,
    pageMode: 'schema',
    elements: [],
    ...pageOverrides,
  });
}

// ═══════════════════════════════════════════════════════════════════
// 8 MANDATORY ADAPTER TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2A — Page Style Adapter (8 mandatory tests)', () => {
  // ───────────────────────────────────────────────────────────────
  // 1. Schema background dipetakan tanpa kehilangan field
  // ───────────────────────────────────────────────────────────────
  describe('1. Schema background — no field loss', () => {
    it('maps every ScreenSchema.background field onto PageStyle.background', () => {
      const page = makeSchemaPage({
        background: {
          type: 'gradient',
          color1: '#0f172a',
          color2: '#1e293b',
          imageUrl: 'data:image/png;base64,abc',
          overlay: 50,
          overlayType: 'light',
          imageFit: 'contain',
          imageOpacity: 75,
          imageBlur: 4,
        },
      });

      const result = createStyleContractFromPage({ page });
      const bg = result.contract.page?.background;

      expect(bg).toBeDefined();
      expect(bg!.type).toBe('gradient');
      expect(bg!.color1).toBe('#0f172a');
      expect(bg!.color2).toBe('#1e293b');
      expect(bg!.imageUrl).toBe('data:image/png;base64,abc');
      expect(bg!.overlay).toBe(50);
      expect(bg!.overlayType).toBe('light');
      expect(bg!.imageFit).toBe('contain');
      expect(bg!.imageOpacity).toBe(75);
      expect(bg!.imageBlur).toBe(4);
    });

    it('preserves solid background with image layered on top', () => {
      const page = makeSchemaPage({
        background: {
          type: 'solid',
          color1: '#ffffff',
          imageUrl: 'https://example.com/bg.jpg',
          overlay: 40,
        },
      });
      const result = createStyleContractFromPage({ page });
      const bg = result.contract.page!.background!;
      expect(bg.type).toBe('solid');
      expect(bg.color1).toBe('#ffffff');
      expect(bg.imageUrl).toBe('https://example.com/bg.jpg');
      expect(bg.overlay).toBe(40);
    });

    it('P1-2: preserves overlay/imageFit/opacity/blur even when imageUrl is absent', () => {
      // Senior Review P1-2: the previous implementation dropped
      // overlay/overlayType/imageFit/imageOpacity/imageBlur whenever
      // imageUrl was missing. The contract says "no field loss" —
      // the adapter now copies ALL fields when present, regardless
      // of whether imageUrl is set.
      const page = makeSchemaPage({
        background: {
          type: 'radial',
          color1: '#fef3c7',
          color2: '#fde68a',
          // imageUrl intentionally absent
          overlay: 30,
          overlayType: 'light',
          imageFit: 'contain',
          imageOpacity: 60,
          imageBlur: 3,
        },
      });
      const result = createStyleContractFromPage({ page });
      const bg = result.contract.page!.background!;
      expect(bg.type).toBe('radial');
      expect(bg.color1).toBe('#fef3c7');
      expect(bg.color2).toBe('#fde68a');
      expect(bg.imageUrl).toBeUndefined();
      // P1-2 invariant: these fields MUST be preserved even without imageUrl.
      expect(bg.overlay).toBe(30);
      expect(bg.overlayType).toBe('light');
      expect(bg.imageFit).toBe('contain');
      expect(bg.imageOpacity).toBe(60);
      expect(bg.imageBlur).toBe(3);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 2. Legacy Canva overlay 40 tetap 40 (Patch-2 invariant)
  // ───────────────────────────────────────────────────────────────
  describe('2. Legacy Canva overlay — percentage preserved', () => {
    it('legacy page with overlay=40 produces background.overlay=40 (NOT 32)', () => {
      const page = makeBasePage({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
      });
      const result = createStyleContractFromPage({ page });
      const bg = result.contract.page?.background;
      expect(bg).toBeDefined();
      expect(bg!.overlay).toBe(40);
    });

    it('legacy page with overlay=100 clamps to 80 (schema max)', () => {
      const page = makeBasePage({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 100,
      });
      const result = createStyleContractFromPage({ page });
      expect(result.contract.page!.background!.overlay).toBe(80);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 3. Navbar `minimal` tetap `minimal`
  // ───────────────────────────────────────────────────────────────
  describe('3. Navbar style — carry-through via PageStyle.navigation', () => {
    it('legacy page with navbarStyle="minimal" carries through to contract', () => {
      const navConfig: NavConfig = {
        ...DEFAULT_NAV_CONFIG,
        navbarStyle: 'minimal',
      };
      const page = makeBasePage({ navConfig });
      const result = createStyleContractFromPage({ page });
      expect(result.contract.page?.navigation?.style).toBe('minimal');
    });

    it('schema page with navbarStyle="glass" carries through', () => {
      const navConfig: NavConfig = {
        ...DEFAULT_NAV_CONFIG,
        navbarStyle: 'glass',
      };
      const page = makeSchemaPage({}, { navConfig });
      const result = createStyleContractFromPage({ page });
      expect(result.contract.page?.navigation?.style).toBe('glass');
    });

    it('invalid navbarStyle falls back to undefined (resolver picks preset default)', () => {
      // Cast to bypass TS — runtime data may be malformed after migrations.
      const navConfig = {
        ...DEFAULT_NAV_CONFIG,
        navbarStyle: 'unknown-style' as 'colorful',
      };
      const page = makeBasePage({ navConfig });
      const result = createStyleContractFromPage({ page });
      expect(result.contract.page?.navigation?.style).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 4. macam-norma — original legacy theme identity preserved
  // ───────────────────────────────────────────────────────────────
  describe('4. Legacy theme identity — macam-norma preserved end-to-end', () => {
    it('macam-norma produces source="legacy-theme" + compatibility.legacyThemeId', () => {
      const page = makeBasePage({
        templateData: { schemaThemeId: 'macam-norma' },
      });
      const result = createStyleContractFromPage({ page });

      expect(result.source).toBe('legacy-theme');
      expect(result.presetId).toBe('academic-clean');
      expect(result.legacyThemeId).toBe('macam-norma');
      expect(result.contract.compatibility?.legacyThemeId).toBe('macam-norma');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 5. mission-adventure — no fake legacy bridge
  // ───────────────────────────────────────────────────────────────
  describe('5. mission-adventure — no fake bridge', () => {
    it('fresh project with presetId="mission-adventure" produces source="new-preset" + no legacyThemeId', () => {
      const page = makeSchemaPage({
        themeId: 'mission-adventure',
      });
      const result = createStyleContractFromPage({ page });

      expect(result.source).toBe('new-preset');
      expect(result.presetId).toBe('mission-adventure');
      expect(result.legacyThemeId).toBeUndefined();
      expect(result.contract.compatibility?.legacyThemeId).toBeUndefined();
      expect(STYLE_PRESETS['mission-adventure']._legacyThemeId).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 6. page.contractId — highest priority, not overwritten by preset bridge
  // ───────────────────────────────────────────────────────────────
  describe('6. page.contractId — highest priority', () => {
    it('explicit contractId produces source="explicit-contract" + explicitContractId', () => {
      const page = makeBasePage({
        contractId: 'golden-pertemuan',
        templateType: 'materi',
      });
      const result = createStyleContractFromPage({ page });

      expect(result.source).toBe('explicit-contract');
      expect(result.explicitContractId).toBe('golden-pertemuan');
    });

    it('preset._legacyContractId does NOT override page.contractId', () => {
      // academic-clean preset has _legacyContractId: 'golden-pertemuan'.
      // A page with no explicit contractId but using academic-clean preset
      // should NOT synthesize explicitContractId='golden-pertemuan'.
      const page = makeSchemaPage({
        themeId: 'academic-clean',
      });
      const result = createStyleContractFromPage({ page });

      // source is 'new-preset' (themeId is a valid StylePresetId).
      expect(result.source).toBe('new-preset');
      expect(result.presetId).toBe('academic-clean');
      // explicitContractId MUST be undefined — preset bridge is NOT a
      // replacement for the page-level contractId field.
      expect(result.explicitContractId).toBeUndefined();
    });

    it('contractId + legacy themeId both present → contract wins, themeId preserved', () => {
      // Edge case: a project with explicit contract AND a legacy themeId.
      // Contract is the authority; legacyThemeId is still preserved as
      // metadata so Sprint 8.2B can branch on the original identity.
      const page = makeBasePage({
        contractId: 'golden-pertemuan',
        templateData: { schemaThemeId: 'macam-norma' },
      });
      const result = createStyleContractFromPage({ page });

      expect(result.source).toBe('explicit-contract');
      expect(result.explicitContractId).toBe('golden-pertemuan');
      expect(result.legacyThemeId).toBe('macam-norma');
      expect(result.contract.compatibility?.legacyThemeId).toBe('macam-norma');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 7. Invalid theme/preset — fail-safe to default (no throw)
  // ───────────────────────────────────────────────────────────────
  describe('7. Invalid theme/preset — fail-safe default', () => {
    it('unknown schemaThemeId produces source="default" + DEFAULT_PRESET_ID', () => {
      const page = makeBasePage({
        templateData: { schemaThemeId: 'completely-unknown-theme' },
      });
      const result = createStyleContractFromPage({ page });

      expect(result.source).toBe('default');
      expect(result.presetId).toBe(DEFAULT_PRESET_ID);
      // P1-hardening: unrecognized theme ids are isolated to
      // `unrecognizedThemeId` (diagnostic only). `legacyThemeId`
      // remains undefined so downstream consumers don't try to look
      // up the unknown id in THEME_PRESETS and crash.
      expect(result.legacyThemeId).toBeUndefined();
      expect(result.unrecognizedThemeId).toBe('completely-unknown-theme');
      // The compatibility field is NOT populated for unrecognized ids
      // — the resolver will fall back to preset._legacyThemeId or undefined.
      expect(result.contract.compatibility?.legacyThemeId).toBeUndefined();
    });

    it('page with no schema, no templateData, no contractId → default', () => {
      const page = makeBasePage();
      const result = createStyleContractFromPage({ page });
      expect(result.source).toBe('default');
      expect(result.presetId).toBe(DEFAULT_PRESET_ID);
      expect(result.legacyThemeId).toBeUndefined();
      expect(result.unrecognizedThemeId).toBeUndefined();
      expect(result.explicitContractId).toBeUndefined();
    });

    it('invalid themeId does NOT throw (fail-safe)', () => {
      const page = makeBasePage({
        templateData: { schemaThemeId: '' },
      });
      expect(() => createStyleContractFromPage({ page })).not.toThrow();
    });

    it('P1-hardening: KNOWN legacy id populates legacyThemeId, NOT unrecognizedThemeId', () => {
      // Sanity check — known legacy ids still land in legacyThemeId
      // so the P1-hardening split doesn't break the happy path.
      const page = makeBasePage({
        templateData: { schemaThemeId: 'macam-norma' },
      });
      const result = createStyleContractFromPage({ page });
      expect(result.source).toBe('legacy-theme');
      expect(result.legacyThemeId).toBe('macam-norma');
      expect(result.unrecognizedThemeId).toBeUndefined();
      expect(result.contract.compatibility?.legacyThemeId).toBe('macam-norma');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 8. Adapter does NOT mutate page input
  // ───────────────────────────────────────────────────────────────
  describe('8. Adapter purity — input not mutated', () => {
    it('page object reference is unchanged', () => {
      const page = makeBasePage({
        templateData: { schemaThemeId: 'macam-norma' },
        navConfig: { ...DEFAULT_NAV_CONFIG, navbarStyle: 'minimal' },
      });
      const pageRef = page;
      const pageSnapshot = JSON.stringify(page);

      createStyleContractFromPage({ page });

      // Same reference (adapter didn't clone the wrapper).
      expect(page).toBe(pageRef);
      // Same deep content (no field added/removed/mutated).
      expect(JSON.stringify(page)).toBe(pageSnapshot);
    });

    it('page.schema is not mutated (schema-first path)', () => {
      const page = makeSchemaPage({
        background: {
          type: 'solid',
          color1: '#0f172a',
          imageUrl: 'data:image/png;base64,abc',
          overlay: 40,
        },
        themeId: 'academic-clean',
      });
      const schemaSnapshot = JSON.stringify(page.schema);

      createStyleContractFromPage({ page });

      expect(JSON.stringify(page.schema)).toBe(schemaSnapshot);
    });

    it('page.navConfig is not mutated when navbarStyle is invalid', () => {
      const navConfig = {
        ...DEFAULT_NAV_CONFIG,
        navbarStyle: 'bogus' as 'colorful',
      };
      const page = makeBasePage({ navConfig });
      const navSnapshot = JSON.stringify(page.navConfig);

      createStyleContractFromPage({ page });

      expect(JSON.stringify(page.navConfig)).toBe(navSnapshot);
    });

    it('two adapter calls on the same page produce equal results (deterministic)', () => {
      const page = makeBasePage({
        templateData: { schemaThemeId: 'macam-norma' },
        navConfig: { ...DEFAULT_NAV_CONFIG, navbarStyle: 'glass' },
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
      });
      const a = createStyleContractFromPage({ page });
      const b = createStyleContractFromPage({ page });
      expect(a).toEqual(b);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 9. Block style extraction — P0-4 (Senior Review)
  // ───────────────────────────────────────────────────────────────
  describe('9. Block style extraction — P0-4 (all fields collected, no early break)', () => {
    it('extracts accentColor + emphasis when first block has them', () => {
      const page = makeSchemaPage({
        blocks: [
          {
            id: 'b1',
            type: 'def-box',
            // Minimal def-box shape — the adapter uses a permissive cast
            accentColor: 'p',
            emphasis: 'strong',
            variant: 'B',
          } as unknown as ScreenSchema['blocks'][number],
        ],
      });
      const result = createStyleContractFromPage({ page });
      const block = result.contract.block;
      expect(block).toBeDefined();
      expect(block!.accentColor).toBe('p');
      expect(block!.emphasis).toBe('strong');
      expect(block!.variant).toBe('B');
    });

    it('collects fields from DIFFERENT blocks when no single block has all fields', () => {
      // P0-4 invariant: the previous implementation broke after finding
      // the first stylePreset — silently dropping accentColor/emphasis
      // from later blocks. The fix iterates ALL blocks and takes the
      // first non-empty value PER FIELD.
      const page = makeSchemaPage({
        blocks: [
          {
            id: 'b1',
            type: 'def-box',
            stylePreset: 'ceria',
            // No accentColor / emphasis on this block.
          } as unknown as ScreenSchema['blocks'][number],
          {
            id: 'b2',
            type: 'materi-section',
            accentColor: 'c',
            emphasis: 'highlight',
            variant: 'C',
            // No stylePreset on this block.
          } as unknown as ScreenSchema['blocks'][number],
        ],
      });
      const result = createStyleContractFromPage({ page });
      const block = result.contract.block!;
      // presetId from block 1.
      expect(block.presetId).toBe('ceria');
      // accentColor + emphasis + variant from block 2 (the previous
      // implementation would have DROPPED these — P0-4 fixes that).
      expect(block.accentColor).toBe('c');
      expect(block.emphasis).toBe('highlight');
      expect(block.variant).toBe('C');
    });

    it('borderColor used as accentColor hint when accentColor is absent', () => {
      // The Style Contract models block accent via `accentColor` only.
      // When a block has only `borderColor`, the adapter treats it as
      // an accent hint (resolveColor handles both token keys and hex).
      const page = makeSchemaPage({
        blocks: [
          {
            id: 'b1',
            type: 'def-box',
            borderColor: '#ff8800',
          } as unknown as ScreenSchema['blocks'][number],
        ],
      });
      const result = createStyleContractFromPage({ page });
      expect(result.contract.block!.accentColor).toBe('#ff8800');
    });

    it('does NOT break early when first block has stylePreset only', () => {
      // Explicit regression test for the P0-4 bug: the old loop did
      // `break` as soon as it found a stylePreset, dropping fields
      // from subsequent blocks.
      const page = makeSchemaPage({
        blocks: [
          {
            id: 'b1',
            type: 'def-box',
            stylePreset: 'ceria',
          } as unknown as ScreenSchema['blocks'][number],
          {
            id: 'b2',
            type: 'materi-section',
            accentColor: 'r',
            emphasis: 'strong',
          } as unknown as ScreenSchema['blocks'][number],
        ],
      });
      const result = createStyleContractFromPage({ page });
      const block = result.contract.block!;
      expect(block.presetId).toBe('ceria');
      expect(block.accentColor).toBe('r');
      expect(block.emphasis).toBe('strong');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6 REGRESSION FIXTURES
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2A — Regression fixtures (6 cases)', () => {
  // F1. Golden Pertemuan dengan contractId
  it('F1. Golden Pertemuan dengan contractId → explicit-contract path', () => {
    const page = makeBasePage({
      contractId: 'golden-pertemuan',
      templateType: 'materi',
      templateVariant: 'A',
    });
    const result = createStyleContractFromPage({ page });

    expect(result.source).toBe('explicit-contract');
    expect(result.explicitContractId).toBe('golden-pertemuan');
    // presetId falls back to default (no schemaThemeId present).
    expect(result.presetId).toBe(DEFAULT_PRESET_ID);
  });

  // F2. Macam Norma legacy
  it('F2. Macam Norma legacy → legacy-theme path + identity preserved', () => {
    const page = makeBasePage({
      templateData: { schemaThemeId: 'macam-norma' },
    });
    const result = createStyleContractFromPage({ page });

    expect(result.source).toBe('legacy-theme');
    expect(result.presetId).toBe('academic-clean');
    expect(result.legacyThemeId).toBe('macam-norma');
    expect(result.contract.compatibility?.legacyThemeId).toBe('macam-norma');
  });

  // F3. Halaman dengan bg image + overlay 40
  it('F3. Halaman dengan bg image + overlay 40 → overlay preserved as 40', () => {
    const page = makeBasePage({
      bgDataUrl: 'data:image/png;base64,abc',
      overlay: 40,
      bgColor: '#0f172a',
    });
    const result = createStyleContractFromPage({ page });
    const bg = result.contract.page?.background;

    expect(bg).toBeDefined();
    expect(bg!.imageUrl).toBe('data:image/png;base64,abc');
    expect(bg!.overlay).toBe(40);
    expect(bg!.color1).toBe('#0f172a');
  });

  // F4. Navbar glass
  it('F4. Navbar glass → carried through to PageStyle.navigation.style', () => {
    const page = makeBasePage({
      navConfig: { ...DEFAULT_NAV_CONFIG, navbarStyle: 'glass' },
    });
    const result = createStyleContractFromPage({ page });
    expect(result.contract.page?.navigation?.style).toBe('glass');
  });

  // F5. Fresh project mission-adventure
  it('F5. Fresh project mission-adventure → new-preset, no fake legacy bridge', () => {
    const page = makeSchemaPage({
      themeId: 'mission-adventure',
    });
    const result = createStyleContractFromPage({ page });

    expect(result.source).toBe('new-preset');
    expect(result.presetId).toBe('mission-adventure');
    expect(result.legacyThemeId).toBeUndefined();
    expect(result.contract.compatibility?.legacyThemeId).toBeUndefined();
  });

  // F6. Invalid legacy theme
  it('F6. Invalid legacy theme → fail-safe to default (no throw)', () => {
    const page = makeBasePage({
      templateData: { schemaThemeId: 'theme-tidak-ada' },
    });
    let result: PageStyleAdapterResult;
    expect(() => {
      result = createStyleContractFromPage({ page });
    }).not.toThrow();
    result = createStyleContractFromPage({ page });

    expect(result.source).toBe('default');
    expect(result.presetId).toBe(DEFAULT_PRESET_ID);
    // P1-hardening: unrecognized id is routed to `unrecognizedThemeId`
    // (diagnostic only), NOT `legacyThemeId`. This prevents downstream
    // consumers (Sprint 8.2B legacy renderer branch) from attempting
    // to look up the unknown id in THEME_PRESETS and crashing.
    expect(result.legacyThemeId).toBeUndefined();
    expect(result.unrecognizedThemeId).toBe('theme-tidak-ada');
  });
});
