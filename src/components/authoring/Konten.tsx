'use client';

import { useState } from 'react';
import Skenario from './Skenario';
import { type KontenTab } from './konten/shared';
import { MateriTab } from './konten/MateriTab';
import { ModulesTab } from './konten/ModulesTab';
import { KuisTab } from './konten/KuisTab';

// ── Main Konten Panel ──────────────────────────────────────────
export default function Konten() {
  const [activeTab, setActiveTab] = useState<KontenTab>('materi');

  const tabs: { id: KontenTab; icon: string; label: string }[] = [
    { id: 'materi', icon: '📝', label: 'Materi' },
    { id: 'skenario', icon: '🎭', label: 'Skenario' },
    { id: 'modules', icon: '🧩', label: 'Modul & Game' },
    { id: 'kuis', icon: '❓', label: 'Evaluasi' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span>📚</span> Konten Pembelajaran
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Materi, aktivitas/modul, dan evaluasi siswa dalam satu panel.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
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
    </div>
  );
}
