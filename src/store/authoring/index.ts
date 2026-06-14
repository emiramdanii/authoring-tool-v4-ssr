// ═══════════════════════════════════════════════════════════════════
// AUTHORING STORE — Main store (composes all slices)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AuthoringState } from './types';
import { createNavigationSlice } from './navigation-slice';
import { createMetaSlice } from './meta-slice';
import { createCpSlice } from './cp-slice';
import { createTpSlice } from './tp-slice';
import { createAtpSlice } from './atp-slice';
import { createAlurSlice } from './alur-slice';
import { createKuisSlice } from './kuis-slice';
import { createMateriSlice } from './materi-slice';
import { createModuleSlice } from './module-slice';
import { createSkenarioSlice } from './skenario-slice';
import { createMotivasiRangkumanSlice } from './motivasi-rangkuman-slice';
import { createDiskusiRefleksiSlice } from './diskusi-refleksi-slice';
import { createSystemSlice } from './system-slice';
import { createPresetSlice } from './preset-slice';

export const useAuthoringStore = create<AuthoringState>()(devtools((...a) => ({
  ...createNavigationSlice(...a),
  ...createMetaSlice(...a),
  ...createCpSlice(...a),
  ...createTpSlice(...a),
  ...createAtpSlice(...a),
  ...createAlurSlice(...a),
  ...createKuisSlice(...a),
  ...createMateriSlice(...a),
  ...createModuleSlice(...a),
  ...createSkenarioSlice(...a),
  ...createMotivasiRangkumanSlice(...a),
  ...createDiskusiRefleksiSlice(...a),
  ...createSystemSlice(...a),
  ...createPresetSlice(...a),
}), { name: 'AuthoringStore', enabled: process.env.NODE_ENV === 'development' }));

// ═══════════════════════════════════════════════════════════════════
// DIRTY BRIDGE — Sync AuthoringStore.dirty → useDirtyStore
// ═══════════════════════════════════════════════════════════════════
// Sprint 7.1: The bridge now only syncs dirty→true to useDirtyStore.
// markClean() is NO LONGER synced from AuthoringStore because:
//   - AuthoringStore.saveToStorage() no longer sets dirty:false
//   - Cleanness is now managed by the revision-based state machine
//   - Only saveSucceeded() with matching revision can clear dirty
//
// Legacy markClean() calls from AuthoringStore (e.g., loadFromStorage)
// still propagate but are harmless — resetOnLoad() handles load scenarios.
// ═══════════════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  // Lazy import to avoid circular dependency at module init
  const { useDirtyStore } = require('@/store/dirty-store');
  let prevDirty = useAuthoringStore.getState().dirty;
  useAuthoringStore.subscribe((state) => {
    if (state.dirty !== prevDirty) {
      prevDirty = state.dirty;
      if (state.dirty) {
        // Edit happened → increment revision
        useDirtyStore.getState().markDirty();
      }
      // Sprint 7.1: Do NOT call markClean() from the bridge.
      // Cleanness is managed by saveSucceeded() only.
      // Legacy paths that set dirty:false (like loadFromStorage)
      // should use resetOnLoad() instead.
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // AUTO-DERIVE GAMES FROM MODULES (Phase 5-H)
  // ═══════════════════════════════════════════════════════════════════
  // `games` is always a filtered subset of `modules`. Rather than
  // manually setting it in preset-slice, persistence-slice, and
  // import handlers, we auto-derive it whenever `modules` changes.
  // This eliminates the redundant `games` field write and ensures
  // consistency — games can never drift out of sync with modules.
  // ═══════════════════════════════════════════════════════════════════
  const { GAME_TYPES } = require('@/lib/canva-constants');
  let prevModulesLength = -1;
  let prevModulesHash = '';
  useAuthoringStore.subscribe((state) => {
    // Only recalculate when modules actually changes (shallow check via length + type hash)
    const currentHash = state.modules.map(m => m._id + ':' + m.type).join('|');
    if (state.modules.length !== prevModulesLength || currentHash !== prevModulesHash) {
      prevModulesLength = state.modules.length;
      prevModulesHash = currentHash;
      const derivedGames = state.modules.filter((m: import('@/store/authoring/types').Module) =>
        (GAME_TYPES as readonly string[]).includes(m.type)
      );
      // Only setState if games actually differs (prevent infinite loop)
      const currentGames = useAuthoringStore.getState().games ?? [];
      if (derivedGames.length !== currentGames.length ||
          derivedGames.some((g, i) => g._id !== currentGames[i]?._id)) {
        useAuthoringStore.setState({ games: derivedGames } as Partial<import('@/store/authoring/types').AuthoringState>);
      }
    }
  });
}
