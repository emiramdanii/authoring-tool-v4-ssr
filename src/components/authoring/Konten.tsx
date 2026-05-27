'use client';

import { useState } from 'react';
import Skenario from './Skenario';
import { type KontenTab } from './konten/shared';
import { MateriTab } from './konten/MateriTab';
import { DiskusiTab } from './konten/DiskusiTab';
import { RefleksiTab } from './konten/RefleksiTab';
import { ModulesTab } from './konten/ModulesTab';
import { KuisTab } from './konten/KuisTab';
import { MotivasiTab } from './konten/MotivasiTab';
import { RangkumanTab } from './konten/RangkumanTab';
import { SchemaNavigatorPanel } from './konten/SchemaNavigatorPanel';
import { KontenOverflowBanner } from './konten/KontenOverflowBanner';
import { useSchemaContext } from '@/hooks/use-schema-navigator';
import { FileEdit, Puzzle, HelpCircle, BookOpen, Theater, ArrowRight, Gamepad2, ClipboardList, MessageSquare, NotebookPen, Sparkles, ListChecks, Layers } from 'lucide-react';
import { useTeacherMode } from '@/hooks/use-teacher-mode';
import { useCanvaStore } from '@/store/canva-store';

// ── Main Konten Panel ──────────────────────────────────────────
// ── View mode for Konten panel ──
type KontenViewMode = 'tabs' | 'navigator';

