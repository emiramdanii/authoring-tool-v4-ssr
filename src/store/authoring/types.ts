// ── Types ────────────────────────────────────────────────────────
export type PanelId = 'dashboard' | 'dokumen' | 'konten' | 'canva' | 'autogen' | 'projects' | 'import' | 'preview' | 'versions';

export interface MetaState {
  judulPertemuan: string;
  subjudul: string;
  ikon: string;
  durasi: string;
  namaBab: string;
  mapel: string;
  kelas: string;
  kurikulum: string;
}

export interface CpState {
  elemen: string;
  subElemen: string;
  capaianFase: string;
  profil: string[];
  fase: string;
  kelas: string;
}

export interface TpItem {
  verb: string;
  desc: string;
  pertemuan: number;
  color: string;
}

export interface AtpPertemuan {
  judul: string;
  tp: string;
  durasi: string;
  kegiatan: string;
  penilaian: string;
}

export interface AtpState {
  namaBab: string;
  jumlahPertemuan: number;
  pertemuan: AtpPertemuan[];
}

export interface AlurItem {
  fase: string;
  durasi: string;
  judul: string;
  deskripsi: string;
}

export interface KuisItem {
  _id?: string; // Stable UUID reference (auto-generated)
  q: string;
  opts: string[];
  ans: number;
  ex: string;
}

export interface MateriBlok {
  tipe: string;
  judul?: string;
  isi?: string;
  icon?: string;
  warna?: string;
  butir?: string[];
  baris?: string[][];
  langkah?: Array<{ icon: string; judul: string; isi: string }>;
  kiri?: { icon?: string; judul?: string; isi?: string };
  kanan?: { icon?: string; judul?: string; isi?: string };
  items?: Array<{ icon?: string; angka?: string; satuan?: string; label?: string; warna?: string; judul?: string; isi?: string }>;
  style?: string;
  karakter?: string;
  situasi?: string;
  pertanyaan?: string;
  pesan?: string;
}

export interface MateriState {
  blok: MateriBlok[];
}

// ── Additional Section Types ──────────────────────────────────────
export interface PetunjukLangkah {
  icon: string;
  judul: string;
  isi: string;
}

export interface PetunjukData {
  title: string;
  intro: string;
  langkah: PetunjukLangkah[];
  tips?: string;
}

export interface DiskusiPertanyaan {
  label: string;
  icon: string;
  teks: string;
  petunjuk: string;
}

export interface DiskusiData {
  title: string;
  intro: string;
  pertanyaan: DiskusiPertanyaan[];
}

export interface RefleksiPertanyaan {
  teks: string;
  petunjuk: string;
  warna?: string;
  icon?: string;
}

export interface RefleksiData {
  title: string;
  intro: string;
  pertanyaan: RefleksiPertanyaan[];
  penugasan?: { judul: string; isi: string; contoh?: string };
}

export interface PenutupPreviewItem {
  icon: string;
  judul: string;
  isi: string;
  warna: string;
}

export interface PenutupData {
  title: string;
  subjudul: string;
  preview: PenutupPreviewItem[];
  nextPertemuan?: { judul: string; deskripsi: string; items: Array<{ icon: string; judul: string; isi: string; warna: string }> };
}

export interface SuaraConfig {
  navigasi: boolean;
  benar: boolean;
  salah: boolean;
  selesai: boolean;
  klik: boolean;
  skor: boolean;
}

// ── Preset Types ─────────────────────────────────────────────────
export interface MetaPreset {
  id: string;
  label: string;
  mapel: string;
  kelas: string;
  kurikulum: string;
  judulPertemuan: string;
  subjudul: string;
  ikon: string;
  durasi: string;
  namaBab: string;
}

export interface CpPreset {
  id: string;
  label: string;
  elemen: string;
  subElemen: string;
  capaianFase: string;
  profil: string[];
  fase: string;
  kelas: string;
}

export interface TpPreset {
  id: string;
  label: string;
  items: TpItem[];
}

export interface AtpPreset {
  id: string;
  label: string;
  namaBab: string;
  jumlahPertemuan: number;
  pertemuan: AtpPertemuan[];
}

export interface AlurPreset {
  id: string;
  label: string;
  steps: AlurItem[];
}

export interface KuisPreset {
  id: string;
  label: string;
  soal: KuisItem[];
}

// ── Helper Constants & Functions ─────────────────────────────────
export const VERB_OPTIONS = [
  'Menjelaskan', 'Mengidentifikasi', 'Menganalisis', 'Memberikan contoh',
  'Menerapkan', 'Mengevaluasi', 'Membandingkan', 'Menyimpulkan',
  'Mendeskripsikan', 'Merancang', 'Membuat', 'Mempresentasikan',
];

export const COLOR_OPTIONS = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c'];

export function colorForIndex(i: number): string {
  return COLOR_OPTIONS[i % COLOR_OPTIONS.length];
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
