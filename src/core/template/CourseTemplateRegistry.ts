// ═══════════════════════════════════════════════════════════════════
// COURSE TEMPLATE REGISTRY — 3-Level Template System
// ═══════════════════════════════════════════════════════════════════
// Level 1: CourseTemplate — complete learning flow blueprint
// Level 2: SceneTemplateSpec — per-scene specification
// Level 3: Block Preset — per-block styling (handled by BlockDefinitionRegistry)
//
// This registry provides:
//   - CourseTemplate definitions with scene flow
//   - createProjectFromTemplate() to generate CanvaPage[] from a template
//   - Filtering by subject
//
// Design Principles:
//   1. Metadata-driven — UI renders from registry data
//   2. Uses existing PagePresetRegistry for page creation
//   3. Adds suggested blocks via store's addSchemaBlock
//   4. Links to existing theme presets
//   5. Every subject has at least one template + the generic empty template

import type { PageTemplateType } from '@/components/canva/types';
import type { CanvaPage } from '@/components/canva/types';
import { createPageFromPreset } from '@/core/preset/PagePresetRegistry';
import type { SceneType } from '@/core/edu/education-scene-types';
import { TEMPLATE_TO_SCENE } from '@/core/edu/education-scene-types';

// ── Source of Truth Contracts (promoted from dead docs → active engine) ──
export { GOLDEN_FLOW, GOLDEN_FLOW_META, getGoldenFlowIntensityCurve, validateGoldenFlow } from './golden/interactive-lesson';
export type { GoldenFlowScene } from './golden/interactive-lesson';
export {
  VISUAL_DNA_TYPOGRAPHY,
  VISUAL_DNA_COLORS,
  VISUAL_DNA_LAYOUT,
  VISUAL_DNA_CARD,
  VISUAL_DNA_NAVIGATION,
  VISUAL_DNA_MOTION,
  VISUAL_DNA_RHYTHM,
  VISUAL_DNA_INTERACTION,
  VISUAL_DNA_QUICK_REF,
} from '@/core/visual-dna/visual-dna';

// ── Block Type Icon Map ───────────────────────────────────────

const BLOCK_ICONS: Record<string, string> = {
  'cover': '🏠',
  'petunjuk': '📋',
  'tp': '🎯',
  'alur': '⏱️',
  'skenario': '🎭',
  'def-box': '📖',
  'nc-grid': '🔲',
  'flashcard-set': '🃏',
  'ftab': '📑',
  'nk-card': '🪪',
  'materi-section': '📚',
  'diskusi': '💬',
  'kuis': '❓',
  'sortir-game': '🔀',
  'roda-game': '🎡',
  'memory-game': '🧠',
  'matching-game': '🔗',
  'fill-blank-game': '✏️',
  'word-search-game': '🔍',
  'true-false-game': '✅',
  'drag-drop-game': '👆',
  'crossword-game': '🧩',
  'team-buzzer-game': '🔔',
  'hasil': '🏆',
  'refleksi': '📝',
  'penutup': '👋',
  'tujuan-display': '🎯',
  'motivasi': '💡',
  'rangkuman': '📊',
  'tabel-accord': '📋',
};

export function getBlockIcon(blockType: string): string {
  return BLOCK_ICONS[blockType] || '📦';
}

// ── Preview Block Info (for marketplace/gallery cards) ──────────

export interface PreviewBlockInfo {
  type: string;
  icon: string;
  label: string;
}

export interface PreviewScreenInfo {
  templateType: string;
  label: string;
  blocks: PreviewBlockInfo[];
}

// ── Level 2: Scene Template Spec ───────────────────────────────

export interface SceneTemplateSpec {
  /** Page template type (cover, materi, kuis, etc.) */
  templateType: PageTemplateType;
  /** Display label for the scene (e.g., "Pembuka", "Materi 1") */
  label: string;
  /** Block types to auto-add to this scene */
  suggestedBlocks: string[];
  /** Layout variant */
  variant?: 'A' | 'B' | 'C';
  /**
   * Scene type for scene-aware rendering.
   * If not specified, inferred from templateType via TEMPLATE_TO_SCENE mapping.
   * This enables the 6-layer emotional design system to adjust:
   *   - Typography hierarchy (hero/title/body per scene)
   *   - Accent prominence (which colors are muted/vocal)
   *   - Emotional profile (progress/discovery/reward triggers)
   *   - Reveal strategy (all-visible/progressive/on-interaction)
   */
  sceneType?: SceneType;
}

// ── Level 1: Course Template ───────────────────────────────────

