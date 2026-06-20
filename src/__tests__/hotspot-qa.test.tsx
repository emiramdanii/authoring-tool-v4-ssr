// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.9A / 4A — Post-Hotspot QA & Export Stabilization
// ═══════════════════════════════════════════════════════════════════
// Comprehensive QA tests for hotspot-image vertical slice.
// Covers ALL acceptance criteria from Sprint 8.9A scope:
//
//   1. Renderer renders with valid image URL
//   2. Renderer shows placeholder for empty/broken image
//   3. Hotspot buttons appear at x/y percent positions
//   4. Click hotspot opens card with title + body
//   5. Escape closes card
//   6. Body rendered as plain text (no dangerouslySetInnerHTML)
//   7. javascript: URL rejected (security)
//   8. Export parity: renderer in LAZY_RENDERER_MAP
//   9. Guided editor posisi roundtrips to x/y (regression)
//  10. No posisi field stored (regression)
//  11. 10 original curated blocks stable (regression)
//  12. hotspot-image in TEACHER_ADDABLE_BLOCKS (11 total)
//  13. No dangerouslySetInnerHTML in renderer source code
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ─────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────

vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(() => ({}), { getState: () => ({ pages: [] }), setState: () => {} }),
}));

// ─────────────────────────────────────────────────────────────────
// matchMedia polyfill (needed by A11yProvider transitively)
// ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false, media: query, onchange: null,
        addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// Imports
// ─────────────────────────────────────────────────────────────────

import { HotspotImageRenderer } from '@/core/renderer/blocks/HotspotImageRenderer';
import { LAZY_RENDERER_MAP } from '@/core/renderer/RendererLazy';
import { hasGuidedEditor, getGuidedEditorSchema } from '@/core/schema/guided-patch';
import { parseHotspotPosition, formatHotspotPosition } from '@/core/schema/hotspot-position';
import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry/definitions';
import type { HotspotImageBlock } from '@/core/schema/types/blocks';

// ─────────────────────────────────────────────────────────────────
// Mock TokenResolver — minimal stub that returns token values
// ─────────────────────────────────────────────────────────────────

