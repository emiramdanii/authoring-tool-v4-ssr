'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  FilePlus2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import type { PageTemplateType } from './types';
import { RATIOS } from './types';
import { getPresetsGroupedByCategory, type PagePreset } from '@/core/preset/PagePresetRegistry';
import {
  TEMPLATE_BADGE_MAP,
  getModuleIcon,
  getGameIcon,
} from '@/lib/canva-icon-maps';
import { GAME_TYPES } from '@/lib/canva-constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconRail } from './left-panel/IconRail';
import type { LeftTab } from './types';
import { SceneList } from './left-panel/SceneList';
import { AddBlockSection } from './left-panel/AddBlockSection';
import { TemplateSection } from './left-panel/TemplateSection';
import { SettingsSection } from './left-panel/SettingsSection';
import { SchemaBlockTree } from './left-panel/SchemaBlockTree';

import HistoryPanel from './left-panel/HistoryPanel';
import AddBlockPanel from './left-panel/AddBlockPanel';
import dynamic from 'next/dynamic';

const TemplateGalleryPanel = dynamic(() => import('./left-panel/TemplateGalleryPanel'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-silse-surface-container-high/20 rounded-lg" />,
});

import { getAvailablePresets } from '@/core/engine/SchemaEngine';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';

const PageTypeCreator = dynamic(() => import('./PageTypeCreator'), {
  ssr: false,
  loading: () => <div className="h-8 animate-pulse bg-silse-surface-container-high/20 rounded-lg" />,
});
const TemplateWizard = dynamic(() => import('./TemplateWizard'), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// LEFT PANEL v9 — SILSE v4 Integrated Workspace Navigator
// ═══════════════════════════════════════════════════════════════
// Structure (SILSE v4 workspace_editor reference):
//   [Icon Rail w-16 (64px)] | [Content Panel flex-1]
//   bg-silse-surface-bright | Tab-switched content with Schema integration
//
// v9 changes:
//   - SchemaBlockTree integrated into Pages tab
//   - Better section labels with Material Symbols
//   - Collapsible schema block tree per page
//   - Cleaner visual hierarchy
// ═══════════════════════════════════════════════════════════════

export default function LeftPanel() {
  // Sync activeTab with store's leftTab — single source of truth
  const storeLeftTab = useCanvaStore(s => s.leftTab);
  const [activeTab, setActiveTab] = useState<LeftTab>(storeLeftTab);
  const [addBlockOpen, setAddBlockOpen] = useState(true);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const teacherMode = useCanvaStore(s => s.teacherMode);
  const blockLabel = teacherMode ? 'Konten' : 'Block';

  // When store leftTab changes (e.g., from CommandPalette or Stage buttons),
  // sync local activeTab
  const prevStoreTab = useRef(storeLeftTab);
  useEffect(() => {
    if (storeLeftTab !== prevStoreTab.current) {
      prevStoreTab.current = storeLeftTab;
      setActiveTab(storeLeftTab as LeftTab);
    }
  }, [storeLeftTab]);

  const handleTabChange = (tab: LeftTab) => {
    setActiveTab(tab);
    // Sync store so other components (CommandPalette, Stage) can read current tab
    useCanvaStore.getState().setLeftTab(tab);
  };

  return (
    <div className="flex h-full bg-silse-surface-container-low overflow-hidden">
      {/* ── Icon Rail — SILSE v4: w-16, bg-surface-bright, border-r ── */}
      <IconRail activeTab={activeTab} onTabChange={handleTabChange} expanded />

      {/* ── Content Panel — flex-1, scrollable ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-silse-surface-container-low">
        {/* Header — SILSE v4: Workspace + add_circle button */}
        <div className="px-3 py-2.5 flex items-center justify-between flex-shrink-0 border-b border-silse-outline-variant/40">
          <h3
            className="text-sm font-bold text-silse-on-surface tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
          >
            Workspace
          </h3>
          <button
            onClick={() => handleTabChange('add-block')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-silse-primary hover:bg-silse-primary-container/20 transition-colors"
            aria-label="Tambah baru"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3 space-y-3">
            {/* ── Pages tab: Scenes + Schema Blocks + Library Blocks ── */}
            {activeTab === 'pages' && (
              <>
                {/* Scene Navigation Section */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="material-symbols-outlined text-silse-outline" style={{ fontSize: '14px' }}>layers</span>
                    <span className="text-[10px] uppercase tracking-widest text-silse-outline font-bold">
                      Scenes
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <SceneList />
                  </div>
                </div>

                {/* Schema Block Tree — integrated per page */}
                <SchemaBlockTree />

                {/* Library Blocks Section — 2x2 dashed grid */}
                <div className="pt-2 border-t border-silse-outline-variant/40">
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <span className="material-symbols-outlined text-silse-outline" style={{ fontSize: '14px' }}>grid_view</span>
                    <span className="text-[10px] uppercase tracking-widest text-silse-outline font-bold">
                      Quick Add
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleTabChange('add-block')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-silse-outline-variant/60 hover:bg-silse-primary/5 hover:border-silse-primary/30 transition-all group"
                    >
                      <span className="material-symbols-outlined text-silse-primary mb-0.5" style={{ fontSize: '18px' }}>menu_book</span>
                      <span className="text-[10px] font-semibold text-silse-on-surface-variant group-hover:text-silse-primary">Materi</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('add-block')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-silse-outline-variant/60 hover:bg-silse-tertiary/5 hover:border-silse-tertiary/30 transition-all group"
                    >
                      <span className="material-symbols-outlined text-silse-tertiary mb-0.5" style={{ fontSize: '18px' }}>quiz</span>
                      <span className="text-[10px] font-semibold text-silse-on-surface-variant group-hover:text-silse-tertiary">Kuis</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('add-block')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-silse-outline-variant/60 hover:bg-silse-secondary/5 hover:border-silse-secondary/30 transition-all group"
                    >
                      <span className="material-symbols-outlined text-silse-secondary mb-0.5" style={{ fontSize: '18px' }}>sports_esports</span>
                      <span className="text-[10px] font-semibold text-silse-on-surface-variant group-hover:text-silse-secondary">Game</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('templates')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-silse-outline-variant/60 hover:bg-silse-on-surface-variant/5 hover:border-silse-on-surface-variant/30 transition-all group"
                    >
                      <span className="material-symbols-outlined text-silse-on-surface-variant mb-0.5" style={{ fontSize: '18px' }}>dashboard</span>
                      <span className="text-[10px] font-semibold text-silse-on-surface-variant">Custom</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'add-block' && (
              <AddBlockSection addBlockOpen={addBlockOpen} onToggle={() => setAddBlockOpen(!addBlockOpen)} />
            )}

            {activeTab === 'templates' && (
              <>
                <TemplateSection galleryOpen={templateGalleryOpen} onToggle={() => setTemplateGalleryOpen(!templateGalleryOpen)} />
                <PageTypeCreator />
              </>
            )}

            {activeTab === 'history' && (
              <HistoryPanel />
            )}

            {activeTab === 'settings' && (
              <SettingsSection />
            )}
          </div>
        </div>

        {/* Template Wizard Modal */}
        <TemplateWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      </div>
    </div>
  );
}
