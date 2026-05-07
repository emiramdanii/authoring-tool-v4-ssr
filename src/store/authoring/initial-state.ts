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

export const DEFAULT_PENUTUP: PenutupData = { title: '', subjudul: '', preview: [] };

export const DEFAULT_SUARA: SuaraConfig = { navigasi: false, benar: false, salah: false, selesai: false, klik: false, skor: false };
