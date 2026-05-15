// ═══════════════════════════════════════════════════════════════════
// Constants for Auto-Generate
// ═══════════════════════════════════════════════════════════════════

import type { GenType } from './types';

export const STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'dalam', 'untuk', 'dengan', 'pada',
  'adalah', 'merupakan', 'yaitu', 'ialah', 'sebuah', 'suatu', 'ini', 'itu',
  'atau', 'juga', 'tidak', 'sudah', 'belum', 'akan', 'dapat', 'bisa',
  'telah', 'oleh', 'sebagai', 'antara', 'baik', 'maupun', 'serta', 'namun',
  'tetapi', 'karena', 'seperti', 'jika', 'saat', 'setiap', 'seluruh',
  'lain', 'banyak', 'beberapa', 'semua', 'mereka', 'kita', 'kami', 'dia',
  'ia', 'beliau', 'kalian', 'anda', 'saya', 'aku', 'diri', 'sendiri',
  'tentang', 'secara', 'lebih', 'paling', 'sangat', 'hanya', 'bahkan',
  'lagi', 'pun', 'nya', 'si', 'kah', 'tah', 'loh', 'deh', 'dong', 'to',
  'setelah', 'sebelum', 'ketika', 'walaupun', 'meskipun', 'maka', 'agar',
  'supaya', 'hingga', 'sampai', 'sejak', 'selama', 'terhadap', 'melalui',
  'tanpa', 'kecuali', 'selain', 'tersebut', 'berikut', 'berdasarkan',
  'menurut', 'berkat', 'berdasar', 'guna', 'mengenai', 'perihal',
  'no', 'nomor', 'bab', 'pertemuan', 'hal', 'halaman', 'poin',
]);

export const BLOOM_VERBS: Record<number, string[]> = {
  1: ['Menyebutkan', 'Mendefinisikan', 'Mengidentifikasi', 'Menyebut', 'Menuliskan'],
  2: ['Menjelaskan', 'Mendeskripsikan', 'Menguraikan', 'Merangkum', 'Menyimpulkan'],
  3: ['Menerapkan', 'Menggunakan', 'Mengklasifikasikan', 'Mencontohkan', 'Melaksanakan'],
  4: ['Menganalisis', 'Membandingkan', 'Membedakan', 'Mengorganisasi', 'Menghubungkan'],
  5: ['Mengevaluasi', 'Mengkritik', 'Menilai', 'Membenarkan', 'Menguji'],
  6: ['Menciptakan', 'Merancang', 'Merumuskan', 'Menyusun', 'Mengembangkan'],
};

export const COLOR_PALETTE = ['#f9c82e', '#3ecfcf', '#a78bfa', '#34d399', '#ff6b6b', '#fb923c', '#60a5fa', '#f472b6'];

export const GEN_BUTTONS: { type: GenType; icon: string; label: string; color: string }[] = [
  { type: 'cp', icon: '📋', label: 'CP (Capaian Pembelajaran)', color: 'amber' },
  { type: 'tp', icon: '🎯', label: 'TP (Tujuan Pembelajaran)', color: 'cyan' },
  { type: 'atp', icon: '📅', label: 'ATP (Alur Tujuan Pembelajaran)', color: 'purple' },
  { type: 'alur', icon: '🗺️', label: 'Alur Kegiatan', color: 'purple' },
  { type: 'kuis', icon: '❓', label: 'Kuis Pilihan Ganda', color: 'cyan' },
  { type: 'flashcard', icon: '🃏', label: 'Flashcard', color: 'amber' },
  { type: 'skenario', icon: '🎭', label: 'Skenario', color: 'purple' },
  { type: 'matching', icon: '🔀', label: 'Game Matching', color: 'cyan' },
  { type: 'truefalse', icon: '✅', label: 'Game Benar/Salah', color: 'amber' },
  { type: 'materi', icon: '📖', label: 'Materi', color: 'blue' },
  { type: 'diskusi', icon: '💬', label: 'Diskusi', color: 'green' },
  { type: 'refleksi', icon: '🪞', label: 'Refleksi', color: 'yellow' },
];
