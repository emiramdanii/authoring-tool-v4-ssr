// ── Kuis Slice ────────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState } from './types';
import { generateKuisId } from '@/lib/module-resolver';

export type KuisSlice = Pick<AuthoringState, 'kuis' | 'addKuis' | 'deleteKuis' | 'updateKuis' | 'updateKuisOpt' | 'reorderKuis'>;

export const createKuisSlice: StateCreator<AuthoringState, [], [], KuisSlice> = (set) => ({
  kuis: [],
  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaKuis() hooks instead. Content writes should go through schema. */
  addKuis: () => {
    console.warn('[deprecated] addKuis() — Use useSchemaKuis().addQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({
      kuis: [...s.kuis, { _id: generateKuisId(), q: '', opts: ['', '', '', ''], ans: 0, ex: '' }],
      dirty: true,
    }));
  },
  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaKuis() hooks instead. Content writes should go through schema. */
  deleteKuis: (index: number) => {
    console.warn('[deprecated] deleteKuis() — Use useSchemaKuis().removeQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => ({ kuis: s.kuis.filter((_, i) => i !== index), dirty: true }));
  },
  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaKuis() hooks instead. Content writes should go through schema. */
  updateKuis: (index: number, key: string, value: unknown) => {
    console.warn('[deprecated] updateKuis() — Use useSchemaKuis().updateQuestion() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const newKuis = [...s.kuis];
      newKuis[index] = { ...newKuis[index], [key]: value };
      return { kuis: newKuis, dirty: true };
    });
  },
  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaKuis() hooks instead. Content writes should go through schema. */
  updateKuisOpt: (index: number, optIndex: number, value: string) => {
    console.warn('[deprecated] updateKuisOpt() — Use useSchemaKuis().updateOption() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const newKuis = [...s.kuis];
      const opts = [...(newKuis[index]!.opts || ['', '', '', '']!)];
      opts[optIndex] = value;
      newKuis[index] = { ...newKuis[index], opts };
      return { kuis: newKuis, dirty: true };
    });
  },
  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaKuis() hooks instead. Content writes should go through schema. */
  reorderKuis: (fromIndex: number, toIndex: number) => {
    console.warn('[deprecated] reorderKuis() — Use useSchemaKuis().reorderQuestions() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const kuis = [...s.kuis];
      const [moved] = kuis.splice(fromIndex, 1);
      kuis.splice(toIndex, 0!, moved);
      return { kuis, dirty: true };
    });
  },
});
