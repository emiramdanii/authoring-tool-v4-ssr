// ── Sheet config constants ──────────────────────────────────────

export const META_HEADERS = ['judulPertemuan', 'subjudul', 'ikon', 'durasi', 'namaBab', 'mapel', 'kelas', 'kurikulum'];
export const CP_HEADERS = ['elemen', 'subElemen', 'capaianFase', 'profil', 'fase', 'kelas'];
export const TP_HEADERS = ['verb', 'desc', 'pertemuan', 'color'];
export const ATP_HEADERS = ['namaBab', 'no', 'judul', 'tp', 'durasi', 'kegiatan', 'penilaian'];
export const ALUR_HEADERS = ['no', 'fase', 'durasi', 'judul', 'deskripsi'];
export const KUIS_HEADERS = ['no', 'soal', 'optA', 'optB', 'optC', 'optD', 'jawaban', 'penjelasan'];

export const SHEET_NAMES = ['META', 'CP', 'TP', 'ATP', 'ALUR', 'KUIS'] as const;

export const HEADER_MAP: Record<string, string[]> = {
  META: META_HEADERS,
  CP: CP_HEADERS,
  TP: TP_HEADERS,
  ATP: ATP_HEADERS,
  ALUR: ALUR_HEADERS,
  KUIS: KUIS_HEADERS,
};

export const SHEET_DESCRIPTIONS: Record<string, string> = {
  META: 'Metadata pertemuan',
  CP: 'Capaian Pembelajaran',
  TP: 'Tujuan Pembelajaran',
  ATP: 'Alur Tujuan Pembelajaran',
  ALUR: 'Alur Kegiatan',
  KUIS: 'Soal Kuis',
};

export const SHEET_COLORS: Record<string, string> = {
  META: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CP: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  TP: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  ATP: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ALUR: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  KUIS: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};
