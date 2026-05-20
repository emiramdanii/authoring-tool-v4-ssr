// ═══════════════════════════════════════════════════════════════
// CANVA — Shared Icon Maps (single source of truth)
// ═══════════════════════════════════════════════════════════════
// Previously duplicated in: LeftPanel.tsx, RightPanel.tsx, PageTemplate.tsx
// All components MUST import from this file instead of defining local copies.

import {
  BookOpen,
  Brain,
  Gamepad2,
  MessageCircle,
  Trophy,
  Target,
  Sparkles,
  Lightbulb,
  LayoutGrid,
  FileText,
  PenTool,
  HelpCircle,
  Users,
  Puzzle,
  ListChecks,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

// ── Game type icons ─────────────────────────────────────────────

export const GAME_TYPE_ICON_MAP: Record<string, string> = {
  truefalse: '✅',
  memory: '🧠',
  matching: '🔀',
  roda: '🎡',
  sorting: '🔢',
  spinwheel: '🎰',
  teambuzzer: '🏆',
  wordsearch: '🔍',
  flashcard: '🃏',
  crossword: '🔤',
  fillblank: '✏️',
  dragdrop: '🖐️',
};

// ── Materi/Module type icons ────────────────────────────────────

export const MODULE_TYPE_ICON_MAP: Record<string, string> = {
  materi: '📖',
  infografis: '📊',
  accordion: '🗂️',
  'tab-icons': '📑',
  'icon-explore': '🔍',
  timeline: '📅',
  hero: '🚀',
  kutipan: '💬',
  langkah: '👣',
  statistik: '📈',
  polling: '🗳️',
  embed: '🔗',
  comparison: '⚖️',
  'card-showcase': '🎴',
  'hotspot-image': '🗺️',
  video: '🎥',
  'studi-kasus': '🔬',
  debat: '🗣️',
  petunjuk: '📌',
  diskusi: '💬',
  review: '🔄',
  refleksi: '💭',
  skenario: '🎭',
  flashcard: '🃏',
};

// ── Template type icons & colors ────────────────────────────────

export const TEMPLATE_BADGE_MAP: Record<string, { icon: string; color: string; name: string }> = {
  cover: { icon: '🏠', color: '#f9c82e', name: 'Cover' },
  petunjuk: { icon: '📌', color: '#3ecfcf', name: 'Petunjuk' },
  dokumen: { icon: '📋', color: '#3ecfcf', name: 'Dokumen' },
  hero: { icon: '🚀', color: '#fb923c', name: 'Hero' },
  materi: { icon: '📝', color: '#a78bfa', name: 'Materi' },
  skenario: { icon: '🎭', color: '#f472b6', name: 'Skenario' },
  kuis: { icon: '❓', color: '#f5c842', name: 'Kuis' },
  game: { icon: '🎮', color: '#3ecfcf', name: 'Game' },
  diskusi: { icon: '💬', color: '#34d399', name: 'Diskusi' },
  hasil: { icon: '🏆', color: '#34d399', name: 'Hasil' },
  refleksi: { icon: '🪞', color: '#a78bfa', name: 'Refleksi' },
  penutup: { icon: '🎓', color: '#fb923c', name: 'Penutup' },
  custom: { icon: '⬜', color: '#6366f1', name: 'Kosong' },
};

/** Icon-only map derived from TEMPLATE_BADGE_MAP (single source of truth) */
export const TEMPLATE_ICON_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TEMPLATE_BADGE_MAP).map(([key, val]) => [key, val.icon])
);

// ── Element type colors (for layer list) ────────────────────────

export const ELEMENT_TYPE_COLORS: Record<string, string> = {
  kuis: '#f5c842',
  game: '#3ecfcf',
  materi: '#a78bfa',
  modul: '#34d399',
  teks: '#fff',
  shape: '#6366f1',
  image: '#f97316',
};

// ── Helper: get icon for any module type ────────────────────────

export function getModuleIcon(type: string): string {
  return MODULE_TYPE_ICON_MAP[type] || GAME_TYPE_ICON_MAP[type] || '🧩';
}

// ── Helper: get icon for game type ──────────────────────────────

export function getGameIcon(type: string): string {
  return GAME_TYPE_ICON_MAP[type] || '🎮';
}

// ── Tab icon map (Lucide component lookup) ────────────────────────

export const TAB_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Brain,
  Gamepad2,
  MessageCircle,
  Trophy,
  Target,
  Sparkles,
  Lightbulb,
  LayoutGrid,
  FileText,
  PenTool,
  HelpCircle,
  Users,
  Puzzle,
  ListChecks,
  GraduationCap,
};

/** Resolve a tab icon name to its Lucide component */
export function getTabIcon(name: string): LucideIcon {
  return TAB_ICON_MAP[name] || LayoutGrid;
}

// ── Block type → default tab icon name ────────────────────────────

export const BLOCK_TYPE_TAB_ICON: Record<string, string> = {
  cover: 'BookOpen',
  hero: 'Sparkles',
  petunjuk: 'ListChecks',
  tp: 'Target',
  alur: 'LayoutGrid',
  skenario: 'Puzzle',
  'def-box': 'BookOpen',
  'nc-grid': 'LayoutGrid',
  'flashcard-set': 'Brain',
  ftab: 'LayoutGrid',
  'nk-card': 'BookOpen',
  'materi-section': 'BookOpen',
  diskusi: 'MessageCircle',
  kuis: 'HelpCircle',
  'sortir-game': 'Gamepad2',
  'roda-game': 'Gamepad2',
  'memory-game': 'Brain',
  'matching-game': 'Gamepad2',
  'fill-blank-game': 'PenTool',
  'word-search-game': 'Gamepad2',
  'true-false-game': 'Gamepad2',
  'drag-drop-game': 'Gamepad2',
  'crossword-game': 'Gamepad2',
  'team-buzzer-game': 'Trophy',
  hasil: 'Trophy',
  refleksi: 'Brain',
  penutup: 'GraduationCap',
  'tabel-accord': 'FileText',
  'tujuan-display': 'Target',
  motivasi: 'Lightbulb',
  rangkuman: 'BookOpen',
  tabel: 'FileText',
  timeline: 'LayoutGrid',
  compare: 'LayoutGrid',
  gambar: 'FileText',
  reveal: 'Sparkles',
  checklist: 'ListChecks',
  statistik: 'Target',
  studi: 'BookOpen',
  'materi-blok': 'BookOpen',
  // Generic fallback for unknown types
  custom: 'LayoutGrid',
  base: 'LayoutGrid',
};
