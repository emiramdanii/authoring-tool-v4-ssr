// ═══════════════════════════════════════════════════════════════
// TYPES — Canva Mode Visual Page Builder (Page Assembler v2)
// ═══════════════════════════════════════════════════════════════

export interface Ratio {
  id: string;
  name: string;
  desc: string;
  w: number;
  h: number;
}

export interface ElemType {
  id: string;
  icon: string;
  name: string;
  color: string;
}

export interface CanvaElement {
  id: string;
  type: string;
  icon?: string;
  label?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  hidden?: boolean;
  // Teks-specific
  text?: string;
  fontSize?: number;
  textColor?: string;
  // Shape-specific
  color?: string;
  radius?: number;
  // Data reference (kuis/game/modul)
  dataIdx?: number;
  // Layout variant for module rendering
  layoutVariant?: 'A' | 'B' | 'C' | 'D';
}

// ── Template System Types ─────────────────────────────────────

export type PageTemplateType =
  | 'cover'      // Cover / judul halaman
  | 'dokumen'    // CP / TP / ATP display
  | 'materi'     // Materi pembelajaran
  | 'kuis'       // Kuis interaktif
  | 'game'       // Game interaktif (sub-type from modules)
  | 'hasil'      // Hasil / apresiasi
  | 'hero'       // Hero banner
  | 'skenario'   // Skenario interaktif
  | 'custom';    // Blank canvas (legacy element mode)

export interface ColorPalette {
  colors: string[];             // Extracted hex colors (up to 8)
  mapping: Record<string, string>; // CSS var → hex mapping
}

export interface NavConfig {
  showNavbar: boolean;
  showPrevNext: boolean;
  showScore: boolean;
  showProgress: boolean;
  navbarStyle: 'colorful' | 'minimal' | 'glass';
}

export interface CanvaPage {
  id: string;
  label: string;
  bgDataUrl: string | null;
  bgColor: string;
  overlay: number;
  elements: CanvaElement[];
  // ── Template system (v2) ──
  templateType: PageTemplateType;
  colorPalette: ColorPalette | null;
  navConfig: NavConfig;
  // Template-specific data binding
  templateData: Record<string, unknown>;
}

export type LeftTab = 'pages' | 'templates' | 'elems' | 'ratio' | 'layers';
export type Tool = 'select' | 'text';
export type ResizeDir = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'tm' | 'bm';

// ── Constants ──────────────────────────────────────────────────

export const RATIOS: Ratio[] = [
  { id: '16:9', name: '16:9', desc: 'Landscape PPT', w: 1280, h: 720 },
  { id: '9:16', name: '9:16', desc: 'Portrait HP', w: 720, h: 1280 },
  { id: '1:1', name: '1:1', desc: 'Square Post', w: 800, h: 800 },
  { id: 'A4', name: 'A4', desc: 'Dokumen LKS', w: 794, h: 1123 },
  { id: '4:3', name: '4:3', desc: 'Presentasi Lama', w: 1024, h: 768 },
];

export const ELEM_TYPES: ElemType[] = [
  { id: 'kuis', icon: '❓', name: 'Kuis', color: 'rgba(245,200,66,.4)' },
  { id: 'game', icon: '🎮', name: 'Game', color: 'rgba(56,217,217,.4)' },
  { id: 'materi', icon: '📝', name: 'Materi', color: 'rgba(167,139,250,.4)' },
  { id: 'modul', icon: '🧩', name: 'Modul', color: 'rgba(52,211,153,.4)' },
  { id: 'teks', icon: '🔤', name: 'Teks', color: 'rgba(255,255,255,.3)' },
  { id: 'shape', icon: '⬜', name: 'Shape', color: 'rgba(100,100,200,.3)' },
];

export const LAYER_COLORS: Record<string, string> = {
  kuis: '#f5c842',
  game: '#3ecfcf',
  materi: '#a78bfa',
  modul: '#34d399',
  teks: '#fff',
  shape: '#6366f1',
};

// ── Template Gallery Constants ────────────────────────────────

export interface TemplateInfo {
  id: PageTemplateType;
  icon: string;
  name: string;
  desc: string;
  color: string;
  category: 'utama' | 'konten' | 'interaktif' | 'penutup';
}

export const TEMPLATE_TYPES: TemplateInfo[] = [
  { id: 'cover',    icon: '🏠', name: 'Cover',       desc: 'Halaman judul & pembuka',     color: '#f9c82e', category: 'utama' },
  { id: 'dokumen',  icon: '📋', name: 'Dokumen',     desc: 'CP, TP, ATP',                color: '#3ecfcf', category: 'utama' },
  { id: 'hero',     icon: '🚀', name: 'Hero',        desc: 'Banner dengan gradient',      color: '#fb923c', category: 'konten' },
  { id: 'materi',   icon: '📝', name: 'Materi',      desc: 'Konten pembelajaran',         color: '#a78bfa', category: 'konten' },
  { id: 'skenario', icon: '🎭', name: 'Skenario',    desc: 'Cerita interaktif pilihan',   color: '#f472b6', category: 'interaktif' },
  { id: 'kuis',     icon: '❓', name: 'Kuis',        desc: 'Soal pilihan ganda',          color: '#f5c842', category: 'interaktif' },
  { id: 'game',     icon: '🎮', name: 'Game',        desc: 'Game interaktif',             color: '#3ecfcf', category: 'interaktif' },
  { id: 'hasil',    icon: '🏆', name: 'Hasil',       desc: 'Skor & apresiasi',            color: '#34d399', category: 'penutup' },
  { id: 'custom',   icon: '⬜', name: 'Kosong',      desc: 'Canvas kosong (bebas)',       color: '#6366f1', category: 'utama' },
];

