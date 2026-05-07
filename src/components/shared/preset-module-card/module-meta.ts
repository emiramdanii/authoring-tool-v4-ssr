import type { ModuleTypeMeta } from './types';

// ═══════════════════════════════════════════════════════════════════
// MODULE TYPE METADATA
// ═══════════════════════════════════════════════════════════════════

export const MODULE_META: ModuleTypeMeta[] = [
  { id: 'video', icon: '🎥', label: 'Video Embed', color: '#ff6b6b' },
  { id: 'flashcard', icon: '🃏', label: 'Flashcard', color: '#3ecfcf' },
  { id: 'infografis', icon: '📊', label: 'Infografis', color: '#a78bfa' },
  { id: 'studi-kasus', icon: '📰', label: 'Studi Kasus', color: '#fb923c' },
  { id: 'debat', icon: '🗣️', label: 'Debat & Polling', color: '#f87171' },
  { id: 'timeline', icon: '📅', label: 'Timeline', color: '#34d399' },
  { id: 'matching', icon: '🔀', label: 'Game Pasangkan', color: '#60a5fa' },
  { id: 'materi', icon: '📖', label: 'Materi Teks', color: '#a1a1aa' },
  { id: 'hero', icon: '🖼️', label: 'Hero Banner', color: '#ff6b6b' },
  { id: 'kutipan', icon: '💬', label: 'Kutipan Inspiratif', color: '#34d399' },
  { id: 'langkah', icon: '👣', label: 'Langkah-Langkah', color: '#3ecfcf' },
  { id: 'accordion', icon: '🗂️', label: 'Accordion / FAQ', color: '#a78bfa' },
  { id: 'statistik', icon: '📈', label: 'Statistik & Angka', color: '#fb923c' },
  { id: 'polling', icon: '🗳️', label: 'Polling / Voting', color: '#60a5fa' },
  { id: 'embed', icon: '🔗', label: 'Embed / iFrame', color: '#a1a1aa' },
  { id: 'tab-icons', icon: '📑', label: 'Tab Interaktif', color: '#f9c82e' },
  { id: 'icon-explore', icon: '🔍', label: 'Eksplorasi Ikon', color: '#34d399' },
  { id: 'comparison', icon: '⚖️', label: 'Perbandingan', color: '#a78bfa' },
  { id: 'card-showcase', icon: '🃏', label: 'Card Showcase', color: '#fb923c' },
  { id: 'hotspot-image', icon: '🗺️', label: 'Hotspot Image', color: '#ff6b6b' },
  { id: 'truefalse', icon: '✅', label: 'Benar / Salah', color: '#34d399', isGame: true },
  { id: 'memory', icon: '🧠', label: 'Memory Match', color: '#a78bfa', isGame: true },
  { id: 'roda', icon: '🎡', label: 'Roda Putar', color: '#fb923c', isGame: true },
  { id: 'sorting', icon: '🔢', label: 'Urutkan / Klasifikasi', color: '#3ecfcf', isGame: true },
  { id: 'spinwheel', icon: '🎰', label: 'Roda Pertanyaan', color: '#ff6b6b', isGame: true },
  { id: 'teambuzzer', icon: '🏆', label: 'Kuis Tim / Buzzer', color: '#f9c82e', isGame: true },
  { id: 'wordsearch', icon: '🔍', label: 'Teka-Teki Kata', color: '#60a5fa', isGame: true },
  { id: 'crossword', icon: '🔤', label: 'Teka-Teki Silang', color: '#a78bfa', isGame: true },
  { id: 'fillblank', icon: '✏️', label: 'Isi Titik-Titik', color: '#34d399', isGame: true },
  { id: 'dragdrop', icon: '🖐️', label: 'Seret & Letakkan', color: '#fb923c', isGame: true },
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', color: '#f9c82e' },
  { id: 'petunjuk', icon: '📌', label: 'Petunjuk Penggunaan', color: '#3ecfcf' },
  { id: 'diskusi', icon: '💬', label: 'Diskusi & Refleksi', color: '#34d399' },
  { id: 'review', icon: '🔄', label: 'Review Pertemuan', color: '#f9c82e' },
  { id: 'refleksi', icon: '💭', label: 'Refleksi & Portofolio', color: '#a78bfa' },
];

export function getModuleMeta(typeId: string): ModuleTypeMeta {
  return MODULE_META.find((m) => m.id === typeId) || { id: typeId, icon: '📦', label: typeId, color: '#71717a' };
}
