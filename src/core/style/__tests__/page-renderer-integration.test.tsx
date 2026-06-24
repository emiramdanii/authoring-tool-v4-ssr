// ═══════════════════════════════════════════════════════════════════
// STYLE CONTRACT — PageRenderer Integration Tests  (Sprint 8.2A-Patch)
// ═══════════════════════════════════════════════════════════════════
// Sprint 8.2A-Patch — Senior Review P1-1
//
// The previous parity test only verified that the two consumer
// wrappers (resolveCanvasConsumerTokens / resolvePreviewConsumerTokens)
// produced identical output. That proved helper consistency but did
// NOT prove that PageRenderer actually wired the tokens into:
//   - PageFrame (background image, overlay, navbar style)
//   - SchemaScreenRenderer (via the bridged TokenResolver)
//   - ScreenAdapter (preview-mode path)
//
// These integration tests render PageRenderer with MOCKED child
// components and capture the props they actually receive. This
// proves the wiring is real, not just declared.
//
// Mocking strategy:
//   - vi.mock('@/components/canva/page-renderer/PageFrame') captures
//     the `pageStyleTokens` and `tokens` props PageRenderer passes.
//   - vi.mock('@/core/renderer/SchemaRenderer') captures the `tokens`
//     (TokenResolver) prop SchemaScreenRenderer receives — we then
//     assert that resolver.raw.colors matches the Style Contract.
//   - Stores are stubbed to avoid pulling in the full Zustand graph.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import type { CanvaPage, NavConfig } from '@/components/canva/types';
import { DEFAULT_NAV_CONFIG } from '@/components/canva/types';
import type { ScreenSchema } from '@/core/schema/types';
import type { TokenResolver } from '@/core/renderer/types';
import type { ResolvePageStyleTokensResult } from '@/core/style';

// ─────────────────────────────────────────────────────────────────
// Mocks — capture props passed to PageRenderer's children
// ─────────────────────────────────────────────────────────────────

// The captured props from the most recent PageFrame render.
let lastPageFrameProps: {
  pageStyleTokens?: ResolvePageStyleTokensResult;
  tokens?: TokenResolver;
  page?: CanvaPage;
  mode?: string;
} = {};

// The captured TokenResolver passed to SchemaScreenRenderer.
let lastSchemaRendererTokens: TokenResolver | undefined;

// Mock PageFrame — a thin pass-through that captures props.
vi.mock('@/components/canva/page-renderer/PageFrame', () => ({
  PageFrame: React.memo(function MockPageFrame(props: any) {
    lastPageFrameProps = {
      pageStyleTokens: props.pageStyleTokens,
      tokens: props.tokens,
      page: props.page,
      mode: props.mode,
    };
    return React.createElement('div', { 'data-testid': 'mock-page-frame' }, props.children);
  }),
  // Re-export the type so the importing file's TS still compiles.
}));

// Mock SchemaRenderer module — keep TokenResolver REAL (so the bridge
// patches actual tokens), only stub SchemaScreenRenderer to capture props.
// We import the real TokenResolver class lazily inside the factory.
const realRendererModule = vi.importActual<typeof import('@/core/renderer/SchemaRenderer')>(
  '@/core/renderer/SchemaRenderer',
);

vi.mock('@/core/renderer/SchemaRenderer', async () => {
  const actual = await vi.importActual<typeof import('@/core/renderer/SchemaRenderer')>(
    '@/core/renderer/SchemaRenderer',
  );
  return {
    ...actual,
    SchemaScreenRenderer: React.memo(function MockSchemaScreenRenderer(props: any) {
      lastSchemaRendererTokens = props.tokens;
      return React.createElement('div', { 'data-testid': 'mock-schema-renderer' });
    }),
  };
});

// Touch the import so the mock is registered before tests run.
void realRendererModule;

// Mock GoldenPageRenderer — pass-through.
vi.mock('@/core/renderer/GoldenPageRenderer', () => ({
  GoldenPageRenderer: React.memo(function MockGoldenPageRenderer(props: any) {
    return React.createElement('div', { 'data-testid': 'mock-golden' }, props.children);
  }),
}));

// Mock screen adapter system — used in preview/export/learn modes.
vi.mock('@/core/renderer/screens', () => ({
  getScreenAdapter: () => null,
  getScreenConfig: () => null,
}));

// Mock stores — avoid pulling in the full Zustand graph.
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: (selector: (s: any) => any) => {
    const state = {
      displayMode: 'classroom',
      ratioId: '16:9',
      pages: [] as CanvaPage[],
      selectBlock: () => {},
      hoverBlock: () => {},
      startEditing: () => {},
      deleteBlock: () => {},
      moveBlockUp: () => {},
      moveBlockDown: () => {},
      duplicateBlock: () => {},
      reorderSchemaBlocks: () => {},
      selectedBlockId: null,
      selectedBlockIds: [],
      hoveredBlockId: null,
      editingBlockId: null,
    };
    return selector(state);
  },
}));

