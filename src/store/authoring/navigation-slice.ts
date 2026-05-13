// ── Navigation Slice ──────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import type { PanelId } from './types';
import { DEFAULT_PANEL } from './initial-state';

export type NavigationSlice = Pick<AuthoringState, 'activePanel' | 'setActivePanel'>;

export const createNavigationSlice: StateCreator<AuthoringState, [], [], NavigationSlice> = (set) => ({
  activePanel: DEFAULT_PANEL,
  setActivePanel: (panel: PanelId) => set({ activePanel: panel }),
});
