'use client';

import { useCanvaStore } from '@/store/canva-store';
import type { LeftTab } from './types';
import { Wrench, FileText, Layers, type LucideIcon } from 'lucide-react';

interface RailItem {
  id: LeftTab;
  icon: LucideIcon;
  title: string;
  divider?: boolean;
}

// Phase 1: Reduced from 5 tabs to 3: Rakit, Halaman, Layer
const RAIL_ITEMS: RailItem[] = [
  { id: 'rakit', icon: Wrench, title: 'Rakit' },
  { id: 'halaman', icon: FileText, title: 'Halaman', divider: true },
  { id: 'layer', icon: Layers, title: 'Layer', divider: true },
];

export default function IconRail() {
  const { leftTab, setLeftTab } = useCanvaStore();

  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1.5 glass-panel panel-inner-glow">
      {RAIL_ITEMS.map((item) => (
        <div key={item.id}>
          {item.divider && <div className="section-divider w-8 my-1.5" />}
          <button
            onClick={() => setLeftTab(item.id)}
            data-tip={item.title}
            className={`tooltip-trigger focus-ring w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${
              leftTab === item.id
                ? 'nav-active'
                : 'btn-ghost text-slate-500 hover:text-slate-200'
            }`}
          >
            <item.icon size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
