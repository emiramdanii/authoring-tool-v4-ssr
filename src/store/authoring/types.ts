// ── Types ────────────────────────────────────────────────────────
export type PanelId = 'dashboard' | 'dokumen' | 'konten' | 'canva' | 'autogen' | 'projects' | 'import' | 'preview' | 'versions';

// ── Module Types ────────────────────────────────────────────────
/**
 * Base interface for all modules and games.
 *
 * Provides typed access to the most common fields (`_id`, `type`, `title`)
 * while still allowing dynamic property access via the index signature.
 * This eliminates the need for `as string` casts on core fields while
 * remaining compatible with the 26+ module types that have varied shapes.
 *
 * MIGRATION NOTE: Components that previously used `Record<string, unknown>`
 * should now use `Module`. Accessing `mod.type`, `mod._id`, `mod.title`
 * no longer requires a type cast. Other fields like `mod.intro`,
 * `mod.kartu`, etc. still return `unknown` from the index signature
 * and may need individual casts until per-type interfaces are added.
 */
export interface Module {
  /** Stable UUID reference (auto-generated on creation) */
  _id: string;
  /** Module type identifier (e.g. 'flashcard', 'roda', 'skenario') */
  type: string;
  /** Display title */
  title: string;
  /** Layout variant for preset card rendering ('A' | 'B' | 'C' | 'D') */
  layoutVariant?: string;
  /** Allow dynamic property access for type-specific fields */
  [key: string]: unknown;
}

// ── Game Type ────────────────────────────────────────────────────
/**
 * A Game is simply a Module whose `type` is in the GAME_TYPES list.
 * Games are derived from the modules array by filtering, so they
 * share the same shape. This type alias makes intent clear.
 */
export type Game = Module;

// ── Skenario Types ──────────────────────────────────────────────
export interface SkenarioSetupLine {
  speaker: string;
  text: string;
}

export interface SkenarioConsequence {
  icon: string;
  text: string;
}

export interface SkenarioChoice {
  icon: string;
  label: string;
  detail: string;
  good: boolean;
  pts: number;
  level: string;
  norma: string;
  resultTitle: string;
  resultBody: string;
  consequences: SkenarioConsequence[];
  [key: string]: unknown;
}

export interface SkenarioChapter {
  title: string;
  bg: string;
  charEmoji: string;
  charColor: string;
  charPants: string;
  choicePrompt: string;
  setup: SkenarioSetupLine[];
  choices: SkenarioChoice[];
  [key: string]: unknown;
}

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
  pertemuan?: number; // Pertemuan ke berapa (1-based), undefined = tanpa tag
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
  /** Infobox style variant: info / tip / warning */
  infoboxStyle?: string;
  karakter?: string;
  situasi?: string;
  pertanyaan?: string;
  pesan?: string;
  pertemuan?: number; // Pertemuan ke berapa (1-based), undefined = semua pertemuan
  tabGroup?: string;  // Group name for tab organization — blocks with same tabGroup go into the same tab
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
  navigation?: string[];
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

// MotivasiData — for apersepsi/motivasi section
export interface MotivasiData {
  title: string;
  intro: string;
  pertanyaanPemicu: string;       // Hook question to spark curiosity
  koneksi: string;                 // Connection to prior knowledge
  aktivitas: string;               // Short activity suggestion
  visual?: string;                 // Optional visual/emoji prompt
}

// RangkumanData — for summary/conclusion section
export interface RangkumanData {
  title: string;
  intro: string;
  poin: string[];                  // Key points
  tips: string;                    // Study tips or reminders
  closingStatement?: string;       // Optional closing
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

// ── Full Store Interface ──────────────────────────────────────────
export interface AuthoringState {
  // Navigation
  activePanel: PanelId;

  // Mode tracking
  activePreset: string | null;

  // Data
  meta: MetaState;
  cp: CpState;
  tp: TpItem[];
  atp: AtpState;
  alur: AlurItem[];
  skenario: SkenarioChapter[];
  kuis: KuisItem[];
  modules: Module[];
  games: Game[];
  materi: MateriState;
  petunjuk: PetunjukData;
  diskusi: DiskusiData;
  refleksi: RefleksiData;
  motivasi: MotivasiData;
  rangkuman: RangkumanData;
  penutup: PenutupData;
  suara: SuaraConfig;

  // System
  dirty: boolean;
  guruPw: string;
  teacherMode: 'lengkap' | 'sederhana';

  // Flag for auto canvas generation after preset
  pendingCanvasGenerate: string | null;

  // Navigation actions
  setActivePanel: (panel: PanelId) => void;

  // Meta actions
  updateMeta: (key: keyof MetaState, value: string) => void;

  // CP actions
  updateCp: (key: string, value: unknown) => void;
  addProfil: (value: string) => void;
  removeProfil: (index: number) => void;

  // TP actions
  addTp: () => void;
  deleteTp: (index: number) => void;
  updateTp: (index: number, key: keyof TpItem, value: unknown) => void;
  reorderTp: (fromIndex: number, toIndex: number) => void;

  // ATP actions
  updateAtpNamaBab: (value: string) => void;
  addAtpPertemuan: () => void;
  deleteAtpPertemuan: (index: number) => void;
  updateAtpPertemuan: (index: number, key: keyof AtpPertemuan, value: string) => void;

  // Alur actions
  addAlur: () => void;
  deleteAlur: (index: number) => void;
  updateAlur: (index: number, key: keyof AlurItem, value: string) => void;
  reorderAlur: (fromIndex: number, toIndex: number) => void;

  // [Phase 5] Kuis write actions REMOVED — use useSchemaKuis() or applyGuidedSchemaPatch()

  // [Phase 5] Materi write actions REMOVED — use useSchemaMateri() or applyGuidedSchemaPatch()

  // [Phase 5-D] Module write actions REMOVED — use useSchemaModules() or applyGuidedSchemaPatch()

  // [Phase 5] Skenario write actions REMOVED — use applyGuidedSchemaPatch() with skenario blocks

  // [Phase 5] Diskusi write actions REMOVED — use useSchemaDiskusi() or applyGuidedSchemaPatch()

  // [Phase 5] Refleksi write actions REMOVED — use useSchemaRefleksi() or applyGuidedSchemaPatch()

  // [Phase 5] Motivasi write actions REMOVED — use applyGuidedSchemaPatch() with motivasi blocks

  // [Phase 5] Rangkuman write actions REMOVED — use useSchemaRangkuman() or applyGuidedSchemaPatch()

  // Sound actions
  toggleSuaraAll: () => void;

  // System actions
  markDirty: () => void;
  markClean: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  setTeacherMode: (mode: 'lengkap' | 'sederhana') => void;

  // Completeness
  calcCompleteness: () => number;

  // Presets
  applyFullPreset: (presetKey: string) => void;
  applyKuisPreset: (presetKey: string) => void;
  applyTpPreset: (presetKey: string) => void;
  applyCpPreset: (presetKey: string) => void;
  applyAtpPreset: (presetKey: string) => void;
  applyAlurPreset: (presetKey: string) => void;
  applyMetaPreset: (presetKey: string) => void;
  newProject: () => void;
}

// ── Storage Key ──────────────────────────────────────────────────
export const STORAGE_KEY = 'at_state_v1';

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
