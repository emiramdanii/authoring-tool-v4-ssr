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
import { notifyMutation } from '@/lib/save-utils';

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
    notifyMutation();
  },

  // ── Remove a tab ──────────────────────────────────────────────
  // TAB-06 FIX: When a tab is removed, its blockIds are orphaned —
  // they still exist in schema.blocks but aren't in any tab's blockIds.
  // Under tab filtering (SchemaRenderer), orphaned blocks are excluded
  // because the filter only shows blocks in the active tab's blockIds.
  // Fix: add the removed tab's blockIds to all remaining tabs so the
  // blocks remain visible regardless of which tab is active.
  removeSceneTab: (tabId) => {
    const { pages, currentPageIndex, activeTabId, _pushHistory } = get();
    _pushHistory();

    const page = pages[currentPageIndex];
    if (!page?.schema) return;

    const removedTab = (page.schema.tabs || []).find(t => t.id === tabId);
    const removedBlockIds = removedTab?.blockIds || [];
    const updatedTabs = (page.schema.tabs || [])
      .filter(t => t.id !== tabId)
      .map(t => {
        // Reassign removed tab's blockIds to each remaining tab (deduped)
        if (removedBlockIds.length === 0) return t;
        const merged = [...t.blockIds];
        for (const bid of removedBlockIds) {
          if (!merged.includes(bid)) merged.push(bid);
        }
        return { ...t, blockIds: merged };
      });

    set({
      pages: pages.map((p, i) =>
        i === currentPageIndex
          ? { ...p, schema: { ...p.schema!, tabs: updatedTabs } }
          : p
      ),
      activeTabId: activeTabId === tabId ? null : activeTabId,
    });
    notifyMutation();
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
    notifyMutation();
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
    notifyMutation();
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
    notifyMutation();
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
    notifyMutation();
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
    notifyMutation();
  },
});
