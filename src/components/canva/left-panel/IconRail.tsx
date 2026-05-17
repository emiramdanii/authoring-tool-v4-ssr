'use client';

import { FileText, Plus, Sparkles, History, Settings } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// ═══════════════════════════════════════════════════════════════
// ICON RAIL v2 — Teacher-Mode-Aware Vertical Icon Strip
// ═══════════════════════════════════════════════════════════════
// 56px always-visible vertical icon strip.
// Clicking an icon expands the panel and shows the corresponding
// tab content. Active tab has amber accent indicator.
//
// Teacher-mode aware:
//   Sederhana: 3 primary tabs (Halaman, Tambah Konten, Template)
//              + 2 secondary tabs (Riwayat, Pengaturan) at bottom
//   Lengkap: all 5 tabs in a single column
// ═══════════════════════════════════════════════════════════════

export type LeftPanelTab = 'pages' | 'add-block' | 'templates' | 'history' | 'settings';

interface IconRailProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  expanded: boolean;
}

// Primary tabs — always shown at the top
const PRIMARY_RAIL_ITEMS: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }[] = [
  { id: 'pages', icon: FileText, labelKey: 'Halaman' },
  { id: 'add-block', icon: Plus, labelKey: 'Block' },
  { id: 'templates', icon: Sparkles, labelKey: 'Template' },
];

// Secondary tabs — shown at bottom with visual separator in teacher mode,
// or inline in advanced mode
const SECONDARY_RAIL_ITEMS: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }[] = [
  { id: 'history', icon: History, labelKey: 'Riwayat' },
  { id: 'settings', icon: Settings, labelKey: 'Pengaturan' },
];

export function IconRail({ activeTab, onTabChange, expanded }: IconRailProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);

  // Render a single rail button
  const renderRailButton = (item: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    // "Tambah Block" → "Tambah Konten" in sederhana mode
    const label = item.id === 'add-block'
      ? `Tambah ${teacherTerm(item.labelKey, teacherMode)}`
      : item.labelKey;
    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => onTabChange(item.id)}
            className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-app-accent/10 text-app-accent'
                : 'text-app-muted hover:text-app-secondary hover:bg-app-elevated/50'
            }`}
            aria-label={label}
            aria-pressed={isActive}
          >
            {/* Amber accent indicator on left */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-app-accent" />
            )}
            <Icon size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-[10px]">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className="flex flex-col items-center py-2 gap-1 border-r border-app-border bg-app-surface flex-shrink-0"
      style={{ width: 'var(--semantic-panel-collapsed)' }}
    >
      {/* Primary tabs — always visible at top */}
      {PRIMARY_RAIL_ITEMS.map(renderRailButton)}

      {/* Separator + secondary tabs at bottom (teacher mode) or inline (advanced mode) */}
      {teacherMode ? (
        <>
          {/* Spacer pushes secondary tabs to the bottom */}
          <div className="flex-1" />
          {/* Subtle divider line */}
          <div className="w-6 h-px bg-app-border/50 my-0.5" />
          {SECONDARY_RAIL_ITEMS.map(renderRailButton)}
        </>
      ) : (
        <>
          {/* Advanced mode: all items in single column */}
          {SECONDARY_RAIL_ITEMS.map(renderRailButton)}
        </>
      )}
    </div>
  );
}
