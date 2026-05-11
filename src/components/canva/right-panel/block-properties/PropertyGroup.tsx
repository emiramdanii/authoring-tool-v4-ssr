'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Collapsible section for grouped fields */
export function PropertyGroup({ label, defaultCollapsed = false, children }: {
  label: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="border-t border-slate-700/20 pt-1">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 w-full text-left hover:text-slate-300 transition-colors"
      >
        <ChevronDown size={8} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      </button>
      {!collapsed && <div className="space-y-2 mt-1">{children}</div>}
    </div>
  );
}
