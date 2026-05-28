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
// RIGHT PANEL — SILSE v4 Properties Panel
// ═══════════════════════════════════════════════════════════════
// SILSE v4 spec:
//   - w-80 (320px) width
//   - White bg (surface-container-lowest), border-l outline-variant
//   - Tab bar: bold labels + underline indicator in secondary color
//   - Teacher mode: Properti + AI tabs
//   - Advanced mode: Properti + AI + Layer tabs
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
  const TABS: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'properties', label: 'Properti', icon: <Box size={14} /> },
    ...(aiEnabled ? [{ id: 'ai' as RightPanelTab, label: 'AI', icon: <Sparkles size={14} /> }] : []),
    // Layer tab only in advanced mode
    ...(!isSederhana ? [{ id: 'layer' as RightPanelTab, label: 'Layer', icon: <Layers size={14} /> }] : []),
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

  if (!rightPanelOpen) return null;

  return (
    <div className="w-80 bg-silse-surface-container-lowest border-l border-silse-outline-variant flex flex-col shrink-0 overflow-hidden">
      {/* ── Properties Header — SILSE v4 reference style ── */}
      <div className="p-6 border-b border-silse-outline-variant flex items-center justify-between bg-silse-surface-container-lowest flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-silse-tertiary" style={{ fontSize: '20px' }}>tune</span>
          <h3
            className="text-lg font-bold text-silse-on-surface"
            style={{ fontFamily: 'var(--font-plus-jakarta), Plus Jakarta Sans, sans-serif' }}
          >
            Properties
          </h3>
        </div>
        <button
          onClick={toggleRightPanel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-silse-on-surface-variant hover:bg-silse-surface-container-high transition-colors"
          aria-label="Tutup panel"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
        </button>
      </div>

      {/* ── Tab Bar — SILSE v4 style ────────────────────────── */}
      <div className="flex items-center border-b border-silse-outline-variant px-1 pt-1 shrink-0 bg-silse-surface-container-lowest">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold transition-all relative ${
                isActive
                  ? 'text-silse-secondary'
                  : 'text-silse-on-surface-variant hover:text-silse-on-surface hover:bg-silse-surface-container-high/50'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icon}
              <span>{tab.label}</span>
              {/* Active indicator — SILSE v4 underline */}
              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-silse-secondary rounded-t-full" />
              )}
            </button>
          );
        })}
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
                {/* ── Empty state hint ── */}
                <div className="mx-4 mt-4 mb-6 rounded-2xl border border-dashed border-silse-outline-variant bg-silse-surface-container-low overflow-hidden">
                  <div className="px-5 pt-5 pb-4 text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-silse-secondary/10 border border-silse-secondary/20 flex items-center justify-center">
                      <MousePointer2 size={22} className="text-silse-secondary/60" />
                    </div>
                    <div className="text-[13px] font-bold text-silse-on-surface mb-1">
                      Pilih {blockLabel} untuk Edit
                    </div>
                    <div className="text-[11px] text-silse-on-surface-variant leading-relaxed">
                      Klik {blockLabel.toLowerCase()} di canvas untuk mengedit properti, teks, warna, dan kompresinya
                    </div>
                  </div>
                  {/* Quick action hints */}
                  <div className="border-t border-silse-outline-variant/20 px-4 py-3 space-y-2 bg-silse-surface-container-lowest">
                    <div className="flex items-center gap-2.5 text-[10px] text-silse-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded-md bg-silse-secondary/10 text-silse-secondary font-bold text-[9px]">1x Klik</span>
                      <span>Pilih {blockLabel.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-silse-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[9px]">2x Klik</span>
                      <span>Edit teks langsung</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-silse-on-surface-variant">
                      <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-bold text-[9px]">Shift+Klik</span>
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
    </div>
  );
}
