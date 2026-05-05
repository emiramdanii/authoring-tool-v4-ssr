// ═══════════════════════════════════════════════════════════════
// PAGE TYPES — Recipe layer for page type generation
// ═══════════════════════════════════════════════════════════════

// ── Option definition for configurable page type parameters ────
export interface PageTypeOption {
  id: string;
  label: string;
  type: 'number' | 'select' | 'toggle';
  default: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
}

// ── Blueprint: what a page type produces ───────────────────────
export interface PageTypeBlueprint {
  includeCover: boolean;
  includeDokumen: boolean;
  includeSkenario: boolean;
  includeMateri: boolean;
  includeKuis: boolean;
  includeGame: boolean;
  includeHasil: boolean;
  soalPerHalaman: number;
  timer: boolean;
  navbar: boolean;
  autoGenerateModules: boolean;
}

// ── Page type definition (the "recipe") ───────────────────────
export interface PageTypeDefinition {
  id: string;
  name: string;
  category: string; // 'utama' | 'kuis' | 'materi' | 'game' | 'custom'
  icon: string;
  color: string;
  description: string;
  options: PageTypeOption[];
  generate: (config: Record<string, number | string | boolean>) => PageTypeBlueprint;
}

// ── Categories ────────────────────────────────────────────────
export const PAGE_TYPE_CATEGORIES = [
  { id: 'utama', label: 'Utama', color: '#f59e0b' },
  { id: 'materi', label: 'Materi', color: '#a78bfa' },
  { id: 'kuis', label: 'Kuis & Game', color: '#34d399' },
  { id: 'custom', label: 'Custom', color: '#3ecfcf' },
];

// ── All available page types ──────────────────────────────────
export const ALL_PAGE_TYPES: PageTypeDefinition[] = [
  {
    id: 'full-interaktif',
    name: 'Full Interaktif',
    category: 'utama',
    icon: '🎯',
    color: '#f59e0b',
    description: 'Cover + Dokumen + Materi + Kuis + Game + Hasil — semua halaman lengkap',
    options: [
      { id: 'soalPerHalaman', type: 'number', label: 'Soal per Halaman', default: 5, min: 1, max: 20 },
      { id: 'timer', type: 'toggle', label: 'Timer Kuis', default: false },
      { id: 'navbar', type: 'toggle', label: 'Navbar Navigasi', default: true },
      { id: 'autoGenerateModules', type: 'toggle', label: 'Auto-Generate Modul dari Data', default: true },
    ],
    generate: (config) => ({
      includeCover: true,
      includeDokumen: true,
      includeSkenario: true,
      includeMateri: true,
      includeKuis: true,
      includeGame: true,
      includeHasil: true,
      soalPerHalaman: (config.soalPerHalaman as number) || 5,
      timer: config.timer as boolean || false,
      navbar: config.navbar as boolean || true,
      autoGenerateModules: config.autoGenerateModules as boolean || true,
    }),
  },
  {
    id: 'materi-fokus',
    name: 'Materi Fokus',
    category: 'materi',
    icon: '📖',
    color: '#a78bfa',
    description: 'Cover + Materi + Hasil — tanpa kuis/game, fokus penyampaian materi',
    options: [
      { id: 'navbar', type: 'toggle', label: 'Navbar Navigasi', default: true },
      { id: 'autoGenerateModules', type: 'toggle', label: 'Auto-Generate Modul dari Data', default: true },
    ],
    generate: (config) => ({
      includeCover: true,
      includeDokumen: false,
      includeSkenario: false,
      includeMateri: true,
      includeKuis: false,
      includeGame: false,
      includeHasil: true,
      soalPerHalaman: 5,
      timer: false,
      navbar: config.navbar as boolean || true,
      autoGenerateModules: config.autoGenerateModules as boolean || true,
    }),
  },
  {
    id: 'kuis-timer',
    name: 'Kuis Timer',
    category: 'kuis',
    icon: '⏱️',
    color: '#34d399',
    description: 'Cover + Kuis + Hasil — dengan timer dan pembagian soal per halaman',
    options: [
      { id: 'soalPerHalaman', type: 'number', label: 'Soal per Halaman', default: 5, min: 1, max: 20 },
      { id: 'timer', type: 'toggle', label: 'Timer Kuis', default: true },
      { id: 'timerDuration', type: 'number', label: 'Durasi Timer (detik)', default: 30, min: 10, max: 120 },
      { id: 'navbar', type: 'toggle', label: 'Navbar Navigasi', default: true },
    ],
    generate: (config) => ({
      includeCover: true,
      includeDokumen: false,
      includeSkenario: false,
      includeMateri: false,
      includeKuis: true,
      includeGame: false,
      includeHasil: true,
      soalPerHalaman: (config.soalPerHalaman as number) || 5,
      timer: true,
      navbar: config.navbar as boolean || true,
      autoGenerateModules: false,
    }),
  },
  {
    id: 'game-mode',
    name: 'Game Mode',
    category: 'kuis',
    icon: '🎮',
    color: '#3ecfcf',
    description: 'Cover + Game + Hasil — fokus permainan edukatif',
    options: [
      { id: 'navbar', type: 'toggle', label: 'Navbar Navigasi', default: true },
      { id: 'autoGenerateModules', type: 'toggle', label: 'Auto-Generate Game dari Data', default: true },
    ],
    generate: (config) => ({
      includeCover: true,
      includeDokumen: false,
      includeSkenario: false,
      includeMateri: false,
      includeKuis: false,
      includeGame: true,
      includeHasil: true,
      soalPerHalaman: 5,
      timer: false,
      navbar: config.navbar as boolean || true,
      autoGenerateModules: config.autoGenerateModules as boolean || true,
    }),
  },
  {
    id: 'skenario-mode',
    name: 'Skenario Interaktif',
    category: 'utama',
    icon: '🎭',
    color: '#ff6b6b',
    description: 'Cover + Skenario + Materi + Hasil — pembelajaran bercabang',
    options: [
      { id: 'navbar', type: 'toggle', label: 'Navbar Navigasi', default: true },
      { id: 'autoGenerateModules', type: 'toggle', label: 'Auto-Generate Modul', default: true },
    ],
    generate: (config) => ({
      includeCover: true,
      includeDokumen: false,
      includeSkenario: true,
      includeMateri: true,
      includeKuis: false,
      includeGame: false,
      includeHasil: true,
      soalPerHalaman: 5,
      timer: false,
      navbar: config.navbar as boolean || true,
      autoGenerateModules: config.autoGenerateModules as boolean || true,
    }),
  },
  {
    id: 'kosong',
    name: 'Halaman Kosong',
    category: 'custom',
    icon: '📄',
    color: '#6e90b5',
    description: 'Satu halaman kosong — susun sendiri dari nol',
    options: [],
    generate: () => ({
      includeCover: false,
      includeDokumen: false,
      includeSkenario: false,
      includeMateri: false,
      includeKuis: false,
      includeGame: false,
      includeHasil: false,
      soalPerHalaman: 5,
      timer: false,
      navbar: false,
      autoGenerateModules: false,
    }),
  },
];
