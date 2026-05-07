// ═══════════════════════════════════════════════════════════════════
// AUTHORING STORE — Main store (composes all slices)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
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
import { createSystemSlice } from './system-slice';
import { createPresetSlice } from './preset-slice';

export const useAuthoringStore = create<AuthoringState>()((...a) => ({
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
  ...createSystemSlice(...a),
  ...createPresetSlice(...a),
}));
