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
  includeTujuan: boolean;
  includeMotivasi: boolean;
  includeSkenario: boolean;
  includeMateri: boolean;
  includeKuis: boolean;
  includeGame: boolean;
  includeHasil: boolean;
  includePetunjuk: boolean;
  includeDiskusi: boolean;
  includeRefleksi: boolean;
  includeRangkuman: boolean;
  includePenutup: boolean;
  soalPerHalaman: number;
  timer: boolean;
  navbar: boolean;
  autoGenerateModules: boolean;
  perPertemuan: boolean; // Split content pages per pertemuan (requires jumlahPertemuan > 1)
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

// ── Type-safe config accessor helpers ────────────────────────────
// Prevents the `as boolean || default` operator precedence bug where
// `false || true` yields `true` (overriding user's explicit false).
function boolOr<K extends string>(config: Record<string, number | string | boolean>, key: K, fallback: boolean): boolean {
  const v = config[key];
  return typeof v === 'boolean' ? v : fallback;
}

function numOr<K extends string>(config: Record<string, number | string | boolean>, key: K, fallback: number): number {
  const v = config[key];
  return typeof v === 'number' ? v : fallback;
}

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
      { id: 'perPertemuan', type: 'toggle', label: 'Per Pertemuan', default: false },
      { id: 'timer', type: 'toggle', label: 'Timer Kuis', default: false },
      { id: 'navbar', type: 'toggle', label: 'Navbar Navigasi', default: true },
      { id: 'autoGenerateModules', type: 'toggle', label: 'Auto-Generate Modul dari Data', default: true },
    ],
    generate: (config) => ({
      includeCover: true,
      includeDokumen: true,
      includeTujuan: true,
      includeMotivasi: true,
      includeSkenario: true,
      includeMateri: true,
      includeKuis: true,
      includeGame: true,
      includeHasil: true,
      includePetunjuk: true,
      includeDiskusi: true,
      includeRefleksi: true,
      includeRangkuman: true,
      includePenutup: true,
      soalPerHalaman: numOr(config, 'soalPerHalaman', 5),
      timer: boolOr(config, 'timer', false),
      navbar: boolOr(config, 'navbar', true),
      autoGenerateModules: boolOr(config, 'autoGenerateModules', true),
      perPertemuan: boolOr(config, 'perPertemuan', false),
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
      includeTujuan: true,
      includeMotivasi: false,
      includeSkenario: false,
      includeMateri: true,
      includeKuis: false,
      includeGame: false,
      includeHasil: true,
      includePetunjuk: false,
      includeDiskusi: false,
      includeRefleksi: false,
      includeRangkuman: false,
      includePenutup: false,
      soalPerHalaman: 5,
      timer: false,
      navbar: boolOr(config, 'navbar', true),
      autoGenerateModules: boolOr(config, 'autoGenerateModules', true),
      perPertemuan: false,
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
      includeTujuan: false,
      includeMotivasi: false,
      includeSkenario: false,
      includeMateri: false,
      includeKuis: true,
      includeGame: false,
      includeHasil: true,
      includePetunjuk: false,
      includeDiskusi: false,
      includeRefleksi: false,
      includeRangkuman: false,
      includePenutup: false,
      soalPerHalaman: numOr(config, 'soalPerHalaman', 5),
      timer: true,
      navbar: boolOr(config, 'navbar', true),
      autoGenerateModules: false,
      perPertemuan: false,
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
      includeTujuan: false,
      includeMotivasi: false,
      includeSkenario: false,
      includeMateri: false,
      includeKuis: false,
      includeGame: true,
      includeHasil: true,
      includePetunjuk: false,
      includeDiskusi: false,
      includeRefleksi: false,
      includeRangkuman: false,
      includePenutup: false,
      soalPerHalaman: 5,
      timer: false,
      navbar: boolOr(config, 'navbar', true),
      autoGenerateModules: boolOr(config, 'autoGenerateModules', true),
      perPertemuan: false,
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
      includeTujuan: false,
      includeMotivasi: false,
      includeSkenario: true,
      includeMateri: true,
      includeKuis: false,
      includeGame: false,
      includeHasil: true,
      includePetunjuk: false,
      includeDiskusi: false,
      includeRefleksi: false,
      includeRangkuman: false,
      includePenutup: false,
      soalPerHalaman: 5,
      timer: false,
      navbar: boolOr(config, 'navbar', true),
      autoGenerateModules: boolOr(config, 'autoGenerateModules', true),
      perPertemuan: false,
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
      includeTujuan: false,
      includeMotivasi: false,
      includeSkenario: false,
      includeMateri: false,
      includeKuis: false,
      includeGame: false,
      includeHasil: false,
      includePetunjuk: false,
      includeDiskusi: false,
      includeRefleksi: false,
      includeRangkuman: false,
      includePenutup: false,
      soalPerHalaman: 5,
      timer: false,
      navbar: false,
      autoGenerateModules: false,
      perPertemuan: false,
    }),
  },
];
