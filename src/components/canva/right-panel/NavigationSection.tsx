'use client';

import { Compass } from 'lucide-react';
import type { NavConfig } from '../types';
import Section from './Section';

interface NavigationSectionProps {
  navConfig: NavConfig | undefined;
  updateNavConfig: (updates: Partial<NavConfig>) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function NavigationSection({ navConfig, updateNavConfig, collapsed, onToggle }: NavigationSectionProps) {
  return (
    <Section
      icon={<Compass size={12} />}
      title="Navigasi"
      collapsed={collapsed}
      onToggle={onToggle}
    >
      <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
        <input
          type="checkbox"
          checked={navConfig?.showNavbar ?? true}
          onChange={e => updateNavConfig({ showNavbar: e.target.checked })}
          className="accent-amber-500 w-3 h-3"
        />
        <span className="text-[9px] text-slate-400">Navbar</span>
      </label>

      <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
        <input
          type="checkbox"
          checked={navConfig?.showPrevNext ?? true}
          onChange={e => updateNavConfig({ showPrevNext: e.target.checked })}
          className="accent-amber-500 w-3 h-3"
        />
        <span className="text-[9px] text-slate-400">Tombol Prev/Next</span>
      </label>

      <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
        <input
          type="checkbox"
          checked={navConfig?.showScore ?? true}
          onChange={e => updateNavConfig({ showScore: e.target.checked })}
          className="accent-amber-500 w-3 h-3"
        />
        <span className="text-[9px] text-slate-400">Tampilkan Skor</span>
      </label>

      <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
        <input
          type="checkbox"
          checked={navConfig?.showProgress ?? true}
          onChange={e => updateNavConfig({ showProgress: e.target.checked })}
          className="accent-amber-500 w-3 h-3"
        />
        <span className="text-[9px] text-slate-400">Progress Bar</span>
      </label>

      {/* Navbar style */}
      <div className="mt-1.5">
        <label className="text-[9px] text-slate-500 block mb-1">Style Navbar</label>
        <select
          value={navConfig?.navbarStyle || 'colorful'}
          onChange={e => updateNavConfig({ navbarStyle: e.target.value as NavConfig['navbarStyle'] })}
          className="w-full h-7 px-2 text-[10px] text-slate-200 bg-slate-800/60 border border-slate-700/30 rounded-lg focus:border-amber-500/50 focus:outline-none focus-ring"
        >
          <option value="colorful">Colorful</option>
          <option value="minimal">Minimal</option>
          <option value="glass">Glass</option>
        </select>
      </div>
    </Section>
  );
}
