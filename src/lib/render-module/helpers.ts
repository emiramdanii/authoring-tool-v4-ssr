// ═══════════════════════════════════════════════════════════════════
// HELPERS — Shared utility functions and constants
// ═══════════════════════════════════════════════════════════════════

import type { LayoutVariant } from './types';
import type { ModuleTypeMeta, M } from './types';
import { T } from './tokens';

// ── TYPE COERCION HELPERS ─────────────────────────────────────────

export function arr<T>(val: unknown): T[] {
  return Array.isArray(val) ? val : [];
}

export function str(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

export function num(val: unknown, fallback = 0): number {
  return typeof val === 'number' ? val : fallback;
}

/** HTML entity escaping — prevents XSS in all user content */
export function esc(s: string | number | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── MODULE TYPE METADATA ──────────────────────────────────────────

const MODULE_META: ModuleTypeMeta[] = [
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
  { id: 'statistik', icon: '📊', label: 'Statistik & Angka', color: '#fb923c' },
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
  { id: 'spinwheel', icon: '🎡', label: 'Roda Pertanyaan', color: '#ff6b6b', isGame: true },
  { id: 'teambuzzer', icon: '🏆', label: 'Kuis Tim / Buzzer', color: '#f9c82e', isGame: true },
  { id: 'wordsearch', icon: '🔍', label: 'Teka-Teki Kata', color: '#60a5fa', isGame: true },
  { id: 'skenario', icon: '🎭', label: 'Skenario Interaktif', color: '#f9c82e' },
  { id: 'petunjuk', icon: '📌', label: 'Petunjuk Penggunaan', color: '#3ecfcf' },
  { id: 'diskusi', icon: '💬', label: 'Diskusi & Refleksi', color: '#34d399' },
  { id: 'review', icon: '🔄', label: 'Review Pertemuan', color: '#f9c82e' },
  { id: 'refleksi', icon: '💭', label: 'Refleksi & Portofolio', color: '#a78bfa' },
];

export function getModuleMeta(typeId: string): ModuleTypeMeta {
  return MODULE_META.find(m => m.id === typeId) || { id: typeId, icon: '📦', label: typeId, color: '#71717a' };
}

// ── ITEM COUNT HELPER ─────────────────────────────────────────────

/** Get item count for fallback renderer */
export function getItemCount(mod: M): number {
  const t = str(mod.type);
  const keys: Record<string, string> = {
    senario: 'chapters', video: 'pertanyaan', flashcard: 'kartu',
    infografis: 'kartu', 'studi-kasus': 'pertanyaan', timeline: 'events',
    matching: 'pasangan', materi: 'blok', truefalse: 'soal',
    memory: 'pasangan', roda: 'opsi', hero: 'chips',
    kutipan: 'quote', langkah: 'steps', accordion: 'items',
    statistik: 'items', polling: 'opsi', embed: 'url',
    'tab-icons': 'tabs', 'icon-explore': 'items', comparison: 'baris',
    'card-showcase': 'cards', 'hotspot-image': 'hotspots',
    sorting: 'items', spinwheel: 'soal', teambuzzer: 'soal',
    wordsearch: 'kata', skenario: 'chapters', debat: 'pertanyaan',
    petunjuk: 'langkah', diskusi: 'pertanyaan', review: 'kartu', refleksi: 'pertanyaan',
  };
  const key = keys[t];
  if (!key) return 0;
  const v = mod[key];
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'string' && v.length > 0) return 1;
  return 0;
}

// ── CARD SHELL ────────────────────────────────────────────────────

/** Shared wrapper for styled HTML */
export function cardShell(color: string, body: string): string {
  return `<div style="border-radius:16px;border:1px solid rgba(255,255,255,0.09);background:${T.card};overflow:hidden">` +
    `<div style="height:3px;background:linear-gradient(90deg,${color},${color}66,transparent)"></div>` +
    body +
    `</div>`;
}