export interface CourseTemplate {
  /** Unique template ID */
  id: string;
  /** Display name */
  name: string;
  /** Subtitle (e.g., 'PPKn Kelas 7 - Semester 1') */
  subtitle: string;
  /** Short description */
  description: string;
  /** Subject (e.g., 'PPKn', 'IPA', 'MTK') — '*' for universal */
  subject: string;
  /** Grade level (e.g., '7', '8', '9') — '*' for any grade */
  grade: string;
  /** Semester ('1' or '2') — '*' for any semester */
  semester: string;
  /** Theme preset ID (links to existing DesignTokens theme) */
  theme: string;
  /** Ordered scene specifications */
  scenes: SceneTemplateSpec[];
  /** Metadata */
  metadata: {
    icon: string;
    author: string;
    version: string;
  };
  /**
   * Premium preset ID — links to a handcrafted LessonSchema in src/presets/.
   * When set, createProjectFromTemplate() will load this preset first
   * (Level 1 pipeline), producing rich, pedagogically-structured content
   * instead of empty structural shells.
   */
  presetId?: string;
  // ── UI-facing fields (for template gallery / marketplace) ──
  /** Tailwind color key for card styling (e.g., 'amber', 'emerald', 'sky') */
  color: string;
  /** Learning flow pattern */
  pattern: TemplatePattern;
  /** Search tags */
  tags: string[];
  // ── Marketplace/Gallery display fields ──
  /** Cover gradient colors for card display (e.g., ['y', 'o'] for amber→orange) */
  coverGradient?: [string, string];
  /** Preview block info for marketplace card display */
  previewBlocks?: PreviewScreenInfo[];
  /** Whether this template is BSNP-compliant */
  bsnpCompliant?: boolean;
}

// ── Template Pattern — Learning flow archetype ─────────────────

export type TemplatePattern = 'standar' | 'interaktif' | 'eksperimen' | 'mini';

export const TEMPLATE_PATTERNS: Record<TemplatePattern, {
  id: TemplatePattern;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  standar: {
    id: 'standar',
    label: 'Standar',
    description: 'Alur lengkap pembelajaran: pembuka, materi, latihan, penutup',
    icon: '📋',
    color: 'sky',
  },
  interaktif: {
    id: 'interaktif',
    label: 'Interaktif',
    description: 'Banyak aktivitas interaktif: skenario, game, diskusi',
    icon: '🎮',
    color: 'violet',
  },
  eksperimen: {
    id: 'eksperimen',
    label: 'Eksperimen',
    description: 'Berbasis praktikum dan penyelidikan ilmiah',
    icon: '🔬',
    color: 'emerald',
  },
  mini: {
    id: 'mini',
    label: 'Mini',
    description: 'Pertemuan singkat: materi inti + kuis cepat',
    icon: '⚡',
    color: 'amber',
  },
};

// ── Template Customization ──────────────────────────────────────

export interface TemplateCustomization {
  /** Which pages to include (by index in template.scenes) */
  enabledPages: boolean[];
  /** Number of quiz questions */
  jumlahKuis: number;
  /** Variant preference */
  variant: 'A' | 'B' | 'C';
  /** Teacher name to inject into cover */
  guru?: string;
  /** School name to inject into cover */
  sekolah?: string;
}

export function getDefaultCustomization(template: CourseTemplate): TemplateCustomization {
  return {
    enabledPages: template.scenes.map(() => true),
    jumlahKuis: 5,
    variant: 'A',
  };
}

// ── Metadata for createProjectFromTemplate ─────────────────────

export interface ProjectMetadata {
  /** Presentation title */
  title: string;
  /** Teacher name */
  guru?: string;
  /** School name */
  sekolah?: string;
}

// ── Subject Configuration ──────────────────────────────────────

export interface SubjectConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const SUBJECTS: SubjectConfig[] = [
  { id: 'PPKn', label: 'PPKn', icon: '⚖️', color: '#ef4444' },
  { id: 'IPA', label: 'IPA', icon: '🔬', color: '#22c55e' },
  { id: 'MTK', label: 'Matematika', icon: '📐', color: '#3b82f6' },
  { id: 'B.Indonesia', label: 'Bahasa Indonesia', icon: '📖', color: '#f59e0b' },
  { id: 'B.Inggris', label: 'B. Inggris', icon: '🌍', color: '#8b5cf6' },
  { id: 'IPS', label: 'IPS', icon: '🏛️', color: '#f97316' },
  { id: 'Seni', label: 'Seni Budaya', icon: '🎨', color: '#ec4899' },
  { id: 'PJOK', label: 'PJOK', icon: '⚽', color: '#06b6d4' },
  { id: 'Informatika', label: 'Informatika', icon: '💻', color: '#6366f1' },
  { id: 'Lainnya', label: 'Lainnya', icon: '📚', color: '#6b7280' },
];

// ── Grade Options ──────────────────────────────────────────────

