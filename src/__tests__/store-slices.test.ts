// ═══════════════════════════════════════════════════════════════════
// STORE SLICE TESTS — Zustand canva store slices
// ═══════════════════════════════════════════════════════════════════
// Tests each slice in isolation by creating a minimal store instance
// and calling actions directly, then asserting on state.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ═══════════════════════════════════════════════════════════════════
// Mock dependencies BEFORE importing the slices
// ═══════════════════════════════════════════════════════════════════

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the authoring store
vi.mock('@/store/authoring-store', () => ({
  useAuthoringStore: {
    getState: () => ({
      kuis: [],
      modules: [],
    }),
  },
}));

// Mock the inline editor
vi.mock('@/core/editor/inline-editor/InlineTextEditor', () => ({
  useInlineEditor: () => ({
    value: '',
    onChange: vi.fn(),
    className: '',
    style: {},
    placeholder: '',
  }),
  InlineTextEditor: () => null,
}));

// Mock the interactive store
vi.mock('@/store/interactive-store', () => ({
  useInteractiveStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ replayGeneration: 0, reportScore: vi.fn() }),
}));

// Mock sounds/confetti
vi.mock('@/lib/sounds', () => ({
  playSound: vi.fn(),
}));

vi.mock('@/lib/confetti', () => ({
  fireConfetti: vi.fn(),
  fireConfettiCelebration: vi.fn(),
}));

// Mock game a11y hook
vi.mock('@/lib/use-game-a11y', () => ({
  useGameA11y: () => ({
    rootAria: { role: 'application', 'aria-label': 'Test' },
    instructionId: 'test-instructions',
    progressAria: () => ({}),
    liveAria: () => ({}),
    announce: vi.fn(),
    announceCorrect: vi.fn(),
    announceIncorrect: vi.fn(),
    announceComplete: vi.fn(),
    announceScore: vi.fn(),
    rovingFocus: () => 0,
    isActivation: () => false,
  }),
}));

// Mock a11y
vi.mock('@/lib/a11y', () => ({
  announceToScreenReader: vi.fn(),
  gameAriaLabel: vi.fn(() => 'Game'),
  progressBarAria: vi.fn(() => ({})),
  buttonAria: vi.fn(() => ({})),
  handleRovingFocus: vi.fn(() => 0),
  isActivationKey: vi.fn(() => false),
  liveRegion: vi.fn(() => ({})),
  createFocusTrap: vi.fn(() => ({ activate: vi.fn(), deactivate: vi.fn() })),
}));

// Mock color palette
vi.mock('@/lib/color-palette', () => ({
  extractColorPalette: vi.fn(async () => ({ colors: [], mapping: {} })),
}));

// Mock module resolver
vi.mock('@/lib/module-resolver', () => ({
  resolveModule: () => null,
  generateKuisId: () => 'kuis-test-id',
}));

// Mock canva-constants
vi.mock('@/lib/canva-constants', () => ({
  populateTemplateElements: vi.fn((page: unknown) => (page as { elements: unknown[] }).elements || []),
  GAME_TYPES: ['memory', 'matching', 'sortir', 'true-false', 'fill-blank', 'word-search', 'crossword', 'drag-drop', 'roda', 'team-buzzer'],
  ZOOM_FIT: -1,
  ZOOM_MIN: 0.25,
  ZOOM_MAX: 3,
  clampZoom: (z: number) => Math.max(0.25, Math.min(3, z)),
}));

// Mock canva-icon-maps
vi.mock('@/lib/canva-icon-maps', () => ({
  getModuleIcon: () => '📦',
  getGameIcon: () => '🎮',
}));

// Mock schema utilities
vi.mock('@/core/schema/ensure-schema', () => {
  let counter = 0;
  return {
    generatePageId: () => 'page-test-' + (++counter),
    generateBlockId: () => 'block-test-' + (++counter),
    ensurePageSchema: vi.fn((page: Record<string, unknown>) => page.schema || null),
  };
});

// Mock derive-schema
vi.mock('@/core/schema/derive-schema', () => ({
  deriveSchema: vi.fn(() => null),
  deriveSchemaForPage: vi.fn(() => null),
  createDeriveContext: vi.fn(() => ({})),
}));

// Mock PatchHistory
vi.mock('@/core/editor/patch-history', () => ({
  patchHistory: {
    clear: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    undo: vi.fn(() => null),
    redo: vi.fn(() => null),
  },
}));

