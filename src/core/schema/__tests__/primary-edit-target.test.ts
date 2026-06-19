// ═══════════════════════════════════════════════════════════════════
// Tests for resolvePrimaryEditableTarget — Sprint X.1
// ═══════════════════════════════════════════════════════════════════
// These tests verify the domain resolver for primary edit target.
// We mock hasGuidedEditor to avoid the heavy store dependency chain.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

// Mock hasGuidedEditor before importing the module under test
vi.mock('@/core/schema/guided-patch', () => ({
  hasGuidedEditor: (blockType: string) => {
    const guidedTypes = new Set([
      'cover', 'kuis', 'diskusi', 'refleksi', 'materi-section', 'def-box',
      'nc-grid', 'tujuan-display', 'rangkuman', 'motivasi', 'petunjuk',
      'penutup', 'cp', 'tp', 'alur', 'atp', 'tab-icons', 'accordion',
      'timeline', 'infografis', 'materi-blok', 'sortir-game', 'gambar',
    ]);
    return guidedTypes.has(blockType);
  },
}));

import { resolvePrimaryEditableTarget } from '../primary-edit-target';
import type { CanvaPage } from '@/components/canva/types';
import type { ScreenSchema, SchemaBlock } from '@/core/schema/types';

// ── Helpers ──────────────────────────────────────────────────────

function makePage(templateType: string, blocks: SchemaBlock[]): CanvaPage {
  const schema: ScreenSchema = {
    id: 'page-test',
    version: 2,
    templateType,
    blocks,
    background: { type: 'solid', color1: 'bg' },
  };
  return {
    id: 'page-test',
    label: 'Test Page',
    templateType: templateType as CanvaPage['templateType'],
    bgColor: '#ffffff',
    bgDataUrl: '',
    elements: [],
    // Sprint 8.6B: use proper types — overlay is number, navConfig is object
    overlay: 0,
    colorPalette: null,
    navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
    templateData: {},
    templateVariant: 'A',
    schema,
    pageMode: 'schema',
  } as CanvaPage;
}

function makeBlock(type: string, id: string = `blk-${type}`): SchemaBlock {
  return { id, type, variant: 'A', layout: { position: 'flow' } } as SchemaBlock;
}

// ── Tests ────────────────────────────────────────────────────────

describe('resolvePrimaryEditableTarget', () => {
  // ── Step 2: Phase mapping ──
  it('materi page → materi-section', () => {
    const page = makePage('materi', [makeBlock('materi-section')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('materi-section');
    expect(target.blockId).toBe('blk-materi-section');
  });

  it('kuis page → kuis block', () => {
    const page = makePage('kuis', [makeBlock('kuis')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('kuis');
  });

  it('diskusi page → diskusi block', () => {
    const page = makePage('diskusi', [makeBlock('diskusi')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('diskusi');
  });

  it('cover page → cover block', () => {
    const page = makePage('cover', [makeBlock('cover')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('cover');
  });

  it('game page → sortir-game block', () => {
    const page = makePage('game', [makeBlock('sortir-game')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('sortir-game');
  });

  it('refleksi page → refleksi block', () => {
    const page = makePage('refleksi', [makeBlock('refleksi')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('refleksi');
  });

  it('penutup page → penutup block', () => {
    const page = makePage('penutup', [makeBlock('penutup')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('penutup');
  });

  it('tujuan page → tujuan-display block', () => {
    const page = makePage('tujuan', [makeBlock('tujuan-display')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('tujuan-display');
  });

  it('motivasi page → motivasi block', () => {
    const page = makePage('motivasi', [makeBlock('motivasi')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('motivasi');
  });

  it('rangkuman page → rangkuman block', () => {
    const page = makePage('rangkuman', [makeBlock('rangkuman')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('rangkuman');
  });

  // ── Step 3: GuidedEditor fallback ──
  it('unknown templateType → first block with GuidedEditor', () => {
    const page = makePage('custom', [makeBlock('def-box'), makeBlock('kuis')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('def-box');
  });

  // ── Step 4: First schema block fallback ──
  it('no GuidedEditor blocks → first block of any type', () => {
    const page = makePage('custom', [makeBlock('some-unknown-block')]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('some-unknown-block');
    expect(target.blockId).toBe('blk-some-unknown-block');
  });

  // ── Step 5: Page-level fallback ──
  it('empty page → null target', () => {
    const page = makePage('custom', []);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockId).toBeNull();
    expect(target.blockType).toBeNull();
  });

  it('no schema → null target', () => {
    const page = {
      id: 'page-test', label: 'Test Page', templateType: 'custom',
      bgColor: '#ffffff', bgDataUrl: '', elements: [],
      // Sprint 8.6B: use proper types — overlay is number, navConfig is object
      overlay: 0,
      colorPalette: null,
      navConfig: { showNavbar: true, showPrevNext: true, showScore: true, showProgress: true, navbarStyle: 'colorful' },
      templateData: {}, templateVariant: 'A',
      pageMode: 'schema' as const,
    } as CanvaPage;
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockId).toBeNull();
    expect(target.blockType).toBeNull();
  });

  // ── Phase mapping prioritizes correct block, not just the first ──
  it('materi page with multiple blocks → materi-section (not def-box)', () => {
    const page = makePage('materi', [
      makeBlock('def-box'),
      makeBlock('materi-section'),
      makeBlock('kuis'),
    ]);
    const target = resolvePrimaryEditableTarget(page);
    expect(target.blockType).toBe('materi-section');
  });
});
