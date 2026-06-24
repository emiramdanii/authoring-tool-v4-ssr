// ═══════════════════════════════════════════════════════════════════
// SPRINT 8.9D / 4D — Real Teacher Add Flow UI Smoke
// ═══════════════════════════════════════════════════════════════════
// Renders the REAL AddBlockPanel component (not mocked) in teacher mode
// and verifies the UI follows the shared curated registry.
//
// Note: getAllBlockDefinitions is mocked to return BLOCK_DEFINITIONS
// directly (bypassing SCENE_REGISTRY which uses React.lazy and may not
// fully resolve in test env). This tests AddBlockPanel's FILTERING +
// RENDERING logic, not the registry population (tested elsewhere).
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────
// Mock stores
// ─────────────────────────────────────────────────────────────────

const mockAddSchemaBlock = vi.fn();

vi.mock('@/store/canva-store', () => ({
  useCanvaStore: Object.assign(
    (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        addSchemaBlock: mockAddSchemaBlock,
        pages: [{
          id: 'p1', label: 'Test Page', templateType: 'materi',
          schema: { id: 's1', templateType: 'materi', version: 2, blocks: [] },
        }],
        currentPageIndex: 0, selectedBlockId: null, teacherMode: true,
      };
      return selector ? selector(state) : state;
    },
    { getState: () => ({}), setState: () => {} },
  ),
}));
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('@/store/dirty-store', () => ({
  useDirtyStore: Object.assign(() => ({}), { getState: () => ({}), setState: () => {} }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

// ─────────────────────────────────────────────────────────────────
// Mock getAllBlockDefinitions to return BLOCK_DEFINITIONS directly.
// SCENE_REGISTRY uses React.lazy() which doesn't fully resolve in
// test env, causing 13 of 44 blocks to be missing. By returning
// BLOCK_DEFINITIONS with a stub renderer, we test the REAL
// AddBlockPanel filtering + rendering logic.
// ─────────────────────────────────────────────────────────────────

import { BLOCK_DEFINITIONS } from '@/core/registry/BlockDefinitionRegistry/definitions';
import type { BlockDefinition } from '@/core/registry/SceneRegistry';

vi.mock('@/core/registry/SceneRegistry', async () => {
  const actual = await vi.importActual<typeof import('@/core/registry/SceneRegistry')>('@/core/registry/SceneRegistry');
  // Build BlockDefinition[] from BLOCK_DEFINITIONS with stub renderers
  const allDefs: BlockDefinition[] = Object.values(BLOCK_DEFINITIONS).map(meta => ({
    ...meta,
    renderer: (() => null) as never,
  }));
  return {
    ...actual,
    getAllBlockDefinitions: () => allDefs,
    getBlockDefinition: (type: string) => allDefs.find(b => b.type === type),
  };
});

// ─────────────────────────────────────────────────────────────────
// matchMedia polyfill
// ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: false, media: '', onchange: null,
        addListener: () => {}, removeListener: () => {},
        addEventListener: () => {}, removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  mockAddSchemaBlock.mockClear();
});

afterEach(() => { cleanup(); });

// ─────────────────────────────────────────────────────────────────
// Real imports
// ─────────────────────────────────────────────────────────────────

import AddBlockPanel from '@/components/canva/left-panel/AddBlockPanel';
import {
  TEACHER_ADDABLE_BLOCKS,
  POPULAR_BLOCK_TYPES,
} from '@/core/registry/teacher-curated-blocks';

const PAGE_LEVEL_BLOCKS = [
  'cover', 'tp', 'petunjuk', 'penutup', 'hasil',
  'cp', 'atp', 'alur', 'skenario',
];

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe('Sprint 8.9D / 4D — Real Teacher Add Flow UI Smoke', () => {

  // ── 1. Panel renders in teacher mode ────────────────────────

  it('AddBlockPanel renders in teacher mode (sederhana)', () => {
    render(<AddBlockPanel />);
    const panel = screen.getByTestId('add-block-panel');
    expect(panel).toBeTruthy();
    expect(screen.getByText(/Tambah Isi/i)).toBeTruthy();
  });

  // ── 2. All 11 TEACHER_ADDABLE_BLOCKS appear as add buttons ──

  it('all 11 TEACHER_ADDABLE_BLOCKS appear as add buttons', () => {
    render(<AddBlockPanel />);
    for (const blockType of TEACHER_ADDABLE_BLOCKS) {
      const btn = screen.queryByTestId(`add-block-btn-${blockType}`);
      expect(btn, `${blockType} should have an add button`).not.toBeNull();
    }
  });

  // ── 3. hotspot-image appears as clickable button ────────────

  it('hotspot-image appears as a clickable add button', () => {
    render(<AddBlockPanel />);
    const hotspotBtn = screen.getByTestId('add-block-btn-hotspot-image');
    expect(hotspotBtn).toBeTruthy();
    expect(hotspotBtn.tagName).toBe('BUTTON');
  });

  // ── 4. Page-level blocks do NOT appear ──────────────────────

  it('page-level blocks do NOT appear in teacher addable UI', () => {
    render(<AddBlockPanel />);
    for (const pageBlock of PAGE_LEVEL_BLOCKS) {
      const btn = screen.queryByTestId(`add-block-btn-${pageBlock}`);
      expect(btn, `${pageBlock} should NOT have an add button`).toBeNull();
    }
  });

  // ── 5. Popular quick-access shows 10 blocks ─────────────────

  it('popular quick-access grid shows 10 blocks (no hotspot)', () => {
    const { container } = render(<AddBlockPanel />);
    const popularSection = screen.queryByText(/Paling Sering Digunakan/i);
    expect(popularSection).toBeTruthy();
    const grid = container.querySelector('.grid.grid-cols-3');
    expect(grid).toBeTruthy();
    if (grid) {
      const gridButtons = grid.querySelectorAll('button');
      expect(gridButtons.length).toBe(10);
    }
  });

  // ── 6. Search can find hotspot-image ────────────────────────

  it('searching "hotspot" finds the hotspot-image block', () => {
    render(<AddBlockPanel />);
    const searchInput = screen.getByLabelText('Cari isi');
    fireEvent.change(searchInput, { target: { value: 'hotspot' } });
    const hotspotBtn = screen.getByTestId('add-block-btn-hotspot-image');
    expect(hotspotBtn).toBeTruthy();
    // Non-matching block should be filtered out
    const materiBtn = screen.queryByTestId('add-block-btn-materi-section');
    expect(materiBtn).toBeNull();
  });

  it('searching "gambar interaktif" finds the hotspot-image block', () => {
    render(<AddBlockPanel />);
    const searchInput = screen.getByLabelText('Cari isi');
    fireEvent.change(searchInput, { target: { value: 'gambar interaktif' } });
    const hotspotBtn = screen.getByTestId('add-block-btn-hotspot-image');
    expect(hotspotBtn).toBeTruthy();
  });

  // ── 7. Clicking hotspot-image calls addSchemaBlock ──────────

  it('clicking hotspot-image button calls addSchemaBlock("hotspot-image")', () => {
    render(<AddBlockPanel />);
    const hotspotBtn = screen.getByTestId('add-block-btn-hotspot-image');
    fireEvent.click(hotspotBtn);
    expect(mockAddSchemaBlock).toHaveBeenCalledTimes(1);
    expect(mockAddSchemaBlock).toHaveBeenCalledWith('hotspot-image', undefined);
  });

  // ── 8. No manual copy — imports shared constant ─────────────

  it('test imports TEACHER_ADDABLE_BLOCKS from shared module (no manual copy)', () => {
    expect(TEACHER_ADDABLE_BLOCKS.length).toBe(11);
    expect(TEACHER_ADDABLE_BLOCKS).toContain('hotspot-image');
    expect(POPULAR_BLOCK_TYPES.length).toBe(10);
  });

  // ── 9. Block count in header matches ────────────────────────

  it('header shows block count matching TEACHER_ADDABLE_BLOCKS (11)', () => {
    render(<AddBlockPanel />);
    const header = screen.getByText(/Tambah Isi/i);
    expect(header.textContent).toContain('11');
  });

  // ── 10. Clicking a popular block also calls addSchemaBlock ──

  it('clicking a popular block (materi-section) calls addSchemaBlock', () => {
    const { container } = render(<AddBlockPanel />);
    // Popular grid is the .grid.grid-cols-3 container
    const grid = container.querySelector('.grid.grid-cols-3');
    expect(grid).toBeTruthy();
    if (!grid) return;
    // Find the materi-section button by its text content
    const gridButtons = grid.querySelectorAll('button');
    const materiBtn = Array.from(gridButtons).find(btn =>
      btn.textContent?.includes('Materi')
    );
    expect(materiBtn, 'materi-section should be in popular grid').toBeTruthy();
    if (!materiBtn) return;
    fireEvent.click(materiBtn);
    expect(mockAddSchemaBlock).toHaveBeenCalledWith('materi-section', undefined);
  });
});
