'use client';

import { useAutoSave } from '@/hooks/use-auto-save';
import { useProjectManager } from '@/hooks/use-project-manager';
import { usePeriodicIntegrityCheck } from '@/hooks/use-periodic-integrity-check';

/**
 * Wrapper that connects the project context to the auto-save hook.
 * When a project is loaded (currentProjectId is set), auto-save
 * persists to the database via the unified ProjectManager save path.
 * Otherwise, it falls back to localStorage.
 *
 * Also runs periodic integrity checks (FASE 6).
 */
export function CanvaAutoSaveSync() {
  const { currentProjectId, saveProject } = useProjectManager();
  useAutoSave(currentProjectId, saveProject);
  usePeriodicIntegrityCheck();
  return null;
}
