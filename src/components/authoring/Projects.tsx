'use client';

import { useState } from 'react';
import { useAuthoringStore } from '@/store/authoring-store';
import { useProjectManager } from '@/hooks/use-project-manager';
import { toast } from 'sonner';
// All icons migrated to Material Symbols Outlined
import { Button } from '@/components/ui/button';

export default function Projects() {
  const {
    projects,
    loading,
    saving,
    currentProjectId,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    importFromLocalStorage,
    hasLocalData,
  } = useProjectManager();

  const newProject = useAuthoringStore((s) => s.newProject);
  const meta = useAuthoringStore((s) => s.meta);

  const [showMigrateDialog, setShowMigrateDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleSaveCurrent = async () => {
    if (currentProjectId) {
      await saveProject();
      toast.success('Proyek tersimpan ke database');
    } else {
      // No project yet — create one first
      const project = await createProject({
        title: meta.judulPertemuan || 'Proyek Baru',
      });
      if (project) {
        toast.success('Proyek dibuat dan disimpan ke database');
      }
    }
  };

  const handleNewProject = () => {
    newProject();
    toast.success('Proyek baru dibuat');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus proyek ini? Tindakan tidak dapat dibatalkan.')) {
      await deleteProject(id);
    }
  };

  const handleLoad = async (id: string) => {
    await loadProject(id);
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    await renameProject(id, editTitle.trim());
    setEditingId(null);
    setEditTitle('');
  };

  const handleImport = async () => {
    await importFromLocalStorage();
    setShowMigrateDialog(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-app-primary flex items-center gap-2">
          <span className="material-symbols-outlined" style={ { fontSize: '22px' } }>database</span> Kelola Proyek
        </h2>
        <p className="text-sm text-app-secondary mt-1">
          Simpan dan muat proyek dari database. Data tersimpan di server, aman dari kehilangan.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleSaveCurrent}
          disabled={saving}
          className="bg-gradient-to-br from-app-accent to-app-accent/80 text-app-inverse shadow-sm hover:shadow-md hover:-translate-y-px disabled:opacity-60"
        >
          {saving ? <span className="material-symbols-outlined animate-spin" style={ { fontSize: '14px' } }>progress_activity</span> : <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>database</span>}
          {currentProjectId ? (saving ? 'Menyimpan...' : 'Simpan ke Database') : 'Buat Proyek Baru'}
        </Button>
        <Button
          onClick={handleNewProject}
          variant="outline"
        >
          <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>auto_awesome</span> Proyek Baru
        </Button>
        {hasLocalData() && (
          <Button
            onClick={() => setShowMigrateDialog(true)}
            variant="outline"
            className="text-amber-400 border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/18 hover:border-amber-500/35"
          >
            <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>upload</span> Import dari Browser
          </Button>
        )}
      </div>

      {/* Migration Dialog */}
      {showMigrateDialog && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400" style={ { fontSize: '18px' } }>upload</span>
            <h3 className="text-sm font-semibold text-amber-300">Import Data Lokal</h3>
          </div>
          <p className="text-xs text-app-secondary">
            Ditemukan data proyek yang tersimpan di browser. Import ke database agar data lebih aman dan bisa diakses dari perangkat lain.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              size="sm"
              className="bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
            >
              <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>upload</span> Import Sekarang
            </Button>
            <Button
              onClick={() => setShowMigrateDialog(false)}
              size="sm"
              variant="ghost"
              className="text-app-secondary"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center">
          <span className="material-symbols-outlined mx-auto mb-3 text-app-accent animate-spin" style={ { fontSize: '24px' } }>progress_activity</span>
          <p className="text-app-secondary text-sm">Memuat daftar proyek...</p>
        </div>
      ) : !projects.length ? (
        /* Empty State */
        <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-app-secondary text-sm">Belum ada proyek tersimpan di database.</p>
          <p className="text-app-muted text-xs mt-1">
            Klik &quot;Simpan ke Database&quot; untuk menyimpan proyek aktif.
          </p>
        </div>
      ) : (
        /* Project List */
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`bg-app-surface border rounded-lg p-4 flex items-center gap-4 transition-colors ${
                currentProjectId === p.id
                  ? 'border-app-accent/40 bg-app-accent/5'
                  : 'border-app-border hover:border-app-accent/20'
              }`}
            >
              <div className="text-2xl">
                {currentProjectId === p.id ? '✅' : '📁'}
              </div>
              <div className="flex-1 min-w-0">
                {editingId === p.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(p.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="bg-app-elevated border border-app-border rounded px-2 py-1 text-sm text-app-primary w-full"
                      autoFocus
                    />
                    <Button
                      onClick={() => handleRename(p.id)}
                      size="sm"
                      variant="ghost"
                      className="text-app-accent"
                    >
                      <span className="material-symbols-outlined" style={ { fontSize: '14px' } }>check</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className="text-sm font-semibold text-app-primary truncate cursor-pointer hover:text-app-accent transition-colors"
                      onDoubleClick={() => {
                        setEditingId(p.id);
                        setEditTitle(p.title);
                      }}
                      title="Klik ganda untuk mengubah nama"
                    >
                      {p.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-app-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>schedule</span>
                        {formatDate(p.updatedAt)}
                      </span>
                      {p._count?.pages !== undefined && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>description</span>
                          {p._count.pages} halaman
                        </span>
                      )}
                      {p.subject && (
                        <span className="bg-app-elevated px-1.5 py-0.5 rounded text-[0.6rem]">
                          {p.subject}
                        </span>
                      )}
                      {p.grade && (
                        <span className="bg-app-elevated px-1.5 py-0.5 rounded text-[0.6rem]">
                          Kelas {p.grade}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleLoad(p.id)}
                  size="sm"
                  variant={currentProjectId === p.id ? 'default' : 'outline'}
                  disabled={currentProjectId === p.id}
                  className={currentProjectId === p.id ? 'text-xs' : 'text-xs'}
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>folder_open</span>
                  {currentProjectId === p.id ? 'Aktif' : 'Muat'}
                </Button>
                <Button
                  onClick={() => handleDelete(p.id)}
                  size="sm"
                  variant="ghost"
                  className="text-app-secondary hover:text-red-400 hover:bg-red-900/30 text-xs"
                >
                  <span className="material-symbols-outlined" style={ { fontSize: '12px' } }>delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-save info */}
      <div className="bg-app-elevated/50 rounded-lg p-3 text-xs text-app-muted space-y-1">
        <p className="flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={ { fontSize: '10px' } }>database</span>
          <strong>Database:</strong> Proyek tersimpan otomatis setiap 2 detik saat proyek aktif.
        </p>
        <p className="flex items-center gap-1.5">
          <span>💾</span>
          <strong>Backup:</strong> Data juga tersimpan di browser sebagai cadangan.
        </p>
      </div>
    </div>
  );
}
