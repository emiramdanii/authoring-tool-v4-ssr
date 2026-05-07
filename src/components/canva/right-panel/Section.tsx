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
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/30 transition-colors duration-150"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">{icon}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        </div>
        {isCollapsed ? (
          <ChevronRight size={12} className="text-slate-600" />
        ) : (
          <ChevronDown size={12} className="text-slate-600" />
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
