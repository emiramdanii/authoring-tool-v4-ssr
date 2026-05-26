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
   *
   * 3-Level Pipeline:
   *   Level 1: presetId → handcrafted content (⭐⭐⭐⭐⭐)
   *   Level 2: SUBJECT_MOCK_DATA → generated content (⭐⭐⭐)
   *   Level 3: Empty shell → structural fallback (⭐)
   */
  presetId?: string;
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
  { id: 'MTK', label: 'MTK', icon: '📐', color: '#3b82f6' },
  { id: 'B.Indonesia', label: 'B. Indonesia', icon: '📖', color: '#f59e0b' },
  { id: 'B.Inggris', label: 'B. Inggris', icon: '🌍', color: '#8b5cf6' },
  { id: 'Seni', label: 'Seni', icon: '🎨', color: '#ec4899' },
  { id: 'PJOK', label: 'PJOK', icon: '⚽', color: '#06b6d4' },
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
// STARTER COURSE TEMPLATES — expanded for all 8 subjects
// ═══════════════════════════════════════════════════════════════════
// Every subject gets at least one template. The "template-kosong"
// uses subject='*' and grade='*' so it always appears in filters.

const COURSE_TEMPLATES: CourseTemplate[] = [
  // ── PPKn VII — Full learning module ──────────────────────────
  {
    id: 'modul-ppkn-vii',
    name: 'Modul PPKn Kelas VII',
    description: 'Alur pembelajaran lengkap PPKn SMP kelas VII: Pembuka → Tujuan → Motivasi → Materi ×3 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'hakikat-norma',
    presetId: 'hakikat-norma',
    scenes: [
      { templateType: 'cover', label: 'Pembuka', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Apersepsi / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['def-box', 'nc-grid'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VII — Macam-Macam Norma (Interaktif) ────────────────
  {
    id: 'modul-ppkn-vii-macam-norma',
    name: 'Macam-Macam Norma (PPKn VII)',
    description: 'Mengenal 4 jenis norma (agama, kesusilaan, kesopanan, hukum) dengan norma kartu, sortir game, dan refleksi: Cover → Tujuan → Materi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '1',
    theme: 'macam-norma',
    presetId: 'macam-norma',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Macam-Macam Norma', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📜', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VII — Perilaku Patuh ──────────────────────────────
  {
    id: 'modul-ppkn-vii-perilaku-patuh',
    name: 'Perilaku Patuh Norma (PPKn VII)',
    description: 'Membangun kesadaran patuh norma melalui skenario interaktif dan diskusi: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '2',
    theme: 'perilaku-patuh',
    presetId: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Nilai Pancasila ──────────────────────────────
  {
    id: 'modul-ppkn-viii-nilai-pancasila',
    name: 'Nilai-Nilai Pancasila (PPKn VIII)',
    description: 'Mendalami nilai-nilai Pancasila sebagai dasar negara: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'nilai-pancasila',
    presetId: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Nilai Pancasila', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🇮🇩', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Bhinneka Tunggal Ika ──────────────────────────
  {
    id: 'modul-ppkn-viii-bhinneka',
    name: 'Bhinneka Tunggal Ika (PPKn VIII)',
    description: 'Memahami makna keberagaman dan persatuan Indonesia: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    presetId: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🤝', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — HAM & Kewajiban ──────────────────────────────
  {
    id: 'modul-ppkn-viii-ham',
    name: 'HAM & Kewajiban (PPKn VIII)',
    description: 'Mengenal hak asasi manusia dan kewajiban warga negara: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '2',
    theme: 'ham-hak-kewajiban',
    presetId: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — HAM & Kewajiban', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🕊️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn IX — Demokrasi Pancasila ──────────────────────────────
  {
    id: 'modul-ppkn-ix-demokrasi',
    name: 'Demokrasi Pancasila (PPKn IX)',
    description: 'Memahami prinsip demokrasi Pancasila dan penerapannya: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '9',
    semester: '1',
    theme: 'demokrasi-pancasila',
    presetId: 'demokrasi-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Demokrasi Pancasila', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🏛️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn IX — Globalisasi ──────────────────────────────
  {
    id: 'modul-ppkn-ix-globalisasi',
    name: 'Globalisasi (PPKn IX)',
    description: 'Menganalisis dampak globalisasi terhadap kehidupan berbangsa: Cover → Tujuan → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '9',
    semester: '2',
    theme: 'globalisasi',
    presetId: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Globalisasi', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌐', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VII — Misi Penjelajah Pancasila ──────────────────
  {
    id: 'modul-ppkn-vii-misi-pancasila',
    name: 'Misi Penjelajah Pancasila (PPKn VII)',
    description: 'Petualangan interaktif mengeksplorasi nilai Pancasila: Cover → Tujuan → Skenario → Materi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '7',
    semester: '2',
    theme: 'hakikat-norma',
    presetId: 'misi-penjelajah-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🗺️', author: 'SILSE', version: '1.0.0' },
  },

  // ── PPKn VIII — Generic (no preset, uses Level 2/3) ───────
  {
    id: 'modul-ppkn-viii',
    name: 'Modul PPKn Kelas VIII',
    description: 'Alur pembelajaran PPKn SMP kelas VIII dengan skenario interaktif: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'PPKn',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚖️', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VIII — Eksperimen ───────────────────────────────────
  {
    id: 'modul-ipa-viii',
    name: 'Modul IPA Kelas VIII',
    description: 'Alur pembelajaran IPA SMP kelas VIII: Cover → Tujuan → Skenario → Materi ×2 → Eksperimen → Kuis → Rangkuman',
    subject: 'IPA',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Ilmiah', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Eksperimen / Praktikum', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── IPA VII — Standar ───────────────────────────────────────
  {
    id: 'modul-ipa-vii',
    name: 'Modul IPA Kelas VII',
    description: 'Alur pembelajaran IPA SMP kelas VII: Cover → Tujuan → Motivasi → Materi ×2 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'IPA',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🔬', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VII — Standar ───────────────────────────────────────
  {
    id: 'modul-mtk-vii',
    name: 'Modul Matematika Kelas VII',
    description: 'Alur pembelajaran MTK SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Contoh Soal → Latihan → Kuis → Rangkuman → Penutup',
    subject: 'MTK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi — Konsep Dasar', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Contoh Soal & Pembahasan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Latihan Soal', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── MTK VIII — Interaktif ───────────────────────────────────
  {
    id: 'modul-mtk-viii',
    name: 'Modul Matematika Kelas VIII',
    description: 'Alur pembelajaran MTK SMP kelas VIII: Cover → Tujuan → Materi ×2 → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'MTK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1 — Konsep', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Penerapan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi Soal', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📐', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VII — Standar ──────────────────────────────
  {
    id: 'modul-bin-vii',
    name: 'Modul B. Indonesia Kelas VII',
    description: 'Alur pembelajaran Bahasa Indonesia SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'B.Indonesia',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Pembelajaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Indonesia VIII — Interaktif ──────────────────────────
  {
    id: 'modul-bin-viii',
    name: 'Modul B. Indonesia Kelas VIII',
    description: 'Alur pembelajaran Bahasa Indonesia SMP kelas VIII: Cover → Tujuan → Skenario → Materi ×2 → Diskusi → Kuis → Rangkuman → Penutup',
    subject: 'B.Indonesia',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Skenario Interaktif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Diskusi Kelompok', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'rangkuman', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'summary' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📖', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VIII — Interaktif ────────────────────────────
  {
    id: 'modul-bing-viii',
    name: 'Modul B. Inggris Kelas VIII',
    description: 'Alur pembelajaran Bahasa Inggris SMP kelas VIII: Cover → Tujuan → Skenario → Materi → Diskusi → Kuis → Refleksi → Penutup',
    subject: 'B.Inggris',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'skenario', label: 'Interactive Scenario', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Reflection', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── B. Inggris VII — Standar ────────────────────────────────
  {
    id: 'modul-bing-vii',
    name: 'Modul B. Inggris Kelas VII',
    description: 'Alur pembelajaran Bahasa Inggris SMP kelas VII: Cover → Tujuan → Materi → Diskusi → Kuis → Rangkuman → Penutup',
    subject: 'B.Inggris',
    grade: '7',
    semester: '1',
    theme: 'ham-hak-kewajiban',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Learning Objectives', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Material', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Discussion', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Quiz', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'rangkuman', label: 'Summary', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'summary' },
      { templateType: 'penutup', label: 'Closing', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🌍', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VII — Standar ──────────────────────────────────────
  {
    id: 'modul-seni-vii',
    name: 'Modul Seni Budaya Kelas VII',
    description: 'Alur pembelajaran Seni Budaya SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Praktik → Diskusi → Refleksi → Penutup',
    subject: 'Seni',
    grade: '7',
    semester: '1',
    theme: 'perilaku-patuh',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Motivasi / Apersepsi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi Karya', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── Seni VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-seni-viii',
    name: 'Modul Seni Budaya Kelas VIII',
    description: 'Alur pembelajaran Seni Budaya SMP kelas VIII: Cover → Tujuan → Materi → Skenario Kreatif → Diskusi → Refleksi → Penutup',
    subject: 'Seni',
    grade: '8',
    semester: '1',
    theme: 'bhinneka-tunggal-ika',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Seni', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'skenario', label: 'Skenario Kreatif', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi Karya', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🎨', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VII — Standar ──────────────────────────────────────
  {
    id: 'modul-pjok-vii',
    name: 'Modul PJOK Kelas VII',
    description: 'Alur pembelajaran PJOK SMP kelas VII: Cover → Tujuan → Motivasi → Materi → Praktik → Kuis → Refleksi → Penutup',
    subject: 'PJOK',
    grade: '7',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'motivasi', label: 'Pemanasan / Motivasi', suggestedBlocks: ['motivasi'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Praktik & Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi Aktivitas', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK VIII — Interaktif ──────────────────────────────────
  {
    id: 'modul-pjok-viii',
    name: 'Modul PJOK Kelas VIII',
    description: 'Alur pembelajaran PJOK SMP kelas VIII: Cover → Tujuan → Materi → Skenario Olahraga → Diskusi → Kuis → Penutup',
    subject: 'PJOK',
    grade: '8',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'skenario', label: 'Skenario Olahraga', suggestedBlocks: ['skenario'], variant: 'A', sceneType: 'example' },
      { templateType: 'diskusi', label: 'Diskusi', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '⚽', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK IV (SD) — Gerak Dasar ──────────────────────────────
  {
    id: 'modul-pjok-iv',
    name: 'Modul PJOK Kelas IV SD',
    description: 'Alur pembelajaran PJOK SD kelas IV: Cover → Petunjuk → Tujuan → Materi ×3 → Kuis → Refleksi → Penutup',
    subject: 'PJOK',
    grade: '4',
    semester: '1',
    theme: 'nilai-pancasila',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'petunjuk', label: 'Petunjuk', suggestedBlocks: ['petunjuk'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 3', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '🏃', author: 'SILSE', version: '1.0.0' },
  },

  // ── PJOK X (SMA) — Kebugaran ────────────────────────────────
  {
    id: 'modul-pjok-x',
    name: 'Modul PJOK Kelas X SMA',
    description: 'Alur pembelajaran PJOK SMA kelas X: Cover → Tujuan → Materi ×2 → Studi Kasus → Kuis → Refleksi → Rangkuman → Penutup',
    subject: 'PJOK',
    grade: '10',
    semester: '1',
    theme: 'globalisasi',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'dokumen', label: 'Tujuan Pembelajaran', suggestedBlocks: ['tujuan-display'], variant: 'A', sceneType: 'intro' },
      { templateType: 'materi', label: 'Materi 1 — Konsep Kebugaran', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'materi', label: 'Materi 2 — Prinsip Latihan', suggestedBlocks: ['materi-section'], variant: 'A', sceneType: 'concept' },
      { templateType: 'diskusi', label: 'Studi Kasus', suggestedBlocks: ['diskusi'], variant: 'A', sceneType: 'discussion' },
      { templateType: 'kuis', label: 'Kuis', suggestedBlocks: ['kuis'], variant: 'A', sceneType: 'assessment' },
      { templateType: 'refleksi', label: 'Refleksi', suggestedBlocks: ['refleksi'], variant: 'A', sceneType: 'reflection' },
      { templateType: 'materi', label: 'Rangkuman', suggestedBlocks: ['rangkuman'], variant: 'A', sceneType: 'concept' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '💪', author: 'SILSE', version: '1.0.0' },
  },

  // ── Template Kosong — Universal (subject='*', grade='*') ────
  {
    id: 'template-kosong',
    name: 'Template Kosong',
    description: 'Mulai dari nol dengan Cover dan Penutup saja. Tambahkan halaman sesuai kebutuhan.',
    subject: '*',
    grade: '*',
    semester: '*',
    theme: 'default',
    scenes: [
      { templateType: 'cover', label: 'Cover', suggestedBlocks: ['cover'], variant: 'A', sceneType: 'intro' },
      { templateType: 'penutup', label: 'Penutup', suggestedBlocks: ['penutup'], variant: 'A', sceneType: 'summary' },
    ],
    metadata: { icon: '📋', author: 'SILSE', version: '1.0.0' },
  },
];

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
 * 3-Level Content Pipeline:
 *   Level 1 (presetId): If the template has a presetId, load the handcrafted
 *     LessonSchema from src/presets/ and convert it to CanvaPages using
 *     schemaToCanvaPages(). This produces rich, pedagogically-structured content
 *     with real scenarios, definitions, quizzes, etc.
 *   Level 2 (generator): Not yet implemented — will use SUBJECT_MOCK_DATA
 *     from template-gallery.ts for smart generated content.
 *   Level 3 (empty shell): Falls back to createPageFromPreset() which creates
 *     pages with default block structure but minimal content.
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

  // ── LEVEL 2: Smart generated content pipeline ──────────────────
  // When no handcrafted preset exists, use SUBJECT_MOCK_DATA + generators
  // to produce meaningful content instead of empty shells.
  // This creates pages with real definitions, quiz questions, and scenarios
  // derived from subject-specific mock data.
  try {
    const { createMockParseResult, LESSON_TEMPLATES } = await import('./template-gallery');
    const {
      genCoverSchema, genMateriSchema, genKuisSchema, genDiskusiSchema,
      genRefleksiSchema, genSkenarioSchema, genTpSchema, genPenutupSchema,
      genMotivasiSchema, genTujuanDisplaySchema,
    } = await import('@/core/schema/generators');

    // Build a synthetic LessonTemplate for mock data lookup
    const syntheticTemplate = {
      id: templateId,
      title: metadata.title || template.name,
      subtitle: `${template.subject} Kelas ${template.grade}`,
      description: template.description,
      mapel: template.subject,
      kelas: template.grade,
      semester: template.semester,
      icon: template.metadata.icon,
      color: 'amber',
      tags: [],
      pattern: 'standar' as const,
      pageTypes: template.scenes.map(s => s.templateType),
      estimatedPages: template.scenes.length,
      pagePreview: template.scenes.map(s => ({
        type: s.templateType,
        title: s.label,
        description: '',
      })),
    };

    const parsed = createMockParseResult(syntheticTemplate as any);

    // Generate pages using the schema generators with mock content
    const { generatePageId } = await import('@/core/schema/ensure-schema');
    const { DEFAULT_NAV_CONFIG } = await import('@/components/canva/types');
    const { createPageFromPreset } = await import('@/core/preset/PagePresetRegistry');
    const { resolveTokens } = await import('@/core/themes/tokens');

    const level2Pages: CanvaPage[] = [];
    const tokens = resolveTokens(template.theme);
    const kuisCount = 5;

    for (let i = 0; i < template.scenes.length; i++) {
      const scene = template.scenes[i]!;
      const page = createPageFromPreset(scene.templateType, i);
      page.label = scene.label;

      if (scene.variant) {
        page.templateVariant = scene.variant;
      }

      // Generate real schema blocks based on scene type
      const generatedBlocks: any[] = [];
      const lessonTitle = metadata.title || template.name;
      const meta = { judulPertemuan: lessonTitle, namaBab: lessonTitle };

      switch (scene.templateType) {
        case 'cover': {
          const coverSchema = genCoverSchema({ namaBab: lessonTitle, kelas: template.grade, mapel: template.subject, ikon: template.metadata.icon });
          generatedBlocks.push(coverSchema);
          break;
        }
        case 'dokumen': {
          const tpSchema = genTujuanDisplaySchema(parsed, { pertemuan: 1, bloomMax: 4 });
          generatedBlocks.push(tpSchema);
          break;
        }
        case 'materi': {
          const materiSchema = genMateriSchema(parsed, meta);
          generatedBlocks.push(...materiSchema);
          break;
        }
        case 'skenario': {
          const skenarioSchema = genSkenarioSchema(parsed, { namaBab: lessonTitle });
          generatedBlocks.push(skenarioSchema);
          break;
        }
        case 'diskusi': {
          const tpData = parsed.sentences.slice(0, 3).map(s => ({ desc: s }));
          const diskusiSchema = genDiskusiSchema(parsed, tpData, meta);
          generatedBlocks.push(diskusiSchema);
          break;
        }
        case 'kuis': {
          const kuisSchema = genKuisSchema(parsed, kuisCount, 1);
          generatedBlocks.push(kuisSchema);
          break;
        }
        case 'refleksi': {
          const refleksiSchema = genRefleksiSchema(parsed, meta);
          generatedBlocks.push(refleksiSchema);
          break;
        }
        case 'penutup': {
          const penutupSchema = genPenutupSchema(meta);
          generatedBlocks.push(penutupSchema);
          break;
        }
        case 'motivasi': {
          const motivasiSchema = genMotivasiSchema(parsed, { namaBab: lessonTitle });
          generatedBlocks.push(motivasiSchema);
          break;
        }
        default: {
          // For unhandled types, fall through to Level 3 logic for this page
          break;
        }
      }

      // If we generated blocks, replace the page schema with generated content
      if (generatedBlocks.length > 0) {
        const stabilizedBlocks = generatedBlocks.map((block, bIdx) => ({
          ...block,
          id: block.id || `${scene.templateType}-${block.type}-${bIdx}`,
        }));

        page.schema = {
          ...(page.schema || { id: `page-${i}`, version: 1, templateType: scene.templateType, blocks: [] }),
          blocks: stabilizedBlocks,
        };

        // Inject metadata into cover
        if (scene.templateType === 'cover') {
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

        // Inject closing info
        if (scene.templateType === 'penutup') {
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
      } else {
        // Fallback to Level 3 for this specific page
        if (scene.templateType === 'cover' && page.schema?.blocks) {
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

        if (scene.templateType === 'penutup' && page.schema?.blocks) {
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
      }

      // Apply theme from template
      page.bgColor = tokens.colors.bg;
      page.navConfig = { ...DEFAULT_NAV_CONFIG, showNavbar: true, showProgress: true };

      level2Pages.push(page);
    }

    if (level2Pages.length > 0) {
      console.info(`[Pipeline] Level 2 generated content for "${templateId}" using SUBJECT_MOCK_DATA`);
      return level2Pages;
    }
  } catch (err) {
    // Level 2 failed — fall through to Level 3
    console.warn(`[Pipeline] Level 2 generation failed for "${templateId}", falling back to Level 3:`, err);
  }

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
