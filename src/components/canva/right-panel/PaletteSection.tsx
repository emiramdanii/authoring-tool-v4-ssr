'use client';

import { Palette } from 'lucide-react';
import Section from './Section';
import type { ColorPalette } from '../types';

interface PaletteSectionProps {
  colorPalette: ColorPalette;
  collapsed: boolean;
  onToggle: () => void;
}

export default function PaletteSection({ colorPalette, collapsed, onToggle }: PaletteSectionProps) {
  return (
    <Section
      icon={<Palette size={12} />}
      title="Palet Warna"
      collapsed={collapsed}
      onToggle={onToggle}
    >
      {/* Color swatches */}
      <div className="flex gap-1 mb-2">
        {colorPalette.colors.map((color, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer hover:scale-110 transition-transform"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>

      {/* CSS variable mapping */}
      <div className="space-y-1">
        {Object.entries(colorPalette.mapping).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1.5 rounded-md bg-slate-800/30 px-1.5 py-1">
            <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" style={{ background: value }} />
            <span className="text-[8px] text-slate-500 flex-1">{key}</span>
            <span className="text-[7px] text-slate-600">{value}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