// ── Gradient Presets ──────────────────────────────────────────

export interface GradientPreset {
  id: string;
  name: string;
  css: string;
  category: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset',    name: 'Sunset',     css: 'linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)',       category: 'energik' },
  { id: 'ocean',     name: 'Ocean',      css: 'linear-gradient(135deg,#06b6d4,#3b82f6,#6366f1)',       category: 'dingin' },
  { id: 'forest',    name: 'Forest',     css: 'linear-gradient(135deg,#10b981,#059669,#047857)',       category: 'alam' },
  { id: 'aurora',    name: 'Aurora',     css: 'linear-gradient(135deg,#a78bfa,#ec4899,#f97316)',       category: 'energik' },
  { id: 'midnight',  name: 'Midnight',   css: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',       category: 'profesional' },
  { id: 'cherry',    name: 'Cherry',     css: 'linear-gradient(135deg,#fda4af,#fb7185,#e11d48)',       category: 'fun' },
  { id: 'golden',    name: 'Golden',     css: 'linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)',       category: 'hangat' },
  { id: 'neon',      name: 'Neon',       css: 'linear-gradient(135deg,#22d3ee,#a855f7,#f43f5e)',       category: 'fun' },
  { id: 'slate',     name: 'Slate',      css: 'linear-gradient(135deg,#334155,#475569,#64748b)',       category: 'minimal' },
  { id: 'ember',     name: 'Ember',      css: 'linear-gradient(135deg,#dc2626,#ea580c,#f59e0b)',       category: 'hangat' },
];

// ── Default Nav Config ────────────────────────────────────────

export const DEFAULT_NAV_CONFIG: NavConfig = {
  showNavbar: true,
  showPrevNext: true,
  showScore: true,
  showProgress: true,
  navbarStyle: 'colorful',
};

// ── Layout Presets ──────────────────────────────────────────────

export interface LayoutSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutPreset {
  id: string;
  name: string;
  icon: string;
  desc: string;
  slots: LayoutSlot[];
}

/**
 * Layout presets for quickly arranging elements on the canvas.
 * Each preset defines named slots with x/y/w/h percentages.
 * When applied, elements are repositioned to fill each slot in order.
 */
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'free',
    name: 'Bebas',
    icon: '✋',
    desc: 'Posisi bebas tanpa pengaturan',
    slots: [],
  },
  {
    id: 'full',
    name: 'Penuh',
    icon: '⬜',
    desc: '1 elemen memenuhi halaman',
    slots: [{ x: 2, y: 2, w: 96, h: 96 }],
  },
  {
    id: 'headline',
    name: 'Headline',
    icon: '📰',
    desc: 'Judul di atas, konten di bawah',
    slots: [
      { x: 2, y: 2, w: 96, h: 18 },   // Header/title
      { x: 2, y: 22, w: 96, h: 76 },   // Main content
    ],
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    icon: '📐',
    desc: 'Konten utama + sidebar kanan',
    slots: [
      { x: 2, y: 2, w: 66, h: 96 },    // Main
      { x: 70, y: 2, w: 28, h: 96 },   // Sidebar
    ],
  },
  {
    id: '2col',
    name: '2 Kolom',
    icon: '▥',
    desc: 'Dua kolom sejajar',
    slots: [
      { x: 2, y: 2, w: 47, h: 96 },
      { x: 51, y: 2, w: 47, h: 96 },
    ],
  },
  {
    id: '3col',
    name: '3 Kolom',
    icon: '▤',
    desc: 'Tiga kolom sejajar',
    slots: [
      { x: 2, y: 2, w: 30, h: 96 },
      { x: 35, y: 2, w: 30, h: 96 },
      { x: 68, y: 2, w: 30, h: 96 },
    ],
  },
  {
    id: 'quiz-layout',
    name: 'Kuis',
    icon: '❓',
    desc: 'Judul kecil + area kuis besar',
    slots: [
      { x: 2, y: 2, w: 96, h: 12 },    // Quiz header
      { x: 2, y: 16, w: 96, h: 82 },   // Quiz body
    ],
  },
  {
    id: 'media-text',
    name: 'Media + Teks',
    icon: '🖼️',
    desc: 'Media kiri, teks kanan',
    slots: [
      { x: 2, y: 2, w: 48, h: 96 },    // Media/visual
      { x: 52, y: 2, w: 46, h: 96 },   // Text content
    ],
  },
  {
    id: 'quad',
    name: '2×2 Grid',
    icon: '⊞',
    desc: 'Empat kuadran',
    slots: [
      { x: 2, y: 2, w: 47, h: 47 },
      { x: 51, y: 2, w: 47, h: 47 },
      { x: 2, y: 51, w: 47, h: 47 },
      { x: 51, y: 51, w: 47, h: 47 },
    ],
  },
  {
    id: 'hero-cta',
    name: 'Hero + CTA',
    icon: '🚀',
    desc: 'Hero besar + tombol CTA',
    slots: [
      { x: 2, y: 2, w: 96, h: 72 },    // Hero area
      { x: 25, y: 78, w: 50, h: 16 },   // CTA button centered
    ],
  },
];
