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
  // Data reference (kuis/game/modul) — stable ID referencing authoring store
  moduleId?: string; // UUID-based stable reference to modules[] (preferred)
  kuisId?: string;   // UUID-based stable reference to kuis[] (preferred)
  kuisIds?: string[]; // Multiple kuis IDs — for template pages with multiple questions
  /** @deprecated Use moduleId/kuisId instead — array indices break when items are reordered.
   *
   *  REMAINING CONSUMERS (as of E-3):
   *    - module-resolver.ts: Priority 2 fallback (moduleId > dataIdx) — reads dataIdx
   *    - sync-slice.ts: ID re-sync — writes moduleId from dataIdx when missing
   *    - element-slice.ts: Sets dataIdx on new kuis/game/module elements (also sets stable ID)
   *    - GameWidget.tsx: Props dataIdx for resolveModule() pseudo-element
   *    - QuizWidget.tsx: Props dataIdx for resolveKuis() pseudo-element
   *    - BlockRenderer.tsx: Passes dataIdx to GameWidget/QuizWidget
   *    - ElementProperties.tsx: DataIdxSelector UI for choosing module/kuis index
   *    - canva-constants.ts: Default value (-1) in element factory
   *
   *  MIGRATION PATH (for full removal):
   *    1. sync-slice.ts already promotes dataIdx → moduleId/kuisId on sync.
   *       After enough time, all saved data will have stable IDs and dataIdx
   *       will always be -1 or undefined.
   *    2. Once dataIdx is never set in new elements (element-slice always
   *       provides moduleId/kuisId), module-resolver can drop the fallback.
   *    3. GameWidget/QuizWidget can stop accepting dataIdx prop.
   *    4. Then this field can be removed from CanvaElement.
   *
   *  SAFE TO KEEP: The dataIdx is only a fallback — if moduleId/kuisId is present,
   *  dataIdx is ignored at runtime. No incorrect behavior occurs if it's stale.
   */
  dataIdx?: number;
  // Layout variant for module rendering
  layoutVariant?: 'A' | 'B' | 'C' | 'D';
  // ── Text styling (teks element) ──
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: number; // 100-900
  // ── Image element properties ──
  imageUrl?: string;      // URL or data URL of the image
  imageFit?: 'cover' | 'contain' | 'fill' | 'none'; // CSS object-fit behavior
}

// ── Template System Types ─────────────────────────────────────

