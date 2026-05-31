// ── Module Slice ──────────────────────────────────────────────────
// Phase 5-D: Write actions REMOVED. All writes now go through:
//   - useSchemaModules() hook (for game blocks → schema)
//   - applyGuidedSchemaPatch() (for guided form edits)
//   - useAuthoringStore.setState() (for projection-only modules)
//
// The modules field is now a READ-ONLY projection derived from schema
// via startProjectionSync(). Direct writes via slice actions are no
// longer needed.
import type { StateCreator } from 'zustand';
import type { AuthoringState, Module, Game } from './types';
import { GAME_TYPES } from '@/lib/canva-constants';

/** Derive games from modules — called on every modules change */
function deriveGames(modules: Module[]): Game[] {
  return modules.filter(m => (GAME_TYPES as readonly string[]).includes(m.type));
}

export type ModuleSlice = Pick<AuthoringState, 'modules'>;

export const createModuleSlice: StateCreator<AuthoringState, [], [], ModuleSlice> = (set) => ({
  modules: [],
  // Phase 5-D: Removed write actions — modules is now a read-only projection.
  // addModule, removeModule, updateModuleField, moveModule,
  // addModuleItem, removeModuleItem, updateModuleItem — all DELETED.
  // Use useSchemaModules() for game blocks, or applyGuidedSchemaPatch() for edits.
});
