// ── Materi Slice ──────────────────────────────────────────────────
import type { StateCreator } from 'zustand';
import type { AuthoringState, MateriBlok } from './types';
import { DEFAULT_MATERI } from './initial-state';

export type MateriSlice = Pick<AuthoringState, 'materi' | 'addMateriBlok' | 'removeMateriBlok' | 'updateMateriBlok' | 'moveMateriBlok'>;

export const createMateriSlice: StateCreator<AuthoringState, [], [], MateriSlice> = (set) => ({
  materi: { ...DEFAULT_MATERI },
  addMateriBlok: (tipe: string) => {
    const base: MateriBlok = { tipe };
    switch (tipe) {
      case 'teks':      base.judul = ''; base.isi = ''; break;
      case 'definisi':  base.judul = ''; base.isi = ''; break;
      case 'poin':      base.judul = ''; base.butir = ['']; break;
      case 'tabel':     base.judul = ''; base.baris = [['', ''], ['', '']]; break;
      case 'kutipan':   base.judul = ''; base.isi = ''; break;
      case 'gambar':    base.judul = ''; base.isi = ''; break;
      case 'timeline':  base.judul = ''; base.langkah = [{ icon: '\uD83D\uDCCC', judul: '', isi: '' }]; break;
      case 'highlight': base.judul = ''; base.icon = '\u26A1'; base.warna = '#f9c82e'; base.isi = ''; break;
      case 'compare':   base.judul = ''; base.kiri = { icon: '', judul: '', isi: '' }; base.kanan = { icon: '', judul: '', isi: '' }; break;
      case 'infobox':   base.judul = ''; base.style = 'info'; base.isi = ''; break;
      case 'checklist': base.judul = ''; base.butir = ['']; break;
      case 'statistik': base.judul = ''; base.items = [{ icon: '\uD83D\uDCCA', angka: '', label: '', warna: '#3ecfcf' }]; break;
      case 'studi':     base.judul = ''; base.karakter = '\uD83E\uDDD1'; base.situasi = ''; base.pertanyaan = ''; base.pesan = ''; break;
    }
    set((s) => ({ materi: { blok: [...s.materi.blok, base] }, dirty: true }));
  },
  removeMateriBlok: (index: number) => {
    set((s) => ({ materi: { blok: s.materi.blok.filter((_, i) => i !== index) }, dirty: true }));
  },
  updateMateriBlok: (index: number, key: string, value: unknown) => {
    set((s) => {
      const blok = [...s.materi.blok];
      blok[index] = { ...blok[index], [key]: value };
      return { materi: { blok }, dirty: true };
    });
  },
  moveMateriBlok: (fromIndex: number, toIndex: number) => {
    set((s) => {
      const blok = [...s.materi.blok];
      const [moved] = blok.splice(fromIndex, 1);
      blok.splice(toIndex, 0!, moved);
      return { materi: { blok }, dirty: true };
    });
  },
});
