'use client';

import { useCanvaStore } from '@/store/canva-store';
import ElementProperties from './ElementProperties';
import BackgroundSection from './BackgroundSection';
import PaletteSection from './PaletteSection';
import NavigationSection from './NavigationSection';
import PageSettingsSection from './PageSettingsSection';
import BlockPropertiesPanel from './BlockPropertiesPanel';
import AIAssistantSection from './AIAssistantSection';
import AlignmentTools from './AlignmentTools';
import PageInfo from './PageInfo';
import { Layers, Zap, Box, Sparkles } from 'lucide-react';
import { teacherTerm } from '@/core/i18n/teacher-terminology';

// ═══════════════════════════════════════════════════════════════
// CONTEXT PANEL — Canva-style contextual right panel (280px fixed)
// ═══════════════════════════════════════════════════════════════
// Context-aware: shows different sections based on selection:
//
//   Multi-select blocks → Alignment Tools + Block Properties
//   Single block selected → Block Properties + AI Assistant
//   No selection → Scene Properties (bg, palette, nav, settings)
//
// The panel always shows PageInfo at the bottom.
// ═══════════════════════════════════════════════════════════════

export default function RightPanel() {
  const rightPanelOpen = useCanvaStore(s => s.rightPanelOpen);
  const selectedBlockId = useCanvaStore(s => s.selectedBlockId);
  const selectedBlockIds = useCanvaStore(s => s.selectedBlockIds);
  const selectedElId = useCanvaStore(s => s.selectedElId);
  const selectedElIds = useCanvaStore(s => s.selectedElIds);
  const teacherMode = useCanvaStore(s => s.teacherMode);

  if (!rightPanelOpen) return null;

  // Determine context mode
  const hasBlockSelection = selectedBlockId != null;
  const hasMultiBlockSelection = selectedBlockIds.length > 1;
  const hasElementSelection = selectedElId != null || selectedElIds.length > 0;

  return (
    <div className="w-full flex flex-col bg-app-surface overflow-y-auto custom-scrollbar">

      {/* ═══ Context header ═══ */}
      <div className="px-3 py-2 border-b border-app-border bg-app-surface/50 sticky top-0 z-10">
        {hasMultiBlockSelection ? (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
            <Layers size={11} />
            {selectedBlockIds.length} {teacherTerm('Block', teacherMode)} Terpilih
          </div>
        ) : hasBlockSelection ? (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <Zap size={11} />
            {teacherMode ? 'Properti Konten' : 'Block Properties'}
          </div>
        ) : hasElementSelection ? (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-app-accent uppercase tracking-wider">
            <Box size={11} />
            {teacherMode ? 'Properti Elemen' : 'Element Properties'}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-app-secondary uppercase tracking-wider">
            <Layers size={11} />
            {teacherMode ? 'Properti Halaman' : 'Scene Properties'}
          </div>
        )}
      </div>

      {/* ═══ Context-aware content ═══ */}

      {hasMultiBlockSelection ? (
        /* ── Multi-block selected: Alignment + Block props ── */
        <>
          <AlignmentTools />
          <BlockPropertiesPanel />
        </>
      ) : hasBlockSelection ? (
        /* ── Single block selected: Content-first properties ── */
        <>
          <BlockPropertiesPanel />
          <AIAssistantSection />
        </>
      ) : (
        /* ── No block selection: Scene-level properties ── */
        <>
          {/* Element properties for legacy elements (always available) */}
          <ElementProperties />
          <AlignmentTools />
          <BackgroundSection />
          <PaletteSection />
          <NavigationSection />
          <PageSettingsSection />
        </>
      )}

      {/* ── Page Info (always visible at bottom) ───────────────── */}
      <PageInfo />
    </div>
  );
}
