'use client';

import { useAutoSave } from '@/hooks/use-auto-save';
import { useProjectManager } from '@/hooks/use-project-manager';

/**
 * Wrapper that connects the project context to the auto-save hook.
 * When a project is loaded (currentProjectId is set), auto-save
 * persists to the database. Otherwise, it falls back to localStorage.
 */
export function CanvaAutoSaveSync() {
  const { currentProjectId, saveProject } = useProjectManager();
  useAutoSave(currentProjectId);
  return null;
}
