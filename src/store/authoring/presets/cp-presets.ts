// ── CP Presets (Meta + CP) ────────────────────────────────────────
import type { MetaPreset, CpPreset } from '../types';

export const PRESETS_META: Record<string, MetaPreset> = {
  'hakikat-norma': {
    id: 'hakikat-norma', label: 'Bab 3 – Pertemuan 1: Hakikat Norma',
    mapel: 'PPKn', kelas: 'VII', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: 'Pertemuan 1 – Hakikat Norma',
    subjudul: 'Mengapa manusia membutuhkan norma?',
    ikon: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', durasi: '2 \u00D7 40 menit', namaBab: 'Hakikat Norma',
  },
  'macam-norma': {
    id: 'macam-norma', label: 'Bab 3 – Pertemuan 2: Macam-Macam Norma',
    mapel: 'PPKn', kelas: 'VII', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: 'Pertemuan 2 – Macam-Macam Norma',
    subjudul: 'Apa saja jenis norma yang mengatur kehidupan kita?',
    ikon: '\uD83D\uDCDC', durasi: '2 \u00D7 40 menit', namaBab: 'Macam-Macam Norma',
  },
  'perilaku-patuhan': {
    id: 'perilaku-patuhan', label: 'Bab 3 – Pertemuan 3: Perilaku Patuh terhadap Norma',
    mapel: 'PPKn', kelas: 'VII', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: 'Pertemuan 3 – Perilaku Patuh terhadap Norma',
    subjudul: 'Bagaimana menerapkan norma dalam kehidupan sehari-hari?',
    ikon: '⚖️', durasi: '2 × 40 menit', namaBab: 'Perilaku Patuh terhadap Norma',
  },
  blank: {
    id: 'blank', label: 'Kosong – Mulai dari Nol',
    mapel: '', kelas: '', kurikulum: 'Kurikulum Merdeka',
    judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '2 \u00D7 40 menit', namaBab: '',
  },
};

export const PRESETS_CP: Record<string, CpPreset> = {
  'ppkn-smp-bab3': {
    id: 'ppkn-smp-bab3',
    label: 'PPKn SMP – Bab 3: Patuh terhadap Norma',
    elemen: 'Pancasila',
    subElemen: 'Pemahaman norma dan nilai',
    capaianFase: 'Peserta didik mampu menganalisis pentingnya norma dalam kehidupan bermasyarakat, berbangsa, dan bernegara; serta menunjukkan perilaku patuh terhadap norma sebagai wujud kesadaran hukum.',
    profil: ['Beriman & Bertakwa kepada Tuhan YME', 'Berkebhinekaan Global', 'Bergotong Royong', 'Bernalar Kritis'],
    fase: 'D', kelas: 'VII',
  },
  blank: { id: 'blank', label: 'Kosong – Isi Manual', elemen: '', subElemen: '', capaianFase: '', profil: [], fase: 'D', kelas: '' },
};
