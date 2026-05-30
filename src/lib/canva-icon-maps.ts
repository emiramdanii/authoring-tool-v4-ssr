// ═══════════════════════════════════════════════════════════════
// CANVA — Shared Icon Maps (single source of truth)
// ═══════════════════════════════════════════════════════════════
// Previously duplicated in: LeftPanel.tsx, RightPanel.tsx, PageTemplate.tsx
// All components MUST import from this file instead of defining local copies.

// No lucide-react imports — all icons use Material Symbols Outlined

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

// ── Tab icon map (Material Symbols Outlined string lookup) ───────────

export const TAB_ICON_MAP: Record<string, string> = {
  BookOpen: 'menu_book',
  Brain: 'psychology',
  Gamepad2: 'sports_esports',
  MessageCircle: 'chat',
  Trophy: 'emoji_events',
  Target: 'target',
  Sparkles: 'auto_awesome',
  Lightbulb: 'lightbulb',
  LayoutGrid: 'grid_view',
  FileText: 'description',
  PenTool: 'draw',
  HelpCircle: 'help_outline',
  Users: 'groups',
  Puzzle: 'extension',
  ListChecks: 'checklist',
  GraduationCap: 'school',
};

/** Resolve a tab icon name to its Material Symbols Outlined icon string */
export function getTabIcon(name: string): string {
  return TAB_ICON_MAP[name] || 'grid_view';
}

// ── Block type → default tab icon name ────────────────────────────

export const BLOCK_TYPE_TAB_ICON: Record<string, string> = {
  cover: 'menu_book',
  hero: 'auto_awesome',
  petunjuk: 'checklist',
  tp: 'target',
  alur: 'grid_view',
  skenario: 'extension',
  'def-box': 'menu_book',
  'nc-grid': 'grid_view',
  'flashcard-set': 'psychology',
  ftab: 'grid_view',
  'nk-card': 'menu_book',
  'materi-section': 'menu_book',
  diskusi: 'chat',
  kuis: 'help_outline',
  'sortir-game': 'sports_esports',
  'roda-game': 'sports_esports',
  'memory-game': 'psychology',
  'matching-game': 'sports_esports',
  'fill-blank-game': 'draw',
  'word-search-game': 'sports_esports',
  'true-false-game': 'sports_esports',
  'drag-drop-game': 'sports_esports',
  'crossword-game': 'sports_esports',
  'team-buzzer-game': 'emoji_events',
  hasil: 'emoji_events',
  refleksi: 'psychology',
  penutup: 'school',
  'tabel-accord': 'description',
  'tujuan-display': 'target',
  motivasi: 'lightbulb',
  rangkuman: 'menu_book',
  tabel: 'description',
  timeline: 'grid_view',
  compare: 'grid_view',
  gambar: 'description',
  reveal: 'auto_awesome',
  checklist: 'checklist',
  statistik: 'target',
  studi: 'menu_book',
  'materi-blok': 'menu_book',
  // Generic fallback for unknown types
  custom: 'grid_view',
  base: 'grid_view',
};
