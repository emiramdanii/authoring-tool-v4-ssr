'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { DBProjectData } from '@/store/canva-store';
import { canvaPagesToSavePages } from '@/lib/save-utils';
import { useDirtyStore } from '@/store/dirty-store';
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

  // Load projects list from DB (with timeout — API may be unavailable in sandbox)
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('/api/projects?limit=50', { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Failed to load projects');
      const json = await res.json();
      setProjects(json.data || []);
    } catch (error) {
      // Graceful fallback — app works without API (uses localStorage)
      logger.warn('ProjectProvider', 'API unavailable, using offline mode: ' + String(error));
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
  // Sprint 7.2: Now integrates with the dirty store state machine.
  // Calls startSaving() before and saveSucceeded()/saveFailed() after.
  const saveProjectToDBInternal = useCallback(async (projectId: string) => {
    if (!projectId) return;

    const now = Date.now();
    if (now - lastSaveRef.current < 1000) return;
    lastSaveRef.current = now;

    // Sprint 7.2: Coordinate with dirty store state machine.
    // If auto-save is already in progress (saveStatus === 'saving'),
    // don't start a competing save — auto-save will handle it.
    const dirtyState = useDirtyStore.getState();
    if (dirtyState.saveStatus !== 'saving') {
      dirtyState.startSaving();
    }

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

      // Sprint 7.2: DB save succeeded — let the state machine know.
      // saveSucceeded() checks if revision matches (handles edits during save).
      useDirtyStore.getState().saveSucceeded();
      useCanvaStore.setState({ _saveStatus: 'saved' });
    } catch (error) {
      logger.error('ProjectProvider', error);
      useCanvaStore.setState({ _saveStatus: 'error' });
      // Sprint 7.2: Let the state machine know save failed.
      // dirty stays true so user can retry and beforeunload guard still works.
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      useDirtyStore.getState().saveFailed(errorMsg);
    } finally {
      setSaving(false);
    }
  }, []);

  // Load project into stores
  // Sprint 7.2: Save current project if dirty before switching to prevent data loss.
  const loadProject = useCallback(async (id: string) => {
    // Sprint 7.2: Save current project before switching if it has unsaved changes.
    // This prevents silent data loss when the user switches projects with pending edits.
    if (currentProjectId && useDirtyStore.getState().dirty) {
      try {
        await saveProjectToDBInternal(currentProjectId);
      } catch (err) {
        // Log but don't block project switch — user explicitly chose to switch.
        // Recovery snapshot may still be available.
        logger.warn('ProjectProvider', 'Failed to save before switching: ' + String(err));
      }
    }

    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to load project');
      const json = await res.json();
      const data = json.data as DBProjectData;

      // Load canva store data from DB format
      useCanvaStore.getState().loadFromDB(data);

      // Load authoring store data
      // Phase 5-F: Only load non-schema fields from raw authoringData.
      // Schema-backed fields (tp, alur, kuis, skenario, materi, diskusi,
      // refleksi, motivasi, rangkuman, modules, meta) are already derived
      // from schema by CanvaStore.loadFromDB() above. Writing them here
      // would overwrite the schema-derived projection with stale DB data.
      //
      // Sprint 7.1: Reset dirty store on project load
      useDirtyStore.getState().resetOnLoad();

      if (data.authoringData) {
        try {
          const authData = JSON.parse(data.authoringData);
          const store = useAuthoringStore.getState();
          useAuthoringStore.setState({
            // Non-schema fields — these have no schema block representation
            cp: authData.cp || store.cp,
            atp: authData.atp || store.atp,
            petunjuk: authData.petunjuk || store.petunjuk,
            penutup: authData.penutup || store.penutup,
            suara: authData.suara || store.suara,
            dirty: false,
            // Schema-backed fields — already loaded by CanvaStore.loadFromDB()
            // via deriveProjectionFromPages() above. Do NOT overwrite them here.
          });
        } catch (err) {
          logger.warn('ProjectProvider', 'Failed to parse authoringData: ' + String(err));
        }
      }

      setCurrentProjectId(id);
      useCanvaStore.setState({ panelRequest: 'canva' });
      toast.success(`Proyek "${data.title}" dimuat`);
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal memuat proyek');
    }
  }, [currentProjectId, saveProjectToDBInternal]);

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
