// ── Skenario Slice ────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, SkenarioChapter, SkenarioSetupLine, SkenarioChoice, SkenarioConsequence } from './types';

export type SkenarioSlice = Pick<AuthoringState,
  | 'skenario' | 'setSkenario'
  | 'addSkenarioChapter' | 'removeSkenarioChapter' | 'updateSkenarioChapter'
  | 'addSkenarioSetup' | 'removeSkenarioSetup' | 'updateSkenarioSetup'
  | 'addSkenarioChoice' | 'removeSkenarioChoice' | 'updateSkenarioChoice'
  | 'addSkenarioConsequence' | 'removeSkenarioConsequence' | 'updateSkenarioConsequence'
>;

export const createSkenarioSlice: StateCreator<AuthoringState, [], [], SkenarioSlice> = (set) => ({
  skenario: [],
  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  setSkenario: (data: SkenarioChapter[]) => {
    console.warn('[deprecated] setSkenario() — Use useSchemaSkenario() or applyGuidedSchemaPatch() instead');
    set({ skenario: data, dirty: true });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  addSkenarioChapter: () => {
    console.warn('[deprecated] addSkenarioChapter() — Use useSchemaSkenario().addChapter() or applyGuidedSchemaPatch() instead');
    const newChapter: SkenarioChapter = {
      title: '',
      bg: 'sbg-kampung',
      charEmoji: '\uD83E\uDDD1',
      charColor: '#3ecfcf',
      charPants: '#2563eb',
      choicePrompt: 'Apa yang akan kamu lakukan?',
      setup: [{ speaker: 'NARRATOR', text: '' }],
      choices: [{
        icon: '\uD83E\uDD1D', label: '', detail: '', good: true, pts: 10, level: 'good',
        norma: '', resultTitle: '', resultBody: '',
        consequences: [{ icon: '\u2705', text: '' }],
      }],
    };
    set((s) => ({ skenario: [...s.skenario, newChapter], dirty: true }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  removeSkenarioChapter: (index: number) => {
    console.warn('[deprecated] removeSkenarioChapter() — Use useSchemaSkenario().removeChapter() or applyGuidedSchemaPatch() instead');
    set((s) => ({ skenario: s.skenario.filter((_, i) => i !== index), dirty: true }));
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  updateSkenarioChapter: (index: number, key: string, value: unknown) => {
    console.warn('[deprecated] updateSkenarioChapter() — Use useSchemaSkenario().updateChapter() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      next[index] = { ...next[index], [key]: value };
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  addSkenarioSetup: (chapterIndex: number) => {
    console.warn('[deprecated] addSkenarioSetup() — Use useSchemaSkenario().addSetup() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup: SkenarioSetupLine[] = [...(chapter.setup || []), { speaker: '', text: '' }];
      chapter.setup = setup;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  removeSkenarioSetup: (chapterIndex: number, setupIndex: number) => {
    console.warn('[deprecated] removeSkenarioSetup() — Use useSchemaSkenario().removeSetup() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup: SkenarioSetupLine[] = (chapter.setup || []).filter((_, i) => i !== setupIndex);
      chapter.setup = setup.length > 0 ? setup : [{ speaker: '', text: '' }];
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  updateSkenarioSetup: (chapterIndex: number, setupIndex: number, key: string, value: unknown) => {
    console.warn('[deprecated] updateSkenarioSetup() — Use useSchemaSkenario().updateSetup() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup: SkenarioSetupLine[] = [...(chapter.setup || [])];
      (setup[setupIndex] as unknown as Record<string, unknown>)[key] = value;
      chapter.setup = setup;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  addSkenarioChoice: (chapterIndex: number) => {
    console.warn('[deprecated] addSkenarioChoice() — Use useSchemaSkenario().addChoice() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices: SkenarioChoice[] = [...(chapter.choices || []), {
        icon: '\uD83E\uDD1D', label: '', detail: '', good: false, pts: 5, level: 'mid',
        norma: '', resultTitle: '', resultBody: '',
        consequences: [{ icon: '\u26A0\uFE0F', text: '' }],
      }];
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  removeSkenarioChoice: (chapterIndex: number, choiceIndex: number) => {
    console.warn('[deprecated] removeSkenarioChoice() — Use useSchemaSkenario().removeChoice() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices: SkenarioChoice[] = (chapter.choices || []).filter((_, i) => i !== choiceIndex);
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  updateSkenarioChoice: (chapterIndex: number, choiceIndex: number, key: string, value: unknown) => {
    console.warn('[deprecated] updateSkenarioChoice() — Use useSchemaSkenario().updateChoice() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices: SkenarioChoice[] = [...(chapter.choices || [])];
      choices[choiceIndex] = { ...choices[choiceIndex], [key]: value };
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  addSkenarioConsequence: (chapterIndex: number, choiceIndex: number) => {
    console.warn('[deprecated] addSkenarioConsequence() — Use useSchemaSkenario().addConsequence() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices: SkenarioChoice[] = [...(chapter.choices || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences: SkenarioConsequence[] = [...(choice.consequences || []), { icon: '\uD83D\uDCCC', text: '' }];
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  removeSkenarioConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number) => {
    console.warn('[deprecated] removeSkenarioConsequence() — Use useSchemaSkenario().removeConsequence() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices: SkenarioChoice[] = [...(chapter.choices || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences: SkenarioConsequence[] = (choice.consequences || []).filter((_, i) => i !== consIndex);
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  /** @deprecated Phase 5 — Use applyGuidedSchemaPatch() via useSchemaSkenario() hooks instead. Content writes should go through schema. */
  updateSkenarioConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number, key: string, value: unknown) => {
    console.warn('[deprecated] updateSkenarioConsequence() — Use useSchemaSkenario().updateConsequence() or applyGuidedSchemaPatch() instead');
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices: SkenarioChoice[] = [...(chapter.choices || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences: SkenarioConsequence[] = [...(choice.consequences || [])];
      consequences[consIndex] = { ...consequences[consIndex], [key]: value };
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
});
