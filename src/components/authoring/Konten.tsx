'use client';

import { useState } from 'react';
import Skenario from './Skenario';
import { type KontenTab } from './konten/shared';
import { MateriTab } from './konten/MateriTab';
import { ModulesTab } from './konten/ModulesTab';
import { KuisTab } from './konten/KuisTab';
import { useAuthoringStore } from '@/store/authoring-store';
import { FileEdit, Puzzle, HelpCircle, BookOpen, Theater, ArrowRight, Gamepad2, ClipboardList } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';

// ── Main Konten Panel ──────────────────────────────────────────
export default function Konten() {
  const [activeTab, setActiveTab] = useState<KontenTab>('materi');
  const { isSederhana } = useTeacherMode();

  // Mode-aware tab configuration
  // Sederhana: simple teacher-friendly labels, hide Skenario (too complex for SMP teachers)
  // Lengkap: technical/standard labels, all tabs visible
  const tabs: { id: KontenTab; icon: React.ReactNode; label: string; desc: string }[] = isSederhana
    ? [
        { id: 'materi', icon: <BookOpen size={14} />, label: 'Materi', desc: 'Teks dan materi pembelajaran' },
        // Skenario/Cerita hidden in sederhana — too complex for most SMP teachers
        { id: 'modules', icon: <Gamepad2 size={14} />, label: 'Game & Aktivitas', desc: 'Modul interaktif dan permainan' },
        { id: 'kuis', icon: <ClipboardList size={14} />, label: 'Soal Evaluasi', desc: 'Kuis dan soal pilihan ganda' },
      ]
    : [
        { id: 'materi', icon: <FileEdit size={14} />, label: 'Materi', desc: 'Materi, aktivitas/modul, dan evaluasi siswa dalam satu panel.' },
        { id: 'skenario', icon: <Theater size={14} />, label: 'Skenario', desc: 'Skenario interaktif dengan pilihan dan konsekuensi' },
        { id: 'modules', icon: <Puzzle size={14} />, label: 'Modul & Game', desc: 'Modul interaktif dan game edukasi' },
        { id: 'kuis', icon: <HelpCircle size={14} />, label: 'Evaluasi', desc: 'Kuis dan soal evaluasi siswa' },
      ];

  const currentTab = tabs.find(t => t.id === activeTab)!;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <BookOpen size={18} /> {isSederhana ? 'Materi Pembelajaran' : 'Konten Pembelajaran'}
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          {currentTab.desc}
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
              title={tab.desc}
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
          {isSederhana ? 'Selanjutnya: Desain Visual' : 'Selanjutnya: Desain di Canva'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
