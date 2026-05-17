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
// ICON RAIL — 56px always-visible vertical icon strip
// ═══════════════════════════════════════════════════════════════
// Clicking an icon expands the panel and shows the corresponding
// tab content. Active tab has amber accent indicator.
// Teacher-mode aware: labels adapt for sederhana mode.
// ═══════════════════════════════════════════════════════════════

export type LeftPanelTab = 'pages' | 'add-block' | 'templates' | 'history' | 'settings';

interface IconRailProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  expanded: boolean;
}

// Base labels — will be transformed by teacherTerm at render time
const RAIL_ITEMS: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string }[] = [
  { id: 'pages', icon: FileText, labelKey: 'Halaman' },
  { id: 'add-block', icon: Plus, labelKey: 'Block' },
  { id: 'templates', icon: Sparkles, labelKey: 'Template' },
  { id: 'history', icon: History, labelKey: 'Riwayat' },
  { id: 'settings', icon: Settings, labelKey: 'Pengaturan' },
];

export function IconRail({ activeTab, onTabChange, expanded }: IconRailProps) {
  const teacherMode = useCanvaStore(s => s.teacherMode);

  return (
    <div
      className="flex flex-col items-center py-2 gap-1 border-r border-app-border bg-app-surface flex-shrink-0"
      style={{ width: 'var(--semantic-panel-collapsed)' }}
    >
      {RAIL_ITEMS.map((item) => {
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
      })}
    </div>
  );
}
