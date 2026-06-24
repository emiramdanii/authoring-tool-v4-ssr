// ── System Slice ──────────────────────────────────────────────────
// Phase 5-F: loadFromStorage() now ONLY writes non-schema fields.
// Schema-backed fields (tp, alur, kuis, skenario, materi, diskusi,
// refleksi, motivasi, rangkuman, modules, meta) are derived from
// schema via startProjectionSync() in init.ts. Writing them here
// causes a double-write conflict where raw storage data overwrites
// the schema-derived projection.
import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { AuthoringState } from './types';
import { STORAGE_KEY } from './types';

export type SystemSlice = Pick<AuthoringState, 'dirty' | 'guruPw' | 'teacherMode' | 'markDirty' | 'markClean' | 'saveToStorage' | 'loadFromStorage' | 'calcCompleteness' | 'toggleSuaraAll' | 'setTeacherMode'>;

export const createSystemSlice: StateCreator<AuthoringState, [], [], SystemSlice> = (set, get) => ({
  dirty: false,
  guruPw: 'guru123',
  teacherMode: (typeof window !== 'undefined' && localStorage.getItem('silse_teacher_mode') === 'lengkap') ? 'lengkap' : 'sederhana',

  markDirty: () => set({ dirty: true }),
  markClean: () => set({ dirty: false }),

  setTeacherMode: (mode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('silse_teacher_mode', mode);
    }
    set({ teacherMode: mode });
  },

  toggleSuaraAll: () => {
    const s = get().suara;
    // If any sound is enabled, turn all off. Otherwise turn all on.
    const anyOn = Object.values(s).some(Boolean);
    const newVal = !anyOn;
    set({
      suara: {
        navigasi: newVal,
        benar: newVal,
        salah: newVal,
        selesai: newVal,
        klik: newVal,
        skor: newVal,
      },
      dirty: true,
    });
  },

  saveToStorage: () => {
    try {
      const s = get();
      const data = {
        meta: s.meta, cp: s.cp, tp: s.tp, atp: s.atp, alur: s.alur,
        skenario: s.skenario, kuis: s.kuis, modules: s.modules,
        games: s.games, materi: s.materi, guruPw: s.guruPw,
        petunjuk: s.petunjuk, diskusi: s.diskusi, refleksi: s.refleksi,
        motivasi: s.motivasi, rangkuman: s.rangkuman,
        penutup: s.penutup, suara: s.suara,
        _lastSavedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Sprint 7.1: Do NOT set dirty:false here.
      // Dirty state is managed by the revision-based state machine
      // in useDirtyStore. Cleanness only emerges from saveSucceeded()
      // after durable save completes with matching revision.
      return true;
    } catch {
      return false;
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      // Phase 5-F: Only load non-schema fields here.
      // Schema-backed fields (tp, alur, kuis, skenario, materi, diskusi,
      // refleksi, motivasi, rangkuman, modules, meta) are derived from
      // schema via startProjectionSync() — writing them here would
      // overwrite the schema-derived projection with stale data.
      //
      // V5-RELEASE-HARDENING-02 (RC-META-001): HOWEVER, metadata fields
      // that have NO schema representation (namaGuru, namaSekolah, semester,
      // tahunAjaran) MUST be restored from storage. These fields are only
      // editable via MetadataFormV5 and have no corresponding schema block.
      // We merge stored meta with current meta, preserving schema-derived
      // fields (judulPertemuan, mapel, kelas) from projection sync while
      // restoring metadata-only fields from storage.
      const storedMeta = data.meta || {};
      const currentMeta = get().meta;
      // V5-PATCH-03: Use hasOwnProperty instead of || to preserve empty strings.
      // Previously, storedMeta.namaGuru || currentMeta.namaGuru would fall
      // through to currentMeta if storedMeta had '' (empty string is falsy).
      // This meant cleared metadata would be resurrected from currentMeta.
      // Now: if the key EXISTS in storedMeta (even as ''), use it.
      // If the key does NOT exist in storedMeta, fall back to currentMeta.
      const pick = (key: string): string => {
        if (Object.prototype.hasOwnProperty.call(storedMeta, key)) {
          return String((storedMeta as Record<string, unknown>)[key] ?? '');
        }
        return String((currentMeta as unknown as Record<string, unknown>)[key] ?? '');
      };
      const mergedMeta = {
        ...currentMeta, // Keep schema-derived fields from projection
        namaGuru: pick('namaGuru'),
        namaSekolah: pick('namaSekolah'),
        semester: pick('semester'),
        tahunAjaran: pick('tahunAjaran'),
        kurikulum: pick('kurikulum'),
      };
      set({
        activePreset: null,
        // Non-schema fields — these have no schema block representation
        cp: data.cp || get().cp,
        atp: data.atp || get().atp,
        petunjuk: data.petunjuk || get().petunjuk,
        penutup: data.penutup || get().penutup,
        suara: data.suara || get().suara,
        guruPw: data.guruPw || 'guru123',
        // V5-RELEASE-HARDENING-02: Restore metadata-only fields
        meta: mergedMeta,
        dirty: false,
      });
      return true;
    } catch {
      return false;
    }
  },

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
    check(!!s.motivasi.pertanyaanPemicu, 1);  // Motivasi has hook question
    check(s.rangkuman.poin.length > 0, 1);    // Rangkuman has key points
    return Math.round((pts / max) * 100);
  },
});
