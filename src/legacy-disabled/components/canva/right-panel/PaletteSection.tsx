// @ts-nocheck — BATCH-12: quarantined to src/legacy-disabled/, not type-checked
'use client';

import { useState } from 'react';
// All icons migrated to Material Symbols Outlined
import { useCanvaStore } from '@/store/canva-store';
import Section from './Section';

export default function PaletteSection() {
  // ── Derived page data ────────────────────────────────────────
  const colorPalette = useCanvaStore(s => s.pages[s.currentPageIndex]?.colorPalette);

  // ── Local UI state ───────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);

  // Only render if palette exists and has colors
  if (!colorPalette || colorPalette.colors.length === 0) return null;

  return (
    <Section
      icon={<span className="material-symbols-outlined" style={{ fontSize: '12px' }}>palette</span>}
      title="Palet Warna"
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
    >
      {/* Color swatches */}
      <div className="flex gap-1 mb-2">
        {colorPalette.colors.map((color: string, i: number) => (
          <div
            key={i}
            className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer hover:scale-[1.05] transition-transform"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>

      {/* CSS variable mapping */}
      <div className="space-y-1">
        {Object.entries(colorPalette.mapping).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5 rounded-md bg-silse-surface-container-low px-1.5 py-1">
            <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" style={{ background: value as string }} />
            <span className="text-[8px] text-silse-on-surface-variant flex-1">{key}</span>
            <span className="text-[7px] text-silse-on-surface-variant">{value as string}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