export type PageTemplateType =
  | 'cover'      // Cover / judul halaman
  | 'petunjuk'   // Petunjuk penggunaan media
  | 'dokumen'    // CP / TP / ATP display
  | 'tujuan'     // Tujuan Pembelajaran (BSNP — student-facing TP)
  | 'motivasi'   // Motivasi / Apersepsi (BSNP — hook & connections)
  | 'materi'     // Materi pembelajaran
  | 'diskusi'    // Diskusi & pertanyaan reflektif
  | 'skenario'   // Skenario interaktif
  | 'kuis'       // Kuis interaktif
  | 'game'       // Game interaktif (sub-type from modules)
  | 'hasil'      // Hasil / apresiasi
  | 'refleksi'   // Refleksi diri & portofolio
  | 'rangkuman'  // Rangkuman (BSNP — key concepts & reinforcement)
  | 'penutup'    // Penutup & preview pertemuan berikutnya
  | 'hero'       // Hero banner
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
  /** @deprecated FASE 1 → FASE 4: Legacy data binding.
   *  Schema-driven pages use page.schema instead.
   *
   *  REMAINING CONSUMERS (as of E-3):
   *    - ensurePageSchema() Path 2: promotes templateData.schemaScreen → page.schema
   *    - setSchemaThemeId(): writes schemaThemeId to templateData (should migrate to schema)
   *    - persistence-slice.ts: Backward compat during loadFromStorage/loadFromDB
   *    - TemplateAdapter.ts: convertToSchema() reads page.templateData
   *
   *  MIGRATED AWAY (E-3):
   *    - ✅ PageSettingsSection.tsx: Quick edit removed — schema pages edited via canvas
   *    - ✅ updateTemplateData() UI call: No active consumers remain
   *
   *  MIGRATION PATH (for full removal):
   *    1. Move schemaThemeId from templateData → ScreenSchema.background or nav
   *    2. After all users re-save, ensure-schema Path 2 is dead code → remove
   *    3. After TemplateAdapter is removed (all legacy pages migrated), this field
   *       can be made optional and eventually removed from CanvaPage
   *
   *  New code should NEVER write to templateData — use page.schema instead.
   */
  templateData: Record<string, unknown>;
  // ── Overlay elements (v3 — Phase 1) ── REMOVED in v4.
  // All elements now live in elements[]. The overlay system was part of
  // the old locked/unlocked model which has been removed.
  //
  // MIGRATION GUARD (persistence-slice.ts):
  //   - On load, if _migrationVersion < 1, overlayElements are merged into elements[]
  //   - After first save, _migrationVersion >= 1 and the merge is skipped
  //   - overlayElements is always set to [] after load
  //
  // REMOVAL: After all users have loaded with _migrationVersion >= 1,
  // this field and the migration guard in persistence-slice.ts can be removed.
  /** @deprecated v4: Always empty after load. Merged into elements[] on first load only. */
  overlayElements?: CanvaElement[];
  // ── Template layout variant (Phase 3) ──
  // Different visual layouts for the same template type (A/B/C)
  templateVariant?: 'A' | 'B' | 'C';

  // ── Template Theme Contract (Contract Enforcement Layer) ──
  // Links this page to a TemplateThemeContract for visual enforcement.
  // When set, the contract OVERRIDES scene/block default styles.
  // Priority: TemplateThemeContract > Scene Style > Block Default
  // Stored on the page so it persists through save/load cycles.
  contractId?: string;

  // ── Schema-first (FASE 1 — Schema as Canonical State) ──
  // First-class ScreenSchema — the canonical runtime representation.
  // When present, renderer uses this DIRECTLY (no TemplateAdapter needed).
  // When absent, legacy pages are lazily migrated via ensurePageSchema().
  // After save+load, legacy pages become native schema pages automatically.
  schema?: import('@/core/schema/types').ScreenSchema;

  // ── Page Mode Discriminator (DUAL-RENDER GUARD) ──
  // This field makes dual-render structurally detectable:
  //
  //   pageMode === 'schema'  →  page.schema MUST be populated, page.elements MUST be []
  //   pageMode === 'elements' → page.elements MUST be populated, page.schema MUST be undefined
  //
  // Runtime invariant: validateCanvaPageInvariant() enforces this in dev mode.
  // Factory functions (createSchemaPage, createElementsPage) enforce this at creation time.
  // This prevents the dual-render bug where content appears twice because
  // both page.schema and page.elements[] are populated simultaneously.
  pageMode?: 'schema' | 'elements';
}

// ── Strict Page Types (Creation-Time Enforcement) ─────────────────
// These types are used by factory functions to enforce the dual-render
// guard at the POINT OF CREATION. TypeScript will reject any attempt
// to create a page with both schema and elements populated.
//
// Reading code can still use the base CanvaPage type for backward compat.
// But any NEW page creation MUST go through these strict types.

/** Schema-driven page: schema is the single source of truth, elements is empty */
export type SchemaCanvaPage = CanvaPage & {
  pageMode: 'schema';
  schema: import('@/core/schema/types').ScreenSchema;
  elements: [];
};

/** Legacy element-based page: elements[] is the data model, no schema */
export type ElementsCanvaPage = CanvaPage & {
  pageMode: 'elements';
  elements: import('@/components/canva/types').CanvaElement[];
  schema?: undefined;
};

// ── App Mode (5-mode architecture) ──────────────────────────────
// EDIT:    Full canvas editing — selection, overlays, drag, nudge
// PREVIEW: Quick student-view — no editing chrome, no overlays
// PRESENT: Fullscreen playback — PlayOverlay with interactive widgets
// EXPORT:  Export pipeline — PDF/PPTX generation, no UI chrome
// LEARN:   Student-facing LearningMediaShell — unified media player
export type AppMode = 'edit' | 'preview' | 'present' | 'export' | 'learn';

export type LeftTab = 'pages' | 'add-block' | 'templates' | 'history' | 'settings' | 'sisipkan';
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
  { id: 'image', icon: '🖼️', name: 'Gambar', color: 'rgba(249,115,22,.4)' },
];

export const LAYER_COLORS: Record<string, string> = {
  kuis: '#f5c842',
  game: '#3ecfcf',
  materi: '#a78bfa',
  modul: '#34d399',
  teks: '#fff',
  shape: '#6366f1',
  image: '#f97316',
};

// ── Template Gallery Constants ────────────────────────────────
// DEAD CODE REMOVED (v4): TEMPLATE_TYPES and TemplateInfo were
// superseded by PagePresetRegistry. Zero imports existed outside
// this file. Use getAllPresets() from @/core/preset/PagePresetRegistry.

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
