'use client';

import { Layers, Grid3X3, LayoutTemplate, Image, Settings } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// ═══════════════════════════════════════════════════════════════
// ICON RAIL v4 — SILSE v4 Material Design 3 Vertical Icon Strip
// ═══════════════════════════════════════════════════════════════
// 64px always-visible vertical icon strip.
// SILSE v4 spec:
//   - bg-silse-surface-container-lowest (white)
//   - border-r border-silse-outline-variant
//   - Active: bg-silse-primary-container text-silse-on-primary-container rounded-xl
//   - Inactive: text-silse-on-surface-variant hover:bg-silse-surface-container-high rounded-xl
// ═══════════════════════════════════════════════════════════════

export type LeftPanelTab = 'pages' | 'add-block' | 'templates' | 'history' | 'settings' | 'sisipkan';

interface IconRailProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  expanded: boolean;
}

// Primary tabs — always shown at the top (SILSE v4 icons: layers, grid_view, category, perm_media)
const PRIMARY_RAIL_ITEMS: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }[] = [
  { id: 'pages', icon: Layers, labelKey: 'Halaman' },
  { id: 'add-block', icon: Grid3X3, labelKey: 'Block' },
  { id: 'templates', icon: LayoutTemplate, labelKey: 'Template' },
];

// Secondary tabs — shown at bottom with visual separator
const SECONDARY_RAIL_ITEMS: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }[] = [
  { id: 'history', icon: Image, labelKey: 'Riwayat' },
  { id: 'settings', icon: Settings, labelKey: 'Pengaturan' },
];

export function IconRail({ activeTab, onTabChange, expanded }: IconRailProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);

  // Render a single rail button — SILSE v4 style
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
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-[background-color,color] duration-200 ${
              isActive
                ? 'bg-silse-primary-container text-silse-on-primary-container'
                : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high'
            }`}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon size={20} />
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
      className="flex flex-col items-center py-3 gap-1 border-r border-silse-outline-variant bg-silse-surface-container-lowest flex-shrink-0"
      style={{ width: '64px' }}
    >
      {/* Primary tabs — always visible at top */}
      {PRIMARY_RAIL_ITEMS.map(renderRailButton)}

      {/* Separator + secondary tabs at bottom (teacher mode) or inline (advanced mode) */}
      {teacherMode ? (
        <>
          {/* Spacer pushes secondary tabs to the bottom */}
          <div className="flex-1" />
          {/* Subtle divider line */}
          <div className="w-6 h-px bg-silse-outline-variant my-1" />
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
