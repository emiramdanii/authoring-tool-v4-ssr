'use client';

import { useState, useEffect } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import ElementProperties from './ElementProperties';
import BackgroundSection from './BackgroundSection';
import PaletteSection from './PaletteSection';
import NavigationSection from './NavigationSection';
import PageSettingsSection from './PageSettingsSection';
import BlockPropertiesPanel from './BlockPropertiesPanel';
import AlignmentTools from './AlignmentTools';
import PageInfo from './PageInfo';
import TabManagementSection from './TabManagementSection';
import LayerPanel from '../left-panel/LayerPanel';
import { Layers, Zap, Box, Sparkles, Settings2, MousePointer2, Hand, SlidersHorizontal } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import { isEnabled } from '@/config/feature-flags';
import dynamic from 'next/dynamic';

// Lazy-loaded: AI sections are heavy (API calls, complex UI, code editors)
const AIAssistantSection = dynamic(() => import('./AIAssistantSection'), {
  ssr: false,
  loading: () => (
    <div className="p-3 space-y-2">
      <div className="h-4 w-24 animate-pulse bg-silse-surface-container-high rounded" />
      <div className="h-20 animate-pulse bg-silse-surface-container-high rounded-xl" />
    </div>
  ),
});

const AIRefineSection = dynamic(() => import('../ai-assistant/AIRefineSection'), {
  ssr: false,
  loading: () => (
    <div className="p-3 space-y-2">
      <div className="h-4 w-20 animate-pulse bg-silse-surface-container-high rounded" />
      <div className="h-16 animate-pulse bg-silse-surface-container-high rounded-xl" />
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════
// RIGHT PANEL v3 — SILSE v4 MD3 Properties Panel
// ═══════════════════════════════════════════════════════════════
// SILSE v4 MD3 spec:
//   - Full width (resizable via parent)
//   - Header: px-4 py-3, border-b, bg-silse-surface-container-lowest, tune icon + Properties + close
//   - Tab bar: MD3-style segmented buttons with pill indicator
//   - Content: p-4 space-y-4
//   - Footer: px-4 py-3 bg-silse-surface-container-low with delete button (rounded-full)
//
// Schema panel fix:
//   - SchemaDrivenEditor now properly wired for schema blocks
//   - BlockPropertiesPanel routes to GuidedFormEditor or SchemaDrivenEditor
// ═══════════════════════════════════════════════════════════════

type RightPanelTab = 'properties' | 'ai' | 'layer';

export default function RightPanel() {
  const rightPanelOpen = useCanvaStore(s => s.rightPanelOpen);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const selectedElId = useCanvaStore(s => s.selectedElId);
  const selectedElIds = useCanvaStore(s => s.selectedElIds);
  const { isSederhana } = useTeacherMode();
  const blockLabel = isSederhana ? 'Konten' : 'Block';

  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

  const aiEnabled = isEnabled('aiAssistant');

  // Page data hook must be called before any early return (Rules of Hooks)
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const isSchemaDriven = !!page?.schema;

  // Teacher-mode aware tab configuration
  const TABS: { id: RightPanelTab; label: string; icon: string }[] = [
    { id: 'properties', label: 'Properti', icon: 'tune' },
    ...(aiEnabled ? [{ id: 'ai' as RightPanelTab, label: 'AI', icon: 'auto_awesome' }] : []),
    // Layer tab only in advanced mode
    ...(!isSederhana ? [{ id: 'layer' as RightPanelTab, label: 'Layer', icon: 'layers' }] : []),
  ];

  // Auto-correct: if teacher mode is on and layer tab was active, switch to properties
  useEffect(() => {
    if (isSederhana && activeTab === 'layer') {
      setActiveTab('properties');
    }
  }, [isSederhana, activeTab]);

  // Determine context mode
  const hasBlockSelection = selectedBlockId != null;
  const hasMultiBlockSelection = selectedBlockIds.length > 1;
  const hasElementSelection = selectedElId != null || selectedElIds.length > 0;
  const toggleRightPanel = useCanvaStore(s => s.toggleRightPanel);
  const deleteBlock = useCanvaStore(s => s.deleteBlock);

  if (!rightPanelOpen) return null;

  return (
    <div className="w-full h-full bg-silse-surface-container-lowest border-l border-silse-outline-variant/40 flex flex-col shrink-0 overflow-hidden">
      {/* ── Properties Header — SILSE v4 MD3 reference style ── */}
      <div className="px-4 py-2.5 border-b border-silse-outline-variant/40 flex items-center justify-between bg-silse-surface-container-lowest flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-silse-tertiary" style={{ fontSize: '20px' }}>tune</span>
          <h3
            className="text-sm font-bold text-silse-on-surface tracking-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
          >
            Properties
          </h3>
        </div>
        <button
          onClick={toggleRightPanel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-silse-on-surface-variant hover:bg-silse-surface-container-high/60 hover:text-silse-on-surface transition-[background-color,color] duration-150"
          aria-label="Tutup panel"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        </button>
      </div>

      {/* ── Tab Bar — MD3 Segmented Style ─────────────────────── */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1.5 shrink-0 bg-silse-surface-container-lowest">
        <div className="flex items-center gap-0.5 bg-silse-surface-container-high/40 rounded-xl p-0.5 w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-[background-color,color,box-shadow] duration-150 ${
                  isActive
                    ? 'bg-silse-surface-container-lowest text-silse-primary shadow-sm'
                    : 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high/50'
                }`}
                aria-selected={isActive}
                role="tab"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div role="tabpanel" aria-label="Properti" className="h-full flex flex-col">
            {hasMultiBlockSelection ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AlignmentTools />
                <BlockPropertiesPanel />
              </div>
            ) : hasBlockSelection ? (
              <BlockPropertiesPanel />
            ) : isSchemaDriven ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <BackgroundSection />
                <PageSettingsSection />
                <PaletteSection />
                <TabManagementSection />
                {/* ── Teacher mode: Navigation + PageInfo ── */}
                {isSederhana && (
                  <>
                    <div className="border-t border-silse-outline-variant/30 mx-4 my-3" />
                    <NavigationSection />
                    <PageInfo />
                  </>
                )}
                {/* ── Empty state hint — MD3 style ── */}
                <div className="mx-3 mt-3 mb-4 rounded-2xl border border-dashed border-silse-outline-variant/60 bg-silse-surface-container-low/50 overflow-hidden">
                  <div className="px-4 pt-4 pb-3 text-center">
                    <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-silse-secondary/8 border border-silse-secondary/15 flex items-center justify-center">
                      <span className="material-symbols-outlined text-silse-secondary/50" style={{ fontSize: '22px' }}>touch_app</span>
                    </div>
                    <div className="text-[12px] font-bold text-silse-on-surface mb-0.5">
                      Pilih {blockLabel} untuk Edit
                    </div>
                    <div className="text-[10px] text-silse-on-surface-variant leading-relaxed">
                      Klik {blockLabel.toLowerCase()} di canvas untuk mengedit properti dan konten
                    </div>
                  </div>
                  {/* Quick action hints */}
                  <div className="border-t border-silse-outline-variant/15 px-3 py-2.5 space-y-1.5 bg-silse-surface-container-lowest/50">
                    <div className="flex items-center gap-2 text-[9px] text-silse-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded-md bg-silse-secondary/8 text-silse-secondary font-bold text-[8px]">1x Klik</span>
                      <span>Pilih {blockLabel.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-silse-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/8 text-emerald-600 font-bold text-[8px]">2x Klik</span>
                      <span>Edit teks langsung</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-silse-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-500/8 text-blue-600 font-bold text-[8px]">Shift+Klik</span>
                      <span>Pilih banyak {blockLabel.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ElementProperties />
                <AlignmentTools />
                <BackgroundSection />
              </div>
            )}
          </div>
        )}

        {/* AI Tab */}
        {aiEnabled && activeTab === 'ai' && (
          <div role="tabpanel" aria-label="AI" className="flex-1 overflow-y-auto custom-scrollbar">
            {hasBlockSelection ? (
              <>
                <AIRefineSection />
                <AIAssistantSection />
              </>
            ) : (
              <AIAssistantSection />
            )}
          </div>
        )}

        {/* Layer Tab */}
        {activeTab === 'layer' && (
          <div role="tabpanel" aria-label="Layer" className="flex-1 overflow-y-auto custom-scrollbar">
            <LayerPanel />
            <div className="border-t border-silse-outline-variant/30 mx-4 my-3" />
            <NavigationSection />
            <PageInfo />
          </div>
        )}
      </div>
      {/* ── Footer — MD3: delete button when block selected ── */}
      {hasBlockSelection && (
        <div className="px-4 py-2.5 bg-silse-surface-container-low border-t border-silse-outline-variant/40 flex-shrink-0">
          <button
            onClick={() => {
              if (selectedBlockId && confirm(`Hapus ${blockLabel.toLowerCase()} ini?`)) {
                deleteBlock(selectedBlockId);
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-silse-error-container/10 text-silse-error text-[12px] font-bold hover:bg-silse-error-container/20 active:scale-[0.97] transition-[background-color,transform] duration-150"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            Hapus {blockLabel}
          </button>
        </div>
      )}
    </div>
  );
}
