'use client';

import { FileText, Plus, Sparkles, History, Settings } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
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
// ═══════════════════════════════════════════════════════════════

export type LeftPanelTab = 'pages' | 'add-block' | 'templates' | 'history' | 'settings';

interface IconRailProps {
  activeTab: LeftPanelTab;
  onTabChange: (tab: LeftPanelTab) => void;
  expanded: boolean;
}

const RAIL_ITEMS: { id: LeftPanelTab; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }[] = [
  { id: 'pages', icon: FileText, label: 'Halaman' },
  { id: 'add-block', icon: Plus, label: 'Tambah Block' },
  { id: 'templates', icon: Sparkles, label: 'Template' },
  { id: 'history', icon: History, label: 'Riwayat' },
  { id: 'settings', icon: Settings, label: 'Pengaturan' },
];

export function IconRail({ activeTab, onTabChange, expanded }: IconRailProps) {
  return (
    <div
      className="flex flex-col items-center py-2 gap-1 border-r border-app-border bg-app-surface flex-shrink-0"
      style={{ width: 'var(--semantic-panel-collapsed)' }}
    >
      {RAIL_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
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
                aria-label={item.label}
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
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
