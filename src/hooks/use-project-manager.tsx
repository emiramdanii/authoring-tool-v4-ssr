'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useCanvaStore } from '@/store/canva-store';
import { useAuthoringStore } from '@/store/authoring-store';
import type { DBProjectData } from '@/store/canva-store';
import { canvaPagesToSavePages } from '@/lib/save-utils';
import { cancelAutoSaveTimers, executeDurableSave, flushDurableSave } from '@/lib/save-utils';
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
  /**
   * Pure persistence primitive — builds payload and sends to DB.
   * Does NOT touch the save lifecycle (startSaving/saveSucceeded/saveFailed).
   * This is what useAutoSave should receive as its dbSaveFn.
   * Returns void; throws on DB failure.
   */
  persistCurrentProject: () => Promise<void>;
  /**
   * Coordinator-wrapped save for UI actions (Ctrl+S, SaveNowButton, CommandPalette).
   * Routes through executeDurableSave() → persistCurrentProject().
   * Returns true if DB save succeeded, false if failed or local-only.
   */
  saveProject: () => Promise<boolean>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, title: string) => Promise<void>;
  importFromLocalStorage: () => Promise<void>;
  hasLocalData: () => boolean;
  setCurrentProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ═══════════════════════════════════════════════════════════════════
// P0-1 + P0-2 Fix: Pure persistence primitive
// ═══════════════════════════════════════════════════════════════════
// persistProjectToDB() is a PURE persistence function:
//   - Builds payload from current store state
//   - Sends to DB via fetch
//   - Throws on error
//   - Does NOT touch: startSaving, saveSucceeded, saveFailed,
//     _saveStatus, or any dirty-store lifecycle.
//
// The ONLY code that owns the save lifecycle is executeDurableSave()
// in save-utils.ts. It calls startSaving() → dbSaveFn() →
// saveSucceeded()/saveFailed(). This prevents the double-lifecycle
// bug where both the coordinator AND the persistence function
// were managing the state machine.
// ═══════════════════════════════════════════════════════════════════

async function persistProjectToDB(projectId: string): Promise<void> {
  if (!projectId) return;

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

  // P0-2 Fix: Throw on error so the coordinator's catch block
  // handles it properly. Previously this was swallowed, causing
  // the coordinator to think the save succeeded.
  if (!res.ok) throw new Error(`Failed to save project: ${res.status} ${res.statusText}`);
}

