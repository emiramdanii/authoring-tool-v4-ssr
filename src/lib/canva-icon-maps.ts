// ═══════════════════════════════════════════════════════════════
// CANVA — Shared Icon Maps (single source of truth)
// ═══════════════════════════════════════════════════════════════
// Previously duplicated in: LeftPanel.tsx, RightPanel.tsx, PageTemplate.tsx
// All components MUST import from this file instead of defining local copies.

// ── Game type icons ─────────────────────────────────────────────

export const GAME_TYPE_ICON_MAP: Record<string, string> = {
  truefalse: '✅',
  memory: '🧠',
  matching: '🔀',
  roda: '🎡',
  sorting: '🔢',
  spinwheel: '🎡',
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
  dokumen: { icon: '📋', color: '#3ecfcf', name: 'Dokumen' },
  materi: { icon: '📝', color: '#a78bfa', name: 'Materi' },
  kuis: { icon: '❓', color: '#f5c842', name: 'Kuis' },
  game: { icon: '🎮', color: '#3ecfcf', name: 'Game' },
  hasil: { icon: '🏆', color: '#34d399', name: 'Hasil' },
  hero: { icon: '🚀', color: '#fb923c', name: 'Hero' },
  skenario: { icon: '🎭', color: '#f472b6', name: 'Skenario' },
  custom: { icon: '⬜', color: '#6366f1', name: 'Kosong' },
};

// ── Element type colors (for layer list) ────────────────────────

export const ELEMENT_TYPE_COLORS: Record<string, string> = {
  kuis: '#f5c842',
  game: '#3ecfcf',
  materi: '#a78bfa',
  modul: '#34d399',
  teks: '#fff',
  shape: '#6366f1',
};

// ── Helper: get icon for any module type ────────────────────────

export function getModuleIcon(type: string): string {
  return MODULE_TYPE_ICON_MAP[type] || GAME_TYPE_ICON_MAP[type] || '🧩';
}

// ── Helper: get icon for game type ──────────────────────────────

export function getGameIcon(type: string): string {
  return GAME_TYPE_ICON_MAP[type] || '🎮';
}
