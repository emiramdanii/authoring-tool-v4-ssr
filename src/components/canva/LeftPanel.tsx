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

import HistoryPanel from './left-panel/HistoryPanel';
import AddBlockPanel from './left-panel/AddBlockPanel';
import dynamic from 'next/dynamic';

const TemplateGalleryPanel = dynamic(() => import('./left-panel/TemplateGalleryPanel'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-app-elevated/20 rounded-lg" />,
});

import { getAvailablePresets } from '@/core/engine/SchemaEngine';
import { ensurePageSchema } from '@/core/schema/ensure-schema';
import { getBlockDefinition } from '@/core/registry/SceneRegistry';

const PageTypeCreator = dynamic(() => import('./PageTypeCreator'), {
  ssr: false,
  loading: () => <div className="h-8 animate-pulse bg-app-elevated/20 rounded-lg" />,
});
const TemplateWizard = dynamic(() => import('./TemplateWizard'), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════════════════════════
// LEFT PANEL v6 — Icon Rail + Expandable Panel
// ═══════════════════════════════════════════════════════════════
// Structure:
//   [Icon Rail 56px] | [Expandable Content ~184px]
//   Always visible    | Shows tab content when expanded
// ═══════════════════════════════════════════════════════════════

export default function LeftPanel() {
  // Sync activeTab with store's leftTab — single source of truth
  const storeLeftTab = useCanvaStore(s => s.leftTab);
  const [activeTab, setActiveTab] = useState<LeftTab>(storeLeftTab);
  const [addBlockOpen, setAddBlockOpen] = useState(true);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Sync expanded state with store's leftPanelOpen
  const expanded = useCanvaStore(s => s.leftPanelOpen);
  const toggleLeftPanel = useCanvaStore(s => s.toggleLeftPanel);
  const teacherMode = useCanvaStore(s => s.teacherMode);
  const blockLabel = teacherMode ? 'Konten' : 'Block';

  // When store leftTab changes (e.g., from CommandPalette or Stage buttons),
  // sync local activeTab and open the panel if needed
  const prevStoreTab = useRef(storeLeftTab);
  useEffect(() => {
    if (storeLeftTab !== prevStoreTab.current) {
      prevStoreTab.current = storeLeftTab;
      setActiveTab(storeLeftTab as LeftTab);
      if (!expanded) toggleLeftPanel();
    }
  }, [storeLeftTab, expanded, toggleLeftPanel]);

  const handleTabChange = (tab: LeftTab) => {
    if (activeTab === tab && expanded) {
      // Clicking same tab collapses the panel
      toggleLeftPanel();
    } else {
      setActiveTab(tab);
      // Sync store so other components (CommandPalette, Stage) can read current tab
      useCanvaStore.getState().setLeftTab(tab);
      if (!expanded) toggleLeftPanel();
    }
  };

  return (
    <div className="flex h-full bg-silse-surface-container-lowest overflow-hidden">
      {/* Icon Rail — Always visible */}
      <IconRail activeTab={activeTab} onTabChange={handleTabChange} expanded={expanded} />

      {/* Expandable Content Panel */}
      <div
        className="overflow-hidden transition-[width] duration-200 ease-in-out border-r border-silse-outline-variant bg-silse-surface-container-low"
        style={{ width: expanded ? '224px' : '0px' }}
      >
        <div className="w-[224px] h-full flex flex-col overflow-hidden">
          {/* Header — SILSE v4 Workspace style */}
          <div className="px-4 py-3 border-b border-silse-outline-variant bg-silse-surface-container-low flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-[Plus_Jakarta_Sans] text-base font-bold text-silse-on-surface">Workspace</span>
              <button
                onClick={() => {
                  useCanvaStore.getState().setLeftTab('add-block');
                  if (!expanded) toggleLeftPanel();
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-silse-primary-container hover:bg-silse-surface-container-high transition-colors"
                aria-label="Tambah baru"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="text-[10px] font-bold text-silse-outline uppercase tracking-wider mt-1">
              {activeTab === 'pages' && 'SCENES'}
              {activeTab === 'add-block' && 'LIBRARY BLOCKS'}
              {activeTab === 'templates' && 'TEMPLATE'}
              {activeTab === 'history' && 'RIWAYAT'}
              {activeTab === 'settings' && 'PENGATURAN'}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar page-transition">
            <div className="p-3 space-y-3">
              {activeTab === 'pages' && (
                <>
                  <SceneList />
                  <AddSceneButton onOpenWizard={() => setWizardOpen(true)} />
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ADD SCENE BUTTON — + Scene with template dropdown
   ══════════════════════════════════════════════════════════════════ */

function AddSceneButton({ onOpenWizard }: { onOpenWizard: () => void }) {
  const addPage = useCanvaStore(s => s.addPage);
  const addTemplatePage = useCanvaStore(s => s.addTemplatePage);
  const loadSchemaPreset = useCanvaStore(s => s.loadSchemaPreset);
  const resetCanvas = useCanvaStore(s => s.resetCanvas);

  const availablePresets = getAvailablePresets();
  const presetInfo: Record<string, { label: string; icon: string; desc: string; subject: string }> = {
    // PPKn
    'hakikat-norma': { label: 'Hakikat Norma', icon: '📜', desc: 'Pertemuan 1 — PPKn Kelas VII', subject: 'PPKn' },
    'macam-norma': { label: 'Macam-Macam Norma', icon: '⚖️', desc: 'Pertemuan 2 — PPKn Kelas VII', subject: 'PPKn' },
    'perilaku-patuh': { label: 'Perilaku Patuh Norma', icon: '🛡️', desc: 'Pertemuan 3 — PPKn Kelas VII', subject: 'PPKn' },
    'nilai-pancasila': { label: 'Nilai-Nilai Pancasila', icon: '🏛️', desc: 'Pertemuan 4 — PPKn Kelas VII', subject: 'PPKn' },
    'bhinneka-tunggal-ika': { label: 'Bhinneka Tunggal Ika', icon: '🤝', desc: 'Pertemuan 5 — PPKn Kelas VII', subject: 'PPKn' },
    'ham-hak-kewajiban': { label: 'HAM & Kewajiban', icon: '✊', desc: 'Pertemuan 6 — PPKn Kelas VII', subject: 'PPKn' },
    'demokrasi-pancasila': { label: 'Demokrasi Pancasila', icon: '🗳️', desc: 'Pertemuan 7 — PPKn Kelas VII', subject: 'PPKn' },
    'globalisasi': { label: 'Globalisasi', icon: '🌍', desc: 'Pertemuan 8 — PPKn Kelas VII', subject: 'PPKn' },
    'misi-penjelajah-pancasila': { label: 'Misi Penjelajah Pancasila', icon: '🚀', desc: 'Pertemuan 9 — PPKn Kelas VII', subject: 'PPKn' },
    // IPA
    'sistem-pernapasan': { label: 'Sistem Pernapasan', icon: '🫁', desc: 'IPA Kelas VIII', subject: 'IPA' },
    // MTK
    'persamaan-linear': { label: 'Persamaan Linear', icon: '📐', desc: 'MTK Kelas VIII', subject: 'MTK' },
    // PJOK
    'gerak-dasar-lokomotor': { label: 'Gerak Dasar Lokomotor', icon: '🏃', desc: 'PJOK Kelas VII', subject: 'PJOK' },
    'permainan-bola-besar': { label: 'Permainan Bola Besar', icon: '⚽', desc: 'PJOK Kelas VII', subject: 'PJOK' },
    'kebugaran-jasmani': { label: 'Kebugaran Jasmani', icon: '💪', desc: 'PJOK Kelas VII', subject: 'PJOK' },
  };
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);

  const presetCategories = getPresetsGroupedByCategory();
  const categoryLabels: Record<string, string> = {
    utama: 'Halaman Utama',
    konten: 'Konten',
    interaktif: 'Interaktif',
    penutup: 'Penutup',
  };

  return (
    <div className="space-y-1.5">
      <button
        data-testid="add-blank-page-btn"
        onClick={() => { useCanvaStore.getState().addPage(); }}
        className="w-full py-2 rounded-xl border border-dashed border-app-border hover:border-app-accent/30 text-[11px] text-app-secondary hover:text-app-accent transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} />
        Halaman Kosong
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full py-1.5 rounded-xl text-[10px] gap-1 h-8">
            <FilePlus2 size={12} />
            + Dari Template
            <ChevronDown size={8} className="ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-60 border border-app-border shadow-md rounded-xl p-0 overflow-hidden max-h-80 overflow-y-auto"
        >
          {availablePresets.length > 0 && (() => {
            const subjectOrder = ['PPKn', 'IPA', 'MTK', 'PJOK'];
            const subjectLabels: Record<string, string> = {
              PPKn: 'PPKn — Pendidikan Pancasila',
              IPA: 'IPA — Ilmu Pengetahuan Alam',
              MTK: 'MTK — Matematika',
              PJOK: 'PJOK — Pendidikan Jasmani',
            };
            const grouped = subjectOrder
              .map(subj => ({
                subject: subj,
                presets: availablePresets.filter(id => (presetInfo[id]?.subject || 'Lainnya') === subj),
              }))
              .filter(g => g.presets.length > 0);
            // Also catch any presets not in known subjects
            const ungrouped = availablePresets.filter(id => !presetInfo[id]?.subject || !subjectOrder.includes(presetInfo[id].subject));
            if (ungrouped.length > 0) grouped.push({ subject: 'Lainnya', presets: ungrouped });

            return grouped.map((group, gi) => (
              <div key={group.subject}>
                <DropdownMenuLabel className="px-3 py-1.5 bg-app-info/10 border-b border-app-info/20 text-[9px] font-bold text-app-info uppercase tracking-wider">
                  {subjectLabels[group.subject] || group.subject}
                </DropdownMenuLabel>
                {group.presets.map(presetId => {
                  const info = presetInfo[presetId] || { label: presetId, icon: '📦', desc: 'Preset' };
                  return (
                    <DropdownMenuItem
                      key={presetId}
                      onClick={async () => {
                        setLoadingPreset(presetId);
                        await loadSchemaPreset(presetId);
                        setLoadingPreset(null);
                      }}
                      disabled={loadingPreset === presetId}
                      className="px-3 py-2 gap-2 cursor-pointer"
                    >
                      <span className="text-base">{info.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-app-info truncate">{info.label}</div>
                        <div className="text-[8px] text-app-muted">{info.desc}</div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                {gi < grouped.length - 1 && <DropdownMenuSeparator className="bg-app-border/30" />}
              </div>
            ));
          })()}

          <DropdownMenuSeparator className="bg-app-border/30" />
          {presetCategories.map(cat => (
            <div key={cat.category}>
              <DropdownMenuLabel className="px-3 py-1 text-[8px] font-bold text-app-muted uppercase tracking-wider">
                {categoryLabels[cat.category] || cat.category}
              </DropdownMenuLabel>
              {cat.presets.map(p => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => addTemplatePage(p.id as PageTemplateType)}
                  className="px-3 py-2 gap-2 cursor-pointer"
                >
                  <span className="text-base">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-app-primary truncate">{p.label}</div>
                    <div className="text-[8px] text-app-muted">{p.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={onOpenWizard}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-app-success/10 border border-app-success/20 hover:border-app-success/40 hover:bg-app-success/20 text-app-success text-[10px] font-bold transition-[transform,box-shadow,background-color] active:scale-95"
      >
        <Sparkles size={10} className="inline" />
        Buat dari Template Wizard
      </button>
    </div>
  );
}