vi.mock('@/store/learning-media-store', () => ({
  useLearningMediaStore: (selector: (s: any) => any) => {
    const state = { learnSubMode: 'play' };
    return selector(state);
  },
}));

vi.mock('@/store/interactive-store', () => ({
  useInteractiveStore: (selector: (s: any) => any) => {
    const state = {
      totalScore: () => 0,
      totalMax: () => 0,
      totalPct: () => 0,
      isPageComplete: () => false,
    };
    return selector(state);
  },
}));

// Mock authoring-store — PageRenderer doesn't use it directly but
// importing PageRenderer transitively pulls in modules that do.
// Avoid the require('@/store/dirty-store') runtime call.
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: (selector: (s: any) => any) => {
    const state = {
      activePreset: null,
      meta: {},
      cp: {},
      tp: {},
      atp: {},
      alur: {},
      suara: {},
    };
    return selector(state);
  },
}));

vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: (selector: (s: any) => any) => {
    const state = { dirty: false };
    return selector(state);
  },
}));

vi.mock('@/hooks/use-schema-projection', () => ({
  useSchemaMetaProjection: () => ({ namaBab: '', judulPertemuan: '' }),
}));

vi.mock('@/hooks/use-nav-sync', () => ({
  useNavSync: () => ({
    goNext: () => {},
    goPrev: () => {},
    goToPage: () => {},
    goReset: () => {},
  }),
}));

// ═══════════════════════════════════════════════════════════════════
// Fixture builders
// ═══════════════════════════════════════════════════════════════════

