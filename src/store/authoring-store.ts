'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { generateModuleId, ensureModuleIds, generateKuisId, ensureKuisIds } from '@/lib/module-resolver';

// ── Re-export types for backward compatibility ──────────────────
export type {
  PanelId,
  MetaState,
  CpState,
  TpItem,
  AtpPertemuan,
  AtpState,
  AlurItem,
  KuisItem,
  MateriBlok,
  MateriState,
  PetunjukLangkah,
  PetunjukData,
  DiskusiPertanyaan,
  DiskusiData,
  RefleksiPertanyaan,
  RefleksiData,
  PenutupPreviewItem,
  PenutupData,
  SuaraConfig,
  MetaPreset,
  CpPreset,
  TpPreset,
  AtpPreset,
  AlurPreset,
  KuisPreset,
} from './authoring/types';

export { VERB_OPTIONS, COLOR_OPTIONS, colorForIndex, deepClone } from './authoring/types';

// ── Import types for internal use ────────────────────────────────
import type {
  PanelId,
  MetaState,
  CpState,
  TpItem,
  AtpPertemuan,
  AtpState,
  AlurItem,
  KuisItem,
  MateriBlok,
  MateriState,
  PetunjukData,
  DiskusiData,
  RefleksiData,
  PenutupData,
  SuaraConfig,
} from './authoring/types';

import { colorForIndex, deepClone } from './authoring/types';

const STORAGE_KEY = 'at_state_v1';

// ── Import preset data ───────────────────────────────────────────
import {
  PRESETS_META,
  PRESETS_CP,
  PRESETS_TP,
  PRESETS_ATP,
  PRESETS_ALUR,
  PRESETS_KUIS,
  PRESETS_SKENARIO,
  PRESETS_MODULES,
  PRESETS_MATERI,
  PRESETS_PETUNJUK,
  PRESETS_DISKUSI,
  PRESETS_REFLEKSI,
  PRESETS_PENUTUP,
  PRESETS_SUARA,
  FULL_PRESET_MAP,
} from './authoring/presets';

// ── Store Interface ──────────────────────────────────────────────
interface AuthoringState {
  // Navigation
  activePanel: PanelId;

  // Mode tracking
  activePreset: string | null; // null = project mode, string = preset key

  // Data
  meta: MetaState;
  cp: CpState;
  tp: TpItem[];
  atp: AtpState;
  alur: AlurItem[];
  skenario: Array<Record<string, unknown>>;
  kuis: KuisItem[];
  modules: Array<Record<string, unknown>>;
  games: Array<Record<string, unknown>>;
  materi: MateriState;
  petunjuk: PetunjukData;
  diskusi: DiskusiData;
  refleksi: RefleksiData;
  penutup: PenutupData;
  suara: SuaraConfig;

  // System
  dirty: boolean;
  guruPw: string;

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

  // Kuis actions
  addKuis: () => void;
  deleteKuis: (index: number) => void;
  updateKuis: (index: number, key: string, value: unknown) => void;
  updateKuisOpt: (index: number, optIndex: number, value: string) => void;
  reorderKuis: (fromIndex: number, toIndex: number) => void;

  // Materi block actions
  addMateriBlok: (tipe: string) => void;
  removeMateriBlok: (index: number) => void;
  updateMateriBlok: (index: number, key: string, value: unknown) => void;
  moveMateriBlok: (fromIndex: number, toIndex: number) => void;

  // Module actions
  addModule: (typeId: string) => void;
  removeModule: (index: number) => void;
  updateModuleField: (index: number, key: string, value: unknown) => void;
  moveModule: (fromIndex: number, toIndex: number) => void;
  addModuleItem: (moduleIndex: number, arrayKey: string, defaultItem: Record<string, unknown>) => void;
  removeModuleItem: (moduleIndex: number, arrayKey: string, itemIndex: number) => void;
  updateModuleItem: (moduleIndex: number, arrayKey: string, itemIndex: number, key: string, value: unknown) => void;

