// ── Presets Index — Re-exports + FULL_PRESET_MAP ───────────────────
export { PRESETS_META, PRESETS_CP } from './cp-presets';
export { PRESETS_TP } from './tp-presets';
export { PRESETS_ATP } from './atp-presets';
export { PRESETS_ALUR } from './alur-presets';
export { PRESETS_KUIS } from './kuis-presets';
export { PRESETS_SKENARIO } from './skenario-presets';
export { PRESETS_MODULES } from './module-presets';
export { PRESETS_MATERI } from './materi-presets';
export { PRESETS_PETUNJUK, PRESETS_DISKUSI, PRESETS_REFLEKSI, PRESETS_MOTIVASI, PRESETS_RANGKUMAN, PRESETS_PENUTUP, PRESETS_SUARA } from './activity-presets';

// ── Full Preset Mapping ──────────────────────────────────────────
export const FULL_PRESET_MAP: Record<string, { meta: string; cp: string; tp: string; atp: string; alur: string; kuis: string; skenario: string; modules: string; materi: string; petunjuk: string; diskusi: string; refleksi: string; motivasi: string; rangkuman: string; penutup: string; suara: string }> = {
  'hakikat-norma': { meta: 'hakikat-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'hakikat-norma-80menit', kuis: 'norma-10-soal', skenario: 'hakikat-norma', modules: 'hakikat-norma', materi: 'hakikat-norma', petunjuk: 'hakikat-norma', diskusi: 'hakikat-norma', refleksi: 'hakikat-norma', motivasi: 'hakikat-norma', rangkuman: 'hakikat-norma', penutup: 'hakikat-norma', suara: 'hakikat-norma' },
  'macam-norma': { meta: 'macam-norma', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'macam-norma-80menit', kuis: 'macam-norma-8soal', skenario: 'macam-norma', modules: 'macam-norma', materi: 'macam-norma', petunjuk: 'macam-norma', diskusi: 'macam-norma', refleksi: 'macam-norma', motivasi: 'macam-norma', rangkuman: 'macam-norma', penutup: 'macam-norma', suara: 'macam-norma' },
  'perilaku-patuhan': { meta: 'perilaku-patuhan', cp: 'ppkn-smp-bab3', tp: 'bab3-full', atp: 'bab3-3pertemuan', alur: 'perilaku-patuhan-80menit', kuis: 'perilaku-patuhan-10soal', skenario: 'perilaku-patuhan', modules: 'perilaku-patuhan', materi: 'perilaku-patuhan', petunjuk: 'perilaku-patuhan', diskusi: 'perilaku-patuhan', refleksi: 'perilaku-patuhan', motivasi: 'perilaku-patuhan', rangkuman: 'perilaku-patuhan', penutup: 'perilaku-patuhan', suara: 'perilaku-patuhan' },
  blank: { meta: 'blank', cp: 'blank', tp: 'blank', atp: 'blank', alur: 'blank', kuis: 'blank', skenario: 'blank', modules: 'blank', materi: 'blank', petunjuk: 'blank', diskusi: 'blank', refleksi: 'blank', motivasi: 'blank', rangkuman: 'blank', penutup: 'blank', suara: 'blank' },
};
