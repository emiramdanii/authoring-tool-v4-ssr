'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * PropertyGroup — Collapsible section matching stitch v4 design.
 *
 * Stitch spec:
 *   - Section header: uppercase tracking-widest text-[11px] font-bold text-outline
 *   - Thin divider line above (h-px bg-outline-variant)
 *   - Content area with generous spacing
 */
export function PropertyGroup({ label, defaultCollapsed = false, children }: {
  label: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="pt-2">
      {/* Divider */}
      <div className="h-px bg-outline-variant/40 mb-4" />

      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 w-full text-left group mb-3"
        aria-expanded={!collapsed}
        aria-label={`${label} — ${collapsed ? 'Kembangkan' : 'Perkecil'}`}
      >
        <ChevronDown
          size={14}
          className={`text-outline transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          aria-hidden="true"
        />
        <span className="text-[11px] font-bold text-outline uppercase tracking-widest group-hover:text-on-surface-variant transition-colors">
          {label}
        </span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="space-y-4 animate-accordion-down">
          {children}
        </div>
      )}
    </div>
  );
}
