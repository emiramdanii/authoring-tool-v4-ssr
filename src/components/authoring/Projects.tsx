'use client';

import { useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { toast } from 'sonner';
import { Sparkles, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  timestamp: number;
  data: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const raw = localStorage.getItem('at_projects_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const newProject = useAuthoringStore((s) => s.newProject);
  const saveToStorage = useAuthoringStore((s) => s.saveToStorage);
  const meta = useAuthoringStore((s) => s.meta);

  const handleSave = () => {
    const s = useAuthoringStore.getState();
    const name = s.meta.judulPertemuan || 'Proyek Tanpa Judul';
    const project: Project = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      timestamp: Date.now(),
      data: JSON.stringify({
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, modules: s.modules,
        games: s.games, materi: s.materi,
      }),
    };
    const newProjects = [project, ...projects];
    setProjects(newProjects);
    try { localStorage.setItem('at_projects_v1', JSON.stringify(newProjects)); } catch { toast.error('Gagal menyimpan proyek ke browser'); }
  };

  const handleLoad = (project: Project) => {
    try {
      const data = JSON.parse(project.data);
      const store = useAuthoringStore.getState();
      useAuthoringStore.setState({
        meta: data.meta || store.meta,
        cp: data.cp || store.cp,
        tp: data.tp || [],
        atp: data.atp || store.atp,
        alur: data.alur || [],
        skenario: data.skenario || [],
        kuis: data.kuis || [],
        modules: data.modules || [],
        games: data.games || [],
        materi: data.materi || { blok: [] },
        dirty: false,
      });
      store.setActivePanel('dashboard');
      toast.success(`Proyek "${project.name}" berhasil dimuat`);
    } catch { toast.error('Gagal memuat proyek — data rusak'); }
  };

  const handleDelete = (id: string) => {
    const newProjects = projects.filter((p) => p.id !== id);
    setProjects(newProjects);
    try { localStorage.setItem('at_projects_v1', JSON.stringify(newProjects)); } catch { toast.error('Gagal menghapus proyek dari browser'); }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <span>📁</span> Kelola Proyek
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Simpan dan muat kembali proyek yang tersimpan di browser ini.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-colors"
        >
          💾 Simpan Proyek Aktif
        </button>
        <button
          onClick={() => { newProject(); }}
          className="px-4 py-2 bg-app-elevated hover:bg-app-elevated text-app-primary font-medium text-sm rounded-lg transition-colors"
        >
          <Sparkles size={14} className="inline" /> Proyek Baru
        </button>
      </div>

      {!projects.length ? (
        <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-app-secondary text-sm">Belum ada proyek tersimpan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-app-surface border border-app-border rounded-lg p-4 flex items-center gap-4 hover:border-app-border transition-colors"
            >
              <div className="text-2xl">📁</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-app-primary truncate">{p.name}</div>
                <div className="text-xs text-app-muted">{formatDate(p.timestamp)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoad(p)}
                  className="px-3 py-1.5 bg-app-elevated hover:bg-app-elevated text-app-primary text-xs rounded-md transition-colors"
                >
                  Muat
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-3 py-1.5 bg-app-elevated hover:bg-red-900/50 text-app-secondary hover:text-red-400 text-xs rounded-md transition-colors"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
