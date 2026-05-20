'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { DBProjectData } from '@/store/canva-store';
import type { KuisItem, Module } from '@/store/authoring-store';
import { ensureModuleIds, ensureKuisIds } from '@/lib/module-resolver';
import { GAME_TYPES } from '@/lib/canva-constants';
import { canvaPagesToSavePages } from '@/lib/save-utils';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

// ── Types ──────────────────────────────────────────────────────
export interface ProjectMeta {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  grade?: string | null;
  semester?: number | null;
  teacherName?: string | null;
  schoolName?: string | null;
  updatedAt: string;
  createdAt: string;
  isPublished: boolean;
  _count?: { pages: number };
  ratioId?: string | null;
}

interface ProjectContextValue {
  projects: ProjectMeta[];
  loading: boolean;
  saving: boolean;
  currentProjectId: string | null;
  loadProjects: () => Promise<void>;
  createProject: (meta?: { title?: string; description?: string; subject?: string; grade?: string }) => Promise<{ id: string; title: string } | null>;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, title: string) => Promise<void>;
  importFromLocalStorage: () => Promise<void>;
  hasLocalData: () => boolean;
  setCurrentProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ── Provider Component ─────────────────────────────────────────
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const lastSaveRef = useRef<number>(0);

  // Load projects list from DB
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects?limit=50');
      if (!res.ok) throw new Error('Failed to load projects');
      const json = await res.json();
      setProjects(json.data || []);
    } catch (error) {
      logger.error('ProjectProvider', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new project
  const createProject = useCallback(async (meta?: {
    title?: string;
    description?: string;
    subject?: string;
    grade?: string;
  }) => {
    try {
      const title = meta?.title || useAuthoringStore.getState().meta.judulPertemuan || 'Proyek Baru';
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: meta?.description,
          subject: meta?.subject,
          grade: meta?.grade,
          ratioId: useCanvaStore.getState().ratioId,
        }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const json = await res.json();
      const project = json.data;
      setCurrentProjectId(project.id);

      // Immediately save current stores to the new project
      await saveProjectToDBInternal(project.id);

      await loadProjects();
      toast.success(`Proyek "${title}" dibuat`);
      return project;
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal membuat proyek');
      return null;
    }
  }, [loadProjects]);

  // Internal save helper (doesn't depend on state to avoid stale closures)
  const saveProjectToDBInternal = useCallback(async (projectId: string) => {
    if (!projectId) return;

    const now = Date.now();
    if (now - lastSaveRef.current < 1000) return;
    lastSaveRef.current = now;

    try {
      setSaving(true);
      const canvaState = useCanvaStore.getState();
      const authoringState = useAuthoringStore.getState();
      const savePages = canvaPagesToSavePages(canvaState.pages);

      const res = await fetch(`/api/projects/${projectId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: savePages,
          ratioId: canvaState.ratioId,
          meta: {
            title: authoringState.meta.judulPertemuan || 'Proyek Baru',
            subject: authoringState.meta.mapel,
            grade: authoringState.meta.kelas,
          },
          authoringData: {
            meta: authoringState.meta,
            cp: authoringState.cp,
            tp: authoringState.tp,
            atp: authoringState.atp,
            alur: authoringState.alur,
            skenario: authoringState.skenario,
            kuis: authoringState.kuis,
            modules: authoringState.modules,
            games: authoringState.games,
            materi: authoringState.materi,
            petunjuk: authoringState.petunjuk,
            diskusi: authoringState.diskusi,
            refleksi: authoringState.refleksi,
            penutup: authoringState.penutup,
            suara: authoringState.suara,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save project');
      useCanvaStore.setState({ _saveStatus: 'saved' });
    } catch (error) {
      logger.error('ProjectProvider', error);
      useCanvaStore.setState({ _saveStatus: 'error' });
    } finally {
      setSaving(false);
    }
  }, []);

  // Load project into stores
  const loadProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to load project');
      const json = await res.json();
      const data = json.data as DBProjectData;

      // Load canva store data from DB format
      useCanvaStore.getState().loadFromDB(data);

      // Load authoring store data
      if (data.authoringData) {
        try {
          const authData = JSON.parse(data.authoringData);
          const store = useAuthoringStore.getState();
          useAuthoringStore.setState({
            meta: authData.meta || store.meta,
            cp: authData.cp || store.cp,
            tp: authData.tp || [],
            atp: authData.atp || store.atp,
            alur: authData.alur || [],
            skenario: authData.skenario || [],
            kuis: ensureKuisIds((authData.kuis || []) as KuisItem[]),
            modules: ensureModuleIds(authData.modules || []) as Module[],
            games: ensureModuleIds(
              (authData.modules || []).filter((m: Record<string, unknown>) =>
                (GAME_TYPES as readonly string[]).includes(m.type as string)
              )
            ) as Module[],
            materi: authData.materi || { blok: [] },
            petunjuk: authData.petunjuk || store.petunjuk,
            diskusi: authData.diskusi || store.diskusi,
            refleksi: authData.refleksi || store.refleksi,
            penutup: authData.penutup || store.penutup,
            suara: authData.suara || store.suara,
            dirty: false,
          });
        } catch (err) {
          logger.warn('ProjectProvider', 'Failed to parse authoringData: ' + String(err));
        }
      }

      setCurrentProjectId(id);
      useAuthoringStore.getState().setActivePanel('canva');
      toast.success(`Proyek "${data.title}" dimuat`);
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal memuat proyek');
    }
  }, []);

  // Save current project (public API)
  const saveProject = useCallback(async () => {
    if (!currentProjectId) {
      // No project — just save to localStorage
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();
      return;
    }
    await saveProjectToDBInternal(currentProjectId);
  }, [currentProjectId, saveProjectToDBInternal]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      if (currentProjectId === id) setCurrentProjectId(null);
      await loadProjects();
      toast.success('Proyek dihapus');
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal menghapus proyek');
    }
  }, [currentProjectId, loadProjects]);

  // Rename project
  const renameProject = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to rename project');
      await loadProjects();
      toast.success('Nama proyek diubah');
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal mengubah nama proyek');
    }
  }, [loadProjects]);

  // Import localStorage data to DB
  const importFromLocalStorage = useCallback(async () => {
    try {
      const raw = localStorage.getItem('at_projects_v1');
      if (!raw) {
        toast.info('Tidak ada data lokal untuk diimport');
        return;
      }

      const localProjects: Array<{
        id: string;
        name: string;
        timestamp: number;
        data: string;
      }> = JSON.parse(raw);

      let imported = 0;
      for (const lp of localProjects) {
        try {
          const parsedData = JSON.parse(lp.data);

          const createRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: lp.name }),
          });
          if (!createRes.ok) continue;
          const project = (await createRes.json()).data;

          // Save authoring data to the new project
          await fetch(`/api/projects/${project.id}/save`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pages: [],
              ratioId: '16:9',
              authoringData: parsedData,
            }),
          });

          imported++;
        } catch (err) {
          logger.warn('ProjectProvider', 'Failed to import project: ' + lp.name + ' ' + String(err));
        }
      }

      await loadProjects();

      if (imported > 0) {
        toast.success(`${imported} proyek berhasil diimport dari browser`);
        localStorage.setItem('at_projects_v1_migrated', '1');
      } else {
        toast.info('Tidak ada proyek yang bisa diimport');
      }
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal mengimport data dari browser');
    }
  }, [loadProjects]);

  // Check if localStorage has unmigrated data
  const hasLocalData = useCallback(() => {
    try {
      if (localStorage.getItem('at_projects_v1_migrated') === '1') return false;
      const raw = localStorage.getItem('at_projects_v1');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadProjects();
  }, [loadProjects]);

  const value: ProjectContextValue = {
    projects,
    loading,
    saving,
    currentProjectId,
    loadProjects,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    importFromLocalStorage,
    hasLocalData,
    setCurrentProjectId,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useProjectManager() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProjectManager must be used within a ProjectProvider');
  }
  return ctx;
}
