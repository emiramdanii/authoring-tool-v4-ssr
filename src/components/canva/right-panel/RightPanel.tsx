'use client';

import { useState } from 'react';
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
import { Layers, Zap, Box, Sparkles, Settings2 } from 'lucide-react';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
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
// RIGHT PANEL v6 — 3-Tab Layout
// ═══════════════════════════════════════════════════════════════
// Tabs:
//   Properties → Block/Eleent props, Alignment, Background
//   AI         → AI Assistant, AI Refine
//   Layer ⚙    → PageInfo, Navigation, PageSettings, Palette
// ═══════════════════════════════════════════════════════════════

type RightPanelTab = 'properties' | 'ai' | 'layer';

const TABS: { id: RightPanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'properties', label: 'Properti', icon: <Box size={12} /> },
  { id: 'ai', label: 'AI', icon: <Sparkles size={12} /> },
  { id: 'layer', label: 'Layer', icon: <Layers size={12} /> },
];

export default function RightPanel() {
  const rightPanelOpen = useCanvaStore(s => s.rightPanelOpen);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const selectedElId = useCanvaStore(s => s.selectedElId);
  const selectedElIds = useCanvaStore(s => s.selectedElIds);
  const teacherMode = useCanvaStore(s => s.teacherMode);

  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

  if (!rightPanelOpen) return null;

  // Determine context mode
  const hasBlockSelection = selectedBlockId != null;
  const hasMultiBlockSelection = selectedBlockIds.length > 1;
  const hasElementSelection = selectedElId != null || selectedElIds.length > 0;
  const page = useCanvaStore(s => s.pages[s.currentPageIndex]);
  const isSchemaDriven = !!page?.schema;

  // Auto-switch to AI tab when a block is selected and AI tab is relevant
  // But let user manually switch tabs

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
                <BackgroundSection />
                <PageSettingsSection />
                <PaletteSection />
                <div className="px-3 py-4 text-center">
                  <div className="text-[10px] text-app-muted">
                    Klik block di canvas untuk mengedit propertinya
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