function makeBasePage(overrides: Partial<CanvaPage> = {}): CanvaPage {
  return {
    id: 'test-page',
    label: 'Test',
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

// Reset capture state between tests.
beforeEach(() => {
  lastPageFrameProps = {};
  lastSchemaRendererTokens = undefined;
});

// ═══════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Sprint 8.2A-Patch — PageRenderer integration (P1-1)', () => {
  // ── P0-1: TokenResolver bridge wires Style Contract values ───────
  describe('P0-1 — TokenResolver receives Style Contract values via bridge', () => {
    it('Canvas mode: SchemaScreenRenderer receives a TokenResolver patched with preset colors', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeSchemaPage({
        themeId: 'mission-adventure',
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // SchemaScreenRenderer must have received a TokenResolver.
      expect(lastSchemaRendererTokens).toBeDefined();
      // The resolver must carry mission-adventure's earth-tone green
      // (proves the bridge patched Style Contract values onto it).
      expect(lastSchemaRendererTokens!.color('g')).toBe('#84cc16');
      expect(lastSchemaRendererTokens!.color('bg')).toBe('#1c1917');
    });

    it('Preview mode: PageFrame receives the SAME patched TokenResolver', async () => {
      // In preview mode, PageRenderer routes through ScreenAdapter
      // (which wraps SchemaScreenRenderer). Since we mocked
      // getScreenAdapter → null, the ScreenAdapter path is short-
      // circuited. We verify the bridge still wired Style Contract
      // values onto the TokenResolver that PageFrame receives
      // (PageFrame is rendered in every mode).
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeSchemaPage({
        themeId: 'dark-elegant',
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'preview',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // PageFrame must have received a TokenResolver.
      expect(lastPageFrameProps.tokens).toBeDefined();
      // The resolver must carry dark-elegant's neon cyan accent
      // (proves the bridge patched Style Contract values onto it).
      expect(lastPageFrameProps.tokens!.color('c')).toBe('#22d3ee');
      expect(lastPageFrameProps.tokens!.color('bg')).toBe('#0a0a1a');
    });
  });

  // ── P0-2: Auto-golden does NOT override fresh new-preset ─────────
  describe('P0-2 — Auto-golden fallback disabled for fresh new-preset', () => {
    it('fresh mission-adventure page (no contractId) does NOT get golden contract', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeSchemaPage({
        themeId: 'mission-adventure',
      });
      // templateType=materi would have triggered auto-golden before the patch.
      page.templateType = 'materi';
      // No contractId set.

      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // The TokenResolver must still carry mission-adventure's green
      // (NOT golden-pertemuan's gold #fbbf24). If auto-golden had
      // fired, the contract's accentTokenMap would have patched
      // colors.g to a golden-palette value.
      expect(lastSchemaRendererTokens).toBeDefined();
      expect(lastSchemaRendererTokens!.color('g')).toBe('#84cc16');
      // And the background must be mission-adventure's earthy dark,
      // not golden-pertemuan's navy.
      expect(lastSchemaRendererTokens!.color('bg')).toBe('#1c1917');
    });

    it('legacy macam-norma page (no contractId) DOES get golden fallback', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeBasePage({
        templateType: 'materi',
        templateData: { schemaThemeId: 'macam-norma' },
        // No contractId — auto-golden should apply for this legacy theme.
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // The TokenResolver should have golden contract applied.
      // Golden contract's accentTokenMap.y = '#fbbf24' (gold).
      expect(lastSchemaRendererTokens).toBeDefined();
      expect(lastSchemaRendererTokens!.color('y')).toBe('#fbbf24');
    });
  });

  // ── P0-3: PageFrame receives resolved pageStyleTokens ────────────
  describe('P0-3 — PageFrame receives pageStyleTokens prop', () => {
    it('Canvas mode: PageFrame is called with pageStyleTokens', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeBasePage({
        bgDataUrl: 'data:image/png;base64,abc',
        overlay: 40,
        bgColor: '#0f172a',
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      expect(lastPageFrameProps.pageStyleTokens).toBeDefined();
      expect(lastPageFrameProps.pageStyleTokens!.tokens.page.background.overlay).toBe(40);
      expect(lastPageFrameProps.pageStyleTokens!.tokens.page.background.imageUrl).toBe(
        'data:image/png;base64,abc',
      );
    });

    it('Preview mode: PageFrame receives the SAME pageStyleTokens shape', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeBasePage({
        bgDataUrl: 'data:image/png;base64,xyz',
        overlay: 60,
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'preview',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      expect(lastPageFrameProps.pageStyleTokens).toBeDefined();
      expect(lastPageFrameProps.pageStyleTokens!.tokens.page.background.overlay).toBe(60);
    });
  });

  // ── P0-3 schema: SchemaScreenRenderer receives merged background ─
  describe('P0-3 schema — background merged from resolved tokens', () => {
    it('schema page without explicit background gets preset default color via merge', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      // Schema page with themeId but NO background field — the
      // resolver should fill in the preset's default background.
      const page = makeSchemaPage({
        themeId: 'mission-adventure',
        // background intentionally undefined
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // The pageStyleTokens should carry mission-adventure's bg color.
      expect(lastPageFrameProps.pageStyleTokens).toBeDefined();
      expect(lastPageFrameProps.pageStyleTokens!.tokens.page.background.color1).toBe('#1c1917');
    });
  });

  // ── P0-4: Block style extraction reaches resolver ────────────────
  describe('P0-4 — block accent/emphasis reaches resolved tokens', () => {
    it('schema block with accentColor="p" surfaces in resolved block.accent', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeSchemaPage({
        themeId: 'academic-clean',
        blocks: [
          {
            id: 'b1',
            type: 'def-box',
            accentColor: 'p',
            emphasis: 'strong',
          } as unknown as ScreenSchema['blocks'][number],
        ],
      });

      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );

      // The pageStyleTokens should carry the block accent resolved to
      // academic-clean's purple (#c084fc).
      expect(lastPageFrameProps.pageStyleTokens).toBeDefined();
      expect(lastPageFrameProps.pageStyleTokens!.tokens.block.accent).toBe('#c084fc');
      expect(lastPageFrameProps.pageStyleTokens!.tokens.block.emphasis).toBe('strong');
    });
  });

  // ── Canvas/Preview parity at the PageRenderer level ──────────────
  describe('Canvas/Preview parity — both modes produce identical tokens', () => {
    it('same schema page rendered in canvas and preview produces equal pageStyleTokens', async () => {
      const { PageRenderer } = await import('@/components/canva/page-renderer/PageRenderer');
      const page = makeSchemaPage({
        themeId: 'mission-adventure',
        background: {
          type: 'solid',
          color1: '#1c1917',
          imageUrl: 'https://example.com/bg.jpg',
          overlay: 40,
        },
      });

      // Render in canvas mode, capture tokens.
      render(
        React.createElement(PageRenderer, {
          mode: 'canvas',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );
      const canvasTokens = lastPageFrameProps.pageStyleTokens;

      // Reset and render in preview mode.
      lastPageFrameProps = {};
      lastSchemaRendererTokens = undefined;
      render(
        React.createElement(PageRenderer, {
          mode: 'preview',
          page,
          currentPageIndex: 0,
          totalPages: 1,
        }),
      );
      const previewTokens = lastPageFrameProps.pageStyleTokens;

      // Both modes must produce identical resolved tokens.
      expect(previewTokens).toBeDefined();
      expect(canvasTokens).toBeDefined();
      expect(JSON.stringify(canvasTokens)).toBe(JSON.stringify(previewTokens));
    });
  });
});