// ── Provider Component ─────────────────────────────────────────
export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

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
  // P0-7 Fix: Use setCurrentProjectId() to bind the new project ID
  // to the dirty-store token without resetting revision counters.
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

      // P0-7 Fix: Bind the new project ID to the dirty-store token.
      // Use setCurrentProjectId() instead of resetOnLoad() so that
      // any existing dirty revision is preserved. This ensures the
      // coordinator knows which project to save to.
      useDirtyStore.getState().setCurrentProjectId(project.id);
      setCurrentProjectId(project.id);

      // Force an initial durable save for the new project content.
      // { force: true } bypasses the "not dirty" check since this
      // is the first save and we need to persist initial content.
      // Patch-2 P0-2 Fix: Check result — don't show full success if initial save failed.
      const initialSaveOk = await executeDurableSave(() => persistProjectToDB(project.id), { force: true });

      await loadProjects();
      if (initialSaveOk) {
        toast.success(`Proyek "${title}" dibuat`);
      } else {
        toast.success(`Proyek "${title}" dibuat, tetapi konten awal belum tersimpan ke database.`);
      }
      return project;
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal membuat proyek');
      return null;
    }
  }, [loadProjects]);

  // Load project into stores
  // P0-4 Fix: Save-before-switch now BLOCKS the switch if save fails.
  // Patch-4 P0-2 Fix: NO outer hydration during fetch. loadFromDB()
  // manages its own hydration only during the commit phase. Wrapping
  // the entire fetch+load in hydration would suppress markDirty()
  // during the network wait, silently swallowing user edits to Project A.
  const loadProject = useCallback(async (id: string) => {
    // ── Sprint 7.2A-5: Cancel autosave timers before switching ──
    // This prevents a timer from Project A firing and saving Project A data
    // after Project B has been loaded into the stores.
    cancelAutoSaveTimers();

    // ── P0-4 Fix: Save current project before switching ──
    // If the current project is dirty, we MUST flush the save before
    // switching. If the save fails, we BLOCK the switch — loading
    // Project B while Project A's data is unsaved would cause data loss.
    if (currentProjectId && useDirtyStore.getState().dirty) {
      const saved = await flushDurableSave(() => persistProjectToDB(currentProjectId));
      if (!saved) {
        toast.error('Proyek belum dapat disimpan. Perpindahan dibatalkan.');
        return;
      }
    }

    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to load project');
      const json = await res.json();
      const data = json.data as DBProjectData;

      // ── Patch-4 P0-3c: Recheck dirty BEFORE committing Project B ──
      // User may have edited Project A during the fetch. If Project A
      // is dirty now, we must save it before switching — the earlier
      // flush only covered edits up to that point.
      if (currentProjectId && useDirtyStore.getState().dirty) {
        const saved = await flushDurableSave(() => persistProjectToDB(currentProjectId));
        if (!saved) {
          toast.error('Perubahan terbaru belum tersimpan. Perpindahan dibatalkan.');
          return;
        }
      }

      // Patch-3: loadFromDB is fully transactional.
      //   - Parses & validates ALL data (canva + authoring) BEFORE mutation
      //   - Commits both stores atomically inside its own hydration block
      //   - Returns false if ANY parsing fails — NO stores mutated
      //   - resetOnLoad() is NOT called inside loadFromDB anymore
      // Patch-4 P0-2: No outer hydration — loadFromDB handles its own.
      const canvaLoaded = useCanvaStore.getState().loadFromDB(data);
      if (!canvaLoaded) {
        throw new Error('Project hydration failed — data may be corrupted');
      }

      // Patch-3: resetOnLoad() is called ONLY after loadFromDB succeeds.
      useDirtyStore.getState().resetOnLoad(id);

      setCurrentProjectId(id);
      useCanvaStore.setState({ panelRequest: 'canva' });
      toast.success(`Proyek "${data.title}" dimuat`);
    } catch (error) {
      logger.error('ProjectProvider', error);
      toast.error('Gagal memuat proyek');
    }
  }, [currentProjectId]);

  // ── persistCurrentProject: Pure persistence primitive for useAutoSave ──
  // Patch-2 P0-1 Fix: useAutoSave must receive a PURE persistence function,
  // NOT saveProject which wraps executeDurableSave (coordinator-inside-coordinator).
  // This function only builds the payload and sends it to the DB.
  // It throws on failure — the coordinator (executeDurableSave) handles errors.
  const persistCurrentProject = useCallback(async () => {
    if (!currentProjectId) return;
    await persistProjectToDB(currentProjectId);
  }, [currentProjectId]);

  // ── saveProject: Coordinator-wrapped save for UI actions ──
  // Patch-2 P0-2 Fix: Returns boolean so callers can check success.
  // true = DB save succeeded, false = failed or local-only.
  // UI must check the result before showing "Tersimpan".
  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!currentProjectId) {
      // No project — just save to localStorage as crash recovery backup.
      // Honest message: this is a local backup, NOT a durable save.
      useCanvaStore.getState().saveToStorage();
      useAuthoringStore.getState().saveToStorage();
      toast.info('Cadangan lokal tersimpan. Buat proyek untuk menyimpan ke database.');
      return false;
    }
    return executeDurableSave(() => persistProjectToDB(currentProjectId));
  }, [currentProjectId]);

  // Delete project
  const deleteProject = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      if (currentProjectId === id) {
        setCurrentProjectId(null);
        // Sprint 7.2A-5: Cancel timers when current project is deleted
        cancelAutoSaveTimers();
        // Reset hydration depth to 0 as part of full cleanup
        useDirtyStore.setState({ _hydrationDepth: 0 });
        useDirtyStore.getState().resetOnLoad(null);
      }
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
    persistCurrentProject,
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