export const GRADE_OPTIONS = [
  { value: '1', label: 'Kelas 1 SD' },
  { value: '2', label: 'Kelas 2 SD' },
  { value: '3', label: 'Kelas 3 SD' },
  { value: '4', label: 'Kelas 4 SD' },
  { value: '5', label: 'Kelas 5 SD' },
  { value: '6', label: 'Kelas 6 SD' },
  { value: '7', label: 'Kelas 7 SMP' },
  { value: '8', label: 'Kelas 8 SMP' },
  { value: '9', label: 'Kelas 9 SMP' },
  { value: '10', label: 'Kelas 10 SMA' },
  { value: '11', label: 'Kelas 11 SMA' },
  { value: '12', label: 'Kelas 12 SMA' },
];

export const SEMESTER_OPTIONS = [
  { value: '1', label: 'Semester 1 (Ganjil)' },
  { value: '2', label: 'Semester 2 (Genap)' },
];

// ═══════════════════════════════════════════════════════════════════
// ACTIVE COURSE TEMPLATES — Golden Flow only (SILSE v2.1)
// ═══════════════════════════════════════════════════════════════════
// Filosofi baru: experience → template → system
//
// Hanya 3 template aktif. Legacy templates sudah di-purge (Phase 1).
//
// ❄️ template-gallery.ts — FROZEN (LESSON_TEMPLATES + SUBJECT_MOCK_DATA)
// ❄️ marketplace-templates.ts — FROZEN (6 template definitions)
// ✅ Golden Flow — src/core/template/golden/interactive-lesson.ts
// ✅ Visual DNA — src/core/visual-dna/visual-dna.ts

