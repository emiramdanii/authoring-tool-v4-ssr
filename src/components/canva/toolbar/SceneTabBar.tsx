'use client';

import React from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { getTabIcon, TAB_ICON_MAP } from '@/lib/canva-icon-maps';
import { LayoutGrid } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SCENE TAB BAR — Horizontal pill bar showing tabs with icons
// ═══════════════════════════════════════════════════════════════
// Shows "Semua" (All) tab + user-defined tabs.
// Returns null when page has < 2 tabs (no filtering needed).
// ═══════════════════════════════════════════════════════════════

interface SceneTabBarProps {
  /** Compact mode — smaller pills for canvas mode */
  isCompact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function SceneTabBar({ isCompact = false, className = '' }: SceneTabBarProps) {
  const currentPageIndex = useCanvaStore(s => s.currentPageIndex);
  const pages = useCanvaStore(s => s.pages);
  const activeTabId = useCanvaStore(s => s.activeTabId);
  const setActiveTabId = useCanvaStore(s => s.setActiveTabId);

  const page = pages[currentPageIndex];
  const tabs = page?.schema?.tabs;

  // Don't render if no tabs or only 1 tab (nothing to filter)
  if (!tabs || tabs.length < 2) return null;

  const AllIcon = LayoutGrid;

  return (
    <div
      className={`flex items-center gap-1 ${isCompact ? 'px-2 py-1' : 'px-3 py-2'} overflow-x-auto custom-scrollbar border-b border-silse-outline-variant/30 ${className}`}
      role="tablist"
      aria-label="Tab navigasi"
    >
      {/* "Semua" (All) tab — shows all blocks */}
      <button
        role="tab"
        aria-selected={activeTabId === null}
        onClick={() => setActiveTabId(null)}
        className={`
          flex items-center gap-1.5 rounded-lg transition-[background-color,border-color,color] whitespace-nowrap
          ${isCompact ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'}
          font-bold
          ${activeTabId === null
            ? 'bg-silse-primary-container/20 text-silse-primary font-bold'
            : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/50'
          }
        `}
        title="Tampilkan semua blok"
      >
        <AllIcon size={isCompact ? 10 : 12} />
        <span>Semua</span>
      </button>

      {/* User-defined tabs */}
      {tabs.map((tab) => {
        const IconComponent = getTabIcon(tab.icon);
        const isActive = activeTabId === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTabId(isActive ? null : tab.id)}
            className={`
              flex items-center gap-1.5 rounded-lg transition-[background-color,border-color,color] whitespace-nowrap
              ${isCompact ? 'px-2.5 py-1 text-[9px]' : 'px-3 py-1.5 text-[10px]'}
              font-bold
              ${isActive
                ? 'bg-silse-primary-container/20 text-silse-primary font-bold'
                : 'text-silse-on-surface-variant hover:bg-silse-surface-container-high/50'
              }
            `}
            title={tab.label}
          >
            <IconComponent size={isCompact ? 10 : 12} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