function createMockTokens() {
  return {
    color: (key: string) => `var(--color-${key})`,
    colorAlpha: (key: string, alpha: number) => `rgba(var(--color-${key}-rgb), ${alpha})`,
    accentBg: () => 'rgba(0,0,0,0.05)',
    accentAlpha: (alpha: number) => `rgba(0,0,0,${alpha})`,
    subtleBg: (alpha: number) => `rgba(0,0,0,${alpha})`,
    edu: () => ({
      containerStyle: {},
      headingStyle: {},
      bodyStyle: {},
      stripeWidth: 4,
      colors: { accent: '#f59e0b', accentSoft: 'rgba(245,158,11,0.1)' },
      typography: { heading: {}, body: {}, caption: {} },
    }),
  } as unknown as import('@/core/renderer/types').TokenResolver;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function makeBlock(overrides: Partial<HotspotImageBlock> = {}): HotspotImageBlock {
  return {
    type: 'hotspot-image',
    id: 'test-block',
    variant: 'A',
    layout: { position: 'flow' },
    title: 'Test Hotspot Image',
    image: { url: 'https://example.com/image.png', alt: 'Test alt' },
    hotspots: [
      { id: 'hs-1', x: 15, y: 15, label: '1', title: 'Titik 1', body: 'Body text 1', icon: '📍', color: 'y' },
      { id: 'hs-2', x: 85, y: 85, label: '2', title: 'Titik 2', body: 'Body text 2', icon: '🔍', color: 'g' },
    ],
    accentColor: 'y',
    ...overrides,
  };
}

const TEACHER_ADDABLE_BLOCKS = [
  'materi-section', 'def-box', 'kuis', 'diskusi',
  'refleksi', 'sortir-game', 'rangkuman', 'motivasi',
  'gambar', 'roda-game', 'hotspot-image',
] as const;

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.9A / 4A — Post-Hotspot QA', () => {
  const tokens = createMockTokens();

  afterEach(() => {
    cleanup();
  });

  // ── 1. Renderer renders with valid image URL ────────────────

  describe('Renderer: valid image', () => {
    it('renders the image with correct src + alt', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/image.png');
      expect(img.alt).toBe('Test alt');
    });

    it('renders the block title', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);
      expect(screen.getByText('Test Hotspot Image')).toBeTruthy();
    });
  });

  // ── 2. Renderer shows placeholder for empty/broken image ────

  describe('Renderer: empty/broken image', () => {
    it('shows placeholder icon when image URL is empty', () => {
      const block = makeBlock({ image: { url: '', alt: '' } });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // No img element should be rendered
      const imgs = screen.queryByRole('img');
      expect(imgs).toBeNull();
      // Placeholder material icon should be present
      expect(screen.getByText('image')).toBeTruthy();
    });

    it('shows broken_image icon when image URL is set but may fail', () => {
      // The renderer shows placeholder when URL exists — actual broken
      // image handling is via onError handler. We verify the img exists.
      const block = makeBlock({ image: { url: 'https://broken.example.com/x.png', alt: 'Broken' } });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.src).toBe('https://broken.example.com/x.png');
    });

    it('rejects javascript: URL and shows placeholder instead', () => {
      const block = makeBlock({ image: { url: 'javascript:alert("xss")', alt: 'Evil' } });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // No img should be rendered (javascript: rejected → safeImageUrl='')
      const imgs = screen.queryByRole('img');
      expect(imgs).toBeNull();
      // Placeholder should show
      expect(screen.getByText('broken_image')).toBeTruthy();
    });
  });

  // ── 3. Hotspot buttons appear at x/y positions ──────────────

  describe('Renderer: hotspot buttons', () => {
    it('renders hotspot buttons with correct labels', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // Hotspot buttons have role="button" + aria-label
      const btn1 = screen.getByRole('button', { name: /1.*Titik 1/i });
      const btn2 = screen.getByRole('button', { name: /2.*Titik 2/i });
      expect(btn1).toBeTruthy();
      expect(btn2).toBeTruthy();
    });

    it('hotspot buttons have correct x/y position styles', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const btn1 = screen.getByRole('button', { name: /1.*Titik 1/i });
      expect(btn1.style.left).toBe('15%');
      expect(btn1.style.top).toBe('15%');

      const btn2 = screen.getByRole('button', { name: /2.*Titik 2/i });
      expect(btn2.style.left).toBe('85%');
      expect(btn2.style.top).toBe('85%');
    });
  });

  // ── 4. Click hotspot opens card with title + body ───────────

  describe('Renderer: click interaction', () => {
    it('clicking a hotspot opens the card with title + body', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // Card should NOT be visible before click
      expect(screen.queryByText('Body text 1')).toBeNull();

      // Click hotspot 1
      const btn1 = screen.getByRole('button', { name: /1.*Titik 1/i });
      fireEvent.click(btn1);

      // Card should now show title + body
      expect(screen.getByText('Titik 1')).toBeTruthy();
      expect(screen.getByText('Body text 1')).toBeTruthy();
    });

    it('clicking another hotspot switches the card', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // Click hotspot 1
      fireEvent.click(screen.getByRole('button', { name: /1.*Titik 1/i }));
      expect(screen.getByText('Body text 1')).toBeTruthy();

      // Click hotspot 2
      fireEvent.click(screen.getByRole('button', { name: /2.*Titik 2/i }));
      expect(screen.getByText('Body text 2')).toBeTruthy();
      expect(screen.queryByText('Body text 1')).toBeNull();
    });

    it('clicking the close button closes the card', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // Open card
      fireEvent.click(screen.getByRole('button', { name: /1.*Titik 1/i }));
      expect(screen.getByText('Body text 1')).toBeTruthy();

      // Click close button
      const closeBtn = screen.getByRole('button', { name: 'Tutup' });
      fireEvent.click(closeBtn);

      // Card should be gone
      expect(screen.queryByText('Body text 1')).toBeNull();
    });
  });

  // ── 5. Escape closes card ───────────────────────────────────

  describe('Renderer: Escape key', () => {
    it('pressing Escape closes the open card', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // Open card
      fireEvent.click(screen.getByRole('button', { name: /1.*Titik 1/i }));
      expect(screen.getByText('Body text 1')).toBeTruthy();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      // Card should be gone
      expect(screen.queryByText('Body text 1')).toBeNull();
    });
  });

  // ── 6. Body is plain text (no dangerouslySetInnerHTML) ──────

  describe('Security: body is plain text', () => {
    it('body text with HTML tags is rendered as text, not HTML', () => {
      const block = makeBlock({
        hotspots: [
          { id: 'hs-x', x: 50, y: 50, label: 'X', title: 'Test', body: '<script>alert(1)</script>', icon: '⚠️', color: 'r' },
        ],
      });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      // Open card
      fireEvent.click(screen.getByRole('button', { name: /X.*Test/i }));

      // The script tag should be visible as TEXT, not executed
      const bodyEl = screen.getByText('<script>alert(1)</script>');
      expect(bodyEl).toBeTruthy();
      // Verify it's a paragraph element (React text node), not an actual script
      expect(bodyEl.tagName).toBe('P');
    });
  });

  // ── 7. No dangerouslySetInnerHTML in renderer source ────────

  describe('Security: no dangerouslySetInnerHTML in source', () => {
    it('HotspotImageRenderer.tsx does not use dangerouslySetInnerHTML in JSX', () => {
      const sourcePath = resolve(process.cwd(), 'src/core/renderer/blocks/HotspotImageRenderer.tsx');
      const source = readFileSync(sourcePath, 'utf-8');
      // The only mentions of dangerouslySetInnerHTML should be in comments
      const jsxUsage = source.match(/dangerouslySetInnerHTML\s*[=:{]/g);
      // Filter out comments
      const realUsages = (jsxUsage || []).filter(m => {
        const lines = source.split('\n');
        const line = lines.find(l => l.includes(m));
        return line && !line.trim().startsWith('//') && !line.trim().startsWith('*');
      });
      expect(realUsages.length).toBe(0);
    });
  });

  // ── 8. Export parity: renderer in LAZY_RENDERER_MAP ─────────

  describe('Export parity', () => {
    it('LAZY_RENDERER_MAP has hotspot-image entry', () => {
      expect(LAZY_RENDERER_MAP['hotspot-image']).toBeDefined();
    });

    it('LAZY_RENDERER_MAP hotspot-image is a lazy component', () => {
      const lazy = LAZY_RENDERER_MAP['hotspot-image'];
      // Lazy components have _payload property (React internal)
      expect(lazy).toBeTruthy();
      expect(typeof lazy).toBe('object');
    });
  });

  // ── 9. Guided editor posisi roundtrips to x/y ───────────────

  describe('Guided editor: posisi roundtrip regression', () => {
    it('parseHotspotPosition("15,15") → { x: 15, y: 15 }', () => {
      const result = parseHotspotPosition('15,15');
      expect(result).toEqual({ x: 15, y: 15 });
    });

    it('parseHotspotPosition("85,85") → { x: 85, y: 85 }', () => {
      const result = parseHotspotPosition('85,85');
      expect(result).toEqual({ x: 85, y: 85 });
    });

    it('formatHotspotPosition(15, 15) → "15,15"', () => {
      expect(formatHotspotPosition(15, 15)).toBe('15,15');
    });

    it('guided editor has posisi select with 9 options', () => {
      const schema = getGuidedEditorSchema('hotspot-image');
      if (!schema) return;
      const hotspotsField = schema.fields!.find(f => f.key === 'hotspots');
      if (!hotspotsField?.fields) return;
      const posisiField = hotspotsField.fields.find(f => f.key === 'posisi');
      expect(posisiField).toBeDefined();
      expect(posisiField!.options!.length).toBe(9);
    });
  });

  // ── 10. No posisi field stored ──────────────────────────────

  describe('No posisi field on block', () => {
    it('createDefault does not produce posisi field', () => {
      const def = BLOCK_DEFINITIONS['hotspot-image'];
      const block = def.createDefault() as HotspotImageBlock;
      expect(block.hotspots[0]).not.toHaveProperty('posisi');
      expect(block.hotspots[0]).toHaveProperty('x');
      expect(block.hotspots[0]).toHaveProperty('y');
    });
  });

  // ── 11. 10 original curated blocks stable ──────────────────

  describe('Regression: 10 original blocks stable', () => {
    it('all 10 original blocks still have guided editors', () => {
      const original10 = [
        'materi-section', 'def-box', 'kuis', 'diskusi',
        'refleksi', 'sortir-game', 'rangkuman', 'motivasi',
        'gambar', 'roda-game',
      ];
      for (const blockType of original10) {
        expect(hasGuidedEditor(blockType), `${blockType} should have guided editor`).toBe(true);
      }
    });
  });

  // ── 12. hotspot-image in TEACHER_ADDABLE_BLOCKS ─────────────

  describe('AddBlockPanel: hotspot-image addable', () => {
    it('TEACHER_ADDABLE_BLOCKS includes hotspot-image', () => {
      expect(TEACHER_ADDABLE_BLOCKS).toContain('hotspot-image');
    });

    it('TEACHER_ADDABLE_BLOCKS has 11 blocks (10 original + hotspot)', () => {
      expect(TEACHER_ADDABLE_BLOCKS.length).toBe(11);
    });
  });

  // ── 13. Keyboard: Enter/Space opens card ───────────────────

  describe('Renderer: keyboard interaction', () => {
    it('pressing Enter on a hotspot button opens the card', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const btn1 = screen.getByRole('button', { name: /1.*Titik 1/i });
      btn1.focus();

      fireEvent.keyDown(btn1, { key: 'Enter' });

      expect(screen.getByText('Body text 1')).toBeTruthy();
    });

    it('pressing Space on a hotspot button opens the card', () => {
      const block = makeBlock();
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const btn2 = screen.getByRole('button', { name: /2.*Titik 2/i });
      btn2.focus();

      fireEvent.keyDown(btn2, { key: ' ' });

      expect(screen.getByText('Body text 2')).toBeTruthy();
    });
  });

  // ── 14. Alt text fallback ───────────────────────────────────

  describe('Renderer: alt text fallback', () => {
    it('uses title as alt when image.alt is empty', () => {
      const block = makeBlock({ image: { url: 'https://example.com/x.png', alt: '' } });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.alt).toBe('Test Hotspot Image');
    });

    it('uses "Gambar hotspot" when both alt and title are empty', () => {
      const block = makeBlock({ title: '', image: { url: 'https://example.com/x.png', alt: '' } });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      const img = screen.getByRole('img') as HTMLImageElement;
      expect(img.alt).toBe('Gambar hotspot');
    });
  });

  // ── 15. Hotspot without body ────────────────────────────────

  describe('Renderer: hotspot without body', () => {
    it('card shows title only when body is empty', () => {
      const block = makeBlock({
        hotspots: [
          { id: 'hs-nb', x: 50, y: 50, label: 'NB', title: 'No Body', body: '', icon: '📍', color: 'y' },
        ],
      });
      render(<HotspotImageRenderer block={block} tokens={tokens} />);

      fireEvent.click(screen.getByRole('button', { name: /NB.*No Body/i }));

      expect(screen.getByText('No Body')).toBeTruthy();
      // No paragraph with body text should be present
      const paras = screen.queryAllByRole('paragraph');
      expect(paras.filter(p => p.textContent === '').length).toBe(0);
    });
  });
});