const COURSE_TEMPLATES: CourseTemplate[] = [
  // ── PPKn VII — Alur Emas: Hakikat Norma ──────────────────────
  // SYNCED with: golden/interactive-lesson.ts + presets/ppkn/hakikat-norma-schema.ts
  // Flow: Cover → Petunjuk → Tujuan → Apersepsi → Diskusi → Materi 1 → Materi 2 → Game → Hasil → Refleksi → Penutup
  {
    id: 'modul-ppkn-vii',
    name: 'Hakikat Norma — Interactive Lesson',
    subtitle: 'PPKn Kelas 7 - Semester 1',
    description: 'Alur emas PPKn VII: Cover → Petunjuk → Tujuan → Apersepsi (4 Skenario) → Diskusi → Materi 1 (Pengertian) → Materi 2 (Fungsi) → Game → Hasil → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'hakikat-norma',
    presetId: 'hakikat-norma',
    color: 'amber',
    pattern: 'interaktif',
    tags: ['norma', 'aturan', 'sanksi', 'masyarakat', 'hukum'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A', sceneType: 'intro' },
      { templateType: 'tujuan', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tp', 'alur'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Apersepsi — Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi — Manusia Makhluk Sosial', suggestedBlocks: ['def-box', 'nc-grid', 'diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'materi', label: 'Materi 1 — Pengertian Norma', suggestedBlocks: ['def-box', 'nc-grid', 'flashcard-set', 'diskusi'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Fungsi Norma', suggestedBlocks: ['ftab', 'def-box', 'flashcard-set', 'diskusi'], variant: 'A', sceneType: 'concept' },
      { templateType: 'game', label: 'Game Fungsi Norma', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'practice' },
      { templateType: 'hasil', label: 'Hasil', suggestedBlocks: ['hasil'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi Diri', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '2.1.0' },
  },

  // ── PPKn VII — Alur Emas: Macam-Macam Norma ────────────────
  // SYNCED with: presets/ppkn/macam-norma-schema.ts
  // Flow: Cover → Petunjuk → CP/TP/ATP → TP → Review → Materi (4 Norma) → Game Sortir → Hubungan Antarnorma → Game Roda → Refleksi → Penutup
  {
    id: 'modul-ppkn-vii-macam-norma',
    name: 'Macam-Macam Norma — Interactive Lesson',
    subtitle: 'PPKn Kelas 7 - Semester 1',
    description: 'Alur emas PPKn VII Pertemuan 2: Cover → Petunjuk → CP/TP/ATP → Review → Eksplorasi 4 Norma → Game Sortir → Hubungan Antarnorma → Game Roda → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'macam-norma',
    presetId: 'macam-norma',
    color: 'amber',
    pattern: 'interaktif',
    tags: ['norma', 'macam norma', 'agama', 'kesusilaan', 'kesopanan', 'hukum'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'CP · TP · ATP', suggestedBlocks: ['ftab'], variant: 'A', sceneType: 'intro' },
      { templateType: 'tujuan', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tp', 'alur'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Review Pertemuan 1', suggestedBlocks: ['nc-grid', 'diskusi', 'def-box'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Eksplorasi 4 Norma', suggestedBlocks: ['ftab', 'tabel-accord', 'diskusi'], variant: 'A', sceneType: 'concept' },
      { templateType: 'game', label: 'Game Sortir Norma', suggestedBlocks: ['sortir-game', 'diskusi'], variant: 'A', sceneType: 'practice' },
      { templateType: 'materi', label: 'Hubungan Antarnorma', suggestedBlocks: ['tabel-accord', 'nc-grid', 'diskusi'], variant: 'A', sceneType: 'concept' },
      { templateType: 'game', label: 'Game Roda Norma', suggestedBlocks: ['roda-game'], variant: 'A', sceneType: 'practice' },
      { templateType: 'refleksi', label: 'Refleksi Diri', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📜', author: 'SILSE', version: '2.1.0' },
  },

  // ── Template Kosong — Universal (subject='*', grade='*') ────
  {
    id: 'template-kosong',
    name: 'Template Kosong',
    subtitle: 'Semua Mapel - Semua Kelas',
    description: 'Mulai dari nol dengan Cover dan Penutup saja. Tambahkan halaman sesuai kebutuhan.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'golden-presentation',
    color: 'sky',
    pattern: 'mini',
    tags: ['kosong', 'blank', 'universal'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📋', author: 'SILSE', version: '2.1.0' },
  },

  // ── MARKETPLACE TEMPLATES — Absorbed from marketplace-templates.ts ──
  // Metadata only. Schema factories are in _schemaFactories map below.
  // These templates use presetId or schemaFactory for content generation.

  {
    id: 'mat-persamaan-linear',
    name: 'Persamaan Linear',
    subtitle: 'Matematika Kelas 7 - Semester 1',
    description: 'Pelajari konsep persamaan linear satu variabel melalui kuis interaktif, isian singkat, dan drag-drop. Cocok untuk kelas 7 semester 1 dengan pendekatan kontekstual.',
    subject: 'MTK',
    grade: '7',
    semester: '1',
    theme: 'golden-presentation',
    color: 'amber',
    pattern: 'interaktif',
    coverGradient: ['y', 'o'],
    bsnpCompliant: true,
    previewBlocks: [
      { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
      { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Kartu Konsep' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
      { templateType: 'game', label: 'Latihan Interaktif', blocks: [{ type: 'fill-blank-game', icon: '✏️', label: 'Isian Singkat' }, { type: 'drag-drop-game', icon: '👆', label: 'Drag & Drop' }] },
      { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Kuis Pilihan Ganda' }] },
      { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi Diri' }] },
    ],
    tags: ['matematika', 'aljabar', 'persamaan linear', 'PLSV'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['def-box', 'nc-grid', 'flashcard-set'], sceneType: 'concept' },
      { templateType: 'game', label: 'Latihan Interaktif', suggestedBlocks: ['fill-blank-game', 'drag-drop-game'], sceneType: 'practice' },
      { templateType: 'game', label: 'Kuis', suggestedBlocks: ['kuis'], sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], sceneType: 'reflection' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '2.1.0' },
  },

  {
    id: 'ipa-tata-surya',
    name: 'Sistem Tata Surya',
    subtitle: 'IPA Kelas 7 - Semester 2',
    description: 'Eksplorasi planet-planet dalam tata surya melalui media visual, word search, dan kuis benar-salah. Template interaktif untuk kelas 7 semester 2.',
    subject: 'IPA',
    grade: '7',
    semester: '2',
    theme: 'golden-presentation',
    color: 'sky',
    pattern: 'interaktif',
    coverGradient: ['c', 'p'],
    bsnpCompliant: true,
    previewBlocks: [
      { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
      { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Planet-planet' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
      { templateType: 'game', label: 'Word Search', blocks: [{ type: 'word-search-game', icon: '🔍', label: 'Cari Kata' }] },
      { templateType: 'game', label: 'Kuis', blocks: [{ type: 'true-false-game', icon: '✅', label: 'Benar-Salah' }, { type: 'kuis', icon: '❓', label: 'Pilihan Ganda' }] },
      { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi Diri' }] },
    ],
    tags: ['ipa', 'tata surya', 'planet', 'astronomi'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['def-box', 'nc-grid', 'flashcard-set'], sceneType: 'concept' },
      { templateType: 'game', label: 'Word Search', suggestedBlocks: ['word-search-game'], sceneType: 'practice' },
      { templateType: 'game', label: 'Kuis', suggestedBlocks: ['true-false-game', 'kuis'], sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], sceneType: 'reflection' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '2.1.0' },
  },

  {
    id: 'ipa-ekosistem',
    name: 'Ekosistem',
    subtitle: 'IPA Kelas 7 - Semester 1',
    description: 'Pahami interaksi makhluk hidup dengan lingkungan melalui memory game, matching game, dan crossword. Template seru untuk kelas 7 semester 1.',
    subject: 'IPA',
    grade: '7',
    semester: '1',
    theme: 'golden-presentation',
    color: 'emerald',
    pattern: 'interaktif',
    coverGradient: ['g', 'c'],
    bsnpCompliant: true,
    previewBlocks: [
      { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
      { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Komponen' }] },
      { templateType: 'game', label: 'Memory Game', blocks: [{ type: 'memory-game', icon: '🧠', label: 'Memory' }] },
      { templateType: 'game', label: 'Matching & Crossword', blocks: [{ type: 'matching-game', icon: '🔗', label: 'Matching' }, { type: 'crossword-game', icon: '🧩', label: 'Crossword' }] },
      { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi Diri' }] },
    ],
    tags: ['ipa', 'ekosistem', 'biotik', 'abiotik'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['def-box', 'nc-grid'], sceneType: 'concept' },
      { templateType: 'game', label: 'Memory Game', suggestedBlocks: ['memory-game'], sceneType: 'practice' },
      { templateType: 'game', label: 'Matching & Crossword', suggestedBlocks: ['matching-game', 'crossword-game'], sceneType: 'practice' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], sceneType: 'reflection' },
    ],
    metadata: { icon: '🌿', author: 'SILSE', version: '2.1.0' },
  },

  {
    id: 'ips-sejarah-indonesia',
    name: 'Sejarah Indonesia',
    subtitle: 'IPS Kelas 8 - Semester 1',
    description: 'Pelajari peristiwa penting sejarah Indonesia melalui skenario interaktif, kuis, dan team buzzer. Template menarik untuk kelas 8 semester 1.',
    subject: 'IPS',
    grade: '8',
    semester: '1',
    theme: 'golden-presentation',
    color: 'red',
    pattern: 'interaktif',
    coverGradient: ['r', 'o'],
    bsnpCompliant: true,
    previewBlocks: [
      { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
      { templateType: 'skenario', label: 'Skenario', blocks: [{ type: 'skenario', icon: '🎭', label: 'Skenario Interaktif' }] },
      { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Pilihan Ganda' }] },
      { templateType: 'game', label: 'Team Buzzer', blocks: [{ type: 'team-buzzer-game', icon: '🔔', label: 'Team Buzzer' }] },
      { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
    ],
    tags: ['ips', 'sejarah', 'indonesia', 'kemerdekaan'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario', suggestedBlocks: ['skenario'], sceneType: 'example' },
      { templateType: 'game', label: 'Kuis', suggestedBlocks: ['kuis'], sceneType: 'assessment' },
      { templateType: 'game', label: 'Team Buzzer', suggestedBlocks: ['team-buzzer-game'], sceneType: 'practice' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['diskusi', 'refleksi'], sceneType: 'reflection' },
    ],
    metadata: { icon: '🏛️', author: 'SILSE', version: '2.1.0' },
  },

  {
    id: 'bindo-teks-narasi',
    name: 'Teks Narasi',
    subtitle: 'B. Indonesia Kelas 8 - Semester 1',
    description: 'Kuasai struktur teks narasi melalui flashcard, fill-blank game, dan refleksi. Template cocok untuk kelas 8 semester 1 dengan fokus pada menulis kreatif.',
    subject: 'B.Indonesia',
    grade: '8',
    semester: '1',
    theme: 'golden-presentation',
    color: 'violet',
    pattern: 'interaktif',
    coverGradient: ['p', 'c'],
    bsnpCompliant: true,
    previewBlocks: [
      { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
      { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Struktur' }, { type: 'flashcard-set', icon: '🃏', label: 'Flashcard' }] },
      { templateType: 'game', label: 'Latihan', blocks: [{ type: 'fill-blank-game', icon: '✏️', label: 'Isian' }] },
      { templateType: 'game', label: 'Kuis', blocks: [{ type: 'kuis', icon: '❓', label: 'Pilihan Ganda' }] },
      { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'diskusi', icon: '💬', label: 'Diskusi' }, { type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
    ],
    tags: ['bahasa indonesia', 'narasi', 'menulis', 'cerita'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['def-box', 'nc-grid', 'flashcard-set'], sceneType: 'concept' },
      { templateType: 'game', label: 'Latihan', suggestedBlocks: ['fill-blank-game'], sceneType: 'practice' },
      { templateType: 'game', label: 'Kuis', suggestedBlocks: ['kuis'], sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['diskusi', 'refleksi'], sceneType: 'reflection' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '2.1.0' },
  },

  {
    id: 'ppkn-norma-masyarakat',
    name: 'Norma dalam Masyarakat',
    subtitle: 'PPKn Kelas 7 - Semester 1',
    description: 'Kenali berbagai norma yang berlaku di masyarakat melalui sortir game, roda game, dan kuis. Template interaktif untuk kelas 7 semester 1.',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'hakikat-norma',
    color: 'amber',
    pattern: 'interaktif',
    coverGradient: ['y', 'g'],
    bsnpCompliant: true,
    previewBlocks: [
      { templateType: 'cover', label: 'Cover', blocks: [{ type: 'cover', icon: '🏠', label: 'Cover' }] },
      { templateType: 'materi', label: 'Materi', blocks: [{ type: 'def-box', icon: '📖', label: 'Definisi' }, { type: 'nc-grid', icon: '🔲', label: 'Jenis Norma' }] },
      { templateType: 'game', label: 'Sortir Game', blocks: [{ type: 'sortir-game', icon: '🔀', label: 'Klasifikasi Norma' }] },
      { templateType: 'game', label: 'Roda Game', blocks: [{ type: 'roda-game', icon: '🎡', label: 'Roda Pertanyaan' }, { type: 'kuis', icon: '❓', label: 'Kuis' }] },
      { templateType: 'refleksi', label: 'Refleksi', blocks: [{ type: 'refleksi', icon: '📝', label: 'Refleksi' }] },
    ],
    tags: ['ppkn', 'norma', 'hukum', 'masyarakat'],
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['def-box', 'nc-grid'], sceneType: 'concept' },
      { templateType: 'game', label: 'Sortir Game', suggestedBlocks: ['sortir-game'], sceneType: 'practice' },
      { templateType: 'game', label: 'Roda Game', suggestedBlocks: ['roda-game', 'kuis'], sceneType: 'practice' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], sceneType: 'reflection' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '2.1.0' },
  },
];

// ═══════════════════════════════════════════════════════════════════
// SCHEMA FACTORIES — Bridge to marketplace-templates.ts
// ═══════════════════════════════════════════════════════════════════
// TODO (Phase 3): Convert schemaFactory closures to preset files,
// then delete marketplace-templates.ts entirely.

import type { LessonSchema } from '@/core/schema/types';

/** @internal Lazy-loaded schema factories from marketplace-templates */
const _schemaFactories: Map<string, () => LessonSchema> = new Map();

/**
 * Register a schema factory for a template ID.
 * Called during initialization to bridge marketplace schema factories.
 */
export function registerSchemaFactory(id: string, factory: () => LessonSchema): void {
  _schemaFactories.set(id, factory);
}

/**
 * Get a schema factory by template ID.
 * Returns undefined if no factory is registered (template uses presetId instead).
 */
export function getSchemaFactory(id: string): (() => LessonSchema) | undefined {
  return _schemaFactories.get(id);
}

// ── Initialize marketplace schema factories ─────────────────────
// Lazy import to avoid circular deps; runs once at module load.
import { MARKETPLACE_TEMPLATES as _MP_TEMPLATES } from '@/core/templates/marketplace-templates';
for (const tmpl of _MP_TEMPLATES) {
  registerSchemaFactory(tmpl.id, tmpl.schemaFactory);
}

// ═══════════════════════════════════════════════════════════════════
// REGISTRY — Map-based lookup
// ═══════════════════════════════════════════════════════════════════

const _registry: Map<string, CourseTemplate> = new Map();
for (const tmpl of COURSE_TEMPLATES) {
  _registry.set(tmpl.id, tmpl);
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Get a course template by ID.
 */
export function getCourseTemplate(id: string): CourseTemplate | undefined {
  return _registry.get(id);
}

/**
 * Get all course templates.
 */
export function getAllCourseTemplates(): CourseTemplate[] {
  return Array.from(_registry.values());
}

/**
 * Get course templates filtered by subject.
 */
export function getCourseTemplatesBySubject(subject: string): CourseTemplate[] {
  return getAllCourseTemplates().filter(t => t.subject === subject || t.subject === '*');
}

/**
 * Get course templates filtered by subject and/or grade.
 *
 * Filtering logic:
 *   - subject filter: match t.subject === subject OR t.subject === '*'
 *   - grade filter: match t.grade === grade OR t.grade === '*'
 *   - The "template-kosong" (subject='*', grade='*') always passes both filters
 *   - Always puts template-kosong at the end of the list
 */
export function getCourseTemplatesFiltered(subject?: string, grade?: string): CourseTemplate[] {
  let results = getAllCourseTemplates();

  if (subject && subject !== 'Lainnya') {
    results = results.filter(t => t.subject === subject || t.subject === '*');
  }

  if (grade) {
    results = results.filter(t => t.grade === grade || t.grade === '*');
  }

  // Always put template-kosong at the end
  const empty = results.find(t => t.id === 'template-kosong');
  const nonEmpty = results.filter(t => t.id !== 'template-kosong');
  return [...nonEmpty, ...(empty ? [empty] : [])];
}

/**
 * Create a full CanvaPage[] array from a Course Template.
 *
 * 2-Level Content Pipeline (Level 2 FROZEN since SILSE v2.1):
 *   Level 1 (presetId): If the template has a presetId, load the handcrafted
 *     LessonSchema from src/presets/ and convert it to CanvaPages using
 *     schemaToCanvaPages(). This produces rich, pedagogically-structured content
 *     with real scenarios, definitions, quizzes, etc.
 *   Level 3 (empty shell): Falls back to createPageFromPreset() which creates
 *     pages with default block structure but minimal content.
 *
 * ❄️ Level 2 (SUBJECT_MOCK_DATA + generators) was FROZEN and disconnected.
 *    All templates should provide a presetId for rich content.
 *
 * User never sees the difference — all levels produce valid CanvaPage[].
 */
export async function createProjectFromTemplate(
  templateId: string,
  metadata: ProjectMetadata,
): Promise<CanvaPage[]> {
  const template = _registry.get(templateId);
  if (!template) {
    throw new Error(`Course template "${templateId}" not found`);
  }

  // ── LEVEL 1: Handcrafted preset pipeline ──────────────────────
  // If the template links to a premium preset, use it directly.
  // This produces rich, real educational content instead of empty shells.
  if (template.presetId) {
    try {
      const { loadPreset, schemaToCanvaPages } = await import('@/core/engine/SchemaEngine.utils');
      const schema = await loadPreset(template.presetId);
      if (schema) {
        const rawPages = schemaToCanvaPages(schema);

        // Wrap into full CanvaPage objects (same logic as schema-preset-slice)
        const { generatePageId } = await import('@/core/schema/ensure-schema');
        const { DEFAULT_NAV_CONFIG } = await import('@/components/canva/types');
        const pages: CanvaPage[] = rawPages.map((raw, i) => {
          // Inject metadata into cover page
          if (i === 0 && raw.templateType === 'cover') {
            // Override title with user-provided title
            const screenData = raw.templateData?.schemaScreen as Record<string, unknown> | undefined;
            if (screenData && metadata.title) {
              const blocks = screenData.blocks as Array<Record<string, unknown>> | undefined;
              if (blocks && blocks.length > 0) {
                blocks[0] = { ...blocks[0], title: metadata.title };
                if (metadata.guru || metadata.sekolah) {
                  const meta = { ...((blocks[0].meta as Record<string, string>) || {}) };
                  if (metadata.guru) meta.elemen = metadata.guru;
                  if (metadata.sekolah) meta.fase = metadata.sekolah;
                  blocks[0] = { ...blocks[0], meta };
                }
              }
            }
          }

          return {
            id: raw.id || generatePageId(),
            label: raw.label,
            bgDataUrl: null,
            bgColor: raw.bgColor || '#ffffff',
            overlay: 20,
            elements: [],
            templateType: (raw.templateType || 'custom') as CanvaPage['templateType'],
            colorPalette: null,
            navConfig: { ...DEFAULT_NAV_CONFIG },
            templateData: raw.templateData,
            schema: (raw.templateData?.schemaScreen as CanvaPage['schema']) || undefined,
          } as CanvaPage;
        });

        // Cover pages should show navbar + progress
        if (pages.length > 0 && pages[0]!.templateType === 'cover') {
          pages[0]!.navConfig = {
            ...pages[0]!.navConfig,
            showNavbar: true,
            showProgress: true,
          };
        }

        return pages;
      }
    } catch (err) {
      // Level 1 failed — fall through to Level 3
      console.warn(`[Pipeline] Level 1 preset "${template.presetId}" failed, falling back to Level 3:`, err);
    }
  }

  // ── LEVEL 2: FROZEN — template-gallery pipeline disconnected ────
  // ❄️ Since SILSE v2.1, the Level 2 pipeline (SUBJECT_MOCK_DATA +
  //    schema generators from template-gallery.ts) has been FROZEN.
  //    All templates now go directly from Level 1 (preset) → Level 3 (empty shell).
  //    See: src/core/template/template-gallery.ts (FROZEN)
  //    See: src/core/templates/marketplace-templates.ts (FROZEN)
  //
  //    When new templates need generated content, they should get a
  //    proper presetId (Level 1) instead of relying on mock data.

  // ── LEVEL 3: Empty shell pipeline (last resort) ──────────────────
  const pages: CanvaPage[] = [];

  for (let i = 0; i < template.scenes.length; i++) {
    const scene = template.scenes[i];

    // Use existing PagePresetRegistry to create schema-native pages
    const page = createPageFromPreset(scene!.templateType, i);

    // Override label with the scene's label (immutable — page is fresh, not frozen yet)
    page.label = scene!.label;

    // Set variant if specified
    if (scene!.variant) {
      page.templateVariant = scene!.variant;
    }

    // For the cover page, inject the metadata (title, guru, sekolah)
    // IMPORTANT: Schema may be deepFrozen in dev mode from ensurePageSchema().
    // We must create new objects immutably instead of mutating in place.
    if (scene!.templateType === 'cover' && page.schema?.blocks) {
      page.schema = {
        ...page.schema,
        blocks: page.schema.blocks.map(block => {
          if (block.type !== 'cover') return block;
          const cover = block as unknown as Record<string, unknown>;
          const newMeta = { ...((cover.meta as Record<string, string>) || {}) };
          if (metadata.guru) newMeta.elemen = metadata.guru;
          if (metadata.sekolah) newMeta.fase = metadata.sekolah;
          return {
            ...block,
            ...(metadata.title ? { title: metadata.title } : {}),
            ...(metadata.guru || metadata.sekolah ? { meta: newMeta } : {}),
          };
        }),
      };
    }

    // For the penutup page, inject closing info (immutable)
    if (scene!.templateType === 'penutup' && page.schema?.blocks) {
      page.schema = {
        ...page.schema,
        blocks: page.schema.blocks.map(block => {
          if (block.type !== 'penutup') return block;
          return {
            ...block,
            ...(metadata.title ? { subtitle: `Terima kasih — ${metadata.title}` } : {}),
          };
        }),
      };
    }

    pages.push(page);
  }

  return pages;
}

/**
 * Get the theme preset ID for a course template.
 */
export function getTemplateThemeId(templateId: string): string {
  const template = _registry.get(templateId);
  return template?.theme ?? 'default';
}

/**
 * Get a quick preview summary of a course template.
 * Returns scene labels as a flow string (e.g., "Cover → TP → Materi → Kuis → Penutup")
 */
export function getTemplateFlowPreview(templateId: string): string {
  const template = _registry.get(templateId);
  if (!template) return '';
  return template.scenes.map(s => s.label).join(' → ');
}

/**
 * Resolve the SceneType for a SceneTemplateSpec.
 * Priority: explicit sceneType > TEMPLATE_TO_SCENE mapping > 'concept' default.
 */
export function resolveSceneType(spec: SceneTemplateSpec): SceneType {
  if (spec.sceneType) return spec.sceneType;
  const mapped = TEMPLATE_TO_SCENE[spec.templateType];
  if (mapped) return mapped;
  return 'concept'; // default fallback
}

/**
 * Get unique subject list from all templates (IDs only).
 */
export function getSubjectList(): string[] {
  const subjects = new Set<string>();
  for (const t of getAllCourseTemplates()) {
    if (t.subject !== '*') subjects.add(t.subject);
  }
  return Array.from(subjects);
}

/**
 * Get subject display label from subject ID.
 * Looks up the SUBJECTS config for a human-readable label.
 */
export function getSubjectLabel(subjectId: string): string {
  const cfg = SUBJECTS.find(s => s.id === subjectId);
  return cfg?.label ?? subjectId;
}

/**
 * Get all subjects with full config (for marketplace filter UI).
 */
export function getSubjectListDetailed(): SubjectConfig[] {
  const usedSubjects = new Set<string>();
  for (const t of getAllCourseTemplates()) {
    if (t.subject !== '*') usedSubjects.add(t.subject);
  }
  return SUBJECTS.filter(s => usedSubjects.has(s.id));
}

/**
 * Get all block types used across a template's scenes.
 */
export function getTemplateBlockTypes(templateId: string): string[] {
  const template = _registry.get(templateId);
  if (!template) return [];
  const blockTypes = new Set<string>();
  for (const scene of template.scenes) {
    for (const block of scene.suggestedBlocks) {
      blockTypes.add(block);
    }
  }
  return Array.from(blockTypes);
}

/**
 * Get page preview info for a template — derived from scenes.
 */
export function getPagePreview(templateId: string): Array<{ type: PageTemplateType; title: string; description: string }> {
  const template = _registry.get(templateId);
  if (!template) return [];
  return template.scenes.map(scene => ({
    type: scene.templateType,
    title: scene.label,
    description: scene.suggestedBlocks.join(', '),
  }));
}

/**
 * Get the narrative intensity curve for a course template.
 * Returns array of { sceneType, intensity, label } for each scene.
 * Useful for visualizing the learning flow rhythm.
 */
export function getTemplateIntensityCurve(templateId: string): Array<{ sceneType: SceneType; intensity: number; label: string }> {
  const template = _registry.get(templateId);
  if (!template) return [];
  const { SCENE_TYPES } = require('@/core/edu/education-scene-types');
  return template.scenes.map(spec => {
    const st = resolveSceneType(spec);
    return {
      sceneType: st,
      intensity: SCENE_TYPES[st].intensity,
      label: spec.label,
    };
  });
}
