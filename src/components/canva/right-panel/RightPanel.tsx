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
import LayerPanel from '../left-panel/LayerPanel';
import { Layers, Zap, Box, Sparkles, Settings2, MousePointer2, Hand } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import dynamic from 'next/dynamic';

// Lazy-loaded: AI sections are heavy (API calls, complex UI, code editors)
const AIAssistantSection = dynamic(() => import('./AIAssistantSection'), {
  ssr: false,
  loading: () => (
    <div className="p-3 space-y-2">
      <div className="h-4 w-24 animate-pulse bg-app-elevated/20 rounded" />
      <div className="h-20 animate-pulse bg-app-elevated/20 rounded-lg" />
    </div>
  ),
});

const AIRefineSection = dynamic(() => import('../ai-assistant/AIRefineSection'), {
  ssr: false,
  loading: () => (
    <div className="p-3 space-y-2">
      <div className="h-4 w-20 animate-pulse bg-app-elevated/20 rounded" />
      <div className="h-16 animate-pulse bg-app-elevated/20 rounded-lg" />
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════
// RIGHT PANEL v7 — Teacher-Mode-Aware Tab Layout
// ═══════════════════════════════════════════════════════════════
// Tabs (sederhana / teacher mode):
//   Properti → Block props, Background (no Layer tab clutter)
//   AI       → AI Assistant, AI Refine
//
// Tabs (lengkap / advanced mode):
//   Properties → Block/Element props, Alignment, Background
//   AI         → AI Assistant, AI Refine
//   Layer      → LayerPanel, Navigation, PageInfo
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

  // Teacher-mode aware tab configuration
  // Sederhana mode: only Properti + AI (Layer is hidden — reduces cognitive load)
  // Lengkap mode: all 3 tabs including Layer for advanced block ordering
  const TABS: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'properties', label: 'Properti', icon: <Box size={12} /> },
    { id: 'ai', label: 'AI', icon: <Sparkles size={12} /> },
    // Layer tab only in advanced mode — teachers get NavigationSection in Properties tab instead
    ...(!isSederhana ? [{ id: 'layer' as RightPanelTab, label: 'Layer', icon: <Layers size={12} /> }] : []),
  ];

  if (!rightPanelOpen) return null;

  // Determine context mode
  const hasBlockSelection = selectedBlockId != null;
  const hasMultiBlockSelection = selectedBlockIds.length > 1;
  const hasElementSelection = selectedElId != null || selectedElIds.length > 0;
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const isSchemaDriven = !!page?.schema;

  // Auto-correct: if teacher mode is on and layer tab was active, switch to properties
  useEffect(() => {
    if (isSederhana && activeTab === 'layer') {
      setActiveTab('properties');
    }
  }, [isSederhana, activeTab]);

  return (
    <div className="w-full flex flex-col bg-app-surface overflow-hidden" style={{ width: 'var(--semantic-panel-expanded)' }}>
      {/* ── Tab Bar ──────────────────────────────────────────── */}
      <div className="flex items-center border-b border-app-border px-1 pt-1 flex-shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-2 text-[10px] font-bold transition-all relative ${
                isActive
                  ? 'text-app-accent'
                  : 'text-app-muted hover:text-app-secondary'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              {tab.icon}
              <span>{tab.label}</span>
              {/* Active indicator — subtle underline */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-app-accent rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────── */}
      {/* PERF: Conditional rendering instead of CSS hidden — only mounts the active tab's components, */}
      {/* reducing store subscriptions and re-renders from ~10 mounted components down to ~3. */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div role="tabpanel" aria-label="Properti">
            {hasMultiBlockSelection ? (
              <>
                <AlignmentTools />
                <BlockPropertiesPanel />
              </>
            ) : hasBlockSelection ? (
              <BlockPropertiesPanel />
            ) : isSchemaDriven ? (
              <>
                {/* Page-level settings when no block selected */}
                <BackgroundSection />
                <PageSettingsSection />
                <PaletteSection />
                {/* ── Teacher mode: Show NavigationSection + PageInfo here ── */}
                {/* (These are normally in the Layer tab, but Layer is hidden in sederhana mode) */}
                {isSederhana && (
                  <>
                    <div className="border-t border-app-border/30 mx-2" />
                    <NavigationSection />
                    <PageInfo />
                  </>
                )}
                <div className="mx-3 mt-3 mb-4 rounded-xl border border-dashed border-app-accent/25 bg-app-accent/5 overflow-hidden">
                  {/* Header with accent stripe */}
                  <div className="px-4 pt-4 pb-3 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center">
                      <MousePointer2 size={20} className="text-app-accent/60" />
                    </div>
                    <div className="text-[11px] font-bold text-app-primary/80 mb-1">
                      Pilih {blockLabel} untuk Edit
                    </div>
                    <div className="text-[9px] text-app-muted leading-relaxed">
                      Klik {blockLabel.toLowerCase()} di canvas untuk mengedit properti,<br/>teks, warna, dan kompresinya
                    </div>
                  </div>
                  {/* Quick action hints */}
                  <div className="border-t border-app-border/20 px-3 py-2.5 space-y-1.5 bg-app-elevated/20">
                    <div className="flex items-center gap-2 text-[8px] text-app-muted">
                      <span className="px-1 py-0.5 rounded bg-app-accent/15 text-app-accent font-bold text-[7px]">1x Klik</span>
                      <span>Pilih {blockLabel.toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-app-muted">
                      <span className="px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[7px]">2x Klik</span>
                      <span>Edit teks langsung</span>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-app-muted">
                      <span className="px-1 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold text-[7px]">Shift+Klik</span>
                      <span>Pilih banyak {blockLabel.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <ElementProperties />
                <AlignmentTools />
                <BackgroundSection />
              </>
            )}
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div role="tabpanel" aria-label="AI">
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

        {/* Layer Tab — Block layer list + page navigation */}
        {activeTab === 'layer' && (
          <div role="tabpanel" aria-label="Layer">
            <LayerPanel />
            <div className="border-t border-app-border/30 mx-2" />
            <NavigationSection />
            <PageInfo />
          </div>
        )}
      </div>
    </div>
  );
}