export default function Konten() {
  const [activeTab, setActiveTab] = useState<KontenTab>('materi');
  const [viewMode, setViewMode] = useState<KontenViewMode>('tabs');
  const { isSederhana } = useTeacherMode();

  // Mode-aware tab configuration
  // Sederhana: simple teacher-friendly labels, hide Skenario (too complex for SMP teachers)
  // Lengkap: technical/standard labels, all tabs visible
  const tabs: { id: KontenTab; icon: React.ReactNode; label: string; desc: string }[] = isSederhana
    ? [
        { id: 'materi', icon: <BookOpen size={14} />, label: 'Materi', desc: 'Teks dan materi pembelajaran' },
        { id: 'motivasi', icon: <Sparkles size={14} />, label: 'Motivasi', desc: 'Apersepsi dan pertanyaan pemantik' },
        { id: 'diskusi', icon: <MessageSquare size={14} />, label: 'Diskusi', desc: 'Pertanyaan diskusi kelompok' },
        { id: 'refleksi', icon: <NotebookPen size={14} />, label: 'Refleksi', desc: 'Refleksi dan penugasan pribadi' },
        { id: 'rangkuman', icon: <ListChecks size={14} />, label: 'Rangkuman', desc: 'Poin-poin penting dan penutup materi' },
        { id: 'modules', icon: <Gamepad2 size={14} />, label: 'Game & Aktivitas', desc: 'Modul interaktif dan permainan' },
        { id: 'kuis', icon: <ClipboardList size={14} />, label: 'Soal Evaluasi', desc: 'Kuis dan soal pilihan ganda' },
      ]
    : [
        { id: 'materi', icon: <FileEdit size={14} />, label: 'Materi', desc: 'Materi, aktivitas/modul, dan evaluasi siswa dalam satu panel.' },
        { id: 'motivasi', icon: <Sparkles size={14} />, label: 'Motivasi', desc: 'Apersepsi dan pertanyaan pemantik untuk memotivasi siswa' },
        { id: 'diskusi', icon: <MessageSquare size={14} />, label: 'Diskusi', desc: 'Pertanyaan diskusi kelompok untuk pendalaman materi' },
        { id: 'refleksi', icon: <NotebookPen size={14} />, label: 'Refleksi', desc: 'Refleksi metakognitif dan penugasan pribadi' },
        { id: 'rangkuman', icon: <ListChecks size={14} />, label: 'Rangkuman', desc: 'Poin-poin penting, tips, dan penutup materi' },
        { id: 'skenario', icon: <Theater size={14} />, label: 'Skenario', desc: 'Skenario interaktif dengan pilihan dan konsekuensi' },
        { id: 'modules', icon: <Puzzle size={14} />, label: 'Modul & Game', desc: 'Modul interaktif dan game edukasi' },
        { id: 'kuis', icon: <HelpCircle size={14} />, label: 'Evaluasi', desc: 'Kuis dan soal evaluasi siswa' },
      ];

  const currentTab = tabs.find(t => t.id === activeTab)!;

  // Sync with store-driven navigation (from SchemaBlockTree "Edit in Konten")
  // Phase 3: Moved from useAuthoringStore.kontenTab → useCanvaStore.kontenTabRequest
  const storeKontenTab = useCanvaStore((s) => s.kontenTabRequest);
  if (storeKontenTab && storeKontenTab !== activeTab) {
    const isValid = tabs.find(t => t.id === storeKontenTab);
    if (isValid) setActiveTab(storeKontenTab as KontenTab);
    // Clear after consumption to avoid re-triggering
    useCanvaStore.setState({ kontenTabRequest: null });
  }

  const { meta, tp, goToCanva } = useSchemaContext();
  const projectContext = meta.judulPertemuan
    ? `${meta.mapel || 'Mapel'} ${meta.kelas ? '· Kelas ' + meta.kelas : ''} · ${tp.length} TP`
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
            <BookOpen size={18} /> {isSederhana ? 'Materi Pembelajaran' : 'Konten Pembelajaran'}
          </h2>
          {/* View mode toggle — Phase 3 Schema Navigator */}
          <div className="flex items-center gap-1 bg-app-surface border border-app-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tabs')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                viewMode === 'tabs'
                  ? 'bg-app-elevated text-app-primary shadow-sm'
                  : 'text-app-muted hover:text-app-secondary'
              }`
              }
              title="Tampilan Tab"
            >
              <BookOpen size={12} /> Tab
            </button>
            <button
              onClick={() => setViewMode('navigator')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                viewMode === 'navigator'
                  ? 'bg-app-elevated text-app-accent shadow-sm'
                  : 'text-app-muted hover:text-app-secondary'
              }`}
              title="Schema Navigator — lihat semua blok di seluruh halaman"
            >
              <Layers size={12} /> Navigator
            </button>
          </div>
        </div>
        <p className="text-sm text-app-secondary mt-1">
          {viewMode === 'navigator'
            ? 'Peta konten — lihat semua blok schema di seluruh halaman'
            : currentTab.desc
          }
        </p>
        {/* Cross-panel context badge */}
        {projectContext && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-app-accent/5 border border-app-accent/15 rounded-lg text-xs text-app-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-app-accent/60" />
            {meta.judulPertemuan}
            <span className="text-app-muted">·</span>
            <span className="text-app-secondary">{projectContext.split(' · ').pop()}</span>
          </div>
        )}
      </div>

      {/* Tabs — only visible in tab view mode */}
      {viewMode === 'tabs' && (
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
      )}

      {/* Phase 4: Overflow warning banner */}
      <div className="flex-shrink-0 px-6">
        <KontenOverflowBanner />
      </div>

      {/* Content Area — switches between Tab Content and Schema Navigator */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 custom-scrollbar">
        {viewMode === 'navigator' ? (
          <SchemaNavigatorPanel />
        ) : (
          <>
            {activeTab === 'materi' && <MateriTab />}
            {activeTab === 'motivasi' && <MotivasiTab />}
            {activeTab === 'diskusi' && <DiskusiTab />}
            {activeTab === 'refleksi' && <RefleksiTab />}
            {activeTab === 'rangkuman' && <RangkumanTab />}
            {activeTab === 'skenario' && <Skenario />}
            {activeTab === 'modules' && <ModulesTab />}
            {activeTab === 'kuis' && <KuisTab />}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-app-border flex justify-end">
        <button
          onClick={() => {
            goToCanva();
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
