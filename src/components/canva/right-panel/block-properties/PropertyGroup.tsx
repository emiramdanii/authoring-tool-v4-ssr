'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * PropertyGroup — Collapsible section matching SILSE v4 design.
 *
 * SILSE v4 spec:
 *   - Section header: uppercase tracking-wider text-xs font-bold text-silse-on-surface-variant
 *   - Thin divider line above (h-px bg-silse-outline-variant)
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
      <div className="h-px bg-silse-outline-variant mb-4" />

      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-1.5 w-full text-left group mb-3"
        aria-expanded={!collapsed}
        aria-label={`${label} — ${collapsed ? 'Kembangkan' : 'Perkecil'}`}
      >
        <ChevronDown
          size={14}
          className="text-silse-on-surface-variant transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}"
          aria-hidden="true"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
        />
        <span className="text-xs uppercase tracking-wider font-bold text-silse-on-surface-variant group-hover:text-silse-on-surface transition-colors">
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
