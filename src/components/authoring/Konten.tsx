'use client';

import { useState } from 'react';
import Skenario from './Skenario';
import { type KontenTab } from './konten/shared';
import { MateriTab } from './konten/MateriTab';
import { ModulesTab } from './konten/ModulesTab';
import { KuisTab } from './konten/KuisTab';
import { useAuthoringStore } from '@/store/authoring-store';
import { FileEdit, Puzzle, HelpCircle, BookOpen, Theater, ArrowRight } from 'lucide-react';

// ── Main Konten Panel ──────────────────────────────────────────
export default function Konten() {
  const [activeTab, setActiveTab] = useState<KontenTab>('materi');

  const tabs: { id: KontenTab; icon: React.ReactNode; label: string }[] = [
    { id: 'materi', icon: <FileEdit size={14} />, label: 'Materi' },
    { id: 'skenario', icon: <Theater size={14} />, label: 'Skenario' },
    { id: 'modules', icon: <Puzzle size={14} />, label: 'Modul & Game' },
    { id: 'kuis', icon: <HelpCircle size={14} />, label: 'Evaluasi' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <BookOpen size={18} /> Konten Pembelajaran
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Materi, aktivitas/modul, dan evaluasi siswa dalam satu panel.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-6">
        <div className="flex gap-1 bg-app-surface border border-app-border rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-app-elevated text-app-primary shadow-sm'
                  : 'text-app-secondary hover:text-app-primary hover:bg-app-elevated/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content — flex-1 fills remaining space, min-h-0 allows shrink, overflow handles scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 custom-scrollbar">
        {activeTab === 'materi' && <MateriTab />}
        {activeTab === 'skenario' && <Skenario />}
        {activeTab === 'modules' && <ModulesTab />}
        {activeTab === 'kuis' && <KuisTab />}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-app-border flex justify-end">
        <button
          onClick={() => {
            useAuthoringStore.getState().setActivePanel('canva');
          }}
          className="px-4 py-2 bg-app-accent hover:bg-app-accent/90 text-app-inverse font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2"
        >
          Selanjutnya: Desain di Canva
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
