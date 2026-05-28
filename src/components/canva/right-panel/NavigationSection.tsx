'use client';

import { useState } from 'react';
import { Compass } from 'lucide-react';
import { useCanvaStore } from '@/store/canva-store';
import type { NavConfig } from '../types';
import Section from './Section';

// ── Navbar style preview data ──
const NAVBAR_STYLES: { value: NavConfig['navbarStyle']; label: string; desc: string; preview: string }[] = [
  {
    value: 'colorful',
    label: 'Colorful',
    desc: 'Gradien cerah, emoji skor, tombol kuning',
    preview: 'linear-gradient(135deg, #fbbf24, #06b6d4)',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    desc: 'Garis tipis, warna muted, tombol ghost',
    preview: 'linear-gradient(135deg, #64748b, #475569)',
  },
  {
    value: 'glass',
    label: 'Glass',
    desc: 'Glassmorphism, glow effect, border gradien',
    preview: 'linear-gradient(135deg, #a78bfa, #22d3ee, #fbbf24)',
  },
];

export default function NavigationSection() {
  // ── Store selectors ──────────────────────────────────────────
  const updateNavConfig = useCanvaStore(s => s.updateNavConfig);

  // ── Derived page data ────────────────────────────────────────
  const navConfig = useCanvaStore(s => s.pages[s.currentPageIndex]?.navConfig);

  // ── Local UI state ───────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(true);

  const currentStyle = navConfig?.navbarStyle || 'colorful';

  return (
    <Section
      icon={<Compass size={12} />}
      title="Navigasi"
      collapsed={collapsed}
      onToggle={() => setCollapsed(c => !c)}
    >
      <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={navConfig?.showNavbar ?? true}
          onChange={e => updateNavConfig({ showNavbar: e.target.checked })}
          className="accent-silse-tertiary w-3 h-3"
        />
        <span className="text-[9px] text-silse-on-surface-variant group-hover:text-silse-on-surface transition-colors">Navbar</span>
      </label>

      <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={navConfig?.showPrevNext ?? true}
          onChange={e => updateNavConfig({ showPrevNext: e.target.checked })}
          className="accent-silse-tertiary w-3 h-3"
        />
        <span className="text-[9px] text-silse-on-surface-variant group-hover:text-silse-on-surface transition-colors">Tombol Prev/Next</span>
      </label>

      <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={navConfig?.showScore ?? true}
          onChange={e => updateNavConfig({ showScore: e.target.checked })}
          className="accent-silse-tertiary w-3 h-3"
        />
        <span className="text-[9px] text-silse-on-surface-variant group-hover:text-silse-on-surface transition-colors">Tampilkan Skor</span>
      </label>

      <label className="flex items-center gap-1.5 mb-1.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={navConfig?.showProgress ?? true}
          onChange={e => updateNavConfig({ showProgress: e.target.checked })}
          className="accent-silse-tertiary w-3 h-3"
        />
        <span className="text-[9px] text-silse-on-surface-variant group-hover:text-silse-on-surface transition-colors">Progress Bar</span>
      </label>

      {/* Navbar style — visual selector */}
      <div className="mt-2">
        <label className="text-[9px] text-silse-on-surface-variant block mb-1.5">Style Navbar</label>
        <div className="flex flex-col gap-1.5">
          {NAVBAR_STYLES.map(style => {
            const isActive = currentStyle === style.value;
            return (
              <button
                key={style.value}
                onClick={() => updateNavConfig({ navbarStyle: style.value })}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-[background-color,border-color] text-left ${
                  isActive
                    ? 'bg-silse-tertiary-container/10 border border-silse-tertiary-container/30'
                    : 'bg-silse-surface-container-low/50 border border-transparent hover:border-silse-outline-variant/30'
                }`}
              >
                {/* Gradient preview swatch */}
                <div
                  className="w-5 h-5 rounded-md flex-shrink-0"
                  style={{
                    background: style.preview,
                    opacity: isActive ? 1 : 0.5,
                    boxShadow: isActive ? `0 0 6px ${style.preview}` : 'none',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-[9px] font-bold ${isActive ? 'text-silse-tertiary' : 'text-silse-on-surface'}`}>
                    {style.label}
                  </div>
                  <div className="text-[7px] text-silse-on-surface-variant truncate">
                    {style.desc}
                  </div>
                </div>
                {isActive && (
                  <span className="text-[8px] text-silse-tertiary flex-shrink-0">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