  // Skenario actions
  setSkenario: (data: Array<Record<string, unknown>>) => void;
  addSkenarioChapter: () => void;
  removeSkenarioChapter: (index: number) => void;
  updateSkenarioChapter: (index: number, key: string, value: unknown) => void;
  addSkenarioSetup: (chapterIndex: number) => void;
  removeSkenarioSetup: (chapterIndex: number, setupIndex: number) => void;
  updateSkenarioSetup: (chapterIndex: number, setupIndex: number, key: string, value: unknown) => void;
  addSkenarioChoice: (chapterIndex: number) => void;
  removeSkenarioChoice: (chapterIndex: number, choiceIndex: number) => void;
  updateSkenarioChoice: (chapterIndex: number, choiceIndex: number, key: string, value: unknown) => void;
  addSkenarioConsequence: (chapterIndex: number, choiceIndex: number) => void;
  removeSkenarioConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number) => void;
  updateSkenarioConsequence: (chapterIndex: number, choiceIndex: number, consIndex: number, key: string, value: unknown) => void;

  // System actions
  markDirty: () => void;
  markClean: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => boolean;

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

// ── Create Store ─────────────────────────────────────────────────
export const useAuthoringStore = create<AuthoringState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  activePanel: 'dashboard' as PanelId,
  activePreset: null as string | null,

  meta: {
    judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '',
    namaBab: '', mapel: '', kelas: '', kurikulum: '',
  },
  cp: {
    elemen: '', subElemen: '', capaianFase: '', profil: [],
    fase: 'D', kelas: '',
  },
  tp: [],
  atp: { namaBab: '', jumlahPertemuan: 3, pertemuan: [] },
  alur: [],
  skenario: [],
  kuis: [],
  modules: [],
  games: [],
  materi: { blok: [] },
  petunjuk: { title: '', intro: '', langkah: [] },
  diskusi: { title: '', intro: '', pertanyaan: [] },
  refleksi: { title: '', intro: '', pertanyaan: [] },
  penutup: { title: '', subjudul: '', preview: [] },
  suara: { navigasi: false, benar: false, salah: false, selesai: false, klik: false, skor: false },

  dirty: false,
  guruPw: 'guru123',
  pendingCanvasGenerate: null as string | null,

  // ── Navigation ─────────────────────────────────────────────────
  setActivePanel: (panel) => set({ activePanel: panel }),

  // ── Meta ───────────────────────────────────────────────────────
  updateMeta: (key, value) => {
    set((s) => ({ meta: { ...s.meta, [key]: value }, dirty: true }));
  },

  // ── CP ─────────────────────────────────────────────────────────
  updateCp: (key, value) => {
    set((s) => ({ cp: { ...s.cp, [key]: value }, dirty: true }));
  },
  addProfil: (value) => {
    set((s) => ({ cp: { ...s.cp, profil: [...s.cp.profil, value] }, dirty: true }));
  },
  removeProfil: (index) => {
    set((s) => ({
      cp: { ...s.cp, profil: s.cp.profil.filter((_, i) => i !== index) },
      dirty: true,
    }));
  },

  // ── TP ─────────────────────────────────────────────────────────
  addTp: () => {
    const { tp } = get();
    const newTp: TpItem = {
      verb: 'Menjelaskan', desc: '', pertemuan: 1,
      color: colorForIndex(tp.length),
    };
    set({ tp: [...tp, newTp], dirty: true });
  },
  deleteTp: (index) => {
    set((s) => ({ tp: s.tp.filter((_, i) => i !== index), dirty: true }));
  },
  updateTp: (index, key, value) => {
    set((s) => {
      const newTp = [...s.tp];
      newTp[index] = { ...newTp[index], [key]: value };
      return { tp: newTp, dirty: true };
    });
  },
  reorderTp: (fromIndex, toIndex) => {
    set((s) => {
      const tp = [...s.tp];
      const [moved] = tp.splice(fromIndex, 1);
      tp.splice(toIndex, 0, moved);
      return { tp, dirty: true };
    });
  },

  // ── ATP ────────────────────────────────────────────────────────
  updateAtpNamaBab: (value) => {
    set((s) => ({ atp: { ...s.atp, namaBab: value }, dirty: true }));
  },
  addAtpPertemuan: () => {
    set((s) => ({
      atp: {
        ...s.atp,
        pertemuan: [...s.atp.pertemuan, { judul: '', tp: '', durasi: '2\u00D740 menit', kegiatan: '', penilaian: '' }],
      },
      dirty: true,
    }));
  },
  deleteAtpPertemuan: (index) => {
    set((s) => ({
      atp: { ...s.atp, pertemuan: s.atp.pertemuan.filter((_, i) => i !== index) },
      dirty: true,
    }));
  },
  updateAtpPertemuan: (index, key, value) => {
    set((s) => {
      const newPertemuan = [...s.atp.pertemuan];
      newPertemuan[index] = { ...newPertemuan[index], [key]: value };
      return { atp: { ...s.atp, pertemuan: newPertemuan }, dirty: true };
    });
  },

  // ── Alur ───────────────────────────────────────────────────────
  addAlur: () => {
    set((s) => ({
      alur: [...s.alur, { fase: 'Inti', durasi: '15 menit', judul: '', deskripsi: '' }],
      dirty: true,
    }));
  },
  deleteAlur: (index) => {
    set((s) => ({ alur: s.alur.filter((_, i) => i !== index), dirty: true }));
  },
  updateAlur: (index, key, value) => {
    set((s) => {
      const newAlur = [...s.alur];
      newAlur[index] = { ...newAlur[index], [key]: value };
      return { alur: newAlur, dirty: true };
    });
  },
  reorderAlur: (fromIndex, toIndex) => {
    set((s) => {
      const alur = [...s.alur];
      const [moved] = alur.splice(fromIndex, 1);
      alur.splice(toIndex, 0, moved);
      return { alur, dirty: true };
    });
  },

  // ── Kuis ───────────────────────────────────────────────────────
  addKuis: () => {
    set((s) => ({
      kuis: [...s.kuis, { _id: generateKuisId(), q: '', opts: ['', '', '', ''], ans: 0, ex: '' }],
      dirty: true,
    }));
  },
  deleteKuis: (index) => {
    set((s) => ({ kuis: s.kuis.filter((_, i) => i !== index), dirty: true }));
  },
  updateKuis: (index, key, value) => {
    set((s) => {
      const newKuis = [...s.kuis];
      newKuis[index] = { ...newKuis[index], [key]: value };
      return { kuis: newKuis, dirty: true };
    });
  },
  updateKuisOpt: (index, optIndex, value) => {
    set((s) => {
      const newKuis = [...s.kuis];
      const opts = [...(newKuis[index].opts || ['', '', '', ''])];
      opts[optIndex] = value;
      newKuis[index] = { ...newKuis[index], opts };
      return { kuis: newKuis, dirty: true };
    });
  },
  reorderKuis: (fromIndex, toIndex) => {
    set((s) => {
      const kuis = [...s.kuis];
      const [moved] = kuis.splice(fromIndex, 1);
      kuis.splice(toIndex, 0, moved);
      return { kuis, dirty: true };
    });
  },

  // ── Materi Block ─────────────────────────────────────────────
  addMateriBlok: (tipe) => {
    const base: MateriBlok = { tipe };
    switch (tipe) {
      case 'teks':      base.judul = ''; base.isi = ''; break;
      case 'definisi':  base.judul = ''; base.isi = ''; break;
      case 'poin':      base.judul = ''; base.butir = ['']; break;
      case 'tabel':     base.judul = ''; base.baris = [['', ''], ['', '']]; break;
      case 'kutipan':   base.judul = ''; base.isi = ''; break;
      case 'gambar':    base.judul = ''; base.isi = ''; break;
      case 'timeline':  base.judul = ''; base.langkah = [{ icon: '📌', judul: '', isi: '' }]; break;
      case 'highlight': base.judul = ''; base.icon = '⚡'; base.warna = '#f9c82e'; base.isi = ''; break;
      case 'compare':   base.judul = ''; base.kiri = { icon: '', judul: '', isi: '' }; base.kanan = { icon: '', judul: '', isi: '' }; break;
      case 'infobox':   base.judul = ''; base.style = 'info'; base.isi = ''; break;
      case 'checklist': base.judul = ''; base.butir = ['']; break;
      case 'statistik': base.judul = ''; base.items = [{ icon: '📊', angka: '', label: '', warna: '#3ecfcf' }]; break;
      case 'studi':     base.judul = ''; base.karakter = '🧑'; base.situasi = ''; base.pertanyaan = ''; base.pesan = ''; break;
    }
    set((s) => ({ materi: { blok: [...s.materi.blok, base] }, dirty: true }));
  },
  removeMateriBlok: (index) => {
    set((s) => ({ materi: { blok: s.materi.blok.filter((_, i) => i !== index) }, dirty: true }));
  },
  updateMateriBlok: (index, key, value) => {
    set((s) => {
      const blok = [...s.materi.blok];
      blok[index] = { ...blok[index], [key]: value };
      return { materi: { blok }, dirty: true };
    });
  },
  moveMateriBlok: (fromIndex, toIndex) => {
    set((s) => {
      const blok = [...s.materi.blok];
      const [moved] = blok.splice(fromIndex, 1);
      blok.splice(toIndex, 0, moved);
      return { materi: { blok }, dirty: true };
    });
  },

  // ── Modules ──────────────────────────────────────────────────
  addModule: (typeId) => {
    const defaults: Record<string, Record<string, unknown>> = {
      skenario: { type: 'skenario', title: '', chapters: [] },
      video: { type: 'video', title: '', url: '', platform: 'youtube', durasi: '', instruksi: '', pertanyaan: [] },
      flashcard: { type: 'flashcard', title: '', instruksi: '', kartu: [] },
      infografis: { type: 'infografis', title: '', layout: 'grid', intro: '', kartu: [] },
      'studi-kasus': { type: 'studi-kasus', title: '', teks: '', sumber: '', pertanyaan: [] },
      debat: { type: 'debat', title: '', pertanyaan: '', konteks: '', pihakA: { label: 'Pro / Setuju' }, pihakB: { label: 'Kontra / Tidak Setuju' } },
      timeline: { type: 'timeline', title: '', intro: '', events: [] },
      matching: { type: 'matching', title: '', instruksi: '', pasangan: [] },
      materi: { type: 'materi', title: '', intro: '', blok: [] },
      truefalse: { type: 'truefalse', title: '', instruksi: '', soal: [] },
      memory: { type: 'memory', title: '', pasangan: [] },
      roda: { type: 'roda', title: '', opsi: [] },
      hero: { type: 'hero', title: '', subjudul: '', icon: '\uD83D\uDE80', gradient: 'sunset', cta: '', chips: '' },
      kutipan: { type: 'kutipan', quote: '', source: '', title: '', display: 'card', accent: '#f9c82e' },
      langkah: { type: 'langkah', title: '', intro: '', style: 'numbered', steps: [{ icon: '\uD83D\uDCCC', judul: '', isi: '', color: '#3ecfcf' }] },
      accordion: { type: 'accordion', title: '', intro: '', items: [{ icon: '\uD83D\uDCCC', judul: '', isi: '' }] },
      statistik: { type: 'statistik', title: '', intro: '', layout: 'grid', items: [{ icon: '\uD83D\uDCCA', angka: '', satuan: '', label: '', color: '#3ecfcf' }] },
      polling: { type: 'polling', title: '', instruksi: '', tipe: 'single', anonymous: false, opsi: [{ icon: '', teks: '', warna: '#3ecfcf' }] },
      embed: { type: 'embed', title: '', url: '', height: 400, label: 'Buka di tab baru' },
      'tab-icons': { type: 'tab-icons', title: '', intro: '', layout: 'horizontal', animation: 'fade', tabs: [{ icon: '', judul: '', warna: '#3ecfcf', isi: '', poin: [], refleksi: '' }] },
      'icon-explore': { type: 'icon-explore', title: '', intro: '', layout: 'grid', animation: 'fade', items: [{ icon: '', judul: '', warna: '#3ecfcf', ringkasan: '', isi: '', contoh: [], sanksi: '' }] },
      comparison: { type: 'comparison', title: '', intro: '', animation: 'fade', kolom: [{ icon: '', judul: '', warna: '#3ecfcf' }, { icon: '', judul: '', warna: '#a78bfa' }], baris: [{ label: '', icon: '', nilai: ['', ''] }], tanya: '' },
      'card-showcase': { type: 'card-showcase', title: '', intro: '', layout: 'grid', animation: 'fade', cards: [{ icon: '', judul: '', subtitle: '', isi: '', tag: [], warna: '#3ecfcf' }] },
      'hotspot-image': { type: 'hotspot-image', title: '', intro: '', imageUrl: '', height: 300, mode: 'tooltip', animation: 'fade', hotspots: [{ x: 50, y: 50, icon: '\uD83D\uDCCC', judul: '', warna: '#f9c82e', isi: '' }] },
      sorting: { type: 'sorting', title: '', instruksi: '', kategori: [{ label: 'Kategori 1', color: '#3ecfcf', id: 'cat1' }, { label: 'Kategori 2', color: '#a78bfa', id: 'cat2' }], items: [{ teks: '', kategori: 'cat1' }] },
      spinwheel: { type: 'spinwheel', title: '', instruksi: '', soal: [{ teks: '', kategori: '' }] },
      teambuzzer: { type: 'teambuzzer', title: '', instruksi: '', timA: 'Tim A', timB: 'Tim B', soal: [{ teks: '', jawaban: '', poin: 10 }] },
      wordsearch: { type: 'wordsearch', title: '', instruksi: '', kata: [], ukuran: 10 },
      crossword: { type: 'crossword', title: '', instruksi: '', kata: [], ukuran: 12 },
      fillblank: { type: 'fillblank', title: '', instruksi: '', soal: [] },
      dragdrop: { type: 'dragdrop', title: '', instruksi: '', items: [], target: [] },
    };
    const base = defaults[typeId] || { type: typeId, title: '' };
    set((s) => ({ modules: [...s.modules, { ...base, _id: generateModuleId() }], dirty: true }));
  },
  removeModule: (index) => {
    set((s) => ({ modules: s.modules.filter((_, i) => i !== index), dirty: true }));
  },
  updateModuleField: (index, key, value) => {
    set((s) => {
      const modules = [...s.modules];
      modules[index] = { ...modules[index], [key]: value };
      return { modules, dirty: true };
    });
  },
  moveModule: (fromIndex, toIndex) => {
    set((s) => {
      const modules = [...s.modules];
      const [moved] = modules.splice(fromIndex, 1);
      modules.splice(toIndex, 0, moved);
      return { modules, dirty: true };
    });
  },
  addModuleItem: (moduleIndex, arrayKey, defaultItem) => {
    set((s) => {
      const modules = [...s.modules];
      const mod = { ...modules[moduleIndex] };
      const arr = [...((mod[arrayKey] as unknown[]) || [])];
      arr.push(defaultItem);
      (mod as Record<string, unknown>)[arrayKey] = arr;
      modules[moduleIndex] = mod;
      return { modules, dirty: true };
    });
  },
  removeModuleItem: (moduleIndex, arrayKey, itemIndex) => {
    set((s) => {
      const modules = [...s.modules];
      const mod = { ...modules[moduleIndex] };
      const arr = ((mod[arrayKey] as unknown[]) || []).filter((_, i) => i !== itemIndex);
      (mod as Record<string, unknown>)[arrayKey] = arr;
      modules[moduleIndex] = mod;
      return { modules, dirty: true };
    });
  },
  updateModuleItem: (moduleIndex, arrayKey, itemIndex, key, value) => {
    set((s) => {
      const modules = [...s.modules];
      const mod = { ...modules[moduleIndex] };
      const arr = [...((mod[arrayKey] as Record<string, unknown>[]) || [])];
      arr[itemIndex] = { ...arr[itemIndex], [key]: value };
      (mod as Record<string, unknown>)[arrayKey] = arr;
      modules[moduleIndex] = mod;
      return { modules, dirty: true };
    });
  },
  // ── Skenario ───────────────────────────────────────────────────
  setSkenario: (data) => set({ skenario: data, dirty: true }),
  addSkenarioChapter: () => {
    const newChapter: Record<string, unknown> = {
      title: '',
      bg: 'sbg-kampung',
      charEmoji: '🧑',
      charColor: '#3ecfcf',
      charPants: '#2563eb',
      choicePrompt: 'Apa yang akan kamu lakukan?',
      setup: [{ speaker: 'NARRATOR', text: '' }],
      choices: [{
        icon: '🤝', label: '', detail: '', good: true, pts: 10, level: 'good',
        norma: '', resultTitle: '', resultBody: '',
        consequences: [{ icon: '✅', text: '' }],
      }],
    };
    set((s) => ({ skenario: [...s.skenario, newChapter], dirty: true }));
  },
  removeSkenarioChapter: (index) => {
    set((s) => ({ skenario: s.skenario.filter((_, i) => i !== index), dirty: true }));
  },
  updateSkenarioChapter: (index, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      next[index] = { ...next[index], [key]: value };
      return { skenario: next, dirty: true };
    });
  },
  addSkenarioSetup: (chapterIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup = [...((chapter.setup as Array<Record<string, unknown>>) || []), { speaker: '', text: '' }];
      chapter.setup = setup;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  removeSkenarioSetup: (chapterIndex, setupIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup = ((chapter.setup as Array<Record<string, unknown>>) || []).filter((_, i) => i !== setupIndex);
      chapter.setup = setup.length > 0 ? setup : [{ speaker: '', text: '' }];
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  updateSkenarioSetup: (chapterIndex, setupIndex, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const setup = [...((chapter.setup as Array<Record<string, unknown>>) || [])];
      setup[setupIndex] = { ...setup[setupIndex], [key]: value };
      chapter.setup = setup;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  addSkenarioChoice: (chapterIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || []), {
        icon: '🤝', label: '', detail: '', good: false, pts: 5, level: 'mid',
        norma: '', resultTitle: '', resultBody: '',
        consequences: [{ icon: '⚠️', text: '' }],
      }];
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  removeSkenarioChoice: (chapterIndex, choiceIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = ((chapter.choices as Array<Record<string, unknown>>) || []).filter((_, i) => i !== choiceIndex);
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  updateSkenarioChoice: (chapterIndex, choiceIndex, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      choices[choiceIndex] = { ...choices[choiceIndex], [key]: value };
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  addSkenarioConsequence: (chapterIndex, choiceIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences = [...((choice.consequences as Array<Record<string, unknown>>) || []), { icon: '📌', text: '' }];
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  removeSkenarioConsequence: (chapterIndex, choiceIndex, consIndex) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences = ((choice.consequences as Array<Record<string, unknown>>) || []).filter((_, i) => i !== consIndex);
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },
  updateSkenarioConsequence: (chapterIndex, choiceIndex, consIndex, key, value) => {
    set((s) => {
      const next = [...s.skenario];
      const chapter = { ...next[chapterIndex] };
      const choices = [...((chapter.choices as Array<Record<string, unknown>>) || [])];
      const choice = { ...choices[choiceIndex] };
      const consequences = [...((choice.consequences as Array<Record<string, unknown>>) || [])];
      consequences[consIndex] = { ...consequences[consIndex], [key]: value };
      choice.consequences = consequences;
      choices[choiceIndex] = choice;
      chapter.choices = choices;
      next[chapterIndex] = chapter;
      return { skenario: next, dirty: true };
    });
  },

  // ── System ─────────────────────────────────────────────────────
  markDirty: () => set({ dirty: true }),
  markClean: () => set({ dirty: false }),

  saveToStorage: () => {
    try {
      const s = get();
      const data = {
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, modules: s.modules,
        games: s.games, materi: s.materi, guruPw: s.guruPw,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ dirty: false });
      toast.success('\u2705 Tersimpan ke browser');
      return true;
    } catch {
      toast.error('\u274C Gagal menyimpan');
      return false;
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      set({
        activePreset: null, // Loaded data is always a project, not a preset
        meta: data.meta || get().meta,
        cp: data.cp || get().cp,
        tp: data.tp || [],
        atp: data.atp || get().atp,
        alur: data.alur || [],
        skenario: data.skenario || [],
        kuis: ensureKuisIds((data.kuis || []) as KuisItem[]),
        modules: ensureModuleIds(data.modules || []),
        games: ensureModuleIds(data.games || []),
        materi: data.materi || { blok: [] },
        guruPw: data.guruPw || 'guru123',
        dirty: false,
      });
      toast.info('\uD83D\uDCC2 Data tersimpan dimuat');
      return true;
    } catch {
      return false;
    }
  },

  // ── Completeness ───────────────────────────────────────────────
  calcCompleteness: () => {
    const s = get();
    let pts = 0;
    let max = 0;
    const check = (val: boolean, w = 1) => { max += w; if (val) pts += w; };
    check(!!s.meta.judulPertemuan, 2);
    check(!!s.meta.kelas);
    check(!!s.cp.capaianFase, 2);
    check(s.tp.length > 0, 2);
    check(s.atp.pertemuan.length > 0, 2);
    check(s.alur.length >= 3, 2);
    check(s.kuis.length >= 5, 2);
    check(s.modules.length > 0, 1);
    return Math.round((pts / max) * 100);
  },

  // ── Full Preset ────────────────────────────────────────────────
  applyFullPreset: (presetKey) => {
    const mapping = FULL_PRESET_MAP[presetKey];
    if (!mapping) { toast.error('Preset tidak ditemukan'); return; }

    const mp = PRESETS_META[mapping.meta];
    const cp = PRESETS_CP[mapping.cp];
    const tp = PRESETS_TP[mapping.tp];
    const atp = PRESETS_ATP[mapping.atp];
    const alur = PRESETS_ALUR[mapping.alur];
    const kuis = PRESETS_KUIS[mapping.kuis];
    const skenario = PRESETS_SKENARIO[mapping.skenario];
    const modules = PRESETS_MODULES[mapping.modules];
    const materi = PRESETS_MATERI[mapping.materi];
    const petunjuk = PRESETS_PETUNJUK[mapping.petunjuk];
    const diskusi = PRESETS_DISKUSI[mapping.diskusi];
    const refleksi = PRESETS_REFLEKSI[mapping.refleksi];
    const penutup = PRESETS_PENUTUP[mapping.penutup];
    const suara = PRESETS_SUARA[mapping.suara];

    set({
      activePreset: presetKey === 'blank' ? null : presetKey,
      meta: mp ? deepClone(mp) : get().meta,
      cp: cp ? deepClone(cp) : get().cp,
      tp: tp ? deepClone(tp.items) : [],
      atp: atp ? deepClone(atp) : get().atp,
      alur: alur ? deepClone(alur.steps) : [],
      kuis: kuis ? ensureKuisIds(deepClone(kuis.soal) as KuisItem[]) : [],
      skenario: skenario ? deepClone(skenario) : [],
      materi: materi ? { blok: deepClone(materi) as unknown as MateriBlok[] } : { blok: [] },
      modules: modules ? ensureModuleIds(deepClone(modules)) : [],
      games: [],
      petunjuk: petunjuk ? deepClone(petunjuk) : { title: '', intro: '', langkah: [] },
      diskusi: diskusi ? deepClone(diskusi) : { title: '', intro: '', pertanyaan: [] },
      refleksi: refleksi ? deepClone(refleksi) : { title: '', intro: '', pertanyaan: [] },
      penutup: penutup ? deepClone(penutup) : { title: '', subjudul: '', preview: [] },
      suara: suara ? deepClone(suara) : { navigasi: false, benar: false, salah: false, selesai: false, klik: false, skor: false },
      dirty: false,
    });
    if (presetKey === 'blank') {
      toast.success('\u2728 Proyek kosong dibuat');
    } else {
      toast.success(`\u26A1 Preset diterapkan: ${presetKey}`);
    }
    // Set flag for auto canvas generation
    set({ pendingCanvasGenerate: presetKey === 'blank' ? null : presetKey });
  },

  applyKuisPreset: (presetKey) => {
    const p = PRESETS_KUIS[presetKey];
    if (!p) return;
    set({ kuis: deepClone(p.soal), dirty: true });
    toast.success(`\u2705 Preset Kuis diterapkan: ${p.label}`);
  },

  applyTpPreset: (presetKey) => {
    const p = PRESETS_TP[presetKey];
    if (!p) return;
    set({ tp: deepClone(p.items), dirty: true });
    toast.success(`\u2705 Preset TP diterapkan: ${p.label}`);
  },

  applyCpPreset: (presetKey) => {
    const p = PRESETS_CP[presetKey];
    if (!p) return;
    set({ cp: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset CP diterapkan: ${p.label}`);
  },

  applyAtpPreset: (presetKey) => {
    const p = PRESETS_ATP[presetKey];
    if (!p) return;
    set({ atp: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset ATP diterapkan: ${p.label}`);
  },

  applyAlurPreset: (presetKey) => {
    const p = PRESETS_ALUR[presetKey];
    if (!p) return;
    set({ alur: deepClone(p.steps), dirty: true });
    toast.success(`\u2705 Preset Alur diterapkan: ${p.label}`);
  },

  applyMetaPreset: (presetKey) => {
    const p = PRESETS_META[presetKey];
    if (!p) return;
    set({ meta: deepClone(p), dirty: true });
    toast.success(`\u2705 Preset meta diterapkan: ${p.label}`);
  },

  newProject: () => {
    set({
      activePreset: null,
      meta: { judulPertemuan: '', subjudul: '', ikon: '\uD83D\uDCDA', durasi: '', namaBab: '', mapel: '', kelas: '', kurikulum: '' },
      cp: { elemen: '', subElemen: '', capaianFase: '', profil: [], fase: 'D', kelas: '' },
      tp: [],
      atp: { namaBab: '', jumlahPertemuan: 3, pertemuan: [] },
      alur: [],
      skenario: [],
      kuis: [],
      modules: [],
      games: [],
      materi: { blok: [] },
      petunjuk: { title: '', intro: '', langkah: [] },
      diskusi: { title: '', intro: '', pertanyaan: [] },
      refleksi: { title: '', intro: '', pertanyaan: [] },
      penutup: { title: '', subjudul: '', preview: [] },
      suara: { navigasi: false, benar: false, salah: false, selesai: false, klik: false, skor: false },
      dirty: false,
      activePanel: 'dashboard',
    });
    toast.success('\u2728 Proyek baru dibuat');
  },
}));