// Mock edit bus
vi.mock('@/core/editor/edit-bus', () => ({
  editBus: {
    emit: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

// Mock deep merge
vi.mock('@/core/editor/deep-merge', () => ({
  deepMergeBlock: vi.fn(),
  mergeBlockInArray: vi.fn(() => ({ blocks: [], patches: [], inversePatches: [] })),
}));

// Mock BlockDefinitionRegistry
vi.mock('@/core/registry/BlockDefinitionRegistry', () => ({
  BLOCK_DEFINITIONS: {
    'def-box': {
      type: 'def-box',
      name: 'Definisi',
      icon: '📖',
      category: 'content',
      defaultLayout: { position: 'flow' },
      createDefault: () => ({ content: 'Test', borderColor: 'y' }),
    },
  },
}));

// Mock PagePresetRegistry
vi.mock('@/core/preset/PagePresetRegistry', () => ({
  createPageFromPreset: vi.fn((templateType: string, idx: number) => ({
    id: 'page-preset-' + idx,
    label: 'Preset ' + templateType,
    bgColor: '#0f172a',
    bgDataUrl: null,
    overlay: 20,
    elements: [],
    templateType,
    colorPalette: null,
    navConfig: { showNavbar: true, showPrevNext: true, showScore: false, showProgress: true, navbarStyle: 'colorful' as const },
    templateData: {},
  })),
  getPreset: vi.fn(() => null),
}));

// Mock immer
vi.mock('immer', async () => {
  const actual = await vi.importActual('immer');
  return {
    ...actual,
    applyPatches: vi.fn((state: unknown) => state),
  };
});

// ═══════════════════════════════════════════════════════════════════
// Now import the slices
// ═══════════════════════════════════════════════════════════════════

import { createPageSlice } from '@/store/canva/page-slice';
import { createElementSlice } from '@/store/canva/element-slice';
import { createHistorySlice } from '@/store/canva/history-slice';
import { createUISlice } from '@/store/canva/ui-slice';
import { createBackgroundSlice } from '@/store/canva/background-slice';
import type { CanvaState } from '@/store/canva/types';
import type { CanvaPage, CanvaElement } from '@/components/canva/types';
import { RATIOS, DEFAULT_NAV_CONFIG } from '@/components/canva/types';

// ═══════════════════════════════════════════════════════════════════
// Test helpers — create a minimal canva page
// ═══════════════════════════════════════════════════════════════════

function createTestPage(label = 'Test Page', templateType: CanvaPage['templateType'] = 'custom'): CanvaPage {
  return {
    id: 'page-test',
    label,
    bgColor: '#1e293b',
    bgDataUrl: null,
    overlay: 20,
    elements: [],
    templateType,
    colorPalette: null,
    navConfig: { ...DEFAULT_NAV_CONFIG },
    templateData: {},
  };
}

function createTestElement(id = 'el-1', type = 'teks'): CanvaElement {
  return {
    id,
    type,
    x: 10,
    y: 10,
    w: 40,
    h: 30,
    opacity: 100,
    text: type === 'teks' ? 'Hello' : undefined,
    fontSize: type === 'teks' ? 24 : undefined,
  };
}

// Minimal initial state for testing
function createInitialState(): CanvaState {
  return {
    pages: [createTestPage()],
    currentPageIndex: 0,
    ratioId: '16:9',
    zoom: -1,
    tool: 'select',
    leftTab: 'halaman',
    selectedElId: null,
    selectedElIds: [],
    selectedBlockId: null,
    selectedBlockType: null,
    selectedBlockIds: [],
    hoveredBlockId: null,
    editingBlockId: null,
    leftPanelOpen: true,
    rightPanelOpen: true,
    _saveStatus: 'saved',
    showGrid: false,
    gridSize: 5,
    snapEnabled: true,
    _clipboard: [],
    _schemaClipboard: null,
    _history: [],
    _historyIdx: -1,
    _skipHistory: false,
    _lastNudgeTime: undefined,

    // Computed helpers
    currentPage: function() { return this.pages[this.currentPageIndex]; },
    currentRatio: function() { return RATIOS[0]; },
    selectedElement: function() {
      const page = this.pages[this.currentPageIndex];
      if (!page) return undefined;
      return page.elements.find(e => e.id === this.selectedElId);
    },

    // Actions will be provided by slices
  } as unknown as CanvaState;
}

// ═══════════════════════════════════════════════════════════════════
// 1. PAGE SLICE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Page Slice', () => {
  let store: ReturnType<typeof create<CanvaState>>;

  beforeEach(() => {
    const initialState = createInitialState();
    store = create<CanvaState>()(subscribeWithSelector((...a) => ({
      ...initialState,
      ...createHistorySlice(...a),
      ...createPageSlice(...a),
      ...createElementSlice(...a),
      ...createUISlice(...a),
      ...createBackgroundSlice(...a),
    })));
  });

  it('should navigate between pages with goPage', () => {
    const { getState, setState } = store;
    // Add another page manually
    setState({
      pages: [createTestPage('Page 1'), createTestPage('Page 2')],
    });
    expect(getState().currentPageIndex).toBe(0);

    getState().goPage(1);
    expect(getState().currentPageIndex).toBe(1);

    // Out of bounds should be ignored
    getState().goPage(99);
    expect(getState().currentPageIndex).toBe(1);
  });

  it('should add a new page', () => {
    const { getState } = store;
    expect(getState().pages).toHaveLength(1);

    getState().addPage();
    expect(getState().pages).toHaveLength(2);
    expect(getState().currentPageIndex).toBe(1);
  });

  it('should delete current page (minimum 1 page)', () => {
    const { getState } = store;
    // Only 1 page — should not delete
    getState().deletePage();
    expect(getState().pages).toHaveLength(1);

    // Add a page then delete
    getState().addPage();
    expect(getState().pages).toHaveLength(2);
    getState().goPage(1);
    getState().deletePage();
    expect(getState().pages).toHaveLength(1);
    expect(getState().currentPageIndex).toBe(0);
  });

  it('should duplicate current page', () => {
    const { getState, setState } = store;
    // Add an element to the current page
    const page = { ...getState().pages[0], elements: [createTestElement()] };
    setState({ pages: [page] });

    getState().duplicatePage();
    expect(getState().pages).toHaveLength(2);
    expect(getState().currentPageIndex).toBe(1);
    // The cloned page should have "(Salinan)" label
    expect(getState().pages[1].label).toContain('Salinan');
  });

  it('should set page label', () => {
    const { getState } = store;
    getState().setPageLabel('New Label');
    expect(getState().pages[0].label).toBe('New Label');
  });

  it('should reorder pages', () => {
    const { getState, setState } = store;
    setState({
      pages: [createTestPage('A'), createTestPage('B'), createTestPage('C')],
    });
    getState().reorderPage(0, 2);
    expect(getState().pages.map(p => p.label)).toEqual(['B', 'C', 'A']);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. ELEMENT SLICE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Element Slice', () => {
  let store: ReturnType<typeof create<CanvaState>>;

  beforeEach(() => {
    const initialState = createInitialState();
    store = create<CanvaState>()(subscribeWithSelector((...a) => ({
      ...initialState,
      ...createHistorySlice(...a),
      ...createPageSlice(...a),
      ...createElementSlice(...a),
      ...createUISlice(...a),
      ...createBackgroundSlice(...a),
    })));
  });

  it('should add an element', () => {
    const { getState } = store;
    expect(getState().pages[0].elements).toHaveLength(0);

    getState().addElement('teks');
    expect(getState().pages[0].elements).toHaveLength(1);
    expect(getState().pages[0].elements[0].type).toBe('teks');
    expect(getState().selectedElId).toBeTruthy();
  });

  it('should select an element', () => {
    const { getState, setState } = store;
    const el = createTestElement('el-test');
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
    });

    getState().selectElement('el-test');
    expect(getState().selectedElId).toBe('el-test');
    expect(getState().selectedElIds).toEqual(['el-test']);

    // Deselect
    getState().selectElement(null);
    expect(getState().selectedElId).toBeNull();
  });

  it('should toggle element selection (multi-select)', () => {
    const { getState, setState } = store;
    const el1 = createTestElement('el-1');
    const el2 = createTestElement('el-2');
    setState({
      pages: [{ ...getState().pages[0], elements: [el1, el2] }],
    });

    // Select first
    getState().toggleElementSelection('el-1');
    expect(getState().selectedElIds).toContain('el-1');

    // Select second
    getState().toggleElementSelection('el-2');
    expect(getState().selectedElIds).toContain('el-2');
    expect(getState().selectedElIds).toHaveLength(2);

    // Deselect first
    getState().toggleElementSelection('el-1');
    expect(getState().selectedElIds).not.toContain('el-1');
    expect(getState().selectedElIds).toContain('el-2');
  });

  it('should update an element', () => {
    const { getState, setState } = store;
    const el = createTestElement('el-update');
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
    });

    getState().updateElement('el-update', { x: 50, y: 60 });
    expect(getState().pages[0].elements[0].x).toBe(50);
    expect(getState().pages[0].elements[0].y).toBe(60);
  });

  it('should delete an element', () => {
    const { getState, setState } = store;
    const el = createTestElement('el-del');
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
      selectedElId: 'el-del',
      selectedElIds: ['el-del'],
    });

    getState().deleteElement('el-del');
    expect(getState().pages[0].elements).toHaveLength(0);
    expect(getState().selectedElId).toBeNull();
  });

  it('should copy and paste elements', () => {
    const { getState, setState } = store;
    const el = createTestElement('el-copy', 'teks');
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
      selectedElId: 'el-copy',
      selectedElIds: ['el-copy'],
    });

    getState().copySelected();
    expect(getState()._clipboard).toHaveLength(1);

    getState().pasteElements();
    expect(getState().pages[0].elements).toHaveLength(2);
    // Pasted element should have a new ID
    expect(getState().pages[0].elements[1].id).not.toBe('el-copy');
    // Pasted element should be offset
    expect(getState().pages[0].elements[1].x).toBeGreaterThan(el.x);
  });

  it('should move element z-order', () => {
    const { getState, setState } = store;
    const el1 = createTestElement('el-z1');
    const el2 = createTestElement('el-z2');
    setState({
      pages: [{ ...getState().pages[0], elements: [el1, el2] }],
    });

    // el1 is at index 0, el2 at index 1
    // Move el1 up (swap with el2)
    getState().moveElementZ('el-z1', 'up');
    expect(getState().pages[0].elements[0].id).toBe('el-z2');
    expect(getState().pages[0].elements[1].id).toBe('el-z1');
  });

  it('should toggle element visibility', () => {
    const { getState, setState } = store;
    const el = createTestElement('el-vis');
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
    });

    expect(getState().pages[0].elements[0].hidden).toBeFalsy();
    getState().toggleElementVisibility('el-vis');
    expect(getState().pages[0].elements[0].hidden).toBe(true);
    getState().toggleElementVisibility('el-vis');
    expect(getState().pages[0].elements[0].hidden).toBe(false);
  });

  it('should select all elements', () => {
    const { getState, setState } = store;
    const el1 = createTestElement('el-a1');
    const el2 = createTestElement('el-a2');
    setState({
      pages: [{ ...getState().pages[0], elements: [el1, el2] }],
    });

    getState().selectAllElements();
    expect(getState().selectedElIds).toHaveLength(2);
  });

  it('should clear selection', () => {
    const { getState, setState } = store;
    const el = createTestElement('el-clr');
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
      selectedElId: 'el-clr',
      selectedElIds: ['el-clr'],
    });

    getState().clearSelection();
    expect(getState().selectedElId).toBeNull();
    expect(getState().selectedElIds).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. HISTORY SLICE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('History Slice', () => {
  let store: ReturnType<typeof create<CanvaState>>;

  beforeEach(() => {
    const initialState = createInitialState();
    store = create<CanvaState>()(subscribeWithSelector((...a) => ({
      ...initialState,
      ...createHistorySlice(...a),
      ...createPageSlice(...a),
      ...createElementSlice(...a),
      ...createUISlice(...a),
      ...createBackgroundSlice(...a),
    })));
  });

  it('should push history snapshots', () => {
    const { getState } = store;
    expect(getState()._history).toHaveLength(0);
    expect(getState()._historyIdx).toBe(-1);

    getState()._pushHistory();
    expect(getState()._history).toHaveLength(1);
    expect(getState()._historyIdx).toBe(0);
  });

  it('should undo to previous state', () => {
    const { getState } = store;
    // Push initial state, then change something
    getState()._pushHistory();
    getState().setPageLabel('Modified');

    // Push the modified state
    getState()._pushHistory();
    expect(getState().pages[0].label).toBe('Modified');

    // Undo should restore previous label
    getState().undo();
    expect(getState()._historyIdx).toBe(0);
  });

  it('should redo to next state', () => {
    const { getState } = store;
    getState()._pushHistory();
    getState().setPageLabel('Modified');
    getState()._pushHistory();
    getState().undo();

    // Now redo
    getState().redo();
    expect(getState()._historyIdx).toBe(1);
  });

  it('should report canUndo and canRedo correctly', () => {
    const { getState } = store;
    expect(getState().canUndo()).toBe(false);
    expect(getState().canRedo()).toBe(false);

    getState()._pushHistory();
    // After one push, _historyIdx is 0, so canUndo checks _historyIdx > 0 which is false
    // We need two pushes to be able to undo
    expect(getState()._historyIdx).toBe(0);
    expect(getState().canUndo()).toBe(false); // Can't undo with only one snapshot
    expect(getState().canRedo()).toBe(false);

    // Push again
    getState()._pushHistory();
    expect(getState()._historyIdx).toBe(1);
    expect(getState().canUndo()).toBe(true); // Now can undo to first snapshot
  });

  it('should not exceed MAX_HISTORY (50)', () => {
    const { getState } = store;
    for (let i = 0; i < 55; i++) {
      getState()._pushHistory();
    }
    expect(getState()._history.length).toBeLessThanOrEqual(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. UI SLICE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('UI Slice', () => {
  let store: ReturnType<typeof create<CanvaState>>;

  beforeEach(() => {
    const initialState = createInitialState();
    store = create<CanvaState>()(subscribeWithSelector((...a) => ({
      ...initialState,
      ...createHistorySlice(...a),
      ...createPageSlice(...a),
      ...createElementSlice(...a),
      ...createUISlice(...a),
      ...createBackgroundSlice(...a),
    })));
  });

  it('should set tool', () => {
    const { getState } = store;
    expect(getState().tool).toBe('select');
    getState().setTool('text');
    expect(getState().tool).toBe('text');
  });

  it('should set left tab', () => {
    const { getState } = store;
    expect(getState().leftTab).toBe('halaman');
    getState().setLeftTab('sisipkan');
    expect(getState().leftTab).toBe('sisipkan');
  });

  it('should toggle left panel', () => {
    const { getState } = store;
    expect(getState().leftPanelOpen).toBe(true);
    getState().toggleLeftPanel();
    expect(getState().leftPanelOpen).toBe(false);
  });

  it('should toggle right panel', () => {
    const { getState } = store;
    expect(getState().rightPanelOpen).toBe(true);
    getState().toggleRightPanel();
    expect(getState().rightPanelOpen).toBe(false);
  });

  it('should toggle grid', () => {
    const { getState } = store;
    expect(getState().showGrid).toBe(false);
    getState().toggleGrid();
    expect(getState().showGrid).toBe(true);
  });

  it('should set grid size with clamping', () => {
    const { getState } = store;
    getState().setGridSize(10);
    expect(getState().gridSize).toBe(10);

    // Clamp below minimum
    getState().setGridSize(1);
    expect(getState().gridSize).toBe(2);

    // Clamp above maximum
    getState().setGridSize(25);
    expect(getState().gridSize).toBe(20);
  });

  it('should toggle snap', () => {
    const { getState } = store;
    expect(getState().snapEnabled).toBe(true);
    getState().toggleSnap();
    expect(getState().snapEnabled).toBe(false);
  });

  it('should snap values when snap is enabled', () => {
    const { getState } = store;
    expect(getState().snapEnabled).toBe(true);
    expect(getState().snapValue(7)).toBe(5); // Snap to grid size 5
    expect(getState().snapValue(8)).toBe(10);
    expect(getState().snapValue(0)).toBe(0);
  });

  it('should not snap values when snap is disabled', () => {
    const { getState } = store;
    getState().toggleSnap();
    expect(getState().snapEnabled).toBe(false);
    expect(getState().snapValue(7)).toBe(7);
  });

  it('should set zoom with clamping', () => {
    const { getState } = store;
    getState().setZoom(1.5);
    expect(getState().zoom).toBe(1.5);

    // Below minimum
    getState().setZoom(0.1);
    expect(getState().zoom).toBe(0.25);

    // Above maximum
    getState().setZoom(5);
    expect(getState().zoom).toBe(3);
  });

  it('should set ratio', () => {
    const { getState } = store;
    getState().setRatio('9:16');
    expect(getState().ratioId).toBe('9:16');
  });

  it('should clear the stage', () => {
    const { getState, setState } = store;
    const el = createTestElement();
    setState({
      pages: [{ ...getState().pages[0], elements: [el] }],
    });
    expect(getState().pages[0].elements).toHaveLength(1);

    getState().clearStage();
    expect(getState().pages[0].elements).toHaveLength(0);
    expect(getState().selectedElId).toBeNull();
  });

  it('should select a block (single select)', () => {
    const { getState } = store;
    getState().selectBlock('block-1', 'def-box');
    expect(getState().selectedBlockId).toBe('block-1');
    expect(getState().selectedBlockType).toBe('def-box');
    expect(getState().selectedBlockIds).toEqual(['block-1']);
    // Should clear element selection
    expect(getState().selectedElId).toBeNull();
  });

  it('should clear block selection', () => {
    const { getState } = store;
    getState().selectBlock('block-1', 'def-box');
    getState().selectBlock(null);
    expect(getState().selectedBlockId).toBeNull();
    expect(getState().selectedBlockIds).toEqual([]);
  });

  it('should support multi-select for blocks', () => {
    const { getState } = store;
    getState().selectBlock('block-1', 'def-box');
    getState().selectBlock('block-2', 'nc-grid', true);
    expect(getState().selectedBlockIds).toContain('block-1');
    expect(getState().selectedBlockIds).toContain('block-2');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. BACKGROUND SLICE TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Background Slice', () => {
  let store: ReturnType<typeof create<CanvaState>>;

  beforeEach(() => {
    const initialState = createInitialState();
    store = create<CanvaState>()(subscribeWithSelector((...a) => ({
      ...initialState,
      ...createHistorySlice(...a),
      ...createPageSlice(...a),
      ...createElementSlice(...a),
      ...createUISlice(...a),
      ...createBackgroundSlice(...a),
    })));
  });

  it('should set background color', () => {
    const { getState } = store;
    expect(getState().pages[0].bgColor).toBe('#1e293b');
    getState().setBgColor('#ff0000');
    expect(getState().pages[0].bgColor).toBe('#ff0000');
  });

  it('should set overlay value', () => {
    const { getState } = store;
    expect(getState().pages[0].overlay).toBe(20);
    getState().setOverlay(50);
    expect(getState().pages[0].overlay).toBe(50);
  });

  it('should update nav config', () => {
    const { getState } = store;
    expect(getState().pages[0].navConfig.showNavbar).toBe(true);
    getState().updateNavConfig({ showNavbar: false });
    expect(getState().pages[0].navConfig.showNavbar).toBe(false);
    // Other fields should be preserved
    expect(getState().pages[0].navConfig.showPrevNext).toBe(true);
  });

  it('should update screen background on schema pages', () => {
    const { getState, setState } = store;
    // Add a schema to the page
    setState({
      pages: [{
        ...getState().pages[0],
        schema: {
          id: 'page-test',
          templateType: 'materi',
          blocks: [],
          background: { type: 'solid', color1: 'bg' },
        },
      }],
    });

    getState().updateScreenBackground({ color1: 'c', color2: 'p' });
    const page = getState().pages[0];
    expect(page.schema).toBeDefined();
    expect(page.schema!.background).toBeDefined();
    expect(page.schema!.background!.color1).toBe('c');
    expect(page.schema!.background!.color2).toBe('p');
  });

  it('should set schema theme ID', () => {
    const { getState } = store;
    getState().setSchemaThemeId('ocean');
    expect(getState().pages[0].templateData.schemaThemeId).toBe('ocean');
  });

  it('should set palette mapping', () => {
    const { getState, setState } = store;
    // Add a color palette to the page
    setState({
      pages: [{
        ...getState().pages[0],
        colorPalette: {
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
          mapping: {} as Record<string, string>,
        },
      }],
    });

    getState().setPaletteMapping('--y', 0);
    expect(getState().pages[0].colorPalette!.mapping['--y']).toBe('#ff0000');

    getState().setPaletteMapping('--c', 1);
    expect(getState().pages[0].colorPalette!.mapping['--c']).toBe('#00ff00');
  });
});
