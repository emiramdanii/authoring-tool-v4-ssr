'use client';

import { useCanvaStore } from '@/store/canva-store';
import { teacherTerm } from '@/core/i18n/teacher-terminology';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// ═══════════════════════════════════════════════════════════════
// ICON RAIL v8 — SILSE v4 MD3 Navigation Rail (64px)
// ═══════════════════════════════════════════════════════════════
// 64px always-visible vertical icon strip.
// MD3 Navigation Rail spec:
//   - w-16 (64px) — bg-silse-surface-bright — border-r border-silse-outline-variant
//   - py-6 gap-6
//   - Active: pill indicator (3px) + filled icon + bg-silse-primary-container/20 text-silse-primary
//   - Inactive: text-silse-on-surface-variant hover:bg-silse-surface-container-high
//   - Icon buttons: p-2 rounded-xl
//   - Icons: Material Symbols Outlined with FILL variation
//   - Active indicator: left-aligned vertical pill
//   - Transition: smooth 150ms background-color + color
// ═══════════════════════════════════════════════════════════════

export type LeftPanelTab = 'pages' | 'add-block' | 'templates' | 'history' | 'settings' | 'sisipkan';

interface IconRailProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  expanded?: boolean;
}

// Primary tabs — always shown at the top (SILSE v4: Material Symbols Outlined)
const PRIMARY_RAIL_ITEMS: { id: LeftPanelTab; icon: string; labelKey: string }[] = [
  { id: 'pages', icon: 'layers', labelKey: 'Halaman' },
  { id: 'add-block', icon: 'grid_view', labelKey: 'Block' },
  { id: 'templates', icon: 'category', labelKey: 'Template' },
];

// Secondary tabs — shown at bottom with visual separator
const SECONDARY_RAIL_ITEMS: { id: LeftPanelTab; icon: string; labelKey: string }[] = [
  { id: 'history', icon: 'history', labelKey: 'Riwayat' },
  { id: 'settings', icon: 'settings', labelKey: 'Pengaturan' },
];

export function IconRail({ activeTab, onTabChange, expanded }: IconRailProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);

  // Render a single rail button — MD3 Navigation Rail style
  const renderRailButton = (item: { id: LeftPanelTab; icon: string; labelKey: string }) => {
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
            className={`relative p-2 flex items-center justify-center rounded-xl transition-[background-color,color] duration-150 group ${
              isActive
                ? 'bg-silse-primary-container/20 text-silse-primary'
                : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high hover:text-silse-on-surface'
            }`}
            aria-label={label}
            aria-pressed={isActive}
          >
            {/* MD3 Active indicator — left-aligned pill bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-silse-primary" />
            )}
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '22px', fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
            >
              {item.icon}
            </span>
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
      className="flex flex-col items-center py-6 gap-6 border-r border-silse-outline-variant bg-silse-surface-bright flex-shrink-0 w-16"
    >
      {/* Primary tabs — always visible at top */}
      {PRIMARY_RAIL_ITEMS.map(renderRailButton)}

      {/* Separator + secondary tabs at bottom (teacher mode) or inline (advanced mode) */}
      {teacherMode ? (
        <>
          {/* Spacer pushes secondary tabs to the bottom */}
          <div className="flex-1" />
          {/* Subtle divider line */}
          <div className="w-5 h-px bg-silse-outline-variant/40 my-0.5" />
          {SECONDARY_RAIL_ITEMS.map(renderRailButton)}
        </>
      ) : (
        <>
          {/* Divider */}
          <div className="w-5 h-px bg-silse-outline-variant/40 my-0.5" />
          {/* Advanced mode: all items in single column */}
          {SECONDARY_RAIL_ITEMS.map(renderRailButton)}
        </>
      )}
    </div>
  );
}
