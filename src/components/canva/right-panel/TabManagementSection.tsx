'use client';

import React, { useState } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getTabIcon, TAB_ICON_MAP, BLOCK_TYPE_TAB_ICON } from '@/lib/canva-icon-maps';
import { Plus, Trash2, Edit3, Check, X, Wand2, ChevronDown, ChevronRight } from 'lucide-react';
import type { TabDefinition } from '@/core/schema/types';

// ═══════════════════════════════════════════════════════════════
// TAB MANAGEMENT SECTION — Full tab CRUD in the right panel
// ═══════════════════════════════════════════════════════════════
// Allows add/remove/rename/icon-pick/auto-cluster/block-assign.
// ═══════════════════════════════════════════════════════════════

export default function TabManagementSection() {
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const pages = useCanvaStore(s => s.pages);
  const addSceneTab = useCanvaStore(s => s.addSceneTab);
  const removeSceneTab = useCanvaStore(s => s.removeSceneTab);
  const renameSceneTab = useCanvaStore(s => s.renameSceneTab);
  const setSceneTabIcon = useCanvaStore(s => s.setSceneTabIcon);
  const assignBlockToTab = useCanvaStore(s => s.assignBlockToTab);
  const removeBlockFromTab = useCanvaStore(s => s.removeBlockFromTab);
  const autoClusterTabs = useCanvaStore(s => s.autoClusterTabs);

  const page = pages[currentPageIndex];
  const tabs = page?.schema?.tabs || [];
  const blocks = page?.schema?.blocks || [];

  // ── Local UI state ─────────────────────────────────────────────
  const [newTabLabel, setNewTabLabel] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [iconPickerTabId, setIconPickerTabId] = useState<string | null>(null);
  const [expandedTabId, setExpandedTabId] = useState<string | null>(null);

  // ── Add new tab ────────────────────────────────────────────────
  const handleAddTab = () => {
    if (!newTabLabel.trim()) return;
    addSceneTab(newTabLabel.trim(), 'LayoutGrid');
    setNewTabLabel('');
  };

  // ── Start renaming ─────────────────────────────────────────────
  const startRename = (tab: TabDefinition) => {
    setEditingTabId(tab.id);
    setEditLabel(tab.label);
  };

  const confirmRename = () => {
    if (editingTabId && editLabel.trim()) {
      renameSceneTab(editingTabId, editLabel.trim());
    }
    setEditingTabId(null);
    setEditLabel('');
  };

  const cancelRename = () => {
    setEditingTabId(null);
    setEditLabel('');
  };

  // ── Icon names list ────────────────────────────────────────────
  const iconNames = Object.keys(TAB_ICON_MAP);

  return (
    <div className="px-3 py-3 border-b border-app-border/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-wider">
          Tab Navigasi
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={autoClusterTabs}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold bg-app-accent/10 text-app-accent hover:bg-app-accent/20 transition-colors"
            title="Otomatis kelompokkan blok ke tab"
          >
            <Wand2 size={10} />
            Auto
          </button>
        </div>
      </div>

      {/* Add new tab input */}
      <div className="flex items-center gap-1.5 mb-3">
        <input
          type="text"
          value={newTabLabel}
          onChange={(e) => setNewTabLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTab()}
          placeholder="Nama tab baru..."
          className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-app-border bg-app-bg text-[10px] text-app-primary placeholder:text-app-muted/50 focus:outline-none focus:ring-1 focus:ring-app-accent/50"
        />
        <button
          onClick={handleAddTab}
          disabled={!newTabLabel.trim()}
          className="flex items-center justify-center w-7 h-7 rounded-md bg-app-accent/10 text-app-accent hover:bg-app-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Tambah tab"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Tab list */}
      {tabs.length === 0 ? (
        <div className="text-[9px] text-app-muted text-center py-3">
          Belum ada tab. Tambah tab baru atau gunakan Auto.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const IconComponent = getTabIcon(tab.icon);
            const isEditing = editingTabId === tab.id;
            const isExpanded = expandedTabId === tab.id;
            const showIconPicker = iconPickerTabId === tab.id;

            return (
              <div key={tab.id} className="rounded-lg border border-app-border/50 overflow-hidden">
                {/* Tab header row */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-app-elevated/30">
                  {/* Icon — click to change */}
                  <button
                    onClick={() => setIconPickerTabId(showIconPicker ? null : tab.id)}
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-app-elevated/50 transition-colors"
                    title="Ganti ikon"
                  >
                    <IconComponent size={12} className="text-app-accent" />
                  </button>

                  {/* Label — inline rename */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                        autoFocus
                        className="flex-1 min-w-0 px-1.5 py-0.5 rounded border border-app-accent/50 bg-app-bg text-[10px] text-app-primary focus:outline-none"
                      />
                      <button onClick={confirmRename} className="text-emerald-400 hover:text-emerald-300">
                        <Check size={10} />
                      </button>
                      <button onClick={cancelRename} className="text-red-400 hover:text-red-300">
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <span
                      className="flex-1 min-w-0 text-[10px] font-semibold text-app-primary truncate cursor-pointer hover:text-app-accent transition-colors"
                      onDoubleClick={() => startRename(tab)}
                      title="Klik dua kali untuk mengubah nama"
                    >
                      {tab.label}
                    </span>
                  )}

                  {/* Block count badge */}
                  <span className="text-[8px] text-app-muted font-bold px-1.5 py-0.5 rounded-full bg-app-elevated/50">
                    {tab.blockIds.length}
                  </span>

                  {/* Expand/collapse block list */}
                  <button
                    onClick={() => setExpandedTabId(isExpanded ? null : tab.id)}
                    className="text-app-muted hover:text-app-secondary transition-colors"
                    title={isExpanded ? 'Tutup' : 'Lihat blok'}
                  >
                    {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                  </button>

                  {/* Edit + Delete */}
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => startRename(tab)}
                        className="text-app-muted hover:text-app-accent transition-colors"
                        title="Ubah nama"
                      >
                        <Edit3 size={9} />
                      </button>
                      <button
                        onClick={() => removeSceneTab(tab.id)}
                        className="text-app-muted hover:text-red-400 transition-colors"
                        title="Hapus tab"
                      >
                        <Trash2 size={9} />
                      </button>
                    </>
                  )}
                </div>

                {/* Icon picker dropdown */}
                {showIconPicker && (
                  <div className="px-2 py-1.5 bg-app-elevated/20 border-t border-app-border/30">
                    <div className="flex flex-wrap gap-1">
                      {iconNames.map((name) => {
                        const Ic = TAB_ICON_MAP[name];
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              setSceneTabIcon(tab.id, name);
                              setIconPickerTabId(null);
                            }}
                            className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                              tab.icon === name
                                ? 'bg-app-accent/20 text-app-accent'
                                : 'hover:bg-app-elevated/50 text-app-muted'
                            }`}
                            title={name}
                          >
                            <Ic size={11} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expanded: block assignment list */}
                {isExpanded && (
                  <div className="px-2 py-1.5 bg-app-elevated/10 border-t border-app-border/30">
                    {blocks.length === 0 ? (
                      <div className="text-[8px] text-app-muted text-center py-1">
                        Tidak ada blok di halaman ini
                      </div>
                    ) : (
                      <div className="space-y-0.5 max-h-32 overflow-y-auto">
                        {blocks.map((block) => {
                          const blockId = block.id;
                          if (!blockId) return null;
                          const isAssigned = tab.blockIds.includes(blockId);
                          return (
                            <button
                              key={blockId}
                              onClick={() => {
                                if (isAssigned) {
                                  removeBlockFromTab(tab.id, blockId);
                                } else {
                                  assignBlockToTab(tab.id, blockId);
                                }
                              }}
                              className={`flex items-center gap-1.5 w-full px-1.5 py-0.5 rounded text-[9px] transition-colors ${
                                isAssigned
                                  ? 'bg-app-accent/10 text-app-accent font-bold'
                                  : 'text-app-muted hover:bg-app-elevated/30'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${isAssigned ? 'bg-app-accent' : 'bg-app-border'}`} />
                              <span className="truncate">{block.type} {blockId ? `(${blockId.slice(0, 8)})` : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
