'use client';

import { useState } from 'react';
import Skenario from './Skenario';
import { type KontenTab } from './konten/shared';
import { MateriTab } from './konten/MateriTab';
import { ModulesTab } from './konten/ModulesTab';
import { KuisTab } from './konten/KuisTab';
import { useAuthoringStore } from '@/store/authoring-store';
import { useCanvaStore } from '@/store/canva-store';
import { FileEdit, Puzzle, HelpCircle } from 'lucide-react';

// ── Main Konten Panel ──────────────────────────────────────────
export default function Konten() {
  const [activeTab, setActiveTab] = useState<KontenTab>('materi');

  const tabs: { id: KontenTab; icon: React.ReactNode; label: string }[] = [
    { id: 'materi', icon: <FileEdit size={14} className="inline" />, label: 'Materi' },
    { id: 'skenario', icon: '🎭', label: 'Skenario' },
    { id: 'modules', icon: <Puzzle size={14} className="inline" />, label: 'Modul & Game' },
    { id: 'kuis', icon: <HelpCircle size={14} className="inline" />, label: 'Evaluasi' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <span>📚</span> Konten Pembelajaran
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Materi, aktivitas/modul, dan evaluasi siswa dalam satu panel.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-app-surface border border-app-border rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-app-elevated text-app-primary'
                : 'text-app-secondary hover:text-app-primary hover:bg-app-elevated'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === 'materi' && <MateriTab />}
        {activeTab === 'skenario' && <Skenario />}
        {activeTab === 'modules' && <ModulesTab />}
        {activeTab === 'kuis' && <KuisTab />}
      </div>

      <div className="mt-6 pt-4 border-t border-app-border flex justify-end">
        <button
          onClick={() => {
            useCanvaStore.getState().resetCanvas();
            useAuthoringStore.getState().setActivePanel('canva');
          }}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          Selanjutnya: Desain di Canva →
        </button>
      </div>
    </div>
  );
}
