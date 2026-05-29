'use client';

import { useState } from 'react';

/**
 * PropertyGroup v2 — Collapsible section matching SILSE v4 MD3 design.
 *
 * MD3 spec:
 *   - Section header: uppercase tracking-widest text-[10px] font-bold text-silse-outline
 *   - Subtle divider line above (h-px bg-silse-outline-variant/30)
 *   - Material Symbol chevron
 *   - Compact spacing
 */
export function PropertyGroup({ label, defaultCollapsed = false, children }: {
  label: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="pt-1">
      {/* Divider */}
      <div className="h-px bg-silse-outline-variant/30 mb-2" />

      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1 w-full text-left group mb-2"
        aria-expanded={!collapsed}
        aria-label={`${label} — ${collapsed ? 'Kembangkan' : 'Perkecil'}`}
      >
        <span
          className="material-symbols-outlined text-silse-on-surface-variant/60 transition-transform duration-200"
          style={{ fontSize: '14px', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
          aria-hidden="true"
        >
          expand_more
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-silse-outline group-hover:text-silse-on-surface-variant transition-colors">
          {label}
        </span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="space-y-3 pl-1">
          {children}
        </div>
      )}
    </div>
  );
}
