'use client';

import { useAutoSave } from '@/hooks/use-auto-save';
import { useProjectManager } from '@/hooks/use-project-manager';
import { usePeriodicIntegrityCheck } from '@/hooks/use-periodic-integrity-check';

/**
 * Wrapper that connects the project context to the auto-save hook.
 * When a project is loaded (currentProjectId is set), auto-save
 * persists to the database via the pure persistence primitive.
 * Otherwise, it falls back to localStorage.
 *
 * Patch-2 P0-1 Fix: useAutoSave receives persistCurrentProject
 * (a pure persistence primitive) instead of saveProject (which
 * wraps executeDurableSave). This prevents coordinator-inside-coordinator
 * where the outer coordinator's single-flight guard swallows the
 * inner coordinator's DB request, marking the project clean without
 * ever reaching the database.
 *
 * Also runs periodic integrity checks (FASE 6).
 */
export function CanvaAutoSaveSync() {
  const { currentProjectId, persistCurrentProject } = useProjectManager();
  useAutoSave(currentProjectId, persistCurrentProject);
  usePeriodicIntegrityCheck();
  return null;
}
