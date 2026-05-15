// ── Initial State Defaults ────────────────────────────────────────
import type {
  PanelId,
  MetaState,
  CpState,
  AtpState,
  MateriState,
  PetunjukData,
  DiskusiData,
  RefleksiData,
  MotivasiData,
  RangkumanData,
  PenutupData,
  SuaraConfig,
} from './types';

export const DEFAULT_PANEL: PanelId = 'dashboard';

export const DEFAULT_META: MetaState = {
  judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '',
  namaBab: '', mapel: '', kelas: '', kurikulum: '',
};

export const DEFAULT_CP: CpState = {
  elemen: '', subElemen: '', capaianFase: '', profil: [],
  fase: 'D', kelas: '',
};

export const DEFAULT_ATP: AtpState = { namaBab: '', jumlahPertemuan: 3, pertemuan: [] };

export const DEFAULT_MATERI: MateriState = { blok: [] };

export const DEFAULT_PETUNJUK: PetunjukData = { title: '', intro: '', langkah: [] };

export const DEFAULT_DISKUSI: DiskusiData = { title: '', intro: '', pertanyaan: [] };

export const DEFAULT_REFLEKSI: RefleksiData = { title: '', intro: '', pertanyaan: [] };

export const DEFAULT_MOTIVASI: MotivasiData = {
  title: 'Motivasi',
  intro: 'Mari kita mulai dengan pertanyaan pemantik!',
  pertanyaanPemicu: '',
  koneksi: '',
  aktivitas: '',
};

export const DEFAULT_RANGKUMAN: RangkumanData = {
  title: 'Rangkuman',
  intro: 'Berikut poin-poin penting dari materi yang telah dipelajari.',
  poin: [],
  tips: '',
};

export const DEFAULT_PENUTUP: PenutupData = { title: '', subjudul: '', preview: [] };

export const DEFAULT_SUARA: SuaraConfig = { navigasi: true, benar: true, salah: true, selesai: true, klik: true, skor: true };
