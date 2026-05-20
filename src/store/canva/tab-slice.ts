// ═══════════════════════════════════════════════════════════════════
// CANVA STORE — Tab Navigation Slice (FASE 10)
// ═══════════════════════════════════════════════════════════════════
// Manages tab icon navigation on schema-driven pages.
// Tabs let users filter visible blocks by category.
// activeTabId is EPHEMERAL — never persisted.
// All tab CRUD uses _pushHistory() for undo/redo safety.
// ═══════════════════════════════════════════════════════════════════

import type { StateCreator } from 'zustand';
import type { CanvaState } from './types';
import type { TabDefinition } from '@/core/schema/types';
import { BLOCK_TYPE_TAB_ICON } from '@/lib/canva-icon-maps';

// ── Slice Type ──────────────────────────────────────────────────

export type TabSlice = Pick<
  CanvaState,
  | 'activeTabId'
  | 'setActiveTabId'
  | 'addSceneTab'
  | 'removeSceneTab'
  | 'renameSceneTab'
  | 'setSceneTabIcon'
  | 'assignBlockToTab'
  | 'removeBlockFromTab'
  | 'autoClusterTabs'
>;

// ── Helper: Generate unique tab ID ──────────────────────────────

function generateTabId(): string {
  return 'tab_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// ── Slice Implementation ────────────────────────────────────────

export const createTabSlice: StateCreator<CanvaState, [], [], TabSlice> = (set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  activeTabId: null,

  // ── Set active tab ────────────────────────────────────────────
  // Ephemeral — does NOT push history (no document change).
  setActiveTabId: (tabId) => {
    set({ activeTabId: tabId });
  },

  // ── Add a new tab ─────────────────────────────────────────────
  addSceneTab: (label, icon) => {
    const { pages, currentPageIndex, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const newTab: TabDefinition = {
      id: generateTabId(),
      label,
      icon,
      blockIds: [],
    };

    const updatedTabs = [...(page.schema.tabs || []), newTab];

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
    });
  },

  // ── Remove a tab ──────────────────────────────────────────────
  removeSceneTab: (tabId) => {
    const { pages, currentPageIndex, activeTabId, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const updatedTabs = (page.schema.tabs || []).filter(t => t.id !== tabId);

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
      activeTabId: activeTabId === tabId ? null : activeTabId,
    });
  },

  // ── Rename a tab ──────────────────────────────────────────────
  renameSceneTab: (tabId, label) => {
    const { pages, currentPageIndex, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const updatedTabs = (page.schema.tabs || []).map(t =>
      t.id === tabId ? { ...t, label } : t
    );

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
    });
  },

  // ── Change a tab's icon ───────────────────────────────────────
  setSceneTabIcon: (tabId, icon) => {
    const { pages, currentPageIndex, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const updatedTabs = (page.schema.tabs || []).map(t =>
      t.id === tabId ? { ...t, icon } : t
    );

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
    });
  },

  // ── Assign a block to a tab ───────────────────────────────────
  assignBlockToTab: (tabId, blockId) => {
    const { pages, currentPageIndex, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const updatedTabs = (page.schema.tabs || []).map(t => {
      if (t.id !== tabId) return t;
      // Avoid duplicates
      if (t.blockIds.includes(blockId)) return t;
      return { ...t, blockIds: [...t.blockIds, blockId] };
    });

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
    });
  },

  // ── Remove a block from a tab ─────────────────────────────────
  removeBlockFromTab: (tabId, blockId) => {
    const { pages, currentPageIndex, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const updatedTabs = (page.schema.tabs || []).map(t => {
      if (t.id !== tabId) return t;
      return { ...t, blockIds: t.blockIds.filter(id => id !== blockId) };
    });

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
    });
  },

  // ── Auto-cluster blocks into tabs by type ─────────────────────
  // Groups blocks by their block type and creates one tab per group.
  // Uses BLOCK_TYPE_TAB_ICON for default icon mapping.
  autoClusterTabs: () => {
    const { pages, currentPageIndex, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const blocks = page.schema.blocks;
    if (blocks.length === 0) return;

    // Group blocks by type
    const typeGroups = new Map<string, string[]>();
    for (const block of blocks) {
      const bType = block.type;
      if (!typeGroups.has(bType)) {
        typeGroups.set(bType, []);
      }
      const ids = typeGroups.get(bType)!;
      const blockId = block.id;
      if (blockId) ids.push(blockId);
    }

    // Create a tab per group
    const tabs: TabDefinition[] = [];
    for (const [bType, blockIds] of typeGroups) {
      const tab: TabDefinition = {
        id: generateTabId(),
        label: bType.charAt(0).toUpperCase() + bType.slice(1).replace(/-/g, ' '),
        icon: BLOCK_TYPE_TAB_ICON[bType] || 'LayoutGrid',
        blockIds,
      };
      tabs.push(tab);
    }

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs } }
          : p
      ),
    });
  },
});
