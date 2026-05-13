'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Collapsible section for grouped fields — uses fieldset/legend for accessibility */
export function PropertyGroup({ label, defaultCollapsed = false, children }: {
  label: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <fieldset className="border-t border-app-border/20 pt-1">
      <legend className="sr-only">{label}</legend>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 w-full text-left hover:text-app-secondary transition-colors"
        aria-expanded={!collapsed}
        aria-label={`${label} — ${collapsed ? 'Kembangkan' : 'Perkecil'}`}
      >
        <ChevronDown size={8} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} aria-hidden="true" />
        <span className="text-[9px] font-bold text-app-muted uppercase tracking-wider">{label}</span>
      </button>
      {!collapsed && <div className="space-y-2 mt-1">{children}</div>}
    </fieldset>
  );
}
