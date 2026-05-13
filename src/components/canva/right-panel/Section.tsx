'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';

export default function Section({
  icon,
  title,
  collapsed: isCollapsed,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="section-divider" />
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-app-elevated transition-colors duration-150"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-app-muted">{icon}</span>
          <span className="text-[10px] font-bold text-app-secondary uppercase tracking-widest">{title}</span>
        </div>
        {isCollapsed ? (
          <ChevronRight size={12} className="text-app-muted" />
        ) : (
          <ChevronDown size={12} className="text-app-muted" />
        )}
      </button>
      {!isCollapsed && (
        <div className="px-3 pb-3 page-transition">
          {children}
        </div>
      )}
    </div>
  );
}
